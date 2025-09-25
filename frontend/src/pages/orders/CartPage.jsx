import React, { useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import { useWishlist } from '../../contexts/WishlistContext';
import { useAuth } from '../../contexts/AuthContext';
import { getProfilePictureURL, ordersAPI } from '../../services/api';
import { 
  ArrowLeftIcon,
  ShoppingCartIcon,
  DocumentTextIcon,
  AcademicCapIcon,
  BookOpenIcon,
  UserIcon,
  CalendarIcon,
  EyeIcon,
  HeartIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid, HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import toast from 'react-hot-toast';
import { formatCurrency as formatCurrencyUtil, formatDate as formatDateUtil } from '../../utils/format';
import { getFacultyColors as getFacultyColorsUtil } from '../../utils/facultyColors';

// Animated Background Component
const AnimatedBackground = () => {
  const circles = [
    { 
      color: 'from-pink-400 to-purple-400', 
      delay: '0s', 
      size: 'w-[300px] h-[300px]', 
      position: 'top-10 left-10',
      animation: 'animate-blob',
      duration: '20s'
    },
    { 
      color: 'from-blue-400 to-cyan-400', 
      delay: '5s', 
      size: 'w-[350px] h-[350px]', 
      position: 'top-20 right-20',
      animation: 'animate-blob2',
      duration: '25s'
    },
    { 
      color: 'from-green-400 to-emerald-400', 
      delay: '10s', 
      size: 'w-[320px] h-[320px]', 
      position: 'bottom-20 left-20',
      animation: 'animate-blob3',
      duration: '30s'
    },
    { 
      color: 'from-yellow-400 to-orange-400', 
      delay: '15s', 
      size: 'w-[280px] h-[280px]', 
      position: 'bottom-10 right-10',
      animation: 'animate-blob',
      duration: '20s'
    },
  ];

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {circles.map((circle, index) => (
        <div
          key={index}
          className={`absolute ${circle.position} ${circle.size} bg-gradient-to-br ${circle.color} rounded-full mix-blend-multiply blur-xl opacity-30 ${circle.animation}`}
          style={{
            animationDelay: circle.delay,
            animationDuration: circle.duration,
            animationIterationCount: 'infinite',
            animationTimingFunction: 'ease-in-out'
          }}
        />
      ))}
    </div>
  );
};

// Component สำหรับแสดงรูปโปรไฟล์ผู้ขาย
const SellerProfile = ({ seller }) => {
  const profilePictureURL = useMemo(() => {
    const picturePath = seller?.user?.picture || seller?.picture;
    return picturePath ? getProfilePictureURL(picturePath) : null;
  }, [seller?.user?.picture, seller?.picture]);

  return (
    <div className="flex items-center gap-1">
      {profilePictureURL ? (
        <img 
          src={profilePictureURL} 
          alt={seller?.penName}
          className="w-7 h-7 rounded-full object-cover border-2 border-white shadow-md"
          onError={(e) => {
            e.target.style.display = 'none';
            e.target.nextSibling.style.display = 'inline';
          }}
        />
      ) : null}
      <UserIcon className={`w-7 h-7 text-green-500 ${profilePictureURL ? 'hidden' : ''}`} />
      <span>By {seller?.penName}</span>
    </div>
  );
};

const CartPage = () => {
  const navigate = useNavigate();
  const { 
    items, 
    total, 
  removeFromCart, 
    clearCart,
  getDiscount,
  getFinalTotal,
  discountInfo,
  applyDiscount,
  clearDiscount
  } = useCart();
  const { wishlist, toggleWishlist } = useWishlist();
  const { isAuthenticated } = useAuth();

  const [code, setCode] = useState('');
  const discount = getDiscount();
  const finalTotal = getFinalTotal();

  // ใช้เฉพาะยอดรวมปกติ (ไม่รองรับโค้ดส่วนลด)
  const getDiscountedTotal = () => finalTotal;

  const onApplyCode = async () => {
    const res = await applyDiscount(code);
    if (res?.success) {
      setCode(res.data.code);
    }
  };

  const handleCheckout = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    // ถ้าราคารวมเป็น 0 บาท (ชีทฟรี) ให้ไปที่หน้า "ชีทของฉัน" เลย
    if (getDiscountedTotal() === 0) {
      // สร้าง order สำหรับชีทฟรีโดยตรง
      handleFreeOrder();
      return;
    }
    
    // สร้าง order ทันทีสำหรับชีทที่ต้องซื้อ
    try {
      const orderData = {
        items: items.map(item => ({
          sheetId: item.id,
          quantity: item.quantity || 1,
          price: item.price
        })),
        total: getDiscountedTotal(),
        isFreeOrder: false
      };

      // เรียก API เพื่อสร้าง order
      const response = await ordersAPI.createOrder(orderData);

      if (response.status === 201 || response.status === 200) {
        // สร้าง order สำเร็จ - ไปหน้า checkout
        navigate('/cart/checkout');
      } else {
        throw new Error('ไม่สามารถสร้าง order ได้');
      }
    } catch (error) {
      console.error('Error creating order:', error);
      toast.error('เกิดข้อผิดพลาดในการสร้างคำสั่งซื้อ');
    }
  };

  const handleFreeOrder = async () => {
    try {
      // สร้าง order สำหรับชีทฟรีโดยตรง
      const freeOrderData = {
        items: items.map(item => ({
          sheetId: item.id,
          quantity: item.quantity,
          price: item.price
        })),
        total: 0,
        isFreeOrder: true
      };

      // เรียก API เพื่อสร้าง order
      const response = await ordersAPI.createOrder(freeOrderData);

      if (response.status === 201 || response.status === 200) {
        // ล้างตระกร้าหลังจากสร้าง order สำเร็จ
        clearCart();
        toast.success('สั่งซื้อชีทฟรีสำเร็จ! ไปที่หน้า "ชีทของฉัน" เพื่อดาวน์โหลด');
        navigate('/mysheet');
      } else {
        throw new Error('ไม่สามารถสร้าง order ได้');
      }
    } catch (error) {
      console.error('Error creating free order:', error);
      toast.error('เกิดข้อผิดพลาดในการสั่งซื้อชีทฟรี');
    }
  };

  const handleContinueShopping = () => {
    navigate('/shop');
  };

  // ฟังก์ชันสำหรับล้างตระกร้า
  const handleClearCart = () => {
    clearCart();
  };

  const formatCurrency = (price) => {
    if (price === 0 || price === '0') return 'ฟรี';
    return formatCurrencyUtil(price, { minimumFractionDigits: 0 });
  };
  const formatDate = (dateString) => formatDateUtil(dateString, { variant: 'short' });
  const getFacultyColors = (facultyName) => getFacultyColorsUtil(facultyName);

  // Removed unused random helpers

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-white">
        <div className="py-8">
          <div className="max-w-full mx-auto px-6 sm:px-8 lg:px-20">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6 transition-colors"
            >
              <ArrowLeftIcon className="w-5 h-5" />
              กลับ
            </button>

            <div className="text-center py-16 animate-fadeInUp animation-delay-200">
              <ShoppingCartIcon className="w-24 h-24 text-gray-300 mx-auto mb-6" />
              <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-purple-600 via-blue-600 to-blue-800 bg-clip-text text-transparent animate-fadeInUp animation-delay-400">
                ตระกร้าว่าง
              </h1>
              <div className="w-20 h-1 mx-auto mb-6 rounded-full bg-gradient-to-r from-purple-500 via-blue-500 to-blue-700 animate-gradient-flow"></div>
              <p className="text-gray-600 mb-8 text-lg animate-fadeInUp animation-delay-600">ยังไม่มีสินค้าในตระกร้า</p>
              <button
                onClick={handleContinueShopping}
                className="bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 transition-colors text-lg font-medium animate-fadeInUp animation-delay-800"
              >
                เลือกซื้อสินค้า
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="py-8">
        <div className="max-w-full mx-auto px-6 sm:px-8 lg:px-20">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6 transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            กลับ
          </button>

          <div className="text-center mb-8 animate-fadeInUp animation-delay-200">
            <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-purple-600 via-blue-600 to-blue-800 bg-clip-text text-transparent">
              ตระกร้าสินค้า
            </h1>
            <p className="text-gray-600 mt-6 mb-4">ตรวจสอบรายการสินค้าของคุณ</p>
            <div className="w-24 h-1 mx-auto mt-2 rounded-full bg-gradient-to-r from-purple-500 via-blue-500 to-blue-700 animate-gradient-flow"></div>
          </div>

          {/* Clear Cart Button - Above Product Cards */}
          <div className="flex justify-end mb-4 pr-2 animate-fadeInUp animation-delay-400">
            <button
              onClick={handleClearCart}
              className="text-red-500 hover:text-red-600 transition-colors font-bold"
            >
              ล้างตระกร้า
            </button>
          </div>

          <div className="space-y-4 mb-8">
            {items.map((item, index) => {
              // Debug: ดูข้อมูลคณะ
              // Debug: ดูชื่อคณะ
              return (
                <div key={item.id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 relative animate-fadeInUp" style={{ animationDelay: `${200 + index * 100}ms` }}>
                  {/* Price - Top Right Corner of Card */}
                  <div className="absolute top-8 right-4 z-10">
                    <span className="text-xl font-bold text-blue-600">
                      {(item.isFree || item.price === 0 || item.price === '0') ? 'ฟรี!!' : formatCurrency(item.price)}
                    </span>
                  </div>
                  
                  <div className="flex">
                    {/* Image - Make it clickable */}
                    <Link to={`/infoSheet/${item.id}`} className="block">
                      <div className={`w-48 h-48 relative bg-gradient-to-br ${getFacultyColors(item.faculty?.name || item.faculty).gradient} overflow-hidden flex items-center justify-center cursor-pointer`}>
                        <div className="flex flex-col items-center justify-center w-full h-full">
                          <DocumentTextIcon className={`w-12 h-12 ${getFacultyColors(item.faculty?.name || item.faculty).iconColor} mb-3`} />
                          <div className="text-center">
                            <div className={`text-lg font-bold ${getFacultyColors(item.faculty?.name || item.faculty).iconColor}`}>{item.subjectCode}</div>
                          </div>
                        </div>
                        
                        {/* Overlay */}
                        <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all duration-300"></div>
                        
                        {/* Wishlist Button */}
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            toggleWishlist(item.id);
                          }}
                          className="absolute top-2 left-2 p-1 bg-white bg-opacity-90 rounded-full shadow-lg hover:bg-opacity-100 transition-all duration-200"
                        >
                          {wishlist.has(item.id) ? (
                            <HeartIconSolid className="w-4 h-4 text-red-500" />
                          ) : (
                            <HeartIcon className="w-4 h-4 text-gray-600" />
                          )}
                        </button>
                        
                        {/* Rating */}
                        <div className="absolute bottom-2 left-2 bg-white bg-opacity-90 rounded-lg px-2 py-1 shadow-lg">
                          <div className="flex items-center gap-1">
                            <StarIconSolid className="w-3 h-3 text-yellow-400" />
                            <span className="text-xs font-semibold text-gray-800">{item.avgRating ? item.avgRating.toFixed(1) : '0.0'}</span>
                            <span className="text-xs text-gray-500">({item.reviewCount || 0})</span>
                          </div>
                        </div>
                      </div>
                    </Link>

                    {/* Content */}
                    <div className="flex-1 p-6 relative">
                      <div className="mb-3">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-gray-900 mb-2 hover:text-purple-600 transition-colors">
                            {item.title}
                          </h3>
                          <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                            <div className="flex items-center gap-1">
                              <AcademicCapIcon className="w-4 h-4 text-purple-500" />
                              <span>{item.subjectName?.thai || item.subjectName?.display || item.subjectName}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <BookOpenIcon className="w-4 h-4 text-blue-500" />
                              <span>{item.faculty?.name || item.faculty}</span>
                            </div>
                            <SellerProfile seller={item.seller} />
                          </div>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <div className="flex items-center gap-1">
                              <CalendarIcon className="w-4 h-4" />
                              <span>{formatDate(item.createdAt)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <EyeIcon className="w-4 h-4" />
                              <span>{item.downloadCount || 0} ดาวน์โหลด</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <StarIconSolid className="w-4 h-4 text-yellow-400" />
                              <span>{item.avgRating ? item.avgRating.toFixed(1) : '0.0'} ({item.reviewCount || 0})</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Delete Button - Positioned at bottom right */}
                      <div className="absolute bottom-4 right-4">
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="px-8 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl"
                        >
                          ลบ
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8 animate-fadeInUp animation-delay-800">
            <h2 className="text-xl font-semibold mb-6 bg-gradient-to-r from-purple-600 via-blue-600 to-blue-800 bg-clip-text text-transparent">
              สรุปการสั่งซื้อ
            </h2>
            <div className="w-16 h-1 mb-6 rounded-full bg-gradient-to-r from-purple-500 via-blue-500 to-blue-700 animate-gradient-flow"></div>

            <div className="space-y-6">
              {/* Discount code UI */}
              <div className="space-y-2">
                <h3 className="text-lg font-medium text-gray-900">โค้ดส่วนลด</h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={code}
                    onChange={(e)=>setCode(e.target.value.toUpperCase())}
                    className="flex-1 border rounded-lg px-3 py-2"
                    placeholder="กรอกโค้ดส่วนลด"
                  />
                  <button onClick={onApplyCode} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">ใช้โค้ด</button>
                  {discountInfo?.code && (
                    <button onClick={()=>{ clearDiscount(); setCode(''); }} className="px-4 py-2 border rounded-lg hover:bg-gray-50">ล้าง</button>
                  )}
                </div>
                {discountInfo?.code && (
                  <div className="text-sm text-green-600">ใช้โค้ด: <strong>{discountInfo.code}</strong> ลด -฿{discount.toLocaleString()}</div>
                )}
              </div>
              {/* Price Breakdown */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">ราคารวม</span>
                  <span className="font-medium">฿{total}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between items-center text-green-600">
                    <span>ส่วนลด</span>
                    <span>-฿{discount.toLocaleString()}</span>
                  </div>
                )}
                {/* ไม่มีส่วนลดโค้ด */}
                <div className="border-t pt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-900">รวมทั้งหมด</span>
                    <span className="text-2xl font-bold text-blue-600">
                      {getDiscountedTotal() === 0 ? 'ฟรี!' : `฿${getDiscountedTotal()}`}
                    </span>
                  </div>
                  {getDiscountedTotal() === 0 && (
                    <p className="text-sm text-green-600 text-center mt-2">
                      🎉 คุณสามารถรับชีทฟรีได้เลยโดยไม่ต้องชำระเงิน!
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-8 animate-fadeInUp animation-delay-1200">
                <div className="relative group">
                  <button
                    onClick={handleCheckout}
                    className="relative bg-gradient-to-r from-purple-600 via-blue-600 to-blue-800 text-white py-4 px-14 rounded-lg font-medium text-lg overflow-hidden transition-all duration-300 group-hover:scale-105 shadow-lg hover:shadow-xl"
                  >
                    <span className="relative z-10">
                      {isAuthenticated 
                        ? (getDiscountedTotal() === 0 ? 'รับชีทฟรีเลย!' : 'ดำเนินการสั่งซื้อ')
                        : 'เข้าสู่ระบบเพื่อสั่งซื้อ'
                      }
                    </span>
                    {/* Shimmer Effect */}
                    <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                  </button>
                </div>
                <div className="relative group">
                  <button
                    onClick={handleContinueShopping}
                    className="relative border-2 border-gray-300 text-gray-700 py-4 px-14 rounded-lg font-medium text-lg overflow-hidden transition-all duration-300 group-hover:scale-105 group-hover:border-blue-400 group-hover:text-blue-600 shadow-md hover:shadow-lg bg-white/90 backdrop-blur-sm"
                  >
                    <span className="relative z-10">เลือกซื้อสินค้าเพิ่ม</span>
                    {/* Subtle Shimmer Effect (matched to primary) */}
                    <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                  </button>
                </div>
              </div>

 
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
