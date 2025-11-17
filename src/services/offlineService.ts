import { offlineCacheService } from './offlineCacheService';
import { firestoreService } from './firestore';
import { chatService } from './chatService';

export interface QueuedAction {
  id: string;
  type: 'send_message' | 'rsvp' | 'feedback' | 'volunteer_signup' | 'create_note' | 'update_note' | 'delete_note' | 'toggle_pin_note';
  payload: any;
  timestamp: number;
  retries: number;
  requiresInternet?: boolean; // If true, needs internet; if false, can work with local connectivity
}

export interface ConnectivityStatus {
  hasInternet: boolean;
  hasLocalConnectivity: boolean; // Can reach Firestore (local network)
  connectivityType: 'full' | 'local-only' | 'offline';
}

export interface OfflineStatus {
  isOnline: boolean;
  connectivity: ConnectivityStatus;
  lastSyncTime: number | null;
  queuedActions: number;
  queuedInternetActions: number;
  cacheSize: string;
}

class OfflineService {
  private isOnline: boolean = navigator.onLine;
  private hasInternet: boolean = false;
  private hasLocalConnectivity: boolean = false;
  private connectivityStatus: ConnectivityStatus = {
    hasInternet: false,
    hasLocalConnectivity: false,
    connectivityType: 'offline'
  };
  private listeners: Set<(isOnline: boolean) => void> = new Set();
  private connectivityListeners: Set<(status: ConnectivityStatus) => void> = new Set();
  private queuedActions: QueuedAction[] = [];
  private readonly QUEUE_KEY = 'offline_action_queue';
  private readonly MAX_RETRIES = 3;
  private syncInProgress: boolean = false;
  private connectivityCheckInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.loadQueuedActions();
    this.setupEventListeners();
    this.checkConnectivity();
    // Check connectivity periodically
    this.connectivityCheckInterval = setInterval(() => {
      this.checkConnectivity();
    }, 10000); // Check every 10 seconds
  }

  /**
   * Check connectivity status (internet and local)
   */
  async checkConnectivity(): Promise<ConnectivityStatus> {
    const browserOnline = navigator.onLine;
    
    // Check internet connectivity
    let hasInternet = false;
    if (browserOnline) {
      try {
        await fetch('/version.json', { 
          method: 'HEAD',
          cache: 'no-cache',
          signal: AbortSignal.timeout(2000)
        });
        hasInternet = true;
      } catch (error) {
        hasInternet = false;
      }
    }

    // Check local connectivity (Firestore)
    let hasLocalConnectivity = false;
    if (browserOnline) {
      try {
        // Try to access Firestore - if we can, we have local connectivity
        const { db } = await import('../firebase/config');
        const { collection, getDocs, limit, query } = await import('firebase/firestore');
        const testRef = collection(db, 'organizations');
        const testQuery = query(testRef, limit(1));
        
        // Use a timeout to detect if Firestore is accessible
        const timeoutPromise = new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Firestore timeout')), 3000)
        );
        
        await Promise.race([
          getDocs(testQuery),
          timeoutPromise
        ]);
        hasLocalConnectivity = true;
      } catch (error) {
        hasLocalConnectivity = false;
      }
    }

    // Determine connectivity type
    let connectivityType: ConnectivityStatus['connectivityType'] = 'offline';
    if (hasInternet) {
      connectivityType = 'full';
    } else if (hasLocalConnectivity) {
      connectivityType = 'local-only';
    }

    const newStatus: ConnectivityStatus = {
      hasInternet,
      hasLocalConnectivity,
      connectivityType
    };

    // Update status if changed
    if (
      this.hasInternet !== hasInternet ||
      this.hasLocalConnectivity !== hasLocalConnectivity ||
      this.connectivityStatus.connectivityType !== connectivityType
    ) {
      this.hasInternet = hasInternet;
      this.hasLocalConnectivity = hasLocalConnectivity;
      this.connectivityStatus = newStatus;
      this.isOnline = hasInternet || hasLocalConnectivity;
      
      this.notifyConnectivityListeners(newStatus);
      this.notifyListeners(this.isOnline);
      
      if (this.isOnline) {
        this.syncWhenOnline();
      }
    }

    return newStatus;
  }

  /**
   * Check if we're currently online (backward compatibility)
   */
  checkOnlineStatus(): boolean {
    this.checkConnectivity();
    return this.isOnline;
  }

  /**
   * Get current connectivity status
   */
  getConnectivityStatus(): ConnectivityStatus {
    return { ...this.connectivityStatus };
  }

  /**
   * Check if we have internet connectivity
   */
  hasInternetConnectivity(): boolean {
    return this.hasInternet;
  }

  /**
   * Check if we have local connectivity (Firestore accessible)
   */
  hasLocalNetworkConnectivity(): boolean {
    return this.hasLocalConnectivity;
  }

  /**
   * Subscribe to connectivity status changes
   */
  onConnectivityChange(callback: (status: ConnectivityStatus) => void): () => void {
    this.connectivityListeners.add(callback);
    // Immediately call with current status
    callback(this.connectivityStatus);
    
    // Return cleanup function
    return () => {
      this.connectivityListeners.delete(callback);
    };
  }

  /**
   * Notify all connectivity listeners
   */
  private notifyConnectivityListeners(status: ConnectivityStatus): void {
    this.connectivityListeners.forEach(callback => {
      try {
        callback(status);
      } catch (error) {
        console.error('Error in connectivity status listener:', error);
      }
    });
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
      console.log('🌐 Browser reports online - checking connectivity...');
      this.checkConnectivity();
    };

    const handleOffline = () => {
      console.log('📴 Browser reports offline');
      this.hasInternet = false;
      this.isOnline = this.hasLocalConnectivity;
      this.connectivityStatus = {
        hasInternet: false,
        hasLocalConnectivity: this.hasLocalConnectivity,
        connectivityType: this.hasLocalConnectivity ? 'local-only' : 'offline'
      };
      this.notifyConnectivityListeners(this.connectivityStatus);
      this.notifyListeners(this.isOnline);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
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
      if (!this.hasLocalConnectivity && !this.hasInternet) {
        console.log('📴 No connectivity - skipping event cache update');
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
      if (!this.hasLocalConnectivity && !this.hasInternet) {
        console.log('📴 No connectivity - skipping announcement cache update');
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
   * Queue an action to be executed when connectivity is available
   * @param action The action to queue
   * @param requiresInternet If true, needs internet; if false, can work with local connectivity
   */
  queueAction(
    action: Omit<QueuedAction, 'id' | 'timestamp' | 'retries' | 'requiresInternet'>,
    requiresInternet: boolean = true
  ): string {
    const queuedAction: QueuedAction = {
      id: `${Date.now()}_${Math.random().toString(36).substring(7)}`,
      timestamp: Date.now(),
      retries: 0,
      requiresInternet,
      ...action
    };

    this.queuedActions.push(queuedAction);
    this.saveQueuedActions();
    console.log('📝 Queued action:', queuedAction.type, queuedAction.id, requiresInternet ? '(requires internet)' : '(local OK)');

    // Try to process immediately if connectivity is available
    if (this.canExecuteAction(queuedAction)) {
      this.processQueue();
    }

    return queuedAction.id;
  }

  /**
   * Check if an action can be executed with current connectivity
   */
  private canExecuteAction(action: QueuedAction): boolean {
    if (action.requiresInternet) {
      return this.hasInternet;
    } else {
      return this.hasLocalConnectivity || this.hasInternet;
    }
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
   * Process queued actions when connectivity is available
   */
  private async processQueue(): Promise<void> {
    if (this.syncInProgress || this.queuedActions.length === 0) {
      return;
    }

    // Filter actions that can be executed with current connectivity
    const executableActions = this.queuedActions.filter(action => this.canExecuteAction(action));
    
    if (executableActions.length === 0) {
      return;
    }

    this.syncInProgress = true;
    console.log('🔄 Processing queued actions:', executableActions.length, 'of', this.queuedActions.length);

    const processed: string[] = [];
    const failed: string[] = [];

    for (const action of executableActions) {
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
    
    // Try again if there are more actions and connectivity improved
    if (this.queuedActions.length > 0) {
      setTimeout(() => this.processQueue(), 1000);
    }
  }

  /**
   * Execute a queued action
   */
  private async executeAction(action: QueuedAction): Promise<void> {
    switch (action.type) {
      case 'send_message':
        // Chat messages can work with local connectivity
        await chatService.sendMessage(action.payload.channelId, action.payload.message);
        break;
      case 'create_note':
        const { notesService } = await import('./notesService');
        await notesService.createNote(action.payload);
        break;
      case 'update_note':
        const { notesService: notesServiceUpdate } = await import('./notesService');
        await notesServiceUpdate.updateNote(action.payload.noteId, action.payload.updates);
        break;
      case 'delete_note':
        const { notesService: notesServiceDelete } = await import('./notesService');
        await notesServiceDelete.deleteNote(action.payload.noteId);
        break;
      case 'toggle_pin_note':
        const { notesService: notesServicePin } = await import('./notesService');
        await notesServicePin.togglePin(action.payload.noteId, action.payload.isPinned);
        break;
      case 'rsvp':
        // RSVP actions would need to be handled by the RSVP service
        const { submitRSVP } = await import('./firestore');
        await submitRSVP(action.payload);
        break;
      case 'feedback':
        // Feedback actions would need to be handled by the feedback service
        const { submitFeedback } = await import('./firestore');
        await submitFeedback(action.payload);
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
   * Sync when connectivity is restored
   */
  private async syncWhenOnline(): Promise<void> {
    if (!this.isOnline || this.syncInProgress) {
      return;
    }

    console.log('🔄 Syncing data after connectivity restored...', this.connectivityStatus.connectivityType);
    
    try {
      // Process queued actions first
      await this.processQueue();

      // Then refresh cached data (only if we have internet)
      if (this.hasInternet) {
        await Promise.all([
          this.cacheEvents(),
          this.cacheAnnouncements(),
          this.cacheLocations()
        ]);
      }

      this.updateLastSyncTime();
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
      if (!this.hasLocalConnectivity && !this.hasInternet) {
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
   * Cleanup on service destruction
   */
  destroy(): void {
    if (this.connectivityCheckInterval) {
      clearInterval(this.connectivityCheckInterval);
    }
  }

  /**
   * Get comprehensive offline status
   */
  getStatus(): OfflineStatus {
    const stats = offlineCacheService.getStats();
    const queuedInternetActions = this.queuedActions.filter(a => a.requiresInternet).length;
    return {
      isOnline: this.isOnline,
      connectivity: { ...this.connectivityStatus },
      lastSyncTime: this.getLastSyncTime(),
      queuedActions: this.queuedActions.length,
      queuedInternetActions,
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

