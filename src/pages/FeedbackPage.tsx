import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Send, 
  CheckCircle, 
  AlertCircle, 
  Search
} from 'lucide-react';

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
  const [activeTab, setActiveTab] = useState<'submit' | 'history'>('submit');
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

  // Mock user submissions - will be replaced with Firebase calls
  const mockSubmissions: FeedbackSubmission[] = [
    {
      id: '1',
      category: 'suggestion',
      priority: 'medium',
      title: 'Add more camping opportunities',
      message: 'Our family really enjoyed the fall campout and would love to see more camping events throughout the year. Maybe we could add a spring camping trip as well?',
      familyName: 'Smith Family',
      email: 'smith@example.com',
      status: 'in-progress',
      adminResponse: 'Great suggestion! We\'re already planning a spring camping trip for April. We\'ll announce the details soon.',
      adminResponseDate: '2024-01-20T00:00:00',
      createdAt: '2024-01-15T00:00:00',
      updatedAt: '2024-01-20T00:00:00'
    },
    {
      id: '2',
      category: 'question',
      priority: 'low',
      title: 'Uniform requirements for new scouts',
      message: 'My son just joined Pack 1703. What are the uniform requirements for new scouts? Do we need to buy everything at once?',
      familyName: 'Johnson Family',
      email: 'johnson@example.com',
      status: 'resolved',
      adminResponse: 'Welcome to Pack 1703! For new scouts, we recommend starting with the basic uniform (shirt, neckerchief, and slide). You can find the complete uniform guide in our Resources section.',
      adminResponseDate: '2024-01-10T00:00:00',
      createdAt: '2024-01-08T00:00:00',
      updatedAt: '2024-01-10T00:00:00'
    },
    {
      id: '3',
      category: 'praise',
      priority: 'low',
      title: 'Amazing Pinewood Derby experience',
      message: 'The Pinewood Derby was absolutely fantastic! The organization, the excitement, and the way all the scouts were included made it a memorable experience. Thank you to all the volunteers!',
      familyName: 'Davis Family',
      email: 'davis@example.com',
      status: 'closed',
      adminResponse: 'Thank you for the kind words! We\'re so glad your family enjoyed the Pinewood Derby. Our volunteers work hard to make these events special.',
      adminResponseDate: '2024-02-15T00:00:00',
      createdAt: '2024-02-12T00:00:00',
      updatedAt: '2024-02-15T00:00:00'
    }
  ];

  // Set initial user submissions
  useEffect(() => {
    setUserSubmissions(mockSubmissions);
  }, []); // mockSubmissions is constant, so no dependency needed

  const categories = [
    { id: 'suggestion', name: 'Suggestion', color: 'bg-blue-100 text-blue-800', icon: '💡' },
    { id: 'question', name: 'Question', color: 'bg-green-100 text-green-800', icon: '❓' },
    { id: 'concern', name: 'Concern', color: 'bg-yellow-100 text-yellow-800', icon: '⚠️' },
    { id: 'praise', name: 'Praise', color: 'bg-purple-100 text-purple-800', icon: '🌟' },
    { id: 'bug', name: 'Bug Report', color: 'bg-red-100 text-red-800', icon: '🐛' },
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
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // TODO: Implement actual Firebase submission
      console.log('Submitting feedback:', formData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Create new submission
      const newSubmission: FeedbackSubmission = {
        id: Date.now().toString(),
        ...formData,
        status: 'submitted',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Add to user submissions
      setUserSubmissions(prev => [newSubmission, ...prev]);
      
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
      
      // Show success message
      setSubmissionSuccess(true);
      setTimeout(() => setSubmissionSuccess(false), 5000);
      
      // Switch to history tab
      setActiveTab('history');
      
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('There was an error submitting your feedback. Please try again.');
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

  const getCategoryInfo = (categoryId: string) => {
    return categories.find(c => c.id === categoryId) || categories[0];
  };

  const getPriorityInfo = (priorityId: string) => {
    return priorities.find(p => p.id === priorityId) || priorities[0];
  };

  const getStatusInfo = (statusId: string) => {
    return statuses.find(s => s.id === statusId) || statuses[0];
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
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Feedback & Questions</h1>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          We value your input! Share suggestions, ask questions, report concerns, or let us know what we're doing well. 
          Your feedback helps make Pack 1703 better for everyone.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex justify-center mb-8">
        <div className="bg-white rounded-lg shadow-md p-1">
          <button
            onClick={() => setActiveTab('submit')}
            className={`px-6 py-3 rounded-md font-medium transition-colors ${
              activeTab === 'submit'
                ? 'bg-indigo-600 text-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Submit Feedback
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-6 py-3 rounded-md font-medium transition-colors ${
              activeTab === 'history'
                ? 'bg-indigo-600 text-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            My Submissions
          </button>
        </div>
      </div>

      {/* Success Message */}
      {submissionSuccess && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
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
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Submit New Feedback</h2>
          
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
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
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
      {activeTab === 'history' && (
        <div>
          {/* Filters */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                    className="pl-10 w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  id="category"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="all">All Categories</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.icon} {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  id="status"
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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
          <div className="space-y-6">
            {filteredSubmissions.map((submission) => (
              <div key={submission.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center flex-1">
                      {getStatusIcon(submission.status)}
                      <h3 className="text-lg font-semibold text-gray-900 ml-2">{submission.title}</h3>
                    </div>
                    <div className="flex space-x-2 ml-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryInfo(submission.category).color}`}>
                        {getCategoryInfo(submission.category).icon} {getCategoryInfo(submission.category).name}
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityInfo(submission.priority).color}`}>
                        {getPriorityInfo(submission.priority).name}
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusInfo(submission.status).color}`}>
                        {getStatusInfo(submission.status).name}
                      </span>
                    </div>
                  </div>

                  {/* Message */}
                  <p className="text-gray-700 mb-4">{submission.message}</p>

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
                    {submission.phone && (
                      <div>
                        <span className="font-medium">Phone:</span> {submission.phone}
                      </div>
                    )}
                  </div>

                  {/* Admin Response */}
                  {submission.adminResponse && (
                    <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                      <div className="flex items-start">
                        <CheckCircle className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-blue-900 mb-2">Response from Pack Leadership</h4>
                          <p className="text-blue-800 text-sm">{submission.adminResponse}</p>
                          {submission.adminResponseDate && (
                            <p className="text-blue-600 text-xs mt-2">
                              Responded on {new Date(submission.adminResponseDate).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* No Results */}
          {filteredSubmissions.length === 0 && (
            <div className="text-center py-12">
              <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No submissions found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || selectedCategory !== 'all' || selectedStatus !== 'all'
                  ? 'Try adjusting your search or filters.'
                  : 'You haven\'t submitted any feedback yet.'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Help Section */}
      <div className="mt-12 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Need Help?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="bg-white rounded-full p-4 w-16 h-16 mx-auto mb-3 flex items-center justify-center shadow-md">
              <MessageSquare className="h-8 w-8 text-indigo-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Submit Feedback</h3>
            <p className="text-sm text-gray-600">Share your thoughts, suggestions, and concerns</p>
          </div>
          
          <div className="text-center">
            <div className="bg-white rounded-full p-4 w-16 h-16 mx-auto mb-3 flex items-center justify-center shadow-md">
              <Search className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Track Submissions</h3>
            <p className="text-sm text-gray-600">Monitor the status of your feedback</p>
          </div>
          
          <div className="text-center">
            <div className="bg-white rounded-full p-4 w-16 h-16 mx-auto mb-3 flex items-center justify-center shadow-md">
              {/* Removed User icon as it's no longer imported */}
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Get Responses</h3>
            <p className="text-sm text-gray-600">Receive updates from pack leadership</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeedbackPage;
