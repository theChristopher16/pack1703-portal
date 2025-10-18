import React, { useState, useEffect } from 'react';
import { useAdmin } from '../contexts/AdminContext';
import { Bell, Pin, TrendingUp, MessageSquare, Clock, Calendar, Megaphone, Edit, Trash2, Plus, Search } from 'lucide-react';
import { firestoreService } from '../services/firestore';
import { userAnnouncementService } from '../services/userAnnouncementService';
import { AnnouncementCard, AnnouncementFeed } from '../components/Announcements';
import { Announcement } from '../types/firestore';
import { DenService } from '../services/denService';
import { DEN_INFO, ALL_DENS, INDIVIDUAL_DENS, DEN_TYPES } from '../constants/dens';

interface AdminAnnouncement {
  id: string;
  title: string;
  body: string;
  content?: string;
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
  sendEmail?: boolean;
  sendSMS?: boolean;
  testMode?: boolean;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
}

const UnifiedAnnouncementsPage: React.FC = () => {
  const { state } = useAdmin();
  const currentUser = state.currentUser;
  
  // Check if user can manage announcements (admin/moderator only)
  const canManageAnnouncements = currentUser?.role === 'super-admin' || 
                                 currentUser?.role === 'content-admin' || 
                                 currentUser?.role === 'moderator';
  
  // All authenticated users (including parents) can view announcements
  const canViewAnnouncements = !!currentUser;
  
  // For backward compatibility
  const isAdmin = canManageAnnouncements;
  
  // Debug logging
  console.log('UnifiedAnnouncementsPage - currentUser:', currentUser);
  console.log('UnifiedAnnouncementsPage - role:', currentUser?.role);
  console.log('UnifiedAnnouncementsPage - canManageAnnouncements:', canManageAnnouncements);
  console.log('UnifiedAnnouncementsPage - canViewAnnouncements:', canViewAnnouncements);

  // User view state
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Admin view state
  const [adminAnnouncements, setAdminAnnouncements] = useState<AdminAnnouncement[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');

  // Helper function for disabled styling
  const getDisabledClasses = (baseClasses: string) => 
    `${baseClasses} ${isSaving ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''}`;
  const [selectedAdminAnnouncement, setSelectedAdminAnnouncement] = useState<AdminAnnouncement | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [showPinnedOnly, setShowPinnedOnly] = useState(false);

  // Form state for admin
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'general' as const,
    priority: 'medium' as const,
    sendEmail: false,
    sendSMS: false,
    testMode: false,
    pinned: false,
    expiresAt: '',
    targetDens: [] as string[] // Array of selected den IDs
  });

  // Fetch announcements based on user role
  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }
    
    if (canManageAnnouncements) {
      fetchAdminAnnouncements();
    } else if (canViewAnnouncements) {
      fetchUserAnnouncements();
    }
  }, [currentUser, canManageAnnouncements, canViewAnnouncements]);

  const fetchUserAnnouncements = async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedAnnouncements = await userAnnouncementService.getAnnouncementsWithPinStatus();
      setAnnouncements(fetchedAnnouncements);
    } catch (err) {
      console.error('Failed to fetch announcements from Firebase:', err);
      setAnnouncements([]);
      setError('Unable to load announcements. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAdminAnnouncements = async () => {
    try {
      setLoading(true);
      const announcementsData = await firestoreService.getAnnouncements();
      setAdminAnnouncements(announcementsData);
    } catch (error) {
      console.error('Error fetching announcements:', error);
      setAdminAnnouncements([]);
    } finally {
      setLoading(false);
    }
  };

  // User view handlers
  const handleAnnouncementClick = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
  };

  const handlePinToggle = async (announcementId: string, pinned: boolean) => {
    try {
      await userAnnouncementService.togglePinAnnouncement(announcementId);
      // Refresh announcements to show updated pin status
      fetchUserAnnouncements();
    } catch (error) {
      console.error('Failed to toggle pin:', error);
    }
  };

  // Admin view handlers
  const handleCreateAnnouncement = () => {
    setModalMode('create');
    setSelectedAdminAnnouncement(null);
    setFormData({
      title: '',
      content: '',
      category: 'general',
      priority: 'medium',
      sendEmail: false,
      sendSMS: false,
      testMode: false,
      pinned: false,
      expiresAt: '',
      targetDens: []
    });
    setIsModalOpen(true);
  };

  const handleEditAnnouncement = (announcement: AdminAnnouncement) => {
    setModalMode('edit');
    setSelectedAdminAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      content: announcement.content || announcement.body,
      category: announcement.category as any,
      priority: announcement.priority as any,
      sendEmail: announcement.sendEmail || false,
      sendSMS: announcement.sendSMS || false,
      testMode: announcement.testMode || false,
      pinned: announcement.pinned,
      expiresAt: announcement.expiresAt || '',
      targetDens: (announcement as any).targetDens || []
    });
    setIsModalOpen(true);
  };

  const handleDeleteAnnouncement = async (announcementId: string) => {
    if (window.confirm('Are you sure you want to delete this announcement?')) {
      try {
        await firestoreService.deleteAnnouncement(announcementId);
        fetchAdminAnnouncements();
      } catch (error) {
        console.error('Error deleting announcement:', error);
      }
    }
  };

  const handleSaveAnnouncement = async () => {
    if (isSaving) return; // Prevent multiple submissions
    
    setIsSaving(true);
    setSaveStatus('saving');
    
    try {
      const announcementData: any = {
        title: formData.title,
        content: formData.content,
        category: formData.category,
        priority: formData.priority,
        sendEmail: formData.sendEmail,
        sendSMS: formData.sendSMS,
        testMode: formData.testMode,
        pinned: formData.pinned,
        expiresAt: formData.expiresAt || null
      };

      // Only include targetDens if it has values, otherwise omit the field entirely
      // Empty array means pack-wide (all dens), so we can omit it for Firestore
      if (formData.targetDens.length > 0) {
        announcementData.targetDens = formData.targetDens;
      }

      if (modalMode === 'create') {
        await firestoreService.createAnnouncement(announcementData, formData.testMode);
        setSaveStatus('success');
      } else if (selectedAdminAnnouncement) {
        await firestoreService.updateAnnouncement(selectedAdminAnnouncement.id, announcementData);
        setSaveStatus('success');
      }

      // Reset form data
      setFormData({
        title: '',
        content: '',
        category: 'general',
        priority: 'medium',
        sendEmail: false,
        sendSMS: false,
        testMode: false,
        pinned: false,
        expiresAt: '',
        targetDens: []
      });

      // Close modal after a short delay to show success status
      setTimeout(() => {
        setIsModalOpen(false);
        setModalMode('create');
        setSelectedAdminAnnouncement(null);
        setSaveStatus('idle');
        setIsSaving(false);
        fetchAdminAnnouncements();
      }, 1500);

    } catch (error) {
      console.error('Error saving announcement:', error);
      setSaveStatus('error');
      setIsSaving(false);
    }
  };

  // Filter announcements for admin view
  const filteredAnnouncements = adminAnnouncements.filter(announcement => {
    const matchesSearch = announcement.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         announcement.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         announcement.body.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || announcement.category === filterCategory;
    const matchesPriority = filterPriority === 'all' || announcement.priority === filterPriority;
    const matchesPinned = !showPinnedOnly || announcement.pinned;

    return matchesSearch && matchesCategory && matchesPriority && matchesPinned;
  });

  // Use the same component for all users, just hide admin controls for non-admins

  // Unified View - same component for all users
  return (
    <div className="min-h-screen bg-fog">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center">
            <Megaphone className="h-8 w-8 text-moss mr-3" />
            <div>
              <h1 className="text-3xl font-bold text-ink">
                {isAdmin ? 'Announcement Management' : 'Scout Pack Announcements'}
              </h1>
              <p className="text-teal-700">
                {isAdmin ? 'Create and manage pack announcements and news' : 'Stay connected with the latest news, updates, and important information from pack leadership'}
              </p>
            </div>
          </div>
          {isAdmin && (
            <button
              onClick={handleCreateAnnouncement}
              className="flex items-center px-4 py-2 bg-moss text-white rounded-brand hover:bg-moss-600 transition-colors w-full sm:w-auto shadow-card"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Announcement
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-brand shadow-card border border-cloud p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-teal-700 mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-teal-400" />
                <input
                  type="text"
                  placeholder="Search announcements..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full px-3 py-2 border border-cloud rounded-md focus:ring-2 focus:ring-moss/20 focus:border-moss"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-teal-700 mb-2">Category</label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full px-3 py-2 border border-cloud rounded-md focus:ring-2 focus:ring-moss/20 focus:border-moss"
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
              <label className="block text-sm font-medium text-teal-700 mb-2">Priority</label>
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="w-full px-3 py-2 border border-cloud rounded-md focus:ring-2 focus:ring-moss/20 focus:border-moss"
              >
                <option value="all">All Priorities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="pinnedOnly"
                checked={showPinnedOnly}
                onChange={(e) => setShowPinnedOnly(e.target.checked)}
                className="h-4 w-4 text-moss focus:ring-moss border-cloud rounded"
              />
              <label htmlFor="pinnedOnly" className="ml-2 text-sm text-teal-700">
                Pinned only
              </label>
            </div>
          </div>
        </div>

        {/* Announcements List */}
        <div className="bg-white rounded-brand shadow-card border border-cloud">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-moss mx-auto"></div>
              <p className="mt-2 text-teal-700">Loading announcements...</p>
            </div>
          ) : (isAdmin ? filteredAnnouncements : announcements).length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-teal-400 mb-4">
                <Megaphone className="h-12 w-12 mx-auto mb-2" />
                <h3 className="text-lg font-medium text-ink">No announcements found</h3>
              </div>
              <p className="text-teal-700">
                {isAdmin ? 'Create your first announcement to get started.' : 'Check back later for updates from pack leadership.'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-cloud">
              {(isAdmin ? filteredAnnouncements : announcements).map((announcement) => (
                <div key={announcement.id} className="p-6 hover:bg-fog/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        {announcement.pinned && (
                          <Pin className="h-4 w-4 text-sun mr-2" />
                        )}
                        <h3 className="text-lg font-medium text-ink">{announcement.title}</h3>
                        <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                          announcement.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                          announcement.priority === 'high' ? 'bg-sun/20 text-ink border border-sun/40' :
                          announcement.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {announcement.priority}
                        </span>
                        <span className="ml-2 px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                          {announcement.category}
                        </span>
                      </div>
                      <p className="text-gray-600 mb-2">
                        {(announcement as any).content || announcement.body}
                      </p>
                      <div className="flex items-center text-sm text-gray-500">
                        <Clock className="h-4 w-4 mr-1" />
                        <span>Created {(announcement.createdAt as any).toDate ? (announcement.createdAt as any).toDate().toLocaleDateString() : new Date(announcement.createdAt as any).toLocaleDateString()}</span>
                        {(announcement as any).sendEmail && (
                          <>
                            <span className="mx-2">•</span>
                            <span className="text-green-600">Email sent</span>
                          </>
                        )}
                        {(announcement as any).sendSMS && (
                          <>
                            <span className="mx-2">•</span>
                            <span className="text-blue-600">SMS sent</span>
                          </>
                        )}
                        {(announcement as any).testMode && (
                          <>
                            <span className="mx-2">•</span>
                            <span className="text-blue-600">Test mode</span>
                          </>
                        )}
                      </div>
                    </div>
                    {isAdmin && (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEditAnnouncement(announcement as AdminAnnouncement)}
                          className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteAnnouncement(announcement.id)}
                          className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Create/Edit Modal - Only show for admins */}
        {isAdmin && isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold mb-4">
                {modalMode === 'create' ? 'Create Announcement' : 'Edit Announcement'}
              </h2>
              
              {/* Status Indicator */}
              {isSaving && (
                <div className={`mb-4 p-3 rounded-lg ${
                  saveStatus === 'success' 
                    ? 'bg-green-100 text-green-800 border border-green-200' 
                    : 'bg-blue-100 text-blue-800 border border-blue-200'
                }`}>
                  <div className="flex items-center">
                    <svg className={`animate-spin -ml-1 mr-2 h-4 w-4 ${
                      saveStatus === 'success' ? 'text-green-600' : 'text-blue-600'
                    }`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {saveStatus === 'success' 
                      ? '✅ Announcement created and email sent!' 
                      : '📧 Creating announcement and sending emails...'}
                  </div>
                </div>
              )}
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    disabled={isSaving}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      isSaving 
                        ? 'border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed' 
                        : 'border-gray-300'
                    }`}
                    placeholder="Enter announcement title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    rows={6}
                    disabled={isSaving}
                    className={getDisabledClasses("w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent")}
                    placeholder="Enter announcement content"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                      disabled={isSaving}
                      className={getDisabledClasses("w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent")}
                    >
                      <option value="general">General</option>
                      <option value="event">Event</option>
                      <option value="reminder">Reminder</option>
                      <option value="emergency">Emergency</option>
                      <option value="achievement">Achievement</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                      disabled={isSaving}
                      className={getDisabledClasses("w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent")}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Target Dens</label>
                  <div className="text-sm text-gray-500 mb-3">
                    Select specific dens to target this announcement. Leave empty to send to all dens.
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {ALL_DENS.map(denId => {
                      const denInfo = DEN_INFO[denId as keyof typeof DEN_INFO];
                      const isPack = denId === DEN_TYPES.PACK;
                      const isSelected = isPack 
                        ? formData.targetDens.length === 0 || formData.targetDens.length === INDIVIDUAL_DENS.length
                        : formData.targetDens.includes(denId);
                      
                      return (
                        <label
                          key={denId}
                          className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all ${
                            isSelected
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          } ${isSaving ? 'opacity-50 cursor-not-allowed' : ''} ${
                            isPack ? 'border-blue-600 bg-blue-100' : ''
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              if (isSaving) return;
                              
                              if (isPack) {
                                // Pack selected = select all individual dens
                                if (e.target.checked) {
                                  setFormData({ ...formData, targetDens: INDIVIDUAL_DENS });
                                } else {
                                  setFormData({ ...formData, targetDens: [] });
                                }
                              } else {
                                // Individual den selected
                                let newTargetDens;
                                if (e.target.checked) {
                                  newTargetDens = [...formData.targetDens, denId];
                                } else {
                                  newTargetDens = formData.targetDens.filter(id => id !== denId);
                                }
                                setFormData({ ...formData, targetDens: newTargetDens });
                              }
                            }}
                            disabled={isSaving}
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
                  
                  {(formData.targetDens.length > 0 || formData.targetDens.length === 0) && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                      <div className="text-sm text-blue-800">
                        <strong>Targeting:</strong> {
                          formData.targetDens.length === 0 
                            ? 'Pack (All Dens)' 
                            : formData.targetDens.length === INDIVIDUAL_DENS.length
                            ? 'Pack (All Dens)'
                            : formData.targetDens.map(denId => 
                                DEN_INFO[denId as keyof typeof DEN_INFO]?.displayName || denId
                              ).join(', ')
                        }
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="sendEmail"
                      checked={formData.sendEmail}
                      onChange={(e) => setFormData({ ...formData, sendEmail: e.target.checked })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="sendEmail" className="ml-2 text-sm text-gray-700">
                      Send email notification
                    </label>
                  </div>

                  <div className="flex items-center opacity-60">
                    <input
                      type="checkbox"
                      id="sendSMS"
                      checked={false}
                      disabled={true}
                      className="h-4 w-4 text-orange-500 focus:ring-orange-500 border-gray-300 rounded"
                    />
                    <label htmlFor="sendSMS" className="ml-2 text-sm text-gray-700">
                      Send SMS notification
                    </label>
                    <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                      Coming Soon
                    </span>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="testMode"
                      checked={formData.testMode}
                      onChange={(e) => setFormData({ ...formData, testMode: e.target.checked })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="testMode" className="ml-2 text-sm text-gray-700">
                      Test mode (only send to test emails)
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="pinned"
                      checked={formData.pinned}
                      onChange={(e) => setFormData({ ...formData, pinned: e.target.checked })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="pinned" className="ml-2 text-sm text-gray-700">
                      Pin to top
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Expires At (optional)</label>
                  <input
                    type="datetime-local"
                    value={formData.expiresAt}
                    onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSaving}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    isSaving 
                      ? 'text-gray-500 bg-gray-100 cursor-not-allowed' 
                      : 'text-gray-700 bg-gray-200 hover:bg-gray-300'
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveAnnouncement}
                  disabled={isSaving}
                  className={`px-4 py-2 text-white rounded-lg transition-colors ${
                    isSaving 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {isSaving ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="wpacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {saveStatus === 'success' ? 'Uploaded!' : 'Uploading...'}
                    </span>
                  ) : (
                    modalMode === 'create' ? 'Create Announcement' : 'Update Announcement'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UnifiedAnnouncementsPage;
