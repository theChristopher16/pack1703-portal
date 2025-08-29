import React, { useState, useMemo } from 'react';
import { Pin, Filter, Clock, Star, MessageSquare } from 'lucide-react';
import AnnouncementCard from './AnnouncementCard';
import { Announcement } from '../../types/firestore';

interface AnnouncementFeedProps {
  announcements: Announcement[];
  onAnnouncementClick?: (announcement: Announcement) => void;
  onPinToggle?: (announcementId: string, pinned: boolean) => void;
  showFilters?: boolean;
  className?: string;
}

interface FilterState {
  showPinnedOnly: boolean;
  showEventRelated: boolean;
  search: string;
}

const AnnouncementFeed: React.FC<AnnouncementFeedProps> = ({
  announcements,
  onAnnouncementClick,
  onPinToggle,
  showFilters = true,
  className = ''
}) => {
  const [filters, setFilters] = useState<FilterState>({
    showPinnedOnly: false,
    showEventRelated: false,
    search: ''
  });

  const [isFiltersExpanded, setIsFiltersExpanded] = useState(false);

  // Apply filters and sort announcements
  const filteredAndSortedAnnouncements = useMemo(() => {
    let filtered = announcements.filter(announcement => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch = 
          announcement.title.toLowerCase().includes(searchLower) ||
          announcement.body.toLowerCase().includes(searchLower);
        
        if (!matchesSearch) return false;
      }

      // Pinned only filter
      if (filters.showPinnedOnly && !announcement.pinned) {
        return false;
      }

      // Event related filter
      if (filters.showEventRelated && !announcement.eventId) {
        return false;
      }

      return true;
    });

    // Sort: pinned first, then by creation date (newest first)
    return filtered.sort((a, b) => {
      // Pinned announcements first
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      
      // Then by creation date (newest first)
      const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt as any);
      const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt as any);
      return dateB.getTime() - dateA.getTime();
    });
  }, [announcements, filters]);

  const handleFilterChange = (key: keyof FilterState, value: string | boolean) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      showPinnedOnly: false,
      showEventRelated: false,
      search: ''
    });
  };

  const hasActiveFilters = Object.values(filters).some(value => 
    value !== '' && value !== false
  );

  const pinnedCount = announcements.filter(a => a.pinned).length;
  const eventRelatedCount = announcements.filter(a => a.eventId).length;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Filters */}
      {showFilters && (
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-soft">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-display font-semibold text-gray-900">
              Filter Announcements
            </h3>
            <button
              onClick={() => setIsFiltersExpanded(!isFiltersExpanded)}
              className="flex items-center space-x-2 px-3 py-2 text-primary-600 hover:bg-primary-50 rounded-xl transition-colors duration-200"
            >
              <Filter className="w-4 h-4" />
              <span className="text-sm font-medium">
                {isFiltersExpanded ? 'Hide' : 'Show'} Filters
              </span>
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative mb-6">
            <MessageSquare className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search announcements by title or content..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl bg-white text-gray-900 placeholder-gray-400 focus:border-primary-400 focus:ring-4 focus:ring-primary-100 transition-all duration-300"
            />
          </div>

          {/* Expanded Filters */}
          {isFiltersExpanded && (
            <div className="space-y-4 animate-slide-down">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Pinned Only */}
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.showPinnedOnly}
                    onChange={(e) => handleFilterChange('showPinnedOnly', e.target.checked)}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500 focus:ring-2"
                  />
                  <div className="flex items-center space-x-2">
                    <Pin className="w-4 h-4 text-primary-500" />
                    <span className="text-sm font-medium text-gray-900">
                      Pinned Only ({pinnedCount})
                    </span>
                  </div>
                </label>

                {/* Event Related */}
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.showEventRelated}
                    onChange={(e) => handleFilterChange('showEventRelated', e.target.checked)}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500 focus:ring-2"
                  />
                  <div className="flex items-center space-x-2">
                    <Star className="w-4 h-4 text-accent-500" />
                    <span className="text-sm font-medium text-gray-900">
                      Event Related ({eventRelatedCount})
                    </span>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Results Summary */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <div className="text-sm text-gray-600">
              Showing <span className="font-semibold text-gray-900">{filteredAndSortedAnnouncements.length}</span> of{' '}
              <span className="font-semibold text-gray-900">{announcements.length}</span> announcements
            </div>
            
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-all duration-200"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
      )}

      {/* Announcements List */}
      <div className="space-y-4">
        {filteredAndSortedAnnouncements.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-500 mb-2">No announcements found</h3>
            <p className="text-gray-400">
              {hasActiveFilters 
                ? 'Try adjusting your filters or search terms.'
                : 'Check back later for updates from pack leadership.'
              }
            </p>
          </div>
        ) : (
          filteredAndSortedAnnouncements.map((announcement) => (
            <AnnouncementCard
              key={announcement.id}
              announcement={announcement}
              onAnnouncementClick={onAnnouncementClick}
              onPinToggle={onPinToggle}
              showFullContent={false}
            />
          ))
        )}
      </div>

      {/* Last Updated Banner */}
      {announcements.length > 0 && (
        <div className="text-center py-4">
          <div className="inline-flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-600 rounded-full text-sm">
            <Clock className="w-4 h-4" />
            <span>
              Last updated: {(() => {
                const latestUpdate = Math.max(
                  ...announcements.map(a => {
                    const timestamp = a.updatedAt?.toDate ? a.updatedAt.toDate() : new Date(a.updatedAt as any);
                    return timestamp.getTime();
                  })
                );
                const date = new Date(latestUpdate);
                return date.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                });
              })()}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnnouncementFeed;
