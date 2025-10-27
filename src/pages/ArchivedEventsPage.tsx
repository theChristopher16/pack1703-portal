import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Archive, ArrowLeft, Calendar, MapPin, Users, FileText } from 'lucide-react';
import { useAdmin } from '../contexts/AdminContext';
import { getArchivedEvents } from '../services/archivedEventsService';

interface ArchivedEvent {
  id: string;
  title: string;
  description: string;
  startDate: any;
  endDate: any;
  category: string;
  locationId?: string;
  location?: string;
  capacity?: number;
  currentParticipants?: number;
  isArchived?: boolean;
  archivedAt?: any;
  archivedBy?: string;
  scoutingYear?: string;
}

const ArchivedEventsPage: React.FC = () => {
  const navigate = useNavigate();
  const { hasRole, addNotification } = useAdmin();
  const [archivedEventsByYear, setArchivedEventsByYear] = useState<Record<string, ArchivedEvent[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [expandedYears, setExpandedYears] = useState<Set<string>>(new Set());

  // Check if user can view archived events (parent role and above)
  const canViewArchived = hasRole('parent') || hasRole('content-admin') || hasRole('super-admin') || hasRole('root');

  useEffect(() => {
    if (!canViewArchived) {
      addNotification('error', 'Access Denied', 'You do not have permission to view archived events.');
      navigate('/events');
      return;
    }

    loadArchivedEvents();
  }, [canViewArchived, navigate, addNotification]);

  const loadArchivedEvents = async () => {
    try {
      setIsLoading(true);
      const events = await getArchivedEvents();
      setArchivedEventsByYear(events);
      
      // Expand all years by default
      const years = Object.keys(events);
      setExpandedYears(new Set(years));
    } catch (error) {
      console.error('Error loading archived events:', error);
      addNotification('error', 'Failed to Load', 'Could not load archived events.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleYear = (year: string) => {
    setExpandedYears(prev => {
      const newSet = new Set(prev);
      if (newSet.has(year)) {
        newSet.delete(year);
      } else {
        newSet.add(year);
      }
      return newSet;
    });
  };

  const formatDate = (date: any): string => {
    if (!date) return 'Unknown';
    try {
      const d = date.toDate ? date.toDate() : new Date(date);
      return d.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch {
      return 'Unknown';
    }
  };

  const getCategoryColor = (category: string): string => {
    const colors: Record<string, string> = {
      'pack': 'bg-blue-100 text-blue-800',
      'den': 'bg-purple-100 text-purple-800',
      'campout': 'bg-green-100 text-green-800',
      'overnight': 'bg-indigo-100 text-indigo-800',
      'service': 'bg-orange-100 text-orange-800',
      'meeting': 'bg-gray-100 text-gray-800',
      'elective': 'bg-yellow-100 text-yellow-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const years = Object.keys(archivedEventsByYear).sort((a, b) => b.localeCompare(a));

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-fog via-forest-50/30 to-solar-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-forest-600 mx-auto mb-4"></div>
          <p className="text-forest-600 font-medium">Loading archived events...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-fog via-forest-50/30 to-solar-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/events')}
            className="inline-flex items-center gap-2 text-forest-600 hover:text-forest-700 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Events
          </button>
          
          <div className="flex items-center gap-3 mb-2">
            <Archive className="w-8 h-8 text-forest-600" />
            <h1 className="text-4xl font-solarpunk-display font-bold text-forest-800">
              Archived Events
            </h1>
          </div>
          <p className="text-forest-600">
            View past events organized by scouting year
          </p>
        </div>

        {years.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-12 text-center border border-forest-200/30">
            <Archive className="w-16 h-16 text-forest-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-forest-800 mb-2">No Archived Events</h3>
            <p className="text-forest-600">There are no archived events yet.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {years.map(year => (
              <div key={year} className="bg-white/80 backdrop-blur-sm rounded-2xl border border-forest-200/30 overflow-hidden">
                {/* Year Header */}
                <button
                  onClick={() => toggleYear(year)}
                  className="w-full flex items-center justify-between p-6 hover:bg-forest-50/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Calendar className="w-6 h-6 text-forest-600" />
                    <h2 className="text-2xl font-solarpunk-display font-bold text-forest-800">
                      Scouting Year {year}
                    </h2>
                    <span className="px-3 py-1 bg-forest-100 text-forest-700 rounded-full text-sm font-medium">
                      {archivedEventsByYear[year].length} {archivedEventsByYear[year].length === 1 ? 'event' : 'events'}
                    </span>
                  </div>
                  <div className={`w-6 h-6 transition-transform ${expandedYears.has(year) ? 'rotate-180' : ''}`}>
                    <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {/* Events List */}
                {expandedYears.has(year) && (
                  <div className="px-6 pb-6 space-y-4">
                    {archivedEventsByYear[year].map((event) => (
                      <div
                        key={event.id}
                        className="bg-white rounded-xl p-6 border border-forest-100 hover:border-forest-200 hover:shadow-md transition-all"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-forest-800 mb-2">
                              {event.title}
                            </h3>
                            <div className="flex flex-wrap items-center gap-3 text-sm text-forest-600">
                              <span className="inline-flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {formatDate(event.startDate)}
                              </span>
                              {event.location && (
                                <span className="inline-flex items-center gap-1">
                                  <MapPin className="w-4 h-4" />
                                  {event.location}
                                </span>
                              )}
                              {event.currentParticipants !== undefined && (
                                <span className="inline-flex items-center gap-1">
                                  <Users className="w-4 h-4" />
                                  {event.currentParticipants} participants
                                </span>
                              )}
                            </div>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getCategoryColor(event.category)}`}>
                            {event.category}
                          </span>
                        </div>
                        
                        {event.description && (
                          <p className="text-forest-600 text-sm line-clamp-2">
                            {event.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ArchivedEventsPage;
