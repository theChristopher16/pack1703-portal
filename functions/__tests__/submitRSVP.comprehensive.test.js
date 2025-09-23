const test = require('firebase-functions-test')();
const admin = require('firebase-admin');

// Mock Firebase Admin
jest.mock('firebase-admin', () => ({
  initializeApp: jest.fn(),
  firestore: jest.fn(() => ({
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        get: jest.fn(),
        update: jest.fn()
      })),
      add: jest.fn()
    })),
    batch: jest.fn(() => ({
      set: jest.fn(),
      update: jest.fn(),
      commit: jest.fn()
    }))
  })),
  auth: jest.fn(() => ({
    verifyIdToken: jest.fn()
  }))
}));

// Import the function to test
const { submitRSVP } = require('../../../functions/src/index');

describe('submitRSVP Cloud Function', () => {
  let mockContext;
  let mockDb;
  let mockBatch;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock context
    mockContext = {
      auth: {
        uid: 'test-user-id',
        token: {
          email: 'test@example.com'
        }
      }
    };

    // Mock Firestore
    mockDb = admin.firestore();
    mockBatch = mockDb.batch();
    
    // Mock batch methods
    mockBatch.set = jest.fn();
    mockBatch.update = jest.fn();
    mockBatch.commit = jest.fn().mockResolvedValue(undefined);
    
    mockDb.batch.mockReturnValue(mockBatch);
  });

  describe('Authentication', () => {
    it('should reject unauthenticated requests', async () => {
      const mockData = {
        eventId: 'test-event-id',
        attendees: [{ name: 'John Smith', age: 8 }]
      };

      const unauthenticatedContext = { auth: null };

      await expect(submitRSVP(mockData, unauthenticatedContext))
        .rejects.toThrow('User must be authenticated');
    });
  });

  describe('Input Validation', () => {
    it('should reject requests missing eventId', async () => {
      const mockData = {
        attendees: [{ name: 'John Smith', age: 8 }]
      };

      await expect(submitRSVP(mockData, mockContext))
        .rejects.toThrow('Missing required fields: eventId and attendees');
    });

    it('should reject requests missing attendees', async () => {
      const mockData = {
        eventId: 'test-event-id'
      };

      await expect(submitRSVP(mockData, mockContext))
        .rejects.toThrow('Missing required fields: eventId and attendees');
    });

    it('should reject requests with invalid attendees array', async () => {
      const mockData = {
        eventId: 'test-event-id',
        attendees: 'not-an-array'
      };

      await expect(submitRSVP(mockData, mockContext))
        .rejects.toThrow('Missing required fields: eventId and attendees');
    });
  });

  describe('Event Validation', () => {
    it('should reject RSVP for non-existent event', async () => {
      const mockData = {
        eventId: 'non-existent-event',
        attendees: [{ name: 'John Smith', age: 8 }]
      };

      // Mock event not found
      const mockEventDoc = {
        exists: () => false
      };
      
      mockDb.collection().doc().get.mockResolvedValue(mockEventDoc);

      await expect(submitRSVP(mockData, mockContext))
        .rejects.toThrow('Event not found');
    });

    it('should reject RSVP when event is at capacity', async () => {
      const mockData = {
        eventId: 'test-event-id',
        attendees: [
          { name: 'John Smith', age: 8 },
          { name: 'Jane Smith', age: 8 }
        ]
      };

      // Mock event at capacity (48/50, trying to add 2 more)
      const mockEventDoc = {
        exists: () => true,
        data: () => ({
          currentParticipants: 48,
          capacity: 50
        })
      };
      
      mockDb.collection().doc().get.mockResolvedValue(mockEventDoc);

      await expect(submitRSVP(mockData, mockContext))
        .rejects.toThrow('Event is at capacity. Only 2 spots remaining.');
    });
  });

  describe('Successful RSVP Submission', () => {
    it('should successfully submit RSVP and update event count', async () => {
      const mockData = {
        eventId: 'test-event-id',
        familyName: 'Smith Family',
        email: 'smith@example.com',
        phone: '555-1234',
        attendees: [
          { name: 'John Smith', age: 8, den: 'Wolves', isAdult: false },
          { name: 'Jane Smith', age: 35, den: 'Adult', isAdult: true }
        ],
        dietaryRestrictions: 'No nuts',
        specialNeeds: 'Wheelchair accessible',
        notes: 'Looking forward to the event!'
      };

      // Mock event with available capacity
      const mockEventDoc = {
        exists: () => true,
        data: () => ({
          currentParticipants: 3,
          capacity: 50,
          title: 'Test Event'
        })
      };
      
      mockDb.collection().doc().get.mockResolvedValue(mockEventDoc);

      const result = await submitRSVP(mockData, mockContext);

      // Verify batch operations
      expect(mockBatch.set).toHaveBeenCalledWith(
        expect.anything(), // RSVP document reference
        expect.objectContaining({
          ...mockData,
          userId: 'test-user-id',
          userEmail: 'test@example.com',
          attendeeCount: 2,
          submittedAt: expect.anything()
        })
      );

      expect(mockBatch.update).toHaveBeenCalledWith(
        expect.anything(), // Event document reference
        {
          currentParticipants: 5, // 3 + 2 attendees
          updatedAt: expect.anything()
        }
      );

      expect(mockBatch.commit).toHaveBeenCalled();

      // Verify return value
      expect(result).toEqual({
        success: true,
        rsvpId: expect.any(String),
        newRSVPCount: 5,
        message: 'RSVP submitted successfully'
      });
    });

    it('should handle unlimited capacity events', async () => {
      const mockData = {
        eventId: 'test-event-id',
        attendees: [{ name: 'John Smith', age: 8 }]
      };

      // Mock event with unlimited capacity
      const mockEventDoc = {
        exists: () => true,
        data: () => ({
          currentParticipants: 10,
          capacity: null // Unlimited capacity
        })
      };
      
      mockDb.collection().doc().get.mockResolvedValue(mockEventDoc);

      const result = await submitRSVP(mockData, mockContext);

      expect(result.success).toBe(true);
      expect(result.newRSVPCount).toBe(11); // 10 + 1 attendee
    });
  });

  describe('Error Handling', () => {
    it('should handle Firestore errors gracefully', async () => {
      const mockData = {
        eventId: 'test-event-id',
        attendees: [{ name: 'John Smith', age: 8 }]
      };

      // Mock Firestore error
      mockDb.collection().doc().get.mockRejectedValue(new Error('Firestore error'));

      await expect(submitRSVP(mockData, mockContext))
        .rejects.toThrow('Failed to submit RSVP');
    });

    it('should handle batch commit errors', async () => {
      const mockData = {
        eventId: 'test-event-id',
        attendees: [{ name: 'John Smith', age: 8 }]
      };

      // Mock event
      const mockEventDoc = {
        exists: () => true,
        data: () => ({
          currentParticipants: 3,
          capacity: 50
        })
      };
      
      mockDb.collection().doc().get.mockResolvedValue(mockEventDoc);
      
      // Mock batch commit error
      mockBatch.commit.mockRejectedValue(new Error('Batch commit failed'));

      await expect(submitRSVP(mockData, mockContext))
        .rejects.toThrow('Failed to submit RSVP');
    });
  });

  describe('Data Integrity', () => {
    it('should use atomic batch operations', async () => {
      const mockData = {
        eventId: 'test-event-id',
        attendees: [{ name: 'John Smith', age: 8 }]
      };

      const mockEventDoc = {
        exists: () => true,
        data: () => ({
          currentParticipants: 3,
          capacity: 50
        })
      };
      
      mockDb.collection().doc().get.mockResolvedValue(mockEventDoc);

      await submitRSVP(mockData, mockContext);

      // Verify batch was used for atomic operations
      expect(mockDb.batch).toHaveBeenCalled();
      expect(mockBatch.set).toHaveBeenCalled();
      expect(mockBatch.update).toHaveBeenCalled();
      expect(mockBatch.commit).toHaveBeenCalled();
    });

    it('should preserve all RSVP data fields', async () => {
      const mockData = {
        eventId: 'test-event-id',
        familyName: 'Smith Family',
        email: 'smith@example.com',
        phone: '555-1234',
        attendees: [
          { name: 'John Smith', age: 8, den: 'Wolves', isAdult: false },
          { name: 'Jane Smith', age: 35, den: 'Adult', isAdult: true }
        ],
        dietaryRestrictions: 'No nuts',
        specialNeeds: 'Wheelchair accessible',
        notes: 'Looking forward to the event!',
        ipHash: 'test-ip-hash',
        userAgent: 'test-user-agent'
      };

      const mockEventDoc = {
        exists: () => true,
        data: () => ({
          currentParticipants: 3,
          capacity: 50
        })
      };
      
      mockDb.collection().doc().get.mockResolvedValue(mockEventDoc);

      await submitRSVP(mockData, mockContext);

      expect(mockBatch.set).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          familyName: 'Smith Family',
          email: 'smith@example.com',
          phone: '555-1234',
          attendees: expect.arrayContaining([
            expect.objectContaining({
              name: 'John Smith',
              age: 8,
              den: 'Wolves',
              isAdult: false
            }),
            expect.objectContaining({
              name: 'Jane Smith',
              age: 35,
              den: 'Adult',
              isAdult: true
            })
          ]),
          dietaryRestrictions: 'No nuts',
          specialNeeds: 'Wheelchair accessible',
          notes: 'Looking forward to the event!',
          ipHash: 'test-ip-hash',
          userAgent: 'test-user-agent'
        })
      );
    });
  });
});
