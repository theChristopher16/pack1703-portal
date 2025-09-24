/**
 * RSVPListViewer Permissions Tests
 * 
 * These tests verify that the RSVPListViewer component properly handles
 * admin permissions and Firestore security rules.
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import RSVPListViewer from '../components/Admin/RSVPListViewer';
import { collection, query, where, getDocs } from 'firebase/firestore';

// Mock Firebase Firestore
const mockGetDocs = jest.fn();
const mockQuery = jest.fn();
const mockWhere = jest.fn();
const mockCollection = jest.fn();

jest.mock('firebase/firestore', () => ({
  collection: mockCollection,
  query: mockQuery,
  where: mockWhere,
  getDocs: mockGetDocs,
}));

// Mock Firebase config
jest.mock('../firebase/config', () => ({
  db: {},
}));

describe('RSVPListViewer Permissions', () => {
  const mockEventId = 'test-event-123';
  const mockEventTitle = 'Test Event';
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mock implementations
    mockCollection.mockReturnValue('mock-collection-ref');
    mockWhere.mockReturnValue('mock-where-ref');
    mockQuery.mockReturnValue('mock-query-ref');
  });

  it('should handle permission denied error gracefully', async () => {
    // Mock permission denied error
    const permissionError = new Error('Missing or insufficient permissions.');
    permissionError.code = 'permission-denied';
    mockGetDocs.mockRejectedValue(permissionError);

    render(
      <RSVPListViewer
        eventId={mockEventId}
        eventTitle={mockEventTitle}
        onClose={mockOnClose}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Failed to load RSVPs')).toBeInTheDocument();
    });

    // Verify the query was attempted
    expect(mockCollection).toHaveBeenCalledWith({}, 'rsvps');
    expect(mockWhere).toHaveBeenCalledWith('mock-collection-ref', 'eventId', '==', mockEventId);
    expect(mockQuery).toHaveBeenCalledWith('mock-collection-ref', 'mock-where-ref');
    expect(mockGetDocs).toHaveBeenCalledWith('mock-query-ref');
  });

  it('should handle successful RSVP data loading', async () => {
    // Mock successful data response
    const mockRSVPData = [
      {
        id: 'rsvp1',
        eventId: mockEventId,
        userId: 'user1',
        userEmail: 'test@example.com',
        familyName: 'Test Family',
        email: 'test@example.com',
        attendees: [
          { name: 'John Doe', age: 8, den: 'Wolves', isAdult: false }
        ],
        submittedAt: { toDate: () => new Date('2025-01-01') }
      }
    ];

    mockGetDocs.mockResolvedValue({
      size: 1,
      forEach: (callback: any) => mockRSVPData.forEach(callback)
    });

    render(
      <RSVPListViewer
        eventId={mockEventId}
        eventTitle={mockEventTitle}
        onClose={mockOnClose}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Test Family')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Verify no error state
    expect(screen.queryByText('Failed to load RSVPs')).not.toBeInTheDocument();
  });

  it('should handle empty RSVP data', async () => {
    // Mock empty response
    mockGetDocs.mockResolvedValue({
      size: 0,
      forEach: () => {} // Empty forEach
    });

    render(
      <RSVPListViewer
        eventId={mockEventId}
        eventTitle={mockEventTitle}
        onClose={mockOnClose}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('No RSVPs Yet')).toBeInTheDocument();
      expect(screen.getByText('No one has RSVP\'d for this event yet.')).toBeInTheDocument();
    });

    // Verify statistics show 0
    expect(screen.getByText('0')).toBeInTheDocument(); // Total RSVPs
  });

  it('should handle network errors', async () => {
    // Mock network error
    const networkError = new Error('Network error');
    mockGetDocs.mockRejectedValue(networkError);

    render(
      <RSVPListViewer
        eventId={mockEventId}
        eventTitle={mockEventTitle}
        onClose={mockOnClose}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Failed to load RSVPs')).toBeInTheDocument();
    });
  });

  it('should handle malformed RSVP data', async () => {
    // Mock malformed data
    const malformedData = [
      {
        id: 'rsvp1',
        // Missing required fields
        eventId: mockEventId,
        // No userId, userEmail, familyName, etc.
      }
    ];

    mockGetDocs.mockResolvedValue({
      size: 1,
      forEach: (callback: any) => malformedData.forEach(callback)
    });

    render(
      <RSVPListViewer
        eventId={mockEventId}
        eventTitle={mockEventTitle}
        onClose={mockOnClose}
      />
    );

    // Should handle gracefully without crashing
    await waitFor(() => {
      expect(screen.queryByText('Failed to load RSVPs')).not.toBeInTheDocument();
    });
  });

  it('should log detailed information for debugging', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    // Mock permission error
    const permissionError = new Error('Missing or insufficient permissions.');
    mockGetDocs.mockRejectedValue(permissionError);

    render(
      <RSVPListViewer
        eventId={mockEventId}
        eventTitle={mockEventTitle}
        onClose={mockOnClose}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Failed to load RSVPs')).toBeInTheDocument();
    });

    // Verify logging
    expect(consoleSpy).toHaveBeenCalledWith('RSVPListViewer: Loading RSVPs for event:', mockEventId);
    expect(consoleSpy).toHaveBeenCalledWith('RSVPListViewer: Executing query...');
    expect(consoleErrorSpy).toHaveBeenCalledWith('Error loading RSVPs:', permissionError);

    consoleSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });
});

describe('RSVPListViewer Query Structure', () => {
  const mockEventId = 'test-event-123';
  const mockEventTitle = 'Test Event';
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockCollection.mockReturnValue('mock-collection-ref');
    mockWhere.mockReturnValue('mock-where-ref');
    mockQuery.mockReturnValue('mock-query-ref');
  });

  it('should construct correct Firestore query', async () => {
    mockGetDocs.mockResolvedValue({
      size: 0,
      forEach: () => {}
    });

    render(
      <RSVPListViewer
        eventId={mockEventId}
        eventTitle={mockEventTitle}
        onClose={mockOnClose}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('No RSVPs Yet')).toBeInTheDocument();
    });

    // Verify query construction
    expect(mockCollection).toHaveBeenCalledWith({}, 'rsvps');
    expect(mockWhere).toHaveBeenCalledWith('mock-collection-ref', 'eventId', '==', mockEventId);
    expect(mockQuery).toHaveBeenCalledWith('mock-collection-ref', 'mock-where-ref');
    expect(mockGetDocs).toHaveBeenCalledWith('mock-query-ref');
  });

  it('should handle different event IDs correctly', async () => {
    const testEventIds = ['event1', 'event2', 'event-with-special-chars-123'];
    
    for (const eventId of testEventIds) {
      jest.clearAllMocks();
      mockCollection.mockReturnValue('mock-collection-ref');
      mockWhere.mockReturnValue('mock-where-ref');
      mockQuery.mockReturnValue('mock-query-ref');
      mockGetDocs.mockResolvedValue({
        size: 0,
        forEach: () => {}
      });

      const { unmount } = render(
        <RSVPListViewer
          eventId={eventId}
          eventTitle="Test Event"
          onClose={jest.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('No RSVPs Yet')).toBeInTheDocument();
      });

      expect(mockWhere).toHaveBeenCalledWith('mock-collection-ref', 'eventId', '==', eventId);
      
      unmount();
    }
  });
});
