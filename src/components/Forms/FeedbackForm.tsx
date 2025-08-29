import React, { useState } from 'react';
import { MessageSquare, Star, Send, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useAnalytics } from '../../hooks/useAnalytics';

interface FeedbackFormProps {
  onSuccess?: (data: FeedbackData) => void;
  onError?: (error: string) => void;
  className?: string;
  eventId?: string; // Optional: if feedback is related to a specific event
}

interface FeedbackData {
  category: string;
  rating: number;
  title: string;
  message: string;
  contactEmail?: string;
  contactName?: string;
  eventId?: string;
  ipHash: string;
  userAgent: string;
  timestamp: Date;
}

const FeedbackForm: React.FC<FeedbackFormProps> = ({
  onSuccess,
  onError,
  className = '',
  eventId
}) => {
  const analytics = useAnalytics();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // Form state
  const [formData, setFormData] = useState<Partial<FeedbackData>>({
    category: '',
    rating: 0,
    title: '',
    message: '',
    contactEmail: '',
    contactName: '',
    eventId
  });

  // Validation state
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Feedback categories
  const feedbackCategories = [
    { value: 'general', label: 'General Feedback', icon: '💬' },
    { value: 'event', label: 'Event Feedback', icon: '🎯' },
    { value: 'website', label: 'Website/App Feedback', icon: '🌐' },
    { value: 'suggestion', label: 'Suggestion', icon: '💡' },
    { value: 'issue', label: 'Report Issue', icon: '⚠️' },
    { value: 'praise', label: 'Praise/Recognition', icon: '🌟' }
  ];

  // Generate IP hash for rate limiting (simplified)
  const generateIPHash = (): string => {
    return `ip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  // PII scrubbing function (ready for future implementation)
  // const scrubPII = (text: string): string => {
  //   if (!text) return text;
  //   
  //   return text
  //     .replace(/\b\d{3}-\d{3}-\d{4}\b/g, '***-***-****') // Phone numbers
  //     .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '***@***.***') // Emails
  //     .replace(/\b\d{5}(-\d{4})?\b/g, '*****') // ZIP codes
  //     .replace(/\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g, '**/**/****'); // Dates
  // };

  // Validation function
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Category validation
    if (!formData.category) {
      newErrors.category = 'Please select a feedback category';
    }

    // Rating validation
    if (!formData.rating || formData.rating < 1) {
      newErrors.rating = 'Please provide a rating';
    }

    // Title validation
    if (!formData.title?.trim()) {
      newErrors.title = 'Please provide a title for your feedback';
    } else if (formData.title.trim().length < 5) {
      newErrors.title = 'Title must be at least 5 characters long';
    } else if (formData.title.trim().length > 100) {
      newErrors.title = 'Title must be less than 100 characters';
    }

    // Message validation
    if (!formData.message?.trim()) {
      newErrors.message = 'Please provide your feedback message';
    } else if (formData.message.trim().length < 10) {
      newErrors.message = 'Feedback message must be at least 10 characters long';
    } else if (formData.message.trim().length > 1000) {
      newErrors.message = 'Feedback message must be less than 1000 characters';
    }

    // Contact email validation (if provided)
    if (formData.contactEmail?.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.contactEmail.trim())) {
        newErrors.contactEmail = 'Please enter a valid email address';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage('');

    try {
      // Track form submission attempt
      analytics.trackFeatureClick('Feedback Form', { 
        category: formData.category, 
        action: 'submit_attempt' 
      });

      // Prepare submission data
      const submissionData: FeedbackData = {
        ...formData as FeedbackData,
        ipHash: generateIPHash(),
        userAgent: navigator.userAgent,
        timestamp: new Date()
      };

      // In a real app, this would call Firebase Cloud Function
      // For now, simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Simulate success
      setSubmitStatus('success');
      
      // Track successful submission
      analytics.trackFeedbackSubmission(true, { 
        category: submissionData.category, 
        rating: submissionData.rating 
      });
      
      // Call success callback
      if (onSuccess) {
        onSuccess(submissionData);
      }

      // Reset form after success
      setTimeout(() => {
        setFormData({
          category: '',
          rating: 0,
          title: '',
          message: '',
          contactEmail: '',
          contactName: '',
          eventId
        });
        setSubmitStatus('idle');
      }, 3000);

    } catch (error) {
      setSubmitStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'An error occurred while submitting your feedback');
      
      // Track error
      analytics.trackError('feedback_submission_error', error instanceof Error ? error.message : 'Unknown error', 'FeedbackForm');
      
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle input changes
  const handleInputChange = (field: keyof FeedbackData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className={`bg-white/90 backdrop-blur-sm rounded-2xl border border-white/50 shadow-soft ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-secondary-500 rounded-xl flex items-center justify-center shadow-glow">
            <MessageSquare className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-display font-semibold text-gray-900">Share Your Feedback</h3>
            <p className="text-gray-600">
              Help us improve by sharing your thoughts, suggestions, or reporting issues
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Feedback Category */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-gray-900">Feedback Category *</h4>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {feedbackCategories.map((category) => (
              <label
                key={category.value}
                className={`relative cursor-pointer p-4 border-2 rounded-xl transition-all duration-200 ${
                  formData.category === category.value
                    ? 'border-primary-400 bg-primary-50 ring-4 ring-primary-100'
                    : 'border-gray-200 hover:border-primary-300 hover:bg-primary-50/50'
                }`}
              >
                <input
                  type="radio"
                  name="category"
                  value={category.value}
                  checked={formData.category === category.value}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className="sr-only"
                />
                <div className="text-center">
                  <div className="text-2xl mb-2">{category.icon}</div>
                  <div className="text-sm font-medium text-gray-900">{category.label}</div>
                </div>
              </label>
            ))}
          </div>
          
          {errors.category && (
            <p className="text-sm text-red-600">{errors.category}</p>
          )}
        </div>

        {/* Rating */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-gray-900">Overall Rating *</h4>
          
          <div className="flex items-center space-x-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => handleInputChange('rating', star)}
                className={`text-3xl transition-all duration-200 ${
                  star <= (formData.rating || 0)
                    ? 'text-yellow-400 hover:text-yellow-500'
                    : 'text-gray-300 hover:text-yellow-400'
                }`}
              >
                <Star className={`w-8 h-8 ${star <= (formData.rating || 0) ? 'fill-current' : ''}`} />
              </button>
            ))}
            <span className="ml-3 text-sm text-gray-600">
              {formData.rating ? `${formData.rating} out of 5` : 'Click to rate'}
            </span>
          </div>
          
          {errors.rating && (
            <p className="text-sm text-red-600">{errors.rating}</p>
          )}
        </div>

        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-900 mb-2">
            Feedback Title *
          </label>
          <input
            type="text"
            id="title"
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            className={`w-full px-4 py-3 border-2 rounded-xl transition-all duration-200 ${
              errors.title 
                ? 'border-red-300 focus:border-red-400 focus:ring-red-100' 
                : 'border-gray-200 focus:border-primary-400 focus:ring-primary-100'
            } focus:ring-4`}
            placeholder="Brief summary of your feedback"
            maxLength={100}
          />
          {errors.title && (
            <p className="mt-1 text-sm text-red-600">{errors.title}</p>
          )}
          <div className="mt-1 text-xs text-gray-600 text-right">
            {formData.title?.length || 0}/100 characters
          </div>
        </div>

        {/* Message */}
        <div>
          <label htmlFor="message" className="block text-sm font-medium text-gray-900 mb-2">
            Feedback Message *
          </label>
          <textarea
            id="message"
            value={formData.message}
            onChange={(e) => handleInputChange('message', e.target.value)}
            rows={6}
            className={`w-full px-4 py-3 border-2 rounded-xl transition-all duration-200 ${
              errors.message 
                ? 'border-red-300 focus:border-red-400 focus:ring-red-100' 
                : 'border-gray-200 focus:border-primary-400 focus:ring-primary-100'
            } focus:ring-4`}
            placeholder="Please provide detailed feedback, suggestions, or describe any issues you've encountered..."
            maxLength={1000}
          />
          {errors.message && (
            <p className="mt-1 text-sm text-red-600">{errors.message}</p>
          )}
          <div className="mt-1 text-xs text-gray-600 text-right">
            {formData.message?.length || 0}/1000 characters
          </div>
        </div>

        {/* Contact Information (Optional) */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-gray-900">Contact Information (Optional)</h4>
          <p className="text-sm text-gray-600">
            Provide your contact information if you'd like us to follow up on your feedback
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="contactName" className="block text-sm font-medium text-gray-900 mb-2">
                Your Name
              </label>
              <input
                type="text"
                id="contactName"
                value={formData.contactName}
                onChange={(e) => handleInputChange('contactName', e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-400 focus:ring-4 focus:ring-primary-100 transition-all duration-200"
                placeholder="Your name (optional)"
              />
            </div>

            <div>
              <label htmlFor="contactEmail" className="block text-sm font-medium text-gray-900 mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="contactEmail"
                value={formData.contactEmail}
                onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                className={`w-full px-4 py-3 border-2 rounded-xl transition-all duration-200 ${
                  errors.contactEmail 
                    ? 'border-red-300 focus:border-red-400 focus:ring-red-100' 
                    : 'border-gray-200 focus:border-primary-400 focus:ring-primary-100'
                } focus:ring-4`}
                placeholder="your.email@example.com (optional)"
              />
              {errors.contactEmail && (
                <p className="mt-1 text-sm text-red-600">{errors.contactEmail}</p>
              )}
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center px-6 py-4 bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-semibold text-lg rounded-2xl hover:from-primary-600 hover:to-secondary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 shadow-glow-primary/50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                Submitting Feedback...
              </>
            ) : (
              <>
                <Send className="w-5 h-5 mr-3" />
                Submit Feedback
              </>
            )}
          </button>
        </div>

        {/* Success/Error Messages */}
        {submitStatus === 'success' && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-center">
            <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <h4 className="text-lg font-semibold text-green-700 mb-1">Feedback Submitted Successfully!</h4>
            <p className="text-green-600">Thank you for your feedback. We appreciate your input!</p>
          </div>
        )}

        {submitStatus === 'error' && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-center">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
            <h4 className="text-lg font-semibold text-red-700 mb-1">Submission Failed</h4>
            <p className="text-red-600">{errorMessage}</p>
          </div>
        )}
      </form>
    </div>
  );
};

export default FeedbackForm;
