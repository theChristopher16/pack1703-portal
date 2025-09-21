import React from 'react';
import { render, screen } from '@testing-library/react';
import RSVPForm from '../RSVPForm';

// Mock the useAnalytics hook
jest.mock('../../../hooks/useAnalytics', () => ({
  useAnalytics: () => ({
    trackEvent: jest.fn(),
    trackPageView: jest.fn(),
  }),
}));

// Mock AdminContext with a mock user
const mockAdminContext = {
  state: {
    currentUser: {
      uid: 'test-user-id',
      email: 'test@example.com',
      displayName: 'Test User',
      isAdmin: false,
      role: 'parent'
    },
    isLoading: false,
    error: null
  },
  dispatch: jest.fn()
};

// Mock the AdminProvider
jest.mock('../../../contexts/AdminContext', () => ({
  AdminProvider: ({ children }: { children: React.ReactNode }) => children,
  useAdmin: () => mockAdminContext
}));

// Helper function to render with AdminProvider
const renderWithAdminProvider = (component: React.ReactElement) => {
  return render(component);
};

describe('RSVPForm Simple Tests', () => {
  it('renders without crashing', () => {
    renderWithAdminProvider(<RSVPForm eventId="test-event" eventTitle="Test Event" eventDate="2025-10-15" maxCapacity={50} currentRSVPs={0} />);
    expect(screen.getByText('RSVP for Event')).toBeInTheDocument();
  });

  it('displays form fields correctly', () => {
    renderWithAdminProvider(<RSVPForm eventId="test-event" eventTitle="Test Event" eventDate="2025-10-15" maxCapacity={50} currentRSVPs={0} />);
    
    expect(screen.getByLabelText(/family name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument();
    expect(screen.getByText('Attendees')).toBeInTheDocument();
  });

  it('shows remaining capacity', () => {
    renderWithAdminProvider(<RSVPForm eventId="test-event" eventTitle="Test Event" eventDate="2025-10-15" maxCapacity={50} currentRSVPs={10} />);
    
    expect(screen.getByText(/40 spots remaining/i)).toBeInTheDocument();
  });
});
