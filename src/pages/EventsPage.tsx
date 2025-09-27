import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, List, Filter, Download, Share2 } from 'lucide-react';
// Removed unused imports - RSVP counting now uses Cloud Functions
import EventCard from '../components/Events/EventCard';
import EventCalendar from '../components/Events/EventCalendar';
import EventFilters, { EventFiltersData as EventFiltersType } from '../components/Events/EventFilters';
import RSVPListViewer from '../components/Admin/RSVPListViewer';
import { firestoreService } from '../services/firestore';
import { useAdmin } from '../contexts/AdminContext';
// import { analytics } from '../services/analytics';

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
  packingList?: string[];
  fees?: number;
  contactEmail: string;
  isOvernight: boolean;
  requiresPermission: boolean;
  attachments?: Array<{
    name: string;
    url: string;
    type: 'pdf' | 'image';
  }>;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const EVENTS_PER_PAGE = 12; // Pagination limit
const DEBOUNCE_DELAY = 300; // Debounce filter changes

const EventsPage: React.FC = () => {
  const navigate = useNavigate();
  const { state: adminState, hasRole } = useAdmin();
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usingFallbackData, setUsingFallbackData] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Cache for RSVP counts to avoid repeated API calls
  const [rsvpCountCache, setRsvpCountCache] = useState<{ [eventId: string]: { count: number; timestamp: number } }>({});
  
  // Admin RSVP viewer state
  const [showRSVPViewer, setShowRSVPViewer] = useState(false);
  const [selectedEventForRSVP, setSelectedEventForRSVP] = useState<Event | null>(null);
  
  // Debounced filter state
  const [filters, setFilters] = useState<EventFiltersType>({
    search: '',
    categories: [],
    denTags: [],
    dateRange: { start: '', end: '' },
    location: '',
    capacity: { min: 0, max: 1000 },
    timeOfDay: [],
    isOvernight: null,
    requiresPermission: null
  });
  
  // Check if user has admin permissions
  const isAdmin = hasRole('super-admin') || 
                  adminState.currentUser?.isAdmin;

  // Helper function to check if cache is valid
  const isCacheValid = useCallback((eventId: string): boolean => {
    const cached = rsvpCountCache[eventId];
    if (!cached) return false;
    return (Date.now() - cached.timestamp) < CACHE_DURATION;
  }, [rsvpCountCache]);

  // Helper function to get cached RSVP count
  const getCachedRSVPCount = useCallback((eventId: string): number | null => {
    const cached = rsvpCountCache[eventId];
    return cached && isCacheValid(eventId) ? cached.count : null;
  }, [rsvpCountCache, isCacheValid]);

  // Optimized RSVP count fetching with batch processing
  const fetchRSVPCounts = useCallback(async (eventIds: string[]): Promise<{ [eventId: string]: number }> => {
    const rsvpCounts: { [eventId: string]: number } = {};
    const eventIdsToFetch: string[] = [];

    // Check cache first
    eventIds.forEach(eventId => {
      const cachedCount = getCachedRSVPCount(eventId);
      if (cachedCount !== null) {
        rsvpCounts[eventId] = cachedCount;
      } else {
        eventIdsToFetch.push(eventId);
      }
    });

    // Fetch remaining counts in batch
    if (eventIdsToFetch.length > 0) {
      try {
        const { getFunctions, httpsCallable } = await import('firebase/functions');
        const functions = getFunctions();
        const getBatchRSVPCounts = httpsCallable(functions, 'getBatchRSVPCounts');
        
        const result = await getBatchRSVPCounts({ eventIds: eventIdsToFetch });
        const data = result.data as any;
        
        if (data.success) {
          // Update cache with fresh data
          const newCacheEntries: { [eventId: string]: { count: number; timestamp: number } } = {};
          Object.entries(data.rsvpCounts).forEach(([eventId, count]) => {
            rsvpCounts[eventId] = count as number;
            newCacheEntries[eventId] = { count: count as number, timestamp: Date.now() };
          });
          
          setRsvpCountCache(prev => ({ ...prev, ...newCacheEntries }));
        }
      } catch (error) {
        console.warn('Failed to load batch RSVP counts:', error);
        // Fallback to individual counts
        for (const eventId of eventIdsToFetch) {
          rsvpCounts[eventId] = 0; // Default fallback
        }
      }
    }

    return rsvpCounts;
  }, [getCachedRSVPCount]);

  // Memoized event filtering
  const applyFilters = useCallback((eventsList: Event[], filterData: EventFiltersType): Event[] => {
    let filtered = eventsList;
    
    // Apply search filter
    if (filterData.search) {
      const searchLower = filterData.search.toLowerCase();
      filtered = filtered.filter(event => 
        event.title.toLowerCase().includes(searchLower) ||
        event.description.toLowerCase().includes(searchLower) ||
        event.location.name.toLowerCase().includes(searchLower)
      );
    }
    
    // Apply category filter
    if (filterData.categories.length > 0) {
      filtered = filtered.filter(event => filterData.categories.includes(event.category));
    }
    
    // Apply den filter
    if (filterData.denTags.length > 0) {
      filtered = filtered.filter(event => 
        event.denTags.some(tag => filterData.denTags.includes(tag))
      );
    }
    
    // Apply date range filter
    if (filterData.dateRange.start) {
      filtered = filtered.filter(event => new Date(event.date) >= new Date(filterData.dateRange.start));
    }
    if (filterData.dateRange.end) {
      filtered = filtered.filter(event => new Date(event.date) <= new Date(filterData.dateRange.end));
    }
    
    // Apply location filter
    if (filterData.location) {
      const locationLower = filterData.location.toLowerCase();
      filtered = filtered.filter(event => 
        event.location.name.toLowerCase().includes(locationLower) ||
        event.location.address.toLowerCase().includes(locationLower)
      );
    }
    
    // Apply capacity filter
    filtered = filtered.filter(event => 
      event.currentRSVPs >= filterData.capacity.min && 
      event.currentRSVPs <= filterData.capacity.max
    );
    
    // Apply time of day filter
    if (filterData.timeOfDay.length > 0) {
      filtered = filtered.filter(event => {
        const hour = parseInt(event.startTime.split(':')[0]);
        if (filterData.timeOfDay.includes('morning') && hour >= 6 && hour < 12) return true;
        if (filterData.timeOfDay.includes('afternoon') && hour >= 12 && hour < 18) return true;
        if (filterData.timeOfDay.includes('evening') && hour >= 18 && hour < 24) return true;
        if (filterData.timeOfDay.includes('overnight') && (hour >= 0 && hour < 6)) return true;
        return false;
      });
    }
    
    // Apply overnight filter
    if (filterData.isOvernight !== null) {
      filtered = filtered.filter(event => event.isOvernight === filterData.isOvernight);
    }
    
    // Apply permission filter
    if (filterData.requiresPermission !== null) {
      filtered = filtered.filter(event => event.requiresPermission === filterData.requiresPermission);
    }
    
    return filtered;
  }, []);

  // Memoized pagination
  const paginatedEvents = useMemo(() => {
    const startIndex = (currentPage - 1) * EVENTS_PER_PAGE;
    const endIndex = startIndex + EVENTS_PER_PAGE;
    return filteredEvents.slice(startIndex, endIndex);
  }, [filteredEvents, currentPage]);

  // Debounced filter application
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const filtered = applyFilters(events, filters);
      setFilteredEvents(filtered);
      setCurrentPage(1); // Reset to first page when filters change
      setTotalPages(Math.ceil(filtered.length / EVENTS_PER_PAGE));
    }, DEBOUNCE_DELAY);

    return () => clearTimeout(timeoutId);
  }, [events, filters, applyFilters]);

  // Optimized event loading with parallel processing
  useEffect(() => {
    const loadEvents = async () => {
      setIsLoading(true);
      setError(null);
      setUsingFallbackData(false);
      
      try {
        // Load events and RSVP counts in parallel
        const [firebaseEvents] = await Promise.all([
          firestoreService.getEvents()
        ]);
        
        // Track successful data load
        console.log('Events loaded from database:', firebaseEvents.length);
        
        // Get event IDs for RSVP count fetching
        const eventIds = firebaseEvents.map((event: any) => event.id);
        
        // Fetch RSVP counts using optimized batch function
        const rsvpCounts = await fetchRSVPCounts(eventIds);

        // Transform Firebase data to match our interface
        const transformedEvents: Event[] = firebaseEvents.map((firebaseEvent: any) => {
          const transformedEvent = {
            id: firebaseEvent.id,
            title: firebaseEvent.title,
            date: firebaseEvent.startDate?.toDate?.()?.toISOString()?.split('T')[0] || 
                  (firebaseEvent.startDate && firebaseEvent.startDate.split) ? firebaseEvent.startDate.split('T')[0] : 
                  firebaseEvent.startDate,
            startTime: firebaseEvent.startTime || '00:00',
            endTime: firebaseEvent.endTime || '00:00',
            location: {
              name: firebaseEvent.locationName || firebaseEvent.location || 'TBD',
              address: firebaseEvent.address || 'Address TBD',
              coordinates: firebaseEvent.coordinates || undefined
            },
            category: firebaseEvent.category || 'pack-wide',
            denTags: firebaseEvent.denTags || [],
            maxCapacity: firebaseEvent.maxCapacity || null,
            currentRSVPs: rsvpCounts[firebaseEvent.id] || firebaseEvent.currentRSVPs || 0,
            description: firebaseEvent.description || '',
            packingList: firebaseEvent.packingList || [],
            fees: firebaseEvent.fees || null,
            contactEmail: firebaseEvent.contactEmail || 'cubmaster@sfpack1703.com',
            isOvernight: firebaseEvent.isOvernight || false,
            requiresPermission: firebaseEvent.requiresPermission || false,
            attachments: firebaseEvent.attachments || []
          };
          
          return transformedEvent;
        });
        
        setEvents(transformedEvents);
        
        // Track successful data load
        console.log('Events loaded successfully:', transformedEvents.length);
        
      } catch (error) {
        console.error('Error loading events:', error);
        
        // No fallback data - show empty state
        setEvents([]);
        setError('Unable to load events. Please try again later.');
        
        // Track error
        console.log('Failed to load events from database');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadEvents();
  }, [fetchRSVPCounts]);

  // Optimized filter change handler
  const handleFiltersChange = useCallback((newFilters: EventFiltersType) => {
    setFilters(newFilters);
  }, []);

  const handleEventClick = (eventId: string) => {
    console.log('🔗 EventsPage: Navigating to event detail page for ID:', eventId);
    console.log('🔗 EventsPage: Current URL:', window.location.href);
    console.log('🔗 EventsPage: Target URL:', `/events/${eventId}`);
    navigate(`/events/${eventId}`);
  };

  const handleRSVP = (eventId: string) => {
    console.log('🎯 EventsPage: RSVP button clicked for event ID:', eventId);
    console.log('🎯 EventsPage: Current URL:', window.location.href);
    console.log('🎯 EventsPage: Target URL:', `/events/${eventId}?tab=rsvp`);
    navigate(`/events/${eventId}?tab=rsvp`);
  };

  const handleViewDetails = (eventId: string) => {
    console.log('👁️ EventsPage: View Details button clicked for event ID:', eventId);
    console.log('👁️ EventsPage: Current URL:', window.location.href);
    console.log('👁️ EventsPage: Target URL:', `/events/${eventId}`);
    navigate(`/events/${eventId}`);
  };

  const handleAddToCalendar = (event: Event) => {
    // Generate and download ICS file
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Pack 1703//Event Calendar//EN',
      'BEGIN:VEVENT',
              `UID:${event.id}@sfpack1703.com`,
      `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
      `DTSTART:${new Date(`${event.date}T${event.startTime}`).toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
      `DTEND:${new Date(`${event.date}T${event.endTime}`).toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
      `SUMMARY:${event.title}`,
      `DESCRIPTION:${event.description}`,
      `LOCATION:${event.location.name}, ${event.location.address}`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');
    
    const blob = new Blob([icsContent], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${event.title.replace(/\s+/g, '-')}.ics`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleShare = (event: Event) => {
    if (navigator.share) {
      navigator.share({
        title: event.title,
        text: `Check out this event: ${event.title}`,
        url: `/events/${event.id}`
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(`${window.location.origin}/events/${event.id}`);
      alert('Event URL copied to clipboard!');
    }
  };

  const handleCalendarViewChange = (view: string) => {
    // Handle calendar view changes
    console.log('Calendar view changed to:', view);
  };

  // Admin RSVP viewer handlers
  const handleViewRSVPs = (event: Event) => {
    setSelectedEventForRSVP(event);
    setShowRSVPViewer(true);
  };

  const handleCloseRSVPViewer = () => {
    setShowRSVPViewer(false);
    setSelectedEventForRSVP(null);
  };

  const generateICSFeed = async () => {
    try {
      // Import Firebase Functions
      const { getFunctions, httpsCallable } = await import('firebase/functions');
      const functions = getFunctions();
      const icsFeed = httpsCallable(functions, 'icsFeed');
      
      // Call the Cloud Function to generate ICS feed for all events
      const result = await icsFeed({
        // No filters - get all events
        categories: undefined,
        denTags: undefined,
        startDate: undefined,
        endDate: undefined
      });
      
      const data = result.data as any;
      if (data.success && data.icsContent) {
        // Create and download the ICS file
        const blob = new Blob([data.icsContent], { type: 'text/calendar' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `pack1703-events-${new Date().toISOString().split('T')[0]}.ics`;
        link.click();
        URL.revokeObjectURL(url);
        
        console.log(`ICS feed generated with ${data.eventCount} events`);
      } else {
        console.error('Failed to generate ICS feed:', data);
        alert('Failed to generate ICS feed. Please try again.');
      }
    } catch (error) {
      console.error('Error generating ICS feed:', error);
      alert('Error generating ICS feed. Please try again.');
    }
  };

  const shareCalendar = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
                      title: 'Scout Pack Events Calendar',
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

  // Removed loading animation for faster page transitions

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-primary-50/30 to-secondary-50/30 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-display font-bold text-gray-900 mb-4">
            Pack Events & Activities
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                          Discover upcoming events, activities, and adventures for scout families. 
            From den meetings to campouts, there's something for everyone!
          </p>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  {usingFallbackData ? 'Database Connection Issue' : 'Error Loading Data'}
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                  {usingFallbackData && (
                    <p className="mt-1">The data shown below is sample data. Please check your connection and try refreshing the page.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* View Toggle and Actions */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 mb-8">
          <div className="flex items-center space-x-4">
            {/* View Mode Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                  viewMode === 'list'
                    ? 'bg-white text-primary-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <List className="w-4 h-4 inline mr-2" />
                List View
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                  viewMode === 'calendar'
                    ? 'bg-white text-primary-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Calendar className="w-4 h-4 inline mr-2" />
                Calendar View
              </button>
            </div>

            {/* Filter Toggle */}
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

          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-3">
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
              Share Calendar
            </button>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mb-8">
            <EventFilters onFiltersChange={handleFiltersChange} />
          </div>
        )}

        {/* Content */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading events...</p>
          </div>
        ) : viewMode === 'list' ? (
          /* List View */
          <div className="space-y-6">
            {filteredEvents.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No events found</h3>
                <p className="text-gray-600">
                  Try adjusting your filters or check back later for new events.
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {paginatedEvents.map((event) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      onRSVP={handleRSVP}
                      onViewDetails={handleViewDetails}
                      onAddToCalendar={handleAddToCalendar}
                      onShare={handleShare}
                      onViewRSVPs={isAdmin ? handleViewRSVPs : undefined}
                      isAdmin={isAdmin}
                    />
                  ))}
                </div>
                
                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center space-x-2 mt-8">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    
                    <div className="flex space-x-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const pageNum = i + 1;
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`px-3 py-2 text-sm font-medium rounded-md ${
                              currentPage === pageNum
                                ? 'bg-primary-600 text-white'
                                : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>
                    
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          /* Calendar View */
          <EventCalendar
            events={filteredEvents}
            onEventClick={handleEventClick}
            onDateSelect={(date) => console.log('Date selected:', date)}
            onViewChange={handleCalendarViewChange}
          />
        )}

        {/* Quick Stats */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-soft border border-white/50 p-6 text-center">
            <div className="text-3xl font-bold text-primary-600 mb-2">{filteredEvents.length}</div>
            <div className="text-gray-600">Upcoming Events</div>
          </div>
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-soft border border-white/50 p-6 text-center">
            <div className="text-3xl font-bold text-secondary-600 mb-2">
              {filteredEvents.filter(e => e.isOvernight).length}
            </div>
            <div className="text-gray-600">Overnight Adventures</div>
          </div>
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-soft border border-white/50 p-6 text-center">
            <div className="text-3xl font-bold text-accent-600 mb-2">
              {filteredEvents.filter(e => e.category === 'service').length}
            </div>
            <div className="text-gray-600">Service Projects</div>
          </div>
        </div>

        {/* Admin RSVP Viewer Modal */}
        {showRSVPViewer && selectedEventForRSVP && (
          <RSVPListViewer
            eventId={selectedEventForRSVP.id}
            eventTitle={selectedEventForRSVP.title}
            onClose={handleCloseRSVPViewer}
          />
        )}
      </div>
    </div>
  );
};

export default EventsPage;
