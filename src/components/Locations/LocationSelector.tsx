import React, { useState, useEffect } from 'react';
import { Search, MapPin, Plus, ChevronDown } from 'lucide-react';
import { firestoreService } from '../../services/firestore';

interface Location {
  id: string;
  name: string;
  address: string;
  category: string;
  geo?: { lat: number; lng: number };
  notesPublic?: string;
  amenities?: string[];
  parking?: { text: string };
  isImportant?: boolean;
  contactInfo?: string;
  specialInstructions?: string;
}

interface LocationSelectorProps {
  selectedLocationId?: string;
  onLocationSelect: (location: Location | null) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const LocationSelector: React.FC<LocationSelectorProps> = ({
  selectedLocationId,
  onLocationSelect,
  placeholder = "Select a location...",
  className = "",
  disabled = false
}) => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);

  // Fetch locations on component mount
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        setLoading(true);
        const locationsData = await firestoreService.getLocations();
        setLocations(locationsData);
        
        // Set selected location if locationId is provided
        if (selectedLocationId) {
          const location = locationsData.find(loc => loc.id === selectedLocationId);
          if (location) {
            setSelectedLocation(location);
          }
        }
      } catch (error) {
        console.error('Error fetching locations:', error);
        setLocations([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLocations();
  }, [selectedLocationId]);

  // Filter locations based on search term
  const filteredLocations = locations.filter(location =>
    location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    location.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
    location.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleLocationClick = (location: Location) => {
    setSelectedLocation(location);
    onLocationSelect(location);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClearSelection = () => {
    setSelectedLocation(null);
    onLocationSelect(null);
    setIsOpen(false);
    setSearchTerm('');
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'park':
        return '🌳';
      case 'school':
        return '🏫';
      case 'church':
        return '⛪';
      case 'community center':
        return '🏢';
      case 'campground':
        return '🏕️';
      default:
        return '📍';
    }
  };

  if (loading) {
    return (
      <div className={`relative ${className}`}>
        <div className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Selected Location Display */}
      <div
        className={`w-full px-4 py-3 border border-gray-300 rounded-lg cursor-pointer bg-white hover:bg-gray-50 transition-colors ${
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        } ${isOpen ? 'ring-2 ring-primary-500 border-primary-500' : ''}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {selectedLocation ? (
              <>
                <span className="text-lg">
                  {getCategoryIcon(selectedLocation.category)}
                </span>
                <div>
                  <div className="font-medium text-gray-900">
                    {selectedLocation.name}
                  </div>
                  <div className="text-sm text-gray-500">
                    {selectedLocation.address}
                  </div>
                </div>
              </>
            ) : (
              <>
                <MapPin className="w-5 h-5 text-gray-400" />
                <span className="text-gray-500">{placeholder}</span>
              </>
            )}
          </div>
          <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-80 overflow-hidden">
          {/* Search Input */}
          <div className="p-3 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search locations..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                autoFocus
              />
            </div>
          </div>

          {/* Location List */}
          <div className="max-h-60 overflow-y-auto">
            {filteredLocations.length > 0 ? (
              filteredLocations.map((location) => (
                <div
                  key={location.id}
                  className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                  onClick={() => handleLocationClick(location)}
                >
                  <div className="flex items-start space-x-3">
                    <span className="text-lg mt-0.5">
                      {getCategoryIcon(location.category)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <div className="font-medium text-gray-900 truncate">
                          {location.name}
                        </div>
                        {location.isImportant && (
                          <span className="text-yellow-500">⭐</span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500 truncate">
                        {location.address}
                      </div>
                      {location.amenities && location.amenities.length > 0 && (
                        <div className="text-xs text-gray-400 mt-1">
                          {location.amenities.slice(0, 3).join(', ')}
                          {location.amenities.length > 3 && '...'}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-4 py-8 text-center text-gray-500">
                <MapPin className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p>No locations found</p>
                <p className="text-sm">Try adjusting your search terms</p>
              </div>
            )}
          </div>

          {/* Clear Selection */}
          {selectedLocation && (
            <div className="p-3 border-t border-gray-200">
              <button
                onClick={handleClearSelection}
                className="w-full px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors"
              >
                Clear Selection
              </button>
            </div>
          )}
        </div>
      )}

      {/* Overlay to close dropdown when clicking outside */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default LocationSelector;
