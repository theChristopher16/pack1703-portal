/**
 * Unit tests for getPendingAccountRequests Cloud Function
 * Tests the fix for Firestore index requirement by removing orderBy and using JavaScript sorting
 */

// Mock Firebase Admin
const mockFirestore = {
  collection: jest.fn(() => ({
    where: jest.fn(() => ({
      limit: jest.fn(() => ({
        startAfter: jest.fn(() => ({
          get: jest.fn()
        })),
        get: jest.fn()
      })),
      startAfter: jest.fn(() => ({
        get: jest.fn()
      })),
      get: jest.fn()
    })),
    doc: jest.fn(() => ({
      get: jest.fn()
    })),
    select: jest.fn(() => ({
      get: jest.fn()
    }))
  }))
};

const mockFunctions = {
  https: {
    HttpsError: class MockHttpsError extends Error {
      constructor(public code: string, message: string) {
        super(message);
        this.name = 'HttpsError';
      }
    },
    onCall: jest.fn((handler) => handler)
  }
};

// Mock the Firebase Admin module
jest.mock('firebase-admin', () => ({
  firestore: () => mockFirestore,
  auth: () => ({
    verifyIdToken: jest.fn()
  })
}));

// Mock Firebase Functions
jest.mock('firebase-functions', () => mockFunctions);

describe('getPendingAccountRequests', () => {
  let getPendingAccountRequests: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Import the function after mocking
    const functionsModule = require('../../functions/src/index');
    getPendingAccountRequests = functionsModule.getPendingAccountRequests;
  });

  describe('successful data retrieval', () => {
    it('should return pending account requests sorted by submittedAt desc', async () => {
      // Mock user authentication and admin permissions
      const mockUserDoc = {
        exists: true,
        data: () => ({ role: 'admin' })
      };
      
      const mockRequestsData = [
        {
          id: 'request1',
          data: () => ({
            email: 'user1@example.com',
            displayName: 'User One',
            status: 'pending',
            submittedAt: { toDate: () => new Date('2024-01-01') }
          })
        },
        {
          id: 'request2', 
          data: () => ({
            email: 'user2@example.com',
            displayName: 'User Two',
            status: 'pending',
            submittedAt: { toDate: () => new Date('2024-01-02') }
          })
        }
      ];

      const mockCountData = [
        { id: 'request1' },
        { id: 'request2' }
      ];

      // Setup mocks
      mockFirestore.collection.mockImplementation((collectionName: string) => {
        if (collectionName === 'users') {
          return {
            doc: jest.fn(() => ({
              get: jest.fn().mockResolvedValue(mockUserDoc)
            }))
          };
        } else if (collectionName === 'accountRequests') {
          return {
            where: jest.fn(() => ({
              limit: jest.fn(() => ({
                get: jest.fn().mockResolvedValue({
                  docs: mockRequestsData
                })
              })),
              select: jest.fn(() => ({
                get: jest.fn().mockResolvedValue({
                  docs: mockCountData
                })
              }))
            }))
          };
        }
        return mockFirestore.collection();
      });

      const mockContext = {
        auth: { uid: 'test-user-id' }
      };

      const mockData = { pageSize: 20 };

      const result = await getPendingAccountRequests(mockData, mockContext);

      expect(result.success).toBe(true);
      expect(result.requests).toHaveLength(2);
      expect(result.count).toBe(2);
      expect(result.totalCount).toBe(2);
      expect(result.hasMore).toBe(false);
      
      // Verify requests are sorted by submittedAt desc (most recent first)
      expect(result.requests[0].email).toBe('user2@example.com');
      expect(result.requests[1].email).toBe('user1@example.com');
    });

    it('should handle requests without submittedAt gracefully', async () => {
      const mockUserDoc = {
        exists: true,
        data: () => ({ role: 'admin' })
      };
      
      const mockRequestsData = [
        {
          id: 'request1',
          data: () => ({
            email: 'user1@example.com',
            displayName: 'User One',
            status: 'pending',
            submittedAt: null
          })
        }
      ];

      const mockCountData = [{ id: 'request1' }];

      mockFirestore.collection.mockImplementation((collectionName: string) => {
        if (collectionName === 'users') {
          return {
            doc: jest.fn(() => ({
              get: jest.fn().mockResolvedValue(mockUserDoc)
            }))
          };
        } else if (collectionName === 'accountRequests') {
          return {
            where: jest.fn(() => ({
              limit: jest.fn(() => ({
                get: jest.fn().mockResolvedValue({
                  docs: mockRequestsData
                })
              })),
              select: jest.fn(() => ({
                get: jest.fn().mockResolvedValue({
                  docs: mockCountData
                })
              }))
            }))
          };
        }
        return mockFirestore.collection();
      });

      const mockContext = {
        auth: { uid: 'test-user-id' }
      };

      const mockData = { pageSize: 20 };

      const result = await getPendingAccountRequests(mockData, mockContext);

      expect(result.success).toBe(true);
      expect(result.requests).toHaveLength(1);
      expect(result.requests[0].email).toBe('user1@example.com');
    });
  });

  describe('error handling', () => {
    it('should throw permission denied for non-admin users', async () => {
      const mockUserDoc = {
        exists: true,
        data: () => ({ role: 'user' })
      };

      mockFirestore.collection.mockImplementation((collectionName: string) => {
        if (collectionName === 'users') {
          return {
            doc: jest.fn(() => ({
              get: jest.fn().mockResolvedValue(mockUserDoc)
            }))
          };
        }
        return mockFirestore.collection();
      });

      const mockContext = {
        auth: { uid: 'test-user-id' }
      };

      const mockData = { pageSize: 20 };

      await expect(getPendingAccountRequests(mockData, mockContext))
        .rejects
        .toThrow('Insufficient permissions to view account requests');
    });

    it('should throw unauthenticated error when no auth context', async () => {
      const mockContext = { auth: null };
      const mockData = { pageSize: 20 };

      await expect(getPendingAccountRequests(mockData, mockContext))
        .rejects
        .toThrow('User must be authenticated');
    });
  });
});
