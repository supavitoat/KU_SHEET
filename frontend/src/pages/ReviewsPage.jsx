import React, { useState, useEffect, useMemo } from 'react';
import { 
  StarIcon, 
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  UserIcon,
  CalendarIcon,
  HandThumbUpIcon,
  HandThumbDownIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../components/common/LoadingSpinner';

const ReviewsPage = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRating, setSelectedRating] = useState('all');
  const [selectedFaculty, setSelectedFaculty] = useState('all');

  // Mock data for demonstration
  const mockReviews = useMemo(() => [
    {
      id: 1,
      sheetTitle: 'ชีทสรุปวิชาแคลคูลัส 1',
      faculty: 'คณะวิศวกรรมศาสตร์',
      rating: 5,
      comment: 'ชีทสรุปดีมาก อ่านง่าย เข้าใจง่าย ครอบคลุมเนื้อหาทุกบทเรียน แนะนำเลยครับ!',
      userName: 'วิศวะปี2',
      date: '2024-01-15',
      helpful: 12,
      notHelpful: 1,
      userAvatar: 'https://via.placeholder.com/40x40/3B82F6/FFFFFF?text=V'
    },
    {
      id: 2,
      sheetTitle: 'ชีทสรุปวิชาเคมีทั่วไป',
      faculty: 'คณะวิทยาศาสตร์',
      rating: 4,
      comment: 'ชีทสรุปดี เนื้อหาครบถ้วน แต่บางส่วนอาจจะอ่านยากไปหน่อย',
      userName: 'วิทย์ปี1',
      date: '2024-01-14',
      helpful: 8,
      notHelpful: 2,
      userAvatar: 'https://via.placeholder.com/40x40/10B981/FFFFFF?text=W'
    },
    {
      id: 3,
      sheetTitle: 'ชีทสรุปวิชาสถิติเบื้องต้น',
      faculty: 'คณะเกษตร',
      rating: 5,
      comment: 'ชีทสรุปยอดเยี่ยม! มีตัวอย่างโจทย์เยอะ อธิบายละเอียดมาก',
      userName: 'เกษตรปี3',
      date: '2024-01-13',
      helpful: 15,
      notHelpful: 0,
      userAvatar: 'https://via.placeholder.com/40x40/F59E0B/FFFFFF?text=K'
    },
    {
      id: 4,
      sheetTitle: 'ชีทสรุปวิชาฟิสิกส์ 1',
      faculty: 'คณะวิศวกรรมศาสตร์',
      rating: 4,
      comment: 'ชีทสรุปดี มีสูตรครบถ้วน แต่บางส่วนอาจจะต้องอ่านหลายรอบ',
      userName: 'วิศวะปี1',
      date: '2024-01-12',
      helpful: 6,
      notHelpful: 1,
      userAvatar: 'https://via.placeholder.com/40x40/EF4444/FFFFFF?text=V'
    },
    {
      id: 5,
      sheetTitle: 'ชีทสรุปวิชาชีววิทยา',
      faculty: 'คณะวิทยาศาสตร์',
      rating: 5,
      comment: 'ชีทสรุปดีมาก มีรูปภาพประกอบ อ่านง่าย เข้าใจง่าย',
      userName: 'วิทย์ปี2',
      date: '2024-01-11',
      helpful: 10,
      notHelpful: 0,
      userAvatar: 'https://via.placeholder.com/40x40/8B5CF6/FFFFFF?text=W'
    },
    {
      id: 6,
      sheetTitle: 'ชีทสรุปวิชาเศรษฐศาสตร์เบื้องต้น',
      faculty: 'คณะเศรษฐศาสตร์',
      rating: 4,
      comment: 'ชีทสรุปดี มีตัวอย่างกรณีศึกษาที่น่าสนใจ',
      userName: 'เศรษฐศาสตร์ปี2',
      date: '2024-01-10',
      helpful: 7,
      notHelpful: 1,
      userAvatar: 'https://via.placeholder.com/40x40/EC4899/FFFFFF?text=E'
    }
  ], []);

  const faculties = [
    { id: 'all', name: 'ทุกคณะ' },
    { id: 'engineering', name: 'คณะวิศวกรรมศาสตร์' },
    { id: 'science', name: 'คณะวิทยาศาสตร์' },
    { id: 'agriculture', name: 'คณะเกษตร' },
    { id: 'economics', name: 'คณะเศรษฐศาสตร์' }
  ];

  const ratings = [
    { id: 'all', name: 'ทุกคะแนน', icon: '⭐' },
    { id: '5', name: '5 ดาว', icon: '⭐⭐⭐⭐⭐' },
    { id: '4', name: '4 ดาว', icon: '⭐⭐⭐⭐' },
    { id: '3', name: '3 ดาว', icon: '⭐⭐⭐' },
    { id: '2', name: '2 ดาว', icon: '⭐⭐' },
    { id: '1', name: '1 ดาว', icon: '⭐' }
  ];

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setReviews(mockReviews);
      setLoading(false);
    }, 1000);
  }, [mockReviews]);

  const filteredReviews = reviews.filter(review => {
    const matchesRating = selectedRating === 'all' || review.rating.toString() === selectedRating;
    const matchesFaculty = selectedFaculty === 'all' || review.faculty.includes(faculties.find(f => f.id === selectedFaculty)?.name || '');
    
    return matchesRating && matchesFaculty;
  });

  const averageRating = reviews.length > 0 
    ? (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1)
    : 0;

  const totalReviews = reviews.length;

  const ratingDistribution = {
    5: reviews.filter(r => r.rating === 5).length,
    4: reviews.filter(r => r.rating === 4).length,
    3: reviews.filter(r => r.rating === 3).length,
    2: reviews.filter(r => r.rating === 2).length,
    1: reviews.filter(r => r.rating === 1).length
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <StarIcon
        key={i}
        className={`h-5 w-5 ${
          i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <div className="bg-yellow-100 p-3 rounded-full">
              <StarIcon className="h-8 w-8 text-yellow-600" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">รีวิวและคะแนน</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            ดูรีวิวและคะแนนจากผู้ใช้จริง เพื่อเลือกชีทสรุปที่เหมาะสมกับคุณ
          </p>
        </div>

        {/* Overall Stats */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-yellow-600 mb-2">{averageRating}</div>
              <div className="flex justify-center mb-2">
                {renderStars(Math.round(averageRating))}
              </div>
              <p className="text-gray-600">คะแนนเฉลี่ย</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">{totalReviews}</div>
              <p className="text-gray-600">รีวิวทั้งหมด</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-green-600 mb-2">
                {Math.round((ratingDistribution[5] + ratingDistribution[4]) / totalReviews * 100)}%
              </div>
              <p className="text-gray-600">รีวิวดี (4-5 ดาว)</p>
            </div>
          </div>
        </div>

        {/* Rating Distribution */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">การกระจายของคะแนน</h2>
          <div className="space-y-3">
            {[5, 4, 3, 2, 1].map(rating => (
              <div key={rating} className="flex items-center">
                <div className="w-16 text-sm text-gray-600">{rating} ดาว</div>
                <div className="flex-1 mx-4">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-yellow-400 h-2 rounded-full"
                      style={{ width: `${(ratingDistribution[rating] / totalReviews) * 100}%` }}
                    ></div>
                  </div>
                </div>
                <div className="w-16 text-sm text-gray-600 text-right">
                  {ratingDistribution[rating]}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">ตัวกรอง</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Rating Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">คะแนน</label>
              <select
                value={selectedRating}
                onChange={(e) => setSelectedRating(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-colors"
              >
                {ratings.map(rating => (
                  <option key={rating.id} value={rating.id}>
                    {rating.icon} {rating.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Faculty Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">คณะ</label>
              <select
                value={selectedFaculty}
                onChange={(e) => setSelectedFaculty(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-colors"
              >
                {faculties.map(faculty => (
                  <option key={faculty.id} value={faculty.id}>
                    {faculty.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-gray-600">
            พบรีวิว <span className="font-semibold text-yellow-600">{filteredReviews.length}</span> รายการ
          </p>
        </div>

        {/* Reviews List */}
        {filteredReviews.length > 0 ? (
          <div className="space-y-6">
            {filteredReviews.map((review) => (
              <div key={review.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-start space-x-4">
                  {/* User Avatar */}
                  <div className="flex-shrink-0">
                    <img
                      src={review.userAvatar}
                      alt={review.userName}
                      className="h-10 w-10 rounded-full"
                    />
                  </div>

                  {/* Review Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium text-gray-900">{review.userName}</h3>
                        <span className="text-gray-500">•</span>
                        <span className="text-gray-500 text-sm">{review.date}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        {renderStars(review.rating)}
                      </div>
                    </div>

                    <div className="mb-3">
                      <h4 className="font-medium text-blue-600 mb-1">{review.sheetTitle}</h4>
                      <span className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full">
                        {review.faculty}
                      </span>
                    </div>

                    <p className="text-gray-700 mb-4">{review.comment}</p>

                    {/* Helpful Buttons */}
                    <div className="flex items-center space-x-4">
                      <button className="flex items-center space-x-1 text-gray-500 hover:text-green-600 transition-colors">
                        <HandThumbUpIcon className="h-4 w-4" />
                        <span className="text-sm">มีประโยชน์ ({review.helpful})</span>
                      </button>
                      <button className="flex items-center space-x-1 text-gray-500 hover:text-red-600 transition-colors">
                        <HandThumbDownIcon className="h-4 w-4" />
                        <span className="text-sm">ไม่มีประโยชน์ ({review.notHelpful})</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <ChatBubbleLeftRightIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">ไม่พบรีวิว</h3>
            <p className="text-gray-600">ลองเปลี่ยนตัวกรองหรือดูรีวิวทั้งหมด</p>
          </div>
        )}

        {/* Call to Action */}
        <div className="mt-16 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-lg p-8 text-center text-white">
          <h2 className="text-2xl font-semibold mb-4">
            มีประสบการณ์กับชีทสรุป?
          </h2>
          <p className="text-yellow-100 mb-6">
            แชร์รีวิวและคะแนนของคุณเพื่อช่วยเหลือนักศึกษาคนอื่น
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/shop"
              className="bg-white text-yellow-600 px-6 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors"
            >
              ดูชีทสรุปทั้งหมด
            </a>
            <a
              href="/contact"
              className="bg-transparent text-white px-6 py-3 rounded-lg font-medium hover:bg-white hover:text-yellow-600 transition-colors border border-white"
            >
              ติดต่อเรา
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewsPage;
