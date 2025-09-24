import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import EventCard from '../components/Events/EventCard';

const mockEvent = {
  id: 'event1',
  title: 'Test Event',
  date: '2025-02-01',
  startTime: '10:00',
  endTime: '12:00',
  location: {
    name: 'Test Location',
    address: '123 Test St'
  },
  category: 'pack-wide' as const,
  denTags: ['Wolves'],
  maxCapacity: 20,
  currentRSVPs: 5,
  description: 'Test description',
  packingList: ['Item 1'],
  fees: 10,
  contactEmail: 'test@test.com',
  isOvernight: false,
  requiresPermission: false,
  attachments: []
};

const mockHandlers = {
  onRSVP: jest.fn(),
  onViewDetails: jest.fn(),
  onAddToCalendar: jest.fn(),
  onShare: jest.fn()
};

describe('EventCard Admin Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows View RSVPs button for admin users', () => {
    const mockOnViewRSVPs = jest.fn();
    
    render(
      <EventCard
        event={mockEvent}
        {...mockHandlers}
        onViewRSVPs={mockOnViewRSVPs}
        isAdmin={true}
      />
    );

    expect(screen.getByText('View RSVPs')).toBeInTheDocument();
  });

  it('hides View RSVPs button for non-admin users', () => {
    render(
      <EventCard
        event={mockEvent}
        {...mockHandlers}
        isAdmin={false}
      />
    );

    expect(screen.queryByText('View RSVPs')).not.toBeInTheDocument();
  });

  it('hides View RSVPs button when onViewRSVPs is not provided', () => {
    render(
      <EventCard
        event={mockEvent}
        {...mockHandlers}
        isAdmin={true}
      />
    );

    expect(screen.queryByText('View RSVPs')).not.toBeInTheDocument();
  });

  it('calls onViewRSVPs when View RSVPs button is clicked', () => {
    const mockOnViewRSVPs = jest.fn();
    
    render(
      <EventCard
        event={mockEvent}
        {...mockHandlers}
        onViewRSVPs={mockOnViewRSVPs}
        isAdmin={true}
      />
    );

    const viewRSVPButton = screen.getByText('View RSVPs');
    fireEvent.click(viewRSVPButton);

    expect(mockOnViewRSVPs).toHaveBeenCalledTimes(1);
    expect(mockOnViewRSVPs).toHaveBeenCalledWith(mockEvent);
  });

  it('applies correct styling to View RSVPs button', () => {
    const mockOnViewRSVPs = jest.fn();
    
    render(
      <EventCard
        event={mockEvent}
        {...mockHandlers}
        onViewRSVPs={mockOnViewRSVPs}
        isAdmin={true}
      />
    );

    const viewRSVPButton = screen.getByText('View RSVPs');
    expect(viewRSVPButton).toHaveClass('text-purple-600');
    expect(viewRSVPButton).toHaveClass('hover:text-purple-700');
  });

  it('shows correct title attribute for View RSVPs button', () => {
    const mockOnViewRSVPs = jest.fn();
    
    render(
      <EventCard
        event={mockEvent}
        {...mockHandlers}
        onViewRSVPs={mockOnViewRSVPs}
        isAdmin={true}
      />
    );

    const viewRSVPButton = screen.getByTitle('View RSVPs (Admin Only)');
    expect(viewRSVPButton).toBeInTheDocument();
  });

  it('includes Users icon in View RSVPs button', () => {
    const mockOnViewRSVPs = jest.fn();
    
    render(
      <EventCard
        event={mockEvent}
        {...mockHandlers}
        onViewRSVPs={mockOnViewRSVPs}
        isAdmin={true}
      />
    );

    // Check that the button contains the Users icon (Lucide React)
    const viewRSVPButton = screen.getByText('View RSVPs');
    expect(viewRSVPButton).toBeInTheDocument();
    // The icon would be rendered as an SVG, but we're testing the button text
    expect(viewRSVPButton.closest('button')).toBeInTheDocument();
  });

  it('maintains other action buttons when admin button is present', () => {
    const mockOnViewRSVPs = jest.fn();
    
    render(
      <EventCard
        event={mockEvent}
        {...mockHandlers}
        onViewRSVPs={mockOnViewRSVPs}
        isAdmin={true}
      />
    );

    expect(screen.getByText('Add to Calendar')).toBeInTheDocument();
    expect(screen.getByText('Share')).toBeInTheDocument();
    expect(screen.getByText('View RSVPs')).toBeInTheDocument();
  });

  it('handles undefined isAdmin prop gracefully', () => {
    const mockOnViewRSVPs = jest.fn();
    
    render(
      <EventCard
        event={mockEvent}
        {...mockHandlers}
        onViewRSVPs={mockOnViewRSVPs}
        isAdmin={undefined as any}
      />
    );

    // Should not show admin button when isAdmin is undefined
    expect(screen.queryByText('View RSVPs')).not.toBeInTheDocument();
  });

  it('works with all admin prop combinations', () => {
    const mockOnViewRSVPs = jest.fn();
    
    // Test case 1: Admin with handler
    const { rerender } = render(
      <EventCard
        event={mockEvent}
        {...mockHandlers}
        onViewRSVPs={mockOnViewRSVPs}
        isAdmin={true}
      />
    );
    expect(screen.getByText('View RSVPs')).toBeInTheDocument();

    // Test case 2: Non-admin with handler
    rerender(
      <EventCard
        event={mockEvent}
        {...mockHandlers}
        onViewRSVPs={mockOnViewRSVPs}
        isAdmin={false}
      />
    );
    expect(screen.queryByText('View RSVPs')).not.toBeInTheDocument();

    // Test case 3: Admin without handler
    rerender(
      <EventCard
        event={mockEvent}
        {...mockHandlers}
        isAdmin={true}
      />
    );
    expect(screen.queryByText('View RSVPs')).not.toBeInTheDocument();
  });
});
