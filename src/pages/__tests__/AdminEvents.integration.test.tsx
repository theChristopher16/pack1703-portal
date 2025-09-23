import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AdminEvents from '../AdminEvents';

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

describe('AdminEvents - Event Editing Integration', () => {
  const mockEvents = [
    {
      id: 'lu6kyov2tFPWdFhpcgaj',
      title: '⚓️ Overnight at the USS Stewart – Galveston 🚢',
      description: 'Join us for an exciting overnight adventure aboard the historic USS Stewart in Galveston!',
      startDate: '2025-10-26T19:00:00.000Z',
      endDate: '2025-10-27T10:00:00.000Z',
      location: 'USS Stewart, Galveston, TX',
      visibility: 'public' as const,
      maxParticipants: 50,
      currentParticipants: 3,
      isActive: true,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock successful update
    mockUpdateEvent.mockResolvedValue({
      success: true,
    });
  });

  test('should update event capacity and refresh list', async () => {
    render(
      <MemoryRouter initialEntries={['/admin/events']}>
        <AdminEvents />
      </MemoryRouter>
    );

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('Events')).toBeInTheDocument();
    });

    // Find and click edit button
    const editButtons = screen.getAllByText('Edit');
    fireEvent.click(editButtons[0]);

    // Wait for modal to open
    await waitFor(() => {
      expect(screen.getByText('Edit Event')).toBeInTheDocument();
    });

    // Update the event capacity
    const capacityInput = screen.getByDisplayValue('50');
    fireEvent.change(capacityInput, { target: { value: '75' } });

    // Click save button
    const saveButton = screen.getByText('Save Event');
    fireEvent.click(saveButton);

    // Wait for update to complete
    await waitFor(() => {
      expect(mockUpdateEvent).toHaveBeenCalledWith(
        'lu6kyov2tFPWdFhpcgaj',
        expect.objectContaining({
          maxCapacity: 75,
        })
      );
    });

    // Verify success notification appears
    await waitFor(() => {
      expect(screen.getByText('Event Updated')).toBeInTheDocument();
    });

    // Verify modal closes
    await waitFor(() => {
      expect(screen.queryByText('Edit Event')).not.toBeInTheDocument();
    });
  });

  test('should handle undefined maxCapacity correctly', async () => {
    render(
      <MemoryRouter initialEntries={['/admin/events']}>
        <AdminEvents />
      </MemoryRouter>
    );

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('Events')).toBeInTheDocument();
    });

    // Find and click edit button
    const editButtons = screen.getAllByText('Edit');
    fireEvent.click(editButtons[0]);

    // Wait for modal to open
    await waitFor(() => {
      expect(screen.getByText('Edit Event')).toBeInTheDocument();
    });

    // Clear the capacity input (set to empty)
    const capacityInput = screen.getByDisplayValue('50');
    fireEvent.change(capacityInput, { target: { value: '' } });

    // Click save button
    const saveButton = screen.getByText('Save Event');
    fireEvent.click(saveButton);

    // Wait for update to complete
    await waitFor(() => {
      expect(mockUpdateEvent).toHaveBeenCalledWith(
        'lu6kyov2tFPWdFhpcgaj',
        expect.objectContaining({
          maxCapacity: null, // Should be null, not undefined
        })
      );
    });
  });

  test('should show error notification on update failure', async () => {
    // Mock failed update
    mockUpdateEvent.mockResolvedValue({
      success: false,
      error: 'Update failed',
    });

    render(
      <MemoryRouter initialEntries={['/admin/events']}>
        <AdminEvents />
      </MemoryRouter>
    );

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('Events')).toBeInTheDocument();
    });

    // Find and click edit button
    const editButtons = screen.getAllByText('Edit');
    fireEvent.click(editButtons[0]);

    // Wait for modal to open
    await waitFor(() => {
      expect(screen.getByText('Edit Event')).toBeInTheDocument();
    });

    // Click save button
    const saveButton = screen.getByText('Save Event');
    fireEvent.click(saveButton);

    // Wait for error notification
    await waitFor(() => {
      expect(screen.getByText('Update Failed')).toBeInTheDocument();
    });
  });

  test('should handle network errors gracefully', async () => {
    // Mock network error
    mockUpdateEvent.mockRejectedValue(new Error('Network error'));

    render(
      <MemoryRouter initialEntries={['/admin/events']}>
        <AdminEvents />
      </MemoryRouter>
    );

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('Events')).toBeInTheDocument();
    });

    // Find and click edit button
    const editButtons = screen.getAllByText('Edit');
    fireEvent.click(editButtons[0]);

    // Wait for modal to open
    await waitFor(() => {
      expect(screen.getByText('Edit Event')).toBeInTheDocument();
    });

    // Click save button
    const saveButton = screen.getByText('Save Event');
    fireEvent.click(saveButton);

    // Wait for error notification
    await waitFor(() => {
      expect(screen.getByText('Save Failed')).toBeInTheDocument();
    });
  });
});
