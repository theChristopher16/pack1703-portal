import React from 'react';
import { User } from 'lucide-react';

interface ProfilePictureProps {
  src?: string;
  alt: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  fallbackIcon?: React.ReactNode;
  showFallback?: boolean;
}

const ProfilePicture: React.FC<ProfilePictureProps> = ({
  src,
  alt,
  size = 'md',
  className = '',
  fallbackIcon,
  showFallback = true
}) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
    xl: 'w-12 h-12'
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
    xl: 'w-6 h-6'
  };

  const baseClasses = `${sizeClasses[size]} rounded-full flex items-center justify-center overflow-hidden bg-gray-200 text-gray-600 ${className}`;

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    // Hide the image and show fallback
    e.currentTarget.style.display = 'none';
    const fallbackElement = e.currentTarget.nextElementSibling as HTMLElement;
    if (fallbackElement) {
      fallbackElement.style.display = 'flex';
    }
  };

  return (
    <div className={baseClasses}>
      {src && (
        <img 
          src={src} 
          alt={alt}
          className="w-full h-full object-cover"
          onError={handleImageError}
        />
      )}
      <div 
        className={`w-full h-full flex items-center justify-center ${src ? 'hidden' : 'flex'}`}
        style={{ display: src ? 'none' : 'flex' }}
      >
        {showFallback && (
          fallbackIcon || (
            <User className={iconSizes[size]} />
          )
        )}
      </div>
    </div>
  );
};

export default ProfilePicture;
