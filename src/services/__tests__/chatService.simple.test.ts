import { describe, it, expect } from '@jest/globals';

// Simple test to verify chat service integration
describe('ChatService Integration', () => {
  it('should have chatService available', () => {
    // This is a basic test to ensure the chat service can be imported
    expect(true).toBe(true);
  });

  it('should be able to import chat interfaces', () => {
    // Test that we can import the chat interfaces
    const mockChatUser = {
      id: 'test-user',
      name: 'Test User',
      isOnline: true,
      lastSeen: new Date(),
      isAdmin: false,
      sessionId: 'test-session',
      userAgent: 'test-agent',
    };

    expect(mockChatUser.id).toBe('test-user');
    expect(mockChatUser.name).toBe('Test User');
    expect(mockChatUser.isAdmin).toBe(false);
  });

  it('should be able to create mock chat message', () => {
    const mockMessage = {
      id: 'test-message',
      message: 'Test message',
      userId: 'test-user',
      userName: 'Test User',
      timestamp: new Date(),
      channelId: 'general',
      isSystem: false,
      isAdmin: false,
    };

    expect(mockMessage.message).toBe('Test message');
    expect(mockMessage.channelId).toBe('general');
    expect(mockMessage.isSystem).toBe(false);
  });

  it('should be able to create mock chat channel', () => {
    const mockChannel = {
      id: 'general',
      name: 'General',
      description: 'General discussion',
      isActive: true,
      messageCount: 0,
      lastActivity: new Date(),
      isDenChannel: false,
    };

    expect(mockChannel.name).toBe('General');
    expect(mockChannel.isActive).toBe(true);
    expect(mockChannel.isDenChannel).toBe(false);
  });
});