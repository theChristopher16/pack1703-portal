import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import EventDetailPage from '../EventDetailPage';

// Mock the LoadingSpinner component
vi.mock('../../components/Loading/LoadingSpinner', () => ({
  default: ({ text }: { text: string }) => <div data-testid="loading-spinner">{text}</div>,
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

describe('EventDetailPage - Simple Tests', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
  });

  it('should load event data for event-001', async () => {
    render(
      <TestWrapper>
        <EventDetailPage />
      </TestWrapper>
    );

    // Wait for loading to complete and event data to load
    await waitFor(() => {
      expect(screen.getByText('Pack 1703 Fall Campout')).toBeInTheDocument();
    });

    // Check that event data is loaded
    expect(screen.getByText('Campout')).toBeInTheDocument();
    expect(screen.getByText('RSVP Open')).toBeInTheDocument();
  });

  it('should display event information correctly', async () => {
    render(
      <TestWrapper>
        <EventDetailPage />
      </TestWrapper>
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByText('Pack 1703 Fall Campout')).toBeInTheDocument();
    });

    // Check event details
    expect(screen.getByText('Campout')).toBeInTheDocument();
    expect(screen.getByText('RSVP Open')).toBeInTheDocument();
    
    // Check that the event has the right category icon
    expect(screen.getByText('🏔️')).toBeInTheDocument();
  });

  it('should show navigation back to events', async () => {
    render(
      <TestWrapper>
        <EventDetailPage />
      </TestWrapper>
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByText('Pack 1703 Fall Campout')).toBeInTheDocument();
    });

    // Check back navigation
    expect(screen.getByText('Back to Events')).toBeInTheDocument();
  });

  it('should show event actions (Add to Calendar, Share)', async () => {
    render(
      <TestWrapper>
        <EventDetailPage />
      </TestWrapper>
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByText('Pack 1703 Fall Campout')).toBeInTheDocument();
    });

    // Check action buttons
    expect(screen.getByText('Add to Calendar')).toBeInTheDocument();
    expect(screen.getByText('Share')).toBeInTheDocument();
  });

  it('should handle the loading state properly', async () => {
    render(
      <TestWrapper>
        <EventDetailPage />
      </TestWrapper>
    );

    // The component should eventually show the event data
    await waitFor(() => {
      expect(screen.getByText('Pack 1703 Fall Campout')).toBeInTheDocument();
    }, { timeout: 2000 });

    // Verify the component is no longer in a loading state
    expect(screen.queryByText('Loading Event Details...')).not.toBeInTheDocument();
  });
});
