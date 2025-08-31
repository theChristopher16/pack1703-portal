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
  linkWithRedirect
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
  deleteDoc
} from 'firebase/firestore';
import { db } from '../firebase/config';

// User roles and permissions
export enum UserRole {
  ROOT = 'root',
  ADMIN = 'admin',
  COMMITTEE_MEMBER = 'committee_member',
  DEN_LEADER = 'den_leader',
  STAR_VOLUNTEER = 'star_volunteer',
  PACK_MEMBER = 'pack_member',
  GUEST = 'guest'
}

export enum Permission {
  // Root permissions (full system access)
  SYSTEM_ADMIN = 'system_admin',
  USER_MANAGEMENT = 'user_management',
  ROLE_MANAGEMENT = 'role_management',
  SYSTEM_CONFIG = 'system_config',
  
  // Admin permissions
  CONTENT_MANAGEMENT = 'content_management',
  EVENT_MANAGEMENT = 'event_management',
  LOCATION_MANAGEMENT = 'location_management',
  ANNOUNCEMENT_MANAGEMENT = 'announcement_management',
  FINANCIAL_MANAGEMENT = 'financial_management',
  FUNDRAISING_MANAGEMENT = 'fundraising_management',
  
  // Den leader permissions
  DEN_CONTENT = 'den_content',
  DEN_EVENTS = 'den_events',
  DEN_MEMBERS = 'den_members',
  DEN_CHAT_MANAGEMENT = 'den_chat_management',
  
  // Pack permissions
  PACK_CONTENT = 'pack_content',
  PACK_EVENTS = 'pack_events',
  PACK_MEMBERS = 'pack_members',
  
  // Chat permissions
  CHAT_READ = 'chat_read',
  CHAT_WRITE = 'chat_write',
  CHAT_MANAGEMENT = 'chat_management',
  
  // General permissions
  READ_CONTENT = 'read_content',
  CREATE_CONTENT = 'create_content',
  UPDATE_CONTENT = 'update_content',
  DELETE_CONTENT = 'delete_content'
}

// Social login providers
export enum SocialProvider {
  GOOGLE = 'google',
  APPLE = 'apple',
  FACEBOOK = 'facebook',
  GITHUB = 'github',
  TWITTER = 'twitter',
  MICROSOFT = 'microsoft'
}

// Role to permissions mapping
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.ROOT]: [
    Permission.SYSTEM_ADMIN,
    Permission.USER_MANAGEMENT,
    Permission.ROLE_MANAGEMENT,
    Permission.SYSTEM_CONFIG,
    Permission.CONTENT_MANAGEMENT,
    Permission.EVENT_MANAGEMENT,
    Permission.LOCATION_MANAGEMENT,
    Permission.ANNOUNCEMENT_MANAGEMENT,
    Permission.FINANCIAL_MANAGEMENT,
    Permission.FUNDRAISING_MANAGEMENT,
    Permission.DEN_CONTENT,
    Permission.DEN_EVENTS,
    Permission.DEN_MEMBERS,
    Permission.PACK_CONTENT,
    Permission.PACK_EVENTS,
    Permission.PACK_MEMBERS,
    Permission.READ_CONTENT,
    Permission.CREATE_CONTENT,
    Permission.UPDATE_CONTENT,
    Permission.DELETE_CONTENT
  ],
  [UserRole.ADMIN]: [
    Permission.CONTENT_MANAGEMENT,
    Permission.EVENT_MANAGEMENT,
    Permission.LOCATION_MANAGEMENT,
    Permission.ANNOUNCEMENT_MANAGEMENT,
    Permission.FINANCIAL_MANAGEMENT,
    Permission.FUNDRAISING_MANAGEMENT,
    Permission.READ_CONTENT,
    Permission.CREATE_CONTENT,
    Permission.UPDATE_CONTENT,
    Permission.DELETE_CONTENT
  ],
  [UserRole.COMMITTEE_MEMBER]: [
    Permission.CONTENT_MANAGEMENT,
    Permission.EVENT_MANAGEMENT,
    Permission.LOCATION_MANAGEMENT,
    Permission.ANNOUNCEMENT_MANAGEMENT,
    Permission.FINANCIAL_MANAGEMENT,
    Permission.FUNDRAISING_MANAGEMENT,
    Permission.READ_CONTENT,
    Permission.CREATE_CONTENT,
    Permission.UPDATE_CONTENT,
    Permission.DELETE_CONTENT
  ],
  [UserRole.DEN_LEADER]: [
    Permission.DEN_CONTENT,
    Permission.DEN_EVENTS,
    Permission.DEN_MEMBERS,
    Permission.DEN_CHAT_MANAGEMENT,
    Permission.CHAT_READ,
    Permission.CHAT_WRITE,
    Permission.CHAT_MANAGEMENT,
    Permission.READ_CONTENT,
    Permission.CREATE_CONTENT,
    Permission.UPDATE_CONTENT,
    Permission.DELETE_CONTENT
  ],
  [UserRole.STAR_VOLUNTEER]: [
    Permission.PACK_CONTENT,
    Permission.PACK_EVENTS,
    Permission.PACK_MEMBERS,
    Permission.READ_CONTENT,
    Permission.CREATE_CONTENT,
    Permission.UPDATE_CONTENT
  ],
  [UserRole.PACK_MEMBER]: [
    Permission.READ_CONTENT,
    Permission.CREATE_CONTENT
  ],
  [UserRole.GUEST]: [
    Permission.READ_CONTENT
  ]
};

// User interface
export interface AppUser {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  role: UserRole;
  permissions: Permission[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  authProvider?: SocialProvider;
  profile?: {
    phone?: string;
    address?: string;
    emergencyContact?: string;
    scoutRank?: string;
    den?: string;
    nickname?: string;
  };
}

// Authentication service
class AuthService {
  private auth = getAuth();
  private currentUser: AppUser | null = null;
  private authStateListeners: ((user: AppUser | null) => void)[] = [];

  constructor() {
    this.initializeAuthStateListener();
    this.handleRedirectResult();
  }

  // Initialize auth state listener
  private initializeAuthStateListener() {
    console.log('AuthService: Initializing auth state listener');
    
    onAuthStateChanged(this.auth, async (firebaseUser: FirebaseUser | null) => {
      console.log('AuthService: Firebase auth state changed:', firebaseUser ? 'User exists' : 'No user');
      
      if (firebaseUser) {
        try {
          console.log('AuthService: Fetching user data from Firestore for:', firebaseUser.uid);
          const appUser = await this.getUserFromFirestore(firebaseUser.uid);
          this.currentUser = appUser;
          console.log('AuthService: User data fetched successfully:', appUser);
          this.notifyAuthStateListeners(appUser);
        } catch (error) {
          console.error('AuthService: Error fetching user data:', error);
          // If user doesn't exist in Firestore, create them with default role
          console.log('AuthService: Creating user from Firebase user');
          const appUser = await this.createUserFromFirebaseUser(firebaseUser);
          this.currentUser = appUser;
          console.log('AuthService: User created successfully:', appUser);
          this.notifyAuthStateListeners(appUser);
        }
      } else {
        console.log('AuthService: No Firebase user, clearing current user');
        this.currentUser = null;
        this.notifyAuthStateListeners(null);
      }
    });
  }

  // Handle redirect result for social login
  private async handleRedirectResult() {
    try {
      const result = await getRedirectResult(this.auth);
      if (result) {
        // User signed in via redirect
        console.log('User signed in via redirect:', result.user);
      }
    } catch (error) {
      console.error('Error handling redirect result:', error);
    }
  }

  // Get user data from Firestore
  private async getUserFromFirestore(uid: string): Promise<AppUser> {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (!userDoc.exists()) {
      throw new Error('User not found in database');
    }
    
    const userData = userDoc.data();
    return {
      uid,
      email: userData.email,
      displayName: userData.displayName,
      photoURL: userData.photoURL,
      role: userData.role,
      permissions: userData.permissions || [],
      isActive: userData.isActive,
      createdAt: userData.createdAt.toDate(),
      updatedAt: userData.updatedAt.toDate(),
      lastLoginAt: userData.lastLoginAt?.toDate(),
      authProvider: userData.authProvider,
      profile: userData.profile
    };
  }

  // Create user from Firebase user (for social login)
  private async createUserFromFirebaseUser(firebaseUser: FirebaseUser): Promise<AppUser> {
    // Determine auth provider
    let authProvider: SocialProvider | undefined;
    if (firebaseUser.providerData.length > 0) {
      const providerId = firebaseUser.providerData[0].providerId;
      switch (providerId) {
        case 'google.com':
          authProvider = SocialProvider.GOOGLE;
          break;
        case 'apple.com':
          authProvider = SocialProvider.APPLE;
          break;
        case 'facebook.com':
          authProvider = SocialProvider.FACEBOOK;
          break;
        case 'github.com':
          authProvider = SocialProvider.GITHUB;
          break;
        case 'twitter.com':
          authProvider = SocialProvider.TWITTER;
          break;
        case 'microsoft.com':
          authProvider = SocialProvider.MICROSOFT;
          break;
      }
    }

    // Check if this is the first user (root account)
    const usersQuery = query(collection(db, 'users'));
    const usersSnapshot = await getDocs(usersQuery);
    const isFirstUser = usersSnapshot.empty;

    // Determine role based on whether this is the first user
    const role = isFirstUser ? UserRole.ROOT : UserRole.PACK_MEMBER;

    // Create user document in Firestore
    console.log('Creating Firestore user document...');
    const userData: Omit<AppUser, 'uid' | 'createdAt' | 'updatedAt'> = {
      email: firebaseUser.email!,
      displayName: firebaseUser.displayName || 'User',
      role: UserRole.ROOT,
      permissions: ROLE_PERMISSIONS[UserRole.ROOT],
      isActive: true,
      profile: {}
    };

    await setDoc(doc(db, 'users', firebaseUser.uid), {
      ...userData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastLoginAt: serverTimestamp()
    });

    // Return the created user
    const appUser: AppUser = {
      uid: firebaseUser.uid,
      ...userData,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLoginAt: new Date()
    };

    return appUser;
  }

  // Sign in with social provider
  async signInWithSocial(provider: SocialProvider): Promise<AppUser> {
    try {
      let authProvider;
      
      switch (provider) {
        case SocialProvider.GOOGLE:
          authProvider = new GoogleAuthProvider();
          authProvider.addScope('email');
          authProvider.addScope('profile');
          break;
        case SocialProvider.APPLE:
          authProvider = new OAuthProvider('apple.com');
          authProvider.addScope('email');
          authProvider.addScope('name');
          break;
        case SocialProvider.FACEBOOK:
          authProvider = new FacebookAuthProvider();
          authProvider.addScope('email');
          authProvider.addScope('public_profile');
          break;
        case SocialProvider.GITHUB:
          authProvider = new GithubAuthProvider();
          authProvider.addScope('user:email');
          break;
        case SocialProvider.TWITTER:
          authProvider = new TwitterAuthProvider();
          break;
        case SocialProvider.MICROSOFT:
          authProvider = new OAuthProvider('microsoft.com');
          authProvider.addScope('email');
          authProvider.addScope('profile');
          break;
        default:
          throw new Error('Unsupported social provider');
      }

      const result = await signInWithPopup(this.auth, authProvider);
      const firebaseUser = result.user;
      
      // Get or create user data from Firestore
      let appUser: AppUser;
      try {
        appUser = await this.getUserFromFirestore(firebaseUser.uid);
      } catch (error) {
        // User doesn't exist, create them
        appUser = await this.createUserFromFirebaseUser(firebaseUser);
      }
      
      // Update last login time
      await updateDoc(doc(db, 'users', firebaseUser.uid), {
        lastLoginAt: serverTimestamp()
      });

      this.currentUser = appUser;
      this.notifyAuthStateListeners(appUser);
      
      return appUser;
    } catch (error) {
      console.error('Error signing in with social provider:', error);
      throw error;
    }
  }

  // Sign in with redirect (for mobile compatibility)
  async signInWithSocialRedirect(provider: SocialProvider): Promise<void> {
    try {
      let authProvider;
      
      switch (provider) {
        case SocialProvider.GOOGLE:
          authProvider = new GoogleAuthProvider();
          authProvider.addScope('email');
          authProvider.addScope('profile');
          break;
        case SocialProvider.APPLE:
          authProvider = new OAuthProvider('apple.com');
          authProvider.addScope('email');
          authProvider.addScope('name');
          break;
        case SocialProvider.FACEBOOK:
          authProvider = new FacebookAuthProvider();
          authProvider.addScope('email');
          authProvider.addScope('public_profile');
          break;
        case SocialProvider.GITHUB:
          authProvider = new GithubAuthProvider();
          authProvider.addScope('user:email');
          break;
        case SocialProvider.TWITTER:
          authProvider = new TwitterAuthProvider();
          break;
        case SocialProvider.MICROSOFT:
          authProvider = new OAuthProvider('microsoft.com');
          authProvider.addScope('email');
          authProvider.addScope('profile');
          break;
        default:
          throw new Error('Unsupported social provider');
      }

      await signInWithRedirect(this.auth, authProvider);
    } catch (error) {
      console.error('Error signing in with social provider redirect:', error);
      throw error;
    }
  }

  // Create root account (only call this once during initial setup)
  async createRootAccount(email: string, password: string, displayName: string): Promise<AppUser> {
    try {
      console.log('Starting root account creation for:', email);
      
      // Check if root account already exists
      const rootUsersQuery = query(
        collection(db, 'users'),
        where('role', '==', UserRole.ROOT)
      );
      const rootUsersSnapshot = await getDocs(rootUsersQuery);
      
      if (!rootUsersSnapshot.empty) {
        console.log('Root account already exists, found:', rootUsersSnapshot.size, 'root users');
        throw new Error('Root account already exists');
      }

      console.log('No existing root account found, proceeding with creation');

      // Create Firebase user
      console.log('Creating Firebase user...');
      const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
      const firebaseUser = userCredential.user;
      console.log('Firebase user created with UID:', firebaseUser.uid);

      // Create user document in Firestore
      console.log('Creating Firestore user document...');
      const userData: Omit<AppUser, 'uid' | 'createdAt' | 'updatedAt'> = {
        email: firebaseUser.email!,
        displayName,
        role: UserRole.ROOT,
        permissions: ROLE_PERMISSIONS[UserRole.ROOT],
        isActive: true,
        profile: {}
      };

      await setDoc(doc(db, 'users', firebaseUser.uid), {
        ...userData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      console.log('Firestore user document created successfully');

      // Update Firebase profile
      console.log('Updating Firebase profile...');
      await updateProfile(firebaseUser, { displayName });
      console.log('Firebase profile updated successfully');

      // Return the created user
      const appUser: AppUser = {
        uid: firebaseUser.uid,
        ...userData,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      console.log('Setting current user and notifying listeners...');
      this.currentUser = appUser;
      this.notifyAuthStateListeners(appUser);
      console.log('Root account creation completed successfully');

      return appUser;
    } catch (error: any) {
      console.error('Error creating root account:', error);
      
      // Provide more specific error messages
      if (error.code === 'auth/email-already-in-use') {
        throw new Error('An account with this email already exists. Please use a different email or sign in with the existing account.');
      } else if (error.code === 'auth/weak-password') {
        throw new Error('Password is too weak. Please use a stronger password (at least 6 characters).');
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('Invalid email address. Please enter a valid email.');
      } else if (error.message === 'Root account already exists') {
        throw error; // Re-throw this specific error
      } else {
        throw new Error(`Failed to create account: ${error.message || 'Unknown error occurred'}`);
      }
    }
  }

  // Sign in with email and password
  async signIn(email: string, password: string): Promise<AppUser> {
    try {
      const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
      const firebaseUser = userCredential.user;
      
      // Get user data from Firestore
      const appUser = await this.getUserFromFirestore(firebaseUser.uid);
      
      // Update last login time
      await updateDoc(doc(db, 'users', firebaseUser.uid), {
        lastLoginAt: serverTimestamp()
      });

      this.currentUser = appUser;
      this.notifyAuthStateListeners(appUser);
      
      return appUser;
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  }

  // Sign out
  async signOut(): Promise<void> {
    try {
      await signOut(this.auth);
      this.currentUser = null;
      this.notifyAuthStateListeners(null);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  }

  // Get current user
  getCurrentUser(): AppUser | null {
    return this.currentUser;
  }

  // Check if user is authenticated (synchronous)
  isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  // Wait for auth state to be initialized
  async waitForAuthState(): Promise<AppUser | null> {
    return new Promise((resolve) => {
      // If we already have a current user, return it immediately
      if (this.currentUser !== null) {
        resolve(this.currentUser);
        return;
      }

      // If Firebase auth has no current user, return null immediately
      if (this.auth.currentUser === null) {
        resolve(null);
        return;
      }

      // Otherwise, wait for the next auth state change
      const unsubscribe = this.onAuthStateChanged((user) => {
        unsubscribe();
        resolve(user);
      });
    });
  }

  // Check if user has permission
  hasPermission(permission: Permission): boolean {
    if (!this.currentUser || !this.currentUser.isActive) {
      return false;
    }
    return this.currentUser.permissions.includes(permission);
  }

  // Check if user has any of the specified permissions
  hasAnyPermission(permissions: Permission[]): boolean {
    return permissions.some(permission => this.hasPermission(permission));
  }

  // Check if user has all of the specified permissions
  hasAllPermissions(permissions: Permission[]): boolean {
    return permissions.every(permission => this.hasPermission(permission));
  }

  // Check if user is root
  isRoot(): boolean {
    return this.currentUser?.role === UserRole.ROOT;
  }

  // Check if user is admin or higher
  isAdmin(): boolean {
    return this.currentUser?.role === UserRole.ROOT || this.currentUser?.role === UserRole.ADMIN;
  }

  // Check if user is den leader or higher
  isDenLeader(): boolean {
    return this.isAdmin() || this.currentUser?.role === UserRole.DEN_LEADER;
  }

  // Check if user is star volunteer or higher
  isStarVolunteer(): boolean {
    return this.isAdmin() || this.currentUser?.role === UserRole.STAR_VOLUNTEER;
  }

  // Add auth state listener
  onAuthStateChanged(listener: (user: AppUser | null) => void): () => void {
    this.authStateListeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.authStateListeners.indexOf(listener);
      if (index > -1) {
        this.authStateListeners.splice(index, 1);
      }
    };
  }

  // Notify all auth state listeners
  private notifyAuthStateListeners(user: AppUser | null) {
    this.authStateListeners.forEach(listener => listener(user));
  }

  // Create new user (root only)
  async createUser(email: string, password: string, displayName: string, role: UserRole): Promise<AppUser> {
    if (!this.isRoot()) {
      throw new Error('Only root users can create new users');
    }

    try {
      // Create Firebase user
      const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
      const firebaseUser = userCredential.user;

      // Create user document in Firestore
      const userData: Omit<AppUser, 'uid' | 'createdAt' | 'updatedAt'> = {
        email: firebaseUser.email!,
        displayName,
        role,
        permissions: ROLE_PERMISSIONS[role],
        isActive: true,
        profile: {}
      };

      await setDoc(doc(db, 'users', firebaseUser.uid), {
        ...userData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Update Firebase profile
      await updateProfile(firebaseUser, { displayName });

      // Return the created user
      const appUser: AppUser = {
        uid: firebaseUser.uid,
        ...userData,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      return appUser;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  // Update user role (root only)
  async updateUserRole(uid: string, newRole: UserRole): Promise<void> {
    if (!this.isRoot()) {
      throw new Error('Only root users can update user roles');
    }

    try {
      await updateDoc(doc(db, 'users', uid), {
        role: newRole,
        permissions: ROLE_PERMISSIONS[newRole],
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating user role:', error);
      throw error;
    }
  }

  // Delete user (root only) - immediately removes all access
  async deleteUser(userId: string): Promise<boolean> {
    try {
      const currentUser = this.getCurrentUser();
      if (!currentUser || currentUser.role !== UserRole.ROOT) {
        throw new Error('Only root users can delete accounts');
      }

      // Prevent deleting self
      if (userId === currentUser.uid) {
        throw new Error('Cannot delete your own account');
      }

      // Delete from Firestore first
      await deleteDoc(doc(db, 'users', userId));
      
      // Revoke Firebase Auth token (if user is currently logged in)
      try {
        await this.auth.currentUser?.getIdToken(true);
      } catch (error) {
        // User might not be logged in, which is fine
        console.log('User not currently logged in');
      }

      // Delete from Firebase Auth (requires admin SDK in production)
      // For now, we'll just delete from Firestore and let the user's session expire
      // In production, you'd want to use Firebase Admin SDK to delete the auth user

      return true;
    } catch (error: any) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  // Get user by ID
  async getUserById(uid: string): Promise<AppUser | null> {
    try {
      const docRef = doc(db, 'users', uid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          uid: docSnap.id,
          email: data.email,
          displayName: data.displayName,
          role: data.role,
          photoURL: data.photoURL,
          authProvider: data.authProvider,
          permissions: data.permissions || [],
          isActive: data.isActive ?? true,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
          lastLoginAt: data.lastLoginAt?.toDate(),
          profile: data.profile || {}
        };
      }
      
      return null;
    } catch (error: any) {
      console.error('Error getting user by ID:', error);
      return null;
    }
  }

  // Get all users (root/admin only)
  async getUsers(): Promise<AppUser[]> {
    try {
      const currentUser = this.getCurrentUser();
      if (!currentUser || !this.hasPermission(Permission.USER_MANAGEMENT)) {
        throw new Error('Insufficient permissions');
      }

      const usersQuery = query(collection(db, 'users'));
      const snapshot = await getDocs(usersQuery);
      
      return snapshot.docs.map(doc => ({
        uid: doc.id,
        email: doc.data().email,
        displayName: doc.data().displayName,
        role: doc.data().role,
        photoURL: doc.data().photoURL,
        authProvider: doc.data().authProvider,
        permissions: doc.data().permissions || [],
        isActive: doc.data().isActive ?? true,
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
        lastLoginAt: doc.data().lastLoginAt?.toDate(),
        profile: doc.data().profile || {}
      }));
    } catch (error: any) {
      console.error('Error getting users:', error);
      throw error;
    }
  }

  // Send password reset email
  async sendPasswordResetEmail(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(this.auth, email);
    } catch (error) {
      console.error('Error sending password reset email:', error);
      throw error;
    }
  }

  // Update user profile
  async updateProfile(updates: Partial<AppUser['profile']>): Promise<void> {
    if (!this.currentUser) {
      throw new Error('No user logged in');
    }

    try {
      await updateDoc(doc(db, 'users', this.currentUser.uid), {
        profile: { ...this.currentUser.profile, ...updates },
        updatedAt: serverTimestamp()
      });

      // Update local user data
      if (this.currentUser) {
        this.currentUser.profile = { ...this.currentUser.profile, ...updates };
        this.currentUser.updatedAt = new Date();
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  }

  // Update other user's profile (admin only)
  async updateUserProfile(userId: string, updates: Partial<AppUser>): Promise<void> {
    try {
      const currentUser = this.getCurrentUser();
      if (!currentUser || !this.hasPermission(Permission.USER_MANAGEMENT)) {
        throw new Error('Insufficient permissions');
      }

      const updateData: any = {
        updatedAt: serverTimestamp()
      };

      if (updates.displayName !== undefined) {
        updateData.displayName = updates.displayName;
      }

      if (updates.profile !== undefined) {
        updateData.profile = updates.profile;
      }

      if (updates.isActive !== undefined) {
        updateData.isActive = updates.isActive;
      }

      await updateDoc(doc(db, 'users', userId), updateData);
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }

  // Link additional social accounts
  async linkSocialAccount(provider: SocialProvider): Promise<void> {
    if (!this.currentUser) {
      throw new Error('No user logged in');
    }

    try {
      let authProvider;
      
      switch (provider) {
        case SocialProvider.GOOGLE:
          authProvider = new GoogleAuthProvider();
          break;
        case SocialProvider.APPLE:
          authProvider = new OAuthProvider('apple.com');
          break;
        case SocialProvider.FACEBOOK:
          authProvider = new FacebookAuthProvider();
          break;
        case SocialProvider.GITHUB:
          authProvider = new GithubAuthProvider();
          break;
        case SocialProvider.TWITTER:
          authProvider = new TwitterAuthProvider();
          break;
        case SocialProvider.MICROSOFT:
          authProvider = new OAuthProvider('microsoft.com');
          break;
        default:
          throw new Error('Unsupported social provider');
      }

      await linkWithPopup(this.auth.currentUser!, authProvider);
    } catch (error) {
      console.error('Error linking social account:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const authService = new AuthService();
export default authService;
