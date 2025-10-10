import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc, 
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../firebase/config';
import { authService } from './authService';

export interface Resource {
  id: string;
  title: string;
  description: string;
  category: ResourceCategory;
  tags: string[];
  url?: string;
  fileName?: string;
  fileType?: 'pdf' | 'doc' | 'docx' | 'xls' | 'xlsx' | 'ppt' | 'pptx' | 'image' | 'zip' | 'txt';
  fileSize?: number;
  isActive: boolean;
  isPublic: boolean;
  createdBy: string;
  createdByName: string;
  createdAt: Date;
  lastUpdated: Date;
  downloadCount: number;
  likeCount?: number;
  isLikedByCurrentUser?: boolean; // Client-side only field
  allowSubmissions?: boolean; // Allow parents to submit completed forms
}

export interface ResourceSubmission {
  id: string;
  resourceId: string;
  resourceTitle: string;
  submittedBy: string;
  submittedByName: string;
  submittedByEmail: string;
  submittedAt: Date;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string;
  reviewedByName?: string;
  reviewedAt?: Date;
  reviewNotes?: string;
  eventId?: string; // Optional: Link to specific event if this is event-related paperwork
  rsvpId?: string; // Optional: Link to RSVP if this validates event attendance
}

export type ResourceCategory = 
  | 'packing-list' 
  | 'medical' 
  | 'policy' 
  | 'guide' 
  | 'form' 
  | 'reference'
  | 'scout-handbook'
  | 'advancement'
  | 'safety'
  | 'camping'
  | 'hiking'
  | 'cooking'
  | 'crafts'
  | 'games'
  | 'ceremonies'
  | 'leadership'
  | 'fundraising'
  | 'uniform'
  | 'awards'
  | 'outdoor-skills'
  | 'environmental'
  | 'community-service'
  | 'parent-resources'
  | 'den-specific'
  | 'pack-specific'
  | 'district'
  | 'council'
  | 'national';

class ResourceService {
  private get currentUser() {
    return authService.getCurrentUser();
  }

  // Check if user can manage resources (den leaders and up, NOT parents)
  canManageResources(user?: any): boolean {
    const userToCheck = user || this.currentUser;
    if (!userToCheck) {
      console.log('🚫 No user provided to canManageResources');
      return false;
    }
    
    // Debug logging - show the full user object structure
    console.log('🔍 ResourceService.canManageResources Debug:', {
      userToCheck: userToCheck,
      role: userToCheck.role,
      isAdmin: userToCheck.isAdmin,
      isDenLeader: userToCheck.isDenLeader,
      uid: userToCheck.uid,
      email: userToCheck.email,
      displayName: userToCheck.displayName,
      fullUserObject: userToCheck
    });
    
    // Explicitly exclude parents - only allow den leaders and up
    if (userToCheck.role === 'parent') {
      console.log('🚫 User is parent - denying resource management');
      return false;
    }
    
    // Allow volunteers (den leaders), admins, and super admins
    const allowedRoles = ['volunteer', 'admin', 'super-admin', 'super_admin', 'root', 'moderator', 'content-admin'];
    
    // Check if user has an allowed role
    const hasAllowedRole = allowedRoles.includes(userToCheck.role);
    
    // Check admin flags, but only if NOT a parent
    const hasAdminFlags = (userToCheck.isAdmin === true || userToCheck.isDenLeader === true) && userToCheck.role !== 'parent';
    
    const result = hasAllowedRole || hasAdminFlags;
    console.log('🔍 ResourceService result:', {
      hasAllowedRole,
      hasAdminFlags,
      result
    });
    
    return result;
  }

  // Get all resources
  async getResources(filters?: {
    category?: ResourceCategory;
    isActive?: boolean;
    isPublic?: boolean;
    createdBy?: string;
  }): Promise<Resource[]> {
    try {
      const resourcesRef = collection(db, 'resources');
      let q = query(resourcesRef, orderBy('lastUpdated', 'desc'));

      if (filters?.isActive !== undefined) {
        q = query(q, where('isActive', '==', filters.isActive));
      }

      if (filters?.category) {
        q = query(q, where('category', '==', filters.category));
      }

      if (filters?.isPublic !== undefined) {
        q = query(q, where('isPublic', '==', filters.isPublic));
      }

      if (filters?.createdBy) {
        q = query(q, where('createdBy', '==', filters.createdBy));
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        lastUpdated: doc.data().lastUpdated?.toDate() || new Date(),
      })) as Resource[];
    } catch (error) {
      console.error('Error fetching resources:', error);
      throw error;
    }
  }

  // Get resource by ID
  async getResourceById(id: string): Promise<Resource | null> {
    try {
      const resourceRef = doc(db, 'resources', id);
      const resourceDoc = await getDoc(resourceRef);
      
      if (!resourceDoc.exists()) {
        return null;
      }

      return {
        id: resourceDoc.id,
        ...resourceDoc.data(),
        createdAt: resourceDoc.data().createdAt?.toDate() || new Date(),
        lastUpdated: resourceDoc.data().lastUpdated?.toDate() || new Date(),
      } as Resource;
    } catch (error) {
      console.error('Error fetching resource:', error);
      throw error;
    }
  }

  // Create new resource
  async createResource(resourceData: Omit<Resource, 'id' | 'createdAt' | 'lastUpdated' | 'downloadCount'>, file?: File, currentUser?: any): Promise<string> {
    console.log('🔍 createResource called:', { resourceData, hasFile: !!file, fileName: file?.name });
    
    const user = currentUser || this.currentUser;
    if (!this.canManageResources(user)) {
      console.log('🚫 User cannot manage resources');
      throw new Error('Only den leaders and up can create resources');
    }

    try {
      if (!user) {
        console.log('🚫 No authenticated user');
        throw new Error('User must be authenticated');
      }

      let fileUrl: string | undefined;
      let fileName: string | undefined;
      let fileSize: number | undefined;

      // Upload file if provided
      if (file) {
        console.log('📁 Uploading file:', {
          name: file.name,
          size: file.size,
          type: file.type
        });
        
        const fileExtension = file.name.split('.').pop();
        const storageFileName = `resources/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExtension}`;
        console.log('📁 Storage path:', storageFileName);
        
        const fileRef = ref(storage, storageFileName);
        
        await uploadBytes(fileRef, file);
        console.log('✅ File uploaded to storage');
        
        fileUrl = await getDownloadURL(fileRef);
        console.log('🔗 Download URL:', fileUrl);
        
        fileName = file.name;
        fileSize = file.size;
      }

      const newResource: any = {
        ...resourceData,
        createdBy: user.uid,
        createdByName: user.displayName || user.email || 'Unknown',
        createdAt: serverTimestamp(),
        lastUpdated: serverTimestamp(),
        downloadCount: 0,
        likeCount: 0,
        isActive: true,
      };

      // Only add file-related fields if a file was uploaded
      if (file) {
        newResource.fileName = fileName;
        newResource.url = fileUrl;  // Changed from fileUrl to url
        newResource.fileSize = fileSize;
      }

      const docRef = await addDoc(collection(db, 'resources'), newResource);
      return docRef.id;
    } catch (error) {
      console.error('Error creating resource:', error);
      throw error;
    }
  }

  // Update resource
  async updateResource(id: string, updates: Partial<Resource>, file?: File): Promise<void> {
    console.log('🔍 updateResource called:', { id, updates, hasFile: !!file, fileName: file?.name });
    
    if (!this.canManageResources()) {
      console.log('🚫 User cannot manage resources');
      throw new Error('Only den leaders and up can update resources');
    }

    try {
      const user = this.currentUser;
      if (!user) {
        console.log('🚫 No authenticated user');
        throw new Error('User must be authenticated');
      }

      // Get current resource to check if user can modify it
      const currentResource = await this.getResourceById(id);
      if (!currentResource) {
        console.log('🚫 Resource not found');
        throw new Error('Resource not found');
      }

      console.log('🔍 Current resource:', {
        id: currentResource.id,
        title: currentResource.title,
        createdBy: currentResource.createdBy,
        url: currentResource.url
      });

      // Only allow creator or admin+ to modify
      const isCreator = currentResource.createdBy === user.uid;
      const isAdmin = ['admin', 'super-admin', 'super_admin', 'root'].includes(user.role || '');
      
      console.log('🔍 Update permission check:', {
        isCreator,
        isAdmin,
        userRole: user.role,
        creatorId: currentResource.createdBy,
        userId: user.uid
      });

      if (!isCreator && !isAdmin) {
        console.log('🚫 User lacks permission to update');
        throw new Error('Only the creator or admin can modify this resource');
      }

      let fileUrl = updates.url;
      let fileName = updates.fileName;
      let fileSize = updates.fileSize;

      // Upload new file if provided
      if (file) {
        console.log('📁 Uploading new file:', {
          name: file.name,
          size: file.size,
          type: file.type
        });
        
        // Delete old file if exists
        if (currentResource.url) {
          console.log('🗑️ Deleting old file:', currentResource.url);
          try {
            const oldFileRef = ref(storage, currentResource.url);
            await deleteObject(oldFileRef);
            console.log('✅ Old file deleted');
          } catch (error) {
            console.warn('Could not delete old file:', error);
          }
        }

        const fileExtension = file.name.split('.').pop();
        const newFileName = `resources/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExtension}`;
        console.log('📁 New storage path:', newFileName);
        
        const fileRef = ref(storage, newFileName);
        
        await uploadBytes(fileRef, file);
        console.log('✅ New file uploaded to storage');
        
        fileUrl = await getDownloadURL(fileRef);
        console.log('🔗 New download URL:', fileUrl);
        
        fileName = file.name;
        fileSize = file.size;
      }

      const updateData: any = {
        ...updates,
        fileName,
        url: fileUrl,
        fileSize,
        lastUpdated: serverTimestamp(),
      };

      // Remove undefined values
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) {
          delete updateData[key];
        }
      });

      const resourceRef = doc(db, 'resources', id);
      await updateDoc(resourceRef, updateData);
    } catch (error) {
      console.error('Error updating resource:', error);
      throw error;
    }
  }

  // Delete resource
  async deleteResource(id: string, currentUser?: any): Promise<void> {
    console.log('🔍 deleteResource called with id:', id);
    
    if (!this.canManageResources(currentUser)) {
      console.log('🚫 User cannot manage resources');
      throw new Error('Only den leaders and up can delete resources');
    }

    try {
      const user = currentUser || this.currentUser;
      if (!user) {
        console.log('🚫 No authenticated user');
        throw new Error('User must be authenticated');
      }

      console.log('🔍 Current user:', {
        uid: user.uid,
        role: user.role,
        email: user.email
      });

      // Get current resource to check if user can delete it
      const currentResource = await this.getResourceById(id);
      if (!currentResource) {
        console.log('🚫 Resource not found');
        throw new Error('Resource not found');
      }

      console.log('🔍 Resource to delete:', {
        id: currentResource.id,
        title: currentResource.title,
        createdBy: currentResource.createdBy,
        url: currentResource.url
      });

      // Only allow creator or admin+ to delete
      const isCreator = currentResource.createdBy === user.uid;
      const isAdmin = ['admin', 'super-admin', 'super_admin', 'root'].includes(user.role || '');
      
      console.log('🔍 Delete permission check:', {
        isCreator,
        isAdmin,
        userRole: user.role,
        creatorId: currentResource.createdBy,
        userId: user.uid
      });

      if (!isCreator && !isAdmin) {
        console.log('🚫 User lacks permission to delete');
        throw new Error('Only the creator or admin can delete this resource');
      }

      // Delete associated file if exists
      if (currentResource.url) {
        try {
          const fileRef = ref(storage, currentResource.url);
          await deleteObject(fileRef);
        } catch (error) {
          console.warn('Could not delete file:', error);
        }
      }

      // Delete resource document
      const resourceRef = doc(db, 'resources', id);
      await deleteDoc(resourceRef);
    } catch (error) {
      console.error('Error deleting resource:', error);
      throw error;
    }
  }

  // Increment download count
  async incrementDownloadCount(id: string): Promise<void> {
    try {
      const resourceRef = doc(db, 'resources', id);
      const resourceDoc = await getDoc(resourceRef);
      
      if (resourceDoc.exists()) {
        const currentCount = resourceDoc.data().downloadCount || 0;
        await updateDoc(resourceRef, {
          downloadCount: currentCount + 1,
          lastUpdated: serverTimestamp(),
        });
      }
    } catch (error) {
      console.error('Error incrementing download count:', error);
      // Don't throw error for download count issues
    }
  }

  // Like a resource
  async likeResource(resourceId: string): Promise<void> {
    const user = authService.getCurrentUser();
    if (!user) {
      throw new Error('User must be authenticated to like resources');
    }

    try {
      // Add to user-resource-likes collection
      const likeRef = doc(db, 'user-resource-likes', `${user.uid}_${resourceId}`);
      await updateDoc(likeRef, {
        userId: user.uid,
        resourceId: resourceId,
        likedAt: serverTimestamp()
      }).catch(async () => {
        // Document doesn't exist, create it
        await addDoc(collection(db, 'user-resource-likes'), {
          userId: user.uid,
          resourceId: resourceId,
          likedAt: serverTimestamp()
        });
      });

      // Increment like count on resource
      const resourceRef = doc(db, 'resources', resourceId);
      const resourceDoc = await getDoc(resourceRef);
      
      if (resourceDoc.exists()) {
        const currentCount = resourceDoc.data().likeCount || 0;
        await updateDoc(resourceRef, {
          likeCount: currentCount + 1,
          lastUpdated: serverTimestamp(),
        });
      }
    } catch (error) {
      console.error('Error liking resource:', error);
      throw error;
    }
  }

  // Unlike a resource
  async unlikeResource(resourceId: string): Promise<void> {
    const user = authService.getCurrentUser();
    if (!user) {
      throw new Error('User must be authenticated to unlike resources');
    }

    try {
      // Remove from user-resource-likes collection
      const likeRef = doc(db, 'user-resource-likes', `${user.uid}_${resourceId}`);
      await deleteDoc(likeRef);

      // Decrement like count on resource
      const resourceRef = doc(db, 'resources', resourceId);
      const resourceDoc = await getDoc(resourceRef);
      
      if (resourceDoc.exists()) {
        const currentCount = resourceDoc.data().likeCount || 0;
        await updateDoc(resourceRef, {
          likeCount: Math.max(0, currentCount - 1),
          lastUpdated: serverTimestamp(),
        });
      }
    } catch (error) {
      console.error('Error unliking resource:', error);
      throw error;
    }
  }

  // Check if current user has liked a resource
  async isResourceLiked(resourceId: string): Promise<boolean> {
    const user = authService.getCurrentUser();
    if (!user) return false;

    try {
      const likeRef = doc(db, 'user-resource-likes', `${user.uid}_${resourceId}`);
      const likeDoc = await getDoc(likeRef);
      return likeDoc.exists();
    } catch (error) {
      console.error('Error checking if resource is liked:', error);
      return false;
    }
  }

  // Get resources with like status for current user
  async getResourcesWithLikeStatus(filters?: {
    category?: ResourceCategory;
    isActive?: boolean;
    isPublic?: boolean;
    createdBy?: string;
  }): Promise<Resource[]> {
    try {
      const resources = await this.getResources(filters);
      const user = authService.getCurrentUser();
      
      if (!user) {
        return resources;
      }

      // Get all liked resource IDs for current user
      const likesQuery = query(
        collection(db, 'user-resource-likes'),
        where('userId', '==', user.uid)
      );
      const likesSnapshot = await getDocs(likesQuery);
      const likedResourceIds = new Set(
        likesSnapshot.docs.map(doc => doc.data().resourceId)
      );

      // Add isLikedByCurrentUser flag to each resource
      return resources.map(resource => ({
        ...resource,
        isLikedByCurrentUser: likedResourceIds.has(resource.id)
      }));
    } catch (error) {
      console.error('Error getting resources with like status:', error);
      throw error;
    }
  }

  // Get resource statistics
  async getResourceStats(): Promise<{
    totalResources: number;
    totalDownloads: number;
    resourcesByCategory: Record<string, number>;
    recentResources: Resource[];
  }> {
    try {
      const resources = await this.getResources({ isActive: true });
      
      const totalDownloads = resources.reduce((sum, resource) => sum + (resource.downloadCount || 0), 0);
      
      const resourcesByCategory = resources.reduce((acc, resource) => {
        acc[resource.category] = (acc[resource.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const recentResources = resources
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, 5);

      return {
        totalResources: resources.length,
        totalDownloads,
        resourcesByCategory,
        recentResources,
      };
    } catch (error) {
      console.error('Error getting resource stats:', error);
      throw error;
    }
  }

  // Submit a completed form (parents and up)
  async submitForm(
    resourceId: string, 
    file: File, 
    eventId?: string,
    rsvpId?: string
  ): Promise<string> {
    try {
      const user = this.currentUser;
      if (!user) {
        throw new Error('User must be authenticated');
      }

      console.log('📤 Submitting form for resource:', resourceId, { eventId, rsvpId });

      // Get resource to verify it allows submissions
      const resource = await this.getResourceById(resourceId);
      if (!resource) {
        throw new Error('Resource not found');
      }

      if (!resource.allowSubmissions) {
        throw new Error('This resource does not accept submissions');
      }

      // Upload file to storage
      const fileExtension = file.name.split('.').pop();
      const storageFileName = `submissions/${resourceId}/${user.uid}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExtension}`;
      const fileRef = ref(storage, storageFileName);
      
      console.log('📤 Uploading submission file:', storageFileName);
      await uploadBytes(fileRef, file);
      const fileUrl = await getDownloadURL(fileRef);
      console.log('✅ Submission file uploaded:', fileUrl);

      // Create submission document
      const submissionData: Omit<ResourceSubmission, 'id'> = {
        resourceId: resource.id,
        resourceTitle: resource.title,
        submittedBy: user.uid,
        submittedByName: user.displayName || user.email || 'Unknown',
        submittedByEmail: user.email || 'Unknown',
        submittedAt: serverTimestamp() as any,
        fileUrl,
        fileName: file.name,
        fileSize: file.size,
        status: 'pending',
        eventId,
        rsvpId,
      };

      const docRef = await addDoc(collection(db, 'resource-submissions'), submissionData);
      console.log('✅ Submission created:', docRef.id);
      
      return docRef.id;
    } catch (error) {
      console.error('Error submitting form:', error);
      throw error;
    }
  }

  // Get submissions for a resource (admin only)
  async getResourceSubmissions(resourceId: string): Promise<ResourceSubmission[]> {
    if (!this.canManageResources()) {
      throw new Error('Only admins can view submissions');
    }

    try {
      const submissionsQuery = query(
        collection(db, 'resource-submissions'),
        where('resourceId', '==', resourceId),
        orderBy('submittedAt', 'desc')
      );

      const snapshot = await getDocs(submissionsQuery);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        submittedAt: doc.data().submittedAt?.toDate?.() || new Date(doc.data().submittedAt),
        reviewedAt: doc.data().reviewedAt?.toDate?.() || (doc.data().reviewedAt ? new Date(doc.data().reviewedAt) : undefined),
      })) as ResourceSubmission[];
    } catch (error) {
      console.error('Error getting resource submissions:', error);
      throw error;
    }
  }

  // Get all submissions (admin only)
  async getAllSubmissions(status?: 'pending' | 'approved' | 'rejected'): Promise<ResourceSubmission[]> {
    if (!this.canManageResources()) {
      throw new Error('Only admins can view submissions');
    }

    try {
      let submissionsQuery;
      if (status) {
        submissionsQuery = query(
          collection(db, 'resource-submissions'),
          where('status', '==', status),
          orderBy('submittedAt', 'desc')
        );
      } else {
        submissionsQuery = query(
          collection(db, 'resource-submissions'),
          orderBy('submittedAt', 'desc')
        );
      }

      const snapshot = await getDocs(submissionsQuery);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        submittedAt: doc.data().submittedAt?.toDate?.() || new Date(doc.data().submittedAt),
        reviewedAt: doc.data().reviewedAt?.toDate?.() || (doc.data().reviewedAt ? new Date(doc.data().reviewedAt) : undefined),
      })) as ResourceSubmission[];
    } catch (error) {
      console.error('Error getting all submissions:', error);
      throw error;
    }
  }

  // Get user's own submissions
  async getUserSubmissions(userId?: string): Promise<ResourceSubmission[]> {
    try {
      const user = this.currentUser;
      if (!user) {
        throw new Error('User must be authenticated');
      }

      const targetUserId = userId || user.uid;
      
      // Only allow users to view their own submissions unless they're admin
      if (targetUserId !== user.uid && !this.canManageResources()) {
        throw new Error('You can only view your own submissions');
      }

      const submissionsQuery = query(
        collection(db, 'resource-submissions'),
        where('submittedBy', '==', targetUserId),
        orderBy('submittedAt', 'desc')
      );

      const snapshot = await getDocs(submissionsQuery);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        submittedAt: doc.data().submittedAt?.toDate?.() || new Date(doc.data().submittedAt),
        reviewedAt: doc.data().reviewedAt?.toDate?.() || (doc.data().reviewedAt ? new Date(doc.data().reviewedAt) : undefined),
      })) as ResourceSubmission[];
    } catch (error) {
      console.error('Error getting user submissions:', error);
      throw error;
    }
  }

  // Review submission (admin only)
  async reviewSubmission(
    submissionId: string,
    status: 'approved' | 'rejected',
    reviewNotes?: string
  ): Promise<void> {
    if (!this.canManageResources()) {
      throw new Error('Only admins can review submissions');
    }

    try {
      const user = this.currentUser;
      if (!user) {
        throw new Error('User must be authenticated');
      }

      // Get submission to check if it's linked to an RSVP
      const submissionRef = doc(db, 'resource-submissions', submissionId);
      const submissionDoc = await getDoc(submissionRef);
      
      if (!submissionDoc.exists()) {
        throw new Error('Submission not found');
      }

      const submission = submissionDoc.data() as ResourceSubmission;

      // Update submission status
      await updateDoc(submissionRef, {
        status,
        reviewedBy: user.uid,
        reviewedByName: user.displayName || user.email || 'Unknown',
        reviewedAt: serverTimestamp(),
        reviewNotes: reviewNotes || '',
      });

      console.log(`✅ Submission ${submissionId} ${status}`);

      // If approved and linked to an RSVP, update the RSVP with paperwork completion
      if (status === 'approved' && submission.rsvpId) {
        try {
          const rsvpRef = doc(db, 'rsvps', submission.rsvpId);
          await updateDoc(rsvpRef, {
            paperworkComplete: true,
            paperworkCompletedAt: serverTimestamp(),
            paperworkApprovedBy: user.uid,
            paperworkApprovedByName: user.displayName || user.email || 'Unknown',
          });
          console.log(`✅ Updated RSVP ${submission.rsvpId} with paperwork completion`);
        } catch (error) {
          console.warn('Could not update RSVP paperwork status:', error);
        }
      }
    } catch (error) {
      console.error('Error reviewing submission:', error);
      throw error;
    }
  }

  // Delete submission
  async deleteSubmission(submissionId: string): Promise<void> {
    try {
      const user = this.currentUser;
      if (!user) {
        throw new Error('User must be authenticated');
      }

      // Get submission to check ownership
      const submissionRef = doc(db, 'resource-submissions', submissionId);
      const submissionDoc = await getDoc(submissionRef);
      
      if (!submissionDoc.exists()) {
        throw new Error('Submission not found');
      }

      const submission = submissionDoc.data() as ResourceSubmission;
      
      // Only allow deletion by owner or admin
      if (submission.submittedBy !== user.uid && !this.canManageResources()) {
        throw new Error('You can only delete your own submissions');
      }

      // Delete file from storage
      if (submission.fileUrl) {
        try {
          const fileRef = ref(storage, submission.fileUrl);
          await deleteObject(fileRef);
        } catch (error) {
          console.warn('Could not delete submission file:', error);
        }
      }

      // Delete submission document
      await deleteDoc(submissionRef);
      console.log('✅ Submission deleted:', submissionId);
    } catch (error) {
      console.error('Error deleting submission:', error);
      throw error;
    }
  }
}

export const resourceService = new ResourceService();
