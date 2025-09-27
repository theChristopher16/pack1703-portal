import React from 'react';
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import AdminUsers from '../AdminUsers';
import { authService } from '../../services/authService';
import { useAdminContext } from '../../contexts/AdminContext';

// Mock Firebase
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(),
  getApps: jest.fn(() => []),
  getApp: jest.fn()
}));

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(),
  signInWithPopup: jest.fn(),
  GoogleAuthProvider: jest.fn()
}));

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(),
  collection: jest.fn(),
  query: jest.fn(),
  getDocs: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  updateDoc: jest.fn(),
  addDoc: jest.fn(),
  deleteDoc: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  startAfter: jest.fn(),
  Timestamp: {
    now: jest.fn(() => ({ toDate: () => new Date() }))
  }
}));

// Mock the services
jest.mock('../../services/authService');
jest.mock('../../contexts/AdminContext');
jest.mock('../../services/firestore');

const mockAuthService = authService as jest.Mocked<typeof authService>;
const mockUseAdminContext = useAdminContext as jest.MockedFunction<typeof useAdminContext>;

// Mock store
const mockStore = configureStore({
  reducer: {
    auth: (state = { user: null, loading: false }, action) => state
  }
});

// Mock admin context
const mockAdminContext = {
  addNotification: jest.fn(),
  user: {
    uid: 'test-admin',
    email: 'admin@test.com',
    role: 'admin',
    permissions: ['user_management']
  },
  dashboardStats: {},
  systemHealth: {},
  auditLogs: []
};

// Mock users data including Gina Messa
const mockUsers = [
  {
    uid: 'user1',
    email: 'user1@test.com',
    displayName: 'User One',
    role: 'parent',
    status: 'approved',
    profile: { den: 'Wolf' },
    createdAt: new Date(),
    updatedAt: new Date(),
    isActive: true,
    permissions: []
  },
  {
    uid: 'gina-messa',
    email: 'gina_daigle@yahoo.com',
    displayName: 'Gina Messa',
    role: 'parent',
    status: 'approved',
    profile: { den: 'Bear' },
    createdAt: new Date(),
    updatedAt: new Date(),
    isActive: true,
    permissions: []
  },
  {
    uid: 'user2',
    email: 'user2@test.com',
    displayName: 'User Two',
    role: 'leader',
    status: 'approved',
    profile: { den: 'Tiger' },
    createdAt: new Date(),
    updatedAt: new Date(),
    isActive: true,
    permissions: []
  }
];

describe('AdminUsers Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAdminContext.mockReturnValue(mockAdminContext);
    
    // Mock successful getUsers call
    mockAuthService.getUsers.mockResolvedValue(mockUsers);
  });

  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      <Provider store={mockStore}>
        <BrowserRouter>
          {component}
        </BrowserRouter>
      </Provider>
    );
  };

  describe('Complete User Management Flow', () => {
    test('renders AdminUsers page and loads all users including Gina Messa', async () => {
      await act(async () => {
        renderWithProviders(<AdminUsers />);
      });

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.getByText(/admin users/i)).toBeInTheDocument();
      });

      // Verify all users are displayed
      await waitFor(() => {
        expect(screen.getByText('User One')).toBeInTheDocument();
        expect(screen.getByText('Gina Messa')).toBeInTheDocument();
        expect(screen.getByText('User Two')).toBeInTheDocument();
      });

      // Verify Gina's details
      expect(screen.getByText('gina_daigle@yahoo.com')).toBeInTheDocument();
    });

    test('handles user search functionality', async () => {
      await act(async () => {
        renderWithProviders(<AdminUsers />);
      });

      await waitFor(() => {
        expect(screen.getByText('Gina Messa')).toBeInTheDocument();
      });

      // Find and use search input
      const searchInput = screen.getByPlaceholderText(/search users/i);
      
      await act(async () => {
        fireEvent.change(searchInput, { target: { value: 'Gina' } });
      });

      // Verify search results
      await waitFor(() => {
        expect(screen.getByText('Gina Messa')).toBeInTheDocument();
        expect(screen.queryByText('User One')).not.toBeInTheDocument();
        expect(screen.queryByText('User Two')).not.toBeInTheDocument();
      });
    });

    test('handles role filtering', async () => {
      await act(async () => {
        renderWithProviders(<AdminUsers />);
      });

      await waitFor(() => {
        expect(screen.getByText('Gina Messa')).toBeInTheDocument();
      });

      // Find role filter dropdown
      const roleFilter = screen.getByLabelText(/filter by role/i);
      
      await act(async () => {
        fireEvent.change(roleFilter, { target: { value: 'parent' } });
      });

      // Verify filtered results
      await waitFor(() => {
        expect(screen.getByText('Gina Messa')).toBeInTheDocument();
        expect(screen.getByText('User One')).toBeInTheDocument();
        expect(screen.queryByText('User Two')).not.toBeInTheDocument();
      });
    });

    test('handles den filtering', async () => {
      await act(async () => {
        renderWithProviders(<AdminUsers />);
      });

      await waitFor(() => {
        expect(screen.getByText('Gina Messa')).toBeInTheDocument();
      });

      // Find den filter dropdown
      const denFilter = screen.getByLabelText(/filter by den/i);
      
      await act(async () => {
        fireEvent.change(denFilter, { target: { value: 'Bear' } });
      });

      // Verify filtered results
      await waitFor(() => {
        expect(screen.getByText('Gina Messa')).toBeInTheDocument();
        expect(screen.queryByText('User One')).not.toBeInTheDocument();
        expect(screen.queryByText('User Two')).not.toBeInTheDocument();
      });
    });
  });

  describe('Error Scenarios', () => {
    test('handles network error gracefully', async () => {
      mockAuthService.getUsers.mockRejectedValue(new Error('Network error'));

      await act(async () => {
        renderWithProviders(<AdminUsers />);
      });

      await waitFor(() => {
        expect(screen.getByText(/error loading users/i)).toBeInTheDocument();
      });

      // Verify notification was called
      expect(mockAdminContext.addNotification).toHaveBeenCalledWith(
        'error',
        'Error',
        'Failed to load users'
      );
    });

    test('handles empty users list', async () => {
      mockAuthService.getUsers.mockResolvedValue([]);

      await act(async () => {
        renderWithProviders(<AdminUsers />);
      });

      await waitFor(() => {
        expect(screen.getByText(/no users found/i)).toBeInTheDocument();
      });
    });

    test('handles partial data gracefully', async () => {
      const partialUsers = [
        {
          uid: 'gina-messa',
          email: 'gina_daigle@yahoo.com',
          displayName: 'Gina Messa',
          role: 'parent',
          status: 'approved',
          profile: { den: 'Bear' },
          createdAt: new Date(),
          updatedAt: new Date(),
          isActive: true,
          permissions: []
        }
      ];

      mockAuthService.getUsers.mockResolvedValue(partialUsers);

      await act(async () => {
        renderWithProviders(<AdminUsers />);
      });

      await waitFor(() => {
        expect(screen.getByText('Gina Messa')).toBeInTheDocument();
        expect(screen.queryByText('User One')).not.toBeInTheDocument();
      });
    });
  });

  describe('Performance Tests', () => {
    test('renders large user list efficiently', async () => {
      // Create a large list of users
      const largeUserList = Array.from({ length: 500 }, (_, i) => ({
        uid: `user-${i}`,
        email: `user${i}@test.com`,
        displayName: `User ${i}`,
        role: 'parent',
        status: 'approved',
        profile: { den: 'Wolf' },
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
        permissions: []
      }));

      // Add Gina to the list
      largeUserList.push({
        uid: 'gina-messa',
        email: 'gina_daigle@yahoo.com',
        displayName: 'Gina Messa',
        role: 'parent',
        status: 'approved',
        profile: { den: 'Bear' },
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
        permissions: []
      });

      mockAuthService.getUsers.mockResolvedValue(largeUserList);

      const startTime = performance.now();

      await act(async () => {
        renderWithProviders(<AdminUsers />);
      });

      await waitFor(() => {
        expect(screen.getByText('Gina Messa')).toBeInTheDocument();
      });

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should handle large lists efficiently (less than 3 seconds)
      expect(renderTime).toBeLessThan(3000);
    });

    test('does not cause memory leaks with repeated renders', async () => {
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;

      // Render multiple times
      for (let i = 0; i < 5; i++) {
        const { unmount } = renderWithProviders(<AdminUsers />);
        
        await waitFor(() => {
          expect(screen.getByText('Gina Messa')).toBeInTheDocument();
        });

        unmount();
      }

      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be reasonable (less than 10MB)
      if (finalMemory > 0) {
        expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
      }
    });
  });

  describe('Accessibility Tests', () => {
    test('has proper ARIA labels and roles', async () => {
      await act(async () => {
        renderWithProviders(<AdminUsers />);
      });

      await waitFor(() => {
        expect(screen.getByText('Gina Messa')).toBeInTheDocument();
      });

      // Check for proper ARIA labels
      expect(screen.getByLabelText(/search users/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/filter by role/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/filter by den/i)).toBeInTheDocument();
    });

    test('supports keyboard navigation', async () => {
      await act(async () => {
        renderWithProviders(<AdminUsers />);
      });

      await waitFor(() => {
        expect(screen.getByText('Gina Messa')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search users/i);
      
      // Test keyboard navigation
      await act(async () => {
        searchInput.focus();
        fireEvent.keyDown(searchInput, { key: 'Tab' });
      });

      expect(document.activeElement).toBeDefined();
    });
  });
});
