import React from 'react';

const LoadingSpinner = ({ className = 'w-8 h-8' }) => {
  return (
    <span className={`relative inline-block ${className}`}>
      <svg
        className="animate-spin drop-shadow-lg"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 40 40"
      >
        <circle
          className="opacity-20"
          cx="20"
          cy="20"
          r="16"
          stroke="#853EF4"
          strokeWidth="6"
        />
        <path
          d="M36 20c0-8.837-7.163-16-16-16"
          stroke="url(#spinner-gradient)"
          strokeWidth="6"
          strokeLinecap="round"
        />
        <defs>
          <linearGradient id="spinner-gradient" x1="20" y1="4" x2="36" y2="20" gradientUnits="userSpaceOnUse">
            <stop stopColor="#853EF4" />
            <stop offset="1" stopColor="#6300FF" />
          </linearGradient>
        </defs>
      </svg>
      <span className="absolute inset-0 rounded-full blur-[2px] opacity-30 bg-gradient-to-tr from-[#853EF4] to-[#6300FF]" />
    </span>
  );
};

export default LoadingSpinner;