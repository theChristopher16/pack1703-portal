import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  updateProfile,
  User,
  onAuthStateChanged
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  onSnapshot
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { auth, db, functions } from '../firebase/config';

// Types
export enum UserRole {
  PARENT = 'parent',
  LEADER = 'leader',
  ADMIN = 'admin'
}

export enum UserStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  DENIED = 'denied'
}

export interface UserDocument {
  email: string;
  displayName: string;
  status: UserStatus;
  role: UserRole;
  createdAt: any;
  approvedAt: any;
  approvedBy: string | null;
}

export interface PendingUser extends UserDocument {
  id: string;
}

export interface AdminAuditLog {
  id: string;
  action: 'approve' | 'deny';
  targetUserId: string;
  targetUserEmail: string;
  adminUserId: string;
  adminEmail: string;
  role?: UserRole;
  timestamp: any;
  reason?: string;
}

// Cloud Function references
const approveUserFunction = httpsCallable(functions, 'approveUser');
const getPendingUsersFunction = httpsCallable(functions, 'getPendingUsers');
const getAuditLogsFunction = httpsCallable(functions, 'getAuditLogs');
const createPendingUserFunction = httpsCallable(functions, 'createPendingUser');

/**
 * User Authentication Service
 */
export class UserApprovalService {
  private currentUser: User | null = null;
  private userDoc: UserDocument | null = null;
  private authStateListeners: Array<(user: User | null, userDoc: UserDocument | null) => void> = [];

  constructor() {
    // Listen to auth state changes
    onAuthStateChanged(auth, async (user) => {
      this.currentUser = user;
      
      if (user) {
        // Get user document from Firestore
        this.userDoc = await this.getUserDocument(user.uid);
      } else {
        this.userDoc = null;
      }
      
      // Notify listeners
      this.authStateListeners.forEach(listener => {
        listener(user, this.userDoc);
      });
    });
  }

  /**
   * Add auth state listener
   */
  onAuthStateChange(callback: (user: User | null, userDoc: UserDocument | null) => void) {
    this.authStateListeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.authStateListeners.indexOf(callback);
      if (index > -1) {
        this.authStateListeners.splice(index, 1);
      }
    };
  }

  /**
   * Check if a user already exists in the system
   */
  async checkUserExists(email: string): Promise<{ exists: boolean; needsApproval: boolean; message?: string }> {
    try {
      // Try to sign in with a dummy password to check if user exists
      // This is a bit of a hack, but Firebase doesn't provide a direct way to check if email exists
      await signInWithEmailAndPassword(auth, email, 'dummy-password-check');
      return { exists: true, needsApproval: false };
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        return { exists: false, needsApproval: false };
      } else if (error.code === 'auth/wrong-password') {
        return { exists: true, needsApproval: false, message: 'Account exists but password is incorrect' };
      } else if (error.code === 'auth/user-disabled') {
        return { exists: true, needsApproval: true, message: 'Account exists but is disabled' };
      }
      return { exists: false, needsApproval: false };
    }
  }

  /**
   * Sign up a new user
   */
  async signUp(email: string, password: string, displayName?: string): Promise<{ success: boolean; message: string }> {
    try {
      console.log('🔐 UserApprovalService: Starting signup process for:', email);
      
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      console.log('🔐 UserApprovalService: Firebase Auth user created:', user.uid);

      // Update display name if provided
      if (displayName) {
        await updateProfile(user, { displayName });
        console.log('🔐 UserApprovalService: Display name updated');
      }

      // Create pending user document via Cloud Function
      console.log('🔐 UserApprovalService: Calling createPendingUser Cloud Function...');
      const result = await createPendingUserFunction({
        userId: user.uid,
        email: user.email,
        displayName: displayName || user.displayName || ''
      });
      
      console.log('🔐 UserApprovalService: createPendingUser result:', result.data);

      return {
        success: true,
        message: 'Account created successfully! Your account is pending approval.'
      };
    } catch (error: any) {
      console.error('Sign up error:', error);
      
      // Handle specific Firebase Auth errors
      if (error.code === 'auth/email-already-in-use') {
        return {
          success: false,
          message: 'An account with this email already exists. Please try signing in instead.'
        };
      } else if (error.code === 'auth/weak-password') {
        return {
          success: false,
          message: 'Password is too weak. Please choose a stronger password.'
        };
      } else if (error.code === 'auth/invalid-email') {
        return {
          success: false,
          message: 'Invalid email address. Please check your email and try again.'
        };
      }
      
      return {
        success: false,
        message: error.message || 'Failed to create account'
      };
    }
  }

  /**
   * Sign in existing user
   */
  async signIn(email: string, password: string): Promise<{ success: boolean; message: string }> {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return {
        success: true,
        message: 'Signed in successfully'
      };
    } catch (error: any) {
      console.error('Sign in error:', error);
      return {
        success: false,
        message: error.message || 'Failed to sign in'
      };
    }
  }

  /**
   * Sign out current user
   */
  async signOut(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  }

  /**
   * Get user document from Firestore
   */
  async getUserDocument(userId: string): Promise<UserDocument | null> {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        return userDoc.data() as UserDocument;
      }
      return null;
    } catch (error) {
      console.error('Error getting user document:', error);
      return null;
    }
  }

  /**
   * Check if current user is approved
   */
  isApproved(): boolean {
    return this.userDoc?.status === UserStatus.APPROVED;
  }

  /**
   * Check if current user is admin
   */
  isAdmin(): boolean {
    return this.userDoc?.role === UserRole.ADMIN;
  }

  /**
   * Check if current user is pending
   */
  isPending(): boolean {
    return this.userDoc?.status === UserStatus.PENDING;
  }

  /**
   * Check if current user is denied
   */
  isDenied(): boolean {
    return this.userDoc?.status === UserStatus.DENIED;
  }

  /**
   * Get current user
   */
  getCurrentUser(): User | null {
    return this.currentUser;
  }

  /**
   * Get current user document
   */
  getCurrentUserDoc(): UserDocument | null {
    return this.userDoc;
  }
}

/**
 * Admin Service for managing user approvals
 */
export class AdminService {
  /**
   * Get pending users
   */
  async getPendingUsers(): Promise<PendingUser[]> {
    try {
      console.log('🔐 UserApprovalService: Getting pending users...');
      const result = await getPendingUsersFunction();
      console.log('🔐 UserApprovalService: getPendingUsers result:', result.data);
      return (result.data as any)?.users || [];
    } catch (error) {
      console.error('Error getting pending users:', error);
      throw error;
    }
  }

  /**
   * Approve a user
   */
  async approveUser(userId: string, role: UserRole, reason?: string): Promise<{ success: boolean; message: string }> {
    try {
      const result = await approveUserFunction({
        userId,
        action: 'approve',
        role,
        reason
      });
      
      return {
        success: true,
        message: (result.data as any)?.message || 'User approved successfully'
      };
    } catch (error: any) {
      console.error('Error approving user:', error);
      return {
        success: false,
        message: error.message || 'Failed to approve user'
      };
    }
  }

  /**
   * Deny a user
   */
  async denyUser(userId: string, reason?: string): Promise<{ success: boolean; message: string }> {
    try {
      const result = await approveUserFunction({
        userId,
        action: 'deny',
        reason
      });
      
      return {
        success: true,
        message: (result.data as any)?.message || 'User denied successfully'
      };
    } catch (error: any) {
      console.error('Error denying user:', error);
      return {
        success: false,
        message: error.message || 'Failed to deny user'
      };
    }
  }

  /**
   * Get audit logs
   */
  async getAuditLogs(limit: number = 50): Promise<AdminAuditLog[]> {
    try {
      const result = await getAuditLogsFunction({ limit });
      return (result.data as any)?.logs || [];
    } catch (error) {
      console.error('Error getting audit logs:', error);
      throw error;
    }
  }

  /**
   * Listen to pending users in real-time
   */
  onPendingUsersChange(callback: (users: PendingUser[]) => void) {
    const q = query(
      collection(db, 'users'),
      where('status', '==', UserStatus.PENDING)
    );

    return onSnapshot(q, (snapshot) => {
      const users: PendingUser[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as PendingUser));
      callback(users);
    });
  }

  /**
   * Listen to audit logs in real-time
   */
  onAuditLogsChange(callback: (logs: AdminAuditLog[]) => void) {
    const q = query(
      collection(db, 'adminAuditLogs')
    );

    return onSnapshot(q, (snapshot) => {
      const logs: AdminAuditLog[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as AdminAuditLog));
      
      // Sort by timestamp descending
      logs.sort((a, b) => b.timestamp - a.timestamp);
      callback(logs);
    });
  }
}

// Export singleton instances
export const userApprovalService = new UserApprovalService();
export const adminService = new AdminService();
