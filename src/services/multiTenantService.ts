import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  setDoc,
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { authService } from './authService';
import {
  Category,
  Organization,
  CrossOrganizationCollaboration,
  AICollaborationSession,
  OrganizationInvitation,
  CrossOrganizationUser,
  CategorySettings,
  OrganizationSettings,
  OrganizationMetadata
} from '../types/multiTenant';

class MultiTenantService {
  private currentUser = authService.getCurrentUser();

  // ============================================================================
  // CATEGORY MANAGEMENT
  // ============================================================================

  async createCategory(data: Omit<Category, 'id' | 'createdAt' | 'updatedAt' | 'organizationCount'>): Promise<{ success: boolean; categoryId?: string; error?: string }> {
    try {
      const user = this.currentUser;
      if (!user) throw new Error('User not authenticated');

      const categoryData = {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: user.uid,
        organizationCount: 0
      };

      const docRef = await addDoc(collection(db, 'categories'), categoryData);
      
      return { success: true, categoryId: docRef.id };
    } catch (error: any) {
      console.error('Error creating category:', error);
      return { success: false, error: error.message };
    }
  }

  async getCategories(): Promise<Category[]> {
    try {
      const q = query(
        collection(db, 'categories'),
        where('isActive', '==', true),
        orderBy('name')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      })) as Category[];
    } catch (error: any) {
      console.error('Error fetching categories:', error);
      return [];
    }
  }

  async getCategory(categoryId: string): Promise<Category | null> {
    try {
      const docRef = doc(db, 'categories', categoryId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        } as Category;
      }
      
      return null;
    } catch (error: any) {
      console.error('Error fetching category:', error);
      return null;
    }
  }

  // ============================================================================
  // ORGANIZATION MANAGEMENT
  // ============================================================================

  async createOrganization(data: Omit<Organization, 'id' | 'createdAt' | 'updatedAt' | 'memberCount'>): Promise<{ success: boolean; organizationId?: string; error?: string }> {
    try {
      const user = this.currentUser;
      if (!user) throw new Error('User not authenticated');

      // Verify category exists
      const category = await this.getCategory(data.categoryId);
      if (!category) throw new Error('Category not found');

      const organizationData = {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: user.uid,
        memberCount: 1 // Creator is first member
      };

      const docRef = await addDoc(collection(db, 'organizations'), organizationData);
      
      // Update category organization count
      await updateDoc(doc(db, 'categories', data.categoryId), {
        organizationCount: category.organizationCount + 1,
        updatedAt: serverTimestamp()
      });

      // Add creator as organization member
      await this.addOrganizationMember(docRef.id, user.uid, 'admin', ['*']);
      
      return { success: true, organizationId: docRef.id };
    } catch (error: any) {
      console.error('Error creating organization:', error);
      return { success: false, error: error.message };
    }
  }

  async getOrganizations(categoryId?: string): Promise<Organization[]> {
    try {
      let q = query(
        collection(db, 'organizations'),
        where('isActive', '==', true),
        orderBy('name')
      );

      if (categoryId) {
        q = query(q, where('categoryId', '==', categoryId));
      }
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      })) as Organization[];
    } catch (error: any) {
      console.error('Error fetching organizations:', error);
      return [];
    }
  }

  async getUserOrganizations(): Promise<Organization[]> {
    try {
      const user = this.currentUser;
      if (!user) return [];

      const q = query(
        collection(db, 'crossOrganizationUsers'),
        where('userId', '==', user.uid),
        where('isActive', '==', true)
      );
      
      const snapshot = await getDocs(q);
      const organizationIds = snapshot.docs.map(doc => doc.data().organizationId);
      
      if (organizationIds.length === 0) return [];

      const organizations: Organization[] = [];
      for (const orgId of organizationIds) {
        const org = await this.getOrganization(orgId);
        if (org) organizations.push(org);
      }
      
      return organizations;
    } catch (error: any) {
      console.error('Error fetching user organizations:', error);
      return [];
    }
  }

  async getOrganization(organizationId: string): Promise<Organization | null> {
    try {
      const docRef = doc(db, 'organizations', organizationId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        } as Organization;
      }
      
      return null;
    } catch (error: any) {
      console.error('Error fetching organization:', error);
      return null;
    }
  }

  // ============================================================================
  // ORGANIZATION MEMBERSHIP
  // ============================================================================

  async addOrganizationMember(organizationId: string, userId: string, role: string, permissions: string[]): Promise<{ success: boolean; error?: string }> {
    try {
      const user = await authService.getUserById(userId);
      if (!user) throw new Error('User not found');

      const memberData: CrossOrganizationUser = {
        id: `${organizationId}_${userId}`,
        userId,
        organizationId,
        role,
        permissions,
        isActive: true,
        joinedAt: new Date(),
        lastActiveAt: new Date(),
        metadata: {
          displayName: user.displayName || 'User',
          email: user.email,
          photoURL: user.photoURL,
          organizationName: (await this.getOrganization(organizationId))?.name || 'Unknown'
        }
      };

      await setDoc(doc(db, 'crossOrganizationUsers', memberData.id), memberData);
      
      // Update organization member count
      const org = await this.getOrganization(organizationId);
      if (org) {
        await updateDoc(doc(db, 'organizations', organizationId), {
          memberCount: org.memberCount + 1,
          updatedAt: serverTimestamp()
        });
      }
      
      return { success: true };
    } catch (error: any) {
      console.error('Error adding organization member:', error);
      return { success: false, error: error.message };
    }
  }

  async removeOrganizationMember(organizationId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const memberId = `${organizationId}_${userId}`;
      await deleteDoc(doc(db, 'crossOrganizationUsers', memberId));
      
      // Update organization member count
      const org = await this.getOrganization(organizationId);
      if (org) {
        await updateDoc(doc(db, 'organizations', organizationId), {
          memberCount: Math.max(0, org.memberCount - 1),
          updatedAt: serverTimestamp()
        });
      }
      
      return { success: true };
    } catch (error: any) {
      console.error('Error removing organization member:', error);
      return { success: false, error: error.message };
    }
  }

  // ============================================================================
  // CROSS-ORGANIZATION COLLABORATION
  // ============================================================================

  async createCollaboration(data: Omit<CrossOrganizationCollaboration, 'id' | 'createdAt' | 'updatedAt'>): Promise<{ success: boolean; collaborationId?: string; error?: string }> {
    try {
      const user = this.currentUser;
      if (!user) throw new Error('User not authenticated');

      const collaborationData = {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'crossOrganizationCollaborations'), collaborationData);
      
      return { success: true, collaborationId: docRef.id };
    } catch (error: any) {
      console.error('Error creating collaboration:', error);
      return { success: false, error: error.message };
    }
  }

  async getCollaborations(organizationId?: string): Promise<CrossOrganizationCollaboration[]> {
    try {
      let q = query(
        collection(db, 'crossOrganizationCollaborations'),
        orderBy('createdAt', 'desc')
      );

      if (organizationId) {
        q = query(q, where('sourceOrganizationId', '==', organizationId));
      }
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        startDate: doc.data().startDate?.toDate() || new Date(),
        endDate: doc.data().endDate?.toDate()
      })) as CrossOrganizationCollaboration[];
    } catch (error: any) {
      console.error('Error fetching collaborations:', error);
      return [];
    }
  }

  // ============================================================================
  // AI COLLABORATION SESSIONS
  // ============================================================================

  async createAICollaborationSession(data: Omit<AICollaborationSession, 'id' | 'createdAt' | 'updatedAt' | 'messages' | 'sharedResources' | 'outcomes'>): Promise<{ success: boolean; sessionId?: string; error?: string }> {
    try {
      const user = this.currentUser;
      if (!user) throw new Error('User not authenticated');

      const sessionData = {
        ...data,
        participants: [...data.participants, user.uid],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        messages: [],
        sharedResources: [],
        outcomes: []
      };

      const docRef = await addDoc(collection(db, 'aiCollaborationSessions'), sessionData);
      
      return { success: true, sessionId: docRef.id };
    } catch (error: any) {
      console.error('Error creating AI collaboration session:', error);
      return { success: false, error: error.message };
    }
  }

  async getAICollaborationSessions(organizationId?: string): Promise<AICollaborationSession[]> {
    try {
      let q = query(
        collection(db, 'aiCollaborationSessions'),
        orderBy('createdAt', 'desc')
      );

      if (organizationId) {
        q = query(q, where('organizationIds', 'array-contains', organizationId));
      }
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        messages: doc.data().messages?.map((msg: any) => ({
          ...msg,
          timestamp: msg.timestamp?.toDate() || new Date()
        })) || [],
        outcomes: doc.data().outcomes?.map((outcome: any) => ({
          ...outcome,
          createdAt: outcome.createdAt?.toDate() || new Date(),
          completedAt: outcome.completedAt?.toDate()
        })) || []
      })) as AICollaborationSession[];
    } catch (error: any) {
      console.error('Error fetching AI collaboration sessions:', error);
      return [];
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  async switchOrganization(organizationId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const user = this.currentUser;
      if (!user) throw new Error('User not authenticated');

      // Verify user is member of organization
      const memberId = `${organizationId}_${user.uid}`;
      const memberDoc = await getDoc(doc(db, 'crossOrganizationUsers', memberId));
      
      if (!memberDoc.exists()) {
        throw new Error('User is not a member of this organization');
      }

      // Update user's current organization preference (could be stored in user profile)
      await updateDoc(doc(db, 'users', user.uid), {
        currentOrganizationId: organizationId,
        updatedAt: serverTimestamp()
      });

      return { success: true };
    } catch (error: any) {
      console.error('Error switching organization:', error);
      return { success: false, error: error.message };
    }
  }

  async getOrganizationStats(organizationId: string): Promise<{
    memberCount: number;
    eventCount: number;
    announcementCount: number;
    resourceCount: number;
    collaborationCount: number;
  }> {
    try {
      // This would aggregate data from various collections
      // For now, return basic stats
      const org = await this.getOrganization(organizationId);
      
      return {
        memberCount: org?.memberCount || 0,
        eventCount: 0, // TODO: Implement
        announcementCount: 0, // TODO: Implement
        resourceCount: 0, // TODO: Implement
        collaborationCount: 0 // TODO: Implement
      };
    } catch (error: any) {
      console.error('Error fetching organization stats:', error);
      return {
        memberCount: 0,
        eventCount: 0,
        announcementCount: 0,
        resourceCount: 0,
        collaborationCount: 0
      };
    }
  }
}

export const multiTenantService = new MultiTenantService();
export default multiTenantService;
