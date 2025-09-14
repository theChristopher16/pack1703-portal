import React, { useState, useEffect } from 'react';
import { useAdmin } from '../contexts/AdminContext';
import { EntityType, AdminActionType } from '../types/admin';
import { firestoreService } from '../services/firestore';
import { collection, query, orderBy, getDocs, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Link } from 'react-router-dom';
import { ArrowLeft, Home } from 'lucide-react';

interface Event {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  location: string;
  category: string;
  visibility: 'public' | 'link-only' | 'private';
  maxParticipants?: number;
  currentParticipants: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const AdminEvents: React.FC = () => {
  const { state, createEntity, updateEntity, deleteEntity } = useAdmin();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterVisibility, setFilterVisibility] = useState('all');

  // Fetch events from database
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        // Use direct Firestore query to get all events (not just public ones)
        const eventsRef = collection(db, 'events');
        const q = query(eventsRef, orderBy('startDate', 'desc'));
        const snapshot = await getDocs(q);
        const eventsData = snapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data(),
          startDate: doc.data().startDate?.toDate?.()?.toISOString() || doc.data().startDate,
          endDate: doc.data().endDate?.toDate?.()?.toISOString() || doc.data().endDate,
        } as Event));
        setEvents(eventsData);
      } catch (error) {
        console.error('Error fetching events:', error);
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchEvents();
  }, []);

  const handleCreateEvent = () => {
    setModalMode('create');
    setSelectedEvent(null);
    setIsModalOpen(true);
  };

  const handleEditEvent = (event: Event) => {
    setModalMode('edit');
    setSelectedEvent(event);
    setIsModalOpen(true);
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        // Delete event directly from Firestore
        const eventRef = doc(db, 'events', eventId);
        await deleteDoc(eventRef);
        setEvents(events.filter(e => e.id !== eventId));
      } catch (error) {
        console.error('Error deleting event:', error);
      }
    }
  };

  const handleSaveEvent = async (eventData: Partial<Event>) => {
    try {
      if (modalMode === 'create') {
        // Create event directly in Firestore
        const eventsRef = collection(db, 'events');
        const eventToCreate = {
          ...eventData,
          startDate: new Date(eventData.startDate!),
          endDate: new Date(eventData.endDate!),
          currentParticipants: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
          visibility: eventData.visibility || 'public',
          status: 'active'
        };
        
        const docRef = await addDoc(eventsRef, eventToCreate);
        const newEvent: Event = {
          id: docRef.id,
          ...eventData,
          currentParticipants: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        } as Event;
        setEvents([newEvent, ...events]); // Add to beginning since we're ordering by desc
      } else if (selectedEvent) {
        // Update event directly in Firestore
        const eventRef = doc(db, 'events', selectedEvent.id);
        const eventToUpdate = {
          ...eventData,
          startDate: new Date(eventData.startDate!),
          endDate: new Date(eventData.endDate!),
          updatedAt: new Date()
        };
        
        await updateDoc(eventRef, eventToUpdate);
        const updatedEvent: Event = {
          ...selectedEvent,
          ...eventData,
          updatedAt: new Date().toISOString()
        } as Event;
        setEvents(events.map(e => e.id === selectedEvent.id ? updatedEvent : e));
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error saving event:', error);
    }
  };

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || event.category === filterCategory;
    const matchesVisibility = filterVisibility === 'all' || event.visibility === filterVisibility;
    
    return matchesSearch && matchesCategory && matchesVisibility;
  });

  const categories = ['Meeting', 'Competition', 'Outdoor', 'Service', 'Social', 'Training'];
  const visibilityOptions = ['public', 'link-only', 'private'];

  // Removed loading animation for faster page transitions

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50/30 to-gray-100/30 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-display font-bold text-gray-900 mb-4">
            Events Management
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mb-8">
            Manage all pack events, including scheduling, visibility, and participant limits.
          </p>
          
          {/* Back to User Portal Button */}
          <div className="flex justify-center mb-8">
            <Link
              to="/"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              <Home className="w-5 h-5 mr-2" />
              Back to User Portal
            </Link>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/50 shadow-soft p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <input
                  type="text"
                  placeholder="Search events..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 backdrop-blur-sm"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-400">🔍</span>
                </div>
              </div>

              {/* Category Filter */}
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 backdrop-blur-sm"
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>

              {/* Visibility Filter */}
              <select
                value={filterVisibility}
                onChange={(e) => setFilterVisibility(e.target.value)}
                className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 backdrop-blur-sm"
              >
                <option value="all">All Visibility</option>
                {visibilityOptions.map(visibility => (
                  <option key={visibility} value={visibility}>{visibility}</option>
                ))}
              </select>
            </div>

            {/* Create Button */}
            <button
              onClick={handleCreateEvent}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center gap-2 shadow-soft"
            >
              <span>➕</span>
              Create Event
            </button>
          </div>
        </div>

        {/* Events Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map(event => (
            <div key={event.id} className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/50 shadow-soft overflow-hidden hover:shadow-lg transition-all duration-200 hover:scale-[1.02]">
              {/* Event Header */}
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-xl font-semibold text-gray-900 line-clamp-2">
                    {event.title}
                  </h3>
                  <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                    event.isActive 
                      ? 'bg-green-100 text-green-800 border border-green-200' 
                      : 'bg-red-100 text-red-800 border border-red-200'
                  }`}>
                    {event.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {event.description}
                </p>

                {/* Event Details */}
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-3 p-2 bg-blue-50 rounded-lg">
                    <span className="text-blue-600">📅</span>
                    <span className="text-gray-700">{new Date(event.startDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-3 p-2 bg-green-50 rounded-lg">
                    <span className="text-green-600">📍</span>
                    <span className="text-gray-700">{event.location}</span>
                  </div>
                  <div className="flex items-center gap-3 p-2 bg-purple-50 rounded-lg">
                    <span className="text-purple-600">🏷️</span>
                    <span className="text-gray-700 capitalize">{event.category}</span>
                  </div>
                  <div className="flex items-center gap-3 p-2 bg-orange-50 rounded-lg">
                    <span className="text-orange-600">👥</span>
                    <span className="text-gray-700">{event.currentParticipants}/{event.maxParticipants || '∞'}</span>
                  </div>
                  <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                    <span className="text-gray-600">🔒</span>
                    <span className="text-gray-700 capitalize">{event.visibility}</span>
                  </div>
                </div>
              </div>

              {/* Event Actions */}
              <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-t border-gray-200">
                <div className="flex gap-3">
                  <button
                    onClick={() => handleEditEvent(event)}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-soft"
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => handleDeleteEvent(event.id)}
                    className="flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-soft"
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredEvents.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📅</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {searchTerm || filterCategory !== 'all' || filterVisibility !== 'all' 
                ? 'No events match your filters' 
                : 'No events yet'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || filterCategory !== 'all' || filterVisibility !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Create your first event to get started'}
            </p>
            {!searchTerm && filterCategory === 'all' && filterVisibility === 'all' && (
              <button
                onClick={handleCreateEvent}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 shadow-soft"
              >
                Create Your First Event
              </button>
            )}
          </div>
        )}
      </div>

      {/* Event Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-white/50 shadow-soft">
            <div className="p-8">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-3xl font-display font-bold text-gray-900">
                    {modalMode === 'create' ? 'Create New Event' : 'Edit Event'}
                  </h2>
                  <p className="text-gray-600 mt-2">
                    {modalMode === 'create' 
                      ? 'Add a new event to the pack calendar' 
                      : 'Update event details and settings'
                    }
                  </p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors duration-200 text-2xl"
                >
                  ✕
                </button>
              </div>

              {/* Event Form */}
              <EventForm 
                event={selectedEvent}
                mode={modalMode}
                onSave={handleSaveEvent}
                onCancel={() => setIsModalOpen(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Event Form Component
interface EventFormProps {
  event: Event | null;
  mode: 'create' | 'edit';
  onSave: (eventData: Partial<Event>) => void;
  onCancel: () => void;
}

const EventForm: React.FC<EventFormProps> = ({ event, mode, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    title: event?.title || '',
    description: event?.description || '',
    startDate: event?.startDate ? event.startDate.slice(0, 16) : '',
    endDate: event?.endDate ? event.endDate.slice(0, 16) : '',
    location: event?.location || '',
    category: event?.category || 'Meeting',
    visibility: event?.visibility || 'public',
    maxParticipants: event?.maxParticipants ? event.maxParticipants.toString() : '',
    isActive: event?.isActive ?? true
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const categories = ['Meeting', 'Competition', 'Outdoor', 'Service', 'Social', 'Training'];
  const visibilityOptions = [
    { value: 'public', label: 'Public', description: 'Visible to everyone' },
    { value: 'link-only', label: 'Link Only', description: 'Only accessible via direct link' },
    { value: 'private', label: 'Private', description: 'Only visible to admins' }
  ];

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Event title is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Event description is required';
    }

    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    }

    if (!formData.endDate) {
      newErrors.endDate = 'End date is required';
    }

    if (formData.startDate && formData.endDate && new Date(formData.startDate) >= new Date(formData.endDate)) {
      newErrors.endDate = 'End date must be after start date';
    }

    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
    }

    if (formData.maxParticipants && parseInt(formData.maxParticipants) < 1) {
      newErrors.maxParticipants = 'Maximum participants must be at least 1';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSave({
        ...formData,
        maxParticipants: formData.maxParticipants && !isNaN(parseInt(formData.maxParticipants)) ? parseInt(formData.maxParticipants) : undefined,
        currentParticipants: event?.currentParticipants || 0,
        createdAt: event?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <span className="text-blue-600 mr-2">📝</span>
          Basic Information
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Title */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Event Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 backdrop-blur-sm ${
                errors.title ? 'border-red-300' : 'border-gray-200'
              }`}
              placeholder="Enter event title..."
            />
            {errors.title && (
              <p className="text-red-600 text-sm mt-1">{errors.title}</p>
            )}
          </div>

          {/* Description */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={4}
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 backdrop-blur-sm ${
                errors.description ? 'border-red-300' : 'border-gray-200'
              }`}
              placeholder="Describe the event..."
            />
            {errors.description && (
              <p className="text-red-600 text-sm mt-1">{errors.description}</p>
            )}
          </div>
        </div>
      </div>

      {/* Date & Time */}
      <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <span className="text-green-600 mr-2">📅</span>
          Date & Time
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Start Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date & Time *
            </label>
            <input
              type="datetime-local"
              value={formData.startDate}
              onChange={(e) => handleInputChange('startDate', e.target.value)}
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white/80 backdrop-blur-sm ${
                errors.startDate ? 'border-red-300' : 'border-gray-200'
              }`}
            />
            {errors.startDate && (
              <p className="text-red-600 text-sm mt-1">{errors.startDate}</p>
            )}
          </div>

          {/* End Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Date & Time *
            </label>
            <input
              type="datetime-local"
              value={formData.endDate}
              onChange={(e) => handleInputChange('endDate', e.target.value)}
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white/80 backdrop-blur-sm ${
                errors.endDate ? 'border-red-300' : 'border-gray-200'
              }`}
            />
            {errors.endDate && (
              <p className="text-red-600 text-sm mt-1">{errors.endDate}</p>
            )}
          </div>
        </div>
      </div>

      {/* Location & Category */}
      <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <span className="text-purple-600 mr-2">📍</span>
          Location & Category
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location *
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white/80 backdrop-blur-sm ${
                errors.location ? 'border-red-300' : 'border-gray-200'
              }`}
              placeholder="Enter event location..."
            />
            {errors.location && (
              <p className="text-red-600 text-sm mt-1">{errors.location}</p>
            )}
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              value={formData.category}
              onChange={(e) => handleInputChange('category', e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white/80 backdrop-blur-sm"
            >
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Settings */}
      <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <span className="text-orange-600 mr-2">⚙️</span>
          Event Settings
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Visibility */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Visibility
            </label>
            <select
              value={formData.visibility}
              onChange={(e) => handleInputChange('visibility', e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white/80 backdrop-blur-sm"
            >
              {visibilityOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              {visibilityOptions.find(opt => opt.value === formData.visibility)?.description}
            </p>
          </div>

          {/* Max Participants */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Maximum Participants
            </label>
            <input
              type="number"
              value={formData.maxParticipants}
              onChange={(e) => handleInputChange('maxParticipants', e.target.value)}
              min="1"
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white/80 backdrop-blur-sm ${
                errors.maxParticipants ? 'border-red-300' : 'border-gray-200'
              }`}
              placeholder="Leave empty for unlimited"
            />
            {errors.maxParticipants && (
              <p className="text-red-600 text-sm mt-1">{errors.maxParticipants}</p>
            )}
          </div>
        </div>

        {/* Active Status */}
        <div className="mt-6">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => handleInputChange('isActive', e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="ml-2 text-sm font-medium text-gray-700">
              Event is active and visible to participants
            </span>
          </label>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex gap-4 justify-end pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors duration-200 font-medium"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-xl font-medium transition-all duration-200 shadow-soft"
        >
          {mode === 'create' ? 'Create Event' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
};

export default AdminEvents;
