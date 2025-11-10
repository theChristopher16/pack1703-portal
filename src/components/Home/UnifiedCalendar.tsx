import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, CalendarRange, MapPin, Users } from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';
import authService from '../../services/authService';
import { useToast } from '../../contexts/ToastContext';

interface AggregatedEvent {
  id: string;
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  location?: string;
  source: string; // Organization name or 'Home'
  sourceType: 'organization' | 'home';
  organizationId?: string;
  organizationName?: string;
}

const UnifiedCalendar: React.FC = () => {
  const [events, setEvents] = useState<AggregatedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const { showError } = useToast();

  useEffect(() => {
    loadAllEvents();
  }, [currentMonth]);

  /**
   * Load events from ALL user's organizations + home events
   * This implements the one-way data flow:
   * - Org events flow TO home
   * - Home events stay IN home only
   */
  const loadAllEvents = async () => {
    try {
      setLoading(true);
      const user = authService.getCurrentUser();
      if (!user) throw new Error('User not authenticated');

      const allEvents: AggregatedEvent[] = [];
      const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

      // 1. Load events from ALL organizations the user belongs to
      // First, get user's organizations from crossOrganizationUsers collection
      const crossOrgQuery = query(
        collection(db, 'crossOrganizationUsers'),
        where('userId', '==', user.uid)
      );
      const crossOrgSnapshot = await getDocs(crossOrgQuery);
      const userOrgs = crossOrgSnapshot.docs.map((doc) => doc.data());

      // Load events from each organization
      for (const org of userOrgs) {
        try {
          const eventsQuery = query(
            collection(db, 'events'),
            where('organizationId', '==', org.organizationId),
            where('startDate', '>=', monthStart),
            where('startDate', '<=', monthEnd)
          );
          
          const snapshot = await getDocs(eventsQuery);
          snapshot.docs.forEach((doc) => {
            const data = doc.data();
            allEvents.push({
              id: doc.id,
              title: data.title,
              description: data.description,
              startDate: data.startDate?.toDate(),
              endDate: data.endDate?.toDate(),
              location: data.location?.name || data.location,
              source: org.organizationName,
              sourceType: 'organization',
              organizationId: org.organizationId,
              organizationName: org.organizationName,
            });
          });
        } catch (error) {
          console.warn(`Failed to load events from ${org.organizationName}:`, error);
        }
      }

      // 2. Load HOME events (meal plans, family calendar events, etc.)
      // These will NOT appear in organization calendars - one-way flow
      try {
        // Load meal plans as events
        const mealPlansQuery = query(
          collection(db, 'mealPlans'),
          where('userId', '==', user.uid),
          where('date', '>=', monthStart),
          where('date', '<=', monthEnd)
        );
        const mealPlansSnapshot = await getDocs(mealPlansQuery);
        mealPlansSnapshot.docs.forEach((doc) => {
          const data = doc.data();
          const date = data.date?.toDate();
          allEvents.push({
            id: doc.id,
            title: `${data.mealType}: ${data.recipeName || data.customMeal}`,
            description: data.notes,
            startDate: date,
            endDate: date,
            source: 'Home - Meal Plan',
            sourceType: 'home',
          });
        });

        // Load family calendar events
        const familyEventsQuery = query(
          collection(db, 'familyEvents'),
          where('userId', '==', user.uid),
          where('startTime', '>=', monthStart),
          where('startTime', '<=', monthEnd)
        );
        const familyEventsSnapshot = await getDocs(familyEventsQuery);
        familyEventsSnapshot.docs.forEach((doc) => {
          const data = doc.data();
          allEvents.push({
            id: doc.id,
            title: data.title,
            description: data.description,
            startDate: data.startTime?.toDate(),
            endDate: data.endTime?.toDate(),
            location: data.location,
            source: 'Home - Family',
            sourceType: 'home',
          });
        });
      } catch (error) {
        console.warn('Failed to load home events:', error);
      }

      // Sort by date
      allEvents.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
      setEvents(allEvents);
    } catch (error: any) {
      showError('Failed to load events', error.message);
    } finally {
      setLoading(false);
    }
  };

  const sources = Array.from(new Set(events.map((e) => e.source)));
  const filteredEvents = selectedSource === 'all'
    ? events
    : events.filter((e) => e.source === selectedSource);

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <button onClick={goToPreviousMonth} className="p-2 hover:bg-gray-100 rounded">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-800">
                {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h2>
            </div>
            <button onClick={goToNextMonth} className="p-2 hover:bg-gray-100 rounded">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="flex gap-2">
            <select
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Sources</option>
              {sources.map((source) => (
                <option key={source} value={source}>
                  {source}
                </option>
              ))}
            </select>
            <button
              onClick={goToToday}
              className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-lg"
            >
              Today
            </button>
          </div>
        </div>
      </div>

      {/* Events List */}
      {filteredEvents.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <CalendarRange className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No events this month</h3>
          <p className="text-gray-500">Events from all your organizations will appear here</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="divide-y divide-gray-200">
            {filteredEvents.map((event) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-6 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-lg text-gray-800">{event.title}</h3>
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium ${
                          event.sourceType === 'organization'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {event.source}
                      </span>
                    </div>

                    {event.description && (
                      <p className="text-gray-600 text-sm mb-2">{event.description}</p>
                    )}

                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <CalendarRange className="w-4 h-4" />
                        <span>
                          {event.startDate.toLocaleDateString()}
                          {event.endDate &&
                            event.endDate.toDateString() !== event.startDate.toDateString() &&
                            ` - ${event.endDate.toLocaleDateString()}`}
                        </span>
                      </div>

                      {event.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          <span>{event.location}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default UnifiedCalendar;

