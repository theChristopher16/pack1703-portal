import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, List, Filter, Download, Share2, Plus, Edit, Trash2 } from 'lucide-react';
// Removed unused imports - RSVP counting now uses Cloud Functions
import EventCard from '../components/Events/EventCard';
import EventCalendar from '../components/Events/EventCalendar';
import EventFilters, { EventFiltersData as EventFiltersType } from '../components/Events/EventFilters';
import RSVPListViewer from '../components/Admin/RSVPListViewer';
import { firestoreService } from '../services/firestore';
import { useAdmin } from '../contexts/AdminContext';
import { adminService } from '../services/adminService';
import { authService } from '../services/authService';
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
  } | string; // Can be object or string for form data
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
  // Admin-specific fields
  visibility?: 'public' | 'link-only' | 'private';
  isActive?: boolean;
  locationId?: string;
  startDate?: string;
  endDate?: string;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const EVENTS_PER_PAGE = 12; // Pagination limit
const DEBOUNCE_DELAY = 300; // Debounce filter changes

const EventsPage: React.FC = () => {
  const navigate = useNavigate();
  const { state: adminState, hasRole, addNotification } = useAdmin();
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
  
  // Admin event management state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterVisibility, setFilterVisibility] = useState('all');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingEventId, setDeletingEventId] = useState<string | null>(null);
  
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
        (typeof event.location === 'object' ? event.location.name.toLowerCase().includes(searchLower) : event.location.toLowerCase().includes(searchLower))
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
      filtered = filtered.filter(event => {
        if (typeof event.location === 'object') {
          return event.location.name.toLowerCase().includes(locationLower) ||
                 event.location.address.toLowerCase().includes(locationLower);
        }
        return event.location.toLowerCase().includes(locationLower);
      });
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
        // Load events first (with caching)
        const firebaseEvents = await firestoreService.getEvents();
        
        // Track successful data load
        console.log('Events loaded from database:', firebaseEvents.length);
        
        // Transform events first (without RSVP counts)
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
            currentRSVPs: 0, // Will be updated after RSVP counts are fetched
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
        
        // Set events immediately (without RSVP counts)
        setEvents(transformedEvents);
        
        // Get event IDs for RSVP count fetching
        const eventIds = firebaseEvents.map((event: any) => event.id);
        
        // Fetch RSVP counts in background (non-blocking)
        fetchRSVPCounts(eventIds).then(rsvpCounts => {
          // Update events with RSVP counts
          setEvents(prevEvents => 
            prevEvents.map(event => ({
              ...event,
              currentRSVPs: rsvpCounts[event.id] || 0
            }))
          );
        }).catch(error => {
          console.warn('Failed to load RSVP counts:', error);
          // Events are already displayed, just without accurate counts
        });
        
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

  // Handle custom events from EventCard
  useEffect(() => {
    const handleEditEventFromCard = (event: CustomEvent) => {
      handleEditEvent(event.detail);
    };

    const handleDeleteEventFromCard = (event: CustomEvent) => {
      handleDeleteEvent(event.detail);
    };

    window.addEventListener('editEvent', handleEditEventFromCard as EventListener);
    window.addEventListener('deleteEvent', handleDeleteEventFromCard as EventListener);

    return () => {
      window.removeEventListener('editEvent', handleEditEventFromCard as EventListener);
      window.removeEventListener('deleteEvent', handleDeleteEventFromCard as EventListener);
    };
  }, []);

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
      `LOCATION:${typeof event.location === 'object' ? `${event.location.name}, ${event.location.address}` : event.location}`,
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

  // Admin event management handlers
  const handleCreateEvent = () => {
    setModalMode('create');
    setSelectedEvent(null);
    setIsModalOpen(true);
  };

  const handleEditEvent = (event: Event) => {
    setModalMode('edit');
    setSelectedEvent(event);
    setIsModalOpen(true);
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (window.confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      try {
        setDeletingEventId(eventId);
        
        // Show loading notification
        addNotification('info', 'Deleting Event', 'Please wait while we delete the event...');
        
        console.log('Deleting event with ID:', eventId);
        const result = await adminService.deleteEvent(eventId);
        console.log('Event deletion result:', result);
        
        if (result.success) {
          console.log('Event deleted successfully, updating events list...');
          
          // Remove the event from the local state immediately
          setEvents(prevEvents => prevEvents.filter(e => e.id !== eventId));
          
          // Show success notification
          addNotification('success', 'Event Deleted Successfully!', 'The event has been removed from the pack calendar.');
        } else {
          console.error('Event deletion failed:', result.error);
          addNotification('error', 'Event Deletion Failed', result.error || 'Failed to delete event. Please try again.');
        }
      } catch (error) {
        console.error('Error deleting event:', error);
        addNotification('error', 'Event Deletion Failed', `Failed to delete event: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`);
      } finally {
        setDeletingEventId(null);
      }
    }
  };

  const handleSaveEvent = async (eventData: Partial<Event>) => {
    try {
      setIsSubmitting(true);
      
      // Show loading state
      addNotification('info', 'Creating Event', 'Please wait while we create your event...');
      
      if (modalMode === 'create') {
        // Handle location - create or find location ID
        let locationId = 'RwI4opwHcUx3GKKF7Ten'; // Default location ID
        
        if (eventData.location && typeof eventData.location === 'string' && eventData.location.trim()) {
          try {
            const locationResult = await adminService.createLocation({
              name: eventData.location.trim(),
              address: '',
              category: 'other',
              notesPublic: `Location created for event: ${eventData.title}`,
              isImportant: false
            });
            
            if (locationResult.success && locationResult.locationId) {
              locationId = locationResult.locationId;
            }
          } catch (error) {
            console.warn('Error creating location, using default:', error);
          }
        }
        
        const cloudFunctionData = {
          title: eventData.title,
          description: eventData.description,
          startDate: new Date(eventData.startDate!),
          endDate: new Date(eventData.endDate!),
          startTime: eventData.startDate?.split('T')[1]?.substring(0, 5) || '09:00',
          endTime: eventData.endDate?.split('T')[1]?.substring(0, 5) || '17:00',
          locationId: locationId,
          category: eventData.category || 'Meeting',
          seasonId: 'qPEnr3WZN91NhM8jOypp',
          visibility: eventData.visibility || 'public',
          maxCapacity: eventData.maxCapacity && eventData.maxCapacity.toString().trim() !== '' 
            ? parseInt(eventData.maxCapacity.toString()) 
            : undefined,
          sendNotification: false
        };
        
        console.log('Creating event with data:', cloudFunctionData);
        const result = await adminService.createEvent(cloudFunctionData);
        console.log('Event creation result:', result);
        
        if (result.success) {
          console.log('Event created successfully, refreshing events list...');
          
          // Refresh events list
          const [firebaseEvents] = await Promise.all([
            firestoreService.getEvents()
          ]);
          
          const eventIds = firebaseEvents.map((event: any) => event.id);
          const rsvpCounts = await fetchRSVPCounts(eventIds);

          const transformedEvents: Event[] = firebaseEvents.map((firebaseEvent: any) => {
            return {
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
              attachments: firebaseEvent.attachments || [],
              visibility: firebaseEvent.visibility,
              isActive: firebaseEvent.isActive,
              locationId: firebaseEvent.locationId,
              startDate: firebaseEvent.startDate?.toDate?.()?.toISOString() || firebaseEvent.startDate,
              endDate: firebaseEvent.endDate?.toDate?.()?.toISOString() || firebaseEvent.endDate
            };
          });
          
          setEvents(transformedEvents);
          setIsModalOpen(false);
          setSelectedEvent(null);
          addNotification('success', 'Event Created Successfully!', `"${eventData.title}" has been added to the pack calendar.`);
        } else {
          console.error('Event creation failed:', result.error);
          addNotification('error', 'Event Creation Failed', result.error || 'Failed to create event. Please try again.');
        }
        
      } else if (modalMode === 'edit' && selectedEvent) {
        // Show loading state for edit
        addNotification('info', 'Updating Event', 'Please wait while we update your event...');
        
        const eventToUpdate = {
          title: eventData.title!,
          description: eventData.description!,
          startDate: new Date(eventData.startDate!),
          endDate: new Date(eventData.endDate!),
          startTime: eventData.startDate?.split('T')[1]?.substring(0, 5) || '09:00',
          endTime: eventData.endDate?.split('T')[1]?.substring(0, 5) || '17:00',
          category: eventData.category || 'Meeting',
          visibility: eventData.visibility || 'public',
          maxCapacity: eventData.maxCapacity && eventData.maxCapacity.toString().trim() !== '' 
            ? parseInt(eventData.maxCapacity.toString()) 
            : undefined,
        };
        
        console.log('Updating event with data:', eventToUpdate);
        const result = await adminService.updateEvent(selectedEvent.id, eventToUpdate);
        console.log('Event update result:', result);
        
        if (result.success) {
          console.log('Event updated successfully, refreshing events list...');
          
          // Refresh events list
          const [firebaseEvents] = await Promise.all([
            firestoreService.getEvents()
          ]);
          
          const eventIds = firebaseEvents.map((event: any) => event.id);
          const rsvpCounts = await fetchRSVPCounts(eventIds);

          const transformedEvents: Event[] = firebaseEvents.map((firebaseEvent: any) => {
            return {
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
              attachments: firebaseEvent.attachments || [],
              visibility: firebaseEvent.visibility,
              isActive: firebaseEvent.isActive,
              locationId: firebaseEvent.locationId,
              startDate: firebaseEvent.startDate?.toDate?.()?.toISOString() || firebaseEvent.startDate,
              endDate: firebaseEvent.endDate?.toDate?.()?.toISOString() || firebaseEvent.endDate
            };
          });
          
          setEvents(transformedEvents);
          setIsModalOpen(false);
          setSelectedEvent(null);
          addNotification('success', 'Event Updated Successfully!', `"${eventData.title}" has been updated.`);
        } else {
          console.error('Event update failed:', result.error);
          addNotification('error', 'Event Update Failed', result.error || 'Failed to update event. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error saving event:', error);
      addNotification('error', 'Save Failed', `Failed to save event: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`);
    } finally {
      setIsSubmitting(false);
    }
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
            {isAdmin ? 'Events Management' : 'Pack Events & Activities'}
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {isAdmin 
              ? 'Manage all pack events, including scheduling, visibility, and participant limits.'
              : 'Discover upcoming events, activities, and adventures for scout families. From den meetings to campouts, there\'s something for everyone!'
            }
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

            {/* Admin Controls */}
            {isAdmin && (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-white/50 backdrop-blur-sm rounded-lg p-2 border border-gray-200/50">
                {/* Admin Search */}
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Search events..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full sm:w-48 pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white/80"
                  />
                  <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                    <span className="text-gray-400 text-sm">🔍</span>
                  </div>
                </div>

                {/* Admin Category Filter */}
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full sm:w-auto px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white/80"
                >
                  <option value="all">All Categories</option>
                  <option value="Meeting">Meeting</option>
                  <option value="Competition">Competition</option>
                  <option value="Outdoor">Outdoor</option>
                  <option value="Service">Service</option>
                  <option value="Social">Social</option>
                  <option value="Training">Training</option>
                </select>

                {/* Admin Visibility Filter */}
                <select
                  value={filterVisibility}
                  onChange={(e) => setFilterVisibility(e.target.value)}
                  className="w-full sm:w-auto px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white/80"
                >
                  <option value="all">All Visibility</option>
                  <option value="public">Public</option>
                  <option value="link-only">Link Only</option>
                  <option value="private">Private</option>
                </select>
              </div>
            )}

          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-3">
            {/* Admin Create Button */}
            {isAdmin && (
              <button
                onClick={handleCreateEvent}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow-md"
              >
                <Plus className="w-4 h-4" />
                Create Event
              </button>
            )}

            <button
              onClick={generateICSFeed}
              className="px-3 py-2 bg-white/80 border border-gray-200 text-gray-600 rounded-lg hover:bg-white hover:text-gray-800 transition-all duration-200 text-sm"
            >
              <Download className="w-4 h-4 inline mr-1.5" />
              ICS Feed
            </button>
            
            <button
              onClick={shareCalendar}
              className="px-3 py-2 bg-white/80 border border-gray-200 text-gray-600 rounded-lg hover:bg-white hover:text-gray-800 transition-all duration-200 text-sm"
            >
              <Share2 className="w-4 h-4 inline mr-1.5" />
              Share
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
                  {paginatedEvents.map((event) => {
                    // Normalize location to object format for EventCard
                    const normalizedEvent = {
                      ...event,
                      location: typeof event.location === 'string' 
                        ? { name: event.location, address: '', coordinates: undefined }
                        : event.location
                    };
                    
                    return (
                      <div key={event.id} className="relative">
                        <EventCard
                          event={normalizedEvent}
                          onRSVP={handleRSVP}
                          onViewDetails={handleViewDetails}
                          onAddToCalendar={handleAddToCalendar}
                          onShare={handleShare}
                          onViewRSVPs={isAdmin ? handleViewRSVPs : undefined}
                          isAdmin={isAdmin}
                          isDeleting={deletingEventId === event.id}
                        />
                      </div>
                    );
                  })}
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
            events={filteredEvents.map(event => ({
              ...event,
              location: typeof event.location === 'string' 
                ? { name: event.location, address: '', coordinates: undefined }
                : event.location
            }))}
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

        {/* Admin Event Management Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-white/50 shadow-soft">
              <div className="p-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-3xl font-display font-bold text-gray-900">
                      {modalMode === 'create' ? 'Create New Event' : 'Edit Event'}
                    </h2>
                    <p className="text-gray-600 mt-2">
                      {modalMode === 'create' 
                        ? 'Add a new event to the pack calendar' 
                        : 'Update event details and settings'
                      }
                    </p>
                  </div>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors duration-200 text-2xl"
                  >
                    ✕
                  </button>
                </div>

                {/* Event Form */}
                <EventForm 
                  event={selectedEvent}
                  mode={modalMode}
                  onSave={handleSaveEvent}
                  onCancel={() => setIsModalOpen(false)}
                  isSubmitting={isSubmitting}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Event Form Component
interface EventFormProps {
  event: Event | null;
  mode: 'create' | 'edit';
  onSave: (eventData: Partial<Event>) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

const EventForm: React.FC<EventFormProps> = ({ event, mode, onSave, onCancel, isSubmitting = false }) => {
  const [formData, setFormData] = useState({
    title: event?.title || '',
    description: event?.description || '',
    startDate: event?.startDate ? event.startDate.slice(0, 16) : '',
    endDate: event?.endDate ? event.endDate.slice(0, 16) : '',
    location: typeof event?.location === 'object' ? event.location.name : (event?.location || ''),
    locationId: event?.locationId || '',
    category: event?.category || 'Meeting',
    visibility: event?.visibility || 'public',
    maxCapacity: event?.maxCapacity ? event.maxCapacity.toString() : '',
    isActive: event?.isActive ?? true
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const categories = ['Meeting', 'Competition', 'Outdoor', 'Service', 'Social', 'Training'];
  const visibilityOptions = [
    { value: 'public', label: 'Public', description: 'Visible to everyone' },
    { value: 'link-only', label: 'Link Only', description: 'Only accessible via direct link' },
    { value: 'private', label: 'Private', description: 'Only visible to admins' }
  ];

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Event title is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Event description is required';
    }

    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    }

    if (!formData.endDate) {
      newErrors.endDate = 'End date is required';
    }

    if (formData.startDate && formData.endDate && new Date(formData.startDate) >= new Date(formData.endDate)) {
      newErrors.endDate = 'End date must be after start date';
    }

    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
    }

    if (formData.maxCapacity && parseInt(formData.maxCapacity) < 1) {
      newErrors.maxCapacity = 'Maximum participants must be at least 1';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      const { maxCapacity, locationId, ...formDataWithoutMaxParticipants } = formData;
      const eventData: Partial<Event> = {
        title: formData.title,
        description: formData.description,
        location: formData.location,
        category: formData.category as 'pack-wide' | 'den' | 'camping' | 'overnight' | 'service',
        visibility: formData.visibility,
        isActive: formData.isActive,
        locationId: locationId || formData.location,
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString(),
        currentRSVPs: event?.currentRSVPs || 0
      };
      
      if (maxCapacity && maxCapacity.trim() !== '' && !isNaN(parseInt(maxCapacity))) {
        eventData.maxCapacity = parseInt(maxCapacity);
      }
      
      onSave(eventData);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <span className="text-blue-600 mr-2">📝</span>
          Basic Information
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Title */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Event Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 backdrop-blur-sm ${
                errors.title ? 'border-red-300' : 'border-gray-200'
              }`}
              placeholder="Enter event title..."
            />
            {errors.title && (
              <p className="text-red-600 text-sm mt-1">{errors.title}</p>
            )}
          </div>

          {/* Description */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={4}
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 backdrop-blur-sm ${
                errors.description ? 'border-red-300' : 'border-gray-200'
              }`}
              placeholder="Describe the event..."
            />
            {errors.description && (
              <p className="text-red-600 text-sm mt-1">{errors.description}</p>
            )}
          </div>
        </div>
      </div>

      {/* Date & Time */}
      <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <span className="text-green-600 mr-2">📅</span>
          Date & Time
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Start Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date & Time *
            </label>
            <input
              type="datetime-local"
              value={formData.startDate}
              onChange={(e) => handleInputChange('startDate', e.target.value)}
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white/80 backdrop-blur-sm ${
                errors.startDate ? 'border-red-300' : 'border-gray-200'
              }`}
            />
            {errors.startDate && (
              <p className="text-red-600 text-sm mt-1">{errors.startDate}</p>
            )}
          </div>

          {/* End Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Date & Time *
            </label>
            <input
              type="datetime-local"
              value={formData.endDate}
              onChange={(e) => handleInputChange('endDate', e.target.value)}
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white/80 backdrop-blur-sm ${
                errors.endDate ? 'border-red-300' : 'border-gray-200'
              }`}
            />
            {errors.endDate && (
              <p className="text-red-600 text-sm mt-1">{errors.endDate}</p>
            )}
          </div>
        </div>
      </div>

      {/* Location & Category */}
      <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <span className="text-purple-600 mr-2">📍</span>
          Location & Category
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location *
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white/80 backdrop-blur-sm ${
                errors.location ? 'border-red-300' : 'border-gray-200'
              }`}
              placeholder="Enter event location..."
            />
            {errors.location && (
              <p className="text-red-600 text-sm mt-1">{errors.location}</p>
            )}
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              value={formData.category}
              onChange={(e) => handleInputChange('category', e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white/80 backdrop-blur-sm"
            >
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Settings */}
      <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <span className="text-orange-600 mr-2">⚙️</span>
          Event Settings
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Visibility */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Visibility
            </label>
            <select
              value={formData.visibility}
              onChange={(e) => handleInputChange('visibility', e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white/80 backdrop-blur-sm"
            >
              {visibilityOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              {visibilityOptions.find(opt => opt.value === formData.visibility)?.description}
            </p>
          </div>

          {/* Max Participants */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Maximum Participants
            </label>
            <input
              type="number"
              value={formData.maxCapacity}
              onChange={(e) => handleInputChange('maxCapacity', e.target.value)}
              min="1"
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white/80 backdrop-blur-sm ${
                errors.maxCapacity ? 'border-red-300' : 'border-gray-200'
              }`}
              placeholder="Leave empty for unlimited"
            />
            {errors.maxCapacity && (
              <p className="text-red-600 text-sm mt-1">{errors.maxCapacity}</p>
            )}
          </div>
        </div>

        {/* Active Status */}
        <div className="mt-6">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => handleInputChange('isActive', e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="ml-2 text-sm font-medium text-gray-700">
              Event is active and visible to participants
            </span>
          </label>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex gap-4 justify-end pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors duration-200 font-medium"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className={`px-8 py-3 rounded-xl font-medium transition-all duration-200 shadow-soft ${
            isSubmitting 
              ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
              : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white'
          }`}
        >
          {isSubmitting 
            ? (mode === 'create' ? 'Creating...' : 'Saving...') 
            : (mode === 'create' ? 'Create Event' : 'Save Changes')
          }
        </button>
      </div>
    </form>
  );
};

export default EventsPage;
