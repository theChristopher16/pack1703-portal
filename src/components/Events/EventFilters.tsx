import React, { useState, useEffect } from 'react';
import { Filter, X, Search, MapPin } from 'lucide-react';

interface EventFiltersProps {
  onFiltersChange: (filters: EventFiltersData) => void;
  className?: string;
}

export interface EventFiltersData {
  search: string;
  categories: string[];
  denTags: string[];
  dateRange: {
    start: string;
    end: string;
  };
  location: string;
  capacity: {
    min: number;
    max: number;
  };
  timeOfDay: string[];
  isOvernight: boolean | null;
  requiresPermission: boolean | null;
}

const EventFilters: React.FC<EventFiltersProps> = ({ onFiltersChange, className = '' }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [filters, setFilters] = useState<EventFiltersData>({
    search: '',
    categories: [],
    denTags: [],
    dateRange: {
      start: '',
      end: ''
    },
    location: '',
    capacity: {
      min: 0,
      max: 100
    },
    timeOfDay: [],
    isOvernight: null,
    requiresPermission: null
  });

  const [activeFilterCount, setActiveFilterCount] = useState(0);

  // Calculate active filter count
  useEffect(() => {
    let count = 0;
    if (filters.search) count++;
    if (filters.categories.length > 0) count++;
    if (filters.denTags.length > 0) count++;
    if (filters.dateRange.start || filters.dateRange.end) count++;
    if (filters.location) count++;
    if (filters.capacity.min > 0 || filters.capacity.max < 100) count++;
    if (filters.timeOfDay.length > 0) count++;
    if (filters.isOvernight !== null) count++;
    if (filters.requiresPermission !== null) count++;
    
    setActiveFilterCount(count);
  }, [filters]);

  // Notify parent of filter changes
  useEffect(() => {
    onFiltersChange(filters);
  }, [filters, onFiltersChange]);

  const handleFilterChange = (key: keyof EventFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleCategoryToggle = (category: string) => {
    setFilters(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
    }));
  };

  const handleDenToggle = (den: string) => {
    setFilters(prev => ({
      ...prev,
      denTags: prev.denTags.includes(den)
        ? prev.denTags.filter(d => d !== den)
        : [...prev.denTags, den]
    }));
  };

  const handleTimeOfDayToggle = (time: string) => {
    setFilters(prev => ({
      ...prev,
      timeOfDay: prev.timeOfDay.includes(time)
        ? prev.timeOfDay.filter(t => t !== time)
        : [...prev.timeOfDay, time]
    }));
  };

  const clearAllFilters = () => {
    setFilters({
      search: '',
      categories: [],
      denTags: [],
      dateRange: {
        start: '',
        end: ''
      },
      location: '',
      capacity: {
        min: 0,
        max: 100
      },
      timeOfDay: [],
      isOvernight: null,
      requiresPermission: null
    });
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'pack-wide': return 'Pack-Wide';
      case 'den': return 'Den Event';
      case 'camping': return 'Camping';
      case 'overnight': return 'Overnight';
      case 'service': return 'Service';
      default: return category;
    }
  };

  const getTimeOfDayLabel = (time: string) => {
    switch (time) {
      case 'morning': return 'Morning (6AM-12PM)';
      case 'afternoon': return 'Afternoon (12PM-6PM)';
      case 'evening': return 'Evening (6PM-12AM)';
      case 'overnight': return 'Overnight (12AM-6AM)';
      default: return time;
    }
  };

  return (
    <div className={`bg-white/90 backdrop-blur-sm rounded-2xl shadow-soft border border-white/50 ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-primary-500" />
            <h3 className="text-lg font-semibold text-gray-900">Event Filters</h3>
            {activeFilterCount > 0 && (
              <span className="px-2 py-1 bg-primary-100 text-primary-700 text-xs font-medium rounded-full">
                {activeFilterCount} active
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            {activeFilterCount > 0 && (
              <button
                onClick={clearAllFilters}
                className="text-sm text-gray-500 hover:text-gray-700 underline"
              >
                Clear All
              </button>
            )}
            
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
            >
              {isExpanded ? <X className="w-4 h-4" /> : <Filter className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-4 border-b border-gray-100">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search events..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors duration-200"
          />
        </div>
      </div>

      {/* Expanded Filters */}
      {isExpanded && (
        <div className="p-4 space-y-6">
          {/* Categories */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Event Categories</h4>
            <div className="grid grid-cols-2 gap-2">
              {(['pack-wide', 'den', 'camping', 'overnight', 'service'] as const).map((category) => (
                <label key={category} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.categories.includes(category)}
                    onChange={() => handleCategoryToggle(category)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700">{getCategoryLabel(category)}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Den Tags */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Den Tags</h4>
            <div className="grid grid-cols-2 gap-2">
              {['Lions', 'Tigers', 'Wolves', 'Bears', 'Webelos', 'AOL'].map((den) => (
                <label key={den} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.denTags.includes(den)}
                    onChange={() => handleDenToggle(den)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700">{den}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Date Range */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Date Range</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">From</label>
                <input
                  type="date"
                  value={filters.dateRange.start}
                  onChange={(e) => handleFilterChange('dateRange', { ...filters.dateRange, start: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors duration-200"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">To</label>
                <input
                  type="date"
                  value={filters.dateRange.end}
                  onChange={(e) => handleFilterChange('dateRange', { ...filters.dateRange, end: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors duration-200"
                />
              </div>
            </div>
          </div>

          {/* Location */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Location</h4>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search locations..."
                value={filters.location}
                onChange={(e) => handleFilterChange('location', e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors duration-200"
              />
            </div>
          </div>

          {/* Capacity Range */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Capacity Range</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Min</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={filters.capacity.min}
                  onChange={(e) => handleFilterChange('capacity', { ...filters.capacity, min: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors duration-200"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Max</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={filters.capacity.max}
                  onChange={(e) => handleFilterChange('capacity', { ...filters.capacity, max: parseInt(e.target.value) || 100 })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors duration-200"
                />
              </div>
            </div>
          </div>

          {/* Time of Day */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Time of Day</h4>
            <div className="grid grid-cols-2 gap-2">
              {(['morning', 'afternoon', 'evening', 'overnight'] as const).map((time) => (
                <label key={time} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.timeOfDay.includes(time)}
                    onChange={() => handleTimeOfDayToggle(time)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700">{getTimeOfDayLabel(time)}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Special Requirements */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Special Requirements</h4>
            <div className="space-y-3">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="overnight"
                  checked={filters.isOvernight === true}
                  onChange={() => handleFilterChange('isOvernight', true)}
                  className="border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">Overnight events only</span>
              </label>
              
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="overnight"
                  checked={filters.isOvernight === false}
                  onChange={() => handleFilterChange('isOvernight', false)}
                  className="border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">Day events only</span>
              </label>
              
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="overnight"
                  checked={filters.isOvernight === null}
                  onChange={() => handleFilterChange('isOvernight', null)}
                  className="border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">All events</span>
              </label>
            </div>

            <div className="mt-4 space-y-3">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="permission"
                  checked={filters.requiresPermission === true}
                  onChange={() => handleFilterChange('requiresPermission', true)}
                  className="border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">Permission required only</span>
              </label>
              
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="permission"
                  checked={filters.requiresPermission === false}
                  onChange={() => handleFilterChange('requiresPermission', false)}
                  className="border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">No permission required</span>
              </label>
              
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="permission"
                  checked={filters.requiresPermission === null}
                  onChange={() => handleFilterChange('requiresPermission', null)}
                  className="border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">All events</span>
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventFilters;
