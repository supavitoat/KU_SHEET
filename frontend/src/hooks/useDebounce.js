import { useState, useEffect } from 'react';

/**
 * Custom hook สำหรับ debounce ค่า
 * ป้องกันการเรียกฟังก์ชันบ่อยเกินไป
 */
export const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

export default useDebounce;
