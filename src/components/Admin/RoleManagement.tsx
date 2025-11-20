import React, { useState, useEffect } from 'react';
import {
  Shield,
  User,
  Search,
  Filter,
  Check,
  X,
  Edit,
  Save,
  Loader2,
  AlertCircle,
  Users,
  Key,
  Eye,
  EyeOff
} from 'lucide-react';
import { authService, AppUser, UserRole, ROLE_PERMISSIONS } from '../../services/authService';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../firebase/config';

interface RoleManagementProps {
  currentUser?: AppUser | null;
}

const RoleManagement: React.FC<RoleManagementProps> = ({ currentUser }) => {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<AppUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editedRoles, setEditedRoles] = useState<UserRole[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

  // Role definitions with descriptions
  const roleDefinitions: Record<UserRole, { label: string; description: string; color: string; canAssign: boolean; alwaysIncluded?: boolean }> = {
    [UserRole.HOME]: {
      label: 'Home',
      description: 'Home access - everyone has this role for home component access',
      color: 'bg-amber-100 text-amber-800 border-amber-200',
      canAssign: false, // Everyone automatically gets this
      alwaysIncluded: true // This role is always included for everyone
    },
    [UserRole.PARENT]: {
      label: 'Parent',
      description: 'Family account - manage family events and RSVPs',
      color: 'bg-purple-100 text-purple-800 border-purple-200',
      canAssign: true
    },
    [UserRole.DEN_LEADER]: {
      label: 'Den Leader',
      description: 'Den-specific management and leadership',
      color: 'bg-green-100 text-green-800 border-green-200',
      canAssign: true
    },
    [UserRole.ADMIN]: {
      label: 'Admin',
      description: 'Organization administrator - full management access',
      color: 'bg-blue-100 text-blue-800 border-blue-200',
      canAssign: true
    },
    [UserRole.SUPER_ADMIN]: {
      label: 'Super Admin',
      description: 'Organization-wide system access',
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      canAssign: currentUser?.role === UserRole.SUPER_ADMIN || currentUser?.role === UserRole.COPSE_ADMIN
    },
    [UserRole.COPSE_ADMIN]: {
      label: 'Copse Admin',
      description: 'Network-level administration across all organizations',
      color: 'bg-purple-100 text-purple-800 border-purple-200',
      canAssign: currentUser?.role === UserRole.COPSE_ADMIN
    },
    [UserRole.AI_ASSISTANT]: {
      label: 'AI Assistant',
      description: 'AI assistant role for automated operations',
      color: 'bg-gray-100 text-gray-800 border-gray-200',
      canAssign: currentUser?.role === UserRole.COPSE_ADMIN || currentUser?.role === UserRole.SUPER_ADMIN
    }
  };

  // Load users
  const loadUsers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const allUsers = await authService.getUsers();
      setUsers(allUsers);
      setFilteredUsers(allUsers);
    } catch (err: any) {
      console.error('Error loading users:', err);
      setError(err.message || 'Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // Filter users
  useEffect(() => {
    let filtered = users;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(user =>
        user.email.toLowerCase().includes(query) ||
        user.displayName?.toLowerCase().includes(query) ||
        user.profile?.firstName?.toLowerCase().includes(query) ||
        user.profile?.lastName?.toLowerCase().includes(query)
      );
    }

    // Role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => {
        const userRoles = authService.getUserRoles(user);
        return userRoles.includes(roleFilter);
      });
    }

    setFilteredUsers(filtered);
  }, [searchQuery, roleFilter, users]);

  // Start editing a user's roles
  const handleEditRoles = (user: AppUser) => {
    setEditingUserId(user.uid);
    const userRoles = authService.getUserRoles(user);
    // Filter out HOME role from editable roles (it's always included)
    const editableRoles = userRoles.filter(r => r !== UserRole.HOME);
    setEditedRoles(editableRoles);
    setError(null);
    setSuccess(null);
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingUserId(null);
    setEditedRoles([]);
    setError(null);
    setSuccess(null);
  };

  // Toggle role in edited roles
  const toggleRole = (role: UserRole) => {
    const roleDef = roleDefinitions[role];
    
    // HOME role is always included and cannot be removed
    if (role === UserRole.HOME) {
      setError('Home role cannot be removed - everyone has this role');
      return;
    }
    
    if (editedRoles.includes(role)) {
      setEditedRoles(editedRoles.filter(r => r !== role));
    } else {
      // Check if user can assign this role
      if (!roleDef.canAssign) {
        setError(`You don't have permission to assign the ${roleDef.label} role`);
        return;
      }
      setEditedRoles([...editedRoles, role]);
    }
    setError(null);
  };

  // Save role changes
  const handleSaveRoles = async (userId: string) => {
    // Ensure HOME role is always included
    const rolesToSave = editedRoles.includes(UserRole.HOME) 
      ? editedRoles 
      : [UserRole.HOME, ...editedRoles];
    
    if (rolesToSave.length === 0) {
      setError('At least one role must be assigned');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      setSuccess(null);

      // Determine primary role (highest priority, excluding HOME)
      const rolesExcludingHome = rolesToSave.filter(r => r !== UserRole.HOME);
      const primaryRole = rolesExcludingHome.includes(UserRole.COPSE_ADMIN) ? UserRole.COPSE_ADMIN :
                         rolesExcludingHome.includes(UserRole.SUPER_ADMIN) ? UserRole.SUPER_ADMIN :
                         rolesExcludingHome.includes(UserRole.ADMIN) ? UserRole.ADMIN :
                         rolesExcludingHome.includes(UserRole.DEN_LEADER) ? UserRole.DEN_LEADER :
                         rolesExcludingHome[0] || UserRole.HOME;

      // Check permissions for assigning super_admin
      if (rolesToSave.includes(UserRole.SUPER_ADMIN) && 
          currentUser?.role !== UserRole.SUPER_ADMIN && 
          currentUser?.role !== UserRole.COPSE_ADMIN) {
        setError('Only super admins or copse admins can assign the super admin role');
        setIsSaving(false);
        return;
      }

      // Check permissions for assigning copse_admin
      if (rolesToSave.includes(UserRole.COPSE_ADMIN) && 
          currentUser?.role !== UserRole.COPSE_ADMIN) {
        setError('Only copse admins can assign the copse admin role');
        setIsSaving(false);
        return;
      }

      // Get combined permissions from all roles
      const allPermissions = Array.from(new Set(
        rolesToSave.flatMap(role => ROLE_PERMISSIONS[role] || [])
      ));

      // Call cloud function to update user
      const adminUpdateUser = httpsCallable(functions, 'adminUpdateUser');
      const result = await adminUpdateUser({
        userId,
        updates: {
          role: primaryRole,
          roles: rolesToSave, // Always includes HOME
          permissions: allPermissions
        }
      });

      if ((result.data as any).success) {
        setSuccess('Roles updated successfully');
        setEditingUserId(null);
        setEditedRoles([]);
        
        // Reload users to reflect changes
        await loadUsers();
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(null), 3000);
      } else {
        throw new Error((result.data as any).error || 'Failed to update roles');
      }
    } catch (err: any) {
      console.error('Error updating roles:', err);
      setError(err.message || 'Failed to update roles');
    } finally {
      setIsSaving(false);
    }
  };

  // Get role badge
  const getRoleBadge = (role: UserRole) => {
    const def = roleDefinitions[role];
    return (
      <span
        key={role}
        className={`px-2 py-1 rounded-md text-xs font-medium border ${def.color}`}
      >
        {def.label}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-forest-600" />
        <span className="ml-3 text-gray-600">Loading users...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Key className="w-6 h-6 text-forest-600" />
            Role Management
          </h2>
          <p className="text-gray-600 mt-1">
            Manage user roles and permissions across the network
          </p>
        </div>
        <button
          onClick={loadUsers}
          className="px-4 py-2 bg-forest-600 text-white rounded-lg hover:bg-forest-700 transition-colors flex items-center gap-2"
        >
          <Loader2 className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center gap-2">
          <Check className="w-5 h-5" />
          {success}
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-transparent"
            />
          </div>

          {/* Role Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as UserRole | 'all')}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-transparent appearance-none bg-white"
            >
              <option value="all">All Roles</option>
              {Object.entries(roleDefinitions).map(([role, def]) => (
                <option key={role} value={role}>
                  {def.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Users List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Current Roles
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p>No users found</p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const userRoles = authService.getUserRoles(user);
                  const isEditing = editingUserId === user.uid;

                  return (
                    <tr key={user.uid} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            {user.photoURL ? (
                              <img
                                className="h-10 w-10 rounded-full"
                                src={user.photoURL}
                                alt={user.displayName || user.email}
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-forest-100 flex items-center justify-center">
                                <User className="w-6 h-6 text-forest-600" />
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {user.displayName || user.profile?.firstName + ' ' + user.profile?.lastName || user.email.split('@')[0]}
                            </div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {isEditing ? (
                          <div className="space-y-2">
                            <div className="flex flex-wrap gap-2">
                              {Object.entries(roleDefinitions).map(([role, def]) => {
                                const roleEnum = role as UserRole;
                                const isSelected = editedRoles.includes(roleEnum);
                                const canAssign = def.canAssign;
                                const alwaysIncluded = def.alwaysIncluded || false;

                                return (
                                  <button
                                    key={role}
                                    onClick={() => toggleRole(roleEnum)}
                                    disabled={!canAssign || alwaysIncluded}
                                    className={`px-3 py-1 rounded-md text-xs font-medium border transition-all ${
                                      isSelected || alwaysIncluded
                                        ? def.color + (alwaysIncluded ? '' : ' ring-2 ring-forest-500')
                                        : 'bg-gray-50 text-gray-600 border-gray-300 hover:bg-gray-100'
                                    } ${!canAssign || alwaysIncluded ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                    title={alwaysIncluded ? `${def.label} - Always included for everyone` : (!canAssign ? `You don't have permission to assign ${def.label}` : def.description)}
                                  >
                                    {def.label}
                                    {(isSelected || alwaysIncluded) && <Check className="w-3 h-3 inline ml-1" />}
                                    {alwaysIncluded && <span className="ml-1 text-xs">(always)</span>}
                                  </button>
                                );
                              })}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              Click roles to toggle selection
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {userRoles.length > 0 ? (
                              userRoles.map(role => getRoleBadge(role))
                            ) : (
                              <span className="text-sm text-gray-400">No roles assigned</span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            user.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {isEditing ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleSaveRoles(user.uid)}
                              disabled={isSaving}
                              className="text-forest-600 hover:text-forest-900 flex items-center gap-1 disabled:opacity-50"
                            >
                              {isSaving ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  Saving...
                                </>
                              ) : (
                                <>
                                  <Save className="w-4 h-4" />
                                  Save
                                </>
                              )}
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              disabled={isSaving}
                              className="text-gray-600 hover:text-gray-900 flex items-center gap-1 disabled:opacity-50"
                            >
                              <X className="w-4 h-4" />
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleEditRoles(user)}
                            className="text-forest-600 hover:text-forest-900 flex items-center gap-1"
                          >
                            <Edit className="w-4 h-4" />
                            Edit Roles
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Role Definitions Help */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-blue-900 mb-2 flex items-center gap-2">
          <Shield className="w-4 h-4" />
          Role Permissions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-2">
          {Object.entries(roleDefinitions).map(([role, def]) => (
            <div key={role} className="text-sm">
              <div className="font-medium text-blue-900">{def.label}</div>
              <div className="text-blue-700 text-xs mt-1">{def.description}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RoleManagement;

