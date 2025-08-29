import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Phone, Mail, Clock, Star, Filter, Grid, Map } from 'lucide-react';
import { firestoreService } from '../services/firestore';
import { LocationCard, LocationMap, LocationFilters } from '../components/Locations';
import { Location } from '../types/firestore';

const LocationsPage: React.FC = () => {
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [filteredLocations, setFilteredLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        setLoading(true);
        const locations = await firestoreService.getLocations();
        setFilteredLocations(locations);
      } catch (err) {
        setError('Failed to fetch locations.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchLocations();
    const interval = setInterval(fetchLocations, 30000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, []);

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

  if (loading && !error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-primary-50/30 to-secondary-50/30 py-12 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-gray-600">Loading locations...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-primary-50/30 to-secondary-50/30 py-12 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-gray-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-6 py-3 rounded-xl font-medium transition-all duration-200 bg-primary-500 text-white hover:bg-primary-600"
          >
            Retry
          </button>
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
            <span className="text-gradient">Pack 1703</span> Locations
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
                  ? 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white shadow-glow-primary/50'
                  : 'text-gray-600 hover:text-primary-600 hover:bg-primary-50/50'
              }`}
            >
              <Grid className="w-4 h-4 inline mr-2" />
              Grid View
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                viewMode === 'map'
                  ? 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white shadow-glow-primary/50'
                  : 'text-gray-600 hover:text-primary-600 hover:bg-primary-50/50'
              }`}
            >
              <Map className="w-4 h-4 inline mr-2" />
              Map View
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-8">
          <LocationFilters
            locations={filteredLocations}
            onFiltersChange={handleFiltersChange}
          />
        </div>

        {/* Content */}
        {viewMode === 'grid' ? (
          /* Grid View */
          <div className="space-y-8">
            {/* Important Locations */}
            {filteredLocations.filter(loc => loc.isImportant).length > 0 && (
              <div>
                <h2 className="text-2xl font-display font-semibold text-gray-900 mb-6 flex items-center">
                  <Star className="w-6 h-6 text-primary-500 mr-3" />
                  Important Locations
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredLocations
                    .filter(loc => loc.isImportant)
                    .map((location) => (
                      <div key={location.id} id={`location-${location.id}`}>
                        <LocationCard
                          location={location}
                          onLocationClick={handleLocationSelect}
                        />
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* All Other Locations */}
            <div>
              <h2 className="text-2xl font-display font-semibold text-gray-900 mb-6 flex items-center">
                <MapPin className="w-6 h-6 text-secondary-500 mr-3" />
                All Locations
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredLocations
                  .filter(loc => !loc.isImportant)
                  .map((location) => (
                    <div key={location.id} id={`location-${location.id}`}>
                      <LocationCard
                        location={location}
                        onLocationClick={handleLocationSelect}
                      />
                    </div>
                  ))}
              </div>
            </div>

            {/* No Results */}
            {filteredLocations.length === 0 && (
              <div className="text-center py-12">
                <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-500 mb-2">No locations found</h3>
                <p className="text-gray-400">Try adjusting your filters or search terms.</p>
              </div>
            )}
          </div>
        ) : (
          /* Map View */
          <div className="space-y-6">
            <LocationMap
              locations={filteredLocations}
              selectedLocation={selectedLocation}
              onLocationSelect={handleLocationSelect}
              height="600px"
              showControls={true}
            />
            
            {/* Selected Location Details */}
            {selectedLocation && (
              <div className="animate-slide-up">
                <LocationCard
                  location={selectedLocation}
                  onLocationClick={handleLocationSelect}
                />
              </div>
            )}
          </div>
        )}

        {/* Quick Stats */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center p-6 bg-white/90 backdrop-blur-sm rounded-2xl border border-white/50">
            <MapPin className="w-8 h-8 text-primary-500 mx-auto mb-3" />
            <div className="text-2xl font-bold text-gray-900">{filteredLocations.length}</div>
            <div className="text-sm text-gray-600">Total Locations</div>
          </div>
          
          <div className="text-center p-6 bg-white/90 backdrop-blur-sm rounded-2xl border border-white/50">
            <Star className="w-8 h-8 text-primary-500 mx-auto mb-3" />
            <div className="text-2xl font-bold text-gray-900">
              {filteredLocations.filter(loc => loc.isImportant).length}
            </div>
            <div className="text-sm text-gray-600">Important Locations</div>
          </div>
          
          <div className="text-center p-6 bg-white/90 backdrop-blur-sm rounded-2xl border border-white/50">
            <Navigation className="w-8 h-8 text-secondary-500 mx-auto mb-3" />
            <div className="text-2xl font-bold text-gray-900">
              {filteredLocations.filter(loc => loc.parking).length}
            </div>
            <div className="text-sm text-gray-600">With Parking</div>
          </div>
          
          <div className="text-center p-6 bg-white/90 backdrop-blur-sm rounded-2xl border border-white/50">
            <Clock className="w-8 h-8 text-accent-500 mx-auto mb-3" />
            <div className="text-2xl font-bold text-gray-900">
              {filteredLocations.filter(loc => loc.geo?.lat && loc.geo?.lng).length}
            </div>
            <div className="text-sm text-gray-600">On Map</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationsPage;
