import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Icon, LatLngBounds } from 'leaflet';
import { Navigation, ExternalLink } from 'lucide-react';
import { Location } from '../../types/firestore';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in react-leaflet
delete (Icon.Default.prototype as any)._getIconUrl;
Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

interface LocationMapProps {
  locations: Location[];
  selectedLocation?: Location | null;
  onLocationSelect?: (location: Location) => void;
  height?: string;
  showControls?: boolean;
  className?: string;
}

// Component to handle map bounds updates
const MapBoundsUpdater: React.FC<{ locations: Location[] }> = ({ locations }) => {
  const map = useMap();
  
  useEffect(() => {
    if (locations.length > 0) {
      const validLocations = locations.filter(loc => loc.geo?.lat && loc.geo?.lng);
      if (validLocations.length > 0) {
        const bounds = new LatLngBounds([]);
        validLocations.forEach(location => {
          bounds.extend([location.geo!.lat, location.geo!.lng]);
        });
        
        map.fitBounds(bounds, { padding: [20, 20] });
      }
    }
  }, [locations, map]);
  
  return null;
};

const LocationMap: React.FC<LocationMapProps> = ({
  locations,
  selectedLocation,
  onLocationSelect,
  height = '400px',
  showControls = true,
  className = ''
}) => {
  const mapRef = useRef<any>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([39.8283, -98.5795]); // Center of USA
  const [zoom, setZoom] = useState(4);

  // Set initial center based on locations
  useEffect(() => {
    if (locations.length > 0) {
      const validLocations = locations.filter(loc => loc.geo?.lat && loc.geo?.lng);
      if (validLocations.length > 0) {
        const firstLocation = validLocations[0];
        setMapCenter([firstLocation.geo!.lat, firstLocation.geo!.lng]);
        setZoom(12);
      }
    }
  }, [locations]);

  const handleMarkerClick = (location: Location) => {
    if (onLocationSelect) {
      onLocationSelect(location);
    }
  };

  const handleDirections = (location: Location) => {
    if (location.geo?.lat && location.geo?.lng) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${location.geo.lat},${location.geo.lng}`;
      window.open(url, '_blank');
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
    <div className={`relative ${className}`} style={{ height }}>
      {/* Map Container */}
      <MapContainer
        ref={mapRef}
        center={mapCenter}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        className="rounded-2xl overflow-hidden shadow-soft"
      >
        {/* OpenStreetMap Tiles */}
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        {/* Update map bounds when locations change */}
        <MapBoundsUpdater locations={locations} />
        
        {/* Location Markers */}
        {locations.map((location) => {
          if (!location.geo?.lat || !location.geo?.lng) return null;
          
          return (
            <Marker
              key={location.id}
              position={[location.geo.lat, location.geo.lng]}
              eventHandlers={{
                click: () => handleMarkerClick(location),
              }}
            >
              <Popup className="location-popup">
                <div className="p-3 min-w-[200px]">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-lg">{getCategoryIcon(location.category)}</span>
                    <h3 className="font-semibold text-gray-900">{location.name}</h3>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-3">{location.address}</p>
                  
                  {location.notesPublic && (
                    <p className="text-sm text-gray-600 mb-3 border-l-2 border-primary-300 pl-2">
                      {location.notesPublic}
                    </p>
                  )}
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleDirections(location)}
                      className="flex items-center space-x-1 px-2 py-1 bg-primary-500 text-white text-xs rounded-lg hover:bg-primary-600 transition-colors duration-200"
                    >
                      <Navigation className="w-3 h-3" />
                      <span>Directions</span>
                    </button>
                    
                    <button
                      onClick={() => handleMarkerClick(location)}
                      className="flex items-center space-x-1 px-2 py-1 bg-secondary-500 text-white text-xs rounded-lg hover:bg-secondary-600 transition-colors duration-200"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Details</span>
                    </button>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Map Controls Overlay */}
      {showControls && (
        <div className="absolute top-4 right-4 flex flex-col space-y-2">
          {/* Zoom Controls */}
          <div className="bg-white/90 backdrop-blur-sm rounded-xl p-2 shadow-soft">
            <button
              onClick={() => mapRef.current?.zoomIn()}
              className="w-8 h-8 bg-white hover:bg-gray-50 rounded-lg flex items-center justify-center text-gray-600 hover:text-gray-800 transition-colors duration-200 shadow-sm"
            >
              +
            </button>
            <button
              onClick={() => mapRef.current?.zoomOut()}
              className="w-8 h-8 bg-white hover:bg-gray-50 rounded-lg flex items-center justify-center text-gray-600 hover:text-gray-800 transition-colors duration-200 shadow-sm mt-1"
            >
              −
            </button>
          </div>
          
          {/* Location Legend */}
          <div className="bg-white/90 backdrop-blur-sm rounded-xl p-3 shadow-soft">
            <h4 className="text-xs font-semibold text-gray-900 mb-2">Locations</h4>
            <div className="space-y-1">
              <div className="flex items-center space-x-2 text-xs">
                <span className="text-primary-500">📍</span>
                <span className="text-gray-600">Important</span>
              </div>
              <div className="flex items-center space-x-2 text-xs">
                <span className="text-secondary-500">🌳</span>
                <span className="text-gray-600">Parks</span>
              </div>
              <div className="flex items-center space-x-2 text-xs">
                <span className="text-accent-500">🏫</span>
                <span className="text-gray-600">Schools</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Selected Location Info */}
      {selectedLocation && (
        <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-soft border border-white/50">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-1">{selectedLocation.name}</h3>
              <p className="text-sm text-gray-600">{selectedLocation.address}</p>
              {selectedLocation.driveTime && (
                <p className="text-xs text-accent-600 mt-1">🚗 {selectedLocation.driveTime}</p>
              )}
            </div>
            <button
              onClick={() => handleDirections(selectedLocation)}
              className="ml-4 px-3 py-2 bg-gradient-to-r from-primary-500 to-secondary-500 text-white text-sm font-medium rounded-lg hover:from-primary-600 hover:to-secondary-600 transition-all duration-200 transform hover:scale-105"
            >
              <Navigation className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationMap;
