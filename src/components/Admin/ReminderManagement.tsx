import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Plus, 
  Edit, 
  Trash2, 
  Send, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Filter,
  Search,
  Calendar,
  Users,
  Mail,
  MessageSquare,
  Smartphone,
  Monitor,
  BarChart3,
  Settings,
  RefreshCw
} from 'lucide-react';
import { Timestamp } from 'firebase/firestore';
import { useAdmin } from '../../contexts/AdminContext';
import reminderService from '../../services/reminderService';
import {
  Reminder,
  ReminderType,
  ReminderPriority,
  ReminderStatus,
  ReminderChannel,
  ReminderFrequency,
  ReminderFilter,
  ReminderSort,
  ReminderStats,
  ReminderTemplate
} from '../../types/reminder';

// ============================================================================
// REMINDER MANAGEMENT COMPONENT
// ============================================================================

const ReminderManagement: React.FC = () => {
  const { state } = useAdmin();
  const { currentUser } = state;

  // State management
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [templates, setTemplates] = useState<ReminderTemplate[]>([]);
  const [stats, setStats] = useState<ReminderStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI state
  const [activeTab, setActiveTab] = useState<'reminders' | 'templates' | 'stats' | 'settings'>('reminders');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedReminder, setSelectedReminder] = useState<Reminder | null>(null);
  const [filters, setFilters] = useState<ReminderFilter>({});
  const [sort, setSort] = useState<ReminderSort>({ field: 'createdAt', direction: 'desc' });
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);

  // Form state
  const [formData, setFormData] = useState({
    type: 'follow_up' as ReminderType,
    title: '',
    description: '',
    message: '',
    priority: 'medium' as ReminderPriority,
    recipientIds: [] as string[],
    recipientRoles: [] as string[],
    recipientDens: [] as string[],
    scheduledFor: '',
    dueDate: '',
    frequency: 'once' as ReminderFrequency,
    channels: ['email'] as ReminderChannel[],
    actionUrl: '',
    actionText: '',
    allowAcknowledgment: true,
    requireConfirmation: false,
    autoEscalate: false,
    escalationDelay: 24
  });

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, [activeTab, filters, sort, page]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      switch (activeTab) {
        case 'reminders':
          const remindersResponse = await reminderService.getReminders(filters, sort, page, pageSize);
          setReminders(remindersResponse.data || []);
          break;
        case 'templates':
          const templatesData = await reminderService.getTemplates();
          setTemplates(templatesData);
          break;
        case 'stats':
          const statsResponse = await reminderService.getStats();
          setStats(statsResponse.data || null);
          break;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateReminder = async () => {
    try {
      setLoading(true);
      
      const reminderData = {
        ...formData,
        scheduledFor: Timestamp.fromDate(new Date(formData.scheduledFor)),
        dueDate: formData.dueDate ? Timestamp.fromDate(new Date(formData.dueDate)) : undefined
      };

      await reminderService.createReminder(reminderData, currentUser?.uid || '');
      
      setShowCreateModal(false);
      resetForm();
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create reminder');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateReminder = async () => {
    if (!selectedReminder) return;

    try {
      setLoading(true);
      
      const updateData = {
        ...formData,
        scheduledFor: Timestamp.fromDate(new Date(formData.scheduledFor)),
        dueDate: formData.dueDate ? Timestamp.fromDate(new Date(formData.dueDate)) : undefined
      };

      await reminderService.updateReminder(selectedReminder.id, updateData, currentUser?.uid || '');
      
      setShowEditModal(false);
      setSelectedReminder(null);
      resetForm();
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update reminder');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReminder = async (reminderId: string) => {
    if (!confirm('Are you sure you want to delete this reminder?')) return;

    try {
      setLoading(true);
      await reminderService.deleteReminder(reminderId);
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete reminder');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkAction = async (action: string, reminderIds: string[]) => {
    try {
      setLoading(true);
      await reminderService.bulkAction({ action: action as any, reminderIds }, currentUser?.uid || '');
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to perform bulk action');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      type: 'follow_up',
      title: '',
      description: '',
      message: '',
      priority: 'medium',
      recipientIds: [],
      recipientRoles: [],
      recipientDens: [],
      scheduledFor: '',
      dueDate: '',
      frequency: 'once',
      channels: ['email'],
      actionUrl: '',
      actionText: '',
      allowAcknowledgment: true,
      requireConfirmation: false,
      autoEscalate: false,
      escalationDelay: 24
    });
  };

  const openEditModal = (reminder: Reminder) => {
    setSelectedReminder(reminder);
    setFormData({
      type: reminder.type,
      title: reminder.title,
      description: reminder.description,
      message: reminder.message,
      priority: reminder.priority,
      recipientIds: reminder.recipientIds,
      recipientRoles: reminder.recipientRoles || [],
      recipientDens: reminder.recipientDens || [],
      scheduledFor: reminder.scheduledFor.toDate().toISOString().slice(0, 16),
      dueDate: reminder.dueDate?.toDate().toISOString().slice(0, 16) || '',
      frequency: reminder.frequency,
      channels: reminder.channels,
      actionUrl: reminder.actionUrl || '',
      actionText: reminder.actionText || '',
      allowAcknowledgment: reminder.allowAcknowledgment,
      requireConfirmation: reminder.requireConfirmation,
      autoEscalate: reminder.autoEscalate,
      escalationDelay: reminder.escalationDelay || 24
    });
    setShowEditModal(true);
  };

  const getStatusIcon = (status: ReminderStatus) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'sent': return <Send className="w-4 h-4 text-blue-500" />;
      case 'acknowledged': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'cancelled': return <XCircle className="w-4 h-4 text-gray-500" />;
      case 'failed': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default: return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getPriorityColor = (priority: ReminderPriority) => {
    switch (priority) {
      case 'low': return 'bg-gray-100 text-gray-800';
      case 'medium': return 'bg-blue-100 text-blue-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'urgent': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: ReminderType) => {
    switch (type) {
      case 'event_deadline': return 'bg-purple-100 text-purple-800';
      case 'volunteer_needed': return 'bg-green-100 text-green-800';
      case 'payment_due': return 'bg-yellow-100 text-yellow-800';
      case 'preparation': return 'bg-blue-100 text-blue-800';
      case 'follow_up': return 'bg-indigo-100 text-indigo-800';
      case 'custom': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading && reminders.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-gray-900">Reminder Management</h1>
          <p className="text-gray-600 mt-2">Manage team follow-ups and task reminders</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-lg hover:from-primary-700 hover:to-secondary-700 transition-all duration-200 shadow-lg hover:shadow-xl"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Reminder
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <AlertTriangle className="w-5 h-5 text-red-400 mr-3" />
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'reminders', label: 'Reminders', icon: Bell },
            { id: 'templates', label: 'Templates', icon: Settings },
            { id: 'stats', label: 'Analytics', icon: BarChart3 },
            { id: 'settings', label: 'Settings', icon: Settings }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="w-4 h-4 mr-2" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="mt-6">
        {activeTab === 'reminders' && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                  <select
                    value={filters.type || ''}
                    onChange={(e) => setFilters({ ...filters, type: e.target.value as ReminderType || undefined })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">All Types</option>
                    <option value="event_deadline">Event Deadline</option>
                    <option value="volunteer_needed">Volunteer Needed</option>
                    <option value="payment_due">Payment Due</option>
                    <option value="preparation">Preparation</option>
                    <option value="follow_up">Follow Up</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                  <select
                    value={filters.priority || ''}
                    onChange={(e) => setFilters({ ...filters, priority: e.target.value as ReminderPriority || undefined })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">All Priorities</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={filters.status || ''}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value as ReminderStatus || undefined })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="sent">Sent</option>
                    <option value="acknowledged">Acknowledged</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="failed">Failed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                  <input
                    type="text"
                    placeholder="Search reminders..."
                    value={filters.search || ''}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Reminders List */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">Reminders ({reminders.length})</h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleBulkAction('send', reminders.map(r => r.id))}
                      className="inline-flex items-center px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
                    >
                      <Send className="w-4 h-4 mr-1" />
                      Send All
                    </button>
                    <button
                      onClick={() => handleBulkAction('cancel', reminders.map(r => r.id))}
                      className="inline-flex items-center px-3 py-1 text-sm bg-gray-100 text-gray-800 rounded hover:bg-gray-200"
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Cancel All
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Scheduled</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recipients</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reminders.map((reminder) => (
                      <tr key={reminder.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {getStatusIcon(reminder.status)}
                            <span className="ml-2 text-sm text-gray-900 capitalize">{reminder.status}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{reminder.title}</div>
                            <div className="text-sm text-gray-500">{reminder.description}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(reminder.type)}`}>
                            {reminder.type.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(reminder.priority)}`}>
                            {reminder.priority}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {reminder.scheduledFor.toDate().toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {reminder.recipientIds.length} recipients
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => openEditModal(reminder)}
                              className="text-primary-600 hover:text-primary-900"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteReminder(reminder.id)}
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
          </div>
        )}

        {activeTab === 'templates' && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Reminder Templates</h3>
            <p className="text-gray-600">Template management coming soon...</p>
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="space-y-6">
            {stats && (
              <>
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <Bell className="w-8 h-8 text-blue-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500">Total Reminders</p>
                        <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <Clock className="w-8 h-8 text-yellow-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500">Pending</p>
                        <p className="text-2xl font-semibold text-gray-900">{stats.pending}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <CheckCircle className="w-8 h-8 text-green-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500">Completed</p>
                        <p className="text-2xl font-semibold text-gray-900">{stats.completed}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <AlertTriangle className="w-8 h-8 text-red-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500">Overdue</p>
                        <p className="text-2xl font-semibold text-gray-900">{stats.overdue}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">By Priority</h3>
                    <div className="space-y-3">
                      {Object.entries(stats.byPriority).map(([priority, count]) => (
                        <div key={priority} className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700 capitalize">{priority}</span>
                          <span className="text-sm text-gray-900">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">By Type</h3>
                    <div className="space-y-3">
                      {Object.entries(stats.byType).map(([type, count]) => (
                        <div key={type} className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">{type.replace('_', ' ')}</span>
                          <span className="text-sm text-gray-900">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Reminder Settings</h3>
            <p className="text-gray-600">Settings management coming soon...</p>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || showEditModal) && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {showCreateModal ? 'Create New Reminder' : 'Edit Reminder'}
              </h3>
              
              <form className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as ReminderType })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="event_deadline">Event Deadline</option>
                      <option value="volunteer_needed">Volunteer Needed</option>
                      <option value="payment_due">Payment Due</option>
                      <option value="preparation">Preparation</option>
                      <option value="follow_up">Follow Up</option>
                      <option value="custom">Custom</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value as ReminderPriority })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Enter reminder title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={2}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Enter reminder description"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                  <textarea
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    rows={4}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Enter reminder message"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Scheduled For</label>
                    <input
                      type="datetime-local"
                      value={formData.scheduledFor}
                      onChange={(e) => setFormData({ ...formData, scheduledFor: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Due Date (Optional)</label>
                    <input
                      type="datetime-local"
                      value={formData.dueDate}
                      onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Channels</label>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {['email', 'push', 'sms', 'chat', 'in_app'].map((channel) => (
                      <label key={channel} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.channels.includes(channel as ReminderChannel)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({ ...formData, channels: [...formData.channels, channel as ReminderChannel] });
                            } else {
                              setFormData({ ...formData, channels: formData.channels.filter(c => c !== channel) });
                            }
                          }}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700 capitalize">{channel}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setShowEditModal(false);
                      resetForm();
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={showCreateModal ? handleCreateReminder : handleUpdateReminder}
                    className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-lg hover:bg-primary-700"
                  >
                    {showCreateModal ? 'Create' : 'Update'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReminderManagement;