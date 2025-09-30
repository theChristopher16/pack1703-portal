import { logger } from '../utils/logger';
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  setDoc,
  query,  
  where, 
  orderBy, 
  limit as firestoreLimit,
  Timestamp,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { authService, UserRole } from './authService';

// User session management
export interface ChatUser {
  id: string;
  name: string;
  isOnline: boolean;
  lastSeen: Date;
  isAdmin: boolean;
  role?: 'super-admin' | 'admin' | 'volunteer' | 'parent' | 'ai_assistant';
  den?: 'lion' | 'tiger' | 'wolf' | 'bear' | 'webelos' | 'arrow-of-light' | 'pack-leader' | 'parent';
  scoutRank?: string;
  familyName?: string;
  sessionId: string;
  userAgent: string;
  ipHash?: string;
  // Profile picture support
  photoURL?: string;
  // Admin management fields
  isBanned?: boolean;
  banReason?: string;
  bannedBy?: string;
  bannedAt?: Date;
  isMuted?: boolean;
  muteReason?: string;
  muteUntil?: Date;
  mutedBy?: string;
  mutedAt?: Date;
}

export interface ChatMessage {
  id: string;
  channelId: string;
  userId?: string;
  senderId?: string;
  userName?: string;
  senderName?: string;
  message?: string;
  content?: string;
  timestamp: Date;
  isSystem?: boolean;
  isAdmin?: boolean;
  den?: string;
  reactions?: MessageReaction[];
}

export interface MessageReaction {
  emoji: string;
  userId: string;
  userName: string;
  timestamp: Date;
}

export interface ChatChannel {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  messageCount: number;
  lastActivity: Date;
  denType?: 'pack' | 'lion' | 'tiger' | 'wolf' | 'bear' | 'webelos' | 'arrow-of-light' | 'general';
  isDenChannel: boolean;
  denLevel?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Role mapping utility
const mapUserRoleToChatRole = (userRole: UserRole): ChatUser['role'] => {
  switch (userRole) {
    case UserRole.SUPER_ADMIN:
      return 'super-admin';
    case UserRole.ADMIN:
      return 'admin';
    case UserRole.VOLUNTEER:
      return 'volunteer';
    case UserRole.PARENT:
      return 'parent';
    case UserRole.AI_ASSISTANT:
      return 'ai_assistant';
    default:
      return 'parent'; // Default to parent for unknown roles
  }
};

// Session management utilities
class SessionManager {
  private static readonly USER_ID_KEY = 'pack1703_chat_user_id';
  private static readonly USER_NAME_KEY = 'pack1703_chat_user_name';
  private static readonly USER_DEN_KEY = 'pack1703_chat_user_den';
  private static readonly SESSION_ID_KEY = 'pack1703_chat_session_id';

  static generateUserId(): string {
    return 'user_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  static generateSessionId(): string {
    return 'session_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 15);
  }

  static generateIPHash(): string {
    // Simple hash based on user agent and timestamp
    const data = navigator.userAgent + Date.now().toString();
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  static getUserFromStorage(): Partial<ChatUser> | null {
    try {
      const userId = localStorage.getItem(this.USER_ID_KEY);
      const userName = localStorage.getItem(this.USER_NAME_KEY);
      const userDen = localStorage.getItem(this.USER_DEN_KEY);
      const sessionId = localStorage.getItem(this.SESSION_ID_KEY);
      const isAdmin = localStorage.getItem('user_is_admin') === 'true';

      if (userId && userName && sessionId) {
        return {
          id: userId,
          name: userName,
          den: userDen as any,
          sessionId,
          isAdmin: isAdmin,
          userAgent: navigator.userAgent,
          ipHash: this.generateIPHash()
        };
      }
      return null;
    } catch (error) {
      console.warn('Failed to get user from storage:', error);
      return null;
    }
  }

  static saveUserToStorage(user: Partial<ChatUser>): void {
    try {
      if (user.id) localStorage.setItem(this.USER_ID_KEY, user.id);
      if (user.name) localStorage.setItem(this.USER_NAME_KEY, user.name);
      if (user.den) localStorage.setItem(this.USER_DEN_KEY, user.den);
      if (user.sessionId) localStorage.setItem(this.SESSION_ID_KEY, user.sessionId);
      if (user.isAdmin !== undefined) localStorage.setItem('user_is_admin', user.isAdmin.toString());
    } catch (error) {
      console.warn('Failed to save user to storage:', error);
    }
  }

  static clearUserFromStorage(): void {
    try {
      localStorage.removeItem(this.USER_ID_KEY);
      localStorage.removeItem(this.USER_NAME_KEY);
      localStorage.removeItem(this.USER_DEN_KEY);
      localStorage.removeItem(this.SESSION_ID_KEY);
      localStorage.removeItem('user_is_admin');
    } catch (error) {
      console.warn('Failed to clear user from storage:', error);
    }
  }

  static createNewUser(name: string, den?: string, photoURL?: string, role?: string): ChatUser {
    const userId = this.generateUserId();
    const sessionId = this.generateSessionId();
    const ipHash = this.generateIPHash();

    const user: ChatUser = {
      id: userId,
      name,
      isOnline: true,
      lastSeen: new Date(),
      isAdmin: false,
      role: role as any, // Include role
      den: den as any,
      sessionId,
      userAgent: navigator.userAgent,
      ipHash,
      photoURL: photoURL // Include profile picture
    };

    this.saveUserToStorage(user);
    return user;
  }

  static async getOrCreateUser(): Promise<ChatUser> {
    // First check if user is authenticated via Firebase Auth
    const authenticatedUser = authService.getCurrentUser();
    
    if (authenticatedUser) {
      // User is authenticated - use their real name and profile picture
      const existingUser = this.getUserFromStorage();
      
      if (existingUser && existingUser.id && existingUser.name) {
        // Update existing user with authenticated info
        const updatedUser: ChatUser = {
          ...existingUser as ChatUser,
          name: authenticatedUser.displayName || authenticatedUser.email || 'Authenticated User',
          photoURL: authenticatedUser.photoURL, // Include profile picture
          isOnline: true,
          lastSeen: new Date(),
          sessionId: this.generateSessionId(),
          isAdmin: existingUser.isAdmin || false,
          role: mapUserRoleToChatRole(authenticatedUser.role), // Include role from authenticated user
          userAgent: existingUser.userAgent || navigator.userAgent,
          ipHash: existingUser.ipHash || this.generateIPHash()
        };
        this.saveUserToStorage(updatedUser);
        return updatedUser;
      } else {
        // Create new authenticated user
        const realName = authenticatedUser.displayName || authenticatedUser.email || 'Authenticated User';
        return this.createNewUser(realName, undefined, authenticatedUser.photoURL, mapUserRoleToChatRole(authenticatedUser.role));
      }
    }
    
    // User is not authenticated - check for existing anonymous user
    const existingUser = this.getUserFromStorage();
    
    if (existingUser && existingUser.id && existingUser.name) {
      // Update last seen and session
      const updatedUser: ChatUser = {
        ...existingUser as ChatUser,
        isOnline: true,
        lastSeen: new Date(),
        sessionId: this.generateSessionId(),
        isAdmin: existingUser.isAdmin || false,
        userAgent: existingUser.userAgent || navigator.userAgent,
        ipHash: existingUser.ipHash || this.generateIPHash()
      };
      this.saveUserToStorage(updatedUser);
      return updatedUser;
    }

    // Create new anonymous user with automatic scout-themed name
    const scoutAdjectives = [
      'Brave', 'Swift', 'Wise', 'Noble', 'Bright', 'Wild', 'Free', 'Bold', 'Calm', 'True',
      'Quick', 'Sharp', 'Clear', 'Strong', 'Fair', 'Kind', 'Good', 'Pure', 'Fresh', 'New',
      'Golden', 'Silver', 'Copper', 'Iron', 'Steel', 'Oak', 'Pine', 'Maple', 'Cedar', 'Birch'
    ];
    
    const scoutNouns = [
      'Scout', 'Explorer', 'Trailblazer', 'Pathfinder', 'Navigator', 'Pioneer', 'Ranger',
      'Guide', 'Leader', 'Helper', 'Friend', 'Companion', 'Partner', 'Buddy', 'Pal',
      'Eagle', 'Wolf', 'Bear', 'Lion', 'Tiger', 'Fox', 'Hawk', 'Owl', 'Deer', 'Beaver',
      'Squirrel', 'Raccoon', 'Badger', 'Moose', 'Elk', 'Antelope', 'Coyote', 'Bobcat',
      'Trail', 'Path', 'Road', 'Way', 'Route', 'Track', 'Course', 'Journey', 'Adventure',
      'Quest', 'Mission', 'Task', 'Duty', 'Service', 'Honor', 'Courage', 'Loyalty'
    ];
    
    const randomAdjective = scoutAdjectives[Math.floor(Math.random() * scoutAdjectives.length)];
    const randomNoun = scoutNouns[Math.floor(Math.random() * scoutNouns.length)];
    const randomNumber = Math.floor(Math.random() * 100);
    
    const autoGeneratedName = `${randomAdjective}${randomNoun}${randomNumber}`;
    return this.createNewUser(autoGeneratedName);
  }
}

// Chat service
class ChatService {
  private static instance: ChatService;
  private currentUser: ChatUser | null = null;
  private unsubscribeFunctions: (() => void)[] = [];
  private channelsCache: ChatChannel[] | null = null;
  private channelsCacheTime: number = 0;
  private readonly CACHE_DURATION = 30000; // 30 seconds
  
  // Activity tracking properties
  private lastActivityTime: number = Date.now();
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private activityTimeout: NodeJS.Timeout | null = null;
  private readonly HEARTBEAT_INTERVAL = 15000; // 15 seconds for active users
  private readonly INACTIVITY_TIMEOUT = 5 * 60 * 1000; // 5 minutes
  private readonly ACTIVITY_EVENTS = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];

  static getInstance(): ChatService {
    if (!ChatService.instance) {
      ChatService.instance = new ChatService();
    }
    return ChatService.instance;
  }

  async initialize(): Promise<ChatUser> {
    this.currentUser = await SessionManager.getOrCreateUser();
    
    // Mark user as online
    this.currentUser.isOnline = true;
    
    // Create or update user in Firestore
    await this.createOrUpdateUserInFirestore(this.currentUser);
    
    // Set up activity-based heartbeat system
    this.setupActivityTracking();

    return this.currentUser;
  }

  async initializeAsAdmin(): Promise<ChatUser> {
    this.currentUser = await SessionManager.getOrCreateUser();
    
    // Set admin status and mark as online
    this.currentUser.isAdmin = true;
    this.currentUser.isOnline = true;
    
    // Create or update user in Firestore
    await this.createOrUpdateUserInFirestore(this.currentUser);
    
    // Set up activity-based heartbeat system
    this.setupActivityTracking();

    return this.currentUser;
  }

  getCurrentUser(): ChatUser | null {
    return this.currentUser;
  }

  async updateUserProfile(name: string, den?: string): Promise<void> {
    if (!this.currentUser) return;

    this.currentUser.name = name;
    this.currentUser.den = den as any;
    
    SessionManager.saveUserToStorage(this.currentUser);
    await this.updateUserInFirestore(this.currentUser);
  }

  // Method to update chat user name from profile changes
  async updateChatUserName(newName: string): Promise<void> {
    if (!this.currentUser) return;

    console.log('Updating chat user name from:', this.currentUser.name, 'to:', newName);

    // Update the current user's name
    this.currentUser.name = newName;
    
    // Save to localStorage
    SessionManager.saveUserToStorage(this.currentUser);
    
    // Update in Firestore
    await this.updateUserInFirestore(this.currentUser);
    
    console.log('Chat user name updated successfully to:', newName);
  }

  // Method to refresh user when authentication state changes
  async refreshUser(): Promise<ChatUser> {
    if (this.currentUser) {
      // Re-initialize with current auth state
      this.currentUser = await SessionManager.getOrCreateUser();
      
      // Update user in Firestore
      await this.createOrUpdateUserInFirestore(this.currentUser);
      
      return this.currentUser;
    }
    
    // If no current user, initialize normally
    return await this.initialize();
  }

  async getChannels(): Promise<ChatChannel[]> {
    // Check cache first
    const now = Date.now();
    if (this.channelsCache && (now - this.channelsCacheTime) < this.CACHE_DURATION) {
      console.log('ChatService.getChannels() - returning cached channels:', this.channelsCache.length);
      return this.channelsCache;
    }
    
    console.log('ChatService.getChannels() - fetching fresh channels');
    try {
      const channelsRef = collection(db, 'chat-channels');
      const q = query(channelsRef, where('isActive', '==', true), orderBy('createdAt'));
      const snapshot = await getDocs(q);
      
      const channels = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          lastActivity: data.lastActivity?.toDate() || new Date()
        } as ChatChannel;
      });
      
      // If no channels exist, create default channels
      if (channels.length === 0) {
        console.log('No channels found, creating default channels...');
        await this.createDefaultChannels();
        const defaultChannels = this.getDefaultChannels();
        this.channelsCache = defaultChannels;
        this.channelsCacheTime = now;
        return defaultChannels;
      }
      
      // Remove duplicates based on channel ID
      const uniqueChannels = channels.reduce((acc: ChatChannel[], channel) => {
        if (!acc.find(c => c.id === channel.id)) {
          acc.push(channel);
        }
        return acc;
      }, []);
      
      // Cache the results
      this.channelsCache = uniqueChannels;
      this.channelsCacheTime = now;
      console.log('ChatService.getChannels() - cached channels:', uniqueChannels.length);
      return uniqueChannels;
    } catch (error) {
      console.warn('Failed to fetch channels (index may be building), using defaults:', error);
      // Try a simpler query without ordering while index builds
      try {
        const channelsRef = collection(db, 'chat-channels');
        const simpleQuery = query(channelsRef, where('isActive', '==', true));
        const snapshot = await getDocs(simpleQuery);
        
        const channels = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
            lastActivity: data.lastActivity?.toDate() || new Date()
          } as ChatChannel;
        });
        
        if (channels.length > 0) {
          this.channelsCache = channels;
          this.channelsCacheTime = now;
          return channels;
        }
      } catch (fallbackError) {
        console.warn('Fallback query also failed:', fallbackError);
      }
      
      console.log('ChatService.getChannels() - returning default channels');
      const defaultChannels = this.getDefaultChannels();
      this.channelsCache = defaultChannels;
      this.channelsCacheTime = now;
      return defaultChannels;
    }
  }

  async createDefaultChannels(): Promise<void> {
    try {
      const channelsRef = collection(db, 'chat-channels');
      const defaultChannels = this.getDefaultChannels();
      
      for (const channel of defaultChannels) {
        await addDoc(channelsRef, {
          ...channel,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          lastActivity: serverTimestamp()
        });
      }
      
      console.log('Default channels created successfully');
    } catch (error) {
      console.error('Failed to create default channels:', error);
    }
  }

  async getMessages(channelId: string, limit: number = 50): Promise<ChatMessage[]> {
    try {
      const messagesRef = collection(db, 'chat-messages');
      const q = query(
        messagesRef, 
        where('channelId', '==', channelId),
        orderBy('timestamp', 'desc'),
        firestoreLimit(50)
      );
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          timestamp: data.timestamp?.toDate() || new Date()
        } as ChatMessage;
      }).reverse(); // Reverse to get chronological order
    } catch (error) {
      console.warn('Failed to fetch messages (index may be building):', error);
      // Return empty array while index is building
      return [];
    }
  }

  async sendMessage(channelId: string, message: string): Promise<void> {
    if (!this.currentUser) return;

    try {
      const messagesRef = collection(db, 'chat-messages');
      await addDoc(messagesRef, {
        channelId,
        userId: this.currentUser.id,
        userName: this.currentUser.name,
        message,
        timestamp: serverTimestamp(),
        isSystem: false,
        isAdmin: Boolean(this.currentUser.isAdmin), // Ensure boolean value
        den: this.currentUser.den || null, // Ensure null instead of undefined
        sessionId: this.currentUser.sessionId,
        userAgent: this.currentUser.userAgent,
        ipHash: this.currentUser.ipHash || null // Ensure null instead of undefined
      });

      // Update channel's last activity and message count (non-blocking)
      this.updateChannelActivity(channelId).catch(error => 
        console.warn('Failed to update channel activity:', error)
      );

      // Check for AI mentions and process them (non-blocking)
      this.processAIMentions(message, channelId);
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  }

  // Process AI mentions in messages (truly async - no blocking)
  private processAIMentions(message: string, channelId: string): void {
    try {
      // Check if message contains @mention of AI
      const mentionPattern = /@(solyn|ai|assistant)/i;
      if (mentionPattern.test(message)) {
        // Process the mention asynchronously without blocking message sending
        setImmediate(async () => {
          try {
            // Import AI service dynamically to avoid circular dependencies
            const aiService = (await import('./aiService')).default;
            
            await aiService.processChatMention(
              message, 
              channelId, 
              this.currentUser?.id || '', 
              this.currentUser?.name || '',
              this.currentUser?.den
            );
          } catch (error) {
            console.error('Error processing AI mention:', error);
          }
        });
      }
    } catch (error) {
      console.warn('Failed to process AI mentions:', error);
    }
  }

  async getOnlineUsers(): Promise<ChatUser[]> {
    try {
      const usersRef = collection(db, 'chat-users');
      const q = query(
        usersRef, 
        where('isOnline', '==', true),
        where('lastSeen', '>', new Date(Date.now() - 2 * 60 * 1000)) // Online in last 2 minutes (more responsive)
      );
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          lastSeen: data.lastSeen?.toDate() || new Date()
        } as ChatUser;
      });
    } catch (error) {
      logger.firebase('Failed to fetch online users (index may be building), trying fallback:', error);
      
      // Fallback: Get all users and filter client-side
      try {
        const usersRef = collection(db, 'chat-users');
        const snapshot = await getDocs(usersRef);
        
        const now = new Date();
        const twoMinutesAgo = new Date(now.getTime() - 2 * 60 * 1000); // More responsive timeout
        
        return snapshot.docs
          .map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
              lastSeen: data.lastSeen?.toDate() || new Date()
            } as ChatUser;
          })
          .filter(user => 
            user.isOnline && 
            user.lastSeen > twoMinutesAgo
          );
      } catch (fallbackError) {
        console.warn('Fallback query also failed:', fallbackError);
        return [];
      }
    }
  }

  async updateUserStatus(userId: string, isOnline: boolean): Promise<void> {
    try {
      if (!this.currentUser) return;
      
      // Update the current user's online status
      this.currentUser.isOnline = isOnline;
      
      // Use createOrUpdateUserInFirestore to handle both creation and updates
      await this.createOrUpdateUserInFirestore(this.currentUser);
    } catch (error) {
      console.warn('Failed to update user status:', error);
    }
  }

  async createOrUpdateUserInFirestore(user: ChatUser): Promise<void> {
    try {
      const userRef = doc(db, 'chat-users', user.id);
      const userDoc = await getDoc(userRef);
      
      // Prepare update data, excluding undefined values
      const updateData: any = {
        name: user.name,
        isOnline: user.isOnline,
        lastSeen: serverTimestamp(),
        sessionId: user.sessionId,
        userAgent: user.userAgent,
        ipHash: user.ipHash,
        isAdmin: user.isAdmin || false
      };
      
      // Only add den if it's not undefined
      if (user.den !== undefined) {
        updateData.den = user.den;
      }
      
      // Only add role if it's not undefined
      if (user.role !== undefined) {
        updateData.role = user.role;
      }
      
      if (userDoc.exists()) {
        // Update existing user
        await updateDoc(userRef, updateData);
      } else {
        // Create new user document
        await setDoc(userRef, {
          id: user.id,
          ...updateData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
    } catch (error) {
      logger.firebase('Failed to create/update user in Firestore:', error);
    }
  }

  async updateUserInFirestore(user: ChatUser): Promise<void> {
    try {
      const userRef = doc(db, 'chat-users', user.id);
      
      // Prepare update data, excluding undefined values
      const updateData: any = {
        name: user.name,
        isOnline: user.isOnline,
        lastSeen: serverTimestamp(),
        sessionId: user.sessionId,
        userAgent: user.userAgent,
        ipHash: user.ipHash,
        isAdmin: user.isAdmin || false
      };
      
      // Only add den if it's not undefined
      if (user.den !== undefined) {
        updateData.den = user.den;
      }
      
      // Only add role if it's not undefined
      if (user.role !== undefined) {
        updateData.role = user.role;
      }
      
      await updateDoc(userRef, updateData);
    } catch (error) {
      console.warn('Failed to update user in Firestore:', error);
    }
  }

  async updateChannelActivity(channelId: string): Promise<void> {
    try {
      const channelRef = doc(db, 'chat-channels', channelId);
      await updateDoc(channelRef, {
        lastActivity: serverTimestamp(),
        messageCount: serverTimestamp() // This will be incremented by a Cloud Function
      });
    } catch (error) {
      console.warn('Failed to update channel activity:', error);
    }
  }

  // Admin Functions
  async deleteMessage(messageId: string): Promise<void> {
    // Check if user has permission to delete messages (admin and up)
    const canDelete = this.currentUser?.isAdmin || 
                     this.currentUser?.role === 'super-admin' || 
                     this.currentUser?.role === 'admin' || 
                     this.currentUser?.role === 'volunteer';
    
    if (!canDelete) {
      throw new Error('You do not have permission to delete messages');
    }

    try {
      const messageRef = doc(db, 'chat-messages', messageId);
      await deleteDoc(messageRef);
      
      // Add system message about deletion
      const messageDoc = await getDoc(messageRef);
      if (messageDoc.exists()) {
        const messageData = messageDoc.data();
        await this.sendSystemMessage(
          messageData.channelId, 
          `Message deleted by admin: "${messageData.message.substring(0, 50)}${messageData.message.length > 50 ? '...' : ''}"`
        );
      }
    } catch (error) {
      console.error('Failed to delete message:', error);
      throw error;
    }
  }

  async sendSystemMessage(channelId: string, message: string): Promise<void> {
    if (!this.currentUser?.isAdmin) {
      throw new Error('Only admins can send system messages');
    }

    try {
      const messagesRef = collection(db, 'chat-messages');
      await addDoc(messagesRef, {
        channelId,
        userId: 'system',
        userName: 'System',
        message,
        timestamp: serverTimestamp(),
        isSystem: true,
        isAdmin: false,
        den: 'system'
      });

      await this.updateChannelActivity(channelId);
    } catch (error) {
      console.error('Failed to send system message:', error);
      throw error;
    }
  }

  async banUser(userId: string, reason: string): Promise<void> {
    if (!this.currentUser?.isAdmin) {
      throw new Error('Only admins can ban users');
    }

    try {
      const userRef = doc(db, 'chat-users', userId);
      await updateDoc(userRef, {
        isBanned: true,
        banReason: reason,
        bannedBy: this.currentUser.id,
        bannedAt: serverTimestamp()
      });

      // Send system message about the ban
      await this.sendSystemMessage('general', `User has been banned: ${reason}`);
    } catch (error) {
      console.error('Failed to ban user:', error);
      throw error;
    }
  }

  async unbanUser(userId: string): Promise<void> {
    if (!this.currentUser?.isAdmin) {
      throw new Error('Only admins can unban users');
    }

    try {
      const userRef = doc(db, 'chat-users', userId);
      await updateDoc(userRef, {
        isBanned: false,
        banReason: null,
        bannedBy: null,
        bannedAt: null
      });

      await this.sendSystemMessage('general', 'User has been unbanned');
    } catch (error) {
      console.error('Failed to unban user:', error);
      throw error;
    }
  }

  async muteUser(userId: string, durationMinutes: number, reason: string): Promise<void> {
    if (!this.currentUser?.isAdmin) {
      throw new Error('Only admins can mute users');
    }

    try {
      const userRef = doc(db, 'chat-users', userId);
      const muteUntil = new Date(Date.now() + durationMinutes * 60 * 1000);
      
      await updateDoc(userRef, {
        isMuted: true,
        muteReason: reason,
        muteUntil: Timestamp.fromDate(muteUntil),
        mutedBy: this.currentUser.id,
        mutedAt: serverTimestamp()
      });

      await this.sendSystemMessage('general', `User has been muted for ${durationMinutes} minutes: ${reason}`);
    } catch (error) {
      console.error('Failed to mute user:', error);
      throw error;
    }
  }

  async unmuteUser(userId: string): Promise<void> {
    if (!this.currentUser?.isAdmin) {
      throw new Error('Only admins can unmute users');
    }

    try {
      const userRef = doc(db, 'chat-users', userId);
      await updateDoc(userRef, {
        isMuted: false,
        muteReason: null,
        muteUntil: null,
        mutedBy: null,
        mutedAt: null
      });

      await this.sendSystemMessage('general', 'User has been unmuted');
    } catch (error) {
      console.error('Failed to unmute user:', error);
      throw error;
    }
  }

  async createChannel(name: string, description: string, denType?: string): Promise<string> {
    // Allow volunteers (den leaders) and up to create channels
    if (!this.currentUser?.isAdmin && !this.currentUser?.role && !['super-admin', 'admin', 'volunteer'].includes(this.currentUser?.role || '')) {
      throw new Error('Only volunteers (den leaders) and up can create channels');
    }

    try {
      const channelsRef = collection(db, 'chat-channels');
      const docRef = await addDoc(channelsRef, {
        name,
        description,
        isActive: true,
        messageCount: 0,
        lastActivity: serverTimestamp(),
        denType: denType || 'pack',
        isDenChannel: !!denType,
        denLevel: denType,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: this.currentUser?.id || 'unknown'
      });

      // Clear cache to force refresh
      this.channelsCache = null;
      this.channelsCacheTime = 0;

      return docRef.id;
    } catch (error) {
      console.error('Failed to create channel:', error);
      throw error;
    }
  }

  async updateChannel(channelId: string, updates: Partial<ChatChannel>): Promise<void> {
    if (!this.currentUser?.isAdmin) {
      throw new Error('Only admins can update channels');
    }

    try {
      const channelRef = doc(db, 'chat-channels', channelId);
      await updateDoc(channelRef, {
        ...updates,
        updatedAt: serverTimestamp(),
        updatedBy: this.currentUser.id
      });

      // Clear cache to force refresh
      this.channelsCache = null;
      this.channelsCacheTime = 0;
    } catch (error) {
      console.error('Failed to update channel:', error);
      throw error;
    }
  }

  async deleteChannel(channelId: string): Promise<void> {
    // Allow volunteers (den leaders) and up to delete channels
    if (!this.currentUser?.isAdmin && !this.currentUser?.role && !['super-admin', 'admin', 'volunteer'].includes(this.currentUser?.role || '')) {
      throw new Error('Only volunteers (den leaders) and up can delete channels');
    }

    // Protect default channels from deletion
    const protectedChannels = ['general', 'announcements', 'events', 'lion-den', 'tiger-den', 'wolf-den', 'bear-den', 'webelos-den', 'arrow-of-light'];
    if (protectedChannels.includes(channelId)) {
      throw new Error('Default channels cannot be deleted');
    }

    try {
      const channelRef = doc(db, 'chat-channels', channelId);
      await updateDoc(channelRef, {
        isActive: false,
        deletedAt: serverTimestamp(),
        deletedBy: this.currentUser?.id || 'unknown'
      });

      // Clear cache to force refresh
      this.channelsCache = null;
      this.channelsCacheTime = 0;

      // Try to send system message, but don't fail if it doesn't work
      try {
        await this.sendSystemMessage('general', 'Channel has been deleted');
      } catch (error) {
        console.warn('Failed to send system message after channel deletion:', error);
        // Don't throw - the channel deletion was successful
      }
    } catch (error) {
      console.error('Failed to delete channel:', error);
      throw error;
    }
  }

  async getAllUsers(): Promise<ChatUser[]> {
    // Allow all authenticated users to view online users
    // Admin-only features are handled separately
    try {
      const usersRef = collection(db, 'chat-users');
      const q = query(usersRef, orderBy('lastSeen', 'desc'));
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          lastSeen: data.lastSeen?.toDate() || new Date()
        } as ChatUser;
      });
    } catch (error) {
      console.warn('Failed to fetch all users:', error);
      return [];
    }
  }

  // Admin-only method for viewing all users with admin details
  async getAllUsersForAdmin(): Promise<ChatUser[]> {
    if (!this.currentUser?.isAdmin) {
      throw new Error('Only admins can view all users with admin details');
    }

    try {
      const usersRef = collection(db, 'chat-users');
      const q = query(usersRef, orderBy('lastSeen', 'desc'));
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          lastSeen: data.lastSeen?.toDate() || new Date()
        } as ChatUser;
      });
    } catch (error) {
      console.warn('Failed to fetch all users for admin:', error);
      return [];
    }
  }

  subscribeToMessages(channelId: string, callback: (messages: ChatMessage[]) => void): () => void {
    try {
      const messagesRef = collection(db, 'chat-messages');
      const q = query(
        messagesRef, 
        where('channelId', '==', channelId),
        orderBy('timestamp', 'desc'),
        firestoreLimit(50)
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const messages = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            timestamp: data.timestamp?.toDate() || new Date()
          } as ChatMessage;
        }).reverse();
        
        callback(messages);
      }, (error) => {
        console.warn('Message subscription error:', error);
        // Fallback to empty messages on error
        callback([]);
      });

      this.unsubscribeFunctions.push(unsubscribe);
      return unsubscribe;
    } catch (error) {
      console.warn('Failed to subscribe to messages:', error);
      return () => {};
    }
  }

  subscribeToOnlineUsers(callback: (users: ChatUser[]) => void): () => void {
    try {
      const usersRef = collection(db, 'chat-users');
      const q = query(
        usersRef, 
        where('isOnline', '==', true),
        where('lastSeen', '>', new Date(Date.now() - 2 * 60 * 1000)) // More responsive timeout
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const users = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            lastSeen: data.lastSeen?.toDate() || new Date()
          } as ChatUser;
        });
        
        callback(users);
      }, (error) => {
        console.warn('User subscription error:', error);
        // Fallback to empty users on error
        callback([]);
      });

      this.unsubscribeFunctions.push(unsubscribe);
      return unsubscribe;
    } catch (error) {
      console.warn('Failed to subscribe to online users:', error);
      return () => {};
    }
  }

  async addReaction(messageId: string, emoji: string, userId: string, userName: string): Promise<void> {
    try {
      const messageRef = doc(db, 'chat-messages', messageId);
      const messageDoc = await getDoc(messageRef);
      
      if (!messageDoc.exists()) {
        throw new Error('Message not found');
      }

      const messageData = messageDoc.data();
      const reactions = messageData.reactions || [];
      
      // Check if user already reacted with this emoji
      const existingReactionIndex = reactions.findIndex(
        (r: MessageReaction) => r.userId === userId && r.emoji === emoji
      );

      if (existingReactionIndex >= 0) {
        // Remove existing reaction (toggle off)
        reactions.splice(existingReactionIndex, 1);
      } else {
        // Add new reaction
        reactions.push({
          emoji,
          userId,
          userName,
          timestamp: new Date()
        });
      }

      await updateDoc(messageRef, { reactions });
    } catch (error) {
      console.error('Error adding reaction:', error);
      throw error;
    }
  }

  async removeReaction(messageId: string, emoji: string, userId: string): Promise<void> {
    try {
      const messageRef = doc(db, 'chat-messages', messageId);
      const messageDoc = await getDoc(messageRef);
      
      if (!messageDoc.exists()) {
        throw new Error('Message not found');
      }

      const messageData = messageDoc.data();
      const reactions = messageData.reactions || [];
      
      const updatedReactions = reactions.filter(
        (r: MessageReaction) => !(r.userId === userId && r.emoji === emoji)
      );

      await updateDoc(messageRef, { reactions: updatedReactions });
    } catch (error) {
      console.error('Error removing reaction:', error);
      throw error;
    }
  }

  // Activity tracking methods
  private setupActivityTracking(): void {
    console.log('Setting up activity tracking...');
    
    // Track user activity
    this.ACTIVITY_EVENTS.forEach(event => {
      document.addEventListener(event, this.handleUserActivity.bind(this), { passive: true });
    });
    
    // Track page visibility changes
    document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
    
    // Start heartbeat
    this.startHeartbeat();
    
    // Set initial activity timeout
    this.resetActivityTimeout();
  }
  
  private handleUserActivity(): void {
    this.lastActivityTime = Date.now();
      logger.activity('User activity detected, updating last activity time');
    
    // Reset activity timeout
    this.resetActivityTimeout();
    
    // Update user status if not already online
    if (this.currentUser && !this.currentUser.isOnline) {
      this.currentUser.isOnline = true;
      this.updateUserStatus(this.currentUser.id, true);
    }
  }
  
  private handleVisibilityChange(): void {
    if (document.hidden) {
      console.log('Page hidden, user may be inactive');
      // Don't immediately mark as offline, but reduce heartbeat frequency
      this.stopHeartbeat();
    } else {
      console.log('Page visible, user is active');
      // Resume normal heartbeat
      this.startHeartbeat();
      this.handleUserActivity(); // Treat visibility change as activity
    }
  }
  
  private startHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    
    this.heartbeatInterval = setInterval(() => {
      if (this.currentUser) {
        logger.heartbeat('Sending heartbeat - user is active');
        this.updateUserStatus(this.currentUser.id, true);
      }
    }, this.HEARTBEAT_INTERVAL);
  }
  
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }
  
  private resetActivityTimeout(): void {
    if (this.activityTimeout) {
      clearTimeout(this.activityTimeout);
    }
    
    this.activityTimeout = setTimeout(() => {
      console.log('User inactive for 5 minutes, marking as offline');
      if (this.currentUser) {
        this.currentUser.isOnline = false;
        this.updateUserStatus(this.currentUser.id, false);
      }
    }, this.INACTIVITY_TIMEOUT);
  }
  
  private cleanupActivityTracking(): void {
    console.log('Cleaning up activity tracking...');
    
    // Remove event listeners
    this.ACTIVITY_EVENTS.forEach(event => {
      document.removeEventListener(event, this.handleUserActivity.bind(this));
    });
    
    document.removeEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
    
    // Clear intervals and timeouts
    this.stopHeartbeat();
    
    if (this.activityTimeout) {
      clearTimeout(this.activityTimeout);
      this.activityTimeout = null;
    }
  }

  cleanup(): void {
    // Unsubscribe from all listeners
    this.unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
    this.unsubscribeFunctions = [];

    // Clean up activity tracking
    this.cleanupActivityTracking();

    // Update user as offline
    if (this.currentUser) {
      this.updateUserStatus(this.currentUser.id, false);
    }
  }

  // Clear current user session and reinitialize
  async reinitialize(): Promise<ChatUser> {
    console.log('Reinitializing chat service...');
    
    // Cleanup existing session
    this.cleanup();
    
    // Clear cached user data
    SessionManager.clearUserFromStorage();
    
    // Check if current user is admin/root to initialize with admin privileges
    const currentAuthUser = authService.getCurrentUser();
    const isAdmin = currentAuthUser && (
      currentAuthUser.role === UserRole.SUPER_ADMIN || 
      currentAuthUser.role === UserRole.ADMIN || 
      currentAuthUser.role === UserRole.VOLUNTEER
    );
    
    // Initialize with fresh user data
    return await (isAdmin ? this.initializeAsAdmin() : this.initialize());
  }

  private getDefaultChannels(): ChatChannel[] {
    return [
      {
        id: 'general',
        name: 'General',
        description: 'General pack discussions',
        isActive: true,
        messageCount: 0,
        lastActivity: new Date(),
        denType: 'pack',
        isDenChannel: false,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'announcements',
        name: 'Announcements',
        description: 'Important pack announcements',
        isActive: true,
        messageCount: 0,
        lastActivity: new Date(),
        denType: 'pack',
        isDenChannel: false,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'events',
        name: 'Events',
        description: 'Event planning and discussions',
        isActive: true,
        messageCount: 0,
        lastActivity: new Date(),
        denType: 'pack',
        isDenChannel: false,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'lion-den',
        name: 'Lion Den',
        description: 'Lion Den specific discussions',
        isActive: true,
        messageCount: 0,
        lastActivity: new Date(),
        denType: 'lion',
        isDenChannel: true,
        denLevel: 'Lion',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'tiger-den',
        name: 'Tiger Den',
        description: 'Tiger Den specific discussions',
        isActive: true,
        messageCount: 0,
        lastActivity: new Date(),
        denType: 'tiger',
        isDenChannel: true,
        denLevel: 'Tiger',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'wolf-den',
        name: 'Wolf Den',
        description: 'Wolf Den specific discussions',
        isActive: true,
        messageCount: 0,
        lastActivity: new Date(),
        denType: 'wolf',
        isDenChannel: true,
        denLevel: 'Wolf',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'bear-den',
        name: 'Bear Den',
        description: 'Bear Den specific discussions',
        isActive: true,
        messageCount: 0,
        lastActivity: new Date(),
        denType: 'bear',
        isDenChannel: true,
        denLevel: 'Bear',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'webelos-den',
        name: 'Webelos Den',
        description: 'Webelos Den specific discussions',
        isActive: true,
        messageCount: 0,
        lastActivity: new Date(),
        denType: 'webelos',
        isDenChannel: true,
        denLevel: 'Webelos',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'arrow-of-light',
        name: 'Arrow of Light',
        description: 'Arrow of Light Den specific discussions',
        isActive: true,
        messageCount: 0,
        lastActivity: new Date(),
        denType: 'arrow-of-light',
        isDenChannel: true,
        denLevel: 'Arrow of Light',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
  }
}

export const chatService = ChatService.getInstance();
export { SessionManager };
export default chatService;
