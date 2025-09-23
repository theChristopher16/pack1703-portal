import { renderHook, act } from '@testing-library/react';
import { useChatState } from '../useOptimizedState';
import { ChatMessage, ChatChannel, ChatUser } from '../../services/chatService';
import { UserRole } from '../../services/authService';

describe('useChatState', () => {
  describe('State Management', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => useChatState());

      expect(result.current.state.messages).toEqual([]);
      expect(result.current.state.users).toEqual([]);
      expect(result.current.state.channels).toEqual([]);
      expect(result.current.state.selectedChannel).toBe('general');
      expect(result.current.state.newMessage).toBe('');
      expect(result.current.state.isConnected).toBe(false);
      expect(result.current.state.isLoading).toBe(true);
      expect(result.current.state.isAuthenticated).toBe(false);
      expect(result.current.state.userRole).toBe(UserRole.PARENT);
      expect(result.current.state.authLoading).toBe(true);
    });

    it('should handle setting messages', () => {
      const { result } = renderHook(() => useChatState());

      const messages: ChatMessage[] = [
        {
          id: 'msg1',
          message: 'Hello world',
          userId: 'user1',
          userName: 'Test User',
          channelId: 'general',
          timestamp: new Date(),
          isSystem: false,
          isAdmin: false,
          reactions: []
        }
      ];

      act(() => {
        result.current.actions.setMessages(messages);
      });

      expect(result.current.state.messages).toEqual(messages);
      expect(result.current.selectors.filteredMessages).toEqual(messages);
    });

    it('should handle adding messages', () => {
      const { result } = renderHook(() => useChatState());

      const message: ChatMessage = {
        id: 'msg1',
        message: 'Hello world',
        userId: 'user1',
        userName: 'Test User',
        channelId: 'general',
        timestamp: new Date(),
        isSystem: false,
        isAdmin: false,
        reactions: []
      };

      act(() => {
        result.current.actions.addMessage(message);
      });

      expect(result.current.state.messages).toContain(message);
      expect(result.current.selectors.filteredMessages).toContain(message);
    });

    it('should handle setting channels', () => {
      const { result } = renderHook(() => useChatState());

      const channels: ChatChannel[] = [
        {
          id: 'general',
          name: 'General',
          description: 'General chat',
          isActive: true,
          messageCount: 0,
          lastActivity: new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      act(() => {
        result.current.actions.setChannels(channels);
      });

      expect(result.current.state.channels).toEqual(channels);
      expect(result.current.selectors.currentChannel).toEqual(channels[0]);
    });

    it('should handle setting users', () => {
      const { result } = renderHook(() => useChatState());

      const users: ChatUser[] = [
        {
          id: 'user1',
          name: 'Test User',
          isOnline: true,
          lastSeen: new Date(),
          isAdmin: false,
          sessionId: 'session1',
          userAgent: 'test-agent'
        }
      ];

      act(() => {
        result.current.actions.setUsers(users);
      });

      expect(result.current.state.users).toEqual(users);
      expect(result.current.selectors.onlineUsersCount).toBe(1);
    });

    it('should handle setting selected channel', () => {
      const { result } = renderHook(() => useChatState());

      act(() => {
        result.current.actions.setSelectedChannel('announcements');
      });

      expect(result.current.state.selectedChannel).toBe('announcements');
    });

    it('should handle setting new message', () => {
      const { result } = renderHook(() => useChatState());

      act(() => {
        result.current.actions.setNewMessage('Hello world');
      });

      expect(result.current.state.newMessage).toBe('Hello world');
    });

    it('should handle connection status', () => {
      const { result } = renderHook(() => useChatState());

      act(() => {
        result.current.actions.setConnected(true);
      });

      expect(result.current.state.isConnected).toBe(true);
    });

    it('should handle den expansion', () => {
      const { result } = renderHook(() => useChatState());

      act(() => {
        result.current.actions.toggleDenExpansion('pack');
      });

      expect(result.current.state.expandedDens.has('pack')).toBe(true);

      act(() => {
        result.current.actions.toggleDenExpansion('pack');
      });

      expect(result.current.state.expandedDens.has('pack')).toBe(false);
    });

    it('should handle setting current user', () => {
      const { result } = renderHook(() => useChatState());

      const user: ChatUser = {
        id: 'user1',
        name: 'Test User',
        isOnline: true,
        lastSeen: new Date(),
        isAdmin: false,
        sessionId: 'session1',
        userAgent: 'test-agent'
      };

      act(() => {
        result.current.actions.setCurrentUser(user);
      });

      expect(result.current.state.currentUser).toEqual(user);
    });

    it('should handle loading states', () => {
      const { result } = renderHook(() => useChatState());

      act(() => {
        result.current.actions.setLoading(true);
      });

      expect(result.current.state.isLoading).toBe(true);

      act(() => {
        result.current.actions.setLoading(false);
      });

      expect(result.current.state.isLoading).toBe(false);
    });

    it('should handle authentication states', () => {
      const { result } = renderHook(() => useChatState());

      act(() => {
        result.current.actions.setAuthenticated(true);
        result.current.actions.setUserRole(UserRole.ADMIN);
      });

      expect(result.current.state.isAuthenticated).toBe(true);
      expect(result.current.state.userRole).toBe(UserRole.ADMIN);
    });

    it('should handle rich text state', () => {
      const { result } = renderHook(() => useChatState());

      act(() => {
        result.current.actions.updateRichTextState({ isBold: true });
      });

      expect(result.current.state.richTextState.isBold).toBe(true);
    });

    it('should handle UI state toggles', () => {
      const { result } = renderHook(() => useChatState());

      act(() => {
        result.current.actions.setShowRichToolbar(true);
        result.current.actions.setShowGifPicker(true);
      });

      expect(result.current.state.showRichToolbar).toBe(true);
      expect(result.current.state.showGifPicker).toBe(true);
    });

    it('should handle file uploads', () => {
      const { result } = renderHook(() => useChatState());

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

      act(() => {
        result.current.actions.setUploadedImages([file]);
      });

      expect(result.current.state.uploadedImages).toEqual([file]);
    });
  });

  describe('Selectors', () => {
    it('should filter messages based on search query', () => {
      const { result } = renderHook(() => useChatState());

      const messages: ChatMessage[] = [
        {
          id: 'msg1',
          message: 'Hello world',
          userId: 'user1',
          userName: 'Test User',
          channelId: 'general',
          timestamp: new Date(),
          isSystem: false,
          isAdmin: false,
          reactions: []
        },
        {
          id: 'msg2',
          message: 'Goodbye world',
          userId: 'user2',
          userName: 'Another User',
          channelId: 'general',
          timestamp: new Date(),
          isSystem: false,
          isAdmin: false,
          reactions: []
        }
      ];

      act(() => {
        result.current.actions.setMessages(messages);
        result.current.actions.setSearchQuery('hello');
      });

      expect(result.current.selectors.filteredMessages).toEqual([messages[0]]);
    });

    it('should return current channel', () => {
      const { result } = renderHook(() => useChatState());

      const channels: ChatChannel[] = [
        {
          id: 'general',
          name: 'General',
          description: 'General chat',
          isActive: true,
          messageCount: 0,
          lastActivity: new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'announcements',
          name: 'Announcements',
          description: 'Important announcements',
          isActive: true,
          messageCount: 0,
          lastActivity: new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      act(() => {
        result.current.actions.setChannels(channels);
        result.current.actions.setSelectedChannel('announcements');
      });

      expect(result.current.selectors.currentChannel).toEqual(channels[1]);
    });

    it('should calculate online users count', () => {
      const { result } = renderHook(() => useChatState());

      const users: ChatUser[] = [
        {
          id: 'user1',
          name: 'User 1',
          isOnline: true,
          lastSeen: new Date(),
          isAdmin: false,
          sessionId: 'session1',
          userAgent: 'test-agent'
        },
        {
          id: 'user2',
          name: 'User 2',
          isOnline: false,
          lastSeen: new Date(),
          isAdmin: false,
          sessionId: 'session2',
          userAgent: 'test-agent'
        },
        {
          id: 'user3',
          name: 'User 3',
          isOnline: true,
          lastSeen: new Date(),
          isAdmin: false,
          sessionId: 'session3',
          userAgent: 'test-agent'
        }
      ];

      act(() => {
        result.current.actions.setUsers(users);
      });

      expect(result.current.selectors.onlineUsersCount).toBe(2);
    });

    it('should determine if user can send messages', () => {
      const { result } = renderHook(() => useChatState());

      act(() => {
        result.current.actions.setAuthenticated(true);
        result.current.actions.setConnected(true);
        result.current.actions.setCurrentUser({
          id: 'user1',
          name: 'Test User',
          isOnline: true,
          lastSeen: new Date(),
          isAdmin: false,
          sessionId: 'session1',
          userAgent: 'test-agent'
        });
      });

      expect(result.current.selectors.canSendMessage).toBe(true);
    });

    it('should detect active formatting', () => {
      const { result } = renderHook(() => useChatState());

      act(() => {
        result.current.actions.updateRichTextState({ isBold: true, isItalic: true });
      });

      expect(result.current.selectors.hasActiveFormatting).toBe(true);

      act(() => {
        result.current.actions.updateRichTextState({ isBold: false, isItalic: false });
      });

      expect(result.current.selectors.hasActiveFormatting).toBe(false);
    });
  });

  describe('State Reset', () => {
    it('should reset state to initial values', () => {
      const { result } = renderHook(() => useChatState());

      act(() => {
        result.current.actions.setMessages([{ id: 'msg1', message: 'test', userId: 'user1', userName: 'Test', channelId: 'general', timestamp: new Date(), isSystem: false, isAdmin: false, reactions: [] }]);
        result.current.actions.setChannels([{ id: 'general', name: 'General', description: 'General chat', isActive: true, messageCount: 0, lastActivity: new Date(), createdAt: new Date(), updatedAt: new Date() }]);
        result.current.actions.setCurrentUser({ id: 'user1', name: 'Test User', isOnline: true, lastSeen: new Date(), isAdmin: false, sessionId: 'session1', userAgent: 'test-agent' });
        result.current.actions.setAuthenticated(true);
        result.current.actions.setConnected(true);
      });

      act(() => {
        result.current.actions.resetChatState();
      });

      expect(result.current.state.messages).toEqual([]);
      expect(result.current.state.channels).toEqual([]);
      expect(result.current.state.currentUser).toBeNull();
      expect(result.current.state.isAuthenticated).toBe(false);
      expect(result.current.state.isConnected).toBe(false);
    });
  });

  describe('Performance', () => {
    it('should handle large datasets efficiently', () => {
      const { result } = renderHook(() => useChatState());

      const largeMessageList = Array.from({ length: 1000 }, (_, i) => ({
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

      const startTime = performance.now();

      act(() => {
        result.current.actions.setMessages(largeMessageList);
      });

      const endTime = performance.now();

      // Should complete in reasonable time (less than 100ms)
      expect(endTime - startTime).toBeLessThan(100);
      expect(result.current.selectors.filteredMessages.length).toBe(1000);
    });

    it('should memoize selectors correctly', () => {
      const { result } = renderHook(() => useChatState());

      const initialSelectors = result.current.selectors;

      act(() => {
        result.current.actions.setNewMessage('test');
      });

      // Selectors should be the same object reference when no relevant state changes
      expect(result.current.selectors).toBe(initialSelectors);
    });
  });
});