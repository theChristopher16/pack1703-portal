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
  },
}));

// Export mock functions for tests to use
export { mockNavigate, mockUseParams, mockUseSearchParams, mockUseLocation };
