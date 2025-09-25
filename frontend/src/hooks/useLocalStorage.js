import { useState, useCallback } from 'react';

/**
 * Custom hook สำหรับจัดการ localStorage
 * ป้องกันการ re-render ที่ไม่จำเป็น
 */
export const useLocalStorage = (key, initialValue) => {
  // State เพื่อเก็บค่า
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Function เพื่อตั้งค่า
  const setValue = useCallback((value) => {
    try {
      // อนุญาตให้ value เป็น function เพื่อ update แบบ state
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  // Function เพื่อลบค่า
  const removeValue = useCallback(() => {
    try {
      window.localStorage.removeItem(key);
      setStoredValue(initialValue);
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue];
};

export default useLocalStorage;
