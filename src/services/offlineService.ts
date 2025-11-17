import { offlineCacheService } from './offlineCacheService';
import { firestoreService } from './firestore';
import { chatService } from './chatService';

export interface QueuedAction {
  id: string;
  type: 'send_message' | 'rsvp' | 'feedback' | 'volunteer_signup';
  payload: any;
  timestamp: number;
  retries: number;
}

export interface OfflineStatus {
  isOnline: boolean;
  lastSyncTime: number | null;
  queuedActions: number;
  cacheSize: string;
}

class OfflineService {
  private isOnline: boolean = navigator.onLine;
  private listeners: Set<(isOnline: boolean) => void> = new Set();
  private queuedActions: QueuedAction[] = [];
  private readonly QUEUE_KEY = 'offline_action_queue';
  private readonly MAX_RETRIES = 3;
  private syncInProgress: boolean = false;

  constructor() {
    this.loadQueuedActions();
    this.setupEventListeners();
    this.checkOnlineStatus();
  }

  /**
   * Check if we're currently online
   */
  checkOnlineStatus(): boolean {
    // navigator.onLine can be unreliable, so we also do a quick fetch test
    const browserOnline = navigator.onLine;
    
    if (!browserOnline) {
      this.setOnlineStatus(false);
      return false;
    }

    // Do a quick connectivity check
    fetch('/version.json', { 
      method: 'HEAD',
      cache: 'no-cache',
      signal: AbortSignal.timeout(2000)
    })
      .then(() => {
        this.setOnlineStatus(true);
      })
      .catch(() => {
        this.setOnlineStatus(false);
      });

    return browserOnline;
  }

  /**
   * Get current online status
   */
  getOnlineStatus(): boolean {
    return this.isOnline;
  }

  /**
   * Set online status and notify listeners
   */
  private setOnlineStatus(isOnline: boolean): void {
    if (this.isOnline !== isOnline) {
      this.isOnline = isOnline;
      this.notifyListeners(isOnline);
      
      if (isOnline) {
        this.syncWhenOnline();
      }
    }
  }

  /**
   * Setup event listeners for online/offline events
   */
  private setupEventListeners(): void {
    const handleOnline = () => {
      console.log('🌐 Online status: Online');
      this.setOnlineStatus(true);
    };

    const handleOffline = () => {
      console.log('📴 Online status: Offline');
      this.setOnlineStatus(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Also check periodically
    setInterval(() => {
      this.checkOnlineStatus();
    }, 30000); // Check every 30 seconds
  }

  /**
   * Subscribe to online status changes
   */
  onStatusChange(callback: (isOnline: boolean) => void): () => void {
    this.listeners.add(callback);
    // Immediately call with current status
    callback(this.isOnline);
    
    // Return cleanup function
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Notify all listeners of status change
   */
  private notifyListeners(isOnline: boolean): void {
    this.listeners.forEach(callback => {
      try {
        callback(isOnline);
      } catch (error) {
        console.error('Error in offline status listener:', error);
      }
    });
  }

  /**
   * Cache events for offline access
   */
  async cacheEvents(organizationId?: string | null): Promise<void> {
    try {
      if (!this.isOnline) {
        console.log('📴 Offline - skipping event cache update');
        return;
      }

      const events = await firestoreService.getEvents(organizationId);
      offlineCacheService.set('events', events, {
        maxAge: 6 * 60 * 60 * 1000, // 6 hours
        maxSize: 100
      });
      console.log('✅ Cached events for offline access:', events.length);
    } catch (error) {
      console.error('Failed to cache events:', error);
    }
  }

  /**
   * Get cached events
   */
  getCachedEvents(organizationId?: string | null): any[] | null {
    const cached = offlineCacheService.get<any[]>('events');
    if (!cached) return null;

    // Filter by organizationId if provided
    if (organizationId && organizationId !== 'pack1703') {
      return cached.filter((event: any) => event.organizationId === organizationId);
    }

    return cached;
  }

  /**
   * Cache announcements for offline access
   */
  async cacheAnnouncements(organizationId?: string | null): Promise<void> {
    try {
      if (!this.isOnline) {
        console.log('📴 Offline - skipping announcement cache update');
        return;
      }

      const announcements = await firestoreService.getAnnouncements(organizationId);
      offlineCacheService.set('announcements', announcements, {
        maxAge: 2 * 60 * 60 * 1000, // 2 hours
        maxSize: 100
      });
      console.log('✅ Cached announcements for offline access:', announcements.length);
    } catch (error) {
      console.error('Failed to cache announcements:', error);
    }
  }

  /**
   * Get cached announcements
   */
  getCachedAnnouncements(organizationId?: string | null): any[] | null {
    const cached = offlineCacheService.get<any[]>('announcements');
    if (!cached) return null;

    // Filter by organizationId if provided
    if (organizationId) {
      return cached.filter((announcement: any) => announcement.organizationId === organizationId);
    }

    return cached;
  }

  /**
   * Cache chat messages for a channel
   */
  async cacheChatMessages(channelId: string, messages: any[]): Promise<void> {
    try {
      offlineCacheService.set(`chat_${channelId}`, messages, {
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        maxSize: 50
      });
      console.log(`✅ Cached ${messages.length} messages for channel ${channelId}`);
    } catch (error) {
      console.error('Failed to cache chat messages:', error);
    }
  }

  /**
   * Get cached chat messages for a channel
   */
  getCachedChatMessages(channelId: string): any[] | null {
    return offlineCacheService.get<any[]>(`chat_${channelId}`);
  }

  /**
   * Queue an action to be executed when online
   */
  queueAction(action: Omit<QueuedAction, 'id' | 'timestamp' | 'retries'>): string {
    const queuedAction: QueuedAction = {
      id: `${Date.now()}_${Math.random().toString(36).substring(7)}`,
      timestamp: Date.now(),
      retries: 0,
      ...action
    };

    this.queuedActions.push(queuedAction);
    this.saveQueuedActions();
    console.log('📝 Queued action for when online:', queuedAction.type, queuedAction.id);

    // Try to process immediately if online
    if (this.isOnline) {
      this.processQueue();
    }

    return queuedAction.id;
  }

  /**
   * Load queued actions from storage
   */
  private loadQueuedActions(): void {
    try {
      const stored = localStorage.getItem(this.QUEUE_KEY);
      if (stored) {
        this.queuedActions = JSON.parse(stored);
        console.log('📦 Loaded queued actions:', this.queuedActions.length);
      }
    } catch (error) {
      console.error('Failed to load queued actions:', error);
      this.queuedActions = [];
    }
  }

  /**
   * Save queued actions to storage
   */
  private saveQueuedActions(): void {
    try {
      localStorage.setItem(this.QUEUE_KEY, JSON.stringify(this.queuedActions));
    } catch (error) {
      console.error('Failed to save queued actions:', error);
    }
  }

  /**
   * Remove a queued action
   */
  removeQueuedAction(actionId: string): void {
    this.queuedActions = this.queuedActions.filter(action => action.id !== actionId);
    this.saveQueuedActions();
  }

  /**
   * Get all queued actions
   */
  getQueuedActions(): QueuedAction[] {
    return [...this.queuedActions];
  }

  /**
   * Process queued actions when coming back online
   */
  private async processQueue(): Promise<void> {
    if (this.syncInProgress || !this.isOnline || this.queuedActions.length === 0) {
      return;
    }

    this.syncInProgress = true;
    console.log('🔄 Processing queued actions:', this.queuedActions.length);

    const actionsToProcess = [...this.queuedActions];
    const processed: string[] = [];
    const failed: string[] = [];

    for (const action of actionsToProcess) {
      try {
        await this.executeAction(action);
        processed.push(action.id);
        this.removeQueuedAction(action.id);
      } catch (error) {
        console.error('Failed to execute queued action:', action.id, error);
        action.retries++;
        
        if (action.retries >= this.MAX_RETRIES) {
          failed.push(action.id);
          this.removeQueuedAction(action.id);
          console.warn('Max retries reached for action:', action.id);
        } else {
          // Update the action with new retry count
          const index = this.queuedActions.findIndex(a => a.id === action.id);
          if (index !== -1) {
            this.queuedActions[index] = action;
            this.saveQueuedActions();
          }
        }
      }
    }

    this.syncInProgress = false;
    console.log(`✅ Processed ${processed.length} actions, ${failed.length} failed`);
  }

  /**
   * Execute a queued action
   */
  private async executeAction(action: QueuedAction): Promise<void> {
    switch (action.type) {
      case 'send_message':
        await chatService.sendMessage(action.payload.channelId, action.payload.message);
        break;
      case 'rsvp':
        // RSVP actions would need to be handled by the RSVP service
        console.warn('RSVP queue action not yet implemented');
        break;
      case 'feedback':
        // Feedback actions would need to be handled by the feedback service
        console.warn('Feedback queue action not yet implemented');
        break;
      case 'volunteer_signup':
        // Volunteer signup actions would need to be handled by the volunteer service
        console.warn('Volunteer signup queue action not yet implemented');
        break;
      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }
  }

  /**
   * Sync when coming back online
   */
  private async syncWhenOnline(): Promise<void> {
    if (!this.isOnline || this.syncInProgress) {
      return;
    }

    console.log('🔄 Syncing data after coming back online...');
    
    try {
      // Process queued actions first
      await this.processQueue();

      // Then refresh cached data
      await Promise.all([
        this.cacheEvents(),
        this.cacheAnnouncements(),
        this.cacheLocations()
      ]);

      console.log('✅ Sync complete');
    } catch (error) {
      console.error('Error during sync:', error);
    }
  }

  /**
   * Cache locations (using existing offlineCacheService method)
   */
  async cacheLocations(): Promise<void> {
    try {
      if (!this.isOnline) {
        return;
      }

      const locations = await firestoreService.getLocations();
      offlineCacheService.cacheLocations(locations);
      console.log('✅ Cached locations for offline access:', locations.length);
    } catch (error) {
      console.error('Failed to cache locations:', error);
    }
  }

  /**
   * Get comprehensive offline status
   */
  getStatus(): OfflineStatus {
    const stats = offlineCacheService.getStats();
    return {
      isOnline: this.isOnline,
      lastSyncTime: this.getLastSyncTime(),
      queuedActions: this.queuedActions.length,
      cacheSize: offlineCacheService.getCacheSizeFormatted()
    };
  }

  /**
   * Get last sync time from cache metadata
   */
  private getLastSyncTime(): number | null {
    const syncTime = localStorage.getItem('offline_last_sync');
    return syncTime ? parseInt(syncTime, 10) : null;
  }

  /**
   * Update last sync time
   */
  private updateLastSyncTime(): void {
    localStorage.setItem('offline_last_sync', Date.now().toString());
  }

  /**
   * Clear all offline data
   */
  clearAll(): void {
    offlineCacheService.clear();
    this.queuedActions = [];
    this.saveQueuedActions();
    localStorage.removeItem('offline_last_sync');
    console.log('🗑️ Cleared all offline data');
  }
}

export const offlineService = new OfflineService();
export default offlineService;

