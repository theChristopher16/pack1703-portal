// Mock firestore service for testing
export const firestoreService = {
  getEvents: jest.fn(() => Promise.resolve([])),
  getEvent: jest.fn(() => Promise.resolve({ id: 'test-event', title: 'Test Event' })),
  getLocations: jest.fn(() => Promise.resolve([])),
  getLocation: jest.fn(() => Promise.resolve({ id: 'test-location', name: 'Test Location' })),
  getAnnouncements: jest.fn(() => Promise.resolve([])),
  getSeasons: jest.fn(() => Promise.resolve([])),
  getLists: jest.fn(() => Promise.resolve([])),
  getVolunteerNeeds: jest.fn(() => Promise.resolve([])),
  deleteEvent: jest.fn(() => Promise.resolve()),
  deleteLocation: jest.fn(() => Promise.resolve()),
};

export const submitRSVP = jest.fn(() => Promise.resolve({ data: { success: true } }));
export const submitFeedback = jest.fn(() => Promise.resolve({ data: { success: true } }));
export const claimVolunteerRole = jest.fn(() => Promise.resolve({ data: { success: true } }));
export const generateICSFeed = jest.fn(() => Promise.resolve({ data: { icsContent: 'mock-ics' } }));
export const getWeatherData = jest.fn(() => Promise.resolve({ data: { temperature: 72 } }));
export const generateIPHash = jest.fn(() => Promise.resolve('mock-hash'));

export default firestoreService;
