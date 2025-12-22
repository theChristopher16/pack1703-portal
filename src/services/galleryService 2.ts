import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit as firestoreLimit,
  getDocs,
  getDoc,
  serverTimestamp,
  increment,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import { db, storage } from '../firebase/config';
import { authService, UserRole } from './authService';
import { GalleryPhoto, GalleryAlbum, PhotoStatus, PhotoUploadRequest, PhotoApprovalAction } from '../types/gallery';

class GalleryService {
  private collectionName = 'gallery-photos';
  private albumsCollectionName = 'gallery-albums';

  /**
   * Upload a photo to the gallery
   */
  async uploadPhoto(organizationId: string, uploadRequest: PhotoUploadRequest): Promise<string> {
    try {
      const currentUser = authService.getCurrentUser();
      if (!currentUser) {
        throw new Error('User must be authenticated to upload photos');
      }

      console.log('📤 Uploading photo:', uploadRequest.file.name);

      // Generate unique filename
      const timestamp = Date.now();
      const fileName = `${timestamp}_${uploadRequest.file.name}`;
      const storagePath = `organizations/${organizationId}/gallery/${fileName}`;

      // Upload file to Firebase Storage
      const storageRef = ref(storage, storagePath);
      const snapshot = await uploadBytes(storageRef, uploadRequest.file);
      const imageUrl = await getDownloadURL(snapshot.ref);

      console.log('✅ Photo uploaded to storage:', imageUrl);

      // Get image dimensions
      const dimensions = await this.getImageDimensions(uploadRequest.file);

      // Create photo document in Firestore
      const photoData = {
        organizationId,
        title: uploadRequest.title || '',
        description: uploadRequest.description || '',
        imageUrl,
        storagePath,
        uploadedBy: currentUser.uid,
        uploaderName: currentUser.displayName || currentUser.email,
        uploaderEmail: currentUser.email,
        uploadedAt: serverTimestamp(),
        status: PhotoStatus.PENDING, // Pending approval by default
        fileSize: uploadRequest.file.size,
        fileType: uploadRequest.file.type,
        dimensions,
        likes: 0,
        likedBy: [],
        viewCount: 0,
        viewedBy: [],
        tags: uploadRequest.tags || [],
        eventId: uploadRequest.eventId || null,
        denId: uploadRequest.denId || null,
        albumId: uploadRequest.albumId || null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, this.collectionName), photoData);
      console.log('✅ Photo document created:', docRef.id);

      return docRef.id;
    } catch (error: any) {
      console.error('Error uploading photo:', error);
      throw new Error(`Failed to upload photo: ${error.message}`);
    }
  }

  /**
   * Get image dimensions from file
   */
  private getImageDimensions(file: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve({ width: img.width, height: img.height });
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load image'));
      };
      
      img.src = url;
    });
  }

  /**
   * Get photos for an organization
   */
  async getPhotos(organizationId: string, status?: PhotoStatus, limitCount: number = 50): Promise<GalleryPhoto[]> {
    try {
      console.log('📸 GalleryService: getPhotos called with organizationId:', organizationId, 'status:', status);
      
      const currentUser = authService.getCurrentUser();
      if (!currentUser) {
        console.error('📸 GalleryService: No current user');
        throw new Error('User must be authenticated');
      }
      
      console.log('📸 GalleryService: Current user:', currentUser.email);

      // Build query
      console.log('📸 GalleryService: Building query for collection:', this.collectionName);
      let q = query(
        collection(db, this.collectionName),
        where('organizationId', '==', organizationId)
      );

      // Filter by status
      if (status) {
        console.log('📸 GalleryService: Filtering by status:', status);
        q = query(q, where('status', '==', status));
      } else {
        // Regular users only see approved photos
        const canSeeAllPhotos = authService.hasAnyRole([
          UserRole.DEN_LEADER,
          UserRole.ADMIN,
          UserRole.SUPER_ADMIN,
          UserRole.COPSE_ADMIN
        ]);

        console.log('📸 GalleryService: canSeeAllPhotos:', canSeeAllPhotos);

        if (!canSeeAllPhotos) {
          console.log('📸 GalleryService: User can only see approved photos');
          q = query(q, where('status', '==', PhotoStatus.APPROVED));
        } else {
          console.log('📸 GalleryService: User can see all photos');
        }
      }

      // Order by upload date (newest first)
      q = query(q, orderBy('uploadedAt', 'desc'), firestoreLimit(limitCount));

      console.log('📸 GalleryService: Executing query...');
      const snapshot = await getDocs(q);
      console.log('📸 GalleryService: Query returned', snapshot.size, 'documents');
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        organizationId: doc.data().organizationId,
        title: doc.data().title,
        description: doc.data().description,
        imageUrl: doc.data().imageUrl,
        thumbnailUrl: doc.data().thumbnailUrl,
        storagePath: doc.data().storagePath,
        uploadedBy: doc.data().uploadedBy,
        uploaderName: doc.data().uploaderName,
        uploaderEmail: doc.data().uploaderEmail,
        uploadedAt: doc.data().uploadedAt?.toDate(),
        status: doc.data().status,
        approvedBy: doc.data().approvedBy,
        approverName: doc.data().approverName,
        approvedAt: doc.data().approvedAt?.toDate(),
        rejectedBy: doc.data().rejectedBy,
        rejectedAt: doc.data().rejectedAt?.toDate(),
        rejectionReason: doc.data().rejectionReason,
        fileSize: doc.data().fileSize,
        fileType: doc.data().fileType,
        dimensions: doc.data().dimensions,
        likes: doc.data().likes || 0,
        likedBy: doc.data().likedBy || [],
        viewCount: doc.data().viewCount || 0,
        viewedBy: doc.data().viewedBy || [],
        tags: doc.data().tags || [],
        eventId: doc.data().eventId,
        denId: doc.data().denId,
        albumId: doc.data().albumId,
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      }));
    } catch (error: any) {
      console.error('Error getting photos:', error);
      throw error;
    }
  }

  /**
   * Create a new album (den leader and above)
   */
  async createAlbum(
    organizationId: string,
    name: string,
    description?: string,
    denId?: string,
    denName?: string,
    parentAlbumId?: string
  ): Promise<string> {
    try {
      const currentUser = authService.getCurrentUser();
      if (!currentUser) {
        throw new Error('User must be authenticated');
      }

      const canCreateAlbum = authService.hasAnyRole([
        UserRole.DEN_LEADER,
        UserRole.ADMIN,
        UserRole.SUPER_ADMIN,
        UserRole.COPSE_ADMIN
      ]);

      if (!canCreateAlbum) {
        throw new Error('Only den leaders and above can create albums');
      }

      const albumData = {
        organizationId,
        name,
        description: description || '',
        coverPhotoId: null,
        photoCount: 0,
        denId: denId || null,
        denName: denName || null,
        parentAlbumId: parentAlbumId || null,
        createdBy: currentUser.uid,
        createdByName: currentUser.displayName || currentUser.email,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        sortOrder: 0
      };

      const docRef = await addDoc(collection(db, this.albumsCollectionName), albumData);
      console.log('✅ Album created:', docRef.id);

      return docRef.id;
    } catch (error: any) {
      console.error('Error creating album:', error);
      throw error;
    }
  }

  /**
   * Get albums for an organization
   */
  async getAlbums(organizationId: string, parentAlbumId?: string | null): Promise<GalleryAlbum[]> {
    try {
      let q = query(
        collection(db, this.albumsCollectionName),
        where('organizationId', '==', organizationId)
      );

      // Filter by parent album if specified (for sub-folders)
      if (parentAlbumId !== undefined) {
        q = query(q, where('parentAlbumId', '==', parentAlbumId));
      }

      q = query(q, orderBy('sortOrder', 'asc'), orderBy('createdAt', 'desc'));

      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        organizationId: doc.data().organizationId,
        name: doc.data().name,
        description: doc.data().description,
        coverPhotoId: doc.data().coverPhotoId,
        photoCount: doc.data().photoCount || 0,
        denId: doc.data().denId,
        denName: doc.data().denName,
        parentAlbumId: doc.data().parentAlbumId,
        createdBy: doc.data().createdBy,
        createdByName: doc.data().createdByName,
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
        sortOrder: doc.data().sortOrder || 0
      }));
    } catch (error: any) {
      console.error('Error getting albums:', error);
      throw error;
    }
  }

  /**
   * Update album
   */
  async updateAlbum(
    albumId: string,
    updates: Partial<{
      name: string;
      description: string;
      denId: string;
      denName: string;
      sortOrder: number;
    }>
  ): Promise<void> {
    try {
      const currentUser = authService.getCurrentUser();
      if (!currentUser) {
        throw new Error('User must be authenticated');
      }

      const canUpdate = authService.hasAnyRole([
        UserRole.DEN_LEADER,
        UserRole.ADMIN,
        UserRole.SUPER_ADMIN,
        UserRole.COPSE_ADMIN
      ]);

      if (!canUpdate) {
        throw new Error('Only den leaders and above can update albums');
      }

      const albumRef = doc(db, this.albumsCollectionName, albumId);
      await updateDoc(albumRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });

      console.log('✅ Album updated:', albumId);
    } catch (error: any) {
      console.error('Error updating album:', error);
      throw error;
    }
  }

  /**
   * Delete album (and optionally reassign photos)
   */
  async deleteAlbum(albumId: string, movePhotosToAlbumId?: string | null): Promise<void> {
    try {
      const currentUser = authService.getCurrentUser();
      if (!currentUser) {
        throw new Error('User must be authenticated');
      }

      const canDelete = authService.hasAnyRole([
        UserRole.ADMIN,
        UserRole.SUPER_ADMIN,
        UserRole.COPSE_ADMIN
      ]);

      if (!canDelete) {
        throw new Error('Only admins can delete albums');
      }

      // Get photos in this album
      const photosQuery = query(
        collection(db, this.collectionName),
        where('albumId', '==', albumId)
      );
      const photosSnapshot = await getDocs(photosQuery);

      // Update photos to move them or remove album association
      const updatePromises = photosSnapshot.docs.map(photoDoc =>
        updateDoc(doc(db, this.collectionName, photoDoc.id), {
          albumId: movePhotosToAlbumId || null,
          updatedAt: serverTimestamp()
        })
      );
      await Promise.all(updatePromises);

      // Delete the album
      await deleteDoc(doc(db, this.albumsCollectionName, albumId));
      console.log('✅ Album deleted:', albumId);
    } catch (error: any) {
      console.error('Error deleting album:', error);
      throw error;
    }
  }

  /**
   * Update album photo count
   */
  async updateAlbumPhotoCount(albumId: string): Promise<void> {
    try {
      const photosQuery = query(
        collection(db, this.collectionName),
        where('albumId', '==', albumId),
        where('status', '==', PhotoStatus.APPROVED)
      );
      const snapshot = await getDocs(photosQuery);

      const albumRef = doc(db, this.albumsCollectionName, albumId);
      await updateDoc(albumRef, {
        photoCount: snapshot.size,
        updatedAt: serverTimestamp()
      });
    } catch (error: any) {
      console.error('Error updating album photo count:', error);
      // Don't throw - this is a non-critical operation
    }
  }

  /**
   * Approve a photo (den leader and above)
   */
  async approvePhoto(photoId: string): Promise<void> {
    try {
      const currentUser = authService.getCurrentUser();
      if (!currentUser) {
        throw new Error('User must be authenticated');
      }

      // Check permissions
      const canApprove = authService.hasAnyRole([
        UserRole.DEN_LEADER,
        UserRole.ADMIN,
        UserRole.SUPER_ADMIN,
        UserRole.COPSE_ADMIN
      ]);

      if (!canApprove) {
        throw new Error('Only den leaders and above can approve photos');
      }

      const photoRef = doc(db, this.collectionName, photoId);
      await updateDoc(photoRef, {
        status: PhotoStatus.APPROVED,
        approvedBy: currentUser.uid,
        approverName: currentUser.displayName || currentUser.email,
        approvedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      console.log('✅ Photo approved:', photoId);
    } catch (error: any) {
      console.error('Error approving photo:', error);
      throw error;
    }
  }

  /**
   * Reject a photo (den leader and above)
   */
  async rejectPhoto(photoId: string, reason?: string): Promise<void> {
    try {
      const currentUser = authService.getCurrentUser();
      if (!currentUser) {
        throw new Error('User must be authenticated');
      }

      // Check permissions
      const canReject = authService.hasAnyRole([
        UserRole.DEN_LEADER,
        UserRole.ADMIN,
        UserRole.SUPER_ADMIN,
        UserRole.COPSE_ADMIN
      ]);

      if (!canReject) {
        throw new Error('Only den leaders and above can reject photos');
      }

      const photoRef = doc(db, this.collectionName, photoId);
      await updateDoc(photoRef, {
        status: PhotoStatus.REJECTED,
        rejectedBy: currentUser.uid,
        rejectedAt: serverTimestamp(),
        rejectionReason: reason || 'Not approved',
        updatedAt: serverTimestamp()
      });

      console.log('✅ Photo rejected:', photoId);
    } catch (error: any) {
      console.error('Error rejecting photo:', error);
      throw error;
    }
  }

  /**
   * Delete a photo (uploader or admin)
   */
  async deletePhoto(photoId: string): Promise<void> {
    try {
      const currentUser = authService.getCurrentUser();
      if (!currentUser) {
        throw new Error('User must be authenticated');
      }

      // Get photo document
      const photoDoc = await getDoc(doc(db, this.collectionName, photoId));
      if (!photoDoc.exists()) {
        throw new Error('Photo not found');
      }

      const photoData = photoDoc.data();

      // Check permissions - owner or admin can delete
      const isOwner = photoData.uploadedBy === currentUser.uid;
      const isAdmin = authService.hasAnyRole([
        UserRole.ADMIN,
        UserRole.SUPER_ADMIN,
        UserRole.COPSE_ADMIN
      ]);

      if (!isOwner && !isAdmin) {
        throw new Error('Only the uploader or admins can delete photos');
      }

      // Delete from Storage
      const storageRef = ref(storage, photoData.storagePath);
      await deleteObject(storageRef);
      console.log('✅ Photo deleted from storage');

      // Delete from Firestore
      await deleteDoc(doc(db, this.collectionName, photoId));
      console.log('✅ Photo document deleted');
    } catch (error: any) {
      console.error('Error deleting photo:', error);
      throw error;
    }
  }

  /**
   * Like/unlike a photo
   */
  async toggleLike(photoId: string): Promise<void> {
    try {
      const currentUser = authService.getCurrentUser();
      if (!currentUser) {
        throw new Error('User must be authenticated');
      }

      const photoRef = doc(db, this.collectionName, photoId);
      const photoDoc = await getDoc(photoRef);
      
      if (!photoDoc.exists()) {
        throw new Error('Photo not found');
      }

      const likedBy = photoDoc.data().likedBy || [];
      const hasLiked = likedBy.includes(currentUser.uid);

      if (hasLiked) {
        // Unlike
        await updateDoc(photoRef, {
          likes: increment(-1),
          likedBy: arrayRemove(currentUser.uid),
          updatedAt: serverTimestamp()
        });
      } else {
        // Like
        await updateDoc(photoRef, {
          likes: increment(1),
          likedBy: arrayUnion(currentUser.uid),
          updatedAt: serverTimestamp()
        });
      }
    } catch (error: any) {
      console.error('Error toggling like:', error);
      throw error;
    }
  }

  /**
   * Increment view count (once per user)
   */
  async incrementViewCount(photoId: string): Promise<void> {
    try {
      const currentUser = authService.getCurrentUser();
      if (!currentUser) {
        return; // Don't track views for non-authenticated users
      }

      const photoRef = doc(db, this.collectionName, photoId);
      const photoDoc = await getDoc(photoRef);
      
      if (!photoDoc.exists()) {
        return;
      }

      const viewedBy = photoDoc.data().viewedBy || [];
      
      // Only increment if user hasn't viewed this photo before
      if (!viewedBy.includes(currentUser.uid)) {
        await updateDoc(photoRef, {
          viewCount: increment(1),
          viewedBy: arrayUnion(currentUser.uid)
        });
        console.log('📸 Gallery: View counted for user', currentUser.uid);
      } else {
        console.log('📸 Gallery: User has already viewed this photo');
      }
    } catch (error: any) {
      console.error('Error incrementing view count:', error);
      // Don't throw - this is a non-critical operation
    }
  }

  /**
   * Get pending photos count (for den leaders)
   */
  async getPendingCount(organizationId: string): Promise<number> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('organizationId', '==', organizationId),
        where('status', '==', PhotoStatus.PENDING)
      );

      const snapshot = await getDocs(q);
      return snapshot.size;
    } catch (error: any) {
      console.error('Error getting pending count:', error);
      return 0;
    }
  }

  /**
   * Check if current user can approve photos
   */
  canApprovePhotos(): boolean {
    return authService.hasAnyRole([
      UserRole.DEN_LEADER,
      UserRole.ADMIN,
      UserRole.SUPER_ADMIN,
      UserRole.COPSE_ADMIN
    ]);
  }
}

export const galleryService = new GalleryService();
export default galleryService;

