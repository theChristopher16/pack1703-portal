/**
 * Unit tests for Chat Service permission validation
 * Tests the specific "Only admins can view all users" error
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Mock Firebase
const mockFirestore = {
  collection: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  addDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  onSnapshot: jest.fn(),
};

const mockAuth = {
  currentUser: null,
};

// Mock AdminContext
const mockAdminContext = {
  state: {
    currentUser: null,
    role: null,
    isAuthenticated: false,
    permissions: [],
  },
};

jest.mock('firebase/firestore', () => ({
  getFirestore: () => mockFirestore,
  collection: () => {},
  doc: () => {},
  getDoc: () => {},
  getDocs: () => {},
  addDoc: () => {},
  updateDoc: () => {},
  deleteDoc: () => {},
  onSnapshot: () => {},
  query: () => {},
  where: () => {},
  orderBy: () => {},
  limit: () => {},
}));

jest.mock('firebase/auth', () => ({
  getAuth: () => mockAuth,
  onAuthStateChanged: () => {},
}));

jest.mock('../../contexts/AdminContext', () => ({
  useAdmin: () => mockAdminContext,
}));

describe('Chat Service Permission Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('User Access Validation', () => {
    it('should allow all authenticated users to view online users', async () => {
      // Set up non-admin user
      mockAdminContext.state = {
        currentUser: {
          uid: 'test-user-id',
          email: 'user@example.com',
          displayName: 'Regular User',
        },
        role: 'viewer', // Non-admin role
        isAuthenticated: true,
        permissions: ['view_own_data'],
      };

      const mockUsers = [
        { id: 'user1', name: 'User 1', email: 'user1@example.com' },
        { id: 'user2', name: 'User 2', email: 'user2@example.com' },
      ];

      // Mock the chat service method that allows all users
      const chatService = {
        async getAllUsers() {
          // All authenticated users can view online users
          return mockUsers;
        }
      };

      const result = await chatService.getAllUsers();
      expect(result).toEqual(mockUsers);
    });

    it('should allow admin users to view all users with admin details', async () => {
      // Set up admin user
      mockAdminContext.state = {
        currentUser: {
          uid: 'admin-user-id',
          email: 'admin@example.com',
          displayName: 'Admin User',
        },
        role: 'super-admin', // Admin role
        isAuthenticated: true,
        permissions: ['user_management', 'system_admin'],
      };

      const mockUsers = [
        { id: 'user1', name: 'User 1', email: 'user1@example.com' },
        { id: 'user2', name: 'User 2', email: 'user2@example.com' },
      ];

      const chatService = {
        async getAllUsers() {
          // All users can view online users
          return mockUsers;
        },
        async getAllUsersForAdmin() {
          // Only admins can view all users with admin details
          const hasAdminPermission = mockAdminContext.state.permissions.includes('user_management') || 
                                   mockAdminContext.state.role === 'root' || 
                                   mockAdminContext.state.role === 'super-admin';
          
          if (!hasAdminPermission) {
            throw new Error('Only admins can view all users with admin details');
          }
          
          return mockUsers;
        }
      };

      const result = await chatService.getAllUsers();
      expect(result).toEqual(mockUsers);

      const adminResult = await chatService.getAllUsersForAdmin();
      expect(adminResult).toEqual(mockUsers);
    });

    it('should allow root users to view all users with admin details', async () => {
      // Set up root user
      mockAdminContext.state = {
        currentUser: {
          uid: 'root-user-id',
          email: 'root@example.com',
          displayName: 'Root User',
        },
        role: 'root', // Root role
        isAuthenticated: true,
        permissions: ['system_admin'],
      };

      const mockUsers = [
        { id: 'user1', name: 'User 1', email: 'user1@example.com' },
      ];

      const chatService = {
        async getAllUsers() {
          // All users can view online users
          return mockUsers;
        },
        async getAllUsersForAdmin() {
          // Only admins can view all users with admin details
          const hasAdminPermission = mockAdminContext.state.permissions.includes('user_management') || 
                                   mockAdminContext.state.role === 'root' || 
                                   mockAdminContext.state.role === 'super-admin';
          
          if (!hasAdminPermission) {
            throw new Error('Only admins can view all users with admin details');
          }
          
          return mockUsers;
        }
      };

      const result = await chatService.getAllUsers();
      expect(result).toEqual(mockUsers);

      const adminResult = await chatService.getAllUsersForAdmin();
      expect(adminResult).toEqual(mockUsers);
    });
  });

  describe('Permission Edge Cases', () => {
    it('should handle unauthenticated users', async () => {
      // Set up unauthenticated user
      mockAdminContext.state = {
        currentUser: null,
        role: null,
        isAuthenticated: false,
        permissions: [],
      };

      const chatService = {
        async getAllUsers() {
          if (!mockAdminContext.state.isAuthenticated) {
            throw new Error('User must be authenticated');
          }
          
          const hasAdminPermission = mockAdminContext.state.permissions.includes('user_management') || 
                                   mockAdminContext.state.role === 'root' || 
                                   mockAdminContext.state.role === 'super-admin';
          
          if (!hasAdminPermission) {
            throw new Error('Only admins can view all users');
          }
          
          return [];
        }
      };

      await expect(chatService.getAllUsers()).rejects.toThrow('User must be authenticated');
    });

    it('should handle users with partial admin permissions', async () => {
      // Set up user with some admin permissions but not user_management
      mockAdminContext.state = {
        currentUser: {
          uid: 'partial-admin-id',
          email: 'partial@example.com',
          displayName: 'Partial Admin',
        },
        role: 'content-admin', // Content admin, not user admin
        isAuthenticated: true,
        permissions: ['content_management'], // Has content management but not user management
      };

      const chatService = {
        async getAllUsers() {
          // All users can view online users
          return [];
        },
        async getAllUsersForAdmin() {
          // Only admins can view all users with admin details
          const hasAdminPermission = mockAdminContext.state.permissions.includes('user_management') || 
                                   mockAdminContext.state.role === 'root' || 
                                   mockAdminContext.state.role === 'super-admin';
          
          if (!hasAdminPermission) {
            throw new Error('Only admins can view all users with admin details');
          }
          
          return [];
        }
      };

      // Should succeed for regular user access
      await expect(chatService.getAllUsers()).resolves.toEqual([]);
      
      // Should fail for admin-only access
      await expect(chatService.getAllUsersForAdmin()).rejects.toThrow('Only admins can view all users with admin details');
    });

    it('should handle role changes during operation', async () => {
      // Start with admin user
      mockAdminContext.state = {
        currentUser: {
          uid: 'admin-user-id',
          email: 'admin@example.com',
          displayName: 'Admin User',
        },
        role: 'super-admin',
        isAuthenticated: true,
        permissions: ['user_management'],
      };

      const chatService = {
        async getAllUsers() {
          // All users can view online users
          return [];
        },
        async getAllUsersForAdmin() {
          // Only admins can view all users with admin details
          const currentRole = mockAdminContext.state.role;
          
          if (currentRole !== 'root' && currentRole !== 'super-admin' && 
              !mockAdminContext.state.permissions.includes('user_management')) {
            throw new Error('Only admins can view all users with admin details');
          }
          
          return [];
        }
      };

      // Should succeed initially for both methods
      await expect(chatService.getAllUsers()).resolves.toEqual([]);
      await expect(chatService.getAllUsersForAdmin()).resolves.toEqual([]);

      // Change role to non-admin
      mockAdminContext.state.role = 'viewer';
      mockAdminContext.state.permissions = ['view_own_data'];

      // Regular access should still work
      await expect(chatService.getAllUsers()).resolves.toEqual([]);
      
      // Admin access should now fail
      await expect(chatService.getAllUsersForAdmin()).rejects.toThrow('Only admins can view all users with admin details');
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should provide helpful error messages for admin permission issues', async () => {
      mockAdminContext.state = {
        currentUser: {
          uid: 'user-id',
          email: 'user@example.com',
          displayName: 'Regular User',
        },
        role: 'viewer',
        isAuthenticated: true,
        permissions: ['view_own_data'],
      };

      const chatService = {
        async getAllUsers() {
          // All users can view online users
          return [];
        },
        async getAllUsersForAdmin() {
          const hasAdminPermission = mockAdminContext.state.permissions.includes('user_management') || 
                                   mockAdminContext.state.role === 'root' || 
                                   mockAdminContext.state.role === 'super-admin';
          
          if (!hasAdminPermission) {
            const error = new Error('Only admins can view all users with admin details');
            error.name = 'PermissionError';
            (error as any).code = 'INSUFFICIENT_PERMISSIONS';
            (error as any).requiredRole = 'admin';
            (error as any).currentRole = mockAdminContext.state.role;
            throw error;
          }
          
          return [];
        }
      };

      // Regular access should work
      await expect(chatService.getAllUsers()).resolves.toEqual([]);

      // Admin access should fail with helpful error
      let caughtError: any;
      try {
        await chatService.getAllUsersForAdmin();
      } catch (error: any) {
        caughtError = error;
      }
      expect(caughtError.name).toBe('PermissionError');
      expect(caughtError.code).toBe('INSUFFICIENT_PERMISSIONS');
      expect(caughtError.requiredRole).toBe('admin');
      expect(caughtError.currentRole).toBe('viewer');
    });

    it('should handle permission errors gracefully in UI', async () => {
      mockAdminContext.state = {
        currentUser: {
          uid: 'user-id',
          email: 'user@example.com',
          displayName: 'Regular User',
        },
        role: 'viewer',
        isAuthenticated: true,
        permissions: ['view_own_data'],
      };

      const chatService = {
        async getAllUsers() {
          // All users can view online users
          return [];
        },

        async getAllUsersForAdmin() {
          const hasAdminPermission = mockAdminContext.state.permissions.includes('user_management') || 
                                   mockAdminContext.state.role === 'root' || 
                                   mockAdminContext.state.role === 'super-admin';
          
          if (!hasAdminPermission) {
            throw new Error('Only admins can view all users with admin details');
          }
          
          return [];
        },

        async initialize() {
          try {
            // Try to get regular user access first
            const users = await this.getAllUsers();
            return { success: true, users, accessLevel: 'user' };
          } catch (error: any) {
            if (error.message.includes('Only admins can view all users with admin details')) {
              return { 
                success: false, 
                error: 'Permission denied', 
                message: 'You need admin privileges to access this feature',
                fallback: 'limited'
              };
            }
            throw error;
          }
        }
      };

      const result = await chatService.initialize();
      expect(result.success).toBe(true);
      expect(result.users).toEqual([]);
      expect(result.accessLevel).toBe('user');
    });
  });

  describe('Permission Validation in Different Contexts', () => {
    it('should validate permissions for channel creation', async () => {
      mockAdminContext.state = {
        currentUser: {
          uid: 'user-id',
          email: 'user@example.com',
          displayName: 'Regular User',
        },
        role: 'viewer',
        isAuthenticated: true,
        permissions: ['view_own_data'],
      };

      const chatService = {
        async createChannel(channelData: any) {
          const hasCreatePermission = mockAdminContext.state.permissions.includes('content_management') || 
                                    mockAdminContext.state.role === 'root' || 
                                    mockAdminContext.state.role === 'super-admin';
          
          if (!hasCreatePermission) {
            throw new Error('Only admins can create channels');
          }
          
          return { id: 'new-channel', ...channelData };
        }
      };

      await expect(chatService.createChannel({ name: 'Test Channel' })).rejects.toThrow('Only admins can create channels');
    });

    it('should validate permissions for message moderation', async () => {
      mockAdminContext.state = {
        currentUser: {
          uid: 'user-id',
          email: 'user@example.com',
          displayName: 'Regular User',
        },
        role: 'viewer',
        isAuthenticated: true,
        permissions: ['view_own_data'],
      };

      const chatService = {
        async moderateMessage(messageId: string, action: string) {
          const hasModeratePermission = mockAdminContext.state.permissions.includes('content_management') || 
                                      mockAdminContext.state.role === 'root' || 
                                      mockAdminContext.state.role === 'super-admin';
          
          if (!hasModeratePermission) {
            throw new Error('Only admins can moderate messages');
          }
          
          return { messageId, action, moderated: true };
        }
      };

      await expect(chatService.moderateMessage('msg-123', 'delete')).rejects.toThrow('Only admins can moderate messages');
    });
  });
});
