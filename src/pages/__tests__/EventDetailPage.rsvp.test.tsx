import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import EventDetailPage from '../EventDetailPage';
import { useAdmin } from '../../../contexts/AdminContext';

// Mock the AdminContext
jest.mock('../../../contexts/AdminContext');
const mockUseAdmin = useAdmin as jest.MockedFunction<typeof useAdmin>;

// Mock Firebase
jest.mock('../../../firebase/config', () => ({
  db: {},
  auth: {},
  functions: {}
}));

// Mock Firestore
jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn(),
  collection: jest.fn(),
  query: jest.fn(),
  orderBy: jest.fn(),
  getDocs: jest.fn()
}));

// Mock RSVPForm
jest.mock('../../../components/Forms/RSVPForm', () => {
  return function MockRSVPForm({ onSuccess, eventId, currentRSVPs }: any) {
    return (
      <div data-testid="rsvp-form">
        <div data-testid="current-rsvps">{currentRSVPs}</div>
        <button 
          data-testid="submit-rsvp"
          onClick={() => onSuccess && onSuccess()}
        >
          Submit RSVP
        </button>
      </div>
    );
  };
});

// Mock React Router
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ eventId: 'test-event-id' }),
  useSearchParams: () => [new URLSearchParams(), jest.fn()],
  Link: ({ children, ...props }: any) => <a {...props}>{children}</a>
}));

describe('EventDetailPage RSVP Functionality', () => {
  const mockEvent = {
    id: 'test-event-id',
    title: 'Test Event',
    description: 'Test Description',
    category: 'Meeting',
    startDate: { toDate: () => new Date('2025-01-01') },
    endDate: { toDate: () => new Date('2025-01-01') },
    startTime: '10:00',
    endTime: '12:00',
    locationId: 'test-location-id',
    rsvpEnabled: true,
    capacity: 50,
    currentRSVPs: 10,
    denTags: ['Wolf', 'Bear']
  };

  const mockLocation = {
    id: 'test-location-id',
    name: 'Test Location',
    address: '123 Test St',
    notesPublic: 'Test notes'
  };

  beforeEach(() => {
    mockUseAdmin.mockReturnValue({
      state: {
        currentUser: {
          id: 'test-user-id',
          email: 'test@example.com',
          role: 'parent'
        },
        isLoading: false
      },
      dispatch: jest.fn()
    });

    // Mock Firestore responses
    const { doc, getDoc } = require('firebase/firestore');
    doc.mockImplementation((db: any, collection: string, id: string) => ({ id, collection }));
    getDoc.mockImplementation((ref: any) => {
      if (ref.collection === 'events') {
        return Promise.resolve({
          exists: () => true,
          data: () => mockEvent
        });
      }
      if (ref.collection === 'locations') {
        return Promise.resolve({
          exists: () => true,
          data: () => mockLocation
        });
      }
      return Promise.resolve({ exists: () => false });
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should display current RSVP count in event header', async () => {
    render(
      <BrowserRouter>
        <EventDetailPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('10/50 spots')).toBeInTheDocument();
    });
  });

  it('should display RSVP count in tab navigation', async () => {
    render(
      <BrowserRouter>
        <EventDetailPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      const rsvpTab = screen.getByText('RSVP');
      expect(rsvpTab).toBeInTheDocument();
      
      // Check for RSVP count badge in tab
      const rsvpCountBadge = screen.getByText('10/50');
      expect(rsvpCountBadge).toBeInTheDocument();
    });
  });

  it('should pass correct RSVP data to RSVPForm', async () => {
    render(
      <BrowserRouter>
        <EventDetailPage />
      </BrowserRouter>
    );

    // Click on RSVP tab
    await waitFor(() => {
      const rsvpTab = screen.getByText('RSVP');
      fireEvent.click(rsvpTab);
    });

    await waitFor(() => {
      const rsvpForm = screen.getByTestId('rsvp-form');
      expect(rsvpForm).toBeInTheDocument();
      
      const currentRSVPs = screen.getByTestId('current-rsvps');
      expect(currentRSVPs).toHaveTextContent('10');
    });
  });

  it('should refresh event data after successful RSVP submission', async () => {
    const { doc, getDoc } = require('firebase/firestore');
    
    render(
      <BrowserRouter>
        <EventDetailPage />
      </BrowserRouter>
    );

    // Click on RSVP tab
    await waitFor(() => {
      const rsvpTab = screen.getByText('RSVP');
      fireEvent.click(rsvpTab);
    });

    // Submit RSVP
    await waitFor(() => {
      const submitButton = screen.getByTestId('submit-rsvp');
      fireEvent.click(submitButton);
    });

    // Verify that getDoc was called again to refresh data
    await waitFor(() => {
      expect(getDoc).toHaveBeenCalledTimes(2); // Initial load + refresh
    });
  });

  it('should handle events without capacity limits', async () => {
    const eventWithoutCapacity = {
      ...mockEvent,
      capacity: null,
      currentRSVPs: 5
    };

    const { getDoc } = require('firebase/firestore');
    getDoc.mockImplementation((ref: any) => {
      if (ref.collection === 'events') {
        return Promise.resolve({
          exists: () => true,
          data: () => eventWithoutCapacity
        });
      }
      return Promise.resolve({ exists: () => false });
    });

    render(
      <BrowserRouter>
        <EventDetailPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      // Should show unlimited capacity
      expect(screen.getByText('5/∞ spots')).toBeInTheDocument();
    });
  });

  it('should handle events with RSVP disabled', async () => {
    const eventWithoutRSVP = {
      ...mockEvent,
      rsvpEnabled: false
    };

    const { getDoc } = require('firebase/firestore');
    getDoc.mockImplementation((ref: any) => {
      if (ref.collection === 'events') {
        return Promise.resolve({
          exists: () => true,
          data: () => eventWithoutRSVP
        });
      }
      return Promise.resolve({ exists: () => false });
    });

    render(
      <BrowserRouter>
        <EventDetailPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      // Should not show RSVP count badges
      expect(screen.queryByText(/spots/)).not.toBeInTheDocument();
    });
  });

  it('should display enhanced styling elements', async () => {
    render(
      <BrowserRouter>
        <EventDetailPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      // Check for enhanced styling elements
      const eventHeader = screen.getByText('Test Event').closest('div');
      expect(eventHeader).toHaveClass('bg-gradient-to-br');
      
      // Check for decorative elements
      const decorativeElements = eventHeader?.querySelectorAll('[class*="absolute"]');
      expect(decorativeElements?.length).toBeGreaterThan(0);
    });
  });

  it('should handle loading state gracefully', () => {
    const { getDoc } = require('firebase/firestore');
    getDoc.mockImplementation(() => new Promise(() => {})); // Never resolves

    render(
      <BrowserRouter>
        <EventDetailPage />
      </BrowserRouter>
    );

    expect(screen.getByText('Loading Event Details...')).toBeInTheDocument();
  });

  it('should handle event not found', async () => {
    const { getDoc } = require('firebase/firestore');
    getDoc.mockImplementation((ref: any) => {
      if (ref.collection === 'events') {
        return Promise.resolve({
          exists: () => false
        });
      }
      return Promise.resolve({ exists: () => false });
    });

    render(
      <BrowserRouter>
        <EventDetailPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Event Not Found')).toBeInTheDocument();
    });
  });
});
