import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import EventDetailPage from '../pages/EventDetailPage';
import { doc, getDoc } from 'firebase/firestore';

// Mock Firebase
jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn(),
}));

// Mock Firebase config
jest.mock('../firebase/config', () => ({
  db: {},
}));

const mockDoc = doc as jest.MockedFunction<typeof doc>;
const mockGetDoc = getDoc as jest.MockedFunction<typeof getDoc>;

describe('EventDetailPage', () => {
  const mockEvent = {
    id: 'event1',
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

  const mockLocation = {
    id: 'location1',
    name: 'Test Location',
    address: '123 Test St, Test City, TC 12345',
    coordinates: { lat: 40.7128, lng: -74.0060 },
    category: 'other',
    notesPublic: 'Test location notes',
    isImportant: false,
  };

  const renderEventDetailPage = (eventId: string) => {
    return render(
      <MemoryRouter initialEntries={[`/events/${eventId}`]}>
        <BrowserRouter>
          <EventDetailPage />
        </BrowserRouter>
      </MemoryRouter>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock successful event fetch
    mockGetDoc.mockImplementation((ref) => {
      if (ref.path.includes('events/event1')) {
        return Promise.resolve({
          exists: () => true,
          data: () => mockEvent,
          id: 'event1',
        });
      } else if (ref.path.includes('locations/location1')) {
        return Promise.resolve({
          exists: () => true,
          data: () => mockLocation,
          id: 'location1',
        });
      }
      return Promise.resolve({
        exists: () => false,
        data: () => undefined,
        id: '',
      });
    });
  });

  test('should load and display event details correctly', async () => {
    renderEventDetailPage('event1');

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByText('Test Event')).toBeInTheDocument();
    });

    // Verify event details are displayed
    expect(screen.getByText('Test Description')).toBeInTheDocument();
    expect(screen.getByText('Test Location')).toBeInTheDocument();
    expect(screen.getByText('123 Test St, Test City, TC 12345')).toBeInTheDocument();
    expect(screen.getByText('Meeting')).toBeInTheDocument();
    expect(screen.getByText('50')).toBeInTheDocument(); // maxCapacity
    expect(screen.getByText('5')).toBeInTheDocument(); // currentRSVPs
  });

  test('should handle missing event gracefully', async () => {
    // Mock event not found
    mockGetDoc.mockImplementation((ref) => {
      if (ref.path.includes('events/nonexistent')) {
        return Promise.resolve({
          exists: () => false,
          data: () => undefined,
          id: '',
        });
      }
      return Promise.resolve({
        exists: () => false,
        data: () => undefined,
        id: '',
      });
    });

    renderEventDetailPage('nonexistent');

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByText('Event Not Found')).toBeInTheDocument();
    });
  });

  test('should handle missing location gracefully', async () => {
    // Mock location not found
    mockGetDoc.mockImplementation((ref) => {
      if (ref.path.includes('events/event1')) {
        return Promise.resolve({
          exists: () => true,
          data: () => ({ ...mockEvent, locationId: 'nonexistent' }),
          id: 'event1',
        });
      } else if (ref.path.includes('locations/nonexistent')) {
        return Promise.resolve({
          exists: () => false,
          data: () => undefined,
          id: '',
        });
      }
      return Promise.resolve({
        exists: () => false,
        data: () => undefined,
        id: '',
      });
    });

    renderEventDetailPage('event1');

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByText('Test Event')).toBeInTheDocument();
    });

    // Should still display event but with location TBD
    expect(screen.getByText('Location TBD')).toBeInTheDocument();
  });

  test('should format dates correctly', async () => {
    renderEventDetailPage('event1');

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByText('Test Event')).toBeInTheDocument();
    });

    // Check date formatting
    expect(screen.getByText(/Wednesday, January 1, 2025/)).toBeInTheDocument();
    expect(screen.getByText(/10:00 AM/)).toBeInTheDocument();
    expect(screen.getByText(/12:00 PM/)).toBeInTheDocument();
  });

  test('should handle RSVP tab correctly', async () => {
    renderEventDetailPage('event1?tab=rsvp');

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByText('Test Event')).toBeInTheDocument();
    });

    // Should show RSVP form
    expect(screen.getByText('RSVP for this Event')).toBeInTheDocument();
  });

  test('should handle map tab correctly', async () => {
    renderEventDetailPage('event1?tab=map');

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByText('Test Event')).toBeInTheDocument();
    });

    // Should show map placeholder
    expect(screen.getByText('Interactive Map')).toBeInTheDocument();
    expect(screen.getByText('Map integration coming soon!')).toBeInTheDocument();
  });

  test('should handle Firebase errors gracefully', async () => {
    // Mock Firebase error
    mockGetDoc.mockRejectedValue(new Error('Firebase error'));

    renderEventDetailPage('event1');

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByText('Error loading event')).toBeInTheDocument();
    });
  });
});