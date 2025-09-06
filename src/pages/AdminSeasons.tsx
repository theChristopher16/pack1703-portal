import React, { useState, useEffect } from 'react';
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
  createdAt?: string;
  updatedAt?: string;
}

const AdminSeasons: React.FC = () => {
  const { addNotification } = useAdmin();
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [loading, setLoading] = useState(true);

  // Load seasons from Firebase
  useEffect(() => {
    const loadSeasons = async () => {
      try {
        setLoading(true);
        
        // Import Firebase functions
        const { collection, query, orderBy, getDocs } = await import('firebase/firestore');
        const { db } = await import('../firebase/config');
        
        // Query seasons
        const seasonsRef = collection(db, 'seasons');
        const q = query(seasonsRef, orderBy('startDate', 'desc'));
        
        const snapshot = await getDocs(q);
        const seasonsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Season[];
        
        setSeasons(seasonsData);
      } catch (error) {
        console.error('Error loading seasons:', error);
        addNotification('error', 'Error', 'Failed to load seasons');
        // Fallback to empty array
        setSeasons([]);
      } finally {
        setLoading(false);
      }
    };

    loadSeasons();
  }, [addNotification]);

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
      // Import Firebase functions
      const { doc, deleteDoc } = await import('firebase/firestore');
      const { db } = await import('../firebase/config');
      
      const seasonRef = doc(db, 'seasons', seasonId);
      await deleteDoc(seasonRef);
      
      setSeasons(prev => prev.filter(season => season.id !== seasonId));
      addNotification('success', 'Success', 'Season deleted successfully');
    } catch (error) {
      console.error('Error deleting season:', error);
      addNotification('error', 'Error', 'Failed to delete season');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Import Firebase functions
      const { collection, addDoc, doc, updateDoc, serverTimestamp } = await import('firebase/firestore');
      const { db } = await import('../firebase/config');
      
      if (modalMode === 'create') {
        const newSeasonData = {
          name: formData.name,
          startDate: formData.startDate,
          endDate: formData.endDate,
          description: formData.description,
          color: formData.color,
          isActive: formData.isActive,
          eventCount: 0,
          locationCount: 0,
          memberCount: 0,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        
        const docRef = await addDoc(collection(db, 'seasons'), newSeasonData);
        const newSeason: Season = {
          id: docRef.id,
          ...newSeasonData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        setSeasons(prev => [newSeason, ...prev]);
        addNotification('success', 'Success', 'Season created successfully');
      } else {
        const seasonRef = doc(db, 'seasons', selectedSeason!.id);
        await updateDoc(seasonRef, {
          name: formData.name,
          startDate: formData.startDate,
          endDate: formData.endDate,
          description: formData.description,
          color: formData.color,
          isActive: formData.isActive,
          updatedAt: serverTimestamp()
        });
        
        setSeasons(prev => prev.map(season => 
          season.id === selectedSeason?.id 
            ? { ...season, ...formData, updatedAt: new Date().toISOString() }
            : season
        ));
        addNotification('success', 'Success', 'Season updated successfully');
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error(`Error ${modalMode === 'create' ? 'creating' : 'updating'} season:`, error);
      addNotification('error', 'Error', `Failed to ${modalMode} season`);
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
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50/30 to-gray-100/30 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-display font-bold text-gray-900 mb-4">
            Season Management
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl">
            Manage camping seasons, events, and activities throughout the year
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading seasons...</p>
          </div>
        ) : (
          <>
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/50 shadow-soft p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Total Seasons</p>
                    <p className="text-3xl font-bold text-gray-900">{seasons.length}</p>
                  </div>
                  <div className="text-blue-600 text-4xl">🌱</div>
                </div>
              </div>
              
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/50 shadow-soft p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Active Season</p>
                    <p className="text-3xl font-bold text-gray-900">{seasons.filter(s => s.isActive).length}</p>
                  </div>
                  <div className="text-green-600 text-4xl">✅</div>
                </div>
              </div>
              
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/50 shadow-soft p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Total Events</p>
                    <p className="text-3xl font-bold text-gray-900">{seasons.reduce((sum, s) => sum + s.eventCount, 0)}</p>
                  </div>
                  <div className="text-purple-600 text-4xl">📅</div>
                </div>
              </div>
              
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/50 shadow-soft p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Total Members</p>
                    <p className="text-3xl font-bold text-gray-900">{seasons.reduce((sum, s) => sum + s.memberCount, 0)}</p>
                  </div>
                  <div className="text-orange-600 text-4xl">👥</div>
                </div>
              </div>
            </div>

            {/* Create Button */}
            <div className="mb-8">
              <button
                onClick={handleCreateSeason}
                className="bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 shadow-soft"
              >
                <Plus className="w-5 h-5 inline mr-2" />
                Create New Season
              </button>
            </div>

            {/* Seasons List */}
            {seasons.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">No seasons found</h3>
                <p className="text-gray-500 mb-6">Create your first season to get started</p>
                <button
                  onClick={handleCreateSeason}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 shadow-soft"
                >
                  Create Your First Season
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {seasons.map(season => (
                  <div
                    key={season.id}
                    className={`bg-white/90 backdrop-blur-sm rounded-2xl border border-white/50 shadow-soft p-6 hover:shadow-glow transition-all duration-300 ${season.color} bg-opacity-10`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">{season.name}</h3>
                        <p className="text-gray-600 text-sm mb-3">{season.description}</p>
                        <div className="flex items-center text-sm text-gray-500 mb-2">
                          <Calendar className="w-4 h-4 mr-1" />
                          {new Date(season.startDate).toLocaleDateString()} - {new Date(season.endDate).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => toggleSeasonStatus(season.id)}
                          className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 ${
                            season.isActive
                              ? 'bg-green-100 text-green-700 hover:bg-green-200'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {season.isActive ? 'Active' : 'Inactive'}
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">{season.eventCount}</div>
                        <div className="text-xs text-gray-500">Events</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">{season.locationCount}</div>
                        <div className="text-xs text-gray-500">Locations</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">{season.memberCount}</div>
                        <div className="text-xs text-gray-500">Members</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEditSeason(season)}
                          className="p-2 text-gray-400 hover:text-primary-600 transition-colors duration-200"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteSeason(season.id)}
                          className="p-2 text-gray-400 hover:text-red-600 transition-colors duration-200"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className={`w-3 h-3 rounded-full ${season.color}`}></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                      Season Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                      placeholder="e.g., Fall 2024"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="color" className="block text-sm font-medium text-gray-700 mb-2">
                      Color Theme
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {colorOptions.map(color => (
                        <button
                          key={color.value}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, color: color.value }))}
                          className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                            formData.color === color.value
                              ? 'border-primary-500 ring-2 ring-primary-200'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className={`w-full h-4 rounded ${color.preview}`}></div>
                          <div className="text-xs text-gray-600 mt-1">{color.label}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
                      Start Date
                    </label>
                    <input
                      type="date"
                      id="startDate"
                      value={formData.startDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">
                      End Date
                    </label>
                    <input
                      type="date"
                      id="endDate"
                      value={formData.endDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                    rows={3}
                    placeholder="Describe the season's activities and focus..."
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
                    Set as active season
                  </label>
                </div>

                <div className="flex items-center justify-end space-x-4 pt-6">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 shadow-soft"
                  >
                    {modalMode === 'create' ? 'Create Season' : 'Update Season'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSeasons;