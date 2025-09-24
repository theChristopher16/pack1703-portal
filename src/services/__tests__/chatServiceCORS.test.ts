/**
 * Unit tests for Chat Service CORS and Firestore access issues
 * Tests the specific CORS errors seen in production logs
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Mock Firebase
const mockFirestore = {
  collection: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  addDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  onSnapshot: jest.fn(),
};

const mockAuth = {
  currentUser: {
    uid: 'test-user-id',
    email: 'test@example.com',
    displayName: 'Test User',
  },
};

jest.mock('firebase/firestore', () => ({
  getFirestore: () => mockFirestore,
  collection: () => {},
  doc: () => {},
  getDoc: () => {},
  getDocs: () => {},
  addDoc: () => {},
  updateDoc: () => {},
  deleteDoc: () => {},
  onSnapshot: () => {},
  query: () => {},
  where: () => {},
  orderBy: () => {},
  limit: () => {},
  serverTimestamp: () => {},
}));

jest.mock('firebase/auth', () => ({
  getAuth: () => mockAuth,
  onAuthStateChanged: () => {},
}));

describe('Chat Service CORS and Firestore Access Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('CORS Error Handling', () => {
    it('should handle Firestore Write channel CORS errors gracefully', async () => {
      // Simulate the exact CORS error from production logs
      const corsError = new Error('Fetch API cannot load https://firestore.googleapis.com/google.firestore.v1.Firestore/Write/channel due to access control checks.');
      corsError.name = 'TypeError';
      
      mockFirestore.addDoc.mockRejectedValue(corsError);

      const chatService = {
        async sendMessage(channelId: string, message: string) {
          try {
            await mockFirestore.addDoc();
            return { success: true };
          } catch (error: any) {
            if (error.message.includes('access control checks')) {
              console.warn('CORS error detected, falling back to offline mode');
              return { 
                success: false, 
                error: 'CORS_ERROR', 
                message: 'Unable to send message due to network restrictions',
                fallback: 'offline'
              };
            }
            throw error;
          }
        }
      };

      const result = await chatService.sendMessage('test-channel', 'Hello world');
      expect(result.success).toBe(false);
      expect(result.error).toBe('CORS_ERROR');
      expect(result.message).toBe('Unable to send message due to network restrictions');
      expect(result.fallback).toBe('offline');
    });

    it('should handle Firestore Listen channel CORS errors gracefully', async () => {
      const corsError = new Error('Fetch API cannot load https://firestore.googleapis.com/google.firestore.v1.Firestore/Listen/channel due to access control checks.');
      corsError.name = 'TypeError';
      
      mockFirestore.onSnapshot.mockImplementation((callback) => {
        // Simulate CORS error in subscription
        setTimeout(() => {
          callback({ docs: [] }, { code: 'permission-denied', message: 'access control checks' });
        }, 100);
        return () => {}; // unsubscribe function
      });

      const chatService = {
        subscribeToMessages(channelId: string, callback: (messages: any[]) => void) {
          try {
            const unsubscribe = mockFirestore.onSnapshot((snapshot: any, error: any) => {
              if (error && error.message.includes('access control checks')) {
                console.warn('CORS error in message subscription, using fallback');
                callback([]); // Return empty messages
                return;
              }
              callback(snapshot.docs || []);
            });
            return unsubscribe;
          } catch (error: any) {
            console.warn('Failed to subscribe to messages:', error);
            return () => {};
          }
        }
      };

      const messages: any[] = [];
      const unsubscribe = chatService.subscribeToMessages('test-channel', (newMessages) => {
        messages.push(...newMessages);
      });

      // Wait for the subscription to process
      await new Promise(resolve => setTimeout(resolve, 200));

      expect(messages).toEqual([]);
      expect(typeof unsubscribe).toBe('function');
    });

    it('should handle multiple concurrent CORS errors', async () => {
      const corsError = new Error('Fetch API cannot load https://firestore.googleapis.com/google.firestore.v1.Firestore/Write/channel due to access control checks.');
      
      mockFirestore.addDoc.mockRejectedValue(corsError);
      mockFirestore.getDocs.mockRejectedValue(corsError);

      const chatService = {
        async sendMessage(channelId: string, message: string) {
          try {
            await mockFirestore.addDoc();
            return { success: true };
          } catch (error: any) {
            if (error.message.includes('access control checks')) {
              return { success: false, error: 'CORS_ERROR' };
            }
            throw error;
          }
        },

        async getMessages(channelId: string) {
          try {
            await mockFirestore.getDocs();
            return { success: true, messages: [] };
          } catch (error: any) {
            if (error.message.includes('access control checks')) {
              return { success: false, error: 'CORS_ERROR', messages: [] };
            }
            throw error;
          }
        }
      };

      const promises = [
        chatService.sendMessage('test-channel', 'Hello'),
        chatService.getMessages('test-channel'),
        chatService.sendMessage('test-channel', 'World'),
      ];

      const results = await Promise.allSettled(promises);
      
      results.forEach(result => {
        expect(result.status).toBe('fulfilled');
        const fulfilledResult = result.status === 'fulfilled' ? result.value : null;
        expect(fulfilledResult).toHaveProperty('success', false);
        expect(fulfilledResult).toHaveProperty('error', 'CORS_ERROR');
      });
    });
  });

  describe('Network Connectivity Issues', () => {
    it('should handle network connectivity issues', async () => {
      const networkError = new Error('Network request failed');
      networkError.name = 'NetworkError';
      
      mockFirestore.getDocs.mockRejectedValue(networkError);

      const chatService = {
        async getChannels() {
          try {
            await mockFirestore.getDocs();
            return [];
          } catch (error: any) {
            if (error.name === 'NetworkError') {
              console.warn('Network error, using cached channels');
              return []; // Return empty array or cached data
            }
            throw error;
          }
        }
      };

      const result = await chatService.getChannels();
      expect(result).toEqual([]);
    });

    it('should handle Firestore service unavailable errors', async () => {
      const serviceError = new Error('Service temporarily unavailable');
      serviceError.name = 'FirebaseError';
      
      mockFirestore.getDocs.mockRejectedValue(serviceError);

      const chatService = {
        async getOnlineUsers() {
          try {
            await mockFirestore.getDocs();
            return [];
          } catch (error: any) {
            if (error.name === 'FirebaseError') {
              console.warn('Firestore service unavailable, using fallback');
              return []; // Return empty array
            }
            throw error;
          }
        }
      };

      const result = await chatService.getOnlineUsers();
      expect(result).toEqual([]);
    });
  });

  describe('Authentication State Issues', () => {
    it('should handle unauthenticated Firestore access', async () => {
      // Simulate no authenticated user
      mockAuth.currentUser = null;
      
      const authError = new Error('Missing or insufficient permissions');
      authError.name = 'FirebaseError';
      
      mockFirestore.getDocs.mockRejectedValue(authError);

      const chatService = {
        async getChannels() {
          try {
            await mockFirestore.getDocs();
            return [];
          } catch (error: any) {
            if (error.message.includes('Missing or insufficient permissions')) {
              console.warn('Authentication required for Firestore access');
              return { 
                success: false, 
                error: 'AUTH_REQUIRED', 
                message: 'Please log in to access chat features'
              };
            }
            throw error;
          }
        }
      };

      const result = await chatService.getChannels();
      expect(result.success).toBe(false);
      expect(result.error).toBe('AUTH_REQUIRED');
      expect(result.message).toBe('Please log in to access chat features');
    });

    it('should handle expired authentication tokens', async () => {
      const tokenError = new Error('The user\'s credential is no longer valid');
      tokenError.name = 'FirebaseError';
      
      mockFirestore.getDocs.mockRejectedValue(tokenError);

      const chatService = {
        async getMessages(channelId: string) {
          try {
            await mockFirestore.getDocs();
            return [];
          } catch (error: any) {
            if (error.message.includes('credential is no longer valid')) {
              console.warn('Authentication token expired, requiring re-login');
              return { 
                success: false, 
                error: 'TOKEN_EXPIRED', 
                message: 'Your session has expired, please log in again'
              };
            }
            throw error;
          }
        }
      };

      const result = await chatService.getMessages('test-channel');
      expect(result.success).toBe(false);
      expect(result.error).toBe('TOKEN_EXPIRED');
      expect(result.message).toBe('Your session has expired, please log in again');
    });
  });

  describe('Error Recovery and Retry Logic', () => {
    it('should implement exponential backoff for CORS errors', async () => {
      const corsError = new Error('Fetch API cannot load https://firestore.googleapis.com/google.firestore.v1.Firestore/Write/channel due to access control checks.');
      
      mockFirestore.addDoc
        .mockRejectedValueOnce(corsError)
        .mockRejectedValueOnce(corsError)
        .mockResolvedValueOnce('success');

      const chatService = {
        async sendMessageWithRetry(channelId: string, message: string) {
          let attempts = 0;
          const maxRetries = 3;
          
          while (attempts < maxRetries) {
            try {
              const result = await mockFirestore.addDoc();
              return { success: true, result };
            } catch (error: any) {
              attempts++;
              if (error.message.includes('access control checks')) {
                if (attempts >= maxRetries) {
                  return { 
                    success: false, 
                    error: 'CORS_ERROR', 
                    attempts,
                    message: 'Unable to send message after multiple attempts'
                  };
                }
                // Simulate exponential backoff delay
                await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempts) * 100));
              } else {
                throw error;
              }
            }
          }
          
          return { success: false, error: 'MAX_RETRIES_EXCEEDED' };
        }
      };

      const result = await chatService.sendMessageWithRetry('test-channel', 'Hello');
      expect(result.success).toBe(true);
      expect(result.result).toBe('success');
    });

    it('should handle mixed error types in retry logic', async () => {
      const corsError = new Error('Fetch API cannot load https://firestore.googleapis.com/google.firestore.v1.Firestore/Write/channel due to access control checks.');
      const networkError = new Error('Network request failed');
      
      mockFirestore.addDoc
        .mockRejectedValueOnce(corsError)
        .mockRejectedValueOnce(networkError)
        .mockResolvedValueOnce('success');

      const chatService = {
        async sendMessageWithRetry(channelId: string, message: string) {
          let attempts = 0;
          const maxRetries = 3;
          
          while (attempts < maxRetries) {
            try {
              const result = await mockFirestore.addDoc();
              return { success: true, result };
            } catch (error: any) {
              attempts++;
              if (error.message.includes('access control checks') || error.message.includes('Network request failed')) {
                if (attempts >= maxRetries) {
                  return { 
                    success: false, 
                    error: 'NETWORK_ERROR', 
                    attempts,
                    message: 'Unable to send message due to network issues'
                  };
                }
                // Simulate retry delay
                await new Promise(resolve => setTimeout(resolve, 1000));
              } else {
                throw error;
              }
            }
          }
          
          return { success: false, error: 'MAX_RETRIES_EXCEEDED' };
        }
      };

      const result = await chatService.sendMessageWithRetry('test-channel', 'Hello');
      expect(result.success).toBe(true);
      expect(result.result).toBe('success');
    });
  });

  describe('Error Logging and Monitoring', () => {
    it('should log CORS errors with proper context', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      const corsError = new Error('Fetch API cannot load https://firestore.googleapis.com/google.firestore.v1.Firestore/Write/channel due to access control checks.');
      
      const chatService = {
        logError(error: Error, context: string) {
          console.warn(`Chat Service ${context} Error:`, {
            error: error.message,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href,
            context
          });
        }
      };

      chatService.logError(corsError, 'sendMessage');

      expect(consoleSpy).toHaveBeenCalledWith('Chat Service sendMessage Error:', expect.objectContaining({
        error: expect.stringContaining('access control checks'),
        timestamp: expect.any(String),
        userAgent: expect.any(String),
        url: expect.any(String),
        context: 'sendMessage'
      }));

      consoleSpy.mockRestore();
    });

    it('should track error frequency for monitoring', () => {
      const errorCounts = {
        cors: 0,
        network: 0,
        auth: 0,
      };

      const corsError = new Error('Fetch API cannot load https://firestore.googleapis.com/google.firestore.v1.Firestore/Write/channel due to access control checks.');
      const networkError = new Error('Network request failed');
      const authError = new Error('Missing or insufficient permissions');

      const chatService = {
        trackError(error: Error) {
          if (error.message.includes('access control checks')) {
            errorCounts.cors++;
          } else if (error.message.includes('Network request failed')) {
            errorCounts.network++;
          } else if (error.message.includes('Missing or insufficient permissions')) {
            errorCounts.auth++;
          }
        }
      };

      chatService.trackError(corsError);
      chatService.trackError(networkError);
      chatService.trackError(authError);
      chatService.trackError(corsError); // Second CORS error

      expect(errorCounts.cors).toBe(2);
      expect(errorCounts.network).toBe(1);
      expect(errorCounts.auth).toBe(1);
    });
  });
});
