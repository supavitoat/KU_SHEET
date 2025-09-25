import { Loader } from '@googlemaps/js-api-loader';

let loaderInstance;

export function getGoogleMapsLoader() {
  if (loaderInstance) return loaderInstance;
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  if (!apiKey || apiKey === 'YOUR_API_KEY' || apiKey === 'your_google_maps_api_key_here') {
    console.warn('Google Maps API key not set. Add VITE_GOOGLE_MAPS_API_KEY to .env');
  }
  // IMPORTANT: Keep these options identical across the app
  loaderInstance = new Loader({
    apiKey: apiKey || '',
    version: 'weekly',
    libraries: ['places', 'geometry']
  });
  return loaderInstance;
}
