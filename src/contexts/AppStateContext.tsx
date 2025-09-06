import React, { createContext, useContext, useReducer, useMemo, ReactNode } from 'react';
import { AppUser, UserRole } from '../services/authService';
import { ChatMessage, ChatChannel } from '../services/chatService';

// Define missing types
interface Event {
  id: string;
  title: string;
  description?: string;
  date: string;
  category: string;
  location?: string;
}

interface Location {
  id: string;
  name: string;
  address?: string;
  category: string;
}

interface Announcement {
  id: string;
  title: string;
  body?: string;
  category: string;
  priority: string;
}

interface VolunteerNeed {
  id: string;
  title: string;
  description: string;
  needed: number;
  claimed: number;
}

interface FeedbackSubmission {
  id: string;
  title: string;
  message: string;
  category: string;
  userId: string;
  createdAt: string;
}

interface Resource {
  id: string;
  title: string;
  description: string;
  url: string;
  category: string;
}

interface Notification {
  id: string;
  title: string;
  message?: string;
  type: 'success' | 'error' | 'warning' | 'info';
  timestamp: number;
}

interface EventFilters {
  search?: string;
  category?: string;
  dateRange?: {
    start: string;
    end: string;
  };
}

interface LocationFilters {
  search?: string;
  category?: string;
}

interface UserFilters {
  search?: string;
  role?: UserRole;
  status?: 'active' | 'inactive';
}

interface AnnouncementFilters {
  search?: string;
  category?: string;
  priority?: string;
}

// Global Application State Interface
interface AppState {
  // User & Authentication
  user: {
    currentUser: AppUser | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
  };
  
  // UI State
  ui: {
    sidebarOpen: boolean;
    theme: 'light' | 'dark';
    notifications: Notification[];
    modals: {
      [key: string]: boolean;
    };
    loading: {
      [key: string]: boolean;
    };
  };
  
  // Data State
  data: {
    events: Event[];
    locations: Location[];
    announcements: Announcement[];
    users: AppUser[];
    channels: ChatChannel[];
    messages: ChatMessage[];
    volunteers: VolunteerNeed[];
    feedback: FeedbackSubmission[];
    resources: Resource[];
  };
  
  // Cache State
  cache: {
    [key: string]: {
      data: any;
      timestamp: number;
      ttl: number;
    };
  };
  
  // Form State
  forms: {
    [key: string]: any;
  };
  
  // Filter State
  filters: {
    events: EventFilters;
    locations: LocationFilters;
    users: UserFilters;
    announcements: AnnouncementFilters;
  };
  
  // Pagination State
  pagination: {
    [key: string]: {
      page: number;
      pageSize: number;
      total: number;
      hasMore: boolean;
    };
  };
}

// Action Types
type AppAction = 
  // User Actions
  | { type: 'SET_CURRENT_USER'; payload: AppUser | null }
  | { type: 'SET_AUTH_LOADING'; payload: boolean }
  | { type: 'SET_AUTH_ERROR'; payload: string | null }
  
  // UI Actions
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'SET_THEME'; payload: 'light' | 'dark' }
  | { type: 'ADD_NOTIFICATION'; payload: Notification }
  | { type: 'REMOVE_NOTIFICATION'; payload: string }
  | { type: 'SET_MODAL'; payload: { key: string; open: boolean } }
  | { type: 'SET_LOADING'; payload: { key: string; loading: boolean } }
  
  // Data Actions
  | { type: 'SET_EVENTS'; payload: Event[] }
  | { type: 'ADD_EVENT'; payload: Event }
  | { type: 'UPDATE_EVENT'; payload: Event }
  | { type: 'DELETE_EVENT'; payload: string }
  | { type: 'SET_LOCATIONS'; payload: Location[] }
  | { type: 'SET_ANNOUNCEMENTS'; payload: Announcement[] }
  | { type: 'SET_USERS'; payload: AppUser[] }
  | { type: 'SET_CHANNELS'; payload: ChatChannel[] }
  | { type: 'SET_MESSAGES'; payload: ChatMessage[] }
  | { type: 'ADD_MESSAGE'; payload: ChatMessage }
  | { type: 'SET_VOLUNTEERS'; payload: VolunteerNeed[] }
  | { type: 'SET_FEEDBACK'; payload: FeedbackSubmission[] }
  | { type: 'SET_RESOURCES'; payload: Resource[] }
  
  // Cache Actions
  | { type: 'SET_CACHE'; payload: { key: string; data: any; ttl?: number } }
  | { type: 'CLEAR_CACHE'; payload: string }
  | { type: 'CLEAR_ALL_CACHE' }
  
  // Form Actions
  | { type: 'SET_FORM_DATA'; payload: { key: string; data: any } }
  | { type: 'RESET_FORM'; payload: string }
  | { type: 'RESET_ALL_FORMS' }
  
  // Filter Actions
  | { type: 'SET_EVENT_FILTERS'; payload: EventFilters }
  | { type: 'SET_LOCATION_FILTERS'; payload: LocationFilters }
  | { type: 'SET_USER_FILTERS'; payload: UserFilters }
  | { type: 'SET_ANNOUNCEMENT_FILTERS'; payload: AnnouncementFilters }
  
  // Pagination Actions
  | { type: 'SET_PAGINATION'; payload: { key: string; page: number; pageSize: number; total: number; hasMore: boolean } }
  | { type: 'NEXT_PAGE'; payload: string }
  | { type: 'PREV_PAGE'; payload: string }
  
  // Reset Actions
  | { type: 'RESET_APP_STATE' }
  | { type: 'RESET_DATA_STATE' }
  | { type: 'RESET_UI_STATE' };

// Initial State
const initialState: AppState = {
  user: {
    currentUser: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  },
  ui: {
    sidebarOpen: false,
    theme: 'light',
    notifications: [],
    modals: {},
    loading: {},
  },
  data: {
    events: [],
    locations: [],
    announcements: [],
    users: [],
    channels: [],
    messages: [],
    volunteers: [],
    feedback: [],
    resources: [],
  },
  cache: {},
  forms: {},
  filters: {
    events: {},
    locations: {},
    users: {},
    announcements: {},
  },
  pagination: {},
};

// Reducer
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    // User Actions
    case 'SET_CURRENT_USER':
      return {
        ...state,
        user: {
          ...state.user,
          currentUser: action.payload,
          isAuthenticated: !!action.payload,
          error: null,
        },
      };
    
    case 'SET_AUTH_LOADING':
      return {
        ...state,
        user: {
          ...state.user,
          isLoading: action.payload,
        },
      };
    
    case 'SET_AUTH_ERROR':
      return {
        ...state,
        user: {
          ...state.user,
          error: action.payload,
        },
      };
    
    // UI Actions
    case 'TOGGLE_SIDEBAR':
      return {
        ...state,
        ui: {
          ...state.ui,
          sidebarOpen: !state.ui.sidebarOpen,
        },
      };
    
    case 'SET_THEME':
      return {
        ...state,
        ui: {
          ...state.ui,
          theme: action.payload,
        },
      };
    
    case 'ADD_NOTIFICATION':
      return {
        ...state,
        ui: {
          ...state.ui,
          notifications: [...state.ui.notifications, action.payload],
        },
      };
    
    case 'REMOVE_NOTIFICATION':
      return {
        ...state,
        ui: {
          ...state.ui,
          notifications: state.ui.notifications.filter(n => n.id !== action.payload),
        },
      };
    
    case 'SET_MODAL':
      return {
        ...state,
        ui: {
          ...state.ui,
          modals: {
            ...state.ui.modals,
            [action.payload.key]: action.payload.open,
          },
        },
      };
    
    case 'SET_LOADING':
      return {
        ...state,
        ui: {
          ...state.ui,
          loading: {
            ...state.ui.loading,
            [action.payload.key]: action.payload.loading,
          },
        },
      };
    
    // Data Actions
    case 'SET_EVENTS':
      return {
        ...state,
        data: {
          ...state.data,
          events: action.payload,
        },
      };
    
    case 'ADD_EVENT':
      return {
        ...state,
        data: {
          ...state.data,
          events: [...state.data.events, action.payload],
        },
      };
    
    case 'UPDATE_EVENT':
      return {
        ...state,
        data: {
          ...state.data,
          events: state.data.events.map(event => 
            event.id === action.payload.id ? action.payload : event
          ),
        },
      };
    
    case 'DELETE_EVENT':
      return {
        ...state,
        data: {
          ...state.data,
          events: state.data.events.filter(event => event.id !== action.payload),
        },
      };
    
    case 'SET_LOCATIONS':
      return {
        ...state,
        data: {
          ...state.data,
          locations: action.payload,
        },
      };
    
    case 'SET_ANNOUNCEMENTS':
      return {
        ...state,
        data: {
          ...state.data,
          announcements: action.payload,
        },
      };
    
    case 'SET_USERS':
      return {
        ...state,
        data: {
          ...state.data,
          users: action.payload,
        },
      };
    
    case 'SET_CHANNELS':
      return {
        ...state,
        data: {
          ...state.data,
          channels: action.payload,
        },
      };
    
    case 'SET_MESSAGES':
      return {
        ...state,
        data: {
          ...state.data,
          messages: action.payload,
        },
      };
    
    case 'ADD_MESSAGE':
      return {
        ...state,
        data: {
          ...state.data,
          messages: [...state.data.messages, action.payload],
        },
      };
    
    case 'SET_VOLUNTEERS':
      return {
        ...state,
        data: {
          ...state.data,
          volunteers: action.payload,
        },
      };
    
    case 'SET_FEEDBACK':
      return {
        ...state,
        data: {
          ...state.data,
          feedback: action.payload,
        },
      };
    
    case 'SET_RESOURCES':
      return {
        ...state,
        data: {
          ...state.data,
          resources: action.payload,
        },
      };
    
    // Cache Actions
    case 'SET_CACHE':
      return {
        ...state,
        cache: {
          ...state.cache,
          [action.payload.key]: {
            data: action.payload.data,
            timestamp: Date.now(),
            ttl: action.payload.ttl || 300000, // 5 minutes default
          },
        },
      };
    
    case 'CLEAR_CACHE':
      const { [action.payload]: removed, ...remainingCache } = state.cache;
      return {
        ...state,
        cache: remainingCache,
      };
    
    case 'CLEAR_ALL_CACHE':
      return {
        ...state,
        cache: {},
      };
    
    // Form Actions
    case 'SET_FORM_DATA':
      return {
        ...state,
        forms: {
          ...state.forms,
          [action.payload.key]: action.payload.data,
        },
      };
    
    case 'RESET_FORM':
      const { [action.payload]: removedForm, ...remainingForms } = state.forms;
      return {
        ...state,
        forms: remainingForms,
      };
    
    case 'RESET_ALL_FORMS':
      return {
        ...state,
        forms: {},
      };
    
    // Filter Actions
    case 'SET_EVENT_FILTERS':
      return {
        ...state,
        filters: {
          ...state.filters,
          events: action.payload,
        },
      };
    
    case 'SET_LOCATION_FILTERS':
      return {
        ...state,
        filters: {
          ...state.filters,
          locations: action.payload,
        },
      };
    
    case 'SET_USER_FILTERS':
      return {
        ...state,
        filters: {
          ...state.filters,
          users: action.payload,
        },
      };
    
    case 'SET_ANNOUNCEMENT_FILTERS':
      return {
        ...state,
        filters: {
          ...state.filters,
          announcements: action.payload,
        },
      };
    
    // Pagination Actions
    case 'SET_PAGINATION':
      return {
        ...state,
        pagination: {
          ...state.pagination,
          [action.payload.key]: {
            page: action.payload.page,
            pageSize: action.payload.pageSize,
            total: action.payload.total,
            hasMore: action.payload.hasMore,
          },
        },
      };
    
    case 'NEXT_PAGE':
      const currentPagination = state.pagination[action.payload];
      if (currentPagination && currentPagination.hasMore) {
        return {
          ...state,
          pagination: {
            ...state.pagination,
            [action.payload]: {
              ...currentPagination,
              page: currentPagination.page + 1,
            },
          },
        };
      }
      return state;
    
    case 'PREV_PAGE':
      const prevPagination = state.pagination[action.payload];
      if (prevPagination && prevPagination.page > 1) {
        return {
          ...state,
          pagination: {
            ...state.pagination,
            [action.payload]: {
              ...prevPagination,
              page: prevPagination.page - 1,
            },
          },
        };
      }
      return state;
    
    // Reset Actions
    case 'RESET_APP_STATE':
      return initialState;
    
    case 'RESET_DATA_STATE':
      return {
        ...state,
        data: initialState.data,
        cache: {},
      };
    
    case 'RESET_UI_STATE':
      return {
        ...state,
        ui: initialState.ui,
      };
    
    default:
      return state;
  }
}

// Context
interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  
  // Computed selectors
  selectors: {
    isAuthenticated: boolean;
    currentUser: AppUser | null;
    isLoading: (key: string) => boolean;
    isModalOpen: (key: string) => boolean;
    getCachedData: (key: string) => any;
    getFormData: (key: string) => any;
    getFilteredEvents: () => Event[];
    getFilteredLocations: () => Location[];
    getFilteredUsers: () => AppUser[];
    getFilteredAnnouncements: () => Announcement[];
  };
  
  // Action creators
  actions: {
    // User actions
    setCurrentUser: (user: AppUser | null) => void;
    setAuthLoading: (loading: boolean) => void;
    setAuthError: (error: string | null) => void;
    
    // UI actions
    toggleSidebar: () => void;
    setTheme: (theme: 'light' | 'dark') => void;
    addNotification: (notification: Notification) => void;
    removeNotification: (id: string) => void;
    setModal: (key: string, open: boolean) => void;
    setLoading: (key: string, loading: boolean) => void;
    
    // Data actions
    setEvents: (events: Event[]) => void;
    addEvent: (event: Event) => void;
    updateEvent: (event: Event) => void;
    deleteEvent: (id: string) => void;
    setLocations: (locations: Location[]) => void;
    setAnnouncements: (announcements: Announcement[]) => void;
    setUsers: (users: AppUser[]) => void;
    setChannels: (channels: ChatChannel[]) => void;
    setMessages: (messages: ChatMessage[]) => void;
    addMessage: (message: ChatMessage) => void;
    setVolunteers: (volunteers: VolunteerNeed[]) => void;
    setFeedback: (feedback: FeedbackSubmission[]) => void;
    setResources: (resources: Resource[]) => void;
    
    // Cache actions
    setCache: (key: string, data: any, ttl?: number) => void;
    clearCache: (key: string) => void;
    clearAllCache: () => void;
    
    // Form actions
    setFormData: (key: string, data: any) => void;
    resetForm: (key: string) => void;
    resetAllForms: () => void;
    
    // Filter actions
    setEventFilters: (filters: EventFilters) => void;
    setLocationFilters: (filters: LocationFilters) => void;
    setUserFilters: (filters: UserFilters) => void;
    setAnnouncementFilters: (filters: AnnouncementFilters) => void;
    
    // Pagination actions
    setPagination: (key: string, page: number, pageSize: number, total: number, hasMore: boolean) => void;
    nextPage: (key: string) => void;
    prevPage: (key: string) => void;
    
    // Reset actions
    resetAppState: () => void;
    resetDataState: () => void;
    resetUIState: () => void;
  };
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Provider
interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Memoized selectors
  const selectors = useMemo(() => ({
    isAuthenticated: state.user.isAuthenticated,
    currentUser: state.user.currentUser,
    isLoading: (key: string) => state.ui.loading[key] || false,
    isModalOpen: (key: string) => state.ui.modals[key] || false,
    getCachedData: (key: string) => {
      const cached = state.cache[key];
      if (cached && Date.now() - cached.timestamp < cached.ttl) {
        return cached.data;
      }
      return null;
    },
    getFormData: (key: string) => state.forms[key] || {},
    getFilteredEvents: () => {
      let filtered = [...state.data.events];
      const filters = state.filters.events;
      
      if (filters.search) {
        filtered = filtered.filter(event =>
          event.title.toLowerCase().includes(filters.search!.toLowerCase()) ||
          event.description?.toLowerCase().includes(filters.search!.toLowerCase())
        );
      }
      
      if (filters.category) {
        filtered = filtered.filter(event => event.category === filters.category);
      }
      
      if (filters.dateRange) {
        const start = new Date(filters.dateRange.start);
        const end = new Date(filters.dateRange.end);
        filtered = filtered.filter(event => {
          const eventDate = new Date(event.date);
          return eventDate >= start && eventDate <= end;
        });
      }
      
      return filtered;
    },
    getFilteredLocations: () => {
      let filtered = [...state.data.locations];
      const filters = state.filters.locations;
      
      if (filters.search) {
        filtered = filtered.filter(location =>
          location.name.toLowerCase().includes(filters.search!.toLowerCase()) ||
          location.address?.toLowerCase().includes(filters.search!.toLowerCase())
        );
      }
      
      if (filters.category) {
        filtered = filtered.filter(location => location.category === filters.category);
      }
      
      return filtered;
    },
    getFilteredUsers: () => {
      let filtered = [...state.data.users];
      const filters = state.filters.users;
      
      if (filters.search) {
        filtered = filtered.filter(user =>
          user.displayName?.toLowerCase().includes(filters.search!.toLowerCase()) ||
          user.email?.toLowerCase().includes(filters.search!.toLowerCase())
        );
      }
      
      if (filters.role) {
        filtered = filtered.filter(user => user.role === filters.role);
      }
      
      if (filters.status) {
        filtered = filtered.filter(user => 
          filters.status === 'active' ? user.isActive : !user.isActive
        );
      }
      
      return filtered;
    },
    getFilteredAnnouncements: () => {
      let filtered = [...state.data.announcements];
      const filters = state.filters.announcements;
      
      if (filters.search) {
        filtered = filtered.filter(announcement =>
          announcement.title.toLowerCase().includes(filters.search!.toLowerCase()) ||
          announcement.body?.toLowerCase().includes(filters.search!.toLowerCase())
        );
      }
      
      if (filters.category) {
        filtered = filtered.filter(announcement => announcement.category === filters.category);
      }
      
      if (filters.priority) {
        filtered = filtered.filter(announcement => announcement.priority === filters.priority);
      }
      
      return filtered;
    },
  }), [state]);

  // Memoized action creators
  const actions = useMemo(() => ({
    // User actions
    setCurrentUser: (user: AppUser | null) => 
      dispatch({ type: 'SET_CURRENT_USER', payload: user }),
    setAuthLoading: (loading: boolean) => 
      dispatch({ type: 'SET_AUTH_LOADING', payload: loading }),
    setAuthError: (error: string | null) => 
      dispatch({ type: 'SET_AUTH_ERROR', payload: error }),
    
    // UI actions
    toggleSidebar: () => dispatch({ type: 'TOGGLE_SIDEBAR' }),
    setTheme: (theme: 'light' | 'dark') => 
      dispatch({ type: 'SET_THEME', payload: theme }),
    addNotification: (notification: Notification) => 
      dispatch({ type: 'ADD_NOTIFICATION', payload: notification }),
    removeNotification: (id: string) => 
      dispatch({ type: 'REMOVE_NOTIFICATION', payload: id }),
    setModal: (key: string, open: boolean) => 
      dispatch({ type: 'SET_MODAL', payload: { key, open } }),
    setLoading: (key: string, loading: boolean) => 
      dispatch({ type: 'SET_LOADING', payload: { key, loading } }),
    
    // Data actions
    setEvents: (events: Event[]) => 
      dispatch({ type: 'SET_EVENTS', payload: events }),
    addEvent: (event: Event) => 
      dispatch({ type: 'ADD_EVENT', payload: event }),
    updateEvent: (event: Event) => 
      dispatch({ type: 'UPDATE_EVENT', payload: event }),
    deleteEvent: (id: string) => 
      dispatch({ type: 'DELETE_EVENT', payload: id }),
    setLocations: (locations: Location[]) => 
      dispatch({ type: 'SET_LOCATIONS', payload: locations }),
    setAnnouncements: (announcements: Announcement[]) => 
      dispatch({ type: 'SET_ANNOUNCEMENTS', payload: announcements }),
    setUsers: (users: AppUser[]) => 
      dispatch({ type: 'SET_USERS', payload: users }),
    setChannels: (channels: ChatChannel[]) => 
      dispatch({ type: 'SET_CHANNELS', payload: channels }),
    setMessages: (messages: ChatMessage[]) => 
      dispatch({ type: 'SET_MESSAGES', payload: messages }),
    addMessage: (message: ChatMessage) => 
      dispatch({ type: 'ADD_MESSAGE', payload: message }),
    setVolunteers: (volunteers: VolunteerNeed[]) => 
      dispatch({ type: 'SET_VOLUNTEERS', payload: volunteers }),
    setFeedback: (feedback: FeedbackSubmission[]) => 
      dispatch({ type: 'SET_FEEDBACK', payload: feedback }),
    setResources: (resources: Resource[]) => 
      dispatch({ type: 'SET_RESOURCES', payload: resources }),
    
    // Cache actions
    setCache: (key: string, data: any, ttl?: number) => 
      dispatch({ type: 'SET_CACHE', payload: { key, data, ttl } }),
    clearCache: (key: string) => 
      dispatch({ type: 'CLEAR_CACHE', payload: key }),
    clearAllCache: () => 
      dispatch({ type: 'CLEAR_ALL_CACHE' }),
    
    // Form actions
    setFormData: (key: string, data: any) => 
      dispatch({ type: 'SET_FORM_DATA', payload: { key, data } }),
    resetForm: (key: string) => 
      dispatch({ type: 'RESET_FORM', payload: key }),
    resetAllForms: () => 
      dispatch({ type: 'RESET_ALL_FORMS' }),
    
    // Filter actions
    setEventFilters: (filters: EventFilters) => 
      dispatch({ type: 'SET_EVENT_FILTERS', payload: filters }),
    setLocationFilters: (filters: LocationFilters) => 
      dispatch({ type: 'SET_LOCATION_FILTERS', payload: filters }),
    setUserFilters: (filters: UserFilters) => 
      dispatch({ type: 'SET_USER_FILTERS', payload: filters }),
    setAnnouncementFilters: (filters: AnnouncementFilters) => 
      dispatch({ type: 'SET_ANNOUNCEMENT_FILTERS', payload: filters }),
    
    // Pagination actions
    setPagination: (key: string, page: number, pageSize: number, total: number, hasMore: boolean) => 
      dispatch({ type: 'SET_PAGINATION', payload: { key, page, pageSize, total, hasMore } }),
    nextPage: (key: string) => 
      dispatch({ type: 'NEXT_PAGE', payload: key }),
    prevPage: (key: string) => 
      dispatch({ type: 'PREV_PAGE', payload: key }),
    
    // Reset actions
    resetAppState: () => 
      dispatch({ type: 'RESET_APP_STATE' }),
    resetDataState: () => 
      dispatch({ type: 'RESET_DATA_STATE' }),
    resetUIState: () => 
      dispatch({ type: 'RESET_UI_STATE' }),
  }), []);

  const value = useMemo(() => ({
    state,
    dispatch,
    selectors,
    actions,
  }), [state, selectors, actions]);

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

// Hook
export function useAppState() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppState must be used within an AppProvider');
  }
  return context;
}

// Custom hooks for specific state slices
export function useUserState() {
  const { state, actions } = useAppState();
  return {
    user: state.user,
    setCurrentUser: actions.setCurrentUser,
    setAuthLoading: actions.setAuthLoading,
    setAuthError: actions.setAuthError,
  };
}

export function useUIState() {
  const { state, actions, selectors } = useAppState();
  return {
    ui: state.ui,
    toggleSidebar: actions.toggleSidebar,
    setTheme: actions.setTheme,
    addNotification: actions.addNotification,
    removeNotification: actions.removeNotification,
    setModal: actions.setModal,
    setLoading: actions.setLoading,
    isLoading: selectors.isLoading,
    isModalOpen: selectors.isModalOpen,
  };
}

export function useDataState() {
  const { state, actions } = useAppState();
  return {
    data: state.data,
    setEvents: actions.setEvents,
    addEvent: actions.addEvent,
    updateEvent: actions.updateEvent,
    deleteEvent: actions.deleteEvent,
    setLocations: actions.setLocations,
    setAnnouncements: actions.setAnnouncements,
    setUsers: actions.setUsers,
    setChannels: actions.setChannels,
    setMessages: actions.setMessages,
    addMessage: actions.addMessage,
    setVolunteers: actions.setVolunteers,
    setFeedback: actions.setFeedback,
    setResources: actions.setResources,
  };
}

export function useCacheState() {
  const { state, actions, selectors } = useAppState();
  return {
    cache: state.cache,
    setCache: actions.setCache,
    clearCache: actions.clearCache,
    clearAllCache: actions.clearAllCache,
    getCachedData: selectors.getCachedData,
  };
}

export function useFormState() {
  const { state, actions } = useAppState();
  return {
    forms: state.forms,
    setFormData: actions.setFormData,
    resetForm: actions.resetForm,
    resetAllForms: actions.resetAllForms,
    getFormData: (key: string) => state.forms[key] || {},
  };
}

export function useFilterState() {
  const { state, actions, selectors } = useAppState();
  return {
    filters: state.filters,
    setEventFilters: actions.setEventFilters,
    setLocationFilters: actions.setLocationFilters,
    setUserFilters: actions.setUserFilters,
    setAnnouncementFilters: actions.setAnnouncementFilters,
    getFilteredEvents: selectors.getFilteredEvents,
    getFilteredLocations: selectors.getFilteredLocations,
    getFilteredUsers: selectors.getFilteredUsers,
    getFilteredAnnouncements: selectors.getFilteredAnnouncements,
  };
}

export function usePaginationState() {
  const { state, actions } = useAppState();
  return {
    pagination: state.pagination,
    setPagination: actions.setPagination,
    nextPage: actions.nextPage,
    prevPage: actions.prevPage,
    getPagination: (key: string) => state.pagination[key] || { page: 1, pageSize: 20, total: 0, hasMore: false },
  };
}

export default AppProvider;
