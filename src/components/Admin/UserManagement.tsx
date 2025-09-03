import React, { useState, useEffect } from 'react';
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
  Key,
  Eye,
  EyeOff,
  Download,
  Upload,
  Filter,
  MoreVertical,
  CheckCircle,
  Clock,
  Calendar,
  Building,
  GraduationCap,
  Heart,
  ShieldCheck,
  UserCheck,
  Settings
} from 'lucide-react';
import { useAdmin } from '../../contexts/AdminContext';
import { authService, AppUser, UserRole, Permission, ROLE_PERMISSIONS } from '../../services/authService';

interface UserWithChildren extends AppUser {
  children?: UserWithChildren[];
  parentId?: string;
}

interface CreateUserForm {
  email: string;
  password: string;
  confirmPassword: string;
  displayName: string;
  role: UserRole;
  phone: string;
  den: string;
  scoutRank: string;
  emergencyContact: string;
  address: string;
  isActive: boolean;
}

interface EditUserForm {
  displayName: string;
  role: UserRole;
  phone: string;
  den: string;
  scoutRank: string;
  emergencyContact: string;
  address: string;
  isActive: boolean;
}

const UserManagement: React.FC = () => {
  const { state, addNotification } = useAdmin();
  const [users, setUsers] = useState<UserWithChildren[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserWithChildren[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const [denFilter, setDenFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  
  // Selected user for operations
  const [selectedUser, setSelectedUser] = useState<UserWithChildren | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  
  // Form states
  const [createForm, setCreateForm] = useState<CreateUserForm>({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: '',
    role: UserRole.PARENT,
    phone: '',
    den: '',
    scoutRank: '',
    emergencyContact: '',
    address: '',
    isActive: true
  });
  
  const [editForm, setEditForm] = useState<EditUserForm>({
    displayName: '',
    role: UserRole.PARENT,
    phone: '',
    den: '',
    scoutRank: '',
    emergencyContact: '',
    address: '',
    isActive: true
  });
  
  // UI states
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());
  const [isUpdating, setIsUpdating] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'role' | 'den' | 'lastLogin'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Available dens for assignment
  const availableDens = [
    'Lion', 'Tiger', 'Wolf', 'Bear', 'Webelos', 'Arrow of Light',
    'Pack Leadership', 'Committee', 'Volunteer'
  ];

  // Scout ranks
  const scoutRanks = [
    'Lion', 'Tiger', 'Wolf', 'Bear', 'Webelos', 'Arrow of Light'
  ];

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    filterAndSortUsers();
  }, [users, searchTerm, roleFilter, denFilter, statusFilter, sortBy, sortOrder]);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const usersData = await authService.getUsers();
      const usersWithChildren = buildUserHierarchy(usersData);
      setUsers(usersWithChildren);
    } catch (error: any) {
      setError(error.message);
      await addNotification('error', 'Error', 'Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  const buildUserHierarchy = (users: AppUser[]): UserWithChildren[] => {
    const userMap = new Map<string, UserWithChildren>();
    const rootUsers: UserWithChildren[] = [];

    // First pass: create user map
    users.forEach(user => {
      userMap.set(user.uid, { ...user, children: [] });
    });

    // Second pass: build hierarchy
    users.forEach(user => {
      const userWithChildren = userMap.get(user.uid)!;
      
      const isChild = user.role === UserRole.PARENT && 
                     user.profile?.den && 
                     user.profile.scoutRank;
      
      if (isChild) {
        const potentialParent = users.find(u => 
          u.uid !== user.uid && 
          (u.profile?.den === user.profile?.den || 
           u.role === UserRole.VOLUNTEER ||
           u.role === UserRole.ADMIN)
        );
        
        if (potentialParent) {
          const parent = userMap.get(potentialParent.uid);
          if (parent) {
            parent.children = parent.children || [];
            parent.children.push(userWithChildren);
            userWithChildren.parentId = potentialParent.uid;
          }
        } else {
          rootUsers.push(userWithChildren);
        }
      } else {
        rootUsers.push(userWithChildren);
      }
    });

    return rootUsers;
  };

  const filterAndSortUsers = () => {
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

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(user => 
        statusFilter === 'active' ? user.isActive : !user.isActive
      );
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'name':
          aValue = a.displayName || '';
          bValue = b.displayName || '';
          break;
        case 'role':
          aValue = a.role;
          bValue = b.role;
          break;
        case 'den':
          aValue = a.profile?.den || '';
          bValue = b.profile?.den || '';
          break;
        case 'lastLogin':
          aValue = a.lastLoginAt || new Date(0);
          bValue = b.lastLoginAt || new Date(0);
          break;
        default:
          aValue = a.displayName || '';
          bValue = b.displayName || '';
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredUsers(filtered);
  };

  const handleCreateUser = () => {
    setCreateForm({
      email: '',
      password: '',
      confirmPassword: '',
      displayName: '',
      role: UserRole.PARENT,
      phone: '',
      den: '',
      scoutRank: '',
      emergencyContact: '',
      address: '',
      isActive: true
    });
    setShowCreateModal(true);
  };

  const handleEditUser = (user: UserWithChildren) => {
    setSelectedUser(user);
    setEditForm({
      displayName: user.displayName || '',
      role: user.role,
      phone: user.profile?.phone || '',
      den: user.profile?.den || '',
      scoutRank: user.profile?.scoutRank || '',
      emergencyContact: user.profile?.emergencyContact || '',
      address: user.profile?.address || '',
      isActive: user.isActive
    });
    setShowEditModal(true);
  };

  const handleSaveUser = async () => {
    if (!selectedUser) return;

    try {
      setIsUpdating(true);
      
      const updatedProfile = {
        ...selectedUser.profile,
        phone: editForm.phone,
        den: editForm.den,
        scoutRank: editForm.scoutRank,
        emergencyContact: editForm.emergencyContact,
        address: editForm.address
      };

      await authService.updateUserProfile(selectedUser.uid, {
        displayName: editForm.displayName,
        profile: updatedProfile
      });

      // Update role if changed
      if (editForm.role !== selectedUser.role) {
        await authService.updateUserRole(selectedUser.uid, editForm.role);
      }

      await addNotification('success', 'Success', 'User updated successfully');
      setShowEditModal(false);
      loadUsers();
    } catch (error: any) {
      await addNotification('error', 'Error', error.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCreateNewUser = async () => {
    if (createForm.password !== createForm.confirmPassword) {
      await addNotification('error', 'Error', 'Passwords do not match');
      return;
    }

    if (createForm.password.length < 6) {
      await addNotification('error', 'Error', 'Password must be at least 6 characters');
      return;
    }

    try {
      setIsUpdating(true);
      
      const newUser = await authService.createUser(
        createForm.email,
        createForm.password,
        createForm.displayName,
        createForm.role
      );

      // Update profile with additional information
      await authService.updateUserProfile(newUser.uid, {
        profile: {
          phone: createForm.phone,
          den: createForm.den,
          scoutRank: createForm.scoutRank,
          emergencyContact: createForm.emergencyContact,
          address: createForm.address
        }
      });

      await addNotification('success', 'Success', 'User created successfully');
      setShowCreateModal(false);
      loadUsers();
    } catch (error: any) {
      await addNotification('error', 'Error', error.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      setIsUpdating(true);
      await authService.deleteUser(selectedUser.uid);
      await addNotification('success', 'Success', 'User deleted successfully');
      setShowDeleteModal(false);
      loadUsers();
    } catch (error: any) {
      await addNotification('error', 'Error', error.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case UserRole.ROOT: return <Crown className="w-4 h-4 text-yellow-600" />;
      case UserRole.ADMIN: return <Shield className="w-4 h-4 text-red-600" />;
      case UserRole.VOLUNTEER: return <Star className="w-4 h-4 text-green-600" />;
      case UserRole.PARENT: return <Heart className="w-4 h-4 text-purple-600" />;
      case UserRole.ANONYMOUS: return <UserCheck className="w-4 h-4 text-gray-400" />;
      default: return <User className="w-4 h-4" />;
    }
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case UserRole.ROOT: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case UserRole.ADMIN: return 'bg-red-100 text-red-800 border-red-200';
      case UserRole.VOLUNTEER: return 'bg-green-100 text-green-800 border-green-200';
      case UserRole.PARENT: return 'bg-purple-100 text-purple-800 border-purple-200';
      case UserRole.ANONYMOUS: return 'bg-gray-50 text-gray-600 border-gray-100';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatLastLogin = (lastLoginAt?: Date) => {
    if (!lastLoginAt) return 'Never';
    const now = new Date();
    const diff = now.getTime() - lastLoginAt.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    return `${Math.floor(days / 30)} months ago`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        <span className="ml-2 text-gray-600">Loading users...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600">Manage pack members, roles, and permissions</p>
        </div>
        <button
          onClick={handleCreateUser}
          className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Add User
        </button>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Search */}
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

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as UserRole | 'all')}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="all">All Roles</option>
            {Object.values(UserRole).map(role => (
              <option key={role} value={role}>
                {role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </option>
            ))}
          </select>

          {/* Den Filter */}
          <select
            value={denFilter}
            onChange={(e) => setDenFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="all">All Dens</option>
            {availableDens.map(den => (
              <option key={den} value={den}>{den}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          {/* Sort */}
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split('-');
              setSortBy(field as 'name' | 'role' | 'den' | 'lastLogin');
              setSortOrder(order as 'asc' | 'desc');
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="name-asc">Name (A-Z)</option>
            <option value="name-desc">Name (Z-A)</option>
            <option value="role-asc">Role (A-Z)</option>
            <option value="role-desc">Role (Z-A)</option>
            <option value="den-asc">Den (A-Z)</option>
            <option value="den-desc">Den (Z-A)</option>
            <option value="lastLogin-desc">Last Login (Recent)</option>
            <option value="lastLogin-asc">Last Login (Oldest)</option>
          </select>
        </div>
      </div>

      {/* User List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
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
                          <img className="h-10 w-10 rounded-full" src={user.photoURL} alt="" />
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
                        {user.profile?.phone && (
                          <div className="text-xs text-gray-400 flex items-center">
                            <Phone className="w-3 h-3 mr-1" />
                            {user.profile.phone}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getRoleIcon(user.role)}
                      <span className="ml-2 text-sm text-gray-900">
                        {user.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {user.profile?.den || '-'}
                    </div>
                    {user.profile?.scoutRank && (
                      <div className="text-xs text-gray-500">
                        {user.profile.scoutRank}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {formatLastLogin(user.lastLoginAt)}
                    </div>
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
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => handleEditUser(user)}
                        className="text-primary-600 hover:text-primary-900"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setShowDeleteModal(true);
                        }}
                        className="text-red-600 hover:text-red-900"
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

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Create New User</h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="px-6 py-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={createForm.email}
                    onChange={(e) => setCreateForm({...createForm, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Display Name *
                  </label>
                  <input
                    type="text"
                    value={createForm.displayName}
                    onChange={(e) => setCreateForm({...createForm, displayName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={createForm.password}
                      onChange={(e) => setCreateForm({...createForm, password: e.target.value})}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm Password *
                  </label>
                  <input
                    type="password"
                    value={createForm.confirmPassword}
                    onChange={(e) => setCreateForm({...createForm, confirmPassword: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role *
                  </label>
                  <select
                    value={createForm.role}
                    onChange={(e) => setCreateForm({...createForm, role: e.target.value as UserRole})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    {Object.values(UserRole).map(role => (
                      <option key={role} value={role}>
                        {role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={createForm.phone}
                    onChange={(e) => setCreateForm({...createForm, phone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Den
                  </label>
                  <select
                    value={createForm.den}
                    onChange={(e) => setCreateForm({...createForm, den: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">Select Den</option>
                    {availableDens.map(den => (
                      <option key={den} value={den}>{den}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Scout Rank
                  </label>
                  <select
                    value={createForm.scoutRank}
                    onChange={(e) => setCreateForm({...createForm, scoutRank: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">Select Rank</option>
                    {scoutRanks.map(rank => (
                      <option key={rank} value={rank}>{rank}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Emergency Contact
                  </label>
                  <input
                    type="text"
                    value={createForm.emergencyContact}
                    onChange={(e) => setCreateForm({...createForm, emergencyContact: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <textarea
                  value={createForm.address}
                  onChange={(e) => setCreateForm({...createForm, address: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateNewUser}
                disabled={isUpdating}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create User'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Edit User</h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="px-6 py-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Display Name *
                  </label>
                  <input
                    type="text"
                    value={editForm.displayName}
                    onChange={(e) => setEditForm({...editForm, displayName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role *
                  </label>
                  <select
                    value={editForm.role}
                    onChange={(e) => setEditForm({...editForm, role: e.target.value as UserRole})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    {Object.values(UserRole).map(role => (
                      <option key={role} value={role}>
                        {role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Den
                  </label>
                  <select
                    value={editForm.den}
                    onChange={(e) => setEditForm({...editForm, den: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">Select Den</option>
                    {availableDens.map(den => (
                      <option key={den} value={den}>{den}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Scout Rank
                  </label>
                  <select
                    value={editForm.scoutRank}
                    onChange={(e) => setEditForm({...editForm, scoutRank: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">Select Rank</option>
                    {scoutRanks.map(rank => (
                      <option key={rank} value={rank}>{rank}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Emergency Contact
                  </label>
                  <input
                    type="text"
                    value={editForm.emergencyContact}
                    onChange={(e) => setEditForm({...editForm, emergencyContact: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <textarea
                  value={editForm.address}
                  onChange={(e) => setEditForm({...editForm, address: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={editForm.isActive}
                  onChange={(e) => setEditForm({...editForm, isActive: e.target.checked})}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                  User is active
                </label>
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveUser}
                disabled={isUpdating}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Delete User</h3>
            </div>
            
            <div className="px-6 py-4">
              <p className="text-gray-600">
                Are you sure you want to delete <strong>{selectedUser.displayName}</strong>? 
                This action cannot be undone.
              </p>
            </div>
            
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUser}
                disabled={isUpdating}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete User'
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
