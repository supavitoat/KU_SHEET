import React from 'react';
import GoogleMap from './GoogleMap';
import { MapPinIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';

const MapDisplay = ({ 
  location, 
  title = "สถานที่จัดกิจกรรม",
  className = "",
  showDirections = true,
  showMarkers = true
}) => {
  // Normalize coordinates: backend may store lat/lng as strings. Convert to numbers when possible.
  const latNum = location && location.lat !== undefined && location.lat !== null && location.lat !== '' ? Number(location.lat) : NaN;
  const lngNum = location && location.lng !== undefined && location.lng !== null && location.lng !== '' ? Number(location.lng) : NaN;
  const hasCoordinates = Number.isFinite(latNum) && Number.isFinite(lngNum);
  
  if (!location) {
    return (
      <div className={`rounded-2xl bg-gray-50 border border-gray-200 p-6 text-center ${className}`}>
        <MapPinIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">ไม่ระบุสถานที่</p>
      </div>
    );
  }

  const handleDirectionsClick = () => {
    if (hasCoordinates) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${location.lat},${location.lng}`;
      window.open(url, '_blank');
    } else if (location.name || location.address) {
      const searchQuery = encodeURIComponent(location.name || location.address);
      const url = `https://www.google.com/maps/search/?api=1&query=${searchQuery}`;
      window.open(url, '_blank');
    }
  };

  return (
    <div className={`rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MapPinIcon className="w-6 h-6 text-blue-600" />
            <h3 className="font-semibold text-gray-800">{title}</h3>
          </div>
          {showDirections && (hasCoordinates || location.name || location.address) && (
            <button
              onClick={handleDirectionsClick}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <ArrowTopRightOnSquareIcon className="w-4 h-4" />
              {hasCoordinates ? 'ดูเส้นทาง' : 'ค้นหาใน Google Maps'}
            </button>
          )}
        </div>
      </div>

      {/* Map */}
      <div className="p-6">
          {hasCoordinates ? (
          <GoogleMap
            center={{ lat: latNum, lng: lngNum }}
            zoom={16}
            markers={showMarkers ? [{
              lat: latNum,
              lng: lngNum,
              title: location.name || 'สถานที่จัดกิจกรรม'
            }] : []}
            height="300px"
            className="mb-4"
          />
        ) : (
          <div className="h-[300px] bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-center mb-4">
            <div className="text-center">
              <MapPinIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">ไม่มีพิกัดแผนที่</p>
              <p className="text-sm text-gray-400">ใช้ข้อมูลสถานที่ด้านล่างแทน</p>
            </div>
          </div>
        )}

        {/* Location Info */}
        <div className="space-y-2">
          {location.name && (
            <div>
              <span className="text-sm font-medium text-gray-600">ชื่อสถานที่:</span>
              <p className="text-gray-900">{location.name}</p>
            </div>
          )}
          {location.address && (
            <div>
              <span className="text-sm font-medium text-gray-600">ที่อยู่:</span>
              <p className="text-gray-900">{location.address}</p>
            </div>
          )}
          {hasCoordinates && (
            <div className="flex gap-4 text-xs text-gray-500">
              <span>ละติจูด: {latNum.toFixed(6)}</span>
              <span>ลองจิจูด: {lngNum.toFixed(6)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MapDisplay;
