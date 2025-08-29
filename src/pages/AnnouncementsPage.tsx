import React, { useState, useEffect } from 'react';
import { Bell, Pin, Calendar, Filter, Search, Plus, Clock, User, Tag, MessageSquare, TrendingUp, Star } from 'lucide-react';
import { firestoreService } from '../services/firestore';
import { AnnouncementCard, AnnouncementFeed } from '../components/Announcements';
import { Announcement } from '../types/firestore';

const AnnouncementsPage: React.FC = () => {
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        setLoading(true);
        const fetchedAnnouncements = await firestoreService.getAnnouncements();
        setAnnouncements(fetchedAnnouncements);
      } catch (err) {
        setError('Failed to fetch announcements.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnnouncements();
    const interval = setInterval(fetchAnnouncements, 30000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const handleAnnouncementClick = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
  };

  const handlePinToggle = (announcementId: string, pinned: boolean) => {
    // In a real app, this would update the database
    console.log(`Toggling pin for announcement ${announcementId} to ${pinned}`);
  };

  const pinnedCount = announcements.filter(a => a.pinned).length;
  const recentCount = announcements.filter(a => {
    const date = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt as any);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    return diffInDays <= 7;
  }).length;

  if (loading && announcements.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-primary-50/30 to-secondary-50/30 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Loading Announcements...</h2>
          <p className="text-gray-600">Please wait while we fetch the latest updates.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-primary-50/30 to-secondary-50/30 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Error: {error}</h2>
          <p className="text-gray-600">Failed to load announcements. Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-primary-50/30 to-secondary-50/30 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-primary-100 to-secondary-100 text-primary-700 rounded-full text-sm font-medium mb-6">
            <Bell className="w-4 h-4 mr-2" />
            Stay Updated
          </div>
          
          <h1 className="text-4xl md:text-6xl font-display font-bold mb-6 text-gray-900">
            <span className="text-gradient">Pack 1703</span> Announcements
          </h1>
          
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Stay connected with the latest news, updates, and important information from pack leadership. 
            Never miss an important announcement or exciting opportunity!
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="text-center p-6 bg-white/90 backdrop-blur-sm rounded-2xl border border-white/50">
            <MessageSquare className="w-8 h-8 text-primary-500 mx-auto mb-3" />
            <div className="text-2xl font-bold text-gray-900">{announcements.length}</div>
            <div className="text-sm text-gray-600">Total Announcements</div>
          </div>
          
          <div className="text-center p-6 bg-white/90 backdrop-blur-sm rounded-2xl border border-white/50">
            <Pin className="w-8 h-8 text-primary-500 mx-auto mb-3" />
            <div className="text-2xl font-bold text-gray-900">{pinnedCount}</div>
            <div className="text-sm text-gray-600">Pinned</div>
          </div>
          
          <div className="text-center p-6 bg-white/90 backdrop-blur-sm rounded-2xl border border-white/50">
            <TrendingUp className="w-8 h-8 text-secondary-500 mx-auto mb-3" />
            <div className="text-2xl font-bold text-gray-900">{recentCount}</div>
            <div className="text-sm text-gray-600">This Week</div>
          </div>
          
          <div className="text-center p-6 bg-white/90 backdrop-blur-sm rounded-2xl border border-white/50">
            <Star className="w-8 h-8 text-accent-500 mx-auto mb-3" />
            <div className="text-2xl font-bold text-gray-900">
              {announcements.filter(a => a.eventId).length}
            </div>
            <div className="text-sm text-gray-600">Event Related</div>
          </div>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Feed */}
          <div className="lg:col-span-2">
            <AnnouncementFeed
              announcements={announcements}
              onAnnouncementClick={handleAnnouncementClick}
              onPinToggle={handlePinToggle}
              showFilters={true}
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Pinned Announcements */}
            {pinnedCount > 0 && (
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-soft">
                <h3 className="text-lg font-display font-semibold text-gray-900 mb-4 flex items-center">
                  <Pin className="w-5 h-5 text-primary-500 mr-2" />
                  Pinned Announcements
                </h3>
                <div className="space-y-3">
                  {announcements
                    .filter(a => a.pinned)
                    .map((announcement) => (
                      <div
                        key={announcement.id}
                        className="p-3 bg-primary-50 rounded-lg border border-primary-200 cursor-pointer hover:bg-primary-100 transition-colors duration-200"
                        onClick={() => handleAnnouncementClick(announcement)}
                      >
                        <h4 className="font-medium text-primary-700 text-sm mb-1">
                          {announcement.title}
                        </h4>
                        <p className="text-primary-600 text-xs line-clamp-2">
                          {announcement.body}
                        </p>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-soft">
              <h3 className="text-lg font-display font-semibold text-gray-900 mb-4">
                Quick Actions
              </h3>
              <div className="space-y-3">
                <button className="w-full flex items-center justify-center px-4 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-medium rounded-xl hover:from-primary-600 hover:to-secondary-600 transition-all duration-200 transform hover:scale-105">
                  <Bell className="w-4 h-4 mr-2" />
                  Subscribe to Updates
                </button>
                <button className="w-full flex items-center justify-center px-4 py-3 border-2 border-primary-300 text-primary-600 font-medium rounded-xl hover:bg-primary-50 transition-all duration-200">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Contact Leadership
                </button>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-soft">
              <h3 className="text-lg font-display font-semibold text-gray-900 mb-4 flex items-center">
                <Clock className="w-5 h-5 text-accent-500 mr-2" />
                Recent Activity
              </h3>
              <div className="space-y-2 text-sm text-gray-600">
                {announcements
                  .slice(0, 5)
                  .map((announcement) => (
                    <div key={announcement.id} className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-accent-400 rounded-full"></div>
                      <span className="truncate">{announcement.title}</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>

        {/* Selected Announcement Detail */}
        {selectedAnnouncement && (
          <div className="mt-8 animate-slide-up">
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-soft">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-display font-semibold text-gray-900">
                  Announcement Details
                </h3>
                <button
                  onClick={() => setSelectedAnnouncement(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                >
                  ✕
                </button>
              </div>
              <AnnouncementCard
                announcement={selectedAnnouncement}
                onAnnouncementClick={handleAnnouncementClick}
                onPinToggle={handlePinToggle}
                showFullContent={true}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnnouncementsPage;
