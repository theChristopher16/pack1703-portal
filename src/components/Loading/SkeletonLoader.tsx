import React from 'react';

interface SkeletonLoaderProps {
  type?: 'text' | 'card' | 'list' | 'avatar';
  lines?: number;
  className?: string;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  type = 'text',
  lines = 3,
  className = ''
}) => {
  const renderSkeleton = () => {
    switch (type) {
      case 'text':
        return (
          <div className="space-y-3">
            {Array.from({ length: lines }).map((_, index) => (
              <div
                key={index}
                className={`h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse ${
                  index === 0 ? 'w-3/4' : index === 1 ? 'w-full' : 'w-5/6'
                }`}
              />
            ))}
          </div>
        );

      case 'card':
        return (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-soft border border-gray-200 dark:border-gray-700">
            <div className="space-y-4">
              {/* Title skeleton */}
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-2/3 animate-pulse" />
              
              {/* Content skeleton */}
              <div className="space-y-3">
                {Array.from({ length: lines }).map((_, index) => (
                  <div
                    key={index}
                    className={`h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse ${
                      index === 0 ? 'w-full' : index === 1 ? 'w-5/6' : 'w-3/4'
                    }`}
                  />
                ))}
              </div>
              
              {/* Button skeleton */}
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg w-24 animate-pulse mt-4" />
            </div>
          </div>
        );

      case 'list':
        return (
          <div className="space-y-4">
            {Array.from({ length: lines }).map((_, index) => (
              <div
                key={index}
                className="flex items-center space-x-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
              >
                {/* Avatar skeleton */}
                <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
                
                {/* Content skeleton */}
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 animate-pulse" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        );

      case 'avatar':
        return (
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16 animate-pulse" />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`animate-pulse ${className}`}>
      {renderSkeleton()}
    </div>
  );
};

export default SkeletonLoader;
