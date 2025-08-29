import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import RSVPForm from '../RSVPForm';

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

describe('RSVPForm - Simple Tests', () => {
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

  it('should show at least one attendee field by default', () => {
    render(<RSVPForm {...defaultProps} />);

    expect(screen.getByText('Attendee 1')).toBeInTheDocument();
    // Check that we have input fields for the first attendee
    expect(screen.getByPlaceholderText('Attendee name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Age')).toBeInTheDocument();
  });

  it('should show submit button', () => {
    render(<RSVPForm {...defaultProps} />);

    expect(screen.getByText('Submit RSVP')).toBeInTheDocument();
  });

  it('should show add attendee button', () => {
    render(<RSVPForm {...defaultProps} />);

    expect(screen.getByText('+ Add Attendee')).toBeInTheDocument();
  });

  it('should display correct event details in header', () => {
    render(<RSVPForm {...defaultProps} />);

    // Check header information
    expect(screen.getByText('RSVP for Event')).toBeInTheDocument();
    expect(screen.getByText('Pack 1703 Fall Campout')).toBeInTheDocument();
    expect(screen.getByText('27 spots remaining')).toBeInTheDocument();
  });

  it('should have proper form structure', () => {
    render(<RSVPForm {...defaultProps} />);

    // Check that we have a form element (by looking for the submit button)
    expect(screen.getByText('Submit RSVP')).toBeInTheDocument();

    // Check required field indicators
    expect(screen.getByText('Family Name *')).toBeInTheDocument();
    expect(screen.getByText('Email Address *')).toBeInTheDocument();
  });
});
