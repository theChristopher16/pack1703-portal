// Mock externalApiService for testing
export const externalApiService = {
  get5DayWeatherForecast: jest.fn(() => Promise.resolve({
    location: { lat: 0, lng: 0, name: 'Mock Location' },
    dailyForecasts: [],
    lastUpdated: new Date().toISOString(),
  })),
};

export default externalApiService;
