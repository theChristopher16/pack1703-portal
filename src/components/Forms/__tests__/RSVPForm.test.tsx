import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import RSVPForm from '../RSVPForm';
import { firestoreService } from '../../../services/firestore';
import { useAnalytics } from '../../../hooks/useAnalytics';
import { formValidator } from '../../../services/security';
import { useAdmin } from '../../../contexts/AdminContext';

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  useLocation: () => ({ pathname: '/test', search: '' }),
}));

// Mock dependencies
jest.mock('../../../services/firestore');
jest.mock('../../../hooks/useAnalytics');
jest.mock('../../../services/security');
jest.mock('../../../contexts/AdminContext');

const mockFirestoreService = firestoreService as jest.Mocked<typeof firestoreService>;
const mockUseAnalytics = useAnalytics as jest.MockedFunction<typeof useAnalytics>;
const mockFormValidator = formValidator as jest.Mocked<typeof formValidator>;
const mockUseAdmin = useAdmin as jest.MockedFunction<typeof useAdmin>;

// Mock analytics
const mockAnalytics = {
  trackFeatureClick: jest.fn(),
  trackRSVPSubmission: jest.fn(),
};

// Mock admin context
const mockAdminContext = {
  isAdmin: false,
  permissions: [],
  user: null,
};

// Mock form validator
const mockValidationResult = {
  isValid: true,
  data: {
    eventId: 'test-event-id',
    familyName: 'Test Family',
    email: 'test@example.com',
    phone: '1234567890',
    attendees: [
      {
        name: 'Test Child',
        age: 8,
        den: 'Wolf',
        isAdult: false,
      },
    ],
    dietaryRestrictions: '',
    specialNeeds: '',
    notes: '',
    ipHash: 'test-hash',
    userAgent: 'test-user-agent',
    timestamp: new Date(),
  },
};

// Mock RSVP submission result
const mockRSVPResult = {
  data: {
    success: true,
    rsvpId: 'test-rsvp-id',
    newRSVPCount: 1,
    message: 'RSVP submitted successfully',
  },
};

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div>{children}</div>
);

describe('RSVPForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mocks
    mockUseAnalytics.mockReturnValue(mockAnalytics);
    mockUseAdmin.mockReturnValue(mockAdminContext);
    mockFormValidator.validateRSVPForm.mockResolvedValue(mockValidationResult);
    mockFirestoreService.submitRSVP.mockResolvedValue(mockRSVPResult);
  });

  const defaultProps = {
    eventId: 'test-event-id',
    eventTitle: 'Test Event',
    eventDate: '2024-12-31',
    maxCapacity: 50,
    currentRSVPs: 0,
  };

  it('renders RSVP form with all required fields', () => {
    render(
      <TestWrapper>
        <RSVPForm {...defaultProps} />
      </TestWrapper>
    );

    expect(screen.getByText('RSVP for Test Event')).toBeInTheDocument();
    expect(screen.getByLabelText(/family name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/phone/i)).toBeInTheDocument();
    expect(screen.getByText('Add Attendee')).toBeInTheDocument();
  });

  it('successfully submits RSVP with valid data', async () => {
    render(
      <TestWrapper>
        <RSVPForm {...defaultProps} />
      </TestWrapper>
    );

    // Fill out the form
    fireEvent.change(screen.getByLabelText(/family name/i), {
      target: { value: 'Test Family' },
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/phone/i), {
      target: { value: '1234567890' },
    });

    // Add an attendee
    fireEvent.click(screen.getByText('Add Attendee'));
    
    await waitFor(() => {
      const attendeeNameInput = screen.getByLabelText(/attendee name/i);
      fireEvent.change(attendeeNameInput, { target: { value: 'Test Child' } });
    });

    const ageInput = screen.getByLabelText(/age/i);
    fireEvent.change(ageInput, { target: { value: '8' } });

    const denSelect = screen.getByLabelText(/den/i);
    fireEvent.change(denSelect, { target: { value: 'Wolf' } });

    // Submit the form
    const submitButton = screen.getByRole('button', { name: /submit rsvp/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockFormValidator.validateRSVPForm).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(mockFirestoreService.submitRSVP).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(screen.getByText(/rsvp submitted successfully/i)).toBeInTheDocument();
    });
  });

  it('handles validation errors gracefully', async () => {
    const validationError = {
      isValid: false,
      errors: ['Email is required', 'Family name is too short'],
    };

    mockFormValidator.validateRSVPForm.mockResolvedValue(validationError);

    render(
      <TestWrapper>
        <RSVPForm {...defaultProps} />
      </TestWrapper>
    );

    // Fill out form with invalid data
    fireEvent.change(screen.getByLabelText(/family name/i), {
      target: { value: 'A' }, // Too short
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'invalid-email' }, // Invalid email
    });

    // Add an attendee
    fireEvent.click(screen.getByText('Add Attendee'));
    
    await waitFor(() => {
      const attendeeNameInput = screen.getByLabelText(/attendee name/i);
      fireEvent.change(attendeeNameInput, { target: { value: 'Test Child' } });
    });

    const ageInput = screen.getByLabelText(/age/i);
    fireEvent.change(ageInput, { target: { value: '8' } });

    const submitButton = screen.getByRole('button', { name: /submit rsvp/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/email is required, family name is too short/i)).toBeInTheDocument();
    });
  });

  it('handles Cloud Function errors', async () => {
    const cloudFunctionError = new Error('Cloud Function failed');
    mockFirestoreService.submitRSVP.mockRejectedValue(cloudFunctionError);

    render(
      <TestWrapper>
        <RSVPForm {...defaultProps} />
      </TestWrapper>
    );

    // Fill out the form
    fireEvent.change(screen.getByLabelText(/family name/i), {
      target: { value: 'Test Family' },
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' },
    });

    // Add an attendee
    fireEvent.click(screen.getByText('Add Attendee'));
    
    await waitFor(() => {
      const attendeeNameInput = screen.getByLabelText(/attendee name/i);
      fireEvent.change(attendeeNameInput, { target: { value: 'Test Child' } });
    });

    const ageInput = screen.getByLabelText(/age/i);
    fireEvent.change(ageInput, { target: { value: '8' } });

    const submitButton = screen.getByRole('button', { name: /submit rsvp/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/failed to submit rsvp/i)).toBeInTheDocument();
    });
  });
});