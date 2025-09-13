// Mock vertexAIService for testing
export const vertexAIService = {
  initialize: jest.fn(() => Promise.resolve()),
  generateResponse: jest.fn(() => Promise.resolve({ content: 'Mock AI response' })),
  generateEventDescription: jest.fn(() => Promise.resolve('Mock event description')),
  generateAnnouncementContent: jest.fn(() => Promise.resolve('Mock announcement content')),
  generatePackingList: jest.fn(() => Promise.resolve(['item1', 'item2'])),
  generateEventTitle: jest.fn(() => Promise.resolve('Mock Event Title')),
  analyzeQuery: jest.fn(() => Promise.resolve('Mock query analysis')),
  generateComprehensiveEventData: jest.fn(() => Promise.resolve({
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
  testConnection: jest.fn(() => Promise.resolve({ success: true })),
};

export default vertexAIService;
