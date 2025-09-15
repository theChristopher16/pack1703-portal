import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Calendar, 
  UserCheck, 
  UserPlus, 
  Search, 
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { volunteerService, VolunteerNeed, VolunteerSignup } from '../services/volunteerService';
import { authService } from '../services/authService';
import { useAdmin } from '../contexts/AdminContext';

const VolunteerPage: React.FC = () => {
  const [volunteerNeeds, setVolunteerNeeds] = useState<VolunteerNeed[]>([]);
  const [userSignups, setUserSignups] = useState<VolunteerSignup[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(false);
  
  // Use AdminContext instead of direct auth service
  const { state: adminState } = useAdmin();
  const currentUser = adminState.currentUser;

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
      } catch (error) {
        console.error('Error loading volunteer data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [currentUser]);

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
    
    const matchesCategory = selectedCategory === 'all' || need.category === selectedCategory;
    const matchesPriority = selectedPriority === 'all' || need.priority === selectedPriority;
    const matchesAvailability = !showOnlyAvailable || need.claimed < need.needed;
    
    return matchesSearch && matchesCategory && matchesPriority && matchesAvailability;
  });

  const getCategoryColor = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.color : 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priorityId: string) => {
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
      
      const signupData = {
        needId: need.id,
        volunteerName,
        volunteerEmail,
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
          <h1 className="text-4xl font-display font-bold text-gray-800 mb-4">Volunteer Opportunities</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Our Scout Pack thrives because of our amazing volunteers! Find opportunities to help with events, 
            activities, and pack operations. Every contribution makes a difference.
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 border border-white/50 shadow-soft mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Search */}
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                Search Opportunities
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  id="search"
                  placeholder="Search by role, event, or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white/80 backdrop-blur-sm transition-all duration-200"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                id="category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white/80 backdrop-blur-sm transition-all duration-200"
              >
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority Filter */}
            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-2">
                Priority
              </label>
              <select
                id="priority"
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white/80 backdrop-blur-sm transition-all duration-200"
              >
                {priorities.map(priority => (
                  <option key={priority.id} value={priority.id}>
                    {priority.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Availability Filter */}
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
          </div>
        </div>

        {/* Volunteer Needs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {filteredNeeds.map((need) => {
            const availability = getAvailabilityStatus(need);
            const userSignup = getUserSignupForNeed(need.id);
            const isUserSignedUp = !!userSignup;
            const progressPercentage = getProgressPercentage(need.claimed, need.needed);

            return (
              <div key={need.id} className="bg-white/90 backdrop-blur-sm rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 border border-white/50 shadow-soft">
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center flex-1">
                      <Users className="h-5 w-5 text-primary-600 mr-2" />
                      <h3 className="text-lg font-semibold text-gray-800 flex-1">{need.role}</h3>
                    </div>
                    <div className="ml-2">
                      {React.createElement(availability.icon, { 
                        className: `h-5 w-5 ${availability.color}` 
                      })}
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
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(need.category)}`}>
                      {categories.find(c => c.id === need.category)?.name}
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(need.priority)}`}>
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

        {/* No Results */}
        {filteredNeeds.length === 0 && (
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-800">No volunteer opportunities found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || selectedCategory !== 'all' || selectedPriority !== 'all' || showOnlyAvailable
                ? 'Try adjusting your search or filters.'
                : 'No volunteer opportunities are currently available.'}
            </p>
          </div>
        )}

        {/* Call to Action */}
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
      </div>
    </div>
  );
};

export default VolunteerPage;
