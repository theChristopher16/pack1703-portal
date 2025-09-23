import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import EventsPage from '../EventsPage';

// Mock Firebase
jest.mock('../../firebase/config', () => ({
  db: {},
}));

// Mock firestore service
jest.mock('../../services/firestore', () => ({
  firestoreService: {
    getEvents: jest.fn(),
  }
}));

// Mock navigation
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('EventsPage - Event Navigation Flow', () => {
  const mockEvents = [
    {
      id: 'lu6kyov2tFPWdFhpcgaj',
      title: '⚓️ Overnight at the USS Stewart – Galveston 🚢',
      description: 'Join us for an exciting overnight adventure aboard the historic USS Stewart in Galveston!',
      date: '2025-10-26T19:00:00.000Z',
      startTime: '19:00',
      endTime: '10:00',
      location: {
        name: 'USS Stewart',
        address: 'Galveston, TX',
      },
      category: 'overnight',
      denTags: ['pack-wide'],
      maxCapacity: 50,
      currentRSVPs: 3,
      description: 'Overnight adventure aboard historic ship',
      packingList: ['Sleeping bag', 'Pillow', 'Toiletries'],
      fees: 25,
      contactEmail: 'cubmaster@sfpack1703.com',
      isOvernight: true,
      requiresPermission: true,
      attachments: [],
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock successful events fetch
    const { firestoreService } = require('../../services/firestore');
    firestoreService.getEvents.mockResolvedValue(mockEvents);
  });

  test('should navigate to event details with correct eventId', async () => {
    render(
      <MemoryRouter initialEntries={['/events']}>
        <EventsPage />
      </MemoryRouter>
    );

    // Wait for events to load
    await waitFor(() => {
      expect(screen.getByText('⚓️ Overnight at the USS Stewart – Galveston 🚢')).toBeInTheDocument();
    });

    // Find and click "View Details" button
    const viewDetailsButton = screen.getByText('View Details');
    fireEvent.click(viewDetailsButton);

    // Verify navigation was called with correct eventId
    expect(mockNavigate).toHaveBeenCalledWith('/events/lu6kyov2tFPWdFhpcgaj');
  });

  test('should navigate to RSVP tab with correct eventId', async () => {
    render(
      <MemoryRouter initialEntries={['/events']}>
        <EventsPage />
      </MemoryRouter>
    );

    // Wait for events to load
    await waitFor(() => {
      expect(screen.getByText('⚓️ Overnight at the USS Stewart – Galveston 🚢')).toBeInTheDocument();
    });

    // Find and click "RSVP" button
    const rsvpButton = screen.getByText('RSVP');
    fireEvent.click(rsvpButton);

    // Verify navigation was called with correct eventId and tab
    expect(mockNavigate).toHaveBeenCalledWith('/events/lu6kyov2tFPWdFhpcgaj?tab=rsvp');
  });

  test('should handle event click with valid eventId', async () => {
    render(
      <MemoryRouter initialEntries={['/events']}>
        <EventsPage />
      </MemoryRouter>
    );

    // Wait for events to load
    await waitFor(() => {
      expect(screen.getByText('⚓️ Overnight at the USS Stewart – Galveston 🚢')).toBeInTheDocument();
    });

    // Click on the event card itself
    const eventCard = screen.getByText('⚓️ Overnight at the USS Stewart – Galveston 🚢').closest('.event-card');
    if (eventCard) {
      fireEvent.click(eventCard);
      
      // Verify navigation was called
      expect(mockNavigate).toHaveBeenCalledWith('/events/lu6kyov2tFPWdFhpcgaj');
    }
  });

  test('should handle missing eventId gracefully', async () => {
    const eventsWithoutId = [
      {
        ...mockEvents[0],
        id: undefined, // Missing ID
      }
    ];

    const { firestoreService } = require('../../services/firestore');
    firestoreService.getEvents.mockResolvedValue(eventsWithoutId);

    render(
      <MemoryRouter initialEntries={['/events']}>
        <EventsPage />
      </MemoryRouter>
    );

    // Wait for events to load
    await waitFor(() => {
      expect(screen.getByText('⚓️ Overnight at the USS Stewart – Galveston 🚢')).toBeInTheDocument();
    });

    // Try to click View Details
    const viewDetailsButton = screen.getByText('View Details');
    fireEvent.click(viewDetailsButton);

    // Should not navigate with undefined ID
    expect(mockNavigate).not.toHaveBeenCalledWith('/events/undefined');
  });

  test('should handle empty eventId gracefully', async () => {
    const eventsWithEmptyId = [
      {
        ...mockEvents[0],
        id: '', // Empty ID
      }
    ];

    const { firestoreService } = require('../../services/firestore');
    firestoreService.getEvents.mockResolvedValue(eventsWithEmptyId);

    render(
      <MemoryRouter initialEntries={['/events']}>
        <EventsPage />
      </MemoryRouter>
    );

    // Wait for events to load
    await waitFor(() => {
      expect(screen.getByText('⚓️ Overnight at the USS Stewart – Galveston 🚢')).toBeInTheDocument();
    });

    // Try to click View Details
    const viewDetailsButton = screen.getByText('View Details');
    fireEvent.click(viewDetailsButton);

    // Should not navigate with empty ID
    expect(mockNavigate).not.toHaveBeenCalledWith('/events/');
  });
});
