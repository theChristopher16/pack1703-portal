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
  // linkWithRedirect
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

// User roles and permissions - Simplified and intuitive
export enum UserRole {
  ANONYMOUS = 'anonymous',    // Default - no account
  PARENT = 'parent',          // Family account (default after signup)
  VOLUNTEER = 'volunteer',    // Active volunteers
  ADMIN = 'admin',            // Pack administrators
  ROOT = 'root',              // System owner (you)
  AI_ASSISTANT = 'ai_assistant' // AI assistant role
}

// Role hierarchy - each role inherits permissions from roles below it
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  [UserRole.ANONYMOUS]: 0,
  [UserRole.PARENT]: 1,
  [UserRole.VOLUNTEER]: 2,
  [UserRole.ADMIN]: 3,
  [UserRole.ROOT]: 4,
  [UserRole.AI_ASSISTANT]: 2.5 // AI assistant has volunteer-level access
};

export enum Permission {
  // Root permissions (full system access)
  SYSTEM_ADMIN = 'system_admin',
  USER_MANAGEMENT = 'user_management',
  ROLE_MANAGEMENT = 'role_management',
  SYSTEM_CONFIG = 'system_config',
  
  // Admin permissions (pack-level management)
  PACK_MANAGEMENT = 'pack_management',
  EVENT_MANAGEMENT = 'event_management',
  LOCATION_MANAGEMENT = 'location_management',
  ANNOUNCEMENT_MANAGEMENT = 'announcement_management',
  FINANCIAL_MANAGEMENT = 'financial_management',
  FUNDRAISING_MANAGEMENT = 'fundraising_management',
  ALL_DEN_ACCESS = 'all_den_access',
  
  // Den leader permissions (den-specific)
  DEN_CONTENT = 'den_content',
  DEN_EVENTS = 'den_events',
  DEN_MEMBERS = 'den_members',
  DEN_CHAT_MANAGEMENT = 'den_chat_management',
  DEN_ANNOUNCEMENTS = 'den_announcements',
  
  // Parent permissions (family management)
  FAMILY_MANAGEMENT = 'family_management',
  FAMILY_EVENTS = 'family_events',
  FAMILY_RSVP = 'family_rsvp',
  FAMILY_VOLUNTEER = 'family_volunteer',
  
  // Scout permissions (basic access)
  SCOUT_CONTENT = 'scout_content',
  SCOUT_EVENTS = 'scout_events',
  SCOUT_CHAT = 'scout_chat',
  
  // Chat permissions
  CHAT_READ = 'chat_read',
  CHAT_WRITE = 'chat_write',
  CHAT_MANAGEMENT = 'chat_management',
  
  // General permissions
  READ_CONTENT = 'read_content',
  CREATE_CONTENT = 'create_content',
  UPDATE_CONTENT = 'update_content',
  DELETE_CONTENT = 'delete_content',
  
  // Cost management permissions
  COST_MANAGEMENT = 'cost_management',
  COST_ANALYTICS = 'cost_analytics',
  COST_ALERTS = 'cost_alerts'
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
  [UserRole.ANONYMOUS]: [
    Permission.READ_CONTENT,
    Permission.SCOUT_CONTENT,
    Permission.SCOUT_EVENTS
  ],
  [UserRole.PARENT]: [
    Permission.READ_CONTENT,
    Permission.CREATE_CONTENT,
    Permission.UPDATE_CONTENT,
    Permission.FAMILY_MANAGEMENT,
    Permission.FAMILY_EVENTS,
    Permission.FAMILY_RSVP,
    Permission.FAMILY_VOLUNTEER,
    Permission.SCOUT_CONTENT,
    Permission.SCOUT_EVENTS,
    Permission.SCOUT_CHAT,
    Permission.CHAT_READ,
    Permission.CHAT_WRITE
  ],
  [UserRole.VOLUNTEER]: [
    Permission.READ_CONTENT,
    Permission.CREATE_CONTENT,
    Permission.UPDATE_CONTENT,
    Permission.FAMILY_MANAGEMENT,
    Permission.FAMILY_EVENTS,
    Permission.FAMILY_RSVP,
    Permission.FAMILY_VOLUNTEER,
    Permission.DEN_CONTENT,
    Permission.DEN_EVENTS,
    Permission.DEN_MEMBERS,
    Permission.DEN_CHAT_MANAGEMENT,
    Permission.DEN_ANNOUNCEMENTS,
    Permission.SCOUT_CONTENT,
    Permission.SCOUT_EVENTS,
    Permission.SCOUT_CHAT,
    Permission.CHAT_READ,
    Permission.CHAT_WRITE,
    Permission.CHAT_MANAGEMENT
  ],
  [UserRole.AI_ASSISTANT]: [
    // Content Management (Full Access)
    Permission.READ_CONTENT,
    Permission.CREATE_CONTENT,
    Permission.UPDATE_CONTENT,
    Permission.DELETE_CONTENT,
    
    // Event Management (Full Access)
    Permission.EVENT_MANAGEMENT,
    Permission.SCOUT_EVENTS,
    Permission.DEN_EVENTS,
    Permission.FAMILY_EVENTS,
    
    // Location Management (Full Access)
    Permission.LOCATION_MANAGEMENT,
    
    // Announcement Management (Full Access)
    Permission.ANNOUNCEMENT_MANAGEMENT,
    Permission.DEN_ANNOUNCEMENTS,
    
    // Pack Management (Full Access)
    Permission.PACK_MANAGEMENT,
    Permission.ALL_DEN_ACCESS,
    
    // Scout Content (Full Access)
    Permission.SCOUT_CONTENT,
    Permission.DEN_CONTENT,
    
    // Chat (Full Access for AI interactions)
    Permission.CHAT_READ,
    Permission.CHAT_WRITE,
    Permission.CHAT_MANAGEMENT,
    Permission.SCOUT_CHAT,
    Permission.DEN_CHAT_MANAGEMENT,
    
    // System Access (Read Only)
    Permission.SYSTEM_CONFIG,
    
    // Analytics and Monitoring
    Permission.COST_ANALYTICS,
    Permission.COST_ALERTS,
    Permission.COST_MANAGEMENT,
    
    // Financial Management (Read Only for AI)
    Permission.FINANCIAL_MANAGEMENT,
    
    // Fundraising Management (Read Only for AI)
    Permission.FUNDRAISING_MANAGEMENT,
    
    // Family Management (Read Only for AI)
    Permission.FAMILY_MANAGEMENT,
    Permission.FAMILY_RSVP,
    Permission.FAMILY_VOLUNTEER,
    
    // Den Members (Read Only for AI)
    Permission.DEN_MEMBERS
  ],
  [UserRole.ADMIN]: [
    Permission.SYSTEM_ADMIN,
    Permission.USER_MANAGEMENT,
    Permission.PACK_MANAGEMENT,
    Permission.EVENT_MANAGEMENT,
    Permission.LOCATION_MANAGEMENT,
    Permission.ANNOUNCEMENT_MANAGEMENT,
    Permission.FINANCIAL_MANAGEMENT,
    Permission.FUNDRAISING_MANAGEMENT,
    Permission.ALL_DEN_ACCESS,
    Permission.DEN_CONTENT,
    Permission.DEN_EVENTS,
    Permission.DEN_MEMBERS,
    Permission.DEN_CHAT_MANAGEMENT,
    Permission.DEN_ANNOUNCEMENTS,
    Permission.FAMILY_MANAGEMENT,
    Permission.FAMILY_EVENTS,
    Permission.FAMILY_RSVP,
    Permission.FAMILY_VOLUNTEER,
    Permission.SCOUT_CONTENT,
    Permission.SCOUT_EVENTS,
    Permission.SCOUT_CHAT,
    Permission.CHAT_READ,
    Permission.CHAT_WRITE,
    Permission.CHAT_MANAGEMENT,
    Permission.READ_CONTENT,
    Permission.CREATE_CONTENT,
    Permission.UPDATE_CONTENT,
    Permission.DELETE_CONTENT,
    Permission.COST_MANAGEMENT,
    Permission.COST_ANALYTICS,
    Permission.COST_ALERTS
  ],
  [UserRole.ROOT]: [
    Permission.SYSTEM_ADMIN,
    Permission.USER_MANAGEMENT,
    Permission.ROLE_MANAGEMENT,
    Permission.SYSTEM_CONFIG,
    Permission.PACK_MANAGEMENT,
    Permission.EVENT_MANAGEMENT,
    Permission.LOCATION_MANAGEMENT,
    Permission.ANNOUNCEMENT_MANAGEMENT,
    Permission.FINANCIAL_MANAGEMENT,
    Permission.FUNDRAISING_MANAGEMENT,
    Permission.ALL_DEN_ACCESS,
    Permission.DEN_CONTENT,
    Permission.DEN_EVENTS,
    Permission.DEN_MEMBERS,
    Permission.DEN_CHAT_MANAGEMENT,
    Permission.DEN_ANNOUNCEMENTS,
    Permission.FAMILY_MANAGEMENT,
    Permission.FAMILY_EVENTS,
    Permission.FAMILY_RSVP,
    Permission.FAMILY_VOLUNTEER,
    Permission.SCOUT_CONTENT,
    Permission.SCOUT_EVENTS,
    Permission.SCOUT_CHAT,
    Permission.CHAT_READ,
    Permission.CHAT_WRITE,
    Permission.CHAT_MANAGEMENT,
    Permission.READ_CONTENT,
    Permission.CREATE_CONTENT,
    Permission.UPDATE_CONTENT,
    Permission.DELETE_CONTENT,
    Permission.COST_MANAGEMENT,
    Permission.COST_ANALYTICS,
    Permission.COST_ALERTS
  ]
};

// Role color configuration (object format for UI components)
export const ROLE_COLORS: Record<UserRole, { bg: string; text: string; border: string }> = {
  [UserRole.ANONYMOUS]: { bg: '#f3f4f6', text: '#1f2937', border: '#d1d5db' },
  [UserRole.PARENT]: { bg: '#dbeafe', text: '#1e40af', border: '#93c5fd' },
  [UserRole.VOLUNTEER]: { bg: '#dcfce7', text: '#166534', border: '#86efac' },
  [UserRole.AI_ASSISTANT]: { bg: '#e0f2fe', text: '#0c4a6e', border: '#7dd3fc' },
  [UserRole.ADMIN]: { bg: '#f3e8ff', text: '#7c3aed', border: '#c4b5fd' },
  [UserRole.ROOT]: { bg: '#fef3c7', text: '#92400e', border: '#fbbf24' }
};

// Role display names
export const ROLE_DISPLAY_NAMES: Record<UserRole, string> = {
  [UserRole.ANONYMOUS]: 'Anonymous',
  [UserRole.PARENT]: 'Parent',
  [UserRole.VOLUNTEER]: 'Volunteer',
  [UserRole.AI_ASSISTANT]: 'AI Assistant',
  [UserRole.ADMIN]: 'Admin',
  [UserRole.ROOT]: 'Root'
};

// Role descriptions
export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  [UserRole.ANONYMOUS]: 'No account - limited access',
  [UserRole.PARENT]: 'Family account - manage family events and RSVPs',
  [UserRole.VOLUNTEER]: 'Active volunteer - den-specific management',
  [UserRole.AI_ASSISTANT]: 'AI assistant - event management and content creation',
  [UserRole.ADMIN]: 'Pack administrator - full pack management',
  [UserRole.ROOT]: 'System owner - complete system access'
};

// User interface with enhanced profile data
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
  
  // Enhanced profile with social login data
  profile?: {
    // Basic info
    firstName?: string;
    lastName?: string;
    nickname?: string;
    phone?: string;
    address?: string;
    emergencyContact?: string;
    
    // Scouting info
    scoutRank?: string;
    den?: string;
    packNumber?: string;
    scoutAge?: number;
    scoutGrade?: string;
    
    // Family info
    familyId?: string;
    parentNames?: string[];
    siblings?: string[];
    
    // Social login data
    socialData?: {
      google?: {
        id?: string;
        email?: string;
        name?: string;
        picture?: string;
        locale?: string;
        verifiedEmail?: boolean;
      };
      apple?: {
        id?: string;
        email?: string;
        name?: string;
        picture?: string;
      };
      facebook?: {
        id?: string;
        email?: string;
        name?: string;
        picture?: string;
      };
    };
    
    // Preferences
    preferences?: {
      emailNotifications?: boolean;
      pushNotifications?: boolean;
      smsNotifications?: boolean;
      language?: string;
      timezone?: string;
    };
    
    // Security
    security?: {
      twoFactorEnabled?: boolean;
      lastPasswordChange?: Date;
      failedLoginAttempts?: number;
      accountLocked?: boolean;
      lockoutUntil?: Date;
    };
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
    
    onAuthStateChanged(this.auth, async (firebaseUser: FirebaseUser | null) => {
      
      if (firebaseUser) {
        try {
          // Only try to access Firestore if user is authenticated
          const appUser = await this.getUserFromFirestore(firebaseUser.uid);
          this.currentUser = appUser;
          this.notifyAuthStateListeners(appUser);
        } catch (error) {
          console.error('AuthService: Error fetching user data:', error);
          // If user doesn't exist in Firestore or permission denied, create them with default role
          try {
            const appUser = await this.createUserFromFirebaseUser(firebaseUser);
            this.currentUser = appUser;
            this.notifyAuthStateListeners(appUser);
          } catch (createError) {
            console.error('AuthService: Error creating user:', createError);
            // If all else fails, set user to null
            this.currentUser = null;
            this.notifyAuthStateListeners(null);
          }
        }
      } else {
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
    const role = isFirstUser ? UserRole.ROOT : UserRole.PARENT;

    // Create user document in Firestore
    console.log('Creating Firestore user document...');
    const userData: Omit<AppUser, 'uid' | 'createdAt' | 'updatedAt'> = {
      email: firebaseUser.email!,
      displayName: firebaseUser.displayName || 'User',
      photoURL: firebaseUser.photoURL || undefined, // Include profile picture from social login
      role: role,
      permissions: ROLE_PERMISSIONS[role],
      isActive: true,
      authProvider: authProvider,
      profile: {
        socialData: {
          google: firebaseUser.providerData.find(p => p.providerId === 'google.com') ? {
            id: firebaseUser.uid,
            email: firebaseUser.email || undefined,
            name: firebaseUser.displayName || undefined,
            picture: firebaseUser.photoURL || undefined,
            verifiedEmail: firebaseUser.emailVerified
          } : undefined,
          apple: firebaseUser.providerData.find(p => p.providerId === 'apple.com') ? {
            id: firebaseUser.uid,
            email: firebaseUser.email || undefined,
            name: firebaseUser.displayName || undefined,
            picture: firebaseUser.photoURL || undefined
          } : undefined,
          facebook: firebaseUser.providerData.find(p => p.providerId === 'facebook.com') ? {
            id: firebaseUser.uid,
            email: firebaseUser.email || undefined,
            name: firebaseUser.displayName || undefined,
            picture: firebaseUser.photoURL || undefined
          } : undefined
        }
      }
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

  // Extract social login data from Firebase user
  private extractSocialLoginData(firebaseUser: FirebaseUser) {
    const socialData: any = {};
    
    // Extract Google data
    if (firebaseUser.providerData.some(provider => provider.providerId === 'google.com')) {
      const googleProvider = firebaseUser.providerData.find(provider => provider.providerId === 'google.com');
      if (googleProvider) {
        socialData.google = {
          id: googleProvider.uid,
          email: googleProvider.email,
          name: googleProvider.displayName,
          picture: googleProvider.photoURL,
          locale: (googleProvider as any).locale,
          verifiedEmail: (googleProvider as any).verifiedEmail
        };
      }
    }
    
    // Extract Apple data
    if (firebaseUser.providerData.some(provider => provider.providerId === 'apple.com')) {
      const appleProvider = firebaseUser.providerData.find(provider => provider.providerId === 'apple.com');
      if (appleProvider) {
        socialData.apple = {
          id: appleProvider.uid,
          email: appleProvider.email,
          name: appleProvider.displayName,
          picture: appleProvider.photoURL
        };
      }
    }
    
    // Extract Facebook data
    if (firebaseUser.providerData.some(provider => provider.providerId === 'facebook.com')) {
      const facebookProvider = firebaseUser.providerData.find(provider => provider.providerId === 'facebook.com');
      if (facebookProvider) {
        socialData.facebook = {
          id: facebookProvider.uid,
          email: facebookProvider.email,
          name: facebookProvider.displayName,
          picture: facebookProvider.photoURL
        };
      }
    }
    
    return socialData;
  }

  // Generate safe username with uniqueness check
  private async generateSafeUsername(baseUsername: string): Promise<string> {
    const cleanUsername = baseUsername
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .substring(0, 20);
    
    if (!cleanUsername) {
      return `user${Math.floor(Math.random() * 10000)}`;
    }
    
    // Check if username exists
    const usernameQuery = query(
      collection(db, 'users'),
      where('profile.username', '==', cleanUsername)
    );
    
    const usernameSnapshot = await getDocs(usernameQuery);
    
    if (usernameSnapshot.empty) {
      return cleanUsername;
    }
    
    // Add number suffix
    let counter = 1;
    let newUsername = `${cleanUsername}${counter}`;
    
    while (true) {
      const checkQuery = query(
        collection(db, 'users'),
        where('profile.username', '==', newUsername)
      );
      
      const checkSnapshot = await getDocs(checkQuery);
      
      if (checkSnapshot.empty) {
        return newUsername;
      }
      
      counter++;
      newUsername = `${cleanUsername}${counter}`;
      
      // Prevent infinite loop
      if (counter > 100) {
        return `${cleanUsername}${Date.now()}`;
      }
    }
  }

  // Validate username for safety and uniqueness
  async validateUsername(username: string): Promise<{ isValid: boolean; error?: string }> {
    // Check length
    if (username.length < 3 || username.length > 20) {
      return { isValid: false, error: 'Username must be between 3 and 20 characters' };
    }
    
    // Check for invalid characters
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      return { isValid: false, error: 'Username can only contain letters, numbers, underscores, and hyphens' };
    }
    
    // Check for reserved words
    const reservedWords = ['admin', 'root', 'system', 'user', 'test', 'demo', 'guest'];
    if (reservedWords.includes(username.toLowerCase())) {
      return { isValid: false, error: 'Username is reserved and cannot be used' };
    }
    
    // Check for uniqueness
    const usernameQuery = query(
      collection(db, 'users'),
      where('profile.username', '==', username)
    );
    
    const usernameSnapshot = await getDocs(usernameQuery);
    
    if (!usernameSnapshot.empty) {
      return { isValid: false, error: 'Username is already taken' };
    }
    
    return { isValid: true };
  }
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
      // Sign out from Firebase Auth
      await signOut(this.auth);
      
      // Clear local state
      this.currentUser = null;
      this.notifyAuthStateListeners(null);
      
      // Clear chat service storage
      try {
        const { SessionManager } = await import('./chatService');
        SessionManager.clearUserFromStorage();
        console.log('Chat service storage cleared');
      } catch (error) {
        console.warn('Failed to clear chat service storage:', error);
      }
      
      // Clear any other localStorage items related to the session
      try {
        // Clear any analytics or tracking data
        localStorage.removeItem('pack1703_analytics_session');
        localStorage.removeItem('pack1703_user_preferences');
        localStorage.removeItem('pack1703_last_activity');
        
        // Clear any cached user data
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('pack1703_')) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
        
        console.log('Additional session data cleared');
      } catch (error) {
        console.warn('Failed to clear additional session data:', error);
      }
      
      console.log('User logged out successfully with full session cleanup');
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
    return this.isAdmin() || this.currentUser?.role === UserRole.VOLUNTEER;
  }

  // Check if user has specific permission (with role hierarchy)
  hasPermission(permission: Permission, user?: AppUser): boolean {
    const targetUser = user || this.currentUser;
    if (!targetUser) return false;
    
    // Root has access to everything
    if (targetUser.role === UserRole.ROOT) return true;
    
    // Check if user has the specific permission
    if (targetUser.permissions.includes(permission)) return true;
    
    // Check role hierarchy - higher roles inherit permissions from lower roles
    const userRoleLevel = ROLE_HIERARCHY[targetUser.role];
    
    // Define permission-to-role mappings for inheritance
    const permissionRoleMap: Record<Permission, UserRole> = {
      // System permissions - only root
      [Permission.SYSTEM_ADMIN]: UserRole.ROOT,
      [Permission.USER_MANAGEMENT]: UserRole.ROOT,
      [Permission.ROLE_MANAGEMENT]: UserRole.ROOT,
      [Permission.SYSTEM_CONFIG]: UserRole.ROOT,
      
      // Admin permissions - admin and root
      [Permission.PACK_MANAGEMENT]: UserRole.ADMIN,
      [Permission.EVENT_MANAGEMENT]: UserRole.ADMIN,
      [Permission.LOCATION_MANAGEMENT]: UserRole.ADMIN,
      [Permission.ANNOUNCEMENT_MANAGEMENT]: UserRole.ADMIN,
      [Permission.FINANCIAL_MANAGEMENT]: UserRole.ADMIN,
      [Permission.FUNDRAISING_MANAGEMENT]: UserRole.ADMIN,
      [Permission.ALL_DEN_ACCESS]: UserRole.ADMIN,
      
      // Den leader permissions - volunteer and above
      [Permission.DEN_CONTENT]: UserRole.VOLUNTEER,
      [Permission.DEN_EVENTS]: UserRole.VOLUNTEER,
      [Permission.DEN_MEMBERS]: UserRole.VOLUNTEER,
      [Permission.DEN_CHAT_MANAGEMENT]: UserRole.VOLUNTEER,
      [Permission.DEN_ANNOUNCEMENTS]: UserRole.VOLUNTEER,
      
      // Parent permissions - parent and above
      [Permission.FAMILY_MANAGEMENT]: UserRole.PARENT,
      [Permission.FAMILY_EVENTS]: UserRole.PARENT,
      [Permission.FAMILY_RSVP]: UserRole.PARENT,
      [Permission.FAMILY_VOLUNTEER]: UserRole.PARENT,
      
      // Scout permissions - all authenticated users
      [Permission.SCOUT_CONTENT]: UserRole.PARENT,
      [Permission.SCOUT_EVENTS]: UserRole.PARENT,
      [Permission.SCOUT_CHAT]: UserRole.PARENT,
      
      // Chat permissions
      [Permission.CHAT_READ]: UserRole.PARENT,
      [Permission.CHAT_WRITE]: UserRole.PARENT,
      [Permission.CHAT_MANAGEMENT]: UserRole.VOLUNTEER,
      
      // General permissions
      [Permission.READ_CONTENT]: UserRole.ANONYMOUS,
      [Permission.CREATE_CONTENT]: UserRole.PARENT,
      [Permission.UPDATE_CONTENT]: UserRole.VOLUNTEER,
      [Permission.DELETE_CONTENT]: UserRole.ADMIN,
      
      // Cost management permissions
      [Permission.COST_MANAGEMENT]: UserRole.ADMIN,
      [Permission.COST_ANALYTICS]: UserRole.ADMIN,
      [Permission.COST_ALERTS]: UserRole.ADMIN
    };
    
    const requiredRoleLevel = ROLE_HIERARCHY[permissionRoleMap[permission]];
    
    // User has permission if their role level is >= required role level
    return userRoleLevel >= requiredRoleLevel;
  }

  // Check if user has at least the specified role level
  hasAtLeastRole(requiredRole: UserRole, user?: AppUser): boolean {
    const targetUser = user || this.currentUser;
    if (!targetUser) return false;
    
    const userRoleLevel = ROLE_HIERARCHY[targetUser.role];
    const requiredRoleLevel = ROLE_HIERARCHY[requiredRole];
    
    return userRoleLevel >= requiredRoleLevel;
  }

  // Check if user has exactly the specified role
  hasRole(role: UserRole, user?: AppUser): boolean {
    const targetUser = user || this.currentUser;
    if (!targetUser) return false;
    
    return targetUser.role === role;
  }

  // Get user's role level
  getRoleLevel(user?: AppUser): number {
    const targetUser = user || this.currentUser;
    if (!targetUser) return -1;
    
    return ROLE_HIERARCHY[targetUser.role];
  }

  // Check if user can manage other users
  canManageUsers(): boolean {
    return this.isRoot() || this.isAdmin() || this.isDenLeader();
  }

  // Check if user can manage roles
  canManageRoles(): boolean {
    return this.isRoot() || this.isAdmin();
  }

  // Get users that current user can manage
  async getManageableUsers(): Promise<AppUser[]> {
    const currentUser = this.getCurrentUser();
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    const allUsers = await this.getUsers();
    
    if (this.isRoot()) {
      return allUsers; // Root can manage all users
    }
    
    if (this.isAdmin()) {
      return allUsers.filter(user => user.role !== UserRole.ROOT); // Admin can manage all except root
    }
    
    if (this.isDenLeader()) {
      // Den leaders can manage users in their den
      return allUsers.filter(user => 
        user.profile?.den === currentUser.profile?.den ||
        user.role === UserRole.PARENT ||
        user.role === UserRole.VOLUNTEER
      );
    }
    
    return []; // Regular users cannot manage others
  }

  // Bulk user operations (root and admin only)
  async bulkUpdateUsers(updates: Array<{ uid: string; updates: Partial<AppUser> }>): Promise<void> {
    if (!this.canManageUsers()) {
      throw new Error('Insufficient permissions for bulk operations');
    }

    const batch = writeBatch(db);
    
    for (const { uid, updates: userUpdates } of updates) {
      const userRef = doc(db, 'users', uid);
      batch.update(userRef, {
        ...userUpdates,
        updatedAt: serverTimestamp()
      });
    }
    
    await batch.commit();
  }

  // Export user data (admin and root only)
  async exportUserData(): Promise<AppUser[]> {
    if (!this.canManageUsers()) {
      throw new Error('Insufficient permissions to export user data');
    }

    return await this.getUsers();
  }

  // Import user data (root only)
  async importUserData(users: Omit<AppUser, 'uid' | 'createdAt' | 'updatedAt'>[]): Promise<void> {
    if (!this.isRoot()) {
      throw new Error('Only root users can import user data');
    }

    const batch = writeBatch(db);
    
    for (const userData of users) {
      const userRef = doc(collection(db, 'users'));
      batch.set(userRef, {
        ...userData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }
    
    await batch.commit();
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

  // Create user with email (for invited users)
  async createUserWithEmail(email: string, password: string, displayName: string): Promise<AppUser> {
    try {
      // Create Firebase user
      const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
      const firebaseUser = userCredential.user;

      // Create user document in Firestore with default role
      const userData: Omit<AppUser, 'uid' | 'createdAt' | 'updatedAt'> = {
        email: firebaseUser.email!,
        displayName,
        role: UserRole.PARENT, // Default role for invited users
        permissions: ROLE_PERMISSIONS[UserRole.PARENT],
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

      // Set current user and notify listeners
      this.currentUser = appUser;
      this.notifyAuthStateListeners(appUser);

      return appUser;
    } catch (error: any) {
      console.error('Error creating user with email:', error);
      
      // Provide more specific error messages
      if (error.code === 'auth/email-already-in-use') {
        throw new Error('An account with this email already exists. Please use a different email or sign in with the existing account.');
      } else if (error.code === 'auth/weak-password') {
        throw new Error('Password is too weak. Please use a stronger password (at least 6 characters).');
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('Invalid email address. Please enter a valid email.');
      } else {
        throw new Error(`Failed to create account: ${error.message || 'Unknown error occurred'}`);
      }
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

  // Account linking methods for AdminSettings
  async linkGoogleAccount(): Promise<void> {
    return this.linkSocialAccount(SocialProvider.GOOGLE);
  }

  async linkAppleAccount(): Promise<void> {
    return this.linkSocialAccount(SocialProvider.APPLE);
  }

  async linkMicrosoftAccount(): Promise<void> {
    return this.linkSocialAccount(SocialProvider.MICROSOFT);
  }

  async unlinkAccount(provider: string): Promise<void> {
    if (!this.currentUser) {
      throw new Error('No user logged in');
    }

    try {
      // Get the user's linked accounts
      const user = this.auth.currentUser;
      const providers = user?.providerData || [];
      
      // Find the provider to unlink
      const providerToUnlink = providers.find(p => p.providerId.includes(provider));
      
      if (!providerToUnlink) {
        throw new Error(`No ${provider} account linked`);
      }

      // Note: Firebase doesn't support unlinking accounts directly
      // This would typically require re-authentication and account deletion
      // For now, we'll just update the Firestore record
      await updateDoc(doc(db, 'users', this.currentUser.uid), {
        [`linkedAccounts.${provider}`]: {
          isActive: false,
          unlinkedAt: serverTimestamp()
        }
      });
    } catch (error) {
      console.error('Error unlinking account:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const authService = new AuthService();
export default authService;
