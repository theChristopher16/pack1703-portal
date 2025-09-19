import React, { useState, useEffect } from 'react';
import { Calendar, List, Filter, Download, Share2, LogIn, User } from 'lucide-react';
import EventCard from '../components/Events/EventCard';
import EventCalendar from '../components/Events/EventCalendar';
import EventFilters, { EventFiltersData as EventFiltersType } from '../components/Events/EventFilters';
import { firestoreService } from '../services/firestore';
import { functions } from '../firebase/config';
import { httpsCallable } from 'firebase/functions';
import { useAdmin } from '../contexts/AdminContext';
import LoginModal from '../components/Auth/LoginModal';
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

const EventsPage: React.FC = () => {
  const { state } = useAdmin();
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  // const [isLoading, setIsLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usingFallbackData, setUsingFallbackData] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  
  // Check if user is authenticated
  const isAuthenticated = !!state.currentUser;

  // Load events from Firebase using optimized Cloud Function
  useEffect(() => {
    const loadEvents = async () => {
      // setIsLoading(true);
      setError(null);
      setUsingFallbackData(false);
      
      try {
        // Use optimized Cloud Function for better performance
        const getEventsOptimized = httpsCallable(functions, 'getEventsOptimized');
        const result = await getEventsOptimized({
          limit: 50, // Load more events initially
          offset: 0,
          includePrivate: false
        });
        
        if ((result.data as any).success) {
          const firebaseEvents = (result.data as any).events;
          
          // Transform Firebase data to match our interface
          const transformedEvents: Event[] = firebaseEvents.map((firebaseEvent: any) => ({
            id: firebaseEvent.id,
            title: firebaseEvent.title,
            date: firebaseEvent.startDate?.split('T')[0] || firebaseEvent.startDate,
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
            currentRSVPs: firebaseEvent.currentRSVPs || 0,
            description: firebaseEvent.description || '',
            packingList: firebaseEvent.packingList || [],
            fees: firebaseEvent.fees || null,
            contactEmail: firebaseEvent.contactEmail || 'cubmaster@sfpack1703.com',
            isOvernight: firebaseEvent.isOvernight || false,
            requiresPermission: firebaseEvent.requiresPermission || false,
            attachments: firebaseEvent.attachments || []
          }));
          
          setEvents(transformedEvents);
          setFilteredEvents(transformedEvents);
          
          // Track successful data load
          console.log('Events loaded successfully via Cloud Function:', transformedEvents.length);
          console.log('Pagination info:', (result.data as any).pagination);
          
        } else {
          throw new Error('Cloud Function returned unsuccessful result');
        }
        
      } catch (error) {
        console.error('Error loading events:', error);
        
        // Fallback to direct Firestore query if Cloud Function fails
        try {
          console.log('Falling back to direct Firestore query...');
          const firebaseEvents = await firestoreService.getEvents();
          
          // Use raw Firestore data structure (same as EventDetailPage expects)
          const rawEvents: any[] = firebaseEvents.map((firebaseEvent: any) => ({
            id: firebaseEvent.id,
            title: firebaseEvent.title,
            startDate: firebaseEvent.startDate,
            endDate: firebaseEvent.endDate,
            startTime: firebaseEvent.startTime,
            endTime: firebaseEvent.endTime,
            locationId: firebaseEvent.locationId,
            category: firebaseEvent.category,
            denTags: firebaseEvent.denTags || [],
            currentRSVPs: firebaseEvent.currentRSVPs || 0,
            description: firebaseEvent.description || '',
            packingList: firebaseEvent.packingList || [],
            attachments: firebaseEvent.attachments || [],
            visibility: firebaseEvent.visibility,
            status: firebaseEvent.status
          }));
          
          // Also create transformed events for the EventsPage interface
          const transformedEvents: Event[] = firebaseEvents.map((firebaseEvent: any) => ({
            id: firebaseEvent.id,
            title: firebaseEvent.title,
            date: firebaseEvent.startDate?.toDate?.()?.toISOString()?.split('T')[0] || firebaseEvent.startDate,
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
            currentRSVPs: firebaseEvent.currentRSVPs || 0,
            description: firebaseEvent.description || '',
            packingList: firebaseEvent.packingList || [],
            fees: firebaseEvent.fees || null,
            contactEmail: firebaseEvent.contactEmail || 'cubmaster@sfpack1703.com',
            isOvernight: firebaseEvent.isOvernight || false,
            requiresPermission: firebaseEvent.requiresPermission || false,
            attachments: firebaseEvent.attachments || []
          }));
          
          setEvents(transformedEvents);
          setFilteredEvents(transformedEvents);
          
          console.log('Events loaded successfully via fallback:', transformedEvents.length);
          console.log('Raw event IDs:', rawEvents.map(e => e.id));
          
        } catch (fallbackError) {
          console.error('Fallback also failed:', fallbackError);
          
          // No fallback data - show empty state
          setEvents([]);
          setFilteredEvents([]);
          setError('Unable to load events. Please try again later.');
          
          // Track error
          console.log('Failed to load events from both Cloud Function and database');
        }
      } finally {
        // setIsLoading(false);
      }
    };
    
    loadEvents();
  }, []);

  const handleFiltersChange = (filters: EventFiltersType) => {
    let filtered = events;
    
    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(event => 
        event.title.toLowerCase().includes(searchLower) ||
        event.description.toLowerCase().includes(searchLower) ||
        event.location.name.toLowerCase().includes(searchLower)
      );
    }
    
    // Apply category filter
    if (filters.categories.length > 0) {
      filtered = filtered.filter(event => filters.categories.includes(event.category));
    }
    
    // Apply den filter
    if (filters.denTags.length > 0) {
      filtered = filtered.filter(event => 
        event.denTags.some(tag => filters.denTags.includes(tag))
      );
    }
    
    // Apply date range filter
    if (filters.dateRange.start) {
      filtered = filtered.filter(event => new Date(event.date) >= new Date(filters.dateRange.start));
    }
    if (filters.dateRange.end) {
      filtered = filtered.filter(event => new Date(event.date) <= new Date(filters.dateRange.end));
    }
    
    // Apply location filter
    if (filters.location) {
      const locationLower = filters.location.toLowerCase();
      filtered = filtered.filter(event => 
        event.location.name.toLowerCase().includes(locationLower) ||
        event.location.address.toLowerCase().includes(locationLower)
      );
    }
    
    // Apply capacity filter
    filtered = filtered.filter(event => 
      event.currentRSVPs >= filters.capacity.min && 
      event.currentRSVPs <= filters.capacity.max
    );
    
    // Apply time of day filter
    if (filters.timeOfDay.length > 0) {
      filtered = filtered.filter(event => {
        const hour = parseInt(event.startTime.split(':')[0]);
        if (filters.timeOfDay.includes('morning') && hour >= 6 && hour < 12) return true;
        if (filters.timeOfDay.includes('afternoon') && hour >= 12 && hour < 18) return true;
        if (filters.timeOfDay.includes('evening') && hour >= 18 && hour < 24) return true;
        if (filters.timeOfDay.includes('overnight') && (hour >= 0 && hour < 6)) return true;
        return false;
      });
    }
    
    // Apply overnight filter
    if (filters.isOvernight !== null) {
      filtered = filtered.filter(event => event.isOvernight === filters.isOvernight);
    }
    
    // Apply permission filter
    if (filters.requiresPermission !== null) {
      filtered = filtered.filter(event => event.requiresPermission === filters.requiresPermission);
    }
    
    setFilteredEvents(filtered);
  };

  const handleEventClick = (eventId: string) => {
    // Navigate to event detail page
    window.location.href = `/events/${eventId}`;
  };

  const handleRSVP = (eventId: string) => {
    // Check if user is authenticated
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }
    
    // Navigate to event detail page with RSVP tab active
    window.location.href = `/events/${eventId}?tab=rsvp`;
  };

  const handleViewDetails = (eventId: string) => {
    // Navigate to event detail page
    window.location.href = `/events/${eventId}`;
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
        
        {viewMode === 'list' ? (
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
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredEvents.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    onRSVP={handleRSVP}
                    onViewDetails={handleViewDetails}
                    onAddToCalendar={handleAddToCalendar}
                    onShare={handleShare}
                    isAuthenticated={isAuthenticated}
                  />
                ))}
              </div>
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
      </div>
      
      {/* Login Modal */}
      {showLoginModal && (
        <LoginModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          onSuccess={() => {
            setShowLoginModal(false);
            // Optionally refresh the page or update state
          }}
        />
      )}
    </div>
  );
};

export default EventsPage;
