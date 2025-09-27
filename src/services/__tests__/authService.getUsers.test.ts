import { authService } from '../authService';
import { db } from '../firestore';
import { collection, query, getDocs } from 'firebase/firestore';

// Mock Firebase
jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(),
  collection: jest.fn(),
  query: jest.fn(),
  getDocs: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  updateDoc: jest.fn(),
  addDoc: jest.fn(),
  deleteDoc: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  startAfter: jest.fn(),
  Timestamp: {
    now: jest.fn(() => ({ toDate: () => new Date() }))
  }
}));

jest.mock('../firestore', () => ({
  db: {}
}));

const mockDb = db as jest.Mocked<typeof db>;
const mockCollection = collection as jest.MockedFunction<typeof collection>;
const mockQuery = query as jest.MockedFunction<typeof query>;
const mockGetDocs = getDocs as jest.MockedFunction<typeof getDocs>;

describe('AuthService getUsers Method', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns all users including Gina Messa', async () => {
    const mockUsers = [
      {
        id: 'user1',
        data: () => ({
          email: 'user1@test.com',
          displayName: 'User One',
          role: 'parent',
          status: 'approved',
          profile: { den: 'Wolf' },
          createdAt: { toDate: () => new Date() },
          updatedAt: { toDate: () => new Date() },
          isActive: true,
          permissions: []
        })
      },
      {
        id: 'gina-messa',
        data: () => ({
          email: 'gina_daigle@yahoo.com',
          displayName: 'Gina Messa',
          role: 'parent',
          status: 'approved',
          profile: { den: 'Bear' },
          createdAt: { toDate: () => new Date() },
          updatedAt: { toDate: () => new Date() },
          isActive: true,
          permissions: []
        })
      },
      {
        id: 'user2',
        data: () => ({
          email: 'user2@test.com',
          displayName: 'User Two',
          role: 'leader',
          status: 'approved',
          profile: { den: 'Tiger' },
          createdAt: { toDate: () => new Date() },
          updatedAt: { toDate: () => new Date() },
          isActive: true,
          permissions: []
        })
      }
    ];

    mockCollection.mockReturnValue({} as any);
    mockQuery.mockReturnValue({} as any);
    mockGetDocs.mockResolvedValue({
      docs: mockUsers
    } as any);

    const users = await authService.getUsers();

    expect(users).toHaveLength(3);
    expect(users.find(u => u.email === 'gina_daigle@yahoo.com')).toBeDefined();
    expect(users.find(u => u.displayName === 'Gina Messa')).toBeDefined();
  });

  test('filters out denied users', async () => {
    const mockUsers = [
      {
        id: 'user1',
        data: () => ({
          email: 'user1@test.com',
          displayName: 'User One',
          role: 'parent',
          status: 'approved',
          profile: { den: 'Wolf' },
          createdAt: { toDate: () => new Date() },
          updatedAt: { toDate: () => new Date() },
          isActive: true,
          permissions: []
        })
      },
      {
        id: 'denied-user',
        data: () => ({
          email: 'denied@test.com',
          displayName: 'Denied User',
          role: 'parent',
          status: 'denied',
          profile: { den: 'Wolf' },
          createdAt: { toDate: () => new Date() },
          updatedAt: { toDate: () => new Date() },
          isActive: true,
          permissions: []
        })
      },
      {
        id: 'rejected-user',
        data: () => ({
          email: 'rejected@test.com',
          displayName: 'Rejected User',
          role: 'parent',
          status: 'rejected',
          profile: { den: 'Wolf' },
          createdAt: { toDate: () => new Date() },
          updatedAt: { toDate: () => new Date() },
          isActive: true,
          permissions: []
        })
      }
    ];

    mockCollection.mockReturnValue({} as any);
    mockQuery.mockReturnValue({} as any);
    mockGetDocs.mockResolvedValue({
      docs: mockUsers
    } as any);

    const users = await authService.getUsers();

    expect(users).toHaveLength(1);
    expect(users[0].email).toBe('user1@test.com');
    expect(users.find(u => u.status === 'denied')).toBeUndefined();
    expect(users.find(u => u.status === 'rejected')).toBeUndefined();
  });

  test('handles users with undefined status', async () => {
    const mockUsers = [
      {
        id: 'user1',
        data: () => ({
          email: 'user1@test.com',
          displayName: 'User One',
          role: 'parent',
          status: undefined, // No status
          profile: { den: 'Wolf' },
          createdAt: { toDate: () => new Date() },
          updatedAt: { toDate: () => new Date() },
          isActive: true,
          permissions: []
        })
      },
      {
        id: 'gina-messa',
        data: () => ({
          email: 'gina_daigle@yahoo.com',
          displayName: 'Gina Messa',
          role: 'parent',
          // No status field at all
          profile: { den: 'Bear' },
          createdAt: { toDate: () => new Date() },
          updatedAt: { toDate: () => new Date() },
          isActive: true,
          permissions: []
        })
      }
    ];

    mockCollection.mockReturnValue({} as any);
    mockQuery.mockReturnValue({} as any);
    mockGetDocs.mockResolvedValue({
      docs: mockUsers
    } as any);

    const users = await authService.getUsers();

    expect(users).toHaveLength(2);
    expect(users.find(u => u.email === 'gina_daigle@yahoo.com')).toBeDefined();
    expect(users.find(u => u.displayName === 'Gina Messa')).toBeDefined();
  });

  test('handles empty users collection', async () => {
    mockCollection.mockReturnValue({} as any);
    mockQuery.mockReturnValue({} as any);
    mockGetDocs.mockResolvedValue({
      docs: []
    } as any);

    const users = await authService.getUsers();

    expect(users).toHaveLength(0);
  });

  test('handles Firestore errors gracefully', async () => {
    mockCollection.mockReturnValue({} as any);
    mockQuery.mockReturnValue({} as any);
    mockGetDocs.mockRejectedValue(new Error('Firestore error'));

    await expect(authService.getUsers()).rejects.toThrow('Firestore error');
  });

  test('transforms user data correctly', async () => {
    const mockUser = {
      id: 'gina-messa',
      data: () => ({
        email: 'gina_daigle@yahoo.com',
        displayName: 'Gina Messa',
        role: 'parent',
        status: 'approved',
        profile: { den: 'Bear' },
        createdAt: { toDate: () => new Date('2025-01-01') },
        updatedAt: { toDate: () => new Date('2025-01-02') },
        isActive: true,
        permissions: ['read']
      })
    };

    mockCollection.mockReturnValue({} as any);
    mockQuery.mockReturnValue({} as any);
    mockGetDocs.mockResolvedValue({
      docs: [mockUser]
    } as any);

    const users = await authService.getUsers();

    expect(users).toHaveLength(1);
    const user = users[0];
    
    expect(user.uid).toBe('gina-messa');
    expect(user.email).toBe('gina_daigle@yahoo.com');
    expect(user.displayName).toBe('Gina Messa');
    expect(user.role).toBe('parent');
    expect(user.status).toBe('approved');
    expect(user.profile.den).toBe('Bear');
    expect(user.isActive).toBe(true);
    expect(user.permissions).toEqual(['read']);
    expect(user.createdAt).toBeInstanceOf(Date);
    expect(user.updatedAt).toBeInstanceOf(Date);
  });

  test('handles missing optional fields gracefully', async () => {
    const mockUser = {
      id: 'gina-messa',
      data: () => ({
        email: 'gina_daigle@yahoo.com',
        displayName: 'Gina Messa',
        role: 'parent',
        // Missing optional fields
        createdAt: { toDate: () => new Date() },
        updatedAt: { toDate: () => new Date() }
      })
    };

    mockCollection.mockReturnValue({} as any);
    mockQuery.mockReturnValue({} as any);
    mockGetDocs.mockResolvedValue({
      docs: [mockUser]
    } as any);

    const users = await authService.getUsers();

    expect(users).toHaveLength(1);
    const user = users[0];
    
    expect(user.uid).toBe('gina-messa');
    expect(user.email).toBe('gina_daigle@yahoo.com');
    expect(user.displayName).toBe('Gina Messa');
    expect(user.role).toBe('parent');
    expect(user.status).toBeUndefined();
    expect(user.profile).toEqual({});
    expect(user.isActive).toBe(true); // Default value
    expect(user.permissions).toEqual([]); // Default value
  });
});
