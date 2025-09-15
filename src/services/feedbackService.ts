import { 
  collection, 
  doc, 
  getDocs, 
  getDoc,
  addDoc, 
  updateDoc,
  query, 
  where, 
  orderBy, 
  limit as firestoreLimit,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { authService, UserRole } from './authService';
import { 
  FeedbackSubmission, 
  FeedbackResponse, 
  FeedbackResponseData, 
  FeedbackFilters 
} from '../types/feedback';

class FeedbackService {
  private currentUser = authService.getCurrentUser();

  /**
   * Get all feedback submissions (for den leaders and up)
   */
  async getAllFeedback(filters?: FeedbackFilters): Promise<FeedbackSubmission[]> {
    if (!this.currentUser) {
      throw new Error('User must be authenticated');
    }

    // Check if user has permission to view all feedback
    const canViewAll = this.canViewAllFeedback();
    if (!canViewAll) {
      throw new Error('Insufficient permissions to view all feedback');
    }

    try {
      const feedbackRef = collection(db, 'feedback');
      let q = query(feedbackRef, orderBy('createdAt', 'desc'));

      // Apply filters
      if (filters?.category) {
        q = query(q, where('category', '==', filters.category));
      }
      if (filters?.hasResponse !== undefined) {
        q = query(q, where('hasResponse', '==', filters.hasResponse));
      }

      const snapshot = await getDocs(q);
      const feedback: FeedbackSubmission[] = [];

      snapshot.forEach(doc => {
        const data = doc.data();
        feedback.push({
          id: doc.id,
          ...data,
          timestamp: data.timestamp?.toDate() || new Date(),
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          lastResponseAt: data.lastResponseAt?.toDate(),
          responses: data.responses?.map((r: any) => ({
            ...r,
            createdAt: r.createdAt?.toDate() || new Date(),
            updatedAt: r.updatedAt?.toDate() || new Date()
          }))
        });
      });

      return feedback;
    } catch (error) {
      console.error('Error fetching all feedback:', error);
      throw error;
    }
  }

  /**
   * Get feedback submissions for the current user
   */
  async getUserFeedback(): Promise<FeedbackSubmission[]> {
    if (!this.currentUser) {
      throw new Error('User must be authenticated');
    }

    try {
      const feedbackRef = collection(db, 'feedback');
      const q = query(
        feedbackRef, 
        where('userId', '==', this.currentUser.id),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      const feedback: FeedbackSubmission[] = [];

      snapshot.forEach(doc => {
        const data = doc.data();
        feedback.push({
          id: doc.id,
          ...data,
          timestamp: data.timestamp?.toDate() || new Date(),
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          lastResponseAt: data.lastResponseAt?.toDate(),
          responses: data.responses?.map((r: any) => ({
            ...r,
            createdAt: r.createdAt?.toDate() || new Date(),
            updatedAt: r.updatedAt?.toDate() || new Date()
          }))
        });
      });

      return feedback;
    } catch (error) {
      console.error('Error fetching user feedback:', error);
      throw error;
    }
  }

  /**
   * Get a specific feedback submission by ID
   */
  async getFeedbackById(feedbackId: string): Promise<FeedbackSubmission | null> {
    if (!this.currentUser) {
      throw new Error('User must be authenticated');
    }

    try {
      const feedbackRef = doc(db, 'feedback', feedbackId);
      const snapshot = await getDoc(feedbackRef);

      if (!snapshot.exists()) {
        return null;
      }

      const data = snapshot.data();
      
      // Check permissions
      const canViewAll = this.canViewAllFeedback();
      const isOwner = data.userId === this.currentUser.id;
      
      if (!canViewAll && !isOwner) {
        throw new Error('Insufficient permissions to view this feedback');
      }

      return {
        id: snapshot.id,
        ...data,
        timestamp: data.timestamp?.toDate() || new Date(),
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        lastResponseAt: data.lastResponseAt?.toDate(),
        responses: data.responses?.map((r: any) => ({
          ...r,
          createdAt: r.createdAt?.toDate() || new Date(),
          updatedAt: r.updatedAt?.toDate() || new Date()
        }))
      } as FeedbackSubmission;
    } catch (error) {
      console.error('Error fetching feedback by ID:', error);
      throw error;
    }
  }

  /**
   * Add a response to feedback (for den leaders and up)
   */
  async addResponse(responseData: FeedbackResponseData): Promise<FeedbackResponse> {
    if (!this.currentUser) {
      throw new Error('User must be authenticated');
    }

    // Check if user has permission to respond to feedback
    const canRespond = this.canRespondToFeedback();
    if (!canRespond) {
      throw new Error('Insufficient permissions to respond to feedback');
    }

    try {
      // Get the feedback document first
      const feedbackRef = doc(db, 'feedback', responseData.feedbackId);
      const feedbackSnapshot = await getDoc(feedbackRef);

      if (!feedbackSnapshot.exists()) {
        throw new Error('Feedback not found');
      }

      const feedbackData = feedbackSnapshot.data();
      
      // Create the response
      const response: Omit<FeedbackResponse, 'id'> = {
        feedbackId: responseData.feedbackId,
        responderId: this.currentUser.id,
        responderName: this.currentUser.name || this.currentUser.email || 'Unknown',
        responderRole: this.currentUser.role || 'unknown',
        response: responseData.response,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Add response to the feedback document
      const responses = feedbackData.responses || [];
      const newResponse = {
        ...response,
        id: `response_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };
      
      responses.push(newResponse);

      // Update the feedback document
      await updateDoc(feedbackRef, {
        responses: responses,
        hasResponse: true,
        lastResponseAt: serverTimestamp(),
        responseCount: responses.length,
        updatedAt: serverTimestamp()
      });

      return newResponse;
    } catch (error) {
      console.error('Error adding response:', error);
      throw error;
    }
  }

  /**
   * Check if current user can view all feedback
   */
  private canViewAllFeedback(): boolean {
    if (!this.currentUser) return false;
    
    const allowedRoles = [UserRole.VOLUNTEER, UserRole.ADMIN, UserRole.ROOT];
    return allowedRoles.includes(this.currentUser.role);
  }

  /**
   * Check if current user can respond to feedback
   */
  private canRespondToFeedback(): boolean {
    if (!this.currentUser) return false;
    
    const allowedRoles = [UserRole.VOLUNTEER, UserRole.ADMIN, UserRole.ROOT];
    return allowedRoles.includes(this.currentUser.role);
  }

  /**
   * Get feedback statistics (for den leaders and up)
   */
  async getFeedbackStats(): Promise<{
    total: number;
    withResponses: number;
    withoutResponses: number;
    byCategory: Record<string, number>;
    recentResponses: number;
  }> {
    if (!this.currentUser) {
      throw new Error('User must be authenticated');
    }

    const canViewAll = this.canViewAllFeedback();
    if (!canViewAll) {
      throw new Error('Insufficient permissions to view feedback statistics');
    }

    try {
      const allFeedback = await this.getAllFeedback();
      
      const stats = {
        total: allFeedback.length,
        withResponses: allFeedback.filter(f => f.hasResponse).length,
        withoutResponses: allFeedback.filter(f => !f.hasResponse).length,
        byCategory: {} as Record<string, number>,
        recentResponses: 0
      };

      // Count by category
      allFeedback.forEach(feedback => {
        stats.byCategory[feedback.category] = (stats.byCategory[feedback.category] || 0) + 1;
      });

      // Count recent responses (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      stats.recentResponses = allFeedback.filter(feedback => 
        feedback.lastResponseAt && feedback.lastResponseAt > sevenDaysAgo
      ).length;

      return stats;
    } catch (error) {
      console.error('Error fetching feedback statistics:', error);
      throw error;
    }
  }
}

export const feedbackService = new FeedbackService();
