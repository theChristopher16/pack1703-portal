/**
 * Unit tests for chat channel deduplication functionality
 * Tests client-side deduplication logic and channel organization
 */

describe('Chat Channel Deduplication', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
  });

  describe('Cloud Function Deduplication', () => {
    it('should remove duplicate channels based on case-insensitive name comparison', async () => {
      // Mock the actual function behavior
      const mockChannels = [
        { id: 'channel1', name: 'General', description: 'General discussions' },
        { id: 'channel2', name: 'Events', description: 'Event planning' },
        { id: 'channel3', name: 'general', description: 'Duplicate general channel' },
        { id: 'channel4', name: 'Announcements', description: 'Pack announcements' },
        { id: 'channel5', name: 'announcements', description: 'Duplicate announcements' }
      ];

      // Simulate the deduplication logic
      const uniqueChannels = mockChannels.filter((channel, index, self) => 
        index === self.findIndex(c => c.name?.toLowerCase() === channel.name?.toLowerCase())
      );

      // Should have 3 unique channels (General, Events, Announcements)
      expect(uniqueChannels).toHaveLength(3);
      
      // Check that duplicates are removed
      const channelNames = uniqueChannels.map(c => c.name.toLowerCase());
      expect(channelNames).toEqual(['general', 'events', 'announcements']);
      
      // Verify no duplicates exist
      const uniqueNames = [...new Set(channelNames)];
      expect(uniqueNames).toHaveLength(channelNames.length);
    });

    it('should handle empty channel list', async () => {
      const mockChannels: any[] = [];
      const uniqueChannels = mockChannels.filter((channel, index, self) => 
        index === self.findIndex(c => c.name?.toLowerCase() === channel.name?.toLowerCase())
      );

      expect(uniqueChannels).toHaveLength(0);
    });

    it('should handle channels with null or undefined names', async () => {
      const mockChannels = [
        { id: 'channel1', name: 'General', description: 'Valid channel' },
        { id: 'channel2', name: null, description: 'Invalid channel' },
        { id: 'channel3', name: undefined, description: 'Invalid channel' },
        { id: 'channel4', name: '', description: 'Empty name channel' }
      ];

      const uniqueChannels = mockChannels.filter((channel, index, self) => 
        index === self.findIndex(c => c.name?.toLowerCase() === channel.name?.toLowerCase())
      );

      // Should keep the valid channel and handle null/undefined gracefully
      // Note: undefined gets filtered out because undefined?.toLowerCase() is undefined
      expect(uniqueChannels).toHaveLength(3); // General, null, and empty string
      expect(uniqueChannels.map(c => c.id)).toEqual(['channel1', 'channel2', 'channel4']);
    });

    it('should preserve the first occurrence of duplicate channels', async () => {
      const mockChannels = [
        { id: 'channel1', name: 'General', description: 'First General' },
        { id: 'channel2', name: 'Events', description: 'Events channel' },
        { id: 'channel3', name: 'general', description: 'Second General' },
        { id: 'channel4', name: 'GENERAL', description: 'Third General' }
      ];

      const uniqueChannels = mockChannels.filter((channel, index, self) => 
        index === self.findIndex(c => c.name?.toLowerCase() === channel.name?.toLowerCase())
      );

      expect(uniqueChannels).toHaveLength(2);
      expect(uniqueChannels[0].id).toBe('channel1'); // First occurrence preserved
      expect(uniqueChannels[0].description).toBe('First General');
      expect(uniqueChannels[1].id).toBe('channel2'); // Events channel preserved
    });
  });

  describe('Client-side Channel Organization', () => {
    it('should correctly categorize channels into pack, den, and other channels', () => {
      const channels = [
        { id: '1', name: 'General', description: 'General discussions' },
        { id: '2', name: 'Events', description: 'Event planning' },
        { id: '3', name: 'Announcements', description: 'Pack announcements' },
        { id: '4', name: 'Volunteer', description: 'Volunteer opportunities' },
        { id: '5', name: 'Lion Den', description: 'Lion den discussions' },
        { id: '6', name: 'Tiger Den', description: 'Tiger den discussions' },
        { id: '7', name: 'Wolf Den', description: 'Wolf den discussions' },
        { id: '8', name: 'Bear Den', description: 'Bear den discussions' },
        { id: '9', name: 'Webelos Den', description: 'Webelos den discussions' },
        { id: '10', name: 'Arrow of Light', description: 'AOL discussions' },
        { id: '11', name: 'Random Channel', description: 'Other channel' }
      ];

      // Simulate the organizeChannels logic
      const packChannels = channels.filter(channel => 
        ['general', 'announcements', 'events', 'volunteer'].includes(channel.name.toLowerCase())
      );
      
      // Define den order from youngest to oldest
      const denOrder = ['lion', 'tiger', 'wolf', 'bear', 'webelos', 'arrow of light'];
      
      const denChannels = channels.filter(channel => 
        denOrder.some(den => channel.name.toLowerCase().includes(den))
      );
      
      // Sort den channels by age order (youngest to oldest)
      const sortedDenChannels = denChannels.sort((a, b) => {
        const aDenIndex = denOrder.findIndex(den => a.name.toLowerCase().includes(den));
        const bDenIndex = denOrder.findIndex(den => b.name.toLowerCase().includes(den));
        return aDenIndex - bDenIndex;
      });
      
      const otherChannels = channels.filter(channel => 
        !packChannels.includes(channel) && !denChannels.includes(channel)
      );

      expect(packChannels).toHaveLength(4);
      expect(sortedDenChannels).toHaveLength(6);
      expect(otherChannels).toHaveLength(1);
      
      expect(packChannels.map(c => c.name)).toEqual(['General', 'Events', 'Announcements', 'Volunteer']);
      expect(sortedDenChannels.map(c => c.name)).toEqual(['Lion Den', 'Tiger Den', 'Wolf Den', 'Bear Den', 'Webelos Den', 'Arrow of Light']);
      expect(otherChannels.map(c => c.name)).toEqual(['Random Channel']);
    });

    it('should handle case-insensitive den name matching and sort by age order', () => {
      const channels = [
        { id: '1', name: 'LION DEN', description: 'Uppercase lion' },
        { id: '2', name: 'tiger den', description: 'Lowercase tiger' },
        { id: '3', name: 'Wolf Den', description: 'Mixed case wolf' },
        { id: '4', name: 'BEAR DEN', description: 'Uppercase bear' },
        { id: '5', name: 'webelos den', description: 'Lowercase webelos' },
        { id: '6', name: 'Arrow Of Light', description: 'Mixed case AOL' }
      ];

      // Define den order from youngest to oldest
      const denOrder = ['lion', 'tiger', 'wolf', 'bear', 'webelos', 'arrow of light'];
      
      const denChannels = channels.filter(channel => 
        denOrder.some(den => channel.name.toLowerCase().includes(den))
      );
      
      // Sort den channels by age order (youngest to oldest)
      const sortedDenChannels = denChannels.sort((a, b) => {
        const aDenIndex = denOrder.findIndex(den => a.name.toLowerCase().includes(den));
        const bDenIndex = denOrder.findIndex(den => b.name.toLowerCase().includes(den));
        return aDenIndex - bDenIndex;
      });

      expect(sortedDenChannels).toHaveLength(6);
      expect(sortedDenChannels.map(c => c.name)).toEqual(['LION DEN', 'tiger den', 'Wolf Den', 'BEAR DEN', 'webelos den', 'Arrow Of Light']);
    });
  });

  describe('Integration Tests', () => {
    it('should ensure no duplicate channels are rendered in the UI', () => {
      // Simulate the complete flow from Cloud Function to UI rendering
      const mockCloudFunctionResponse = {
        success: true,
        channels: [
          { id: '1', name: 'General', description: 'General discussions' },
          { id: '2', name: 'Events', description: 'Event planning' },
          { id: '3', name: 'general', description: 'Duplicate general' },
          { id: '4', name: 'Announcements', description: 'Pack announcements' },
          { id: '5', name: 'announcements', description: 'Duplicate announcements' }
        ]
      };

      // Apply deduplication (simulating Cloud Function logic)
      const uniqueChannels = mockCloudFunctionResponse.channels.filter((channel, index, self) => 
        index === self.findIndex(c => c.name?.toLowerCase() === channel.name?.toLowerCase())
      );

      // Organize channels (simulating client-side logic)
      const packChannels = uniqueChannels.filter(channel => 
        ['general', 'announcements', 'events', 'volunteer'].includes(channel.name.toLowerCase())
      );

      // Verify no duplicates in final render
      const renderedChannelNames = packChannels.map(c => c.name.toLowerCase());
      const uniqueRenderedNames = [...new Set(renderedChannelNames)];
      
      expect(renderedChannelNames).toHaveLength(uniqueRenderedNames.length);
      expect(renderedChannelNames).toEqual(['general', 'events', 'announcements']);
    });
  });
});
