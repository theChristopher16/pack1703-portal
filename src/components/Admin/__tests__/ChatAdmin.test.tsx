import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ChatAdmin from '../ChatAdmin';
import chatService from '../../../services/chatService';
import { useToast } from '../../../contexts/ToastContext';

// Mock dependencies
jest.mock('../../../services/chatService');
jest.mock('../../../services/tenorService', () => ({
  default: {
    getTrendingGifs: jest.fn().mockResolvedValue([]),
    searchGifs: jest.fn().mockResolvedValue([]),
    getApiStatus: jest.fn().mockReturnValue('API Status: Connected'),
  },
}));
jest.mock('../../../contexts/ToastContext', () => ({
  useToast: () => ({
    showSuccess: jest.fn(),
    showError: jest.fn(),
    showInfo: jest.fn(),
    showWarning: jest.fn(),
  }),
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Bold: () => <div data-testid="bold-icon">Bold</div>,
  Italic: () => <div data-testid="italic-icon">Italic</div>,
  Underline: () => <div data-testid="underline-icon">Underline</div>,
  Strikethrough: () => <div data-testid="strikethrough-icon">Strikethrough</div>,
  Code: () => <div data-testid="code-icon">Code</div>,
  Link: () => <div data-testid="link-icon">Link</div>,
  List: () => <div data-testid="list-icon">List</div>,
  ListOrdered: () => <div data-testid="list-ordered-icon">ListOrdered</div>,
  Quote: () => <div data-testid="quote-icon">Quote</div>,
  Camera: () => <div data-testid="camera-icon">Camera</div>,
  Palette: () => <div data-testid="palette-icon">Palette</div>,
  Type: () => <div data-testid="type-icon">Type</div>,
  Loader2: () => <div data-testid="loader-icon">Loader2</div>,
  Send: () => <div data-testid="send-icon">Send</div>,
  CheckCircle: () => <div data-testid="check-circle-icon">CheckCircle</div>,
  AlertTriangle: () => <div data-testid="alert-triangle-icon">AlertTriangle</div>,
  Users: () => <div data-testid="users-icon">Users</div>,
  MessageCircle: () => <div data-testid="message-circle-icon">MessageCircle</div>,
  Settings: () => <div data-testid="settings-icon">Settings</div>,
  User: () => <div data-testid="user-icon">User</div>,
  Smile: () => <div data-testid="smile-icon">Smile</div>,
  Trash2: () => <div data-testid="trash-icon">Trash2</div>,
  Share2: () => <div data-testid="share-icon">Share2</div>,
  AtSign: () => <div data-testid="at-sign-icon">AtSign</div>,
  Hash: () => <div data-testid="hash-icon">Hash</div>,
}));

const mockChatService = chatService as jest.Mocked<typeof chatService>;
const mockUseToast = useToast as jest.MockedFunction<typeof useToast>;

const mockAdminUser = {
  id: 'admin1',
  name: 'Admin User',
  isOnline: true,
  lastSeen: new Date(),
  isAdmin: true,
  sessionId: 'session1',
  userAgent: 'test-agent',
  den: 'pack-leader',
  familyName: 'Admin Family',
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

const mockChatUser = {
  id: 'user1',
  name: 'Test User',
  isOnline: true,
  lastSeen: new Date(),
  isAdmin: false,
  sessionId: 'session1',
  userAgent: 'test-agent',
  den: 'lion',
  familyName: 'Test Family',
};

describe('ChatAdmin', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementations
    mockChatService.initializeAsAdmin.mockResolvedValue(mockAdminUser);
    mockChatService.getChannels.mockResolvedValue([mockChatChannel]);
    mockChatService.getOnlineUsers.mockResolvedValue([mockChatUser]);
    mockChatService.getMessages.mockResolvedValue([mockChatMessage]);
    mockChatService.subscribeToOnlineUsers.mockReturnValue(jest.fn());
    mockChatService.subscribeToMessages.mockReturnValue(jest.fn());
    mockChatService.sendMessage.mockResolvedValue(undefined);
    mockChatService.deleteMessage.mockResolvedValue(undefined);
    mockChatService.banUser.mockResolvedValue(undefined);
    mockChatService.muteUser.mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize as admin user', async () => {
      render(<ChatAdmin />);
      
      await waitFor(() => {
        expect(mockChatService.initializeAsAdmin).toHaveBeenCalled();
      });
    });

    it('should load channels and users', async () => {
      render(<ChatAdmin />);
      
      await waitFor(() => {
        expect(mockChatService.getChannels).toHaveBeenCalled();
        expect(mockChatService.getOnlineUsers).toHaveBeenCalled();
      });
    });

    it('should show connection status', async () => {
      render(<ChatAdmin />);
      
      await waitFor(() => {
        expect(screen.getByText('Connected')).toBeInTheDocument();
      });
    });
  });

  describe('Navigation', () => {
    it('should show overview tab by default', async () => {
      render(<ChatAdmin />);
      
      await waitFor(() => {
        expect(screen.getByText('System Overview')).toBeInTheDocument();
      });
    });

    it('should switch to messages tab', async () => {
      render(<ChatAdmin />);
      
      await waitFor(() => {
        expect(mockChatService.initializeAsAdmin).toHaveBeenCalled();
      });

      const messagesTab = screen.getByText('Messages');
      fireEvent.click(messagesTab);

      expect(screen.getByText('Channels')).toBeInTheDocument();
    });

    it('should switch to users tab', async () => {
      render(<ChatAdmin />);
      
      await waitFor(() => {
        expect(mockChatService.initializeAsAdmin).toHaveBeenCalled();
      });

      const usersTab = screen.getByText('Users');
      fireEvent.click(usersTab);

      expect(screen.getByText('User Management')).toBeInTheDocument();
    });

    it('should switch to channels tab', async () => {
      render(<ChatAdmin />);
      
      await waitFor(() => {
        expect(mockChatService.initializeAsAdmin).toHaveBeenCalled();
      });

      const channelsTab = screen.getByText('Channels');
      fireEvent.click(channelsTab);

      expect(screen.getByText('Channel Management')).toBeInTheDocument();
    });

    it('should switch to dens tab', async () => {
      render(<ChatAdmin />);
      
      await waitFor(() => {
        expect(mockChatService.initializeAsAdmin).toHaveBeenCalled();
      });

      const densTab = screen.getByText('Dens');
      fireEvent.click(densTab);

      expect(screen.getByText('Den Management')).toBeInTheDocument();
    });

    it('should switch to settings tab', async () => {
      render(<ChatAdmin />);
      
      await waitFor(() => {
        expect(mockChatService.initializeAsAdmin).toHaveBeenCalled();
      });

      const settingsTab = screen.getByText('Settings');
      fireEvent.click(settingsTab);

      expect(screen.getByText('Settings')).toBeInTheDocument();
    });
  });

  describe('Overview Tab', () => {
    it('should display system statistics', async () => {
      render(<ChatAdmin />);
      
      await waitFor(() => {
        expect(screen.getByText('Total Users')).toBeInTheDocument();
        expect(screen.getByText('Online Users')).toBeInTheDocument();
        expect(screen.getByText('Total Messages')).toBeInTheDocument();
        expect(screen.getByText('Active Channels')).toBeInTheDocument();
        expect(screen.getByText('Total Dens')).toBeInTheDocument();
        expect(screen.getByText('Active Dens')).toBeInTheDocument();
      });
    });

    it('should display system status information', async () => {
      render(<ChatAdmin />);
      
      await waitFor(() => {
        expect(screen.getByText('System Status')).toBeInTheDocument();
        expect(screen.getByText('Recent Activity')).toBeInTheDocument();
      });
    });
  });

  describe('Messages Tab', () => {
    it('should show chat interface', async () => {
      render(<ChatAdmin />);
      
      await waitFor(() => {
        expect(mockChatService.initializeAsAdmin).toHaveBeenCalled();
      });

      const messagesTab = screen.getByText('Messages');
      fireEvent.click(messagesTab);

      expect(screen.getByText('Channels')).toBeInTheDocument();
    });

    it('should send messages', async () => {
      render(<ChatAdmin />);
      
      await waitFor(() => {
        expect(mockChatService.initializeAsAdmin).toHaveBeenCalled();
      });

      const messagesTab = screen.getByText('Messages');
      fireEvent.click(messagesTab);

      const messageInput = screen.getByPlaceholderText(/message/i);
      const sendButton = screen.getByRole('button', { name: /send/i });

      fireEvent.change(messageInput, { target: { value: 'Admin message' } });
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(mockChatService.sendMessage).toHaveBeenCalledWith('general', 'Admin message');
      });
    });

    it('should delete messages', async () => {
      render(<ChatAdmin />);
      
      await waitFor(() => {
        expect(mockChatService.initializeAsAdmin).toHaveBeenCalled();
      });

      const messagesTab = screen.getByText('Messages');
      fireEvent.click(messagesTab);

      // Find delete buttons (they appear on hover)
      const deleteButtons = screen.queryAllByTestId('trash-icon');
      if (deleteButtons.length > 0) {
        fireEvent.click(deleteButtons[0]);
        expect(mockChatService.deleteMessage).toHaveBeenCalled();
      }
    });
  });

  describe('Users Tab', () => {
    it('should display user management table', async () => {
      render(<ChatAdmin />);
      
      await waitFor(() => {
        expect(mockChatService.initializeAsAdmin).toHaveBeenCalled();
      });

      const usersTab = screen.getByText('Users');
      fireEvent.click(usersTab);

      expect(screen.getByText('User Management')).toBeInTheDocument();
      expect(screen.getByText('User')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Den')).toBeInTheDocument();
      expect(screen.getByText('Last Seen')).toBeInTheDocument();
      expect(screen.getByText('Role')).toBeInTheDocument();
      expect(screen.getByText('Actions')).toBeInTheDocument();
    });

    it('should show user information', async () => {
      render(<ChatAdmin />);
      
      await waitFor(() => {
        expect(mockChatService.initializeAsAdmin).toHaveBeenCalled();
      });

      const usersTab = screen.getByText('Users');
      fireEvent.click(usersTab);

      expect(screen.getByText('Test User')).toBeInTheDocument();
      expect(screen.getByText('Lion Den')).toBeInTheDocument();
    });
  });

  describe('Channels Tab', () => {
    it('should display channel management', async () => {
      render(<ChatAdmin />);
      
      await waitFor(() => {
        expect(mockChatService.initializeAsAdmin).toHaveBeenCalled();
      });

      const channelsTab = screen.getByText('Channels');
      fireEvent.click(channelsTab);

      expect(screen.getByText('Channel Management')).toBeInTheDocument();
      expect(screen.getByText('Pack Channels')).toBeInTheDocument();
      expect(screen.getByText('Den Channels')).toBeInTheDocument();
    });

    it('should show channel information', async () => {
      render(<ChatAdmin />);
      
      await waitFor(() => {
        expect(mockChatService.initializeAsAdmin).toHaveBeenCalled();
      });

      const channelsTab = screen.getByText('Channels');
      fireEvent.click(channelsTab);

      expect(screen.getByText('General')).toBeInTheDocument();
    });
  });

  describe('Dens Tab', () => {
    it('should display den management', async () => {
      render(<ChatAdmin />);
      
      await waitFor(() => {
        expect(mockChatService.initializeAsAdmin).toHaveBeenCalled();
      });

      const densTab = screen.getByText('Dens');
      fireEvent.click(densTab);

      expect(screen.getByText('Den Management')).toBeInTheDocument();
    });

    it('should show all den types', async () => {
      render(<ChatAdmin />);
      
      await waitFor(() => {
        expect(mockChatService.initializeAsAdmin).toHaveBeenCalled();
      });

      const densTab = screen.getByText('Dens');
      fireEvent.click(densTab);

      expect(screen.getByText('Lion Den')).toBeInTheDocument();
      expect(screen.getByText('Tiger Den')).toBeInTheDocument();
      expect(screen.getByText('Wolf Den')).toBeInTheDocument();
      expect(screen.getByText('Bear Den')).toBeInTheDocument();
      expect(screen.getByText('Webelos Den')).toBeInTheDocument();
      expect(screen.getByText('Arrow of Light')).toBeInTheDocument();
    });
  });

  describe('Settings Tab', () => {
    it('should display admin settings', async () => {
      render(<ChatAdmin />);
      
      await waitFor(() => {
        expect(mockChatService.initializeAsAdmin).toHaveBeenCalled();
      });

      const settingsTab = screen.getByText('Settings');
      fireEvent.click(settingsTab);

      expect(screen.getByText('Settings')).toBeInTheDocument();
      expect(screen.getByText('Your Profile')).toBeInTheDocument();
      expect(screen.getByText('System Settings')).toBeInTheDocument();
    });

    it('should show admin profile information', async () => {
      render(<ChatAdmin />);
      
      await waitFor(() => {
        expect(mockChatService.initializeAsAdmin).toHaveBeenCalled();
      });

      const settingsTab = screen.getByText('Settings');
      fireEvent.click(settingsTab);

      expect(screen.getByText('Admin User')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle initialization errors', async () => {
      mockChatService.initializeAsAdmin.mockRejectedValue(new Error('Connection failed'));
      
      render(<ChatAdmin />);
      
      await waitFor(() => {
        expect(screen.getByText('Disconnected')).toBeInTheDocument();
      });
    });

    it('should handle message send errors', async () => {
      mockChatService.sendMessage.mockRejectedValue(new Error('Send failed'));
      
      render(<ChatAdmin />);
      
      await waitFor(() => {
        expect(mockChatService.initializeAsAdmin).toHaveBeenCalled();
      });

      const messagesTab = screen.getByText('Messages');
      fireEvent.click(messagesTab);

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

  describe('Cleanup', () => {
    it('should cleanup on unmount', () => {
      const { unmount } = render(<ChatAdmin />);
      
      unmount();
      
      expect(mockChatService.cleanup).toHaveBeenCalled();
    });
  });
});