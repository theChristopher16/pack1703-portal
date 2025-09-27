import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AdminUsers from '../AdminUsers';
import { authService } from '../../services/authService';
import { useAdminContext } from '../../contexts/AdminContext';

// Mock the dependencies
jest.mock('../../services/authService');
jest.mock('../../contexts/AdminContext');
jest.mock('../../services/firestore');

const mockAuthService = authService as jest.Mocked<typeof authService>;
const mockUseAdminContext = useAdminContext as jest.MockedFunction<typeof useAdminContext>;

// Mock admin context
const mockAdminContext = {
  addNotification: jest.fn(),
  user: {
    uid: 'test-admin',
    email: 'admin@test.com',
    role: 'admin',
    permissions: ['user_management']
  }
};

// Mock users data including Gina Messa
const mockUsers = [
  {
    uid: 'user1',
    email: 'user1@test.com',
    displayName: 'User One',
    role: 'parent',
    status: 'approved',
    profile: { den: 'Wolf' }
  },
  {
    uid: 'gina-messa',
    email: 'gina_daigle@yahoo.com',
    displayName: 'Gina Messa',
    role: 'parent',
    status: 'approved',
    profile: { den: 'Bear' }
  },
  {
    uid: 'user2',
    email: 'user2@test.com',
    displayName: 'User Two',
    role: 'leader',
    status: 'approved',
    profile: { den: 'Tiger' }
  }
];

describe('AdminUsers Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAdminContext.mockReturnValue(mockAdminContext);
    
    // Mock successful getUsers call
    mockAuthService.getUsers.mockResolvedValue(mockUsers);
  });

  const renderAdminUsers = () => {
    return render(
      <BrowserRouter>
        <AdminUsers />
      </BrowserRouter>
    );
  };

  describe('Component Rendering', () => {
    test('renders AdminUsers component without crashing', async () => {
      await act(async () => {
        renderAdminUsers();
      });

      expect(screen.getByText(/admin users/i)).toBeInTheDocument();
    });

    test('renders loading state initially', async () => {
      // Mock delayed response
      mockAuthService.getUsers.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve(mockUsers), 100))
      );

      await act(async () => {
        renderAdminUsers();
      });

      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    test('renders users list after loading', async () => {
      await act(async () => {
        renderAdminUsers();
      });

      await waitFor(() => {
        expect(screen.getByText('User One')).toBeInTheDocument();
        expect(screen.getByText('Gina Messa')).toBeInTheDocument();
        expect(screen.getByText('User Two')).toBeInTheDocument();
      });
    });
  });

  describe('Users Data Loading', () => {
    test('calls getUsers on component mount', async () => {
      await act(async () => {
        renderAdminUsers();
      });

      expect(mockAuthService.getUsers).toHaveBeenCalledTimes(1);
    });

    test('displays Gina Messa in users list', async () => {
      await act(async () => {
        renderAdminUsers();
      });

      await waitFor(() => {
        expect(screen.getByText('Gina Messa')).toBeInTheDocument();
        expect(screen.getByText('gina_daigle@yahoo.com')).toBeInTheDocument();
      });
    });

    test('handles empty users list', async () => {
      mockAuthService.getUsers.mockResolvedValue([]);

      await act(async () => {
        renderAdminUsers();
      });

      await waitFor(() => {
        expect(screen.getByText(/no users found/i)).toBeInTheDocument();
      });
    });

    test('handles getUsers error', async () => {
      mockAuthService.getUsers.mockRejectedValue(new Error('Failed to load users'));

      await act(async () => {
        renderAdminUsers();
      });

      await waitFor(() => {
        expect(screen.getByText(/error loading users/i)).toBeInTheDocument();
      });
    });
  });

  describe('Infinite Loop Prevention', () => {
    test('does not cause infinite re-renders', async () => {
      let renderCount = 0;
      const originalConsoleError = console.error;
      console.error = jest.fn();

      const TestWrapper = () => {
        renderCount++;
        return <AdminUsers />;
      };

      await act(async () => {
        render(
          <BrowserRouter>
            <TestWrapper />
          </BrowserRouter>
        );
      });

      // Wait for initial load
      await waitFor(() => {
        expect(mockAuthService.getUsers).toHaveBeenCalled();
      });

      // Wait a bit more to ensure no additional renders
      await new Promise(resolve => setTimeout(resolve, 100));

      // Should only render a reasonable number of times (not infinite)
      expect(renderCount).toBeLessThan(10);
      
      console.error = originalConsoleError;
    });

    test('loadUsers function is stable across renders', async () => {
      const loadUsersCalls: any[] = [];
      
      // Mock getUsers to track calls
      mockAuthService.getUsers.mockImplementation((...args) => {
        loadUsersCalls.push(args);
        return Promise.resolve(mockUsers);
      });

      await act(async () => {
        renderAdminUsers();
      });

      await waitFor(() => {
        expect(mockAuthService.getUsers).toHaveBeenCalled();
      });

      // Should only be called once (no infinite loop)
      expect(loadUsersCalls.length).toBe(1);
    });
  });

  describe('User Filtering and Display', () => {
    test('filters out denied users', async () => {
      const usersWithDenied = [
        ...mockUsers,
        {
          uid: 'denied-user',
          email: 'denied@test.com',
          displayName: 'Denied User',
          role: 'parent',
          status: 'denied',
          profile: { den: 'Wolf' }
        }
      ];

      mockAuthService.getUsers.mockResolvedValue(usersWithDenied);

      await act(async () => {
        renderAdminUsers();
      });

      await waitFor(() => {
        expect(screen.getByText('Gina Messa')).toBeInTheDocument();
        expect(screen.queryByText('Denied User')).not.toBeInTheDocument();
      });
    });

    test('displays user hierarchy correctly', async () => {
      await act(async () => {
        renderAdminUsers();
      });

      await waitFor(() => {
        // Check that users are displayed in hierarchical structure
        expect(screen.getByText('User One')).toBeInTheDocument();
        expect(screen.getByText('Gina Messa')).toBeInTheDocument();
        expect(screen.getByText('User Two')).toBeInTheDocument();
      });
    });
  });

  describe('Search and Filter Functionality', () => {
    test('searches users by name', async () => {
      await act(async () => {
        renderAdminUsers();
      });

      await waitFor(() => {
        expect(screen.getByText('Gina Messa')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search users/i);
      
      await act(async () => {
        // Simulate typing in search
        searchInput.value = 'Gina';
        searchInput.dispatchEvent(new Event('input', { bubbles: true }));
      });

      await waitFor(() => {
        expect(screen.getByText('Gina Messa')).toBeInTheDocument();
        expect(screen.queryByText('User One')).not.toBeInTheDocument();
      });
    });

    test('filters users by role', async () => {
      await act(async () => {
        renderAdminUsers();
      });

      await waitFor(() => {
        expect(screen.getByText('Gina Messa')).toBeInTheDocument();
      });

      const roleFilter = screen.getByLabelText(/filter by role/i);
      
      await act(async () => {
        roleFilter.value = 'parent';
        roleFilter.dispatchEvent(new Event('change', { bubbles: true }));
      });

      await waitFor(() => {
        expect(screen.getByText('Gina Messa')).toBeInTheDocument();
        expect(screen.queryByText('User Two')).not.toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    test('displays error message when getUsers fails', async () => {
      mockAuthService.getUsers.mockRejectedValue(new Error('Network error'));

      await act(async () => {
        renderAdminUsers();
      });

      await waitFor(() => {
        expect(screen.getByText(/error loading users/i)).toBeInTheDocument();
      });
    });

    test('calls addNotification on error', async () => {
      mockAuthService.getUsers.mockRejectedValue(new Error('Test error'));

      await act(async () => {
        renderAdminUsers();
      });

      await waitFor(() => {
        expect(mockAdminContext.addNotification).toHaveBeenCalledWith(
          'error',
          'Error',
          'Failed to load users'
        );
      });
    });
  });

  describe('Performance', () => {
    test('builds user hierarchy efficiently', async () => {
      const startTime = performance.now();

      await act(async () => {
        renderAdminUsers();
      });

      await waitFor(() => {
        expect(screen.getByText('Gina Messa')).toBeInTheDocument();
      });

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render quickly (less than 1 second)
      expect(renderTime).toBeLessThan(1000);
    });

    test('handles large user lists efficiently', async () => {
      // Create a large list of users
      const largeUserList = Array.from({ length: 100 }, (_, i) => ({
        uid: `user-${i}`,
        email: `user${i}@test.com`,
        displayName: `User ${i}`,
        role: 'parent',
        status: 'approved',
        profile: { den: 'Wolf' }
      }));

      // Add Gina to the list
      largeUserList.push({
        uid: 'gina-messa',
        email: 'gina_daigle@yahoo.com',
        displayName: 'Gina Messa',
        role: 'parent',
        status: 'approved',
        profile: { den: 'Bear' }
      });

      mockAuthService.getUsers.mockResolvedValue(largeUserList);

      const startTime = performance.now();

      await act(async () => {
        renderAdminUsers();
      });

      await waitFor(() => {
        expect(screen.getByText('Gina Messa')).toBeInTheDocument();
      });

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should handle large lists efficiently
      expect(renderTime).toBeLessThan(2000);
    });
  });
});
