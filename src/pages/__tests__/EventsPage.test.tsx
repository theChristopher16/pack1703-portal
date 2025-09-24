import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import EventsPage from '../../pages/EventsPage';
import { firestoreService } from '../../services/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';

// Mock Firebase Functions
jest.mock('firebase/functions');
const mockGetFunctions = getFunctions as jest.MockedFunction<typeof getFunctions>;
const mockHttpsCallable = httpsCallable as jest.MockedFunction<typeof httpsCallable>;

// Mock Firestore Service
jest.mock('../../services/firestore');
const mockFirestoreService = firestoreService as jest.Mocked<typeof firestoreService>;

// Mock React Router
jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn(),
  useParams: () => ({})
}));

// Mock Admin Context
jest.mock('../../contexts/AdminContext', () => ({
  useAdmin: () => ({
    state: { currentUser: null },
    hasRole: () => false
  })
}));

describe('EventsPage Performance Optimizations', () => {
  const mockGetBatchRSVPCounts = jest.fn();
  const mockGetRSVPCount = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock Firebase Functions
    mockGetFunctions.mockReturnValue({} as any);
    mockHttpsCallable.mockImplementation((functions, functionName) => {
      if (functionName === 'getBatchRSVPCounts') {
        return mockGetBatchRSVPCounts;
      } else if (functionName === 'getRSVPCount') {
        return mockGetRSVPCount;
      }
      return jest.fn();
    });

    // Mock Firestore Service
    mockFirestoreService.getEvents.mockResolvedValue([
      {
        id: 'event1',
        title: 'Test Event 1',
        startDate: { toDate: () => new Date('2024-01-01') },
        locationName: 'Test Location',
        category: 'pack-wide'
      },
      {
        id: 'event2',
        title: 'Test Event 2',
        startDate: { toDate: () => new Date('2024-01-02') },
        locationName: 'Test Location 2',
        category: 'den'
      }
    ]);
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  it('should use batch RSVP count function successfully', async () => {
    mockGetBatchRSVPCounts.mockResolvedValue({
      data: {
        success: true,
        rsvpCounts: {
          event1: 5,
          event2: 3
        }
      }
    });

    render(<EventsPage />);

    await waitFor(() => {
      expect(mockFirestoreService.getEvents).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(mockGetBatchRSVPCounts).toHaveBeenCalledWith({
        eventIds: ['event1', 'event2']
      });
    });

    // Verify events are displayed
    expect(screen.getByText('Test Event 1')).toBeInTheDocument();
    expect(screen.getByText('Test Event 2')).toBeInTheDocument();
  });

  it('should fallback to individual RSVP counts when batch fails', async () => {
    mockGetBatchRSVPCounts.mockRejectedValue(new Error('Batch function failed'));
    
    mockGetRSVPCount.mockResolvedValue({
      data: {
        success: true,
        rsvpCount: 5
      }
    });

    render(<EventsPage />);

    await waitFor(() => {
      expect(mockFirestoreService.getEvents).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(mockGetBatchRSVPCounts).toHaveBeenCalled();
    });

    // Should fallback to individual calls
    await waitFor(() => {
      expect(mockGetRSVPCount).toHaveBeenCalledWith({ eventId: 'event1' });
      expect(mockGetRSVPCount).toHaveBeenCalledWith({ eventId: 'event2' });
    });
  });

  it('should use cached RSVP counts when available', async () => {
    mockGetBatchRSVPCounts.mockResolvedValue({
      data: {
        success: true,
        rsvpCounts: {
          event1: 5,
          event2: 3
        }
      }
    });

    const { rerender } = render(<EventsPage />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Test Event 1')).toBeInTheDocument();
    });

    // Clear mocks
    mockGetBatchRSVPCounts.mockClear();
    mockFirestoreService.getEvents.mockClear();

    // Re-render (simulating navigation back)
    rerender(<EventsPage />);

    // Should use cached data and not call services again
    await waitFor(() => {
      expect(mockGetBatchRSVPCounts).not.toHaveBeenCalled();
      expect(mockFirestoreService.getEvents).not.toHaveBeenCalled();
    });
  });

  it('should handle cache expiration correctly', async () => {
    mockGetBatchRSVPCounts.mockResolvedValue({
      data: {
        success: true,
        rsvpCounts: {
          event1: 5,
          event2: 3
        }
      }
    });

    // Mock Date.now to simulate cache expiration
    const originalDateNow = Date.now;
    let mockTime = 1000000;
    Date.now = jest.fn(() => mockTime);

    render(<EventsPage />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Test Event 1')).toBeInTheDocument();
    });

    // Clear mocks
    mockGetBatchRSVPCounts.mockClear();
    mockFirestoreService.getEvents.mockClear();

    // Simulate cache expiration (5 minutes + 1ms)
    mockTime += 5 * 60 * 1000 + 1;
    Date.now = jest.fn(() => mockTime);

    // Re-render to trigger cache check
    const { rerender } = render(<EventsPage />);
    rerender(<EventsPage />);

    // Should call services again due to cache expiration
    await waitFor(() => {
      expect(mockFirestoreService.getEvents).toHaveBeenCalled();
    });

    // Restore original Date.now
    Date.now = originalDateNow;
  });

  it('should handle service errors gracefully', async () => {
    mockFirestoreService.getEvents.mockRejectedValue(new Error('Database error'));

    render(<EventsPage />);

    await waitFor(() => {
      expect(screen.getByText('Unable to load events. Please try again later.')).toBeInTheDocument();
    });
  });

  it('should show empty state when no events', async () => {
    mockFirestoreService.getEvents.mockResolvedValue([]);

    render(<EventsPage />);

    await waitFor(() => {
      expect(screen.getByText('No events found')).toBeInTheDocument();
    });
  });

  it('should handle individual RSVP count errors gracefully', async () => {
    mockGetBatchRSVPCounts.mockRejectedValue(new Error('Batch function failed'));
    
    mockGetRSVPCount.mockRejectedValue(new Error('Individual count failed'));

    render(<EventsPage />);

    await waitFor(() => {
      expect(screen.getByText('Test Event 1')).toBeInTheDocument();
    });

    // Should still display events even if RSVP counts fail
    expect(screen.getByText('Test Event 1')).toBeInTheDocument();
    expect(screen.getByText('Test Event 2')).toBeInTheDocument();
  });
});
