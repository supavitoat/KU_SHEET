import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  DocumentTextIcon,
  UserIcon,
  CalendarIcon,
  AcademicCapIcon,
  ArrowDownTrayIcon,
  BookOpenIcon,
  HeartIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid, HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import { getProfilePictureURL } from '../../services/api';
import { formatCurrency, formatDate } from '../../utils/format';
import { getFacultyColors } from '../../utils/facultyColors';
import { useWishlist } from '../../contexts/WishlistContext';

const SellerProductCard = ({ sheet }) => {
  const { toggleWishlist, isInWishlist, loading } = useWishlist();

  // Memoize profile picture URL to prevent unnecessary recalculations
  const sellerProfilePictureURL = useMemo(() => {
    const picturePath = sheet.seller?.user?.picture || sheet.seller?.picture;
    return picturePath ? getProfilePictureURL(picturePath) : null;
  }, [sheet.seller?.user?.picture, sheet.seller?.picture]);

  const avgRating = typeof sheet.avgRating === 'number' ? sheet.avgRating : 0;
  const reviewCount = typeof sheet.reviewCount === 'number' ? sheet.reviewCount : 0;
  
  // Debug logging
  const facultyName = sheet.faculty?.name || sheet.faculty;
  const subjectDisplay = sheet.subjectName?.thai 
    || sheet.subjectName?.th 
    || sheet.subjectName?.display 
    || sheet.subject?.name 
    || sheet.subject?.thai 
    || sheet.subjectName 
    || sheet.subjectCode;

  return (
    <div className="group bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
      {/* Image Section - Make it clickable */}
      <Link to={`/infoSheet/${sheet.id}`} className="block">
        <div className={`relative h-48 bg-gradient-to-br ${getFacultyColors(facultyName).gradient} overflow-hidden cursor-pointer`}>
          <div className="w-full h-full flex flex-col items-center justify-center p-4">
            <DocumentTextIcon className={`w-12 h-12 ${getFacultyColors(facultyName).iconColor} mb-3`} />
            <div className="text-center">
              <div className={`text-lg font-bold ${getFacultyColors(facultyName).iconColor}`}>{sheet.subjectCode}</div>
            </div>
          </div>
          
          {/* Overlay */}
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300"></div>
          
          {/* Price Badge */}
          <div className="absolute top-2 right-2">
            {(sheet.isFree || sheet.price === 0 || sheet.price === '0') ? (
              <div className="relative">
                {/* Animated background for FREE */}
                <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-green-600 rounded-full animate-pulse"></div>
                <span className="relative px-3 py-1 text-sm font-bold text-white rounded-full shadow-lg bg-gradient-to-r from-green-500 to-green-600 border-2 border-white">
                  ฟรี!
                </span>
              </div>
            ) : (
              <span className="px-2 py-1 text-xs font-bold rounded-full shadow-lg bg-purple-600 text-white">
        {formatCurrency(sheet.price, { minimumFractionDigits: 0 })}
              </span>
            )}
          </div>

          {/* Wishlist Button */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleWishlist(sheet.id);
            }}
            disabled={loading}
            className="absolute top-2 left-2 p-2 bg-white bg-opacity-90 rounded-full shadow-lg hover:bg-opacity-100 hover:scale-110 hover:shadow-xl transition-all duration-300 disabled:opacity-50 group"
          >
            {isInWishlist(sheet.id) ? (
              <HeartIconSolid className="w-4 h-4 text-red-500 group-hover:text-red-600 group-hover:scale-110 transition-all duration-300" />
            ) : (
              <HeartIcon className="w-4 h-4 text-gray-600 group-hover:text-red-500 group-hover:scale-110 transition-all duration-300" />
            )}
          </button>

          {/* Rating */}
          <div className="absolute bottom-2 left-2 bg-white bg-opacity-90 rounded-lg px-2 py-1 shadow-lg">
            <div className="flex items-center gap-1">
              <StarIconSolid className="w-3 h-3 text-yellow-400" />
              <span className="text-xs font-semibold text-gray-800">
                {avgRating > 0 ? avgRating.toFixed(1) : '0.0'}
              </span>
              <span className="text-xs text-gray-500">({reviewCount})</span>
            </div>
          </div>
        </div>
      </Link>

      {/* Content Section */}
      <div className="p-3">
        <h3 className="font-bold text-gray-900 mb-2 line-clamp-1 text-base group-hover:text-purple-600 transition-colors">
          {sheet.title}
        </h3>
        
        <div className="space-y-1 text-xs text-gray-600 mb-3">
          <div className="flex items-center gap-1">
            <AcademicCapIcon className="w-3 h-3 text-purple-500" />
            <span className="font-medium truncate">{subjectDisplay}</span>
          </div>
          <div className="flex items-center gap-1">
            <BookOpenIcon className="w-3 h-3 text-blue-500" />
            <span className="truncate">{facultyName}</span>
          </div>
          <div className="flex items-center gap-1 w-full -ml-1.5">
            {sellerProfilePictureURL ? (
              <img 
                src={sellerProfilePictureURL} 
                alt={sheet.seller?.penName}
                className="w-6 h-6 rounded-full object-cover border-2 border-white shadow-md flex-shrink-0"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'inline';
                }}
              />
            ) : null}
            <UserIcon className={`w-6 h-6 text-green-500 flex-shrink-0 ${sellerProfilePictureURL ? 'hidden' : ''}`} />
            <span className="font-medium truncate text-left">By {sheet.seller?.penName}</span>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
          <div className="flex items-center gap-1">
            <CalendarIcon className="w-3 h-3" />
      <span className="truncate">{formatDate(sheet.createdAt, { variant: 'short' })}</span>
          </div>
          <div className="flex items-center gap-1">
            <ArrowDownTrayIcon className="w-3 h-3" />
            <span>{sheet.downloadCount || 0}</span>
          </div>
        </div>

        {/* Single Action Button */}
        <Link
          to={`/infoSheet/${sheet.id}`}
          className="block w-full text-center px-2 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl text-xs"
        >
          ดูรายละเอียด
        </Link>
      </div>
    </div>
  );
};

export default SellerProductCard; 