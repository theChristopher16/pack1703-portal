import React, { useState, useEffect, useCallback } from 'react';
import { 
  Users, 
  UserPlus, 
  Edit, 
  Trash2, 
  Search, 
  Crown,
  Shield,
  User,
  Star,
  MapPin,
  Phone,
  Mail,
  X,
  Save,
  Loader2,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  ArrowLeft,
  Home
} from 'lucide-react';
import { useAdmin } from '../contexts/AdminContext';
import { authService, AppUser, UserRole, ROLE_PERMISSIONS } from '../services/authService';
import { adminService } from '../services/adminService';
import { Link } from 'react-router-dom';

interface UserWithChildren extends AppUser {
  children?: UserWithChildren[];
  parentId?: string;
}

const AdminUsers: React.FC = () => {
  const { state, addNotification } = useAdmin();
  const [users, setUsers] = useState<UserWithChildren[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserWithChildren[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const [denFilter, setDenFilter] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<UserWithChildren | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Cache for users data
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  // Form state for editing user
  const [editForm, setEditForm] = useState({
    displayName: '',
    email: '',
    phone: '',
    den: '',
    scoutRank: '',
    emergencyContact: '',
    address: '',
    role: UserRole.PARENT,
    isActive: true
  });

  // Available dens for assignment
  const availableDens = [
    'Lion', 'Tiger', 'Wolf', 'Bear', 'Webelos', 'Arrow of Light',
    'Pack Leadership', 'Committee', 'Volunteer'
  ];

  // Check if cache is still valid
  const isCacheValid = useCallback((): boolean => {
    return (Date.now() - lastFetchTime) < CACHE_DURATION;
  }, [lastFetchTime]);

  const loadUsers = useCallback(async (forceRefresh: boolean = false) => {
    // Use cache if available and not forcing refresh
    if (!forceRefresh && users.length > 0 && isCacheValid()) {
      console.log('Using cached users data');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      // Get all users from auth service
      const usersData = await authService.getUsers();
      
      // Transform users to include hierarchical structure (optimized)
      const usersWithChildren = buildUserHierarchyOptimized(usersData);
      
      setUsers(usersWithChildren);
      setLastFetchTime(Date.now());
    } catch (error: any) {
      setError(error.message);
      await addNotification('error', 'Error', 'Failed to load users');
    } finally {
      setIsLoading(false);
    }
  }, [users.length, isCacheValid, addNotification]);

  const buildUserHierarchyOptimized = (users: AppUser[]): UserWithChildren[] => {
    const userMap = new Map<string, UserWithChildren>();
    const rootUsers: UserWithChildren[] = [];
    const denGroups = new Map<string, UserWithChildren[]>();

    // First pass: create user map and group by den for faster parent lookup
    users.forEach(user => {
      const userWithChildren = { ...user, children: [] };
      userMap.set(user.uid, userWithChildren);
      
      // Group by den for faster parent-child matching
      if (user.profile?.den) {
        if (!denGroups.has(user.profile.den)) {
          denGroups.set(user.profile.den, []);
        }
        denGroups.get(user.profile.den)!.push(userWithChildren);
      }
    });

    // Second pass: build hierarchy with optimized parent lookup
    users.forEach(user => {
      const userWithChildren = userMap.get(user.uid)!;
      
      // Check if this user is a child (has scout rank and den)
      const isChild = user.role === UserRole.PARENT && 
                     user.profile?.den && 
                     user.profile.scoutRank;
      
      if (isChild) {
        // Find potential parent using den groups for faster lookup
        const denUsers = denGroups.get(user.profile?.den || '') || [];
        const potentialParent = denUsers.find(u => 
          u.uid !== user.uid && 
          (u.role === UserRole.VOLUNTEER || u.role === UserRole.ADMIN)
        );
        
        if (potentialParent) {
          potentialParent.children = potentialParent.children || [];
          potentialParent.children.push(userWithChildren);
          userWithChildren.parentId = potentialParent.uid;
        } else {
          rootUsers.push(userWithChildren);
        }
      } else {
        rootUsers.push(userWithChildren);
      }
    });

    return rootUsers;
  };

  const filterUsers = useCallback(() => {
    let filtered = [...users];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.profile?.den?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.profile?.scoutRank?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    // Den filter
    if (denFilter !== 'all') {
      filtered = filtered.filter(user => user.profile?.den === denFilter);
    }

    setFilteredUsers(filtered);
  }, [users, searchTerm, roleFilter, denFilter]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    filterUsers();
  }, [filterUsers]);

  const handleEditUser = (user: UserWithChildren) => {
    setSelectedUser(user);
    setEditForm({
      displayName: user.displayName || '',
      email: user.email,
      phone: user.profile?.phone || '',
      den: user.profile?.den || '',
      scoutRank: user.profile?.scoutRank || '',
      emergencyContact: user.profile?.emergencyContact || '',
      address: user.profile?.address || '',
      role: user.role,
      isActive: user.isActive
    });
    setShowUserModal(true);
  };

  const handleSaveUser = async () => {
    if (!selectedUser) return;

    try {
      setIsUpdating(true);
      
      // Update user profile
      const updatedProfile = {
        ...selectedUser.profile,
        phone: editForm.phone,
        den: editForm.den,
        scoutRank: editForm.scoutRank,
        emergencyContact: editForm.emergencyContact,
        address: editForm.address
      };

      // Update user using Cloud Function
      const updates = {
        displayName: editForm.displayName,
        profile: updatedProfile,
        role: editForm.role,
        permissions: ROLE_PERMISSIONS[editForm.role]
      };

      const result = await adminService.updateUser(selectedUser.uid, updates);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to update user');
      }

      await loadUsers();
      setShowUserModal(false);
      await addNotification('success', 'Success', 'User updated successfully');
    } catch (error: any) {
      setError(error.message);
      await addNotification('error', 'Error', 'Failed to update user');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      setIsUpdating(true);
      const success = await authService.deleteUser(selectedUser.uid);
      if (success) {
        await loadUsers();
        setShowDeleteModal(false);
        setShowUserModal(false);
        await addNotification('success', 'Success', 'User deleted successfully');
      }
    } catch (error: any) {
      setError(error.message);
      await addNotification('error', 'Error', 'Failed to delete user');
    } finally {
      setIsUpdating(false);
    }
  };

  const toggleUserExpansion = (userId: string) => {
    const newExpanded = new Set(expandedUsers);
    if (newExpanded.has(userId)) {
      newExpanded.delete(userId);
    } else {
      newExpanded.add(userId);
    }
    setExpandedUsers(newExpanded);
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case UserRole.ROOT: return <Crown className="w-4 h-4 text-yellow-600" />;
      case UserRole.ADMIN: return <Shield className="w-4 h-4 text-red-600" />;
      case UserRole.VOLUNTEER: return <Users className="w-4 h-4 text-green-600" />;
      case UserRole.PARENT: return <Star className="w-4 h-4 text-purple-600" />;
      default: return <User className="w-4 h-4 text-gray-600" />;
    }
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case UserRole.ROOT: return 'bg-yellow-100 text-yellow-800';
      case UserRole.ADMIN: return 'bg-red-100 text-red-800';
      case UserRole.VOLUNTEER: return 'bg-green-100 text-green-800';
      case UserRole.PARENT: return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const renderUserCard = (user: UserWithChildren, level: number = 0) => {
    const isExpanded = expandedUsers.has(user.uid);
    const hasChildren = user.children && user.children.length > 0;

    return (
      <div key={user.uid} className="mb-4">
        <div 
          className={`bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 ${
            level > 0 ? 'ml-8' : ''
          }`}
        >
          <div className="p-6">
            <div className="flex items-start space-x-4">
              {/* Profile Photo */}
              <div className="relative">
                <div className="w-16 h-16 rounded-full overflow-hidden border-4 border-yellow-400">
                  {user.photoURL ? (
                    <img 
                      src={user.photoURL} 
                      alt={user.displayName || 'User'} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white font-bold text-lg">
                      {user.displayName?.charAt(0) || user.email.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                {user.isActive ? (
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white"></div>
                ) : (
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-gray-400 rounded-full border-2 border-white"></div>
                )}
              </div>

              {/* User Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                      <span>{user.displayName || 'Unnamed User'}</span>
                      {getRoleIcon(user.role)}
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleBadgeColor(user.role)}`}>
                        {user.role.replace('_', ' ')}
                      </span>
                    </h3>
                    
                    {user.profile?.nickname && (
                      <p className="text-sm text-gray-600 italic">"{user.profile.nickname}"</p>
                    )}
                    
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center text-sm text-gray-600">
                        <Mail className="w-4 h-4 mr-2" />
                        <span className="truncate">{user.email}</span>
                      </div>
                      
                      {user.profile?.phone && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Phone className="w-4 h-4 mr-2" />
                          <span>{user.profile.phone}</span>
                        </div>
                      )}
                      
                      {user.profile?.den && (
                        <div className="flex items-center text-sm text-gray-600">
                          <MapPin className="w-4 h-4 mr-2" />
                          <span className="font-medium text-primary-600">{user.profile.den}</span>
                          {user.profile.scoutRank && (
                            <span className="ml-2 text-gray-500">• {user.profile.scoutRank}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2">
                    {hasChildren && (
                      <button
                        onClick={() => toggleUserExpansion(user.uid)}
                        className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </button>
                    )}
                    
                    <button
                      onClick={() => handleEditUser(user)}
                      className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                      title="Edit user"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={() => {
                        setSelectedUser(user);
                        setShowDeleteModal(true);
                      }}
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                      title="Delete user"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Children */}
        {hasChildren && isExpanded && (
          <div className="mt-2">
            {user.children!.map(child => renderUserCard(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  if (!state.isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-primary-50/30 to-secondary-50/30 py-12">
        <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-display font-bold text-gray-900 mb-2">
              Admin Access Required
            </h1>
            <p className="text-gray-600">
              Please log in to access user management
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-primary-50/30 to-secondary-50/30 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-display font-bold mb-6 bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
            User Management
          </h1>
          <p className="text-xl text-gray-700 max-w-3xl mx-auto leading-relaxed mb-8">
            Manage Pack 1703 members, assign dens, and maintain user profiles
          </p>
          
          {/* Back to User Portal Button */}
          <div className="flex justify-center mb-8">
            <Link
              to="/"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              <Home className="w-5 h-5 mr-2" />
              Back to User Portal
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Total Users</p>
                <p className="text-3xl font-bold">{users.length}</p>
              </div>
              <div className="text-blue-200 text-4xl">👥</div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Active Users</p>
                <p className="text-3xl font-bold">{users.filter(u => u.isActive).length}</p>
              </div>
              <div className="text-green-200 text-4xl">✅</div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Den Leaders</p>
                <p className="text-3xl font-bold">{users.filter(u => u.role === UserRole.VOLUNTEER).length}</p>
              </div>
              <div className="text-purple-200 text-4xl">🏆</div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm font-medium">Scouts</p>
                <p className="text-3xl font-bold">{users.filter(u => u.profile?.scoutRank).length}</p>
              </div>
              <div className="text-orange-200 text-4xl">🎯</div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-soft mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as UserRole | 'all')}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">All Roles</option>
              <option value={UserRole.ROOT}>Root</option>
              <option value={UserRole.ADMIN}>Admin</option>
              <option value={UserRole.VOLUNTEER}>Volunteer</option>
              <option value={UserRole.PARENT}>Parent</option>
            </select>
            
            <select
              value={denFilter}
              onChange={(e) => setDenFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">All Dens</option>
              {availableDens.map(den => (
                <option key={den} value={den}>{den}</option>
              ))}
            </select>
            
            <button
              onClick={() => {
                setSelectedUser(null);
                setEditForm({
                  displayName: '',
                  email: '',
                  phone: '',
                  den: '',
                  scoutRank: '',
                  emergencyContact: '',
                  address: '',
                  role: UserRole.PARENT,
                  isActive: true
                });
                setShowUserModal(true);
              }}
              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-primary-500 to-secondary-600 text-white rounded-lg hover:from-primary-600 hover:to-secondary-700 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Add User
            </button>
          </div>
        </div>

        {/* Users List */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 border border-white/50 shadow-soft">
          <h2 className="text-2xl font-display font-semibold text-gray-800 mb-6 flex items-center">
            <span className="w-2 h-8 bg-gradient-to-b from-primary-500 to-secondary-500 rounded-full mr-4"></span>
            Pack Members ({filteredUsers.length})
          </h2>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
              <span className="ml-3 text-gray-600">Loading users...</span>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-12">
              <AlertCircle className="w-8 h-8 text-red-500" />
              <span className="ml-3 text-red-600">{error}</span>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
              <p className="text-gray-600">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredUsers.map(user => renderUserCard(user))}
            </div>
          )}
        </div>
      </div>

      {/* Edit User Modal */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {selectedUser ? 'Edit User' : 'Add User'}
              </h2>
              <button
                onClick={() => setShowUserModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Display Name
                </label>
                <input
                  type="text"
                  value={editForm.displayName}
                  onChange={(e) => setEditForm({...editForm, displayName: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Den Assignment
                </label>
                <select
                  value={editForm.den}
                  onChange={(e) => setEditForm({...editForm, den: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">Select Den</option>
                  {availableDens.map(den => (
                    <option key={den} value={den}>{den}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Scout Rank
                </label>
                <input
                  type="text"
                  value={editForm.scoutRank}
                  onChange={(e) => setEditForm({...editForm, scoutRank: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="e.g., Wolf, Bear, Webelos"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Emergency Contact
                </label>
                <input
                  type="text"
                  value={editForm.emergencyContact}
                  onChange={(e) => setEditForm({...editForm, emergencyContact: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role
                </label>
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm({...editForm, role: e.target.value as UserRole})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value={UserRole.PARENT}>Parent</option>
                  <option value={UserRole.VOLUNTEER}>Volunteer</option>
                  <option value={UserRole.ADMIN}>Admin</option>
                  <option value={UserRole.ROOT}>Root</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address
                </label>
                <textarea
                  value={editForm.address}
                  onChange={(e) => setEditForm({...editForm, address: e.target.value})}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-4 mt-8">
              <button
                onClick={() => setShowUserModal(false)}
                className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveUser}
                disabled={isUpdating}
                className="inline-flex items-center px-6 py-2 bg-gradient-to-r from-primary-500 to-secondary-600 text-white rounded-lg hover:from-primary-600 hover:to-secondary-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50"
              >
                {isUpdating ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                {isUpdating ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full">
            <div className="text-center">
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Delete User</h2>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete <strong>{selectedUser.displayName}</strong>? 
                This action cannot be undone.
              </p>
              
              <div className="flex items-center justify-center space-x-4">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteUser}
                  disabled={isUpdating}
                  className="inline-flex items-center px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {isUpdating ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4 mr-2" />
                  )}
                  {isUpdating ? 'Deleting...' : 'Delete User'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
