import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { AdminProvider } from '../../contexts/AdminContext';
import { adminService } from '../../services/adminService';

// Mock the admin service
jest.mock('../../services/adminService');
const mockAdminService = adminService as jest.Mocked<typeof adminService>;

// Mock Firebase Auth
jest.mock('firebase/auth', () => ({
  getAuth: () => ({}),
  signInWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  onAuthStateChanged: jest.fn()
}));

// Mock Firebase Firestore
jest.mock('firebase/firestore', () => ({
  getFirestore: () => ({}),
  collection: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  getDocs: jest.fn(),
  addDoc: jest.fn(),
  writeBatch: jest.fn(),
  serverTimestamp: jest.fn()
}));

// Mock Firebase Functions
jest.mock('firebase/functions', () => ({
  getFunctions: () => ({}),
  httpsCallable: jest.fn()
}));

// Test component that uses AdminContext
const TestComponent = () => {
  const { state, refreshDashboardStats } = React.useContext(AdminContext);
  
  return (
    <div>
      <div data-testid="loading">{state.isLoading ? 'Loading' : 'Not Loading'}</div>
      <div data-testid="stats">{state.dashboardStats ? 'Stats Loaded' : 'No Stats'}</div>
      <div data-testid="health">{state.systemHealth ? 'Health Loaded' : 'No Health'}</div>
      <div data-testid="logs">{state.auditLogs.length > 0 ? 'Logs Loaded' : 'No Logs'}</div>
      <button onClick={refreshDashboardStats}>Refresh Stats</button>
    </div>
  );
};

describe('AdminContext Performance Optimizations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  it('should use batch dashboard data function successfully', async () => {
    const mockBatchData = {
      success: true,
      dashboardStats: {
        totalUsers: 25,
        activeUsers: 18,
        totalEvents: 15,
        pendingRequests: 3
      },
      systemHealth: {
        status: 'healthy',
        uptime: '99.9%',
        responseTime: '120ms'
      },
      auditLogs: [
        { id: 'log1', action: 'user_login', timestamp: new Date() }
      ]
    };

    mockAdminService.getBatchDashboardData.mockResolvedValue(mockBatchData);

    render(
      <AdminProvider>
        <TestComponent />
      </AdminProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('stats')).toHaveTextContent('Stats Loaded');
      expect(screen.getByTestId('health')).toHaveTextContent('Health Loaded');
      expect(screen.getByTestId('logs')).toHaveTextContent('Logs Loaded');
    });

    expect(mockAdminService.getBatchDashboardData).toHaveBeenCalled();
  });

  it('should fallback to individual calls when batch fails', async () => {
    const mockIndividualData = {
      dashboardStats: { totalUsers: 25 },
      systemHealth: { status: 'healthy' },
      auditLogs: [{ id: 'log1', action: 'test' }]
    };

    mockAdminService.getBatchDashboardData.mockRejectedValue(new Error('Batch failed'));
    mockAdminService.getDashboardStats.mockResolvedValue(mockIndividualData.dashboardStats);
    mockAdminService.getSystemHealth.mockResolvedValue(mockIndividualData.systemHealth);
    mockAdminService.getAuditLogs.mockResolvedValue(mockIndividualData.auditLogs);

    render(
      <AdminProvider>
        <TestComponent />
      </AdminProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('stats')).toHaveTextContent('Stats Loaded');
      expect(screen.getByTestId('health')).toHaveTextContent('Health Loaded');
      expect(screen.getByTestId('logs')).toHaveTextContent('Logs Loaded');
    });

    expect(mockAdminService.getBatchDashboardData).toHaveBeenCalled();
    expect(mockAdminService.getDashboardStats).toHaveBeenCalled();
    expect(mockAdminService.getSystemHealth).toHaveBeenCalled();
    expect(mockAdminService.getAuditLogs).toHaveBeenCalled();
  });

  it('should handle batch function returning unsuccessful result', async () => {
    const mockBatchData = {
      success: false,
      error: 'Permission denied'
    };

    const mockIndividualData = {
      dashboardStats: { totalUsers: 25 },
      systemHealth: { status: 'healthy' },
      auditLogs: [{ id: 'log1', action: 'test' }]
    };

    mockAdminService.getBatchDashboardData.mockResolvedValue(mockBatchData);
    mockAdminService.getDashboardStats.mockResolvedValue(mockIndividualData.dashboardStats);
    mockAdminService.getSystemHealth.mockResolvedValue(mockIndividualData.systemHealth);
    mockAdminService.getAuditLogs.mockResolvedValue(mockIndividualData.auditLogs);

    render(
      <AdminProvider>
        <TestComponent />
      </AdminProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('stats')).toHaveTextContent('Stats Loaded');
      expect(screen.getByTestId('health')).toHaveTextContent('Health Loaded');
      expect(screen.getByTestId('logs')).toHaveTextContent('Logs Loaded');
    });

    expect(mockAdminService.getBatchDashboardData).toHaveBeenCalled();
    expect(mockAdminService.getDashboardStats).toHaveBeenCalled();
    expect(mockAdminService.getSystemHealth).toHaveBeenCalled();
    expect(mockAdminService.getAuditLogs).toHaveBeenCalled();
  });

  it('should handle all service failures gracefully', async () => {
    mockAdminService.getBatchDashboardData.mockRejectedValue(new Error('Batch failed'));
    mockAdminService.getDashboardStats.mockRejectedValue(new Error('Stats failed'));
    mockAdminService.getSystemHealth.mockRejectedValue(new Error('Health failed'));
    mockAdminService.getAuditLogs.mockRejectedValue(new Error('Logs failed'));

    render(
      <AdminProvider>
        <TestComponent />
      </AdminProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('stats')).toHaveTextContent('No Stats');
      expect(screen.getByTestId('health')).toHaveTextContent('No Health');
      expect(screen.getByTestId('logs')).toHaveTextContent('No Logs');
    });

    // Should not throw errors
    expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading');
  });

  it('should refresh dashboard stats when button is clicked', async () => {
    const mockBatchData = {
      success: true,
      dashboardStats: { totalUsers: 30 },
      systemHealth: { status: 'healthy' },
      auditLogs: [{ id: 'log2', action: 'refresh' }]
    };

    mockAdminService.getBatchDashboardData.mockResolvedValue(mockBatchData);

    render(
      <AdminProvider>
        <TestComponent />
      </AdminProvider>
    );

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByTestId('stats')).toHaveTextContent('Stats Loaded');
    });

    // Clear mocks
    mockAdminService.getBatchDashboardData.mockClear();

    // Click refresh button
    const refreshButton = screen.getByText('Refresh Stats');
    act(() => {
      refreshButton.click();
    });

    // Should call batch function again
    await waitFor(() => {
      expect(mockAdminService.getBatchDashboardData).toHaveBeenCalled();
    });
  });
});
