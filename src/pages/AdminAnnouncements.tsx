import React, { useState, useEffect } from 'react';
import { useAdmin } from '../contexts/AdminContext';
import { Megaphone, Edit, Trash2, Plus, Search, Pin, Calendar, Link, FileText } from 'lucide-react';
import { firestoreService } from '../services/firestore';
import { DEN_INFO, ALL_DENS, INDIVIDUAL_DENS, DEN_TYPES } from '../constants/dens';

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
  targetDens?: string[];
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

  // Fetch announcements from database
  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        setLoading(true);
        const announcementsData = await firestoreService.getAnnouncements();
        setAnnouncements(announcementsData);
      } catch (error) {
        console.error('Error fetching announcements:', error);
        setAnnouncements([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAnnouncements();
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
        // Delete from Firestore
        await firestoreService.deleteAnnouncement(announcementId);
        
        // Update local state
        setAnnouncements(prev => prev.filter(ann => ann.id !== announcementId));
        addNotification('success', 'Announcement Deleted', 'Announcement has been successfully deleted.');
      } catch (error) {
        console.error('Failed to delete announcement:', error);
        addNotification('error', 'Delete Failed', 'Failed to delete announcement. Please try again.');
      }
    }
  };

  const handleTogglePin = async (announcementId: string) => {
    try {
      // Find the current announcement to get its current pinned state
      const currentAnnouncement = announcements.find(ann => ann.id === announcementId);
      if (!currentAnnouncement) {
        addNotification('error', 'Update Failed', 'Announcement not found.');
        return;
      }

      const newPinnedState = !currentAnnouncement.pinned;

      // Update in Firestore
      await firestoreService.updateAnnouncement(announcementId, { 
        pinned: newPinnedState 
      });

      // Update local state
      setAnnouncements(prev => prev.map(ann => 
        ann.id === announcementId 
          ? { ...ann, pinned: newPinnedState, updatedAt: new Date().toISOString() }
          : ann
      ));

      addNotification('success', 'Pin Updated', `Announcement ${newPinnedState ? 'pinned' : 'unpinned'} successfully.`);
    } catch (error) {
      console.error('Failed to toggle pin:', error);
      addNotification('error', 'Update Failed', 'Failed to update pin status. Please try again.');
    }
  };

  const handleSaveAnnouncement = async (announcementData: Partial<Announcement>) => {
    try {
      if (modalMode === 'create') {
        // Create in Firestore
        const createData: any = {
          ...announcementData,
          pinned: false, // Default to unpinned
          isActive: true,
          priority: announcementData.priority || 'medium',
          category: announcementData.category || 'general'
        };

        // Only include targetDens if it has values, otherwise omit the field entirely
        if (announcementData.targetDens && announcementData.targetDens.length > 0) {
          createData.targetDens = announcementData.targetDens;
        }

        const newAnnouncement = await firestoreService.createAnnouncement(createData);
        
        // Update local state with the returned announcement (includes Firestore ID)
        setAnnouncements(prev => [...prev, {
          ...announcementData as Announcement,
          id: newAnnouncement.id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }]);
        addNotification('success', 'Announcement Created', 'New announcement has been successfully created.');
      } else {
        // Update in Firestore
        await firestoreService.updateAnnouncement(selectedAnnouncement!.id, announcementData);
        
        // Update local state
        setAnnouncements(prev => prev.map(ann => 
          ann.id === selectedAnnouncement?.id 
            ? { ...ann, ...announcementData, updatedAt: new Date().toISOString() }
            : ann
        ));
        addNotification('success', 'Announcement Updated', 'Announcement has been successfully updated.');
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error('Failed to save announcement:', error);
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
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50/30 to-gray-100/30 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-display font-bold text-gray-900 mb-4">
            Announcement Management
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl">
            Manage pack announcements, notifications, and important updates
          </p>
        </div>

        {/* Controls */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/50 shadow-soft p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <input
                  type="text"
                  placeholder="Search announcements..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 backdrop-blur-sm"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
              </div>

              {/* Category Filter */}
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 backdrop-blur-sm"
              >
                <option value="all">All Categories</option>
                <option value="general">General</option>
                <option value="event">Event</option>
                <option value="reminder">Reminder</option>
                <option value="emergency">Emergency</option>
                <option value="achievement">Achievement</option>
              </select>

              {/* Priority Filter */}
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 backdrop-blur-sm"
              >
                <option value="all">All Priorities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            {/* Create Button */}
            <button
              onClick={handleCreateAnnouncement}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center gap-2 shadow-soft"
            >
              <Plus className="h-4 w-4" />
              Create Announcement
            </button>
          </div>

          {/* Pinned Filter */}
          <div className="mt-4 flex items-center">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={showPinnedOnly}
                onChange={(e) => setShowPinnedOnly(e.target.checked)}
                className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Show pinned only</span>
            </label>
          </div>
        </div>

        {/* Announcements Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAnnouncements.map((announcement) => (
            <div key={announcement.id} className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/50 shadow-soft overflow-hidden hover:shadow-lg transition-all duration-200 hover:scale-[1.02]">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <Megaphone className="h-5 w-5 text-blue-600 mr-2" />
                    <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">{announcement.title}</h3>
                  </div>
                  <div className="flex space-x-2">
                    {announcement.pinned && (
                      <Pin className="h-4 w-4 text-yellow-600" />
                    )}
                    <button
                      onClick={() => handleEditAnnouncement(announcement)}
                      className="text-gray-400 hover:text-blue-600 transition-colors"
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
                  <div className="p-2 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-700 line-clamp-3">{announcement.body}</p>
                  </div>

                  <div className="flex gap-2">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(announcement.category)}`}>
                      {announcement.category}
                    </span>
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(announcement.priority)}`}>
                      {announcement.priority}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
                      <Calendar className="h-4 w-4 text-blue-600" />
                      <span className="text-gray-700">{new Date(announcement.createdAt).toLocaleDateString()}</span>
                    </div>
                    {announcement.eventTitle && (
                      <div className="flex items-center gap-2 p-2 bg-green-50 rounded-lg">
                        <Link className="h-4 w-4 text-green-600" />
                        <span className="text-gray-700">{announcement.eventTitle}</span>
                      </div>
                    )}
                    {announcement.attachments && announcement.attachments.length > 0 && (
                      <div className="flex items-center gap-2 p-2 bg-purple-50 rounded-lg">
                        <FileText className="h-4 w-4 text-purple-600" />
                        <span className="text-gray-700">{announcement.attachments.length} attachment(s)</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex gap-3">
                  <button
                    onClick={() => handleTogglePin(announcement.id)}
                    className={`flex-1 px-3 py-2 text-xs rounded-lg font-medium transition-all duration-200 ${
                      announcement.pinned
                        ? 'bg-white/80 backdrop-blur-sm border border-yellow-200 text-yellow-700 hover:bg-yellow-50 shadow-soft'
                        : 'bg-white/80 backdrop-blur-sm border border-gray-200 text-gray-700 hover:bg-gray-50 shadow-soft'
                    }`}
                  >
                    {announcement.pinned ? 'Unpin' : 'Pin'}
                  </button>
                  <button
                    onClick={() => handleEditAnnouncement(announcement)}
                    className="flex-1 bg-white/80 backdrop-blur-sm border border-blue-200 text-blue-700 hover:bg-blue-50 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 shadow-soft"
                  >
                    Edit
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredAnnouncements.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📢</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {searchTerm || filterCategory !== 'all' || filterPriority !== 'all' || showPinnedOnly
                ? 'No announcements match your filters' 
                : 'No announcements yet'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || filterCategory !== 'all' || filterPriority !== 'all' || showPinnedOnly
                ? 'Try adjusting your search or filters'
                : 'Create your first announcement to get started'}
            </p>
            {!searchTerm && filterCategory === 'all' && filterPriority === 'all' && !showPinnedOnly && (
              <button
                onClick={handleCreateAnnouncement}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 shadow-soft"
              >
                Create Your First Announcement
              </button>
            )}
          </div>
        )}
      </div>

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
    isActive: true,
    targetDens: []
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
        isActive: true,
        targetDens: []
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target Dens
              </label>
              <div className="text-sm text-gray-500 mb-3">
                Select specific dens to target this announcement. Leave empty to send to all dens.
              </div>
              <div className="grid grid-cols-2 gap-3">
                {ALL_DENS.map(denId => {
                  const denInfo = DEN_INFO[denId as keyof typeof DEN_INFO];
                  const isPack = denId === DEN_TYPES.PACK;
                  const currentDens = formData.targetDens || [];
                  const isSelected = isPack 
                    ? currentDens.length === 0 || currentDens.length === INDIVIDUAL_DENS.length
                    : currentDens.includes(denId);
                  
                  return (
                    <label
                      key={denId}
                      className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-200 hover:border-gray-300'
                      } ${isPack ? 'border-indigo-600 bg-indigo-100' : ''}`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          const currentDens = formData.targetDens || [];
                          
                          if (isPack) {
                            // Pack selected = select all individual dens
                            if (e.target.checked) {
                              setFormData(prev => ({ ...prev, targetDens: INDIVIDUAL_DENS }));
                            } else {
                              setFormData(prev => ({ ...prev, targetDens: [] }));
                            }
                          } else {
                            // Individual den selected
                            const newTargetDens = e.target.checked
                              ? [...currentDens, denId]
                              : currentDens.filter(id => id !== denId);
                            setFormData(prev => ({ ...prev, targetDens: newTargetDens }));
                          }
                        }}
                        className="sr-only"
                      />
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{denInfo?.emoji || '🏕️'}</span>
                        <div>
                          <div className="font-medium text-gray-900">{denInfo?.displayName || denId}</div>
                          <div className="text-sm text-gray-500">{denInfo?.grade}</div>
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
              
              {((formData.targetDens || []).length > 0 || (formData.targetDens || []).length === 0) && (
                <div className="mt-3 p-3 bg-indigo-50 rounded-lg">
                  <div className="text-sm text-indigo-800">
                    <strong>Targeting:</strong> {
                      (formData.targetDens || []).length === 0 
                        ? 'Pack (All Dens)' 
                        : (formData.targetDens || []).length === INDIVIDUAL_DENS.length
                        ? 'Pack (All Dens)'
                        : (formData.targetDens || []).map(denId => 
                            DEN_INFO[denId as keyof typeof DEN_INFO]?.displayName || denId
                          ).join(', ')
                    }
                  </div>
                </div>
              )}
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
