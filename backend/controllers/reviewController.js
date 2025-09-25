const { prisma } = require('../config/database');

const isValidRating = (value) => Number.isInteger(value) && value >= 1 && value <= 5;

exports.createOrUpdateReview = async (req, res) => {
  try {
    const sheetId = Number(req.params.sheetId);
    const userId = req.user.id;
    const { rating, comment } = req.body || {};

    if (!isValidRating(Number(rating))) {
      return res.status(400).json({ success: false, message: 'Invalid rating. Must be an integer 1-5.' });
    }

    const sheet = await prisma.sheet.findUnique({ where: { id: sheetId } });
    if (!sheet || sheet.status !== 'APPROVED') {
      return res.status(404).json({ success: false, message: 'Sheet not found' });
    }

    if (sheet.sellerId) {
      const seller = await prisma.seller.findUnique({ where: { id: sheet.sellerId } });
      if (seller && seller.userId === userId) {
        return res.status(403).json({ success: false, message: 'Sellers cannot review their own sheets.' });
      }
    }

    const hasPurchased = await prisma.order.findFirst({
      where: {
        userId,
        sheetId,
        OR: [
          { status: 'VERIFIED' },
          { paymentMethod: 'FREE' },
          { paymentStatus: { in: ['PAID', 'VERIFIED'] } },
        ],
      },
    });

    if (!hasPurchased) {
      return res.status(403).json({ success: false, message: 'Only purchasers can leave a review.' });
    }

    const existing = await prisma.review.findFirst({ where: { userId, sheetId } });

    let review;
    if (existing) {
      review = await prisma.review.update({
        where: { id: existing.id },
        data: { rating: Number(rating), comment: comment?.toString()?.slice(0, 1000) || null },
      });
    } else {
      review = await prisma.review.create({
        data: {
          userId,
          sheetId,
          rating: Number(rating),
          comment: comment?.toString()?.slice(0, 1000) || null,
        },
      });
    }

    return res.json({ success: true, data: review });
  } catch (error) {
  console.error('[Review] createOrUpdateReview error', { message: error.message, stack: error.stack });
  return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

exports.getSheetReviews = async (req, res) => {
  try {
    const sheetId = Number(req.params.sheetId);
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 10);
    const skip = (page - 1) * limit;

    const [items, aggregate] = await Promise.all([
      prisma.review.findMany({
        where: { sheetId },
        include: { user: { select: { id: true, fullName: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.review.aggregate({
        _avg: { rating: true },
        _count: { _all: true },
        where: { sheetId },
      }),
    ]);

    return res.json({
      success: true,
      data: {
        reviews: items,
        avgRating: aggregate._avg.rating || 0,
        reviewCount: aggregate._count._all || 0,
    // Keep compatibility for existing frontend list cards
        pagination: {
          current_page: page,
          items_per_page: limit,
          total_items: aggregate._count._all || 0,
          total_pages: Math.ceil((aggregate._count._all || 0) / limit),
        },
      },
    });
  } catch (error) {
  console.error('[Review] getSheetReviews error', { message: error.message, stack: error.stack });
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

exports.getMyReview = async (req, res) => {
  try {
    const sheetId = Number(req.params.sheetId);
    const userId = req.user.id;
    const review = await prisma.review.findFirst({ where: { userId, sheetId } });
    return res.json({ success: true, data: review });
  } catch (error) {
  console.error('[Review] getMyReview error', { message: error.message, stack: error.stack });
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

exports.deleteMyReview = async (req, res) => {
  try {
    const sheetId = Number(req.params.sheetId);
    const userId = req.user.id;
    const existing = await prisma.review.findFirst({ where: { userId, sheetId } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }
    await prisma.review.delete({ where: { id: existing.id } });
    return res.json({ success: true });
  } catch (error) {
  console.error('[Review] deleteMyReview error', { message: error.message, stack: error.stack });
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};


