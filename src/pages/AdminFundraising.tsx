import React, { useState, useEffect } from 'react';
import { useAdmin } from '../contexts/AdminContext';
import { 
  DollarSign, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Filter, 
  Calendar, 
  Users, 
  Target, 
  TrendingUp,
  BarChart3,
  Gift,
  Award,
  Activity,
  CheckCircle,
  AlertCircle,
  Clock
} from 'lucide-react';
import { firestoreService } from '../services/firestore';

interface FundraisingCampaign {
  id: string;
  name: string;
  description: string;
  goal: number;
  currentAmount: number;
  startDate: string;
  endDate: string;
  status: 'active' | 'completed' | 'upcoming' | 'paused';
  type: 'popcorn' | 'camping' | 'general' | 'event' | 'donation';
  participants: number;
  maxParticipants?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface FundraisingDonation {
  id: string;
  campaignId: string;
  donorName: string;
  amount: number;
  message?: string;
  isAnonymous: boolean;
  paymentMethod: 'cash' | 'check' | 'online' | 'card';
  status: 'pending' | 'completed' | 'failed';
  createdAt: string;
}

const AdminFundraising: React.FC = () => {
  const { addNotification } = useAdmin();
  const [campaigns, setCampaigns] = useState<FundraisingCampaign[]>([]);
  const [donations, setDonations] = useState<FundraisingDonation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCampaign, setSelectedCampaign] = useState<FundraisingCampaign | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [activeTab, setActiveTab] = useState<'campaigns' | 'donations' | 'analytics'>('campaigns');

  // Fetch fundraising data from database
  useEffect(() => {
    const fetchFundraisingData = async () => {
      try {
        setLoading(true);
        // TODO: Add fundraising service methods to firestoreService
        // const campaignsData = await firestoreService.getFundraisingCampaigns();
        // const donationsData = await firestoreService.getFundraisingDonations();
        
        // For now, set empty arrays until service methods are implemented
        setCampaigns([]);
        setDonations([]);
      } catch (error) {
        console.error('Error fetching fundraising data:', error);
        setCampaigns([]);
        setDonations([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchFundraisingData();
  }, []);

  const handleCreateCampaign = () => {
    setModalMode('create');
    setSelectedCampaign(null);
    setIsModalOpen(true);
  };

  const handleEditCampaign = (campaign: FundraisingCampaign) => {
    setModalMode('edit');
    setSelectedCampaign(campaign);
    setIsModalOpen(true);
  };

  const handleDeleteCampaign = async (campaignId: string) => {
    if (window.confirm('Are you sure you want to delete this fundraising campaign?')) {
      try {
        setCampaigns(prev => prev.filter(c => c.id !== campaignId));
        addNotification('success', 'Campaign Deleted', 'Fundraising campaign has been successfully deleted.');
      } catch (error) {
        addNotification('error', 'Delete Failed', 'Failed to delete campaign. Please try again.');
      }
    }
  };

  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         campaign.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || campaign.status === filterStatus;
    const matchesType = filterType === 'all' || campaign.type === filterType;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusColor = (status: string) => {
    const colors = {
      active: 'bg-green-100 text-green-800 border-green-200',
      completed: 'bg-blue-100 text-blue-800 border-blue-200',
      upcoming: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      paused: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[status as keyof typeof colors] || colors.active;
  };

  const getTypeColor = (type: string) => {
    const colors = {
      popcorn: 'bg-orange-100 text-orange-800',
      camping: 'bg-green-100 text-green-800',
      general: 'bg-blue-100 text-blue-800',
      event: 'bg-purple-100 text-purple-800',
      donation: 'bg-red-100 text-red-800'
    };
    return colors[type as keyof typeof colors] || colors.general;
  };

  const getProgressPercentage = (current: number, goal: number) => {
    return Math.min((current / goal) * 100, 100);
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-green-500';
    if (percentage >= 75) return 'bg-blue-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const totalRaised = campaigns.reduce((sum, campaign) => sum + campaign.currentAmount, 0);
  const totalGoal = campaigns.reduce((sum, campaign) => sum + campaign.goal, 0);
  const activeCampaigns = campaigns.filter(c => c.status === 'active').length;
  const totalDonations = donations.length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-gray-50/30 to-gray-100/30 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading fundraising data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50/30 to-gray-100/30 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-display font-bold text-gray-900 mb-4">
            Fundraising Management
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl">
            Manage fundraising campaigns, track donations, and monitor financial goals
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-2xl p-6 shadow-soft">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Total Raised</p>
                <p className="text-3xl font-bold">${totalRaised.toLocaleString()}</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-200" />
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl p-6 shadow-soft">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Goal Progress</p>
                <p className="text-3xl font-bold">{Math.round((totalRaised / totalGoal) * 100)}%</p>
              </div>
              <Target className="w-8 h-8 text-blue-200" />
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-2xl p-6 shadow-soft">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Active Campaigns</p>
                <p className="text-3xl font-bold">{activeCampaigns}</p>
              </div>
              <Activity className="w-8 h-8 text-purple-200" />
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-2xl p-6 shadow-soft">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm font-medium">Total Donations</p>
                <p className="text-3xl font-bold">{totalDonations}</p>
              </div>
              <Gift className="w-8 h-8 text-orange-200" />
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/50 shadow-soft p-2 mb-8">
          <div className="flex space-x-1">
            <button
              onClick={() => setActiveTab('campaigns')}
              className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all duration-200 ${
                activeTab === 'campaigns'
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-soft'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Target className="w-4 h-4" />
                Campaigns
              </div>
            </button>
            <button
              onClick={() => setActiveTab('donations')}
              className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all duration-200 ${
                activeTab === 'donations'
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-soft'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Gift className="w-4 h-4" />
                Donations
              </div>
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all duration-200 ${
                activeTab === 'analytics'
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-soft'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Analytics
              </div>
            </button>
          </div>
        </div>

        {/* Campaigns Tab */}
        {activeTab === 'campaigns' && (
          <>
            {/* Controls */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/50 shadow-soft p-6 mb-8">
              <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                <div className="flex flex-col sm:flex-row gap-4 flex-1">
                  {/* Search */}
                  <div className="relative flex-1 max-w-md">
                    <input
                      type="text"
                      placeholder="Search campaigns..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 backdrop-blur-sm"
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>

                  {/* Status Filter */}
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 backdrop-blur-sm"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="upcoming">Upcoming</option>
                    <option value="paused">Paused</option>
                  </select>

                  {/* Type Filter */}
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 backdrop-blur-sm"
                  >
                    <option value="all">All Types</option>
                    <option value="popcorn">Popcorn</option>
                    <option value="camping">Camping</option>
                    <option value="general">General</option>
                    <option value="event">Event</option>
                    <option value="donation">Donation</option>
                  </select>
                </div>

                {/* Create Button */}
                <button
                  onClick={handleCreateCampaign}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center gap-2 shadow-soft"
                >
                  <Plus className="h-4 w-4" />
                  Create Campaign
                </button>
              </div>
            </div>

            {/* Campaigns Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCampaigns.map((campaign) => (
                <div key={campaign.id} className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/50 shadow-soft overflow-hidden hover:shadow-lg transition-all duration-200 hover:scale-[1.02]">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">{campaign.name}</h3>
                      <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(campaign.status)}`}>
                        {campaign.status}
                      </span>
                    </div>

                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">{campaign.description}</p>

                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700">
                          ${campaign.currentAmount.toLocaleString()} / ${campaign.goal.toLocaleString()}
                        </span>
                        <span className="text-sm text-gray-600">
                          {Math.round(getProgressPercentage(campaign.currentAmount, campaign.goal))}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${getProgressColor(getProgressPercentage(campaign.currentAmount, campaign.goal))}`}
                          style={{ width: `${getProgressPercentage(campaign.currentAmount, campaign.goal)}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="space-y-3 text-sm mb-4">
                      <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
                        <Calendar className="h-4 w-4 text-blue-600" />
                        <span className="text-gray-700">
                          {new Date(campaign.startDate).toLocaleDateString()} - {new Date(campaign.endDate).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 p-2 bg-green-50 rounded-lg">
                        <Users className="h-4 w-4 text-green-600" />
                        <span className="text-gray-700">
                          {campaign.participants} participants
                          {campaign.maxParticipants && ` / ${campaign.maxParticipants} max`}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 p-2 bg-purple-50 rounded-lg">
                        <span className="text-purple-600">🏷️</span>
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(campaign.type)}`}>
                          {campaign.type}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => handleEditCampaign(campaign)}
                        className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 shadow-soft"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteCampaign(campaign.id)}
                        className="flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 shadow-soft"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Empty State */}
            {filteredCampaigns.length === 0 && (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🎯</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {searchTerm || filterStatus !== 'all' || filterType !== 'all' 
                    ? 'No campaigns match your filters' 
                    : 'No campaigns yet'}
                </h3>
                <p className="text-gray-600 mb-6">
                  {searchTerm || filterStatus !== 'all' || filterType !== 'all'
                    ? 'Try adjusting your search or filters'
                    : 'Create your first fundraising campaign to get started'}
                </p>
                {!searchTerm && filterStatus === 'all' && filterType === 'all' && (
                  <button
                    onClick={handleCreateCampaign}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 shadow-soft"
                  >
                    Create Your First Campaign
                  </button>
                )}
              </div>
            )}
          </>
        )}

        {/* Donations Tab */}
        {activeTab === 'donations' && (
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/50 shadow-soft p-6">
            <h2 className="text-2xl font-display font-bold text-gray-900 mb-6">Recent Donations</h2>
            <div className="space-y-4">
              {donations.map((donation) => (
                <div key={donation.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {donation.isAnonymous ? 'Anonymous Donor' : donation.donorName}
                      </p>
                      <p className="text-sm text-gray-600">
                        {campaigns.find(c => c.id === donation.campaignId)?.name}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">${donation.amount.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(donation.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/50 shadow-soft p-6">
            <h2 className="text-2xl font-display font-bold text-gray-900 mb-6">Fundraising Analytics</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 bg-blue-50 rounded-xl">
                <h3 className="font-semibold text-gray-900 mb-2">Campaign Performance</h3>
                <div className="space-y-2">
                  {campaigns.map((campaign) => (
                    <div key={campaign.id} className="flex justify-between items-center">
                      <span className="text-sm text-gray-700">{campaign.name}</span>
                      <span className="text-sm font-medium text-gray-900">
                        {Math.round(getProgressPercentage(campaign.currentAmount, campaign.goal))}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-4 bg-green-50 rounded-xl">
                <h3 className="font-semibold text-gray-900 mb-2">Donation Summary</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-700">Total Donations</span>
                    <span className="text-sm font-medium text-gray-900">{totalDonations}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-700">Average Donation</span>
                    <span className="text-sm font-medium text-gray-900">
                      ${totalDonations > 0 ? (totalRaised / totalDonations).toFixed(2) : '0'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Campaign Modal - Placeholder for now */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-white/50 shadow-soft">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {modalMode === 'create' ? 'Create New Campaign' : 'Edit Campaign'}
              </h2>
              <p className="text-gray-600 mb-6">
                Campaign creation/editing form will be implemented here.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-2 rounded-lg font-medium transition-all duration-200 shadow-soft"
                >
                  {modalMode === 'create' ? 'Create Campaign' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminFundraising;
