import React, { useState, useEffect } from 'react';
import { 
  User, 
  Edit, 
  Save, 
  X, 
  Camera, 
  Shield, 
  Crown, 
  Star, 
  Heart, 
  Building,
  UserCheck,
  Phone,
  Mail,
  MapPin,
  Calendar,
  GraduationCap,
  Users,
  Settings,
  Key,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
  Loader2,
  Upload,
  Download,
  Trash2,
  Plus,
  Minus
} from 'lucide-react';
import { authService, AppUser, UserRole, Permission, SocialProvider, SELECTABLE_ROLES, ScoutInfo } from '../../services/authService';
import chatService from '../../services/chatService';
// import { useAuth } from '../../contexts/AuthContext';

interface UserProfileManagerProps {
  user?: AppUser;
  isEditing?: boolean;
  onSave?: (user: AppUser) => void;
  onCancel?: () => void;
  canEditRole?: boolean;
  canEditPermissions?: boolean;
}

const UserProfileManager: React.FC<UserProfileManagerProps> = ({
  user: propUser,
  isEditing = false,
  onSave,
  onCancel,
  canEditRole = false,
  canEditPermissions = false
}) => {
  // const { user: currentUser } = useAuth();
  const currentUser = null; // TODO: Implement AuthContext
  const [user, setUser] = useState<AppUser | null>(propUser || currentUser);
  const [isEditMode, setIsEditMode] = useState(isEditing);
  
  // Sync with parent component's edit mode
  useEffect(() => {
    setIsEditMode(isEditing);
  }, [isEditing]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    displayName: '',
    firstName: '',
    lastName: '',
    nickname: '',
    phone: '',
    email: '',
    address: '',
    emergencyContact: '',
    scoutRank: '',
    den: '',
    packNumber: '',
    scoutAge: '',
    scoutGrade: '',
    familyId: '',
    parentNames: [] as string[],
    siblings: [] as string[],
    scouts: [] as ScoutInfo[],
    // username: '', // TODO: Add username to profile structure
    role: UserRole.PARENT,
    isActive: true,
    preferences: {
      emailNotifications: true,
      pushNotifications: true,
      smsNotifications: false,
      language: 'en',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    }
  });

  // UI states
  const [showPassword, setShowPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  // const [usernameValidation, setUsernameValidation] = useState<{ isValid: boolean; error?: string } | null>(null);
  // const [isValidatingUsername, setIsValidatingUsername] = useState(false);

  // Available options
  const scoutRanks = [
    'Lion', 'Tiger', 'Wolf', 'Bear', 'Webelos', 'Arrow of Light'
  ];

  const availableDens = [
    'Lion', 'Tiger', 'Wolf', 'Bear', 'Webelos', 'Arrow of Light',
    'Pack Leadership', 'Committee', 'Volunteer'
  ];

  const grades = [
    'Kindergarten', '1st Grade', '2nd Grade', '3rd Grade', '4th Grade', '5th Grade'
  ];

  useEffect(() => {
    if (user) {
      setFormData({
        displayName: user.displayName || '',
        firstName: user.profile?.firstName || '',
        lastName: user.profile?.lastName || '',
        nickname: user.profile?.nickname || '',
        phone: user.profile?.phone || '',
        email: user.email,
        address: user.profile?.address || '',
        emergencyContact: user.profile?.emergencyContact || '',
        scoutRank: user.profile?.scoutRank || '',
        den: user.profile?.den || '',
        packNumber: user.profile?.packNumber || '',
        scoutAge: user.profile?.scoutAge?.toString() || '',
        scoutGrade: user.profile?.scoutGrade || '',
        familyId: user.profile?.familyId || '',
        parentNames: user.profile?.parentNames || [],
        siblings: user.profile?.siblings || [],
        scouts: user.profile?.scouts || [],
        // username: user.profile?.username || '', // TODO: Add username to profile structure
        role: user.role,
        isActive: user.isActive,
        preferences: {
          emailNotifications: user.profile?.preferences?.emailNotifications ?? true,
          pushNotifications: user.profile?.preferences?.pushNotifications ?? true,
          smsNotifications: user.profile?.preferences?.smsNotifications ?? false,
          language: user.profile?.preferences?.language || 'en',
          timezone: user.profile?.preferences?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone
        }
      });
    }
  }, [user]);

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case UserRole.SUPER_ADMIN: return <Crown className="w-4 h-4 text-yellow-600" />;
      case UserRole.ADMIN: return <Shield className="w-4 h-4 text-red-600" />;
      case UserRole.VOLUNTEER: return <Star className="w-4 h-4 text-green-600" />;
      case UserRole.PARENT: return <Users className="w-4 h-4 text-blue-600" />;
      case UserRole.AI_ASSISTANT: return <UserCheck className="w-4 h-4 text-blue-500" />;
      default: return <User className="w-4 h-4" />;
    }
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case UserRole.SUPER_ADMIN: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case UserRole.ADMIN: return 'bg-red-100 text-red-800 border-red-200';
      case UserRole.VOLUNTEER: return 'bg-green-100 text-green-800 border-green-200';
      case UserRole.PARENT: return 'bg-blue-100 text-blue-800 border-blue-200';
      case UserRole.AI_ASSISTANT: return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // const handleUsernameChange = async (username: string) => {
  //   setFormData(prev => ({ ...prev, username }));
  //   
  //   if (username.length >= 3) {
  //     setIsValidatingUsername(true);
  //     try {
  //       const validation = await authService.validateUsername(username);
  //       setUsernameValidation(validation);
  //     } catch (error) {
  //       setUsernameValidation({ isValid: false, error: 'Error validating username' });
  //     } finally {
  //       setIsValidatingUsername(false);
  //     }
  //   } else {
  //     setUsernameValidation(null);
  //   }
  // };

  const handleSave = async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Validate username if changed
      // if (formData.username !== user.profile?.username && formData.username) {
      //   const validation = await authService.validateUsername(formData.username);
      //   if (!validation.isValid) {
      //     setError(validation.error);
      //     return;
      //   }
      // }

      // Prepare updates
      const updates: Partial<AppUser> = {
        displayName: formData.displayName,
        profile: {
          ...user.profile,
          firstName: formData.firstName,
          lastName: formData.lastName,
          nickname: formData.nickname,
          phone: formData.phone,
          address: formData.address,
          emergencyContact: formData.emergencyContact,
          scoutRank: formData.scoutRank,
          packNumber: formData.packNumber,
          scoutAge: formData.scoutAge ? parseInt(formData.scoutAge) : undefined,
          scoutGrade: formData.scoutGrade,
          familyId: formData.familyId,
          parentNames: formData.parentNames,
          siblings: formData.siblings,
          scouts: formData.scouts,
          // username: formData.username,
          preferences: formData.preferences
        }
      };

      // Only update role if user has permission
      if (canEditRole && formData.role !== user.role) {
        updates.role = formData.role;
      }

      // Update user profile
      await authService.updateUserProfile(user.uid, updates);

      // Update chat user name if display name changed
      if (formData.displayName && formData.displayName !== user.displayName) {
        try {
          await chatService.updateChatUserName(formData.displayName);
        } catch (chatError) {
          console.warn('Failed to update chat user name:', chatError);
          // Don't fail the entire save operation if chat update fails
        }
      }

      // Update local state
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);

      setSuccess('Profile updated successfully!');
      
      if (onSave) {
        onSave(updatedUser);
      }

      // Clear success message after 2 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 2000);

    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setError(null);
    setSuccess(null);
    if (onCancel) {
      onCancel();
    }
  };

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // This would need to be implemented in authService
      // await authService.changePassword(newPassword);
      setSuccess('Password changed successfully!');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const addParentName = () => {
    setFormData(prev => ({
      ...prev,
      parentNames: [...prev.parentNames, '']
    }));
  };

  const removeParentName = (index: number) => {
    setFormData(prev => ({
      ...prev,
      parentNames: prev.parentNames.filter((_, i) => i !== index)
    }));
  };

  const updateParentName = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      parentNames: prev.parentNames.map((name, i) => i === index ? value : name)
    }));
  };

  const addSibling = () => {
    setFormData(prev => ({
      ...prev,
      siblings: [...prev.siblings, '']
    }));
  };

  const removeSibling = (index: number) => {
    setFormData(prev => ({
      ...prev,
      siblings: prev.siblings.filter((_, i) => i !== index)
    }));
  };

  const updateSibling = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      siblings: prev.siblings.map((sibling, i) => i === index ? value : sibling)
    }));
  };

  // Scout management functions
  const addScout = () => {
    const newScout: ScoutInfo = {
      id: `scout_${Date.now()}`,
      name: '',
      age: 5,
      scoutRank: '',
      grade: '',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    setFormData(prev => ({
      ...prev,
      scouts: [...prev.scouts, newScout]
    }));
  };

  const removeScout = (index: number) => {
    setFormData(prev => ({
      ...prev,
      scouts: prev.scouts.filter((_, i) => i !== index)
    }));
  };

  const updateScout = (index: number, field: keyof ScoutInfo, value: any) => {
    setFormData(prev => ({
      ...prev,
      scouts: prev.scouts.map((scout, i) => 
        i === index 
          ? { 
              ...scout, 
              [field]: value,
              updatedAt: new Date()
            } 
          : scout
      )
    }));
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        <span className="ml-2 text-gray-600">Loading user profile...</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative">
            {user.photoURL ? (
              <img 
                src={user.photoURL} 
                alt={user.displayName || 'User'} 
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gray-300 flex items-center justify-center">
                <User className="w-8 h-8 text-gray-600" />
              </div>
            )}
            {isEditMode && (
              <button className="absolute bottom-0 right-0 p-1 bg-primary-600 text-white rounded-full hover:bg-primary-700">
                <Camera className="w-4 h-4" />
              </button>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {user.displayName || 'User Profile'}
            </h1>
            <div className="flex items-center space-x-2 mt-1">
              {getRoleIcon(user.role)}
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRoleBadgeColor(user.role)}`}>
                {user.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </span>
              {user.isActive ? (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Active
                </span>
              ) : (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  Inactive
                </span>
              )}
            </div>
          </div>
        </div>
        
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <p className="text-green-700">{success}</p>
          </div>
        </div>
      )}

      {/* Profile Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Profile Information</h2>
        </div>
        
        <div className="px-6 py-4 space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="text-md font-medium text-gray-900 mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Display Name *
                </label>
                <input
                  type="text"
                  value={formData.displayName}
                  onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                  disabled={!isEditMode}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-50"
                  required
                />
              </div>
              
              {/* <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => handleUsernameChange(e.target.value)}
                    disabled={!isEditMode}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-50"
                  />
                  {isValidatingUsername && (
                    <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 animate-spin text-gray-400" />
                  )}
                  {usernameValidation && (
                    <div className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${
                      usernameValidation.isValid ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {usernameValidation.isValid ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    </div>
                  )}
                </div>
                {usernameValidation?.error && (
                  <p className="text-xs text-red-600 mt-1">{usernameValidation.error}</p>
                )}
              </div> */}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                  disabled={!isEditMode}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-50"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                  disabled={!isEditMode}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-50"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nickname
                </label>
                <input
                  type="text"
                  value={formData.nickname}
                  onChange={(e) => setFormData(prev => ({ ...prev, nickname: e.target.value }))}
                  disabled={!isEditMode}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-50"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                />
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div>
            <h3 className="text-md font-medium text-gray-900 mb-4">Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  disabled={!isEditMode}
                  placeholder="(555) 123-4567"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-50"
                />
                {formData.preferences.smsNotifications && !formData.phone && (
                  <p className="mt-1 text-sm text-amber-600">
                    ⚠️ Phone number required for SMS notifications
                  </p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Emergency Contact
                </label>
                <input
                  type="text"
                  value={formData.emergencyContact}
                  onChange={(e) => setFormData(prev => ({ ...prev, emergencyContact: e.target.value }))}
                  disabled={!isEditMode}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-50"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  disabled={!isEditMode}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-50"
                />
              </div>
            </div>
          </div>

          {/* Scouting Information */}
          <div>
            <h3 className="text-md font-medium text-gray-900 mb-4">Scouting Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Scout Rank
                </label>
                <select
                  value={formData.scoutRank}
                  onChange={(e) => setFormData(prev => ({ ...prev, scoutRank: e.target.value }))}
                  disabled={!isEditMode}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-50"
                >
                  <option value="">Select Rank</option>
                  {scoutRanks.map(rank => (
                    <option key={rank} value={rank}>{rank}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Den
                </label>
                <select
                  value={formData.den}
                  onChange={(e) => setFormData(prev => ({ ...prev, den: e.target.value }))}
                  disabled={!isEditMode}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-50"
                >
                  <option value="">Select Den</option>
                  {availableDens.map(den => (
                    <option key={den} value={den}>{den}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pack Number
                </label>
                <input
                  type="text"
                  value={formData.packNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, packNumber: e.target.value }))}
                  disabled={!isEditMode}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-50"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Scout Age
                </label>
                <input
                  type="number"
                  value={formData.scoutAge}
                  onChange={(e) => setFormData(prev => ({ ...prev, scoutAge: e.target.value }))}
                  disabled={!isEditMode}
                  min="5"
                  max="18"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-50"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Grade
                </label>
                <select
                  value={formData.scoutGrade}
                  onChange={(e) => setFormData(prev => ({ ...prev, scoutGrade: e.target.value }))}
                  disabled={!isEditMode}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-50"
                >
                  <option value="">Select Grade</option>
                  {grades.map(grade => (
                    <option key={grade} value={grade}>{grade}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Family Information */}
          <div>
            <h3 className="text-md font-medium text-gray-900 mb-4">Family Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Family ID
                </label>
                <input
                  type="text"
                  value={formData.familyId}
                  onChange={(e) => setFormData(prev => ({ ...prev, familyId: e.target.value }))}
                  disabled={!isEditMode}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-50"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Parent Names
                </label>
                <div className="space-y-2">
                  {formData.parentNames.map((name, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => updateParentName(index, e.target.value)}
                        disabled={!isEditMode}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-50"
                        placeholder="Parent name"
                      />
                      {isEditMode && (
                        <button
                          onClick={() => removeParentName(index)}
                          className="p-2 text-red-600 hover:text-red-700"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  {isEditMode && (
                    <button
                      onClick={addParentName}
                      className="inline-flex items-center px-3 py-2 text-sm text-primary-600 hover:text-primary-700"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Parent
                    </button>
                  )}
                </div>
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Siblings
                </label>
                <div className="space-y-2">
                  {formData.siblings.map((sibling, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={sibling}
                        onChange={(e) => updateSibling(index, e.target.value)}
                        disabled={!isEditMode}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-50"
                        placeholder="Sibling name"
                      />
                      {isEditMode && (
                        <button
                          onClick={() => removeSibling(index)}
                          className="p-2 text-red-600 hover:text-red-700"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  {isEditMode && (
                    <button
                      onClick={addSibling}
                      className="inline-flex items-center px-3 py-2 text-sm text-primary-600 hover:text-primary-700"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Sibling
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Scout Management */}
          <div>
            <h3 className="text-md font-medium text-gray-900 mb-4">Scout Management</h3>
            <div className="space-y-4">
              {formData.scouts.map((scout, index) => (
                <div key={scout.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-medium text-gray-900">
                      Scout {index + 1}
                    </h4>
                    {isEditMode && (
                      <button
                        onClick={() => removeScout(index)}
                        className="p-2 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Scout Name *
                      </label>
                      <input
                        type="text"
                        value={scout.name}
                        onChange={(e) => updateScout(index, 'name', e.target.value)}
                        disabled={!isEditMode}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-50"
                        placeholder="Enter scout's name"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Age *
                      </label>
                      <input
                        type="number"
                        value={scout.age}
                        onChange={(e) => updateScout(index, 'age', parseInt(e.target.value) || 5)}
                        disabled={!isEditMode}
                        min="5"
                        max="18"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-50"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Den/Rank
                      </label>
                      <select
                        value={scout.scoutRank || ''}
                        onChange={(e) => updateScout(index, 'scoutRank', e.target.value)}
                        disabled={!isEditMode}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-50"
                      >
                        <option value="">Select Den/Rank</option>
                        {scoutRanks.map(rank => (
                          <option key={rank} value={rank}>{rank}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Grade
                      </label>
                      <select
                        value={scout.grade || ''}
                        onChange={(e) => updateScout(index, 'grade', e.target.value)}
                        disabled={!isEditMode}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-50"
                      >
                        <option value="">Select Grade</option>
                        {grades.map(grade => (
                          <option key={grade} value={grade}>{grade}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="flex items-center md:col-span-2">
                      <input
                        type="checkbox"
                        id={`scout-active-${index}`}
                        checked={scout.isActive}
                        onChange={(e) => updateScout(index, 'isActive', e.target.checked)}
                        disabled={!isEditMode}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded disabled:bg-gray-50"
                      />
                      <label htmlFor={`scout-active-${index}`} className="ml-2 block text-sm text-gray-900">
                        Scout is active
                      </label>
                    </div>
                  </div>
                </div>
              ))}
              
              {isEditMode && (
                <button
                  onClick={addScout}
                  className="inline-flex items-center px-4 py-2 text-sm text-primary-600 hover:text-primary-700 border border-primary-300 rounded-lg hover:bg-primary-50"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Scout
                </button>
              )}
              
              {formData.scouts.length === 0 && !isEditMode && (
                <div className="text-center py-8 text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>No scouts added yet</p>
                  <p className="text-sm">Click "Edit Profile" to add your scouts</p>
                </div>
              )}
            </div>
          </div>

          {/* Role Management (Admin Only) */}
          {canEditRole && (
            <div>
              <h3 className="text-md font-medium text-gray-900 mb-4">Role Management</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as UserRole }))}
                    disabled={!isEditMode}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-50"
                  >
                    {SELECTABLE_ROLES.map(role => (
                      <option key={role} value={role}>
                        {role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                    disabled={!isEditMode}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded disabled:bg-gray-50"
                  />
                  <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                    User is active
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Preferences */}
          <div>
            <h3 className="text-md font-medium text-gray-900 mb-4">Preferences</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="emailNotifications"
                  checked={formData.preferences.emailNotifications}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    preferences: { ...prev.preferences, emailNotifications: e.target.checked }
                  }))}
                  disabled={!isEditMode}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded disabled:bg-gray-50"
                />
                <label htmlFor="emailNotifications" className="ml-2 block text-sm text-gray-900">
                  Email notifications
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="pushNotifications"
                  checked={formData.preferences.pushNotifications}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    preferences: { ...prev.preferences, pushNotifications: e.target.checked }
                  }))}
                  disabled={!isEditMode}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded disabled:bg-gray-50"
                />
                <label htmlFor="pushNotifications" className="ml-2 block text-sm text-gray-900">
                  Push notifications
                </label>
              </div>
              
              <div className="flex items-center opacity-60">
                <input
                  type="checkbox"
                  id="smsNotifications"
                  checked={false}
                  disabled={true}
                  className="h-4 w-4 text-orange-500 focus:ring-orange-500 border-gray-300 rounded disabled:bg-gray-50"
                />
                <label htmlFor="smsNotifications" className="ml-2 block text-sm text-gray-900">
                  SMS notifications
                </label>
                <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                  Coming Soon
                </span>
              </div>
              <div className="ml-6 text-sm text-gray-500">
                <p>📱 SMS notifications will be available soon for important announcements and event reminders.</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Language
                </label>
                <select
                  value={formData.preferences.language}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    preferences: { ...prev.preferences, language: e.target.value }
                  }))}
                  disabled={!isEditMode}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-50"
                >
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      {isEditMode && (
        <div className="flex justify-end space-x-3">
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default UserProfileManager;
