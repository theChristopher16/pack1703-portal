import React, { useState } from 'react';
import { MapPin, Clock, Car, Info, ExternalLink } from 'lucide-react';
import { Location } from '../../types/firestore';
import CyclingScoutIcon from '../ui/CyclingScoutIcon';

interface LocationCardProps {
  location: Location;
  onLocationClick?: (location: Location) => void;
  showMap?: boolean;
}

const LocationCard: React.FC<LocationCardProps> = ({ 
  location, 
  onLocationClick, 
  showMap = false 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleCardClick = () => {
    if (onLocationClick) {
      onLocationClick(location);
    }
  };

  const handleDirections = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (location.geo?.lat && location.geo?.lng) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${location.geo.lat},${location.geo.lng}`;
      window.open(url, '_blank');
    }
  };

  const getCategoryColor = (category?: string) => {
    switch (category?.toLowerCase()) {
      case 'park':
        return 'bg-secondary-100 text-secondary-700 border-secondary-200';
      case 'school':
        return 'bg-accent-100 text-accent-700 border-accent-200';
      case 'church':
        return 'bg-primary-100 text-primary-700 border-primary-200';
      case 'community center':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getCategoryIcon = (category?: string) => {
    switch (category?.toLowerCase()) {
      case 'park':
        return '🌳';
      case 'school':
        return '🏫';
      case 'church':
        return '⛪';
      case 'community center':
        return '🏢';
      default:
        return '📍';
    }
  };

  return (
    <div 
      className="card-hover bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-white/50 overflow-hidden relative cursor-pointer group"
      onClick={handleCardClick}
    >
      {/* Header Section */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-secondary-500 rounded-xl flex items-center justify-center shadow-glow">
              <MapPin className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-display font-semibold text-gray-900 group-hover:text-gradient transition-all duration-300">
                {location.name}
              </h3>
              {location.category && (
                <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getCategoryColor(location.category)}`}>
                  <span className="mr-1">{getCategoryIcon(location.category)}</span>
                  {location.category}
                </div>
              )}
            </div>
          </div>
          
          {/* Address */}
          <div className="flex items-center space-x-2 text-gray-600 mb-3">
            <MapPin className="w-4 h-4 text-primary-500" />
            <span className="text-sm">{location.address}</span>
          </div>
        </div>
        
        {/* Favorite/Important Indicator */}
        {location.isImportant && (
          <div className="flex items-center justify-center w-8 h-8 bg-primary-100 rounded-full">
            <CyclingScoutIcon size={16} interval={2500} />
          </div>
        )}
      </div>

      {/* Public Notes */}
      {location.notesPublic && (
        <div className="mb-4 p-3 bg-gray-50 rounded-xl border-l-4 border-primary-300">
          <div className="flex items-start space-x-2">
            <Info className="w-4 h-4 text-primary-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-gray-600 leading-relaxed">
              {location.notesPublic}
            </p>
          </div>
        </div>
      )}

      {/* Quick Info Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {location.driveTime && (
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Car className="w-4 h-4 text-accent-500" />
            <span>{location.driveTime}</span>
          </div>
        )}
        
        {location.gateCode && (
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Clock className="w-4 h-4 text-secondary-500" />
            <span>Gate: {location.gateCode}</span>
          </div>
        )}
      </div>

      {/* Parking Information */}
      {location.parking && (
        <div className="mb-4 p-3 bg-secondary-50 rounded-xl border border-secondary-200">
          <h4 className="text-sm font-semibold text-secondary-700 mb-2 flex items-center">
            <Car className="w-4 h-4 mr-2" />
            Parking Information
          </h4>
          {location.parking.text && (
            <p className="text-sm text-secondary-600 mb-2">{location.parking.text}</p>
          )}
          {location.parking.imageUrl && (
            <div className="w-full h-24 bg-secondary-100 rounded-lg flex items-center justify-center">
              <span className="text-secondary-500 text-sm">Parking Diagram</span>
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <button
          onClick={handleDirections}
          className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-primary-500 to-secondary-500 text-white text-sm font-medium rounded-xl hover:from-primary-600 hover:to-secondary-600 transition-all duration-200 transform hover:scale-105 shadow-glow-primary/50"
        >
          <ExternalLink className="w-4 h-4" />
          <span>Directions</span>
        </button>
        
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
          className="flex items-center space-x-2 px-4 py-2 text-primary-600 text-sm font-medium hover:bg-primary-50 rounded-xl transition-all duration-200"
        >
          <span>{isExpanded ? 'Show Less' : 'Show More'}</span>
        </button>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-gray-100 animate-slide-down">
          {/* Additional Details */}
          {location.amenities && location.amenities.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-2">Amenities</h4>
              <div className="flex flex-wrap gap-2">
                {location.amenities.map((amenity, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                  >
                    {amenity}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {/* Special Instructions */}
          {location.specialInstructions && (
            <div className="mb-4 p-3 bg-accent-50 rounded-xl border border-accent-200">
              <h4 className="text-sm font-semibold text-accent-700 mb-2">Special Instructions</h4>
              <p className="text-sm text-accent-600">{location.specialInstructions}</p>
            </div>
          )}
          
          {/* Contact Information */}
          {location.contactInfo && (
            <div className="mb-4 p-3 bg-primary-50 rounded-xl border border-primary-200">
              <h4 className="text-sm font-semibold text-primary-700 mb-2">Contact</h4>
              <p className="text-sm text-primary-600">{location.contactInfo}</p>
            </div>
          )}
        </div>
      )}

      {/* Hover Effect Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary-50/5 to-secondary-50/5 -translate-x-full group-hover:translate-x-full transition-transform duration-700 rounded-2xl"></div>
    </div>
  );
};

export default LocationCard;
