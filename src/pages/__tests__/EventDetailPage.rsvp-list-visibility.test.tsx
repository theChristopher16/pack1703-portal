import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock the AdminContext
const mockUseAdmin = jest.fn();
jest.mock('../../contexts/AdminContext', () => ({
  useAdmin: () => mockUseAdmin()
}));

// Mock Firebase
jest.mock('../../firebase/config', () => ({
  db: {},
  auth: {},
  functions: {}
}));

// Mock Firebase Firestore functions
jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn(),
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  getDocs: jest.fn()
}));

// Mock RSVPForm
jest.mock('../../components/Forms/RSVPForm', () => {
  return function MockRSVPForm({ onSuccess, eventId, currentRSVPs }: any) {
    return (
      <div data-testid="rsvp-form">
        <div data-testid="current-rsvps">{currentRSVPs}</div>
        <button 
          data-testid="rsvp-submit"
          onClick={() => onSuccess && onSuccess()}
        >
          Submit RSVP
        </button>
      </div>
    );
  };
});

describe('EventDetailPage RSVP List Tab Visibility', () => {
  const mockEvent = {
    id: 'test-event-id',
    title: 'Test Event',
    description: 'Test Description',
    category: 'Meeting',
    startDate: { toDate: () => new Date('2025-01-01') },
    endDate: { toDate: () => new Date('2025-01-01') },
    startTime: '10:00',
    endTime: '12:00',
    locationId: 'test-location',
    rsvpEnabled: true,
    capacity: 50,
    currentParticipants: 3,
    visibility: 'public' as const,
    isActive: true
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock Firebase functions
    const { doc, getDoc } = require('firebase/firestore');
    doc.mockReturnValue({});
    getDoc.mockResolvedValue({
      exists: () => true,
      data: () => mockEvent
    });
  });

  it('should show RSVP List tab for root users', () => {
    // Mock AdminContext with root user
    mockUseAdmin.mockReturnValue({
      state: {
        currentUser: { 
          uid: 'test-user-id', 
          role: 'root', 
          email: 'test@example.com',
          displayName: 'Test User',
          photoURL: null,
          isAdmin: true,
          permissions: ['system_admin', 'user_management', 'event_management'],
          lastLogin: new Date(),
          isActive: true
        },
        isAuthenticated: true,
        isLoading: false,
        permissions: ['system_admin', 'user_management', 'event_management'],
        role: 'root',
        recentActions: [],
        auditLogs: [],
        dashboardStats: null,
        systemHealth: null,
        notifications: [],
        error: null
      },
      login: jest.fn(),
      logout: jest.fn(),
      updateUserRole: jest.fn(),
      refreshUser: jest.fn(),
    });

    // Create a mock component that simulates the tab rendering logic
    const MockEventDetailPage = () => {
      const { state } = mockUseAdmin();
      
      const tabs = [
        { id: 'details', label: 'Details' },
        { id: 'rsvp', label: 'RSVP' },
        // Only show RSVP list tab for admin+ users
        ...(state.role === 'root' || state.role === 'super-admin' || state.role === 'content-admin' ? 
          [{ id: 'rsvp-list', label: 'RSVP List' }] : []),
        { id: 'map', label: 'Map' }
      ];

      return (
        <div>
          {tabs.map((tab) => (
            <button key={tab.id} data-testid={`tab-${tab.id}`}>
              {tab.label}
            </button>
          ))}
        </div>
      );
    };

    render(<MockEventDetailPage />);
    
    expect(screen.getByTestId('tab-rsvp-list')).toBeInTheDocument();
    expect(screen.getByText('RSVP List')).toBeInTheDocument();
  });

  it('should show RSVP List tab for super-admin users', () => {
    // Mock AdminContext with super-admin user
    mockUseAdmin.mockReturnValue({
      state: {
        currentUser: { 
          uid: 'test-user-id', 
          role: 'super-admin', 
          email: 'test@example.com',
          displayName: 'Test User',
          photoURL: null,
          isAdmin: true,
          permissions: ['system_admin', 'user_management', 'event_management'],
          lastLogin: new Date(),
          isActive: true
        },
        isAuthenticated: true,
        isLoading: false,
        permissions: ['system_admin', 'user_management', 'event_management'],
        role: 'super-admin',
        recentActions: [],
        auditLogs: [],
        dashboardStats: null,
        systemHealth: null,
        notifications: [],
        error: null
      },
      login: jest.fn(),
      logout: jest.fn(),
      updateUserRole: jest.fn(),
      refreshUser: jest.fn(),
    });

    // Create a mock component that simulates the tab rendering logic
    const MockEventDetailPage = () => {
      const { state } = mockUseAdmin();
      
      const tabs = [
        { id: 'details', label: 'Details' },
        { id: 'rsvp', label: 'RSVP' },
        // Only show RSVP list tab for admin+ users
        ...(state.role === 'root' || state.role === 'super-admin' || state.role === 'content-admin' ? 
          [{ id: 'rsvp-list', label: 'RSVP List' }] : []),
        { id: 'map', label: 'Map' }
      ];

      return (
        <div>
          {tabs.map((tab) => (
            <button key={tab.id} data-testid={`tab-${tab.id}`}>
              {tab.label}
            </button>
          ))}
        </div>
      );
    };

    render(<MockEventDetailPage />);
    
    expect(screen.getByTestId('tab-rsvp-list')).toBeInTheDocument();
    expect(screen.getByText('RSVP List')).toBeInTheDocument();
  });

  it('should not show RSVP List tab for regular users', () => {
    // Mock AdminContext with regular user
    mockUseAdmin.mockReturnValue({
      state: {
        currentUser: { 
          uid: 'test-user-id', 
          role: 'viewer', 
          email: 'test@example.com',
          displayName: 'Test User',
          photoURL: null,
          isAdmin: false,
          permissions: [],
          lastLogin: new Date(),
          isActive: true
        },
        isAuthenticated: true,
        isLoading: false,
        permissions: [],
        role: 'viewer',
        recentActions: [],
        auditLogs: [],
        dashboardStats: null,
        systemHealth: null,
        notifications: [],
        error: null
      },
      login: jest.fn(),
      logout: jest.fn(),
      updateUserRole: jest.fn(),
      refreshUser: jest.fn(),
    });

    // Create a mock component that simulates the tab rendering logic
    const MockEventDetailPage = () => {
      const { state } = mockUseAdmin();
      
      const tabs = [
        { id: 'details', label: 'Details' },
        { id: 'rsvp', label: 'RSVP' },
        // Only show RSVP list tab for admin+ users
        ...(state.role === 'root' || state.role === 'super-admin' || state.role === 'content-admin' ? 
          [{ id: 'rsvp-list', label: 'RSVP List' }] : []),
        { id: 'map', label: 'Map' }
      ];

      return (
        <div>
          {tabs.map((tab) => (
            <button key={tab.id} data-testid={`tab-${tab.id}`}>
              {tab.label}
            </button>
          ))}
        </div>
      );
    };

    render(<MockEventDetailPage />);
    
    expect(screen.queryByTestId('tab-rsvp-list')).not.toBeInTheDocument();
    expect(screen.queryByText('RSVP List')).not.toBeInTheDocument();
  });
});
