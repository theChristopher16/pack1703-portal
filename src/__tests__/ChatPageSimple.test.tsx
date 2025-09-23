import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ChatPageSimple from '../pages/ChatPageSimple';
import { useAdmin } from '../contexts/AdminContext';
import { useSimpleChatState } from '../hooks/useSimpleChatState';

// Mock the contexts and hooks
jest.mock('../contexts/AdminContext');
jest.mock('../hooks/useSimpleChatState');
jest.mock('../services/chatService');

const mockUseAdmin = useAdmin as jest.MockedFunction<typeof useAdmin>;
const mockUseSimpleChatState = useSimpleChatState as jest.MockedFunction<typeof useSimpleChatState>;

describe('ChatPageSimple', () => {
  const mockChannels = [
    { id: 'general', name: 'General', isDenChannel: false, messageCount: 5 },
    { id: 'announcements', name: 'Announcements', isDenChannel: false, messageCount: 2 },
    { id: 'events', name: 'Events', isDenChannel: false, messageCount: 1 },
    { id: 'lion-den', name: 'Lion Den', isDenChannel: true, denType: 'lion', messageCount: 0 },
    { id: 'tiger-den', name: 'Tiger Den', isDenChannel: true, denType: 'tiger', messageCount: 3 },
    { id: 'wolf-den', name: 'Wolf Den', isDenChannel: true, denType: 'wolf', messageCount: 1 },
  ];

  const mockMessages = [
    {
      id: '1',
      content: 'Hello everyone!',
      userId: 'user1',
      userName: 'Christopher Smith',
      timestamp: new Date(),
      isSystem: false,
      isAdmin: false,
      reactions: []
    }
  ];

  const mockCurrentUser = {
    id: 'user1',
    name: 'Christopher Smith',
    email: 'christopher@example.com',
    role: 'root'
  };

  beforeEach(() => {
    mockUseAdmin.mockReturnValue({
      state: {
        currentUser: mockCurrentUser,
        isAdmin: true,
        permissions: ['read', 'write', 'admin', 'root']
      },
      actions: {
        setCurrentUser: jest.fn(),
        // Add other actions as needed
      }
    } as any);

    mockUseSimpleChatState.mockReturnValue({
      state: {
        currentUser: mockCurrentUser,
        channels: mockChannels,
        messages: mockMessages,
        users: [],
        selectedChannel: 'general',
        isConnected: true,
        isLoading: false,
        error: null,
        isSidebarOpen: true,
        isAtBottom: true,
        hasNewMessages: false,
        newMessage: '',
        isUploading: false,
        uploadedImages: [],
        showGifPicker: false,
        showReactionPicker: null,
        expandedDens: new Set(['pack', 'general'])
      },
      actions: {
        setSelectedChannel: jest.fn(),
        setNewMessage: jest.fn(),
        toggleExpandedDen: jest.fn(),
        // Add other actions as needed
      }
    } as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Channel Display', () => {
    it('should display all pack channels without duplicates', () => {
      render(<ChatPageSimple />);
      
      // Check that pack channels are displayed
      expect(screen.getByText('General')).toBeInTheDocument();
      expect(screen.getByText('Announcements')).toBeInTheDocument();
      expect(screen.getByText('Events')).toBeInTheDocument();
      
      // Check that each channel appears only once
      const generalChannels = screen.getAllByText('General');
      expect(generalChannels).toHaveLength(1);
      
      const announcementChannels = screen.getAllByText('Announcements');
      expect(announcementChannels).toHaveLength(1);
      
      const eventChannels = screen.getAllByText('Events');
      expect(eventChannels).toHaveLength(1);
    });

    it('should display den channels organized by den type', () => {
      render(<ChatPageSimple />);
      
      // Check that den channels are displayed
      expect(screen.getByText('Lion Den')).toBeInTheDocument();
      expect(screen.getByText('Tiger Den')).toBeInTheDocument();
      expect(screen.getByText('Wolf Den')).toBeInTheDocument();
    });

    it('should show message counts for each channel', () => {
      render(<ChatPageSimple />);
      
      // Check message counts
      expect(screen.getByText('5')).toBeInTheDocument(); // General
      expect(screen.getByText('2')).toBeInTheDocument(); // Announcements
      expect(screen.getByText('1')).toBeInTheDocument(); // Events
      expect(screen.getByText('3')).toBeInTheDocument(); // Tiger Den
    });

    it('should allow channel selection', () => {
      const mockSetSelectedChannel = jest.fn();
      mockUseSimpleChatState.mockReturnValue({
        state: {
          ...mockUseSimpleChatState().state,
          selectedChannel: 'general'
        },
        actions: {
          ...mockUseSimpleChatState().actions,
          setSelectedChannel: mockSetSelectedChannel
        }
      } as any);

      render(<ChatPageSimple />);
      
      // Click on a channel
      const eventsChannel = screen.getByText('Events');
      fireEvent.click(eventsChannel);
      
      expect(mockSetSelectedChannel).toHaveBeenCalledWith('events');
    });
  });

  describe('Scrolling and Layout', () => {
    it('should have proper scrolling container for channels', () => {
      render(<ChatPageSimple />);
      
      // Check that the channel list has proper scrolling classes
      const channelList = screen.getByText('Channels').closest('div');
      expect(channelList).toHaveClass('h-full', 'flex', 'flex-col');
      
      // Check for scrollable area
      const scrollableArea = channelList?.querySelector('.overflow-y-auto');
      expect(scrollableArea).toBeInTheDocument();
    });

    it('should display messages in the selected channel', () => {
      render(<ChatPageSimple />);
      
      // Check that messages are displayed
      expect(screen.getByText('Hello everyone!')).toBeInTheDocument();
      expect(screen.getByText('Christopher Smith')).toBeInTheDocument();
    });

    it('should show current channel in header', () => {
      mockUseSimpleChatState.mockReturnValue({
        state: {
          ...mockUseSimpleChatState().state,
          selectedChannel: 'events'
        },
        actions: mockUseSimpleChatState().actions
      } as any);

      render(<ChatPageSimple />);
      
      // Check that the current channel is shown in header
      expect(screen.getByText('# Events')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle empty channels gracefully', () => {
      mockUseSimpleChatState.mockReturnValue({
        state: {
          ...mockUseSimpleChatState().state,
          channels: []
        },
        actions: mockUseSimpleChatState().actions
      } as any);

      render(<ChatPageSimple />);
      
      // Should not crash and should show empty state
      expect(screen.getByText('Channels')).toBeInTheDocument();
    });

    it('should handle null channels gracefully', () => {
      mockUseSimpleChatState.mockReturnValue({
        state: {
          ...mockUseSimpleChatState().state,
          channels: null as any
        },
        actions: mockUseSimpleChatState().actions
      } as any);

      render(<ChatPageSimple />);
      
      // Should not crash
      expect(screen.getByText('Channels')).toBeInTheDocument();
    });
  });
});
