import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Firebase for testing
vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(() => ({})),
  getApps: vi.fn(() => []),
  getApp: vi.fn(() => ({})),
}));

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => ({})),
  collection: vi.fn(() => ({})),
  doc: vi.fn(() => ({})),
  getDocs: vi.fn(() => Promise.resolve({ docs: [] })),
  getDoc: vi.fn(() => Promise.resolve({ data: () => ({}) })),
  addDoc: vi.fn(() => Promise.resolve({ id: 'test-id' })),
  updateDoc: vi.fn(() => Promise.resolve()),
  deleteDoc: vi.fn(() => Promise.resolve()),
  query: vi.fn(() => ({})),
  where: vi.fn(() => ({})),
  orderBy: vi.fn(() => ({})),
  limit: vi.fn(() => ({})),
  Timestamp: {
    now: vi.fn(() => ({ toDate: () => new Date() })),
    fromDate: vi.fn(() => ({ toDate: () => new Date() })),
  },
}));

vi.mock('firebase/functions', () => ({
  getFunctions: vi.fn(() => ({})),
  httpsCallable: vi.fn(() => vi.fn(() => Promise.resolve({ data: {} }))),
}));

vi.mock('firebase/analytics', () => ({
  getAnalytics: vi.fn(() => ({})),
  logEvent: vi.fn(() => Promise.resolve()),
  setUserProperties: vi.fn(() => Promise.resolve()),
  isSupported: vi.fn(() => Promise.resolve(true)),
}));

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({
    currentUser: null,
    onAuthStateChanged: vi.fn(() => vi.fn()),
    signInWithEmailAndPassword: vi.fn(() => Promise.resolve({ user: {} })),
    createUserWithEmailAndPassword: vi.fn(() => Promise.resolve({ user: {} })),
    signOut: vi.fn(() => Promise.resolve()),
    sendPasswordResetEmail: vi.fn(() => Promise.resolve()),
    updateProfile: vi.fn(() => Promise.resolve()),
  })),
  signInWithEmailAndPassword: vi.fn(() => Promise.resolve({ user: {} })),
  createUserWithEmailAndPassword: vi.fn(() => Promise.resolve({ user: {} })),
  signOut: vi.fn(() => Promise.resolve()),
  sendPasswordResetEmail: vi.fn(() => Promise.resolve()),
  updateProfile: vi.fn(() => Promise.resolve()),
  onAuthStateChanged: vi.fn(() => vi.fn()),
  GoogleAuthProvider: vi.fn(),
  FacebookAuthProvider: vi.fn(),
  TwitterAuthProvider: vi.fn(),
  GithubAuthProvider: vi.fn(),
  signInWithPopup: vi.fn(() => Promise.resolve({ user: {} })),
  signInWithRedirect: vi.fn(() => Promise.resolve({ user: {} })),
  getRedirectResult: vi.fn(() => Promise.resolve({ user: {} })),
}));

// Mock React Router with more flexible mocks
const mockNavigate = vi.fn();
const mockUseParams = vi.fn(() => ({ id: 'test-id' }));
const mockUseSearchParams = vi.fn(() => [new URLSearchParams(), vi.fn()]);
const mockUseLocation = vi.fn(() => ({ pathname: '/test', search: '' }));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: mockUseParams,
    useSearchParams: mockUseSearchParams,
    useLocation: mockUseLocation,
    // Export the mock functions so tests can control them
    __mocks: {
      mockNavigate,
      mockUseParams,
      mockUseSearchParams,
      mockUseLocation,
    },
  };
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock navigator.share
Object.defineProperty(navigator, 'share', {
  writable: true,
  value: vi.fn(() => Promise.resolve()),
});

// Mock navigator.clipboard - use Object.defineProperty instead of direct assignment
Object.defineProperty(navigator, 'clipboard', {
  writable: true,
  configurable: true,
  value: {
    writeText: vi.fn(() => Promise.resolve()),
    readText: vi.fn(() => Promise.resolve('')),
  },
});

// Mock URL.createObjectURL and URL.revokeObjectURL
global.URL.createObjectURL = vi.fn(() => 'mock-url');
global.URL.revokeObjectURL = vi.fn();

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  warn: vi.fn(),
  error: vi.fn(),
  log: vi.fn(),
};

// Mock the firestore service functions
vi.mock('../../services/firestore', () => ({
  submitRSVP: vi.fn(() => Promise.resolve({ data: { success: true } })),
  submitFeedback: vi.fn(() => Promise.resolve({ data: { success: true } })),
  claimVolunteerRole: vi.fn(() => Promise.resolve({ data: { success: true } })),
  generateICSFeed: vi.fn(() => Promise.resolve({ data: { icsContent: 'mock-ics' } })),
  getWeatherData: vi.fn(() => Promise.resolve({ data: { temperature: 72 } })),
  generateIPHash: vi.fn(() => Promise.resolve('mock-hash')),
  firestoreService: {
    getEvents: vi.fn(() => Promise.resolve([])),
    getEvent: vi.fn(() => Promise.resolve({ id: 'test-event', title: 'Test Event' })),
    getLocations: vi.fn(() => Promise.resolve([])),
    getLocation: vi.fn(() => Promise.resolve({ id: 'test-location', name: 'Test Location' })),
    getAnnouncements: vi.fn(() => Promise.resolve([])),
    getSeasons: vi.fn(() => Promise.resolve([])),
    getLists: vi.fn(() => Promise.resolve([])),
    getVolunteerNeeds: vi.fn(() => Promise.resolve([])),
    deleteEvent: vi.fn(() => Promise.resolve()),
    deleteLocation: vi.fn(() => Promise.resolve()),
  },
  default: {
    getEvents: vi.fn(() => Promise.resolve([])),
    getEvent: vi.fn(() => Promise.resolve({ id: 'test-event', title: 'Test Event' })),
    getLocations: vi.fn(() => Promise.resolve([])),
    getLocation: vi.fn(() => Promise.resolve({ id: 'test-location', name: 'Test Location' })),
    getAnnouncements: vi.fn(() => Promise.resolve([])),
    getSeasons: vi.fn(() => Promise.resolve([])),
    getLists: vi.fn(() => Promise.resolve([])),
    getVolunteerNeeds: vi.fn(() => Promise.resolve([])),
    deleteEvent: vi.fn(() => Promise.resolve()),
    deleteLocation: vi.fn(() => Promise.resolve()),
  },
}));

// Mock the auth service
vi.mock('../../services/authService', () => ({
  authService: {
    getCurrentUser: vi.fn(() => null),
    isAuthenticated: vi.fn(() => false),
    hasPermission: vi.fn(() => false),
    hasAtLeastRole: vi.fn(() => false),
    hasRole: vi.fn(() => false),
    getRoleLevel: vi.fn(() => 0),
    signIn: vi.fn(() => Promise.resolve({})),
    signOut: vi.fn(() => Promise.resolve()),
    createUser: vi.fn(() => Promise.resolve({})),
    updateProfile: vi.fn(() => Promise.resolve()),
    onAuthStateChanged: vi.fn(() => vi.fn()),
  },
  UserRole: {
    ANONYMOUS: 'anonymous',
    PARENT: 'parent',
    VOLUNTEER: 'volunteer',
    ADMIN: 'admin',
    ROOT: 'root',
    AI_ASSISTANT: 'ai_assistant',
  },
  Permission: {},
  ROLE_PERMISSIONS: {},
  ROLE_HIERARCHY: {},
  SocialProvider: {},
}));

// Mock the aiAuthService
vi.mock('../../services/aiAuthService', () => ({
  aiAuthService: {
    getAIUser: vi.fn(() => ({ uid: 'ai_user', role: 'ai_assistant' })),
    canAIPerformAction: vi.fn(() => true),
    canAIAccessCollection: vi.fn(() => true),
    hasAIPermission: vi.fn(() => true),
  },
}));

// Mock the vertexAIService
vi.mock('../../services/vertexAIService', () => ({
  vertexAIService: {
    initialize: vi.fn(() => Promise.resolve()),
    generateResponse: vi.fn(() => Promise.resolve({ content: 'Mock AI response' })),
    generateEventDescription: vi.fn(() => Promise.resolve('Mock event description')),
    generateAnnouncementContent: vi.fn(() => Promise.resolve('Mock announcement content')),
    generatePackingList: vi.fn(() => Promise.resolve(['item1', 'item2'])),
    generateEventTitle: vi.fn(() => Promise.resolve('Mock Event Title')),
    analyzeQuery: vi.fn(() => Promise.resolve('Mock query analysis')),
    generateComprehensiveEventData: vi.fn(() => Promise.resolve({
      eventData: {
        title: 'Mock Event',
        startDate: '2024-01-01',
        endDate: '2024-01-02',
        description: 'Mock description',
        location: 'Mock Location',
        address: 'Mock Address',
        phone: 'Mock Phone',
        coordinates: { lat: 0, lng: 0 },
        amenities: ['Mock Amenity'],
        checkInTime: 'Mock Time',
        earliestArrival: 'Mock Time',
        medicalFacility: {
          name: 'Mock Hospital',
          address: 'Mock Address',
          phone: 'Mock Phone',
          distance: 'Mock Distance',
        },
        allergies: ['Mock Allergen'],
        accessibility: 'Mock Accessibility',
        weatherConsiderations: 'Mock Weather',
      },
      packingList: ['Mock Item'],
      weatherForecast: null,
      duplicateCheck: {
        existingLocations: [],
        shouldCreateNew: true,
        reason: 'Mock reason',
      },
      familyNotes: 'Mock family notes',
    })),
    testConnection: vi.fn(() => Promise.resolve({ success: true })),
  },
}));

// Mock the externalApiService
vi.mock('../../services/externalApiService', () => ({
  externalApiService: {
    get5DayWeatherForecast: vi.fn(() => Promise.resolve({
      location: { lat: 0, lng: 0, name: 'Mock Location' },
      dailyForecasts: [],
      lastUpdated: new Date().toISOString(),
    })),
  },
}));

// Export mock functions for tests to use
export { mockNavigate, mockUseParams, mockUseSearchParams, mockUseLocation };
