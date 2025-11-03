import { getMessaging, getToken, onMessage, Messaging } from 'firebase/messaging';
import { doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../firebase/config';

class PushNotificationService {
  private messaging: Messaging | null = null;
  private isSupported: boolean = false;

  constructor() {
    this.initializeMessaging();
  }

  /**
   * Initialize Firebase Cloud Messaging
   */
  private async initializeMessaging(): Promise<void> {
    try {
      // Check if messaging is supported
      if ('Notification' in window && 'serviceWorker' in navigator) {
        this.isSupported = true;
        // Messaging will be initialized when needed
      } else {
        console.log('📱 Push notifications not supported in this browser');
      }
    } catch (error) {
      console.error('Error initializing push notifications:', error);
    }
  }

  /**
   * Request notification permission from user
   */
  async requestPermission(): Promise<boolean> {
    try {
      if (!this.isSupported) {
        console.log('📱 Push notifications not supported');
        return false;
      }

      // Check current permission
      if (Notification.permission === 'granted') {
        console.log('✅ Notification permission already granted');
        return true;
      }

      if (Notification.permission === 'denied') {
        console.log('❌ Notification permission denied');
        return false;
      }

      // Request permission
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        console.log('✅ Notification permission granted');
        await this.registerFCMToken();
        return true;
      } else {
        console.log('❌ Notification permission denied by user');
        return false;
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  /**
   * Register FCM token for current user
   */
  async registerFCMToken(): Promise<string | null> {
    try {
      if (!this.isSupported || Notification.permission !== 'granted') {
        return null;
      }

      // Lazy initialize messaging
      if (!this.messaging) {
        const { getApp } = await import('firebase/app');
        this.messaging = getMessaging(getApp());
      }

      // Get FCM token
      const token = await getToken(this.messaging, {
        vapidKey: process.env.REACT_APP_FIREBASE_VAPID_KEY || 
                 'BPQ2nF1fKZGmI5x6x8vQ7HlX2yZ3h6k4J9pL7mN8sQ1wR2tY3uI4oP5aS6dF7gH8jK9lZ0xC1vB2nM3qW4eR5tY6'
      });

      if (token) {
        console.log('✅ FCM token obtained:', token.substring(0, 20) + '...');
        
        // Save token to user document
        const user = auth.currentUser;
        if (user) {
          await updateDoc(doc(db, 'users', user.uid), {
            fcmToken: token,
            fcmTokenUpdatedAt: new Date()
          });
          console.log('✅ FCM token saved to user profile');
        }

        return token;
      } else {
        console.log('❌ No FCM token available');
        return null;
      }
    } catch (error: any) {
      console.error('Error registering FCM token:', error);
      
      // Handle specific error cases
      if (error.code === 'messaging/permission-blocked') {
        console.log('❌ Notification permission blocked');
      } else if (error.code === 'messaging/token-unsubscribe-failed') {
        console.log('⚠️ Failed to unsubscribe from previous token');
      }
      
      return null;
    }
  }

  /**
   * Setup foreground message listener
   */
  setupMessageListener(onMessageReceived: (payload: any) => void): void {
    try {
      if (!this.messaging) {
        console.log('📱 Messaging not initialized');
        return;
      }

      onMessage(this.messaging, (payload) => {
        console.log('📬 Foreground message received:', payload);
        
        // Call custom handler
        onMessageReceived(payload);
        
        // Show notification if permission granted
        if (Notification.permission === 'granted') {
          this.showNotification(payload);
        }
      });

      console.log('✅ Foreground message listener setup complete');
    } catch (error) {
      console.error('Error setting up message listener:', error);
    }
  }

  /**
   * Show browser notification
   */
  private showNotification(payload: any): void {
    try {
      const notificationTitle = payload.notification?.title || 'Pack 1703 Portal';
      const notificationOptions: NotificationOptions = {
        body: payload.notification?.body || 'You have a new notification',
        icon: payload.notification?.icon || '/logo192.png',
        badge: '/logo192.png',
        tag: payload.data?.type || 'general',
        requireInteraction: payload.data?.priority === 'high',
        data: payload.data,
        actions: payload.data?.actionUrl ? [
          {
            action: 'view',
            title: 'View'
          },
          {
            action: 'dismiss',
            title: 'Dismiss'
          }
        ] : undefined
      };

      const notification = new Notification(notificationTitle, notificationOptions);

      // Handle notification click
      notification.onclick = () => {
        notification.close();
        if (payload.data?.actionUrl) {
          window.focus();
          window.location.href = payload.data.actionUrl;
        }
      };

      // Auto-close after 10 seconds for non-high priority
      if (payload.data?.priority !== 'high') {
        setTimeout(() => notification.close(), 10000);
      }
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  }

  /**
   * Check if notifications are enabled
   */
  isNotificationEnabled(): boolean {
    return this.isSupported && Notification.permission === 'granted';
  }

  /**
   * Get notification permission status
   */
  getPermissionStatus(): NotificationPermission {
    return Notification.permission;
  }

  /**
   * Unregister FCM token
   */
  async unregisterFCMToken(): Promise<void> {
    try {
      const user = auth.currentUser;
      if (user) {
        await updateDoc(doc(db, 'users', user.uid), {
          fcmToken: null,
          fcmTokenUpdatedAt: new Date()
        });
        console.log('✅ FCM token removed from user profile');
      }
    } catch (error) {
      console.error('Error unregistering FCM token:', error);
    }
  }
}

export const pushNotificationService = new PushNotificationService();
export default pushNotificationService;

