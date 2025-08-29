import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import EventDetailPage from '../EventDetailPage';

// Mock the LoadingSpinner component
vi.mock('../../components/Loading', () => ({
  LoadingSpinner: ({ text }: { text: string }) => <div data-testid="loading-spinner">{text}</div>,
}));

// Mock the RSVPForm component
vi.mock('../../components/Forms/RSVPForm', () => ({
  default: ({ eventId, eventTitle, eventDate, maxCapacity, currentRSVPs }: any) => (
    <div data-testid="rsvp-form">
      <h3>RSVP Form</h3>
      <p>Event ID: {eventId}</p>
      <p>Event Title: {eventTitle}</p>
      <p>Event Date: {eventDate}</p>
      <p>Max Capacity: {maxCapacity}</p>
      <p>Current RSVPs: {currentRSVPs}</p>
    </div>
  ),
}));

// Wrapper component to provide router context
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    {children}
  </BrowserRouter>
);

describe('EventDetailPage', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
  });

  it('should render loading state initially', () => {
    render(
      <TestWrapper>
        <EventDetailPage />
      </TestWrapper>
    );

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    expect(screen.getByText('Loading Event Details...')).toBeInTheDocument();
  });

  it('should load event data for event-001', async () => {
    render(
      <TestWrapper>
        <EventDetailPage />
      </TestWrapper>
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    // Check that event data is loaded
    expect(screen.getByText('Pack 1703 Fall Campout')).toBeInTheDocument();
    expect(screen.getByText('Campout')).toBeInTheDocument();
    expect(screen.getByText('RSVP Open')).toBeInTheDocument();
  });

  it('should show RSVP form when tab is set to rsvp', async () => {
    // Mock useSearchParams to return tab=rsvp
    vi.mocked(require('react-router-dom').useSearchParams).mockReturnValue([
      new URLSearchParams('?tab=rsvp'),
      vi.fn()
    ]);

    render(
      <TestWrapper>
        <EventDetailPage />
      </TestWrapper>
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    // Check that RSVP form is displayed
    expect(screen.getByTestId('rsvp-form')).toBeInTheDocument();
    expect(screen.getByText('RSVP Form')).toBeInTheDocument();
  });

  it('should show event details when tab is set to details', async () => {
    // Mock useSearchParams to return tab=details (default)
    vi.mocked(require('react-router-dom').useSearchParams).mockReturnValue([
      new URLSearchParams('?tab=details'),
      vi.fn()
    ]);

    render(
      <TestWrapper>
        <EventDetailPage />
      </TestWrapper>
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    // Check that event details are displayed
    expect(screen.getByText('Pack 1703 Fall Campout')).toBeInTheDocument();
    expect(screen.getByText('Description')).toBeInTheDocument();
    expect(screen.getByText(/Join us for our annual fall campout/)).toBeInTheDocument();
  });

  it('should show map placeholder when tab is set to map', async () => {
    // Mock useSearchParams to return tab=map
    vi.mocked(require('react-router-dom').useSearchParams).mockReturnValue([
      new URLSearchParams('?tab=map'),
      vi.fn()
    ]);

    render(
      <TestWrapper>
        <EventDetailPage />
      </TestWrapper>
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    // Check that map placeholder is displayed
    expect(screen.getByText('Interactive Map')).toBeInTheDocument();
    expect(screen.getByText(/Map integration coming soon/)).toBeInTheDocument();
  });

  it('should handle navigation between tabs', async () => {
    const { rerender } = render(
      <TestWrapper>
        <EventDetailPage />
      </TestWrapper>
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    // Initially should show details tab
    expect(screen.getByText('Description')).toBeInTheDocument();

    // Mock useSearchParams to return tab=rsvp
    vi.mocked(require('react-router-dom').useSearchParams).mockReturnValue([
      new URLSearchParams('?tab=rsvp'),
      vi.fn()
    ]);

    // Re-render with new tab
    rerender(
      <TestWrapper>
        <EventDetailPage />
      </TestWrapper>
    );

    // Should now show RSVP form
    expect(screen.getByTestId('rsvp-form')).toBeInTheDocument();
  });

  it('should display correct event information for event-001', async () => {
    render(
      <TestWrapper>
        <EventDetailPage />
      </TestWrapper>
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    // Check event details
    expect(screen.getByText('Pack 1703 Fall Campout')).toBeInTheDocument();
    expect(screen.getByText('Campout')).toBeInTheDocument();
    expect(screen.getByText('RSVP Open')).toBeInTheDocument();
    
    // Check location information
    expect(screen.getByText('Camp Wokanda')).toBeInTheDocument();
    expect(screen.getByText('1234 Scout Road, Peoria, IL 61614')).toBeInTheDocument();
    
    // Check den tags
    expect(screen.getByText('Lions')).toBeInTheDocument();
    expect(screen.getByText('Tigers')).toBeInTheDocument();
    expect(screen.getByText('Wolves')).toBeInTheDocument();
    expect(screen.getByText('Bears')).toBeInTheDocument();
    expect(screen.getByText('Webelos')).toBeInTheDocument();
    expect(screen.getByText('AOL')).toBeInTheDocument();
  });

  it('should handle missing event gracefully', async () => {
    // Mock useParams to return a non-existent event ID
    vi.mocked(require('react-router-dom').useParams).mockReturnValue({ id: 'non-existent-event' });

    render(
      <TestWrapper>
        <EventDetailPage />
      </TestWrapper>
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    // Should show event not found message
    expect(screen.getByText('Event Not Found')).toBeInTheDocument();
    expect(screen.getByText(/The event you're looking for doesn't exist/)).toBeInTheDocument();
  });
});
