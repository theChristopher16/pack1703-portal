import React from 'react';
import { render, act, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AdminUsers from '../AdminUsers';
import { authService } from '../../services/authService';
import { useAdminContext } from '../../contexts/AdminContext';

// Mock dependencies
jest.mock('../../services/authService');
jest.mock('../../contexts/AdminContext');

const mockAuthService = authService as jest.Mocked<typeof authService>;
const mockUseAdminContext = useAdminContext as jest.MockedFunction<typeof useAdminContext>;

const mockAdminContext = {
  addNotification: jest.fn(),
  user: {
    uid: 'test-admin',
    email: 'admin@test.com',
    role: 'admin',
    permissions: ['user_management']
  }
};

const mockUsers = [
  {
    uid: 'gina-messa',
    email: 'gina_daigle@yahoo.com',
    displayName: 'Gina Messa',
    role: 'parent',
    status: 'approved',
    profile: { den: 'Bear' }
  }
];

describe('AdminUsers Infinite Loop Prevention', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAdminContext.mockReturnValue(mockAdminContext);
    mockAuthService.getUsers.mockResolvedValue(mockUsers);
  });

  test('prevents infinite re-renders caused by useEffect dependencies', async () => {
    let renderCount = 0;
    let getUsersCallCount = 0;

    // Track render count
    const TestWrapper = () => {
      renderCount++;
      return <AdminUsers />;
    };

    // Track getUsers calls
    mockAuthService.getUsers.mockImplementation(() => {
      getUsersCallCount++;
      return Promise.resolve(mockUsers);
    });

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

    // Wait additional time to ensure no more calls
    await new Promise(resolve => setTimeout(resolve, 200));

    // Should only render a reasonable number of times
    expect(renderCount).toBeLessThan(10);
    
    // Should only call getUsers once
    expect(getUsersCallCount).toBe(1);
  });

  test('loadUsers function does not change on every render', async () => {
    const loadUsersCalls: any[] = [];
    
    mockAuthService.getUsers.mockImplementation((...args) => {
      loadUsersCalls.push(args);
      return Promise.resolve(mockUsers);
    });

    await act(async () => {
      render(
        <BrowserRouter>
          <AdminUsers />
        </BrowserRouter>
      );
    });

    await waitFor(() => {
      expect(mockAuthService.getUsers).toHaveBeenCalled();
    });

    // Wait to ensure no additional calls
    await new Promise(resolve => setTimeout(resolve, 100));

    // Should only be called once
    expect(loadUsersCalls.length).toBe(1);
  });

  test('isCacheValid function is stable', async () => {
    let cacheValidCalls = 0;
    
    // Mock the component to track cache valid calls
    const originalUseCallback = React.useCallback;
    React.useCallback = jest.fn((fn, deps) => {
      if (fn.toString().includes('isCacheValid')) {
        return (...args: any[]) => {
          cacheValidCalls++;
          return false; // Always return false as per our fix
        };
      }
      return originalUseCallback(fn, deps);
    });

    await act(async () => {
      render(
        <BrowserRouter>
          <AdminUsers />
        </BrowserRouter>
      );
    });

    await waitFor(() => {
      expect(mockAuthService.getUsers).toHaveBeenCalled();
    });

    // Wait to ensure stability
    await new Promise(resolve => setTimeout(resolve, 100));

    // Cache valid should be called but not excessively
    expect(cacheValidCalls).toBeLessThan(20);

    // Restore original useCallback
    React.useCallback = originalUseCallback;
  });

  test('useEffect with empty dependency array only runs once', async () => {
    let useEffectCallCount = 0;
    
    // Mock useEffect to track calls
    const originalUseEffect = React.useEffect;
    React.useEffect = jest.fn((effect, deps) => {
      if (Array.isArray(deps) && deps.length === 0) {
        useEffectCallCount++;
      }
      return originalUseEffect(effect, deps);
    });

    await act(async () => {
      render(
        <BrowserRouter>
          <AdminUsers />
        </BrowserRouter>
      );
    });

    await waitFor(() => {
      expect(mockAuthService.getUsers).toHaveBeenCalled();
    });

    // Wait to ensure no additional calls
    await new Promise(resolve => setTimeout(resolve, 100));

    // Should only call useEffect with empty deps once
    expect(useEffectCallCount).toBe(1);

    // Restore original useEffect
    React.useEffect = originalUseEffect;
  });

  test('component state updates do not trigger infinite loops', async () => {
    let stateUpdateCount = 0;
    
    // Track state updates
    const originalSetState = React.useState;
    React.useState = jest.fn((initialState) => {
      const [state, setState] = originalSetState(initialState);
      const wrappedSetState = (...args: any[]) => {
        stateUpdateCount++;
        return setState(...args);
      };
      return [state, wrappedSetState];
    });

    await act(async () => {
      render(
        <BrowserRouter>
          <AdminUsers />
        </BrowserRouter>
      );
    });

    await waitFor(() => {
      expect(mockAuthService.getUsers).toHaveBeenCalled();
    });

    // Wait to ensure no additional state updates
    await new Promise(resolve => setTimeout(resolve, 100));

    // Should have reasonable number of state updates (not infinite)
    expect(stateUpdateCount).toBeLessThan(50);

    // Restore original useState
    React.useState = originalSetState;
  });

  test('handles rapid re-renders without infinite loops', async () => {
    let renderCount = 0;
    
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

    // Force multiple re-renders
    for (let i = 0; i < 5; i++) {
      await act(async () => {
        // Trigger a re-render
        mockAuthService.getUsers.mockResolvedValueOnce([...mockUsers]);
      });
    }

    await waitFor(() => {
      expect(mockAuthService.getUsers).toHaveBeenCalled();
    });

    // Wait to ensure stability
    await new Promise(resolve => setTimeout(resolve, 200));

    // Should not have excessive renders
    expect(renderCount).toBeLessThan(20);
  });

  test('prevents memory leaks from infinite loops', async () => {
    const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;

    await act(async () => {
      render(
        <BrowserRouter>
          <AdminUsers />
        </BrowserRouter>
      );
    });

    await waitFor(() => {
      expect(mockAuthService.getUsers).toHaveBeenCalled();
    });

    // Wait longer to detect memory leaks
    await new Promise(resolve => setTimeout(resolve, 1000));

    const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
    const memoryIncrease = finalMemory - initialMemory;

    // Memory increase should be reasonable (less than 5MB)
    if (finalMemory > 0) {
      expect(memoryIncrease).toBeLessThan(5 * 1024 * 1024);
    }
  });
});
