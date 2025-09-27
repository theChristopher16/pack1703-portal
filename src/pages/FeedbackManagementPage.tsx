import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Search, 
  Filter, 
  Calendar, 
  User, 
  Tag,
  AlertCircle,
  CheckCircle,
  Loader2,
  Eye,
  EyeOff
} from 'lucide-react';
import { feedbackService } from '../services/feedbackService';
import { useAdmin } from '../contexts/AdminContext';
import { FeedbackSubmission, FeedbackFilters } from '../types/feedback';
import { 
  FeedbackResponseForm, 
  FeedbackResponseItem, 
  FeedbackResponsesList 
} from '../components/Feedback/FeedbackResponseComponents';

const FeedbackManagementPage: React.FC = () => {
  const { state } = useAdmin();
  const { currentUser } = state;
  
  const [feedback, setFeedback] = useState<FeedbackSubmission[]>([]);
  const [filteredFeedback, setFilteredFeedback] = useState<FeedbackSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackSubmission | null>(null);
  const [showResponseForm, setShowResponseForm] = useState(false);
  
  // Filters
  const [filters, setFilters] = useState<FeedbackFilters>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Check if user can manage feedback
  const canManageFeedback = currentUser && 
    ['volunteer', 'admin', 'super-admin'].includes(currentUser.role);

  useEffect(() => {
    if (!canManageFeedback) {
      setError('You do not have permission to manage feedback');
      setIsLoading(false);
      return;
    }

    loadFeedback();
  }, [canManageFeedback]);

  useEffect(() => {
    applyFilters();
  }, [feedback, filters, searchTerm]);

  const loadFeedback = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const allFeedback = await feedbackService.getAllFeedback(filters);
      setFeedback(allFeedback);
    } catch (error: any) {
      setError(error.message || 'Failed to load feedback');
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...feedback];

    // Apply search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(f => 
        f.title.toLowerCase().includes(term) ||
        f.message.toLowerCase().includes(term) ||
        f.userName.toLowerCase().includes(term) ||
        f.category.toLowerCase().includes(term)
      );
    }

    setFilteredFeedback(filtered);
  };

  const handleResponseAdded = (response: any) => {
    if (selectedFeedback) {
      const updatedFeedback = {
        ...selectedFeedback,
        responses: [...(selectedFeedback.responses || []), response],
        hasResponse: true,
        responseCount: (selectedFeedback.responseCount || 0) + 1
      };
      setSelectedFeedback(updatedFeedback);
      
      // Update the main feedback list
      setFeedback(prev => prev.map(f => 
        f.id === selectedFeedback.id ? updatedFeedback : f
      ));
    }
    setShowResponseForm(false);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      general: '💬',
      event: '🎯',
      website: '🌐',
      suggestion: '💡',
      issue: '⚠️',
      praise: '🌟'
    };
    return icons[category] || '💬';
  };

  const getPriorityColor = (hasResponse: boolean) => {
    return hasResponse ? 'text-green-600' : 'text-orange-600';
  };

  if (!canManageFeedback) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-red-900 mb-2">Access Denied</h2>
          <p className="text-red-700">
            You do not have permission to manage feedback. Only den leaders and above can access this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Feedback Management</h1>
        <p className="text-gray-600">
          Review and respond to feedback from pack members
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <MessageSquare className="w-8 h-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Feedback</p>
              <p className="text-2xl font-bold text-gray-900">{feedback.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <CheckCircle className="w-8 h-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">With Responses</p>
              <p className="text-2xl font-bold text-gray-900">
                {feedback.filter(f => f.hasResponse).length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <AlertCircle className="w-8 h-8 text-orange-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900">
                {feedback.filter(f => !f.hasResponse).length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <Calendar className="w-8 h-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">This Week</p>
              <p className="text-2xl font-bold text-gray-900">
                {feedback.filter(f => {
                  const weekAgo = new Date();
                  weekAgo.setDate(weekAgo.getDate() - 7);
                  return f.createdAt > weekAgo;
                }).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search feedback..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </button>
        </div>

        {/* Filter Options */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={filters.category || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value || undefined }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Categories</option>
                  <option value="general">General</option>
                  <option value="event">Event</option>
                  <option value="website">Website</option>
                  <option value="suggestion">Suggestion</option>
                  <option value="issue">Issue</option>
                  <option value="praise">Praise</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={filters.hasResponse === undefined ? '' : filters.hasResponse.toString()}
                  onChange={(e) => setFilters(prev => ({ 
                    ...prev, 
                    hasResponse: e.target.value === '' ? undefined : e.target.value === 'true'
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Status</option>
                  <option value="false">Pending Response</option>
                  <option value="true">With Response</option>
                </select>
              </div>
              
              <div className="flex items-end">
                <button
                  onClick={() => setFilters({})}
                  className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Feedback List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Feedback List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <span className="ml-3 text-gray-600">Loading feedback...</span>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
              <p className="text-red-700">{error}</p>
              <button
                onClick={loadFeedback}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
              >
                Try Again
              </button>
            </div>
          ) : filteredFeedback.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No feedback found</p>
            </div>
          ) : (
            filteredFeedback.map((item) => (
              <div
                key={item.id}
                className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 cursor-pointer transition-all duration-200 hover:shadow-md ${
                  selectedFeedback?.id === item.id ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => setSelectedFeedback(item)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getCategoryIcon(item.category)}</span>
                    <div>
                      <h3 className="font-semibold text-gray-900">{item.title}</h3>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <User className="w-4 h-4" />
                        <span>{item.userName}</span>
                        <Tag className="w-4 h-4" />
                        <span className="capitalize">{item.category}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className={`flex items-center gap-1 text-sm ${getPriorityColor(item.hasResponse || false)}`}>
                      {item.hasResponse ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <AlertCircle className="w-4 h-4" />
                      )}
                      <span>{item.hasResponse ? 'Responded' : 'Pending'}</span>
                    </div>
                  </div>
                </div>
                
                <p className="text-gray-700 mb-3 line-clamp-2">{item.message}</p>
                
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(item.createdAt)}</span>
                  </div>
                  
                  {item.responseCount && item.responseCount > 0 && (
                    <div className="flex items-center gap-1">
                      <MessageSquare className="w-4 h-4" />
                      <span>{item.responseCount} response{item.responseCount !== 1 ? 's' : ''}</span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Right Column - Selected Feedback Details */}
        <div className="space-y-6">
          {selectedFeedback ? (
            <>
              {/* Feedback Details */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{getCategoryIcon(selectedFeedback.category)}</span>
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">{selectedFeedback.title}</h2>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <User className="w-4 h-4" />
                        <span>{selectedFeedback.userName}</span>
                        <Tag className="w-4 h-4" />
                        <span className="capitalize">{selectedFeedback.category}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className={`flex items-center gap-1 text-sm ${getPriorityColor(selectedFeedback.hasResponse || false)}`}>
                    {selectedFeedback.hasResponse ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <AlertCircle className="w-4 h-4" />
                    )}
                    <span>{selectedFeedback.hasResponse ? 'Responded' : 'Pending'}</span>
                  </div>
                </div>
                
                <div className="mb-4">
                  <h3 className="font-medium text-gray-900 mb-2">Message</h3>
                  <div className="bg-gray-50 rounded-lg p-4 text-gray-800 whitespace-pre-wrap">
                    {selectedFeedback.message}
                  </div>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>Submitted {formatDate(selectedFeedback.createdAt)}</span>
                  </div>
                  
                  {selectedFeedback.rating && (
                    <div className="flex items-center gap-1">
                      <span>Rating: {selectedFeedback.rating}/5</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Responses */}
              <FeedbackResponsesList
                responses={selectedFeedback.responses || []}
              />

              {/* Response Form */}
              {!selectedFeedback.hasResponse && (
                <FeedbackResponseForm
                  feedback={selectedFeedback}
                  onResponseAdded={handleResponseAdded}
                />
              )}
            </>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <Eye className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Select feedback to view details and respond</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FeedbackManagementPage;
