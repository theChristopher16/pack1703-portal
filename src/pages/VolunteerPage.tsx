import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Calendar, 
  UserCheck, 
  UserPlus, 
  Search, 
  AlertCircle,
  CheckCircle,
  XCircle,
  Plus,
  Edit,
  Trash2,
  Eye,
  Clock
} from 'lucide-react';
import { volunteerService, VolunteerNeed, VolunteerSignup } from '../services/volunteerService';
import { authService } from '../services/authService';
import { useAdmin } from '../contexts/AdminContext';
import { UserRole } from '../services/authService';

const VolunteerPage: React.FC = () => {
  const [volunteerNeeds, setVolunteerNeeds] = useState<VolunteerNeed[]>([]);
  const [userSignups, setUserSignups] = useState<VolunteerSignup[]>([]);
  const [volunteerSignups, setVolunteerSignups] = useState<VolunteerSignup[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(false);
  
  // Admin management states
  const [selectedNeed, setSelectedNeed] = useState<VolunteerNeed | null>(null);
  const [selectedSignup, setSelectedSignup] = useState<VolunteerSignup | null>(null);
  const [isNeedModalOpen, setIsNeedModalOpen] = useState(false);
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [activeTab, setActiveTab] = useState<'needs' | 'signups'>('needs');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  
  // Use AdminContext for notifications, but get current user from authService for profile data
  const { state: adminState, addNotification } = useAdmin();
  const currentUser = authService.getCurrentUser();
  const isAdmin = currentUser?.role === UserRole.ADMIN || currentUser?.role === UserRole.SUPER_ADMIN;

  // Load volunteer needs and user signups
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Load volunteer needs
        const needs = await volunteerService.getVolunteerNeeds();
        setVolunteerNeeds(needs);
        
        // Load user signups if logged in
        if (currentUser) {
          const signups = await volunteerService.getUserVolunteerSignups();
          setUserSignups(signups);
        }
        
        // Load all volunteer signups if admin
        if (isAdmin) {
          const allSignups = await volunteerService.getVolunteerSignups();
          setVolunteerSignups(allSignups);
        }
      } catch (error) {
        console.error('Error loading volunteer data:', error);
        if (isAdmin) {
          addNotification('error', 'Error', 'Failed to load volunteer data');
        }
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [currentUser, isAdmin, addNotification]);

  const categories = [
    { id: 'all', name: 'All Categories', color: 'bg-gray-100 text-gray-800' },
    { id: 'setup', name: 'Setup', color: 'bg-blue-100 text-blue-800' },
    { id: 'cleanup', name: 'Cleanup', color: 'bg-green-100 text-green-800' },
    { id: 'food', name: 'Food', color: 'bg-yellow-100 text-yellow-800' },
    { id: 'activity', name: 'Activity', color: 'bg-purple-100 text-purple-800' },
    { id: 'transportation', name: 'Transportation', color: 'bg-indigo-100 text-indigo-800' },
    { id: 'supervision', name: 'Supervision', color: 'bg-red-100 text-red-800' },
    { id: 'other', name: 'Other', color: 'bg-gray-100 text-gray-800' }
  ];

  const priorities = [
    { id: 'all', name: 'All Priorities', color: 'bg-gray-100 text-gray-800' },
    { id: 'low', name: 'Low', color: 'bg-green-100 text-green-800' },
    { id: 'medium', name: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
    { id: 'high', name: 'High', color: 'bg-orange-100 text-orange-800' },
    { id: 'urgent', name: 'Urgent', color: 'bg-red-100 text-red-800' }
  ];

  const filteredNeeds = volunteerNeeds.filter(need => {
    const matchesSearch = need.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         need.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         need.eventTitle.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = isAdmin ? 
      (filterCategory === 'all' || need.category === filterCategory) :
      (selectedCategory === 'all' || need.category === selectedCategory);
    const matchesPriority = isAdmin ? 
      (filterPriority === 'all' || need.priority === filterPriority) :
      (selectedPriority === 'all' || need.priority === selectedPriority);
    const matchesAvailability = !showOnlyAvailable || need.claimed < need.needed;
    
    return matchesSearch && matchesCategory && matchesPriority && matchesAvailability;
  });

  const filteredSignups = volunteerSignups.filter(signup => {
    const matchesSearch = signup.volunteerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         signup.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         signup.eventTitle.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || signup.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getPublicCategoryColor = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.color : 'bg-gray-100 text-gray-800';
  };

  const getPublicPriorityColor = (priorityId: string) => {
    const priority = priorities.find(p => p.id === priorityId);
    return priority ? priority.color : 'bg-gray-100 text-gray-800';
  };

  const getAvailabilityStatus = (need: VolunteerNeed) => {
    if (need.claimed >= need.needed) {
      return { status: 'full', color: 'text-red-600', icon: XCircle };
    } else if (need.claimed === 0) {
      return { status: 'open', color: 'text-green-600', icon: UserPlus };
    } else {
      return { status: 'partial', color: 'text-yellow-600', icon: AlertCircle };
    }
  };

  const getProgressPercentage = (claimed: number, needed: number) => {
    return Math.min((claimed / needed) * 100, 100);
  };

  // Admin helper functions
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'setup': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'food': return 'bg-green-100 text-green-700 border-green-200';
      case 'activities': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'supervision': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'transportation': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'cleanup': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-gray-100 text-gray-700';
      case 'medium': return 'bg-yellow-100 text-yellow-700';
      case 'high': return 'bg-orange-100 text-orange-700';
      case 'urgent': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'confirmed': return 'bg-green-100 text-green-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'setup': return '🔧';
      case 'food': return '🍽️';
      case 'activities': return '🎯';
      case 'supervision': return '👁️';
      case 'transportation': return '🚗';
      case 'cleanup': return '🧹';
      default: return '📋';
    }
  };

  const handleSignup = async (need: VolunteerNeed) => {
    try {
      if (!currentUser) {
        alert('Please log in to volunteer for events.');
        return;
      }

      // Check if user is already signed up
      const existingSignup = await volunteerService.isUserSignedUpForNeed(need.id);
      if (existingSignup) {
        alert('You are already signed up for this volunteer role.');
        return;
      }

      // Check if there are still spots available
      if (need.claimed >= need.needed) {
        alert('This volunteer role is full.');
        return;
      }

      // Get user information for signup
      const volunteerName = currentUser.displayName || currentUser.email || 'Anonymous';
      const volunteerEmail = currentUser.email || '';
      const volunteerPhone = currentUser.profile?.phone || '';
      
      const signupData = {
        needId: need.id,
        volunteerName,
        volunteerEmail,
        volunteerPhone,
        count: 1, // Default to 1 person
        notes: ''
      };

      await volunteerService.signUpForVolunteerNeed(signupData);
      
      // Refresh the data
      const needs = await volunteerService.getVolunteerNeeds();
      setVolunteerNeeds(needs);
      
      const signups = await volunteerService.getUserVolunteerSignups();
      setUserSignups(signups);
      
      alert(`Thank you for volunteering! You've been signed up for ${need.role} at ${need.eventTitle}.`);
    } catch (error) {
      console.error('Error signing up for volunteer need:', error);
      alert(`Error signing up: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const getUserSignupForNeed = (needId: string) => {
    return userSignups.find(signup => signup.needId === needId && signup.status !== 'cancelled');
  };

  // Admin management functions
  const handleCreateNeed = () => {
    setModalMode('create');
    setSelectedNeed(null);
    setIsNeedModalOpen(true);
  };

  const handleEditNeed = (need: VolunteerNeed) => {
    setModalMode('edit');
    setSelectedNeed(need);
    setIsNeedModalOpen(true);
  };

  const handleDeleteNeed = async (needId: string) => {
    if (window.confirm('Are you sure you want to delete this volunteer need? This action cannot be undone.')) {
      try {
        await volunteerService.deleteVolunteerNeed(needId);
        setVolunteerNeeds(prev => prev.filter(need => need.id !== needId));
        addNotification('success', 'Success', 'Volunteer need deleted successfully');
      } catch (error) {
        console.error('Error deleting volunteer need:', error);
        addNotification('error', 'Error', 'Failed to delete volunteer need');
      }
    }
  };

  const handleSaveNeed = async (needData: Omit<VolunteerNeed, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      if (modalMode === 'create') {
        const newNeedId = await volunteerService.createVolunteerNeed(needData);
        const newNeed: VolunteerNeed = {
          id: newNeedId,
          ...needData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        setVolunteerNeeds(prev => [...prev, newNeed]);
        addNotification('success', 'Success', 'Volunteer need created successfully');
      } else {
        await volunteerService.updateVolunteerNeed(selectedNeed!.id, needData);
        setVolunteerNeeds(prev => prev.map(need => 
          need.id === selectedNeed?.id 
            ? { ...need, ...needData, updatedAt: new Date().toISOString() }
            : need
        ));
        addNotification('success', 'Success', 'Volunteer need updated successfully');
      }
      setIsNeedModalOpen(false);
    } catch (error) {
      console.error(`Error ${modalMode === 'create' ? 'creating' : 'updating'} volunteer need:`, error);
      addNotification('error', 'Error', `Failed to ${modalMode} volunteer need`);
    }
  };

  const handleUpdateSignupStatus = async (signupId: string, status: 'pending' | 'confirmed' | 'cancelled') => {
    try {
      await volunteerService.updateVolunteerSignupStatus(signupId, status);
      setVolunteerSignups(prev => prev.map(signup => 
        signup.id === signupId 
          ? { ...signup, status, updatedAt: new Date().toISOString() }
          : signup
      ));
      addNotification('success', 'Success', 'Signup status updated successfully');
    } catch (error) {
      console.error('Error updating signup status:', error);
      addNotification('error', 'Error', 'Failed to update signup status');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-primary-50/30 to-secondary-50/30 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-48 bg-gray-200 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-primary-50/30 to-secondary-50/30 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-primary-100 to-secondary-100 text-primary-700 rounded-full text-sm font-medium mb-6">
            <Users className="w-4 h-4 mr-2" />
            {isAdmin ? 'Volunteer Management' : 'Volunteer Opportunities'}
          </div>
          
          <h1 className="text-4xl md:text-6xl font-display font-bold mb-6 text-gray-900">
            <span className="text-gradient">Scout Pack</span> Volunteers
          </h1>
          
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            {isAdmin 
              ? 'Manage volunteer opportunities, track signups, and ensure all events have the support they need to be successful.'
              : 'Our Scout Pack thrives because of our amazing volunteers! Find opportunities to help with events, activities, and pack operations. Every contribution makes a difference.'
            }
          </p>
        </div>

        {/* Admin Quick Stats */}
        {isAdmin && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="text-center p-6 bg-white/90 backdrop-blur-sm rounded-2xl border border-white/50">
              <Users className="w-8 h-8 text-primary-500 mx-auto mb-3" />
              <div className="text-2xl font-bold text-gray-900">{volunteerNeeds.length}</div>
              <div className="text-sm text-gray-600">Volunteer Needs</div>
            </div>
            
            <div className="text-center p-6 bg-white/90 backdrop-blur-sm rounded-2xl border border-white/50">
              <UserCheck className="w-8 h-8 text-secondary-500 mx-auto mb-3" />
              <div className="text-2xl font-bold text-gray-900">{volunteerSignups.length}</div>
              <div className="text-sm text-gray-600">Total Signups</div>
            </div>
            
            <div className="text-center p-6 bg-white/90 backdrop-blur-sm rounded-2xl border border-white/50">
              <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-3" />
              <div className="text-2xl font-bold text-gray-900">
                {volunteerSignups.filter(s => s.status === 'confirmed').length}
              </div>
              <div className="text-sm text-gray-600">Confirmed</div>
            </div>
            
            <div className="text-center p-6 bg-white/90 backdrop-blur-sm rounded-2xl border border-white/50">
              <AlertCircle className="w-8 h-8 text-orange-500 mx-auto mb-3" />
              <div className="text-2xl font-bold text-gray-900">
                {volunteerNeeds.filter(n => n.claimed < n.needed).length}
              </div>
              <div className="text-sm text-gray-600">Needs Help</div>
            </div>
          </div>
        )}

        {/* Admin Tabs */}
        {isAdmin && (
          <div className="flex space-x-1 bg-white/90 backdrop-blur-sm rounded-2xl p-1 mb-8 border border-white/50">
            <button
              onClick={() => setActiveTab('needs')}
              className={`flex-1 px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                activeTab === 'needs'
                  ? 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white shadow-glow-primary/50'
                  : 'text-gray-600 hover:text-primary-600 hover:bg-primary-50/50'
              }`}
            >
              <Users className="w-4 h-4 inline mr-2" />
              Volunteer Needs
            </button>
            <button
              onClick={() => setActiveTab('signups')}
              className={`flex-1 px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                activeTab === 'signups'
                  ? 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white shadow-glow-primary/50'
                  : 'text-gray-600 hover:text-primary-600 hover:bg-primary-50/50'
              }`}
            >
              <UserCheck className="w-4 h-4 inline mr-2" />
              Volunteer Signups
            </button>
          </div>
        )}

        {/* Admin Controls */}
        {isAdmin && activeTab === 'needs' && (
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <button
              onClick={handleCreateNeed}
              className="flex items-center justify-center px-6 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-medium rounded-xl hover:from-primary-600 hover:to-secondary-600 transition-all duration-200 transform hover:scale-105"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Volunteer Need
            </button>
          </div>
        )}

        {/* Search and Filters */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 border border-white/50 shadow-soft mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Search */}
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                Search {isAdmin ? (activeTab === 'needs' ? 'volunteer needs' : 'signups') : 'opportunities'}
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  id="search"
                  placeholder={isAdmin ? 
                    (activeTab === 'needs' ? 'Search by role, event, or description...' : 'Search by volunteer name, role, or event...') :
                    'Search by role, event, or description...'
                  }
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white/80 backdrop-blur-sm transition-all duration-200"
                />
              </div>
            </div>

            {/* Category Filter */}
            {(!isAdmin || activeTab === 'needs') && (
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  id="category"
                  value={isAdmin ? filterCategory : selectedCategory}
                  onChange={(e) => isAdmin ? setFilterCategory(e.target.value) : setSelectedCategory(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white/80 backdrop-blur-sm transition-all duration-200"
                >
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Priority Filter */}
            {(!isAdmin || activeTab === 'needs') && (
              <div>
                <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-2">
                  Priority
                </label>
                <select
                  id="priority"
                  value={isAdmin ? filterPriority : selectedPriority}
                  onChange={(e) => isAdmin ? setFilterPriority(e.target.value) : setSelectedPriority(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white/80 backdrop-blur-sm transition-all duration-200"
                >
                  {priorities.map(priority => (
                    <option key={priority.id} value={priority.id}>
                      {priority.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Status Filter (Admin only, signups tab) */}
            {isAdmin && activeTab === 'signups' && (
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  id="status"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white/80 backdrop-blur-sm transition-all duration-200"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            )}

            {/* Availability Filter (Public only) */}
            {!isAdmin && (
              <div className="flex items-end">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={showOnlyAvailable}
                    onChange={(e) => setShowOnlyAvailable(e.target.checked)}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Show only available</span>
                </label>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        {isAdmin && activeTab === 'signups' ? (
          /* Admin Signups View */
          <div className="space-y-4 mb-8">
            {filteredSignups.map((signup) => (
              <div
                key={signup.id}
                className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-soft"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-secondary-400 to-accent-500 rounded-xl flex items-center justify-center shadow-glow">
                        <UserCheck className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-display font-semibold text-gray-900">
                          {signup.volunteerName}
                        </h3>
                        <p className="text-gray-600">{signup.volunteerEmail}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-1">Event</h4>
                        <p className="text-gray-900">{signup.eventTitle}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-1">Role</h4>
                        <p className="text-gray-900">{signup.role}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-1">Status</h4>
                        <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(signup.status)}`}>
                          {signup.status === 'pending' && <Clock className="w-3 h-3 mr-1" />}
                          {signup.status === 'confirmed' && <CheckCircle className="w-3 h-3 mr-1" />}
                          {signup.status === 'cancelled' && <AlertCircle className="w-3 h-3 mr-1" />}
                          {signup.status}
                        </div>
                      </div>
                    </div>
                    
                    {signup.notes && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-1">Notes</h4>
                        <p className="text-gray-600 text-sm">{signup.notes}</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col space-y-2 ml-6">
                    <select
                      value={signup.status}
                      onChange={(e) => handleUpdateSignupStatus(signup.id, e.target.value as any)}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                    
                    <button
                      onClick={() => {
                        setSelectedSignup(signup);
                        setIsSignupModalOpen(true);
                      }}
                      className="flex items-center justify-center px-3 py-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors duration-200"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Volunteer Needs Grid (Public or Admin Needs Tab) */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {filteredNeeds.map((need) => {
              const availability = getAvailabilityStatus(need);
              const userSignup = getUserSignupForNeed(need.id);
              const isUserSignedUp = !!userSignup;
              const progressPercentage = getProgressPercentage(need.claimed, need.needed);

              return (
                <div key={need.id} className={`bg-white/90 backdrop-blur-sm rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 border border-white/50 shadow-soft ${!need.isActive ? 'opacity-60' : ''}`}>
                  <div className="p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center flex-1">
                        <Users className="h-5 w-5 text-primary-600 mr-2" />
                        <h3 className="text-lg font-semibold text-gray-800 flex-1">{need.role}</h3>
                      </div>
                      <div className="ml-2 flex items-center space-x-2">
                        {React.createElement(availability.icon, { 
                          className: `h-5 w-5 ${availability.color}` 
                        })}
                        {/* Admin Edit/Delete buttons */}
                        {isAdmin && (
                          <>
                            <button
                              onClick={() => handleEditNeed(need)}
                              className="p-1 text-gray-400 hover:text-primary-500 hover:bg-primary-50 rounded transition-colors duration-200"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteNeed(need.id)}
                              className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors duration-200"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Event Info */}
                    <div className="mb-4">
                      <h4 className="font-medium text-gray-800 mb-2">{need.eventTitle}</h4>
                      <div className="flex items-center text-sm text-gray-600 mb-1">
                        <Calendar className="h-4 w-4 mr-1" />
                        {new Date(need.eventDate).toLocaleDateString()}
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-gray-600 mb-4">{need.description}</p>

                    {/* Category and Priority */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isAdmin ? getCategoryColor(need.category) : getPublicCategoryColor(need.category)}`}>
                        {categories.find(c => c.id === need.category)?.name}
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isAdmin ? getPriorityColor(need.priority) : getPublicPriorityColor(need.priority)}`}>
                        {priorities.find(p => p.id === need.priority)?.name}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Volunteers: {need.claimed}/{need.needed}</span>
                        <span>{Math.round(progressPercentage)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all ${
                            progressPercentage >= 100 ? 'bg-red-500' : 
                            progressPercentage >= 75 ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${progressPercentage}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* User Signup Status */}
                    {isUserSignedUp && (
                      <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl">
                        <div className="flex items-center">
                          <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                          <span className="text-sm font-medium text-green-800">
                            You're signed up for this role!
                          </span>
                        </div>
                        <p className="text-xs text-green-600 mt-1">
                          Status: {userSignup.status} • Count: {userSignup.count}
                        </p>
                      </div>
                    )}

                    {/* Show who is signed up (for non-signed-up users) */}
                    {!isUserSignedUp && need.claimed > 0 && (
                      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-xl">
                        <div className="flex items-center mb-2">
                          <Users className="h-4 w-4 text-blue-600 mr-2" />
                          <span className="text-sm font-medium text-blue-800">
                            Current Volunteers:
                          </span>
                        </div>
                        <div className="text-xs text-blue-600">
                          {need.claimed} volunteer{need.claimed !== 1 ? 's' : ''} signed up
                        </div>
                      </div>
                    )}

                    {/* Action Button */}
                    <div className="flex space-x-2">
                      {need.claimed >= need.needed ? (
                        <button
                          disabled
                          className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-xl text-gray-400 bg-gray-100 cursor-not-allowed"
                        >
                          <UserCheck className="h-4 w-4 mr-2" />
                          Full
                        </button>
                      ) : isUserSignedUp ? (
                        <button
                          disabled
                          className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-green-300 text-sm font-medium rounded-xl text-green-600 bg-green-50 cursor-not-allowed"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Signed Up
                        </button>
                      ) : (
                        <button
                          onClick={() => handleSignup(need)}
                          className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-xl text-white bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-200 shadow-lg hover:shadow-xl"
                        >
                          <UserPlus className="h-4 w-4 mr-2" />
                          Sign Up
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* No Results */}
        {((isAdmin && activeTab === 'signups' && filteredSignups.length === 0) || 
          (!isAdmin && filteredNeeds.length === 0) ||
          (isAdmin && activeTab === 'needs' && filteredNeeds.length === 0)) && (
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-800">
              {isAdmin && activeTab === 'signups' ? 'No volunteer signups found' : 'No volunteer opportunities found'}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || selectedCategory !== 'all' || selectedPriority !== 'all' || showOnlyAvailable || filterStatus !== 'all'
                ? 'Try adjusting your search or filters.'
                : isAdmin && activeTab === 'signups' 
                  ? 'No volunteer signups are currently available.'
                  : 'No volunteer opportunities are currently available.'}
            </p>
          </div>
        )}

        {/* Call to Action (Public only) */}
        {!isAdmin && (
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 text-center border border-white/50 shadow-soft">
            <h2 className="text-2xl font-display font-bold text-gray-800 mb-4">Ready to Make a Difference?</h2>
            <p className="text-lg text-gray-600 mb-6 max-w-2xl mx-auto">
              Volunteering with our Scout Pack is a great way to get involved, meet other families, 
              and help create amazing experiences for our scouts. Every role is important!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-200 shadow-lg hover:shadow-xl">
                <Users className="h-5 w-5 mr-2" />
                View All Opportunities
              </button>
              <button className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-xl text-gray-700 bg-white/80 backdrop-blur-sm hover:bg-white/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-200 shadow-soft">
                <Calendar className="h-5 w-5 mr-2" />
                Contact Pack Leadership
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Need Modal */}
      {isNeedModalOpen && (
        <VolunteerNeedModal
          mode={modalMode}
          need={selectedNeed}
          onSave={handleSaveNeed}
          onClose={() => setIsNeedModalOpen(false)}
        />
      )}

      {/* Signup Details Modal */}
      {isSignupModalOpen && selectedSignup && (
        <SignupDetailsModal
          signup={selectedSignup}
          onClose={() => setIsSignupModalOpen(false)}
        />
      )}
    </div>
  );
};

// Volunteer Need Modal Component
interface VolunteerNeedModalProps {
  mode: 'create' | 'edit';
  need: VolunteerNeed | null;
  onSave: (data: Omit<VolunteerNeed, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onClose: () => void;
}

const VolunteerNeedModal: React.FC<VolunteerNeedModalProps> = ({ mode, need, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    eventId: need?.eventId || '',
    eventTitle: need?.eventTitle || '',
    eventDate: need?.eventDate || '',
    role: need?.role || '',
    description: need?.description || '',
    needed: need?.needed || 1,
    claimed: need?.claimed || 0,
    category: need?.category || 'setup',
    priority: need?.priority || 'medium',
    isActive: need?.isActive ?? true
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-display font-semibold text-gray-900">
            {mode === 'create' ? 'Create Volunteer Need' : 'Edit Volunteer Need'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Event Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Event ID *
              </label>
              <input
                type="text"
                required
                value={formData.eventId}
                onChange={(e) => setFormData(prev => ({ ...prev, eventId: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="event-123"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Event Title *
              </label>
              <input
                type="text"
                required
                value={formData.eventTitle}
                onChange={(e) => setFormData(prev => ({ ...prev, eventTitle: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Fall Campout 2025"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Event Date *
              </label>
              <input
                type="date"
                required
                value={formData.eventDate}
                onChange={(e) => setFormData(prev => ({ ...prev, eventDate: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Role Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role Title *
              </label>
              <input
                type="text"
                required
                value={formData.role}
                onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Check-in Coordinator"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Number Needed *
              </label>
              <input
                type="number"
                required
                min="1"
                value={formData.needed}
                onChange={(e) => setFormData(prev => ({ ...prev, needed: parseInt(e.target.value) }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              required
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Describe what this volunteer will be doing..."
            />
          </div>

          {/* Category and Priority */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <select
                required
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as any }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="setup">Setup</option>
                <option value="food">Food</option>
                <option value="activity">Activity</option>
                <option value="supervision">Supervision</option>
                <option value="transportation">Transportation</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority *
              </label>
              <select
                required
                value={formData.priority}
                onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as any }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          {/* Active Status */}
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
              This volunteer need is active and visible to users
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-primary-500 text-white font-medium rounded-xl hover:bg-primary-600 transition-colors duration-200"
            >
              {mode === 'create' ? 'Create Need' : 'Update Need'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Signup Details Modal Component
interface SignupDetailsModalProps {
  signup: VolunteerSignup;
  onClose: () => void;
}

const SignupDetailsModal: React.FC<SignupDetailsModalProps> = ({ signup, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-display font-semibold text-gray-900">
            Volunteer Signup Details
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
          >
            ✕
          </button>
        </div>

        <div className="space-y-6">
          {/* Volunteer Info */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Volunteer Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <p className="text-gray-900">{signup.volunteerName}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <p className="text-gray-900">{signup.volunteerEmail}</p>
              </div>
              {signup.volunteerPhone && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <p className="text-gray-900">{signup.volunteerPhone}</p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  signup.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                  signup.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {signup.status}
                </div>
              </div>
            </div>
          </div>

          {/* Event Info */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Event Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Event</label>
                <p className="text-gray-900">{signup.eventTitle}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <p className="text-gray-900">{signup.role}</p>
              </div>
            </div>
          </div>

          {/* Notes */}
          {signup.notes && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Notes</h3>
              <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">{signup.notes}</p>
            </div>
          )}

          {/* Timestamps */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Timeline</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Signed Up</label>
                <p className="text-gray-900">{new Date(signup.createdAt).toLocaleString()}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Updated</label>
                <p className="text-gray-900">{new Date(signup.updatedAt).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end pt-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-primary-500 text-white font-medium rounded-xl hover:bg-primary-600 transition-colors duration-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default VolunteerPage;
