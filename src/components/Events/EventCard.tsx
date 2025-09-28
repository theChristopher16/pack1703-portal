import React, { useState } from 'react';
import { Calendar, MapPin, Clock, Users, Tent, MountainSnow, Heart, Share2, Download, ExternalLink, Edit, Trash2 } from 'lucide-react';
import WeatherForecastComponent from '../Weather/WeatherForecast';

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

interface EventCardProps {
  event: Event;
  onRSVP: (eventId: string) => void;
  onViewDetails: (eventId: string) => void;
  onAddToCalendar: (event: Event) => void;
  onShare: (event: Event) => void;
  onViewRSVPs?: (event: Event) => void;
  isAuthenticated?: boolean;
  isAdmin?: boolean;
  isDeleting?: boolean;
}

const EventCard: React.FC<EventCardProps> = ({ 
  event, 
  onRSVP, 
  onViewDetails, 
  onAddToCalendar, 
  onShare, 
  onViewRSVPs, 
  isAuthenticated = true, 
  isAdmin = false,
  isDeleting = false
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'camping': return <Tent className="w-4 h-4" />;
      case 'overnight': return <MountainSnow className="w-4 h-4" />;
      case 'service': return <Heart className="w-4 h-4" />;
      default: return <Users className="w-4 h-4" />;
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

  const getRSVPStatus = () => {
    const percentage = (event.currentRSVPs / event.maxCapacity) * 100;
    if (percentage >= 90) return { color: 'bg-red-500', text: 'Almost Full' };
    if (percentage >= 75) return { color: 'bg-yellow-500', text: 'Filling Up' };
    return { color: 'bg-green-500', text: 'Plenty of Space' };
  };

  const rsvpStatus = getRSVPStatus();

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-soft border border-white/50 overflow-hidden transition-all duration-300 hover:shadow-glow hover:-translate-y-1">
      {/* Header with Category Badge */}
      <div className="p-6 pb-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-2">
            {getCategoryIcon(event.category)}
            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getCategoryColor(event.category)}`}>
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
          
          {/* RSVP Status */}
          <div className="text-right">
            <div className="flex items-center space-x-2 mb-1">
              <div className={`w-3 h-3 rounded-full ${rsvpStatus.color}`}></div>
              <span className="text-xs text-gray-600">{rsvpStatus.text}</span>
            </div>
            <div className="text-sm text-gray-700">
              {event.currentRSVPs} / {event.maxCapacity} spots
            </div>
          </div>
        </div>

        {/* Event Title */}
        <h3 className="text-xl font-display font-bold text-gray-900 mb-3 group-hover:text-gradient transition-all duration-300">
          {event.title}
        </h3>

        {/* Date and Time */}
        <div className="flex items-center space-x-4 mb-4 text-sm text-gray-600">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-primary-500" />
            <span>{formatDate(event.date)}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-secondary-500" />
            <span>{formatTime(event.startTime)} - {formatTime(event.endTime)}</span>
          </div>
        </div>

        {/* Location */}
        <div className="flex items-start space-x-2 mb-4">
          <MapPin className="w-4 h-4 text-accent-500 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <div className="font-medium text-gray-900">{event.location.name}</div>
            <div className="text-sm text-gray-600">{event.location.address}</div>
            
            {/* Weather Forecast */}
            {event.location.coordinates && (
              <div className="mt-2">
                <WeatherForecastComponent
                  location={{
                    name: event.location.name,
                    coordinates: event.location.coordinates
                  }}
                  eventDate={new Date(event.date)}
                  className="text-xs"
                />
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        <p className="text-gray-700 mb-4 line-clamp-2">
          {event.description}
        </p>

        {/* Den Tags */}
        {event.denTags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {event.denTags.map((tag, index) => (
              <span 
                key={index}
                className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full border border-gray-200"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-6 pb-4 border-t border-gray-100">
          {/* Packing List */}
          {event.packingList && event.packingList.length > 0 && (
            <div className="mb-4">
              <h4 className="font-semibold text-gray-900 mb-2">Packing List</h4>
              <ul className="space-y-1">
                {event.packingList.map((item, index) => (
                  <li key={index} className="text-sm text-gray-600 flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-primary-400 rounded-full"></div>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Fees */}
          {event.fees && (
            <div className="mb-4">
              <h4 className="font-semibold text-gray-900 mb-2">Fees</h4>
              <p className="text-sm text-gray-600">${event.fees} per person</p>
            </div>
          )}

          {/* Attachments */}
          {event.attachments && event.attachments.length > 0 && (
            <div className="mb-4">
              <h4 className="font-semibold text-gray-900 mb-2">Attachments</h4>
              <div className="space-y-2">
                {event.attachments.map((attachment, index) => (
                  <a
                    key={index}
                    href={attachment.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 text-sm text-primary-600 hover:text-primary-700 transition-colors duration-200"
                  >
                    <Download className="w-4 h-4" />
                    <span>{attachment.name}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Weather Details */}
          {event.location.coordinates && (
            <div className="mb-4">
              <h4 className="font-semibold text-gray-900 mb-2">Weather Forecast</h4>
              <WeatherForecastComponent
                location={{
                  name: event.location.name,
                  coordinates: event.location.coordinates
                }}
                eventDate={new Date(event.date)}
                showDetails={true}
                className="text-sm"
              />
            </div>
          )}

          {/* Contact */}
          <div className="mb-4">
            <h4 className="font-semibold text-gray-900 mb-2">Contact</h4>
            <p className="text-sm text-gray-600">
              Questions? Contact: <span className="text-primary-600">{event.contactEmail}</span>
            </p>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="px-6 pb-6">
        <div className="flex flex-wrap gap-3">
          {/* Primary Actions */}
          <button
            onClick={() => onRSVP(event.id)}
            className={`flex-1 px-4 py-2 font-medium rounded-xl transition-all duration-200 transform hover:scale-105 ${
              isAuthenticated 
                ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:from-primary-600 hover:to-primary-700 shadow-glow-primary/50'
                : 'bg-gradient-to-r from-gray-400 to-gray-500 text-white hover:from-gray-500 hover:to-gray-600 shadow-glow-gray/50'
            }`}
          >
            {isAuthenticated ? 'RSVP Now' : 'Login to RSVP'}
          </button>
          
          <button
            onClick={() => {
              console.log('EventCard: View Details clicked for event ID:', event.id);
              console.log('EventCard: Full event object:', event);
              onViewDetails(event.id);
            }}
            className="px-4 py-2 bg-white border-2 border-primary-300 text-primary-600 font-medium rounded-xl hover:bg-primary-50 hover:border-primary-400 transition-all duration-200"
          >
            View Details
          </button>
        </div>

        {/* Secondary Actions */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => onAddToCalendar(event)}
              className="flex items-center space-x-2 text-sm text-gray-600 hover:text-primary-600 transition-colors duration-200"
            >
              <Calendar className="w-4 h-4" />
              <span>Add to Calendar</span>
            </button>
            
            <button
              onClick={() => onShare(event)}
              className="flex items-center space-x-2 text-sm text-gray-600 hover:text-primary-600 transition-colors duration-200"
            >
              <Share2 className="w-4 h-4" />
              <span>Share</span>
            </button>

            {/* Admin RSVP Viewer Button */}
            {isAdmin && onViewRSVPs && (
              <button
                onClick={() => onViewRSVPs(event)}
                className="flex items-center space-x-2 text-sm text-purple-600 hover:text-purple-700 transition-colors duration-200"
                title="View RSVPs (Admin Only)"
              >
                <Users className="w-4 h-4" />
                <span>View RSVPs</span>
              </button>
            )}

            {/* Admin Edit/Delete Buttons */}
            {isAdmin && (
              <>
                <button
                  onClick={() => {
                    // This will be handled by the parent component
                    const editEvent = new CustomEvent('editEvent', { detail: event });
                    window.dispatchEvent(editEvent);
                  }}
                  className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-700 transition-colors duration-200"
                  title="Edit Event (Admin Only)"
                >
                  <Edit className="w-4 h-4" />
                  <span>Edit</span>
                </button>
                
                <button
                  onClick={() => {
                    // This will be handled by the parent component
                    const deleteEvent = new CustomEvent('deleteEvent', { detail: event.id });
                    window.dispatchEvent(deleteEvent);
                  }}
                  className={`flex items-center space-x-2 text-sm transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                    isDeleting 
                      ? 'text-yellow-600 cursor-wait' 
                      : 'text-red-600 hover:text-red-700'
                  }`}
                  title={isDeleting ? "Deleting..." : "Delete Event (Admin Only)"}
                  disabled={isDeleting}
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{isDeleting ? 'Deleting...' : 'Delete'}</span>
                </button>
              </>
            )}
          </div>

          {/* Expand/Collapse */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors duration-200"
          >
            {isExpanded ? 'Show Less' : 'Show More'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EventCard;
