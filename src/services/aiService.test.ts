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

// Mock dependencies
jest.mock('./firestore', () => ({
  firestoreService: {
    createEvent: jest.fn(),
    createAnnouncement: jest.fn(),
    getEvents: jest.fn(),
    getLocations: jest.fn(),
  }
}));

jest.mock('./systemMonitorService', () => ({
  default: {
    getSystemStatus: jest.fn(),
    getCostAnalysis: jest.fn(),
    getUserActivity: jest.fn(),
  }
}));

jest.mock('./chatService', () => ({
  default: {
    sendMessage: jest.fn(),
    getRecentMessages: jest.fn(),
  }
}));

jest.mock('./configService', () => ({
  default: {
    getConfig: jest.fn(),
    updateConfig: jest.fn(),
  }
}));

jest.mock('./securityAuditService', () => ({
  SecurityAuditService: {
    performAudit: jest.fn(),
  }
}));

jest.mock('./externalApiService', () => ({
  externalApiService: {
    searchWeb: jest.fn(),
    getWeather: jest.fn(),
    validateLocation: jest.fn(),
  }
}));

jest.mock('./emailMonitorService', () => ({
  default: {
    getMonitoringStatus: jest.fn(),
  }
}));

jest.mock('./dataAuditService', () => ({
  default: {
    auditData: jest.fn(),
  }
}));

describe('AIService', () => {
  let aiService: any;

  beforeEach(() => {
    aiService = require('./aiService').default;
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
      expect(eventData.title).toContain('Lake');
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

      expect(response.message).toContain('System Status');
      expect(response.type).toBe('info');
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
      expect(response.type).toBe('info');
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
      expect(response.type).toBe('info');
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
      expect(response.type).toBe('info');
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
      expect(response.message).toContain('create events');
      expect(response.type).toBe('info');
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
      
      expect(eventData.title).toContain('Camp');
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

      expect(response.type).toBe('warning');
      expect(response.message).toContain('Unable to fetch');
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
