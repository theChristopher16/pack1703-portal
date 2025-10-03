import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation, Plus, Locate, Cloud, Clock } from 'lucide-react';
import { Location } from '../../types/firestore';
import { weatherService, WeatherForecast } from '../../services/weatherService';
import { operatingHoursService, OperatingStatus } from '../../services/operatingHoursService';
import { offlineCacheService } from '../../services/offlineCacheService';

interface AppleLocationMapProps {
  locations: Location[];
  onLocationSelect: (location: Location) => void;
  selectedLocation: Location | null;
  onLocationAdd?: (lat: number, lng: number) => void;
  onLocationEdit?: (location: Location) => void;
  onLocationDelete?: (location: Location) => void;
  height?: string;
  showControls?: boolean;
}

interface AppleMapKit {
  Map: any;
  Annotation: any;
  Coordinate: any;
  CoordinateRegion: any;
  CoordinateSpan: any;
  init: (options: any) => void;
}

declare global {
  interface Window {
    mapkit: AppleMapKit;
  }
}

const AppleLocationMap: React.FC<AppleLocationMapProps> = ({
  locations,
  onLocationSelect,
  selectedLocation,
  onLocationAdd,
  onLocationEdit,
  onLocationDelete,
  height = '600px',
  showControls = true
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const annotationsRef = useRef<any[]>([]);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{lat: number, lng: number} | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [weatherData, setWeatherData] = useState<WeatherForecast | null>(null);
  const [isLoadingWeather, setIsLoadingWeather] = useState(false);
  const [forecastData, setForecastData] = useState<WeatherForecast[]>([]);
  const [isLoadingForecast, setIsLoadingForecast] = useState(false);

  const getCategoryIcon = (category?: string) => {
    switch (category?.toLowerCase()) {
      case 'park': return '🌳';
      case 'school': return '🏫';
      case 'church': return '⛪';
      case 'campground': return '🏕️';
      case 'community center': return '🏢';
      default: return '📍';
    }
  };

  const getCategoryColor = (category?: string) => {
    switch (category?.toLowerCase()) {
      case 'park': return '#10B981'; // Green
      case 'school': return '#3B82F6'; // Blue
      case 'church': return '#8B5CF6'; // Purple
      case 'campground': return '#F59E0B'; // Amber
      case 'community center': return '#EF4444'; // Red
      default: return '#6B7280'; // Gray
    }
  };

  const calculateMapBounds = () => {
    if (!locations || locations.length === 0) {
      // Default to Houston area if no locations
      return {
        center: new window.mapkit.Coordinate(29.758101, -95.5184975),
        span: new window.mapkit.CoordinateSpan(0.1, 0.1)
      };
    }

    // Filter locations with valid coordinates
    const validLocations = locations.filter(loc => 
      loc.geo?.lat && loc.geo?.lng && 
      !isNaN(loc.geo.lat) && !isNaN(loc.geo.lng)
    );

    if (validLocations.length === 0) {
      // Default to Houston area if no valid locations
      return {
        center: new window.mapkit.Coordinate(29.758101, -95.5184975),
        span: new window.mapkit.CoordinateSpan(0.1, 0.1)
      };
    }

    if (validLocations.length === 1) {
      // Single location - center on it with default span
      const loc = validLocations[0];
      if (loc.geo?.lat && loc.geo?.lng) {
        return {
          center: new window.mapkit.Coordinate(loc.geo.lat, loc.geo.lng),
          span: new window.mapkit.CoordinateSpan(0.05, 0.05)
        };
      }
    }

    // Multiple locations - calculate bounds
    const firstLoc = validLocations[0];
    if (!firstLoc.geo?.lat || !firstLoc.geo?.lng) {
      // Fallback to default if first location is invalid
      return {
        center: new window.mapkit.Coordinate(29.758101, -95.5184975),
        span: new window.mapkit.CoordinateSpan(0.1, 0.1)
      };
    }

    let minLat = firstLoc.geo.lat;
    let maxLat = firstLoc.geo.lat;
    let minLng = firstLoc.geo.lng;
    let maxLng = firstLoc.geo.lng;

    validLocations.forEach(loc => {
      if (loc.geo?.lat && loc.geo?.lng) {
        minLat = Math.min(minLat, loc.geo.lat);
        maxLat = Math.max(maxLat, loc.geo.lat);
        minLng = Math.min(minLng, loc.geo.lng);
        maxLng = Math.max(maxLng, loc.geo.lng);
      }
    });

    // Calculate center
    const centerLat = (minLat + maxLat) / 2;
    const centerLng = (minLng + maxLng) / 2;

    // Calculate span with padding (20% extra on each side)
    const latSpan = (maxLat - minLat) * 1.4; // 40% total padding (20% each side)
    const lngSpan = (maxLng - minLng) * 1.4; // 40% total padding (20% each side)

    // Ensure minimum span for visibility
    const minSpan = 0.01;
    const finalLatSpan = Math.max(latSpan, minSpan);
    const finalLngSpan = Math.max(lngSpan, minSpan);

    console.log(`🗺️ Calculated map bounds for ${validLocations.length} locations:`, {
      center: { lat: centerLat, lng: centerLng },
      span: { lat: finalLatSpan, lng: finalLngSpan },
      bounds: { minLat, maxLat, minLng, maxLng }
    });

    return {
      center: new window.mapkit.Coordinate(centerLat, centerLng),
      span: new window.mapkit.CoordinateSpan(finalLatSpan, finalLngSpan)
    };
  };

  const initializeMap = () => {
    if (!mapRef.current || mapInstanceRef.current) return;

    try {
      // Initialize Apple MapKit
      if (!window.mapkit) {
        console.error('Apple MapKit not loaded');
        return;
      }

      // Calculate dynamic bounds based on locations
      const bounds = calculateMapBounds();
      
      const map = new window.mapkit.Map(mapRef.current, {
        center: bounds.center,
        region: new window.mapkit.CoordinateRegion(bounds.center, bounds.span),
        mapType: window.mapkit.Map.MapTypes.STANDARD
      });

      mapInstanceRef.current = map;

      // Handle map clicks for adding new locations
      if (onLocationAdd) {
        const mapAnnotationSelectCallback = (event: any) => {
          // Don't add location if clicking on existing annotation
          if (event.annotation) return;

          // Add new location at click point
          const coordinate = event.coordinate;
          onLocationAdd(coordinate.latitude, coordinate.longitude);
        };

        map.addEventListener('tap', mapAnnotationSelectCallback);
      }

      setIsMapLoaded(true);
      addLocationAnnotations(map);

    } catch (error) {
      console.error('Error initializing Apple Map:', error);
    }
  };

  const getCurrentLocation = () => {
    console.log('📍 Find Me button clicked');
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by this browser.');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log('📍 GPS location obtained:', position.coords);
        const { latitude, longitude } = position.coords;
        setCurrentLocation({ lat: latitude, lng: longitude });
        
        // Center map on current location
        if (mapInstanceRef.current) {
          const coordinate = new window.mapkit.Coordinate(latitude, longitude);
          const region = new window.mapkit.CoordinateRegion(
            coordinate,
            new window.mapkit.CoordinateSpan(0.01, 0.01)
          );
          mapInstanceRef.current.setRegionAnimated(region, true);
        }
        
        // Get weather for current location
        loadWeatherForLocation({ lat: latitude, lng: longitude });
        
        setIsLocating(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        alert('Unable to get your current location. Please check your browser permissions.');
        setIsLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  };

  const loadWeatherForLocation = async (coordinates: {lat: number, lng: number}) => {
    console.log('🌤️ Loading weather for location:', coordinates);
    setIsLoadingWeather(true);
    try {
      const weather = await weatherService.getCurrentWeather({
        name: 'Current Location',
        coordinates
      });
      console.log('🌤️ Weather data received:', weather);
      setWeatherData(weather);
    } catch (error) {
      console.error('Error loading weather:', error);
    } finally {
      setIsLoadingWeather(false);
    }
  };

  const loadForecastForLocation = async (coordinates: {lat: number, lng: number}) => {
    console.log('🌤️ Loading forecast for location:', coordinates);
    setIsLoadingForecast(true);
    try {
      const forecast = await weatherService.getFiveDayForecast({
        name: 'Location',
        coordinates
      });
      console.log('🌤️ Forecast data received:', forecast);
      setForecastData(forecast);
    } catch (error) {
      console.error('Error loading forecast:', error);
    } finally {
      setIsLoadingForecast(false);
    }
  };

  // Helper function to format time for display
  const formatTimeForDisplay = (time: string): string => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  // Operating Hours Display Component
  const OperatingHoursDisplay: React.FC<{ operatingHours: any }> = ({ operatingHours }) => {
    const [status, setStatus] = useState<OperatingStatus | null>(null);
    const [showFullHours, setShowFullHours] = useState(false);

    useEffect(() => {
      if (operatingHours) {
        const currentStatus = operatingHoursService.getCurrentStatus(operatingHours);
        setStatus(currentStatus);
      }
    }, [operatingHours]);

    if (!status) return null;

    const formattedHours = operatingHoursService.getFormattedHours(operatingHours);

    return (
      <div className="space-y-2">
        {/* Current Status */}
        <div className="flex items-center space-x-2">
          <span className="text-lg">{operatingHoursService.getStatusIcon(status)}</span>
          <span className={`text-sm font-medium ${operatingHoursService.getStatusColorClass(status)}`}>
            {status.statusText}
          </span>
        </div>

        {/* Current Hours */}
        {status.currentHours && !status.currentHours.isClosed && (
          <div className="text-xs text-gray-600">
            Today: {formatTimeForDisplay(status.currentHours.open)} - {formatTimeForDisplay(status.currentHours.close)}
          </div>
        )}

        {/* Next Open/Close Time */}
        {!status.isOpen && status.nextOpenTime && (
          <div className="text-xs text-gray-500">
            Opens at {formatTimeForDisplay(status.nextOpenTime)}
          </div>
        )}

        {/* Toggle Full Hours */}
        <button
          onClick={() => setShowFullHours(!showFullHours)}
          className="text-xs text-blue-600 hover:text-blue-800 underline"
        >
          {showFullHours ? 'Hide' : 'Show'} full hours
        </button>

        {/* Full Hours Display */}
        {showFullHours && (
          <div className="mt-2 space-y-1">
            {formattedHours.map((day, index) => (
              <div key={index} className="flex justify-between text-xs">
                <span className="text-gray-600">{day.day}</span>
                <span className="text-gray-900">{day.hours}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Weather Display Component
  const WeatherDisplay: React.FC<{
    coordinates: {lat: number, lng: number};
    onLoadForecast: (coordinates: {lat: number, lng: number}) => void;
    forecastData: WeatherForecast[];
    isLoadingForecast: boolean;
  }> = ({ coordinates, onLoadForecast, forecastData, isLoadingForecast }) => {
    const [currentWeather, setCurrentWeather] = useState<WeatherForecast | null>(null);
    const [showForecast, setShowForecast] = useState(false);
    const [isLoadingCurrent, setIsLoadingCurrent] = useState(false);

    useEffect(() => {
      const loadCurrentWeather = async () => {
        setIsLoadingCurrent(true);
        try {
          const weather = await weatherService.getCurrentWeather({
            name: 'Location',
            coordinates
          });
          setCurrentWeather(weather);
        } catch (error) {
          console.error('Error loading current weather:', error);
        } finally {
          setIsLoadingCurrent(false);
        }
      };

      loadCurrentWeather();
    }, [coordinates]);

    const formatDate = (dateStr: string) => {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    };

    return (
      <div className="space-y-2">
        {/* Current Weather */}
        {isLoadingCurrent ? (
          <div className="text-xs text-gray-500">Loading weather...</div>
        ) : currentWeather ? (
          <div className="flex items-center space-x-2">
            <span className="text-lg">{weatherService.getWeatherEmoji(currentWeather.icon)}</span>
            <div>
              <div className="text-sm font-medium text-gray-900">
                {currentWeather.temperature.current}°F
              </div>
              <div className="text-xs text-gray-600 capitalize">
                {currentWeather.description}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-xs text-gray-500">Weather unavailable</div>
        )}

        {/* Forecast Toggle */}
        <button
          onClick={() => {
            if (!showForecast && forecastData.length === 0) {
              onLoadForecast(coordinates);
            }
            setShowForecast(!showForecast);
          }}
          className="text-xs text-blue-600 hover:text-blue-800 underline"
        >
          {showForecast ? 'Hide' : 'Show'} 5-day forecast
        </button>

        {/* 5-Day Forecast */}
        {showForecast && (
          <div className="mt-2 space-y-1">
            {isLoadingForecast ? (
              <div className="text-xs text-gray-500">Loading forecast...</div>
            ) : forecastData.length > 0 ? (
              forecastData.map((day, index) => (
                <div key={index} className="flex justify-between items-center text-xs">
                  <span className="text-gray-600">{formatDate(day.date)}</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{weatherService.getWeatherEmoji(day.icon)}</span>
                    <div className="text-right">
                      <div className="text-gray-900 font-medium">
                        {day.temperature.max}°/{day.temperature.min}°
                      </div>
                      <div className="text-gray-500 capitalize">
                        {day.description}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-xs text-gray-500">Forecast unavailable</div>
            )}
          </div>
        )}
      </div>
    );
  };

  const addLocationAnnotations = (map: any) => {
    if (!isMapLoaded || !map) return;

    // Clear existing annotations
    annotationsRef.current.forEach(annotation => {
      map.removeAnnotation(annotation);
    });
    annotationsRef.current = [];

    // Add location annotations
    locations.forEach((location) => {
      if (!location.geo?.lat || !location.geo?.lng) return;

      const coordinate = new window.mapkit.Coordinate(
        location.geo.lat,
        location.geo.lng
      );

      const color = getCategoryColor(location.category);
      
      const annotation = new window.mapkit.Annotation(coordinate, () => {
        const element = document.createElement('div');
        element.className = 'map-pin';
        element.innerHTML = `
          <div class="pin-marker" style="
            width: 36px;
            height: 36px;
            background-color: ${color};
            border: 4px solid white;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            box-shadow: 0 3px 8px rgba(0,0,0,0.4);
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            position: relative;
          ">
            <div style="
              transform: rotate(45deg);
              color: white;
              font-size: 16px;
              font-weight: bold;
            ">
              ${getCategoryIcon(location.category)}
            </div>
          </div>
        `;

        // Handle click on pin
        element.addEventListener('click', () => {
          onLocationSelect(location);
          
          // Zoom to the clicked location
          if (mapInstanceRef.current && location.geo?.lat && location.geo?.lng) {
            const coordinate = new window.mapkit.Coordinate(location.geo.lat, location.geo.lng);
            const region = new window.mapkit.CoordinateRegion(
              coordinate,
              new window.mapkit.CoordinateSpan(0.01, 0.01) // Close zoom level
            );
            mapInstanceRef.current.setRegionAnimated(region, true);
          }
        });

        return element;
      });

      annotation.title = location.name;
      annotation.subtitle = location.address;
      annotation.color = color;

      map.addAnnotation(annotation);
      annotationsRef.current.push(annotation);
    });
  };

  useEffect(() => {
    // Load Apple MapKit JS with proper attributes per Apple documentation
    const script = document.createElement('script');
    script.src = 'https://cdn.apple-mapkit.com/mk/5.x.x/mapkit.js';
    script.crossOrigin = 'anonymous';
    script.async = true;
    script.setAttribute('data-libraries', 'full-map,annotations,services');
    script.setAttribute('data-callback', 'initMapKitCallback');
    
    // Store this component's initialization function globally
    (window as any).initMapKitCallback = () => {
      console.log('🍎 Apple MapKit JS loaded successfully!');
      
      // Initialize MapKit
      if (window.mapkit && window.mapkit.init) {
        window.mapkit.init({
          authorizationCallback: (done: any) => {
            // Check if we're on localhost or production and use appropriate token
            const isLocalhost = window.location.hostname === 'localhost';
            const token = isLocalhost 
              ? 'eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IjY4RzJBNzIyVFQifQ.eyJpc3MiOiI5OTJZNUhMOVVRIiwiaWF0IjoxNzU5Mjc5NTA2LCJleHAiOjE3NjE4NzE1MDYsIm9yaWdpbiI6Imh0dHA6Ly9sb2NhbGhvc3Q6MzAwMCJ9.bHzhgxOaZbsXPMpbY5BT05rU_1LuKovYoLgej9iwBFoe6g5KBb6Ezsw2F2RbOucv7pjwu8DjKL9n_poT9eralA'
              : 'eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IjY4RzJBNzIyVFQifQ.eyJpc3MiOiI5OTJZNUhMOVVRIiwiaWF0IjoxNzU5Mjc5NTAyLCJleHAiOjE3NjE4NzE1MDIsIm9yaWdpbiI6Imh0dHBzOi8vcGFjazE3MDMtcG9ydGFsLndlYi5hcHAifQ.cPhhW6zhRXdGpQwrGg99om4xpdrlkVYO50MQSSvnNQvAWpISZpC3NGrjm0TcXa-dqoQG5FWdOP9CWU1IxvmXqA';
            
            console.log(`🍎 Using Apple MapKit token for ${isLocalhost ? 'localhost' : 'production'} (expires: 2025-10-31, valid for 30 days)`);
            try {
              done(token);
            } catch (error) {
              console.error('Apple MapKit token error:', error);
              setMapError(true);
            }
          }
        });
      }
    };

    document.head.appendChild(script);

    // Fallback initialization attempt
    setTimeout(() => {
      initializeMap();
    }, 1000);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.destroy();
      }
    };
  }, []);

  useEffect(() => {
    if (isMapLoaded && mapInstanceRef.current) {
      addLocationAnnotations(mapInstanceRef.current);
      
      // Recalculate and update map bounds when locations change
      const bounds = calculateMapBounds();
      mapInstanceRef.current.setRegionAnimated(
        new window.mapkit.CoordinateRegion(bounds.center, bounds.span),
        true // animated
      );
    }
  }, [locations, selectedLocation, isMapLoaded]);

  return (
    <div className="relative">
      <div
        ref={mapRef}
        style={{ height }}
        className="rounded-2xl border border-gray-200 overflow-hidden bg-gray-100"
      >
        {/* Fallback Map Display */}
        {!isMapLoaded && (
          <div className="flex items-center justify-center h-full bg-gray-100">
            <div className="text-center p-8">
              <div className="text-6xl mb-4">🗺️</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">Locations Map</h3>
              <p className="text-gray-600 mb-4">
                Apple Maps integration coming soon!
              </p>
              <div className="grid grid-cols-2 gap-2 max-w-sm">
                {locations.slice(0, 6).map((location, index) => (
                  <div key={location.id || index} className="bg-white/80 rounded-lg p-3 text-center">
                    <div className="text-lg mb-1">{getCategoryIcon(location.category)}</div>
                    <div className="text-xs font-medium text-gray-700">{location.name}</div>
                  </div>
                ))}
              </div>
              {locations.length > 6 && (
                <p className="text-sm text-gray-500 mt-2">
                  +{locations.length - 6} more locations
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Map Controls */}
      {showControls && isMapLoaded && (
        <div className="absolute top-4 right-4 flex flex-col space-y-2">
          {/* Find Me Button */}
          <button
            onClick={getCurrentLocation}
            disabled={isLocating}
            className="bg-blue-600 text-white p-3 rounded-xl shadow-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors"
            title="Find my current location"
          >
            <Locate className={`w-5 h-5 ${isLocating ? 'animate-spin' : ''}`} />
          </button>
          
          {/* Reset View Button */}
          <button
            onClick={() => {
              // Reset to default bounds showing all locations
              if (mapInstanceRef.current) {
                const bounds = calculateMapBounds();
                const region = new window.mapkit.CoordinateRegion(bounds.center, bounds.span);
                mapInstanceRef.current.setRegionAnimated(region, true);
              }
            }}
            className="bg-white text-gray-700 p-3 rounded-xl shadow-lg hover:bg-gray-50 transition-colors border border-gray-200"
            title="Reset to show all locations"
          >
            <Navigation className="w-5 h-5" />
          </button>
          
          {/* Add Location Button */}
          {onLocationAdd && (
            <button
              onClick={() => {
                // Center on SF Bay Area for Pack 1703
                if (mapInstanceRef.current) {
                  mapInstanceRef.current.setCenterAnimated({
                    latitude: 37.7749,
                    longitude: -122.4194
                  });
                }
              }}
              className="bg-primary-600 text-white p-3 rounded-xl shadow-lg hover:bg-primary-700 transition-colors"
              title="Center on Pack 1703 Area"
            >
              <Plus className="w-5 h-5" />
            </button>
          )}
        </div>
      )}

      {/* Weather Widget */}
      {weatherData && (
        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 p-4 z-10">
          <div className="flex items-center space-x-3">
            <div className="text-2xl">
              {weatherService.getWeatherEmoji(weatherData.icon)}
            </div>
            <div>
              <div className="text-lg font-semibold text-gray-900">
                {weatherData.temperature.current}°F
              </div>
              <div className="text-sm text-gray-600 capitalize">
                {weatherData.description}
              </div>
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            {weatherData.humidity}% humidity • {weatherData.windSpeed} mph wind
          </div>
        </div>
      )}

      {/* Location Details Popup */}
      {selectedLocation && (
        <div className="absolute top-4 left-4 bg-white rounded-2xl shadow-xl border border-gray-200 p-6 max-w-sm z-10">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center text-white text-lg"
                style={{ backgroundColor: getCategoryColor(selectedLocation.category) }}
              >
                {getCategoryIcon(selectedLocation.category)}
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-lg">{selectedLocation.name}</h3>
                <p className="text-sm text-gray-600 capitalize">{selectedLocation.category}</p>
              </div>
            </div>
            <button
              onClick={() => onLocationSelect(null as any)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              ✕
            </button>
          </div>
          
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-600 mb-1">📍 Address</p>
              <p className="text-gray-900">{selectedLocation.address}</p>
            </div>
            
            {selectedLocation.notesPublic && (
              <div>
                <p className="text-sm text-gray-600 mb-1">📝 Notes</p>
                <p className="text-gray-900">{selectedLocation.notesPublic}</p>
              </div>
            )}
            
            {selectedLocation.amenities && selectedLocation.amenities.length > 0 && (
              <div>
                <p className="text-sm text-gray-600 mb-1">🏢 Amenities</p>
                <div className="flex flex-wrap gap-1">
                  {selectedLocation.amenities.map((amenity, index) => (
                    <span 
                      key={index}
                      className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                    >
                      {amenity}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {selectedLocation.parking?.text && (
              <div>
                <p className="text-sm text-gray-600 mb-1">🅿️ Parking</p>
                <p className="text-gray-900">{selectedLocation.parking.text}</p>
              </div>
            )}
            
            {selectedLocation.operatingHours && (
              <div>
                <p className="text-sm text-gray-600 mb-1">🕒 Hours</p>
                <OperatingHoursDisplay operatingHours={selectedLocation.operatingHours} />
              </div>
            )}

            {/* Weather Section */}
            {selectedLocation.geo && (
              <div>
                <p className="text-sm text-gray-600 mb-1">🌤️ Weather</p>
                <WeatherDisplay 
                  coordinates={selectedLocation.geo}
                  onLoadForecast={loadForecastForLocation}
                  forecastData={forecastData}
                  isLoadingForecast={isLoadingForecast}
                />
              </div>
            )}
          </div>
          
          {/* Action Buttons */}
          <div className="flex space-x-2 mt-4 pt-4 border-t border-gray-200">
            {onLocationEdit && (
              <button
                onClick={() => onLocationEdit(selectedLocation)}
                className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
              >
                ✏️ Edit
              </button>
            )}
            {onLocationDelete && (
              <button
                onClick={() => {
                  if (window.confirm(`Are you sure you want to delete "${selectedLocation.name}"?`)) {
                    onLocationDelete(selectedLocation);
                    onLocationSelect(null as any);
                  }
                }}
                className="flex-1 px-3 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
              >
                🗑️ Delete
              </button>
            )}
          </div>
        </div>
      )}

      {/* Apple Maps Attribution */}
      <div className="absolute bottom-2 left-2 text-xs text-gray-500 bg-white/80 px-2 py-1 rounded">
        Map data © Apple
      </div>
    </div>
  );
};

export default AppleLocationMap;
