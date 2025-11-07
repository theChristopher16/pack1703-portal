import React, { useState, useEffect } from 'react';
import { 
  Network, 
  Users, 
  Building2, 
  Shield, 
  Settings, 
  TrendingUp, 
  Activity,
  Globe,
  UserPlus,
  Search,
  Filter,
  MoreVertical,
  Check,
  X,
  Mail,
  Phone,
  Calendar,
  Edit,
  Trash2,
  Loader2
} from 'lucide-react';
import { authService, AppUser, UserRole } from '../services/authService';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase/config';

// Mock data for enterprise network
interface Organization {
  id: string;
  name: string;
  type: 'pack' | 'troop' | 'school' | 'club' | 'business';
  slug: string;
  status: 'active' | 'pending' | 'suspended';
  memberCount: number;
  adminCount: number;
  createdAt: Date;
  billingTier: 'free' | 'basic' | 'pro' | 'enterprise';
}

interface CopseAdmin {
  id: string;
  name: string;
  email: string;
  role: 'copse_admin' | 'network_manager' | 'billing_admin' | 'support_admin';
  organizations: string[]; // IDs of orgs they manage
  status: 'active' | 'pending' | 'suspended';
  lastActive: Date;
  createdAt: Date;
  phone?: string;
}

interface NetworkUser {
  id: string;
  name: string;
  email: string;
  roles: UserRole[]; // Multiple roles support (currently single role from AppUser)
  organizations: string[]; // IDs of orgs they belong to
  status: 'active' | 'pending' | 'suspended';
  lastActive: Date;
  createdAt: Date;
  phone?: string;
}

const mockOrganizations: Organization[] = [
  {
    id: 'org-1',
    name: 'Pack 1703',
    type: 'pack',
    slug: 'pack1703',
    status: 'active',
    memberCount: 142,
    adminCount: 5,
    createdAt: new Date('2024-01-15'),
    billingTier: 'pro'
  },
  {
    id: 'org-2',
    name: 'St. Francis Episcopal School',
    type: 'school',
    slug: 'sfes',
    status: 'active',
    memberCount: 856,
    adminCount: 12,
    createdAt: new Date('2024-06-20'),
    billingTier: 'enterprise'
  },
  {
    id: 'org-3',
    name: 'Charleston Youth Soccer League',
    type: 'club',
    slug: 'cysl',
    status: 'active',
    memberCount: 324,
    adminCount: 8,
    createdAt: new Date('2024-09-10'),
    billingTier: 'pro'
  },
  {
    id: 'org-4',
    name: 'Troop 456 Boy Scouts',
    type: 'troop',
    slug: 'troop456',
    status: 'pending',
    memberCount: 0,
    adminCount: 2,
    createdAt: new Date('2025-02-01'),
    billingTier: 'basic'
  },
  {
    id: 'org-5',
    name: 'Riverside Community Garden',
    type: 'club',
    slug: 'riverside-garden',
    status: 'active',
    memberCount: 67,
    adminCount: 3,
    createdAt: new Date('2024-11-05'),
    billingTier: 'free'
  }
];

const mockCopseAdmins: CopseAdmin[] = [
  {
    id: 'admin-1',
    name: 'Sarah Johnson',
    email: 'sarah@copse.network',
    role: 'copse_admin',
    organizations: ['org-1', 'org-2', 'org-3', 'org-4', 'org-5'],
    status: 'active',
    lastActive: new Date('2025-02-06T14:30:00'),
    createdAt: new Date('2024-01-01'),
    phone: '+1 (555) 123-4567'
  },
  {
    id: 'admin-2',
    name: 'Michael Chen',
    email: 'michael@copse.network',
    role: 'network_manager',
    organizations: ['org-2', 'org-3'],
    status: 'active',
    lastActive: new Date('2025-02-06T16:45:00'),
    createdAt: new Date('2024-03-15'),
    phone: '+1 (555) 234-5678'
  },
  {
    id: 'admin-3',
    name: 'Emily Rodriguez',
    email: 'emily@copse.network',
    role: 'billing_admin',
    organizations: [],
    status: 'active',
    lastActive: new Date('2025-02-06T10:15:00'),
    createdAt: new Date('2024-05-20')
  },
  {
    id: 'admin-4',
    name: 'David Kim',
    email: 'david@copse.network',
    role: 'support_admin',
    organizations: ['org-1', 'org-5'],
    status: 'active',
    lastActive: new Date('2025-02-05T18:20:00'),
    createdAt: new Date('2024-08-10'),
    phone: '+1 (555) 345-6789'
  },
  {
    id: 'admin-5',
    name: 'Jessica Taylor',
    email: 'jessica@copse.network',
    role: 'network_manager',
    organizations: ['org-1', 'org-4'],
    status: 'pending',
    lastActive: new Date('2025-02-01T09:00:00'),
    createdAt: new Date('2025-02-01')
  }
];

// Mock users for fallback (will be replaced by real data from Firestore)
const mockNetworkUsers: NetworkUser[] = [];

// Helper function to get permissions for a role
const getRolePermissions = (role: UserRole): string[] => {
  const permissionMap: Record<UserRole, string[]> = {
    [UserRole.PARENT]: ['view_events', 'rsvp_events', 'view_announcements', 'submit_feedback'],
    [UserRole.DEN_LEADER]: ['view_events', 'rsvp_events', 'view_announcements', 'submit_feedback', 'manage_den', 'view_den_members'],
    [UserRole.ADMIN]: ['view_events', 'rsvp_events', 'view_announcements', 'submit_feedback', 'manage_den', 'view_den_members', 'manage_events', 'manage_announcements', 'manage_users', 'view_analytics'],
    [UserRole.SUPER_ADMIN]: ['view_events', 'rsvp_events', 'view_announcements', 'submit_feedback', 'manage_den', 'view_den_members', 'manage_events', 'manage_announcements', 'manage_users', 'view_analytics', 'system_admin', 'user_management', 'manage_roles'],
    [UserRole.COPSE_ADMIN]: ['view_events', 'rsvp_events', 'view_announcements', 'submit_feedback', 'manage_den', 'view_den_members', 'manage_events', 'manage_announcements', 'manage_users', 'view_analytics', 'system_admin', 'user_management', 'manage_roles', 'manage_organizations', 'cross_org_admin'],
    [UserRole.AI_ASSISTANT]: ['view_events', 'view_announcements', 'ai_operations']
  };
  
  return permissionMap[role] || [];
};

export const CopseAdminPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'organizations' | 'users' | 'admins' | 'analytics'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  const [editingUser, setEditingUser] = useState<NetworkUser | null>(null);
  const [editedRoles, setEditedRoles] = useState<UserRole[]>([]);
  const [isSavingRoles, setIsSavingRoles] = useState(false);
  const [roleError, setRoleError] = useState<string | null>(null);
  const [realUsers, setRealUsers] = useState<AppUser[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);
  
  // Get current user to check if they're a super admin
  const currentUser = authService.getCurrentUser();

  // Load real users from Firestore
  useEffect(() => {
    const loadUsers = async () => {
      try {
        setIsLoadingUsers(true);
        setUsersError(null);
        const users = await authService.getUsers();
        setRealUsers(users);
      } catch (error: any) {
        console.error('Error loading users:', error);
        setUsersError(error.message || 'Failed to load users');
      } finally {
        setIsLoadingUsers(false);
      }
    };

    loadUsers();
  }, []);

  // Convert AppUser to NetworkUser format for display
  const networkUsers: NetworkUser[] = realUsers.map(user => ({
    id: user.uid,
    name: user.displayName || user.profile?.firstName + ' ' + user.profile?.lastName || user.email.split('@')[0],
    email: user.email,
    roles: [user.role], // Convert single role to array for future multi-role support
    organizations: ['org-1'], // TODO: Pull from user's actual org assignments
    status: user.isActive ? 'active' : 'suspended',
    lastActive: user.lastLoginAt || user.updatedAt,
    createdAt: user.createdAt,
    phone: user.profile?.phone
  }));

  const totalOrgs = mockOrganizations.length;
  const activeOrgs = mockOrganizations.filter(o => o.status === 'active').length;
  const totalMembers = realUsers.length;
  const totalAdmins = mockCopseAdmins.filter(a => a.status === 'active').length;

  const getRoleBadge = (role: CopseAdmin['role']) => {
    const config = {
      copse_admin: { label: 'Copse Admin', color: 'bg-purple-100 text-purple-800 border-purple-200' },
      network_manager: { label: 'Network Manager', color: 'bg-blue-100 text-blue-800 border-blue-200' },
      billing_admin: { label: 'Billing Admin', color: 'bg-green-100 text-green-800 border-green-200' },
      support_admin: { label: 'Support Admin', color: 'bg-orange-100 text-orange-800 border-orange-200' }
    };
    return config[role];
  };

  const getUserRoleBadge = (role: UserRole) => {
    const config: Record<UserRole, { label: string; color: string }> = {
      [UserRole.PARENT]: { label: 'Parent', color: 'bg-blue-100 text-blue-800' },
      [UserRole.DEN_LEADER]: { label: 'Den Leader', color: 'bg-green-100 text-green-800' },
      [UserRole.ADMIN]: { label: 'Admin', color: 'bg-purple-100 text-purple-800' },
      [UserRole.SUPER_ADMIN]: { label: 'Super Admin', color: 'bg-yellow-100 text-yellow-800' },
      [UserRole.COPSE_ADMIN]: { label: 'Copse Admin', color: 'bg-pink-100 text-pink-800' },
      [UserRole.AI_ASSISTANT]: { label: 'AI Assistant', color: 'bg-cyan-100 text-cyan-800' }
    };
    return config[role];
  };

  const getStatusBadge = (status: 'active' | 'pending' | 'suspended') => {
    const config = {
      active: { label: 'Active', color: 'bg-green-100 text-green-800' },
      pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
      suspended: { label: 'Suspended', color: 'bg-red-100 text-red-800' }
    };
    return config[status];
  };

  const getOrgTypeIcon = (type: Organization['type']) => {
    switch (type) {
      case 'pack': return '🏕️';
      case 'troop': return '⛺';
      case 'school': return '🏫';
      case 'club': return '⚽';
      case 'business': return '🏢';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-fog via-forest-50/30 to-solar-50/30 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 via-green-600 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
              <Network className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-display font-bold text-ink">
                🌳 Copse Network Administration
              </h1>
              <p className="text-lg text-forest-600 mt-1">
                Enterprise network management and cross-organizational oversight
              </p>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <Building2 className="w-8 h-8 text-emerald-600" />
              <span className="text-sm font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                +2 this month
              </span>
            </div>
            <div className="text-3xl font-bold text-ink">{activeOrgs}</div>
            <div className="text-sm text-gray-600">Active Organizations</div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-8 h-8 text-blue-600" />
              <span className="text-sm font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
                {networkUsers.filter(u => u.status === 'active').length} active
              </span>
            </div>
            <div className="text-3xl font-bold text-ink">{networkUsers.length}</div>
            <div className="text-sm text-gray-600">Registered Users</div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <Shield className="w-8 h-8 text-purple-600" />
              <span className="text-sm font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded">
                {totalAdmins} active
              </span>
            </div>
            <div className="text-3xl font-bold text-ink">{mockCopseAdmins.length}</div>
            <div className="text-sm text-gray-600">Copse Administrators</div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-8 h-8 text-green-600" />
              <span className="text-sm font-medium text-green-600 bg-green-50 px-2 py-1 rounded">
                +18% MoM
              </span>
            </div>
            <div className="text-3xl font-bold text-ink">$12.4K</div>
            <div className="text-sm text-gray-600">Monthly Revenue</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex gap-8 px-6" aria-label="Tabs">
              {[
                { id: 'overview', label: 'Overview', icon: Activity },
                { id: 'organizations', label: 'Organizations', icon: Building2 },
                { id: 'users', label: 'Network Users', icon: Users },
                { id: 'admins', label: 'Copse Admins', icon: Shield },
                { id: 'analytics', label: 'Network Analytics', icon: TrendingUp }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.id
                        ? 'border-forest-600 text-forest-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-ink mb-4">Network Health</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-2xl font-bold text-green-700">98.5%</div>
                          <div className="text-sm text-green-600">Uptime</div>
                        </div>
                        <Activity className="w-8 h-8 text-green-600" />
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-4 border border-blue-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-2xl font-bold text-blue-700">1,245</div>
                          <div className="text-sm text-blue-600">Daily Active Users</div>
                        </div>
                        <Users className="w-8 h-8 text-blue-600" />
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-2xl font-bold text-purple-700">24</div>
                          <div className="text-sm text-purple-600">Pending Approvals</div>
                        </div>
                        <Globe className="w-8 h-8 text-purple-600" />
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-ink mb-4">Recent Activity</h3>
                  <div className="space-y-3">
                    {[
                      { org: 'St. Francis Episcopal School', action: 'Added 23 new members', time: '2 hours ago', type: 'success' },
                      { org: 'Charleston Youth Soccer League', action: 'Updated payment plan to Pro', time: '5 hours ago', type: 'info' },
                      { org: 'Troop 456 Boy Scouts', action: 'Pending organization approval', time: '1 day ago', type: 'warning' },
                      { org: 'Pack 1703', action: 'Scheduled maintenance completed', time: '2 days ago', type: 'success' }
                    ].map((activity, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className={`w-2 h-2 rounded-full ${
                          activity.type === 'success' ? 'bg-green-500' :
                          activity.type === 'warning' ? 'bg-yellow-500' :
                          'bg-blue-500'
                        }`} />
                        <div className="flex-1">
                          <div className="font-medium text-ink">{activity.org}</div>
                          <div className="text-sm text-gray-600">{activity.action}</div>
                        </div>
                        <div className="text-xs text-gray-500">{activity.time}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Organizations Tab */}
            {activeTab === 'organizations' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search organizations..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-transparent"
                    />
                  </div>
                  <button className="flex items-center gap-2 px-4 py-2 bg-forest-600 text-white rounded-lg hover:bg-forest-700 transition-colors">
                    <Building2 className="w-4 h-4" />
                    Add Organization
                  </button>
                </div>

                <div className="space-y-3">
                  {mockOrganizations.map((org) => (
                    <div key={org.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="text-3xl">{getOrgTypeIcon(org.type)}</div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-ink">{org.name}</h4>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusBadge(org.status).color}`}>
                                {getStatusBadge(org.status).label}
                              </span>
                              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                                {org.billingTier}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <span className="flex items-center gap-1">
                                <Users className="w-4 h-4" />
                                {org.memberCount} members
                              </span>
                              <span className="flex items-center gap-1">
                                <Shield className="w-4 h-4" />
                                {org.adminCount} admins
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                Since {org.createdAt.toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        <button className="p-2 hover:bg-gray-200 rounded-lg transition-colors">
                          <MoreVertical className="w-5 h-5 text-gray-500" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Network Users Tab */}
            {activeTab === 'users' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search users by name or email..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-transparent"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    {isLoadingUsers ? (
                      <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                    ) : (
                      <span className="text-sm text-gray-600">{networkUsers.length} total users</span>
                    )}
                  </div>
                </div>

                {usersError && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {usersError}
                  </div>
                )}

                {isLoadingUsers ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 text-forest-600 animate-spin" />
                  </div>
                ) : networkUsers.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    No users found in the network
                  </div>
                ) : (
                  <div className="space-y-3">
                    {networkUsers.filter(user => 
                      !searchQuery || 
                      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      user.email.toLowerCase().includes(searchQuery.toLowerCase())
                    ).map((user) => {
                      const statusBadge = getStatusBadge(user.status);
                      return (
                        <div key={user.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                              {user.name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <h4 className="font-semibold text-ink">{user.name}</h4>
                                <span className={`text-xs px-2 py-0.5 rounded-full ${statusBadge.color}`}>
                                  {statusBadge.label}
                                </span>
                              </div>
                              
                              {/* Multiple Roles Display */}
                              <div className="flex items-center gap-2 mb-2 flex-wrap">
                                {user.roles.map((role) => {
                                  const roleBadge = getUserRoleBadge(role);
                                  return (
                                    <span key={role} className={`text-xs px-2 py-0.5 rounded-full ${roleBadge.color}`}>
                                      {roleBadge.label}
                                    </span>
                                  );
                                })}
                              </div>

                              <div className="flex items-center gap-4 text-sm text-gray-600 mb-2 flex-wrap">
                                <span className="flex items-center gap-1">
                                  <Mail className="w-4 h-4" />
                                  {user.email}
                                </span>
                                {user.phone && (
                                  <span className="flex items-center gap-1">
                                    <Phone className="w-4 h-4" />
                                    {user.phone}
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-gray-500">
                                {user.organizations.length} organization{user.organizations.length !== 1 ? 's' : ''} • 
                                Last active {user.lastActive.toLocaleDateString()} • 
                                Joined {user.createdAt.toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => {
                                setEditingUser(user);
                                setEditedRoles(user.roles);
                                setRoleError(null);
                              }}
                              className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
                              title="Edit roles"
                            >
                              <Edit className="w-4 h-4 text-blue-600" />
                            </button>
                            <button className="p-2 hover:bg-red-100 rounded-lg transition-colors">
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </button>
                          </div>
                        </div>
                      </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Copse Admins Tab */}
            {activeTab === 'admins' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search administrators..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-transparent"
                    />
                  </div>
                  <button 
                    onClick={() => setShowAddAdminModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    <UserPlus className="w-4 h-4" />
                    Add Copse Admin
                  </button>
                </div>

                <div className="space-y-3">
                  {mockCopseAdmins.map((admin) => {
                    const roleBadge = getRoleBadge(admin.role);
                    const statusBadge = getStatusBadge(admin.status);
                    return (
                      <div key={admin.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                              {admin.name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold text-ink">{admin.name}</h4>
                                <span className={`text-xs px-2 py-0.5 rounded-full border ${roleBadge.color}`}>
                                  {roleBadge.label}
                                </span>
                                <span className={`text-xs px-2 py-0.5 rounded-full ${statusBadge.color}`}>
                                  {statusBadge.label}
                                </span>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                                <span className="flex items-center gap-1">
                                  <Mail className="w-4 h-4" />
                                  {admin.email}
                                </span>
                                {admin.phone && (
                                  <span className="flex items-center gap-1">
                                    <Phone className="w-4 h-4" />
                                    {admin.phone}
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-gray-500">
                                Manages {admin.organizations.length} organization{admin.organizations.length !== 1 ? 's' : ''} • 
                                Last active {admin.lastActive.toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button className="p-2 hover:bg-gray-200 rounded-lg transition-colors">
                              <Edit className="w-4 h-4 text-gray-600" />
                            </button>
                            <button className="p-2 hover:bg-red-100 rounded-lg transition-colors">
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Analytics Tab */}
            {activeTab === 'analytics' && (
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-6 border border-blue-200">
                  <h3 className="text-lg font-semibold text-ink mb-2">Network Analytics</h3>
                  <p className="text-gray-600">
                    Comprehensive analytics dashboard coming soon. Monitor cross-organizational metrics, 
                    user engagement, revenue trends, and system performance.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white rounded-lg p-6 border border-gray-200">
                    <h4 className="font-semibold text-ink mb-4">Growth Trends</h4>
                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-gray-600">Organizations</span>
                          <span className="font-medium text-green-600">+40%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-green-500 h-2 rounded-full" style={{ width: '40%' }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-gray-600">Members</span>
                          <span className="font-medium text-blue-600">+67%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-blue-500 h-2 rounded-full" style={{ width: '67%' }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-gray-600">Revenue</span>
                          <span className="font-medium text-purple-600">+28%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-purple-500 h-2 rounded-full" style={{ width: '28%' }} />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg p-6 border border-gray-200">
                    <h4 className="font-semibold text-ink mb-4">Organization Distribution</h4>
                    <div className="space-y-3">
                      {[
                        { type: 'Schools', count: 1, color: 'bg-blue-500' },
                        { type: 'Scout Packs/Troops', count: 2, color: 'bg-green-500' },
                        { type: 'Clubs & Leagues', count: 2, color: 'bg-purple-500' },
                        { type: 'Businesses', count: 0, color: 'bg-orange-500' }
                      ].map((item) => (
                        <div key={item.type} className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${item.color}`} />
                          <span className="text-sm text-gray-700 flex-1">{item.type}</span>
                          <span className="text-sm font-medium text-ink">{item.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Admin Modal */}
      {showAddAdminModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-ink">Add Copse Administrator</h3>
                <button
                  onClick={() => setShowAddAdminModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="john@copse.network"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone (Optional)</label>
                  <input
                    type="tel"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Admin Role</label>
                  <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                    <option value="network_manager">Network Manager</option>
                    <option value="copse_admin">Copse Admin (Full Access)</option>
                    <option value="billing_admin">Billing Admin</option>
                    <option value="support_admin">Support Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Assign Organizations</label>
                  <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3">
                    {mockOrganizations.map((org) => (
                      <label key={org.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                        <input type="checkbox" className="rounded border-gray-300 text-purple-600 focus:ring-purple-500" />
                        <span className="text-sm text-gray-700">{org.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowAddAdminModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // Handle admin creation
                  setShowAddAdminModal(false);
                }}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Create Administrator
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Roles Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-ink">Manage User Roles</h3>
                  <p className="text-sm text-gray-600 mt-1">{editingUser.name} ({editingUser.email})</p>
                </div>
                <button
                  onClick={() => setEditingUser(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Assigned Roles (Select Multiple)
                  </label>
                  <div className="space-y-2 border border-gray-200 rounded-lg p-4">
                    {[
                      { value: UserRole.PARENT, label: 'Parent', description: 'Family account - manage family events and RSVPs' },
                      { value: UserRole.DEN_LEADER, label: 'Den Leader', description: 'Den-specific management and leadership' },
                      { value: UserRole.ADMIN, label: 'Admin', description: 'Organization administrator - full management access' },
                      { value: UserRole.SUPER_ADMIN, label: 'Super Admin', description: 'Organization-wide system access', restrictedTo: 'super_admin' },
                      { value: UserRole.COPSE_ADMIN, label: 'Copse Admin', description: 'Network-level administration across all organizations' }
                    ].filter(roleOption => {
                      // Only show Super Admin option to super admins
                      if (roleOption.restrictedTo === 'super_admin') {
                        return currentUser?.role === UserRole.SUPER_ADMIN;
                      }
                      return true;
                    }).map((roleOption) => {
                      const isChecked = editedRoles.includes(roleOption.value);
                      const roleBadge = getUserRoleBadge(roleOption.value);
                      return (
                        <label 
                          key={roleOption.value}
                          className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                            isChecked ? 'bg-emerald-50 border border-emerald-200' : 'hover:bg-gray-50 border border-transparent'
                          }`}
                        >
                          <input 
                            type="checkbox" 
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                // Add role
                                setEditedRoles([...editedRoles, roleOption.value]);
                                setRoleError(null);
                              } else {
                                // Remove role - but ensure at least one remains
                                const newRoles = editedRoles.filter(r => r !== roleOption.value);
                                if (newRoles.length === 0) {
                                  setRoleError('At least one role must be assigned');
                                } else {
                                  setEditedRoles(newRoles);
                                  setRoleError(null);
                                }
                              }
                            }}
                            className="mt-1 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" 
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-gray-900">{roleOption.label}</span>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${roleBadge.color}`}>
                                {roleBadge.label}
                              </span>
                            </div>
                            <p className="text-xs text-gray-600">{roleOption.description}</p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    💡 Note: Currently, the system stores the highest priority role. Multi-role support is prepared for future implementation.
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Priority: Copse Admin → Super Admin → Admin → Den Leader → Parent
                  </p>
                  {roleError && (
                    <p className="text-xs text-red-600 mt-2 font-medium">
                      ⚠️ {roleError}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Organizations</label>
                  <div className="text-sm text-gray-600">
                    {editingUser.organizations.map(orgId => {
                      const org = mockOrganizations.find(o => o.id === orgId);
                      return org ? org.name : orgId;
                    }).join(', ') || 'No organizations assigned'}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Account Status</label>
                  <select 
                    value={editingUser.status}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  >
                    <option value="active">Active</option>
                    <option value="pending">Pending</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex items-center justify-between">
              <button
                onClick={() => setEditingUser(null)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  // Validate at least one role
                  if (editedRoles.length === 0) {
                    setRoleError('At least one role must be assigned');
                    return;
                  }

                  try {
                    setIsSavingRoles(true);
                    setRoleError(null);

                    // For now, we only support single role in the database
                    // Use the highest priority role if multiple are selected
                    const primaryRole = editedRoles.includes(UserRole.COPSE_ADMIN) ? UserRole.COPSE_ADMIN :
                                       editedRoles.includes(UserRole.SUPER_ADMIN) ? UserRole.SUPER_ADMIN :
                                       editedRoles.includes(UserRole.ADMIN) ? UserRole.ADMIN :
                                       editedRoles.includes(UserRole.DEN_LEADER) ? UserRole.DEN_LEADER :
                                       editedRoles[0];

                    // Only super admins can assign super_admin role
                    if (primaryRole === UserRole.SUPER_ADMIN && currentUser?.role !== UserRole.SUPER_ADMIN) {
                      setRoleError('Only super admins can assign the super admin role');
                      setIsSavingRoles(false);
                      return;
                    }

                    // Use adminUpdateUser function (working alternative to updateUserRole)
                    const adminUpdateUserFunction = httpsCallable(functions, 'adminUpdateUser');
                    await adminUpdateUserFunction({
                      userId: editingUser.id,
                      updates: {
                        role: primaryRole,
                        permissions: getRolePermissions(primaryRole),
                        isAdmin: primaryRole === UserRole.ADMIN || primaryRole === UserRole.SUPER_ADMIN || primaryRole === UserRole.COPSE_ADMIN,
                        isDenLeader: primaryRole === UserRole.DEN_LEADER || primaryRole === UserRole.ADMIN || primaryRole === UserRole.SUPER_ADMIN || primaryRole === UserRole.COPSE_ADMIN,
                        isCubmaster: primaryRole === UserRole.ADMIN || primaryRole === UserRole.SUPER_ADMIN || primaryRole === UserRole.COPSE_ADMIN
                      }
                    });

                    console.log(`✅ Updated role for ${editingUser.name} to ${primaryRole}`);
                    
                    // Reload users to show updated data
                    const users = await authService.getUsers();
                    setRealUsers(users);
                    
                    setEditingUser(null);
                    setEditedRoles([]);
                  } catch (error: any) {
                    console.error('Error updating user role:', error);
                    setRoleError(error.message || 'Failed to update role');
                  } finally {
                    setIsSavingRoles(false);
                  }
                }}
                disabled={isSavingRoles || editedRoles.length === 0}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSavingRoles && <Loader2 className="w-4 h-4 animate-spin" />}
                {isSavingRoles ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

