import React, { useState, useEffect } from 'react';
import { useAdmin } from '../contexts/AdminContext';
import { MapPin, Edit, Trash2, Plus, Search, Filter, Map } from 'lucide-react';

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

  // Mock data for now - will be replaced with Firebase calls
  useEffect(() => {
    const mockLocations: Location[] = [
      {
        id: '1',
        name: 'St. Mark\'s Church',
        address: '123 Main Street',
        city: 'Peoria',
        state: 'IL',
        zipCode: '61614',
        coordinates: { lat: 40.7103, lng: -89.6144 },
        category: 'church',
        importance: 'high',
        parking: 'free',
        notes: 'Main meeting location for Pack 1703. Large parking lot available.',
        privateNotes: 'Contact: Father John - 555-0123. Gate code: 1234',
        isActive: true,
        createdAt: '2024-01-01T00:00:00',
        updatedAt: '2024-01-01T00:00:00'
      },
      {
        id: '2',
        name: 'Camp Wokanda',
        address: '456 Scout Road',
        city: 'Peoria',
        state: 'IL',
        zipCode: '61615',
        coordinates: { lat: 40.7200, lng: -89.6200 },
        category: 'campground',
        importance: 'high',
        parking: 'free',
        notes: 'Primary camping location with hiking trails and lake access.',
        privateNotes: 'Reservation contact: Camp Director - 555-0456. Check-in time: 2 PM',
        isActive: true,
        createdAt: '2024-01-15T00:00:00',
        updatedAt: '2024-01-15T00:00:00'
      },
      {
        id: '3',
        name: 'Peoria Riverfront',
        address: '789 River Drive',
        city: 'Peoria',
        state: 'IL',
        zipCode: '61602',
        coordinates: { lat: 40.7000, lng: -89.6000 },
        category: 'park',
        importance: 'medium',
        parking: 'paid',
        notes: 'Scenic location for community service projects and outdoor activities.',
        privateNotes: 'Parking validation available for groups. Contact: Parks Dept - 555-0789',
        isActive: true,
        createdAt: '2024-02-01T00:00:00',
        updatedAt: '2024-02-01T00:00:00'
      }
    ];
    setLocations(mockLocations);
    setLoading(false);
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

  const getCategoryColor = (category: string) => {
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
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Location Management</h1>
          <p className="text-gray-600 mt-2">Manage pack locations, venues, and meeting places</p>
        </div>
        <button
          onClick={handleCreateLocation}
          className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Location
        </button>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                id="search"
                placeholder="Search locations..."
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
              <option value="church">Church</option>
              <option value="park">Park</option>
              <option value="campground">Campground</option>
              <option value="community-center">Community Center</option>
              <option value="school">School</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label htmlFor="importance" className="block text-sm font-medium text-gray-700 mb-1">
              Importance
            </label>
            <select
              id="importance"
              value={filterImportance}
              onChange={(e) => setFilterImportance(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">All Importance Levels</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Locations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredLocations.map((location) => (
          <div key={location.id} className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <MapPin className="h-5 w-5 text-indigo-600 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900">{location.name}</h3>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEditLocation(location)}
                    className="text-gray-400 hover:text-indigo-600 transition-colors"
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
                <div>
                  <p className="text-sm text-gray-600">{location.address}</p>
                  <p className="text-sm text-gray-600">{location.city}, {location.state} {location.zipCode}</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(location.category)}`}>
                    {location.category.replace('-', ' ')}
                  </span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getImportanceColor(location.importance)}`}>
                    {location.importance}
                  </span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    {location.parking} parking
                  </span>
                </div>

                {location.notes && (
                  <p className="text-sm text-gray-700">{location.notes}</p>
                )}

                {location.coordinates && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Map className="h-4 w-4 mr-1" />
                    {location.coordinates.lat.toFixed(4)}, {location.coordinates.lng.toFixed(4)}
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Created: {new Date(location.createdAt).toLocaleDateString()}</span>
                  <span>Updated: {new Date(location.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredLocations.length === 0 && (
        <div className="text-center py-12">
          <MapPin className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No locations found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || filterCategory !== 'all' || filterImportance !== 'all' 
              ? 'Try adjusting your search or filters.'
              : 'Get started by creating your first location.'}
          </p>
        </div>
      )}

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
