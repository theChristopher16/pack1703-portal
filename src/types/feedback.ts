// Feedback response types
export interface FeedbackResponse {
  id: string;
  feedbackId: string;
  responderId: string;
  responderName: string;
  responderRole: string;
  response: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface FeedbackSubmission {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  category: 'general' | 'event' | 'website' | 'suggestion' | 'issue' | 'praise';
  rating: number;
  title: string;
  message: string;
  status?: 'submitted' | 'reviewing' | 'in-progress' | 'resolved' | 'closed';
  contactEmail?: string;
  contactName?: string;
  eventId?: string;
  ipHash: string;
  userAgent: string;
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
  
  // Response fields
  responses?: FeedbackResponse[];
  hasResponse?: boolean;
  lastResponseAt?: Date;
  responseCount?: number;
}

export interface FeedbackResponseData {
  feedbackId: string;
  response: string;
}

export interface FeedbackFilters {
  category?: string;
  hasResponse?: boolean;
  responderId?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
}
