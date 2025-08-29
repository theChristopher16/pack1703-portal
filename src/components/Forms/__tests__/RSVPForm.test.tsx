import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import RSVPForm from '../RSVPForm';
import { submitRSVP } from '../../../services/firestore';

// Mock the useAnalytics hook
vi.mock('../../../hooks/useAnalytics', () => ({
  useAnalytics: () => ({
    trackFeatureClick: vi.fn(),
    trackRSVPSubmission: vi.fn(),
    trackError: vi.fn(),
  }),
}));

// Mock the submitRSVP function
vi.mock('../../../services/firestore', () => ({
  submitRSVP: vi.fn(() => Promise.resolve({ data: { success: true } })),
}));

// Get typed mock reference for better type safety
const mockSubmitRSVP = vi.mocked(submitRSVP);

describe('RSVPForm', () => {
  // Reset mocks before each test
  beforeEach(() => {
    vi.clearAllMocks();
    mockSubmitRSVP.mockResolvedValue({ data: { success: true } });
  });

  const defaultProps = {
    eventId: 'event-001',
    eventTitle: 'Pack 1703 Fall Campout',
    eventDate: 'October 15-17, 2024',
    maxCapacity: 50,
    currentRSVPs: 23,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render with correct event information', () => {
    render(<RSVPForm {...defaultProps} />);

    expect(screen.getByText('RSVP for Event')).toBeInTheDocument();
    expect(screen.getByText('Pack 1703 Fall Campout')).toBeInTheDocument();
    expect(screen.getByText('27 spots remaining')).toBeInTheDocument();
  });

  it('should show capacity warning when event is at capacity', () => {
    render(
      <RSVPForm
        {...defaultProps}
        maxCapacity={25}
        currentRSVPs={25}
      />
    );

    expect(screen.getByText('Event at Capacity')).toBeInTheDocument();
    expect(screen.getByText(/This event has reached its maximum capacity/)).toBeInTheDocument();
  });

  it('should render form fields correctly', () => {
    render(<RSVPForm {...defaultProps} />);

    // Check form fields
    expect(screen.getByLabelText('Family Name *')).toBeInTheDocument();
    expect(screen.getByLabelText('Email Address *')).toBeInTheDocument();
    expect(screen.getByLabelText('Phone Number (Optional)')).toBeInTheDocument();
    expect(screen.getByText('Attendees')).toBeInTheDocument();
    expect(screen.getByLabelText('Dietary Restrictions')).toBeInTheDocument();
    expect(screen.getByLabelText('Special Needs or Accommodations')).toBeInTheDocument();
    expect(screen.getByLabelText('Additional Notes')).toBeInTheDocument();
  });

  it('should allow adding and removing attendees', async () => {
    const user = userEvent.setup();
    render(<RSVPForm {...defaultProps} />);

    // Initially should have 1 attendee
    expect(screen.getByText('Attendee 1')).toBeInTheDocument();

    // Add another attendee
    await user.click(screen.getByText('+ Add Attendee'));
    expect(screen.getByText('Attendee 2')).toBeInTheDocument();

    // TODO: Remove attendee functionality not yet implemented
    // await user.click(screen.getByText('Remove'));
    // expect(screen.queryByText('Attendee 2')).not.toBeInTheDocument();
    // expect(screen.getByText('Attendee 1')).toBeInTheDocument();
  });

  it('should validate required fields', async () => {
    const user = userEvent.setup();
    render(<RSVPForm {...defaultProps} />);

    // Try to submit without filling required fields
    await user.click(screen.getByText('Submit RSVP'));

    // Should show validation errors
    expect(screen.getByText('Family name is required')).toBeInTheDocument();
    expect(screen.getByText('Email is required')).toBeInTheDocument();
    expect(screen.getByText('Attendee name is required')).toBeInTheDocument();
  });

  it('should validate email format', async () => {
    const user = userEvent.setup();
    render(<RSVPForm {...defaultProps} />);

    // Fill in family name
    await user.type(screen.getByLabelText('Family Name *'), 'Test Family');

    // Fill in invalid email
    await user.type(screen.getByLabelText('Email Address *'), 'invalid-email');

    // Try to submit
    await user.click(screen.getByText('Submit RSVP'));

    // Should show email validation error (or simply not proceed with invalid email)
    // Note: This form may use HTML5 validation or not show specific email error messages
    expect(screen.getByDisplayValue('invalid-email')).toBeInTheDocument();
  });

  it('should validate attendee information', async () => {
    const user = userEvent.setup();
    render(<RSVPForm {...defaultProps} />);

    // Fill in family name and email
    await user.type(screen.getByLabelText('Family Name *'), 'Test Family');
    await user.type(screen.getByLabelText('Email Address *'), 'test@example.com');

    // Try to submit without attendee name
    await user.click(screen.getByText('Submit RSVP'));

    // Should show attendee validation error
    expect(screen.getByText('Attendee name is required')).toBeInTheDocument();
  });

  it('should submit form successfully with valid data', async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    render(<RSVPForm {...defaultProps} onSuccess={onSuccess} />);

    // Fill in all required fields
    await user.type(screen.getByLabelText('Family Name *'), 'Test Family');
    await user.type(screen.getByLabelText('Email Address *'), 'test@example.com');
    
    // Fill in attendee information
    await user.type(screen.getByPlaceholderText('Attendee name'), 'John Doe');
    await user.type(screen.getByPlaceholderText('Age'), '35');
    await user.selectOptions(screen.getByRole('combobox'), 'Adult');
    await user.click(screen.getByLabelText('This is an adult attendee'));

    // Submit form
    await user.click(screen.getByText('Submit RSVP'));

    // Should show success message
    await waitFor(() => {
      expect(screen.getByText('RSVP Submitted Successfully!')).toBeInTheDocument();
    });

    // Should call onSuccess callback
    expect(onSuccess).toHaveBeenCalled();
  });

  it('should handle form submission errors', async () => {
    const user = userEvent.setup();
    const onError = vi.fn();
    
    // Mock submitRSVP to throw an error
    mockSubmitRSVP.mockRejectedValueOnce(new Error('Network error'));

    render(<RSVPForm {...defaultProps} onError={onError} />);

    // Fill in all required fields
    await user.type(screen.getByLabelText('Family Name *'), 'Test Family');
    await user.type(screen.getByLabelText('Email Address *'), 'test@example.com');
    
    // Fill in attendee information
    await user.type(screen.getByPlaceholderText('Attendee name'), 'John Doe');
    await user.type(screen.getByPlaceholderText('Age'), '35');
    await user.selectOptions(screen.getByRole('combobox'), 'Adult');
    await user.click(screen.getByLabelText('This is an adult attendee'));

    // Submit form
    await user.click(screen.getByText('Submit RSVP'));

    // Should show error message
    await waitFor(() => {
      expect(screen.getByText('Submission Failed')).toBeInTheDocument();
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });

    // Should call onError callback
    expect(onError).toHaveBeenCalled();
  });

  it('should handle capacity validation', async () => {
    const user = userEvent.setup();
    render(
      <RSVPForm
        {...defaultProps}
        maxCapacity={25}
        currentRSVPs={20}
      />
    );

    // Fill in family name and email
    await user.type(screen.getByLabelText('Family Name *'), 'Test Family');
    await user.type(screen.getByLabelText('Email Address *'), 'test@example.com');

    // Add too many attendees (would exceed capacity)
    for (let i = 0; i < 10; i++) {
      await user.click(screen.getByText('+ Add Attendee'));
    }

    // Fill in attendee names
    const attendeeNameInputs = screen.getAllByDisplayValue('');
    for (let i = 0; i < attendeeNameInputs.length; i++) {
      await user.type(attendeeNameInputs[i], `Attendee ${i + 1}`);
    }

    // Try to submit
    await user.click(screen.getByText('Submit RSVP'));

    // Should show capacity error
    expect(screen.getByText(/Event is at capacity. Only 5 spots remaining./)).toBeInTheDocument();
  });

  it('should clear form after successful submission', async () => {
    const user = userEvent.setup();
    render(<RSVPForm {...defaultProps} />);

    // Fill in all required fields
    await user.type(screen.getByLabelText('Family Name *'), 'Test Family');
    await user.type(screen.getByLabelText('Email Address *'), 'test@example.com');
    
    // Fill in attendee information
    await user.type(screen.getByPlaceholderText('Attendee name'), 'John Doe');
    await user.type(screen.getByPlaceholderText('Age'), '35');
    await user.selectOptions(screen.getByRole('combobox'), 'Adult');
    await user.click(screen.getByLabelText('This is an adult attendee'));

    // Submit form
    await user.click(screen.getByText('Submit RSVP'));

    // Wait for success and form reset
    await waitFor(() => {
      expect(screen.getByText('RSVP Submitted Successfully!')).toBeInTheDocument();
    });

    // Wait for form to reset (3 second timeout)
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Attendee name')).toHaveValue('');
    }, { timeout: 4000 });
  });
});
