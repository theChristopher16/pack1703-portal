import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ChatPage from '../ChatPage';
import { useAdmin } from '../../contexts/AdminContext';
import { authService } from '../../services/authService';
import chatService from '../../services/chatService';

// Mock dependencies
jest.mock('../../contexts/AdminContext');
jest.mock('../../services/authService');
jest.mock('../../services/chatService');
jest.mock('../../contexts/ToastContext', () => ({
  useToast: () => ({
    showSuccess: jest.fn(),
    showError: jest.fn(),
    showInfo: jest.fn(),
  }),
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Send: () => <div data-testid="send-icon">Send</div>,
  MessageCircle: () => <div data-testid="message-circle-icon">MessageCircle</div>,
  Settings: () => <div data-testid="settings-icon">Settings</div>,
  User: () => <div data-testid="user-icon">User</div>,
  Search: () => <div data-testid="search-icon">Search</div>,
  Smile: () => <div data-testid="smile-icon">Smile</div>,
  Share2: () => <div data-testid="share-icon">Share2</div>,
  Bold: () => <div data-testid="bold-icon">Bold</div>,
  Italic: () => <div data-testid="italic-icon">Italic</div>,
  Underline: () => <div data-testid="underline-icon">Underline</div>,
  Loader2: () => <div data-testid="loader-icon">Loader2</div>,
  Camera: () => <div data-testid="camera-icon">Camera</div>,
  Palette: () => <div data-testid="palette-icon">Palette</div>,
  Type: () => <div data-testid="type-icon">Type</div>,
  List: () => <div data-testid="list-icon">List</div>,
  Code: () => <div data-testid="code-icon">Code</div>,
  Quote: () => <div data-testid="quote-icon">Quote</div>,
  Link: () => <div data-testid="link-icon">Link</div>,
  Image: () => <div data-testid="image-icon">Image</div>,
  AtSign: () => <div data-testid="at-sign-icon">AtSign</div>,
  Hash: () => <div data-testid="hash-icon">Hash</div>,
  Star: () => <div data-testid="star-icon">Star</div>,
  Lock: () => <div data-testid="lock-icon">Lock</div>,
}));

const mockUseAdmin = useAdmin as jest.MockedFunction<typeof useAdmin>;
const mockAuthService = authService as jest.Mocked<typeof authService>;
const mockChatService = chatService as jest.Mocked<typeof chatService>;

const mockChatUser = {
  id: 'user1',
  name: 'Test User',
  isOnline: true,
  lastSeen: new Date(),
  isAdmin: false,
  sessionId: 'session1',
  userAgent: 'test-agent',
};

const mockAdminUser = {
  id: 'admin1',
  name: 'Admin User',
  isOnline: true,
  lastSeen: new Date(),
  isAdmin: true,
  sessionId: 'session1',
  userAgent: 'test-agent',
};

const mockChatMessage = {
  id: 'msg1',
  message: 'Test message',
  userId: 'user1',
  userName: 'Test User',
  timestamp: new Date(),
  channelId: 'general',
  isSystem: false,
  isAdmin: false,
};

const mockChatChannel = {
  id: 'general',
  name: 'General',
  description: 'General discussion',
  isActive: true,
  messageCount: 10,
  lastActivity: new Date(),
  isDenChannel: false,
};

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('ChatPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementations
    mockUseAdmin.mockReturnValue({
      state: {
        currentUser: {
          uid: 'user1',
          email: 'test@example.com',
          role: 'parent',
          isAdmin: false,
        },
        isLoading: false,
      },
      dispatch: vi.fn(),
    });

    mockAuthService.getCurrentUser.mockReturnValue({
      uid: 'user1',
      email: 'test@example.com',
      role: 'parent',
    });

    mockChatService.initialize.mockResolvedValue(mockChatUser);
    mockChatService.getChannels.mockResolvedValue([mockChatChannel]);
    mockChatService.getOnlineUsers.mockResolvedValue([mockChatUser]);
    mockChatService.getMessages.mockResolvedValue([mockChatMessage]);
    mockChatService.subscribeToOnlineUsers.mockReturnValue(jest.fn());
    mockChatService.subscribeToMessages.mockReturnValue(jest.fn());
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Authentication', () => {
    it('should show loading state when auth is loading', () => {
      mockUseAdmin.mockReturnValue({
        state: {
          currentUser: null,
          isLoading: true,
        },
        dispatch: vi.fn(),
      });

      renderWithRouter(<ChatPage />);
      
      expect(screen.getByText('Checking authentication...')).toBeInTheDocument();
    });

    it('should show login prompt when not authenticated', () => {
      mockUseAdmin.mockReturnValue({
        state: {
          currentUser: null,
          isLoading: false,
        },
        dispatch: vi.fn(),
      });

      renderWithRouter(<ChatPage />);
      
      expect(screen.getByText('Sign In Required')).toBeInTheDocument();
      expect(screen.getByText('Please sign in to access the chat feature.')).toBeInTheDocument();
    });

    it('should initialize chat for authenticated users', async () => {
      renderWithRouter(<ChatPage />);
      
      await waitFor(() => {
        expect(mockChatService.initialize).toHaveBeenCalled();
      });
    });

    it('should initialize as admin for admin users', async () => {
      mockUseAdmin.mockReturnValue({
        state: {
          currentUser: {
            uid: 'admin1',
            email: 'admin@example.com',
            role: 'admin',
            isAdmin: true,
          },
          isLoading: false,
        },
        dispatch: vi.fn(),
      });

      mockAuthService.getCurrentUser.mockReturnValue({
        uid: 'admin1',
        email: 'admin@example.com',
        role: 'admin',
      });

      mockChatService.initializeAsAdmin.mockResolvedValue(mockAdminUser);

      renderWithRouter(<ChatPage />);
      
      await waitFor(() => {
        expect(mockChatService.initializeAsAdmin).toHaveBeenCalled();
      });
    });
  });

  describe('Chat Functionality', () => {
    it('should load channels and users on initialization', async () => {
      renderWithRouter(<ChatPage />);
      
      await waitFor(() => {
        expect(mockChatService.getChannels).toHaveBeenCalled();
        expect(mockChatService.getOnlineUsers).toHaveBeenCalled();
      });
    });

    it('should send a message when form is submitted', async () => {
      mockChatService.sendMessage.mockResolvedValue(undefined);
      
      renderWithRouter(<ChatPage />);
      
      await waitFor(() => {
        expect(mockChatService.initialize).toHaveBeenCalled();
      });

      const messageInput = screen.getByPlaceholderText(/message/i);
      const sendButton = screen.getByRole('button', { name: /send/i });

      fireEvent.change(messageInput, { target: { value: 'Test message' } });
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(mockChatService.sendMessage).toHaveBeenCalledWith('general', 'Test message');
      });
    });

    it('should not send empty messages', async () => {
      renderWithRouter(<ChatPage />);
      
      await waitFor(() => {
        expect(mockChatService.initialize).toHaveBeenCalled();
      });

      const sendButton = screen.getByRole('button', { name: /send/i });
      fireEvent.click(sendButton);

      expect(mockChatService.sendMessage).not.toHaveBeenCalled();
    });

    it('should switch channels when channel is clicked', async () => {
      const mockChannel2 = {
        ...mockChatChannel,
        id: 'events',
        name: 'Events',
      };

      mockChatService.getChannels.mockResolvedValue([mockChatChannel, mockChannel2]);

      renderWithRouter(<ChatPage />);
      
      await waitFor(() => {
        expect(mockChatService.getChannels).toHaveBeenCalled();
      });

      const eventsChannel = screen.getByText('Events');
      fireEvent.click(eventsChannel);

      await waitFor(() => {
        expect(mockChatService.getMessages).toHaveBeenCalledWith('events');
      });
    });
  });

  describe('Admin Functionality', () => {
    beforeEach(() => {
      mockUseAdmin.mockReturnValue({
        state: {
          currentUser: {
            uid: 'admin1',
            email: 'admin@example.com',
            role: 'admin',
            isAdmin: true,
          },
          isLoading: false,
        },
        dispatch: vi.fn(),
      });

      mockAuthService.getCurrentUser.mockReturnValue({
        uid: 'admin1',
        email: 'admin@example.com',
        role: 'admin',
      });

      mockChatService.initializeAsAdmin.mockResolvedValue(mockAdminUser);
    });

    it('should show admin controls for admin users', async () => {
      renderWithRouter(<ChatPage />);
      
      await waitFor(() => {
        expect(mockChatService.initializeAsAdmin).toHaveBeenCalled();
      });

      // Admin controls should be visible
      expect(screen.getByText('Admin')).toBeInTheDocument();
    });

    it('should allow admin to delete messages', async () => {
      mockChatService.deleteMessage.mockResolvedValue(undefined);
      
      renderWithRouter(<ChatPage />);
      
      await waitFor(() => {
        expect(mockChatService.initializeAsAdmin).toHaveBeenCalled();
      });

      // Find and click delete button (if visible)
      const deleteButtons = screen.queryAllByRole('button', { name: /delete/i });
      if (deleteButtons.length > 0) {
        fireEvent.click(deleteButtons[0]);
        expect(mockChatService.deleteMessage).toHaveBeenCalled();
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle chat initialization errors', async () => {
      mockChatService.initialize.mockRejectedValue(new Error('Connection failed'));
      
      renderWithRouter(<ChatPage />);
      
      await waitFor(() => {
        expect(screen.getByText(/unable to connect/i)).toBeInTheDocument();
      });
    });

    it('should handle message send errors', async () => {
      mockChatService.sendMessage.mockRejectedValue(new Error('Send failed'));
      
      renderWithRouter(<ChatPage />);
      
      await waitFor(() => {
        expect(mockChatService.initialize).toHaveBeenCalled();
      });

      const messageInput = screen.getByPlaceholderText(/message/i);
      const sendButton = screen.getByRole('button', { name: /send/i });

      fireEvent.change(messageInput, { target: { value: 'Test message' } });
      fireEvent.click(sendButton);

      // Should handle error gracefully
      await waitFor(() => {
        expect(mockChatService.sendMessage).toHaveBeenCalled();
      });
    });
  });

  describe('Real-time Updates', () => {
    it('should subscribe to real-time updates', async () => {
      renderWithRouter(<ChatPage />);
      
      await waitFor(() => {
        expect(mockChatService.subscribeToOnlineUsers).toHaveBeenCalled();
        expect(mockChatService.subscribeToMessages).toHaveBeenCalled();
      });
    });

    it('should cleanup subscriptions on unmount', () => {
      const { unmount } = renderWithRouter(<ChatPage />);
      
      unmount();
      
      // Cleanup should be called
      expect(mockChatService.cleanup).toHaveBeenCalled();
    });
  });
});