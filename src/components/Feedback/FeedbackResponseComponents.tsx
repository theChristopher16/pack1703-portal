import React, { useState } from 'react';
import { 
  MessageSquare, 
  Send, 
  User, 
  Calendar, 
  Tag,
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { feedbackService } from '../../services/feedbackService';
import { FeedbackSubmission, FeedbackResponse } from '../../types/feedback';

interface FeedbackResponseFormProps {
  feedback: FeedbackSubmission;
  onResponseAdded: (response: FeedbackResponse) => void;
  className?: string;
}

const FeedbackResponseForm: React.FC<FeedbackResponseFormProps> = ({
  feedback,
  onResponseAdded,
  className = ''
}) => {
  const [response, setResponse] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!response.trim()) {
      setError('Please enter a response');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const newResponse = await feedbackService.addResponse({
        feedbackId: feedback.id,
        response: response.trim()
      });

      setResponse('');
      setSuccess('Response added successfully!');
      onResponseAdded(newResponse);

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);

    } catch (error: any) {
      setError(error.message || 'Failed to add response');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <MessageSquare className="w-5 h-5 mr-2 text-blue-600" />
        Add Response
      </h3>

      {/* Success Message */}
      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <span className="text-green-800">{success}</span>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <span className="text-red-800">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="response" className="block text-sm font-medium text-gray-700 mb-2">
            Your Response
          </label>
          <textarea
            id="response"
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            placeholder="Enter your response to this feedback..."
            disabled={isSubmitting}
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting || !response.trim()}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Send className="w-4 h-4 mr-2" />
            )}
            {isSubmitting ? 'Adding Response...' : 'Add Response'}
          </button>
        </div>
      </form>
    </div>
  );
};

interface FeedbackResponseItemProps {
  response: FeedbackResponse;
  className?: string;
}

const FeedbackResponseItem: React.FC<FeedbackResponseItemProps> = ({
  response,
  className = ''
}) => {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'super-admin':
        return 'bg-red-100 text-red-800';
      case 'admin':
        return 'bg-purple-100 text-purple-800';
      case 'volunteer':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className={`bg-gray-50 rounded-lg p-4 border-l-4 border-blue-500 ${className}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-gray-500" />
            <span className="font-medium text-gray-900">{response.responderName}</span>
          </div>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(response.responderRole)}`}>
            {response.responderRole.replace('_', ' ').toUpperCase()}
          </span>
        </div>
        <div className="flex items-center gap-1 text-sm text-gray-500">
          <Calendar className="w-4 h-4" />
          <span>{formatDate(response.createdAt)}</span>
        </div>
      </div>
      
      <div className="text-gray-800 whitespace-pre-wrap">
        {response.response}
      </div>
    </div>
  );
};

interface FeedbackResponsesListProps {
  responses: FeedbackResponse[];
  className?: string;
}

const FeedbackResponsesList: React.FC<FeedbackResponsesListProps> = ({
  responses,
  className = ''
}) => {
  if (responses.length === 0) {
    return (
      <div className={`text-center py-8 text-gray-500 ${className}`}>
        <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p>No responses yet</p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 flex items-center">
        <MessageSquare className="w-5 h-5 mr-2 text-blue-600" />
        Responses ({responses.length})
      </h3>
      
      {responses.map((response) => (
        <FeedbackResponseItem
          key={response.id}
          response={response}
        />
      ))}
    </div>
  );
};

export { FeedbackResponseForm, FeedbackResponseItem, FeedbackResponsesList };
