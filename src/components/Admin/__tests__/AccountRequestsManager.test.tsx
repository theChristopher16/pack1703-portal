import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import AccountRequestsManager from '../../components/Admin/AccountRequestsManager';
import { useAdmin } from '../../contexts/AdminContext';
import { accountRequestService } from '../../services/accountRequestService';

// Mock the AdminContext
jest.mock('../../contexts/AdminContext');
const mockUseAdmin = useAdmin as jest.MockedFunction<typeof useAdmin>;

// Mock the account request service
jest.mock('../../services/accountRequestService');
const mockAccountRequestService = accountRequestService as jest.Mocked<typeof accountRequestService>;

describe('AccountRequestsManager Performance Optimizations', () => {
  const mockAddNotification = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUseAdmin.mockReturnValue({
      addNotification: mockAddNotification,
      state: {
        currentUser: { uid: 'test-user', role: 'admin' },
        isAuthenticated: true
      }
    } as any);
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  it('should use cached data when available and valid', async () => {
    const mockRequests = [
      {
        id: 'req1',
        email: 'test1@example.com',
        displayName: 'Test User 1',
        status: 'pending',
        submittedAt: { toDate: () => new Date() }
      }
    ];

    mockAccountRequestService.getPendingRequests.mockResolvedValue({
      success: true,
      requests: mockRequests,
      count: 1,
      message: 'Success'
    });

    const { rerender } = render(<AccountRequestsManager />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Test User 1')).toBeInTheDocument();
    });

    // Clear the mock to verify cache is used
    mockAccountRequestService.getPendingRequests.mockClear();

    // Re-render the component (simulating navigation back)
    rerender(<AccountRequestsManager />);

    // Should not call the service again due to caching
    expect(mockAccountRequestService.getPendingRequests).not.toHaveBeenCalled();
  });

  it('should force refresh when refresh button is clicked', async () => {
    const mockRequests = [
      {
        id: 'req1',
        email: 'test1@example.com',
        displayName: 'Test User 1',
        status: 'pending',
        submittedAt: { toDate: () => new Date() }
      }
    ];

    mockAccountRequestService.getPendingRequests.mockResolvedValue({
      success: true,
      requests: mockRequests,
      count: 1,
      message: 'Success'
    });

    render(<AccountRequestsManager />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Test User 1')).toBeInTheDocument();
    });

    // Clear the mock
    mockAccountRequestService.getPendingRequests.mockClear();

    // Click refresh button
    const refreshButton = screen.getByText('Refresh');
    act(() => {
      refreshButton.click();
    });

    // Should call the service again due to force refresh
    await waitFor(() => {
      expect(mockAccountRequestService.getPendingRequests).toHaveBeenCalled();
    });
  });

  it('should handle cache expiration correctly', async () => {
    const mockRequests = [
      {
        id: 'req1',
        email: 'test1@example.com',
        displayName: 'Test User 1',
        status: 'pending',
        submittedAt: { toDate: () => new Date() }
      }
    ];

    mockAccountRequestService.getPendingRequests.mockResolvedValue({
      success: true,
      requests: mockRequests,
      count: 1,
      message: 'Success'
    });

    // Mock Date.now to simulate cache expiration
    const originalDateNow = Date.now;
    let mockTime = 1000000;
    Date.now = jest.fn(() => mockTime);

    render(<AccountRequestsManager />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Test User 1')).toBeInTheDocument();
    });

    // Clear the mock
    mockAccountRequestService.getPendingRequests.mockClear();

    // Simulate cache expiration (2 minutes + 1ms)
    mockTime += 2 * 60 * 1000 + 1;
    Date.now = jest.fn(() => mockTime);

    // Re-render to trigger cache check
    const { rerender } = render(<AccountRequestsManager />);
    rerender(<AccountRequestsManager />);

    // Should call the service again due to cache expiration
    await waitFor(() => {
      expect(mockAccountRequestService.getPendingRequests).toHaveBeenCalled();
    });

    // Restore original Date.now
    Date.now = originalDateNow;
  });

  it('should handle service errors gracefully', async () => {
    mockAccountRequestService.getPendingRequests.mockRejectedValue(
      new Error('Service unavailable')
    );

    render(<AccountRequestsManager />);

    await waitFor(() => {
      expect(mockAddNotification).toHaveBeenCalledWith(
        'error',
        'Error',
        'Failed to load account requests'
      );
    });
  });

  it('should show loading state initially', () => {
    mockAccountRequestService.getPendingRequests.mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(<AccountRequestsManager />);

    expect(screen.getByText('Loading account requests...')).toBeInTheDocument();
  });

  it('should show empty state when no requests', async () => {
    mockAccountRequestService.getPendingRequests.mockResolvedValue({
      success: true,
      requests: [],
      count: 0,
      message: 'No requests'
    });

    render(<AccountRequestsManager />);

    await waitFor(() => {
      expect(screen.getByText('No Pending Requests')).toBeInTheDocument();
    });
  });
});