import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import emailMonitorService from '../src/services/emailMonitorService';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';

// Mock Firebase
vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => ({
    collection: vi.fn(),
    addDoc: vi.fn(),
    serverTimestamp: vi.fn(() => new Date()),
    doc: vi.fn(),
    updateDoc: vi.fn(),
    increment: vi.fn()
  })),
  collection: vi.fn(),
  addDoc: vi.fn(),
  serverTimestamp: vi.fn(),
  doc: vi.fn(),
  updateDoc: vi.fn(),
  increment: vi.fn()
}));

vi.mock('firebase/functions', () => ({
  getFunctions: vi.fn(() => ({
    httpsCallable: vi.fn()
  })),
  httpsCallable: vi.fn()
}));

vi.mock('../src/services/aiService', () => ({
  default: {
    sendAIMessage: vi.fn()
  }
}));

describe('EmailMonitorService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with default Zoho configuration', () => {
      const config = emailMonitorService.getEmailConfig();
      
      expect(config.emailAddress).toBe('cubmaster@sfpack1703.com');
      expect(config.imapServer).toBe('imappro.zoho.com');
      expect(config.imapPort).toBe(993);
      expect(config.checkInterval).toBe(5);
      expect(config.autoCreateEvents).toBe(true);
    });

    it('should allow custom configuration override', async () => {
      const customConfig = {
        emailAddress: 'test@example.com',
        checkInterval: 10,
        autoCreateEvents: false
      };

      const result = await emailMonitorService.initialize(customConfig);
      
      // Mock successful connection test
      const mockHttpsCallable = vi.fn().mockResolvedValue({
        data: { success: true }
      });
      
      vi.mocked(getFunctions).mockReturnValue({
        httpsCallable: mockHttpsCallable
      } as any);

      expect(result).toBe(true);
    });
  });

  describe('Email Connection Testing', () => {
    it('should test email connection successfully', async () => {
      const mockHttpsCallable = vi.fn().mockResolvedValue({
        data: { success: true, message: 'Email connection successful' }
      });
      
      vi.mocked(getFunctions).mockReturnValue({
        httpsCallable: mockHttpsCallable
      } as any);

      const result = await emailMonitorService['testEmailConnection']();
      
      expect(result.success).toBe(true);
      expect(mockHttpsCallable).toHaveBeenCalledWith('testEmailConnection');
    });

    it('should handle email connection failure', async () => {
      const mockHttpsCallable = vi.fn().mockRejectedValue(new Error('Connection failed'));
      
      vi.mocked(getFunctions).mockReturnValue({
        httpsCallable: mockHttpsCallable
      } as any);

      const result = await emailMonitorService['testEmailConnection']();
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Connection failed');
    });
  });

  describe('Email Fetching', () => {
    it('should fetch new emails successfully', async () => {
      const mockEmails = [
        {
          id: '1',
          from: 'test@example.com',
          to: 'cubmaster@sfpack1703.com',
          subject: 'Test Event',
          body: 'This is a test email',
          date: new Date().toISOString()
        }
      ];

      const mockHttpsCallable = vi.fn().mockResolvedValue({
        data: { success: true, emails: mockEmails }
      });
      
      vi.mocked(getFunctions).mockReturnValue({
        httpsCallable: mockHttpsCallable
      } as any);

      const emails = await emailMonitorService['fetchNewEmails']();
      
      expect(emails).toHaveLength(1);
      expect(emails[0].from).toBe('test@example.com');
      expect(emails[0].subject).toBe('Test Event');
    });

    it('should handle empty email results', async () => {
      const mockHttpsCallable = vi.fn().mockResolvedValue({
        data: { success: true, emails: [] }
      });
      
      vi.mocked(getFunctions).mockReturnValue({
        httpsCallable: mockHttpsCallable
      } as any);

      const emails = await emailMonitorService['fetchNewEmails']();
      
      expect(emails).toHaveLength(0);
    });

    it('should handle email fetching failure', async () => {
      const mockHttpsCallable = vi.fn().mockResolvedValue({
        data: { success: false, error: 'Failed to fetch emails' }
      });
      
      vi.mocked(getFunctions).mockReturnValue({
        httpsCallable: mockHttpsCallable
      } as any);

      const emails = await emailMonitorService['fetchNewEmails']();
      
      expect(emails).toHaveLength(0);
    });
  });

  describe('Email Content Analysis', () => {
    it('should analyze event-related email content', async () => {
      const email = {
        id: '1',
        from: 'scoutmaster@troop123.org',
        to: 'cubmaster@sfpack1703.com',
        subject: 'Pack Meeting - March 15th',
        body: 'Hi there! Just wanted to confirm our pack meeting on March 15th at 6:30 PM. Location: Community Center, Address: 123 Main St, Houston, TX. Please let me know if you need any changes. Thanks! Scoutmaster',
        date: new Date(),
        attachments: []
      };

      const analysis = await emailMonitorService['analyzeEmailContent'](email);
      
      expect(analysis.processed).toBe(true);
      expect(analysis.confidence).toBeGreaterThan(0.7);
      expect(analysis.eventData).toBeDefined();
      expect(analysis.eventData.title).toContain('Pack Meeting');
    });

    it('should not process non-event emails', async () => {
      const email = {
        id: '1',
        from: 'spam@example.com',
        to: 'cubmaster@sfpack1703.com',
        subject: 'Special Offer',
        body: 'Buy now! Limited time offer!',
        date: new Date(),
        attachments: []
      };

      const analysis = await emailMonitorService['analyzeEmailContent'](email);
      
      expect(analysis.processed).toBe(false);
      expect(analysis.confidence).toBeLessThan(0.3);
    });
  });

  describe('Event Creation', () => {
    it('should create event from email analysis', async () => {
      const email = {
        id: '1',
        from: 'scoutmaster@troop123.org',
        to: 'cubmaster@sfpack1703.com',
        subject: 'Pack Meeting - March 15th',
        body: 'Hi there! Just wanted to confirm our pack meeting on March 15th at 6:30 PM. Location: Community Center, Address: 123 Main St, Houston, TX.',
        date: new Date(),
        attachments: []
      };

      const analysis = {
        processed: true,
        eventCreated: false,
        eventData: {
          title: 'Pack Meeting - March 15th',
          description: 'Pack meeting confirmed for March 15th',
          startDate: new Date('2024-03-15T18:30:00'),
          endDate: new Date('2024-03-15T20:00:00'),
          location: 'Community Center',
          address: '123 Main St, Houston, TX',
          category: 'pack-meeting',
          denTags: ['all-dens'],
          season: 'spring-2024',
          visibility: 'public',
          maxCapacity: 50,
          currentRSVPs: 0
        },
        confidence: 0.85,
        reason: 'High confidence event detection',
        extractedData: {}
      };

      // Mock Firestore addDoc
      const mockAddDoc = vi.fn().mockResolvedValue({ id: 'event-123' });
      vi.mocked(getFirestore).mockReturnValue({
        collection: vi.fn(),
        addDoc: mockAddDoc
      } as any);

      const result = await emailMonitorService['createEventFromEmail'](email, analysis);
      
      expect(result).toBe(true);
      expect(mockAddDoc).toHaveBeenCalled();
    });
  });

  describe('Chat Notifications', () => {
    it('should send chat notification when event is created', async () => {
      const email = {
        id: '1',
        from: 'scoutmaster@troop123.org',
        to: 'cubmaster@sfpack1703.com',
        subject: 'Pack Meeting - March 15th',
        body: 'Test email body',
        date: new Date(),
        attachments: []
      };

      const analysis = {
        processed: true,
        eventCreated: true,
        eventData: {
          title: 'Pack Meeting - March 15th'
        },
        confidence: 0.85,
        reason: 'Event created successfully',
        extractedData: {}
      };

      const mockSendAIMessage = vi.fn();
      vi.doMock('../src/services/aiService', () => ({
        default: {
          sendAIMessage: mockSendAIMessage
        }
      }));

      await emailMonitorService['sendChatNotification'](email, analysis);
      
      expect(mockSendAIMessage).toHaveBeenCalledWith('general', expect.stringContaining('Email Event Created'), true);
    });
  });

  describe('Monitoring Status', () => {
    it('should return correct monitoring status', () => {
      const status = emailMonitorService.getMonitoringStatus();
      
      expect(status).toHaveProperty('isActive');
      expect(status).toHaveProperty('lastChecked');
      expect(status).toHaveProperty('config');
      expect(status.config.emailAddress).toBe('cubmaster@sfpack1703.com');
    });
  });

  describe('Error Handling', () => {
    it('should handle initialization errors gracefully', async () => {
      const mockHttpsCallable = vi.fn().mockRejectedValue(new Error('Network error'));
      
      vi.mocked(getFunctions).mockReturnValue({
        httpsCallable: mockHttpsCallable
      } as any);

      const result = await emailMonitorService.initialize();
      
      expect(result).toBe(false);
    });

    it('should handle email processing errors', async () => {
      const email = {
        id: '1',
        from: 'test@example.com',
        to: 'cubmaster@sfpack1703.com',
        subject: 'Test',
        body: 'Test body',
        date: new Date(),
        attachments: []
      };

      // Mock Firestore to throw error
      vi.mocked(getFirestore).mockReturnValue({
        collection: vi.fn(() => {
          throw new Error('Database error');
        })
      } as any);

      await expect(emailMonitorService['processEmail'](email)).resolves.not.toThrow();
    });
  });
});
