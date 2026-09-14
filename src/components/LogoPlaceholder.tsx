import React from 'react';

interface LogoPlaceholderProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const LogoPlaceholder: React.FC<LogoPlaceholderProps> = ({
  className = '',
  size = 'md'
}) => {
  const sizeClasses = {
    sm: 'h-8',
    md: 'h-9',
    lg: 'h-11'
  };

  return (
    <div
      id="app-logo-placeholder"
      className={`inline-flex items-center select-none ${sizeClasses[size]} ${className}`}
      title="Company Logo"
    >
      {/* Modern SVG Vector Logo Placeholder */}
      <svg
        className="h-full w-auto max-w-[200px]"
        viewBox="0 0 160 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Logo"
      >
        <rect x="2" y="4" width="32" height="32" rx="8" fill="#0F172A" />
        <path
          d="M10 14H26M10 20H22M10 26H18"
          stroke="#38BDF8"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <circle cx="24" cy="24" r="3" fill="#10B981" />
        <text
          x="44"
          y="26"
          fill="#0F172A"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontWeight="700"
          fontSize="18"
          letterSpacing="-0.02em"
        >
          LOGO
        </text>
      </svg>
    </div>
  );
};
