import React, { useState, useEffect } from 'react';
import { userApprovalService, adminService, UserStatus, UserRole } from '../../services/userApprovalService';
import { CheckCircle, XCircle, Clock, User, Mail, Shield, AlertCircle } from 'lucide-react';

/**
 * User Signup Component
 */
export const UserSignupForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const result = await userApprovalService.signUp(email, password, displayName);
    
    setMessage(result.message);
    setMessageType(result.success ? 'success' : 'error');
    setLoading(false);

    if (result.success) {
      setEmail('');
      setPassword('');
      setDisplayName('');
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
        Join Pack 1703
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-1">
            Full Name
          </label>
          <input
            type="text"
            id="displayName"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email Address
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            minLength={6}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {loading ? 'Creating Account...' : 'Create Account'}
        </button>
      </form>

      {message && (
        <div className={`mt-4 p-3 rounded-md ${
          messageType === 'success' ? 'bg-green-100 text-green-700' : 
          messageType === 'error' ? 'bg-red-100 text-red-700' : 
          'bg-gray-100 text-gray-700'
        }`}>
          {message}
        </div>
      )}

      <div className="mt-6 text-center text-sm text-gray-600">
        <p>After creating your account, it will be reviewed by our administrators.</p>
        <p>You'll receive an email notification once your account is approved.</p>
      </div>
    </div>
  );
};

/**
 * User Status Component - Shows current user's approval status
 */
export const UserStatusDisplay: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [userDoc, setUserDoc] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = userApprovalService.onAuthStateChange((user, userDoc) => {
      setUser(user);
      setUserDoc(userDoc);
    });

    return unsubscribe;
  }, []);

  if (!user || !userDoc) {
    return null;
  }

  const getStatusIcon = () => {
    switch (userDoc.status) {
      case UserStatus.APPROVED:
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case UserStatus.PENDING:
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case UserStatus.DENIED:
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusMessage = () => {
    switch (userDoc.status) {
      case UserStatus.APPROVED:
        return 'Your account has been approved! You can now access all features.';
      case UserStatus.PENDING:
        return 'Your account is pending approval. Please wait for an administrator to review your application.';
      case UserStatus.DENIED:
        return 'Your account has been denied. Please contact an administrator for more information.';
      default:
        return 'Unknown account status.';
    }
  };

  const getStatusColor = () => {
    switch (userDoc.status) {
      case UserStatus.APPROVED:
        return 'bg-green-100 text-green-800';
      case UserStatus.PENDING:
        return 'bg-yellow-100 text-yellow-800';
      case UserStatus.DENIED:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center space-x-3 mb-4">
        {getStatusIcon()}
        <h3 className="text-lg font-semibold text-gray-900">Account Status</h3>
      </div>
      
      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor()}`}>
        {userDoc.status.charAt(0).toUpperCase() + userDoc.status.slice(1)}
      </div>
      
      <p className="mt-3 text-gray-600">{getStatusMessage()}</p>
      
      {userDoc.status === UserStatus.APPROVED && (
        <div className="mt-4 p-3 bg-blue-50 rounded-md">
          <div className="flex items-center space-x-2">
            <Shield className="w-4 h-4 text-blue-500" />
            <span className="text-sm font-medium text-blue-800">Role: {userDoc.role}</span>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Admin User Management Component
 */
export const AdminUserManagement: React.FC = () => {
  const [pendingUsers, setPendingUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [approvalRole, setApprovalRole] = useState<UserRole>(UserRole.PARENT);
  const [reason, setReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadPendingUsers();
  }, []);

  const loadPendingUsers = async () => {
    try {
      setLoading(true);
      console.log('Loading pending users...');
      const users = await adminService.getPendingUsers();
      console.log('Pending users loaded:', users);
      setPendingUsers(users);
    } catch (error) {
      console.error('Error loading pending users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (user: any) => {
    setActionLoading(true);
    try {
      const result = await adminService.approveUser(
        user.id, 
        approvalRole, 
        reason
      );
      
      if (result.success) {
        await loadPendingUsers();
        setSelectedUser(null);
        setReason('');
      }
    } catch (error) {
      console.error('Error approving user:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeny = async (user: any) => {
    setActionLoading(true);
    try {
      const result = await adminService.denyUser(user.id, reason);
      
      if (result.success) {
        await loadPendingUsers();
        setSelectedUser(null);
        setReason('');
      }
    } catch (error) {
      console.error('Error denying user:', error);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Pending User Approvals</h2>
      
      {pendingUsers.length === 0 ? (
        <div className="text-center py-8">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <p className="text-gray-600">No pending users to review.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingUsers.map((user) => (
            <div key={user.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <User className="w-8 h-8 text-gray-400" />
                  <div>
                    <h3 className="font-semibold text-gray-900">{user.displayName}</h3>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Mail className="w-4 h-4" />
                      <span>{user.email}</span>
                    </div>
                    <p className="text-xs text-gray-500">
                      Joined: {user.createdAt instanceof Date ? user.createdAt.toLocaleDateString() : new Date(user.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => setSelectedUser(user)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    Review
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Approval Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Review User: {selectedUser.displayName}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <p className="text-gray-900">{selectedUser.email}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role (if approving)
                </label>
                <select
                  value={approvalRole}
                  onChange={(e) => setApprovalRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={UserRole.PARENT}>Parent</option>
                  <option value={UserRole.LEADER}>Leader</option>
                  <option value={UserRole.ADMIN}>Admin</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason (optional)
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Add a reason for approval or denial..."
                />
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => handleApprove(selectedUser)}
                disabled={actionLoading}
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
              >
                {actionLoading ? 'Approving...' : 'Approve'}
              </button>
              
              <button
                onClick={() => handleDeny(selectedUser)}
                disabled={actionLoading}
                className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
              >
                {actionLoading ? 'Denying...' : 'Deny'}
              </button>
              
              <button
                onClick={() => {
                  setSelectedUser(null);
                  setReason('');
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
