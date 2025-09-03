import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter,
  serverTimestamp,
  Timestamp,
  writeBatch,
  QuerySnapshot,
  DocumentData
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { 
  Reminder, 
  ReminderTemplate, 
  ReminderRecipient, 
  ReminderDelivery, 
  ReminderAcknowledgment,
  ReminderStats,
  ReminderAnalytics,
  ReminderFilter,
  ReminderSort,
  ReminderBulkAction,
  ReminderType,
  ReminderPriority,
  ReminderStatus,
  ReminderChannel,
  ReminderFrequency,
  ReminderResponse,
  ReminderListResponse,
  ReminderStatsResponse,
  ReminderAnalyticsResponse
} from '../types/reminder';
import { AppUser, UserRole } from './authService';

// ============================================================================
// REMINDER SERVICE
// ============================================================================

class ReminderService {
  private readonly COLLECTIONS = {
    REMINDERS: 'reminders',
    TEMPLATES: 'reminder_templates',
    DELIVERIES: 'reminder_deliveries',
    ACKNOWLEDGMENTS: 'reminder_acknowledgments',
    SETTINGS: 'reminder_settings',
    STATS: 'reminder_stats'
  };

  // ============================================================================
  // REMINDER CRUD OPERATIONS
  // ============================================================================

  /**
   * Create a new reminder
   */
  async createReminder(reminderData: Omit<Reminder, 'id' | 'createdAt' | 'updatedAt'>, userId: string): Promise<Reminder> {
    try {
      const reminder: Omit<Reminder, 'id'> = {
        ...reminderData,
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp,
        createdBy: userId,
        status: 'pending',
        sendAttempts: 0
      };

      const docRef = await addDoc(collection(db, this.COLLECTIONS.REMINDERS), reminder);
      
      return {
        ...reminder,
        id: docRef.id
      };
    } catch (error) {
      console.error('Error creating reminder:', error);
      throw new Error(`Failed to create reminder: ${error}`);
    }
  }

  /**
   * Get a reminder by ID
   */
  async getReminder(reminderId: string): Promise<Reminder | null> {
    try {
      const docRef = doc(db, this.COLLECTIONS.REMINDERS, reminderId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Reminder;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting reminder:', error);
      throw new Error(`Failed to get reminder: ${error}`);
    }
  }

  /**
   * Get reminders with filtering and pagination
   */
  async getReminders(
    filters: ReminderFilter = {},
    sort: ReminderSort = { field: 'createdAt', direction: 'desc' },
    page: number = 1,
    pageSize: number = 20
  ): Promise<ReminderListResponse> {
    try {
      let q = collection(db, this.COLLECTIONS.REMINDERS);
      const constraints: any[] = [];

      // Apply filters
      if (filters.type) {
        constraints.push(where('type', '==', filters.type));
      }
      if (filters.priority) {
        constraints.push(where('priority', '==', filters.priority));
      }
      if (filters.status) {
        constraints.push(where('status', '==', filters.status));
      }
      if (filters.recipientId) {
        constraints.push(where('recipientIds', 'array-contains', filters.recipientId));
      }
      if (filters.createdBy) {
        constraints.push(where('createdBy', '==', filters.createdBy));
      }
      if (filters.dateRange) {
        constraints.push(where('scheduledFor', '>=', filters.dateRange.start));
        constraints.push(where('scheduledFor', '<=', filters.dateRange.end));
      }

      // Apply sorting
      constraints.push(orderBy(sort.field, sort.direction));

      // Apply pagination
      if (page > 1) {
        // For pagination, we'd need to implement cursor-based pagination
        // This is a simplified version
        constraints.push(limit(pageSize));
      } else {
        constraints.push(limit(pageSize));
      }

      const querySnapshot = await getDocs(query(q, ...constraints));
      const reminders: Reminder[] = [];
      
      querySnapshot.forEach((doc) => {
        reminders.push({ id: doc.id, ...doc.data() } as Reminder);
      });

      // Get total count (simplified - in production you'd want to optimize this)
      const totalQuery = await getDocs(query(collection(db, this.COLLECTIONS.REMINDERS)));
      const total = totalQuery.size;

      return {
        success: true,
        data: reminders,
        pagination: {
          page,
          limit: pageSize,
          total,
          hasMore: page * pageSize < total
        },
        filters
      };
    } catch (error) {
      console.error('Error getting reminders:', error);
      throw new Error(`Failed to get reminders: ${error}`);
    }
  }

  /**
   * Update a reminder
   */
  async updateReminder(reminderId: string, updates: Partial<Reminder>, userId: string): Promise<Reminder> {
    try {
      const docRef = doc(db, this.COLLECTIONS.REMINDERS, reminderId);
      const updateData = {
        ...updates,
        updatedAt: serverTimestamp(),
        updatedBy: userId
      };

      await updateDoc(docRef, updateData);
      
      // Return updated reminder
      const updatedDoc = await getDoc(docRef);
      return { id: updatedDoc.id, ...updatedDoc.data() } as Reminder;
    } catch (error) {
      console.error('Error updating reminder:', error);
      throw new Error(`Failed to update reminder: ${error}`);
    }
  }

  /**
   * Delete a reminder
   */
  async deleteReminder(reminderId: string): Promise<void> {
    try {
      const docRef = doc(db, this.COLLECTIONS.REMINDERS, reminderId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting reminder:', error);
      throw new Error(`Failed to delete reminder: ${error}`);
    }
  }

  /**
   * Bulk operations on reminders
   */
  async bulkAction(action: ReminderBulkAction, userId: string): Promise<ReminderResponse> {
    try {
      const batch = writeBatch(db);
      
      switch (action.action) {
        case 'send':
          for (const reminderId of action.reminderIds) {
            const docRef = doc(db, this.COLLECTIONS.REMINDERS, reminderId);
            batch.update(docRef, {
              status: 'sent',
              sentAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
              updatedBy: userId
            });
          }
          break;
          
        case 'cancel':
          for (const reminderId of action.reminderIds) {
            const docRef = doc(db, this.COLLECTIONS.REMINDERS, reminderId);
            batch.update(docRef, {
              status: 'cancelled',
              updatedAt: serverTimestamp(),
              updatedBy: userId
            });
          }
          break;
          
        case 'reschedule':
          if (!action.data?.scheduledFor) {
            throw new Error('New scheduledFor date is required for reschedule action');
          }
          for (const reminderId of action.reminderIds) {
            const docRef = doc(db, this.COLLECTIONS.REMINDERS, reminderId);
            batch.update(docRef, {
              scheduledFor: action.data.scheduledFor,
              status: 'pending',
              updatedAt: serverTimestamp(),
              updatedBy: userId
            });
          }
          break;
          
        case 'escalate':
          for (const reminderId of action.reminderIds) {
            const docRef = doc(db, this.COLLECTIONS.REMINDERS, reminderId);
            batch.update(docRef, {
              priority: 'urgent',
              updatedAt: serverTimestamp(),
              updatedBy: userId
            });
          }
          break;
          
        case 'delete':
          for (const reminderId of action.reminderIds) {
            const docRef = doc(db, this.COLLECTIONS.REMINDERS, reminderId);
            batch.delete(docRef);
          }
          break;
      }
      
      await batch.commit();
      
      return {
        success: true,
        message: `Successfully performed ${action.action} on ${action.reminderIds.length} reminders`
      };
    } catch (error) {
      console.error('Error performing bulk action:', error);
      throw new Error(`Failed to perform bulk action: ${error}`);
    }
  }

  // ============================================================================
  // TEMPLATE OPERATIONS
  // ============================================================================

  /**
   * Create a reminder template
   */
  async createTemplate(templateData: Omit<ReminderTemplate, 'id' | 'createdAt' | 'updatedAt'>, userId: string): Promise<ReminderTemplate> {
    try {
      const template: Omit<ReminderTemplate, 'id'> = {
        ...templateData,
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp,
        createdBy: userId,
        isActive: true
      };

      const docRef = await addDoc(collection(db, this.COLLECTIONS.TEMPLATES), template);
      
      return {
        ...template,
        id: docRef.id
      };
    } catch (error) {
      console.error('Error creating template:', error);
      throw new Error(`Failed to create template: ${error}`);
    }
  }

  /**
   * Get all active templates
   */
  async getTemplates(): Promise<ReminderTemplate[]> {
    try {
      const q = query(
        collection(db, this.COLLECTIONS.TEMPLATES),
        where('isActive', '==', true),
        orderBy('name')
      );
      
      const querySnapshot = await getDocs(q);
      const templates: ReminderTemplate[] = [];
      
      querySnapshot.forEach((doc) => {
        templates.push({ id: doc.id, ...doc.data() } as ReminderTemplate);
      });
      
      return templates;
    } catch (error) {
      console.error('Error getting templates:', error);
      throw new Error(`Failed to get templates: ${error}`);
    }
  }

  // ============================================================================
  // RECIPIENT OPERATIONS
  // ============================================================================

  /**
   * Get potential recipients based on roles and dens
   */
  async getRecipients(roles?: string[], dens?: string[]): Promise<ReminderRecipient[]> {
    try {
      // This would typically query the users collection
      // For now, we'll return a mock implementation
      const recipients: ReminderRecipient[] = [
        {
          userId: 'user1',
          email: 'den.leader@example.com',
          displayName: 'John Smith',
          role: 'den_leader',
          den: 'Wolf',
          familyId: 'family1',
          channels: ['email', 'push'],
          preferences: {
            emailNotifications: true,
            pushNotifications: true,
            smsNotifications: false
          }
        },
        {
          userId: 'user2',
          email: 'parent@example.com',
          displayName: 'Jane Doe',
          role: 'parent',
          den: 'Bear',
          familyId: 'family2',
          channels: ['email', 'sms'],
          preferences: {
            emailNotifications: true,
            pushNotifications: false,
            smsNotifications: true
          }
        }
      ];

      // Filter by roles if specified
      if (roles && roles.length > 0) {
        return recipients.filter(r => roles.includes(r.role));
      }

      // Filter by dens if specified
      if (dens && dens.length > 0) {
        return recipients.filter(r => r.den && dens.includes(r.den));
      }

      return recipients;
    } catch (error) {
      console.error('Error getting recipients:', error);
      throw new Error(`Failed to get recipients: ${error}`);
    }
  }

  // ============================================================================
  // DELIVERY TRACKING
  // ============================================================================

  /**
   * Record a reminder delivery
   */
  async recordDelivery(deliveryData: Omit<ReminderDelivery, 'id'>): Promise<ReminderDelivery> {
    try {
      const delivery: Omit<ReminderDelivery, 'id'> = {
        ...deliveryData,
        sentAt: serverTimestamp() as Timestamp
      };

      const docRef = await addDoc(collection(db, this.COLLECTIONS.DELIVERIES), delivery);
      
      return {
        ...delivery,
        id: docRef.id
      };
    } catch (error) {
      console.error('Error recording delivery:', error);
      throw new Error(`Failed to record delivery: ${error}`);
    }
  }

  /**
   * Record an acknowledgment
   */
  async recordAcknowledgment(acknowledgmentData: Omit<ReminderAcknowledgment, 'id' | 'acknowledgedAt'>): Promise<ReminderAcknowledgment> {
    try {
      const acknowledgment: Omit<ReminderAcknowledgment, 'id'> = {
        ...acknowledgmentData,
        acknowledgedAt: serverTimestamp() as Timestamp
      };

      const docRef = await addDoc(collection(db, this.COLLECTIONS.ACKNOWLEDGMENTS), acknowledgment);
      
      // Update the reminder status
      await this.updateReminder(acknowledgmentData.reminderId, {
        status: 'acknowledged',
        acknowledgedAt: serverTimestamp() as Timestamp
      }, acknowledgmentData.userId);
      
      return {
        ...acknowledgment,
        id: docRef.id
      };
    } catch (error) {
      console.error('Error recording acknowledgment:', error);
      throw new Error(`Failed to record acknowledgment: ${error}`);
    }
  }

  // ============================================================================
  // STATISTICS AND ANALYTICS
  // ============================================================================

  /**
   * Get reminder statistics
   */
  async getStats(dateRange?: { start: Timestamp; end: Timestamp }): Promise<ReminderStatsResponse> {
    try {
      let q = collection(db, this.COLLECTIONS.REMINDERS);
      
      if (dateRange) {
        q = query(q, 
          where('createdAt', '>=', dateRange.start),
          where('createdAt', '<=', dateRange.end)
        );
      }

      const querySnapshot = await getDocs(q);
      const reminders: Reminder[] = [];
      
      querySnapshot.forEach((doc) => {
        reminders.push({ id: doc.id, ...doc.data() } as Reminder);
      });

      // Calculate statistics
      const stats: ReminderStats = {
        total: reminders.length,
        pending: reminders.filter(r => r.status === 'pending').length,
        sent: reminders.filter(r => r.status === 'sent').length,
        acknowledged: reminders.filter(r => r.status === 'acknowledged').length,
        completed: reminders.filter(r => r.status === 'completed').length,
        failed: reminders.filter(r => r.status === 'failed').length,
        overdue: reminders.filter(r => {
          return r.status === 'pending' && r.dueDate && r.dueDate.toDate() < new Date();
        }).length,
        byPriority: {
          low: reminders.filter(r => r.priority === 'low').length,
          medium: reminders.filter(r => r.priority === 'medium').length,
          high: reminders.filter(r => r.priority === 'high').length,
          urgent: reminders.filter(r => r.priority === 'urgent').length
        },
        byType: {
          event_deadline: reminders.filter(r => r.type === 'event_deadline').length,
          volunteer_needed: reminders.filter(r => r.type === 'volunteer_needed').length,
          payment_due: reminders.filter(r => r.type === 'payment_due').length,
          preparation: reminders.filter(r => r.type === 'preparation').length,
          follow_up: reminders.filter(r => r.type === 'follow_up').length,
          custom: reminders.filter(r => r.type === 'custom').length
        },
        byChannel: {
          email: reminders.filter(r => r.channels.includes('email')).length,
          push: reminders.filter(r => r.channels.includes('push')).length,
          sms: reminders.filter(r => r.channels.includes('sms')).length,
          chat: reminders.filter(r => r.channels.includes('chat')).length,
          in_app: reminders.filter(r => r.channels.includes('in_app')).length
        }
      };

      // Calculate rates
      if (stats.total > 0) {
        stats.completionRate = (stats.completed / stats.total) * 100;
      }

      return {
        success: true,
        data: stats,
        period: dateRange || {
          start: new Timestamp(0, 0),
          end: new Timestamp(Date.now() / 1000, 0)
        }
      };
    } catch (error) {
      console.error('Error getting stats:', error);
      throw new Error(`Failed to get stats: ${error}`);
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Process template variables
   */
  processTemplate(template: string, variables: Record<string, any>): string {
    let processed = template;
    
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{{${key}}}`;
      processed = processed.replace(new RegExp(placeholder, 'g'), String(value));
    }
    
    return processed;
  }

  /**
   * Validate reminder data
   */
  validateReminder(reminderData: Partial<Reminder>): string[] {
    const errors: string[] = [];
    
    if (!reminderData.title?.trim()) {
      errors.push('Title is required');
    }
    
    if (!reminderData.message?.trim()) {
      errors.push('Message is required');
    }
    
    if (!reminderData.recipientIds?.length) {
      errors.push('At least one recipient is required');
    }
    
    if (!reminderData.scheduledFor) {
      errors.push('Scheduled date is required');
    }
    
    if (!reminderData.channels?.length) {
      errors.push('At least one delivery channel is required');
    }
    
    return errors;
  }

  /**
   * Check if reminder is overdue
   */
  isOverdue(reminder: Reminder): boolean {
    if (!reminder.dueDate) return false;
    return reminder.dueDate.toDate() < new Date() && reminder.status !== 'completed';
  }

  /**
   * Get overdue reminders
   */
  async getOverdueReminders(): Promise<Reminder[]> {
    try {
      const now = Timestamp.now();
      const q = query(
        collection(db, this.COLLECTIONS.REMINDERS),
        where('dueDate', '<', now),
        where('status', 'in', ['pending', 'sent', 'acknowledged'])
      );
      
      const querySnapshot = await getDocs(q);
      const reminders: Reminder[] = [];
      
      querySnapshot.forEach((doc) => {
        reminders.push({ id: doc.id, ...doc.data() } as Reminder);
      });
      
      return reminders;
    } catch (error) {
      console.error('Error getting overdue reminders:', error);
      throw new Error(`Failed to get overdue reminders: ${error}`);
    }
  }
}

// Export singleton instance
export const reminderService = new ReminderService();
export default reminderService;