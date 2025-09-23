import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ChatPageOptimized from '../ChatPageOptimized';
import { useChatState } from '../../hooks/useOptimizedState';
import { useAdmin } from '../../contexts/AdminContext';
import { authService, UserRole, Permission } from '../../services/authService';
import chatService from '../../services/chatService';

// Mock the hooks and services
jest.mock('../../hooks/useOptimizedState');
jest.mock('../../contexts/AdminContext');
jest.mock('../../services/authService');
jest.mock('../../services/chatService');
jest.mock('../../contexts/ToastContext', () => ({
  useToast: () => ({
    showSuccess: jest.fn(),
    showError: jest.fn(),
    showInfo: jest.fn()
  })
}));

const mockedUseChatState = useChatState as jest.MockedFunction<typeof useChatState>;
const mockedUseAdmin = useAdmin as jest.MockedFunction<typeof useAdmin>;
const mockedAuthService = authService as jest.Mocked<typeof authService>;
const mockedChatService = chatService as jest.Mocked<typeof chatService>;

describe('ChatPageOptimized', () => {
  const mockActions = {
    setMessages: jest.fn(),
    addMessage: jest.fn(),
    setUsers: jest.fn(),
    setChannels: jest.fn(),
    setSelectedChannel: jest.fn(),
    setNewMessage: jest.fn(),
    setConnected: jest.fn(),
    toggleDenExpansion: jest.fn(),
    setCurrentUser: jest.fn(),
    setLoading: jest.fn(),
    setSidebarOpen: jest.fn(),
    setSearchQuery: jest.fn(),
    setError: jest.fn(),
    setAtBottom: jest.fn(),
    setMessageListRef: jest.fn(),
    setHasNewMessages: jest.fn(),
    setAuthenticated: jest.fn(),
    setUserRole: jest.fn(),
    setAuthLoading: jest.fn(),
    updateRichTextState: jest.fn(),
    setShowRichToolbar: jest.fn(),
    setShowColorPicker: jest.fn(),
    setShowGifPicker: jest.fn(),
    setGifs: jest.fn(),
    setGifSearchQuery: jest.fn(),
    setLoadingGifs: jest.fn(),
    setGifSearchResults: jest.fn(),
    setShowGifSearch: jest.fn(),
    setShowReactionPicker: jest.fn(),
    setUploadedImages: jest.fn(),
    setUploading: jest.fn(),
    resetChatState: jest.fn()
  };

  const mockSelectors = {
    filteredMessages: [],
    currentChannel: { id: 'general', name: 'General', description: 'General chat' },
    onlineUsersCount: 5,
    canSendMessage: true,
    hasActiveFormatting: false
  };

  const mockState = {
    messages: [],
    users: [],
    channels: [{ id: 'general', name: 'General', description: 'General chat' }],
    selectedChannel: 'general',
    newMessage: '',
    isConnected: true,
    expandedDens: new Set(),
    currentUser: { id: 'user1', name: 'Test User', isOnline: true },
    isLoading: false,
    isSidebarOpen: false,
    searchQuery: '',
    error: null,
    isAtBottom: true,
    messageListRef: null,
    hasNewMessages: false,
    isAuthenticated: true,
    userRole: UserRole.PARENT,
    authLoading: false,
    richTextState: {
      isBold: false,
      isItalic: false,
      isUnderline: false,
      isStrikethrough: false,
      isCode: false,
      selectedColor: 'inherit',
      selectedText: '',
      cursorPosition: { start: 0, end: 0 }
    },
    showRichToolbar: false,
    showColorPicker: false,
    showGifPicker: false,
    gifs: [],
    gifSearchQuery: '',
    isLoadingGifs: false,
    gifSearchResults: [],
    showGifSearch: false,
    showReactionPicker: null,
    uploadedImages: [],
    isUploading: false
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockedUseChatState.mockReturnValue({
      state: mockState,
      actions: mockActions,
      selectors: mockSelectors
    });

    mockedUseAdmin.mockReturnValue({
      state: {
        currentUser: {
          uid: 'user1',
          email: 'test@example.com',
          displayName: 'Test User',
          role: 'viewer',
          permissions: [Permission.CHAT_READ, Permission.CHAT_WRITE],
          isActive: true
        },
        isAuthenticated: true,
        isLoading: false,
        permissions: [],
        role: 'viewer',
        recentActions: [],
        auditLogs: [],
        dashboardStats: null,
        systemHealth: null,
        notifications: [],
        error: null
      },
      dispatch: jest.fn(),
      login: jest.fn(),
      logout: jest.fn(),
      hasPermission: jest.fn(),
      hasAnyPermission: jest.fn(),
      hasRole: jest.fn(),
      createEntity: jest.fn(),
      updateEntity: jest.fn(),
      deleteEntity: jest.fn(),
      bulkOperation: jest.fn(),
      exportData: jest.fn(),
      importData: jest.fn(),
      refreshDashboardStats: jest.fn(),
      refreshAuditLogs: jest.fn(),
      refreshSystemHealth: jest.fn(),
      addNotification: jest.fn(),
      removeNotification: jest.fn(),
      setError: jest.fn(),
      clearError: jest.fn()
    });

    mockedAuthService.onAuthStateChanged = jest.fn();
    mockedChatService.initialize = jest.fn();
    mockedChatService.getChannels = jest.fn();
    mockedChatService.getOnlineUsers = jest.fn();
  });

  describe('Authentication States', () => {
    it('should show loading state while authenticating', () => {
      mockedUseAdmin.mockReturnValue({
        state: {
          currentUser: null,
          isAuthenticated: false,
          isLoading: true,
          permissions: [],
          role: null,
          recentActions: [],
          auditLogs: [],
          dashboardStats: null,
          systemHealth: null,
          notifications: [],
          error: null
        },
        dispatch: jest.fn(),
        login: jest.fn(),
        logout: jest.fn(),
        hasPermission: jest.fn(),
        hasAnyPermission: jest.fn(),
        hasRole: jest.fn(),
        createEntity: jest.fn(),
        updateEntity: jest.fn(),
        deleteEntity: jest.fn(),
        bulkOperation: jest.fn(),
        exportData: jest.fn(),
        importData: jest.fn(),
        refreshDashboardStats: jest.fn(),
        refreshAuditLogs: jest.fn(),
        refreshSystemHealth: jest.fn(),
        addNotification: jest.fn(),
        removeNotification: jest.fn(),
        setError: jest.fn(),
        clearError: jest.fn()
      });

      render(<ChatPageOptimized />);

      expect(screen.getByText('Loading chat...')).toBeInTheDocument();
    });

    it('should show authentication required message when not authenticated', () => {
      mockedUseAdmin.mockReturnValue({
        state: {
          currentUser: null,
          isAuthenticated: false,
          isLoading: false,
          permissions: [],
          role: null,
          recentActions: [],
          auditLogs: [],
          dashboardStats: null,
          systemHealth: null,
          notifications: [],
          error: null
        },
        dispatch: jest.fn(),
        login: jest.fn(),
        logout: jest.fn(),
        hasPermission: jest.fn(),
        hasAnyPermission: jest.fn(),
        hasRole: jest.fn(),
        createEntity: jest.fn(),
        updateEntity: jest.fn(),
        deleteEntity: jest.fn(),
        bulkOperation: jest.fn(),
        exportData: jest.fn(),
        importData: jest.fn(),
        refreshDashboardStats: jest.fn(),
        refreshAuditLogs: jest.fn(),
        refreshSystemHealth: jest.fn(),
        addNotification: jest.fn(),
        removeNotification: jest.fn(),
        setError: jest.fn(),
        clearError: jest.fn()
      });

      render(<ChatPageOptimized />);

      expect(screen.getByText('Authentication Required')).toBeInTheDocument();
      expect(screen.getByText('Chat is only available to registered pack members. Please sign in to access the chat system.')).toBeInTheDocument();
    });

    it('should show permission error when user lacks chat permissions', () => {
      mockedUseAdmin.mockReturnValue({
        state: {
          currentUser: {
            uid: 'user1',
            email: 'test@example.com',
            displayName: 'Test User',
            role: 'viewer',
            permissions: [], // No chat permissions
            isActive: true
          },
          isAuthenticated: true,
          isLoading: false,
          permissions: [],
          role: 'viewer',
          recentActions: [],
          auditLogs: [],
          dashboardStats: null,
          systemHealth: null,
          notifications: [],
          error: null
        },
        dispatch: jest.fn(),
        login: jest.fn(),
        logout: jest.fn(),
        hasPermission: jest.fn(),
        hasAnyPermission: jest.fn(),
        hasRole: jest.fn(),
        createEntity: jest.fn(),
        updateEntity: jest.fn(),
        deleteEntity: jest.fn(),
        bulkOperation: jest.fn(),
        exportData: jest.fn(),
        importData: jest.fn(),
        refreshDashboardStats: jest.fn(),
        refreshAuditLogs: jest.fn(),
        refreshSystemHealth: jest.fn(),
        addNotification: jest.fn(),
        removeNotification: jest.fn(),
        setError: jest.fn(),
        clearError: jest.fn()
      });

      render(<ChatPageOptimized />);

      expect(screen.getByText('Error: You do not have permission to access chat')).toBeInTheDocument();
    });
  });

  describe('Chat Interface', () => {
    it('should render chat interface when authenticated and authorized', () => {
      render(<ChatPageOptimized />);

      expect(screen.getByText('Pack Chat')).toBeInTheDocument();
      expect(screen.getByText('General')).toBeInTheDocument();
      expect(screen.getByText('5 online')).toBeInTheDocument();
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });

    it('should show user permissions in sidebar', () => {
      render(<ChatPageOptimized />);

      expect(screen.getByText('Can send messages')).toBeInTheDocument();
    });

    it('should handle channel selection', async () => {
      render(<ChatPageOptimized />);

      const channelButton = screen.getByText('#General');
      fireEvent.click(channelButton);

      expect(mockActions.setSelectedChannel).toHaveBeenCalledWith('general');
    });

    it('should handle message input changes', () => {
      render(<ChatPageOptimized />);

      const messageInput = screen.getByPlaceholderText('Type a message...');
      fireEvent.change(messageInput, { target: { value: 'Test message' } });

      expect(mockActions.setNewMessage).toHaveBeenCalledWith('Test message');
    });

    it('should disable message input when user lacks write permissions', () => {
      mockedUseAdmin.mockReturnValue({
        state: {
          currentUser: {
            uid: 'user1',
            email: 'test@example.com',
            displayName: 'Test User',
            role: 'viewer',
            permissions: [Permission.CHAT_READ], // Only read permission
            isActive: true
          },
          isAuthenticated: true,
          isLoading: false,
          permissions: [],
          role: 'viewer',
          recentActions: [],
          auditLogs: [],
          dashboardStats: null,
          systemHealth: null,
          notifications: [],
          error: null
        },
        dispatch: jest.fn(),
        login: jest.fn(),
        logout: jest.fn(),
        hasPermission: jest.fn(),
        hasAnyPermission: jest.fn(),
        hasRole: jest.fn(),
        createEntity: jest.fn(),
        updateEntity: jest.fn(),
        deleteEntity: jest.fn(),
        bulkOperation: jest.fn(),
        exportData: jest.fn(),
        importData: jest.fn(),
        refreshDashboardStats: jest.fn(),
        refreshAuditLogs: jest.fn(),
        refreshSystemHealth: jest.fn(),
        addNotification: jest.fn(),
        removeNotification: jest.fn(),
        setError: jest.fn(),
        clearError: jest.fn()
      });

      render(<ChatPageOptimized />);

      const messageInput = screen.getByPlaceholderText("You don't have permission to send messages");
      expect(messageInput).toBeDisabled();

      const sendButton = screen.getByTitle("You don't have permission to send messages");
      expect(sendButton).toBeDisabled();
    });

    it('should handle rich text formatting', () => {
      render(<ChatPageOptimized />);

      const messageInput = screen.getByPlaceholderText('Type a message...');
      fireEvent.focus(messageInput);

      expect(mockActions.setShowRichToolbar).toHaveBeenCalledWith(true);
    });

    it('should handle GIF picker toggle', () => {
      render(<ChatPageOptimized />);

      const gifButton = screen.getByTitle('Add GIF');
      fireEvent.click(gifButton);

      expect(mockActions.setShowGifPicker).toHaveBeenCalledWith(true);
    });

    it('should handle file upload', () => {
      render(<ChatPageOptimized />);

      const fileInput = screen.queryByTestId('file-input');
      // File input might not be rendered in test environment
      // This test would need to be enhanced with proper file input handling
    });
  });

  describe('Error Handling', () => {
    it('should show error state when chat service fails', () => {
      mockedUseChatState.mockReturnValue({
        state: {
          ...mockState,
          error: 'Failed to connect to chat service'
        },
        actions: mockActions,
        selectors: mockSelectors
      });

      render(<ChatPageOptimized />);

      expect(screen.getByText('Error: Failed to connect to chat service')).toBeInTheDocument();
      expect(screen.getByText('Retry')).toBeInTheDocument();
    });

    it('should handle retry functionality', () => {
      const reloadSpy = jest.fn();
      Object.defineProperty(window, 'location', {
        value: { ...window.location, reload: reloadSpy },
        writable: true
      });

      mockedUseChatState.mockReturnValue({
        state: {
          ...mockState,
          error: 'Failed to connect to chat service'
        },
        actions: mockActions,
        selectors: mockSelectors
      });

      render(<ChatPageOptimized />);

      const retryButton = screen.getByText('Retry');
      fireEvent.click(retryButton);

      expect(reloadSpy).toHaveBeenCalled();
    });
  });

  describe('Performance and Optimization', () => {
    it('should use optimized state management', () => {
      render(<ChatPageOptimized />);

      expect(mockedUseChatState).toHaveBeenCalled();
    });

    it('should handle large message lists efficiently', () => {
      const largeMessageList = Array.from({ length: 100 }, (_, i) => ({
        id: `msg${i}`,
        message: `Message ${i}`,
        userId: 'user1',
        userName: 'Test User',
        channelId: 'general',
        timestamp: new Date(),
        isSystem: false,
        isAdmin: false,
        reactions: []
      }));

      mockedUseChatState.mockReturnValue({
        state: {
          ...mockState,
          messages: largeMessageList
        },
        actions: mockActions,
        selectors: {
          ...mockSelectors,
          filteredMessages: largeMessageList
        }
      });

      render(<ChatPageOptimized />);

      // Should render without performance issues
      expect(screen.getByText('Pack Chat')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<ChatPageOptimized />);

      const messageInput = screen.getByPlaceholderText('Type a message...');
      expect(messageInput).toHaveAttribute('aria-label');

      const sendButton = screen.getByTitle('Send message (Ctrl+Enter)');
      expect(sendButton).toBeInTheDocument();
    });

    it('should support keyboard navigation', () => {
      render(<ChatPageOptimized />);

      const messageInput = screen.getByPlaceholderText('Type a message...');
      messageInput.focus();

      // Simulate keyboard shortcuts
      fireEvent.keyDown(messageInput, { key: 'Enter', ctrlKey: true });

      // Should trigger send message
      expect(mockActions.setNewMessage).toHaveBeenCalled(); // Message should be cleared
    });
  });
});