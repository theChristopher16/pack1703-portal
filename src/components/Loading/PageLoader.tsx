import React from 'react';
import LoadingSpinner from './LoadingSpinner';

interface PageLoaderProps {
  text?: string;
  subtitle?: string;
  showProgress?: boolean;
  progress?: number;
  className?: string;
}

const PageLoader: React.FC<PageLoaderProps> = ({
  text = 'Loading...',
  subtitle,
  showProgress = false,
  progress = 0,
  className = ''
}) => {
  return (
    <div className={`min-h-screen bg-surface flex items-center justify-center p-8 ${className}`}>
      <div className="text-center max-w-md mx-auto">
        {/* Main loading spinner */}
        <LoadingSpinner 
          size="xl" 
          variant="primary" 
          className="mb-8"
        />
        
        {/* Loading text */}
        <h2 className="text-2xl font-display font-bold text-text mb-3 animate-pulse">
          {text}
        </h2>
        
        {/* Subtitle */}
        {subtitle && (
          <p className="text-gray-600 text-lg mb-6 animate-pulse">
            {subtitle}
          </p>
        )}
        
        {/* Progress bar */}
        {showProgress && (
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-4">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
        )}
        
        {/* Animated dots */}
        <div className="flex justify-center space-x-1">
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 bg-secondary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
};

export default PageLoader;
