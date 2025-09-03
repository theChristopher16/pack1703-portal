import React, { createContext, useContext, useReducer, useEffect, ReactNode, useCallback } from 'react';
import { multiTenantService } from '../services/multiTenantService';
import { authService } from '../services/authService';
import {
  MultiTenantState,
  MultiTenantAction,
  Category,
  Organization,
  CrossOrganizationCollaboration,
  AICollaborationSession
} from '../types/multiTenant';

// Initial state
const initialState: MultiTenantState = {
  currentCategory: null,
  currentOrganization: null,
  userOrganizations: [],
  availableCategories: [],
  crossOrganizationCollaborations: [],
  aiCollaborationSessions: [],
  isLoading: false,
  error: null,
};

// Multi-tenant reducer
function multiTenantReducer(state: MultiTenantState, action: MultiTenantAction): MultiTenantState {
  switch (action.type) {
    case 'SET_CURRENT_CATEGORY':
      return {
        ...state,
        currentCategory: action.payload,
      };
    
    case 'SET_CURRENT_ORGANIZATION':
      return {
        ...state,
        currentOrganization: action.payload,
      };
    
    case 'SET_USER_ORGANIZATIONS':
      return {
        ...state,
        userOrganizations: action.payload,
      };
    
    case 'SET_AVAILABLE_CATEGORIES':
      return {
        ...state,
        availableCategories: action.payload,
      };
    
    case 'SET_CROSS_ORGANIZATION_COLLABORATIONS':
      return {
        ...state,
        crossOrganizationCollaborations: action.payload,
      };
    
    case 'SET_AI_COLLABORATION_SESSIONS':
      return {
        ...state,
        aiCollaborationSessions: action.payload,
      };
    
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
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
    
    default:
      return state;
  }
}

// Multi-tenant context interface
interface MultiTenantContextType {
  state: MultiTenantState;
  dispatch: React.Dispatch<MultiTenantAction>;
  
  // Category operations
  createCategory: (data: Omit<Category, 'id' | 'createdAt' | 'updatedAt' | 'organizationCount'>) => Promise<{ success: boolean; categoryId?: string; error?: string }>;
  loadCategories: () => Promise<void>;
  
  // Organization operations
  createOrganization: (data: Omit<Organization, 'id' | 'createdAt' | 'updatedAt' | 'memberCount'>) => Promise<{ success: boolean; organizationId?: string; error?: string }>;
  loadUserOrganizations: () => Promise<void>;
  switchOrganization: (organizationId: string) => Promise<{ success: boolean; error?: string }>;
  
  // Collaboration operations
  createCollaboration: (data: Omit<CrossOrganizationCollaboration, 'id' | 'createdAt' | 'updatedAt'>) => Promise<{ success: boolean; collaborationId?: string; error?: string }>;
  loadCollaborations: (organizationId?: string) => Promise<void>;
  
  // AI Collaboration operations
  createAICollaborationSession: (data: Omit<AICollaborationSession, 'id' | 'createdAt' | 'updatedAt' | 'messages' | 'sharedResources' | 'outcomes'>) => Promise<{ success: boolean; sessionId?: string; error?: string }>;
  loadAICollaborationSessions: (organizationId?: string) => Promise<void>;
  
  // Utility operations
  clearError: () => void;
  setError: (error: string) => void;
}

// Create context
const MultiTenantContext = createContext<MultiTenantContextType | undefined>(undefined);

// Multi-tenant provider props
interface MultiTenantProviderProps {
  children: ReactNode;
}

// Multi-tenant provider component
export function MultiTenantProvider({ children }: MultiTenantProviderProps) {
  const [state, dispatch] = useReducer(multiTenantReducer, initialState);

  // Initialize multi-tenant state when user changes
  useEffect(() => {
    const unsubscribe = authService.onAuthStateChanged((user) => {
      if (user) {
        // Load user's organizations and available categories
        loadUserOrganizations();
        loadCategories();
      } else {
        // Clear multi-tenant state when user logs out
        dispatch({ type: 'SET_CURRENT_CATEGORY', payload: null });
        dispatch({ type: 'SET_CURRENT_ORGANIZATION', payload: null });
        dispatch({ type: 'SET_USER_ORGANIZATIONS', payload: [] });
        dispatch({ type: 'SET_AVAILABLE_CATEGORIES', payload: [] });
        dispatch({ type: 'SET_CROSS_ORGANIZATION_COLLABORATIONS', payload: [] });
        dispatch({ type: 'SET_AI_COLLABORATION_SESSIONS', payload: [] });
      }
    });

    return () => unsubscribe();
  }, []);

  // Category operations
  const createCategory = useCallback(async (data: Omit<Category, 'id' | 'createdAt' | 'updatedAt' | 'organizationCount'>): Promise<{ success: boolean; categoryId?: string; error?: string }> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      const result = await multiTenantService.createCategory(data);
      
      if (result.success) {
        // Reload categories to include the new one
        await loadCategories();
      } else {
        dispatch({ type: 'SET_ERROR', payload: result.error || 'Failed to create category' });
      }

      return result;
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      return { success: false, error: error.message };
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [dispatch]);

  const loadCategories = useCallback(async (): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const categories = await multiTenantService.getCategories();
      dispatch({ type: 'SET_AVAILABLE_CATEGORIES', payload: categories });
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [dispatch]);

  // Organization operations
  const createOrganization = useCallback(async (data: Omit<Organization, 'id' | 'createdAt' | 'updatedAt' | 'memberCount'>): Promise<{ success: boolean; organizationId?: string; error?: string }> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      const result = await multiTenantService.createOrganization(data);
      
      if (result.success) {
        // Reload user organizations to include the new one
        await loadUserOrganizations();
      } else {
        dispatch({ type: 'SET_ERROR', payload: result.error || 'Failed to create organization' });
      }

      return result;
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      return { success: false, error: error.message };
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [dispatch]);

  const loadUserOrganizations = useCallback(async (): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const organizations = await multiTenantService.getUserOrganizations();
      dispatch({ type: 'SET_USER_ORGANIZATIONS', payload: organizations });
      
      // Set current organization to the first one if none is set
      if (organizations.length > 0 && !state.currentOrganization) {
        dispatch({ type: 'SET_CURRENT_ORGANIZATION', payload: organizations[0] });
      }
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [dispatch, state.currentOrganization]);

  const switchOrganization = async (organizationId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      const result = await multiTenantService.switchOrganization(organizationId);
      
      if (result.success) {
        // Find and set the organization as current
        const organization = state.userOrganizations.find(org => org.id === organizationId);
        if (organization) {
          dispatch({ type: 'SET_CURRENT_ORGANIZATION', payload: organization });
        }
      } else {
        dispatch({ type: 'SET_ERROR', payload: result.error || 'Failed to switch organization' });
      }

      return result;
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      return { success: false, error: error.message };
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Collaboration operations
  const createCollaboration = async (data: Omit<CrossOrganizationCollaboration, 'id' | 'createdAt' | 'updatedAt'>): Promise<{ success: boolean; collaborationId?: string; error?: string }> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      const result = await multiTenantService.createCollaboration(data);
      
      if (result.success) {
        // Reload collaborations to include the new one
        await loadCollaborations(data.sourceOrganizationId);
      } else {
        dispatch({ type: 'SET_ERROR', payload: result.error || 'Failed to create collaboration' });
      }

      return result;
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      return { success: false, error: error.message };
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const loadCollaborations = async (organizationId?: string): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const collaborations = await multiTenantService.getCollaborations(organizationId);
      dispatch({ type: 'SET_CROSS_ORGANIZATION_COLLABORATIONS', payload: collaborations });
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // AI Collaboration operations
  const createAICollaborationSession = async (data: Omit<AICollaborationSession, 'id' | 'createdAt' | 'updatedAt' | 'messages' | 'sharedResources' | 'outcomes'>): Promise<{ success: boolean; sessionId?: string; error?: string }> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      const result = await multiTenantService.createAICollaborationSession(data);
      
      if (result.success) {
        // Reload AI collaboration sessions to include the new one
        await loadAICollaborationSessions(data.organizationIds[0]);
      } else {
        dispatch({ type: 'SET_ERROR', payload: result.error || 'Failed to create AI collaboration session' });
      }

      return result;
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      return { success: false, error: error.message };
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const loadAICollaborationSessions = async (organizationId?: string): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const sessions = await multiTenantService.getAICollaborationSessions(organizationId);
      dispatch({ type: 'SET_AI_COLLABORATION_SESSIONS', payload: sessions });
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Utility operations
  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const setError = (error: string) => {
    dispatch({ type: 'SET_ERROR', payload: error });
  };

  const contextValue: MultiTenantContextType = {
    state,
    dispatch,
    createCategory,
    loadCategories,
    createOrganization,
    loadUserOrganizations,
    switchOrganization,
    createCollaboration,
    loadCollaborations,
    createAICollaborationSession,
    loadAICollaborationSessions,
    clearError,
    setError,
  };

  return (
    <MultiTenantContext.Provider value={contextValue}>
      {children}
    </MultiTenantContext.Provider>
  );
}

// Hook to use multi-tenant context
export function useMultiTenant() {
  const context = useContext(MultiTenantContext);
  if (context === undefined) {
    throw new Error('useMultiTenant must be used within a MultiTenantProvider');
  }
  return context;
}
