import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Send, 
  CheckCircle, 
  AlertCircle, 
  Search
} from 'lucide-react';
import { authService } from '../services/authService';

interface FeedbackSubmission {
  id: string;
  category: 'suggestion' | 'question' | 'concern' | 'praise' | 'bug' | 'general';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  message: string;
  familyName: string;
  email?: string;
  phone?: string;
  eventId?: string;
  eventTitle?: string;
  status: 'submitted' | 'reviewing' | 'in-progress' | 'resolved' | 'closed';
  adminResponse?: string;
  adminResponseDate?: string;
  createdAt: string;
  updatedAt: string;
}

const FeedbackPage: React.FC = () => {
  const [user, setUser] = useState(authService.getCurrentUser());
  const [activeTab, setActiveTab] = useState<'submit' | 'history'>('submit');
  
  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = authService.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
    });
    return unsubscribe;
  }, []);
  
  // Redirect to submit tab if user is not logged in and tries to access history
  useEffect(() => {
    if (!user && activeTab === 'history') {
      setActiveTab('submit');
    }
  }, [user, activeTab]);
  const [formData, setFormData] = useState({
    category: 'general' as FeedbackSubmission['category'],
    priority: 'medium' as FeedbackSubmission['priority'],
    title: '',
    message: '',
    familyName: '',
    email: '',
    phone: '',
    eventId: '',
    eventTitle: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [userSubmissions, setUserSubmissions] = useState<FeedbackSubmission[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Load user submissions from Firebase
  useEffect(() => {
    const loadUserSubmissions = async () => {
      if (!user) return;
      
      try {
        // Import Firebase functions
        const { collection, query, where, getDocs, orderBy } = await import('firebase/firestore');
        const { db } = await import('../firebase/config');
        
        // Query user's feedback submissions
        const feedbackRef = collection(db, 'feedback');
        const q = query(
          feedbackRef, 
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc')
        );
        
        const snapshot = await getDocs(q);
        const submissions = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as FeedbackSubmission[];
        
        setUserSubmissions(submissions);
      } catch (error) {
        console.error('Error loading user submissions:', error);
        // Fallback to empty array if error
        setUserSubmissions([]);
      }
    };

    loadUserSubmissions();
  }, [user]);

  const categories = [
    { id: 'suggestion', name: 'Suggestion', color: 'bg-blue-100 text-blue-800', icon: '💡' },
    { id: 'question', name: 'Question', color: 'bg-green-100 text-green-800', icon: '❓' },
    { id: 'concern', name: 'Concern', color: 'bg-red-100 text-red-800', icon: '⚠️' },
    { id: 'praise', name: 'Praise', color: 'bg-yellow-100 text-yellow-800', icon: '🌟' },
    { id: 'bug', name: 'Bug Report', color: 'bg-purple-100 text-purple-800', icon: '🐛' },
    { id: 'general', name: 'General', color: 'bg-gray-100 text-gray-800', icon: '📝' }
  ];

  const priorities = [
    { id: 'low', name: 'Low', color: 'bg-green-100 text-green-800' },
    { id: 'medium', name: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
    { id: 'high', name: 'High', color: 'bg-orange-100 text-orange-800' },
    { id: 'urgent', name: 'Urgent', color: 'bg-red-100 text-red-800' }
  ];

  const statuses = [
    { id: 'all', name: 'All Statuses', color: 'bg-gray-100 text-gray-800' },
    { id: 'submitted', name: 'Submitted', color: 'bg-blue-100 text-blue-800' },
    { id: 'reviewing', name: 'Reviewing', color: 'bg-yellow-100 text-yellow-800' },
    { id: 'in-progress', name: 'In Progress', color: 'bg-orange-100 text-orange-800' },
    { id: 'resolved', name: 'Resolved', color: 'bg-green-100 text-green-800' },
    { id: 'closed', name: 'Closed', color: 'bg-gray-100 text-gray-800' }
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Import Firebase functions
      const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
      const { db } = await import('../firebase/config');
      
      // Create feedback submission
      const feedbackData = {
        ...formData,
        userId: user?.uid || 'anonymous',
        status: 'submitted',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      // Add to Firebase
      const feedbackRef = collection(db, 'feedback');
      const docRef = await addDoc(feedbackRef, feedbackData);
      
      // Add to local state for immediate UI update
      const newSubmission: FeedbackSubmission = {
        id: docRef.id,
        ...formData,
        status: 'submitted',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      setUserSubmissions(prev => [newSubmission, ...prev]);
      setSubmissionSuccess(true);
      
      // Reset form
      setFormData({
        category: 'general',
        priority: 'medium',
        title: '',
        message: '',
        familyName: '',
        email: '',
        phone: '',
        eventId: '',
        eventTitle: ''
      });
      
      // Hide success message after 5 seconds
      setTimeout(() => setSubmissionSuccess(false), 5000);
      
    } catch (error) {
      console.error('Error submitting feedback:', error);
      // TODO: Show error message to user
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredSubmissions = userSubmissions.filter(submission => {
    const matchesSearch = submission.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         submission.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         submission.familyName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || submission.category === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || submission.status === selectedStatus;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getCategoryColor = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.color : 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priorityId: string) => {
    const priority = priorities.find(p => p.id === priorityId);
    return priority ? priority.color : 'bg-gray-100 text-gray-800';
  };

  const getStatusColor = (statusId: string) => {
    const status = statuses.find(s => s.id === statusId);
    return status ? status.color : 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'submitted':
        return <MessageSquare className="h-4 w-4 text-blue-600" />;
      case 'reviewing':
        return <Search className="h-4 w-4 text-yellow-600" />;
      case 'in-progress':
        return <AlertCircle className="h-4 w-4 text-orange-600" />;
      case 'resolved':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'closed':
        return <CheckCircle className="h-4 w-4 text-gray-600" />;
      default:
        return <MessageSquare className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-primary-50/30 to-secondary-50/30 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-display font-bold text-gray-800 mb-4">Feedback & Questions</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            We value your input! Share suggestions, ask questions, report concerns, or let us know what we're doing well. 
            Your feedback helps make our Scout Pack better for everyone.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex justify-center mb-8">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-1 border border-white/50 shadow-soft">
            <button
              onClick={() => setActiveTab('submit')}
              className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                activeTab === 'submit'
                  ? 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white shadow-lg'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-white/50'
              }`}
            >
              Submit Feedback
            </button>
            {user && (
              <button
                onClick={() => setActiveTab('history')}
                className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                  activeTab === 'history'
                    ? 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white shadow-lg'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-white/50'
                }`}
              >
                My Submissions
              </button>
            )}
          </div>
        </div>

        {/* Success Message */}
        {submissionSuccess && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
              <span className="text-green-800 font-medium">
                Thank you! Your feedback has been submitted successfully.
              </span>
            </div>
          </div>
        )}

        {/* Submit Feedback Tab */}
        {activeTab === 'submit' && (
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 border border-white/50 shadow-soft">
            <h2 className="text-2xl font-display font-bold text-gray-800 mb-6">Submit New Feedback</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Category and Priority */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    id="category"
                    required
                    value={formData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white/80 backdrop-blur-sm transition-all duration-200"
                  >
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.icon} {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-2">
                    Priority
                  </label>
                  <select
                    id="priority"
                    value={formData.priority}
                    onChange={(e) => handleInputChange('priority', e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white/80 backdrop-blur-sm transition-all duration-200"
                  >
                    {priorities.map(priority => (
                      <option key={priority.id} value={priority.id}>
                        {priority.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Title */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  id="title"
                  required
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Brief description of your feedback..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white/80 backdrop-blur-sm transition-all duration-200"
                />
              </div>

              {/* Message */}
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                  Message *
                </label>
                <textarea
                  id="message"
                  required
                  rows={6}
                  value={formData.message}
                  onChange={(e) => handleInputChange('message', e.target.value)}
                  placeholder="Please provide details about your feedback, question, or concern..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white/80 backdrop-blur-sm transition-all duration-200"
                />
              </div>

              {/* Family Name and Contact */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label htmlFor="familyName" className="block text-sm font-medium text-gray-700 mb-2">
                    Family Name *
                  </label>
                  <input
                    type="text"
                    id="familyName"
                    required
                    value={formData.familyName}
                    onChange={(e) => handleInputChange('familyName', e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white/80 backdrop-blur-sm transition-all duration-200"
                  />
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email (Optional)
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="For follow-up questions"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white/80 backdrop-blur-sm transition-all duration-200"
                  />
                </div>
                
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                    Phone (Optional)
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="For urgent matters"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white/80 backdrop-blur-sm transition-all duration-200"
                  />
                </div>
              </div>

              {/* Related Event */}
              <div>
                <label htmlFor="eventTitle" className="block text-sm font-medium text-gray-700 mb-2">
                  Related Event (Optional)
                </label>
                <input
                  type="text"
                  id="eventTitle"
                  value={formData.eventTitle}
                  onChange={(e) => handleInputChange('eventTitle', e.target.value)}
                  placeholder="If this feedback relates to a specific event..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white/80 backdrop-blur-sm transition-all duration-200"
                />
              </div>

              {/* Submit Button */}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Submit Feedback
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* My Submissions Tab */}
        {activeTab === 'history' && user && (
          <div className="space-y-6">
            {/* Search and Filters */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-soft">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Search */}
                <div>
                  <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                    Search Submissions
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      id="search"
                      placeholder="Search by title, message, or family name..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white/80 backdrop-blur-sm transition-all duration-200"
                    />
                  </div>
                </div>

                {/* Category Filter */}
                <div>
                  <label htmlFor="category-filter" className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    id="category-filter"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white/80 backdrop-blur-sm transition-all duration-200"
                  >
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.icon} {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status Filter */}
                <div>
                  <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    id="status-filter"
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white/80 backdrop-blur-sm transition-all duration-200"
                  >
                    {statuses.map(status => (
                      <option key={status.id} value={status.id}>
                        {status.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Submissions List */}
            <div className="space-y-4">
              {filteredSubmissions.map((submission) => (
                <div key={submission.id} className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-soft">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center flex-1">
                      <MessageSquare className="h-5 w-5 text-primary-600 mr-2" />
                      <h3 className="text-lg font-semibold text-gray-800 flex-1">{submission.title}</h3>
                    </div>
                    <div className="ml-2">
                      {getStatusIcon(submission.status)}
                    </div>
                  </div>

                  {/* Message */}
                  <p className="text-gray-600 mb-4">{submission.message}</p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(submission.category)}`}>
                      {categories.find(c => c.id === submission.category)?.icon} {categories.find(c => c.id === submission.category)?.name}
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(submission.priority)}`}>
                      {priorities.find(p => p.id === submission.priority)?.name}
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(submission.status)}`}>
                      {statuses.find(s => s.id === submission.status)?.name}
                    </span>
                  </div>

                  {/* Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
                    <div>
                      <span className="font-medium">Family:</span> {submission.familyName}
                    </div>
                    <div>
                      <span className="font-medium">Submitted:</span> {new Date(submission.createdAt).toLocaleDateString()}
                    </div>
                    {submission.email && (
                      <div>
                        <span className="font-medium">Email:</span> {submission.email}
                      </div>
                    )}
                    {submission.eventTitle && (
                      <div>
                        <span className="font-medium">Event:</span> {submission.eventTitle}
                      </div>
                    )}
                  </div>

                  {/* Admin Response */}
                  {submission.adminResponse && (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                      <div className="flex items-center mb-2">
                        <CheckCircle className="h-4 w-4 text-blue-600 mr-2" />
                        <span className="text-sm font-medium text-blue-800">Admin Response</span>
                        {submission.adminResponseDate && (
                          <span className="text-xs text-blue-600 ml-2">
                            {new Date(submission.adminResponseDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-blue-700">{submission.adminResponse}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* No Results */}
            {filteredSubmissions.length === 0 && (
              <div className="text-center py-12">
                <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-800">No submissions found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm || selectedCategory !== 'all' || selectedStatus !== 'all'
                    ? 'Try adjusting your search or filters.'
                    : 'You haven\'t submitted any feedback yet.'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FeedbackPage;
