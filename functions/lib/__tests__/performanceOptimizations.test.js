"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const index_1 = require("../../functions/src/index");
// Mock Firebase Admin
const mockAdmin = {
    firestore: globals_1.jest.fn(() => ({
        collection: globals_1.jest.fn(() => ({
            where: globals_1.jest.fn(() => ({
                get: globals_1.jest.fn(),
                select: globals_1.jest.fn(() => ({
                    get: globals_1.jest.fn()
                })),
                orderBy: globals_1.jest.fn(() => ({
                    limit: globals_1.jest.fn(() => ({
                        get: globals_1.jest.fn()
                    }))
                })),
                startAfter: globals_1.jest.fn(() => ({
                    get: globals_1.jest.fn()
                }))
            })),
            doc: globals_1.jest.fn(() => ({
                get: globals_1.jest.fn(),
                update: globals_1.jest.fn(),
                delete: globals_1.jest.fn()
            })),
            add: globals_1.jest.fn(),
            get: globals_1.jest.fn()
        }))
    }))
};
// Mock Firebase Functions
const mockFunctions = {
    https: {
        HttpsError: globals_1.jest.fn()
    }
};
// Mock context
const mockContext = {
    auth: {
        uid: 'test-user-id'
    },
    rawRequest: {
        ip: '127.0.0.1',
        headers: {
            'user-agent': 'test-agent'
        }
    }
};
(0, globals_1.describe)('Firestore Performance Optimizations', () => {
    (0, globals_1.beforeEach)(() => {
        globals_1.jest.clearAllMocks();
    });
    (0, globals_1.describe)('getBatchRSVPCounts', () => {
        (0, globals_1.it)('should return batch RSVP counts successfully', async () => {
            const mockRSVPs = [
                { id: 'rsvp1', data: () => ({ eventId: 'event1', attendees: [{ name: 'John' }, { name: 'Jane' }] }) },
                { id: 'rsvp2', data: () => ({ eventId: 'event1', attendees: [{ name: 'Bob' }] }) },
                { id: 'rsvp3', data: () => ({ eventId: 'event2', attendees: [{ name: 'Alice' }] }) }
            ];
            const mockQuery = {
                get: globals_1.jest.fn().mockResolvedValue({
                    docs: mockRSVPs
                })
            };
            const mockCollection = globals_1.jest.fn(() => ({
                where: globals_1.jest.fn(() => mockQuery)
            }));
            mockAdmin.firestore().collection = mockCollection;
            const data = { eventIds: ['event1', 'event2'] };
            const result = await (0, index_1.getBatchRSVPCounts)(data, mockContext);
            (0, globals_1.expect)(result.success).toBe(true);
            (0, globals_1.expect)(result.rsvpCounts).toEqual({
                event1: 3, // 2 + 1 attendees
                event2: 1 // 1 attendee
            });
        });
        (0, globals_1.it)('should handle empty event IDs array', async () => {
            const data = { eventIds: [] };
            const result = await (0, index_1.getBatchRSVPCounts)(data, mockContext);
            (0, globals_1.expect)(result.success).toBe(true);
            (0, globals_1.expect)(result.rsvpCounts).toEqual({});
        });
        (0, globals_1.it)('should handle authentication errors', async () => {
            const data = { eventIds: ['event1'] };
            const contextWithoutAuth = Object.assign(Object.assign({}, mockContext), { auth: null });
            await (0, globals_1.expect)((0, index_1.getBatchRSVPCounts)(data, contextWithoutAuth))
                .rejects.toThrow('User must be authenticated');
        });
        (0, globals_1.it)('should handle permission errors', async () => {
            const mockUserDoc = {
                exists: false
            };
            const mockDoc = globals_1.jest.fn(() => ({
                get: globals_1.jest.fn().mockResolvedValue(mockUserDoc)
            }));
            const mockCollection = globals_1.jest.fn(() => ({
                doc: mockDoc
            }));
            mockAdmin.firestore().collection = mockCollection;
            const data = { eventIds: ['event1'] };
            await (0, globals_1.expect)((0, index_1.getBatchRSVPCounts)(data, mockContext))
                .rejects.toThrow('User not found');
        });
    });
    (0, globals_1.describe)('getBatchDashboardData', () => {
        (0, globals_1.it)('should return batch dashboard data successfully', async () => {
            const mockSnapshots = [
                { size: 25 }, // users
                { size: 15 }, // events
                { docs: [{ id: 'ann1', data: () => ({ title: 'Test Announcement' }) }] }, // announcements
                { size: 8 }, // locations
                { size: 3 }, // account requests
                { docs: [{ id: 'log1', data: () => ({ action: 'test', timestamp: { toDate: () => new Date() } }) }] } // audit logs
            ];
            const mockQuery = {
                get: globals_1.jest.fn().mockResolvedValue(mockSnapshots[0]),
                select: globals_1.jest.fn(() => ({
                    get: globals_1.jest.fn().mockResolvedValue(mockSnapshots[0])
                })),
                orderBy: globals_1.jest.fn(() => ({
                    limit: globals_1.jest.fn(() => ({
                        get: globals_1.jest.fn().mockResolvedValue(mockSnapshots[2])
                    }))
                }))
            };
            const mockCollection = globals_1.jest.fn(() => ({
                where: globals_1.jest.fn(() => mockQuery),
                select: globals_1.jest.fn(() => mockQuery),
                orderBy: globals_1.jest.fn(() => mockQuery)
            }));
            mockAdmin.firestore().collection = mockCollection;
            // Mock user document
            const mockUserDoc = {
                exists: true,
                data: () => ({
                    role: 'admin',
                    isAdmin: true
                })
            };
            const mockDoc = globals_1.jest.fn(() => ({
                get: globals_1.jest.fn().mockResolvedValue(mockUserDoc)
            }));
            mockCollection.mockImplementation((collectionName) => {
                if (collectionName === 'users') {
                    return { doc: mockDoc };
                }
                return {
                    where: globals_1.jest.fn(() => mockQuery),
                    select: globals_1.jest.fn(() => mockQuery),
                    orderBy: globals_1.jest.fn(() => mockQuery)
                };
            });
            const data = {};
            const result = await (0, index_1.getBatchDashboardData)(data, mockContext);
            (0, globals_1.expect)(result.success).toBe(true);
            (0, globals_1.expect)(result.dashboardStats).toBeDefined();
            (0, globals_1.expect)(result.systemHealth).toBeDefined();
            (0, globals_1.expect)(result.auditLogs).toBeDefined();
        });
        (0, globals_1.it)('should handle permission errors', async () => {
            const mockUserDoc = {
                exists: true,
                data: () => ({
                    role: 'parent',
                    isAdmin: false
                })
            };
            const mockDoc = globals_1.jest.fn(() => ({
                get: globals_1.jest.fn().mockResolvedValue(mockUserDoc)
            }));
            const mockCollection = globals_1.jest.fn(() => ({
                doc: mockDoc
            }));
            mockAdmin.firestore().collection = mockCollection;
            const data = {};
            await (0, globals_1.expect)((0, index_1.getBatchDashboardData)(data, mockContext))
                .rejects.toThrow('Insufficient permissions to access dashboard data');
        });
    });
    (0, globals_1.describe)('getPendingAccountRequests', () => {
        (0, globals_1.it)('should return paginated account requests successfully', async () => {
            const mockRequests = [
                { id: 'req1', data: () => ({ email: 'test1@example.com', status: 'pending' }) },
                { id: 'req2', data: () => ({ email: 'test2@example.com', status: 'pending' }) }
            ];
            const mockQuery = {
                get: globals_1.jest.fn().mockResolvedValue({
                    docs: mockRequests
                })
            };
            const mockCollection = globals_1.jest.fn(() => ({
                where: globals_1.jest.fn(() => ({
                    orderBy: globals_1.jest.fn(() => ({
                        limit: globals_1.jest.fn(() => mockQuery)
                    }))
                }))
            }));
            mockAdmin.firestore().collection = mockCollection;
            // Mock user document
            const mockUserDoc = {
                exists: true,
                data: () => ({
                    role: 'admin',
                    isAdmin: true
                })
            };
            const mockDoc = globals_1.jest.fn(() => ({
                get: globals_1.jest.fn().mockResolvedValue(mockUserDoc)
            }));
            mockCollection.mockImplementation((collectionName) => {
                if (collectionName === 'users') {
                    return { doc: mockDoc };
                }
                return {
                    where: globals_1.jest.fn(() => ({
                        orderBy: globals_1.jest.fn(() => ({
                            limit: globals_1.jest.fn(() => mockQuery)
                        }))
                    }))
                };
            });
            const data = { pageSize: 20 };
            const result = await (0, index_1.getPendingAccountRequests)(data, mockContext);
            (0, globals_1.expect)(result.success).toBe(true);
            (0, globals_1.expect)(result.requests).toHaveLength(2);
            (0, globals_1.expect)(result.count).toBe(2);
            (0, globals_1.expect)(result.hasMore).toBeDefined();
        });
        (0, globals_1.it)('should handle cursor-based pagination', async () => {
            const mockRequests = [
                { id: 'req1', data: () => ({ email: 'test1@example.com', status: 'pending' }) }
            ];
            const mockLastDoc = {
                exists: true,
                data: () => ({ email: 'test1@example.com' })
            };
            const mockQuery = {
                get: globals_1.jest.fn().mockResolvedValue({
                    docs: mockRequests
                }),
                startAfter: globals_1.jest.fn(() => mockQuery)
            };
            const mockCollection = globals_1.jest.fn(() => ({
                where: globals_1.jest.fn(() => ({
                    orderBy: globals_1.jest.fn(() => ({
                        limit: globals_1.jest.fn(() => mockQuery)
                    }))
                })),
                doc: globals_1.jest.fn(() => ({
                    get: globals_1.jest.fn().mockResolvedValue(mockLastDoc)
                }))
            }));
            mockAdmin.firestore().collection = mockCollection;
            // Mock user document
            const mockUserDoc = {
                exists: true,
                data: () => ({
                    role: 'admin',
                    isAdmin: true
                })
            };
            const mockDoc = globals_1.jest.fn(() => ({
                get: globals_1.jest.fn().mockResolvedValue(mockUserDoc)
            }));
            mockCollection.mockImplementation((collectionName) => {
                if (collectionName === 'users') {
                    return { doc: mockDoc };
                }
                return {
                    where: globals_1.jest.fn(() => ({
                        orderBy: globals_1.jest.fn(() => ({
                            limit: globals_1.jest.fn(() => mockQuery)
                        }))
                    })),
                    doc: globals_1.jest.fn(() => ({
                        get: globals_1.jest.fn().mockResolvedValue(mockLastDoc)
                    }))
                };
            });
            const data = { pageSize: 20, lastDocId: 'req1' };
            const result = await (0, index_1.getPendingAccountRequests)(data, mockContext);
            (0, globals_1.expect)(result.success).toBe(true);
            (0, globals_1.expect)(mockQuery.startAfter).toHaveBeenCalled();
        });
    });
});
//# sourceMappingURL=performanceOptimizations.test.js.map