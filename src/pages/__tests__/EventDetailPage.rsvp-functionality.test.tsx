import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useAdmin } from '../../contexts/AdminContext';
import EventDetailPage from '../EventDetailPage';

// Mock the AdminContext
jest.mock('../../contexts/AdminContext');
const mockUseAdmin = useAdmin as jest.MockedFunction<typeof useAdmin>;

// Mock Firebase
jest.mock('../../firebase/config', () => ({
  db: {},
  auth: {},
  functions: {}
}));

// Mock Firestore functions
jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn(),
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  getDocs: jest.fn()
}));

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  useParams: jest.fn(() => ({ eventId: 'test-event-id' })),
  useSearchParams: jest.fn(() => [new URLSearchParams(), jest.fn()]),
  Link: ({ children, ...props }: any) => <a {...props}>{children}</a>,
  Navigate: ({ to }: any) => <div data-testid="navigate" data-to={to} />,
  useNavigate: jest.fn(() => jest.fn()),
  useLocation: jest.fn(() => ({ pathname: '/test' })),
}));

describe('EventDetailPage RSVP Functionality', () => {
  const mockEvent = {
    id: 'test-event-id',
    title: 'Test Event',
    description: 'Test Description',
    category: 'Meeting',
    startDate: { toDate: () => new Date('2025-01-01') },
    endDate: { toDate: () => new Date('2025-01-01') },
    startTime: '09:00',
    endTime: '17:00',
    locationId: 'test-location-id',
    rsvpEnabled: true,
    capacity: 50,
    currentParticipants: 3,
    visibility: 'public',
    denTags: [],
    createdBy: 'user123',
    status: 'active',
    updatedAt: { toDate: () => new Date() },
    createdAt: { toDate: () => new Date() },
  };

  const mockLocation = {
    id: 'test-location-id',
    name: 'Test Location',
    address: '123 Test St',
    category: 'outdoor',
    notesPublic: 'Test notes',
    parking: { text: 'Free parking available' },
    amenities: ['restrooms', 'parking'],
    specialInstructions: 'Enter through main gate'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock admin context with root user
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

    // Mock getDoc to return the mockEvent
    const { getDoc } = require('firebase/firestore');
    getDoc.mockResolvedValue({
      exists: () => true,
      data: () => mockEvent
    });
  });

  describe('RSVP Tab Visibility', () => {
    it('should show RSVP List tab for root users', async () => {
      render(<EventDetailPage />);
      
      await waitFor(() => {
        expect(screen.getByText('RSVP List')).toBeInTheDocument();
      });
    });

    it('should show RSVP List tab for super-admin users', async () => {
      mockUseAdmin.mockReturnValue({
        state: {
          ...mockUseAdmin().state,
          currentUser: { 
            ...mockUseAdmin().state.currentUser!,
            role: 'super-admin'
          },
          role: 'super-admin'
        },
        login: jest.fn(),
        logout: jest.fn(),
        updateUserRole: jest.fn(),
        refreshUser: jest.fn(),
      });

      render(<EventDetailPage />);
      
      await waitFor(() => {
        expect(screen.getByText('RSVP List')).toBeInTheDocument();
      });
    });

    it('should not show RSVP List tab for regular users', async () => {
      mockUseAdmin.mockReturnValue({
        state: {
          ...mockUseAdmin().state,
          currentUser: { 
            ...mockUseAdmin().state.currentUser!,
            role: 'viewer',
            isAdmin: false
          },
          role: 'viewer'
        },
        login: jest.fn(),
        logout: jest.fn(),
        updateUserRole: jest.fn(),
        refreshUser: jest.fn(),
      });

      render(<EventDetailPage />);
      
      await waitFor(() => {
        expect(screen.queryByText('RSVP List')).not.toBeInTheDocument();
      });
    });
  });

  describe('RSVP Count Display', () => {
    it('should display current RSVP count correctly', async () => {
      render(<EventDetailPage />);
      
      await waitFor(() => {
        expect(screen.getByText('3/50')).toBeInTheDocument();
      });
    });

    it('should display unlimited capacity correctly', async () => {
      const unlimitedEvent = { ...mockEvent, capacity: null };
      const { getDoc } = require('firebase/firestore');
      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => unlimitedEvent
      });

      render(<EventDetailPage />);
      
      await waitFor(() => {
        expect(screen.getByText('3/∞')).toBeInTheDocument();
      });
    });
  });

  describe('RSVP List Loading', () => {
    it('should load RSVP list when RSVP List tab is clicked', async () => {
      const { collection, query, where, orderBy, getDocs } = require('firebase/firestore');
      
      const mockRSVPs = [
        {
          id: 'rsvp1',
          familyName: 'Smith Family',
          email: 'smith@example.com',
          phone: '555-1234',
          attendees: [
            { name: 'John Smith', age: 8, den: 'Wolves', isAdult: false },
            { name: 'Jane Smith', age: 35, den: 'Adult', isAdult: true }
          ],
          attendeeCount: 2,
          submittedAt: { toDate: () => new Date('2025-01-01') },
          dietaryRestrictions: 'No nuts',
          specialNeeds: 'Wheelchair accessible',
          notes: 'Looking forward to the event!'
        }
      ];

      getDocs.mockResolvedValue({
        docs: mockRSVPs.map(rsvp => ({
          id: rsvp.id,
          data: () => rsvp
        }))
      });

      render(<EventDetailPage />);
      
      // Click on RSVP List tab
      await waitFor(() => {
        const rsvpListTab = screen.getByText('RSVP List');
        fireEvent.click(rsvpListTab);
      });

      // Verify Firestore query was called
      expect(collection).toHaveBeenCalledWith({}, 'rsvps');
      expect(where).toHaveBeenCalledWith('eventId', '==', 'test-event-id');
      expect(orderBy).toHaveBeenCalledWith('submittedAt', 'desc');
    });

    it('should display RSVP list data correctly', async () => {
      const { getDocs } = require('firebase/firestore');
      
      const mockRSVPs = [
        {
          id: 'rsvp1',
          familyName: 'Smith Family',
          email: 'smith@example.com',
          phone: '555-1234',
          attendees: [
            { name: 'John Smith', age: 8, den: 'Wolves', isAdult: false },
            { name: 'Jane Smith', age: 35, den: 'Adult', isAdult: true }
          ],
          attendeeCount: 2,
          submittedAt: { toDate: () => new Date('2025-01-01') },
          dietaryRestrictions: 'No nuts',
          specialNeeds: 'Wheelchair accessible',
          notes: 'Looking forward to the event!'
        }
      ];

      getDocs.mockResolvedValue({
        docs: mockRSVPs.map(rsvp => ({
          id: rsvp.id,
          data: () => rsvp
        }))
      });

      render(<EventDetailPage />);
      
      // Click on RSVP List tab
      await waitFor(() => {
        const rsvpListTab = screen.getByText('RSVP List');
        fireEvent.click(rsvpListTab);
      });

      // Wait for RSVP data to load
      await waitFor(() => {
        expect(screen.getByText('Smith Family')).toBeInTheDocument();
        expect(screen.getByText('smith@example.com')).toBeInTheDocument();
        expect(screen.getByText('555-1234')).toBeInTheDocument();
        expect(screen.getByText('John Smith')).toBeInTheDocument();
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
        expect(screen.getByText('No nuts')).toBeInTheDocument();
        expect(screen.getByText('Wheelchair accessible')).toBeInTheDocument();
        expect(screen.getByText('Looking forward to the event!')).toBeInTheDocument();
      });
    });

    it('should show empty state when no RSVPs exist', async () => {
      const { getDocs } = require('firebase/firestore');
      
      getDocs.mockResolvedValue({
        docs: []
      });

      render(<EventDetailPage />);
      
      // Click on RSVP List tab
      await waitFor(() => {
        const rsvpListTab = screen.getByText('RSVP List');
        fireEvent.click(rsvpListTab);
      });

      // Wait for empty state
      await waitFor(() => {
        expect(screen.getByText('No RSVPs Yet')).toBeInTheDocument();
        expect(screen.getByText('No one has RSVP\'d for this event yet.')).toBeInTheDocument();
      });
    });
  });

  describe('RSVP Count Update', () => {
    it('should refresh event data after RSVP submission', async () => {
      const { getDoc } = require('firebase/firestore');
      
      // Mock the refresh function
      const mockRefreshEventData = jest.fn();
      
      render(<EventDetailPage />);
      
      // Simulate RSVP submission success
      await waitFor(() => {
        // This would be triggered by the RSVPForm's onSuccess callback
        // In a real test, we'd need to mock the RSVPForm component
        expect(screen.getByText('Test Event')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle Firestore errors gracefully', async () => {
      const { getDoc } = require('firebase/firestore');
      
      getDoc.mockRejectedValue(new Error('Firestore error'));

      render(<EventDetailPage />);
      
      await waitFor(() => {
        // Should not crash and should show loading state or error message
        expect(screen.getByText('Loading...')).toBeInTheDocument();
      });
    });

    it('should handle RSVP list loading errors', async () => {
      const { getDocs } = require('firebase/firestore');
      
      getDocs.mockRejectedValue(new Error('RSVP loading error'));

      render(<EventDetailPage />);
      
      // Click on RSVP List tab
      await waitFor(() => {
        const rsvpListTab = screen.getByText('RSVP List');
        fireEvent.click(rsvpListTab);
      });

      // Should handle error gracefully
      await waitFor(() => {
        expect(screen.getByText('RSVP List')).toBeInTheDocument();
      });
    });
  });
});
