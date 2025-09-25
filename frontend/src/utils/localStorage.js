// Utility functions for managing localStorage

/**
 * Clear all authentication-related data from localStorage
 */
export const clearAuthData = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('tokenExpiration');
  localStorage.removeItem('tempRegistration');
};

/**
 * Clear only temporary registration data
 */
export const clearTempRegistration = () => {
  localStorage.removeItem('tempRegistration');
};

/**
 * Check if there's any temporary registration data
 */
export const hasTempRegistration = () => {
  return !!localStorage.getItem('tempRegistration');
};

/**
 * Get temporary registration data
 */
export const getTempRegistration = () => {
  const data = localStorage.getItem('tempRegistration');
  return data ? JSON.parse(data) : null;
};

/**
 * Set temporary registration data
 */
export const setTempRegistration = (data) => {
  localStorage.setItem('tempRegistration', JSON.stringify({
    ...data,
    timestamp: Date.now()
  }));
};

/**
 * Check if tempRegistration is expired (30 minutes)
 */
export const isTempRegistrationExpired = () => {
  const data = getTempRegistration();
  if (!data || !data.timestamp) return true;
  
  const thirtyMinutes = 30 * 60 * 1000;
  return Date.now() - data.timestamp > thirtyMinutes;
};

/**
 * Clear expired tempRegistration
 */
export const clearExpiredTempRegistration = () => {
  if (isTempRegistrationExpired()) {
    clearTempRegistration();
    return true;
  }
  return false;
}; 