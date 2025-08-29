import React, { useState, useEffect, useRef } from 'react';
import { Calendar, Filter, Download, Share2 } from 'lucide-react';

interface Event {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  location: {
    name: string;
    address: string;
    coordinates?: { lat: number; lng: number };
  };
  category: 'pack-wide' | 'den' | 'camping' | 'overnight' | 'service';
  denTags: string[];
  maxCapacity: number;
  currentRSVPs: number;
  description: string;
  isOvernight: boolean;
  requiresPermission: boolean;
}

interface EventCalendarProps {
  events: Event[];
  onEventClick: (eventId: string) => void;
  onDateSelect: (date: Date) => void;
  onViewChange: (view: string) => void;
}

const EventCalendar: React.FC<EventCalendarProps> = ({ 
  events, 
  onEventClick, 
  onDateSelect, 
  onViewChange 
}) => {
  const [currentView, setCurrentView] = useState<'month' | 'week' | 'day' | 'list'>('month');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedDens, setSelectedDens] = useState<string[]>([]);
  const [showOvernight, setShowOvernight] = useState(true);
  const [showPermissionRequired, setShowPermissionRequired] = useState(true);
  
  const calendarRef = useRef<HTMLDivElement>(null);

  // Mock calendar data for now - in production this would use FullCalendar
  const [filteredEvents, setFilteredEvents] = useState<Event[]>(events);

  useEffect(() => {
    // Filter events based on selected criteria
    let filtered = events;
    
    if (selectedCategories.length > 0) {
      filtered = filtered.filter(event => selectedCategories.includes(event.category));
    }
    
    if (selectedDens.length > 0) {
      filtered = filtered.filter(event => 
        event.denTags.some(tag => selectedDens.includes(tag))
      );
    }
    
    if (!showOvernight) {
      filtered = filtered.filter(event => !event.isOvernight);
    }
    
    if (!showPermissionRequired) {
      filtered = filtered.filter(event => !event.requiresPermission);
    }
    
    setFilteredEvents(filtered);
  }, [events, selectedCategories, selectedDens, showOvernight, showPermissionRequired]);

  const handleViewChange = (view: 'month' | 'week' | 'day' | 'list') => {
    setCurrentView(view);
    onViewChange(view);
  };

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const handleDenToggle = (den: string) => {
    setSelectedDens(prev => 
      prev.includes(den) 
        ? prev.filter(d => d !== den)
        : [...prev, den]
    );
  };

  const generateICSFeed = () => {
    // Generate ICS feed URL with current filters
    const params = new URLSearchParams();
    if (selectedCategories.length > 0) {
      params.append('categories', selectedCategories.join(','));
    }
    if (selectedDens.length > 0) {
      params.append('dens', selectedDens.join(','));
    }
    
    const url = `/api/ics-feed?${params.toString()}`;
    window.open(url, '_blank');
  };

  const shareCalendar = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Pack 1703 Events Calendar',
          text: 'Check out our upcoming events!',
          url: window.location.href
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Calendar URL copied to clipboard!');
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'camping': return 'bg-orange-500';
      case 'overnight': return 'bg-purple-500';
      case 'service': return 'bg-green-500';
      case 'den': return 'bg-blue-500';
      default: return 'bg-primary-500';
    }
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

  // Mock calendar view - in production this would render FullCalendar
  const renderCalendarView = () => {
    if (currentView === 'list') {
      return (
        <div className="space-y-4">
          {filteredEvents.map((event) => (
            <div 
              key={event.id}
              className="p-4 bg-white rounded-lg border border-gray-200 hover:border-primary-300 transition-colors duration-200 cursor-pointer"
              onClick={() => onEventClick(event.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${getCategoryColor(event.category)}`}></div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{event.title}</h3>
                    <p className="text-sm text-gray-600">
                      {new Date(event.date).toLocaleDateString()} • {event.location.name}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600">
                    {event.currentRSVPs} / {event.maxCapacity}
                  </div>
                  <div className="text-xs text-gray-500">
                    {getCategoryLabel(event.category)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    // Mock month view
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="text-center text-gray-500 mb-8">
          <p className="text-lg font-semibold">Calendar View</p>
          <p className="text-sm">FullCalendar integration would render here</p>
          <p className="text-xs mt-2">
            Current view: {currentView} | Events: {filteredEvents.length}
          </p>
        </div>
        
        {/* Mock calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="p-2 text-center text-sm font-medium text-gray-500 bg-gray-50 rounded">
              {day}
            </div>
          ))}
          {Array.from({ length: 35 }, (_, i) => (
            <div key={i} className="p-2 text-center text-sm text-gray-400 border border-gray-100 min-h-[60px]">
              {i + 1}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-display font-bold text-gray-900">Events Calendar</h2>
          
          {/* View Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            {(['month', 'week', 'day', 'list'] as const).map((view) => (
              <button
                key={view}
                onClick={() => handleViewChange(view)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors duration-200 ${
                  currentView === view
                    ? 'bg-white text-primary-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {view.charAt(0).toUpperCase() + view.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 rounded-lg border transition-colors duration-200 ${
              showFilters
                ? 'bg-primary-500 text-white border-primary-500'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            <Filter className="w-4 h-4 inline mr-2" />
            Filters
          </button>
          
          <button
            onClick={generateICSFeed}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
          >
            <Download className="w-4 h-4 inline mr-2" />
            ICS Feed
          </button>
          
          <button
            onClick={shareCalendar}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
          >
            <Share2 className="w-4 h-4 inline mr-2" />
            Share
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Filter Events</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Category Filters */}
            <div>
              <h4 className="font-medium text-gray-700 mb-3">Event Categories</h4>
              <div className="space-y-2">
                {(['pack-wide', 'den', 'camping', 'overnight', 'service'] as const).map((category) => (
                  <label key={category} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(category)}
                      onChange={() => handleCategoryToggle(category)}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700">{getCategoryLabel(category)}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Den Filters */}
            <div>
              <h4 className="font-medium text-gray-700 mb-3">Den Tags</h4>
              <div className="space-y-2">
                {['Lions', 'Tigers', 'Wolves', 'Bears', 'Webelos', 'AOL'].map((den) => (
                  <label key={den} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedDens.includes(den)}
                      onChange={() => handleDenToggle(den)}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700">{den}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Special Filters */}
            <div>
              <h4 className="font-medium text-gray-700 mb-3">Special Requirements</h4>
              <div className="space-y-2">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showOvernight}
                    onChange={(e) => setShowOvernight(e.target.checked)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700">Show Overnight Events</span>
                </label>
                
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showPermissionRequired}
                    onChange={(e) => setShowPermissionRequired(e.target.checked)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700">Show Permission Required</span>
                </label>
              </div>
            </div>

            {/* Active Filters Summary */}
            <div>
              <h4 className="font-medium text-gray-700 mb-3">Active Filters</h4>
              <div className="text-sm text-gray-600">
                <p>Categories: {selectedCategories.length || 'All'}</p>
                <p>Dens: {selectedDens.length || 'All'}</p>
                <p>Events: {filteredEvents.length}</p>
              </div>
              
              {(selectedCategories.length > 0 || selectedDens.length > 0) && (
                <button
                  onClick={() => {
                    setSelectedCategories([]);
                    setSelectedDens([]);
                  }}
                  className="mt-3 text-sm text-primary-600 hover:text-primary-700 underline"
                >
                  Clear All Filters
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Calendar Content */}
      <div ref={calendarRef}>
        {renderCalendarView()}
      </div>

      {/* No Events Message */}
      {filteredEvents.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No events found</h3>
          <p className="text-gray-600">
            Try adjusting your filters or check back later for new events.
          </p>
        </div>
      )}
    </div>
  );
};

export default EventCalendar;
