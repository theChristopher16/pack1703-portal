const admin = require('firebase-admin');
const { initializeTestEnvironment } = require('@firebase/rules-unit-testing');

// Mock Firebase Admin
jest.mock('firebase-admin', () => ({
  initializeApp: jest.fn(),
  firestore: jest.fn(() => ({
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        get: jest.fn(),
        update: jest.fn(),
        set: jest.fn()
      })),
      add: jest.fn()
    })),
    batch: jest.fn(() => ({
      set: jest.fn(),
      update: jest.fn(),
      commit: jest.fn()
    }))
  })),
  credential: {
    applicationDefault: jest.fn()
  }
}));

// Import the function to test
const { submitRSVP } = require('../../../functions/src/index');

describe('submitRSVP Cloud Function', () => {
  let mockDb: any;
  let mockBatch: any;
  let mockEventRef: any;
  let mockRsvpRef: any;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup mock Firestore
    mockRsvpRef = {
      id: 'test-rsvp-id'
    };

    mockEventRef = {
      get: jest.fn(),
      update: jest.fn()
    };

    mockBatch = {
      set: jest.fn(),
      update: jest.fn(),
      commit: jest.fn()
    };

    mockDb = {
      collection: jest.fn((collectionName) => {
        if (collectionName === 'events') {
          return {
            doc: jest.fn(() => mockEventRef)
          };
        }
        if (collectionName === 'rsvps') {
          return {
            doc: jest.fn(() => mockRsvpRef)
          };
        }
        return {};
      }),
      batch: jest.fn(() => mockBatch)
    };

    // Mock admin.firestore() to return our mock
    (admin.firestore as jest.Mock).mockReturnValue(mockDb);
  });

  it('should successfully submit RSVP and update event count', async () => {
    // Mock event data
    const mockEventData = {
      capacity: 50,
      currentRSVPs: 10
    };

    const mockEventDoc = {
      exists: true,
      data: () => mockEventData
    };

    mockEventRef.get.mockResolvedValue(mockEventDoc);
    mockBatch.commit.mockResolvedValue(undefined);

    // Mock context
    const mockContext = {
      auth: {
        uid: 'test-user-id',
        token: {
          email: 'test@example.com'
        }
      }
    };

    // Test data
    const testData = {
      eventId: 'test-event-id',
      attendees: [
        { name: 'John Doe', age: 8, isAdult: false },
        { name: 'Jane Doe', age: 35, isAdult: true }
      ],
      familyName: 'Doe Family',
      email: 'test@example.com'
    };

    // Call the function
    const result = await submitRSVP(testData, mockContext);

    // Verify results
    expect(result).toEqual({
      success: true,
      rsvpId: 'test-rsvp-id',
      newRSVPCount: 12, // 10 + 2 attendees
      message: 'RSVP submitted successfully'
    });

    // Verify batch operations
    expect(mockBatch.set).toHaveBeenCalledWith(
      mockRsvpRef,
      expect.objectContaining({
        eventId: 'test-event-id',
        userId: 'test-user-id',
        userEmail: 'test@example.com',
        attendeeCount: 2,
        attendees: testData.attendees
      })
    );

    expect(mockBatch.update).toHaveBeenCalledWith(
      mockEventRef,
      {
        currentRSVPs: 12,
        updatedAt: expect.any(Object)
      }
    );

    expect(mockBatch.commit).toHaveBeenCalled();
  });

  it('should throw error when user is not authenticated', async () => {
    const mockContext = {
      auth: null
    };

    const testData = {
      eventId: 'test-event-id',
      attendees: [{ name: 'John Doe', age: 8, isAdult: false }]
    };

    await expect(submitRSVP(testData, mockContext)).rejects.toThrow('User must be authenticated');
  });

  it('should throw error when eventId is missing', async () => {
    const mockContext = {
      auth: {
        uid: 'test-user-id',
        token: { email: 'test@example.com' }
      }
    };

    const testData = {
      attendees: [{ name: 'John Doe', age: 8, isAdult: false }]
    };

    await expect(submitRSVP(testData, mockContext)).rejects.toThrow('Missing required fields: eventId and attendees');
  });

  it('should throw error when attendees is missing', async () => {
    const mockContext = {
      auth: {
        uid: 'test-user-id',
        token: { email: 'test@example.com' }
      }
    };

    const testData = {
      eventId: 'test-event-id'
    };

    await expect(submitRSVP(testData, mockContext)).rejects.toThrow('Missing required fields: eventId and attendees');
  });

  it('should throw error when event does not exist', async () => {
    const mockEventDoc = {
      exists: false
    };

    mockEventRef.get.mockResolvedValue(mockEventDoc);

    const mockContext = {
      auth: {
        uid: 'test-user-id',
        token: { email: 'test@example.com' }
      }
    };

    const testData = {
      eventId: 'nonexistent-event',
      attendees: [{ name: 'John Doe', age: 8, isAdult: false }]
    };

    await expect(submitRSVP(testData, mockContext)).rejects.toThrow('Event not found');
  });

  it('should throw error when event is at capacity', async () => {
    const mockEventData = {
      capacity: 10,
      currentRSVPs: 10
    };

    const mockEventDoc = {
      exists: true,
      data: () => mockEventData
    };

    mockEventRef.get.mockResolvedValue(mockEventDoc);

    const mockContext = {
      auth: {
        uid: 'test-user-id',
        token: { email: 'test@example.com' }
      }
    };

    const testData = {
      eventId: 'test-event-id',
      attendees: [{ name: 'John Doe', age: 8, isAdult: false }]
    };

    await expect(submitRSVP(testData, mockContext)).rejects.toThrow('Event is at capacity. Only 0 spots remaining.');
  });

  it('should handle events without capacity limits', async () => {
    const mockEventData = {
      capacity: null,
      currentRSVPs: 5
    };

    const mockEventDoc = {
      exists: true,
      data: () => mockEventData
    };

    mockEventRef.get.mockResolvedValue(mockEventDoc);
    mockBatch.commit.mockResolvedValue(undefined);

    const mockContext = {
      auth: {
        uid: 'test-user-id',
        token: { email: 'test@example.com' }
      }
    };

    const testData = {
      eventId: 'test-event-id',
      attendees: [
        { name: 'John Doe', age: 8, isAdult: false },
        { name: 'Jane Doe', age: 35, isAdult: true }
      ]
    };

    const result = await submitRSVP(testData, mockContext);

    expect(result.newRSVPCount).toBe(7); // 5 + 2 attendees
    expect(mockBatch.commit).toHaveBeenCalled();
  });

  it('should handle batch commit failure', async () => {
    const mockEventData = {
      capacity: 50,
      currentRSVPs: 10
    };

    const mockEventDoc = {
      exists: true,
      data: () => mockEventData
    };

    mockEventRef.get.mockResolvedValue(mockEventDoc);
    mockBatch.commit.mockRejectedValue(new Error('Database error'));

    const mockContext = {
      auth: {
        uid: 'test-user-id',
        token: { email: 'test@example.com' }
      }
    };

    const testData = {
      eventId: 'test-event-id',
      attendees: [{ name: 'John Doe', age: 8, isAdult: false }]
    };

    await expect(submitRSVP(testData, mockContext)).rejects.toThrow('Failed to submit RSVP');
  });

  it('should validate attendees array format', async () => {
    const mockContext = {
      auth: {
        uid: 'test-user-id',
        token: { email: 'test@example.com' }
      }
    };

    const testData = {
      eventId: 'test-event-id',
      attendees: 'not-an-array'
    };

    await expect(submitRSVP(testData, mockContext)).rejects.toThrow('Missing required fields: eventId and attendees');
  });
});
