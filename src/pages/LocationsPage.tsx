import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { MapPin, Grid, Map, Plus } from 'lucide-react';
import { LocationCard, LocationFilters } from '../components/Locations';
import { Location } from '../types/firestore';
import { FilterState } from '../components/Locations/LocationFilters';

import { firestoreService } from '../services/firestore';
import { Timestamp } from 'firebase/firestore';
import LocationCreateModal from '../components/Locations/LocationCreateModal';
import LocationEditModal from '../components/Locations/LocationEditModal';
import AppleLocationMap from '../components/Locations/AppleLocationMap';
import { useAdmin } from '../contexts/AdminContext';
import { offlineCacheService } from '../services/offlineCacheService';

const LocationsPage: React.FC = () => {
  const { state: adminState, hasRole } = useAdmin();
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    category: '',
    showImportantOnly: false,
    hasParking: false,
    hasGeoData: false
  });
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [locationToEdit, setLocationToEdit] = useState<Location | null>(null);
  // Apple Maps only - no need for mapProvider state
  const [locationToAdd, setLocationToAdd] = useState<{lat: number; lng: number} | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [cacheStatus, setCacheStatus] = useState<string>('');

  // Check if user can manage locations (den leaders and above, NOT parents)
  const canManageLocations = hasRole('moderator') || 
                             hasRole('content-admin') || 
                             hasRole('super-admin');

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        setLoading(true);
        
        // Check cache first
        const cachedLocations = offlineCacheService.getCachedLocations();
        if (cachedLocations && cachedLocations.length > 0) {
          console.log('📍 Loading locations from cache...', cachedLocations.length);
          setLocations(cachedLocations);
          setCacheStatus('Using cached data');
        }

        // Try to fetch fresh data if online
        if (isOnline) {
          console.log('Fetching fresh locations...');
          const locs = await firestoreService.getLocations();
          console.log('Locations fetched:', locs.length);
          
          // Update locations and cache
          setLocations(locs);
          offlineCacheService.cacheLocations(locs);
          setCacheStatus('Data updated from server');
        } else if (!cachedLocations) {
          setCacheStatus('No cached data available');
        }
      } catch (err) {
        console.error('Error fetching locations:', err);
        if (!isOnline) {
          setCacheStatus('Offline - using cached data');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchLocations();
  }, [isOnline]);

  // Listen for online/offline status changes
  useEffect(() => {
    const cleanup = offlineCacheService.onOnlineStatusChange((online) => {
      setIsOnline(online);
      if (online) {
        // Refresh data when coming back online
        const fetchLocations = async () => {
          try {
            const locs = await firestoreService.getLocations();
            setLocations(locs);
            offlineCacheService.cacheLocations(locs);
            setCacheStatus('Data synced with server');
          } catch (err) {
            console.error('Error syncing locations:', err);
          }
        };
        fetchLocations();
      } else {
        setCacheStatus('Offline mode');
      }
    });

    return cleanup;
  }, []);

  // Apply filters to locations
  const filteredLocations = useMemo(() => {
    return locations.filter(location => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch = 
          location.name.toLowerCase().includes(searchLower) ||
          location.address.toLowerCase().includes(searchLower) ||
          (location.notesPublic && location.notesPublic.toLowerCase().includes(searchLower));
        
        if (!matchesSearch) return false;
      }

      // Category filter
      if (filters.category && location.category !== filters.category) {
        return false;
      }

      // Important locations only
      if (filters.showImportantOnly && !location.isImportant) {
        return false;
      }

      // Has parking
      if (filters.hasParking && !location.parking) {
        return false;
      }

      // Has geo data
      if (filters.hasGeoData && (!location.geo?.lat || !location.geo?.lng)) {
        return false;
      }

      return true;
    });
  }, [locations, filters]);

  const handleLocationSelect = (location: Location) => {
    setSelectedLocation(location);
    if (viewMode === 'grid') {
      // Scroll to the location card
      const element = document.getElementById(`location-${location.id}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  const handleFiltersChange = useCallback((newFilters: FilterState) => {
    setFilters(newFilters);
    setSelectedLocation(null);
  }, []);

  const handleLocationAdd = (lat: number, lng: number) => {
    setLocationToAdd({ lat, lng });
    setIsModalOpen(true);
  };

  const handleCreateLocation = async (locationData: Omit<Location, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      // Create location in Firestore
      const newLocation = await firestoreService.createLocation(locationData);
      
      // Update local state
      setLocations(prev => [...prev, newLocation]);
      setIsModalOpen(false);
      setLocationToAdd(null);
      console.log('✅ Location created successfully:', newLocation);
    } catch (error) {
      console.error('❌ Failed to create location:', error);
      alert('Failed to create location. Please try again.');
    }
  };

  const handleEditLocation = (location: Location) => {
    setLocationToEdit(location);
    setIsEditModalOpen(true);
  };

  const handleSaveLocation = async (updatedData: Partial<Location>) => {
    if (locationToEdit) {
      try {
        // Update in Firestore if it's a real location (not sample data)
        if (!locationToEdit.id.startsWith('sample-')) {
          await firestoreService.updateLocation(locationToEdit.id, updatedData);
        }
        
        const updatedLocation: Location = {
          ...locationToEdit,
          ...updatedData,
          updatedAt: Timestamp.now()
        };
        
        // Update local state
        setLocations(prev => 
          prev.map(loc => loc.id === locationToEdit.id ? updatedLocation : loc)
        );
        
        // If this was the selected location, update it too
        if (selectedLocation?.id === locationToEdit.id) {
          setSelectedLocation(updatedLocation);
        }
        
        setIsEditModalOpen(false);
        setLocationToEdit(null);
        console.log('✅ Location updated successfully');
      } catch (error) {
        console.error('❌ Failed to update location:', error);
        alert('Failed to update location. Please try again.');
      }
    }
  };

  const handleDeleteLocation = async (location: Location) => {
    try {
      console.log('🗑️ Attempting to delete location:', location.name, 'ID:', location.id);
      
      // Delete from Firestore if it's a real location (not sample data)
      if (!location.id.startsWith('sample-')) {
        console.log('🗑️ Deleting from Firestore...');
        await firestoreService.deleteLocation(location.id);
        console.log('🗑️ Firestore delete completed');
      } else {
        console.log('🗑️ Skipping Firestore delete (sample data)');
      }
      
      // Update local state
      setLocations(prev => 
        prev.filter(loc => loc.id !== location.id)
      );
      
      // If this was the selected location, clear it
      if (selectedLocation?.id === location.id) {
        setSelectedLocation(null);
      }
      
      // Close edit modal if it was open for this location
      if (locationToEdit?.id === location.id) {
        setIsEditModalOpen(false);
        setLocationToEdit(null);
      }
      
      console.log('✅ Location deleted successfully:', location.name);
    } catch (error) {
      console.error('❌ Failed to delete location:', error);
      alert('Failed to delete location. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-primary-50/30 to-secondary-50/30 py-12 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Loading locations...</p>
        </div>
      </div>
    );
  }

  if (filteredLocations.length === 0) {
    return (
      <>
        <div className="min-h-screen bg-gradient-to-br from-white via-primary-50/30 to-secondary-50/30 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-primary-100 to-secondary-100 text-primary-700 rounded-full text-sm font-medium mb-6">
                <MapPin className="w-4 h-4 mr-2" />
                No Locations Available
              </div>
              
              <h1 className="text-4xl md:text-6xl font-display font-bold mb-6 text-gray-900">
                <span className="text-gradient">Scout Pack</span> Locations
              </h1>
              
              <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed mb-8">
                {canManageLocations 
                  ? "Add the first location to get started! Create meeting spots, adventure destinations, and community venues."
                  : "We're working on adding locations to our map. Check back soon for meeting spots, adventure destinations, and community venues."
                }
              </p>
              
              {/* Add Location Button for Den Leaders and Above */}
              {canManageLocations && (
                <div className="mb-8">
                  <button
                    onClick={() => {
                      console.log('🔘 Add First Location button clicked');
                      console.log('🔘 isModalOpen before:', isModalOpen);
                      setIsModalOpen(true);
                      console.log('🔘 setIsModalOpen(true) called');
                    }}
                    className="flex items-center px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors mx-auto"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Add First Location
                  </button>
                </div>
              )}
              
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 border border-white/50 shadow-soft max-w-md mx-auto">
                <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">
                  {canManageLocations ? "Ready to Add Locations" : "Coming Soon"}
                </h3>
                <p className="text-gray-500">
                  {canManageLocations 
                    ? "Click the button above to add your first location"
                    : "Location data will be available shortly"
                  }
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Location Creation Modal */}
        <LocationCreateModal
          isOpen={isModalOpen}
          onClose={() => {
            console.log('🔘 Modal onClose called');
            setIsModalOpen(false);
            setLocationToAdd(null);
          }}
          onSubmit={handleCreateLocation}
          initialLat={locationToAdd?.lat}
          initialLng={locationToAdd?.lng}
        />

        <LocationEditModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setLocationToEdit(null);
          }}
          onSave={handleSaveLocation}
          onDelete={() => {
            if (locationToEdit) {
              handleDeleteLocation(locationToEdit);
            }
          }}
          location={locationToEdit}
        />
      </>
    );
  }


  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-primary-50/30 to-secondary-50/30 pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-primary-100 to-secondary-100 text-primary-700 rounded-full text-sm font-medium mb-6">
            <MapPin className="w-4 h-4 mr-2" />
            Discover Our Locations
          </div>
          
          <h1 className="text-4xl md:text-6xl font-display font-bold mb-6 text-gray-900">
            <span className="text-gradient">Scout Pack</span> Locations
          </h1>
          
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed mb-8">
            Find meeting spots, adventure destinations, and community venues. 
            Each location is carefully selected to provide the best experience for our pack families.
          </p>

          {/* Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            {/* Add Location Button - Den Leaders and Above Only */}
            {canManageLocations && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Location
              </button>
            )}
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex justify-center mb-8">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-1 shadow-soft border border-white/50">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                viewMode === 'grid'
                  ? 'bg-primary-500 text-white shadow-lg'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Grid className="w-4 h-4 mr-2 inline" />
              Grid View
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                viewMode === 'map'
                  ? 'bg-primary-500 text-white shadow-lg'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Map className="w-4 h-4 mr-2 inline" />
              Map View
            </button>
          </div>
        </div>

        {/* Filters */}
        <LocationFilters 
          locations={locations} 
          onFiltersChange={handleFiltersChange}
          className="mb-8"
        />

        {/* Content */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLocations.map((location) => (
              <div key={location.id} id={`location-${location.id}`}>
                <LocationCard
                  location={location}
                  onLocationClick={handleLocationSelect}
                  onEdit={canManageLocations ? handleEditLocation : undefined}
                  onDelete={canManageLocations ? handleDeleteLocation : undefined}
                  showEditControls={canManageLocations}
                />
              </div>
            ))}
          </div>
        ) : (
        <AppleLocationMap
          locations={filteredLocations}
          onLocationSelect={handleLocationSelect}
          selectedLocation={selectedLocation}
          onLocationAdd={canManageLocations ? handleLocationAdd : undefined}
          onLocationEdit={canManageLocations ? handleEditLocation : undefined}
          onLocationDelete={canManageLocations ? handleDeleteLocation : undefined}
          height="600px"
        />
        )}
      </div>

      {/* Location Creation Modal */}
      <LocationCreateModal
        isOpen={isModalOpen}
        onClose={() => {
          console.log('🔘 Modal onClose called');
          setIsModalOpen(false);
          setLocationToAdd(null);
        }}
        onSubmit={handleCreateLocation}
        initialLat={locationToAdd?.lat}
        initialLng={locationToAdd?.lng}
      />

      <LocationEditModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setLocationToEdit(null);
        }}
        onSave={handleSaveLocation}
        onDelete={() => {
          if (locationToEdit) {
            handleDeleteLocation(locationToEdit);
          }
        }}
        location={locationToEdit}
      />
    </div>
  );
};

export default LocationsPage;
