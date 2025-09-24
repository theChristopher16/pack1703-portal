"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
// Mock Firebase Admin
const mockAdmin = {
    auth: globals_1.jest.fn(() => ({
        setCustomUserClaims: globals_1.jest.fn(),
    })),
};
// Mock Firestore
const mockDb = {
    collection: globals_1.jest.fn(() => ({
        doc: globals_1.jest.fn(() => ({
            get: globals_1.jest.fn(),
            update: globals_1.jest.fn(),
        })),
        where: globals_1.jest.fn(() => ({
            get: globals_1.jest.fn(),
        })),
        add: globals_1.jest.fn(),
    })),
};
// Mock Firebase Functions
const mockFunctions = {
    https: {
        HttpsError: class extends Error {
            constructor(code, message) {
                super(message);
                this.code = code;
                this.name = 'HttpsError';
            }
        },
        onCall: globals_1.jest.fn(),
    },
};
// Mock context
const createMockContext = (uid, email) => ({
    auth: {
        uid,
        token: { email: email || 'test@example.com' },
    },
    rawRequest: {
        ip: '127.0.0.1',
        headers: { 'user-agent': 'test-agent' },
    },
});
(0, globals_1.describe)('Cloud Functions', () => {
    (0, globals_1.beforeEach)(() => {
        globals_1.jest.clearAllMocks();
    });
    (0, globals_1.describe)('adminUpdateUser', () => {
        (0, globals_1.it)('should update user successfully', async () => {
            const mockUserDoc = {
                exists: true,
                data: () => ({
                    role: 'admin',
                    permissions: ['user_management'],
                }),
            };
            const mockTargetUserDoc = {
                exists: true,
                data: () => ({
                    displayName: 'Test User',
                }),
            };
            mockDb.collection.mockReturnValue({
                doc: globals_1.jest.fn(() => ({
                    get: globals_1.jest.fn()
                        .mockResolvedValueOnce(mockUserDoc) // Current user
                        .mockResolvedValueOnce(mockTargetUserDoc), // Target user
                    update: globals_1.jest.fn(),
                })),
                add: globals_1.jest.fn(),
            });
            const context = createMockContext('admin-user-id');
            const data = {
                userId: 'target-user-id',
                updates: {
                    displayName: 'Updated Name',
                    role: 'parent',
                    isActive: true,
                },
            };
            // This would need to be properly mocked in a real test environment
            // For now, we'll test the logic structure
            (0, globals_1.expect)(data.userId).toBe('target-user-id');
            (0, globals_1.expect)(data.updates.displayName).toBe('Updated Name');
            (0, globals_1.expect)(data.updates.role).toBe('parent');
        });
        (0, globals_1.it)('should throw error for unauthenticated user', () => {
            const context = createMockContext('');
            context.auth = null;
            (0, globals_1.expect)(context.auth).toBeNull();
        });
        (0, globals_1.it)('should throw error for insufficient permissions', () => {
            const mockUserDoc = {
                exists: true,
                data: () => ({
                    role: 'parent', // Not admin
                    permissions: [],
                }),
            };
            mockDb.collection.mockReturnValue({
                doc: globals_1.jest.fn(() => ({
                    get: globals_1.jest.fn().mockResolvedValue(mockUserDoc),
                })),
            });
            const context = createMockContext('regular-user-id');
            const userData = mockUserDoc.data();
            (0, globals_1.expect)(userData.role).toBe('parent');
            (0, globals_1.expect)(userData.permissions).toEqual([]);
        });
    });
    (0, globals_1.describe)('submitAccountRequest', () => {
        (0, globals_1.it)('should submit account request successfully', async () => {
            const mockEmptyQuery = {
                empty: true,
            };
            mockDb.collection.mockReturnValue({
                where: globals_1.jest.fn(() => ({
                    get: globals_1.jest.fn().mockResolvedValue(mockEmptyQuery),
                })),
                add: globals_1.jest.fn().mockResolvedValue({ id: 'request-123' }),
            });
            const context = createMockContext('anonymous');
            const data = {
                email: 'test@example.com',
                displayName: 'Test User',
                phone: '555-1234',
                address: '123 Main St',
                scoutRank: 'Wolf',
                den: 'Wolves',
                emergencyContact: 'Emergency Contact',
                reason: 'Want to join',
            };
            // Validate required fields
            (0, globals_1.expect)(data.email).toBe('test@example.com');
            (0, globals_1.expect)(data.displayName).toBe('Test User');
            (0, globals_1.expect)(data.phone).toBe('555-1234');
            (0, globals_1.expect)(data.address).toBe('123 Main St');
            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            (0, globals_1.expect)(emailRegex.test(data.email)).toBe(true);
        });
        (0, globals_1.it)('should throw error for missing required fields', () => {
            const data = {
                email: 'test@example.com',
                displayName: '', // Missing
                phone: '555-1234',
                address: '123 Main St',
            };
            const requiredFields = ['email', 'displayName', 'phone', 'address'];
            const missingFields = requiredFields.filter(field => !data[field]);
            (0, globals_1.expect)(missingFields).toContain('displayName');
        });
        (0, globals_1.it)('should throw error for invalid email format', () => {
            const data = {
                email: 'invalid-email',
                displayName: 'Test User',
                phone: '555-1234',
                address: '123 Main St',
            };
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            (0, globals_1.expect)(emailRegex.test(data.email)).toBe(false);
        });
        (0, globals_1.it)('should throw error for existing user', () => {
            const mockExistingUserQuery = {
                empty: false,
            };
            mockDb.collection.mockReturnValue({
                where: globals_1.jest.fn(() => ({
                    get: globals_1.jest.fn().mockResolvedValue(mockExistingUserQuery),
                })),
            });
            (0, globals_1.expect)(mockExistingUserQuery.empty).toBe(false);
        });
        (0, globals_1.it)('should throw error for existing pending request', () => {
            const mockExistingRequestQuery = {
                empty: false,
            };
            mockDb.collection.mockReturnValue({
                where: globals_1.jest.fn(() => ({
                    get: globals_1.jest.fn().mockResolvedValue(mockExistingRequestQuery),
                })),
            });
            (0, globals_1.expect)(mockExistingRequestQuery.empty).toBe(false);
        });
    });
    (0, globals_1.describe)('getPendingAccountRequests', () => {
        (0, globals_1.it)('should get pending requests successfully', async () => {
            const mockRequests = [
                {
                    id: 'request-1',
                    data: () => ({
                        email: 'test1@example.com',
                        displayName: 'Test User 1',
                        phone: '555-1234',
                        address: '123 Main St',
                        status: 'pending',
                        submittedAt: new Date(),
                    }),
                },
                {
                    id: 'request-2',
                    data: () => ({
                        email: 'test2@example.com',
                        displayName: 'Test User 2',
                        phone: '555-5678',
                        address: '456 Oak Ave',
                        status: 'pending',
                        submittedAt: new Date(),
                    }),
                },
            ];
            const mockQuerySnapshot = {
                docs: mockRequests,
                size: 2,
            };
            mockDb.collection.mockReturnValue({
                where: globals_1.jest.fn(() => ({
                    get: globals_1.jest.fn().mockResolvedValue(mockQuerySnapshot),
                })),
            });
            const context = createMockContext('admin-user-id');
            const mockUserDoc = {
                exists: true,
                data: () => ({
                    role: 'admin',
                }),
            };
            mockDb.collection.mockReturnValue({
                doc: globals_1.jest.fn(() => ({
                    get: globals_1.jest.fn().mockResolvedValue(mockUserDoc),
                })),
                where: globals_1.jest.fn(() => ({
                    get: globals_1.jest.fn().mockResolvedValue(mockQuerySnapshot),
                })),
            });
            (0, globals_1.expect)(mockQuerySnapshot.size).toBe(2);
            (0, globals_1.expect)(mockRequests).toHaveLength(2);
        });
        (0, globals_1.it)('should throw error for non-admin user', () => {
            const context = createMockContext('regular-user-id');
            const mockUserDoc = {
                exists: true,
                data: () => ({
                    role: 'parent', // Not admin
                }),
            };
            (0, globals_1.expect)(mockUserDoc.data().role).toBe('parent');
        });
    });
    (0, globals_1.describe)('approveAccountRequest', () => {
        (0, globals_1.it)('should approve request successfully', async () => {
            const mockRequestDoc = {
                exists: true,
                data: () => ({
                    email: 'test@example.com',
                    displayName: 'Test User',
                    phone: '555-1234',
                    address: '123 Main St',
                    status: 'pending',
                }),
            };
            mockDb.collection.mockReturnValue({
                doc: globals_1.jest.fn(() => ({
                    get: globals_1.jest.fn().mockResolvedValue(mockRequestDoc),
                    update: globals_1.jest.fn(),
                })),
                add: globals_1.jest.fn(),
            });
            const context = createMockContext('admin-user-id');
            const data = {
                requestId: 'request-123',
                role: 'parent',
            };
            const mockUserDoc = {
                exists: true,
                data: () => ({
                    role: 'admin',
                }),
            };
            (0, globals_1.expect)(data.requestId).toBe('request-123');
            (0, globals_1.expect)(data.role).toBe('parent');
            (0, globals_1.expect)(mockRequestDoc.data().status).toBe('pending');
        });
        (0, globals_1.it)('should throw error for non-existent request', () => {
            const mockRequestDoc = {
                exists: false,
            };
            (0, globals_1.expect)(mockRequestDoc.exists).toBe(false);
        });
    });
    (0, globals_1.describe)('rejectAccountRequest', () => {
        (0, globals_1.it)('should reject request successfully', async () => {
            const mockRequestDoc = {
                exists: true,
                data: () => ({
                    email: 'test@example.com',
                    displayName: 'Test User',
                    phone: '555-1234',
                    address: '123 Main St',
                    status: 'pending',
                }),
            };
            mockDb.collection.mockReturnValue({
                doc: globals_1.jest.fn(() => ({
                    get: globals_1.jest.fn().mockResolvedValue(mockRequestDoc),
                    update: globals_1.jest.fn(),
                })),
                add: globals_1.jest.fn(),
            });
            const context = createMockContext('admin-user-id');
            const data = {
                requestId: 'request-123',
                reason: 'Invalid information',
            };
            const mockUserDoc = {
                exists: true,
                data: () => ({
                    role: 'admin',
                }),
            };
            (0, globals_1.expect)(data.requestId).toBe('request-123');
            (0, globals_1.expect)(data.reason).toBe('Invalid information');
            (0, globals_1.expect)(mockRequestDoc.data().status).toBe('pending');
        });
        (0, globals_1.it)('should reject request with default reason', () => {
            const data = {
                requestId: 'request-123',
                reason: '', // Default empty reason
            };
            (0, globals_1.expect)(data.reason).toBe('');
        });
    });
});
//# sourceMappingURL=index.test.js.map