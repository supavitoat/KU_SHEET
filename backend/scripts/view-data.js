const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function viewAllData() {
  try {
    console.log('🔍 **Database Information**\n');

    // Check connection
    await prisma.$connect();
    console.log('✅ Database connected successfully\n');

    // Get count of each table
    const counts = await Promise.all([
      prisma.user.count(),
      prisma.seller.count(),
      prisma.faculty.count(),
      prisma.subject.count(),
      prisma.sheet.count(),
      prisma.order.count()
    ]);

    console.log('📊 **Table Counts:**');
    console.log(`👥 Users: ${counts[0]}`);
    console.log(`🏪 Sellers: ${counts[1]}`);
    console.log(`🏛️  Faculties: ${counts[2]}`);
    console.log(`📚 Subjects: ${counts[3]}`);
    console.log(`📄 Sheets: ${counts[4]}`);
    console.log(`🛒 Orders: ${counts[5]}\n`);

    // Show users
    if (counts[0] > 0) {
      console.log('👥 **Users:**');
      const users = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          fullName: true,
          role: true,
          isSeller: true,
          createdAt: true
        }
      });
      console.table(users);
    }

    // Show faculties
    if (counts[2] > 0) {
      console.log('🏛️  **Faculties:**');
      const faculties = await prisma.faculty.findMany({
        select: {
          id: true,
          name: true,
          code: true,
          _count: {
            select: { subjects: true }
          }
        }
      });
      console.table(faculties);
    }

    // Show some subjects
    if (counts[3] > 0) {
      console.log('📚 **Subjects (first 10):**');
      const subjects = await prisma.subject.findMany({
        take: 10,
        select: {
          id: true,
          code: true,
          name: true,
          faculty: {
            select: { name: true }
          }
        }
      });
      console.table(subjects);
    }

    // Show sellers if any
    if (counts[1] > 0) {
      console.log('🏪 **Sellers:**');
      const sellers = await prisma.seller.findMany({
        select: {
          id: true,
          penName: true,
          sellerId: true,
          totalRevenue: true,
          user: {
            select: { email: true }
          }
        }
      });
      console.table(sellers);
    }

    // Show sheets if any
    if (counts[4] > 0) {
      console.log('📄 **Sheets:**');
      const sheets = await prisma.sheet.findMany({
        select: {
          id: true,
          title: true,
          type: true,
          price: true,
          status: true,
          seller: {
            select: { penName: true }
          }
        }
      });
      console.table(sheets);
    }

    // Show orders if any
    if (counts[5] > 0) {
      console.log('🛒 **Orders:**');
      const orders = await prisma.order.findMany({
        select: {
          id: true,
          orderNumber: true,
          amount: true,
          status: true,
          createdAt: true,
          user: {
            select: { email: true }
          }
        }
      });
      console.table(orders);
    }

  } catch (error) {
    console.error('❌ Error viewing data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function viewSpecificTable(tableName) {
  try {
    await prisma.$connect();
    
    switch (tableName.toLowerCase()) {
      case 'users':
        const users = await prisma.user.findMany();
        console.table(users);
        break;
      case 'sellers':
        const sellers = await prisma.seller.findMany({ include: { user: true } });
        console.table(sellers);
        break;
      case 'faculties':
        const faculties = await prisma.faculty.findMany();
        console.table(faculties);
        break;
      case 'subjects':
        const subjects = await prisma.subject.findMany({ include: { faculty: true } });
        console.table(subjects);
        break;
      case 'sheets':
        const sheets = await prisma.sheet.findMany({ include: { seller: true, faculty: true } });
        console.table(sheets);
        break;
      case 'orders':
        const orders = await prisma.order.findMany({ include: { user: true, sheet: true } });
        console.table(orders);
        break;
      default:
        console.log('❌ Invalid table name. Use: users, sellers, faculties, subjects, sheets, orders');
    }
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const tableName = args[0];

if (tableName) {
  viewSpecificTable(tableName);
} else {
  viewAllData();
}