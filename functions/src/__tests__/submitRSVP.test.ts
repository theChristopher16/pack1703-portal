import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import * as admin from 'firebase-admin';
import { submitRSVP } from '../index';

// Mock Firebase Admin
jest.mock('firebase-admin', () => ({
  initializeApp: jest.fn(),
  firestore: jest.fn(() => ({
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        get: jest.fn(),
        set: jest.fn(),
        update: jest.fn(),
      })),
      where: jest.fn(() => ({
        get: jest.fn(),
        select: jest.fn(() => ({
          get: jest.fn(),
        })),
      })),
      add: jest.fn(),
    })),
    batch: jest.fn(() => ({
      set: jest.fn(),
      update: jest.fn(),
      commit: jest.fn(),
    })),
  })),
  auth: jest.fn(),
}));

// Mock functions
jest.mock('firebase-functions', () => ({
  https: {
    onCall: jest.fn((handler) => handler),
    HttpsError: class extends Error {
      constructor(code: string, message: string) {
        super(message);
        this.code = code;
      }
    },
    CallableContext: jest.fn(),
  },
}));

describe('submitRSVP Cloud Function', () => {
  let mockDb: any;
  let mockContext: any;
  let mockEventDoc: any;
  let mockRSVPQuery: any;
  let mockBatch: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock Firestore database
    mockDb = {
      collection: jest.fn(),
      batch: jest.fn(),
    };

    // Mock context
    mockContext = {
      auth: {
        uid: 'test-user-id',
        token: {
          email: 'test@example.com',
        },
      },
    };

    // Mock event document
    mockEventDoc = {
      exists: true,
      data: () => ({
        title: 'Test Event',
        maxCapacity: 50,
        currentRSVPs: 0,
      }),
    };

    // Mock RSVP query (no existing RSVPs)
    mockRSVPQuery = {
      empty: true,
      docs: [],
    };

    // Mock batch operations
    mockBatch = {
      set: jest.fn(),
      update: jest.fn(),
      commit: jest.fn().mockResolvedValue(undefined),
    };

    // Setup collection mocks
    mockDb.collection.mockImplementation((collectionName: string) => {
      if (collectionName === 'events') {
        return {
          doc: jest.fn(() => ({
            get: jest.fn().mockResolvedValue(mockEventDoc),
          })),
        };
      }
      if (collectionName === 'rsvps') {
        return {
          where: jest.fn(() => ({
            get: jest.fn().mockResolvedValue(mockRSVPQuery),
          })),
          doc: jest.fn(() => ({
            id: 'test-rsvp-id',
          })),
        };
      }
      if (collectionName === 'eventStats') {
        return {
          doc: jest.fn(() => ({
            get: jest.fn().mockResolvedValue({ exists: false }),
          })),
        };
      }
      return {};
    });

    mockDb.batch.mockReturnValue(mockBatch);

    // Mock admin.firestore
    (admin.firestore as jest.Mock).mockReturnValue(mockDb);
  });

  it('successfully submits RSVP with valid data', async () => {
    const validRSVPData = {
      eventId: 'test-event-id',
      familyName: 'Test Family',
      email: 'test@example.com',
      phone: '1234567890',
      attendees: [
        {
          name: 'Test Child',
          age: 8,
          den: 'Wolf',
          isAdult: false,
        },
      ],
      dietaryRestrictions: '',
      specialNeeds: '',
      notes: '',
      ipHash: 'test-hash',
      userAgent: 'test-user-agent',
    };

    const result = await submitRSVP(validRSVPData, mockContext);

    expect(result).toEqual({
      success: true,
      rsvpId: 'test-rsvp-id',
      newRSVPCount: 1,
      message: 'RSVP submitted successfully',
    });

    expect(mockDb.collection).toHaveBeenCalledWith('events');
    expect(mockDb.collection).toHaveBeenCalledWith('rsvps');
    expect(mockDb.collection).toHaveBeenCalledWith('eventStats');
    expect(mockBatch.commit).toHaveBeenCalled();
  });

  it('throws error when user is not authenticated', async () => {
    const unauthenticatedContext = {
      auth: null,
    };

    const rsvpData = {
      eventId: 'test-event-id',
      familyName: 'Test Family',
      email: 'test@example.com',
      attendees: [{ name: 'Test Child', age: 8, isAdult: false }],
    };

    await expect(submitRSVP(rsvpData, unauthenticatedContext)).rejects.toThrow(
      'User must be authenticated to RSVP'
    );
  });

  it('throws error when required fields are missing', async () => {
    const incompleteData = {
      eventId: 'test-event-id',
      // Missing familyName, email, attendees
    };

    await expect(submitRSVP(incompleteData, mockContext)).rejects.toThrow(
      'Missing required RSVP data'
    );
  });

  it('throws error when attendees array is empty', async () => {
    const dataWithNoAttendees = {
      eventId: 'test-event-id',
      familyName: 'Test Family',
      email: 'test@example.com',
      attendees: [],
    };

    await expect(submitRSVP(dataWithNoAttendees, mockContext)).rejects.toThrow(
      'Must have 1-20 attendees'
    );
  });

  it('throws error when attendees array is too large', async () => {
    const dataWithTooManyAttendees = {
      eventId: 'test-event-id',
      familyName: 'Test Family',
      email: 'test@example.com',
      attendees: new Array(21).fill({
        name: 'Test Child',
        age: 8,
        isAdult: false,
      }),
    };

    await expect(submitRSVP(dataWithTooManyAttendees, mockContext)).rejects.toThrow(
      'Must have 1-20 attendees'
    );
  });

  it('throws error when user already has RSVP for event', async () => {
    // Mock existing RSVP
    const existingRSVPQuery = {
      empty: false,
      docs: [{ id: 'existing-rsvp' }],
    };

    mockDb.collection.mockImplementation((collectionName: string) => {
      if (collectionName === 'events') {
        return {
          doc: jest.fn(() => ({
            get: jest.fn().mockResolvedValue(mockEventDoc),
          })),
        };
      }
      if (collectionName === 'rsvps') {
        return {
          where: jest.fn(() => ({
            get: jest.fn().mockResolvedValue(existingRSVPQuery),
          })),
        };
      }
      return {};
    });

    const rsvpData = {
      eventId: 'test-event-id',
      familyName: 'Test Family',
      email: 'test@example.com',
      attendees: [{ name: 'Test Child', age: 8, isAdult: false }],
    };

    await expect(submitRSVP(rsvpData, mockContext)).rejects.toThrow(
      'You already have an RSVP for this event'
    );
  });

  it('throws error when event is not found', async () => {
    // Mock non-existent event
    const nonExistentEventDoc = {
      exists: false,
    };

    mockDb.collection.mockImplementation((collectionName: string) => {
      if (collectionName === 'events') {
        return {
          doc: jest.fn(() => ({
            get: jest.fn().mockResolvedValue(nonExistentEventDoc),
          })),
        };
      }
      if (collectionName === 'rsvps') {
        return {
          where: jest.fn(() => ({
            get: jest.fn().mockResolvedValue(mockRSVPQuery),
          })),
        };
      }
      return {};
    });

    const rsvpData = {
      eventId: 'non-existent-event',
      familyName: 'Test Family',
      email: 'test@example.com',
      attendees: [{ name: 'Test Child', age: 8, isAdult: false }],
    };

    await expect(submitRSVP(rsvpData, mockContext)).rejects.toThrow(
      'Event not found'
    );
  });

  it('throws error when event is at capacity', async () => {
    // Mock event at capacity
    const eventAtCapacity = {
      exists: true,
      data: () => ({
        title: 'Test Event',
        maxCapacity: 1,
        currentRSVPs: 1,
      }),
    };

    // Mock RSVP count function to return 1
    const mockRSVPCountQuery = {
      docs: [
        {
          data: () => ({
            attendees: [{ name: 'Existing Child' }],
          }),
        },
      ],
    };

    mockDb.collection.mockImplementation((collectionName: string) => {
      if (collectionName === 'events') {
        return {
          doc: jest.fn(() => ({
            get: jest.fn().mockResolvedValue(eventAtCapacity),
          })),
        };
      }
      if (collectionName === 'rsvps') {
        return {
          where: jest.fn(() => ({
            get: jest.fn().mockResolvedValue(mockRSVPQuery),
            select: jest.fn(() => ({
              get: jest.fn().mockResolvedValue(mockRSVPCountQuery),
            })),
          })),
          doc: jest.fn(() => ({
            id: 'test-rsvp-id',
          })),
        };
      }
      return {};
    });

    const rsvpData = {
      eventId: 'test-event-id',
      familyName: 'Test Family',
      email: 'test@example.com',
      attendees: [{ name: 'Test Child', age: 8, isAdult: false }],
    };

    await expect(submitRSVP(rsvpData, mockContext)).rejects.toThrow(
      'Event is at capacity. Only 0 spots remaining.'
    );
  });

  it('handles database errors gracefully', async () => {
    // Mock database error
    mockDb.collection.mockImplementation(() => {
      throw new Error('Database connection failed');
    });

    const rsvpData = {
      eventId: 'test-event-id',
      familyName: 'Test Family',
      email: 'test@example.com',
      attendees: [{ name: 'Test Child', age: 8, isAdult: false }],
    };

    await expect(submitRSVP(rsvpData, mockContext)).rejects.toThrow(
      'Failed to submit RSVP'
    );
  });

  it('updates event statistics correctly', async () => {
    // Mock existing event stats
    const existingStatsDoc = {
      exists: true,
      data: () => ({
        rsvpCount: 5,
        attendeeCount: 5,
      }),
    };

    mockDb.collection.mockImplementation((collectionName: string) => {
      if (collectionName === 'events') {
        return {
          doc: jest.fn(() => ({
            get: jest.fn().mockResolvedValue(mockEventDoc),
          })),
        };
      }
      if (collectionName === 'rsvps') {
        return {
          where: jest.fn(() => ({
            get: jest.fn().mockResolvedValue(mockRSVPQuery),
          })),
          doc: jest.fn(() => ({
            id: 'test-rsvp-id',
          })),
        };
      }
      if (collectionName === 'eventStats') {
        return {
          doc: jest.fn(() => ({
            get: jest.fn().mockResolvedValue(existingStatsDoc),
          })),
        };
      }
      return {};
    });

    const rsvpData = {
      eventId: 'test-event-id',
      familyName: 'Test Family',
      email: 'test@example.com',
      attendees: [
        { name: 'Test Child 1', age: 8, isAdult: false },
        { name: 'Test Child 2', age: 10, isAdult: false },
      ],
    };

    const result = await submitRSVP(rsvpData, mockContext);

    expect(result.success).toBe(true);
    expect(mockBatch.update).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        rsvpCount: 7, // 5 existing + 2 new
        attendeeCount: 7,
      })
    );
  });
});
