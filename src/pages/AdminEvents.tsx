import React, { useState, useEffect } from 'react';
import { useAdmin } from '../contexts/AdminContext';
import { EntityType, AdminActionType } from '../types/admin';

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

  // Mock data for now - will be replaced with Firebase calls
  useEffect(() => {
    const mockEvents: Event[] = [
      {
        id: '1',
        title: 'Pack Meeting - January',
        description: 'Monthly pack meeting with activities and announcements',
        startDate: '2024-01-15T18:00:00',
        endDate: '2024-01-15T20:00:00',
        location: 'Community Center',
        category: 'Meeting',
        visibility: 'public',
        maxParticipants: 50,
        currentParticipants: 35,
        isActive: true,
        createdAt: '2024-01-01T00:00:00',
        updatedAt: '2024-01-01T00:00:00'
      },
      {
        id: '2',
        title: 'Pinewood Derby',
        description: 'Annual pinewood derby race for all scouts',
        startDate: '2024-02-10T10:00:00',
        endDate: '2024-02-10T16:00:00',
        location: 'Scout Hall',
        category: 'Competition',
        visibility: 'public',
        maxParticipants: 100,
        currentParticipants: 78,
        isActive: true,
        createdAt: '2024-01-15T00:00:00',
        updatedAt: '2024-01-15T00:00:00'
      },
      {
        id: '3',
        title: 'Camping Trip',
        description: 'Weekend camping trip to local state park',
        startDate: '2024-03-15T08:00:00',
        endDate: '2024-03-17T16:00:00',
        location: 'State Park',
        category: 'Outdoor',
        visibility: 'link-only',
        maxParticipants: 30,
        currentParticipants: 22,
        isActive: true,
        createdAt: '2024-02-01T00:00:00',
        updatedAt: '2024-02-01T00:00:00'
      }
    ];
    setEvents(mockEvents);
    setLoading(false);
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
        await deleteEntity('event', eventId);
        setEvents(events.filter(e => e.id !== eventId));
      } catch (error) {
        console.error('Error deleting event:', error);
      }
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-primary-50/30 to-secondary-50/30 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading events...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-primary-50/30 to-secondary-50/30 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-display font-bold text-gray-900 mb-4">
            Events Management
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl">
            Manage all pack events, including scheduling, visibility, and participant limits.
          </p>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <input
                  type="text"
                  placeholder="Search events..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-400">🔍</span>
                </div>
              </div>

              {/* Category Filter */}
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
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
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
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
              className="bg-primary hover:bg-primary-dark text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
            >
              <span>➕</span>
              Create Event
            </button>
          </div>
        </div>

        {/* Events Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map(event => (
            <div key={event.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200">
              {/* Event Header */}
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-xl font-semibold text-gray-900 line-clamp-2">
                    {event.title}
                  </h3>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    event.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {event.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {event.description}
                </p>

                {/* Event Details */}
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">📅</span>
                    <span>{new Date(event.startDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">📍</span>
                    <span>{event.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">🏷️</span>
                    <span className="capitalize">{event.category}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">👥</span>
                    <span>{event.currentParticipants}/{event.maxParticipants || '∞'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">🔒</span>
                    <span className="capitalize">{event.visibility}</span>
                  </div>
                </div>
              </div>

              {/* Event Actions */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditEvent(event)}
                    className="flex-1 bg-secondary hover:bg-secondary-dark text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => handleDeleteEvent(event.id)}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200"
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
                className="bg-primary hover:bg-primary-dark text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200"
              >
                Create Your First Event
              </button>
            )}
          </div>
        )}
      </div>

      {/* Event Modal - Placeholder for now */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {modalMode === 'create' ? 'Create New Event' : 'Edit Event'}
              </h2>
              <p className="text-gray-600 mb-6">
                Event creation/editing form will be implemented here.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  className="bg-primary hover:bg-primary-dark text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200"
                >
                  {modalMode === 'create' ? 'Create Event' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminEvents;
