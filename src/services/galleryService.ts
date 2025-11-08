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
import { GalleryPhoto, PhotoStatus, PhotoUploadRequest, PhotoApprovalAction } from '../types/gallery';

class GalleryService {
  private collectionName = 'gallery-photos';

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
        tags: uploadRequest.tags || [],
        eventId: uploadRequest.eventId || null,
        denId: uploadRequest.denId || null,
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
        tags: doc.data().tags || [],
        eventId: doc.data().eventId,
        denId: doc.data().denId,
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      }));
    } catch (error: any) {
      console.error('Error getting photos:', error);
      throw error;
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
   * Increment view count
   */
  async incrementViewCount(photoId: string): Promise<void> {
    try {
      const photoRef = doc(db, this.collectionName, photoId);
      await updateDoc(photoRef, {
        viewCount: increment(1)
      });
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

