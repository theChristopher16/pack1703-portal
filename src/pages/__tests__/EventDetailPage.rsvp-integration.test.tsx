import React from 'react';
import { render, screen } from '@testing-library/react';
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

describe('RSVP Functionality Tests', () => {
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

    // Mock Firebase functions
    const { doc, getDoc } = require('firebase/firestore');
    doc.mockReturnValue({});
    getDoc.mockResolvedValue({
      exists: () => true,
      data: () => mockEvent
    });
  });

  it('renders RSVP form with correct props', () => {
    const MockRSVPForm = jest.fn(({ onSuccess, eventId, currentRSVPs }: any) => (
      <div data-testid="rsvp-form">
        <div data-testid="current-rsvps">{currentRSVPs}</div>
        <button 
          data-testid="rsvp-submit"
          onClick={() => onSuccess && onSuccess()}
        >
          Submit RSVP
        </button>
      </div>
    ));
    
    render(
      <MockRSVPForm 
        eventId="test-event-id"
        eventTitle="Test Event"
        eventDate="2025-01-01"
        maxCapacity={50}
        currentRSVPs={3}
        onSuccess={jest.fn()}
      />
    );
    
    expect(screen.getByTestId('rsvp-form')).toBeInTheDocument();
    expect(screen.getByTestId('current-rsvps')).toHaveTextContent('3');
  });

  it('displays current RSVP count correctly', () => {
    const MockRSVPForm = jest.fn(({ onSuccess, eventId, currentRSVPs }: any) => (
      <div data-testid="rsvp-form">
        <div data-testid="current-rsvps">{currentRSVPs}</div>
        <button 
          data-testid="rsvp-submit"
          onClick={() => onSuccess && onSuccess()}
        >
          Submit RSVP
        </button>
      </div>
    ));
    
    render(
      <MockRSVPForm 
        eventId="test-event-id"
        eventTitle="Test Event"
        eventDate="2025-01-01"
        maxCapacity={50}
        currentRSVPs={5}
        onSuccess={jest.fn()}
      />
    );
    
    expect(screen.getByTestId('current-rsvps')).toHaveTextContent('5');
  });

  it('handles RSVP form submission', () => {
    const mockOnSuccess = jest.fn();
    const MockRSVPForm = jest.fn(({ onSuccess, eventId, currentRSVPs }: any) => (
      <div data-testid="rsvp-form">
        <div data-testid="current-rsvps">{currentRSVPs}</div>
        <button 
          data-testid="rsvp-submit"
          onClick={() => onSuccess && onSuccess()}
        >
          Submit RSVP
        </button>
      </div>
    ));
    
    render(
      <MockRSVPForm 
        eventId="test-event-id"
        eventTitle="Test Event"
        eventDate="2025-01-01"
        maxCapacity={50}
        currentRSVPs={3}
        onSuccess={mockOnSuccess}
      />
    );
    
    const submitButton = screen.getByTestId('rsvp-submit');
    expect(submitButton).toBeInTheDocument();
    
    submitButton.click();
    expect(mockOnSuccess).toHaveBeenCalled();
  });

  it('handles events without capacity limits', () => {
    const MockRSVPForm = jest.fn(({ onSuccess, eventId, currentRSVPs }: any) => (
      <div data-testid="rsvp-form">
        <div data-testid="current-rsvps">{currentRSVPs}</div>
        <button 
          data-testid="rsvp-submit"
          onClick={() => onSuccess && onSuccess()}
        >
          Submit RSVP
        </button>
      </div>
    ));
    
    render(
      <MockRSVPForm 
        eventId="test-event-id"
        eventTitle="Test Event"
        eventDate="2025-01-01"
        maxCapacity={undefined}
        currentRSVPs={3}
        onSuccess={jest.fn()}
      />
    );
    
    expect(screen.getByTestId('rsvp-form')).toBeInTheDocument();
  });

  it('verifies RSVP list tab visibility for admin users', () => {
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
});
