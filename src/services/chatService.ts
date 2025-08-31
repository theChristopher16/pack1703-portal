import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  limit as firestoreLimit,
  Timestamp,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase/config';

// User session management
export interface ChatUser {
  id: string;
  name: string;
  isOnline: boolean;
  lastSeen: Date;
  isAdmin: boolean;
  den?: 'lion' | 'tiger' | 'wolf' | 'bear' | 'webelos' | 'arrow-of-light' | 'pack-leader' | 'parent';
  scoutRank?: string;
  familyName?: string;
  sessionId: string;
  userAgent: string;
  ipHash?: string;
}

export interface ChatMessage {
  id: string;
  channelId: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: Date;
  isSystem: boolean;
  isAdmin: boolean;
  den?: string;
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

      if (userId && userName && sessionId) {
        return {
          id: userId,
          name: userName,
          den: userDen as any,
          sessionId,
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
    } catch (error) {
      console.warn('Failed to clear user from storage:', error);
    }
  }

  static createNewUser(name: string, den?: string): ChatUser {
    const userId = this.generateUserId();
    const sessionId = this.generateSessionId();
    const ipHash = this.generateIPHash();

    const user: ChatUser = {
      id: userId,
      name,
      isOnline: true,
      lastSeen: new Date(),
      isAdmin: false,
      den: den as any,
      sessionId,
      userAgent: navigator.userAgent,
      ipHash
    };

    this.saveUserToStorage(user);
    return user;
  }

  static getOrCreateUser(): ChatUser {
    const existingUser = this.getUserFromStorage();
    
    if (existingUser && existingUser.id && existingUser.name) {
      // Update last seen and session
      const updatedUser: ChatUser = {
        ...existingUser as ChatUser,
        isOnline: true,
        lastSeen: new Date(),
        sessionId: this.generateSessionId()
      };
      this.saveUserToStorage(updatedUser);
      return updatedUser;
    }

    // Create new user with automatic scout-themed name
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

  static getInstance(): ChatService {
    if (!ChatService.instance) {
      ChatService.instance = new ChatService();
    }
    return ChatService.instance;
  }

  async initialize(): Promise<ChatUser> {
    this.currentUser = SessionManager.getOrCreateUser();
    
    // Update user's online status in Firestore
    await this.updateUserStatus(this.currentUser.id, true);
    
    // Set up periodic status updates
    setInterval(() => {
      if (this.currentUser) {
        this.updateUserStatus(this.currentUser.id, true);
      }
    }, 30000); // Update every 30 seconds

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

  async getChannels(): Promise<ChatChannel[]> {
    try {
      const channelsRef = collection(db, 'chat-channels');
      const q = query(channelsRef, where('isActive', '==', true), orderBy('createdAt'));
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          lastActivity: data.lastActivity?.toDate() || new Date()
        } as ChatChannel;
      });
    } catch (error) {
      console.warn('Failed to fetch channels, using defaults:', error);
      return this.getDefaultChannels();
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
      console.warn('Failed to fetch messages:', error);
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
        isAdmin: this.currentUser.isAdmin,
        den: this.currentUser.den,
        sessionId: this.currentUser.sessionId,
        userAgent: this.currentUser.userAgent,
        ipHash: this.currentUser.ipHash
      });

      // Update channel's last activity and message count
      await this.updateChannelActivity(channelId);
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  }

  async getOnlineUsers(): Promise<ChatUser[]> {
    try {
      const usersRef = collection(db, 'chat-users');
      const q = query(
        usersRef, 
        where('isOnline', '==', true),
        where('lastSeen', '>', new Date(Date.now() - 5 * 60 * 1000)) // Online in last 5 minutes
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
      console.warn('Failed to fetch online users:', error);
      return [];
    }
  }

  async updateUserStatus(userId: string, isOnline: boolean): Promise<void> {
    try {
      const userRef = doc(db, 'chat-users', userId);
      await updateDoc(userRef, {
        isOnline,
        lastSeen: serverTimestamp()
      });
    } catch (error) {
      console.warn('Failed to update user status:', error);
    }
  }

  async updateUserInFirestore(user: ChatUser): Promise<void> {
    try {
      const userRef = doc(db, 'chat-users', user.id);
      await updateDoc(userRef, {
        name: user.name,
        den: user.den,
        isOnline: user.isOnline,
        lastSeen: serverTimestamp(),
        sessionId: user.sessionId,
        userAgent: user.userAgent,
        ipHash: user.ipHash
      });
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
        where('lastSeen', '>', new Date(Date.now() - 5 * 60 * 1000))
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
      });

      this.unsubscribeFunctions.push(unsubscribe);
      return unsubscribe;
    } catch (error) {
      console.warn('Failed to subscribe to online users:', error);
      return () => {};
    }
  }

  cleanup(): void {
    // Unsubscribe from all listeners
    this.unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
    this.unsubscribeFunctions = [];

    // Update user as offline
    if (this.currentUser) {
      this.updateUserStatus(this.currentUser.id, false);
    }
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
