// Shared formatting utilities

// Currency formatter for THB. Defaults to 0 fraction digits (product UI style).
export const formatCurrency = (amount, options = {}) => {
  const { minimumFractionDigits = 0, maximumFractionDigits = minimumFractionDigits } = options;
  if (amount === null || amount === undefined || isNaN(Number(amount))) {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits,
      maximumFractionDigits,
    }).format(0);
  }

  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(Number(amount));
};

// Date formatter. Default variant is 'short' (e.g., 4 ก.ย. 2568). Use variant 'long' to include time.
export const formatDate = (dateInput, { variant = 'short' } = {}) => {
  if (!dateInput) return 'ไม่ระบุ';
  try {
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return 'วันที่ไม่ถูกต้อง';
    if (variant === 'long') {
      return date.toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
    // short
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return 'วันที่ไม่ถูกต้อง';
  }
};
