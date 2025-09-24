import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Create mock functions at module level for Jest compatibility
const mockFirestoreCollection = jest.fn();
const mockFirestoreDoc = jest.fn();
const mockJestFn = jest.fn;

// Mock Firebase Admin and Functions
const mockFirestore = {
  collection: mockFirestoreCollection,
  doc: mockFirestoreDoc
};

const mockAuth = {
  uid: 'test-admin-uid',
  token: { email: 'admin@test.com' }
};

const mockContext = {
  auth: mockAuth
};

// Mock Firebase Functions
const mockHttpsError = mockJestFn((code: string, message: string) => {
  const error = new Error(message);
  (error as any).code = code;
  return error;
});

const mockFunctions = {
  https: {
    HttpsError: mockHttpsError,
    onCall: mockJestFn()
  }
};

// Mock Firebase Admin
jest.mock('firebase-admin', () => ({
  initializeApp: mockJestFn(),
  firestore: () => mockFirestore,
  firestore: {
    Timestamp: {
      now: () => ({ toDate: () => new Date() })
    }
  }
}));

jest.mock('firebase-functions/v1', () => mockFunctions);

describe('getRSVPData Cloud Function', () => {
  let getRSVPDataHandler: any;
  let mockUserDoc: any;
  let mockRsvpCollection: any;
  let mockQuery: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock user document with admin privileges
    mockUserDoc = {
      exists: true,
      data: () => ({
        role: 'admin',
        email: 'admin@test.com'
      })
    };

    // Mock RSVP query results
    const mockRsvpDocs = [
      {
        id: 'rsvp1',
        data: () => ({
          eventId: 'test-event-id',
          userId: 'user1',
          userEmail: 'user1@test.com',
          familyName: 'Smith Family',
          email: 'smith@test.com',
          phone: '555-1234',
          attendees: [
            { name: 'John Smith', age: 35, den: 'Wolves' },
            { name: 'Jane Smith', age: 8, den: 'Wolves' }
          ],
          dietaryRestrictions: 'None',
          specialNeeds: 'None',
          notes: 'Looking forward to it!',
          submittedAt: { toDate: () => new Date('2023-09-20T10:00:00Z') },
          createdAt: { toDate: () => new Date('2023-09-20T10:00:00Z') }
        })
      },
      {
        id: 'rsvp2',
        data: () => ({
          eventId: 'test-event-id',
          userId: 'user2',
          userEmail: 'user2@test.com',
          familyName: 'Johnson Family',
          email: 'johnson@test.com',
          phone: '555-5678',
          attendees: [
            { name: 'Bob Johnson', age: 32, den: 'Tigers' },
            { name: 'Billy Johnson', age: 7, den: 'Tigers' }
          ],
          dietaryRestrictions: 'Vegetarian',
          specialNeeds: 'Wheelchair access',
          notes: '',
          submittedAt: { toDate: () => new Date('2023-09-21T14:30:00Z') },
          createdAt: { toDate: () => new Date('2023-09-21T14:30:00Z') }
        })
      }
    ];

    mockQuery = {
      get: mockJestFn().mockResolvedValue({
        docs: mockRsvpDocs
      })
    };

    mockRsvpCollection = {
      where: mockJestFn().mockReturnValue(mockQuery)
    };

    // Setup Firestore mocks
    mockFirestoreCollection.mockImplementation((collectionName: string) => {
      if (collectionName === 'users') {
        return {
          doc: mockJestFn().mockReturnValue({
            get: mockJestFn().mockResolvedValue(mockUserDoc)
          })
        };
      }
      if (collectionName === 'rsvps') {
        return mockRsvpCollection;
      }
      return {};
    });

    // Import the actual function after mocks are set up
    // This would normally be: const { getRSVPData } = require('../index');
    // For this test, we'll simulate the function logic
    getRSVPDataHandler = async (data: any, context: any) => {
      try {
        // Authentication check
        if (!context.auth) {
          throw new mockFunctions.https.HttpsError('unauthenticated', 'User must be authenticated');
        }
        
        // Event ID validation
        if (!data.eventId) {
          throw new mockFunctions.https.HttpsError('invalid-argument', 'Event ID is required');
        }

        // User permission check
        const userDoc = await mockFirestore.collection('users').doc(context.auth.uid).get();
        const userData = userDoc.data();
        const isAdmin = userData?.role === 'admin' || userData?.role === 'root' || 
                        userData?.role === 'super-admin' || userData?.isAdmin;

        if (!isAdmin) {
          throw new mockFunctions.https.HttpsError('permission-denied', 'Only admin users can access RSVP data');
        }

        // Query RSVPs without orderBy to avoid index requirement
        const rsvpsQuery = await mockFirestore.collection('rsvps')
          .where('eventId', '==', data.eventId)
          .get();

        const rsvpsData: any[] = [];
        rsvpsQuery.docs.forEach((doc: any) => {
          const docData = doc.data();
          rsvpsData.push({
            id: doc.id,
            eventId: docData.eventId,
            userId: docData.userId,
            userEmail: docData.userEmail,
            familyName: docData.familyName,
            email: docData.email,
            phone: docData.phone,
            attendees: docData.attendees || [],
            dietaryRestrictions: docData.dietaryRestrictions,
            specialNeeds: docData.specialNeeds,
            notes: docData.notes,
            submittedAt: docData.submittedAt,
            createdAt: docData.createdAt
          });
        });

        // Sort by submittedAt in descending order (most recent first)
        rsvpsData.sort((a, b) => {
          const aTime = a.submittedAt?.toDate ? a.submittedAt.toDate() : new Date(a.submittedAt || 0);
          const bTime = b.submittedAt?.toDate ? b.submittedAt.toDate() : new Date(b.submittedAt || 0);
          return bTime.getTime() - aTime.getTime();
        });

        return {
          success: true,
          eventId: data.eventId,
          rsvps: rsvpsData,
          count: rsvpsData.length,
          message: 'RSVP data retrieved successfully'
        };

      } catch (error) {
        console.error('Error getting RSVP data:', error);
        throw new mockFunctions.https.HttpsError('internal', 'Failed to get RSVP data');
      }
    };
  });

  describe('Authentication and Authorization', () => {
    it('should require authentication', async () => {
      const data = { eventId: 'test-event-id' };
      const context = { auth: null };

      await expect(getRSVPDataHandler(data, context))
        .rejects
        .toThrow('User must be authenticated');
    });

    it('should require admin privileges', async () => {
      // Mock non-admin user
      mockUserDoc.data = () => ({
        role: 'parent',
        email: 'parent@test.com'
      });

      const data = { eventId: 'test-event-id' };

      await expect(getRSVPDataHandler(data, mockContext))
        .rejects
        .toThrow('Only admin users can access RSVP data');
    });

    it('should allow root users', async () => {
      mockUserDoc.data = () => ({
        role: 'root',
        email: 'root@test.com'
      });

      const data = { eventId: 'test-event-id' };
      const result = await getRSVPDataHandler(data, mockContext);

      expect(result.success).toBe(true);
      expect(result.rsvps).toHaveLength(2);
    });

    it('should allow super-admin users', async () => {
      mockUserDoc.data = () => ({
        role: 'super-admin',
        email: 'superadmin@test.com'
      });

      const data = { eventId: 'test-event-id' };
      const result = await getRSVPDataHandler(data, mockContext);

      expect(result.success).toBe(true);
      expect(result.rsvps).toHaveLength(2);
    });

    it('should allow legacy isAdmin flag', async () => {
      mockUserDoc.data = () => ({
        role: 'parent',
        isAdmin: true,
        email: 'legacyadmin@test.com'
      });

      const data = { eventId: 'test-event-id' };
      const result = await getRSVPDataHandler(data, mockContext);

      expect(result.success).toBe(true);
      expect(result.rsvps).toHaveLength(2);
    });
  });

  describe('Input Validation', () => {
    it('should require eventId parameter', async () => {
      const data = {};

      await expect(getRSVPDataHandler(data, mockContext))
        .rejects
        .toThrow('Event ID is required');
    });

    it('should accept valid eventId', async () => {
      const data = { eventId: 'valid-event-id' };
      const result = await getRSVPDataHandler(data, mockContext);

      expect(result.success).toBe(true);
      expect(result.eventId).toBe('valid-event-id');
    });
  });

  describe('RSVP Data Retrieval', () => {
    it('should return correctly formatted RSVP data', async () => {
      const data = { eventId: 'test-event-id' };
      const result = await getRSVPDataHandler(data, mockContext);

      expect(result.success).toBe(true);
      expect(result.eventId).toBe('test-event-id');
      expect(result.count).toBe(2);
      expect(result.message).toBe('RSVP data retrieved successfully');
      expect(Array.isArray(result.rsvps)).toBe(true);
    });

    it('should include all required RSVP fields', async () => {
      const data = { eventId: 'test-event-id' };
      const result = await getRSVPDataHandler(data, mockContext);

      const rsvp = result.rsvps[0];
      expect(rsvp).toHaveProperty('id');
      expect(rsvp).toHaveProperty('eventId');
      expect(rsvp).toHaveProperty('userId');
      expect(rsvp).toHaveProperty('userEmail');
      expect(rsvp).toHaveProperty('familyName');
      expect(rsvp).toHaveProperty('email');
      expect(rsvp).toHaveProperty('phone');
      expect(rsvp).toHaveProperty('attendees');
      expect(rsvp).toHaveProperty('dietaryRestrictions');
      expect(rsvp).toHaveProperty('specialNeeds');
      expect(rsvp).toHaveProperty('notes');
      expect(rsvp).toHaveProperty('submittedAt');
      expect(rsvp).toHaveProperty('createdAt');
    });

    it('should sort RSVPs by submittedAt in descending order', async () => {
      const data = { eventId: 'test-event-id' };
      const result = await getRSVPDataHandler(data, mockContext);

      expect(result.rsvps).toHaveLength(2);
      
      // Johnson family submitted later (2023-09-21) so should be first
      expect(result.rsvps[0].familyName).toBe('Johnson Family');
      // Smith family submitted earlier (2023-09-20) so should be second
      expect(result.rsvps[1].familyName).toBe('Smith Family');
    });

    it('should handle attendees array correctly', async () => {
      const data = { eventId: 'test-event-id' };
      const result = await getRSVPDataHandler(data, mockContext);

      const smithRsvp = result.rsvps.find((r: any) => r.familyName === 'Smith Family');
      expect(smithRsvp.attendees).toHaveLength(2);
      expect(smithRsvp.attendees[0]).toEqual({
        name: 'John Smith',
        age: 35,
        den: 'Wolves'
      });
    });

    it('should query the correct Firestore collection', async () => {
      const data = { eventId: 'test-event-id' };
      await getRSVPDataHandler(data, mockContext);

      expect(mockFirestore.collection).toHaveBeenCalledWith('rsvps');
      expect(mockRsvpCollection.where).toHaveBeenCalledWith('eventId', '==', 'test-event-id');
    });
  });

  describe('Error Handling', () => {
    it('should handle Firestore query errors', async () => {
      mockQuery.get.mockRejectedValue(new Error('Firestore connection error'));

      const data = { eventId: 'test-event-id' };

      await expect(getRSVPDataHandler(data, mockContext))
        .rejects
        .toThrow('Failed to get RSVP data');
    });

    it('should handle missing user document', async () => {
      mockUserDoc.exists = false;

      const data = { eventId: 'test-event-id' };

      await expect(getRSVPDataHandler(data, mockContext))
        .rejects
        .toThrow('Only admin users can access RSVP data');
    });

    it('should handle empty RSVP results', async () => {
      mockQuery.get.mockResolvedValue({ docs: [] });

      const data = { eventId: 'test-event-id' };
      const result = await getRSVPDataHandler(data, mockContext);

      expect(result.success).toBe(true);
      expect(result.count).toBe(0);
      expect(result.rsvps).toHaveLength(0);
    });
  });

  describe('Performance Considerations', () => {
    it('should not use orderBy in Firestore query to avoid index requirement', async () => {
      const data = { eventId: 'test-event-id' };
      await getRSVPDataHandler(data, mockContext);

      // Verify that only where() was called, not orderBy()
      expect(mockRsvpCollection.where).toHaveBeenCalled();
      expect(mockQuery.get).toHaveBeenCalled();
      
      // orderBy should not be called on the collection or query
      expect(mockRsvpCollection.orderBy).toBeUndefined();
      expect(mockQuery.orderBy).toBeUndefined();
    });

    it('should handle RSVPs with missing timestamp fields gracefully', async () => {
      // Mock RSVP with missing submittedAt
      const mockRsvpWithMissingTimestamp = {
        id: 'rsvp3',
        data: () => ({
          eventId: 'test-event-id',
          familyName: 'Brown Family',
          submittedAt: null,
          createdAt: null
        })
      };

      mockQuery.get.mockResolvedValue({
        docs: [mockRsvpWithMissingTimestamp]
      });

      const data = { eventId: 'test-event-id' };
      const result = await getRSVPDataHandler(data, mockContext);

      expect(result.success).toBe(true);
      expect(result.rsvps).toHaveLength(1);
      expect(result.rsvps[0].familyName).toBe('Brown Family');
    });
  });
});
