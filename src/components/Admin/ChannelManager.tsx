import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Folder, Hash, Edit, Save, X } from 'lucide-react';
import { chatService } from '../../services/chatService';
import { useToast } from '../../contexts/ToastContext';
import { ChatChannel } from '../../services/chatService';

const ChannelManager: React.FC = () => {
  const [channels, setChannels] = useState<ChatChannel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingChannel, setEditingChannel] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    denType: 'pack' as 'pack' | 'lion' | 'tiger' | 'wolf' | 'bear' | 'webelos' | 'arrow-of-light' | 'general'
  });
  const [editData, setEditData] = useState({
    name: '',
    description: '',
    denType: 'pack' as 'pack' | 'lion' | 'tiger' | 'wolf' | 'bear' | 'webelos' | 'arrow-of-light' | 'general'
  });
  const { showSuccess, showError, showInfo } = useToast();

  const denTypes = [
    { value: 'pack' as 'pack' | 'lion' | 'tiger' | 'wolf' | 'bear' | 'webelos' | 'arrow-of-light' | 'general', label: 'Pack', icon: '🏕️' },
    { value: 'lion' as 'pack' | 'lion' | 'tiger' | 'wolf' | 'bear' | 'webelos' | 'arrow-of-light' | 'general', label: 'Lion', icon: '🦁' },
    { value: 'tiger' as 'pack' | 'lion' | 'tiger' | 'wolf' | 'bear' | 'webelos' | 'arrow-of-light' | 'general', label: 'Tiger', icon: '🐯' },
    { value: 'wolf' as 'pack' | 'lion' | 'tiger' | 'wolf' | 'bear' | 'webelos' | 'arrow-of-light' | 'general', label: 'Wolf', icon: '🐺' },
    { value: 'bear' as 'pack' | 'lion' | 'tiger' | 'wolf' | 'bear' | 'webelos' | 'arrow-of-light' | 'general', label: 'Bear', icon: '🐻' },
    { value: 'webelos' as 'pack' | 'lion' | 'tiger' | 'wolf' | 'bear' | 'webelos' | 'arrow-of-light' | 'general', label: 'Webelos', icon: '🏹' },
    { value: 'arrow-of-light' as 'pack' | 'lion' | 'tiger' | 'wolf' | 'bear' | 'webelos' | 'arrow-of-light' | 'general', label: 'Arrow of Light', icon: '🏆' },
    { value: 'general' as 'pack' | 'lion' | 'tiger' | 'wolf' | 'bear' | 'webelos' | 'arrow-of-light' | 'general', label: 'General', icon: '💬' }
  ];

  useEffect(() => {
    loadChannels();
  }, []);

  const loadChannels = async () => {
    try {
      setIsLoading(true);
      const allChannels = await chatService.getChannels();
      setChannels(allChannels);
    } catch (error) {
      console.error('Failed to load channels:', error);
      showError('Failed to load channels', 'Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showError('Channel name required', 'Please enter a channel name.');
      return;
    }

    try {
      await chatService.createChannel(formData.name, formData.description, formData.denType);
      showSuccess('Channel created', `"${formData.name}" has been created successfully.`);
      setFormData({ name: '', description: '', denType: 'pack' as 'pack' | 'lion' | 'tiger' | 'wolf' | 'bear' | 'webelos' | 'arrow-of-light' | 'general' });
      setShowCreateForm(false);
      loadChannels();
    } catch (error) {
      console.error('Failed to create channel:', error);
      showError('Failed to create channel', 'Please try again.');
    }
  };

  const handleDeleteChannel = async (channelId: string, channelName: string) => {
    if (!window.confirm(`Are you sure you want to delete "${channelName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await chatService.deleteChannel(channelId);
      showSuccess('Channel deleted', `"${channelName}" has been deleted.`);
      loadChannels();
    } catch (error) {
      console.error('Failed to delete channel:', error);
      showError('Failed to delete channel', 'Please try again.');
    }
  };

  const handleEditChannel = async (channelId: string) => {
    if (!editData.name.trim()) {
      showError('Channel name required', 'Please enter a channel name.');
      return;
    }

    try {
      await chatService.updateChannel(channelId, {
        name: editData.name,
        description: editData.description,
        denType: editData.denType
      });
      showSuccess('Channel updated', `"${editData.name}" has been updated successfully.`);
      setEditingChannel(null);
      setEditData({ name: '', description: '', denType: 'pack' as 'pack' | 'lion' | 'tiger' | 'wolf' | 'bear' | 'webelos' | 'arrow-of-light' | 'general' });
      loadChannels();
    } catch (error) {
      console.error('Failed to update channel:', error);
      showError('Failed to update channel', 'Please try again.');
    }
  };

  const startEditing = (channel: ChatChannel) => {
    setEditingChannel(channel.id);
    setEditData({
      name: channel.name,
      description: channel.description,
      denType: (channel.denType || 'pack') as 'pack' | 'lion' | 'tiger' | 'wolf' | 'bear' | 'webelos' | 'arrow-of-light' | 'general'
    });
  };

  const cancelEditing = () => {
    setEditingChannel(null);
    setEditData({ name: '', description: '', denType: 'pack' as 'pack' | 'lion' | 'tiger' | 'wolf' | 'bear' | 'webelos' | 'arrow-of-light' | 'general' });
  };

  const getDenIcon = (denType: string) => {
    const den = denTypes.find(d => d.value === denType);
    return den?.icon || '💬';
  };

  const getDenLabel = (denType: string) => {
    const den = denTypes.find(d => d.value === denType);
    return den?.label || 'General';
  };

  const groupedChannels = channels.reduce((acc, channel) => {
    const denType = channel.denType || 'general';
    if (!acc[denType]) {
      acc[denType] = [];
    }
    acc[denType].push(channel);
    return acc;
  }, {} as Record<string, ChatChannel[]>);

  if (isLoading) {
    return (
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 border border-white/50 shadow-soft">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 border border-white/50 shadow-soft">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-display font-semibold text-gray-900">Channel Management</h2>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors duration-200 flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>New Channel</span>
        </button>
      </div>

      {/* Create Channel Form */}
      {showCreateForm && (
        <div className="mb-6 p-6 bg-gray-50 rounded-xl border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Channel</h3>
          <form onSubmit={handleCreateChannel} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Channel Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="e.g., announcements, events"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Den Type
                </label>
                <select
                  value={formData.denType}
                  onChange={(e) => setFormData({ ...formData, denType: e.target.value as 'pack' | 'lion' | 'tiger' | 'wolf' | 'bear' | 'webelos' | 'arrow-of-light' | 'general' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  {denTypes.map(den => (
                    <option key={den.value} value={den.value}>
                      {den.icon} {den.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="What is this channel for?"
                rows={3}
              />
            </div>
            <div className="flex space-x-3">
              <button
                type="submit"
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors duration-200"
              >
                Create Channel
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors duration-200"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Channel List */}
      <div className="space-y-6">
        {Object.entries(groupedChannels).map(([denType, denChannels]) => (
          <div key={denType} className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-3 border-b border-gray-200">
              <div className="flex items-center space-x-2">
                <span className="text-lg">{getDenIcon(denType)}</span>
                <h3 className="font-semibold text-gray-900">{getDenLabel(denType)}</h3>
                <span className="text-sm text-gray-500">({denChannels.length} channels)</span>
              </div>
            </div>
            <div className="divide-y divide-gray-200">
              {denChannels.map(channel => (
                <div key={channel.id} className="p-4 hover:bg-gray-50 transition-colors duration-200">
                  {editingChannel === channel.id ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <input
                          type="text"
                          value={editData.name}
                          onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                        <select
                          value={editData.denType}
                          onChange={(e) => setEditData({ ...editData, denType: e.target.value as 'pack' | 'lion' | 'tiger' | 'wolf' | 'bear' | 'webelos' | 'arrow-of-light' | 'general' })}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        >
                          {denTypes.map(den => (
                            <option key={den.value} value={den.value}>
                              {den.icon} {den.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <textarea
                        value={editData.description}
                        onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        rows={2}
                      />
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditChannel(channel.id)}
                          className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 flex items-center space-x-1"
                        >
                          <Save className="w-3 h-3" />
                          <span>Save</span>
                        </button>
                        <button
                          onClick={cancelEditing}
                          className="px-3 py-1 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors duration-200 flex items-center space-x-1"
                        >
                          <X className="w-3 h-3" />
                          <span>Cancel</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <Hash className="w-4 h-4 text-gray-400" />
                          <span className="font-medium text-gray-900">{channel.name}</span>
                          {!channel.isActive && (
                            <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">
                              Deleted
                            </span>
                          )}
                        </div>
                        {channel.description && (
                          <p className="text-sm text-gray-600 mt-1">{channel.description}</p>
                        )}
                        <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                          <span>{channel.messageCount} messages</span>
                          <span>Last activity: {channel.lastActivity ? new Date(channel.lastActivity).toLocaleDateString() : 'Never'}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => startEditing(channel)}
                          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                          title="Edit channel"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteChannel(channel.id, channel.name)}
                          className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                          title="Delete channel"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {channels.length === 0 && (
        <div className="text-center py-12">
          <Folder className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No channels yet</h3>
          <p className="text-gray-600 mb-4">Create your first channel to get started.</p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors duration-200"
          >
            Create Channel
          </button>
        </div>
      )}
    </div>
  );
};

export default ChannelManager;
