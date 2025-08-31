import React, { useState, useEffect } from 'react';
import { useAdmin } from '../contexts/AdminContext';
import { MapPin, Edit, Trash2, Plus, Search, Filter, Map } from 'lucide-react';
import { firestoreService } from '../services/firestore';

interface Location {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  category: 'church' | 'park' | 'campground' | 'community-center' | 'school' | 'other';
  importance: 'high' | 'medium' | 'low';
  parking: 'free' | 'paid' | 'limited' | 'none';
  notes: string;
  privateNotes: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const AdminLocations: React.FC = () => {
  const { addNotification } = useAdmin();
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterImportance, setFilterImportance] = useState('all');

  // Fetch locations from database
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        setLoading(true);
        const locationsData = await firestoreService.getLocations();
        setLocations(locationsData);
      } catch (error) {
        console.error('Error fetching locations:', error);
        setLocations([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchLocations();
  }, []);

  const handleCreateLocation = () => {
    setModalMode('create');
    setSelectedLocation(null);
    setIsModalOpen(true);
  };

  const handleEditLocation = (location: Location) => {
    setModalMode('edit');
    setSelectedLocation(location);
    setIsModalOpen(true);
  };

  const handleDeleteLocation = async (locationId: string) => {
    if (window.confirm('Are you sure you want to delete this location?')) {
      try {
        // TODO: Implement Firebase delete
        setLocations(prev => prev.filter(loc => loc.id !== locationId));
        addNotification('success', 'Location Deleted', 'Location has been successfully deleted.');
      } catch (error) {
        addNotification('error', 'Delete Failed', 'Failed to delete location. Please try again.');
      }
    }
  };

  const handleSaveLocation = async (locationData: Partial<Location>) => {
    try {
      if (modalMode === 'create') {
        // TODO: Implement Firebase create
        const newLocation: Location = {
          ...locationData as Location,
          id: Date.now().toString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        setLocations(prev => [...prev, newLocation]);
        addNotification('success', 'Location Created', 'New location has been successfully created.');
      } else {
        // TODO: Implement Firebase update
        setLocations(prev => prev.map(loc => 
          loc.id === selectedLocation?.id 
            ? { ...loc, ...locationData, updatedAt: new Date().toISOString() }
            : loc
        ));
        addNotification('success', 'Location Updated', 'Location has been successfully updated.');
      }
      setIsModalOpen(false);
    } catch (error) {
      addNotification('error', 'Save Failed', 'Failed to save location. Please try again.');
    }
  };

  const filteredLocations = locations.filter(location => {
    const matchesSearch = location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         location.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         location.city.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || location.category === filterCategory;
    const matchesImportance = filterImportance === 'all' || location.importance === filterImportance;
    
    return matchesSearch && matchesCategory && matchesImportance;
  });

  const getCategoryColor = (category?: string) => {
    const colors = {
      church: 'bg-blue-100 text-blue-800',
      park: 'bg-green-100 text-green-800',
      campground: 'bg-yellow-100 text-yellow-800',
      'community-center': 'bg-purple-100 text-purple-800',
      school: 'bg-indigo-100 text-indigo-800',
      other: 'bg-gray-100 text-gray-800'
    };
    return colors[category as keyof typeof colors] || colors.other;
  };

  const getImportanceColor = (importance: string) => {
    const colors = {
      high: 'bg-red-100 text-red-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-green-100 text-green-800'
    };
    return colors[importance as keyof typeof colors] || colors.low;
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
            Location Management
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl">
            Manage pack locations, venues, and meeting places
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
                  placeholder="Search locations..."
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
                <option value="church">Church</option>
                <option value="park">Park</option>
                <option value="campground">Campground</option>
                <option value="community-center">Community Center</option>
                <option value="school">School</option>
                <option value="other">Other</option>
              </select>

              {/* Importance Filter */}
              <select
                value={filterImportance}
                onChange={(e) => setFilterImportance(e.target.value)}
                className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 backdrop-blur-sm"
              >
                <option value="all">All Importance Levels</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            {/* Create Button */}
            <button
              onClick={handleCreateLocation}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center gap-2 shadow-soft"
            >
              <Plus className="h-4 w-4" />
              Add Location
            </button>
          </div>
        </div>

        {/* Locations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLocations.map((location) => (
            <div key={location.id} className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/50 shadow-soft overflow-hidden hover:shadow-lg transition-all duration-200 hover:scale-[1.02]">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <MapPin className="h-5 w-5 text-blue-600 mr-2" />
                    <h3 className="text-lg font-semibold text-gray-900">{location.name}</h3>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEditLocation(location)}
                      className="text-gray-400 hover:text-blue-600 transition-colors"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteLocation(location.id)}
                      className="text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <p className="text-sm text-gray-700 font-medium">{location.address}</p>
                    <p className="text-sm text-gray-600">{location.city}, {location.state} {location.zipCode}</p>
                  </div>

                  <div className="flex gap-2">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(location.category)}`}>
                      {location.category?.replace('-', ' ') || 'Unknown'}
                    </span>
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getImportanceColor(location.importance)}`}>
                      {location.importance}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 p-2 bg-green-50 rounded-lg">
                      <span className="text-green-600">🚗</span>
                      <span className="text-gray-700 capitalize">{location.parking} parking</span>
                    </div>
                    <div className="p-2 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-700 line-clamp-2">{location.notes}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredLocations.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📍</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {searchTerm || filterCategory !== 'all' || filterImportance !== 'all' 
                ? 'No locations match your filters' 
                : 'No locations yet'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || filterCategory !== 'all' || filterImportance !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Add your first location to get started'}
            </p>
            {!searchTerm && filterCategory === 'all' && filterImportance === 'all' && (
              <button
                onClick={handleCreateLocation}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 shadow-soft"
              >
                Add Your First Location
              </button>
            )}
          </div>
        )}
      </div>

      {/* Location Modal */}
      {isModalOpen && (
        <LocationModal
          location={selectedLocation}
          mode={modalMode}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveLocation}
        />
      )}
    </div>
  );
};

// Location Modal Component
interface LocationModalProps {
  location: Location | null;
  mode: 'create' | 'edit';
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<Location>) => void;
}

const LocationModal: React.FC<LocationModalProps> = ({ location, mode, isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState<Partial<Location>>({
    name: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    category: 'other',
    importance: 'medium',
    parking: 'free',
    notes: '',
    privateNotes: '',
    isActive: true
  });

  useEffect(() => {
    if (location && mode === 'edit') {
      setFormData(location);
    } else {
      setFormData({
        name: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        category: 'other',
        importance: 'medium',
        parking: 'free',
        notes: '',
        privateNotes: '',
        isActive: true
      });
    }
  }, [location, mode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {mode === 'create' ? 'Create New Location' : 'Edit Location'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Location Name *
              </label>
              <input
                type="text"
                id="name"
                required
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                Address *
              </label>
              <input
                type="text"
                id="address"
                required
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                  City *
                </label>
                <input
                  type="text"
                  id="city"
                  required
                  value={formData.city}
                  onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              
              <div>
                <label htmlFor="state" className="block text-sm font-medium text-gray-700">
                  State *
                </label>
                <input
                  type="text"
                  id="state"
                  required
                  value={formData.state}
                  onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              
              <div>
                <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700">
                  ZIP Code *
                </label>
                <input
                  type="text"
                  id="zipCode"
                  required
                  value={formData.zipCode}
                  onChange={(e) => setFormData(prev => ({ ...prev, zipCode: e.target.value }))}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                  Category
                </label>
                <select
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as Location['category'] }))}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="church">Church</option>
                  <option value="park">Park</option>
                  <option value="campground">Campground</option>
                  <option value="community-center">Community Center</option>
                  <option value="school">School</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="importance" className="block text-sm font-medium text-gray-700">
                  Importance
                </label>
                <select
                  id="importance"
                  value={formData.importance}
                  onChange={(e) => setFormData(prev => ({ ...prev, importance: e.target.value as Location['importance'] }))}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="parking" className="block text-sm font-medium text-gray-700">
                  Parking
                </label>
                <select
                  id="parking"
                  value={formData.parking}
                  onChange={(e) => setFormData(prev => ({ ...prev, parking: e.target.value as Location['parking'] }))}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="free">Free</option>
                  <option value="paid">Paid</option>
                  <option value="limited">Limited</option>
                  <option value="none">None</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                Public Notes
              </label>
              <textarea
                id="notes"
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Notes visible to all users..."
              />
            </div>

            <div>
              <label htmlFor="privateNotes" className="block text-sm font-medium text-gray-700">
                Private Notes (Admin Only)
              </label>
              <textarea
                id="privateNotes"
                rows={3}
                value={formData.privateNotes}
                onChange={(e) => setFormData(prev => ({ ...prev, privateNotes: e.target.value }))}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Notes visible only to admins..."
              />
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
                Location is active
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
                {mode === 'create' ? 'Create Location' : 'Update Location'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminLocations;
