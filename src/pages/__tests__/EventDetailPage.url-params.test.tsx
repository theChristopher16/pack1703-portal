import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import EventDetailPage from '../EventDetailPage';

// Mock Firebase functions
const mockDoc = jest.fn();
const mockGetDoc = jest.fn();

jest.mock('firebase/firestore', () => ({
  doc: mockDoc,
  getDoc: mockGetDoc,
}));

// Mock Firebase config
jest.mock('../../firebase/config', () => ({
  db: {},
}));

describe('EventDetailPage - URL Parameter Extraction', () => {
  const mockEvent = {
    id: 'test-event-123',
    title: 'Test Event',
    description: 'Test Description',
    startDate: { toDate: () => new Date('2025-01-01T10:00:00Z') },
    endDate: { toDate: () => new Date('2025-01-01T12:00:00Z') },
    startTime: '10:00',
    endTime: '12:00',
    locationId: 'location1',
    category: 'Meeting',
    visibility: 'public',
    maxCapacity: 50,
    currentRSVPs: 5,
    isActive: true,
    createdAt: { toDate: () => new Date('2025-01-01T00:00:00Z') },
    updatedAt: { toDate: () => new Date('2025-01-01T00:00:00Z') },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock successful event fetch
    mockGetDoc.mockImplementation((ref) => {
      if (ref.path.includes('events/test-event-123')) {
        return Promise.resolve({
          exists: () => true,
          data: () => mockEvent,
          id: 'test-event-123',
        });
      }
      return Promise.resolve({
        exists: () => false,
        data: () => undefined,
        id: '',
      });
    });
  });

  test('should extract eventId from URL parameter correctly', async () => {
    render(
      <MemoryRouter initialEntries={['/events/test-event-123']}>
        <EventDetailPage />
      </MemoryRouter>
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByText('Test Event')).toBeInTheDocument();
    });

    // Verify the correct event ID was used
    expect(mockDoc).toHaveBeenCalledWith({}, 'events', 'test-event-123');
  });

  test('should handle missing eventId parameter gracefully', async () => {
    render(
      <MemoryRouter initialEntries={['/events']}>
        <EventDetailPage />
      </MemoryRouter>
    );

    // Should show "Event Not Found" message
    await waitFor(() => {
      expect(screen.getByText('Event Not Found')).toBeInTheDocument();
    });
  });

  test('should handle undefined eventId parameter', async () => {
    render(
      <MemoryRouter initialEntries={['/events/undefined']}>
        <EventDetailPage />
      </MemoryRouter>
    );

    // Should show "Event Not Found" message
    await waitFor(() => {
      expect(screen.getByText('Event Not Found')).toBeInTheDocument();
    });
  });

  test('should handle empty eventId parameter', async () => {
    render(
      <MemoryRouter initialEntries={['/events/']}>
        <EventDetailPage />
      </MemoryRouter>
    );

    // Should show "Event Not Found" message
    await waitFor(() => {
      expect(screen.getByText('Event Not Found')).toBeInTheDocument();
    });
  });

  test('should handle Firebase errors gracefully', async () => {
    // Mock Firebase error
    mockGetDoc.mockRejectedValue(new Error('Firebase error'));

    render(
      <MemoryRouter initialEntries={['/events/test-event-123']}>
        <EventDetailPage />
      </MemoryRouter>
    );

    // Should show error message
    await waitFor(() => {
      expect(screen.getByText('Error loading event')).toBeInTheDocument();
    });
  });
});
