import React, { useState, useEffect } from 'react';
import { Users, X, Download, RefreshCw, AlertCircle, CheckCircle, Home, Mail, Phone, Clipboard, User } from 'lucide-react';
import { firestoreService } from '../../services/firestore';

interface RSVPData {
  id: string;
  eventId: string;
  userId: string;
  userEmail: string;
  familyName: string;
  email: string;
  phone?: string;
  attendees: Array<{
    name: string;
    age: number;
    den?: string;
    isAdult: boolean;
  }>;
  dietaryRestrictions?: string;
  specialNeeds?: string;
  notes?: string;
  submittedAt: any;
  createdAt: any;
}

interface RSVPListViewerProps {
  eventId: string;
  eventTitle: string;
  onClose: () => void;
}

const RSVPListViewer: React.FC<RSVPListViewerProps> = ({
  eventId,
  eventTitle,
  onClose
}) => {
  const [rsvps, setRsvps] = useState<RSVPData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRSVPs();
  }, [eventId]);

  // Prevent body scrolling when modal is open
  useEffect(() => {
    // Save the current overflow style
    const originalOverflow = document.body.style.overflow;
    
    // Prevent body scrolling
    document.body.style.overflow = 'hidden';
    
    // Cleanup function to restore scrolling when modal closes
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  const loadRSVPs = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('RSVPListViewer: Loading RSVPs for event:', eventId);

      // Use Cloud Function to get RSVP data (bypasses client-side permissions)
      console.log('RSVPListViewer: Calling getRSVPData Cloud Function...');
      const result = await firestoreService.getRSVPData(eventId);
      
      if (result.success) {
        console.log('RSVPListViewer: Cloud Function successful, found', result.count, 'RSVPs');
        console.log('RSVPListViewer: Sample RSVP data:', result.rsvps?.[0]);
        if (result.rsvps?.[0]?.submittedAt) {
          console.log('RSVPListViewer: Sample submittedAt:', result.rsvps[0].submittedAt);
          console.log('RSVPListViewer: submittedAt type:', typeof result.rsvps[0].submittedAt);
          console.log('RSVPListViewer: submittedAt keys:', Object.keys(result.rsvps[0].submittedAt || {}));
        }
        setRsvps(result.rsvps || []);
      } else {
        throw new Error(result.message || 'Failed to load RSVP data');
      }
    } catch (error) {
      console.error('Error loading RSVPs:', error);
      setError('Failed to load RSVPs');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: any) => {
    console.log('formatDate called with:', timestamp, 'type:', typeof timestamp);
    
    if (!timestamp) return 'Unknown';
    
    try {
      // Handle Firestore timestamp
      if (timestamp.toDate) {
        console.log('Using toDate() method');
        return timestamp.toDate().toLocaleString();
      }
      
      // Handle Firestore timestamp serialized as object
      if (timestamp.seconds && timestamp.nanoseconds) {
        console.log('Using seconds/nanoseconds:', timestamp.seconds, timestamp.nanoseconds);
        return new Date(timestamp.seconds * 1000 + timestamp.nanoseconds / 1000000).toLocaleString();
      }
      
      // Handle Firestore timestamp serialized as object with _seconds and _nanoseconds
      if (timestamp._seconds && timestamp._nanoseconds) {
        console.log('Using _seconds/_nanoseconds:', timestamp._seconds, timestamp._nanoseconds);
        return new Date(timestamp._seconds * 1000 + timestamp._nanoseconds / 1000000).toLocaleString();
      }
      
      // Handle string timestamp
      if (typeof timestamp === 'string') {
        console.log('Using string timestamp:', timestamp);
        const date = new Date(timestamp);
        if (!isNaN(date.getTime())) {
          return date.toLocaleString();
        }
      }
      
      // Handle number timestamp (milliseconds)
      if (typeof timestamp === 'number') {
        console.log('Using number timestamp:', timestamp);
        const date = new Date(timestamp);
        if (!isNaN(date.getTime())) {
          return date.toLocaleString();
        }
      }
      
      // Handle Date object
      if (timestamp instanceof Date) {
        console.log('Using Date object');
        return timestamp.toLocaleString();
      }
      
      // If we get here, try to create a date from the value
      console.log('Trying fallback date creation');
      const date = new Date(timestamp);
      if (!isNaN(date.getTime())) {
        return date.toLocaleString();
      }
      
      console.log('All date formatting attempts failed');
      return 'Unknown date';
    } catch (error) {
      console.warn('Error formatting date:', timestamp, error);
      return 'Unknown date';
    }
  };

  const exportRSVPs = () => {
    const csvData = [
      ['Family Name', 'Email', 'Phone', 'Attendee Count', 'Attendees', 'Dietary Restrictions', 'Special Needs', 'Notes', 'Submitted At'],
      ...rsvps.map(rsvp => [
        rsvp.familyName,
        rsvp.email,
        rsvp.phone || '',
        rsvp.attendees.length.toString(),
        rsvp.attendees.map(a => `${a.name} (${a.age}, ${a.den || 'No Den'})`).join('; '),
        rsvp.dietaryRestrictions || '',
        rsvp.specialNeeds || '',
        rsvp.notes || '',
        formatDate(rsvp.submittedAt)
      ])
    ];

    const csvContent = csvData.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${eventTitle.replace(/[^a-z0-9]/gi, '_')}_rsvps.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getTotalAttendees = () => {
    return rsvps.reduce((total, rsvp) => total + rsvp.attendees.length, 0);
  };

  const getDenBreakdown = () => {
    const denCounts: { [key: string]: number } = {};
    
    rsvps.forEach(rsvp => {
      rsvp.attendees.forEach(attendee => {
        const den = attendee.den || 'No Den';
        denCounts[den] = (denCounts[den] || 0) + 1;
      });
    });
    
    return denCounts;
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
          <div className="flex items-center justify-center">
            <RefreshCw className="w-8 h-8 text-primary-500 animate-spin mr-3" />
            <span className="text-lg font-medium">Loading RSVPs...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-hidden">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">RSVP List</h2>
              <p className="text-gray-600">{eventTitle}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={exportRSVPs}
              className="px-4 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors duration-200 flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
            
            <button
              onClick={loadRSVPs}
              className="px-4 py-2 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-colors duration-200 flex items-center space-x-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
            
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="p-6 bg-gray-50 border-b border-gray-200 flex-shrink-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-600">{rsvps.length}</div>
              <div className="text-gray-600">Total RSVPs</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-secondary-600">{getTotalAttendees()}</div>
              <div className="text-gray-600">Total Attendees</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-accent-600">
                {Object.keys(getDenBreakdown()).length}
              </div>
              <div className="text-gray-600">Dens Represented</div>
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="p-6 flex-shrink-0">
            <div className="flex items-center space-x-3 p-4 bg-red-50 border border-red-200 rounded-xl">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <span className="text-red-700">{error}</span>
            </div>
          </div>
        )}

        {/* Content - This is the scrollable area */}
        <div className="flex-1 overflow-y-auto min-h-0" style={{ maxHeight: 'calc(90vh - 300px)' }}>
          {rsvps.length === 0 ? (
            <div className="p-8 text-center">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No RSVPs Yet</h3>
              <p className="text-gray-600">No one has RSVP'd for this event yet.</p>
            </div>
          ) : (
            <div className="p-6 space-y-6">
              {rsvps.map((rsvp) => (
                <div key={rsvp.id} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{rsvp.familyName}</h3>
                      <p className="text-gray-600">{rsvp.email}</p>
                      {rsvp.phone && (
                        <p className="text-sm text-gray-500">{rsvp.phone}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500">
                        {formatDate(rsvp.submittedAt)}
                      </div>
                      <div className="text-sm font-medium text-primary-600">
                        {rsvp.attendees.length} attendee{rsvp.attendees.length !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>

                  {/* Attendees */}
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-900 mb-2">Attendees</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {rsvp.attendees.map((attendee, index) => (
                        <div key={index} className="flex items-center space-x-3 p-2 bg-gray-50 rounded-lg">
                          <div className={`w-2 h-2 rounded-full ${
                            attendee.isAdult ? 'bg-blue-500' : 'bg-green-500'
                          }`}></div>
                          <div className="flex-1">
                            <span className="font-medium text-gray-900">{attendee.name}</span>
                            <span className="text-sm text-gray-600 ml-2">
                              Age {attendee.age}
                              {attendee.den && ` • ${attendee.den}`}
                            </span>
                          </div>
                          {attendee.isAdult && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                              Adult
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Additional Information */}
                  {(rsvp.dietaryRestrictions || rsvp.specialNeeds || rsvp.notes) && (
                    <div className="space-y-2">
                      {rsvp.dietaryRestrictions && (
                        <div>
                          <span className="text-sm font-medium text-gray-700">Dietary Restrictions: </span>
                          <span className="text-sm text-gray-600">{rsvp.dietaryRestrictions}</span>
                        </div>
                      )}
                      {rsvp.specialNeeds && (
                        <div>
                          <span className="text-sm font-medium text-gray-700">Special Needs: </span>
                          <span className="text-sm text-gray-600">{rsvp.specialNeeds}</span>
                        </div>
                      )}
                      {rsvp.notes && (
                        <div>
                          <span className="text-sm font-medium text-gray-700">Notes: </span>
                          <span className="text-sm text-gray-600">{rsvp.notes}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing {rsvps.length} RSVP{rsvps.length !== 1 ? 's' : ''} • {getTotalAttendees()} total attendees
            </div>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors duration-200"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RSVPListViewer;
