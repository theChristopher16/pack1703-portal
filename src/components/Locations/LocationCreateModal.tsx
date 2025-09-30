import React, { useState, useEffect } from 'react';
import { X, MapPin, Plus, Save, Search } from 'lucide-react';
import { Location, LocationCategory } from '../../types/firestore';

interface LocationCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (location: Omit<Location, 'id' | 'createdAt' | 'updatedAt'>) => void;
  initialLat?: number;
  initialLng?: number;
  initialAddress?: string;
}

const LOCATION_CATEGORIES: LocationCategory[] = [
  'school',
  'park', 
  'church',
  'campground',
  'community center',
  'other'
];

const LocationCreateModal: React.FC<LocationCreateModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialLat,
  initialLng,
  initialAddress
}) => {
  const [formData, setFormData] = useState({
    name: '',
    address: initialAddress || '',
    category: 'other' as LocationCategory,
    notesPublic: '',
    notesPrivate: '',
    amenities: [] as string[],
    parking: { text: '' },
    geo: {
      lat: initialLat || 37.7749,
      lng: initialLng || -122.4194
    },
    isImportant: false,
    contactInfo: '',
    specialInstructions: '',
    operatingHours: undefined as any
  });

  const [searchAddress, setSearchAddress] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [amenityInput, setAmenityInput] = useState('');

  useEffect(() => {
    if (initialLat && initialLng) {
      setFormData(prev => ({
        ...prev,
        geo: { lat: initialLat, lng: initialLng }
      }));
    }
    if (initialAddress) {
      setFormData(prev => ({
        ...prev,
        address: initialAddress
      }));
    }
  }, [initialLat, initialLng, initialAddress]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddressSearch = async () => {
    if (!searchAddress.trim()) return;

    setIsSearching(true);
    try {
      // Load Apple MapKit if not already loaded
      if (!(window as any).mapkit) {
        await loadMapKit();
      }

      // Use Apple MapKit Geocoding API
      if (!(window as any).mapkit) {
        console.error('Apple MapKit not available after loading attempt');
        alert('Address search is not available. Please enter coordinates manually.');
        return;
      }

      // Create a geocoder instance
      const geocoder = new (window as any).mapkit.Geocoder();
      
      // Perform the geocoding search
      geocoder.lookup(searchAddress, (error: any, data: any) => {
        if (error) {
          console.error('Apple MapKit geocoding error:', error);
          alert('Address search failed. Please try a different address or enter coordinates manually.');
          setIsSearching(false);
          return;
        }

        if (data && data.results && data.results.length > 0) {
          const result = data.results[0];
          const { coordinate } = result;
          
          setFormData(prev => ({
            ...prev,
            address: result.formattedAddress || searchAddress,
            geo: { lat: coordinate.latitude, lng: coordinate.longitude }
          }));
        } else {
          alert('Address not found. Please try a different address or enter coordinates manually.');
        }
        setIsSearching(false);
      });
    } catch (error) {
      console.error('Geocoding error:', error);
      alert('Address search failed. Please enter coordinates manually.');
      setIsSearching(false);
    }
  };

  const loadMapKit = async (): Promise<void> => {
    return new Promise((resolve, reject) => {
      // Check if MapKit is already loaded and initialized
      if ((window as any).mapkit && (window as any).mapkit.init) {
        resolve();
        return;
      }

      // Load MapKit JS if not already loaded
      if (!document.querySelector('script[src*="mapkit.js"]')) {
        const script = document.createElement('script');
        script.src = 'https://cdn.apple-mapkit.com/mk/5.x.x/mapkit.js';
        script.crossOrigin = 'anonymous';
        script.async = true;
        script.setAttribute('data-libraries', 'services');
        script.setAttribute('data-callback', 'initMapKitForGeocoding');
        
        // Store initialization function globally
        (window as any).initMapKitForGeocoding = () => {
          console.log('🍎 Apple MapKit JS loaded for geocoding!');
          
          // Initialize MapKit
          if (window.mapkit && window.mapkit.init) {
            window.mapkit.init({
              authorizationCallback: (done: any) => {
                // Check if we're on localhost or production and use appropriate token
                const isLocalhost = window.location.hostname === 'localhost';
                const token = isLocalhost 
                  ? 'eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IjY4RzJBNzIyVFQifQ.eyJpc3MiOiI5OTJZNUhMOVVRIiwiaWF0IjoxNzU5MTE1MDY3LCJleHAiOjE3NTkyMDE0NjcsIm9yaWdpbiI6Imh0dHA6Ly9sb2NhbGhvc3Q6MzAwMCJ9.0LrCO_JWCkVvuO16jpVTA1bvCeVCW2QvCPvtxgLXTlr3Kb8whyW7d8qLRXjUPv74yDIA1U7IVG1CNSPXtBOCxQ'
                  : 'eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IjY4RzJBNzIyVFQifQ.eyJpc3MiOiI5OTJZNUhMOVVRIiwiaWF0IjoxNzU5MTEzODE5LCJleHAiOjE3NTkyMDAyMTksIm9yaWdpbiI6Imh0dHBzOi8vcGFjazE3MDMtcG9ydGFsLndlYi5hcHAifQ.KpThZyUDfQOawxuRPwxeZry3FR-Lmviobewhq-kAzkVzQX-i4y_HNlX1OWi2ehIii-bh-8WHfWD0r_WuFnpcOQ';
                
                console.log(`🍎 Using Apple MapKit token for geocoding on ${isLocalhost ? 'localhost' : 'production'}`);
                try {
                  done(token);
                  resolve();
                } catch (error) {
                  console.error('Apple MapKit token error:', error);
                  reject(error);
                }
              }
            });
          }
        };

        document.head.appendChild(script);
      } else {
        // Wait for existing MapKit to load
        const checkMapKit = () => {
          if ((window as any).mapkit && (window as any).mapkit.init) {
            resolve();
          } else {
            setTimeout(checkMapKit, 100);
          }
        };
        checkMapKit();
      }
    });
  };

  const addAmenity = () => {
    if (amenityInput.trim()) {
      setFormData(prev => ({
        ...prev,
        amenities: [...prev.amenities, amenityInput.trim()]
      }));
      setAmenityInput('');
    }
  };

  const removeAmenity = (index: number) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.address.trim()) {
      alert('Please fill in name and address');
      return;
    }

    onSubmit(formData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
              <Plus className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h2 className="text-xl font-display font-semibold text-gray-900">
                Add New Location
              </h2>
              <p className="text-sm text-gray-500">
                {initialLat && initialLng ? 'Location from map' : 'Add location details'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="e.g., St. Francis Church"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  {LOCATION_CATEGORIES.map(category => (
                    <option key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Address Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address *
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={searchAddress}
                  onChange={(e) => setSearchAddress(e.target.value)}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Search for address..."
                />
                <button
                  type="button"
                  onClick={handleAddressSearch}
                  disabled={isSearching || !searchAddress.trim()}
                  className="px-4 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:bg-gray-400 transition-colors"
                >
                  <Search className="w-5 h-5" />
                </button>
              </div>
              
              <input
                type="text"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 mt-2"
                placeholder="Full address"
                required
              />
            </div>

            {/* Coordinates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Latitude
                </label>
                <input
                  type="number"
                  step="any"
                  value={formData.geo.lat}
                  onChange={(e) => handleInputChange('geo', { ...formData.geo, lat: parseFloat(e.target.value) })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="37.7749"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Longitude
                </label>
                <input
                  type="number"
                  step="any"
                  value={formData.geo.lng}
                  onChange={(e) => handleInputChange('geo', { ...formData.geo, lng: parseFloat(e.target.value) })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="-122.4194"
                />
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Public Notes
                </label>
                <textarea
                  value={formData.notesPublic}
                  onChange={(e) => handleInputChange('notesPublic', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  rows={3}
                  placeholder="Notes visible to all users..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Private Notes
                </label>
                <textarea
                  value={formData.notesPrivate}
                  onChange={(e) => handleInputChange('notesPrivate', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  rows={3}
                  placeholder="Notes for administrators only..."
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Information
                </label>
                <input
                  type="text"
                  value={formData.contactInfo}
                  onChange={(e) => handleInputChange('contactInfo', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Contact person or info"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Parking Information
                </label>
                <input
                  type="text"
                  value={formData.parking.text}
                  onChange={(e) => handleInputChange('parking', { text: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Parking details"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Special Instructions
              </label>
              <textarea
                value={formData.specialInstructions}
                onChange={(e) => handleInputChange('specialInstructions', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                rows={2}
                placeholder="Special access or usage instructions"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Operating Hours (Optional)
              </label>
              <textarea
                value={formData.operatingHours ? JSON.stringify(formData.operatingHours, null, 2) : ''}
                onChange={(e) => {
                  try {
                    const parsed = e.target.value ? JSON.parse(e.target.value) : undefined;
                    handleInputChange('operatingHours', parsed);
                  } catch (error) {
                    // Invalid JSON, keep the text for editing
                  }
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-mono text-sm"
                rows={4}
                placeholder='{"monday": {"open": "09:00", "close": "17:00"}, "tuesday": {"open": "09:00", "close": "17:00"}}'
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter operating hours as JSON. Use "isClosed": true for closed days.
              </p>
            </div>
          </div>

          {/* Amenities */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Amenities</h3>
            
            <div className="flex space-x-2">
              <input
                type="text"
                value={amenityInput}
                onChange={(e) => setAmenityInput(e.target.value)}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Add amenity (e.g., Restrooms, Kitchen)"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAmenity())}
              />
              <button
                type="button"
                onClick={addAmenity}
                className="px-4 py-3 bg-secondary-600 text-white rounded-xl hover:bg-secondary-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            {/* Amenities List */}
            {formData.amenities.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.amenities.map((amenity, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm"
                  >
                    {amenity}
                    <button
                      type="button"
                      onClick={() => removeAmenity(index)}
                      className="ml-2 hover:text-primary-900"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Important Location */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isImportant"
              checked={formData.isImportant}
              onChange={(e) => handleInputChange('isImportant', e.target.checked)}
              className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500"
            />
            <label htmlFor="isImportant" className="ml-3 text-sm font-medium text-gray-700">
              Mark as important location (⭐)
            </label>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 px-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              className="px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>Save Location</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LocationCreateModal;
