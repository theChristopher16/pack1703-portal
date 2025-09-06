import React, { useEffect, useMemo } from 'react';
import { 
  Users, UserPlus, Search, Filter, MoreVertical, Edit, Trash2, 
  Mail, Copy, Check, X, Eye, EyeOff, Shield, Key, Download, 
  Upload, Calendar, Building, GraduationCap, Settings, ExternalLink,
  ChevronDown, ChevronRight, MapPin, Save, AlertCircle
} from 'lucide-react';
import { UserRole, ROLE_PERMISSIONS, AppUser } from '../../services/authService';
import { useUserManagementState } from '../../hooks/useOptimizedState';
import ProfilePicture from '../ui/ProfilePicture';

interface UserWithChildren extends AppUser {
  children?: AppUser[];
  parentId?: string;
}

interface CreateUserForm {
  email: string;
  password: string;
  confirmPassword: string;
  displayName: string;
  role: UserRole;
  den: string;
  scoutRank: string;
  emergencyContact: string;
  address: string;
  isActive: boolean;
}

interface EditUserForm {
  displayName: string;
  role: UserRole;
  den: string;
  scoutRank: string;
  emergencyContact: string;
  address: string;
  isActive: boolean;
}

interface Invite {
  id: string;
  email: string;
  role: UserRole;
  message: string;
  denId: string;
  expiresInDays: number;
  createdAt: string;
  expiresAt: string;
  status: 'pending' | 'accepted' | 'expired';
  invitedBy: string;
}

interface InviteFormData {
  email: string;
  role: UserRole;
  message: string;
  denId: string;
  expiresInDays: number;
}

const UserManagement: React.FC = () => {
  const { state, actions } = useUserManagementState();

  // Load users and invites on component mount
  useEffect(() => {
    loadUsers();
    loadInvites();
  }, []);

  // Filter and sort users based on current filters
  useEffect(() => {
    filterAndSortUsers();
  }, [state.users, state.searchTerm, state.roleFilter, state.denFilter, state.statusFilter]);

  const loadUsers = async () => {
    try {
      actions.setLoading(true);
      // Simulate API call - replace with actual service call
      const users: UserWithChildren[] = [];
      actions.setUsers(users);
    } catch (error) {
      console.error('Failed to load users:', error);
      actions.setError('Failed to load users');
    } finally {
      actions.setLoading(false);
    }
  };

  const loadInvites = async () => {
    try {
      // Simulate API call - replace with actual service call
      const invites: Invite[] = [];
      actions.setInvites(invites);
    } catch (error) {
      console.error('Failed to load invites:', error);
      actions.setError('Failed to load invites');
    }
  };

  const filterAndSortUsers = () => {
    let filtered = [...state.users];

    // Apply search filter
    if (state.searchTerm) {
      filtered = filtered.filter(user =>
        user.displayName?.toLowerCase().includes(state.searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(state.searchTerm.toLowerCase())
      );
    }

    // Apply role filter
    if (state.roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === state.roleFilter);
    }

    // Apply den filter
    if (state.denFilter !== 'all') {
      filtered = filtered.filter(user => user.profile?.den === state.denFilter);
    }

    // Apply status filter
    if (state.statusFilter !== 'all') {
      filtered = filtered.filter(user => 
        state.statusFilter === 'active' ? user.isActive : !user.isActive
      );
    }

    actions.setFilteredUsers(filtered);
  };

  const handleCreateUser = async () => {
    try {
      // Validate form
      if (!state.createForm.email || !state.createForm.password) {
        actions.setError('Email and password are required');
        return;
      }

      if (state.createForm.password !== state.createForm.confirmPassword) {
        actions.setError('Passwords do not match');
        return;
      }

      // Simulate API call - replace with actual service call
      const newUser: UserWithChildren = {
        uid: Date.now().toString(),
        ...state.createForm,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLoginAt: undefined,
        permissions: (ROLE_PERMISSIONS as any)[state.createForm.role] || [],
        photoURL: undefined,
        displayName: state.createForm.displayName || state.createForm.email.split('@')[0]
      };

      actions.setUsers([...state.users, newUser]);
      actions.setShowCreateModal(false);
      actions.resetCreateForm();
      // addNotification('success', 'User created successfully');
    } catch (error) {
      console.error('Failed to create user:', error);
      actions.setError('Failed to create user');
    }
  };

  const handleEditUser = async () => {
    if (!state.selectedUser) return;

    try {
      // Simulate API call - replace with actual service call
      const updatedUser = {
        ...state.selectedUser,
        ...state.createForm, // Using createForm for edit data
        updatedAt: new Date()
      };

      actions.setUsers(
        state.users.map(user => user.uid === state.selectedUser!.uid ? updatedUser : user)
      );
      actions.setShowEditModal(false);
      actions.setSelectedUser(null);
      // addNotification('success', 'User updated successfully');
    } catch (error) {
      console.error('Failed to update user:', error);
      actions.setError('Failed to update user');
    }
  };

  const handleDeleteUser = async () => {
    if (!state.selectedUser) return;

    try {
      // Simulate API call - replace with actual service call
      actions.setUsers(
        state.users.filter(user => user.uid !== state.selectedUser!.uid)
      );
      actions.setShowDeleteModal(false);
      actions.setSelectedUser(null);
      // addNotification('success', 'User deleted successfully');
    } catch (error) {
      console.error('Failed to delete user:', error);
      actions.setError('Failed to delete user');
    }
  };

  const handleCreateInvite = async () => {
    try {
      // Validate form
      if (!state.inviteFormData.email) {
        actions.setError('Email is required');
        return;
      }

      // Simulate API call - replace with actual service call
      const newInvite: Invite = {
        id: Date.now().toString(),
        ...state.inviteFormData,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + state.inviteFormData.expiresInDays * 24 * 60 * 60 * 1000).toISOString(),
        status: 'pending',
        invitedBy: 'system'
      };

      actions.setInvites([...state.invites, newInvite]);
      actions.setShowCreateInviteModal(false);
      actions.resetInviteFormData();
      // addNotification('success', 'Invitation sent successfully');
    } catch (error) {
      console.error('Failed to create invite:', error);
      actions.setError('Failed to create invite');
    }
  };

  const handleCopyInviteLink = async (invite: Invite) => {
    try {
      const inviteLink = `${window.location.origin}/join?invite=${invite.id}`;
      await navigator.clipboard.writeText(inviteLink);
      actions.setCopySuccess('Invite link copied to clipboard');
      setTimeout(() => actions.setCopySuccess(null), 3000);
    } catch (error) {
      console.error('Failed to copy invite link:', error);
      actions.setError('Failed to copy invite link');
    }
  };

  // Memoized computed values
  const stats = useMemo(() => ({
    totalUsers: state.users.length,
    activeUsers: state.users.filter(user => user.isActive).length,
    inactiveUsers: state.users.filter(user => !user.isActive).length,
    pendingInvites: state.invites.filter(invite => invite.status === 'pending').length,
    expiredInvites: state.invites.filter(invite => invite.status === 'expired').length
  }), [state.users, state.invites]);

  const roleOptions = Object.values(UserRole);
  const denOptions = [
    'Lion', 'Tiger', 'Wolf', 'Bear', 'Webelos', 'Arrow of Light',
    'Pack Leadership', 'Committee', 'Volunteer'
  ];

  if (state.isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <p className="text-gray-500">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600">Manage pack members and invitations</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => actions.setShowCreateInviteModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
          >
            <Mail className="w-4 h-4" />
            <span>Send Invite</span>
          </button>
          <button
            onClick={() => actions.setShowCreateModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add User</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-blue-500" />
            <span className="text-sm font-medium text-gray-600">Total Users</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-2">
            <Check className="w-5 h-5 text-green-500" />
            <span className="text-sm font-medium text-gray-600">Active</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.activeUsers}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-2">
            <X className="w-5 h-5 text-red-500" />
            <span className="text-sm font-medium text-gray-600">Inactive</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.inactiveUsers}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-2">
            <Mail className="w-5 h-5 text-yellow-500" />
            <span className="text-sm font-medium text-gray-600">Pending Invites</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.pendingInvites}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-orange-500" />
            <span className="text-sm font-medium text-gray-600">Expired Invites</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.expiredInvites}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={state.searchTerm}
                onChange={(e) => actions.setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <select
            value={state.roleFilter}
            onChange={(e) => actions.setRoleFilter(e.target.value as UserRole | 'all')}
            className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Roles</option>
            {roleOptions.map(role => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>
          
          <select
            value={state.denFilter}
            onChange={(e) => actions.setDenFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Dens</option>
            {denOptions.map(den => (
              <option key={den} value={den}>{den}</option>
            ))}
          </select>
          
          <select
            value={state.statusFilter}
            onChange={(e) => actions.setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
            className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Den
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Login
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {state.filteredUsers.map(user => (
                <tr key={user.uid} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <ProfilePicture
                        src={user.photoURL}
                        alt={user.displayName || user.email}
                        size="sm"
                      />
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">
                          {user.displayName || user.email}
                        </div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.role === 'root' ? 'bg-purple-100 text-purple-800' :
                      user.role === 'admin' ? 'bg-red-100 text-red-800' :
                      user.role === 'volunteer' ? 'bg-blue-100 text-blue-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.profile?.den || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Never'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => {
                          actions.setSelectedUser(user);
          actions.updateCreateForm({
            displayName: user.displayName || '',
            role: user.role,
            den: user.profile?.den || '',
            scoutRank: user.profile?.scoutRank || '',
            emergencyContact: user.profile?.emergencyContact || '',
            address: user.profile?.address || '',
            isActive: user.isActive
          });
                          actions.setShowEditModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                        title="Edit user"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          actions.setSelectedUser(user);
                          actions.setShowDeleteModal(true);
                        }}
                        className="text-red-600 hover:text-red-900"
                        title="Delete user"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Error Display */}
      {state.error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
            <span className="text-red-700">{state.error}</span>
            <button
              onClick={() => actions.setError(null)}
              className="ml-auto text-red-500 hover:text-red-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Success Message */}
      {state.copySuccess && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <Check className="w-5 h-5 text-green-500 mr-2" />
            <span className="text-green-700">{state.copySuccess}</span>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {state.showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Create New User</h3>
              <button
                onClick={() => {
                  actions.setShowCreateModal(false);
                  actions.resetCreateForm();
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={state.createForm.email}
                  onChange={(e) => actions.updateCreateForm({ email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  value={state.createForm.displayName}
                  onChange={(e) => actions.updateCreateForm({ displayName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  value={state.createForm.role}
                  onChange={(e) => actions.updateCreateForm({ role: e.target.value as UserRole })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {roleOptions.map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={state.createForm.password}
                  onChange={(e) => actions.updateCreateForm({ password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={state.createForm.confirmPassword}
                  onChange={(e) => actions.updateCreateForm({ confirmPassword: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>
            
            <div className="flex items-center justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  actions.setShowCreateModal(false);
                  actions.resetCreateForm();
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateUser}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Create User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {state.showEditModal && state.selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Edit User</h3>
              <button
                onClick={() => {
                  actions.setShowEditModal(false);
                  actions.setSelectedUser(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  value={state.createForm.displayName}
                  onChange={(e) => actions.updateCreateForm({ displayName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  value={state.createForm.role}
                  onChange={(e) => actions.updateCreateForm({ role: e.target.value as UserRole })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {roleOptions.map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Den
                </label>
                <select
                  value={state.createForm.den}
                  onChange={(e) => actions.updateCreateForm({ den: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Den</option>
                  {denOptions.map(den => (
                    <option key={den} value={den}>{den}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Den
                </label>
                <select
                  value={state.createForm.den}
                  onChange={(e) => actions.updateCreateForm({ den: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Den</option>
                  {denOptions.map(den => (
                    <option key={den} value={den}>{den}</option>
                  ))}
                </select>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={state.createForm.isActive}
                  onChange={(e) => actions.updateCreateForm({ isActive: e.target.checked })}
                  className="mr-2"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                  Active User
                </label>
              </div>
            </div>
            
            <div className="flex items-center justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  actions.setShowEditModal(false);
                  actions.setSelectedUser(null);
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleEditUser}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Update User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete User Modal */}
      {state.showDeleteModal && state.selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-red-600">Delete User</h3>
              <button
                onClick={() => {
                  actions.setShowDeleteModal(false);
                  actions.setSelectedUser(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="mb-4">
              <p className="text-gray-700">
                Are you sure you want to delete <strong>{state.selectedUser.displayName || state.selectedUser.email}</strong>?
                This action cannot be undone.
              </p>
            </div>
            
            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => {
                  actions.setShowDeleteModal(false);
                  actions.setSelectedUser(null);
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUser}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                Delete User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Invite Modal */}
      {state.showCreateInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Send Invitation</h3>
              <button
                onClick={() => {
                  actions.setShowCreateInviteModal(false);
                  actions.resetInviteFormData();
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={state.inviteFormData.email}
                  onChange={(e) => actions.updateInviteFormData({ email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  value={state.inviteFormData.role}
                  onChange={(e) => actions.updateInviteFormData({ role: e.target.value as UserRole })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {roleOptions.map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Den
                </label>
                <select
                  value={state.inviteFormData.denId}
                  onChange={(e) => actions.updateInviteFormData({ denId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Den</option>
                  {denOptions.map(den => (
                    <option key={den} value={den}>{den}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message (Optional)
                </label>
                <textarea
                  value={state.inviteFormData.message}
                  onChange={(e) => actions.updateInviteFormData({ message: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expires In (Days)
                </label>
                <select
                  value={state.inviteFormData.expiresInDays}
                  onChange={(e) => actions.updateInviteFormData({ expiresInDays: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value={1}>1 Day</option>
                  <option value={3}>3 Days</option>
                  <option value={7}>7 Days</option>
                  <option value={14}>14 Days</option>
                  <option value={30}>30 Days</option>
                </select>
              </div>
            </div>
            
            <div className="flex items-center justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  actions.setShowCreateInviteModal(false);
                  actions.resetInviteFormData();
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateInvite}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
              >
                Send Invitation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
