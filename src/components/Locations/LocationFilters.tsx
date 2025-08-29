import React, { useState, useMemo } from 'react';
import { Search, Filter, MapPin, Star, X } from 'lucide-react';
import { Location, LocationCategory } from '../../types/firestore';

interface LocationFiltersProps {
  locations: Location[];
  onFiltersChange: (filteredLocations: Location[]) => void;
  className?: string;
}

interface FilterState {
  search: string;
  category: string;
  showImportantOnly: boolean;
  hasParking: boolean;
  hasGeoData: boolean;
}

const LocationFilters: React.FC<LocationFiltersProps> = ({
  locations,
  onFiltersChange,
  className = ''
}) => {
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    category: '',
    showImportantOnly: false,
    hasParking: false,
    hasGeoData: false
  });

  const [isExpanded, setIsExpanded] = useState(false);

  // Get unique categories from locations
  const categories = useMemo(() => {
    const uniqueCategories = Array.from(new Set(
      locations
        .map(location => location.category)
        .filter((category): category is LocationCategory => Boolean(category))
    )).sort();
    return uniqueCategories;
  }, [locations]);

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

  // Update parent component when filters change
  React.useEffect(() => {
    onFiltersChange(filteredLocations);
  }, [filteredLocations, onFiltersChange]);

  const handleFilterChange = (key: keyof FilterState, value: string | boolean) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      category: '',
      showImportantOnly: false,
      hasParking: false,
      hasGeoData: false
    });
  };

  const hasActiveFilters = Object.values(filters).some(value => 
    value !== '' && value !== false
  );

  return (
    <div className={`bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-soft ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-display font-semibold text-gray-900">
          Filter Locations
        </h3>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center space-x-2 px-3 py-2 text-primary-600 hover:bg-primary-50 rounded-xl transition-colors duration-200"
        >
          <Filter className="w-4 h-4" />
          <span className="text-sm font-medium">
            {isExpanded ? 'Hide' : 'Show'} Filters
          </span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search locations by name, address, or notes..."
          value={filters.search}
          onChange={(e) => handleFilterChange('search', e.target.value)}
          className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl bg-white text-gray-900 placeholder-gray-400 focus:border-primary-400 focus:ring-4 focus:ring-primary-100 transition-all duration-300"
        />
        {filters.search && (
          <button
            onClick={() => handleFilterChange('search', '')}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 hover:text-gray-600 transition-colors duration-200"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Expanded Filters */}
      {isExpanded && (
        <div className="space-y-6 animate-slide-down">
          {/* Category Filter */}
          {categories.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-3">
                Location Category
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <button
                  onClick={() => handleFilterChange('category', '')}
                  className={`px-3 py-2 text-sm font-medium rounded-lg border transition-all duration-200 ${
                    filters.category === ''
                      ? 'bg-primary-500 text-white border-primary-500'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-primary-300 hover:text-primary-600'
                  }`}
                >
                  All Categories
                </button>
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => handleFilterChange('category', category)}
                    className={`px-3 py-2 text-sm font-medium rounded-lg border transition-all duration-200 ${
                      filters.category === category
                        ? 'bg-primary-500 text-white border-primary-500'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-primary-300 hover:text-primary-600'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Boolean Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Important Locations */}
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.showImportantOnly}
                onChange={(e) => handleFilterChange('showImportantOnly', e.target.checked)}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500 focus:ring-2"
              />
              <div className="flex items-center space-x-2">
                <Star className="w-4 h-4 text-primary-500" />
                <span className="text-sm font-medium text-gray-900">Important Only</span>
              </div>
            </label>

            {/* Has Parking */}
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.hasParking}
                onChange={(e) => handleFilterChange('hasParking', e.target.checked)}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500 focus:ring-2"
              />
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-secondary-500" />
                <span className="text-sm font-medium text-gray-900">Has Parking</span>
              </div>
            </label>

            {/* Has Geo Data */}
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.hasGeoData}
                onChange={(e) => handleFilterChange('hasGeoData', e.target.checked)}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500 focus:ring-2"
              />
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-accent-500" />
                <span className="text-sm font-medium text-gray-900">On Map</span>
              </div>
            </label>
          </div>
        </div>
      )}

      {/* Results Summary */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="text-sm text-gray-600">
          Showing <span className="font-semibold text-gray-900">{filteredLocations.length}</span> of{' '}
          <span className="font-semibold text-gray-900">{locations.length}</span> locations
        </div>
        
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-all duration-200"
          >
            <X className="w-4 h-4" />
            <span>Clear Filters</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default LocationFilters;
