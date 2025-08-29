import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  text?: string;
  variant?: 'primary' | 'secondary' | 'accent';
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  text,
  variant = 'primary',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  const variantColors = {
    primary: 'text-primary',
    secondary: 'text-secondary',
    accent: 'text-accent'
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className="relative">
        {/* Main spinning loader */}
        <Loader2 
          className={`${sizeClasses[size]} ${variantColors[variant]} animate-spin`}
        />
        
        {/* Glow effect */}
        <div className={`absolute inset-0 ${sizeClasses[size]} ${variantColors[variant]} animate-pulse opacity-30 blur-sm`}>
          <Loader2 className="w-full h-full" />
        </div>
      </div>
      
      {/* Loading text */}
      {text && (
        <p className="mt-3 text-sm text-gray-600 font-medium animate-pulse">
          {text}
        </p>
      )}
    </div>
  );
};

export default LoadingSpinner;
