import React, { useState, useEffect } from 'react';
import { authService, UserRole, Permission, SELECTABLE_ROLES } from '../../services/authService';
import { inviteService, Invite } from '../../services/inviteService';
import { 
  Mail, 
  Plus, 
  Copy, 
  Trash2, 
  RefreshCw,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Users,
  Shield,
  Crown,
  User,
  Link,
  ExternalLink,
  X
} from 'lucide-react';

interface InviteManagementProps {
  className?: string;
}

const InviteManagement: React.FC<InviteManagementProps> = ({ className = '' }) => {
  const [invites, setInvites] = useState<Invite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [selectedInvite, setSelectedInvite] = useState<Invite | null>(null);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    role: UserRole.PARENT,
    message: '',
    denId: '',
    expiresInDays: 7
  });

  const currentUser = authService.getCurrentUser();

  useEffect(() => {
    loadInvites();
  }, []);

  const loadInvites = async () => {
    try {
      setIsLoading(true);
      const pendingInvites = await inviteService.getPendingInvites();
      setInvites(pendingInvites);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateInvite = async () => {
    if (!formData.email.trim()) {
      setError('Email is required');
      return;
    }

    try {
      const invite = await inviteService.createInvite(formData, currentUser);
      await inviteService.sendInviteEmail(invite);
      await loadInvites();
      setShowCreateModal(false);
      setFormData({
        email: '',
        role: UserRole.PARENT,
        message: '',
        denId: '',
        expiresInDays: 7
      });
      
      // Show the invite link immediately
      setSelectedInvite(invite);
      setShowLinkModal(true);
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleCancelInvite = async (inviteId: string) => {
    if (!window.confirm('Are you sure you want to cancel this invite?')) {
      return;
    }

    try {
      await inviteService.cancelInvite(inviteId);
      await loadInvites();
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleResendInvite = async (inviteId: string) => {
    try {
      await inviteService.resendInvite(inviteId, 7);
      await loadInvites();
    } catch (error: any) {
      setError(error.message);
    }
  };

  const copyInviteUrl = async (inviteId: string) => {
    const inviteUrl = inviteService.getInviteUrl(inviteId);
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopySuccess('Invite link copied to clipboard!');
      setTimeout(() => setCopySuccess(null), 3000);
    } catch (error) {
      console.error('Failed to copy invite URL:', error);
      setError('Failed to copy invite link');
    }
  };

  const showInviteLink = (invite: Invite) => {
    setSelectedInvite(invite);
    setShowLinkModal(true);
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case UserRole.SUPER_ADMIN:
        return <Crown className="w-4 h-4 text-yellow-500" />;
      case UserRole.ADMIN:
        return <Shield className="w-4 h-4 text-blue-500" />;
      case UserRole.DEN_LEADER:
        return <User className="w-4 h-4 text-green-500" />;
      case UserRole.PARENT:
        return <User className="w-4 h-4 text-purple-500" />;
      case UserRole.PARENT:
        return <User className="w-4 h-4 text-gray-500" />;
      default:
        return <User className="w-4 h-4 text-gray-500" />;
    }
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case UserRole.SUPER_ADMIN:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case UserRole.ADMIN:
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case UserRole.DEN_LEADER:
        return 'bg-green-100 text-green-800 border-green-200';
      case UserRole.PARENT:
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case UserRole.PARENT:
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const canManageInvites = authService.hasPermission(Permission.USER_MANAGEMENT) || 
                          authService.hasPermission(Permission.ROLE_MANAGEMENT);

  if (!canManageInvites) {
    return (
      <div className={`bg-white/90 backdrop-blur-sm rounded-2xl border border-white/50 shadow-soft p-6 ${className}`}>
        <div className="text-center">
          <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Access Restricted</h3>
          <p className="text-gray-600">Only administrators can manage user invitations.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Invite Management</h2>
          <p className="text-gray-600">Create and manage user invitations</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Send Invite
        </button>
      </div>

      {/* Success Message */}
      {copySuccess && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
            <p className="text-sm text-green-600">{copySuccess}</p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      )}

      {/* Invites List */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/50 shadow-soft overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">Loading invites...</p>
          </div>
        ) : invites.length === 0 ? (
          <div className="p-8 text-center">
            <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No pending invites</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Send Your First Invite
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Invited By
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Expires
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
                {invites.map((invite) => (
                  <tr key={invite.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{invite.email}</div>
                      {invite.message && (
                        <div className="text-sm text-gray-500">{invite.message}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getRoleIcon(invite.role)}
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRoleBadgeColor(invite.role)}`}>
                          {invite.role}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {invite.invitedByName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        {invite.expiresAt.toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        invite.status === 'pending' 
                          ? 'bg-yellow-100 text-yellow-800' 
                          : invite.status === 'accepted'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {invite.status === 'pending' && <Clock className="w-3 h-3 mr-1" />}
                        {invite.status === 'accepted' && <CheckCircle className="w-3 h-3 mr-1" />}
                        {invite.status === 'expired' && <XCircle className="w-3 h-3 mr-1" />}
                        {invite.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => showInviteLink(invite)}
                          className="text-blue-600 hover:text-blue-900"
                          title="View invite link"
                        >
                          <Link className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => copyInviteUrl(invite.id)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Copy invite URL"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleResendInvite(invite.id)}
                          className="text-green-600 hover:text-green-900"
                          title="Resend invite"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleCancelInvite(invite.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Cancel invite"
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
        )}
      </div>

      {/* Create Invite Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-60">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Send Invitation</h3>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setFormData({
                    email: '',
                    role: UserRole.PARENT,
                    message: '',
                    denId: '',
                    expiresInDays: 7
                  });
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter email address"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {SELECTABLE_ROLES.map(role => (
                    <option key={role} value={role}>
                      {role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Personal Message (Optional)</label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Add a personal message to the invitation..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Expires In</label>
                <select
                  value={formData.expiresInDays}
                  onChange={(e) => setFormData({ ...formData, expiresInDays: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value={1}>1 day</option>
                  <option value={3}>3 days</option>
                  <option value={7}>7 days</option>
                  <option value={14}>14 days</option>
                  <option value={30}>30 days</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setFormData({
                    email: '',
                    role: UserRole.PARENT,
                    message: '',
                    denId: '',
                    expiresInDays: 7
                  });
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateInvite}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Send Invite
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invite Link Modal */}
      {showLinkModal && selectedInvite && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-70">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Invite Link Generated</h3>
              <button
                onClick={() => setShowLinkModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Mail className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Invitation for {selectedInvite.email}</span>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  {getRoleIcon(selectedInvite.role)}
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getRoleBadgeColor(selectedInvite.role)}`}>
                    {selectedInvite.role}
                  </span>
                </div>
                {selectedInvite.message && (
                  <p className="text-sm text-gray-600 italic">"{selectedInvite.message}"</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Invite Link</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inviteService.getInviteUrl(selectedInvite.id)}
                    readOnly
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                  />
                  <button
                    onClick={() => copyInviteUrl(selectedInvite.id)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <ExternalLink className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-sm font-medium text-blue-900 mb-1">Share this link</h4>
                    <p className="text-sm text-blue-700">
                      Send this link to {selectedInvite.email}. They can use any social login provider to create their account.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowLinkModal(false)}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InviteManagement;
