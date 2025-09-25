import React from 'react';
import { createPortal } from 'react-dom';
import GoogleMap from './GoogleMap';
import { MapPinIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { getGoogleMapsLoader } from '../../lib/googleMapsLoader';

const Portal = ({ children }) => {
  if (typeof document === 'undefined') return null;
  return createPortal(children, document.body);
};

const LocationPicker = ({ 
  value, 
  onChange, 
  placeholder = "เลือกสถานที่",
  className = "",
  isOpen = false,
  onClose,
  onLocationSelect,
  initialLocation = null,
  loading = false
}) => {
  // search query not currently used; keep internal selection state only
  const [selectedLocation, setSelectedLocation] = React.useState(initialLocation || value);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [geocoder, setGeocoder] = React.useState(null);
  const [userLocation, setUserLocation] = React.useState(null);
  const watchIdRef = React.useRef(null);
  const placesServiceRef = React.useRef(null);

  // Initialize Geocoder
  React.useEffect(() => {
    const initGeocoder = async () => {
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      if (!apiKey || apiKey === 'your_google_maps_api_key_here') {
        console.warn('Google Maps API key not found for Geocoder');
        return;
      }

  const loader = getGoogleMapsLoader();

      try {
  await loader.load();
        setGeocoder(new google.maps.Geocoder());
        // Create PlacesService using a detached div as container
        try {
          placesServiceRef.current = new google.maps.places.PlacesService(document.createElement('div'));
        } catch {
          placesServiceRef.current = null;
        }
      } catch (error) {
        console.error('Error loading Google Maps API for Geocoder:', error);
      }
    };

    initGeocoder();
  }, []);

  React.useEffect(() => {
    if (initialLocation) {
      setSelectedLocation(initialLocation);
    }
  }, [initialLocation]);

  // Start watching user's current location when modal is shown
  React.useEffect(() => {
    const shouldWatch = isOpen === true || isModalOpen === true;
    if (!shouldWatch) return;
    if (!('geolocation' in navigator)) return;
    try {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        (err) => {
          console.warn('Geolocation error:', err?.message);
        },
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 10000 }
      );
    } catch {
      /* ignore */
    }
    return () => {
      if (watchIdRef.current) {
        try { 
          navigator.geolocation.clearWatch(watchIdRef.current); 
        } catch { 
          /* ignore geolocation clear errors */ 
        }
        watchIdRef.current = null;
      }
    };
  }, [isOpen, isModalOpen]);

  const handleMapClick = async (location) => {
    // Set coordinates immediately
    setSelectedLocation(location);

    // 1) If placeId is provided by click (POI), get details immediately
    const tryPlaceDetails = () => new Promise((resolve) => {
      const service = placesServiceRef.current;
      if (!service || !location.placeId) return resolve(null);
      service.getDetails({ placeId: location.placeId, fields: ['name', 'formatted_address'] }, (place, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && place) {
          resolve({ name: place.name, address: place.formatted_address });
        } else {
          resolve(null);
        }
      });
    });

    // 2) Try Places Nearby Search first to get POI name (e.g., hospital)
    const tryPlacesNearby = () => new Promise((resolve) => {
      const service = placesServiceRef.current;
      if (!service || !(window.google && window.google.maps && window.google.maps.places)) {
        return resolve(null);
      }

      const request = {
        location: new google.maps.LatLng(location.lat, location.lng),
        radius: 120, // meters
        type: 'establishment', // general POIs; hospitals, cafes, etc. included
        keyword: ''
      };

      service.nearbySearch(request, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results && results.length > 0) {
          // Pick closest result
          const sorted = results
            .map(r => ({
              r,
              d: google.maps.geometry && google.maps.geometry.spherical
                ? google.maps.geometry.spherical.computeDistanceBetween(
                    new google.maps.LatLng(location.lat, location.lng), r.geometry.location)
                : 0
            }))
            .sort((a, b) => a.d - b.d);

          const best = (sorted[0] && sorted[0].r) || results[0];

          // Get details for formatted address
          service.getDetails({ placeId: best.place_id, fields: ['name', 'formatted_address'] }, (place) => {
            const name = (place && place.name) || best.name;
            const address = (place && place.formatted_address) || (best.vicinity || '');
            resolve({ name, address });
          });
        } else {
          resolve(null);
        }
      });
    });

    // 3) Fallback to Reverse Geocoding
    const tryReverseGeocode = async () => {
      if (!geocoder) return null;
      try {
        const response = await geocoder.geocode({ location: { lat: location.lat, lng: location.lng } });
        if (response.results && response.results.length > 0) {
          const place = response.results[0];
          return { name: place.name || place.formatted_address, address: place.formatted_address };
        }
        return null;
      } catch {
        return null;
      }
    };

    let resolved = await tryPlaceDetails();
    if (!resolved) {
      resolved = await tryPlacesNearby();
    }
    if (!resolved) {
      resolved = await tryPlacesNearby(); // second attempt sometimes helps
    }
    if (!resolved) {
      resolved = await tryReverseGeocode();
    }

    if (resolved) {
      setSelectedLocation(prev => ({ ...prev, name: resolved.name, address: resolved.address }));
    } else {
      setSelectedLocation(prev => ({
        ...prev,
        name: 'สถานที่ที่เลือก',
        address: `ละติจูด: ${location.lat.toFixed(6)}, ลองจิจูด: ${location.lng.toFixed(6)}`
      }));
    }
  };

  const handlePlaceSelected = (place) => {
    setSelectedLocation(place);
  };

  const handleConfirm = () => {
    if (selectedLocation) {
      const finalLocation = {
        ...selectedLocation,
        name: selectedLocation.name || selectedLocation.address || 'สถานที่ที่เลือก'
      };
      
      if (onLocationSelect) {
        onLocationSelect(finalLocation);
      } else if (onChange) {
        onChange(finalLocation);
      }
      
      if (onClose) {
        onClose();
      } else {
        setIsModalOpen(false);
      }
    }
  };

  const handleCancel = () => {
    if (onClose) {
      onClose();
    } else {
      setIsModalOpen(false);
    }
    if (watchIdRef.current) {
      try { 
        navigator.geolocation.clearWatch(watchIdRef.current); 
      } catch { 
        /* ignore geolocation clear errors */ 
      }
      watchIdRef.current = null;
    }
  };

  const handleClear = () => {
    setSelectedLocation(null);
    if (onChange) onChange(null);
  };

  // If used as modal (from GroupDetailPage)
  if (isOpen === true) {
    return (
      <Portal>
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4"
          onClick={handleCancel}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">เลือกสถานที่</h2>
              <button
                onClick={handleCancel}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              คลิกบนแผนที่เพื่อเลือกสถานที่ หรือค้นหาสถานที่ที่ต้องการ
            </p>
          </div>

          {/* Content */}
          <div className="p-6">

            {/* Map */}
            <div className="mb-4">
              <GoogleMap
                center={selectedLocation && selectedLocation.lat && selectedLocation.lng
                  ? { lat: selectedLocation.lat, lng: selectedLocation.lng }
                  : (userLocation || { lat: 13.7563, lng: 100.5018 })}
                zoom={selectedLocation ? 16 : 12}
                onMapClick={handleMapClick}
                onPlaceSelected={handlePlaceSelected}
                showSearchBox={true}
                height="320px"
                className="rounded-xl overflow-hidden"
                markers={[
                  ...(selectedLocation && selectedLocation.lat && selectedLocation.lng
                    ? [{ lat: selectedLocation.lat, lng: selectedLocation.lng, title: selectedLocation.name || 'สถานที่ที่เลือก' }]
                    : []),
                  ...(userLocation ? [{ lat: userLocation.lat, lng: userLocation.lng, title: 'ตำแหน่งของฉัน' }] : []),
                ]}
              />
            </div>

            {/* Selected Location Info */}
            {selectedLocation && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
                <div className="flex items-center gap-3">
                  <MapPinIcon className="w-5 h-5 text-blue-600" />
                  <div>
                    <div className="font-medium text-blue-900">
                      {selectedLocation.name || selectedLocation.address || 'สถานที่ที่เลือก'}
                    </div>
                    <div className="text-sm text-blue-700">
                      ละติจูด: {selectedLocation.lat?.toFixed(6)}, ลองจิจูด: {selectedLocation.lng?.toFixed(6)}
                    </div>
                    {selectedLocation.address && (
                      <div className="text-sm text-blue-600 mt-1">
                        {selectedLocation.address}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 justify-end">
              <button
                onClick={handleCancel}
                className="px-6 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleConfirm}
                disabled={!selectedLocation || loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {loading && (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                ยืนยัน
              </button>
            </div>
          </div>
          </div>
        </div>
      </Portal>
    );
  }

  // If used as input field (from CreatePage)
  return (
    <div className={`relative ${className}`}>
      {/* Input Field */}
      <div 
        className="w-full px-4 py-3 border border-gray-300 rounded-xl cursor-pointer hover:border-gray-400 transition-colors"
        onClick={() => setIsModalOpen(true)}
      >
        <div className="flex items-center gap-3">
          <MapPinIcon className="w-5 h-5 text-gray-400" />
          <div className="flex-1">
            {selectedLocation ? (
              <div>
                <div className="font-medium text-gray-900">
                  {selectedLocation.name || selectedLocation.address || 'สถานที่ที่เลือก'}
                </div>
                <div className="text-sm text-gray-500">
                  {selectedLocation.address}
                </div>
              </div>
            ) : (
              <span className="text-gray-500">{placeholder}</span>
            )}
          </div>
          {selectedLocation && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleClear();
              }}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <XMarkIcon className="w-4 h-4 text-gray-400" />
            </button>
          )}
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <Portal>
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4"
            onClick={handleCancel}
          >
            <div 
              className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">เลือกสถานที่</h3>
                <button
                  onClick={handleCancel}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <XMarkIcon className="w-5 h-5 text-gray-400" />
                </button>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                คลิกบนแผนที่เพื่อเลือกสถานที่ หรือค้นหาสถานที่ที่ต้องการ
              </p>
            </div>

            {/* Content */}
            <div className="p-6">

              {/* Map */}
              <div className="mb-4">
                <GoogleMap
                  center={selectedLocation && selectedLocation.lat && selectedLocation.lng
                    ? { lat: selectedLocation.lat, lng: selectedLocation.lng }
                    : (userLocation || { lat: 13.7563, lng: 100.5018 })}
                  zoom={selectedLocation ? 16 : 12}
                  onMapClick={handleMapClick}
                  onPlaceSelected={handlePlaceSelected}
                  showSearchBox={true}
                  height="320px"
                  className="rounded-xl overflow-hidden"
                  markers={[
                    ...(selectedLocation && selectedLocation.lat && selectedLocation.lng
                      ? [{ lat: selectedLocation.lat, lng: selectedLocation.lng, title: selectedLocation.name || 'สถานที่ที่เลือก' }]
                      : []),
                    ...(userLocation ? [{ lat: userLocation.lat, lng: userLocation.lng, title: 'ตำแหน่งของฉัน' }] : []),
                  ]}
                />
              </div>

              {/* Selected Location Info */}
              {selectedLocation && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
                  <div className="flex items-center gap-3">
                    <MapPinIcon className="w-5 h-5 text-blue-600" />
                    <div>
                      <div className="font-medium text-blue-900">
                        {selectedLocation.name || selectedLocation.address || 'สถานที่ที่เลือก'}
                      </div>
                      <div className="text-sm text-blue-700">
                        ละติจูด: {selectedLocation.lat?.toFixed(6)}, ลองจิจูด: {selectedLocation.lng?.toFixed(6)}
                      </div>
                      {selectedLocation.address && (
                        <div className="text-sm text-blue-600 mt-1">
                          {selectedLocation.address}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 justify-end">
                <button
                  onClick={handleCancel}
                  className="px-6 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={!selectedLocation}
                  className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  ยืนยัน
                </button>
              </div>
            </div>
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
};

export default LocationPicker;