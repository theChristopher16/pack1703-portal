import React, { useState, useRef } from 'react';
import { Camera, Upload, X, User } from 'lucide-react';
import ProfilePicture from './ProfilePicture';

interface ProfilePictureUploadProps {
  currentPhotoURL?: string;
  onPhotoChange: (photoURL: string | null) => void;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  disabled?: boolean;
}

const ProfilePictureUpload: React.FC<ProfilePictureUploadProps> = ({
  currentPhotoURL,
  onPhotoChange,
  size = 'lg',
  className = '',
  disabled = false
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [previewURL, setPreviewURL] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be smaller than 5MB');
      return;
    }

    setIsUploading(true);

    try {
      // Create preview URL
      const preview = URL.createObjectURL(file);
      setPreviewURL(preview);

      // In a real implementation, you would upload to Firebase Storage here
      // For now, we'll use the preview URL as a placeholder
      // TODO: Implement actual file upload to Firebase Storage
      
      // Simulate upload delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // For now, use the preview URL (in production, this would be the Firebase Storage URL)
      onPhotoChange(preview);
      
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image. Please try again.');
      setPreviewURL(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemovePhoto = () => {
    setPreviewURL(null);
    onPhotoChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const displayPhotoURL = previewURL || currentPhotoURL;

  return (
    <div className={`relative inline-block ${className}`}>
      <div 
        className={`relative cursor-pointer group ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
        onClick={handleClick}
      >
        <ProfilePicture 
          src={displayPhotoURL}
          alt="Profile"
          size={size}
          className="transition-all duration-200 group-hover:opacity-80"
        />
        
        {/* Upload overlay */}
        {!disabled && (
          <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            {isUploading ? (
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
            ) : (
              <Camera className="w-6 h-6 text-white" />
            )}
          </div>
        )}

        {/* Remove button */}
        {displayPhotoURL && !disabled && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleRemovePhoto();
            }}
            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
            title="Remove photo"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled}
      />

      {/* Upload instructions */}
      {!displayPhotoURL && !disabled && (
        <div className="mt-2 text-center">
          <p className="text-sm text-gray-500">
            Click to upload photo
          </p>
          <p className="text-xs text-gray-400">
            Max 5MB, JPG/PNG
          </p>
        </div>
      )}
    </div>
  );
};

export default ProfilePictureUpload;
