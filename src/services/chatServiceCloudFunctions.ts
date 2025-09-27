import { getFunctions, httpsCallable } from 'firebase/functions';
import { functions } from '../firebase/config';

// Simplified chat service using Cloud Functions instead of direct Firestore access
class ChatServiceCloudFunctions {
  private functions = functions;

  // Get chat channels via Cloud Function
  async getChannels() {
    try {
      const getChatChannels = httpsCallable(this.functions, 'getChatChannels');
      const result = await getChatChannels({});
      
      if (result.data && (result.data as any).success) {
        return (result.data as any).channels || [];
      }
      
      throw new Error('Failed to get chat channels');
    } catch (error) {
      console.error('Error getting chat channels:', error);
      throw error;
    }
  }

  // Get chat messages via Cloud Function
  async getMessages(channelId: string, limit: number = 50) {
    try {
      const getChatMessages = httpsCallable(this.functions, 'getChatMessages');
      const result = await getChatMessages({ channelId, limit });
      
      if (result.data && (result.data as any).success) {
        return (result.data as any).messages || [];
      }
      
      throw new Error('Failed to get chat messages');
    } catch (error) {
      console.error('Error getting chat messages:', error);
      throw error;
    }
  }

  // Send chat message via Cloud Function
  async sendMessage(channelId: string, content: string, senderName: string) {
    try {
      const sendChatMessage = httpsCallable(this.functions, 'sendChatMessage');
      const result = await sendChatMessage({ channelId, content, senderName });
      
      if (result.data && (result.data as any).success) {
        return (result.data as any).message;
      }
      
      throw new Error('Failed to send chat message');
    } catch (error) {
      console.error('Error sending chat message:', error);
      throw error;
    }
  }
}

export const chatServiceCloudFunctions = new ChatServiceCloudFunctions();
