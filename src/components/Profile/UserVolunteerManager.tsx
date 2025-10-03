import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Calendar, 
  MapPin, 
  XCircle, 
  AlertCircle, 
  CheckCircle, 
  Loader2,
  Clock
} from 'lucide-react';
import { volunteerService, VolunteerSignup } from '../../services/volunteerService';
import { useAdmin } from '../../contexts/AdminContext';

const UserVolunteerManager: React.FC = () => {
  const { addNotification } = useAdmin();
  const [signups, setSignups] = useState<VolunteerSignup[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingSignup, setCancellingSignup] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadUserVolunteerSignups();
  }, []);

  const loadUserVolunteerSignups = async () => {
    try {
      setLoading(true);
      setError(null);
      const userSignups = await volunteerService.getUserVolunteerSignups();
      setSignups(userSignups);
    } catch (error) {
      console.error('Error loading user volunteer signups:', error);
      setError('Failed to load your volunteer signups');
      addNotification('error', 'Error', 'Failed to load your volunteer signups');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSignup = async (signupId: string) => {
    if (window.confirm('Are you sure you want to cancel your volunteer signup? This action cannot be undone.')) {
      try {
        setCancellingSignup(signupId);
        await volunteerService.cancelVolunteerSignup(signupId);
        
        // Remove the signup from the local state
        setSignups(prev => prev.filter(signup => signup.id !== signupId));
        addNotification('success', 'Success', 'Volunteer signup cancelled successfully');
      } catch (error) {
        console.error('Error cancelling volunteer signup:', error);
        addNotification('error', 'Error', 'Failed to cancel volunteer signup');
      } finally {
        setCancellingSignup(null);
      }
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'confirmed': return 'bg-green-100 text-green-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'confirmed': return <CheckCircle className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        <span className="ml-2 text-gray-600">Loading your volunteer signups...</span>
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

  if (signups.length === 0) {
    return (
      <div className="text-center py-12">
        <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Volunteer Signups</h3>
        <p className="text-gray-600">You haven't signed up for any volunteer roles yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">My Volunteer Signups</h2>
        <span className="text-sm text-gray-500">{signups.length} signup{signups.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="space-y-4">
        {signups.map((signup) => (
          <div key={signup.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {/* Event Info */}
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {signup.eventTitle}
                  </h3>
                </div>

                {/* Role Info */}
                <div className="mb-4">
                  <h4 className="font-medium text-gray-900 mb-2">Role: {signup.role}</h4>
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Volunteer Count:</span> {signup.count} person{signup.count !== 1 ? 's' : ''}
                  </div>
                </div>

                {/* Contact Info */}
                <div className="mb-4">
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Name:</span> {signup.volunteerName}
                  </div>
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Email:</span> {signup.volunteerEmail}
                  </div>
                  {signup.volunteerPhone && (
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Phone:</span> {signup.volunteerPhone}
                    </div>
                  )}
                </div>

                {/* Notes */}
                {signup.notes && (
                  <div className="mb-4">
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Notes:</span> {signup.notes}
                    </div>
                  </div>
                )}

                {/* Status and Date */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(signup.status)}`}>
                      {getStatusIcon(signup.status)}
                      <span className="ml-1 capitalize">{signup.status}</span>
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    Signed up on {formatDate(signup.createdAt)}
                  </div>
                </div>
              </div>

              {/* Cancel Button */}
              <div className="ml-4">
                <button
                  onClick={() => handleCancelSignup(signup.id)}
                  disabled={cancellingSignup === signup.id || signup.status === 'cancelled'}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                  title="Cancel volunteer signup"
                >
                  {cancellingSignup === signup.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <XCircle className="w-4 h-4" />
                  )}
                  Cancel Signup
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserVolunteerManager;
