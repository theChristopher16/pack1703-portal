import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { chatService, ChatUser, ChatMessage, ChatChannel } from '../chatService';

// Mock Firebase
const mockCollection = jest.fn();
const mockDoc = jest.fn();
const mockAddDoc = jest.fn();
const mockUpdateDoc = jest.fn();
const mockDeleteDoc = jest.fn();
const mockGetDocs = jest.fn();
const mockOnSnapshot = jest.fn();
const mockServerTimestamp = jest.fn(() => new Date());
const mockOnAuthStateChanged = jest.fn();
const mockGetCurrentUser = jest.fn();
const mockHasPermission = jest.fn(() => true);

const mockFirestore = {
  collection: mockCollection,
  doc: mockDoc,
  addDoc: mockAddDoc,
  updateDoc: mockUpdateDoc,
  deleteDoc: mockDeleteDoc,
  getDocs: mockGetDocs,
  onSnapshot: mockOnSnapshot,
};

const mockAuth = {
  currentUser: null,
  onAuthStateChanged: mockOnAuthStateChanged,
};

// Mock Firebase modules
jest.mock('firebase/firestore', () => ({
  getFirestore: () => mockFirestore,
  collection: mockCollection,
  doc: mockDoc,
  addDoc: mockAddDoc,
  updateDoc: mockUpdateDoc,
  deleteDoc: mockDeleteDoc,
  getDocs: mockGetDocs,
  onSnapshot: mockOnSnapshot,
  serverTimestamp: mockServerTimestamp,
}));

jest.mock('firebase/auth', () => ({
  getAuth: () => mockAuth,
  onAuthStateChanged: mockOnAuthStateChanged,
}));

// Mock authService
jest.mock('../../services/authService', () => ({
  authService: {
    getCurrentUser: mockGetCurrentUser,
    hasPermission: mockHasPermission,
  },
}));

describe('ChatService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    chatService.cleanup();
  });

  afterEach(() => {
    chatService.cleanup();
  });

  describe('User Management', () => {
    it('should initialize as regular user', async () => {
      const mockUser: ChatUser = {
        id: 'user1',
        name: 'Test User',
        isOnline: true,
        lastSeen: new Date(),
        isAdmin: false,
        sessionId: 'session1',
        userAgent: 'test-agent',
      };

      mockAuth.currentUser = { uid: 'user1', email: 'test@example.com' };
      
      const result = await chatService.initialize();
      
      expect(result).toBeDefined();
      expect(result.name).toBe('Test User');
      expect(result.isAdmin).toBe(false);
    });

    it('should initialize as admin user', async () => {
      const mockUser: ChatUser = {
        id: 'admin1',
        name: 'Admin User',
        isOnline: true,
        lastSeen: new Date(),
        isAdmin: true,
        sessionId: 'session1',
        userAgent: 'test-agent',
      };

      mockAuth.currentUser = { uid: 'admin1', email: 'admin@example.com' };
      
      const result = await chatService.initializeAsAdmin();
      
      expect(result).toBeDefined();
      expect(result.name).toBe('Admin User');
      expect(result.isAdmin).toBe(true);
    });

    it('should handle user reinitialization', async () => {
      mockAuth.currentUser = { uid: 'user1', email: 'test@example.com' };
      
      const result = await chatService.reinitialize();
      
      expect(result).toBeDefined();
      expect(result.isOnline).toBe(true);
    });
  });

  describe('Message Management', () => {
    it('should send a message', async () => {
      const mockMessage: ChatMessage = {
        id: 'msg1',
        message: 'Test message',
        userId: 'user1',
        userName: 'Test User',
        timestamp: new Date(),
        channelId: 'general',
        isSystem: false,
        isAdmin: false,
      };

      mockAddDoc.mockResolvedValue({ id: 'msg1' });
      
      await chatService.sendMessage('general', 'Test message');
      
      expect(mockAddDoc).toHaveBeenCalled();
    });

    it('should get messages for a channel', async () => {
      const mockMessages: ChatMessage[] = [
        {
          id: 'msg1',
          message: 'Test message 1',
          userId: 'user1',
          userName: 'Test User',
          timestamp: new Date(),
          channelId: 'general',
          isSystem: false,
          isAdmin: false,
        },
      ];

      mockFirestore.getDocs.mockResolvedValue({
        docs: mockMessages.map(msg => ({
          id: msg.id,
          data: () => msg,
        })),
      });
      
      const result = await chatService.getMessages('general');
      
      expect(result).toHaveLength(1);
      expect(result[0].message).toBe('Test message 1');
    });

    it('should delete a message (admin only)', async () => {
      mockAuth.currentUser = { uid: 'admin1', email: 'admin@example.com' };
      
      await chatService.deleteMessage('msg1');
      
      expect(mockFirestore.deleteDoc).toHaveBeenCalled();
    });
  });

  describe('Channel Management', () => {
    it('should get channels', async () => {
      const mockChannels: ChatChannel[] = [
        {
          id: 'general',
          name: 'General',
          description: 'General discussion',
          isActive: true,
          messageCount: 10,
          lastActivity: new Date(),
          isDenChannel: false,
        },
      ];

      mockFirestore.getDocs.mockResolvedValue({
        docs: mockChannels.map(channel => ({
          id: channel.id,
          data: () => channel,
        })),
      });
      
      const result = await chatService.getChannels();
      
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('General');
    });

    it('should create a channel', async () => {
      const channelData = {
        name: 'Test Channel',
        description: 'Test description',
        isDenChannel: false,
      };

      mockFirestore.addDoc.mockResolvedValue({ id: 'channel1' });
      
      await chatService.createChannel(channelData);
      
      expect(mockFirestore.addDoc).toHaveBeenCalled();
    });
  });

  describe('User Management (Admin)', () => {
    it('should ban a user', async () => {
      mockAuth.currentUser = { uid: 'admin1', email: 'admin@example.com' };
      
      await chatService.banUser('user1', 'Inappropriate behavior');
      
      expect(mockFirestore.updateDoc).toHaveBeenCalled();
    });

    it('should mute a user', async () => {
      mockAuth.currentUser = { uid: 'admin1', email: 'admin@example.com' };
      
      await chatService.muteUser('user1', 60, 'Spam');
      
      expect(mockFirestore.updateDoc).toHaveBeenCalled();
    });

    it('should get online users', async () => {
      const mockUsers: ChatUser[] = [
        {
          id: 'user1',
          name: 'Test User',
          isOnline: true,
          lastSeen: new Date(),
          isAdmin: false,
          sessionId: 'session1',
          userAgent: 'test-agent',
        },
      ];

      mockFirestore.getDocs.mockResolvedValue({
        docs: mockUsers.map(user => ({
          id: user.id,
          data: () => user,
        })),
      });
      
      const result = await chatService.getOnlineUsers();
      
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Test User');
      expect(result[0].isOnline).toBe(true);
    });
  });

  describe('Activity Tracking', () => {
    it('should track user activity', async () => {
      mockAuth.currentUser = { uid: 'user1', email: 'test@example.com' };
      
      await chatService.trackActivity();
      
      expect(mockFirestore.updateDoc).toHaveBeenCalled();
    });

    it('should handle AI mentions', async () => {
      const message = 'Hey @solyn, can you help me?';
      
      const result = chatService.processAiMention(message);
      
      expect(result).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle Firestore errors gracefully', async () => {
      mockFirestore.addDoc.mockRejectedValue(new Error('Firestore error'));
      
      await expect(chatService.sendMessage('general', 'Test')).rejects.toThrow();
    });

    it('should handle authentication errors', async () => {
      mockAuth.currentUser = null;
      
      await expect(chatService.initialize()).rejects.toThrow();
    });
  });
});