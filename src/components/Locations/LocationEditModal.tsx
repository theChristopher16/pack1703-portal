import React, { useState, useEffect } from 'react';
import { X, Save, Trash2 } from 'lucide-react';
import { Location, LocationCategory, ParkingInfo } from '../../types/firestore';

interface LocationEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (locationData: Partial<Location>) => void;
  onDelete: () => void;
  location: Location | null;
}

interface LocationFormData {
  name: string;
  address: string;
  category: LocationCategory;
  geo?: { lat: number; lng: number };
  notesPublic: string;
  notesPrivate: string;
  parking: ParkingInfo;
  amenities: string[];
  isImportant: boolean;
  contactInfo: string;
  specialInstructions: string;
}

const LocationEditModal: React.FC<LocationEditModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  location
}) => {
  const [formData, setFormData] = useState<LocationFormData>({
    name: '',
    address: '',
    category: 'other',
    geo: undefined,
    notesPublic: '',
    notesPrivate: '',
    parking: { text: '' },
    amenities: [],
    isImportant: false,
    contactInfo: '',
    specialInstructions: ''
  });
  const [newAmenity, setNewAmenity] = useState('');

  const categories: LocationCategory[] = ['park', 'school', 'church', 'community center', 'campground', 'other'];

  useEffect(() => {
    if (location && isOpen) {
      setFormData({
        name: location.name || '',
        address: location.address || '',
        category: location.category || 'other',
        geo: location.geo || undefined,
        notesPublic: location.notesPublic || '',
        notesPrivate: location.notesPrivate || '',
        parking: location.parking || { text: '' },
        amenities: location.amenities || [],
        isImportant: location.isImportant || false,
        contactInfo: location.contactInfo || '',
        specialInstructions: location.specialInstructions || ''
      });
    }
  }, [location, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this location? This action cannot be undone.')) {
      onDelete();
      onClose();
    }
  };

  const addAmenity = () => {
    if (newAmenity.trim() && !formData.amenities.includes(newAmenity.trim())) {
      setFormData(prev => ({
        ...prev,
        amenities: [...prev.amenities, newAmenity.trim()]
      }));
      setNewAmenity('');
    }
  };

  const removeAmenity = (amenity: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.filter(a => a !== amenity)
    }));
  };

  const handleInputChange = (field: keyof LocationFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (!isOpen || !location) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-2xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-display font-bold text-gray-900">
            Edit Location
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address *
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value as LocationCategory)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1).replace('-', ' ')}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Coordinates */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Coordinates</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Latitude
                </label>
                <input
                  type="number"
                  step="any"
                  value={formData.geo?.lat || ''}
                  onChange={(e) => handleInputChange('geo', {
                    ...formData.geo,
                    lat: parseFloat(e.target.value) || 0
                  })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Longitude
                </label>
                <input
                  type="number"
                  step="any"
                  value={formData.geo?.lng || ''}
                  onChange={(e) => handleInputChange('geo', {
                    ...formData.geo,
                    lng: parseFloat(e.target.value) || 0
                  })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Notes</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Public Notes (visible to all users)
              </label>
              <textarea
                value={formData.notesPublic}
                onChange={(e) => handleInputChange('notesPublic', e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Information that all pack members can see..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Private Notes (admin only)
              </label>
              <textarea
                value={formData.notesPrivate}
                onChange={(e) => handleInputChange('notesPrivate', e.target.value)} 
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Internal notes, contact information, etc..."
              />
            </div>
          </div>

          {/* Amenities */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Amenities</h3>
            
            <div className="flex gap-2">
              <input
                type="text"
                value={newAmenity}
                onChange={(e) => setNewAmenity(e.target.value)}
                placeholder="Add amenity (e.g., restrooms, parking)"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAmenity())}
              />
              <button
                type="button"
                onClick={addAmenity}
                className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors duration-200"
              >
                Add
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {formData.amenities.map((amenity, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                >
                  {amenity}
                  <button
                    type="button"
                    onClick={() => removeAmenity(amenity)}
                    className="ml-2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Parking */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Parking Information</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Parking Details
              </label>
              <textarea
                value={formData.parking.text || ''}
                onChange={(e) => handleInputChange('parking', { ...formData.parking, text: e.target.value })}
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Parking instructions and availability..."
              />
            </div>
          </div>

          {/* Additional Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Additional Information</h3>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isImportant"
                checked={formData.isImportant}
                onChange={(e) => handleInputChange('isImportant', e.target.checked)}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <label htmlFor="isImportant" className="ml-2 text-sm text-gray-700">
                Mark as important location (starred)
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contact Information
              </label>
              <input
                type="text"
                value={formData.contactInfo}
                onChange={(e) => handleInputChange('contactInfo', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Contact person or phone number..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Special Instructions
              </label>
              <textarea
                value={formData.specialInstructions}
                onChange={(e) => handleInputChange('specialInstructions', e.target.value)}
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Special access instructions, gate codes, etc..."
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleDelete}
              className="flex items-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Location</span>
            </button>

            <div className="flex items-center space-x-4">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center space-x-2 px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors duration-200"
              >
                <Save className="w-4 h-4" />
                <span>Save Changes</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LocationEditModal;
