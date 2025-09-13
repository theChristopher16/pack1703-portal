// Mock authService for testing
export const authService = {
  getCurrentUser: jest.fn(() => null),
  isAuthenticated: jest.fn(() => false),
  hasPermission: jest.fn(() => false),
  hasAtLeastRole: jest.fn(() => false),
  hasRole: jest.fn(() => false),
  getRoleLevel: jest.fn(() => 0),
  signIn: jest.fn(() => Promise.resolve({})),
  signOut: jest.fn(() => Promise.resolve()),
  createUser: jest.fn(() => Promise.resolve({})),
  updateProfile: jest.fn(() => Promise.resolve()),
  onAuthStateChanged: jest.fn(() => jest.fn()),
};

export const UserRole = {
  ANONYMOUS: 'anonymous',
  PARENT: 'parent',
  VOLUNTEER: 'volunteer',
  ADMIN: 'admin',
  ROOT: 'root',
  AI_ASSISTANT: 'ai_assistant',
};

export const Permission = {};

export const ROLE_PERMISSIONS = {};

export const ROLE_HIERARCHY = {};

export const SocialProvider = {};

export default authService;
