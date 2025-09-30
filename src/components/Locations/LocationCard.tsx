import React, { useState, useEffect } from 'react';
import { MapPin, Clock, Car, Info, ExternalLink, Star, Edit, Trash2, Cloud } from 'lucide-react';
import { Location } from '../../types/firestore';
import { weatherService, WeatherForecast } from '../../services/weatherService';
import { operatingHoursService, OperatingStatus } from '../../services/operatingHoursService';

interface LocationCardProps {
  location: Location;
  onLocationClick?: (location: Location) => void;
  onEdit?: (location: Location) => void;
  onDelete?: (location: Location) => void;
  showMap?: boolean;
  showEditControls?: boolean;
}

const LocationCard: React.FC<LocationCardProps> = ({ 
  location, 
  onLocationClick,
  onEdit,
  onDelete,
  showMap = false,
  showEditControls = false
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentWeather, setCurrentWeather] = useState<WeatherForecast | null>(null);
  const [isLoadingWeather, setIsLoadingWeather] = useState(false);
  const [forecastData, setForecastData] = useState<WeatherForecast[]>([]);
  const [isLoadingForecast, setIsLoadingForecast] = useState(false);
  const [operatingStatus, setOperatingStatus] = useState<OperatingStatus | null>(null);

  // Load weather data when component mounts
  useEffect(() => {
    const loadWeather = async () => {
      if (location.geo?.lat && location.geo?.lng) {
        setIsLoadingWeather(true);
        try {
          const weather = await weatherService.getCurrentWeather({
            name: location.name,
            coordinates: { lat: location.geo.lat, lng: location.geo.lng }
          });
          setCurrentWeather(weather);
        } catch (error) {
          console.error('Error loading weather:', error);
        } finally {
          setIsLoadingWeather(false);
        }
      }
    };

    loadWeather();
  }, [location.geo, location.name]);

  // Load forecast data when expanded
  const loadForecast = async () => {
    if (location.geo?.lat && location.geo?.lng && forecastData.length === 0) {
      setIsLoadingForecast(true);
      try {
        const forecast = await weatherService.getFiveDayForecast({
          name: location.name,
          coordinates: { lat: location.geo.lat, lng: location.geo.lng }
        });
        setForecastData(forecast);
      } catch (error) {
        console.error('Error loading forecast:', error);
      } finally {
        setIsLoadingForecast(false);
      }
    }
  };

  // Load operating hours status
  useEffect(() => {
    if (location.operatingHours) {
      const status = operatingHoursService.getCurrentStatus(location.operatingHours);
      setOperatingStatus(status);
    }
  }, [location.operatingHours]);

  const handleCardClick = () => {
    if (onLocationClick) {
      onLocationClick(location);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit) {
      onEdit(location);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete && window.confirm('Are you sure you want to delete this location? This action cannot be undone.')) {
      onDelete(location);
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
            <Star className="w-4 h-4 text-primary-600 fill-current" />
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

        {/* Weather Info */}
        {currentWeather && (
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <span className="text-lg">{weatherService.getWeatherEmoji(currentWeather.icon)}</span>
            <span>{currentWeather.temperature.current}°F</span>
          </div>
        )}

        {/* Operating Status */}
        {operatingStatus && (
          <div className="flex items-center space-x-2 text-sm">
            <span className="text-lg">{operatingHoursService.getStatusIcon(operatingStatus)}</span>
            <span className={operatingHoursService.getStatusColorClass(operatingStatus)}>
              {operatingStatus.statusText}
            </span>
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
        
        <div className="flex items-center space-x-2">
          {/* Edit Controls */}
          {showEditControls && (
            <>
              {onEdit && (
                <button
                  onClick={handleEdit}
                  className="flex items-center space-x-2 px-3 py-2 text-blue-600 text-sm font-medium hover:bg-blue-50 rounded-xl transition-all duration-200"
                >
                  <Edit className="w-4 h-4" />
                  <span>Edit</span>
                </button>
              )}
              {onDelete && (
                <button
                  onClick={handleDelete}
                  className="flex items-center space-x-2 px-3 py-2 text-red-600 text-sm font-medium hover:bg-red-50 rounded-xl transition-all duration-200"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete</span>
                </button>
              )}
            </>
          )}
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (!isExpanded) {
                loadForecast();
              }
              setIsExpanded(!isExpanded);
            }}
            className="flex items-center space-x-2 px-3 py-2 text-primary-600 text-sm font-medium hover:bg-primary-50 rounded-xl transition-all duration-200"
          >
            <span>{isExpanded ? 'Less' : 'More'}</span>
          </button>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-gray-100 animate-slide-down">
          {/* Weather Details */}
          {currentWeather && (
            <div className="mb-4 p-3 bg-blue-50 rounded-xl border border-blue-200">
              <h4 className="text-sm font-semibold text-blue-700 mb-2 flex items-center">
                <Cloud className="w-4 h-4 mr-2" />
                Current Weather
              </h4>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">{weatherService.getWeatherEmoji(currentWeather.icon)}</span>
                  <div>
                    <div className="text-lg font-semibold text-blue-900">
                      {currentWeather.temperature.current}°F
                    </div>
                    <div className="text-sm text-blue-600 capitalize">
                      {currentWeather.description}
                    </div>
                  </div>
                </div>
                <div className="text-xs text-blue-600">
                  <div>Humidity: {currentWeather.humidity}%</div>
                  <div>Wind: {currentWeather.windSpeed} mph</div>
                </div>
              </div>
            </div>
          )}

          {/* 5-Day Forecast */}
          {isExpanded && (
            <div className="mb-4 p-3 bg-indigo-50 rounded-xl border border-indigo-200">
              <h4 className="text-sm font-semibold text-indigo-700 mb-3 flex items-center">
                <Cloud className="w-4 h-4 mr-2" />
                5-Day Forecast
              </h4>
              {isLoadingForecast ? (
                <div className="text-sm text-indigo-600">Loading forecast...</div>
              ) : forecastData.length > 0 ? (
                <div className="space-y-2">
                  {forecastData.map((day, index) => {
                    const date = new Date(day.date);
                    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                    const monthDay = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                    
                    return (
                      <div key={index} className="flex items-center justify-between py-2 border-b border-indigo-100 last:border-b-0">
                        <div className="flex items-center space-x-3">
                          <div className="text-center min-w-[50px]">
                            <div className="text-xs font-medium text-indigo-900">{dayName}</div>
                            <div className="text-xs text-indigo-600">{monthDay}</div>
                          </div>
                          <span className="text-xl">{weatherService.getWeatherEmoji(day.icon)}</span>
                          <div className="text-sm text-indigo-700 capitalize">
                            {day.description}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold text-indigo-900">
                            {day.temperature.max}°/{day.temperature.min}°
                          </div>
                          <div className="text-xs text-indigo-600">
                            {day.humidity}% humidity
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-sm text-indigo-600">Forecast unavailable</div>
              )}
            </div>
          )}

          {/* Operating Hours Details */}
          {operatingStatus && location.operatingHours && (
            <div className="mb-4 p-3 bg-green-50 rounded-xl border border-green-200">
              <h4 className="text-sm font-semibold text-green-700 mb-2 flex items-center">
                <Clock className="w-4 h-4 mr-2" />
                Hours & Status
              </h4>
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-lg">{operatingHoursService.getStatusIcon(operatingStatus)}</span>
                <span className={`text-sm font-medium ${operatingHoursService.getStatusColorClass(operatingStatus)}`}>
                  {operatingStatus.statusText}
                </span>
              </div>
              {operatingStatus.currentHours && !operatingStatus.currentHours.isClosed && (
                <div className="text-xs text-green-600">
                  Today: {operatingStatus.currentHours.open} - {operatingStatus.currentHours.close}
                </div>
              )}
            </div>
          )}

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
