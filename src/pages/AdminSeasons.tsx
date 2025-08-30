import React, { useState } from 'react';
import { useAdmin } from '../contexts/AdminContext';
import { Plus, Edit, Trash2, Calendar, Users, MapPin, Settings, X } from 'lucide-react';

interface Season {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  description: string;
  isActive: boolean;
  eventCount: number;
  locationCount: number;
  memberCount: number;
  color: string;
}

const AdminSeasons: React.FC = () => {
  const { addNotification } = useAdmin();
  const [seasons, setSeasons] = useState<Season[]>([
    {
      id: '1',
      name: 'Fall 2024',
      startDate: '2024-09-01',
      endDate: '2024-11-30',
      description: 'Fall camping season with cooler weather activities',
      isActive: true,
      eventCount: 8,
      locationCount: 5,
      memberCount: 45,
      color: 'bg-orange-500'
    },
    {
      id: '2',
      name: 'Winter 2024-25',
      startDate: '2024-12-01',
      endDate: '2025-02-28',
      description: 'Winter activities and indoor events',
      isActive: false,
      eventCount: 6,
      locationCount: 3,
      memberCount: 38,
      color: 'bg-blue-500'
    },
    {
      id: '3',
      name: 'Spring 2025',
      startDate: '2025-03-01',
      endDate: '2025-05-31',
      description: 'Spring renewal and outdoor adventures',
      isActive: false,
      eventCount: 12,
      locationCount: 8,
      memberCount: 52,
      color: 'bg-green-500'
    }
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedSeason, setSelectedSeason] = useState<Season | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    startDate: '',
    endDate: '',
    description: '',
    color: 'bg-blue-500',
    isActive: false
  });

  const colorOptions = [
    { value: 'bg-blue-500', label: 'Blue', preview: 'bg-blue-500' },
    { value: 'bg-green-500', label: 'Green', preview: 'bg-green-500' },
    { value: 'bg-purple-500', label: 'Purple', preview: 'bg-purple-500' },
    { value: 'bg-orange-500', label: 'Orange', preview: 'bg-orange-500' },
    { value: 'bg-red-500', label: 'Red', preview: 'bg-red-500' },
    { value: 'bg-indigo-500', label: 'Indigo', preview: 'bg-indigo-500' },
    { value: 'bg-pink-500', label: 'Pink', preview: 'bg-pink-500' },
    { value: 'bg-yellow-500', label: 'Yellow', preview: 'bg-yellow-500' }
  ];

  const handleCreateSeason = () => {
    setModalMode('create');
    setSelectedSeason(null);
    setFormData({
      name: '',
      startDate: '',
      endDate: '',
      description: '',
      color: 'bg-blue-500',
      isActive: false
    });
    setIsModalOpen(true);
  };

  const handleEditSeason = (season: Season) => {
    setModalMode('edit');
    setSelectedSeason(season);
    setFormData({
      name: season.name,
      startDate: season.startDate,
      endDate: season.endDate,
      description: season.description,
      color: season.color,
      isActive: season.isActive
    });
    setIsModalOpen(true);
  };

  const handleDeleteSeason = async (seasonId: string) => {
    try {
      // TODO: Replace with actual Firebase call
      setSeasons(prev => prev.filter(season => season.id !== seasonId));
      await addNotification('success', 'Success', 'Season deleted successfully');
    } catch (error) {
      await addNotification('error', 'Error', 'Failed to delete season');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (modalMode === 'create') {
        const newSeason: Season = {
          id: Date.now().toString(),
          name: formData.name,
          startDate: formData.startDate,
          endDate: formData.endDate,
          description: formData.description,
          color: formData.color,
          isActive: formData.isActive,
          eventCount: 0,
          locationCount: 0,
          memberCount: 0
        };
        setSeasons(prev => [...prev, newSeason]);
        await addNotification('success', 'Success', 'Season created successfully');
      } else {
        setSeasons(prev => prev.map(season => 
          season.id === selectedSeason?.id 
            ? { ...season, ...formData }
            : season
        ));
        await addNotification('success', 'Success', 'Season updated successfully');
      }
      setIsModalOpen(false);
    } catch (error) {
      await addNotification('error', 'Error', `Failed to ${modalMode} season`);
    }
  };

  const toggleSeasonStatus = async (seasonId: string) => {
    try {
      setSeasons(prev => prev.map(season => 
        season.id === seasonId 
          ? { ...season, isActive: !season.isActive }
          : season
      ));
      await addNotification('success', 'Success', 'Season status updated successfully');
    } catch (error) {
      await addNotification('error', 'Error', 'Failed to update season status');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-gray-900 mb-2">
          Season Management
        </h1>
        <p className="text-gray-600">
          Manage camping seasons, events, and activities throughout the year
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total Seasons</p>
              <p className="text-3xl font-bold">{seasons.length}</p>
            </div>
            <div className="text-blue-200 text-4xl">🌱</div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Active Season</p>
              <p className="text-3xl font-bold">{seasons.filter(s => s.isActive).length}</p>
            </div>
            <div className="text-green-200 text-4xl">✅</div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Total Events</p>
              <p className="text-3xl font-bold">{seasons.reduce((sum, s) => sum + s.eventCount, 0)}</p>
            </div>
            <div className="text-purple-200 text-4xl">📅</div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm font-medium">Total Members</p>
              <p className="text-3xl font-bold">{seasons.reduce((sum, s) => sum + s.memberCount, 0)}</p>
            </div>
            <div className="text-orange-200 text-4xl">👥</div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex space-x-4">
          <button
            onClick={handleCreateSeason}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200 shadow-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Season
          </button>
        </div>
      </div>

      {/* Seasons Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {seasons.map((season) => (
          <div
            key={season.id}
            className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200"
          >
            {/* Season Header */}
            <div className="flex items-start justify-between mb-4">
              <div className={`w-4 h-4 rounded-full ${season.color} mr-3 mt-1`}></div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-gray-900 mb-1">{season.name}</h3>
                <p className="text-sm text-gray-600">{season.description}</p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEditSeason(season)}
                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteSeason(season.id)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Season Stats */}
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <div className="flex items-center justify-center mb-1">
                  <Calendar className="w-4 h-4 text-gray-400 mr-1" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{season.eventCount}</p>
                <p className="text-xs text-gray-500">Events</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-1">
                  <MapPin className="w-4 h-4 text-gray-400 mr-1" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{season.locationCount}</p>
                <p className="text-xs text-gray-500">Locations</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-1">
                  <Users className="w-4 h-4 text-gray-400 mr-1" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{season.memberCount}</p>
                <p className="text-xs text-gray-500">Members</p>
              </div>
            </div>

            {/* Date Range */}
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Start:</span>
                <span className="font-medium text-gray-900">{new Date(season.startDate).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-gray-600">End:</span>
                <span className="font-medium text-gray-900">{new Date(season.endDate).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Status Toggle */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Active Season</span>
              <button
                onClick={() => toggleSeasonStatus(season.id)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                  season.isActive ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                    season.isActive ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-display font-semibold text-gray-900">
                {modalMode === 'create' ? 'Create New Season' : 'Edit Season'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Season Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Fall 2024"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Color Theme
                  </label>
                  <select
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {colorOptions.map((color) => (
                      <option key={color.value} value={color.value}>
                        {color.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Describe the season's activities and focus..."
                />
              </div>

              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                  Set as active season
                </label>
              </div>

              <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors duration-200"
                >
                  {modalMode === 'create' ? 'Create Season' : 'Update Season'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSeasons;
