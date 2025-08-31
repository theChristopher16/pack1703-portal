import React, { useEffect, useRef } from 'react';
import { MapPin, Navigation, Phone, Mail, Clock, Star } from 'lucide-react';
import { Location } from '../../types/firestore';

interface LocationMapProps {
  locations: Location[];
  onLocationSelect: (location: Location) => void;
  selectedLocation: Location | null;
  height?: string;
  showControls?: boolean;
}

const LocationMap: React.FC<LocationMapProps> = ({
  locations,
  onLocationSelect,
  selectedLocation,
  height = '600px',
  showControls = true
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const leafletRef = useRef<any>(null); // Store Leaflet instance

  useEffect(() => {
    // Dynamically import Leaflet to avoid SSR issues
    const initMap = async () => {
      try {
        const L = await import('leaflet');
        leafletRef.current = L; // Store Leaflet instance
        
        // Import Leaflet CSS
        if (!document.querySelector('link[href*="leaflet.css"]')) {
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
          link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
          link.crossOrigin = '';
          document.head.appendChild(link);
        }

        // Fix Leaflet icon paths
        L.Icon.Default.imagePath = 'https://unpkg.com/leaflet@1.9.4/dist/images/';

        if (!mapRef.current || mapInstanceRef.current) return;

        // Initialize map
        const map = L.map(mapRef.current, {
          zoomControl: true,
          attributionControl: true
        }).setView([40.7103, -89.6144], 11);
        mapInstanceRef.current = map;

        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 18
        }).addTo(map);

        // Add markers for each location
        const markers: any[] = [];
        locations.forEach((location) => {
          if (location.geo?.lat && location.geo?.lng) {
            try {
              const marker = L.marker([location.geo.lat, location.geo.lng], {
                icon: L.Icon.Default.prototype
              })
                .addTo(map)
                .bindPopup(createPopupContent(location))
                .on('click', () => onLocationSelect(location));

              markers.push(marker);
            } catch (error) {
              console.warn(`Failed to create marker for location ${location.name}:`, error);
            }
          }
        });
        markersRef.current = markers;

        // Fit map to show all markers
        if (markers.length > 0) {
          setTimeout(() => {
            try {
              const group = new (L as any).featureGroup(markers);
              map.fitBounds(group.getBounds().pad(0.1));
            } catch (error) {
              console.warn('Failed to fit map bounds:', error);
            }
          }, 100);
        }

      } catch (error) {
        console.error('Failed to load map:', error);
        // Fallback to static map display
        showStaticMap();
      }
    };

    initMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [locations, onLocationSelect]);

  // Update selected location marker
  useEffect(() => {
    if (mapInstanceRef.current && selectedLocation && leafletRef.current) {
      const L = leafletRef.current;
      
      // Remove previous selection styling
      markersRef.current.forEach(marker => {
        marker.setIcon(L.Icon.Default.prototype);
      });

      // Highlight selected location
      const selectedMarker = markersRef.current.find(marker => {
        const pos = marker.getLatLng();
        return pos.lat === selectedLocation.geo?.lat && pos.lng === selectedLocation.geo?.lng;
      });

      if (selectedMarker) {
        const customIcon = L.divIcon({
          className: 'custom-marker selected',
          html: '<div class="marker-pin selected"></div>',
          iconSize: [30, 30],
          iconAnchor: [15, 30]
        });
        selectedMarker.setIcon(customIcon);
        
        // Center map on selected location
        mapInstanceRef.current.setView([selectedLocation.geo!.lat, selectedLocation.geo!.lng], 14);
      }
    }
  }, [selectedLocation]);

  const createPopupContent = (location: Location) => {
    return `
      <div class="location-popup">
        <h3 class="font-semibold text-lg mb-2">${location.name}</h3>
        <p class="text-gray-600 mb-2">${location.address}</p>
        <div class="flex items-center space-x-2 text-sm text-gray-500">
          <span class="inline-flex items-center px-2 py-1 bg-gray-100 rounded-full">
            ${getCategoryIcon(location.category)}
            ${location.category}
          </span>
          ${location.isImportant ? '<span class="text-yellow-500">⭐ Important</span>' : ''}
        </div>
      </div>
    `;
  };

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

  const showStaticMap = () => {
    if (mapRef.current) {
      mapRef.current.innerHTML = `
        <div class="bg-gray-100 rounded-lg p-8 text-center">
          <MapPin class="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 class="text-lg font-semibold text-gray-600 mb-2">Map Loading...</h3>
          <p class="text-gray-500">Interactive map will be available shortly</p>
        </div>
      `;
    }
  };

  const handleDirections = (location: Location) => {
    if (location.geo?.lat && location.geo?.lng) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${location.geo.lat},${location.geo.lng}`;
      window.open(url, '_blank');
    }
  };

  return (
    <div className="space-y-6">
      {/* Map Container */}
      <div 
        ref={mapRef} 
        className="w-full rounded-2xl overflow-hidden shadow-soft border border-white/50"
        style={{ height }}
      />

      {/* Map Controls */}
      {showControls && (
        <div className="flex flex-wrap gap-4 justify-center">
          <button
            onClick={async () => {
              if (mapInstanceRef.current && markersRef.current.length > 0) {
                const L = await import('leaflet');
                const group = new (L as any).featureGroup(markersRef.current);
                mapInstanceRef.current.fitBounds(group.getBounds().pad(0.1));
              }
            }}
            className="flex items-center space-x-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors duration-200"
          >
            <MapPin className="w-4 h-4" />
            <span>Show All Locations</span>
          </button>
          
          <button
            onClick={() => {
              if (mapInstanceRef.current) {
                mapInstanceRef.current.setView([40.7103, -89.6144], 11);
              }
            }}
            className="flex items-center space-x-2 px-4 py-2 bg-secondary-500 text-white rounded-lg hover:bg-secondary-600 transition-colors duration-200"
          >
            <Navigation className="w-4 h-4" />
            <span>Reset View</span>
          </button>
        </div>
      )}

      {/* Selected Location Details */}
      {selectedLocation && (
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-soft animate-slide-up">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-xl font-display font-semibold text-gray-900 mb-2">
                {selectedLocation.name}
              </h3>
              <p className="text-gray-600 mb-3">{selectedLocation.address}</p>
              {selectedLocation.notesPublic && (
                <p className="text-gray-700 mb-3">{selectedLocation.notesPublic}</p>
              )}
            </div>
            <button
              onClick={() => onLocationSelect(selectedLocation)}
              className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
            >
              ✕
            </button>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => handleDirections(selectedLocation)}
              className="flex items-center space-x-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors duration-200"
            >
              <Navigation className="w-4 h-4" />
              <span>Directions</span>
            </button>
            
            {selectedLocation.isImportant && (
              <div className="flex items-center space-x-2 px-3 py-2 bg-yellow-100 text-yellow-700 rounded-lg">
                <Star className="w-4 h-4 fill-current" />
                <span className="text-sm font-medium">Important Location</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Map Legend */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 border border-white/50 shadow-soft">
        <h4 className="text-sm font-semibold text-gray-900 mb-3">Location Types</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
          <div className="flex items-center space-x-2">
            <span>🌳</span>
            <span className="text-gray-600">Park</span>
          </div>
          <div className="flex items-center space-x-2">
            <span>⛪</span>
            <span className="text-gray-600">Church</span>
          </div>
          <div className="flex items-center space-x-2">
            <span>🏕️</span>
            <span className="text-gray-600">Campground</span>
          </div>
          <div className="flex items-center space-x-2">
            <span>🏫</span>
            <span className="text-gray-600">School</span>
          </div>
          <div className="flex items-center space-x-2">
            <span>🏢</span>
            <span className="text-gray-600">Community Center</span>
          </div>
          <div className="flex items-center space-x-2">
            <span>📍</span>
            <span className="text-gray-600">Other</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationMap;
