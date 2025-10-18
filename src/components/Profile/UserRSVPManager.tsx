import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Users, 
  MapPin, 
  Trash2, 
  AlertCircle, 
  CheckCircle, 
  Loader2,
  X,
  Edit3,
  Plus,
  Minus
} from 'lucide-react';
import { firestoreService } from '../../services/firestore';
import { useAdmin } from '../../contexts/AdminContext';

interface UserRSVP {
  id: string;
  eventId: string;
  familyName: string;
  email: string;
  phone?: string;
  attendees: Array<{
    name: string;
    age: number;
    den: string;
    isAdult: boolean;
  }>;
  dietaryRestrictions?: string;
  specialNeeds?: string;
  notes?: string;
  submittedAt: string;
  createdAt: string;
  event?: {
    id: string;
    title: string;
    date: string;
    location?: string;
  };
}

const UserRSVPManager: React.FC = () => {
  const { addNotification } = useAdmin();
  const [rsvps, setRsvps] = useState<UserRSVP[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingRSVP, setDeletingRSVP] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editingRSVP, setEditingRSVP] = useState<UserRSVP | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadUserRSVPs();
  }, []);

  const loadUserRSVPs = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await firestoreService.getUserRSVPs();
      
      if (result.success) {
        setRsvps(result.rsvps || []);
      } else {
        throw new Error(result.message || 'Failed to load RSVPs');
      }
    } catch (error) {
      console.error('Error loading user RSVPs:', error);
      setError('Failed to load your RSVPs');
      addNotification('error', 'Error', 'Failed to load your RSVPs');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRSVP = async (rsvpId: string) => {
    try {
      setDeletingRSVP(rsvpId);
      const result = await firestoreService.deleteRSVP(rsvpId);
      
      if (result.success) {
        // Remove the RSVP from the local state
        setRsvps(prev => prev.filter(rsvp => rsvp.id !== rsvpId));
        addNotification('success', 'Success', 'RSVP cancelled successfully');
      } else {
        throw new Error(result.message || 'Failed to cancel RSVP');
      }
    } catch (error) {
      console.error('Error deleting RSVP:', error);
      addNotification('error', 'Error', 'Failed to cancel RSVP');
    } finally {
      setDeletingRSVP(null);
      setShowDeleteConfirm(null);
    }
  };

  const handleEditRSVP = (rsvp: UserRSVP) => {
    setEditingRSVP(rsvp);
    setShowEditModal(true);
  };

  const handleUpdateRSVP = async (updatedData: Partial<UserRSVP>) => {
    if (!editingRSVP) return;

    try {
      setIsSubmitting(true);
      const result = await firestoreService.updateRSVP(editingRSVP.id, updatedData);
      
      if (result.success) {
        // Update the RSVP in the local state
        setRsvps(prev => prev.map(rsvp => 
          rsvp.id === editingRSVP.id 
            ? { ...rsvp, ...updatedData }
            : rsvp
        ));
        addNotification('success', 'Success', 'RSVP updated successfully');
        setShowEditModal(false);
        setEditingRSVP(null);
      } else {
        throw new Error(result.message || 'Failed to update RSVP');
      }
    } catch (error) {
      console.error('Error updating RSVP:', error);
      addNotification('error', 'Error', 'Failed to update RSVP');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const formatTime = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit'
      });
    } catch {
      return '';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        <span className="ml-2 text-gray-600">Loading your RSVPs...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
        <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
        <span className="text-red-800">{error}</span>
      </div>
    );
  }

  if (rsvps.length === 0) {
    return (
      <div className="text-center py-12">
        <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No RSVPs Found</h3>
        <p className="text-gray-600">You haven't RSVP'd for any events yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">My RSVPs</h2>
        <span className="text-sm text-gray-500">{rsvps.length} RSVP{rsvps.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="space-y-4">
        {rsvps.map((rsvp) => (
          <div key={rsvp.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {/* Event Info */}
                {rsvp.event && (
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {rsvp.event.title}
                    </h3>
                    <div className="flex items-center text-sm text-gray-600 space-x-4">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {formatDate(rsvp.event.date)}
                      </div>
                      {rsvp.event.location && (
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 mr-1" />
                          {rsvp.event.location}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Family Info */}
                <div className="mb-4">
                  <h4 className="font-medium text-gray-900 mb-2">Family: {rsvp.familyName}</h4>
                  <div className="text-sm text-gray-600 mb-2">
                    <span className="font-medium">Email:</span> {rsvp.email}
                  </div>
                </div>

                {/* Attendees */}
                <div className="mb-4">
                  <h4 className="font-medium text-gray-900 mb-2">Attendees ({rsvp.attendees.length})</h4>
                  <div className="space-y-1">
                    {rsvp.attendees.map((attendee, index) => (
                      <div key={index} className="text-sm text-gray-600 flex items-center">
                        <Users className="w-4 h-4 mr-1" />
                        {attendee.name} 
                        {attendee.isAdult ? ' (Adult)' : ` (${attendee.age} years old, ${attendee.den})`}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Additional Info */}
                {(rsvp.dietaryRestrictions || rsvp.specialNeeds || rsvp.notes) && (
                  <div className="mb-4">
                    {rsvp.dietaryRestrictions && (
                      <div className="text-sm text-gray-600 mb-1">
                        <span className="font-medium">Dietary Restrictions:</span> {rsvp.dietaryRestrictions}
                      </div>
                    )}
                    {rsvp.specialNeeds && (
                      <div className="text-sm text-gray-600 mb-1">
                        <span className="font-medium">Special Needs:</span> {rsvp.specialNeeds}
                      </div>
                    )}
                    {rsvp.notes && (
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Notes:</span> {rsvp.notes}
                      </div>
                    )}
                  </div>
                )}

                {/* RSVP Date */}
                <div className="text-xs text-gray-500">
                  RSVP'd on {formatDate(rsvp.submittedAt)} at {formatTime(rsvp.submittedAt)}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="ml-4 flex flex-col space-y-2">
                {/* Edit Button */}
                <button
                  onClick={() => handleEditRSVP(rsvp)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
                  title="Edit RSVP"
                >
                  <Edit3 className="w-4 h-4" />
                  Edit RSVP
                </button>

                {/* Cancel Button */}
                {showDeleteConfirm === rsvp.id ? (
                  <div className="flex flex-col space-y-2">
                    <p className="text-sm text-gray-600 mb-2">Cancel this RSVP?</p>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleDeleteRSVP(rsvp.id)}
                        disabled={deletingRSVP === rsvp.id}
                        className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50 flex items-center"
                      >
                        {deletingRSVP === rsvp.id ? (
                          <Loader2 className="w-3 h-3 animate-spin mr-1" />
                        ) : (
                          <Trash2 className="w-3 h-3 mr-1" />
                        )}
                        Yes, Cancel
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(null)}
                        className="px-3 py-1 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400"
                      >
                        <X className="w-3 h-3 mr-1" />
                        No
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowDeleteConfirm(rsvp.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors whitespace-nowrap"
                    title="Cancel RSVP"
                  >
                    <Trash2 className="w-4 h-4" />
                    Cancel RSVP
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Edit RSVP Modal */}
      {showEditModal && editingRSVP && (
        <EditRSVPModal
          rsvp={editingRSVP}
          onSave={handleUpdateRSVP}
          onCancel={() => {
            setShowEditModal(false);
            setEditingRSVP(null);
          }}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
};

// Edit RSVP Modal Component
interface EditRSVPModalProps {
  rsvp: UserRSVP;
  onSave: (data: Partial<UserRSVP>) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

const EditRSVPModal: React.FC<EditRSVPModalProps> = ({ rsvp, onSave, onCancel, isSubmitting }) => {
  const [formData, setFormData] = useState({
    familyName: rsvp.familyName,
    email: rsvp.email,
    phone: rsvp.phone || '',
    dietaryRestrictions: rsvp.dietaryRestrictions || '',
    specialNeeds: rsvp.specialNeeds || '',
    notes: rsvp.notes || '',
    attendees: rsvp.attendees
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.familyName.trim()) {
      newErrors.familyName = 'Family name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (formData.attendees.length === 0) {
      newErrors.attendees = 'At least one attendee is required';
    }

    formData.attendees.forEach((attendee, index) => {
      if (!attendee.name.trim()) {
        newErrors[`attendee_${index}_name`] = 'Attendee name is required';
      }
      if (!attendee.isAdult && (attendee.age < 1 || attendee.age > 18)) {
        newErrors[`attendee_${index}_age`] = 'Age must be between 1 and 18';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSave(formData);
    }
  };

  const handleAttendeeChange = (index: number, field: string, value: any) => {
    const newAttendees = [...formData.attendees];
    newAttendees[index] = { ...newAttendees[index], [field]: value };
    setFormData({ ...formData, attendees: newAttendees });
  };

  const addAttendee = () => {
    setFormData({
      ...formData,
      attendees: [...formData.attendees, { name: '', age: 0, den: '', isAdult: false }]
    });
  };

  const removeAttendee = (index: number) => {
    if (formData.attendees.length > 1) {
      const newAttendees = formData.attendees.filter((_, i) => i !== index);
      setFormData({ ...formData, attendees: newAttendees });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-white/50 shadow-soft">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-display font-bold text-gray-900">Edit RSVP</h2>
              <p className="text-gray-600 mt-1">
                {rsvp.event?.title} - {rsvp.event?.date}
              </p>
            </div>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 transition-colors duration-200 text-2xl"
            >
              ✕
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Family Information */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <span className="text-blue-600 mr-2">👨‍👩‍👧‍👦</span>
                Family Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Family Name *
                  </label>
                  <input
                    type="text"
                    value={formData.familyName}
                    onChange={(e) => setFormData({ ...formData, familyName: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.familyName ? 'border-red-300' : 'border-gray-200'
                    }`}
                  />
                  {errors.familyName && (
                    <p className="text-red-600 text-sm mt-1">{errors.familyName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.email ? 'border-red-300' : 'border-gray-200'
                    }`}
                  />
                  {errors.email && (
                    <p className="text-red-600 text-sm mt-1">{errors.email}</p>
                  )}
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>

            {/* Attendees */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <span className="text-green-600 mr-2">👥</span>
                  Attendees
                </h3>
                <button
                  type="button"
                  onClick={addAttendee}
                  className="flex items-center gap-2 px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Attendee
                </button>
              </div>
              
              <div className="space-y-4">
                {formData.attendees.map((attendee, index) => (
                  <div key={index} className="bg-white/70 p-4 rounded-lg border border-green-200">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900">Attendee {index + 1}</h4>
                      {formData.attendees.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeAttendee(index)}
                          className="text-red-600 hover:text-red-700 p-1"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Name *
                        </label>
                        <input
                          type="text"
                          value={attendee.name}
                          onChange={(e) => handleAttendeeChange(index, 'name', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                            errors[`attendee_${index}_name`] ? 'border-red-300' : 'border-gray-200'
                          }`}
                        />
                        {errors[`attendee_${index}_name`] && (
                          <p className="text-red-600 text-sm mt-1">{errors[`attendee_${index}_name`]}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Age
                        </label>
                        <input
                          type="number"
                          value={attendee.age}
                          onChange={(e) => handleAttendeeChange(index, 'age', parseInt(e.target.value) || 0)}
                          disabled={attendee.isAdult}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                            attendee.isAdult ? 'bg-gray-100' : ''
                          } ${errors[`attendee_${index}_age`] ? 'border-red-300' : 'border-gray-200'}`}
                        />
                        {errors[`attendee_${index}_age`] && (
                          <p className="text-red-600 text-sm mt-1">{errors[`attendee_${index}_age`]}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Den
                        </label>
                        <select
                          value={attendee.den}
                          onChange={(e) => handleAttendeeChange(index, 'den', e.target.value)}
                          disabled={attendee.isAdult}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                            attendee.isAdult ? 'bg-gray-100' : ''
                          } border-gray-200`}
                        >
                          <option value="">Select Den</option>
                          <option value="Lions">Lions (Kindergarten)</option>
                          <option value="Tigers">Tigers (1st Grade)</option>
                          <option value="Wolves">Wolves (2nd Grade)</option>
                          <option value="Bears">Bears (3rd Grade)</option>
                          <option value="Webelos">Webelos (4th Grade)</option>
                          <option value="AOL">Arrow of Light (5th Grade)</option>
                        </select>
                      </div>
                    </div>

                    <div className="mt-3">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={attendee.isAdult}
                          onChange={(e) => handleAttendeeChange(index, 'isAdult', e.target.checked)}
                          className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                        />
                        <span className="ml-2 text-sm font-medium text-gray-700">
                          This is an adult
                        </span>
                      </label>
                    </div>
                  </div>
                ))}
              </div>
              {errors.attendees && (
                <p className="text-red-600 text-sm mt-2">{errors.attendees}</p>
              )}
            </div>

            {/* Additional Information */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <span className="text-purple-600 mr-2">📝</span>
                Additional Information
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dietary Restrictions
                  </label>
                  <textarea
                    value={formData.dietaryRestrictions}
                    onChange={(e) => setFormData({ ...formData, dietaryRestrictions: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Any allergies or dietary restrictions..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Special Needs
                  </label>
                  <textarea
                    value={formData.specialNeeds}
                    onChange={(e) => setFormData({ ...formData, specialNeeds: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Any special needs or accommodations..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Additional Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Any other information we should know..."
                  />
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex gap-4 justify-end pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onCancel}
                className="px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors duration-200 font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`px-8 py-3 rounded-xl font-medium transition-all duration-200 shadow-soft ${
                  isSubmitting 
                    ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white'
                }`}
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UserRSVPManager;
