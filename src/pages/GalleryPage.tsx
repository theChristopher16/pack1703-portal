import React, { useState, useEffect } from 'react';
import {
  Upload,
  Image as ImageIcon,
  Heart,
  Eye,
  Check,
  X,
  Clock,
  Filter,
  Grid,
  List,
  ChevronLeft,
  Trash2,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useOrganization } from '../contexts/OrganizationContext';
import { galleryService } from '../services/galleryService';
import { GalleryPhoto, PhotoStatus, PhotoUploadRequest } from '../types/gallery';
import { authService } from '../services/authService';

export const GalleryPage: React.FC = () => {
  const { organizationId, organizationName } = useOrganization();
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [pendingPhotos, setPendingPhotos] = useState<GalleryPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filter, setFilter] = useState<'all' | 'approved' | 'pending' | 'my-uploads'>('all');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<GalleryPhoto | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  const currentUser = authService.getCurrentUser();
  const canApprove = galleryService.canApprovePhotos();

  // Debug logging
  useEffect(() => {
    console.log('📸 Gallery: organizationId:', organizationId);
    console.log('📸 Gallery: organizationName:', organizationName);
    console.log('📸 Gallery: currentUser:', currentUser?.email);
    console.log('📸 Gallery: canApprove:', canApprove);
  }, []);

  // Debug modal state
  useEffect(() => {
    console.log('📸 Gallery: showUploadModal changed to:', showUploadModal);
  }, [showUploadModal]);

  // Load photos
  useEffect(() => {
    console.log('📸 Gallery: useEffect triggered - organizationId:', organizationId, 'filter:', filter);
    if (organizationId) {
      console.log('📸 Gallery: Loading photos...');
      loadPhotos();
    } else {
      console.log('📸 Gallery: No organizationId, setting loading to false');
      setLoading(false);
    }
  }, [organizationId, filter]);

  // Load pending count for admins
  useEffect(() => {
    if (organizationId && canApprove) {
      loadPendingCount();
    }
  }, [organizationId, canApprove]);

  const loadPhotos = async () => {
    try {
      console.log('📸 Gallery: loadPhotos called');
      setLoading(true);
      
      let loadedPhotos: GalleryPhoto[] = [];
      
      console.log('📸 Gallery: filter:', filter, 'canApprove:', canApprove);
      
      if (filter === 'approved') {
        console.log('📸 Gallery: Loading approved photos...');
        loadedPhotos = await galleryService.getPhotos(organizationId!, PhotoStatus.APPROVED);
      } else if (filter === 'pending') {
        if (canApprove) {
          console.log('📸 Gallery: Loading pending photos...');
          loadedPhotos = await galleryService.getPhotos(organizationId!, PhotoStatus.PENDING);
        }
      } else if (filter === 'my-uploads') {
        console.log('📸 Gallery: Loading my uploads...');
        const allPhotos = await galleryService.getPhotos(organizationId!);
        loadedPhotos = allPhotos.filter(p => p.uploadedBy === currentUser?.uid);
      } else {
        // 'all' - admins see everything, regular users see only approved
        console.log('📸 Gallery: Loading all photos...');
        loadedPhotos = await galleryService.getPhotos(organizationId!);
      }

      console.log('📸 Gallery: Loaded photos:', loadedPhotos.length);
      setPhotos(loadedPhotos);
    } catch (error: any) {
      console.error('📸 Gallery: Error loading photos:', error);
      console.error('📸 Gallery: Error details:', error.message, error.code);
    } finally {
      console.log('📸 Gallery: Setting loading to false');
      setLoading(false);
    }
  };

  const loadPendingCount = async () => {
    try {
      const count = await galleryService.getPendingCount(organizationId!);
      setPendingCount(count);
    } catch (error) {
      console.error('Error loading pending count:', error);
    }
  };

  const handleUpload = async () => {
    console.log('📸 Gallery: handleUpload called');
    console.log('📸 Gallery: uploadFile:', uploadFile?.name);
    console.log('📸 Gallery: organizationId:', organizationId);
    
    if (!uploadFile || !organizationId) {
      console.log('📸 Gallery: Missing uploadFile or organizationId, returning');
      return;
    }

    try {
      setUploading(true);
      console.log('📸 Gallery: Creating upload request...');
      
      const uploadRequest: PhotoUploadRequest = {
        file: uploadFile,
        title: uploadTitle,
        description: uploadDescription
      };

      console.log('📸 Gallery: Calling galleryService.uploadPhoto...');
      await galleryService.uploadPhoto(organizationId, uploadRequest);
      console.log('📸 Gallery: Upload successful!');
      
      // Reset form
      setUploadFile(null);
      setUploadTitle('');
      setUploadDescription('');
      setShowUploadModal(false);
      
      // Reload photos
      await loadPhotos();
      if (canApprove) {
        await loadPendingCount();
      }
    } catch (error: any) {
      console.error('📸 Gallery: Upload error:', error);
      alert(`Failed to upload photo: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleApprove = async (photoId: string) => {
    try {
      await galleryService.approvePhoto(photoId);
      await loadPhotos();
      await loadPendingCount();
      setSelectedPhoto(null);
    } catch (error: any) {
      alert(`Failed to approve photo: ${error.message}`);
    }
  };

  const handleReject = async (photoId: string, reason?: string) => {
    try {
      await galleryService.rejectPhoto(photoId, reason);
      await loadPhotos();
      await loadPendingCount();
      setSelectedPhoto(null);
    } catch (error: any) {
      alert(`Failed to reject photo: ${error.message}`);
    }
  };

  const handleDelete = async (photoId: string) => {
    if (!window.confirm('Are you sure you want to delete this photo? This cannot be undone.')) {
      return;
    }

    try {
      await galleryService.deletePhoto(photoId);
      await loadPhotos();
      setSelectedPhoto(null);
    } catch (error: any) {
      alert(`Failed to delete photo: ${error.message}`);
    }
  };

  const handleLike = async (photoId: string) => {
    try {
      await galleryService.toggleLike(photoId);
      await loadPhotos();
    } catch (error: any) {
      console.error('Error toggling like:', error);
    }
  };

  const handlePhotoSelect = async (photo: GalleryPhoto) => {
    // Set the selected photo to open the modal
    setSelectedPhoto(photo);
    
    // Increment view count (only counts once per user)
    await galleryService.incrementViewCount(photo.id);
    
    // Reload photos to show updated view count
    // Use a small delay to ensure the update has propagated
    setTimeout(() => {
      loadPhotos();
    }, 500);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('📸 Gallery: handleFileSelect called');
    const file = e.target.files?.[0];
    console.log('📸 Gallery: Selected file:', file?.name, file?.size, file?.type);
    
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        console.log('📸 Gallery: Invalid file type');
        alert('Please select an image file');
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        console.log('📸 Gallery: File too large');
        alert('File size must be less than 10MB');
        return;
      }

      console.log('📸 Gallery: File validated, setting uploadFile');
      setUploadFile(file);
    }
  };

  const getStatusBadge = (status: PhotoStatus) => {
    const config = {
      [PhotoStatus.PENDING]: { label: 'Pending Approval', color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: Clock },
      [PhotoStatus.APPROVED]: { label: 'Approved', color: 'bg-green-100 text-green-700 border-green-200', icon: Check },
      [PhotoStatus.REJECTED]: { label: 'Rejected', color: 'bg-red-100 text-red-700 border-red-200', icon: X },
      [PhotoStatus.FLAGGED]: { label: 'Flagged', color: 'bg-orange-100 text-orange-700 border-orange-200', icon: AlertCircle }
    };
    return config[status];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-fog via-forest-50/30 to-solar-50/30">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-forest-200/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-solarpunk-display font-bold text-forest-800">
                📸 Photo Gallery
              </h1>
              <p className="text-sm text-forest-600">{organizationName || 'Organization'} Memories</p>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Pending Count Badge */}
              {canApprove && pendingCount > 0 && (
                <div className="bg-yellow-100 border border-yellow-200 rounded-full px-3 py-1 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-yellow-600" />
                  <span className="text-xs font-semibold text-yellow-700">
                    {pendingCount} pending
                  </span>
                </div>
              )}

              {/* Upload Button */}
              <button
                onClick={() => {
                  console.log('📸 Gallery: Upload button clicked');
                  console.log('📸 Gallery: organizationId:', organizationId);
                  setShowUploadModal(true);
                  console.log('📸 Gallery: showUploadModal set to true');
                }}
                className="px-4 py-2 bg-gradient-to-r from-forest-500 to-ocean-500 text-white rounded-lg hover:from-forest-600 hover:to-ocean-600 transition-all duration-300 shadow-glow flex items-center gap-2 font-semibold"
              >
                <Upload className="w-4 h-4" />
                Upload Photo
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3 mt-4">
            <div className="flex items-center gap-2 bg-white/60 rounded-lg p-1 border border-forest-200/50">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  filter === 'all' 
                    ? 'bg-gradient-to-r from-forest-100 to-ocean-100 text-forest-800'
                    : 'text-forest-600 hover:bg-forest-50'
                }`}
              >
                All Photos
              </button>
              <button
                onClick={() => setFilter('approved')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  filter === 'approved' 
                    ? 'bg-gradient-to-r from-forest-100 to-ocean-100 text-forest-800'
                    : 'text-forest-600 hover:bg-forest-50'
                }`}
              >
                Approved
              </button>
              {canApprove && (
                <button
                  onClick={() => setFilter('pending')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    filter === 'pending' 
                      ? 'bg-gradient-to-r from-forest-100 to-ocean-100 text-forest-800'
                      : 'text-forest-600 hover:bg-forest-50'
                  }`}
                >
                  Pending {pendingCount > 0 && `(${pendingCount})`}
                </button>
              )}
              <button
                onClick={() => setFilter('my-uploads')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  filter === 'my-uploads' 
                    ? 'bg-gradient-to-r from-forest-100 to-ocean-100 text-forest-800'
                    : 'text-forest-600 hover:bg-forest-50'
                }`}
              >
                My Uploads
              </button>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 bg-white/60 rounded-lg p-1 border border-forest-200/50">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-all ${
                  viewMode === 'grid'
                    ? 'bg-forest-100 text-forest-800'
                    : 'text-forest-600 hover:bg-forest-50'
                }`}
                title="Grid view"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-all ${
                  viewMode === 'list'
                    ? 'bg-forest-100 text-forest-800'
                    : 'text-forest-600 hover:bg-forest-50'
                }`}
                title="List view"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-forest-500" />
          </div>
        ) : photos.length === 0 ? (
          <div className="text-center py-20">
            <ImageIcon className="w-16 h-16 mx-auto text-forest-300 mb-4" />
            <h3 className="text-lg font-semibold text-forest-800 mb-2">No photos yet</h3>
            <p className="text-forest-600 mb-6">Be the first to share a memory!</p>
            <button
              onClick={() => setShowUploadModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-forest-500 to-ocean-500 text-white rounded-lg hover:from-forest-600 hover:to-ocean-600 transition-all duration-300 shadow-glow font-semibold"
            >
              <Upload className="w-5 h-5 inline-block mr-2" />
              Upload Your First Photo
            </button>
          </div>
        ) : (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' : 'space-y-4'}>
            {photos.map((photo) => (
              <PhotoCard
                key={photo.id}
                photo={photo}
                viewMode={viewMode}
                onSelect={handlePhotoSelect}
                onLike={handleLike}
                canApprove={canApprove}
                currentUserId={currentUser?.uid}
              />
            ))}
          </div>
        )}
      </main>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-forest-800">Upload Photo</h3>
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Photo
                </label>
                <div className="border-2 border-dashed border-forest-300 rounded-xl p-8 text-center hover:border-forest-500 transition-colors cursor-pointer bg-gradient-to-br from-forest-50/30 to-ocean-50/30">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="photo-upload"
                  />
                  <label htmlFor="photo-upload" className="cursor-pointer">
                    {uploadFile ? (
                      <div className="space-y-2">
                        <Check className="w-12 h-12 mx-auto text-green-500" />
                        <p className="font-semibold text-forest-800">{uploadFile.name}</p>
                        <p className="text-sm text-gray-600">
                          {(uploadFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Upload className="w-12 h-12 mx-auto text-forest-500" />
                        <p className="font-semibold text-forest-800">Click to select photo</p>
                        <p className="text-sm text-gray-600">Max size: 10MB</p>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title (optional)
                </label>
                <input
                  type="text"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="Give your photo a title"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-transparent"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (optional)
                </label>
                <textarea
                  value={uploadDescription}
                  onChange={(e) => setUploadDescription(e.target.value)}
                  placeholder="Tell us about this photo"
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-transparent resize-none"
                />
              </div>

              {/* Info Note */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-blue-800 font-medium">Approval Required</p>
                    <p className="text-xs text-blue-700 mt-1">
                      Your photo will be reviewed by den leaders before appearing in the gallery. This helps keep our community safe and appropriate.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowUploadModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={!uploadFile || uploading}
                className="px-6 py-2 bg-gradient-to-r from-forest-500 to-ocean-500 text-white rounded-lg hover:from-forest-600 hover:to-ocean-600 transition-all duration-300 shadow-glow disabled:opacity-50 disabled:cursor-not-allowed font-semibold flex items-center gap-2"
              >
                {uploading && <Loader2 className="w-4 h-4 animate-spin" />}
                {uploading ? 'Uploading...' : 'Upload Photo'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Photo Detail Modal */}
      {selectedPhoto && (
        <PhotoDetailModal
          photo={selectedPhoto}
          onClose={() => setSelectedPhoto(null)}
          onApprove={handleApprove}
          onReject={handleReject}
          onDelete={handleDelete}
          onLike={handleLike}
          canApprove={canApprove}
          currentUserId={currentUser?.uid}
        />
      )}
    </div>
  );
};

// Photo Card Component
interface PhotoCardProps {
  photo: GalleryPhoto;
  viewMode: 'grid' | 'list';
  onSelect: (photo: GalleryPhoto) => void | Promise<void>;
  onLike: (photoId: string) => void;
  canApprove: boolean;
  currentUserId?: string;
}

const PhotoCard: React.FC<PhotoCardProps> = ({ photo, viewMode, onSelect, onLike, canApprove, currentUserId }) => {
  const statusBadge = getStatusBadge(photo.status);
  const StatusIcon = statusBadge.icon;
  const hasLiked = currentUserId ? photo.likedBy.includes(currentUserId) : false;

  if (viewMode === 'list') {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-forest-200/50">
        <div className="flex gap-4 p-4">
          <img
            src={photo.imageUrl}
            alt={photo.title || 'Gallery photo'}
            className="w-32 h-32 object-cover rounded-lg cursor-pointer"
            onClick={() => onSelect(photo)}
          />
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-semibold text-forest-800">{photo.title || 'Untitled'}</h4>
                <p className="text-sm text-forest-600">by {photo.uploaderName}</p>
              </div>
              {/* Only show status badge for non-approved photos */}
              {photo.status !== PhotoStatus.APPROVED && (
                <span className={`text-xs px-2 py-1 rounded-full border ${statusBadge.color} flex items-center gap-1`}>
                  <StatusIcon className="w-3 h-3" />
                  {statusBadge.label}
                </span>
              )}
            </div>
            {photo.description && (
              <p className="text-sm text-gray-600 mt-2 line-clamp-2">{photo.description}</p>
            )}
            <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onLike(photo.id);
                }}
                className={`flex items-center gap-1 hover:text-red-500 transition-colors ${
                  hasLiked ? 'text-red-500' : ''
                }`}
              >
                <Heart className={`w-4 h-4 ${hasLiked ? 'fill-current' : ''}`} />
                {photo.likes}
              </button>
              <span className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                {photo.viewCount}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="bg-white/80 backdrop-blur-sm rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer group border border-forest-200/50"
      onClick={() => onSelect(photo)}
    >
      <div className="relative aspect-square overflow-hidden bg-forest-100">
        <img
          src={photo.imageUrl}
          alt={photo.title || 'Gallery photo'}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        
        {/* Status Badge - Only show for non-approved photos */}
        {photo.status !== PhotoStatus.APPROVED && (
          <div className="absolute top-2 right-2">
            <span className={`text-xs px-2 py-1 rounded-full border ${statusBadge.color} flex items-center gap-1 backdrop-blur-md`}>
              <StatusIcon className="w-3 h-3" />
              {statusBadge.label}
            </span>
          </div>
        )}

        {/* Overlay on Hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      <div className="p-4">
        <h4 className="font-semibold text-forest-800 truncate">{photo.title || 'Untitled'}</h4>
        <p className="text-sm text-forest-600 truncate">by {photo.uploaderName}</p>
        
        <div className="flex items-center gap-4 mt-3 text-sm text-gray-600">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onLike(photo.id);
            }}
            className={`flex items-center gap-1 hover:text-red-500 transition-colors ${
              hasLiked ? 'text-red-500' : ''
            }`}
          >
            <Heart className={`w-4 h-4 ${hasLiked ? 'fill-current' : ''}`} />
            {photo.likes}
          </button>
          <span className="flex items-center gap-1">
            <Eye className="w-4 h-4" />
            {photo.viewCount}
          </span>
        </div>
      </div>
    </div>
  );
};

// Photo Detail Modal Component
interface PhotoDetailModalProps {
  photo: GalleryPhoto;
  onClose: () => void;
  onApprove: (photoId: string) => void;
  onReject: (photoId: string, reason?: string) => void;
  onDelete: (photoId: string) => void;
  onLike: (photoId: string) => void;
  canApprove: boolean;
  currentUserId?: string;
}

const PhotoDetailModal: React.FC<PhotoDetailModalProps> = ({
  photo,
  onClose,
  onApprove,
  onReject,
  onDelete,
  onLike,
  canApprove,
  currentUserId
}) => {
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const statusBadge = getStatusBadge(photo.status);
  const StatusIcon = statusBadge.icon;
  const hasLiked = currentUserId ? photo.likedBy.includes(currentUserId) : false;
  const isOwner = currentUserId === photo.uploadedBy;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="relative">
          {/* Image */}
          <div className="relative bg-black">
            <img
              src={photo.imageUrl}
              alt={photo.title || 'Gallery photo'}
              className="w-full max-h-[60vh] object-contain"
            />
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </div>

          {/* Details */}
          <div className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-forest-800 mb-2">
                  {photo.title || 'Untitled Photo'}
                </h3>
                <p className="text-forest-600 mb-2">
                  Uploaded by <span className="font-semibold">{photo.uploaderName}</span>
                </p>
                {/* Only show status badge for non-approved photos */}
                {photo.status !== PhotoStatus.APPROVED && (
                  <span className={`inline-flex items-center gap-2 text-xs px-3 py-1 rounded-full border ${statusBadge.color}`}>
                    <StatusIcon className="w-4 h-4" />
                    {statusBadge.label}
                  </span>
                )}
              </div>
            </div>

            {photo.description && (
              <p className="text-gray-700 mb-4">{photo.description}</p>
            )}

            {/* Stats */}
            <div className="flex items-center gap-6 mb-6 text-gray-600">
              <button
                onClick={() => onLike(photo.id)}
                className={`flex items-center gap-2 hover:text-red-500 transition-colors ${
                  hasLiked ? 'text-red-500' : ''
                }`}
              >
                <Heart className={`w-5 h-5 ${hasLiked ? 'fill-current' : ''}`} />
                <span className="font-semibold">{photo.likes}</span>
              </button>
              <span className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                {photo.viewCount} views
              </span>
              <span className="text-sm">
                {photo.uploadedAt.toLocaleDateString()}
              </span>
            </div>

            {/* Approval Actions */}
            {canApprove && photo.status === PhotoStatus.PENDING && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <h4 className="font-semibold text-yellow-900 mb-3">⏳ Pending Approval</h4>
                {!showRejectForm ? (
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => onApprove(photo.id)}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold flex items-center justify-center gap-2"
                    >
                      <Check className="w-4 h-4" />
                      Approve
                    </button>
                    <button
                      onClick={() => setShowRejectForm(true)}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold flex items-center justify-center gap-2"
                    >
                      <X className="w-4 h-4" />
                      Reject
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Reason for rejection (optional)"
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none text-sm"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          onReject(photo.id, rejectionReason);
                          setShowRejectForm(false);
                          setRejectionReason('');
                        }}
                        className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold"
                      >
                        Confirm Rejection
                      </button>
                      <button
                        onClick={() => {
                          setShowRejectForm(false);
                          setRejectionReason('');
                        }}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Delete Button for Owner or Admin */}
            {(isOwner || canApprove) && (
              <button
                onClick={() => onDelete(photo.id)}
                className="w-full px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors font-semibold flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete Photo
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper function moved outside component
const getStatusBadge = (status: PhotoStatus) => {
  const config = {
    [PhotoStatus.PENDING]: { label: 'Pending', color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: Clock },
    [PhotoStatus.APPROVED]: { label: 'Approved', color: 'bg-green-100 text-green-700 border-green-200', icon: Check },
    [PhotoStatus.REJECTED]: { label: 'Rejected', color: 'bg-red-100 text-red-700 border-red-200', icon: X },
    [PhotoStatus.FLAGGED]: { label: 'Flagged', color: 'bg-orange-100 text-orange-700 border-orange-200', icon: AlertCircle }
  };
  return config[status];
};

export default GalleryPage;

