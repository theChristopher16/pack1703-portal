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
  Loader2,
  Folder,
  FolderPlus,
  ChevronRight,
  Download
} from 'lucide-react';
import { useOrganization } from '../contexts/OrganizationContext';
import { galleryService } from '../services/galleryService';
import { GalleryPhoto, GalleryAlbum, PhotoStatus, PhotoUploadRequest } from '../types/gallery';
import { authService } from '../services/authService';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, storage } from '../firebase/config';
import { ref, getBlob } from 'firebase/storage';

export const GalleryPage: React.FC = () => {
  const { organizationId, organizationName } = useOrganization();
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [pendingPhotos, setPendingPhotos] = useState<GalleryPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filter, setFilter] = useState<'all' | 'approved' | 'pending' | 'my-uploads'>('all');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<GalleryPhoto | null>(null);
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: boolean }>({});
  const [pendingCount, setPendingCount] = useState(0);
  
  // Album state
  const [albums, setAlbums] = useState<GalleryAlbum[]>([]);
  const [currentAlbum, setCurrentAlbum] = useState<GalleryAlbum | null>(null);
  const [showAlbumModal, setShowAlbumModal] = useState(false);
  const [albumName, setAlbumName] = useState('');
  const [albumDescription, setAlbumDescription] = useState('');
  const [selectedAlbumForUpload, setSelectedAlbumForUpload] = useState<string | null>(null);
  
  // Drag and drop state
  const [draggedPhotoId, setDraggedPhotoId] = useState<string | null>(null);
  const [dropTargetAlbumId, setDropTargetAlbumId] = useState<string | null>(null);

  const currentUser = authService.getCurrentUser();
  const canApprove = galleryService.canApprovePhotos();
  const canManageAlbums = galleryService.canApprovePhotos(); // Same permission level

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

  // Load albums
  useEffect(() => {
    if (organizationId) {
      loadAlbums();
    }
  }, [organizationId, currentAlbum]);

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
  }, [organizationId, filter, currentAlbum]);

  // Load pending count for admins
  useEffect(() => {
    if (organizationId && canApprove) {
      loadPendingCount();
    }
  }, [organizationId, canApprove]);

  const loadAlbums = async () => {
    try {
      const loadedAlbums = await galleryService.getAlbums(organizationId!, currentAlbum?.id || null);
      setAlbums(loadedAlbums);
    } catch (error: any) {
      console.error('📸 Gallery: Error loading albums:', error);
    }
  };

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

      // Filter by current album context
      if (currentAlbum) {
        // Inside an album: show only photos in this album
        loadedPhotos = loadedPhotos.filter(p => p.albumId === currentAlbum.id);
      } else {
        // Main gallery view: show only photos NOT in any album (unorganized photos)
        loadedPhotos = loadedPhotos.filter(p => !p.albumId);
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
    console.log('📸 Gallery: uploadFiles count:', uploadFiles.length);
    console.log('📸 Gallery: organizationId:', organizationId);
    
    if (uploadFiles.length === 0 || !organizationId) {
      console.log('📸 Gallery: Missing uploadFiles or organizationId, returning');
      return;
    }

    try {
      setUploading(true);
      const progress: { [key: string]: boolean } = {};
      
      console.log('📸 Gallery: Uploading', uploadFiles.length, 'photos...');
      
      // Upload all files in parallel (with a reasonable concurrency)
      const uploadPromises = uploadFiles.map(async (file) => {
        try {
          const uploadRequest: PhotoUploadRequest = {
            file,
            title: uploadTitle || file.name.replace(/\.[^/.]+$/, ''), // Use filename without extension as default title
            description: uploadDescription,
            albumId: selectedAlbumForUpload || undefined
          };

          console.log('📸 Gallery: Uploading', file.name);
          await galleryService.uploadPhoto(organizationId, uploadRequest);
          progress[file.name] = true;
          setUploadProgress({ ...progress });
          console.log('📸 Gallery: Successfully uploaded', file.name);
        } catch (error) {
          console.error('📸 Gallery: Failed to upload', file.name, error);
          throw error;
        }
      });

      await Promise.all(uploadPromises);
      console.log('📸 Gallery: All uploads successful!');
      
      // Reset form
      setUploadFiles([]);
      setUploadTitle('');
      setUploadDescription('');
      setUploadProgress({});
      setSelectedAlbumForUpload(null);
      setShowUploadModal(false);
      
      // Reload photos and albums (to update photo count)
      await loadPhotos();
      await loadAlbums();
      if (canApprove) {
        await loadPendingCount();
      }
      
      alert(`Successfully uploaded ${uploadFiles.length} photo${uploadFiles.length > 1 ? 's' : ''}!`);
    } catch (error: any) {
      console.error('📸 Gallery: Upload error:', error);
      alert(`Some photos failed to upload. Please try again.`);
    } finally {
      setUploading(false);
    }
  };

  const handleApprove = async (photoId: string) => {
    try {
      const photo = photos.find(p => p.id === photoId);
      await galleryService.approvePhoto(photoId);
      
      // Update album photo count if photo is in an album
      if (photo?.albumId) {
        await galleryService.updateAlbumPhotoCount(photo.albumId);
      }
      
      await loadPhotos();
      await loadAlbums();
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
    const files = Array.from(e.target.files || []);
    console.log('📸 Gallery: Selected files count:', files.length);
    
    if (files.length === 0) {
      return;
    }

    // Limit to 20 files
    if (files.length > 20) {
      alert('You can upload up to 20 photos at once. Please select fewer files.');
      return;
    }

    const validFiles: File[] = [];
    const errors: string[] = [];

    files.forEach((file) => {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        errors.push(`${file.name}: Not an image file`);
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        errors.push(`${file.name}: File too large (max 10MB)`);
        return;
      }

      validFiles.push(file);
    });

    if (errors.length > 0) {
      alert(`Some files were skipped:\n\n${errors.join('\n')}`);
    }

    if (validFiles.length > 0) {
      console.log('📸 Gallery: Valid files:', validFiles.length);
      setUploadFiles(validFiles);
    }
  };

  const removeFile = (index: number) => {
    setUploadFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleCreateAlbum = async () => {
    if (!albumName.trim() || !organizationId) {
      alert('Please enter an album name');
      return;
    }

    try {
      await galleryService.createAlbum(
        organizationId,
        albumName.trim(),
        albumDescription.trim() || undefined,
        undefined, // denId - could add den selection later
        undefined  // denName
      );
      
      setAlbumName('');
      setAlbumDescription('');
      setShowAlbumModal(false);
      
      await loadAlbums();
    } catch (error: any) {
      alert(`Failed to create album: ${error.message}`);
    }
  };

  const handleAlbumClick = (album: GalleryAlbum) => {
    setCurrentAlbum(album);
  };

  const handleBackToAllPhotos = () => {
    setCurrentAlbum(null);
  };

  const handleDownloadPhoto = async (photo: GalleryPhoto) => {
    try {
      console.log('📸 Gallery: Saving photo', photo.id);
      
      // Generate filename
      const filename = photo.title 
        ? `${photo.title.replace(/[^a-z0-9]/gi, '_')}.jpg`
        : `photo_${photo.id}.jpg`;
      
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      
      // Use canvas to convert image to blob (bypasses CORS)
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      // Create a promise to wait for image load
      const loadImage = new Promise<Blob>((resolve, reject) => {
        img.onload = () => {
          try {
            // Create canvas and draw image
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext('2d');
            
            if (!ctx) {
              reject(new Error('Could not get canvas context'));
              return;
            }
            
            ctx.drawImage(img, 0, 0);
            
            // Convert canvas to blob
            canvas.toBlob((blob) => {
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error('Failed to create blob'));
              }
            }, 'image/jpeg', 0.95);
          } catch (error) {
            reject(error);
          }
        };
        
        img.onerror = () => reject(new Error('Failed to load image'));
      });
      
      // Start loading the image
      img.src = photo.imageUrl;
      
      // Wait for image to load and convert to blob
      const blob = await loadImage;
      console.log('📸 Gallery: Image converted to blob');
      
      // For mobile: Use Web Share API with file
      if (isMobile && navigator.share && navigator.canShare) {
        try {
          const file = new File([blob], filename, { type: 'image/jpeg' });
          
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({
              files: [file],
              title: photo.title || 'Photo from Gallery',
              text: photo.description || 'Photo from Pack 1703 Gallery'
            });
            console.log('📸 Gallery: Photo shared successfully');
            return;
          }
        } catch (shareError: any) {
          if (shareError.name === 'AbortError') {
            console.log('📸 Gallery: Share cancelled by user');
            return;
          }
          console.log('📸 Gallery: Share failed, falling back to download', shareError);
        }
      }
      
      // For desktop or fallback: Download the blob
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      window.URL.revokeObjectURL(url);
      console.log('📸 Gallery: Photo downloaded');
    } catch (error: any) {
      console.error('📸 Gallery: Save error:', error);
      alert('Failed to save photo. Please long-press on the photo and select "Save Image" to save manually.');
    }
  };

  const handleMovePhoto = async (photoId: string, targetAlbumId: string | null) => {
    try {
      const photoRef = doc(db, 'gallery-photos', photoId);
      const photo = photos.find(p => p.id === photoId);
      
      await updateDoc(photoRef, {
        albumId: targetAlbumId,
        updatedAt: serverTimestamp()
      });

      // Update photo counts for both old and new albums
      if (photo?.albumId) {
        await galleryService.updateAlbumPhotoCount(photo.albumId);
      }
      if (targetAlbumId) {
        await galleryService.updateAlbumPhotoCount(targetAlbumId);
      }

      await loadPhotos();
      await loadAlbums();
      setSelectedPhoto(null);
    } catch (error: any) {
      alert(`Failed to move photo: ${error.message}`);
    }
  };

  // Drag and drop handlers
  const handleDragStart = (photoId: string) => {
    if (!canManageAlbums) return;
    setDraggedPhotoId(photoId);
    console.log('📸 Gallery: Started dragging photo', photoId);
  };

  const handleDragEnd = () => {
    setDraggedPhotoId(null);
    setDropTargetAlbumId(null);
    console.log('📸 Gallery: Drag ended');
  };

  const handleDragOver = (e: React.DragEvent, albumId: string) => {
    if (!canManageAlbums || !draggedPhotoId) return;
    e.preventDefault();
    setDropTargetAlbumId(albumId);
  };

  const handleDragLeave = () => {
    setDropTargetAlbumId(null);
  };

  const handleDrop = async (e: React.DragEvent, albumId: string) => {
    e.preventDefault();
    if (!canManageAlbums || !draggedPhotoId) return;

    console.log('📸 Gallery: Dropped photo', draggedPhotoId, 'on album', albumId);
    
    await handleMovePhoto(draggedPhotoId, albumId);
    
    setDraggedPhotoId(null);
    setDropTargetAlbumId(null);
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
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mt-4 w-full">
            <div className="flex items-center gap-1.5 sm:gap-2 bg-white/60 rounded-lg p-1 border border-forest-200/50 flex-wrap overflow-x-auto max-w-full">
              <button
                onClick={() => setFilter('all')}
                className={`px-2 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                  filter === 'all' 
                    ? 'bg-gradient-to-r from-forest-100 to-ocean-100 text-forest-800'
                    : 'text-forest-600 hover:bg-forest-50'
                }`}
              >
                All Photos
              </button>
              <button
                onClick={() => setFilter('approved')}
                className={`px-2 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
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
                  className={`px-2 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
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
                className={`px-2 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                  filter === 'my-uploads' 
                    ? 'bg-gradient-to-r from-forest-100 to-ocean-100 text-forest-800'
                    : 'text-forest-600 hover:bg-forest-50'
                }`}
              >
                My Uploads
              </button>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 bg-white/60 rounded-lg p-1 border border-forest-200/50 self-end sm:self-auto flex-shrink-0">
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
        {/* Breadcrumb / Back Button */}
        {currentAlbum && (
          <button
            onClick={handleBackToAllPhotos}
            className="flex items-center gap-2 text-forest-600 hover:text-forest-800 mb-6 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="font-medium">Back to All Albums</span>
          </button>
        )}

        {/* Albums Grid (only show when not in an album) */}
        {!currentAlbum && !loading && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-forest-800">📁 Albums</h2>
                {canManageAlbums && albums.length > 0 && !draggedPhotoId && (
                  <p className="text-xs text-gray-500 mt-1">💡 Drag photos onto albums to organize them</p>
                )}
              </div>
              {canManageAlbums && (
                <button
                  onClick={() => setShowAlbumModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-forest-100 hover:bg-forest-200 text-forest-800 rounded-lg transition-colors font-medium"
                >
                  <FolderPlus className="w-4 h-4" />
                  New Album
                </button>
              )}
            </div>

            {/* Drag and Drop Hint */}
            {canManageAlbums && albums.length > 0 && draggedPhotoId && (
              <div className="bg-gradient-to-r from-forest-100 to-ocean-100 border border-forest-300 rounded-lg p-3 mb-4 flex items-center gap-3">
                <ChevronRight className="w-5 h-5 text-forest-600 animate-pulse" />
                <p className="text-sm font-medium text-forest-800">
                  Drop photo on an album to organize it
                </p>
              </div>
            )}

            {albums.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
                {albums.map((album) => (
                  <div
                    key={album.id}
                    onDragOver={(e) => handleDragOver(e, album.id)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, album.id)}
                    onClick={() => handleAlbumClick(album)}
                    className={`flex flex-col items-center p-4 bg-white/80 backdrop-blur-sm rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border cursor-pointer group ${
                      dropTargetAlbumId === album.id 
                        ? 'border-forest-500 border-2 bg-forest-50 scale-105 shadow-2xl' 
                        : 'border-forest-200/50'
                    }`}
                  >
                    <Folder className={`w-16 h-16 transition-colors mb-2 ${
                      dropTargetAlbumId === album.id 
                        ? 'text-forest-600 scale-110' 
                        : 'text-forest-500 group-hover:text-forest-600'
                    }`} />
                    <span className="text-sm font-medium text-forest-800 text-center line-clamp-2">{album.name}</span>
                    <span className="text-xs text-gray-500 mt-1">{album.photoCount} photos</span>
                    {dropTargetAlbumId === album.id && draggedPhotoId && (
                      <span className="text-xs text-forest-600 font-semibold mt-2">📥 Drop here</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Current Album Header */}
        {currentAlbum && (
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-forest-800 mb-2">{currentAlbum.name}</h2>
            {currentAlbum.description && (
              <p className="text-forest-600">{currentAlbum.description}</p>
            )}
            <p className="text-sm text-gray-500 mt-2">{photos.length} photos</p>
          </div>
        )}

        {/* Unorganized Photos Header */}
        {!currentAlbum && !loading && photos.length > 0 && (
          <div className="mb-4">
            <h2 className="text-xl font-bold text-forest-800">📷 Unorganized Photos</h2>
            <p className="text-sm text-gray-600">Photos not yet organized into albums ({photos.length})</p>
          </div>
        )}

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
                isDraggable={canManageAlbums && !currentAlbum}
                isDragging={draggedPhotoId === photo.id}
                onDragStart={() => handleDragStart(photo.id)}
                onDragEnd={handleDragEnd}
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
                  Select Photos (up to 20)
                </label>
                <div className="border-2 border-dashed border-forest-300 rounded-xl p-8 text-center hover:border-forest-500 transition-colors cursor-pointer bg-gradient-to-br from-forest-50/30 to-ocean-50/30">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                    id="photo-upload"
                  />
                  <label htmlFor="photo-upload" className="cursor-pointer">
                    {uploadFiles.length > 0 ? (
                      <div className="space-y-2">
                        <Check className="w-12 h-12 mx-auto text-green-500" />
                        <p className="font-semibold text-forest-800">
                          {uploadFiles.length} photo{uploadFiles.length > 1 ? 's' : ''} selected
                        </p>
                        <p className="text-sm text-gray-600">
                          Total: {(uploadFiles.reduce((sum, f) => sum + f.size, 0) / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Upload className="w-12 h-12 mx-auto text-forest-500" />
                        <p className="font-semibold text-forest-800">Click to select photos</p>
                        <p className="text-sm text-gray-600">Select up to 20 photos • Max 10MB each</p>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              {/* Photo Previews */}
              {uploadFiles.length > 0 && (
                <div className="max-h-60 overflow-y-auto space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Selected Photos:
                  </label>
                  {uploadFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <ImageIcon className="w-5 h-5 text-forest-500 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                          <p className="text-xs text-gray-500">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="ml-2 p-1 hover:bg-gray-200 rounded transition-colors flex-shrink-0"
                        title="Remove"
                      >
                        <X className="w-4 h-4 text-gray-500" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title (optional)
                  {uploadFiles.length > 1 && (
                    <span className="text-xs text-gray-500 ml-2">
                      • Will use filenames if empty
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder={uploadFiles.length > 1 ? "Leave empty to use filenames" : "Give your photo a title"}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-transparent"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (optional)
                  {uploadFiles.length > 1 && (
                    <span className="text-xs text-gray-500 ml-2">
                      • Applied to all photos
                    </span>
                  )}
                </label>
                <textarea
                  value={uploadDescription}
                  onChange={(e) => setUploadDescription(e.target.value)}
                  placeholder={uploadFiles.length > 1 ? "Description for all photos" : "Tell us about this photo"}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-transparent resize-none"
                />
              </div>

              {/* Album Selection */}
              {albums.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Album (optional)
                  </label>
                  <select
                    value={selectedAlbumForUpload || ''}
                    onChange={(e) => setSelectedAlbumForUpload(e.target.value || null)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-transparent"
                  >
                    <option value="">No album (default)</option>
                    {albums.map((album) => (
                      <option key={album.id} value={album.id}>
                        📁 {album.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Info Note */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-blue-800 font-medium">Approval Required</p>
                    <p className="text-xs text-blue-700 mt-1">
                      {uploadFiles.length > 1 
                        ? `All ${uploadFiles.length} photos will be reviewed by den leaders before appearing in the gallery.`
                        : 'Your photo will be reviewed by den leaders before appearing in the gallery.'
                      } This helps keep our community safe and appropriate.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setUploadFiles([]);
                  setUploadTitle('');
                  setUploadDescription('');
                  setSelectedAlbumForUpload(null);
                }}
                disabled={uploading}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={uploadFiles.length === 0 || uploading}
                className="px-6 py-2 bg-gradient-to-r from-forest-500 to-ocean-500 text-white rounded-lg hover:from-forest-600 hover:to-ocean-600 transition-all duration-300 shadow-glow disabled:opacity-50 disabled:cursor-not-allowed font-semibold flex items-center gap-2"
              >
                {uploading && <Loader2 className="w-4 h-4 animate-spin" />}
                {uploading 
                  ? `Uploading ${uploadFiles.length} photo${uploadFiles.length > 1 ? 's' : ''}...` 
                  : `Upload ${uploadFiles.length} Photo${uploadFiles.length > 1 ? 's' : ''}`
                }
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Photo Detail Modal */}
      {selectedPhoto && (
        <PhotoDetailModal
          photo={selectedPhoto}
          albums={albums}
          onClose={() => setSelectedPhoto(null)}
          onApprove={handleApprove}
          onReject={handleReject}
          onDelete={handleDelete}
          onLike={handleLike}
          onMove={handleMovePhoto}
          onDownload={handleDownloadPhoto}
          canApprove={canApprove}
          canManageAlbums={canManageAlbums}
          currentUserId={currentUser?.uid}
        />
      )}

      {/* Create Album Modal */}
      {showAlbumModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-forest-800">📁 Create New Album</h3>
                <button
                  onClick={() => setShowAlbumModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Album Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Album Name *
                </label>
                <input
                  type="text"
                  value={albumName}
                  onChange={(e) => setAlbumName(e.target.value)}
                  placeholder="e.g., Summer Camp 2025"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-transparent"
                  autoFocus
                />
              </div>

              {/* Album Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (optional)
                </label>
                <textarea
                  value={albumDescription}
                  onChange={(e) => setAlbumDescription(e.target.value)}
                  placeholder="Describe what this album is for..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-transparent resize-none"
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowAlbumModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateAlbum}
                disabled={!albumName.trim()}
                className="px-6 py-2 bg-gradient-to-r from-forest-500 to-ocean-500 text-white rounded-lg hover:from-forest-600 hover:to-ocean-600 transition-all duration-300 shadow-glow disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
              >
                Create Album
              </button>
            </div>
          </div>
        </div>
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
  isDraggable?: boolean;
  isDragging?: boolean;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}

const PhotoCard: React.FC<PhotoCardProps> = ({ 
  photo, 
  viewMode, 
  onSelect, 
  onLike, 
  canApprove, 
  currentUserId,
  isDraggable = false,
  isDragging = false,
  onDragStart,
  onDragEnd
}) => {
  const statusBadge = getStatusBadge(photo.status);
  const StatusIcon = statusBadge.icon;
  const hasLiked = currentUserId ? photo.likedBy.includes(currentUserId) : false;

  if (viewMode === 'list') {
    return (
      <div 
        draggable={isDraggable}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        className={`bg-white/80 backdrop-blur-sm rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-forest-200/50 ${
          isDragging ? 'opacity-50 scale-95' : ''
        } ${isDraggable ? 'cursor-move' : ''}`}
      >
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
      draggable={isDraggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={`bg-white/80 backdrop-blur-sm rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group border border-forest-200/50 ${
        isDragging ? 'opacity-50 scale-95 cursor-grabbing' : isDraggable ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'
      }`}
      onClick={() => onSelect(photo)}
    >
      <div className="relative aspect-square overflow-hidden bg-forest-100">
        {isDragging && (
          <div className="absolute inset-0 bg-forest-500/30 backdrop-blur-sm flex items-center justify-center z-10">
            <span className="text-white font-semibold text-sm">Moving...</span>
          </div>
        )}
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
  albums: GalleryAlbum[];
  onClose: () => void;
  onApprove: (photoId: string) => void;
  onReject: (photoId: string, reason?: string) => void;
  onDelete: (photoId: string) => void;
  onLike: (photoId: string) => void;
  onMove: (photoId: string, targetAlbumId: string | null) => void;
  onDownload: (photo: GalleryPhoto) => void;
  canApprove: boolean;
  canManageAlbums: boolean;
  currentUserId?: string;
}

const PhotoDetailModal: React.FC<PhotoDetailModalProps> = ({
  photo,
  albums,
  onClose,
  onApprove,
  onReject,
  onDelete,
  onLike,
  onMove,
  onDownload,
  canApprove,
  canManageAlbums,
  currentUserId
}) => {
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [showMoveForm, setShowMoveForm] = useState(false);
  const [targetAlbumId, setTargetAlbumId] = useState<string | null>(photo.albumId || null);
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

            {/* Move to Album (Den Leaders+) */}
            {canManageAlbums && albums.length > 0 && (
              <div className="bg-forest-50 border border-forest-200 rounded-lg p-4 mb-4">
                <h4 className="font-semibold text-forest-900 mb-3 flex items-center gap-2">
                  <Folder className="w-4 h-4" />
                  Organize Photo
                </h4>
                {!showMoveForm ? (
                  <button
                    onClick={() => setShowMoveForm(true)}
                    className="w-full px-4 py-2 bg-forest-100 hover:bg-forest-200 text-forest-800 rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    <ChevronRight className="w-4 h-4" />
                    Move to Album
                  </button>
                ) : (
                  <div className="space-y-3">
                    <select
                      value={targetAlbumId || ''}
                      onChange={(e) => setTargetAlbumId(e.target.value || null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-transparent text-sm"
                    >
                      <option value="">No album</option>
                      {albums.map((album) => (
                        <option key={album.id} value={album.id}>
                          📁 {album.name}
                        </option>
                      ))}
                    </select>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          onMove(photo.id, targetAlbumId);
                          setShowMoveForm(false);
                        }}
                        disabled={targetAlbumId === (photo.albumId || null)}
                        className="flex-1 px-4 py-2 bg-forest-600 text-white rounded-lg hover:bg-forest-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Move Photo
                      </button>
                      <button
                        onClick={() => {
                          setShowMoveForm(false);
                          setTargetAlbumId(photo.albumId || null);
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

            {/* Download Button */}
            <button
              onClick={() => onDownload(photo)}
              className="w-full px-4 py-2 bg-gradient-to-r from-ocean-500 to-forest-500 text-white rounded-lg hover:from-ocean-600 hover:to-forest-600 transition-all duration-300 shadow-glow font-semibold flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              Save Photo
            </button>

            {/* Delete Button for Owner or Admin */}
            {(isOwner || canApprove) && (
              <button
                onClick={() => onDelete(photo.id)}
                className="w-full px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors font-semibold flex items-center justify-center gap-2 mt-3"
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

