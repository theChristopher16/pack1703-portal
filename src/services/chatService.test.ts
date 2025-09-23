import { chatService, SessionManager } from './chatService';
import { authService } from './authService';
import { collection, doc, getDoc, setDoc, addDoc, updateDoc, deleteDoc, getDocs, query, where, orderBy, limit as firestoreLimit, Timestamp, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';

// Mock Firebase
jest.mock('firebase/firestore');
jest.mock('../firebase/config');
jest.mock('./authService');

const mockedCollection = collection as jest.MockedFunction<typeof collection>;
const mockedDoc = doc as jest.MockedFunction<typeof doc>;
const mockedGetDoc = getDoc as jest.MockedFunction<typeof getDoc>;
const mockedSetDoc = setDoc as jest.MockedFunction<typeof setDoc>;
const mockedAddDoc = addDoc as jest.MockedFunction<typeof addDoc>;
const mockedUpdateDoc = updateDoc as jest.MockedFunction<typeof updateDoc>;
const mockedDeleteDoc = deleteDoc as jest.MockedFunction<typeof deleteDoc>;
const mockedGetDocs = getDocs as jest.MockedFunction<typeof getDocs>;
const mockedQuery = query as jest.MockedFunction<typeof query>;
const mockedWhere = where as jest.MockedFunction<typeof where>;
const mockedOrderBy = orderBy as jest.MockedFunction<typeof orderBy>;
const mockedLimit = firestoreLimit as jest.MockedFunction<typeof firestoreLimit>;
const mockedTimestamp = Timestamp as jest.Mocked<typeof Timestamp>;
const mockedServerTimestamp = serverTimestamp as jest.MockedFunction<typeof serverTimestamp>;
const mockedOnSnapshot = onSnapshot as jest.MockedFunction<typeof onSnapshot>;

const mockedDb = db as jest.Mocked<typeof db>;
const mockedAuthService = authService as jest.Mocked<typeof authService>;

describe('ChatService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.setTimeout(10000);

    // Mock Firebase functions
    mockedCollection.mockReturnValue({} as any);
    mockedDoc.mockReturnValue({} as any);
    mockedQuery.mockReturnValue({} as any);
    mockedWhere.mockReturnValue({} as any);
    mockedOrderBy.mockReturnValue({} as any);
    mockedLimit.mockReturnValue({} as any);
    mockedServerTimestamp.mockReturnValue({} as any);
    mockedTimestamp.fromDate = jest.fn().mockReturnValue({} as any);
  });

  describe('SessionManager', () => {
    describe('generateUserId', () => {
      it('should generate a user ID with correct format', () => {
        const userId = SessionManager.generateUserId();

        expect(userId).toMatch(/^user_[a-z0-9]+[a-z0-9]+$/);
        expect(userId.length).toBeGreaterThan(15);
      });

      it('should generate unique user IDs', () => {
        const userId1 = SessionManager.generateUserId();
        const userId2 = SessionManager.generateUserId();

        expect(userId1).not.toBe(userId2);
      });
    });

    describe('generateSessionId', () => {
      it('should generate a session ID with correct format', () => {
        const sessionId = SessionManager.generateSessionId();

        expect(sessionId).toMatch(/^session_[a-z0-9]+[a-z0-9]+$/);
        expect(sessionId.length).toBeGreaterThan(20);
      });
    });

    describe('generateIPHash', () => {
      it('should generate an IP hash', () => {
        const ipHash = SessionManager.generateIPHash();

        expect(ipHash).toMatch(/^[a-z0-9]+$/);
        expect(ipHash.length).toBeGreaterThan(0);
      });
    });

    describe('getUserFromStorage', () => {
      beforeEach(() => {
        // Clear localStorage mock
        Object.defineProperty(window, 'localStorage', {
          value: {
            getItem: jest.fn(),
            setItem: jest.fn(),
            removeItem: jest.fn(),
            clear: jest.fn()
          },
          writable: true
        });
      });

      it('should return user data from localStorage', () => {
        const mockUser = {
          id: 'user_test123',
          name: 'Test User',
          sessionId: 'session_test456',
          isAdmin: false,
          den: 'lion' as any
        };

        (window.localStorage.getItem as jest.Mock)
          .mockImplementation((key: string) => {
            switch (key) {
              case 'pack1703_chat_user_id': return mockUser.id;
              case 'pack1703_chat_user_name': return mockUser.name;
              case 'pack1703_chat_user_den': return mockUser.den;
              case 'pack1703_chat_session_id': return mockUser.sessionId;
              case 'user_is_admin': return mockUser.isAdmin.toString();
              default: return null;
            }
          });

        const result = SessionManager.getUserFromStorage();

        expect(result).toEqual({
          id: mockUser.id,
          name: mockUser.name,
          den: mockUser.den,
          sessionId: mockUser.sessionId,
          isAdmin: mockUser.isAdmin,
          userAgent: navigator.userAgent,
          ipHash: expect.any(String)
        });
      });

      it('should return null when no user data exists', () => {
        (window.localStorage.getItem as jest.Mock).mockReturnValue(null);

        const result = SessionManager.getUserFromStorage();

        expect(result).toBeNull();
      });
    });

    describe('saveUserToStorage', () => {
      beforeEach(() => {
        Object.defineProperty(window, 'localStorage', {
          value: {
            getItem: jest.fn(),
            setItem: jest.fn(),
            removeItem: jest.fn(),
            clear: jest.fn()
          },
          writable: true
        });
      });

      it('should save user data to localStorage', () => {
        const user = {
          id: 'user_test123',
          name: 'Test User',
          den: 'lion' as any,
          sessionId: 'session_test456',
          isAdmin: true
        };

        SessionManager.saveUserToStorage(user);

        expect(window.localStorage.setItem).toHaveBeenCalledWith('pack1703_chat_user_id', user.id);
        expect(window.localStorage.setItem).toHaveBeenCalledWith('pack1703_chat_user_name', user.name);
        expect(window.localStorage.setItem).toHaveBeenCalledWith('pack1703_chat_user_den', user.den);
        expect(window.localStorage.setItem).toHaveBeenCalledWith('pack1703_chat_session_id', user.sessionId);
        expect(window.localStorage.setItem).toHaveBeenCalledWith('user_is_admin', user.isAdmin.toString());
      });
    });

    describe('clearUserFromStorage', () => {
      beforeEach(() => {
        Object.defineProperty(window, 'localStorage', {
          value: {
            getItem: jest.fn(),
            setItem: jest.fn(),
            removeItem: jest.fn(),
            clear: jest.fn()
          },
          writable: true
        });
      });

      it('should clear user data from localStorage', () => {
        SessionManager.clearUserFromStorage();

        expect(window.localStorage.removeItem).toHaveBeenCalledWith('pack1703_chat_user_id');
        expect(window.localStorage.removeItem).toHaveBeenCalledWith('pack1703_chat_user_name');
        expect(window.localStorage.removeItem).toHaveBeenCalledWith('pack1703_chat_user_den');
        expect(window.localStorage.removeItem).toHaveBeenCalledWith('pack1703_chat_session_id');
        expect(window.localStorage.removeItem).toHaveBeenCalledWith('user_is_admin');
      });
    });

    describe('createNewUser', () => {
      beforeEach(() => {
        Object.defineProperty(window, 'localStorage', {
          value: {
            getItem: jest.fn(),
            setItem: jest.fn(),
            removeItem: jest.fn(),
            clear: jest.fn()
          },
          writable: true
        });
      });

      it('should create a new user with provided parameters', () => {
        const name = 'Test User';
        const den = 'lion' as any;
        const photoURL = 'https://example.com/photo.jpg';

        const user = SessionManager.createNewUser(name, den, photoURL);

        expect(user.name).toBe(name);
        expect(user.den).toBe(den);
        expect(user.photoURL).toBe(photoURL);
        expect(user.isOnline).toBe(true);
        expect(user.isAdmin).toBe(false);
        expect(user.id).toMatch(/^user_[a-z0-9]+[a-z0-9]+$/);
        expect(user.sessionId).toMatch(/^session_[a-z0-9]+[a-z0-9]+$/);
      });

      it('should save user to localStorage', () => {
        const name = 'Test User';
        const den = 'lion' as any;

        const user = SessionManager.createNewUser(name, den);

        expect(window.localStorage.setItem).toHaveBeenCalledWith('pack1703_chat_user_id', user.id);
        expect(window.localStorage.setItem).toHaveBeenCalledWith('pack1703_chat_user_name', user.name);
        expect(window.localStorage.setItem).toHaveBeenCalledWith('pack1703_chat_user_den', user.den);
        expect(window.localStorage.setItem).toHaveBeenCalledWith('pack1703_chat_session_id', user.sessionId);
      });
    });

    describe('getOrCreateUser', () => {
      beforeEach(() => {
        Object.defineProperty(window, 'localStorage', {
          value: {
            getItem: jest.fn(),
            setItem: jest.fn(),
            removeItem: jest.fn(),
            clear: jest.fn()
          },
          writable: true
        });

        mockedAuthService.getCurrentUser = jest.fn();
      });

      it('should return authenticated user when available', async () => {
        const mockAuthUser = {
          uid: 'auth_user_123',
          email: 'test@example.com',
          displayName: 'Auth User',
          photoURL: 'https://example.com/auth-photo.jpg',
          providerData: []
        };

        mockedAuthService.getCurrentUser.mockReturnValue(mockAuthUser);

        const user = await SessionManager.getOrCreateUser();

        expect(user.name).toBe('Auth User');
        expect(user.photoURL).toBe('https://example.com/auth-photo.jpg');
        expect(user.isOnline).toBe(true);
      });

      it('should create new user when not authenticated and no existing user', async () => {
        mockedAuthService.getCurrentUser.mockReturnValue(null);

        const user = await SessionManager.getOrCreateUser();

        expect(user.name).toMatch(/^[A-Za-z]+[A-Za-z]+[0-9]+$/);
        expect(user.isOnline).toBe(true);
        expect(user.isAdmin).toBe(false);
      });

      it('should update existing anonymous user when authenticated', async () => {
        const mockAuthUser = {
          uid: 'auth_user_123',
          email: 'test@example.com',
          displayName: 'Auth User',
          photoURL: 'https://example.com/auth-photo.jpg',
          providerData: []
        };

        const existingUser = {
          id: 'user_existing123',
          name: 'Existing User',
          den: 'lion' as any,
          sessionId: 'session_existing456',
          isAdmin: false,
          userAgent: navigator.userAgent,
          ipHash: 'abc123'
        };

        mockedAuthService.getCurrentUser.mockReturnValue(mockAuthUser);

        (window.localStorage.getItem as jest.Mock)
          .mockImplementation((key: string) => {
            switch (key) {
              case 'pack1703_chat_user_id': return existingUser.id;
              case 'pack1703_chat_user_name': return existingUser.name;
              case 'pack1703_chat_user_den': return existingUser.den;
              case 'pack1703_chat_session_id': return existingUser.sessionId;
              case 'user_is_admin': return existingUser.isAdmin.toString();
              default: return null;
            }
          });

        const user = await SessionManager.getOrCreateUser();

        expect(user.name).toBe('Auth User');
        expect(user.photoURL).toBe('https://example.com/auth-photo.jpg');
        expect(user.den).toBe(existingUser.den);
      });
    });
  });

  describe('ChatService - User Functions', () => {
    beforeEach(() => {
      jest.clearAllMocks();

      // Mock Firebase functions
      mockedCollection.mockReturnValue({} as any);
      mockedDoc.mockReturnValue({} as any);
      mockedQuery.mockReturnValue({} as any);
      mockedWhere.mockReturnValue({} as any);
      mockedOrderBy.mockReturnValue({} as any);
      mockedLimit.mockReturnValue({} as any);
      mockedServerTimestamp.mockReturnValue({} as any);
      mockedTimestamp.fromDate = jest.fn().mockReturnValue({} as any);

      // Mock successful Firestore operations
      mockedGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({})
      } as any);
      mockedSetDoc.mockResolvedValue(undefined);
      mockedUpdateDoc.mockResolvedValue(undefined);
      mockedAddDoc.mockResolvedValue({ id: 'test-id' } as any);
      mockedGetDocs.mockResolvedValue({
        docs: [
          {
            id: 'test-channel-1',
            data: () => ({
              name: 'General',
              description: 'General chat',
              isActive: true,
              createdAt: { toDate: () => new Date() },
              updatedAt: { toDate: () => new Date() },
              lastActivity: { toDate: () => new Date() }
            })
          }
        ]
      } as any);
    });

    describe('initialize', () => {
      it('should initialize chat service successfully', async () => {
        const user = await chatService.initialize();

        expect(user).toBeDefined();
        expect(user.isOnline).toBe(true);
        expect(user.name).toBeDefined();
      });

      it('should create user in Firestore', async () => {
        mockedSetDoc.mockResolvedValue(undefined);
        mockedGetDoc.mockResolvedValue({ exists: () => false, data: () => ({}) } as any);

        await chatService.initialize();

        expect(mockedSetDoc).toHaveBeenCalled();
      });

      it('should handle initialization errors gracefully', async () => {
        mockedGetDoc.mockRejectedValue(new Error('Firestore error'));

        const user = await chatService.initialize();

        expect(user).toBeDefined(); // Should still create user even if Firestore fails
      });
    });

    describe('initializeAsAdmin', () => {
      it('should initialize chat service as admin', async () => {
        const user = await chatService.initializeAsAdmin();

        expect(user).toBeDefined();
        expect(user.isOnline).toBe(true);
        expect(user.isAdmin).toBe(true);
      });
    });

    describe('getChannels', () => {
      it('should return channels from Firestore', async () => {
        const channels = await chatService.getChannels();

        expect(channels).toBeDefined();
        expect(Array.isArray(channels)).toBe(true);
      });

      it('should return default channels when no channels exist', async () => {
        mockedGetDocs.mockResolvedValue({
          docs: []
        } as any);

        const channels = await chatService.getChannels();

        expect(channels.length).toBeGreaterThan(0);
        expect(channels.some(c => c.name === 'General')).toBe(true);
      });
    });

    describe('getMessages', () => {
      it('should return messages for a channel', async () => {
        mockedGetDocs.mockResolvedValue({
          docs: [
            {
              id: 'msg1',
              data: () => ({
                message: 'Test message',
                userName: 'Test User',
                timestamp: { toDate: () => new Date() }
              })
            }
          ]
        } as any);

        const messages = await chatService.getMessages('general');

        expect(messages).toBeDefined();
        expect(Array.isArray(messages)).toBe(true);
      });
    });

    describe('sendMessage', () => {
      it('should send message successfully', async () => {
        await chatService.initialize();
        const currentUser = chatService.getCurrentUser();

        if (currentUser) {
          await chatService.sendMessage('general', 'Test message');

          expect(mockedAddDoc).toHaveBeenCalled();
        }
      });

      it('should handle send message errors gracefully', async () => {
        mockedAddDoc.mockRejectedValue(new Error('Send error'));

        await chatService.initialize();
        const currentUser = chatService.getCurrentUser();

        if (currentUser) {
          await expect(chatService.sendMessage('general', 'Test message'))
            .rejects.toThrow('Send error');
        }
      });
    });

    describe('getOnlineUsers', () => {
      it('should return online users', async () => {
        mockedGetDocs.mockResolvedValue({
          docs: [
            {
              id: 'user1',
              data: () => ({
                name: 'User 1',
                isOnline: true,
                lastSeen: { toDate: () => new Date() }
              })
            }
          ]
        } as any);

        const users = await chatService.getOnlineUsers();

        expect(users).toBeDefined();
        expect(Array.isArray(users)).toBe(true);
      });
    });
  });

  describe('ChatService - Admin Functions', () => {
    beforeEach(() => {
      jest.clearAllMocks();

      // Mock Firebase functions
      mockedCollection.mockReturnValue({} as any);
      mockedDoc.mockReturnValue({} as any);
      mockedQuery.mockReturnValue({} as any);
      mockedWhere.mockReturnValue({} as any);
      mockedOrderBy.mockReturnValue({} as any);
      mockedLimit.mockReturnValue({} as any);
      mockedServerTimestamp.mockReturnValue({} as any);
      mockedTimestamp.fromDate = jest.fn().mockReturnValue({} as any);

      // Mock successful Firestore operations
      mockedGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({})
      } as any);
      mockedSetDoc.mockResolvedValue(undefined);
      mockedUpdateDoc.mockResolvedValue(undefined);
      mockedAddDoc.mockResolvedValue({ id: 'test-id' } as any);
      mockedDeleteDoc.mockResolvedValue(undefined);
      mockedGetDocs.mockResolvedValue({
        docs: []
      } as any);
    });

    describe('deleteMessage', () => {
      it('should require admin permissions', async () => {
        await chatService.initialize(); // Initialize as regular user

        await expect(chatService.deleteMessage('msg1'))
          .rejects.toThrow('Only admins can delete messages');
      });

      it('should delete message successfully as admin', async () => {
        await chatService.initializeAsAdmin();

        mockedGetDoc.mockResolvedValue({
          exists: () => true,
          data: () => ({
            channelId: 'general',
            message: 'Test message content'
          })
        } as any);

        await chatService.deleteMessage('msg1');

        expect(mockedDeleteDoc).toHaveBeenCalled();
      });
    });

    describe('sendSystemMessage', () => {
      it('should require admin permissions', async () => {
        await chatService.initialize(); // Initialize as regular user

        await expect(chatService.sendSystemMessage('general', 'Test system message'))
          .rejects.toThrow('Only admins can send system messages');
      });

      it('should send system message successfully as admin', async () => {
        await chatService.initializeAsAdmin();

        await chatService.sendSystemMessage('general', 'Test system message');

        expect(mockedAddDoc).toHaveBeenCalled();
      });
    });

    describe('banUser', () => {
      it('should require admin permissions', async () => {
        await chatService.initialize(); // Initialize as regular user

        await expect(chatService.banUser('user1', 'Test ban'))
          .rejects.toThrow('Only admins can ban users');
      });

      it('should ban user successfully as admin', async () => {
        await chatService.initializeAsAdmin();

        await chatService.banUser('user1', 'Test ban');

        expect(mockedUpdateDoc).toHaveBeenCalled();
      });
    });

    describe('createChannel', () => {
      it('should require admin permissions', async () => {
        await chatService.initialize(); // Initialize as regular user

        await expect(chatService.createChannel('New Channel', 'Description'))
          .rejects.toThrow('Only admins can create channels');
      });

      it('should create channel successfully as admin', async () => {
        await chatService.initializeAsAdmin();

        const channelId = await chatService.createChannel('New Channel', 'Description');

        expect(mockedAddDoc).toHaveBeenCalled();
        expect(channelId).toBeDefined();
      });
    });

    describe('getAllUsers', () => {
      it('should require admin permissions', async () => {
        await chatService.initialize(); // Initialize as regular user

        await expect(chatService.getAllUsers())
          .rejects.toThrow('Only admins can view all users');
      });

      it('should return all users as admin', async () => {
        await chatService.initializeAsAdmin();

        mockedGetDocs.mockResolvedValue({
          docs: [
            {
              id: 'user1',
              data: () => ({
                name: 'User 1',
                isOnline: true,
                lastSeen: { toDate: () => new Date() }
              })
            }
          ]
        } as any);

        const users = await chatService.getAllUsers();

        expect(users).toBeDefined();
        expect(Array.isArray(users)).toBe(true);
      });
    });
  });

  describe('Activity Tracking', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should set up activity tracking on initialization', async () => {
      // Mock document event listeners
      const addEventListenerSpy = jest.spyOn(document, 'addEventListener');
      const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');

      await chatService.initialize();

      expect(addEventListenerSpy).toHaveBeenCalledWith('mousedown', expect.any(Function), { passive: true });
      expect(addEventListenerSpy).toHaveBeenCalledWith('mousemove', expect.any(Function), { passive: true });
      expect(addEventListenerSpy).toHaveBeenCalledWith('keypress', expect.any(Function), { passive: true });
      expect(addEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function), { passive: true });
      expect(addEventListenerSpy).toHaveBeenCalledWith('touchstart', expect.any(Function), { passive: true });
      expect(addEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function), { passive: true });
      expect(addEventListenerSpy).toHaveBeenCalledWith('visibilitychange', expect.any(Function));

      // Cleanup
      addEventListenerSpy.mockRestore();
      removeEventListenerSpy.mockRestore();
    });

    it.skip('should handle user activity', async () => {
      await chatService.initialize();

      // Simulate user activity
      const currentUser = chatService.getCurrentUser();
      if (currentUser) {
        // Mock the updateUserInFirestore method to avoid Firestore calls
        const updateUserInFirestoreSpy = jest.spyOn(chatService as any, 'updateUserInFirestore');
        updateUserInFirestoreSpy.mockResolvedValue(undefined);

        // Mock setTimeout and setInterval to avoid delays
        const setTimeoutSpy = jest.spyOn(global, 'setTimeout').mockImplementation((fn) => {
          fn();
          return {} as any;
        });

        // Trigger activity
        document.dispatchEvent(new MouseEvent('mousedown'));

        // Wait for async operations
        await new Promise(resolve => setTimeout(resolve, 10));

        expect(updateUserInFirestoreSpy).toHaveBeenCalled();

        updateUserInFirestoreSpy.mockRestore();
        setTimeoutSpy.mockRestore();
      }
    });

    it('should handle page visibility changes', async () => {
      await chatService.initialize();

      // Mock visibility API
      Object.defineProperty(document, 'hidden', {
        writable: true,
        value: true
      });

      // Mock the startHeartbeat and stopHeartbeat methods
      const startHeartbeatSpy = jest.spyOn(chatService as any, 'startHeartbeat');
      const stopHeartbeatSpy = jest.spyOn(chatService as any, 'stopHeartbeat');

      // Trigger visibility change
      document.dispatchEvent(new Event('visibilitychange'));

      expect(stopHeartbeatSpy).toHaveBeenCalled();

      // Make page visible again
      Object.defineProperty(document, 'hidden', {
        writable: true,
        value: false
      });

      document.dispatchEvent(new Event('visibilitychange'));

      expect(startHeartbeatSpy).toHaveBeenCalled();

      startHeartbeatSpy.mockRestore();
      stopHeartbeatSpy.mockRestore();
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should handle Firestore connection errors gracefully', async () => {
      mockedGetDocs.mockRejectedValue(new Error('Network error'));

      const channels = await chatService.getChannels();

      expect(channels).toBeDefined();
      expect(Array.isArray(channels)).toBe(true);
      expect(channels.length).toBeGreaterThan(0); // Should return default channels
    });

    it('should handle message sending errors gracefully', async () => {
      mockedAddDoc.mockRejectedValue(new Error('Send failed'));

      await chatService.initialize();
      const currentUser = chatService.getCurrentUser();

      if (currentUser) {
        await expect(chatService.sendMessage('general', 'Test message'))
          .rejects.toThrow('Send failed');
      }
    });

    it('should handle user status update errors gracefully', async () => {
      mockedUpdateDoc.mockRejectedValue(new Error('Status update failed'));

      await chatService.initialize();

      // Should not throw error
      await chatService.updateUserStatus('user1', true);
    });
  });
});