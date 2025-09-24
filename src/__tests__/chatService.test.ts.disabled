import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import chatService from '../services/chatService';
import { ChatChannel } from '../services/chatService';

// Mock Firebase - define mocks first
const mockCollection = jest.fn();
const mockQuery = jest.fn();
const mockWhere = jest.fn();
const mockOrderBy = jest.fn();
const mockGetDocs = jest.fn();
const mockAddDoc = jest.fn();
const mockServerTimestamp = jest.fn(() => new Date());

jest.mock('firebase/firestore', () => ({
  collection: mockCollection,
  query: mockQuery,
  where: mockWhere,
  orderBy: mockOrderBy,
  getDocs: mockGetDocs,
  addDoc: mockAddDoc,
  serverTimestamp: mockServerTimestamp,
}));

// Mock Firebase config
jest.mock('../firebase/config', () => ({
  db: {},
}));

describe('ChatService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear cache before each test
    (chatService as any).channelsCache = null;
    (chatService as any).channelsCacheTime = 0;
  });

  describe('getDefaultChannels', () => {
    it('should return unique default channels', () => {
      const defaultChannels = (chatService as any).getDefaultChannels();
      
      // Check that all channels have unique IDs
      const channelIds = defaultChannels.map((channel: ChatChannel) => channel.id);
      const uniqueIds = new Set(channelIds);
      expect(uniqueIds.size).toBe(channelIds.length);
      
      // Check that we have the expected channels
      expect(defaultChannels).toHaveLength(8); // 3 pack channels + 5 den channels
      
      // Check pack channels
      const packChannels = defaultChannels.filter((channel: ChatChannel) => !channel.isDenChannel);
      expect(packChannels).toHaveLength(3);
      expect(packChannels.map((c: ChatChannel) => c.id)).toEqual(['general', 'announcements', 'events']);
      
      // Check den channels
      const denChannels = defaultChannels.filter((channel: ChatChannel) => channel.isDenChannel);
      expect(denChannels).toHaveLength(5);
      expect(denChannels.map((c: ChatChannel) => c.id)).toEqual([
        'lion-den', 'tiger-den', 'wolf-den', 'webelos-den', 'arrow-of-light-den'
      ]);
    });

    it('should have correct channel properties', () => {
      const defaultChannels = (chatService as any).getDefaultChannels();
      
      defaultChannels.forEach((channel: ChatChannel) => {
        expect(channel).toHaveProperty('id');
        expect(channel).toHaveProperty('name');
        expect(channel).toHaveProperty('description');
        expect(channel).toHaveProperty('isActive', true);
        expect(channel).toHaveProperty('messageCount', 0);
        expect(channel).toHaveProperty('isDenChannel');
        expect(channel).toHaveProperty('createdAt');
        expect(channel).toHaveProperty('updatedAt');
        expect(channel).toHaveProperty('lastActivity');
        
        if (channel.isDenChannel) {
          expect(channel).toHaveProperty('denType');
          expect(channel).toHaveProperty('denLevel');
        }
      });
    });
  });

  describe('getChannels', () => {
    it('should remove duplicate channels', async () => {
      const mockChannels = [
        { id: 'general', name: 'General', isDenChannel: false },
        { id: 'general', name: 'General', isDenChannel: false }, // Duplicate
        { id: 'announcements', name: 'Announcements', isDenChannel: false },
        { id: 'events', name: 'Events', isDenChannel: false },
      ];

      mockGetDocs.mockResolvedValue({
        docs: mockChannels.map((channel, index) => ({
          id: channel.id,
          data: () => channel
        }))
      });

      const channels = await chatService.getChannels();
      
      // Should remove duplicates
      expect(channels).toHaveLength(3);
      expect(channels.map(c => c.id)).toEqual(['general', 'announcements', 'events']);
    });

    it('should return cached channels when cache is valid', async () => {
      const cachedChannels = [
        { id: 'general', name: 'General', isDenChannel: false },
        { id: 'announcements', name: 'Announcements', isDenChannel: false },
      ];

      // Set cache
      (chatService as any).channelsCache = cachedChannels;
      (chatService as any).channelsCacheTime = Date.now();

      const channels = await chatService.getChannels();
      
      expect(channels).toEqual(cachedChannels);
      expect(channels).toHaveLength(2);
    });

    it('should create default channels when no channels exist', async () => {
      mockGetDocs.mockResolvedValue({
        docs: [] // No channels
      });

      const channels = await chatService.getChannels();
      
      // Should return default channels
      expect(channels).toHaveLength(8);
      expect(channels.map(c => c.id)).toEqual([
        'general', 'announcements', 'events',
        'lion-den', 'tiger-den', 'wolf-den', 'webelos-den', 'arrow-of-light-den'
      ]);
    });
  });

  describe('channel organization', () => {
    it('should properly separate pack and den channels', () => {
      const defaultChannels = (chatService as any).getDefaultChannels();
      
      const packChannels = defaultChannels.filter((channel: ChatChannel) => !channel.isDenChannel);
      const denChannels = defaultChannels.filter((channel: ChatChannel) => channel.isDenChannel);
      
      expect(packChannels.every((c: ChatChannel) => c.denType === 'pack')).toBe(true);
      expect(denChannels.every((c: ChatChannel) => c.isDenChannel === true)).toBe(true);
    });

    it('should have correct den types for den channels', () => {
      const defaultChannels = (chatService as any).getDefaultChannels();
      const denChannels = defaultChannels.filter((channel: ChatChannel) => channel.isDenChannel);
      
      const expectedDenTypes = ['lion', 'tiger', 'wolf', 'webelos', 'arrow-of-light'];
      const actualDenTypes = denChannels.map((c: ChatChannel) => c.denType);
      
      expect(actualDenTypes.sort()).toEqual(expectedDenTypes.sort());
    });
  });
});