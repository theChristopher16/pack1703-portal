import React, { useState, useEffect } from 'react';
import { useAdmin } from '../contexts/AdminContext';
import { Megaphone, Edit, Trash2, Plus, Search, Pin, Calendar, Link, FileText } from 'lucide-react';

interface Announcement {
  id: string;
  title: string;
  body: string;
  pinned: boolean;
  eventId?: string;
  eventTitle?: string;
  attachments?: Array<{
    name: string;
    url: string;
    type: 'pdf' | 'image' | 'document';
  }>;
  category: 'general' | 'event' | 'reminder' | 'emergency' | 'achievement';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
}

const AdminAnnouncements: React.FC = () => {
  const { addNotification } = useAdmin();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [showPinnedOnly, setShowPinnedOnly] = useState(false);

  // Mock data for now - will be replaced with Firebase calls
  useEffect(() => {
    const mockAnnouncements: Announcement[] = [
      {
        id: '1',
        title: 'Fall Campout Registration Open!',
        body: 'Registration for our annual Fall Campout is now open! This year we\'ll be heading to Camp Wokanda for a weekend of fun, adventure, and scouting activities. All families are welcome to join us for this exciting event.',
        pinned: true,
        eventId: 'event-001',
        eventTitle: 'Pack 1703 Fall Campout',
        category: 'event',
        priority: 'high',
        isActive: true,
        createdAt: '2024-01-01T00:00:00',
        updatedAt: '2024-01-01T00:00:00',
        expiresAt: '2024-10-15T00:00:00'
      },
      {
        id: '2',
        title: 'Welcome Back to Scouting!',
        body: 'Welcome back to another exciting year of scouting with Pack 1703! We have an amazing year planned with new adventures, learning opportunities, and fun activities for all our scouts and families.',
        pinned: false,
        category: 'general',
        priority: 'medium',
        isActive: true,
        createdAt: '2024-01-15T00:00:00',
        updatedAt: '2024-01-15T00:00:00'
      },
      {
        id: '3',
        title: 'Pinewood Derby Rules and Guidelines',
        body: 'The Pinewood Derby is just around the corner! Please review the official rules and guidelines for car construction. All cars must be checked in by Friday evening for Saturday\'s race.',
        pinned: true,
        eventId: 'event-002',
        eventTitle: 'Pinewood Derby',
        category: 'reminder',
        priority: 'high',
        isActive: true,
        createdAt: '2024-02-01T00:00:00',
        updatedAt: '2024-02-01T00:00:00',
        expiresAt: '2024-02-10T00:00:00'
      }
    ];
    setAnnouncements(mockAnnouncements);
    setLoading(false);
  }, []);

  const handleCreateAnnouncement = () => {
    setModalMode('create');
    setSelectedAnnouncement(null);
    setIsModalOpen(true);
  };

  const handleEditAnnouncement = (announcement: Announcement) => {
    setModalMode('edit');
    setSelectedAnnouncement(announcement);
    setIsModalOpen(true);
  };

  const handleDeleteAnnouncement = async (announcementId: string) => {
    if (window.confirm('Are you sure you want to delete this announcement?')) {
      try {
        // TODO: Implement Firebase delete
        setAnnouncements(prev => prev.filter(ann => ann.id !== announcementId));
        addNotification('success', 'Announcement Deleted', 'Announcement has been successfully deleted.');
      } catch (error) {
        addNotification('error', 'Delete Failed', 'Failed to delete announcement. Please try again.');
      }
    }
  };

  const handleTogglePin = async (announcementId: string) => {
    try {
      // TODO: Implement Firebase update
      setAnnouncements(prev => prev.map(ann => 
        ann.id === announcementId 
          ? { ...ann, pinned: !ann.pinned, updatedAt: new Date().toISOString() }
          : ann
      ));
      addNotification('success', 'Pin Updated', 'Announcement pin status has been updated.');
    } catch (error) {
      addNotification('error', 'Update Failed', 'Failed to update pin status. Please try again.');
    }
  };

  const handleSaveAnnouncement = async (announcementData: Partial<Announcement>) => {
    try {
      if (modalMode === 'create') {
        // TODO: Implement Firebase create
        const newAnnouncement: Announcement = {
          ...announcementData as Announcement,
          id: Date.now().toString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        setAnnouncements(prev => [...prev, newAnnouncement]);
        addNotification('success', 'Announcement Created', 'New announcement has been successfully created.');
      } else {
        // TODO: Implement Firebase update
        setAnnouncements(prev => prev.map(ann => 
          ann.id === selectedAnnouncement?.id 
            ? { ...ann, ...announcementData, updatedAt: new Date().toISOString() }
            : ann
        ));
        addNotification('success', 'Announcement Updated', 'Announcement has been successfully updated.');
      }
      setIsModalOpen(false);
    } catch (error) {
      addNotification('error', 'Save Failed', 'Failed to save announcement. Please try again.');
    }
  };

  const filteredAnnouncements = announcements.filter(announcement => {
    const matchesSearch = announcement.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         announcement.body.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || announcement.category === filterCategory;
    const matchesPriority = filterPriority === 'all' || announcement.priority === filterPriority;
    const matchesPinned = !showPinnedOnly || announcement.pinned;
    
    return matchesSearch && matchesCategory && matchesPriority && matchesPinned;
  });

  const getCategoryColor = (category: string) => {
    const colors = {
      general: 'bg-blue-100 text-blue-800',
      event: 'bg-green-100 text-green-800',
      reminder: 'bg-yellow-100 text-yellow-800',
      emergency: 'bg-red-100 text-red-800',
      achievement: 'bg-purple-100 text-purple-800'
    };
    return colors[category as keyof typeof colors] || colors.general;
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: 'bg-gray-100 text-gray-800',
      medium: 'bg-blue-100 text-blue-800',
      high: 'bg-yellow-100 text-yellow-800',
      urgent: 'bg-red-100 text-red-800'
    };
    return colors[priority as keyof typeof colors] || colors.low;
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-48 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Announcement Management</h1>
          <p className="text-gray-600 mt-2">Manage pack announcements, updates, and communications</p>
        </div>
        <button
          onClick={handleCreateAnnouncement}
          className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Announcement
        </button>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                id="search"
                placeholder="Search announcements..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
          
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              id="category"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">All Categories</option>
              <option value="general">General</option>
              <option value="event">Event</option>
              <option value="reminder">Reminder</option>
              <option value="emergency">Emergency</option>
              <option value="achievement">Achievement</option>
            </select>
          </div>

          <div>
            <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
              Priority
            </label>
            <select
              id="priority"
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          <div className="flex items-end">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={showPinnedOnly}
                onChange={(e) => setShowPinnedOnly(e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">Pinned Only</span>
            </label>
          </div>
        </div>
      </div>

      {/* Announcements Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAnnouncements.map((announcement) => (
          <div key={announcement.id} className={`bg-white rounded-lg shadow-md overflow-hidden ${announcement.pinned ? 'ring-2 ring-yellow-400' : ''}`}>
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center flex-1">
                  <Megaphone className="h-5 w-5 text-indigo-600 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900 flex-1">{announcement.title}</h3>
                </div>
                <div className="flex space-x-2 ml-2">
                  <button
                    onClick={() => handleTogglePin(announcement.id)}
                    className={`transition-colors ${announcement.pinned ? 'text-yellow-600' : 'text-gray-400 hover:text-yellow-600'}`}
                    title={announcement.pinned ? 'Unpin announcement' : 'Pin announcement'}
                  >
                    <Pin className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleEditAnnouncement(announcement)}
                    className="text-gray-400 hover:text-indigo-600 transition-colors"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteAnnouncement(announcement.id)}
                    className="text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm text-gray-700 line-clamp-3">{announcement.body}</p>

                {announcement.eventId && (
                  <div className="flex items-center text-sm text-indigo-600">
                    <Link className="h-4 w-4 mr-1" />
                    <span>Linked to: {announcement.eventTitle}</span>
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(announcement.category)}`}>
                    {announcement.category}
                  </span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(announcement.priority)}`}>
                    {announcement.priority}
                  </span>
                  {announcement.pinned && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      Pinned
                    </span>
                  )}
                </div>

                {announcement.attachments && announcement.attachments.length > 0 && (
                  <div className="flex items-center text-sm text-gray-600">
                    <FileText className="h-4 w-4 mr-1" />
                    <span>{announcement.attachments.length} attachment(s)</span>
                  </div>
                )}

                {announcement.expiresAt && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="h-4 w-4 mr-1" />
                    <span>Expires: {new Date(announcement.expiresAt).toLocaleDateString()}</span>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Created: {new Date(announcement.createdAt).toLocaleDateString()}</span>
                  <span>Updated: {new Date(announcement.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredAnnouncements.length === 0 && (
        <div className="text-center py-12">
          <Megaphone className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No announcements found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || filterCategory !== 'all' || filterPriority !== 'all' || showPinnedOnly
              ? 'Try adjusting your search or filters.'
              : 'Get started by creating your first announcement.'}
          </p>
        </div>
      )}

      {/* Announcement Modal */}
      {isModalOpen && (
        <AnnouncementModal
          announcement={selectedAnnouncement}
          mode={modalMode}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveAnnouncement}
        />
      )}
    </div>
  );
};

// Announcement Modal Component
interface AnnouncementModalProps {
  announcement: Announcement | null;
  mode: 'create' | 'edit';
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<Announcement>) => void;
}

const AnnouncementModal: React.FC<AnnouncementModalProps> = ({ announcement, mode, isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState<Partial<Announcement>>({
    title: '',
    body: '',
    pinned: false,
    category: 'general',
    priority: 'medium',
    isActive: true
  });

  useEffect(() => {
    if (announcement && mode === 'edit') {
      setFormData(announcement);
    } else {
      setFormData({
        title: '',
        body: '',
        pinned: false,
        category: 'general',
        priority: 'medium',
        isActive: true
      });
    }
  }, [announcement, mode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {mode === 'create' ? 'Create New Announcement' : 'Edit Announcement'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                Title *
              </label>
              <input
                type="text"
                id="title"
                required
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label htmlFor="body" className="block text-sm font-medium text-gray-700">
                Content *
              </label>
              <textarea
                id="body"
                required
                rows={6}
                value={formData.body}
                onChange={(e) => setFormData(prev => ({ ...prev, body: e.target.value }))}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter announcement content..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                  Category
                </label>
                <select
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as Announcement['category'] }))}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="general">General</option>
                  <option value="event">Event</option>
                  <option value="reminder">Reminder</option>
                  <option value="emergency">Emergency</option>
                  <option value="achievement">Achievement</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="priority" className="block text-sm font-medium text-gray-700">
                  Priority
                </label>
                <select
                  id="priority"
                  value={formData.priority}
                  onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as Announcement['priority'] }))}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="pinned"
                checked={formData.pinned}
                onChange={(e) => setFormData(prev => ({ ...prev, pinned: e.target.checked }))}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="pinned" className="ml-2 block text-sm text-gray-900">
                Pin this announcement (show at top)
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                Announcement is active
              </label>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                {mode === 'create' ? 'Create Announcement' : 'Update Announcement'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminAnnouncements;
