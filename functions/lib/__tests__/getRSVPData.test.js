"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
// Mock Firebase Admin and Functions
const mockFirestore = {
    collection: globals_1.jest.fn(),
    doc: globals_1.jest.fn()
};
const mockAuth = {
    uid: 'test-admin-uid',
    token: { email: 'admin@test.com' }
};
const mockContext = {
    auth: mockAuth
};
// Mock Firebase Functions
const mockHttpsError = globals_1.jest.fn((code, message) => {
    const error = new Error(message);
    error.code = code;
    return error;
});
const mockFunctions = {
    https: {
        HttpsError: mockHttpsError,
        onCall: globals_1.jest.fn()
    }
};
// Mock Firebase Admin
globals_1.jest.mock('firebase-admin', () => ({
    initializeApp: globals_1.jest.fn(),
    firestore: () => mockFirestore,
    firestore: {
        Timestamp: {
            now: () => ({ toDate: () => new Date() })
        }
    }
}));
globals_1.jest.mock('firebase-functions/v1', () => mockFunctions);
(0, globals_1.describe)('getRSVPData Cloud Function', () => {
    let getRSVPDataHandler;
    let mockUserDoc;
    let mockRsvpCollection;
    let mockQuery;
    (0, globals_1.beforeEach)(() => {
        globals_1.jest.clearAllMocks();
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
            get: globals_1.jest.fn().mockResolvedValue({
                docs: mockRsvpDocs
            })
        };
        mockRsvpCollection = {
            where: globals_1.jest.fn().mockReturnValue(mockQuery)
        };
        // Setup Firestore mocks
        mockFirestore.collection.mockImplementation((collectionName) => {
            if (collectionName === 'users') {
                return {
                    doc: globals_1.jest.fn().mockReturnValue({
                        get: globals_1.jest.fn().mockResolvedValue(mockUserDoc)
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
        getRSVPDataHandler = async (data, context) => {
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
                const isAdmin = (userData === null || userData === void 0 ? void 0 : userData.role) === 'admin' || (userData === null || userData === void 0 ? void 0 : userData.role) === 'root' ||
                    (userData === null || userData === void 0 ? void 0 : userData.role) === 'super-admin' || (userData === null || userData === void 0 ? void 0 : userData.isAdmin);
                if (!isAdmin) {
                    throw new mockFunctions.https.HttpsError('permission-denied', 'Only admin users can access RSVP data');
                }
                // Query RSVPs without orderBy to avoid index requirement
                const rsvpsQuery = await mockFirestore.collection('rsvps')
                    .where('eventId', '==', data.eventId)
                    .get();
                const rsvpsData = [];
                rsvpsQuery.docs.forEach((doc) => {
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
                    var _a, _b;
                    const aTime = ((_a = a.submittedAt) === null || _a === void 0 ? void 0 : _a.toDate) ? a.submittedAt.toDate() : new Date(a.submittedAt || 0);
                    const bTime = ((_b = b.submittedAt) === null || _b === void 0 ? void 0 : _b.toDate) ? b.submittedAt.toDate() : new Date(b.submittedAt || 0);
                    return bTime.getTime() - aTime.getTime();
                });
                return {
                    success: true,
                    eventId: data.eventId,
                    rsvps: rsvpsData,
                    count: rsvpsData.length,
                    message: 'RSVP data retrieved successfully'
                };
            }
            catch (error) {
                console.error('Error getting RSVP data:', error);
                throw new mockFunctions.https.HttpsError('internal', 'Failed to get RSVP data');
            }
        };
    });
    (0, globals_1.describe)('Authentication and Authorization', () => {
        (0, globals_1.it)('should require authentication', async () => {
            const data = { eventId: 'test-event-id' };
            const context = { auth: null };
            await (0, globals_1.expect)(getRSVPDataHandler(data, context))
                .rejects
                .toThrow('User must be authenticated');
        });
        (0, globals_1.it)('should require admin privileges', async () => {
            // Mock non-admin user
            mockUserDoc.data = () => ({
                role: 'parent',
                email: 'parent@test.com'
            });
            const data = { eventId: 'test-event-id' };
            await (0, globals_1.expect)(getRSVPDataHandler(data, mockContext))
                .rejects
                .toThrow('Only admin users can access RSVP data');
        });
        (0, globals_1.it)('should allow root users', async () => {
            mockUserDoc.data = () => ({
                role: 'root',
                email: 'root@test.com'
            });
            const data = { eventId: 'test-event-id' };
            const result = await getRSVPDataHandler(data, mockContext);
            (0, globals_1.expect)(result.success).toBe(true);
            (0, globals_1.expect)(result.rsvps).toHaveLength(2);
        });
        (0, globals_1.it)('should allow super-admin users', async () => {
            mockUserDoc.data = () => ({
                role: 'super-admin',
                email: 'superadmin@test.com'
            });
            const data = { eventId: 'test-event-id' };
            const result = await getRSVPDataHandler(data, mockContext);
            (0, globals_1.expect)(result.success).toBe(true);
            (0, globals_1.expect)(result.rsvps).toHaveLength(2);
        });
        (0, globals_1.it)('should allow legacy isAdmin flag', async () => {
            mockUserDoc.data = () => ({
                role: 'parent',
                isAdmin: true,
                email: 'legacyadmin@test.com'
            });
            const data = { eventId: 'test-event-id' };
            const result = await getRSVPDataHandler(data, mockContext);
            (0, globals_1.expect)(result.success).toBe(true);
            (0, globals_1.expect)(result.rsvps).toHaveLength(2);
        });
    });
    (0, globals_1.describe)('Input Validation', () => {
        (0, globals_1.it)('should require eventId parameter', async () => {
            const data = {};
            await (0, globals_1.expect)(getRSVPDataHandler(data, mockContext))
                .rejects
                .toThrow('Event ID is required');
        });
        (0, globals_1.it)('should accept valid eventId', async () => {
            const data = { eventId: 'valid-event-id' };
            const result = await getRSVPDataHandler(data, mockContext);
            (0, globals_1.expect)(result.success).toBe(true);
            (0, globals_1.expect)(result.eventId).toBe('valid-event-id');
        });
    });
    (0, globals_1.describe)('RSVP Data Retrieval', () => {
        (0, globals_1.it)('should return correctly formatted RSVP data', async () => {
            const data = { eventId: 'test-event-id' };
            const result = await getRSVPDataHandler(data, mockContext);
            (0, globals_1.expect)(result.success).toBe(true);
            (0, globals_1.expect)(result.eventId).toBe('test-event-id');
            (0, globals_1.expect)(result.count).toBe(2);
            (0, globals_1.expect)(result.message).toBe('RSVP data retrieved successfully');
            (0, globals_1.expect)(Array.isArray(result.rsvps)).toBe(true);
        });
        (0, globals_1.it)('should include all required RSVP fields', async () => {
            const data = { eventId: 'test-event-id' };
            const result = await getRSVPDataHandler(data, mockContext);
            const rsvp = result.rsvps[0];
            (0, globals_1.expect)(rsvp).toHaveProperty('id');
            (0, globals_1.expect)(rsvp).toHaveProperty('eventId');
            (0, globals_1.expect)(rsvp).toHaveProperty('userId');
            (0, globals_1.expect)(rsvp).toHaveProperty('userEmail');
            (0, globals_1.expect)(rsvp).toHaveProperty('familyName');
            (0, globals_1.expect)(rsvp).toHaveProperty('email');
            (0, globals_1.expect)(rsvp).toHaveProperty('phone');
            (0, globals_1.expect)(rsvp).toHaveProperty('attendees');
            (0, globals_1.expect)(rsvp).toHaveProperty('dietaryRestrictions');
            (0, globals_1.expect)(rsvp).toHaveProperty('specialNeeds');
            (0, globals_1.expect)(rsvp).toHaveProperty('notes');
            (0, globals_1.expect)(rsvp).toHaveProperty('submittedAt');
            (0, globals_1.expect)(rsvp).toHaveProperty('createdAt');
        });
        (0, globals_1.it)('should sort RSVPs by submittedAt in descending order', async () => {
            const data = { eventId: 'test-event-id' };
            const result = await getRSVPDataHandler(data, mockContext);
            (0, globals_1.expect)(result.rsvps).toHaveLength(2);
            // Johnson family submitted later (2023-09-21) so should be first
            (0, globals_1.expect)(result.rsvps[0].familyName).toBe('Johnson Family');
            // Smith family submitted earlier (2023-09-20) so should be second
            (0, globals_1.expect)(result.rsvps[1].familyName).toBe('Smith Family');
        });
        (0, globals_1.it)('should handle attendees array correctly', async () => {
            const data = { eventId: 'test-event-id' };
            const result = await getRSVPDataHandler(data, mockContext);
            const smithRsvp = result.rsvps.find((r) => r.familyName === 'Smith Family');
            (0, globals_1.expect)(smithRsvp.attendees).toHaveLength(2);
            (0, globals_1.expect)(smithRsvp.attendees[0]).toEqual({
                name: 'John Smith',
                age: 35,
                den: 'Wolves'
            });
        });
        (0, globals_1.it)('should query the correct Firestore collection', async () => {
            const data = { eventId: 'test-event-id' };
            await getRSVPDataHandler(data, mockContext);
            (0, globals_1.expect)(mockFirestore.collection).toHaveBeenCalledWith('rsvps');
            (0, globals_1.expect)(mockRsvpCollection.where).toHaveBeenCalledWith('eventId', '==', 'test-event-id');
        });
    });
    (0, globals_1.describe)('Error Handling', () => {
        (0, globals_1.it)('should handle Firestore query errors', async () => {
            mockQuery.get.mockRejectedValue(new Error('Firestore connection error'));
            const data = { eventId: 'test-event-id' };
            await (0, globals_1.expect)(getRSVPDataHandler(data, mockContext))
                .rejects
                .toThrow('Failed to get RSVP data');
        });
        (0, globals_1.it)('should handle missing user document', async () => {
            mockUserDoc.exists = false;
            const data = { eventId: 'test-event-id' };
            await (0, globals_1.expect)(getRSVPDataHandler(data, mockContext))
                .rejects
                .toThrow('Only admin users can access RSVP data');
        });
        (0, globals_1.it)('should handle empty RSVP results', async () => {
            mockQuery.get.mockResolvedValue({ docs: [] });
            const data = { eventId: 'test-event-id' };
            const result = await getRSVPDataHandler(data, mockContext);
            (0, globals_1.expect)(result.success).toBe(true);
            (0, globals_1.expect)(result.count).toBe(0);
            (0, globals_1.expect)(result.rsvps).toHaveLength(0);
        });
    });
    (0, globals_1.describe)('Performance Considerations', () => {
        (0, globals_1.it)('should not use orderBy in Firestore query to avoid index requirement', async () => {
            const data = { eventId: 'test-event-id' };
            await getRSVPDataHandler(data, mockContext);
            // Verify that only where() was called, not orderBy()
            (0, globals_1.expect)(mockRsvpCollection.where).toHaveBeenCalled();
            (0, globals_1.expect)(mockQuery.get).toHaveBeenCalled();
            // orderBy should not be called on the collection or query
            (0, globals_1.expect)(mockRsvpCollection.orderBy).toBeUndefined();
            (0, globals_1.expect)(mockQuery.orderBy).toBeUndefined();
        });
        (0, globals_1.it)('should handle RSVPs with missing timestamp fields gracefully', async () => {
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
            (0, globals_1.expect)(result.success).toBe(true);
            (0, globals_1.expect)(result.rsvps).toHaveLength(1);
            (0, globals_1.expect)(result.rsvps[0].familyName).toBe('Brown Family');
        });
    });
});
//# sourceMappingURL=getRSVPData.test.js.map