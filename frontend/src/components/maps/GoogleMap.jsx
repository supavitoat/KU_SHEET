import React from 'react';
import { getGoogleMapsLoader } from '../../lib/googleMapsLoader';

const GoogleMap = ({ 
  center = { lat: 13.7563, lng: 100.5018 }, // Bangkok default
  zoom = 15,
  markers = [],
  onMapClick,
  onMarkerClick,
  height = '400px',
  className = '',
  showSearchBox = false,
  onPlaceSelected,
  // Fallback helpers
  forceDefaultMarker = true,
  showCurrentLocation = true
}) => {
  const mapRef = React.useRef(null);
  const mapInstanceRef = React.useRef(null);
  const markersRef = React.useRef([]);
  const fallbackMarkersRef = React.useRef([]);
  const searchBoxRef = React.useRef(null);
  const searchControlIndexRef = React.useRef(null);
  const userInteractedRef = React.useRef(false);
  // Stable callback refs to avoid re-initializing map when parent renders
  const onMapClickRef = React.useRef(onMapClick);
  const onMarkerClickRef = React.useRef(onMarkerClick);
  const onPlaceSelectedRef = React.useRef(onPlaceSelected);
  const [fallbackClickPos, setFallbackClickPos] = React.useState(null);
  const [geoPos, setGeoPos] = React.useState(null);

  const [mapReady, setMapReady] = React.useState(false);

  // Keep callback refs up to date without changing listener identities
  React.useEffect(() => { onMapClickRef.current = onMapClick; }, [onMapClick]);
  React.useEffect(() => { onMarkerClickRef.current = onMarkerClick; }, [onMarkerClick]);
  React.useEffect(() => { onPlaceSelectedRef.current = onPlaceSelected; }, [onPlaceSelected]);

  React.useEffect(() => {
    const initMap = async () => {
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      
      if (!apiKey || apiKey === 'YOUR_API_KEY' || apiKey === 'your_google_maps_api_key_here') {
        console.warn('Google Maps API key not found. Please add VITE_GOOGLE_MAPS_API_KEY to your .env file');
        return;
      }

      const loader = getGoogleMapsLoader();

      try {
        // Ensure base libraries are available
        const { Map } = await loader.importLibrary('maps');
        // Load places explicitly before using Autocomplete
        try { await loader.importLibrary('places'); } catch { /* places may be unavailable for new accounts; ignore */ }

        // Create map
        if (!mapRef.current) {
          // Component unmounted or ref not ready
          return;
        }
        const map = new Map(mapRef.current, {
          center,
          zoom
          // Note: omit mapId and styles together to avoid conflicts and warnings.
        });

        mapInstanceRef.current = map;
        setMapReady(true);

  // Track user interaction to stop auto-recentering
  map.addListener('dragstart', () => { userInteractedRef.current = true; });
  map.addListener('zoom_changed', () => { /* keep */ void 0; });

        // Add click listener (capture placeId when clicking POI)
        map.addListener('click', (event) => {
          const payload = {
            lat: event.latLng.lat(),
            lng: event.latLng.lng(),
            placeId: event.placeId || undefined,
          };
          if (onMapClickRef.current) onMapClickRef.current(payload);
          userInteractedRef.current = true;
          // Fallback: place a local selection marker if parent doesn't provide markers
          if (!markers || markers.length === 0) {
            setFallbackClickPos({ lat: payload.lat, lng: payload.lng });
          }
        });

        // Add search box if enabled
        if (showSearchBox) {
          const input = document.createElement('input');
          input.type = 'text';
          input.placeholder = 'ค้นหาสถานที่...';
          input.className = 'w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500';

          // Prefer Autocomplete for new projects (SearchBox has new-customer limitations)
          let autocomplete = null;
          try {
            if (window.google && window.google.maps && window.google.maps.places) {
              autocomplete = new google.maps.places.Autocomplete(input, {
                fields: ['geometry', 'name', 'formatted_address']
              });
            }
          } catch {
            console.warn('Places Autocomplete unavailable');
            void 0;
          }
          searchBoxRef.current = autocomplete;

          // Add input control to map
          try {
            const idx = map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);
            searchControlIndexRef.current = idx - 1; // push returns new length
          } catch { void 0; /* ignore control errors */ }

      if (autocomplete) {
            autocomplete.addListener('place_changed', () => {
              const place = autocomplete.getPlace();
              if (!place || !place.geometry || !place.geometry.location) return;
              const location = {
                lat: place.geometry.location.lat(),
                lng: place.geometry.location.lng(),
                address: place.formatted_address,
                name: place.name
              };
        if (onPlaceSelectedRef.current) onPlaceSelectedRef.current(location);
              userInteractedRef.current = true;
              map.setCenter({ lat: location.lat, lng: location.lng });
              map.setZoom(16);
            });
          }
        }

      } catch (error) {
        console.error('Error loading Google Maps:', error);
        void 0;
      }
    };

    initMap();

    // Cleanup on unmount: remove markers, input controls, and listeners
    return () => {
      try {
        if (markersRef.current) {
          markersRef.current.forEach(mk => mk?.setMap && mk.setMap(null));
          markersRef.current = [];
        }
        if (fallbackMarkersRef.current) {
          fallbackMarkersRef.current.forEach(mk => mk?.setMap && mk.setMap(null));
          fallbackMarkersRef.current = [];
        }
        const map = mapInstanceRef.current;
        if (map && window.google && google.maps && google.maps.event) {
          google.maps.event.clearInstanceListeners(map);
          // Remove search control if present
          if (searchControlIndexRef.current !== null) {
            try {
              map.controls[google.maps.ControlPosition.TOP_LEFT].removeAt(searchControlIndexRef.current);
    } catch { void 0; /* noop */ }
          }
        }
  } catch { void 0; /* ignore cleanup errors */ }
    };
    // Initialize only once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showSearchBox]);

  // Try get current location once for fallback marker
  React.useEffect(() => {
    if (!showCurrentLocation || !navigator.geolocation) return;
    let canceled = false;
  try {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (canceled) return;
          setGeoPos({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
    () => { void 0; /* ignore */ },
        { enableHighAccuracy: false, maximumAge: 60000, timeout: 5000 }
      );
  } catch { void 0; /* noop */ }
    return () => { canceled = true; };
  }, [showCurrentLocation]);

  // Update markers when markers prop changes
  React.useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Clear existing markers
    markersRef.current.forEach(marker => {
      try {
        if (typeof marker.setMap === 'function') {
          marker.setMap(null);
        } else {
          marker.map = null;
        }
      } catch { void 0; }
    });
    markersRef.current = [];

    // Add new markers using PinElement (classic pins)
    // Debug: count markers processed
  try { console.debug('[GoogleMap] rendering markers:', markers.length); } catch { void 0; }
  markers.forEach((m, i) => {
      if (m.lat && m.lng) {
        const isSelected = i === 0;
        const color = m.color || (isSelected ? 'red' : 'green');
        const pos = { lat: m.lat, lng: m.lng };
        // Use embedded SVG data URIs to avoid network/icon issues
        const makePin = (hex) => {
          const svg = `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns='http://www.w3.org/2000/svg' width='24' height='36' viewBox='0 0 24 36'>\n  <path d='M12 1 C6.48 1 2 5.48 2 11 C2 18 12 26 12 26 C12 26 22 18 22 11 C22 5.48 17.52 1 12 1 Z' fill='${hex}'/>\n  <circle cx='12' cy='11' r='3.5' fill='#ffffff'/>\n</svg>`;
          return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
        };
        const iconUrl = color === 'red' ? makePin('#EA4335') : makePin('#22C55E');
        const simpleMarker = new google.maps.Marker({
          map: mapInstanceRef.current,
          position: pos,
          title: m.title || `Marker ${i + 1}`,
          icon: {
            url: iconUrl,
            size: new google.maps.Size(24, 36),
            scaledSize: new google.maps.Size(24, 36),
            anchor: new google.maps.Point(12, 36)
          },
          animation: google.maps.Animation ? google.maps.Animation.DROP : undefined,
          zIndex: isSelected ? 1000 : 900
        });
  if (onMarkerClickRef.current) simpleMarker.addListener('click', () => onMarkerClickRef.current(m, i));
        markersRef.current.push(simpleMarker);
  }
    });

    // Center map to first marker for visibility (only if user hasn't interacted yet)
    if (!userInteractedRef.current && markers.length > 0) {
      const first = markers[0];
      if (first.lat && first.lng) {
        try {
          mapInstanceRef.current.setCenter({ lat: first.lat, lng: first.lng });
          // Ensure zoom in enough to see the pin clearly
          const currentZoom = mapInstanceRef.current.getZoom && mapInstanceRef.current.getZoom();
          if (!currentZoom || currentZoom < 15) {
            mapInstanceRef.current.setZoom(16);
          }
        } catch { void 0; }
      }
    }
  }, [markers, mapReady]);

  // Fallback markers when none provided: show current location (green) and selection/center (red or orange)
  React.useEffect(() => {
    if (!mapInstanceRef.current || !forceDefaultMarker) return;
    // Clear existing fallback markers
    fallbackMarkersRef.current.forEach(mk => {
      try { mk.setMap ? mk.setMap(null) : (mk.map = null); } catch { void 0; }
    });
    fallbackMarkersRef.current = [];

    if (markers && markers.length > 0) return; // external markers exist

    const makePin = (hex) => {
      const svg = `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns='http://www.w3.org/2000/svg' width='24' height='36' viewBox='0 0 24 36'>\n  <path d='M12 1 C6.48 1 2 5.48 2 11 C2 18 12 26 12 26 C12 26 22 18 22 11 C22 5.48 17.52 1 12 1 Z' fill='${hex}'/>\n  <circle cx='12' cy='11' r='3.5' fill='#ffffff'/>\n</svg>`;
      return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
    };

    // Selection or center marker
    const sel = fallbackClickPos || null;
    const cen = { lat: center.lat, lng: center.lng };
    const selectionPos = sel || (geoPos ? null : cen); // prefer click; else if have geoPos skip center pin; else center

    if (selectionPos) {
      const red = new google.maps.Marker({
        map: mapInstanceRef.current,
        position: selectionPos,
        title: 'ตำแหน่งที่เลือก',
        icon: { url: makePin(sel ? '#EA4335' : '#FB923C'), size: new google.maps.Size(24,36), scaledSize: new google.maps.Size(24,36), anchor: new google.maps.Point(12,36) },
        animation: google.maps.Animation ? google.maps.Animation.DROP : undefined,
        zIndex: 1000
      });
      fallbackMarkersRef.current.push(red);
  try {
        mapInstanceRef.current.setCenter(selectionPos);
        const currentZoom = mapInstanceRef.current.getZoom && mapInstanceRef.current.getZoom();
        if (!currentZoom || currentZoom < 15) mapInstanceRef.current.setZoom(16);
  } catch { void 0; }
    }

    if (geoPos) {
      const green = new google.maps.Marker({
        map: mapInstanceRef.current,
        position: geoPos,
        title: 'ตำแหน่งของฉัน',
        icon: { url: makePin('#22C55E'), size: new google.maps.Size(24,36), scaledSize: new google.maps.Size(24,36), anchor: new google.maps.Point(12,36) },
        zIndex: 900
      });
      fallbackMarkersRef.current.push(green);
    }
  }, [markers, forceDefaultMarker, center, geoPos, fallbackClickPos]);

  // Update map center when center prop changes (only before user interacts)
  React.useEffect(() => {
    if (mapInstanceRef.current && center && !userInteractedRef.current) {
      try { mapInstanceRef.current.setCenter(center); } catch { void 0; }
    }
  }, [center]);

  const [hasApiKey, setHasApiKey] = React.useState(true);

  React.useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey || apiKey === 'YOUR_API_KEY' || apiKey === 'your_google_maps_api_key_here') {
      setHasApiKey(false);
    }
  }, []);

  if (!hasApiKey) {
    return (
      <div className={`relative ${className}`}>
        <div 
          style={{ height }} 
          className="w-full rounded-lg border border-gray-200 shadow-sm bg-gray-50 flex items-center justify-center"
        >
          <div className="text-center p-6">
            <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <p className="text-gray-600 font-medium">Google Maps</p>
            <p className="text-sm text-gray-500 mt-1">กรุณาตั้งค่า API Key</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <div 
        ref={mapRef} 
        style={{ height }} 
        className="w-full rounded-lg border border-gray-200 shadow-sm"
      />
    </div>
  );
};

export default GoogleMap;
