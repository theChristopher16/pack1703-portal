import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RSVPForm from '../RSVPForm';
import { submitRSVP } from '../../../services/firestore';

// Mock the firestore service
jest.mock('../../../services/firestore', () => ({
  submitRSVP: jest.fn(),
}));

// Mock the useAnalytics hook
jest.mock('../../../hooks/useAnalytics', () => ({
  useAnalytics: () => ({
    trackEvent: jest.fn(),
    trackPageView: jest.fn(),
  }),
}));

describe('RSVPForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<RSVPForm eventId="test-event" eventTitle="Test Event" eventDate="2025-10-15" maxCapacity={50} currentRSVPs={0} />);
    expect(screen.getByText('RSVP for Event')).toBeInTheDocument();
  });

  it('displays form fields correctly', () => {
    render(<RSVPForm eventId="test-event" eventTitle="Test Event" eventDate="2025-10-15" maxCapacity={50} currentRSVPs={0} />);
    
    expect(screen.getByLabelText(/family name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument();
    expect(screen.getByText('Attendees')).toBeInTheDocument();
  });

  it('shows remaining capacity', () => {
    render(<RSVPForm eventId="test-event" eventTitle="Test Event" eventDate="2025-10-15" maxCapacity={50} currentRSVPs={10} />);
    
    expect(screen.getByText(/40 spots remaining/i)).toBeInTheDocument();
  });
});
