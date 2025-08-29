import React, { useState } from 'react';
import { Pin, Clock, FileText, Image, Link, Share2, MessageSquare, Eye } from 'lucide-react';
import { Announcement } from '../../types/firestore';

interface AnnouncementCardProps {
  announcement: Announcement;
  onAnnouncementClick?: (announcement: Announcement) => void;
  onPinToggle?: (announcementId: string, pinned: boolean) => void;
  showFullContent?: boolean;
  className?: string;
}

const AnnouncementCard: React.FC<AnnouncementCardProps> = ({
  announcement,
  onAnnouncementClick,
  onPinToggle,
  showFullContent = false,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(showFullContent);

  const handleCardClick = () => {
    if (onAnnouncementClick) {
      onAnnouncementClick(announcement);
    }
  };

  const handlePinToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onPinToggle) {
      onPinToggle(announcement.id, !announcement.pinned);
    }
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator.share) {
      navigator.share({
        title: announcement.title,
        text: announcement.body.substring(0, 100) + '...',
        url: window.location.href
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(`${announcement.title}\n\n${announcement.body}`);
    }
  };

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return 'Unknown time';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    if (diffInHours < 48) return 'Yesterday';
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  const getAttachmentIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image className="w-4 h-4" />;
    if (type.includes('pdf')) return <FileText className="w-4 h-4" />;
    return <Link className="w-4 h-4" />;
  };

  const getAttachmentColor = (type: string) => {
    if (type.startsWith('image/')) return 'text-blue-500';
    if (type.includes('pdf')) return 'text-red-500';
    return 'text-green-500';
  };

  return (
    <div 
      className={`card-hover bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-white/50 overflow-hidden relative cursor-pointer group ${
        announcement.pinned ? 'ring-2 ring-primary-300 bg-gradient-to-r from-primary-50/30 to-white/90' : ''
      } ${className}`}
      onClick={handleCardClick}
    >
      {/* Pinned Badge */}
      {announcement.pinned && (
        <div className="absolute top-4 right-4 flex items-center space-x-1 px-2 py-1 bg-primary-100 text-primary-700 rounded-full text-xs font-medium">
          <Pin className="w-3 h-3 fill-current" />
          <span>Pinned</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className={`text-xl font-display font-semibold text-gray-900 mb-2 group-hover:text-gradient transition-all duration-300 ${
            announcement.pinned ? 'text-primary-700' : ''
          }`}>
            {announcement.title}
          </h3>
          
          {/* Timestamp and Event Info */}
          <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
            <div className="flex items-center space-x-1">
              <Clock className="w-4 h-4" />
              <span>{formatTimestamp(announcement.createdAt)}</span>
            </div>
            
            {announcement.updatedAt && announcement.updatedAt !== announcement.createdAt && (
              <div className="flex items-center space-x-1 text-accent-600">
                <Eye className="w-4 h-4" />
                <span>Updated {formatTimestamp(announcement.updatedAt)}</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Pin Toggle Button */}
        <button
          onClick={handlePinToggle}
          className={`ml-4 p-2 rounded-xl transition-all duration-200 ${
            announcement.pinned
              ? 'bg-primary-100 text-primary-600 hover:bg-primary-200'
              : 'text-gray-400 hover:text-primary-500 hover:bg-primary-50'
          }`}
          title={announcement.pinned ? 'Unpin announcement' : 'Pin announcement'}
        >
          <Pin className={`w-4 h-4 ${announcement.pinned ? 'fill-current' : ''}`} />
        </button>
      </div>

      {/* Content */}
      <div className="mb-4">
        {isExpanded ? (
          <div className="prose prose-sm max-w-none">
            <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
              {announcement.body}
            </p>
          </div>
        ) : (
          <p className="text-gray-600 leading-relaxed line-clamp-3">
            {announcement.body}
          </p>
        )}
      </div>

      {/* Attachments */}
      {announcement.attachments && announcement.attachments.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Attachments</h4>
          <div className="flex flex-wrap gap-2">
            {announcement.attachments.map((attachment, index) => (
              <div
                key={index}
                className={`flex items-center space-x-2 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200 hover:border-primary-300 transition-colors duration-200 ${
                  getAttachmentColor(attachment.type)
                }`}
              >
                {getAttachmentIcon(attachment.type)}
                <span className="text-sm font-medium">{attachment.name}</span>
                {attachment.size && (
                  <span className="text-xs text-gray-500">
                    ({(attachment.size / 1024).toFixed(1)} KB)
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Bar */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex items-center space-x-4">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="flex items-center space-x-2 px-3 py-2 text-primary-600 text-sm font-medium hover:bg-primary-50 rounded-lg transition-all duration-200"
          >
            <MessageSquare className="w-4 h-4" />
            <span>{isExpanded ? 'Show Less' : 'Read More'}</span>
          </button>
          
          <button
            onClick={handleShare}
            className="flex items-center space-x-2 px-3 py-2 text-secondary-600 text-sm font-medium hover:bg-secondary-50 rounded-lg transition-all duration-200"
          >
            <Share2 className="w-4 h-4" />
            <span>Share</span>
          </button>
        </div>
        
        {/* Event Link (if announcement is related to an event) */}
        {announcement.eventId && (
          <div className="text-xs text-accent-600 bg-accent-50 px-2 py-1 rounded-full">
            📅 Related to Event
          </div>
        )}
      </div>

      {/* Hover Effect Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary-50/5 to-secondary-50/5 -translate-x-full group-hover:translate-x-full transition-transform duration-700 rounded-2xl"></div>
    </div>
  );
};

export default AnnouncementCard;
