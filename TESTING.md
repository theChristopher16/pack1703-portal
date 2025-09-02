# Testing Documentation for Pack1703 Portal

## Test Organization Structure

```
src/
├── __tests__/                    # Main test directory
│   ├── unit/                     # Unit tests
│   │   ├── services/            # Service layer tests
│   │   │   ├── authService.test.ts
│   │   │   ├── aiService.test.ts
│   │   │   ├── firestore.test.ts
│   │   │   └── security.test.ts
│   │   ├── components/          # Component tests
│   │   │   ├── Profile/
│   │   │   │   └── UserProfileManager.test.tsx
│   │   │   ├── Admin/
│   │   │   │   └── UserManagement.test.tsx
│   │   │   └── Forms/
│   │   │       ├── FeedbackForm.test.tsx
│   │   │       └── VolunteerSignupForm.test.tsx
│   │   ├── contexts/            # Context tests
│   │   │   ├── AuthContext.test.tsx
│   │   │   └── AdminContext.test.tsx
│   │   └── utils/               # Utility function tests
│   │       ├── validation.test.ts
│   │       └── helpers.test.ts
│   ├── integration/             # Integration tests
│   │   ├── auth-flow.test.ts    # Authentication flow tests
│   │   ├── user-management.test.ts
│   │   └── ai-integration.test.ts
│   ├── e2e/                     # End-to-end tests
│   │   ├── user-journey.test.ts
│   │   └── admin-workflow.test.ts
│   └── fixtures/                # Test data and fixtures
│       ├── mockUsers.ts
│       ├── mockEvents.ts
│       └── mockData.ts
```

## Test Categories

### 1. Unit Tests
- **Services**: Test individual service methods in isolation
- **Components**: Test React components with mocked dependencies
- **Contexts**: Test React context providers and consumers
- **Utils**: Test utility functions and helpers

### 2. Integration Tests
- **Auth Flow**: Test complete authentication processes
- **User Management**: Test user CRUD operations end-to-end
- **AI Integration**: Test AI service interactions

### 3. End-to-End Tests
- **User Journey**: Test complete user workflows
- **Admin Workflow**: Test administrative processes

## Test Configuration

### Jest Configuration
```javascript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/index.tsx',
    '!src/serviceWorker.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{ts,tsx}',
    '<rootDir>/src/**/*.{test,spec}.{ts,tsx}',
  ],
};
```

### Test Setup
```typescript
// src/setupTests.ts
import '@testing-library/jest-dom';
import { server } from './__tests__/fixtures/msw/server';

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Mock Firebase
jest.mock('./firebase/config', () => ({
  db: {},
  auth: {},
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});
```

## Test Utilities

### Custom Render Function
```typescript
// src/__tests__/utils/test-utils.tsx
import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { AuthProvider } from '../../contexts/AuthContext';
import { AdminProvider } from '../../contexts/AdminContext';

const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <AuthProvider>
      <AdminProvider>
        {children}
      </AdminProvider>
    </AuthProvider>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };
```

### Mock Data Factories
```typescript
// src/__tests__/fixtures/mockUsers.ts
import { AppUser, UserRole, SocialProvider } from '../../services/authService';

export const createMockUser = (overrides: Partial<AppUser> = {}): AppUser => ({
  uid: 'test-user-123',
  email: 'test@example.com',
  displayName: 'Test User',
  photoURL: 'https://example.com/photo.jpg',
  role: UserRole.SCOUT,
  permissions: [],
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  lastLoginAt: new Date(),
  authProvider: SocialProvider.GOOGLE,
  profile: {
    firstName: 'Test',
    lastName: 'User',
    nickname: 'Tester',
    phone: '555-1234',
    address: '123 Test St',
    emergencyContact: '555-5678',
    scoutRank: 'Wolf',
    den: 'Wolf',
    packNumber: '1703',
    scoutAge: 9,
    scoutGrade: '3rd Grade',
    familyId: 'family-123',
    parentNames: ['Parent 1', 'Parent 2'],
    siblings: ['Sibling 1'],
    username: 'testuser',
    socialData: {
      google: {
        id: 'google-123',
        email: 'test@example.com',
        name: 'Test User',
        picture: 'https://example.com/photo.jpg'
      }
    },
    preferences: {
      emailNotifications: true,
      pushNotifications: true,
      smsNotifications: false,
      language: 'en',
      timezone: 'America/Chicago'
    },
    security: {
      twoFactorEnabled: false,
      lastPasswordChange: new Date(),
      failedLoginAttempts: 0,
      accountLocked: false
    }
  },
  ...overrides,
});

export const createMockRootUser = () => createMockUser({ role: UserRole.ROOT });
export const createMockAdminUser = () => createMockUser({ role: UserRole.ADMIN });
export const createMockDenLeaderUser = () => createMockUser({ role: UserRole.DEN_LEADER });
export const createMockParentUser = () => createMockUser({ role: UserRole.PARENT });
export const createMockScoutUser = () => createMockUser({ role: UserRole.SCOUT });
export const createMockGuestUser = () => createMockUser({ role: UserRole.GUEST });
```

## Test Scripts

### Package.json Scripts
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:unit": "jest --testPathPattern=src/__tests__/unit",
    "test:integration": "jest --testPathPattern=src/__tests__/integration",
    "test:e2e": "jest --testPathPattern=src/__tests__/e2e",
    "test:services": "jest --testPathPattern=src/__tests__/unit/services",
    "test:components": "jest --testPathPattern=src/__tests__/unit/components",
    "test:auth": "jest --testPathPattern=auth",
    "test:user-management": "jest --testPathPattern=user-management",
    "test:ai": "jest --testPathPattern=aiService"
  }
}
```

## Running Tests

### Individual Test Categories
```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration

# Run specific service tests
npm run test:services

# Run specific component tests
npm run test:components

# Run auth-related tests
npm run test:auth

# Run user management tests
npm run test:user-management

# Run AI service tests
npm run test:ai
```

### Test Coverage
```bash
# Generate coverage report
npm run test:coverage

# Coverage will be available at:
# coverage/lcov-report/index.html
```

## Test Best Practices

### 1. Test Structure
- Use descriptive test names
- Group related tests in describe blocks
- Follow AAA pattern (Arrange, Act, Assert)
- Keep tests independent and isolated

### 2. Mocking
- Mock external dependencies (Firebase, APIs)
- Use factory functions for test data
- Mock only what's necessary
- Reset mocks between tests

### 3. Assertions
- Test one thing per test
- Use specific assertions
- Test both success and failure cases
- Test edge cases and error conditions

### 4. Component Testing
- Test user interactions
- Test prop changes
- Test error states
- Test loading states
- Test accessibility

### 5. Integration Testing
- Test complete workflows
- Test data flow between components
- Test API interactions
- Test error handling

## Current Test Status

### ✅ Completed Tests
- **AuthService**: RBAC, social login, username validation, user management
- **UserProfileManager**: Form updates, validation, role management, family info
- **AI Service**: Event creation, web search, medical services integration

### 🔄 In Progress
- **UserManagement Component**: Admin interface for user management
- **Integration Tests**: Auth flow, user management workflows
- **E2E Tests**: Complete user journeys

### 📋 Planned Tests
- **Security Service**: Rate limiting, validation, sanitization
- **Firestore Service**: CRUD operations, queries, transactions
- **Admin Components**: All admin interface components
- **Form Components**: All form validation and submission
- **Context Tests**: Auth and Admin context providers

## Test Data Management

### Mock Service Worker
```typescript
// src/__tests__/fixtures/msw/handlers.ts
import { rest } from 'msw';

export const handlers = [
  rest.post('/api/auth/login', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        user: mockUser,
        token: 'mock-jwt-token'
      })
    );
  }),
  
  rest.get('/api/users', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json([mockUser, mockAdminUser])
    );
  }),
];
```

### Test Database
```typescript
// src/__tests__/fixtures/testDb.ts
export class TestDatabase {
  private users: Map<string, AppUser> = new Map();
  private events: Map<string, Event> = new Map();
  
  addUser(user: AppUser) {
    this.users.set(user.uid, user);
  }
  
  getUser(uid: string) {
    return this.users.get(uid);
  }
  
  getAllUsers() {
    return Array.from(this.users.values());
  }
  
  clear() {
    this.users.clear();
    this.events.clear();
  }
}
```

This comprehensive test organization ensures thorough coverage of all functionality while maintaining clear structure and easy maintenance.
