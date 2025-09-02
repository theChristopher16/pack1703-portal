module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/*.{test,spec}.{js,jsx,ts,tsx}'
  ],
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/index.js',
    '!src/setupTests.ts',
    '!src/test/**/*'
  ],
  coverageThreshold: {
    global: {
      branches: 0,
      functions: 0,
      lines: 0,
      statements: 0
    }
  },
  testTimeout: 30000,
  // Mock Firebase and other external services
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^firebase/app$': '<rootDir>/src/__mocks__/firebase.js',
    '^firebase/firestore$': '<rootDir>/src/__mocks__/firebase.js',
    '^firebase/auth$': '<rootDir>/src/__mocks__/firebase.js',
    '^firebase/functions$': '<rootDir>/src/__mocks__/firebase.js',
    '^firebase/storage$': '<rootDir>/src/__mocks__/firebase.js',
  },
  // Suppress console warnings and errors during tests
  silent: true,
  verbose: false,
  // Ensure we don't run Vitest files
  testPathIgnorePatterns: [
    '<rootDir>/test/',
    '<rootDir>/node_modules/'
  ]
};
