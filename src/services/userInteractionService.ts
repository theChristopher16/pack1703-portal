import { getFirestore, collection, addDoc, serverTimestamp, query, getDocs, orderBy, limit, where } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

export interface UserInteractionEvent {
  type: 'button_click' | 'page_navigation' | 'form_interaction' | 'component_view' | 'user_action';
  eventName: string;
  componentId?: string;
  componentName?: string;
  componentPath?: string;
  page?: string;
  elementType?: string; // button, link, input, etc.
  elementText?: string; // visible text of the element
  elementId?: string; // HTML id of the element
  elementClass?: string; // HTML class of the element
  metadata?: any;
  userAgent?: string;
  timestamp?: any;
  userId?: string;
  userEmail?: string | null;
  sessionId?: string;
  screenResolution?: string;
  language?: string;
  timezone?: string;
}

class UserInteractionService {
  private db = getFirestore();
  private auth = getAuth();
  private sessionId: string;
  private interactionBuffer: UserInteractionEvent[] = [];
  private flushInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.initializeBuffering();
  }

  private initializeBuffering() {
    // Flush buffer every 5 seconds to reduce Firestore writes
    this.flushInterval = setInterval(() => {
      this.flushBuffer();
    }, 5000);
  }

  private async flushBuffer() {
    if (this.interactionBuffer.length === 0) return;

    const eventsToFlush = [...this.interactionBuffer];
    this.interactionBuffer = [];

    try {
      // Batch write all buffered events
      const batch = eventsToFlush.map(event => 
        addDoc(collection(this.db, 'userInteractions'), event)
      );

      await Promise.all(batch);
    } catch (error) {
      console.error('Error flushing interaction buffer:', error);
      // Re-add events to buffer if flush failed
      this.interactionBuffer.unshift(...eventsToFlush);
    }
  }

  async trackInteraction(event: Omit<UserInteractionEvent, 'timestamp' | 'userId' | 'userEmail' | 'sessionId' | 'screenResolution' | 'language' | 'timezone'>): Promise<void> {
    try {
      const user = this.auth.currentUser;
      
      // Only track if user is authenticated
      if (!user) {
        return;
      }

      const enrichedEvent: UserInteractionEvent = {
        ...event,
        userId: user.uid,
        userEmail: user.email || null,
        sessionId: this.sessionId,
        userAgent: event.userAgent || navigator.userAgent,
        screenResolution: `${window.screen.width}x${window.screen.height}`,
        language: navigator.language,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        timestamp: serverTimestamp()
      };

      // Add to buffer instead of immediately writing
      this.interactionBuffer.push(enrichedEvent);

      // Flush if buffer is getting large
      if (this.interactionBuffer.length >= 10) {
        this.flushBuffer();
      }

    } catch (error) {
      console.error('Error tracking user interaction:', error);
    }
  }

  // Track button clicks with detailed information
  async trackButtonClick(buttonElement: HTMLElement, additionalMetadata?: any): Promise<void> {
    const eventName = buttonElement.getAttribute('data-analytics-event') || 
                     buttonElement.textContent?.trim() || 
                     buttonElement.getAttribute('aria-label') || 
                     'unknown_button';

    await this.trackInteraction({
      type: 'button_click',
      eventName,
      elementType: 'button',
      elementText: buttonElement.textContent?.trim(),
      elementId: buttonElement.id || '',
      elementClass: buttonElement.className || '',
      page: window.location.pathname,
      metadata: {
        ...additionalMetadata,
        href: buttonElement.getAttribute('href'),
        disabled: buttonElement.hasAttribute('disabled'),
        buttonType: buttonElement.getAttribute('type')
      }
    });
  }

  // Track page navigation
  async trackPageNavigation(fromPage: string, toPage: string, navigationMethod: 'link' | 'programmatic' | 'back' | 'forward' = 'programmatic'): Promise<void> {
    await this.trackInteraction({
      type: 'page_navigation',
      eventName: `navigate_${navigationMethod}`,
      page: toPage,
      metadata: {
        fromPage,
        toPage,
        navigationMethod
      }
    });
  }

  // Track form interactions
  async trackFormInteraction(action: string, formName?: string, fieldName?: string, additionalMetadata?: any): Promise<void> {
    await this.trackInteraction({
      type: 'form_interaction',
      eventName: action,
      elementType: 'form',
      elementText: formName,
      elementId: fieldName || '',
      page: window.location.pathname,
      metadata: {
        formName,
        fieldName,
        ...additionalMetadata
      }
    });
  }

  // Track component views (when components mount/are visible)
  async trackComponentView(componentName: string, componentPath?: string, additionalMetadata?: any): Promise<void> {
    await this.trackInteraction({
      type: 'component_view',
      eventName: `view_${componentName}`,
      componentName,
      componentPath,
      page: window.location.pathname,
      metadata: additionalMetadata
    });
  }

  // Track user actions like RSVP, chat messages, etc.
  async trackUserAction(action: string, target?: string, additionalMetadata?: any): Promise<void> {
    await this.trackInteraction({
      type: 'user_action',
      eventName: action,
      componentName: target,
      page: window.location.pathname,
      metadata: additionalMetadata
    });
  }

  // Get interaction analytics data for super users
  async getInteractionAnalytics(timeRange: '1d' | '7d' | '30d' = '7d', limitCount: number = 1000): Promise<{
    totalInteractions: number;
    uniqueUsers: number;
    buttonClicks: Array<{ eventName: string; count: number; users: string[] }>;
    pageViews: Array<{ page: string; count: number; uniqueUsers: number }>;
    topInteractiveComponents: Array<{ componentName: string; interactions: number; uniqueUsers: number }>;
    userActivity: Array<{ userId: string; userEmail: string; interactionCount: number; lastActive: any }>;
    recentActivity: UserInteractionEvent[];
  }> {
    try {
      const now = new Date();
      const daysAgo = timeRange === '1d' ? 1 : timeRange === '7d' ? 7 : 30;
      const startDate = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));

      // Get interaction data with a reasonable limit
      const interactionsQuery = query(
        collection(this.db, 'userInteractions'),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );

      const snapshot = await getDocs(interactionsQuery);
      const allInteractions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as (UserInteractionEvent & { id: string })[];

      // Filter by time range in memory to avoid complex index requirements
      const filteredInteractions = allInteractions.filter(interaction => {
        const interactionDate = (interaction.timestamp as any)?.toDate ? 
          (interaction.timestamp as any).toDate() : 
          new Date(interaction.timestamp as any);
        return interactionDate >= startDate;
      });

      // Calculate metrics
      const uniqueUsers = new Set(filteredInteractions.map(i => i.userId).filter(Boolean));
      
      // Button click analysis
      const buttonClicks = filteredInteractions.filter(i => i.type === 'button_click');
      const buttonClickMap = new Map<string, { count: number; users: Set<string> }>();
      
      buttonClicks.forEach(click => {
        const key = click.eventName || 'unknown';
        if (!buttonClickMap.has(key)) {
          buttonClickMap.set(key, { count: 0, users: new Set() });
        }
        const entry = buttonClickMap.get(key)!;
        entry.count++;
        if (click.userId) entry.users.add(click.userId);
      });

      // Page view analysis
      const pageViews = filteredInteractions.filter(i => i.type === 'page_navigation');
      const pageViewMap = new Map<string, { count: number; users: Set<string> }>();
      
      pageViews.forEach(view => {
        const page = view.page || view.metadata?.toPage || 'unknown';
        if (!pageViewMap.has(page)) {
          pageViewMap.set(page, { count: 0, users: new Set() });
        }
        const entry = pageViewMap.get(page)!;
        entry.count++;
        if (view.userId) entry.users.add(view.userId);
      });

      // Component interaction analysis
      const componentInteractions = filteredInteractions.filter(i => i.componentName);
      const componentMap = new Map<string, { interactions: number; users: Set<string> }>();
      
      componentInteractions.forEach(interaction => {
        const component = interaction.componentName!;
        if (!componentMap.has(component)) {
          componentMap.set(component, { interactions: 0, users: new Set() });
        }
        const entry = componentMap.get(component)!;
        entry.interactions++;
        if (interaction.userId) entry.users.add(interaction.userId);
      });

      // User activity analysis
      const userActivityMap = new Map<string, { interactionCount: number; lastActive: any; userEmail: string }>();
      
      filteredInteractions.forEach(interaction => {
        if (!interaction.userId) return;
        
        if (!userActivityMap.has(interaction.userId)) {
          userActivityMap.set(interaction.userId, { 
            interactionCount: 0, 
            lastActive: null, 
            userEmail: interaction.userEmail || 'unknown' 
          });
        }
        
        const entry = userActivityMap.get(interaction.userId)!;
        entry.interactionCount++;
        
        const interactionTime = (interaction.timestamp as any)?.toDate ? 
          (interaction.timestamp as any).toDate() : 
          new Date(interaction.timestamp as any);
        
        if (!entry.lastActive || interactionTime > entry.lastActive) {
          entry.lastActive = interactionTime;
        }
      });

      return {
        totalInteractions: filteredInteractions.length,
        uniqueUsers: uniqueUsers.size,
        buttonClicks: Array.from(buttonClickMap.entries())
          .map(([eventName, data]) => ({ 
            eventName, 
            count: data.count, 
            users: Array.from(data.users) 
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 20),
        pageViews: Array.from(pageViewMap.entries())
          .map(([page, data]) => ({ 
            page, 
            count: data.count, 
            uniqueUsers: data.users.size 
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 20),
        topInteractiveComponents: Array.from(componentMap.entries())
          .map(([componentName, data]) => ({ 
            componentName, 
            interactions: data.interactions, 
            uniqueUsers: data.users.size 
          }))
          .sort((a, b) => b.interactions - a.interactions)
          .slice(0, 20),
        userActivity: Array.from(userActivityMap.entries())
          .map(([userId, data]) => ({ 
            userId, 
            userEmail: data.userEmail,
            interactionCount: data.interactionCount, 
            lastActive: data.lastActive 
          }))
          .sort((a, b) => b.interactionCount - a.interactionCount)
          .slice(0, 50),
        recentActivity: filteredInteractions.slice(0, 100)
      };

    } catch (error) {
      console.error('Error getting interaction analytics:', error);
      return {
        totalInteractions: 0,
        uniqueUsers: 0,
        buttonClicks: [],
        pageViews: [],
        topInteractiveComponents: [],
        userActivity: [],
        recentActivity: []
      };
    }
  }

  // Cleanup method
  cleanup() {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
    // Flush any remaining buffer
    this.flushBuffer();
  }
}

const userInteractionService = new UserInteractionService();

// Initialize automatic button click tracking on page load
if (typeof window !== 'undefined') {
  // Track button clicks globally using event delegation
  document.addEventListener('click', (event) => {
    const target = event.target as HTMLElement;
    
    // Check if it's a button or has button-like behavior
    if (target.tagName === 'BUTTON' || 
        target.getAttribute('role') === 'button' ||
        target.classList.contains('btn') ||
        target.closest('button')) {
      
      const buttonElement = target.tagName === 'BUTTON' ? target : target.closest('button') as HTMLElement;
      if (buttonElement) {
        userInteractionService.trackButtonClick(buttonElement, {
          event: event.type,
          ctrlKey: event.ctrlKey,
          shiftKey: event.shiftKey,
          metaKey: event.metaKey
        });
      }
    }
  });

  // Track navigation changes
  const originalPushState = window.history.pushState;
  const originalReplaceState = window.history.replaceState;

  window.history.pushState = function(...args) {
    const previousPath = window.location.pathname;
    originalPushState.apply(window.history, args);
    const newPath = window.location.pathname;
    
    if (previousPath !== newPath) {
      userInteractionService.trackPageNavigation(previousPath, newPath, 'programmatic');
    }
  };

  window.history.replaceState = function(...args) {
    const previousPath = window.location.pathname;
    originalReplaceState.apply(window.history, args);
    const newPath = window.location.pathname;
    
    if (previousPath !== newPath) {
      userInteractionService.trackPageNavigation(previousPath, newPath, 'programmatic');
    }
  };

  // Track page unload
  window.addEventListener('beforeunload', () => {
    userInteractionService.cleanup();
  });
}

export default userInteractionService;
