import React, { useState, useEffect } from 'react';
import { useAdmin } from '../contexts/AdminContext';
import { Users, Calendar, MapPin, Clock, UserCheck, UserPlus, Search, Filter, Tag, AlertCircle, CheckCircle, Plus, Edit, Trash2, Eye } from 'lucide-react';

interface VolunteerNeed {
  id: string;
  eventId: string;
  eventTitle: string;
  role: string;
  description: string;
  needed: number;
  claimed: number;
  category: 'setup' | 'food' | 'activity' | 'supervision' | 'transportation' | 'other';
  priority: 'low' | 'medium' | 'high' | 'critical';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface VolunteerSignup {
  id: string;
  needId: string;
  eventId: string;
  eventTitle: string;
  role: string;
  volunteerName: string;
  volunteerEmail: string;
  volunteerPhone?: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

const AdminVolunteer: React.FC = () => {
  const { addNotification } = useAdmin();
  const [volunteerNeeds, setVolunteerNeeds] = useState<VolunteerNeed[]>([]);
  const [volunteerSignups, setVolunteerSignups] = useState<VolunteerSignup[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNeed, setSelectedNeed] = useState<VolunteerNeed | null>(null);
  const [selectedSignup, setSelectedSignup] = useState<VolunteerSignup | null>(null);
  const [isNeedModalOpen, setIsNeedModalOpen] = useState(false);
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [activeTab, setActiveTab] = useState<'needs' | 'signups'>('needs');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Mock data for now - will be replaced with Firebase calls
  useEffect(() => {
    const mockNeeds: VolunteerNeed[] = [
      {
        id: '1',
        eventId: 'event-1',
        eventTitle: 'Fall Campout 2025',
        role: 'Check-in Coordinator',
        description: 'Help families check in upon arrival, distribute materials, and answer questions.',
        needed: 2,
        claimed: 1,
        category: 'setup',
        priority: 'high',
        isActive: true,
        createdAt: '2024-01-01T00:00:00',
        updatedAt: '2024-01-01T00:00:00'
      },
      {
        id: '2',
        eventId: 'event-1',
        eventTitle: 'Fall Campout 2025',
        role: 'Food Coordinator',
        description: 'Organize meal preparation, coordinate with families bringing food, and ensure dietary needs are met.',
        needed: 1,
        claimed: 0,
        category: 'food',
        priority: 'high',
        isActive: true,
        createdAt: '2024-01-15T00:00:00',
        updatedAt: '2024-01-15T00:00:00'
      },
      {
        id: '3',
        eventId: 'event-2',
        eventTitle: 'Pinewood Derby 2026',
        role: 'Race Official',
        description: 'Help run the races, record times, and ensure fair competition.',
        needed: 2,
        claimed: 0,
        category: 'supervision',
        priority: 'critical',
        isActive: true,
        createdAt: '2024-02-01T00:00:00',
        updatedAt: '2024-02-01T00:00:00'
      }
    ];

    const mockSignups: VolunteerSignup[] = [
      {
        id: '1',
        needId: '1',
        eventId: 'event-1',
        eventTitle: 'Fall Campout 2025',
        role: 'Check-in Coordinator',
        volunteerName: 'John Smith',
        volunteerEmail: 'john.smith@email.com',
        volunteerPhone: '555-0123',
        status: 'confirmed',
        notes: 'Available all day Saturday',
        createdAt: '2024-01-05T00:00:00',
        updatedAt: '2024-01-05T00:00:00'
      },
      {
        id: '2',
        needId: '2',
        eventId: 'event-1',
        eventTitle: 'Fall Campout 2025',
        role: 'Food Coordinator',
        volunteerName: 'Sarah Johnson',
        volunteerEmail: 'sarah.j@email.com',
        status: 'pending',
        createdAt: '2024-01-20T00:00:00',
        updatedAt: '2024-01-20T00:00:00'
      }
    ];

    setVolunteerNeeds(mockNeeds);
    setVolunteerSignups(mockSignups);
    setLoading(false);
  }, []);

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
        // TODO: Replace with actual Firebase call
        setVolunteerNeeds(prev => prev.filter(need => need.id !== needId));
        addNotification('success', 'Success', 'Volunteer need deleted successfully');
      } catch (error) {
        addNotification('error', 'Error', 'Failed to delete volunteer need');
      }
    }
  };

  const handleSaveNeed = async (needData: Omit<VolunteerNeed, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      if (modalMode === 'create') {
        // TODO: Replace with actual Firebase call
        const newNeed: VolunteerNeed = {
          ...needData,
          id: Date.now().toString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        setVolunteerNeeds(prev => [...prev, newNeed]);
        addNotification('success', 'Success', 'Volunteer need created successfully');
      } else {
        // TODO: Replace with actual Firebase call
        setVolunteerNeeds(prev => prev.map(need => 
          need.id === selectedNeed?.id 
            ? { ...need, ...needData, updatedAt: new Date().toISOString() }
            : need
        ));
        await addNotification('success', 'Success', 'Volunteer need updated successfully');
      }
      setIsNeedModalOpen(false);
    } catch (error) {
      await addNotification('error', 'Error', `Failed to ${modalMode} volunteer need`);
    }
  };

  const handleUpdateSignupStatus = async (signupId: string, status: 'pending' | 'confirmed' | 'cancelled') => {
    try {
      // TODO: Replace with actual Firebase call
      setVolunteerSignups(prev => prev.map(signup => 
        signup.id === signupId 
          ? { ...signup, status, updatedAt: new Date().toISOString() }
          : signup
      ));
      await addNotification('success', 'Success', 'Signup status updated successfully');
    } catch (error) {
      await addNotification('error', 'Error', 'Failed to update signup status');
    }
  };

  const filteredNeeds = volunteerNeeds.filter(need => {
    const matchesSearch = need.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         need.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         need.eventTitle.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || need.category === filterCategory;
    const matchesPriority = filterPriority === 'all' || need.priority === filterPriority;
    return matchesSearch && matchesCategory && matchesPriority;
  });

  const filteredSignups = volunteerSignups.filter(signup => {
    const matchesSearch = signup.volunteerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         signup.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         signup.eventTitle.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || signup.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'setup': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'food': return 'bg-green-100 text-green-700 border-green-200';
      case 'activity': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'supervision': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'transportation': return 'bg-orange-100 text-orange-700 border-orange-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-gray-100 text-gray-700';
      case 'medium': return 'bg-yellow-100 text-yellow-700';
      case 'high': return 'bg-orange-100 text-orange-700';
      case 'critical': return 'bg-red-100 text-red-700';
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
      case 'activity': return '🎯';
      case 'supervision': return '👁️';
      case 'transportation': return '🚗';
      default: return '📋';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-primary-50/30 to-secondary-50/30 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Loading Volunteer Management...</h2>
          <p className="text-gray-600">Please wait while we fetch the latest data.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-primary-50/30 to-secondary-50/30 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-primary-100 to-secondary-100 text-primary-700 rounded-full text-sm font-medium mb-6">
            <Users className="w-4 h-4 mr-2" />
            Volunteer Management
          </div>
          
          <h1 className="text-4xl md:text-6xl font-display font-bold mb-6 text-gray-900">
            <span className="text-gradient">Scout Pack</span> Volunteers
          </h1>
          
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Manage volunteer opportunities, track signups, and ensure all events have the support they need to be successful.
          </p>
        </div>

        {/* Quick Stats */}
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

        {/* Tabs */}
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

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          {activeTab === 'needs' && (
            <button
              onClick={handleCreateNeed}
              className="flex items-center justify-center px-6 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-medium rounded-xl hover:from-primary-600 hover:to-secondary-600 transition-all duration-200 transform hover:scale-105"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Volunteer Need
            </button>
          )}
          
          <div className="flex-1 flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder={`Search ${activeTab === 'needs' ? 'volunteer needs' : 'signups'}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            
            {activeTab === 'needs' ? (
              <>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="all">All Categories</option>
                  <option value="setup">Setup</option>
                  <option value="food">Food</option>
                  <option value="activity">Activity</option>
                  <option value="supervision">Supervision</option>
                  <option value="transportation">Transportation</option>
                  <option value="other">Other</option>
                </select>
                
                <select
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                  className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="all">All Priorities</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </>
            ) : (
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            )}
          </div>
        </div>

        {/* Content */}
        {activeTab === 'needs' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredNeeds.map((need) => (
              <div
                key={need.id}
                className={`bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-soft transition-all duration-200 hover:shadow-lg ${
                  !need.isActive ? 'opacity-60' : ''
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-secondary-500 rounded-xl flex items-center justify-center shadow-glow">
                        <Users className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-display font-semibold text-gray-900">
                          {need.role}
                        </h3>
                        <div className="flex items-center space-x-2 mt-1">
                          <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getCategoryColor(need.category)}`}>
                            <span className="mr-1">{getCategoryIcon(need.category)}</span>
                            {need.category}
                          </div>
                          <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(need.priority)}`}>
                            {need.priority}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <h4 className="text-lg font-medium text-gray-800 mb-2">{need.eventTitle}</h4>
                    <p className="text-gray-600 text-sm mb-3">{need.description}</p>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEditNeed(need)}
                      className="p-2 text-gray-400 hover:text-primary-500 hover:bg-primary-50 rounded-lg transition-colors duration-200"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteNeed(need.id)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors duration-200"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Progress */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-600">Volunteers</span>
                    <span className="font-medium text-gray-900">
                      {need.claimed} / {need.needed}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        need.claimed >= need.needed
                          ? 'bg-green-500'
                          : need.claimed >= need.needed * 0.5
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.min((need.claimed / need.needed) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${need.isActive ? 'bg-green-400' : 'bg-gray-400'}`}></div>
                    <span className="text-xs text-gray-500">
                      {need.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  
                  <div className="text-xs text-gray-500">
                    Updated {new Date(need.updatedAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
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
        )}

        {/* No Results */}
        {((activeTab === 'needs' && filteredNeeds.length === 0) || 
          (activeTab === 'signups' && filteredSignups.length === 0)) && (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-500 mb-2">No {activeTab} found</h3>
            <p className="text-gray-400">Try adjusting your search terms or filters.</p>
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
                <option value="critical">Critical</option>
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

export default AdminVolunteer;
