import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Clock, Users, Download, Share2, ArrowLeft, Phone, Mail, ExternalLink, Tent, MountainSnow, Heart } from 'lucide-react';
import { RSVPForm } from '../Forms';

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
    parkingNotes?: string;
    gateCode?: string;
    isPublicNote: boolean;
  };
  category: 'pack-wide' | 'den' | 'camping' | 'overnight' | 'service';
  denTags: string[];
  maxCapacity: number;
  currentRSVPs: number;
  description: string;
  packingList?: string[];
  fees?: number;
  contactEmail: string;
  contactPhone?: string;
  isOvernight: boolean;
  requiresPermission: boolean;
  attachments?: Array<{
    name: string;
    url: string;
    type: 'pdf' | 'image';
  }>;
}

const EventDetailPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showRSVPForm, setShowRSVPForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'map' | 'rsvp'>('details');

  // Mock event data - in production this would come from Firebase
  useEffect(() => {
    const loadEvent = async () => {
      setIsLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock event data
      const mockEvent: Event = {
        id: eventId || 'event-001',
        title: 'Pack 1703 Fall Campout',
        date: '2024-10-15',
        startTime: '14:00',
        endTime: '16:00',
        location: {
          name: 'Camp Wokanda',
          address: '1234 Scout Road, Peoria, IL 61614',
          coordinates: { lat: 40.7103, lng: -89.6144 },
          parkingNotes: 'Park in main lot, follow signs to Pack 1703 area',
          gateCode: '1703',
          isPublicNote: true
        },
        category: 'camping',
        denTags: ['Lions', 'Tigers', 'Wolves', 'Bears', 'Webelos', 'AOL'],
        maxCapacity: 50,
        currentRSVPs: 23,
        description: 'Join us for our annual fall campout! This is a great opportunity for families to bond, learn outdoor skills, and enjoy nature together. We\'ll have activities for all ages including hiking, crafts, campfire songs, and more.',
        packingList: [
          'Tent and sleeping bags',
          'Warm clothing and rain gear',
          'Personal hygiene items',
          'Flashlight or headlamp',
          'Water bottle',
          'Comfortable hiking shoes',
          'Camp chair (optional)',
          'Personal medications'
        ],
        fees: 15,
        contactEmail: 'cubmaster@sfpack1703.com',
        contactPhone: '(555) 123-4567',
        isOvernight: true,
        requiresPermission: true,
        attachments: [
          {
            name: 'Campout Information Packet',
            url: '/documents/campout-info.pdf',
            type: 'pdf'
          },
          {
            name: 'Packing List',
            url: '/documents/packing-list.pdf',
            type: 'pdf'
          }
        ]
      };
      
      setEvent(mockEvent);
      setIsLoading(false);
    };

    if (eventId) {
      loadEvent();
    }
  }, [eventId]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'camping': return <Tent className="w-5 h-5" />;
      case 'overnight': return <MountainSnow className="w-5 h-5" />;
      case 'service': return <Heart className="w-5 h-5" />;
      default: return <Users className="w-5 h-5" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'camping': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'overnight': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'service': return 'bg-green-100 text-green-700 border-green-200';
      case 'den': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-primary-100 text-primary-700 border-primary-200';
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

  const generateICS = () => {
    if (!event) return;
    
    const startDate = new Date(`${event.date}T${event.startTime}`);
    const endDate = new Date(`${event.date}T${event.endTime}`);
    
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

  const shareEvent = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: event?.title || 'Pack 1703 Event',
          text: `Check out this event: ${event?.title}`,
          url: window.location.href
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Event URL copied to clipboard!');
    }
  };

  const getDirections = () => {
    if (!event?.location.coordinates) return;
    
    const { lat, lng } = event.location.coordinates;
    const address = encodeURIComponent(event.location.address);
    
    // Try to open in default map app, fallback to Google Maps
    if (navigator.userAgent.includes('iPhone') || navigator.userAgent.includes('iPad')) {
      window.open(`maps://maps.apple.com/?q=${address}&ll=${lat},${lng}`);
    } else {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-primary-50/30 to-secondary-50/30 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading event details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-primary-50/30 to-secondary-50/30 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Event Not Found</h1>
            <p className="text-gray-600 mb-6">The event you're looking for doesn't exist or has been removed.</p>
            <button
              onClick={() => navigate('/events')}
              className="px-6 py-3 bg-primary-500 text-white font-medium rounded-lg hover:bg-primary-600 transition-colors duration-200"
            >
              Back to Events
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-primary-50/30 to-secondary-50/30 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/events')}
            className="flex items-center space-x-2 text-primary-600 hover:text-primary-700 transition-colors duration-200 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Events</span>
          </button>
          
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-4">
                {getCategoryIcon(event.category)}
                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getCategoryColor(event.category)}`}>
                  {getCategoryLabel(event.category)}
                </span>
                {event.isOvernight && (
                  <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full border border-purple-200">
                    Overnight
                  </span>
                )}
                {event.requiresPermission && (
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full border border-yellow-200">
                    Permission Required
                  </span>
                )}
              </div>
              
              <h1 className="text-4xl md:text-5xl font-display font-bold text-gray-900 mb-4">
                {event.title}
              </h1>
              
              <div className="flex flex-wrap items-center gap-6 text-gray-600">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5 text-primary-500" />
                  <span>{formatDate(event.date)}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-secondary-500" />
                  <span>{formatTime(event.startTime)} - {formatTime(event.endTime)}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="w-5 h-5 text-accent-500" />
                  <span>{event.currentRSVPs} / {event.maxCapacity} spots</span>
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-col space-y-3 ml-6">
              <button
                onClick={() => setShowRSVPForm(true)}
                className="px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-medium rounded-xl hover:from-primary-600 hover:to-primary-700 transition-all duration-200 transform hover:scale-105 shadow-glow-primary/50"
              >
                RSVP Now
              </button>
              
              <button
                onClick={generateICS}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Add to Calendar</span>
              </button>
              
              <button
                onClick={shareEvent}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 flex items-center space-x-2"
              >
                <Share2 className="w-4 h-4" />
                <span>Share</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 mb-8">
          {(['details', 'map', 'rsvp'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 font-medium border-b-2 transition-colors duration-200 ${
                activeTab === tab
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-soft border border-white/50 p-8">
          {activeTab === 'details' && (
            <div className="space-y-8">
              {/* Description */}
              <div>
                <h2 className="text-2xl font-display font-bold text-gray-900 mb-4">About This Event</h2>
                <p className="text-gray-700 leading-relaxed">{event.description}</p>
              </div>

              {/* Location */}
              <div>
                <h2 className="text-2xl font-display font-bold text-gray-900 mb-4">Location</h2>
                <div className="bg-gray-50 rounded-lg p-6">
                  <div className="flex items-start space-x-4">
                    <MapPin className="w-6 h-6 text-accent-500 mt-1 flex-shrink-0" />
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">{event.location.name}</h3>
                      <p className="text-gray-700 mb-3">{event.location.address}</p>
                      
                      {event.location.parkingNotes && (
                        <div className="mb-3">
                          <h4 className="font-medium text-gray-900 mb-1">Parking</h4>
                          <p className="text-gray-600">{event.location.parkingNotes}</p>
                        </div>
                      )}
                      
                      {event.location.gateCode && event.location.isPublicNote && (
                        <div className="mb-3">
                          <h4 className="font-medium text-gray-900 mb-1">Gate Code</h4>
                          <p className="text-gray-600">{event.location.gateCode}</p>
                        </div>
                      )}
                      
                      <button
                        onClick={getDirections}
                        className="inline-flex items-center space-x-2 text-primary-600 hover:text-primary-700 transition-colors duration-200"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span>Get Directions</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Packing List */}
              {event.packingList && event.packingList.length > 0 && (
                <div>
                  <h2 className="text-2xl font-display font-bold text-gray-900 mb-4">What to Bring</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {event.packingList.map((item, index) => (
                      <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-2 h-2 bg-primary-400 rounded-full"></div>
                        <span className="text-gray-700">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Fees */}
              {event.fees && (
                <div>
                  <h2 className="text-2xl font-display font-bold text-gray-900 mb-4">Fees</h2>
                  <div className="bg-gray-50 rounded-lg p-6">
                    <p className="text-2xl font-bold text-primary-600">${event.fees} per person</p>
                    <p className="text-gray-600 mt-2">Payment will be collected at the event</p>
                  </div>
                </div>
              )}

              {/* Attachments */}
              {event.attachments && event.attachments.length > 0 && (
                <div>
                  <h2 className="text-2xl font-display font-bold text-gray-900 mb-4">Documents & Resources</h2>
                  <div className="space-y-3">
                    {event.attachments.map((attachment, index) => (
                      <a
                        key={index}
                        href={attachment.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                      >
                        <Download className="w-5 h-5 text-primary-500" />
                        <span className="text-gray-700 font-medium">{attachment.name}</span>
                        <ExternalLink className="w-4 h-4 text-gray-400" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Contact */}
              <div>
                <h2 className="text-2xl font-display font-bold text-gray-900 mb-4">Contact & Questions</h2>
                <div className="bg-gray-50 rounded-lg p-6">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <Mail className="w-5 h-5 text-primary-500" />
                      <span className="text-gray-700">{event.contactEmail}</span>
                    </div>
                    {event.contactPhone && (
                      <div className="flex items-center space-x-3">
                        <Phone className="w-5 h-5 text-primary-500" />
                        <span className="text-gray-700">{event.contactPhone}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'map' && (
            <div>
              <h2 className="text-2xl font-display font-bold text-gray-900 mb-4">Location Map</h2>
              <div className="bg-gray-100 rounded-lg p-8 text-center">
                <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">Interactive map would be rendered here</p>
                <p className="text-sm text-gray-500">
                  Coordinates: {event.location.coordinates?.lat}, {event.location.coordinates?.lng}
                </p>
              </div>
            </div>
          )}

          {activeTab === 'rsvp' && (
            <div>
              <h2 className="text-2xl font-display font-bold text-gray-900 mb-4">RSVP for This Event</h2>
              {showRSVPForm ? (
                <RSVPForm
                  eventId={event.id}
                  eventTitle={event.title}
                  eventDate={event.date}
                  maxCapacity={event.maxCapacity}
                  currentRSVPs={event.currentRSVPs}
                  onSuccess={() => {
                    setShowRSVPForm(false);
                    // Refresh event data to show updated RSVP count
                  }}
                />
              ) : (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to RSVP?</h3>
                  <p className="text-gray-600 mb-6">
                    Let us know if you're coming to this event!
                  </p>
                  <button
                    onClick={() => setShowRSVPForm(true)}
                    className="px-6 py-3 bg-primary-500 text-white font-medium rounded-lg hover:bg-primary-600 transition-colors duration-200"
                  >
                    RSVP Now
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventDetailPage;
