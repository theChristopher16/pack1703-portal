import React, { useState, useEffect } from 'react';
import { MapPin, Grid, Map } from 'lucide-react';
import { LocationCard, LocationMap, LocationFilters } from '../components/Locations';
import { Location } from '../types/firestore';

// Mock data for locations - will be replaced with Firebase calls
const mockLocations: Location[] = [
  {
    id: '1',
    name: 'St. Mark\'s Church',
    address: '123 Main Street',
    category: 'church',
    geo: { lat: 40.7103, lng: -89.6144 },
    notesPublic: 'Main meeting location for Pack 1703. Large parking lot available.',
    notesPrivate: 'Contact: Father John - 555-0123. Gate code: 1234',
    parking: { text: 'Free parking available' },
    isImportant: true,
    createdAt: new Date('2024-01-01T00:00:00') as any,
    updatedAt: new Date('2024-01-01T00:00:00') as any
  },
  {
    id: '2',
    name: 'Camp Wokanda',
    address: '456 Scout Road',
    category: 'campground',
    geo: { lat: 40.7200, lng: -89.6200 },
    notesPublic: 'Primary camping location with hiking trails and lake access.',
    notesPrivate: 'Reservation contact: Camp Director - 555-0456. Check-in time: 2 PM',
    parking: { text: 'Free parking available' },
    isImportant: true,
    createdAt: new Date('2024-01-15T00:00:00') as any,
    updatedAt: new Date('2024-01-15T00:00:00') as any
  },
  {
    id: '3',
    name: 'Peoria Riverfront',
    address: '789 River Drive',
    category: 'park',
    geo: { lat: 40.7000, lng: -89.6000 },
    notesPublic: 'Scenic location for community service projects and outdoor activities.',
    notesPrivate: 'Parking validation available for groups. Contact: Parks Dept - 555-0789',
    parking: { text: 'Paid parking available' },
    isImportant: false,
    createdAt: new Date('2024-02-01T00:00:00') as any,
    updatedAt: new Date('2024-02-01T00:00:00') as any
  }
];

const LocationsPage: React.FC = () => {
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [filteredLocations, setFilteredLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        setLoading(true);
        // TODO: Replace with actual Firebase call once database is populated
        // const locations = await firestoreService.getLocations();
        
        // For now, use mock data to prevent errors
        const locations = mockLocations;
        setFilteredLocations(locations);
      } catch (err) {
        console.warn('Firestore not available yet, using mock data:', err);
        // Fallback to mock data if Firestore fails
        setFilteredLocations(mockLocations);
      } finally {
        setLoading(false);
      }
    };

    fetchLocations();
    // Remove the polling interval for now since we're using mock data
    // const interval = setInterval(fetchLocations, 30000);
    // return () => clearInterval(interval);
  }, []); // No dependencies needed since mockLocations is constant

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

  const handleFiltersChange = (locations: Location[]) => {
    setFilteredLocations(locations);
    setSelectedLocation(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-primary-50/30 to-secondary-50/30 py-12 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-gray-600">Loading locations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-primary-50/30 to-secondary-50/30 py-12">
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
          
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Find meeting spots, adventure destinations, and community venues. 
            Each location is carefully selected to provide the best experience for our pack families.
          </p>
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
          locations={filteredLocations} 
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
                />
              </div>
            ))}
          </div>
        ) : (
          <LocationMap 
            locations={filteredLocations}
            onLocationSelect={handleLocationSelect}
            selectedLocation={selectedLocation}
          />
        )}
      </div>
    </div>
  );
};

export default LocationsPage;
