import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showProduct?: boolean;
  productName?: string;
  className?: string;
  variant?: 'light' | 'dark';
}

const sizeClasses = {
  sm: {
    brand: 'text-2xl',
    product: 'text-sm',
  },
  md: {
    brand: 'text-4xl',
    product: 'text-base',
  },
  lg: {
    brand: 'text-6xl',
    product: 'text-xl',
  },
  xl: {
    brand: 'text-8xl',
    product: 'text-2xl',
  },
};

export function Logo({ 
  size = 'md', 
  showProduct = false, 
  productName = 'oficios',
  className = '',
  variant = 'light'
}: LogoProps) {
  const textColor = variant === 'light' ? 'text-white' : 'text-gray-900';
  const productColor = variant === 'light' ? 'text-gray-300' : 'text-gray-600';
  
  return (
    <div className={`inline-flex flex-col items-center ${className}`}>
      <div className={`${sizeClasses[size].brand} font-bold ${textColor} leading-none`}>
        ness<span className="text-[#00ADE8]">.</span>
      </div>
      {showProduct && productName && (
        <div className={`${sizeClasses[size].product} font-medium ${productColor} mt-1`}>
          {productName}
        </div>
      )}
    </div>
  );
}

export function BrandText({ 
  size = 'md',
  variant = 'light',
  className = ''
}: Omit<LogoProps, 'showProduct' | 'productName'>) {
  const textColor = variant === 'light' ? 'text-white' : 'text-gray-900';
  
  return (
    <span className={`${sizeClasses[size].brand} font-bold ${textColor} ${className}`}>
      ness<span className="text-[#00ADE8]">.</span>
    </span>
  );
}

export function ProductBrand({ 
  product = 'oficios',
  size = 'md',
  variant = 'light',
  inline = false,
  className = ''
}: { 
  product?: string; 
  inline?: boolean;
} & Omit<LogoProps, 'showProduct' | 'productName'>) {
  const textColor = variant === 'light' ? 'text-white' : 'text-gray-900';
  const productColor = variant === 'light' ? 'text-gray-300' : 'text-gray-600';
  
  if (inline) {
    return (
      <span className={`${sizeClasses[size].brand} font-bold ${className}`}>
        <span className={textColor}>n</span>
        <span className="text-[#00ADE8]">.</span>
        <span className={productColor}>{product}</span>
      </span>
    );
  }
  
  return (
    <div className={`inline-flex flex-col ${className}`}>
      <div className={`${sizeClasses[size].brand} font-bold ${textColor} leading-none`}>
        ness<span className="text-[#00ADE8]">.</span>
      </div>
      <div className={`${sizeClasses[size].product} font-medium ${productColor} mt-1`}>
        {product}
      </div>
    </div>
  );
}

