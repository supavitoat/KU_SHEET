import React from 'react';
import QRCode from 'qrcode-generator';

/**
 * Memoized QR Code Component
 * ป้องกัน re-render เมื่อ props ไม่เปลี่ยนแปลง
 */
export const MemoizedQRCode = React.memo(({ value, size = 200, ...props }) => {
  const qr = QRCode(0, 'M');
  qr.addData(value);
  qr.make();
  
  return (
    <div 
      style={{ width: size, height: size }}
      dangerouslySetInnerHTML={{ __html: qr.createImgTag(4) }}
      {...props}
    />
  );
});

MemoizedQRCode.displayName = 'MemoizedQRCode';

/**
 * Memoized Loading Spinner
 * ป้องกัน re-render ที่ไม่จำเป็น
 */
export const MemoizedLoadingSpinner = React.memo(({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className={`animate-spin rounded-full border-2 border-blue-500 border-t-transparent ${sizeClasses[size]} ${className}`} />
  );
});

MemoizedLoadingSpinner.displayName = 'MemoizedLoadingSpinner';

/**
 * Memoized Card Component
 * ป้องกัน re-render เมื่อ children ไม่เปลี่ยน
 */
export const MemoizedCard = React.memo(({ children, className = '', ...props }) => {
  return (
    <div 
      className={`bg-white rounded-lg shadow-md border border-gray-200 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
});

MemoizedCard.displayName = 'MemoizedCard';

/**
 * Memoized Button Component
 * ป้องกัน re-render เมื่อ props ไม่เปลี่ยนแปลง
 */
export const MemoizedButton = React.memo(({ 
  children, 
  onClick, 
  disabled = false, 
  variant = 'primary',
  size = 'md',
  className = '',
  ...props 
}) => {
  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
    outline: 'border border-blue-600 text-blue-600 hover:bg-blue-50',
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        rounded-md font-medium transition-colors duration-200
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
});

MemoizedButton.displayName = 'MemoizedButton';

/**
 * Memoized Stats Card Component
 * ป้องกัน re-render เมื่อ stats ไม่เปลี่ยน
 */
export const MemoizedStatsCard = React.memo(({ title, value, icon: Icon, trend, className = '' }) => {
  return (
    <MemoizedCard className={`p-6 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {trend && (
            <p className={`text-sm mt-1 ${trend.positive ? 'text-green-600' : 'text-red-600'}`}>
              {trend.value}
            </p>
          )}
        </div>
        {Icon && (
          <div className="p-3 bg-blue-100 rounded-full">
            <Icon className="w-6 h-6 text-blue-600" />
          </div>
        )}
      </div>
    </MemoizedCard>
  );
});

MemoizedStatsCard.displayName = 'MemoizedStatsCard';
