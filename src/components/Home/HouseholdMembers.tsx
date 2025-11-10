import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Plus,
  Mail,
  Shield,
  UserCheck,
  UserX,
  Crown,
  Settings,
  Trash2,
  Check,
  X,
  Home,
  AlertCircle,
} from 'lucide-react';
import householdSharingService from '../../services/householdSharingService';
import {
  SharedHousehold,
  HouseholdMember,
  HouseholdInvitation,
  HouseholdMemberRole,
  HouseholdPermissions,
} from '../../types/householdSharing';
import { useToast } from '../../contexts/ToastContext';

const HouseholdMembers: React.FC = () => {
  const [userHouseholds, setUserHouseholds] = useState<any>(null);
  const [activeHousehold, setActiveHousehold] = useState<SharedHousehold | null>(null);
  const [pendingInvitations, setPendingInvitations] = useState<HouseholdInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<HouseholdMember | null>(null);
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const households = await householdSharingService.getUserHouseholds();
      setUserHouseholds(households);

      if (households && households.primaryHouseholdId) {
        const household = await householdSharingService.getHousehold(households.primaryHouseholdId);
        setActiveHousehold(household);
      }

      const invites = await householdSharingService.getMyInvitations();
      setPendingInvitations(invites);
    } catch (error: any) {
      showError('Failed to load household data', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvitation = async (invitationId: string) => {
    try {
      await householdSharingService.acceptInvitation(invitationId);
      showSuccess('Invitation accepted! Welcome to the household.');
      loadData();
    } catch (error: any) {
      showError('Failed to accept invitation', error.message);
    }
  };

  const handleDeclineInvitation = async (invitationId: string) => {
    try {
      await householdSharingService.declineInvitation(invitationId);
      showSuccess('Invitation declined');
      loadData();
    } catch (error: any) {
      showError('Failed to decline invitation', error.message);
    }
  };

  const handleRemoveMember = async (memberUserId: string) => {
    if (!activeHousehold) return;
    if (!window.confirm('Are you sure you want to remove this member?')) return;

    try {
      await householdSharingService.removeMember(activeHousehold.id, memberUserId);
      showSuccess('Member removed from household');
      loadData();
    } catch (error: any) {
      showError('Failed to remove member', error.message);
    }
  };

  const handleLeaveHousehold = async () => {
    if (!activeHousehold) return;
    if (!window.confirm('Are you sure you want to leave this household?')) return;

    try {
      await householdSharingService.leaveHousehold(activeHousehold.id);
      showSuccess('Left household successfully');
      loadData();
    } catch (error: any) {
      showError('Failed to leave household', error.message);
    }
  };

  const getRoleIcon = (role: HouseholdMemberRole) => {
    switch (role) {
      case 'owner':
        return <Crown className="w-4 h-4 text-yellow-600" />;
      case 'admin':
        return <Shield className="w-4 h-4 text-blue-600" />;
      case 'child':
        return <UserCheck className="w-4 h-4 text-green-600" />;
      default:
        return <Users className="w-4 h-4 text-gray-600" />;
    }
  };

  const getRoleBadgeClass = (role: HouseholdMemberRole) => {
    switch (role) {
      case 'owner':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'admin':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'child':
        return 'bg-green-100 text-green-800 border-green-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Pending Invitations */}
      {pendingInvitations.length > 0 && (
        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Mail className="w-6 h-6 text-blue-600" />
            <h3 className="text-xl font-bold text-blue-900">Pending Invitations</h3>
            <span className="px-2 py-0.5 bg-blue-500 text-white text-sm rounded-full">
              {pendingInvitations.length}
            </span>
          </div>

          <div className="space-y-3">
            {pendingInvitations.map((invite) => (
              <motion.div
                key={invite.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-lg p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Home className="w-5 h-5 text-gray-600" />
                      <h4 className="font-semibold text-gray-900">{invite.householdName}</h4>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      <strong>{invite.invitedByName}</strong> invited you to join as{' '}
                      <span className="font-medium">{invite.role}</span>
                    </p>
                    {invite.message && (
                      <p className="text-sm text-gray-500 italic mb-2">"{invite.message}"</p>
                    )}
                    <p className="text-xs text-gray-400">
                      Expires: {invite.expiresAt.toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAcceptInvitation(invite.id)}
                      className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                      title="Accept"
                    >
                      <Check className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDeclineInvitation(invite.id)}
                      className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                      title="Decline"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Household Selector */}
      {userHouseholds && userHouseholds.households.length > 1 && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Active Household</label>
          <select
            value={activeHousehold?.id || ''}
            onChange={async (e) => {
              const household = await householdSharingService.getHousehold(e.target.value);
              setActiveHousehold(household);
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            {userHouseholds.households.map((h: any) => (
              <option key={h.householdId} value={h.householdId}>
                {h.householdName} {h.isPrimary && '(Primary)'}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Active Household Members */}
      {activeHousehold ? (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">{activeHousehold.name}</h2>
                  <p className="text-sm text-gray-600">
                    {activeHousehold.members.length} member{activeHousehold.members.length !== 1 && 's'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowInviteModal(true)}
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:shadow-lg transition-all flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Invite Member
              </button>
            </div>
          </div>

          <div className="divide-y divide-gray-200">
            {activeHousehold.members.map((member) => (
              <div key={member.userId} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {member.displayName.charAt(0)}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">{member.displayName}</h3>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium border flex items-center gap-1 ${getRoleBadgeClass(
                            member.role
                          )}`}
                        >
                          {getRoleIcon(member.role)}
                          {member.role}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{member.email}</p>
                      <p className="text-xs text-gray-400">
                        Joined {member.joinedAt.toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {member.role !== 'owner' && (
                      <>
                        <button
                          onClick={() => {
                            setSelectedMember(member);
                            setShowPermissionsModal(true);
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Manage permissions"
                        >
                          <Settings className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleRemoveMember(member.userId)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Remove member"
                        >
                          <UserX className="w-5 h-5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Permissions Summary */}
                <div className="mt-3 flex flex-wrap gap-2">
                  {Object.entries(member.permissions)
                    .filter(([_, value]) => value === true)
                    .map(([key]) => (
                      <span
                        key={key}
                        className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                      >
                        {key.replace('can', '').replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                    ))}
                </div>
              </div>
            ))}
          </div>

          {/* Leave Household Button */}
          {activeHousehold.ownerId !== activeHousehold.members[0]?.userId && (
            <div className="p-6 bg-gray-50 border-t border-gray-200">
              <button
                onClick={handleLeaveHousehold}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2"
              >
                <Trash2 className="w-5 h-5" />
                Leave Household
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Household Found</h3>
          <p className="text-gray-500 mb-6">
            Complete the household setup wizard to create your household
          </p>
        </div>
      )}

      {/* Invite Modal */}
      <AnimatePresence>
        {showInviteModal && activeHousehold && (
          <InviteMemberModal
            household={activeHousehold}
            onClose={() => setShowInviteModal(false)}
            onSuccess={() => {
              setShowInviteModal(false);
              loadData();
            }}
          />
        )}
      </AnimatePresence>

      {/* Permissions Modal */}
      <AnimatePresence>
        {showPermissionsModal && selectedMember && activeHousehold && (
          <PermissionsModal
            household={activeHousehold}
            member={selectedMember}
            onClose={() => {
              setShowPermissionsModal(false);
              setSelectedMember(null);
            }}
            onSuccess={() => {
              setShowPermissionsModal(false);
              setSelectedMember(null);
              loadData();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// Invite Member Modal
interface InviteMemberModalProps {
  household: SharedHousehold;
  onClose: () => void;
  onSuccess: () => void;
}

const InviteMemberModal: React.FC<InviteMemberModalProps> = ({ household, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    email: '',
    role: 'member' as HouseholdMemberRole,
    message: '',
  });
  const [sending, setSending] = useState(false);
  const { showSuccess, showError } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);

    try {
      await householdSharingService.inviteToHousehold(
        household.id,
        formData.email,
        formData.role,
        undefined,
        formData.message
      );
      showSuccess('Invitation sent successfully!');
      onSuccess();
    } catch (error: any) {
      showError('Failed to send invitation', error.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.9 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-xl shadow-xl max-w-lg w-full"
      >
        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl">
              <Mail className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Invite Member</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="member@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as HouseholdMemberRole })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="member">Member</option>
                <option value="admin">Admin</option>
                <option value="child">Child</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Admins can manage members and all household features. Members have limited access.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Message (Optional)
              </label>
              <textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Add a personal message..."
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={sending}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:shadow-lg disabled:opacity-50"
              >
                {sending ? 'Sending...' : 'Send Invitation'}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </motion.div>
  );
};

// Permissions Modal
interface PermissionsModalProps {
  household: SharedHousehold;
  member: HouseholdMember;
  onClose: () => void;
  onSuccess: () => void;
}

const PermissionsModal: React.FC<PermissionsModalProps> = ({ household, member, onClose, onSuccess }) => {
  const [permissions, setPermissions] = useState<HouseholdPermissions>(member.permissions);
  const [saving, setSaving] = useState(false);
  const { showSuccess, showError } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      await householdSharingService.updateMemberPermissions(household.id, member.userId, permissions);
      showSuccess('Permissions updated successfully');
      onSuccess();
    } catch (error: any) {
      showError('Failed to update permissions', error.message);
    } finally {
      setSaving(false);
    }
  };

  const togglePermission = (key: keyof HouseholdPermissions) => {
    setPermissions({ ...permissions, [key]: !permissions[key] });
  };

  const permissionLabels: { key: keyof HouseholdPermissions; label: string; description: string }[] = [
    { key: 'canManageMembers', label: 'Manage Members', description: 'Invite, remove, and manage member permissions' },
    { key: 'canManageGroceries', label: 'Manage Groceries', description: 'Add, edit, and delete grocery items' },
    { key: 'canManageRecipes', label: 'Manage Recipes', description: 'Create and modify recipes' },
    { key: 'canManageBudget', label: 'Manage Budget', description: 'View and edit household finances' },
    { key: 'canManageTasks', label: 'Manage Tasks', description: 'Create and assign household tasks' },
    { key: 'canManageMaintenance', label: 'Manage Maintenance', description: 'Track home maintenance items' },
    { key: 'canManageCalendar', label: 'Manage Calendar', description: 'Add and edit family events' },
    { key: 'canViewOnly', label: 'View Only', description: 'Can only view, not edit anything' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.9 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl">
              <Settings className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Manage Permissions</h2>
              <p className="text-sm text-gray-600">{member.displayName}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-3">
              {permissionLabels.map(({ key, label, description }) => (
                <div
                  key={key}
                  className="flex items-start justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1">
                    <label className="font-medium text-gray-900 cursor-pointer">{label}</label>
                    <p className="text-sm text-gray-600">{description}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => togglePermission(key)}
                    className={`relative inline-flex h-8 w-14 flex-shrink-0 items-center rounded-full transition-all duration-200 border-2 ${
                      permissions[key]
                        ? 'bg-gradient-to-r from-green-400 to-blue-500 border-green-500'
                        : 'bg-gray-200 border-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-6 w-6 transform rounded-full shadow-lg transition-all duration-200 flex items-center justify-center ${
                        permissions[key] ? 'translate-x-7 bg-white' : 'translate-x-1 bg-gray-400'
                      }`}
                    >
                      {permissions[key] && (
                        <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </span>
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:shadow-lg disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default HouseholdMembers;

