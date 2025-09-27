import { 
  getAuth, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  User as FirebaseUser,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  FacebookAuthProvider,
  OAuthProvider,
  GithubAuthProvider,
  TwitterAuthProvider,
  linkWithPopup,
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  serverTimestamp,
  deleteDoc,
  writeBatch
} from 'firebase/firestore';
import { db } from '../firebase/config';

// User roles and permissions - Updated for approval system
export enum UserRole {
  ANONYMOUS = 'anonymous',    // Default - no account
  PARENT = 'parent',          // Family account (default after signup)
  LEADER = 'leader',          // Den leaders, cubmaster, etc.
  ADMIN = 'admin',            // Pack administrators
  SUPER_ADMIN = 'super_admin', // Super administrators (highest level)
  AI_ASSISTANT = 'ai_assistant' // AI assistant role
}

// User status for approval system
export enum UserStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  DENIED = 'denied'
}

// Role hierarchy - each role inherits permissions from roles below it
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  [UserRole.ANONYMOUS]: 0,
  [UserRole.PARENT]: 1,
  [UserRole.LEADER]: 2,
  [UserRole.ADMIN]: 3,
  [UserRole.SUPER_ADMIN]: 5,
  [UserRole.AI_ASSISTANT]: 5
}

// User document interface
export interface UserDocument {
  email: string;
  displayName: string;
  status: UserStatus;
  role: UserRole;
  createdAt: any;
  approvedAt: any;
  approvedBy: string | null;
  // Additional fields for existing system compatibility
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  allergies?: string;
  medicalConditions?: string;
  tshirtSize?: string;
  den?: string;
  grade?: string;
  school?: string;
  parentEmail?: string;
  parentPhone?: string;
  parentName?: string;
  parentAddress?: string;
  parentEmergencyContact?: string;
  parentEmergencyPhone?: string;
  parentAllergies?: string;
  parentMedicalConditions?: string;
  parentTshirtSize?: string;
  parentDen?: string;
  parentGrade?: string;
  parentSchool?: string;
  // Social login providers
  providers?: string[];
  // Account linking
  linkedAccounts?: {
    google?: string;
    facebook?: string;
    apple?: string;
    github?: string;
    twitter?: string;
  };
  // Last login
  lastLoginAt?: any;
  // Profile completion
  profileComplete?: boolean;
  // Preferences
  preferences?: {
    emailNotifications?: boolean;
    smsNotifications?: boolean;
    pushNotifications?: boolean;
    theme?: 'light' | 'dark' | 'auto';
    language?: string;
  };
}

// Auth service class with approval system integration
export class AuthService {
  private auth = getAuth();
  private currentUser: FirebaseUser | null = null;
  private userDoc: UserDocument | null = null;
  private authStateListeners: Array<(user: FirebaseUser | null, userDoc: UserDocument | null) => void> = [];

  constructor() {
    // Listen to auth state changes
    onAuthStateChanged(this.auth, async (user) => {
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
  onAuthStateChange(callback: (user: FirebaseUser | null, userDoc: UserDocument | null) => void) {
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
   * Sign up a new user with approval system
   */
  async signUp(email: string, password: string, displayName?: string): Promise<{ success: boolean; message: string }> {
    try {
      const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
      const user = userCredential.user;

      // Update display name if provided
      if (displayName) {
        await updateProfile(user, { displayName });
      }

      // Create user document in Firestore with pending status
      const userDoc: UserDocument = {
        email: user.email || '',
        displayName: displayName || user.displayName || '',
        status: UserStatus.PENDING,
        role: UserRole.PARENT,
        createdAt: serverTimestamp(),
        approvedAt: null,
        approvedBy: null,
        profileComplete: false,
        preferences: {
          emailNotifications: true,
          smsNotifications: false,
          pushNotifications: true,
          theme: 'auto',
          language: 'en'
        }
      };

      await setDoc(doc(db, 'users', user.uid), userDoc);

      return {
        success: true,
        message: 'Account created successfully! Your account is pending approval.'
      };
    } catch (error: any) {
      console.error('Sign up error:', error);
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
      await signInWithEmailAndPassword(this.auth, email, password);
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
      await signOut(this.auth);
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
    return this.userDoc?.role === UserRole.ADMIN || this.userDoc?.role === UserRole.SUPER_ADMIN;
  }

  /**
   * Check if current user is leader or above
   */
  isLeaderOrAbove(): boolean {
    return this.userDoc?.role === UserRole.LEADER || 
           this.userDoc?.role === UserRole.ADMIN || 
           this.userDoc?.role === UserRole.SUPER_ADMIN;
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
  getCurrentUser(): FirebaseUser | null {
    return this.currentUser;
  }

  /**
   * Get current user document
   */
  getCurrentUserDoc(): UserDocument | null {
    return this.userDoc;
  }

  /**
   * Check if user has permission for a role
   */
  hasRole(requiredRole: UserRole): boolean {
    if (!this.userDoc) return false;
    
    const userRoleLevel = ROLE_HIERARCHY[this.userDoc.role];
    const requiredRoleLevel = ROLE_HIERARCHY[requiredRole];
    
    return userRoleLevel >= requiredRoleLevel;
  }

  /**
   * Check if user is authenticated and approved
   */
  isAuthenticatedAndApproved(): boolean {
    return this.currentUser !== null && this.isApproved();
  }

  /**
   * Update user profile
   */
  async updateProfile(updates: Partial<UserDocument>): Promise<{ success: boolean; message: string }> {
    if (!this.currentUser) {
      return { success: false, message: 'No user logged in' };
    }

    try {
      await updateDoc(doc(db, 'users', this.currentUser.uid), {
        ...updates,
        lastLoginAt: serverTimestamp()
      });

      // Refresh user document
      this.userDoc = await this.getUserDocument(this.currentUser.uid);

      return { success: true, message: 'Profile updated successfully' };
    } catch (error: any) {
      console.error('Error updating profile:', error);
      return { success: false, message: error.message || 'Failed to update profile' };
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email: string): Promise<{ success: boolean; message: string }> {
    try {
      await sendPasswordResetEmail(this.auth, email);
      return { success: true, message: 'Password reset email sent' };
    } catch (error: any) {
      console.error('Error sending password reset email:', error);
      return { success: false, message: error.message || 'Failed to send password reset email' };
    }
  }

  /**
   * Social login methods (existing implementation)
   */
  async signInWithGoogle(): Promise<{ success: boolean; message: string }> {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(this.auth, provider);
      
      // Handle user document creation/update for social login
      await this.handleSocialLogin(result.user, 'google');
      
      return { success: true, message: 'Signed in with Google successfully' };
    } catch (error: any) {
      console.error('Google sign in error:', error);
      return { success: false, message: error.message || 'Failed to sign in with Google' };
    }
  }

  /**
   * Handle social login user document creation/update
   */
  private async handleSocialLogin(user: FirebaseUser, provider: string): Promise<void> {
    try {
      const userDoc = await this.getUserDocument(user.uid);
      
      if (!userDoc) {
        // Create new user document for social login
        const newUserDoc: UserDocument = {
          email: user.email || '',
          displayName: user.displayName || '',
          status: UserStatus.PENDING,
          role: UserRole.PARENT,
          createdAt: serverTimestamp(),
          approvedAt: null,
          approvedBy: null,
          providers: [provider],
          linkedAccounts: {
            [provider]: user.uid
          },
          profileComplete: false,
          preferences: {
            emailNotifications: true,
            smsNotifications: false,
            pushNotifications: true,
            theme: 'auto',
            language: 'en'
          }
        };

        await setDoc(doc(db, 'users', user.uid), newUserDoc);
      } else {
        // Update existing user document
        const updates: Partial<UserDocument> = {
          providers: [...(userDoc.providers || []), provider],
          linkedAccounts: {
            ...userDoc.linkedAccounts,
            [provider]: user.uid
          }
        };

        await updateDoc(doc(db, 'users', user.uid), updates);
      }
    } catch (error) {
      console.error('Error handling social login:', error);
    }
  }
}

// Export singleton instance
export const authService = new AuthService();
