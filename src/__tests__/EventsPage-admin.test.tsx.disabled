import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import EventsPage from '../pages/EventsPage';
import { useAdmin } from '../contexts/AdminContext';

// Mock the AdminContext
jest.mock('../contexts/AdminContext', () => ({
  useAdmin: jest.fn()
}));

// Mock Firebase Functions
jest.mock('firebase/functions', () => ({
  getFunctions: jest.fn(() => ({})),
  httpsCallable: jest.fn(() => jest.fn().mockResolvedValue({
    data: {
      success: true,
      rsvpCount: 5
    }
  }))
}));

// Mock Firebase Firestore
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  getDocs: jest.fn(() => Promise.resolve({
    docs: [
      {
        id: 'event1',
        data: () => ({
          title: 'Test Event',
          startDate: { toDate: () => new Date('2025-02-01') },
          startTime: '10:00',
          endTime: '12:00',
          locationName: 'Test Location',
          address: '123 Test St',
          category: 'pack-wide',
          denTags: ['Wolves'],
          maxCapacity: 20,
          description: 'Test description',
          packingList: ['Item 1'],
          fees: 10,
          contactEmail: 'test@test.com',
          isOvernight: false,
          requiresPermission: false,
          attachments: []
        })
      }
    ]
  }))
}));

// Mock Firebase config
jest.mock('../firebase/config', () => ({
  db: {}
}));

// Mock analytics
jest.mock('../services/analytics', () => ({
  analytics: {
    trackEvent: jest.fn(),
    trackRSVPSubmission: jest.fn(),
    trackError: jest.fn()
  }
}));

// Mock RSVPListViewer component
jest.mock('../components/Admin/RSVPListViewer', () => {
  return function MockRSVPListViewer({ onClose }: { onClose: () => void }) {
    return (
      <div data-testid="rsvp-list-viewer">
        <button onClick={onClose}>Close RSVP Viewer</button>
      </div>
    );
  };
});

const mockAdminContext = {
  state: {
    currentUser: {
      uid: 'admin123',
      email: 'admin@test.com',
      isAdmin: true,
      role: 'admin'
    },
    isLoading: false
  },
  hasRole: jest.fn(),
  hasAnyPermission: jest.fn(),
  hasPermission: jest.fn()
};

const mockNonAdminContext = {
  state: {
    currentUser: {
      uid: 'user123',
      email: 'user@test.com',
      isAdmin: false,
      role: 'parent'
    },
    isLoading: false
  },
  hasRole: jest.fn(),
  hasAnyPermission: jest.fn(),
  hasPermission: jest.fn()
};

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn(),
}));

describe('EventsPage Admin Functionality', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows RSVP viewer button for admin users', async () => {
    (useAdmin as jest.Mock).mockReturnValue(mockAdminContext);
    mockAdminContext.hasRole.mockReturnValue(false);
    mockAdminContext.hasRole.mockReturnValueOnce(true); // For root role

    render(<EventsPage />);

    await waitFor(() => {
      expect(screen.getByText('View RSVPs')).toBeInTheDocument();
    });
  });

  it('hides RSVP viewer button for non-admin users', async () => {
    (useAdmin as jest.Mock).mockReturnValue(mockNonAdminContext);
    mockNonAdminContext.hasRole.mockReturnValue(false);

    render(<EventsPage />);

    await waitFor(() => {
      expect(screen.queryByText('View RSVPs')).not.toBeInTheDocument();
    });
  });

  it('opens RSVP viewer modal when admin clicks View RSVPs', async () => {
    (useAdmin as jest.Mock).mockReturnValue(mockAdminContext);
    mockAdminContext.hasRole.mockReturnValue(false);
    mockAdminContext.hasRole.mockReturnValueOnce(true); // For root role

    render(<EventsPage />);

    await waitFor(() => {
      const viewRSVPButton = screen.getByText('View RSVPs');
      fireEvent.click(viewRSVPButton);
    });

    await waitFor(() => {
      expect(screen.getByTestId('rsvp-list-viewer')).toBeInTheDocument();
    });
  });

  it('closes RSVP viewer modal when close is clicked', async () => {
    (useAdmin as jest.Mock).mockReturnValue(mockAdminContext);
    mockAdminContext.hasRole.mockReturnValue(false);
    mockAdminContext.hasRole.mockReturnValueOnce(true); // For root role

    render(<EventsPage />);

    // Open the modal
    await waitFor(() => {
      const viewRSVPButton = screen.getByText('View RSVPs');
      fireEvent.click(viewRSVPButton);
    });

    // Close the modal
    await waitFor(() => {
      const closeButton = screen.getByText('Close RSVP Viewer');
      fireEvent.click(closeButton);
    });

    await waitFor(() => {
      expect(screen.queryByTestId('rsvp-list-viewer')).not.toBeInTheDocument();
    });
  });

  it('passes correct event data to RSVPListViewer', async () => {
    (useAdmin as jest.Mock).mockReturnValue(mockAdminContext);
    mockAdminContext.hasRole.mockReturnValue(false);
    mockAdminContext.hasRole.mockReturnValueOnce(true); // For root role

    render(<EventsPage />);

    await waitFor(() => {
      const viewRSVPButton = screen.getByText('View RSVPs');
      fireEvent.click(viewRSVPButton);
    });

    await waitFor(() => {
      expect(screen.getByTestId('rsvp-list-viewer')).toBeInTheDocument();
    });
  });

  it('checks admin permissions correctly', async () => {
    (useAdmin as jest.Mock).mockReturnValue(mockAdminContext);
    mockAdminContext.hasRole.mockImplementation((role) => {
      if (role === 'root') return true;
      if (role === 'super-admin') return false;
      return false;
    });

    render(<EventsPage />);

    expect(mockAdminContext.hasRole).toHaveBeenCalledWith('root');
    expect(mockAdminContext.hasRole).toHaveBeenCalledWith('super-admin');
  });

  it('handles admin context loading state', async () => {
    const loadingContext = {
      ...mockAdminContext,
      state: {
        ...mockAdminContext.state,
        isLoading: true
      }
    };
    (useAdmin as jest.Mock).mockReturnValue(loadingContext);

    render(<EventsPage />);

    // Should not show admin buttons while loading
    expect(screen.queryByText('View RSVPs')).not.toBeInTheDocument();
  });

  it('handles no admin user state', async () => {
    const noUserContext = {
      ...mockAdminContext,
      state: {
        currentUser: null,
        isLoading: false
      }
    };
    (useAdmin as jest.Mock).mockReturnValue(noUserContext);

    render(<EventsPage />);

    // Should not show admin buttons when no user
    expect(screen.queryByText('View RSVPs')).not.toBeInTheDocument();
  });
});
