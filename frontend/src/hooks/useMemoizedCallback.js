import { useCallback, useMemo } from 'react';

/**
 * Custom hook สำหรับ memoize callback functions
 * ลด re-render ที่ไม่จำเป็น
 */
export const useMemoizedCallback = (callback, dependencies = []) => {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useCallback(callback, dependencies);
};

/**
 * Custom hook สำหรับ memoize values
 * ลดการคำนวณซ้ำ
 */
export const useMemoizedValue = (factory, dependencies = []) => {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(factory, dependencies);
};

export default useMemoizedCallback;
