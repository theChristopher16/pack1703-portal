// Version check service for cache invalidation
// Handles checking for app updates and prompting users to refresh

interface VersionInfo {
  version: string;
  buildTime: string;
  buildHash: string;
  gitCommit: string;
  environment: string;
}

class VersionCheckService {
  private static instance: VersionCheckService;
  private currentVersion: VersionInfo | null = null;
  private checkInterval: NodeJS.Timeout | null = null;
  private isChecking = false;

  private constructor() {
    this.loadStoredVersion();
  }

  static getInstance(): VersionCheckService {
    if (!VersionCheckService.instance) {
      VersionCheckService.instance = new VersionCheckService();
    }
    return VersionCheckService.instance;
  }

  // Start periodic version checking
  startVersionCheck(intervalMinutes: number = 5): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    this.checkInterval = setInterval(() => {
      this.checkForUpdates();
    }, intervalMinutes * 60 * 1000);

    // Check immediately on start
    this.checkForUpdates();
  }

  // Stop version checking
  stopVersionCheck(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  // Check for updates
  async checkForUpdates(): Promise<boolean> {
    if (this.isChecking) {
      return false;
    }

    this.isChecking = true;

    try {
      const response = await fetch(`/version.json?t=${Date.now()}`, {
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const versionInfo: VersionInfo = await response.json();
      
      if (this.currentVersion && this.currentVersion.buildTime !== versionInfo.buildTime) {
        console.log('🔄 New version detected:', versionInfo);
        this.handleVersionUpdate(versionInfo);
        return true;
      }

      // Store current version
      this.currentVersion = versionInfo;
      this.storeVersion(versionInfo);
      
      return false;
    } catch (error) {
      console.warn('Version check failed:', error);
      return false;
    } finally {
      this.isChecking = false;
    }
  }

  // Handle version update
  private handleVersionUpdate(newVersion: VersionInfo): void {
    // Dispatch custom event for components to listen to
    const event = new CustomEvent('versionUpdate', {
      detail: {
        newVersion,
        currentVersion: this.currentVersion
      }
    });
    
    window.dispatchEvent(event);

    // Show update notification
    this.showUpdateNotification(newVersion);
  }

  // Show update notification
  private showUpdateNotification(versionInfo: VersionInfo): void {
    // Check if notification already exists
    if (document.getElementById('version-update-notification')) {
      return;
    }

    const notification = document.createElement('div');
    notification.id = 'version-update-notification';
    notification.className = 'fixed top-4 right-4 z-50 bg-blue-600 text-white p-4 rounded-lg shadow-lg max-w-sm';
    notification.innerHTML = `
      <div class="flex items-start space-x-3">
        <div class="flex-shrink-0">
          <svg class="w-5 h-5 text-blue-200" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path>
          </svg>
        </div>
        <div class="flex-1">
          <h3 class="text-sm font-medium">New Version Available</h3>
          <p class="text-sm text-blue-200 mt-1">
            A new version of the app is available. Refresh to get the latest features and improvements.
          </p>
          <div class="mt-3 flex space-x-2">
            <button 
              id="refresh-app-btn"
              class="bg-blue-500 hover:bg-blue-400 text-white text-xs px-3 py-1 rounded transition-colors"
            >
              Refresh Now
            </button>
            <button 
              id="dismiss-update-btn"
              class="bg-blue-700 hover:bg-blue-600 text-white text-xs px-3 py-1 rounded transition-colors"
            >
              Later
            </button>
          </div>
        </div>
        <button 
          id="close-update-btn"
          class="flex-shrink-0 text-blue-200 hover:text-white"
        >
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
          </svg>
        </button>
      </div>
    `;

    document.body.appendChild(notification);

    // Add event listeners
    const refreshBtn = notification.querySelector('#refresh-app-btn');
    const dismissBtn = notification.querySelector('#dismiss-update-btn');
    const closeBtn = notification.querySelector('#close-update-btn');

    refreshBtn?.addEventListener('click', () => {
      this.refreshApp();
    });

    dismissBtn?.addEventListener('click', () => {
      this.dismissNotification(notification);
    });

    closeBtn?.addEventListener('click', () => {
      this.dismissNotification(notification);
    });

    // Auto-dismiss after 30 seconds
    setTimeout(() => {
      this.dismissNotification(notification);
    }, 30000);
  }

  // Refresh the app
  private refreshApp(): void {
    // Clear service worker caches
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => {
          registration.unregister();
        });
      });
    }

    // Clear localStorage cache
    const keysToRemove = Object.keys(localStorage).filter(key => 
      key.startsWith('cache_') || key.startsWith('version_')
    );
    keysToRemove.forEach(key => localStorage.removeItem(key));

    // Force reload
    window.location.reload();
  }

  // Dismiss notification
  private dismissNotification(notification: HTMLElement): void {
    notification.style.opacity = '0';
    notification.style.transform = 'translateX(100%)';
    
    setTimeout(() => {
      notification.remove();
    }, 300);
  }

  // Store version in localStorage
  private storeVersion(versionInfo: VersionInfo): void {
    try {
      localStorage.setItem('version_info', JSON.stringify(versionInfo));
    } catch (error) {
      console.warn('Failed to store version info:', error);
    }
  }

  // Load stored version
  private loadStoredVersion(): void {
    try {
      const stored = localStorage.getItem('version_info');
      if (stored) {
        this.currentVersion = JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to load stored version:', error);
    }
  }

  // Get current version
  getCurrentVersion(): VersionInfo | null {
    return this.currentVersion;
  }

  // Force check for updates
  async forceCheck(): Promise<boolean> {
    return this.checkForUpdates();
  }
}

// Export singleton instance
export const versionCheckService = VersionCheckService.getInstance();

// Auto-start version checking in production
if (process.env.NODE_ENV === 'production') {
  versionCheckService.startVersionCheck(5); // Check every 5 minutes
}
