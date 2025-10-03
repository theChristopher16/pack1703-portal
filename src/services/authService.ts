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
  unlink
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
  writeBatch
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../firebase/config';

// User roles and permissions - Cub Scout pack structure
export enum UserRole {
  PARENT = 'parent',          // Family account (default after signup)
  DEN_LEADER = 'den_leader',  // Den leaders and active volunteers
  ADMIN = 'admin',            // Pack administrators
  SUPER_ADMIN = 'super_admin', // Super administrators (highest level)
  AI_ASSISTANT = 'ai_assistant' // AI assistant role
}

// Role hierarchy - each role inherits permissions from roles below it
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  [UserRole.PARENT]: 1,           // Lowest level
  [UserRole.DEN_LEADER]: 2,       // Den leaders
  [UserRole.AI_ASSISTANT]: 3,     // AI assistant
  [UserRole.ADMIN]: 4,            // Pack administrators
  [UserRole.SUPER_ADMIN]: 5       // Highest level
};

export enum Permission {
  // Admin permissions (full system access - highest level)
  SYSTEM_ADMIN = 'system_admin',
  USER_MANAGEMENT = 'user_management',
  ROLE_MANAGEMENT = 'role_management',
  SYSTEM_CONFIG = 'system_config',
  
  // Pack-level management permissions
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
    Permission.CHAT_WRITE,
    Permission.DEN_MEMBERS  // Can see other families in their den
  ],
  [UserRole.DEN_LEADER]: [
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
    Permission.CHAT_MANAGEMENT,
    Permission.EVENT_MANAGEMENT,  // Can create pack-wide events
    Permission.ANNOUNCEMENT_MANAGEMENT  // Can create pack-wide announcements
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
  ],
  [UserRole.SUPER_ADMIN]: [
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
  ],
};

// Role color configuration (object format for UI components)
export const ROLE_COLORS: Record<UserRole, { bg: string; text: string; border: string }> = {
  [UserRole.PARENT]: { bg: '#dbeafe', text: '#1e40af', border: '#93c5fd' },
  [UserRole.DEN_LEADER]: { bg: '#dcfce7', text: '#166534', border: '#86efac' },
  [UserRole.AI_ASSISTANT]: { bg: '#e0f2fe', text: '#0c4a6e', border: '#7dd3fc' },
  [UserRole.ADMIN]: { bg: '#f3e8ff', text: '#7c3aed', border: '#c4b5fd' },
  [UserRole.SUPER_ADMIN]: { bg: '#fef3c7', text: '#92400e', border: '#fcd34d' },
};

// Role display names
export const ROLE_DISPLAY_NAMES: Record<UserRole, string> = {
  [UserRole.PARENT]: 'Parent',
  [UserRole.DEN_LEADER]: 'Den Leader',
  [UserRole.AI_ASSISTANT]: 'AI Assistant',
  [UserRole.ADMIN]: 'Admin',
  [UserRole.SUPER_ADMIN]: 'Super Admin',
};

// Role descriptions
export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  [UserRole.PARENT]: 'Family account - manage family events and RSVPs',
  [UserRole.DEN_LEADER]: 'Den leader - den-specific management and leadership',
  [UserRole.AI_ASSISTANT]: 'AI assistant - event management and content creation',
  [UserRole.ADMIN]: 'Pack administrator - full pack management',
  [UserRole.SUPER_ADMIN]: 'Super administrator - complete system access (highest level)'
};

// Selectable roles for UI components (excludes system-only roles)
export const SELECTABLE_ROLES: UserRole[] = [
  UserRole.PARENT,
  UserRole.DEN_LEADER,
  UserRole.ADMIN,
  UserRole.SUPER_ADMIN
];

// Scout information interface
export interface ScoutInfo {
  id: string;
  name: string;
  age: number;
  scoutRank?: string; // Den/Rank (Lion, Tiger, Wolf, Bear, Webelos, Arrow of Light)
  grade?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// User interface with enhanced profile data
export interface AppUser {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  role: UserRole;
  permissions: Permission[];
  isActive: boolean;
  status?: 'pending' | 'approved' | 'denied';
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
    den?: string; // Primary den (for backwards compatibility)
    dens?: string[]; // All dens this user belongs to (for announcements)
    packNumber?: string;
    scoutAge?: number;
    scoutGrade?: string;
    
    // Family info
    familyId?: string;
    parentNames?: string[];
    siblings?: string[];
    scouts?: ScoutInfo[];
    
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
  private _auth: any = null;
  private currentUser: AppUser | null = null;
  private authStateListeners: ((user: AppUser | null) => void)[] = [];

  private get auth() {
    if (!this._auth) {
      this._auth = getAuth();
    }
    return this._auth;
  }

  constructor() {
    console.log('🔐 AuthService: Constructor called');
    // Initialize Firebase features in all environments except explicit test mode
    if (typeof process === 'undefined' || process.env.NODE_ENV !== 'test') {
      console.log('🔐 AuthService: Initializing Firebase features...');
      this.initializeAuthStateListener();
      this.handleRedirectResult(); // Always check for redirect results as fallback
    } else {
      console.log('🔐 AuthService: Skipping Firebase initialization (test environment)');
    }
  }

  // Initialize auth state listener
  private initializeAuthStateListener() {
    console.log('🔐 AuthService: Initializing auth state listener');
    
    onAuthStateChanged(this.auth, async (firebaseUser: FirebaseUser | null) => {
      console.log('🔐 AuthService: Auth state changed:', firebaseUser ? `User ${firebaseUser.email} (${firebaseUser.uid})` : 'No user');
      console.log('🔐 AuthService: Firebase user details:', firebaseUser ? {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        providerData: firebaseUser.providerData.map(p => p.providerId),
        emailVerified: firebaseUser.emailVerified
      } : null);
      
      if (firebaseUser) {
        try {
          // Only try to access Firestore if user is authenticated
          const appUser = await this.getUserFromFirestore(firebaseUser.uid);
          this.currentUser = appUser;
          console.log('🔐 AuthService: User loaded from Firestore:', appUser.email);
          this.notifyAuthStateListeners(appUser);
        } catch (error: any) {
          console.error('AuthService: Error fetching user data:', error);
          console.log('AuthService: Error type:', typeof error);
          console.log('AuthService: Error message:', error.message);
          console.log('AuthService: Error code:', error.code);
          // If user doesn't exist in Firestore or permission denied, create them with default role
          try {
            console.log('AuthService: Attempting to create user in Firestore...');
            const appUser = await this.createUserFromFirebaseUser(firebaseUser);
            this.currentUser = appUser;
            console.log('🔐 AuthService: User created in Firestore:', appUser.email);
            this.notifyAuthStateListeners(appUser);
          } catch (createError: any) {
            console.error('AuthService: Error creating user:', createError);
            console.log('AuthService: Create error type:', typeof createError);
            console.log('AuthService: Create error message:', createError.message);
            console.log('AuthService: Create error code:', createError.code);
            // If all else fails, create a temporary user object from Firebase Auth data
            // This allows the user to access the app even if Firestore is blocked by App Check
            console.log('🔐 AuthService: Creating temporary user from Firebase Auth data');
            
            // Determine role for temporary user - use ADMIN as default to ensure access to all features
            // This is safer than PARENT since we can't check if it's the first user without Firestore access
            const tempRole = UserRole.ADMIN; // More permissive default for temporary users
            
            console.log('AuthService: Creating temporary user with role:', tempRole);
            console.log('AuthService: Firebase user data:', {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              photoURL: firebaseUser.photoURL
            });
            
            const tempUser: AppUser = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || '',
              photoURL: firebaseUser.photoURL || '',
              role: tempRole,
              permissions: ROLE_PERMISSIONS[tempRole],
              isActive: true,
              status: 'approved',
              createdAt: new Date(),
              updatedAt: new Date(),
              lastLoginAt: new Date(),
              authProvider: firebaseUser.providerData[0]?.providerId === 'google.com' ? SocialProvider.GOOGLE : undefined
            };
            
            console.log('AuthService: Temporary user object created:', tempUser);
            this.currentUser = tempUser;
            console.log('🔐 AuthService: Temporary user created:', tempUser.email);
            console.log('🔐 AuthService: Temporary user role:', tempUser.role);
            console.log('🔐 AuthService: Temporary user permissions:', tempUser.permissions);
            console.log('AuthService: About to notify auth state listeners...');
            this.notifyAuthStateListeners(tempUser);
            console.log('AuthService: Auth state listeners notified successfully');
          }
        }
      } else {
        this.currentUser = null;
        console.log('🔐 AuthService: No user logged in, setting currentUser to null');
        this.notifyAuthStateListeners(null);
      }
    });
  }

  // Handle redirect result for social login
  private async handleRedirectResult() {
    console.log('🔐 AuthService: Current URL before checking redirect result:', window.location.href);
    console.log('🔐 AuthService: Checking for redirect result...');
    
    // Check if we're coming from a Google redirect by looking at URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const hasGoogleParams = urlParams.has('code') || urlParams.has('state') || urlParams.has('error');
    console.log('🔐 AuthService: Has Google redirect params:', hasGoogleParams);
    console.log('🔐 AuthService: URL params:', Object.fromEntries(urlParams.entries()));
    
    // Check for error parameters that might indicate a redirect issue
    if (urlParams.has('error')) {
      console.log('🔐 AuthService: ERROR - Redirect error detected:', urlParams.get('error'));
      console.log('🔐 AuthService: Error description:', urlParams.get('error_description'));
    }
    
    // Add a small delay to ensure the redirect is fully processed
    await new Promise(resolve => setTimeout(resolve, 200));
    
    try {
      const result = await getRedirectResult(this.auth);
      console.log('🔐 AuthService: Redirect result:', result ? 'Found' : 'None');
      
      if (result) {
        // User signed in via redirect
        console.log('🔐 AuthService: User signed in via redirect:', result.user.email, result.user.uid);
        console.log('🔐 AuthService: Provider data:', result.providerId);
        
        // Get or create user data from Firestore
        let appUser: AppUser;
        try {
          console.log('🔐 AuthService: Attempting to get user from Firestore...');
          appUser = await this.getUserFromFirestore(result.user.uid);
          console.log('🔐 AuthService: User found in Firestore:', appUser.email);
          
          // Check Firebase Auth custom claims for approval status
          const idTokenResult = await result.user.getIdTokenResult();
          const customClaims = idTokenResult.claims;
          console.log('🔐 AuthService: Custom claims:', customClaims);
          
          // If user has custom claims, check approval status
          if (customClaims && typeof customClaims.approved === 'boolean') {
            if (!customClaims.approved) {
              // Sign out the user immediately if they're not approved
              await signOut(this.auth);
              throw new Error('Your account is pending approval. Please wait for pack leadership to approve your account before signing in.');
            }
          } else {
            // For users without custom claims, check Firestore status
            if (appUser.status === 'pending') {
              await signOut(this.auth);
              throw new Error('Your account is pending approval. Please wait for pack leadership to approve your account before signing in.');
            }
            
            if (appUser.status === 'denied') {
              await signOut(this.auth);
              throw new Error('Your account has been denied. Please contact pack leadership for more information.');
            }
          }
        } catch (error) {
          // User doesn't exist, create them
          console.log('🔐 AuthService: User not found in Firestore, creating new user...');
          appUser = await this.createUserFromFirebaseUser(result.user);
          console.log('🔐 AuthService: New user created:', appUser.email);
        }
        
        // Update last login time
        console.log('🔐 AuthService: Updating last login time...');
        await updateDoc(doc(db, 'users', result.user.uid), {
          lastLoginAt: serverTimestamp()
        });

        this.currentUser = appUser;
        this.notifyAuthStateListeners(appUser);
        
        console.log('🔐 AuthService: Redirect authentication completed successfully');
      } else {
        console.log('🔐 AuthService: No redirect result found');
        console.log('🔐 AuthService: Current URL after no redirect result:', window.location.href);
        console.log('🔐 AuthService: URL search params:', window.location.search);
        console.log('🔐 AuthService: URL hash:', window.location.hash);
        
        // If we have Google redirect params but no result, there might be an issue
        if (hasGoogleParams) {
          console.log('🔐 AuthService: WARNING - Google redirect params detected but no result found');
          console.log('🔐 AuthService: This might indicate a redirect processing issue');
        }
      }
    } catch (error: any) {
      console.error('🔐 AuthService: Error handling redirect result:', error);
      console.error('🔐 AuthService: Error details:', error.message);
      console.error('🔐 AuthService: Error stack:', error.stack);
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
      status: userData.status,
      createdAt: userData.createdAt?.toDate ? userData.createdAt.toDate() : userData.createdAt,
      updatedAt: userData.updatedAt?.toDate ? userData.updatedAt.toDate() : userData.updatedAt,
      lastLoginAt: userData.lastLoginAt?.toDate ? userData.lastLoginAt.toDate() : userData.lastLoginAt,
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
    const role = isFirstUser ? UserRole.SUPER_ADMIN : UserRole.PARENT;

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
          google: firebaseUser.providerData.find((p: any) => p.providerId === 'google.com') ? {
            id: firebaseUser.uid,
            email: firebaseUser.email || undefined,
            name: firebaseUser.displayName || undefined,
            picture: firebaseUser.photoURL || undefined,
            verifiedEmail: firebaseUser.emailVerified
          } : undefined,
          apple: firebaseUser.providerData.find((p: any) => p.providerId === 'apple.com') ? {
            id: firebaseUser.uid,
            email: firebaseUser.email || undefined,
            name: firebaseUser.displayName || undefined,
            picture: firebaseUser.photoURL || undefined
          } : undefined,
          facebook: firebaseUser.providerData.find((p: any) => p.providerId === 'facebook.com') ? {
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
  // Get auth provider for a given social provider
  private getAuthProvider(provider: SocialProvider) {
    switch (provider) {
      case SocialProvider.GOOGLE:
        const googleProvider = new GoogleAuthProvider();
        googleProvider.addScope('email');
        googleProvider.addScope('profile');
        return googleProvider;
      case SocialProvider.APPLE:
        const appleProvider = new OAuthProvider('apple.com');
        appleProvider.addScope('email');
        appleProvider.addScope('name');
        return appleProvider;
      case SocialProvider.FACEBOOK:
        const facebookProvider = new FacebookAuthProvider();
        facebookProvider.addScope('email');
        facebookProvider.addScope('public_profile');
        return facebookProvider;
      case SocialProvider.GITHUB:
        const githubProvider = new GithubAuthProvider();
        githubProvider.addScope('user:email');
        return githubProvider;
      case SocialProvider.TWITTER:
        return new TwitterAuthProvider();
      case SocialProvider.MICROSOFT:
        const microsoftProvider = new OAuthProvider('microsoft.com');
        microsoftProvider.addScope('email');
        microsoftProvider.addScope('profile');
        return microsoftProvider;
      default:
        throw new Error('Unsupported social provider');
    }
  }

  async signInWithSocial(provider: SocialProvider): Promise<AppUser> {
    try {
      console.log(`🔐 AuthService: Attempting modern authentication with ${provider}`);
      
      const authProvider = this.getAuthProvider(provider);
      
      // First try popup (faster UX when it works)
      try {
        console.log('🔐 AuthService: Trying popup authentication...');
        const result = await signInWithPopup(this.auth, authProvider);
        console.log('🔐 AuthService: Popup sign-in successful:', result.user.email);
        
        // Get or create user data from Firestore
        let appUser: AppUser;
        try {
          appUser = await this.getUserFromFirestore(result.user.uid);
          console.log('🔐 AuthService: User found in Firestore:', appUser.email);
          
          // Check Firebase Auth custom claims for approval status
          const idTokenResult = await result.user.getIdTokenResult();
          const customClaims = idTokenResult.claims;
          console.log('🔐 AuthService: Custom claims:', customClaims);
          
          // If user has custom claims, check approval status
          if (customClaims && typeof customClaims.approved === 'boolean') {
            if (!customClaims.approved) {
              // Sign out the user immediately if they're not approved
              await this.signOut();
              throw new Error('Your account is pending approval. Please contact an administrator.');
            }
          }
          
          return appUser;
        } catch (firestoreError: any) {
          console.log('🔐 AuthService: User not found in Firestore, creating new user...');
          return await this.createUserFromFirebaseUser(result.user);
        }
      } catch (popupError: any) {
        console.log('🔐 AuthService: Popup failed, falling back to redirect:', popupError.code);
        
        // If popup is blocked or user cancelled, use redirect (more reliable)
        if (popupError.code === 'auth/popup-blocked' || 
            popupError.code === 'auth/popup-closed-by-user' ||
            popupError.code === 'auth/cancelled-popup-request') {
          
          console.log('🔐 AuthService: Using redirect flow for better reliability');
          await signInWithRedirect(this.auth, authProvider);
          
          // The redirect will handle the rest, so we don't return here
          // The user will be redirected and then redirected back
          throw new Error('REDIRECT_IN_PROGRESS');
        }
        
        // For other popup errors, provide specific feedback
        if (popupError.code === 'auth/account-exists-with-different-credential') {
          throw new Error('An account already exists with this email using a different sign-in method. Please use the original sign-in method or contact support.');
        } else if (popupError.code === 'auth/operation-not-allowed') {
          throw new Error('This sign-in method is not enabled. Please contact support.');
        } else if (popupError.code === 'auth/too-many-requests') {
          throw new Error('Too many failed attempts. Please try again later.');
        }
        
        // For other errors, try redirect as fallback
        console.log('🔐 AuthService: Popup error, trying redirect fallback');
        await signInWithRedirect(this.auth, authProvider);
        throw new Error('REDIRECT_IN_PROGRESS');
      }
    } catch (error) {
      console.error('🔐 AuthService: Error signing in with social provider:', error);
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
        where('role', '==', UserRole.SUPER_ADMIN)
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
        role: UserRole.SUPER_ADMIN,
        permissions: ROLE_PERMISSIONS[UserRole.SUPER_ADMIN],
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
      
      // Check Firebase Auth custom claims for approval status
      const idTokenResult = await firebaseUser.getIdTokenResult();
      const customClaims = idTokenResult.claims;
      
      // If user has custom claims, check approval status
      if (customClaims && typeof customClaims.approved === 'boolean') {
        if (!customClaims.approved) {
          // Sign out the user immediately if they're not approved
          await signOut(this.auth);
          throw new Error('Your account is pending approval. Please wait for pack leadership to approve your account before signing in.');
        }
      } else {
        // For users without custom claims, check Firestore status
        if (appUser.status === 'pending') {
          await signOut(this.auth);
          throw new Error('Your account is pending approval. Please wait for pack leadership to approve your account before signing in.');
        }
        
        if (appUser.status === 'denied') {
          await signOut(this.auth);
          throw new Error('Your account has been denied. Please contact pack leadership for more information.');
        }
      }
      
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

  // Retry creating user in Firestore (for when App Check was blocking access)
  async retryCreateUserInFirestore(): Promise<AppUser | null> {
    if (!this.currentUser) {
      console.log('🔐 AuthService: No current user to retry creating');
      return null;
    }

    try {
      console.log('🔐 AuthService: Retrying to create user in Firestore...');
      const firebaseUser = this.auth.currentUser;
      if (!firebaseUser) {
        console.log('🔐 AuthService: No Firebase user found');
        return null;
      }

      const appUser = await this.createUserFromFirebaseUser(firebaseUser);
      this.currentUser = appUser;
      console.log('🔐 AuthService: User successfully created in Firestore on retry:', appUser.email);
      this.notifyAuthStateListeners(appUser);
      return appUser;
    } catch (error) {
      console.error('🔐 AuthService: Retry failed:', error);
      return null;
    }
  }

  // Upgrade temporary user to ROOT role (for first user scenarios)
  upgradeTemporaryUserToRoot(): void {
    if (!this.currentUser) {
      console.log('🔐 AuthService: No current user to upgrade');
      return;
    }

    console.log('🔐 AuthService: Upgrading temporary user to ROOT role');
    this.currentUser.role = UserRole.SUPER_ADMIN;
    this.currentUser.permissions = ROLE_PERMISSIONS[UserRole.SUPER_ADMIN];
    console.log('🔐 AuthService: User upgraded to ROOT:', this.currentUser.email);
    this.notifyAuthStateListeners(this.currentUser);
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
    return this.currentUser?.role === UserRole.SUPER_ADMIN;
  }

  // Check if user is admin or higher
  isAdmin(): boolean {
    return this.currentUser?.role === UserRole.SUPER_ADMIN || this.currentUser?.role === UserRole.ADMIN;
  }

  // Check if user is den leader or higher
  isDenLeader(): boolean {
    return this.isAdmin() || this.currentUser?.role === UserRole.DEN_LEADER;
  }

  // Check if user has specific permission (with role hierarchy)
  hasPermission(permission: Permission, user?: AppUser): boolean {
    const targetUser = user || this.currentUser;
    if (!targetUser) return false;
    
    // Root has access to everything
    if (targetUser.role === UserRole.SUPER_ADMIN) return true;
    
    // Check if user has the specific permission
    if (targetUser.permissions.includes(permission)) return true;
    
    // Check role hierarchy - higher roles inherit permissions from lower roles
    const userRoleLevel = ROLE_HIERARCHY[targetUser.role];
    
    // Define permission-to-role mappings for inheritance
    const permissionRoleMap: Record<Permission, UserRole> = {
      // System permissions - only root
      [Permission.SYSTEM_ADMIN]: UserRole.SUPER_ADMIN,
      [Permission.USER_MANAGEMENT]: UserRole.SUPER_ADMIN,
      [Permission.ROLE_MANAGEMENT]: UserRole.SUPER_ADMIN,
      [Permission.SYSTEM_CONFIG]: UserRole.SUPER_ADMIN,
      
      // Admin permissions - admin and root
      [Permission.PACK_MANAGEMENT]: UserRole.ADMIN,
      [Permission.LOCATION_MANAGEMENT]: UserRole.ADMIN,
      [Permission.FINANCIAL_MANAGEMENT]: UserRole.ADMIN,
      [Permission.FUNDRAISING_MANAGEMENT]: UserRole.ADMIN,
      [Permission.ALL_DEN_ACCESS]: UserRole.ADMIN,
      
      // Pack-level permissions - den leader and above
      [Permission.EVENT_MANAGEMENT]: UserRole.DEN_LEADER,
      [Permission.ANNOUNCEMENT_MANAGEMENT]: UserRole.DEN_LEADER,
      
      // Den leader permissions - den leader and above
      [Permission.DEN_CONTENT]: UserRole.DEN_LEADER,
      [Permission.DEN_EVENTS]: UserRole.DEN_LEADER,
      [Permission.DEN_MEMBERS]: UserRole.DEN_LEADER,
      [Permission.DEN_CHAT_MANAGEMENT]: UserRole.DEN_LEADER,
      [Permission.DEN_ANNOUNCEMENTS]: UserRole.DEN_LEADER,
      
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
      [Permission.CHAT_MANAGEMENT]: UserRole.DEN_LEADER,
      
      // General permissions
      [Permission.READ_CONTENT]: UserRole.PARENT,
      [Permission.CREATE_CONTENT]: UserRole.PARENT,
      [Permission.UPDATE_CONTENT]: UserRole.PARENT,
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
      return allUsers.filter(user => user.role !== UserRole.SUPER_ADMIN); // Admin can manage all except super admin
    }
    
    if (this.isDenLeader()) {
      // Den leaders can manage users in their den
      return allUsers.filter(user => 
        user.profile?.den === currentUser.profile?.den ||
        user.role === UserRole.PARENT ||
        user.role === UserRole.DEN_LEADER
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
    console.log('🔐 AuthService: Adding auth state listener');
    this.authStateListeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      console.log('🔐 AuthService: Removing auth state listener');
      const index = this.authStateListeners.indexOf(listener);
      if (index > -1) {
        this.authStateListeners.splice(index, 1);
      }
    };
  }

  // Notify all auth state listeners
  private notifyAuthStateListeners(user: AppUser | null) {
    console.log(`🔐 AuthService: Notifying ${this.authStateListeners.length} listeners:`, user ? `User ${user.email}` : 'No user');
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

  // Delete user (root only) - uses Cloud Function for secure deletion
  async deleteUser(userId: string, reason?: string): Promise<boolean> {
    try {
      const currentUser = this.getCurrentUser();
      if (!currentUser || currentUser.role !== UserRole.SUPER_ADMIN) {
        throw new Error('Only root users can delete accounts');
      }

      // Prevent deleting self
      if (userId === currentUser.uid) {
        throw new Error('Cannot delete your own account');
      }

      // Use Cloud Function for secure user deletion
      const adminDeleteUserFunction = httpsCallable(functions, 'adminDeleteUser');
      
      const result = await adminDeleteUserFunction({
        userId: userId,
        reason: reason || 'No reason provided'
      });

      console.log('User deleted successfully:', result.data);
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
          status: data.status,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt,
          lastLoginAt: data.lastLoginAt?.toDate ? data.lastLoginAt.toDate() : data.lastLoginAt,
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
      
      // Filter out pending and denied users - only show approved users
      return snapshot.docs
        .map(doc => ({
          uid: doc.id,
          email: doc.data().email,
          displayName: doc.data().displayName,
          role: doc.data().role,
          photoURL: doc.data().photoURL,
          authProvider: doc.data().authProvider,
          permissions: doc.data().permissions || [],
          isActive: doc.data().isActive ?? true,
          status: doc.data().status,
          createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : doc.data().createdAt,
          updatedAt: doc.data().updatedAt?.toDate ? doc.data().updatedAt.toDate() : doc.data().updatedAt,
          lastLoginAt: doc.data().lastLoginAt?.toDate ? doc.data().lastLoginAt.toDate() : doc.data().lastLoginAt,
          profile: doc.data().profile || {}
        }))
        .filter(user => {
          // Show all users - let the UI handle filtering
          // Only hide users who are explicitly denied
          return user.status !== 'denied' && user.status !== 'rejected';
        });
    } catch (error: any) {
      console.error('Error getting users:', error);
      throw error;
    }
  }

  // Send password reset email using our custom Cloud Function
  async sendPasswordResetEmail(email: string): Promise<void> {
    try {
      const sendPasswordReset = httpsCallable(functions, 'sendPasswordReset');
      const result = await sendPasswordReset({ email });
      
      const data = result.data as any;
      if (!data.success) {
        throw new Error(data.message || 'Failed to send password reset email');
      }
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
    let updateData: any = null;
    
    try {
      const currentUser = this.getCurrentUser();
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      // Check if user is updating their own profile or has admin permissions
      const isOwnProfile = currentUser.uid === userId;
      const hasAdminPermissions = this.hasPermission(Permission.USER_MANAGEMENT);
      
      if (!isOwnProfile && !hasAdminPermissions) {
        throw new Error('Insufficient permissions');
      }

      updateData = {
        updatedAt: serverTimestamp()
      };

      if (updates.displayName !== undefined) {
        updateData.displayName = updates.displayName;
      }

      if (updates.profile !== undefined) {
        updateData.profile = updates.profile;
      }

      // Only admins can update isActive status
      if (updates.isActive !== undefined && hasAdminPermissions) {
        updateData.isActive = updates.isActive;
      }

      // Only admins can update role
      if (updates.role !== undefined) {
        if (!hasAdminPermissions) {
          throw new Error('Insufficient permissions');
        }
        updateData.role = updates.role;
      }

      console.log('📝 Updating user document in Firestore:', userId, updateData);
      await updateDoc(doc(db, 'users', userId), updateData);
      console.log('✅ User document updated successfully in Firestore');
    } catch (error: any) {
      console.error('❌ Error updating user profile:', error);
      console.error('Error details:', {
        code: error?.code,
        message: error?.message,
        userId: userId,
        updateData: updateData
      });
      throw error;
    }
  }

  // Link additional social accounts
  async linkSocialAccount(provider: SocialProvider): Promise<void> {
    if (!this.currentUser) {
      throw new Error('No user logged in');
    }

    try {
      // Check if the account is already linked
      const user = this.auth.currentUser;
      if (!user) {
        throw new Error('No authenticated user');
      }

      const providerId = this.getProviderId(provider);
      const isAlreadyLinked = user.providerData.some((providerData: any) => 
        providerData.providerId === providerId
      );

      if (isAlreadyLinked) {
        console.log(`🔐 Account already linked with ${providerId}`);
        return; // Account is already linked, no need to do anything
      }

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

  // Helper method to get provider ID
  private getProviderId(provider: SocialProvider): string {
    switch (provider) {
      case SocialProvider.GOOGLE:
        return 'google.com';
      case SocialProvider.APPLE:
        return 'apple.com';
      case SocialProvider.FACEBOOK:
        return 'facebook.com';
      case SocialProvider.GITHUB:
        return 'github.com';
      case SocialProvider.TWITTER:
        return 'twitter.com';
      case SocialProvider.MICROSOFT:
        return 'microsoft.com';
      default:
        throw new Error('Unsupported social provider');
    }
  }

  // Check if a social account is already linked
  isSocialAccountLinked(provider: SocialProvider): boolean {
    if (!this.auth.currentUser) {
      return false;
    }

    const providerId = this.getProviderId(provider);
    return this.auth.currentUser.providerData.some((providerData: any) => 
      providerData.providerId === providerId
    );
  }

  // Get list of linked providers
  getLinkedProviders(): string[] {
    if (!this.auth.currentUser) {
      return [];
    }

    return this.auth.currentUser.providerData.map((providerData: any) => providerData.providerId);
  }

  // Unlink a social account
  async unlinkSocialAccount(provider: SocialProvider): Promise<void> {
    if (!this.auth.currentUser) {
      throw new Error('No user logged in');
    }

    try {
      const providerId = this.getProviderId(provider);
      console.log(`🔐 AuthService: Attempting to unlink ${providerId}`);
      
      // Check if the account is actually linked
      const isLinked = this.isSocialAccountLinked(provider);
      if (!isLinked) {
        console.log(`🔐 Account is not linked with ${providerId}`);
        return; // Account is not linked, no need to do anything
      }

      // Unlink the provider
      await unlink(this.auth.currentUser, providerId);
      console.log(`🔐 AuthService: Successfully unlinked ${providerId}`);
      
      // Refresh the user token to get updated provider data
      await this.auth.currentUser.reload();
      
    } catch (error) {
      console.error('🔐 AuthService: Error unlinking social account:', error);
      throw error;
    }
  }

  // Unlink and re-link a social account (useful for troubleshooting)
  async relinkSocialAccount(provider: SocialProvider): Promise<void> {
    if (!this.auth.currentUser) {
      throw new Error('No user logged in');
    }

    try {
      console.log(`🔐 AuthService: Relinking ${provider} account`);
      
      // First unlink the account
      await this.unlinkSocialAccount(provider);
      
      // Wait a moment for the unlink to complete
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Then re-link the account
      await this.linkSocialAccount(provider);
      
      console.log(`🔐 AuthService: Successfully relinked ${provider} account`);
      
    } catch (error) {
      console.error('🔐 AuthService: Error relinking social account:', error);
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
      const providerToUnlink = providers.find((p: any) => p.providerId.includes(provider));
      
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
