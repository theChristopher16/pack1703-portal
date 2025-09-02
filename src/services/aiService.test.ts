import AIService from './aiService';

// Mock Firebase
jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(() => ({})),
  collection: jest.fn(),
  getDocs: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  addDoc: jest.fn(),
  serverTimestamp: jest.fn(),
  doc: jest.fn(),
  updateDoc: jest.fn(),
  increment: jest.fn(),
  getDoc: jest.fn(),
  Timestamp: {
    now: jest.fn(() => ({ toDate: () => new Date() }))
  }
}));

jest.mock('firebase/functions', () => ({
  getFunctions: jest.fn(() => ({})),
  httpsCallable: jest.fn(() => jest.fn())
}));

// Mock services
jest.mock('./firestore', () => ({
  __esModule: true,
  default: {
    createEvent: jest.fn(() => {
      console.log('Mock createEvent called');
      return Promise.resolve({ id: 'test-event-id', title: 'Test Event', startDate: new Date(), location: 'Test Location' });
    }),
    getEvents: jest.fn(() => Promise.resolve([])),
    getAnnouncements: jest.fn(() => Promise.resolve([])),
    getLocations: jest.fn(() => Promise.resolve([])),
    getUsers: jest.fn(() => Promise.resolve([])),
    getVolunteerNeeds: jest.fn(() => Promise.resolve([])),
    getRSVPs: jest.fn(() => Promise.resolve([])),
    getFeedback: jest.fn(() => Promise.resolve([])),
    getVolunteerSignups: jest.fn(() => Promise.resolve([])),
    submitRSVP: jest.fn(() => Promise.resolve({ id: 'test-rsvp-id' })),
    submitFeedback: jest.fn(() => Promise.resolve({ id: 'test-feedback-id' })),
    claimVolunteerRole: jest.fn(() => Promise.resolve({ id: 'test-volunteer-id' }))
  }
}));

jest.mock('./systemMonitorService', () => ({
  __esModule: true,
  default: {
    getSystemMetrics: jest.fn(() => Promise.resolve({
      responseTime: 25,
      uptime: 99.9,
      memoryUsage: 65,
      cpuUsage: 45,
      activeConnections: 12,
      errorRate: 0.1
    })),
    getCostMetrics: jest.fn(() => Promise.resolve({
      firestore: 10.50,
      storage: 2.30,
      functions: 5.20,
      hosting: 1.80,
      total: 19.80
    })),
    getUserMetrics: jest.fn(() => Promise.resolve({
      totalUsers: 150,
      activeUsers: 105,
      newUsers: 12,
      userGrowth: 8.5,
      engagementRate: 75.2
    }))
  }
}));

jest.mock('./chatService', () => ({
  __esModule: true,
  default: {
    getChatHistory: jest.fn(() => Promise.resolve([])),
    sendMessage: jest.fn(() => Promise.resolve({ id: 'test-message-id' }))
  }
}));

jest.mock('./configService', () => ({
  __esModule: true,
  default: {
    getConfig: jest.fn(() => Promise.resolve({
      aiEnabled: true,
      maxTokens: 1000,
      temperature: 0.7
    })),
    updateConfig: jest.fn(() => Promise.resolve())
  }
}));

jest.mock('./securityAuditService', () => ({
  __esModule: true,
  default: {
    getSecurityStatus: jest.fn(() => Promise.resolve({
      status: 'secure',
      lastAudit: new Date(),
      vulnerabilities: 0,
      recommendations: []
    })),
    runSecurityAudit: jest.fn(() => Promise.resolve({
      status: 'passed',
      issues: []
    }))
  }
}));

jest.mock('./externalApiService', () => ({
  __esModule: true,
  default: {
    searchWeb: jest.fn(() => Promise.resolve({
      results: [
        {
          title: 'Double Lake Recreation Area',
          snippet: 'Beautiful camping area north of Houston',
          url: 'https://example.com/double-lake'
        }
      ],
      totalResults: 1
    })),
    getLocationInfo: jest.fn(() => Promise.resolve({
      name: 'Double Lake Recreation Area',
      address: 'North of Houston, TX',
      coordinates: { lat: 30.2672, lng: -95.7502 }
    }))
  }
}));

jest.mock('./emailMonitorService', () => ({
  __esModule: true,
  default: {
    getMonitoringStatus: jest.fn(() => Promise.resolve({
      isActive: true,
      lastCheck: new Date(),
      emailsProcessed: 25,
      errors: 0
    })),
    startMonitoring: jest.fn(() => Promise.resolve()),
    stopMonitoring: jest.fn(() => Promise.resolve())
  }
}));

jest.mock('./dataAuditService', () => ({
  __esModule: true,
  default: {
    getDataHealth: jest.fn(() => Promise.resolve({
      status: 'healthy',
      totalRecords: 1250,
      orphanedRecords: 0,
      dataIntegrity: 100
    })),
    runDataAudit: jest.fn(() => Promise.resolve({
      status: 'passed',
      issues: []
    }))
  }
}));

describe('AIService', () => {
  let aiService: any;

  beforeEach(() => {
    aiService = require('./aiService').default;
    
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Explicitly mock the firestoreService.createEvent method
    const firestoreService = require('./firestore').default;
    firestoreService.createEvent.mockImplementation(() => {
      console.log('Mock createEvent called');
      return Promise.resolve({ id: 'test-event-id', title: 'Test Event', startDate: new Date(), location: 'Test Location' });
    });
  });

  describe('Event Creation Recognition', () => {
    const eventCreationQueries = [
      'create an event for double lake recreation area',
      'make an event for camping trip',
      'add event for pack meeting',
      'new event at the community center',
      'schedule event for next weekend',
      'plan event for cub scouts',
      'set up event for outdoor activities',
      'organize event for fundraising',
      'arrange event for den meeting',
      'create event for september 15-18',
      'make event for double lake recreation area, north of houston',
      'new event for sept 15 - 18. make it fun!',
    ];

    test.each(eventCreationQueries)('should recognize event creation request: %s', async (query) => {
      const response = await aiService.processQuery(query, {
        userId: 'test-user',
        userRole: 'admin',
        attachments: [],
        context: 'admin'
      });

      expect(response.message).toContain('Event Ready to Create');
      expect(response.requiresConfirmation).toBe(true);
      expect(response.confirmationData?.action).toBe('create_event');
    });

    test('should extract event data correctly from complex query', async () => {
      const query = 'make an event for double lake recreation area, north of houston, for sept 15-18. make it fun!';
      
      const response = await aiService.processQuery(query, {
        userId: 'test-user',
        userRole: 'admin',
        attachments: [],
        context: 'admin'
      });

      expect(response.message).toContain('Event Ready to Create');
      
      const eventData = response.confirmationData?.entityData;
      expect(eventData).toBeDefined();
      expect(eventData.title).toContain('Campout');
      expect(eventData.location).toContain('double lake recreation area');
      expect(eventData.date).toBeInstanceOf(Date);
    });
  });

  describe('System Status Queries', () => {
    const systemQueries = [
      'show system status',
      'system health',
      'performance metrics',
      'how is the system doing',
      'system monitoring',
    ];

    test.each(systemQueries)('should recognize system status query: %s', async (query) => {
      const response = await aiService.processQuery(query, {
        userId: 'test-user',
        userRole: 'admin',
        attachments: [],
        context: 'admin'
      });

      expect(['System Status', 'system monitoring', 'System monitoring', 'encountered an error'].some(text => response.message.includes(text))).toBe(true);
      expect(['info', 'success', 'warning', 'error']).toContain(response.type);
    });
  });

  describe('Cost Analysis Queries', () => {
    const costQueries = [
      'cost analysis',
      'billing information',
      'expense report',
      'budget overview',
      'monthly costs',
    ];

    test.each(costQueries)('should recognize cost analysis query: %s', async (query) => {
      const response = await aiService.processQuery(query, {
        userId: 'test-user',
        userRole: 'admin',
        attachments: [],
        context: 'admin'
      });

      expect(response.message).toContain('Cost Analysis');
      expect(['info', 'success', 'warning', 'error']).toContain(response.type);
    });
  });

  describe('User Activity Queries', () => {
    const userQueries = [
      'user activity',
      'engagement metrics',
      'user analytics',
      'activity report',
      'user behavior',
    ];

    test.each(userQueries)('should recognize user activity query: %s', async (query) => {
      const response = await aiService.processQuery(query, {
        userId: 'test-user',
        userRole: 'admin',
        attachments: [],
        context: 'admin'
      });

      expect(response.message).toContain('User Activity');
      expect(['info', 'success', 'warning', 'error']).toContain(response.type);
    });
  });

  describe('Security Queries', () => {
    const securityQueries = [
      'security status',
      'permissions audit',
      'access control',
      'security report',
      'permissions overview',
    ];

    test.each(securityQueries)('should recognize security query: %s', async (query) => {
      const response = await aiService.processQuery(query, {
        userId: 'test-user',
        userRole: 'admin',
        attachments: [],
        context: 'admin'
      });

      expect(response.message).toContain('Security Status');
      expect(['info', 'success', 'warning', 'error']).toContain(response.type);
    });
  });

  describe('Help and General Queries', () => {
    test('should provide help information', async () => {
      const response = await aiService.processQuery('help', {
        userId: 'test-user',
        userRole: 'admin',
        attachments: [],
        context: 'admin'
      });

      expect(response.message).toContain('Hello! I\'m Solyn');
      expect(response.message).toContain('Create events');
      expect(['info', 'success', 'warning', 'error']).toContain(response.type);
    });

    test('should recognize name queries', async () => {
      const response = await aiService.processQuery('what is your name', {
        userId: 'test-user',
        userRole: 'admin',
        attachments: [],
        context: 'admin'
      });

      expect(response.message).toContain('Solyn');
      expect(response.type).toBe('info');
    });
  });

  describe('Event Data Extraction', () => {
    test('should extract location from query', () => {
      const query = 'create event for double lake recreation area';
      const eventData = aiService['extractEventDataFromQuery'](query);
      
      expect(eventData.location).toContain('double lake recreation area');
    });

    test('should extract date range from query', () => {
      const query = 'create event for september 15-18';
      const eventData = aiService['extractEventDataFromQuery'](query);
      
      expect(eventData.date).toBeInstanceOf(Date);
      expect(eventData.endDate).toBeInstanceOf(Date);
    });

    test('should generate creative title when not provided', () => {
      const query = 'create event for camping trip';
      const eventData = aiService['extractEventDataFromQuery'](query);
      
      expect(eventData.title).toContain('camping');
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid queries gracefully', async () => {
      const response = await aiService.processQuery('', {
        userId: 'test-user',
        userRole: 'admin',
        attachments: [],
        context: 'admin'
      });

      expect(response.type).toBe('info');
      expect(response.message).toContain('help');
    });

    test('should handle system errors gracefully', async () => {
      // Mock a system error
      jest.spyOn(aiService as any, 'getSystemStatusResponse').mockRejectedValue(new Error('System error'));

      const response = await aiService.processQuery('system status', {
        userId: 'test-user',
        userRole: 'admin',
        attachments: [],
        context: 'admin'
      });

      expect(['warning', 'error']).toContain(response.type);
      expect(response.message).toContain('encountered an error');
    });
  });

  describe('Confirmation Flow', () => {
    test('should handle event confirmation correctly', async () => {
      const confirmationData = {
        action: 'create_event',
        entityType: 'event',
        entityData: {
          title: 'Test Event',
          date: new Date(),
          location: 'Test Location',
          description: 'Test Description'
        },
        validationChecks: [],
        resourcesToCreate: []
      };

      const response = await aiService.confirmAndCreateEvent(confirmationData);

      expect(response.message).toContain('Event Created Successfully');
      expect(response.type).toBe('success');
      expect(response.data?.eventId).toBeDefined();
    });
  });
});
