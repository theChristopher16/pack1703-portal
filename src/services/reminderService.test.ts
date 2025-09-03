import { describe, it, expect, beforeEach, vi } from 'vitest';
import reminderService from '../services/reminderService';
import { Reminder, ReminderType, ReminderPriority, ReminderStatus } from '../types/reminder';
import { Timestamp } from 'firebase/firestore';

// Mock Firebase
vi.mock('../firebase/config', () => ({
  db: {
    collection: vi.fn(),
    batch: vi.fn(() => ({
      update: vi.fn(),
      create: vi.fn(),
      commit: vi.fn()
    }))
  }
}));

// Mock Firestore
const mockCollection = vi.fn();
const mockDoc = vi.fn();
const mockGetDoc = vi.fn();
const mockGetDocs = vi.fn();
const mockAddDoc = vi.fn();
const mockUpdateDoc = vi.fn();
const mockDeleteDoc = vi.fn();
const mockQuery = vi.fn();
const mockWhere = vi.fn();
const mockOrderBy = vi.fn();
const mockLimit = vi.fn();
const mockServerTimestamp = vi.fn(() => Timestamp.now());

vi.mock('firebase/firestore', () => ({
  collection: mockCollection,
  doc: mockDoc,
  getDoc: mockGetDoc,
  getDocs: mockGetDocs,
  addDoc: mockAddDoc,
  updateDoc: mockUpdateDoc,
  deleteDoc: mockDeleteDoc,
  query: mockQuery,
  where: mockWhere,
  orderBy: mockOrderBy,
  limit: mockLimit,
  serverTimestamp: mockServerTimestamp,
  Timestamp: {
    now: () => Timestamp.now(),
    fromDate: (date: Date) => Timestamp.fromDate(date)
  }
}));

describe('ReminderService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createReminder', () => {
    it('should create a new reminder successfully', async () => {
      const mockReminderData = {
        type: 'follow_up' as ReminderType,
        title: 'Test Reminder',
        description: 'Test Description',
        message: 'Test Message',
        priority: 'medium' as ReminderPriority,
        recipientIds: ['user1', 'user2'],
        scheduledFor: Timestamp.now(),
        channels: ['email'] as any,
        frequency: 'once' as any,
        allowAcknowledgment: true,
        requireConfirmation: false,
        autoEscalate: false,
        escalationDelay: 24
      };

      const mockDocRef = { id: 'reminder123' };
      mockAddDoc.mockResolvedValue(mockDocRef);

      const result = await reminderService.createReminder(mockReminderData, 'admin123');

      expect(mockAddDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          ...mockReminderData,
          status: 'pending',
          sendAttempts: 0,
          createdBy: 'admin123'
        })
      );

      expect(result).toEqual({
        id: 'reminder123',
        ...mockReminderData,
        status: 'pending',
        sendAttempts: 0,
        createdBy: 'admin123',
        createdAt: expect.any(Object),
        updatedAt: expect.any(Object)
      });
    });

    it('should throw error when creation fails', async () => {
      const mockReminderData = {
        type: 'follow_up' as ReminderType,
        title: 'Test Reminder',
        description: 'Test Description',
        message: 'Test Message',
        priority: 'medium' as ReminderPriority,
        recipientIds: ['user1'],
        scheduledFor: Timestamp.now(),
        channels: ['email'] as any,
        frequency: 'once' as any,
        allowAcknowledgment: true,
        requireConfirmation: false,
        autoEscalate: false,
        escalationDelay: 24
      };

      mockAddDoc.mockRejectedValue(new Error('Database error'));

      await expect(reminderService.createReminder(mockReminderData, 'admin123'))
        .rejects
        .toThrow('Failed to create reminder: Error: Database error');
    });
  });

  describe('getReminder', () => {
    it('should return reminder when found', async () => {
      const mockReminder = {
        id: 'reminder123',
        type: 'follow_up',
        title: 'Test Reminder',
        status: 'pending'
      };

      mockDoc.mockReturnValue('mockDocRef');
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        id: 'reminder123',
        data: () => mockReminder
      });

      const result = await reminderService.getReminder('reminder123');

      expect(result).toEqual(mockReminder);
    });

    it('should return null when reminder not found', async () => {
      mockDoc.mockReturnValue('mockDocRef');
      mockGetDoc.mockResolvedValue({
        exists: () => false
      });

      const result = await reminderService.getReminder('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('getReminders', () => {
    it('should return reminders with pagination', async () => {
      const mockReminders = [
        { id: 'reminder1', title: 'Reminder 1', status: 'pending' },
        { id: 'reminder2', title: 'Reminder 2', status: 'sent' }
      ];

      mockQuery.mockReturnValue('mockQuery');
      mockGetDocs.mockResolvedValue({
        forEach: (callback: Function) => mockReminders.forEach(callback),
        size: 2
      });

      const result = await reminderService.getReminders();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockReminders);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 2,
        hasMore: false
      });
    });
  });

  describe('updateReminder', () => {
    it('should update reminder successfully', async () => {
      const mockUpdates = {
        title: 'Updated Title',
        priority: 'high' as ReminderPriority
      };

      const mockUpdatedReminder = {
        id: 'reminder123',
        title: 'Updated Title',
        priority: 'high',
        status: 'pending'
      };

      mockDoc.mockReturnValue('mockDocRef');
      mockUpdateDoc.mockResolvedValue(undefined);
      mockGetDoc.mockResolvedValue({
        id: 'reminder123',
        data: () => mockUpdatedReminder
      });

      const result = await reminderService.updateReminder('reminder123', mockUpdates, 'admin123');

      expect(mockUpdateDoc).toHaveBeenCalledWith(
        'mockDocRef',
        expect.objectContaining({
          ...mockUpdates,
          updatedBy: 'admin123'
        })
      );

      expect(result).toEqual(mockUpdatedReminder);
    });
  });

  describe('deleteReminder', () => {
    it('should delete reminder successfully', async () => {
      mockDoc.mockReturnValue('mockDocRef');
      mockDeleteDoc.mockResolvedValue(undefined);

      await reminderService.deleteReminder('reminder123');

      expect(mockDeleteDoc).toHaveBeenCalledWith('mockDocRef');
    });
  });

  describe('bulkAction', () => {
    it('should perform bulk send action', async () => {
      const mockBatch = {
        update: vi.fn(),
        commit: vi.fn()
      };

      mockCollection.mockReturnValue('mockCollection');
      mockDoc.mockReturnValue('mockDocRef');

      const result = await reminderService.bulkAction({
        action: 'send',
        reminderIds: ['reminder1', 'reminder2']
      }, 'admin123');

      expect(result.success).toBe(true);
      expect(result.message).toContain('Successfully performed send on 2 reminders');
    });

    it('should perform bulk cancel action', async () => {
      const mockBatch = {
        update: vi.fn(),
        commit: vi.fn()
      };

      mockCollection.mockReturnValue('mockCollection');
      mockDoc.mockReturnValue('mockDocRef');

      const result = await reminderService.bulkAction({
        action: 'cancel',
        reminderIds: ['reminder1', 'reminder2']
      }, 'admin123');

      expect(result.success).toBe(true);
      expect(result.message).toContain('Successfully performed cancel on 2 reminders');
    });
  });

  describe('getStats', () => {
    it('should return reminder statistics', async () => {
      const mockReminders = [
        { status: 'pending', priority: 'medium', type: 'follow_up', channels: ['email'] },
        { status: 'sent', priority: 'high', type: 'event_deadline', channels: ['email', 'push'] },
        { status: 'completed', priority: 'low', type: 'volunteer_needed', channels: ['sms'] }
      ];

      mockQuery.mockReturnValue('mockQuery');
      mockGetDocs.mockResolvedValue({
        forEach: (callback: Function) => mockReminders.forEach(callback)
      });

      const result = await reminderService.getStats();

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        total: 3,
        pending: 1,
        sent: 1,
        acknowledged: 0,
        completed: 1,
        failed: 0,
        overdue: 0,
        byPriority: {
          low: 1,
          medium: 1,
          high: 1,
          urgent: 0
        },
        byType: {
          event_deadline: 1,
          volunteer_needed: 1,
          payment_due: 0,
          preparation: 0,
          follow_up: 1,
          custom: 0
        },
        byChannel: {
          email: 2,
          push: 1,
          sms: 1,
          chat: 0,
          in_app: 0
        },
        completionRate: 33.33333333333333
      });
    });
  });

  describe('validateReminder', () => {
    it('should return no errors for valid reminder data', () => {
      const validReminder = {
        title: 'Valid Reminder',
        message: 'Valid message',
        recipientIds: ['user1'],
        scheduledFor: Timestamp.now(),
        channels: ['email']
      };

      const errors = reminderService.validateReminder(validReminder);

      expect(errors).toEqual([]);
    });

    it('should return errors for invalid reminder data', () => {
      const invalidReminder = {
        title: '',
        message: '',
        recipientIds: [],
        channels: []
      };

      const errors = reminderService.validateReminder(invalidReminder);

      expect(errors).toContain('Title is required');
      expect(errors).toContain('Message is required');
      expect(errors).toContain('At least one recipient is required');
      expect(errors).toContain('Scheduled date is required');
      expect(errors).toContain('At least one delivery channel is required');
    });
  });

  describe('processTemplate', () => {
    it('should process template variables correctly', () => {
      const template = 'Hello {{name}}, your event {{event}} is scheduled for {{date}}';
      const variables = {
        name: 'John',
        event: 'Pack Meeting',
        date: '2025-01-15'
      };

      const result = reminderService.processTemplate(template, variables);

      expect(result).toBe('Hello John, your event Pack Meeting is scheduled for 2025-01-15');
    });

    it('should handle missing variables gracefully', () => {
      const template = 'Hello {{name}}, your event {{event}} is scheduled for {{date}}';
      const variables = {
        name: 'John'
      };

      const result = reminderService.processTemplate(template, variables);

      expect(result).toBe('Hello John, your event {{event}} is scheduled for {{date}}');
    });
  });

  describe('isOverdue', () => {
    it('should return true for overdue reminder', () => {
      const overdueReminder = {
        dueDate: Timestamp.fromDate(new Date('2024-01-01')),
        status: 'pending'
      };

      const result = reminderService.isOverdue(overdueReminder as any);

      expect(result).toBe(true);
    });

    it('should return false for completed reminder', () => {
      const completedReminder = {
        dueDate: Timestamp.fromDate(new Date('2024-01-01')),
        status: 'completed'
      };

      const result = reminderService.isOverdue(completedReminder as any);

      expect(result).toBe(false);
    });

    it('should return false for reminder without due date', () => {
      const reminderWithoutDueDate = {
        status: 'pending'
      };

      const result = reminderService.isOverdue(reminderWithoutDueDate as any);

      expect(result).toBe(false);
    });
  });
});