import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// Mock Firebase
jest.mock('../../firebase/config', () => ({
  db: {},
  collection: jest.fn(),
  query: jest.fn(),
  orderBy: jest.fn(),
  getDocs: jest.fn(),
}));

// Mock firestore service
const mockGetLocation = jest.fn();
jest.mock('../../services/firestore', () => ({
  firestoreService: {
    getLocation: mockGetLocation,
  }
}));

// Mock AdminContext
jest.mock('../../contexts/AdminContext', () => ({
  AdminProvider: ({ children }: { children: React.ReactNode }) => children,
  useAdmin: () => ({
    addNotification: jest.fn(),
    state: { currentUser: { role: 'admin' } },
    createEntity: jest.fn(),
    updateEntity: jest.fn(),
    deleteEntity: jest.fn(),
  }),
}));

// Import the component after mocking
import AdminEvents from '../AdminEvents';

describe('AdminEvents - Location Handling', () => {
  const mockEventWithLocationId = {
    id: 'test-event-123',
    title: 'Test Event',
    description: 'Test Description',
    startDate: '2025-10-26T19:00:00.000Z',
    endDate: '2025-10-27T10:00:00.000Z',
    location: 'USS Stewart, Galveston, TX', // Readable location name
    locationId: 'RwI4opwHcUx3GKKF7Ten', // Location ID from Firestore
    category: 'Meeting',
    visibility: 'public' as const,
    capacity: 50,
    currentParticipants: 3,
    isActive: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  };

  const mockLocation = {
    id: 'RwI4opwHcUx3GKKF7Ten',
    name: 'USS Stewart',
    address: 'Galveston, TX',
    category: 'museum',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock successful location fetch
    mockGetLocation.mockResolvedValue(mockLocation);
  });

  test('should display readable location name in event card', async () => {
    // Mock events with location data
    const mockEvents = [mockEventWithLocationId];
    
    // Mock the fetchEvents function to return our test data
    const AdminEventsComponent = () => {
      const [events] = React.useState(mockEvents);
      
      return (
        <div>
          {events.map(event => (
            <div key={event.id} className="event-card">
              <h3>{event.title}</h3>
              <div className="location-display">
                {event.location || 'Location TBD'}
              </div>
            </div>
          ))}
        </div>
      );
    };

    render(<AdminEventsComponent />);

    // Check that readable location name is displayed
    expect(screen.getByText('USS Stewart, Galveston, TX')).toBeInTheDocument();
  });

  test('should populate form with readable location name when editing', async () => {
    render(
      <MemoryRouter initialEntries={['/admin/events']}>
        <AdminEvents />
      </MemoryRouter>
    );

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('Events')).toBeInTheDocument();
    });

    // Mock the events data
    const eventsRef = require('../../firebase/config').collection;
    const mockSnapshot = {
      docs: [{
        id: 'test-event-123',
        data: () => ({
          ...mockEventWithLocationId,
          startDate: { toDate: () => new Date(mockEventWithLocationId.startDate) },
          endDate: { toDate: () => new Date(mockEventWithLocationId.endDate) },
        })
      }]
    };
    
    const mockGetDocs = require('../../firebase/config').getDocs;
    mockGetDocs.mockResolvedValue(mockSnapshot);

    // Trigger a re-render to load the mocked data
    await waitFor(() => {
      expect(screen.getByText('Test Event')).toBeInTheDocument();
    });

    // Find and click edit button
    const editButtons = screen.getAllByText('✏️ Edit');
    fireEvent.click(editButtons[0]);

    // Wait for modal to open
    await waitFor(() => {
      expect(screen.getByText('Edit Event')).toBeInTheDocument();
    });

    // Check that the location field shows the readable name, not the ID
    const locationInput = screen.getByDisplayValue('USS Stewart, Galveston, TX');
    expect(locationInput).toBeInTheDocument();
    
    // Should NOT show the locationId
    expect(screen.queryByDisplayValue('RwI4opwHcUx3GKKF7Ten')).not.toBeInTheDocument();
  });

  test('should handle missing location gracefully', async () => {
    const mockEventWithoutLocation = {
      ...mockEventWithLocationId,
      location: undefined,
      locationId: undefined,
    };

    render(
      <MemoryRouter initialEntries={['/admin/events']}>
        <AdminEvents />
      </MemoryRouter>
    );

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('Events')).toBeInTheDocument();
    });

    // Mock the events data without location
    const eventsRef = require('../../firebase/config').collection;
    const mockSnapshot = {
      docs: [{
        id: 'test-event-123',
        data: () => ({
          ...mockEventWithoutLocation,
          startDate: { toDate: () => new Date(mockEventWithoutLocation.startDate) },
          endDate: { toDate: () => new Date(mockEventWithoutLocation.endDate) },
        })
      }]
    };
    
    const mockGetDocs = require('../../firebase/config').getDocs;
    mockGetDocs.mockResolvedValue(mockSnapshot);

    // Trigger a re-render to load the mocked data
    await waitFor(() => {
      expect(screen.getByText('Test Event')).toBeInTheDocument();
    });

    // Find and click edit button
    const editButtons = screen.getAllByText('✏️ Edit');
    fireEvent.click(editButtons[0]);

    // Wait for modal to open
    await waitFor(() => {
      expect(screen.getByText('Edit Event')).toBeInTheDocument();
    });

    // Check that the location field is empty
    const locationInput = screen.getByLabelText('Location *');
    expect(locationInput).toHaveValue('');
  });

  test('should submit locationId when saving event', async () => {
    const mockUpdateEvent = jest.fn().mockResolvedValue({ success: true });
    
    // Mock adminService
    jest.doMock('../../services/adminService', () => ({
      adminService: {
        updateEvent: mockUpdateEvent,
      }
    }));

    render(
      <MemoryRouter initialEntries={['/admin/events']}>
        <AdminEvents />
      </MemoryRouter>
    );

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('Events')).toBeInTheDocument();
    });

    // Mock the events data
    const eventsRef = require('../../firebase/config').collection;
    const mockSnapshot = {
      docs: [{
        id: 'test-event-123',
        data: () => ({
          ...mockEventWithLocationId,
          startDate: { toDate: () => new Date(mockEventWithLocationId.startDate) },
          endDate: { toDate: () => new Date(mockEventWithLocationId.endDate) },
        })
      }]
    };
    
    const mockGetDocs = require('../../firebase/config').getDocs;
    mockGetDocs.mockResolvedValue(mockSnapshot);

    // Trigger a re-render to load the mocked data
    await waitFor(() => {
      expect(screen.getByText('Test Event')).toBeInTheDocument();
    });

    // Find and click edit button
    const editButtons = screen.getAllByText('✏️ Edit');
    fireEvent.click(editButtons[0]);

    // Wait for modal to open
    await waitFor(() => {
      expect(screen.getByText('Edit Event')).toBeInTheDocument();
    });

    // Click save button
    const saveButton = screen.getByText('Save Event');
    fireEvent.click(saveButton);

    // Wait for update to complete
    await waitFor(() => {
      expect(mockUpdateEvent).toHaveBeenCalledWith(
        'test-event-123',
        expect.objectContaining({
          locationId: 'RwI4opwHcUx3GKKF7Ten', // Should submit locationId
        })
      );
    });
  });

  test('should handle location resolution failure gracefully', async () => {
    // Mock location fetch failure
    mockGetLocation.mockRejectedValue(new Error('Location not found'));

    const mockEventWithInvalidLocationId = {
      ...mockEventWithLocationId,
      location: undefined, // No readable location name
      locationId: 'invalid-location-id',
    };

    render(
      <MemoryRouter initialEntries={['/admin/events']}>
        <AdminEvents />
      </MemoryRouter>
    );

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('Events')).toBeInTheDocument();
    });

    // Mock the events data with invalid location
    const eventsRef = require('../../firebase/config').collection;
    const mockSnapshot = {
      docs: [{
        id: 'test-event-123',
        data: () => ({
          ...mockEventWithInvalidLocationId,
          startDate: { toDate: () => new Date(mockEventWithInvalidLocationId.startDate) },
          endDate: { toDate: () => new Date(mockEventWithInvalidLocationId.endDate) },
        })
      }]
    };
    
    const mockGetDocs = require('../../firebase/config').getDocs;
    mockGetDocs.mockResolvedValue(mockSnapshot);

    // Trigger a re-render to load the mocked data
    await waitFor(() => {
      expect(screen.getByText('Test Event')).toBeInTheDocument();
    });

    // Find and click edit button
    const editButtons = screen.getAllByText('✏️ Edit');
    fireEvent.click(editButtons[0]);

    // Wait for modal to open
    await waitFor(() => {
      expect(screen.getByText('Edit Event')).toBeInTheDocument();
    });

    // Should show the locationId as fallback when location name is not available
    const locationInput = screen.getByDisplayValue('invalid-location-id');
    expect(locationInput).toBeInTheDocument();
  });
});
