import React, { useState, useEffect } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { 
  Calendar, 
  MapPin, 
  Users, 
  Clock, 
  Tag, 
  Download, 
  Share2, 
  ArrowLeft,
  FileText,
  ExternalLink
} from 'lucide-react';
import { Event, Location } from '../types';
import { LoadingSpinner } from '../components/Loading';
import RSVPForm from '../components/Forms/RSVPForm';

const EventDetailPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [location, setLocation] = useState<Location | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'details' | 'rsvp' | 'map'>('details');
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const initialTab = searchParams.get('tab');
    if (initialTab === 'rsvp') {
      setActiveTab('rsvp');
    }
  }, [searchParams]);

  useEffect(() => {
    const loadEventData = async () => {
      console.log('EventDetailPage: Loading event data for ID:', eventId);
      
      if (!eventId) {
        console.log('EventDetailPage: No event ID provided');
        setIsLoading(false);
        return;
      }

      try {
        // Import Firebase functions
        const { doc, getDoc } = await import('firebase/firestore');
        const { db } = await import('../firebase/config');
        
        console.log('EventDetailPage: Fetching event from Firestore...');
        
        // Load event data
        const eventRef = doc(db, 'events', eventId);
        const eventSnap = await getDoc(eventRef);
        
        console.log('EventDetailPage: Event snapshot exists:', eventSnap.exists());
        
        if (eventSnap.exists()) {
          const eventData = { id: eventSnap.id, ...eventSnap.data() } as Event;
          console.log('EventDetailPage: Event data loaded:', eventData);
          setEvent(eventData);
          
          // Load location data if event has locationId
          if (eventData.locationId) {
            console.log('EventDetailPage: Loading location data for ID:', eventData.locationId);
            const locationRef = doc(db, 'locations', eventData.locationId);
            const locationSnap = await getDoc(locationRef);
            
            if (locationSnap.exists()) {
              const locationData = { id: locationSnap.id, ...locationSnap.data() } as Location;
              console.log('EventDetailPage: Location data loaded:', locationData);
              setLocation(locationData);
            } else {
              console.log('EventDetailPage: Location not found for ID:', eventData.locationId);
            }
          }
        } else {
          console.log('EventDetailPage: Event not found in Firestore for ID:', eventId);
        }
      } catch (error) {
        console.error('EventDetailPage: Error loading event:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadEventData();
  }, [eventId]);

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'TBD';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatTimeFromString = (timeString: string) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      pack: 'bg-blue-100 text-blue-800 border-blue-200',
      den: 'bg-green-100 text-green-800 border-green-200',
      campout: 'bg-orange-100 text-orange-800 border-orange-200',
      overnight: 'bg-purple-100 text-purple-800 border-purple-200',
      service: 'bg-red-100 text-red-800 border-red-200',
      meeting: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[category as keyof typeof colors] || colors.meeting;
  };

  const getCategoryIcon = (category: string) => {
    const icons = {
      pack: '🏕️',
      den: '🐺',
      campout: '🏔️',
      overnight: '🌙',
      service: '🤝',
      meeting: '📋'
    };
    return icons[category as keyof typeof icons] || icons.meeting;
  };

  const downloadICS = () => {
    if (!event) return;
    
    let startDate: Date;
    let endDate: Date;
    
    // Handle Firestore Timestamp or Date objects - use startDate/endDate fields
    if (event.startDate && typeof event.startDate === 'object' && 'toDate' in event.startDate) {
      startDate = event.startDate.toDate();
    } else if (event.startDate) {
      startDate = new Date(event.startDate as any);
    } else {
      startDate = new Date();
    }
    
    if (event.endDate && typeof event.endDate === 'object' && 'toDate' in event.endDate) {
      endDate = event.endDate.toDate();
    } else if (event.endDate) {
      endDate = new Date(event.endDate as any);
    } else {
      endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // Default to 1 hour later
    }
    
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Pack 1703//Event Calendar//EN',
      'BEGIN:VEVENT',
              `UID:${event.id}@sfpack1703.com`,
      `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
      `DTSTART:${startDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
      `DTEND:${endDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
      `SUMMARY:${event.title}`,
      `DESCRIPTION:${event.description}`,
      `LOCATION:${location?.name || 'TBD'}`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${event.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const shareEvent = async () => {
    if (navigator.share && event) {
      try {
        await navigator.share({
          title: event.title,
          text: event.description,
          url: window.location.href
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Event link copied to clipboard!');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <LoadingSpinner
              size="xl"
              text="Loading Event Details..."
              variant="primary"
            />
          </div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-surface py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-2xl font-display font-bold text-text mb-4">
              Event Not Found
            </h1>
            <p className="text-gray-600 mb-6">
              The event you're looking for doesn't exist or has been removed.
            </p>
            <Link
              to="/events"
              className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors duration-200"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Events
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <div className="mb-6">
          <Link
            to="/events"
            className="inline-flex items-center text-primary hover:text-primary/80 transition-colors duration-200"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Events
          </Link>
        </div>

        {/* Event Header */}
        <div className="bg-white rounded-xl shadow-soft border border-gray-200 p-6 mb-8">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <span className="text-4xl">{getCategoryIcon(event.category)}</span>
              <div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getCategoryColor(event.category)}`}>
                  {event.category.charAt(0).toUpperCase() + event.category.slice(1)}
                </span>
                {event.rsvpEnabled && (
                  <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full border border-green-200">
                    RSVP Open
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={downloadICS}
                className="inline-flex items-center px-3 py-2 bg-secondary text-white rounded-lg hover:bg-secondary/90 transition-colors duration-200"
              >
                <Download className="w-4 h-4 mr-2" />
                Add to Calendar
              </button>
              <button
                onClick={shareEvent}
                className="inline-flex items-center px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </button>
            </div>
          </div>

          <h1 className="text-3xl font-display font-bold text-text mb-4">
            {event.title}
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="flex items-center space-x-2 text-gray-600">
              <Calendar className="w-5 h-5" />
              <span>{formatDate(event.startDate)}</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-600">
              <Clock className="w-5 h-5" />
              <span>{formatTimeFromString(event.startTime)} - {formatTimeFromString(event.endTime)}</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-600">
              <MapPin className="w-5 h-5" />
              <span>{location?.name || 'Location TBD'}</span>
            </div>
            {event.capacity && (
              <div className="flex items-center space-x-2 text-gray-600">
                <Users className="w-5 h-5" />
                <span>Capacity: {event.capacity} families</span>
              </div>
            )}
          </div>

          {event.denTags && event.denTags.length > 0 && (
            <div className="flex items-center space-x-2">
              <Tag className="w-5 h-5 text-gray-600" />
              <div className="flex flex-wrap gap-2">
                {event.denTags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-accent/10 text-accent text-sm rounded-full border border-accent/20"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-soft border border-gray-200 mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'details', label: 'Details', icon: FileText },
                { id: 'rsvp', label: 'RSVP', icon: Users },
                { id: 'map', label: 'Map', icon: MapPin }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                      activeTab === tab.id
                        ? 'border-primary text-primary'
                        : 'border-transparent text-gray-600 hover:text-text hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4 inline mr-2" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'details' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-display font-semibold text-text mb-3">Description</h3>
                  <p className="text-gray-600 leading-relaxed">
                    {event.description}
                  </p>
                </div>

                {event.packingList && event.packingList.length > 0 && (
                  <div>
                    <h3 className="text-lg font-display font-semibold text-text mb-3">Packing List</h3>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {event.packingList.map((item, index) => (
                        <li key={index} className="flex items-center space-x-2 text-gray-600">
                          <span className="w-2 h-2 bg-primary rounded-full"></span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {event.attachments && event.attachments.length > 0 && (
                  <div>
                    <h3 className="text-lg font-display font-semibold text-text mb-3">Attachments</h3>
                    <div className="space-y-2">
                      {event.attachments.map((attachment, index) => (
                        <a
                          key={index}
                          href={attachment.url}
                          className="flex items-center space-x-2 text-primary hover:text-primary/80 transition-colors duration-200"
                        >
                          <FileText className="w-4 h-4" />
                          <span>{attachment.name}</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {location && (
                  <div>
                    <h3 className="text-lg font-display font-semibold text-text mb-3">Location Details</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium text-text mb-2">{location.name}</h4>
                      <p className="text-gray-600 mb-3">{location.address}</p>
                      {location.notesPublic && (
                        <p className="text-gray-600 text-sm">{location.notesPublic}</p>
                      )}
                      {location.parking?.text && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <h5 className="font-medium text-text text-sm mb-1">Parking</h5>
                          <p className="text-gray-600 text-sm">{location.parking.text}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'rsvp' && (
              <RSVPForm 
                eventId={event?.id || ''}
                eventTitle={event?.title || ''}
                eventDate={event?.startDate ? formatDate(event.startDate) : ''}
                maxCapacity={event?.capacity || undefined}
                currentRSVPs={0} // TODO: Get actual RSVP count from Firestore
              />
            )}

            {activeTab === 'map' && (
              <div className="text-center py-12">
                <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-display font-semibold text-text mb-2">Interactive Map</h3>
                <p className="text-gray-600 mb-6">
                  Map integration coming soon! This will show the event location with directions.
                </p>
                <div className="bg-gray-50 rounded-lg p-4 max-w-md mx-auto">
                  <p className="text-sm text-gray-600">
                    Features planned:
                  </p>
                  <ul className="text-sm text-gray-600 mt-2 space-y-1">
                    <li>• Interactive map with location pin</li>
                    <li>• Directions from your location</li>
                    <li>• Parking information overlay</li>
                    <li>• Mobile-friendly navigation</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetailPage;
