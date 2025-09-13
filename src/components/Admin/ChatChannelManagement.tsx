import React, { useState, useEffect } from 'react';
 '../../services/authService';
import { 
  MessageSquare, 
  Plus, 
  Edit, 
  Trash2, 
  Users, 
  Lock, 
  Globe,
  Settings,
  Hash,
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react';

interface ChatChannel {
  id: string;
  name: string;
  description: string;
  type: 'public' | 'private';
  denId: string;
  createdBy: string;
  createdAt: Date;
  memberCount: number;
  isActive: boolean;
}

interface ChatChannelManagementProps {
  className?: string;
}

const ChatChannelManagement: React.FC<ChatChannelManagementProps> = ({ className = '' }) => {
  const [channels, setChannels] = useState<ChatChannel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingChannel, setEditingChannel] = useState<ChatChannel | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'public' as 'public' | 'private'
  });

  const currentUser = authService.getCurrentUser();

  useEffect(() => {
    loadChannels();
  }, []);

  const loadChannels = async () => {
    try {
      setIsLoading(true);
      // TODO: Implement getChannels method
      // const channelsData = await chatService.getChannels();
      // setChannels(channelsData);
      
      // Mock data for now
      setChannels([
        {
          id: '1',
          name: 'general',
          description: 'General den discussion',
          type: 'public',
          denId: 'den-1',
          createdBy: currentUser?.uid || '',
          createdAt: new Date(),
          memberCount: 15,
          isActive: true
        },
        {
          id: '2',
          name: 'events',
          description: 'Den event planning',
          type: 'public',
          denId: 'den-1',
          createdBy: currentUser?.uid || '',
          createdAt: new Date(),
          memberCount: 12,
          isActive: true
        }
      ]);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateChannel = async () => {
    if (!formData.name.trim()) {
      setError('Channel name is required');
      return;
    }

    try {
      // TODO: Implement createChannel method
      // await chatService.createChannel({
      //   name: formData.name,
      //   description: formData.description,
      //   type: formData.type,
      //   denId: currentUser?.profile?.den || 'general'
      // });

      // Mock creation
      const newChannel: ChatChannel = {
        id: Date.now().toString(),
        name: formData.name,
        description: formData.description,
        type: formData.type,
        denId: currentUser?.profile?.den || 'general',
        createdBy: currentUser?.uid || '',
        createdAt: new Date(),
        memberCount: 0,
        isActive: true
      };

      setChannels([...channels, newChannel]);
      setShowCreateModal(false);
      setFormData({ name: '', description: '', type: 'public' });
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleDeleteChannel = async (channelId: string) => {
    if (!window.confirm('Are you sure you want to delete this channel? This action cannot be undone.')) {
      return;
    }

    try {
      // TODO: Implement deleteChannel method
      // await chatService.deleteChannel(channelId);
      
      setChannels(channels.filter(channel => channel.id !== channelId));
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleEditChannel = async () => {
    if (!editingChannel || !formData.name.trim()) {
      setError('Channel name is required');
      return;
    }

    try {
      // TODO: Implement updateChannel method
      // await chatService.updateChannel(editingChannel.id, {
      //   name: formData.name,
      //   description: formData.description,
      //   type: formData.type
      // });

      setChannels(channels.map(channel => 
        channel.id === editingChannel.id 
          ? { ...channel, name: formData.name, description: formData.description, type: formData.type }
          : channel
      ));
      
      setEditingChannel(null);
      setFormData({ name: '', description: '', type: 'public' });
    } catch (error: any) {
      setError(error.message);
    }
  };

  const canManageChannels = authService.hasPermission(Permission.DEN_CHAT_MANAGEMENT) || 
                           authService.hasPermission(Permission.CHAT_MANAGEMENT);

  if (!canManageChannels) {
    return (
      <div className={`bg-white/90 backdrop-blur-sm rounded-2xl border border-white/50 shadow-soft p-6 ${className}`}>
        <div className="text-center">
          <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Access Restricted</h3>
          <p className="text-gray-600">Only den leaders and administrators can manage chat channels.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Chat Channel Management</h2>
          <p className="text-gray-600">Manage chat channels for your den</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Channel
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      )}

      {/* Channels List */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/50 shadow-soft overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">Loading channels...</p>
          </div>
        ) : channels.length === 0 ? (
          <div className="p-8 text-center">
            <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No channels found</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Your First Channel
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Channel
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Members
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
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
                {channels.map((channel) => (
                  <tr key={channel.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <Hash className="w-5 h-5 text-blue-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            #{channel.name}
                          </div>
                          <div className="text-sm text-gray-500">{channel.description}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {channel.type === 'public' ? (
                          <Globe className="w-4 h-4 text-green-500" />
                        ) : (
                          <Lock className="w-4 h-4 text-red-500" />
                        )}
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          channel.type === 'public' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {channel.type}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        {channel.memberCount}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {channel.createdAt.toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        channel.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {channel.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setEditingChannel(channel);
                            setFormData({
                              name: channel.name,
                              description: channel.description,
                              type: channel.type
                            });
                          }}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteChannel(channel.id)}
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
        )}
      </div>

      {/* Create Channel Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Create New Channel</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Channel Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., general, events, announcements"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="What is this channel for?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Channel Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as 'public' | 'private' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="public">Public - Anyone can join</option>
                  <option value="private">Private - Invitation only</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setFormData({ name: '', description: '', type: 'public' });
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateChannel}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Create Channel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Channel Modal */}
      {editingChannel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Edit Channel: #{editingChannel.name}</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Channel Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., general, events, announcements"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="What is this channel for?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Channel Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as 'public' | 'private' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="public">Public - Anyone can join</option>
                  <option value="private">Private - Invitation only</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setEditingChannel(null);
                  setFormData({ name: '', description: '', type: 'public' });
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleEditChannel}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatChannelManagement;
