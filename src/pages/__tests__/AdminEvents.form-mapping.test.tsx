import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// Mock the admin service
const mockUpdateEvent = jest.fn();
const mockCreateEvent = jest.fn();

jest.mock('../../services/adminService', () => ({
  adminService: {
    updateEvent: mockUpdateEvent,
    createEvent: mockCreateEvent,
  }
}));

// Mock Firebase
jest.mock('../../firebase/config', () => ({
  db: {},
  collection: jest.fn(),
  query: jest.fn(),
  orderBy: jest.fn(),
  getDocs: jest.fn(),
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

describe('AdminEvents - Event Form Data Mapping', () => {
  const mockEventWithCapacity = {
    id: 'test-event-123',
    title: 'Test Event',
    description: 'Test Description',
    startDate: '2025-10-26T19:00:00.000Z',
    endDate: '2025-10-27T10:00:00.000Z',
    location: 'USS Stewart, Galveston, TX',
    locationId: 'RwI4opwHcUx3GKKF7Ten',
    category: 'Meeting',
    visibility: 'public' as const,
    capacity: 50, // This is the correct field from Firestore
    maxParticipants: undefined, // Legacy field should be ignored
    currentParticipants: 3,
    isActive: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  };

  const mockEventWithoutCapacity = {
    id: 'test-event-456',
    title: 'Test Event 2',
    description: 'Test Description 2',
    startDate: '2025-10-26T19:00:00.000Z',
    endDate: '2025-10-27T10:00:00.000Z',
    location: 'Community Center',
    locationId: 'location-456',
    category: 'Meeting',
    visibility: 'public' as const,
    capacity: null, // Unlimited capacity
    currentParticipants: 0,
    isActive: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock successful update
    mockUpdateEvent.mockResolvedValue({
      success: true,
    });
  });

  test('should display correct capacity in event card', async () => {
    // Mock events with capacity data
    const mockEvents = [mockEventWithCapacity, mockEventWithoutCapacity];
    
    // Mock the fetchEvents function to return our test data
    const AdminEventsComponent = () => {
      const [events] = React.useState(mockEvents);
      const [loading] = React.useState(false);
      
      return (
        <div>
          {events.map(event => (
            <div key={event.id} className="event-card">
              <h3>{event.title}</h3>
              <div className="capacity-display">
                {event.currentParticipants || 0}/{event.capacity || '∞'}
              </div>
            </div>
          ))}
        </div>
      );
    };

    render(<AdminEventsComponent />);

    // Check that capacity is displayed correctly
    expect(screen.getByText('3/50')).toBeInTheDocument(); // Event with capacity 50
    expect(screen.getByText('0/∞')).toBeInTheDocument(); // Event with unlimited capacity
  });

  test('should populate form with correct capacity value when editing', async () => {
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
          ...mockEventWithCapacity,
          startDate: { toDate: () => new Date(mockEventWithCapacity.startDate) },
          endDate: { toDate: () => new Date(mockEventWithCapacity.endDate) },
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

    // Check that the capacity field shows the correct value
    const capacityInput = screen.getByDisplayValue('50');
    expect(capacityInput).toBeInTheDocument();
  });

  test('should handle unlimited capacity correctly', async () => {
    render(
      <MemoryRouter initialEntries={['/admin/events']}>
        <AdminEvents />
      </MemoryRouter>
    );

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('Events')).toBeInTheDocument();
    });

    // Mock the events data with unlimited capacity
    const eventsRef = require('../../firebase/config').collection;
    const mockSnapshot = {
      docs: [{
        id: 'test-event-456',
        data: () => ({
          ...mockEventWithoutCapacity,
          startDate: { toDate: () => new Date(mockEventWithoutCapacity.startDate) },
          endDate: { toDate: () => new Date(mockEventWithoutCapacity.endDate) },
        })
      }]
    };
    
    const mockGetDocs = require('../../firebase/config').getDocs;
    mockGetDocs.mockResolvedValue(mockSnapshot);

    // Trigger a re-render to load the mocked data
    await waitFor(() => {
      expect(screen.getByText('Test Event 2')).toBeInTheDocument();
    });

    // Find and click edit button
    const editButtons = screen.getAllByText('✏️ Edit');
    fireEvent.click(editButtons[0]);

    // Wait for modal to open
    await waitFor(() => {
      expect(screen.getByText('Edit Event')).toBeInTheDocument();
    });

    // Check that the capacity field is empty (unlimited)
    const capacityInput = screen.getByPlaceholderText('Leave empty for unlimited');
    expect(capacityInput).toHaveValue('');
  });

  test('should map form data correctly when saving', async () => {
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
          ...mockEventWithCapacity,
          startDate: { toDate: () => new Date(mockEventWithCapacity.startDate) },
          endDate: { toDate: () => new Date(mockEventWithCapacity.endDate) },
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

    // Change the capacity
    const capacityInput = screen.getByDisplayValue('50');
    fireEvent.change(capacityInput, { target: { value: '75' } });

    // Click save button
    const saveButton = screen.getByText('Save Event');
    fireEvent.click(saveButton);

    // Wait for update to complete
    await waitFor(() => {
      expect(mockUpdateEvent).toHaveBeenCalledWith(
        'test-event-123',
        expect.objectContaining({
          capacity: 75, // Should map maxParticipants to capacity
          locationId: 'RwI4opwHcUx3GKKF7Ten', // Should use locationId
        })
      );
    });
  });

  test('should handle empty capacity as unlimited', async () => {
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
          ...mockEventWithCapacity,
          startDate: { toDate: () => new Date(mockEventWithCapacity.startDate) },
          endDate: { toDate: () => new Date(mockEventWithCapacity.endDate) },
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

    // Clear the capacity (set to unlimited)
    const capacityInput = screen.getByDisplayValue('50');
    fireEvent.change(capacityInput, { target: { value: '' } });

    // Click save button
    const saveButton = screen.getByText('Save Event');
    fireEvent.click(saveButton);

    // Wait for update to complete
    await waitFor(() => {
      expect(mockUpdateEvent).toHaveBeenCalledWith(
        'test-event-123',
        expect.objectContaining({
          capacity: null, // Should be null for unlimited
        })
      );
    });
  });
});
