"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const admin = require("firebase-admin");
const index_1 = require("../index");
// Mock Firebase Admin
globals_1.jest.mock('firebase-admin', () => ({
    initializeApp: globals_1.jest.fn(),
    firestore: globals_1.jest.fn(() => ({
        collection: globals_1.jest.fn(() => ({
            doc: globals_1.jest.fn(() => ({
                get: globals_1.jest.fn(),
                set: globals_1.jest.fn(),
                update: globals_1.jest.fn(),
            })),
            where: globals_1.jest.fn(() => ({
                get: globals_1.jest.fn(),
                select: globals_1.jest.fn(() => ({
                    get: globals_1.jest.fn(),
                })),
            })),
            add: globals_1.jest.fn(),
        })),
        batch: globals_1.jest.fn(() => ({
            set: globals_1.jest.fn(),
            update: globals_1.jest.fn(),
            commit: globals_1.jest.fn(),
        })),
    })),
    auth: globals_1.jest.fn(),
}));
// Mock functions
globals_1.jest.mock('firebase-functions', () => ({
    https: {
        onCall: globals_1.jest.fn((handler) => handler),
        HttpsError: class extends Error {
            constructor(code, message) {
                super(message);
                this.code = code;
            }
        },
        CallableContext: globals_1.jest.fn(),
    },
}));
(0, globals_1.describe)('submitRSVP Cloud Function', () => {
    let mockDb;
    let mockContext;
    let mockEventDoc;
    let mockRSVPQuery;
    let mockBatch;
    (0, globals_1.beforeEach)(() => {
        globals_1.jest.clearAllMocks();
        // Mock Firestore database
        mockDb = {
            collection: globals_1.jest.fn(),
            batch: globals_1.jest.fn(),
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
            set: globals_1.jest.fn(),
            update: globals_1.jest.fn(),
            commit: globals_1.jest.fn().mockResolvedValue(undefined),
        };
        // Setup collection mocks
        mockDb.collection.mockImplementation((collectionName) => {
            if (collectionName === 'events') {
                return {
                    doc: globals_1.jest.fn(() => ({
                        get: globals_1.jest.fn().mockResolvedValue(mockEventDoc),
                    })),
                };
            }
            if (collectionName === 'rsvps') {
                return {
                    where: globals_1.jest.fn(() => ({
                        get: globals_1.jest.fn().mockResolvedValue(mockRSVPQuery),
                    })),
                    doc: globals_1.jest.fn(() => ({
                        id: 'test-rsvp-id',
                    })),
                };
            }
            if (collectionName === 'eventStats') {
                return {
                    doc: globals_1.jest.fn(() => ({
                        get: globals_1.jest.fn().mockResolvedValue({ exists: false }),
                    })),
                };
            }
            return {};
        });
        mockDb.batch.mockReturnValue(mockBatch);
        // Mock admin.firestore
        admin.firestore.mockReturnValue(mockDb);
    });
    (0, globals_1.it)('successfully submits RSVP with valid data', async () => {
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
        const result = await (0, index_1.submitRSVP)(validRSVPData, mockContext);
        (0, globals_1.expect)(result).toEqual({
            success: true,
            rsvpId: 'test-rsvp-id',
            newRSVPCount: 1,
            message: 'RSVP submitted successfully',
        });
        (0, globals_1.expect)(mockDb.collection).toHaveBeenCalledWith('events');
        (0, globals_1.expect)(mockDb.collection).toHaveBeenCalledWith('rsvps');
        (0, globals_1.expect)(mockDb.collection).toHaveBeenCalledWith('eventStats');
        (0, globals_1.expect)(mockBatch.commit).toHaveBeenCalled();
    });
    (0, globals_1.it)('throws error when user is not authenticated', async () => {
        const unauthenticatedContext = {
            auth: null,
        };
        const rsvpData = {
            eventId: 'test-event-id',
            familyName: 'Test Family',
            email: 'test@example.com',
            attendees: [{ name: 'Test Child', age: 8, isAdult: false }],
        };
        await (0, globals_1.expect)((0, index_1.submitRSVP)(rsvpData, unauthenticatedContext)).rejects.toThrow('User must be authenticated to RSVP');
    });
    (0, globals_1.it)('throws error when required fields are missing', async () => {
        const incompleteData = {
            eventId: 'test-event-id',
            // Missing familyName, email, attendees
        };
        await (0, globals_1.expect)((0, index_1.submitRSVP)(incompleteData, mockContext)).rejects.toThrow('Missing required RSVP data');
    });
    (0, globals_1.it)('throws error when attendees array is empty', async () => {
        const dataWithNoAttendees = {
            eventId: 'test-event-id',
            familyName: 'Test Family',
            email: 'test@example.com',
            attendees: [],
        };
        await (0, globals_1.expect)((0, index_1.submitRSVP)(dataWithNoAttendees, mockContext)).rejects.toThrow('Must have 1-20 attendees');
    });
    (0, globals_1.it)('throws error when attendees array is too large', async () => {
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
        await (0, globals_1.expect)((0, index_1.submitRSVP)(dataWithTooManyAttendees, mockContext)).rejects.toThrow('Must have 1-20 attendees');
    });
    (0, globals_1.it)('throws error when user already has RSVP for event', async () => {
        // Mock existing RSVP
        const existingRSVPQuery = {
            empty: false,
            docs: [{ id: 'existing-rsvp' }],
        };
        mockDb.collection.mockImplementation((collectionName) => {
            if (collectionName === 'events') {
                return {
                    doc: globals_1.jest.fn(() => ({
                        get: globals_1.jest.fn().mockResolvedValue(mockEventDoc),
                    })),
                };
            }
            if (collectionName === 'rsvps') {
                return {
                    where: globals_1.jest.fn(() => ({
                        get: globals_1.jest.fn().mockResolvedValue(existingRSVPQuery),
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
        await (0, globals_1.expect)((0, index_1.submitRSVP)(rsvpData, mockContext)).rejects.toThrow('You already have an RSVP for this event');
    });
    (0, globals_1.it)('throws error when event is not found', async () => {
        // Mock non-existent event
        const nonExistentEventDoc = {
            exists: false,
        };
        mockDb.collection.mockImplementation((collectionName) => {
            if (collectionName === 'events') {
                return {
                    doc: globals_1.jest.fn(() => ({
                        get: globals_1.jest.fn().mockResolvedValue(nonExistentEventDoc),
                    })),
                };
            }
            if (collectionName === 'rsvps') {
                return {
                    where: globals_1.jest.fn(() => ({
                        get: globals_1.jest.fn().mockResolvedValue(mockRSVPQuery),
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
        await (0, globals_1.expect)((0, index_1.submitRSVP)(rsvpData, mockContext)).rejects.toThrow('Event not found');
    });
    (0, globals_1.it)('throws error when event is at capacity', async () => {
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
        mockDb.collection.mockImplementation((collectionName) => {
            if (collectionName === 'events') {
                return {
                    doc: globals_1.jest.fn(() => ({
                        get: globals_1.jest.fn().mockResolvedValue(eventAtCapacity),
                    })),
                };
            }
            if (collectionName === 'rsvps') {
                return {
                    where: globals_1.jest.fn(() => ({
                        get: globals_1.jest.fn().mockResolvedValue(mockRSVPQuery),
                        select: globals_1.jest.fn(() => ({
                            get: globals_1.jest.fn().mockResolvedValue(mockRSVPCountQuery),
                        })),
                    })),
                    doc: globals_1.jest.fn(() => ({
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
        await (0, globals_1.expect)((0, index_1.submitRSVP)(rsvpData, mockContext)).rejects.toThrow('Event is at capacity. Only 0 spots remaining.');
    });
    (0, globals_1.it)('handles database errors gracefully', async () => {
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
        await (0, globals_1.expect)((0, index_1.submitRSVP)(rsvpData, mockContext)).rejects.toThrow('Failed to submit RSVP');
    });
    (0, globals_1.it)('updates event statistics correctly', async () => {
        // Mock existing event stats
        const existingStatsDoc = {
            exists: true,
            data: () => ({
                rsvpCount: 5,
                attendeeCount: 5,
            }),
        };
        mockDb.collection.mockImplementation((collectionName) => {
            if (collectionName === 'events') {
                return {
                    doc: globals_1.jest.fn(() => ({
                        get: globals_1.jest.fn().mockResolvedValue(mockEventDoc),
                    })),
                };
            }
            if (collectionName === 'rsvps') {
                return {
                    where: globals_1.jest.fn(() => ({
                        get: globals_1.jest.fn().mockResolvedValue(mockRSVPQuery),
                    })),
                    doc: globals_1.jest.fn(() => ({
                        id: 'test-rsvp-id',
                    })),
                };
            }
            if (collectionName === 'eventStats') {
                return {
                    doc: globals_1.jest.fn(() => ({
                        get: globals_1.jest.fn().mockResolvedValue(existingStatsDoc),
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
        const result = await (0, index_1.submitRSVP)(rsvpData, mockContext);
        (0, globals_1.expect)(result.success).toBe(true);
        (0, globals_1.expect)(mockBatch.update).toHaveBeenCalledWith(globals_1.expect.any(Object), globals_1.expect.objectContaining({
            rsvpCount: 7, // 5 existing + 2 new
            attendeeCount: 7,
        }));
    });
});
//# sourceMappingURL=submitRSVP.test.js.map