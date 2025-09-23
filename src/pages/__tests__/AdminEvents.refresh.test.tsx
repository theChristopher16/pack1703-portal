import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AdminEvents from '../pages/AdminEvents';
import { AdminProvider } from '../contexts/AdminContext';
import { adminService } from '../services/adminService';

// Mock the admin service
jest.mock('../services/adminService', () => ({
  adminService: {
    updateEvent: jest.fn(),
    createEvent: jest.fn(),
  }
}));

// Mock Firebase
jest.mock('../firebase/config', () => ({
  db: {},
  collection: jest.fn(),
  query: jest.fn(),
  orderBy: jest.fn(),
  getDocs: jest.fn(),
}));

const mockAdminService = adminService as jest.Mocked<typeof adminService>;

describe('AdminEvents - Event List Refresh', () => {
  const mockEvents = [
    {
      id: 'event1',
      title: 'Test Event 1',
      description: 'Test Description 1',
      startDate: '2025-01-01T10:00:00Z',
      endDate: '2025-01-01T12:00:00Z',
      location: 'Test Location 1',
      visibility: 'public' as const,
      maxParticipants: 50,
      currentParticipants: 0,
      isActive: true,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
    },
    {
      id: 'event2',
      title: 'Test Event 2',
      description: 'Test Description 2',
      startDate: '2025-01-02T10:00:00Z',
      endDate: '2025-01-02T12:00:00Z',
      location: 'Test Location 2',
      visibility: 'public' as const,
      maxParticipants: 30,
      currentParticipants: 5,
      isActive: true,
      createdAt: '2025-01-02T00:00:00Z',
      updatedAt: '2025-01-02T00:00:00Z',
    }
  ];

  const renderAdminEvents = () => {
    return render(
      <BrowserRouter>
        <AdminProvider>
          <AdminEvents />
        </AdminProvider>
      </BrowserRouter>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock successful update
    mockAdminService.updateEvent.mockResolvedValue({
      success: true,
    });
  });

  test('should refresh event list after successful update', async () => {
    // Mock the fetchEvents function to return updated data
    const mockFetchEvents = jest.fn();
    
    renderAdminEvents();

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('Events')).toBeInTheDocument();
    });

    // Find and click edit button for first event
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
      expect(mockAdminService.updateEvent).toHaveBeenCalledWith(
        'event1',
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

  test('should show error notification on update failure', async () => {
    // Mock failed update
    mockAdminService.updateEvent.mockResolvedValue({
      success: false,
      error: 'Update failed',
    });

    renderAdminEvents();

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

  test('should handle undefined maxCapacity values correctly', async () => {
    renderAdminEvents();

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
      expect(mockAdminService.updateEvent).toHaveBeenCalledWith(
        'event1',
        expect.objectContaining({
          maxCapacity: null, // Should be null, not undefined
        })
      );
    });
  });
});
