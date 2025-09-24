import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { adminService } from '../services/adminService';
import { authService, AppUser, Permission, UserRole } from '../services/authService';
import { 
  AdminUser, 
  AdminRole, 
  AdminPermission, 
  AdminAction, 
  AuditLog,
  AdminDashboardStats,
  EntityType,
  AdminActionType
} from '../types/admin';

// Admin state interface
interface AdminState {
  currentUser: AdminUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  permissions: AdminPermission[];
  role: AdminRole | null;
  recentActions: AdminAction[];
  auditLogs: AuditLog[];
  dashboardStats: AdminDashboardStats | null;
  systemHealth: any;
  notifications: any[];
  error: string | null;
}

// Admin action types
type AdminStateActionType = 
  | { type: 'SET_CURRENT_USER'; payload: AdminUser | null }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_PERMISSIONS'; payload: AdminPermission[] }
  | { type: 'SET_ROLE'; payload: AdminRole | null }
  | { type: 'ADD_RECENT_ACTION'; payload: AdminAction }
  | { type: 'SET_AUDIT_LOGS'; payload: AuditLog[] }
  | { type: 'SET_DASHBOARD_STATS'; payload: AdminDashboardStats | null }
  | { type: 'SET_SYSTEM_HEALTH'; payload: any }
  | { type: 'ADD_NOTIFICATION'; payload: any }
  | { type: 'REMOVE_NOTIFICATION'; payload: string }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'CLEAR_ERROR' }
  | { type: 'LOGOUT' };

// Initial state
const initialState: AdminState = {
  currentUser: null,
  isAuthenticated: false,
  isLoading: true, // Start with loading true
  permissions: [],
  role: null,
  recentActions: [],
  auditLogs: [],
  dashboardStats: null,
  systemHealth: null,
  notifications: [],
  error: null,
};

// Admin reducer
function adminReducer(state: AdminState, action: AdminStateActionType): AdminState {
  switch (action.type) {
    case 'SET_CURRENT_USER':
      return {
        ...state,
        currentUser: action.payload,
        isAuthenticated: !!action.payload,
        permissions: action.payload?.permissions || [],
        role: action.payload?.role || null,
      };
    
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    
    case 'SET_PERMISSIONS':
      return {
        ...state,
        permissions: action.payload,
      };
    
    case 'SET_ROLE':
      return {
        ...state,
        role: action.payload,
      };
    
    case 'ADD_RECENT_ACTION':
      return {
        ...state,
        recentActions: [action.payload, ...state.recentActions.slice(0, 9)], // Keep last 10
      };
    
    case 'SET_AUDIT_LOGS':
      return {
        ...state,
        auditLogs: action.payload,
      };
    
    case 'SET_DASHBOARD_STATS':
      return {
        ...state,
        dashboardStats: action.payload,
      };
    
    case 'SET_SYSTEM_HEALTH':
      return {
        ...state,
        systemHealth: action.payload,
      };
    
    case 'ADD_NOTIFICATION':
      return {
        ...state,
        notifications: [...state.notifications, action.payload],
      };
    
    case 'REMOVE_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.filter(n => n.id !== action.payload),
      };
    
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
      };
    
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    
    case 'LOGOUT':
      return {
        ...initialState,
      };
    
    default:
      return state;
  }
}

// Admin context interface
interface AdminContextType {
  state: AdminState;
  dispatch: React.Dispatch<AdminStateActionType>;
  
  // Authentication
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  
  // Permission checks
  hasPermission: (permission: AdminPermission) => boolean;
  hasAnyPermission: (permissions: AdminPermission[]) => boolean;
  hasRole: (role: AdminRole) => boolean;
  
  // CRUD operations
  createEntity: (entityType: EntityType, data: any) => Promise<{ success: boolean; id?: string; error?: string }>;
  updateEntity: (entityType: EntityType, id: string, data: any) => Promise<{ success: boolean; error?: string }>;
  deleteEntity: (entityType: EntityType, id: string, reason?: string) => Promise<{ success: boolean; error?: string }>;
  
  // Bulk operations
  bulkOperation: (operation: AdminActionType, entityType: EntityType, entityIds: string[], options?: any) => Promise<{ success: boolean; operationId?: string; error?: string }>;
  
  // Data operations
  exportData: (options: any) => Promise<{ success: boolean; downloadUrl?: string; error?: string }>;
  importData: (options: any, file: File) => Promise<{ success: boolean; operationId?: string; error?: string }>;
  
  // System operations
  refreshDashboardStats: () => Promise<void>;
  refreshAuditLogs: () => Promise<void>;
  refreshSystemHealth: () => Promise<void>;
  
  // Notifications
  addNotification: (type: 'info' | 'warning' | 'error' | 'success', title: string, message: string) => void;
  removeNotification: (id: string) => void;
  
  // Error handling
  setError: (error: string) => void;
  clearError: () => void;
}

// Create context
const AdminContext = createContext<AdminContextType | undefined>(undefined);

// Admin provider props
interface AdminProviderProps {
  children: ReactNode;
}

// Admin provider component
export function AdminProvider({ children }: AdminProviderProps) {
  const [state, dispatch] = useReducer(adminReducer, initialState);

  // Initialize admin service with current user
  useEffect(() => {
    if (state.currentUser) {
      adminService.setCurrentUser(state.currentUser);
    }
  }, [state.currentUser]);

  // Check if user has specific permission
  const hasPermission = (permission: AdminPermission): boolean => {
    return state.permissions.includes(permission);
  };

  // Check if user has any of the specified permissions
  const hasAnyPermission = (permissions: AdminPermission[]): boolean => {
    return permissions.some(permission => state.permissions.includes(permission));
  };

  // Check if user has specific role
  const hasRole = (role: AdminRole): boolean => {
    return state.role === role;
  };

  // Connect to authService for authentication state
  useEffect(() => {
    console.log('AdminContext: Setting up auth state listener');
    
    // Set loading to false immediately to prevent loading screen issues
    dispatch({ type: 'SET_LOADING', payload: false });
    
    // Set a timeout to ensure loading state doesn't persist indefinitely
    const loadingTimeout = setTimeout(() => {
      console.log('AdminContext: Loading timeout reached, setting loading to false');
      dispatch({ type: 'SET_LOADING', payload: false });
    }, 1000); // Reduced to 1 second for faster response
    
    const unsubscribe = authService.onAuthStateChanged((user) => {
      console.log('AdminContext: Auth state changed:', user ? `User ${user.email}` : 'No user');
      
      // Clear the loading timeout since we got a response
      clearTimeout(loadingTimeout);
      
      // Set loading to false immediately when we get auth state
      dispatch({ type: 'SET_LOADING', payload: false });
      
      if (user) {
        // Convert AppUser to AdminUser with proper role mapping
        const roleMap: { [key: string]: AdminRole } = {
          [UserRole.ROOT]: 'root',
          [UserRole.ADMIN]: 'super-admin', 
          [UserRole.VOLUNTEER]: 'moderator',
          [UserRole.PARENT]: 'viewer',
          [UserRole.AI_ASSISTANT]: 'moderator' // Map AI assistant to moderator level
        };
        
        const adminUser: AdminUser = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || null,
          photoURL: user.photoURL || null,
          isAdmin: user.role === UserRole.ROOT || user.role === UserRole.ADMIN || user.role === UserRole.VOLUNTEER,
          role: roleMap[user.role] || 'viewer',
          permissions: user.permissions as unknown as AdminPermission[],
          lastLogin: user.lastLoginAt || new Date(),
          isActive: user.isActive,
        };
        
        console.log('AdminContext: Mapped user role:', user.role, '->', adminUser.role);
        console.log('AdminContext: User isAdmin:', adminUser.isAdmin);
        console.log('AdminContext: User permissions:', adminUser.permissions);
        dispatch({ type: 'SET_CURRENT_USER', payload: adminUser });
      } else {
        dispatch({ type: 'SET_CURRENT_USER', payload: null });
      }
      // Set loading to false after auth state is determined
      dispatch({ type: 'SET_LOADING', payload: false });
    });

    return () => {
      console.log('AdminContext: Cleaning up auth state listener');
      clearTimeout(loadingTimeout);
      unsubscribe();
    };
  }, []);

  // Login function
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      const user = await authService.signIn(email, password);
      
      // The authService.onAuthStateChanged will handle setting the user
      return true;
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      return false;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await authService.signOut();
      // The authService.onAuthStateChanged will handle clearing the user
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Generic CRUD operations
  const createEntity = async (entityType: EntityType, data: any): Promise<{ success: boolean; id?: string; error?: string }> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      let result;
      switch (entityType) {
        case 'season':
          result = await adminService.createSeason(data);
          break;
        case 'event':
          result = await adminService.createEvent(data);
          break;
        case 'location':
          result = await adminService.createLocation(data);
          break;
        case 'announcement':
          result = await adminService.createAnnouncement(data);
          break;
        default:
          throw new Error(`Unsupported entity type: ${entityType}`);
      }

      if (result.success) {
        // Add to recent actions
        const entityId = (result as any).seasonId || (result as any).eventId || (result as any).locationId || (result as any).announcementId || 'new';
        dispatch({
          type: 'ADD_RECENT_ACTION',
          payload: {
            id: `action_${Date.now()}`,
            userId: state.currentUser?.uid || '',
            userEmail: state.currentUser?.email || '',
            action: 'create',
            entityType,
            entityId,
            entityName: data.name || data.title || 'New Entity',
            details: data,
            timestamp: new Date(),
            ipAddress: 'unknown',
            userAgent: navigator.userAgent,
            success: true,
          }
        });

        // Refresh dashboard stats
        await refreshDashboardStats();
      } else {
        dispatch({ type: 'SET_ERROR', payload: result.error || 'Failed to create entity' });
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      return { success: false, error: errorMessage };
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const updateEntity = async (entityType: EntityType, id: string, data: any): Promise<{ success: boolean; error?: string }> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      let result;
      switch (entityType) {
        case 'season':
          result = await adminService.updateSeason(id, data);
          break;
        case 'event':
          result = await adminService.updateEvent(id, data);
          break;
        case 'location':
          result = await adminService.updateLocation(id, data);
          break;
        case 'announcement':
          result = await adminService.updateAnnouncement(id, data);
          break;
        default:
          throw new Error(`Unsupported entity type: ${entityType}`);
      }

      if (result.success) {
        // Add to recent actions
        dispatch({
          type: 'ADD_RECENT_ACTION',
          payload: {
            id: `action_${Date.now()}`,
            userId: state.currentUser?.uid || '',
            userEmail: state.currentUser?.email || '',
            action: 'update',
            entityType,
            entityId: id,
            entityName: data.name || data.title || 'Entity',
            details: data,
            timestamp: new Date(),
            ipAddress: 'unknown',
            userAgent: navigator.userAgent,
            success: true,
          }
        });

        // Refresh dashboard stats
        await refreshDashboardStats();
      } else {
        dispatch({ type: 'SET_ERROR', payload: result.error || 'Failed to update entity' });
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      return { success: false, error: errorMessage };
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const deleteEntity = async (entityType: EntityType, id: string, reason?: string): Promise<{ success: boolean; error?: string }> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      let result;
      switch (entityType) {
        case 'season':
          result = await adminService.deleteSeason(id, reason);
          break;
        case 'event':
          result = await adminService.deleteEvent(id, reason);
          break;
        case 'location':
          result = await adminService.deleteLocation(id, reason);
          break;
        case 'announcement':
          result = await adminService.deleteAnnouncement(id, reason);
          break;
        default:
          throw new Error(`Unsupported entity type: ${entityType}`);
      }

      if (result.success) {
        // Add to recent actions
        dispatch({
          type: 'ADD_RECENT_ACTION',
          payload: {
            id: `action_${Date.now()}`,
            userId: state.currentUser?.uid || '',
            userEmail: state.currentUser?.email || '',
            action: 'delete',
            entityType,
            entityId: id,
            entityName: 'Deleted Entity',
            details: { reason },
            timestamp: new Date(),
            ipAddress: 'unknown',
            userAgent: navigator.userAgent,
            success: true,
          }
        });

        // Refresh dashboard stats
        await refreshDashboardStats();
      } else {
        dispatch({ type: 'SET_ERROR', payload: result.error || 'Failed to delete entity' });
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      return { success: false, error: errorMessage };
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Bulk operations
  const bulkOperation = async (operation: AdminActionType, entityType: EntityType, entityIds: string[], options?: any): Promise<{ success: boolean; operationId?: string; error?: string }> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      const result = await adminService.bulkOperation(operation, entityType, entityIds, options);

      if (result.success) {
        // Add to recent actions
        dispatch({
          type: 'ADD_RECENT_ACTION',
          payload: {
            id: `action_${Date.now()}`,
            userId: state.currentUser?.uid || '',
            userEmail: state.currentUser?.email || '',
            action: operation,
            entityType,
            entityId: 'bulk',
            entityName: `Bulk ${operation}`,
            details: { entityIds, options },
            timestamp: new Date(),
            ipAddress: 'unknown',
            userAgent: navigator.userAgent,
            success: true,
          }
        });

        // Refresh dashboard stats
        await refreshDashboardStats();
      } else {
        dispatch({ type: 'SET_ERROR', payload: result.error || 'Failed to perform bulk operation' });
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      return { success: false, error: errorMessage };
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Data operations
  const exportData = async (options: any): Promise<{ success: boolean; downloadUrl?: string; error?: string }> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      const result = await adminService.exportData(options);

      if (!result.success) {
        dispatch({ type: 'SET_ERROR', payload: result.error || 'Failed to export data' });
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      return { success: false, error: errorMessage };
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const importData = async (options: any, file: File): Promise<{ success: boolean; operationId?: string; error?: string }> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      const result = await adminService.importData(options, file);

      if (result.success) {
        // Add to recent actions
        dispatch({
          type: 'ADD_RECENT_ACTION',
          payload: {
            id: `action_${Date.now()}`,
            userId: state.currentUser?.uid || '',
            userEmail: state.currentUser?.email || '',
            action: 'import',
            entityType: options.entityType,
            entityId: 'import',
            entityName: 'Data Import',
            details: { options, fileName: file.name },
            timestamp: new Date(),
            ipAddress: 'unknown',
            userAgent: navigator.userAgent,
            success: true,
          }
        });

        // Refresh dashboard stats
        await refreshDashboardStats();
      } else {
        dispatch({ type: 'SET_ERROR', payload: result.error || 'Failed to import data' });
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      return { success: false, error: errorMessage };
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // System operations - Optimized with batch loading
  const refreshDashboardStats = async (): Promise<void> => {
    try {
      // Use batch function for better performance
      const batchData = await adminService.getBatchDashboardData();
      if (batchData.success) {
        dispatch({ type: 'SET_DASHBOARD_STATS', payload: batchData.dashboardStats });
        dispatch({ type: 'SET_SYSTEM_HEALTH', payload: batchData.systemHealth });
        dispatch({ type: 'SET_AUDIT_LOGS', payload: batchData.auditLogs });
      }
    } catch (error) {
      console.error('Failed to refresh dashboard data:', error);
      // Fallback to individual calls if batch fails
      try {
        const [stats, health, logs] = await Promise.all([
          adminService.getDashboardStats(),
          adminService.getSystemHealth(),
          adminService.getAuditLogs()
        ]);
        dispatch({ type: 'SET_DASHBOARD_STATS', payload: stats });
        dispatch({ type: 'SET_SYSTEM_HEALTH', payload: health });
        dispatch({ type: 'SET_AUDIT_LOGS', payload: logs });
      } catch (fallbackError) {
        console.error('Fallback dashboard refresh failed:', fallbackError);
      }
    }
  };

  const refreshAuditLogs = async (): Promise<void> => {
    try {
      const logs = await adminService.getAuditLogs();
      dispatch({ type: 'SET_AUDIT_LOGS', payload: logs });
    } catch (error) {
      console.error('Failed to refresh audit logs:', error);
    }
  };

  const refreshSystemHealth = async (): Promise<void> => {
    try {
      const health = await adminService.getSystemHealth();
      dispatch({ type: 'SET_SYSTEM_HEALTH', payload: health });
    } catch (error) {
      console.error('Failed to refresh system health:', error);
    }
  };

  // Notifications
  const addNotification = (type: 'info' | 'warning' | 'error' | 'success', title: string, message: string) => {
    const notification = {
      id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      title,
      message,
      timestamp: new Date(),
    };
    dispatch({ type: 'ADD_NOTIFICATION', payload: notification });

    // Auto-remove info and success notifications after 5 seconds
    if (type === 'info' || type === 'success') {
      setTimeout(() => {
        removeNotification(notification.id);
      }, 5000);
    }
  };

  const removeNotification = (id: string) => {
    dispatch({ type: 'REMOVE_NOTIFICATION', payload: id });
  };

  // Error handling
  const setError = (error: string) => {
    dispatch({ type: 'SET_ERROR', payload: error });
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  // Context value
  const contextValue: AdminContextType = {
    state,
    dispatch,
    login,
    logout,
    hasPermission,
    hasAnyPermission,
    hasRole,
    createEntity,
    updateEntity,
    deleteEntity,
    bulkOperation,
    exportData,
    importData,
    refreshDashboardStats,
    refreshAuditLogs,
    refreshSystemHealth,
    addNotification,
    removeNotification,
    setError,
    clearError,
  };

  return (
    <AdminContext.Provider value={contextValue}>
      {children}
    </AdminContext.Provider>
  );
}

// Custom hook to use admin context
export function useAdmin() {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
}

// Export the context for testing
export { AdminContext };
