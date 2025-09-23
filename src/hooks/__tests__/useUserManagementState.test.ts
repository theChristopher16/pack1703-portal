import { renderHook, act } from '@testing-library/react';
import { useUserManagementState } from '../useOptimizedState';
import { UserRole } from '../../services/authService';

describe('useUserManagementState', () => {
  describe('State Management', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => useUserManagementState());

      expect(result.current.state.users).toEqual([]);
      expect(result.current.state.filteredUsers).toEqual([]);
      expect(result.current.state.invites).toEqual([]);
      expect(result.current.state.isLoading).toBe(true);
      expect(result.current.state.error).toBeNull();
      expect(result.current.state.searchTerm).toBe('');
      expect(result.current.state.roleFilter).toBe('all');
      expect(result.current.state.denFilter).toBe('all');
      expect(result.current.state.statusFilter).toBe('all');
      expect(result.current.state.showCreateModal).toBe(false);
      expect(result.current.state.showEditModal).toBe(false);
      expect(result.current.state.showDeleteModal).toBe(false);
      expect(result.current.state.selectedUser).toBeNull();
      expect(result.current.state.copySuccess).toBeNull();
    });

    it('should handle setting users', () => {
      const { result } = renderHook(() => useUserManagementState());

      const users = [
        {
          uid: 'user1',
          email: 'user1@example.com',
          displayName: 'User 1',
          role: UserRole.PARENT,
          permissions: [],
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          uid: 'user2',
          email: 'user2@example.com',
          displayName: 'User 2',
          role: UserRole.VOLUNTEER,
          permissions: [],
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      act(() => {
        result.current.actions.setUsers(users);
      });

      expect(result.current.state.users).toEqual(users);
      expect(result.current.state.filteredUsers).toEqual(users);
    });

    it('should handle filtering users', () => {
      const { result } = renderHook(() => useUserManagementState());

      const users = [
        {
          uid: 'user1',
          email: 'user1@example.com',
          displayName: 'User 1',
          role: UserRole.PARENT,
          permissions: [],
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          uid: 'user2',
          email: 'user2@example.com',
          displayName: 'User 2',
          role: UserRole.VOLUNTEER,
          permissions: [],
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      act(() => {
        result.current.actions.setUsers(users);
        result.current.actions.setRoleFilter(UserRole.PARENT);
      });

      expect(result.current.state.filteredUsers).toEqual([users[0]]);
    });

    it('should handle search functionality', () => {
      const { result } = renderHook(() => useUserManagementState());

      const users = [
        {
          uid: 'user1',
          email: 'user1@example.com',
          displayName: 'John Doe',
          role: UserRole.PARENT,
          permissions: [],
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          uid: 'user2',
          email: 'user2@example.com',
          displayName: 'Jane Smith',
          role: UserRole.VOLUNTEER,
          permissions: [],
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      act(() => {
        result.current.actions.setUsers(users);
        result.current.actions.setSearchTerm('john');
      });

      expect(result.current.state.filteredUsers).toEqual([users[0]]);
    });

    it('should handle modal states', () => {
      const { result } = renderHook(() => useUserManagementState());

      act(() => {
        result.current.actions.setShowCreateModal(true);
        result.current.actions.setShowEditModal(true);
      });

      expect(result.current.state.showCreateModal).toBe(true);
      expect(result.current.state.showEditModal).toBe(true);

      act(() => {
        result.current.actions.setShowCreateModal(false);
        result.current.actions.setShowEditModal(false);
      });

      expect(result.current.state.showCreateModal).toBe(false);
      expect(result.current.state.showEditModal).toBe(false);
    });

    it('should handle user selection', () => {
      const { result } = renderHook(() => useUserManagementState());

      const user = {
        uid: 'user1',
        email: 'user1@example.com',
        displayName: 'User 1',
        role: UserRole.PARENT,
        permissions: [],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      act(() => {
        result.current.actions.setSelectedUser(user);
      });

      expect(result.current.state.selectedUser).toEqual(user);

      act(() => {
        result.current.actions.setSelectedUser(null);
      });

      expect(result.current.state.selectedUser).toBeNull();
    });

    it('should handle form data', () => {
      const { result } = renderHook(() => useUserManagementState());

      const formData = {
        email: 'test@example.com',
        displayName: 'Test User',
        role: UserRole.ADMIN,
        den: 'lion',
        isActive: true
      };

      act(() => {
        result.current.actions.updateCreateForm(formData);
      });

      expect(result.current.state.createForm.email).toBe('test@example.com');
      expect(result.current.state.createForm.displayName).toBe('Test User');
      expect(result.current.state.createForm.role).toBe(UserRole.ADMIN);
    });

    it('should handle invite form data', () => {
      const { result } = renderHook(() => useUserManagementState());

      const inviteData = {
        email: 'invite@example.com',
        role: UserRole.VOLUNTEER,
        message: 'Join our pack!',
        denId: 'den1',
        expiresInDays: 14
      };

      act(() => {
        result.current.actions.updateInviteFormData(inviteData);
      });

      expect(result.current.state.inviteFormData.email).toBe('invite@example.com');
      expect(result.current.state.inviteFormData.role).toBe(UserRole.VOLUNTEER);
      expect(result.current.state.inviteFormData.message).toBe('Join our pack!');
    });

    it('should reset form data', () => {
      const { result } = renderHook(() => useUserManagementState());

      act(() => {
        result.current.actions.updateCreateForm({ email: 'test@example.com' });
        result.current.actions.resetCreateForm();
      });

      expect(result.current.state.createForm.email).toBe('');

      act(() => {
        result.current.actions.updateInviteFormData({ email: 'invite@example.com' });
        result.current.actions.resetInviteFormData();
      });

      expect(result.current.state.inviteFormData.email).toBe('');
    });

    it('should handle loading states', () => {
      const { result } = renderHook(() => useUserManagementState());

      act(() => {
        result.current.actions.setLoading(true);
      });

      expect(result.current.state.isLoading).toBe(true);

      act(() => {
        result.current.actions.setLoading(false);
      });

      expect(result.current.state.isLoading).toBe(false);
    });

    it('should handle error states', () => {
      const { result } = renderHook(() => useUserManagementState());

      act(() => {
        result.current.actions.setError('Test error');
      });

      expect(result.current.state.error).toBe('Test error');

      act(() => {
        result.current.actions.setError(null);
      });

      expect(result.current.state.error).toBeNull();
    });

    it('should handle copy success messages', () => {
      const { result } = renderHook(() => useUserManagementState());

      act(() => {
        result.current.actions.setCopySuccess('Copied successfully!');
      });

      expect(result.current.state.copySuccess).toBe('Copied successfully!');

      act(() => {
        result.current.actions.setCopySuccess(null);
      });

      expect(result.current.state.copySuccess).toBeNull();
    });
  });

  describe('Performance', () => {
    it('should handle large user lists efficiently', () => {
      const { result } = renderHook(() => useUserManagementState());

      const largeUserList = Array.from({ length: 1000 }, (_, i) => ({
        uid: `user${i}`,
        email: `user${i}@example.com`,
        displayName: `User ${i}`,
        role: i % 2 === 0 ? UserRole.PARENT : UserRole.VOLUNTEER,
        permissions: [],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }));

      const startTime = performance.now();

      act(() => {
        result.current.actions.setUsers(largeUserList);
      });

      const endTime = performance.now();

      // Should complete in reasonable time (less than 200ms)
      expect(endTime - startTime).toBeLessThan(200);
      expect(result.current.state.filteredUsers.length).toBe(1000);
    });

    it('should handle filtering large datasets efficiently', () => {
      const { result } = renderHook(() => useUserManagementState());

      const largeUserList = Array.from({ length: 1000 }, (_, i) => ({
        uid: `user${i}`,
        email: `user${i}@example.com`,
        displayName: `User ${i}`,
        role: i % 2 === 0 ? UserRole.PARENT : UserRole.VOLUNTEER,
        permissions: [],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }));

      act(() => {
        result.current.actions.setUsers(largeUserList);
      });

      const startTime = performance.now();

      act(() => {
        result.current.actions.setRoleFilter(UserRole.PARENT);
      });

      const endTime = performance.now();

      // Should complete in reasonable time (less than 50ms)
      expect(endTime - startTime).toBeLessThan(50);
      expect(result.current.state.filteredUsers.length).toBe(500);
    });
  });

  describe('State Consistency', () => {
    it('should maintain state consistency across multiple updates', () => {
      const { result } = renderHook(() => useUserManagementState());

      const users = [
        {
          uid: 'user1',
          email: 'user1@example.com',
          displayName: 'User 1',
          role: UserRole.PARENT,
          permissions: [],
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          uid: 'user2',
          email: 'user2@example.com',
          displayName: 'User 2',
          role: UserRole.VOLUNTEER,
          permissions: [],
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      act(() => {
        result.current.actions.setUsers(users);
        result.current.actions.setRoleFilter(UserRole.PARENT);
        result.current.actions.setSearchTerm('user1');
      });

      expect(result.current.state.filteredUsers).toEqual([users[0]]);

      act(() => {
        result.current.actions.setSearchTerm('user2');
      });

      expect(result.current.state.filteredUsers).toEqual([]);
    });

    it('should handle multiple filter combinations correctly', () => {
      const { result } = renderHook(() => useUserManagementState());

      const users = [
        {
          uid: 'user1',
          email: 'user1@example.com',
          displayName: 'User 1',
          role: UserRole.PARENT,
          permissions: [],
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          uid: 'user2',
          email: 'user2@example.com',
          displayName: 'User 2',
          role: UserRole.VOLUNTEER,
          permissions: [],
          isActive: false,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      act(() => {
        result.current.actions.setUsers(users);
        result.current.actions.setRoleFilter(UserRole.PARENT);
        result.current.actions.setStatusFilter('active');
      });

      expect(result.current.state.filteredUsers).toEqual([users[0]]);
    });
  });
});