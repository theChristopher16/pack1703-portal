import React from 'react';
import { MessageSquare, Send, ThumbsUp, Lightbulb } from 'lucide-react';

const FeedbackPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-surface py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-display font-bold text-text mb-4">
            Feedback & Questions
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            We want to hear from you! Share your thoughts, ask questions, or report issues.
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center shadow-soft border border-gray-200 dark:border-gray-700">
          <div className="w-24 h-24 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <MessageSquare className="w-12 h-12 text-accent" />
          </div>
          <h2 className="text-2xl font-display font-semibold text-text mb-4">
            Feedback System Coming Soon!
          </h2>
          <p className="text-gray-600 text-lg mb-6">
            We're building an easy way to submit feedback, ask questions, and stay connected.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="flex items-center space-x-3 justify-center">
              <Send className="w-6 h-6 text-primary" />
              <span className="text-text font-medium">Easy Submission</span>
            </div>
            <div className="flex items-center space-x-3 justify-center">
              <ThumbsUp className="w-6 h-6 text-secondary" />
              <span className="text-text font-medium">Quick Response</span>
            </div>
            <div className="flex items-center space-x-3 justify-center">
              <Lightbulb className="w-6 h-6 text-accent" />
              <span className="text-text font-medium">Suggestions</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeedbackPage;
