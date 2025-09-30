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
  private currentUser = authService.getCurrentUser();

  // Check if user can manage resources (den leaders and up)
  canManageResources(user?: any): boolean {
    const userToCheck = user || this.currentUser;
    if (!userToCheck) return false;
    
    const allowedRoles = ['volunteer', 'admin', 'super-admin', 'super_admin', 'root', 'moderator', 'content-admin'];
    return allowedRoles.includes(userToCheck.role) || userToCheck.isAdmin === true;
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
    const user = currentUser || this.currentUser;
    if (!this.canManageResources(user)) {
      throw new Error('Only den leaders and up can create resources');
    }

    try {
      if (!user) {
        throw new Error('User must be authenticated');
      }

      let fileUrl: string | undefined;
      let fileName: string | undefined;
      let fileSize: number | undefined;

      // Upload file if provided
      if (file) {
        const fileExtension = file.name.split('.').pop();
        const storageFileName = `resources/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExtension}`;
        const fileRef = ref(storage, storageFileName);
        
        await uploadBytes(fileRef, file);
        fileUrl = await getDownloadURL(fileRef);
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
        isActive: true,
      };

      // Only add file-related fields if a file was uploaded
      if (file) {
        newResource.fileName = fileName;
        newResource.fileUrl = fileUrl;
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
    if (!this.canManageResources()) {
      throw new Error('Only den leaders and up can update resources');
    }

    try {
      const user = this.currentUser;
      if (!user) {
        throw new Error('User must be authenticated');
      }

      // Get current resource to check if user can modify it
      const currentResource = await this.getResourceById(id);
      if (!currentResource) {
        throw new Error('Resource not found');
      }

      // Only allow creator or admin+ to modify
      if (currentResource.createdBy !== user.uid && !['admin', 'super-admin', 'super_admin', 'root'].includes(user.role || '')) {
        throw new Error('Only the creator or admin can modify this resource');
      }

      let fileUrl = updates.url;
      let fileName = updates.fileName;
      let fileSize = updates.fileSize;

      // Upload new file if provided
      if (file) {
        // Delete old file if exists
        if (currentResource.url) {
          try {
            const oldFileRef = ref(storage, currentResource.url);
            await deleteObject(oldFileRef);
          } catch (error) {
            console.warn('Could not delete old file:', error);
          }
        }

        const fileExtension = file.name.split('.').pop();
        const newFileName = `resources/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExtension}`;
        const fileRef = ref(storage, newFileName);
        
        await uploadBytes(fileRef, file);
        fileUrl = await getDownloadURL(fileRef);
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
  async deleteResource(id: string): Promise<void> {
    if (!this.canManageResources()) {
      throw new Error('Only den leaders and up can delete resources');
    }

    try {
      const user = this.currentUser;
      if (!user) {
        throw new Error('User must be authenticated');
      }

      // Get current resource to check if user can delete it
      const currentResource = await this.getResourceById(id);
      if (!currentResource) {
        throw new Error('Resource not found');
      }

      // Only allow creator or admin+ to delete
      if (currentResource.createdBy !== user.uid && !['admin', 'super-admin', 'super_admin', 'root'].includes(user.role || '')) {
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
}

export const resourceService = new ResourceService();
