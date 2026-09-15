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
    md: 'h-10 sm:h-12',
    lg: 'h-16 sm:h-20'
  };

  return (
    <img
      id="app-logo"
      src="/logo.png"
      alt="LabelCheck Logo"
      className={`w-auto object-contain select-none ${sizeClasses[size]} ${className}`}
    />
  );
};

