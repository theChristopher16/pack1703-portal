import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Users, 
  MapPin, 
  Trash2, 
  AlertCircle, 
  CheckCircle, 
  Loader2,
  X
} from 'lucide-react';
import { firestoreService } from '../../services/firestore';
import { useAdmin } from '../../contexts/AdminContext';

interface UserRSVP {
  id: string;
  eventId: string;
  familyName: string;
  email: string;
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

              {/* Cancel Button */}
              <div className="ml-4 flex flex-col">
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
    </div>
  );
};

export default UserRSVPManager;
