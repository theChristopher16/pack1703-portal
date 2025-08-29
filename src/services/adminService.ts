import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  writeBatch,
  runTransaction,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../firebase/config';
import { adminSchemas } from '../schemas/admin';
import { 
  AdminUser, 
  AdminAction, 
  AuditLog, 
  ValidationResult,
  AdminSearchResult,
  AdminDashboardStats,
  EntityType,
  AdminActionType
} from '../types/admin';

// Cloud Function calls for admin operations
export const adminFunctions = {
  // Season management
  createSeason: httpsCallable(functions, 'adminCreateSeason'),
  updateSeason: httpsCallable(functions, 'adminUpdateSeason'),
  deleteSeason: httpsCallable(functions, 'adminDeleteSeason'),
  
  // Event management
  createEvent: httpsCallable(functions, 'adminCreateEvent'),
  updateEvent: httpsCallable(functions, 'adminUpdateEvent'),
  deleteEvent: httpsCallable(functions, 'adminDeleteEvent'),
  
  // Location management
  createLocation: httpsCallable(functions, 'adminCreateLocation'),
  updateLocation: httpsCallable(functions, 'adminUpdateLocation'),
  deleteLocation: httpsCallable(functions, 'adminDeleteLocation'),
  
  // Announcement management
  createAnnouncement: httpsCallable(functions, 'adminCreateAnnouncement'),
  updateAnnouncement: httpsCallable(functions, 'adminUpdateAnnouncement'),
  deleteAnnouncement: httpsCallable(functions, 'adminDeleteAnnouncement'),
  
  // List management
  createList: httpsCallable(functions, 'adminCreateList'),
  updateList: httpsCallable(functions, 'adminUpdateList'),
  deleteList: httpsCallable(functions, 'adminDeleteList'),
  
  // Volunteer need management
  createVolunteerNeed: httpsCallable(functions, 'adminCreateVolunteerNeed'),
  updateVolunteerNeed: httpsCallable(functions, 'adminUpdateVolunteerNeed'),
  deleteVolunteerNeed: httpsCallable(functions, 'adminDeleteVolunteerNeed'),
  
  // Bulk operations
  bulkOperation: httpsCallable(functions, 'adminBulkOperation'),
  
  // Export/Import
  exportData: httpsCallable(functions, 'adminExportData'),
  importData: httpsCallable(functions, 'adminImportData'),
  
  // System operations
  getDashboardStats: httpsCallable(functions, 'adminGetDashboardStats'),
  getAuditLogs: httpsCallable(functions, 'adminGetAuditLogs'),
  getSystemHealth: httpsCallable(functions, 'adminGetSystemHealth'),
};

// Admin service class
export class AdminService {
  private currentUser: AdminUser | null = null;
  private sessionId: string;

  constructor() {
    this.sessionId = this.generateSessionId();
  }

  // Set current admin user
  setCurrentUser(user: AdminUser | null) {
    this.currentUser = user;
  }

  // Get current admin user
  getCurrentUser(): AdminUser | null {
    return this.currentUser;
  }

  // Generate unique session ID
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Validate data against schema
  private validateData<T>(schema: any, data: T): ValidationResult {
    try {
      const result = schema.safeParse(data);
      
      if (result.success) {
        return {
          isValid: true,
          errors: [],
          warnings: []
        };
      }

      const errors = result.error.errors.map((err: any) => ({
        field: err.path.join('.'),
        message: err.message,
        code: err.code || 'VALIDATION_ERROR',
        severity: 'error' as const
      }));

      return {
        isValid: false,
        errors,
        warnings: []
      };
    } catch (error) {
      return {
        isValid: false,
        errors: [{
          field: 'unknown',
          message: 'Validation failed',
          code: 'VALIDATION_ERROR',
          severity: 'critical'
        }],
        warnings: []
      };
    }
  }

  // Log admin action
  private async logAction(
    action: AdminActionType,
    entityType: EntityType,
    entityId: string,
    entityName: string,
    details?: Record<string, any>,
    success: boolean = true,
    errorMessage?: string
  ): Promise<void> {
    if (!this.currentUser) return;

    try {
      const adminAction: AdminAction = {
        id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: this.currentUser.uid,
        userEmail: this.currentUser.email || '',
        action,
        entityType,
        entityId,
        entityName,
        details: details || {},
        timestamp: new Date(),
        ipAddress: await this.getClientIP(),
        userAgent: navigator.userAgent,
        success,
        errorMessage
      };

      // Add to admin actions collection
      await addDoc(collection(db, 'adminActions'), {
        ...adminAction,
        timestamp: serverTimestamp()
      });

      // Add to audit log
      const auditLog: AuditLog = {
        id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
        userId: this.currentUser.uid,
        userEmail: this.currentUser.email || '',
        action,
        entityType,
        entityId,
        entityName,
        newValues: details,
        metadata: {
          ipAddress: await this.getClientIP(),
          userAgent: navigator.userAgent,
          sessionId: this.sessionId,
          requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        },
        success,
        errorMessage,
        duration: 0 // Will be calculated by the function
      };

      await addDoc(collection(db, 'auditLogs'), {
        ...auditLog,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      console.error('Failed to log admin action:', error);
    }
  }

  // Get client IP address (simplified)
  private async getClientIP(): Promise<string> {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch (error) {
      return 'unknown';
    }
  }

  // Season CRUD operations
  async createSeason(seasonData: any): Promise<{ success: boolean; seasonId?: string; error?: string }> {
    try {
      // Validate data
      const validation = this.validateData(adminSchemas.createSeason, seasonData);
      if (!validation.isValid) {
        await this.logAction('create', 'season', 'new', 'New Season', seasonData, false, validation.errors[0]?.message);
        return { success: false, error: validation.errors[0]?.message };
      }

      // Call cloud function
      const result = await adminFunctions.createSeason(seasonData);
      const data = result.data as any;

      if (data.success) {
        await this.logAction('create', 'season', data.seasonId, seasonData.name, seasonData);
        return { success: true, seasonId: data.seasonId };
      } else {
        await this.logAction('create', 'season', 'new', 'New Season', seasonData, false, data.error);
        return { success: false, error: data.error };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await this.logAction('create', 'season', 'new', 'New Season', seasonData, false, errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  async updateSeason(seasonId: string, seasonData: any): Promise<{ success: boolean; error?: string }> {
    try {
      // Validate data
      const validation = this.validateData(adminSchemas.updateSeason, { ...seasonData, id: seasonId });
      if (!validation.isValid) {
        await this.logAction('update', 'season', seasonId, seasonData.name || 'Season', seasonData, false, validation.errors[0]?.message);
        return { success: false, error: validation.errors[0]?.message };
      }

      // Call cloud function
      const result = await adminFunctions.updateSeason({ seasonId, seasonData });
      const data = result.data as any;

      if (data.success) {
        await this.logAction('update', 'season', seasonId, seasonData.name || 'Season', seasonData);
        return { success: true };
      } else {
        await this.logAction('update', 'season', seasonId, seasonData.name || 'Season', seasonData, false, data.error);
        return { success: false, error: data.error };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await this.logAction('update', 'season', seasonId, seasonData.name || 'Season', seasonData, false, errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  async deleteSeason(seasonId: string, reason?: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Validate data
      const validation = this.validateData(adminSchemas.deleteSeason, { id: seasonId, reason });
      if (!validation.isValid) {
        await this.logAction('delete', 'season', seasonId, 'Season', { reason }, false, validation.errors[0]?.message);
        return { success: false, error: validation.errors[0]?.message };
      }

      // Call cloud function
      const result = await adminFunctions.deleteSeason({ seasonId, reason });
      const data = result.data as any;

      if (data.success) {
        await this.logAction('delete', 'season', seasonId, 'Season', { reason });
        return { success: true };
      } else {
        await this.logAction('delete', 'season', seasonId, 'Season', { reason }, false, data.error);
        return { success: false, error: data.error };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await this.logAction('delete', 'season', seasonId, 'Season', { reason }, false, errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  // Event CRUD operations
  async createEvent(eventData: any): Promise<{ success: boolean; eventId?: string; error?: string }> {
    try {
      const validation = this.validateData(adminSchemas.createEvent, eventData);
      if (!validation.isValid) {
        await this.logAction('create', 'event', 'new', 'New Event', eventData, false, validation.errors[0]?.message);
        return { success: false, error: validation.errors[0]?.message };
      }

      const result = await adminFunctions.createEvent(eventData);
      const data = result.data as any;

      if (data.success) {
        await this.logAction('create', 'event', data.eventId, eventData.title, eventData);
        return { success: true, eventId: data.eventId };
      } else {
        await this.logAction('create', 'event', 'new', 'New Event', eventData, false, data.error);
        return { success: false, error: data.error };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await this.logAction('create', 'event', 'new', 'New Event', eventData, false, errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  async updateEvent(eventId: string, eventData: any): Promise<{ success: boolean; error?: string }> {
    try {
      const validation = this.validateData(adminSchemas.updateEvent, { ...eventData, id: eventId });
      if (!validation.isValid) {
        await this.logAction('update', 'event', eventId, eventData.title || 'Event', eventData, false, validation.errors[0]?.message);
        return { success: false, error: validation.errors[0]?.message };
      }

      const result = await adminFunctions.updateEvent({ eventId, eventData });
      const data = result.data as any;

      if (data.success) {
        await this.logAction('update', 'event', eventId, eventData.title || 'Event', eventData);
        return { success: true };
      } else {
        await this.logAction('update', 'event', eventId, eventData.title || 'Event', eventData, false, data.error);
        return { success: false, error: data.error };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await this.logAction('update', 'event', eventId, eventData.title || 'Event', eventData, false, errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  async deleteEvent(eventId: string, reason?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const validation = this.validateData(adminSchemas.deleteEvent, { id: eventId, reason });
      if (!validation.isValid) {
        await this.logAction('delete', 'event', eventId, 'Event', { reason }, false, validation.errors[0]?.message);
        return { success: false, error: validation.errors[0]?.message };
      }

      const result = await adminFunctions.deleteEvent({ eventId, reason });
      const data = result.data as any;

      if (data.success) {
        await this.logAction('delete', 'event', eventId, 'Event', { reason });
        return { success: true };
      } else {
        await this.logAction('delete', 'event', eventId, 'Event', { reason }, false, data.error);
        return { success: false, error: data.error };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await this.logAction('delete', 'event', eventId, 'Event', { reason }, false, errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  // Location CRUD operations
  async createLocation(locationData: any): Promise<{ success: boolean; locationId?: string; error?: string }> {
    try {
      const validation = this.validateData(adminSchemas.createLocation, locationData);
      if (!validation.isValid) {
        await this.logAction('create', 'location', 'new', 'New Location', locationData, false, validation.errors[0]?.message);
        return { success: false, error: validation.errors[0]?.message };
      }

      const result = await adminFunctions.createLocation(locationData);
      const data = result.data as any;

      if (data.success) {
        await this.logAction('create', 'location', data.locationId, locationData.name, locationData);
        return { success: true, locationId: data.locationId };
      } else {
        await this.logAction('create', 'location', 'new', 'New Location', locationData, false, data.error);
        return { success: false, error: data.error };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await this.logAction('create', 'location', 'new', 'New Location', locationData, false, errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  async updateLocation(locationId: string, locationData: any): Promise<{ success: boolean; error?: string }> {
    try {
      const validation = this.validateData(adminSchemas.updateLocation, { ...locationData, id: locationId });
      if (!validation.isValid) {
        await this.logAction('update', 'location', locationId, locationData.name || 'Location', locationData, false, validation.errors[0]?.message);
        return { success: false, error: validation.errors[0]?.message };
      }

      const result = await adminFunctions.updateLocation({ locationId, locationData });
      const data = result.data as any;

      if (data.success) {
        await this.logAction('update', 'location', locationId, locationData.name || 'Location', locationData);
        return { success: true };
      } else {
        await this.logAction('update', 'location', locationId, locationData.name || 'Location', locationData, false, data.error);
        return { success: false, error: data.error };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await this.logAction('update', 'location', locationId, locationData.name || 'Location', locationData, false, errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  async deleteLocation(locationId: string, reason?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const validation = this.validateData(adminSchemas.deleteLocation, { id: locationId, reason });
      if (!validation.isValid) {
        await this.logAction('delete', 'location', locationId, 'Location', { reason }, false, validation.errors[0]?.message);
        return { success: false, error: validation.errors[0]?.message };
      }

      const result = await adminFunctions.deleteLocation({ locationId, reason });
      const data = result.data as any;

      if (data.success) {
        await this.logAction('delete', 'location', locationId, 'Location', { reason });
        return { success: true };
      } else {
        await this.logAction('delete', 'location', locationId, 'Location', { reason }, false, data.error);
        return { success: false, error: data.error };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await this.logAction('delete', 'location', locationId, 'Location', { reason }, false, errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  // Announcement CRUD operations
  async createAnnouncement(announcementData: any): Promise<{ success: boolean; announcementId?: string; error?: string }> {
    try {
      const validation = this.validateData(adminSchemas.createAnnouncement, announcementData);
      if (!validation.isValid) {
        await this.logAction('create', 'announcement', 'new', 'New Announcement', announcementData, false, validation.errors[0]?.message);
        return { success: false, error: validation.errors[0]?.message };
      }

      const result = await adminFunctions.createAnnouncement(announcementData);
      const data = result.data as any;

      if (data.success) {
        await this.logAction('create', 'announcement', data.announcementId, announcementData.title, announcementData);
        return { success: true, announcementId: data.announcementId };
      } else {
        await this.logAction('create', 'announcement', 'new', 'New Announcement', announcementData, false, data.error);
        return { success: false, error: data.error };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await this.logAction('create', 'announcement', 'new', 'New Announcement', announcementData, false, errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  async updateAnnouncement(announcementId: string, announcementData: any): Promise<{ success: boolean; error?: string }> {
    try {
      const validation = this.validateData(adminSchemas.updateAnnouncement, { ...announcementData, id: announcementId });
      if (!validation.isValid) {
        await this.logAction('update', 'announcement', announcementId, announcementData.title || 'Announcement', announcementData, false, validation.errors[0]?.message);
        return { success: false, error: validation.errors[0]?.message };
      }

      const result = await adminFunctions.updateAnnouncement({ announcementId, announcementData });
      const data = result.data as any;

      if (data.success) {
        await this.logAction('update', 'announcement', announcementId, announcementData.title || 'Announcement', announcementData);
        return { success: true };
      } else {
        await this.logAction('update', 'announcement', announcementId, announcementData.title || 'Announcement', announcementData, false, data.error);
        return { success: false, error: data.error };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await this.logAction('update', 'announcement', announcementId, announcementData.title || 'Announcement', announcementData, false, errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  async deleteAnnouncement(announcementId: string, reason?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const validation = this.validateData(adminSchemas.deleteAnnouncement, { id: announcementId, reason });
      if (!validation.isValid) {
        await this.logAction('delete', 'announcement', announcementId, 'Announcement', { reason }, false, validation.errors[0]?.message);
        return { success: false, error: validation.errors[0]?.message };
      }

      const result = await adminFunctions.deleteAnnouncement({ announcementId, reason });
      const data = result.data as any;

      if (data.success) {
        await this.logAction('delete', 'announcement', announcementId, 'Announcement', { reason });
        return { success: true };
      } else {
        await this.logAction('delete', 'announcement', announcementId, 'Announcement', { reason }, false, data.error);
        return { success: false, error: data.error };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await this.logAction('delete', 'announcement', announcementId, 'Announcement', { reason }, false, errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  // Bulk operations
  async bulkOperation(operation: AdminActionType, entityType: EntityType, entityIds: string[], options?: any): Promise<{ success: boolean; operationId?: string; error?: string }> {
    try {
      const validation = this.validateData(adminSchemas.bulkOperation, { operation, entityType, entityIds, options });
      if (!validation.isValid) {
        await this.logAction(operation, entityType, 'bulk', `Bulk ${operation}`, { entityIds, options }, false, validation.errors[0]?.message);
        return { success: false, error: validation.errors[0]?.message };
      }

      const result = await adminFunctions.bulkOperation({ operation, entityType, entityIds, options });
      const data = result.data as any;

      if (data.success) {
        await this.logAction(operation, entityType, 'bulk', `Bulk ${operation}`, { entityIds, options });
        return { success: true, operationId: data.operationId };
      } else {
        await this.logAction(operation, entityType, 'bulk', `Bulk ${operation}`, { entityIds, options }, false, data.error);
        return { success: false, error: data.error };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await this.logAction(operation, entityType, 'bulk', `Bulk ${operation}`, { entityIds, options }, false, errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  // Dashboard stats
  async getDashboardStats(): Promise<AdminDashboardStats | null> {
    try {
      const result = await adminFunctions.getDashboardStats();
      return result.data as AdminDashboardStats;
    } catch (error) {
      console.error('Failed to get dashboard stats:', error);
      return null;
    }
  }

  // Audit logs
  async getAuditLogs(filters?: any): Promise<AuditLog[]> {
    try {
      const result = await adminFunctions.getAuditLogs(filters);
      return result.data as AuditLog[];
    } catch (error) {
      console.error('Failed to get audit logs:', error);
      return [];
    }
  }

  // System health
  async getSystemHealth(): Promise<any> {
    try {
      const result = await adminFunctions.getSystemHealth();
      return result.data;
    } catch (error) {
      console.error('Failed to get system health:', error);
      return null;
    }
  }

  // Export data
  async exportData(options: any): Promise<{ success: boolean; downloadUrl?: string; error?: string }> {
    try {
      const validation = this.validateData(adminSchemas.exportOptions, options);
      if (!validation.isValid) {
        return { success: false, error: validation.errors[0]?.message };
      }

      const result = await adminFunctions.exportData(options);
      const data = result.data as any;

      if (data.success) {
        return { success: true, downloadUrl: data.downloadUrl };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: errorMessage };
    }
  }

  // Import data
  async importData(options: any, file: File): Promise<{ success: boolean; operationId?: string; error?: string }> {
    try {
      const validation = this.validateData(adminSchemas.importOptions, options);
      if (!validation.isValid) {
        return { success: false, error: validation.errors[0]?.message };
      }

      // Convert file to base64 for transmission
      const base64File = await this.fileToBase64(file);
      
      const result = await adminFunctions.importData({ ...options, file: base64File });
      const data = result.data as any;

      if (data.success) {
        return { success: true, operationId: data.operationId };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: errorMessage };
    }
  }

  // Helper method to convert file to base64
  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64 = reader.result as string;
        // Remove data URL prefix
        const base64Data = base64.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = error => reject(error);
    });
  }
}

// Export singleton instance
export const adminService = new AdminService();
