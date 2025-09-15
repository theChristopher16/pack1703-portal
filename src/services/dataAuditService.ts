import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { authService } from './authService';

// Types for data audit
export interface UserDataAudit {
  userId: string;
  userEmail: string;
  auditDate: string;
  dataCategories: {
    profile: UserProfileData;
    events: EventData[];
    volunteerSignups: VolunteerSignupData[];
    feedback: FeedbackData[];
    chatMessages: ChatMessageData[];
    rsvps: RSVPData[];
    analytics: AnalyticsData[];
    systemLogs: SystemLogData[];
  };
  dataSummary: {
    totalRecords: number;
    categoriesCount: {
      profile: number;
      events: number;
      volunteerSignups: number;
      feedback: number;
      chatMessages: number;
      rsvps: number;
      analytics: number;
      systemLogs: number;
    };
    dataRetention: {
      oldestRecord: string;
      newestRecord: string;
    };
  };
}

export interface UserProfileData {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  role: string;
  permissions: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  familyName?: string;
  phone?: string;
  address?: string;
  emergencyContact?: string;
  medicalInfo?: string;
  preferences?: any;
}

export interface EventData {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  attendees?: string[];
  volunteers?: string[];
}

export interface VolunteerSignupData {
  id: string;
  needId: string;
  eventId: string;
  eventTitle: string;
  role: string;
  volunteerName: string;
  volunteerEmail: string;
  volunteerPhone?: string;
  count: number;
  notes?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface FeedbackData {
  id: string;
  category: string;
  priority: string;
  title: string;
  message: string;
  familyName: string;
  email?: string;
  phone?: string;
  status: string;
  adminResponse?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessageData {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  channelId: string;
  timestamp: string;
  editedAt?: string;
  deletedAt?: string;
  reactions?: any[];
}

export interface RSVPData {
  id: string;
  eventId: string;
  eventTitle: string;
  familyName: string;
  email: string;
  phone?: string;
  attending: boolean;
  guestCount: number;
  dietaryRestrictions?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AnalyticsData {
  id: string;
  userId: string;
  event: string;
  properties: any;
  timestamp: string;
  sessionId?: string;
  userAgent?: string;
  ipHash?: string;
}

export interface SystemLogData {
  id: string;
  userId: string;
  action: string;
  resource: string;
  details: any;
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface PublicDataAudit {
  auditDate: string;
  publicDataTypes: {
    events: {
      count: number;
      description: string;
      dataFields: string[];
    };
    announcements: {
      count: number;
      description: string;
      dataFields: string[];
    };
    locations: {
      count: number;
      description: string;
      dataFields: string[];
    };
    volunteerNeeds: {
      count: number;
      description: string;
      dataFields: string[];
    };
  };
  dataRetention: {
    description: string;
    retentionPeriod: string;
  };
  privacyPolicy: {
    lastUpdated: string;
    url: string;
  };
}

class DataAuditService {
  private readonly COLLECTIONS = {
    users: 'users',
    events: 'events',
    volunteerSignups: 'volunteer-signups',
    feedback: 'feedback',
    chatMessages: 'chat-messages',
    rsvps: 'rsvps',
    analytics: 'analytics',
    systemLogs: 'system-logs',
    announcements: 'announcements',
    locations: 'locations',
    volunteerNeeds: 'volunteer-needs'
  };

  /**
   * Generate comprehensive data audit for a logged-in user
   */
  async generateUserDataAudit(): Promise<UserDataAudit> {
    try {
      const currentUser = authService.getCurrentUser();
      if (!currentUser) {
        throw new Error('User not found or not authenticated');
      }

      const auditDate = new Date().toISOString();
      
      // Collect data from all collections using authenticated user's ID
      const [
        profileData,
        eventsData,
        volunteerSignupsData,
        feedbackData,
        chatMessagesData,
        rsvpsData,
        analyticsData,
        systemLogsData
      ] = await Promise.all([
        this.getUserProfileData(currentUser.uid),
        this.getUserEventsData(currentUser.uid),
        this.getUserVolunteerSignupsData(currentUser.uid),
        this.getUserFeedbackData(currentUser.uid),
        this.getUserChatMessagesData(currentUser.uid),
        this.getUserRSVPsData(currentUser.uid),
        this.getUserAnalyticsData(currentUser.uid),
        this.getUserSystemLogsData(currentUser.uid)
      ]);

      // Calculate summary statistics
      const dataCategories = {
        profile: profileData,
        events: eventsData,
        volunteerSignups: volunteerSignupsData,
        feedback: feedbackData,
        chatMessages: chatMessagesData,
        rsvps: rsvpsData,
        analytics: analyticsData,
        systemLogs: systemLogsData
      };

      const totalRecords = Object.values(dataCategories).reduce((total, category) => {
        return total + (Array.isArray(category) ? category.length : 1);
      }, 0);

      const categoriesCount = {
        profile: 1,
        events: eventsData.length,
        volunteerSignups: volunteerSignupsData.length,
        feedback: feedbackData.length,
        chatMessages: chatMessagesData.length,
        rsvps: rsvpsData.length,
        analytics: analyticsData.length,
        systemLogs: systemLogsData.length
      };

      // Find oldest and newest records with proper date validation
      const allTimestamps = [
        ...eventsData.map(e => e.createdAt),
        ...volunteerSignupsData.map(v => v.createdAt),
        ...feedbackData.map(f => f.createdAt),
        ...chatMessagesData.map(c => c.timestamp),
        ...rsvpsData.map(r => r.createdAt),
        ...analyticsData.map(a => a.timestamp),
        ...systemLogsData.map(s => s.timestamp)
      ].filter(Boolean).filter(timestamp => {
        // Filter out invalid dates
        const date = new Date(timestamp);
        return !isNaN(date.getTime());
      }).sort();

      const formatTimestamp = (timestamp: any): string => {
        if (!timestamp) return 'N/A';
        
        try {
          const date = new Date(timestamp);
          if (isNaN(date.getTime())) return 'N/A';
          return date.toISOString();
        } catch (error) {
          console.warn('Invalid timestamp:', timestamp, error);
          return 'N/A';
        }
      };

      const dataRetention = {
        oldestRecord: allTimestamps[0] ? formatTimestamp(allTimestamps[0]) : 'N/A',
        newestRecord: allTimestamps[allTimestamps.length - 1] ? formatTimestamp(allTimestamps[allTimestamps.length - 1]) : 'N/A'
      };

      return {
        userId: currentUser.uid,
        userEmail: (currentUser as any).email || 'N/A',
        auditDate,
        dataCategories,
        dataSummary: {
          totalRecords,
          categoriesCount,
          dataRetention
        }
      };
    } catch (error) {
      console.error('Error generating user data audit:', error);
      throw error;
    }
  }

  /**
   * Generate public data audit for non-logged-in users
   */
  async generatePublicDataAudit(): Promise<PublicDataAudit> {
    try {
      const auditDate = new Date().toISOString();
      
      // Get counts of public data
      const [
        eventsCount,
        announcementsCount,
        locationsCount,
        volunteerNeedsCount
      ] = await Promise.all([
        this.getPublicDataCount('events'),
        this.getPublicDataCount('announcements'),
        this.getPublicDataCount('locations'),
        this.getPublicDataCount('volunteer-needs')
      ]);

      return {
        auditDate,
        publicDataTypes: {
          events: {
            count: eventsCount,
            description: 'Public event information including titles, dates, locations, and descriptions',
            dataFields: ['title', 'description', 'date', 'location', 'category', 'isPublic']
          },
          announcements: {
            count: announcementsCount,
            description: 'Public announcements and news shared with the community',
            dataFields: ['title', 'body', 'createdAt', 'priority', 'isPublic']
          },
          locations: {
            count: locationsCount,
            description: 'Public location information for events and activities',
            dataFields: ['name', 'address', 'description', 'coordinates', 'isPublic']
          },
          volunteerNeeds: {
            count: volunteerNeedsCount,
            description: 'Public volunteer opportunities and roles needed for events',
            dataFields: ['role', 'description', 'needed', 'claimed', 'eventTitle', 'isActive']
          }
        },
        dataRetention: {
          description: 'Public data is retained indefinitely as it serves historical and community purposes',
          retentionPeriod: 'Indefinite (with annual review)'
        },
        privacyPolicy: {
          lastUpdated: '2024-01-01',
          url: '/privacy-policy'
        }
      };
    } catch (error) {
      console.error('Error generating public data audit:', error);
      throw error;
    }
  }

  /**
   * Export user data as downloadable JSON (for logged-in user only)
   */
  async exportUserDataAsJSON(): Promise<string> {
    try {
      const auditData = await this.generateUserDataAudit();
      return JSON.stringify(auditData, null, 2);
    } catch (error) {
      console.error('Error exporting user data:', error);
      throw error;
    }
  }

  /**
   * Export public data as downloadable JSON
   */
  async exportPublicDataAsJSON(): Promise<string> {
    try {
      const auditData = await this.generatePublicDataAudit();
      return JSON.stringify(auditData, null, 2);
    } catch (error) {
      console.error('Error exporting public data:', error);
      throw error;
    }
  }

  // Private helper methods
  private async getUserById(userId: string) {
    const userDoc = await getDoc(doc(db, this.COLLECTIONS.users, userId));
    if (!userDoc.exists()) {
      return null;
    }
    const userData = userDoc.data();
    return { uid: userId, ...userData };
  }

  private async getUserProfileData(userId: string): Promise<UserProfileData> {
    const userDoc = await getDoc(doc(db, this.COLLECTIONS.users, userId));
    if (!userDoc.exists()) {
      throw new Error('User profile not found');
    }
    return userDoc.data() as UserProfileData;
  }

  private async getUserEventsData(userId: string): Promise<EventData[]> {
    const eventsRef = collection(db, this.COLLECTIONS.events);
    const q = query(
      eventsRef,
      where('createdBy', '==', userId),
      orderBy('createdAt', 'asc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as EventData));
  }

  private async getUserVolunteerSignupsData(userId: string): Promise<VolunteerSignupData[]> {
    const signupsRef = collection(db, this.COLLECTIONS.volunteerSignups);
    const q = query(
      signupsRef,
      where('volunteerUserId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as VolunteerSignupData));
  }

  private async getUserFeedbackData(userId: string): Promise<FeedbackData[]> {
    const feedbackRef = collection(db, this.COLLECTIONS.feedback);
    const q = query(
      feedbackRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as FeedbackData));
  }

  private async getUserChatMessagesData(userId: string): Promise<ChatMessageData[]> {
    const messagesRef = collection(db, this.COLLECTIONS.chatMessages);
    const q = query(
      messagesRef,
      where('senderId', '==', userId),
      orderBy('timestamp', 'desc'),
      limit(100) // Limit to last 100 messages for privacy
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as ChatMessageData));
  }

  private async getUserRSVPsData(userId: string): Promise<RSVPData[]> {
    const rsvpsRef = collection(db, this.COLLECTIONS.rsvps);
    const q = query(
      rsvpsRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as RSVPData));
  }

  private async getUserAnalyticsData(userId: string): Promise<AnalyticsData[]> {
    const analyticsRef = collection(db, this.COLLECTIONS.analytics);
    const q = query(
      analyticsRef,
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'),
      limit(50) // Limit to last 50 analytics events
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as AnalyticsData));
  }

  private async getUserSystemLogsData(userId: string): Promise<SystemLogData[]> {
    const logsRef = collection(db, this.COLLECTIONS.systemLogs);
    const q = query(
      logsRef,
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'),
      limit(20) // Limit to last 20 system logs
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as SystemLogData));
  }

  private async getPublicDataCount(collectionName: string): Promise<number> {
    try {
      const collectionRef = collection(db, collectionName);
      const snapshot = await getDocs(collectionRef);
      return snapshot.size;
    } catch (error) {
      console.error(`Error getting count for ${collectionName}:`, error);
      return 0;
    }
  }
}

export const dataAuditService = new DataAuditService();