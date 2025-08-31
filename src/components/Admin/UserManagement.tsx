import React, { useState, useEffect } from 'react';
import { authService, UserRole, SocialProvider, AppUser } from '../../services/authService';
import { 
  Users, 
  UserPlus, 
  Shield, 
  Crown, 
  User, 
  Settings, 
  Trash2,
  Edit,
  Link,
  Unlink,
  Eye,
  EyeOff,
  Search,
  Filter,
  MoreVertical,
  CheckCircle,
  AlertCircle,
  Loader2,
  AlertTriangle
} from 'lucide-react';

interface UserManagementProps {
  className?: string;
}

const UserManagement: React.FC<UserManagementProps> = ({ className = '' }) => {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [isLinkingAccount, setIsLinkingAccount] = useState(false);
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);
  const [isDeletingUser, setIsDeletingUser] = useState(false);
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<AppUser | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const usersData = await authService.getUsers();
      setUsers(usersData);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLinkSocialAccount = async (provider: SocialProvider) => {
    if (!selectedUser) return;

    setIsLinkingAccount(true);
    try {
      await authService.linkSocialAccount(provider);
      await loadUsers(); // Reload users to show updated data
      setShowUserModal(false);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLinkingAccount(false);
    }
  };

  const handleUpdateUserRole = async (userId: string, newRole: UserRole) => {
    setIsUpdatingRole(true);
    try {
      await authService.updateUserRole(userId, newRole);
      await loadUsers(); // Reload users to show updated data
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsUpdatingRole(false);
    }
  };

  const handleDeleteUser = async (user: AppUser) => {
    setDeleteConfirmUser(user);
  };

  const confirmDeleteUser = async () => {
    if (!deleteConfirmUser) return;

    setIsDeletingUser(true);
    try {
      await authService.deleteUser(deleteConfirmUser.uid);
      await loadUsers(); // Reload users to show updated data
      setDeleteConfirmUser(null);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsDeletingUser(false);
    }
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case UserRole.ROOT:
        return <Crown className="w-4 h-4 text-yellow-500" />;
      case UserRole.ADMIN:
        return <Shield className="w-4 h-4 text-blue-500" />;
      case UserRole.COMMITTEE_MEMBER:
        return <Shield className="w-4 h-4 text-indigo-500" />;
      case UserRole.DEN_LEADER:
        return <User className="w-4 h-4 text-green-500" />;
      case UserRole.STAR_VOLUNTEER:
        return <User className="w-4 h-4 text-purple-500" />;
      default:
        return <User className="w-4 h-4 text-gray-500" />;
    }
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case UserRole.ROOT:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case UserRole.ADMIN:
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case UserRole.COMMITTEE_MEMBER:
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case UserRole.DEN_LEADER:
        return 'bg-green-100 text-green-800 border-green-200';
      case UserRole.STAR_VOLUNTEER:
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  if (!authService.isRoot()) {
    return (
      <div className={`bg-white/90 backdrop-blur-sm rounded-2xl border border-white/50 shadow-soft p-6 ${className}`}>
        <div className="text-center">
          <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Access Restricted</h3>
          <p className="text-gray-600">Only root users can access user management.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
          <p className="text-gray-600">Manage user accounts and permissions</p>
        </div>
        <button
          onClick={() => setShowUserModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          Add User
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as UserRole | 'all')}
          className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">All Roles</option>
          <option value={UserRole.ROOT}>Root</option>
          <option value={UserRole.ADMIN}>Admin</option>
          <option value={UserRole.COMMITTEE_MEMBER}>Committee Member</option>
          <option value={UserRole.DEN_LEADER}>Den Leader</option>
          <option value={UserRole.STAR_VOLUNTEER}>Star Volunteer</option>
          <option value={UserRole.PACK_MEMBER}>Pack Member</option>
        </select>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      )}

      {/* Users List */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/50 shadow-soft overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">Loading users...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-8 text-center">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No users found</p>
          </div>
        ) : (
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
                    Auth Provider
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Login
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.uid} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          {user.photoURL ? (
                            <img
                              className="h-10 w-10 rounded-full"
                              src={user.photoURL}
                              alt={user.displayName}
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                              <User className="w-5 h-5 text-gray-600" />
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.displayName || 'No Name'}
                          </div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getRoleIcon(user.role)}
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRoleBadgeColor(user.role)}`}>
                          {user.role}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.authProvider || 'Email'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setShowUserModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-900"
                          title="Edit user"
                        >
                          <Settings className="w-4 h-4" />
                        </button>
                        {user.role !== UserRole.ROOT && (
                          <button
                            onClick={() => handleDeleteUser(user)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete user"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* User Modal */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Manage User: {selectedUser.displayName}</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                <select
                  value={selectedUser.role}
                  onChange={(e) => handleUpdateUserRole(selectedUser.uid, e.target.value as UserRole)}
                  disabled={isUpdatingRole}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                >
                  <option value={UserRole.ROOT}>Root</option>
                  <option value={UserRole.ADMIN}>Admin</option>
                  <option value={UserRole.COMMITTEE_MEMBER}>Committee Member</option>
                  <option value={UserRole.DEN_LEADER}>Den Leader</option>
                  <option value={UserRole.STAR_VOLUNTEER}>Star Volunteer</option>
                  <option value={UserRole.PACK_MEMBER}>Pack Member</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Link Social Account</label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.values(SocialProvider).map((provider) => (
                    <button
                      key={provider}
                      onClick={() => handleLinkSocialAccount(provider)}
                      disabled={isLinkingAccount}
                      className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                    >
                      <Link className="w-4 h-4" />
                      {provider}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowUserModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-red-500" />
              <h3 className="text-lg font-semibold text-gray-900">Delete User</h3>
            </div>
            
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-700">
                  <strong>Warning:</strong> This action will immediately:
                </p>
                <ul className="text-sm text-red-700 mt-2 list-disc list-inside">
                  <li>Remove all user data from the database</li>
                  <li>Revoke all access permissions</li>
                  <li>Terminate any active sessions</li>
                  <li>Cannot be undone</li>
                </ul>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-700">
                  <strong>User:</strong> {deleteConfirmUser.displayName || 'No Name'}
                </p>
                <p className="text-sm text-gray-700">
                  <strong>Email:</strong> {deleteConfirmUser.email}
                </p>
                <p className="text-sm text-gray-700">
                  <strong>Role:</strong> {deleteConfirmUser.role}
                </p>
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-600">
                <AlertTriangle className="w-4 h-4 text-yellow-500" />
                <span>Are you sure you want to permanently delete this user?</span>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setDeleteConfirmUser(null)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={isDeletingUser}
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteUser}
                disabled={isDeletingUser}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isDeletingUser ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Delete User
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
