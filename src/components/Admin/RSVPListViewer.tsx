import React, { useState, useEffect } from 'react';
import { Users, X, Download, RefreshCw, AlertCircle, CheckCircle, Home, Mail, Phone, Clipboard, User, Trash2, DollarSign, Clock } from 'lucide-react';
import { firestoreService } from '../../services/firestore';
import { useAdmin } from '../../contexts/AdminContext';
import { paymentService } from '../../services/paymentService';

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
  paperworkComplete?: boolean;
  paperworkCompletedAt?: any;
  paperworkApprovedBy?: string;
  paperworkApprovedByName?: string;
  paymentRequired?: boolean;
  paymentStatus?: 'not_required' | 'pending' | 'completed' | 'failed';
  paymentAmount?: number;
  paymentMethod?: string;
  paidAt?: any;
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
  const [deletingRSVP, setDeletingRSVP] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const { state, hasPermission } = useAdmin();
  const isAdmin = state.currentUser?.isAdmin || false;

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
    if (!timestamp) return 'Unknown';
    
    try {
      // Handle ISO string timestamp (from Cloud Function)
      if (typeof timestamp === 'string') {
        const date = new Date(timestamp);
        if (!isNaN(date.getTime())) {
          return date.toLocaleString();
        }
      }
      
      // Handle Firestore timestamp
      if (timestamp.toDate) {
        return timestamp.toDate().toLocaleString();
      }
      
      // Handle Firestore timestamp serialized as object
      if (timestamp.seconds && timestamp.nanoseconds) {
        return new Date(timestamp.seconds * 1000 + timestamp.nanoseconds / 1000000).toLocaleString();
      }
      
      // Handle Firestore timestamp serialized as object with _seconds and _nanoseconds
      if (timestamp._seconds && timestamp._nanoseconds) {
        return new Date(timestamp._seconds * 1000 + timestamp._nanoseconds / 1000000).toLocaleString();
      }
      
      // Handle number timestamp (milliseconds)
      if (typeof timestamp === 'number') {
        const date = new Date(timestamp);
        if (!isNaN(date.getTime())) {
          return date.toLocaleString();
        }
      }
      
      // Handle Date object
      if (timestamp instanceof Date) {
        return timestamp.toLocaleString();
      }
      
      // Fallback: try to create a date from the value
      const date = new Date(timestamp);
      if (!isNaN(date.getTime())) {
        return date.toLocaleString();
      }
      
      return 'Unknown date';
    } catch (error) {
      console.warn('Error formatting date:', timestamp, error);
      return 'Unknown date';
    }
  };

  const exportRSVPs = () => {
    const csvData = [
      ['Family Name', 'Email', 'Phone', 'Attendee Count', 'Attendees', 'Payment Status', 'Payment Amount', 'Payment Method', 'Dietary Restrictions', 'Special Needs', 'Notes', 'Submitted At'],
      ...rsvps.map(rsvp => [
        rsvp.familyName,
        rsvp.email,
        rsvp.phone || '',
        rsvp.attendees.length.toString(),
        rsvp.attendees.map(a => `${a.name} (${a.age}, ${a.den || 'No Den'})`).join('; '),
        rsvp.paymentStatus || 'N/A',
        rsvp.paymentAmount ? `$${(rsvp.paymentAmount / 100).toFixed(2)}` : 'N/A',
        rsvp.paymentMethod || 'N/A',
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

  const handleDeleteRSVP = async (rsvpId: string) => {
    if (!isAdmin && !hasPermission('events:delete')) {
      setError('You do not have permission to delete RSVPs');
      return;
    }

    setDeletingRSVP(rsvpId);
    setError(null);

    try {
      const result = await firestoreService.deleteRSVP(rsvpId);
      
      if (result.success) {
        // Remove the RSVP from the local state
        setRsvps(prev => prev.filter(rsvp => rsvp.id !== rsvpId));
        setShowDeleteConfirm(null);
      } else {
        setError(result.message || 'Failed to delete RSVP');
      }
    } catch (error) {
      console.error('Error deleting RSVP:', error);
      setError('Failed to delete RSVP');
    } finally {
      setDeletingRSVP(null);
    }
  };

  const canDeleteRSVP = () => {
    const canDelete = isAdmin || hasPermission('events:delete');
    console.log('RSVPListViewer: canDeleteRSVP check:', {
      isAdmin,
      hasEventDelete: hasPermission('events:delete'),
      canDelete
    });
    return canDelete;
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
        {/* Header - More compact for mobile */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center space-x-3 min-w-0 flex-1">
            <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Users className="w-4 h-4 text-primary-600" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-bold text-gray-900 truncate">RSVP List</h2>
              <p className="text-sm text-gray-600 truncate">{eventTitle}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 flex-shrink-0">
            <button
              onClick={exportRSVPs}
              className="px-3 py-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors duration-200 flex items-center space-x-1 text-sm"
            >
              <Download className="w-3 h-3" />
              <span className="hidden sm:inline">Export</span>
            </button>
            
            <button
              onClick={loadRSVPs}
              className="px-3 py-1.5 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors duration-200 flex items-center space-x-1 text-sm"
            >
              <RefreshCw className="w-3 h-3" />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors duration-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Stats - Compact horizontal layout */}
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex-shrink-0">
          <div className="flex justify-between items-center">
            <div className="text-center flex-1">
              <div className="text-lg font-bold text-primary-600">{rsvps.length}</div>
              <div className="text-xs text-gray-600">RSVPs</div>
            </div>
            <div className="text-center flex-1">
              <div className="text-lg font-bold text-secondary-600">{getTotalAttendees()}</div>
              <div className="text-xs text-gray-600">Attendees</div>
            </div>
            <div className="text-center flex-1">
              <div className="text-lg font-bold text-accent-600">
                {Object.keys(getDenBreakdown()).length}
              </div>
              <div className="text-xs text-gray-600">Dens</div>
            </div>
          </div>
        </div>

        {/* Error State - More compact */}
        {error && (
          <div className="px-4 py-3 flex-shrink-0">
            <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <span className="text-red-700 text-sm">{error}</span>
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
            <div className="p-4 space-y-4">
              {rsvps.map((rsvp) => (
                <div key={rsvp.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                  <div className="flex items-start justify-between mb-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="text-base font-semibold text-gray-900 truncate">{rsvp.familyName}</h3>
                        {rsvp.paperworkComplete && (
                          <div 
                            className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium flex-shrink-0"
                            title={`Paperwork approved by ${rsvp.paperworkApprovedByName || 'Admin'} on ${rsvp.paperworkCompletedAt ? new Date(rsvp.paperworkCompletedAt).toLocaleDateString() : 'N/A'}`}
                          >
                            <CheckCircle className="h-3 w-3" />
                            <span className="hidden sm:inline">Paperwork Complete</span>
                            <span className="sm:hidden">✓</span>
                          </div>
                        )}
                        {rsvp.paymentRequired && rsvp.paymentStatus === 'completed' && (
                          <div 
                            className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium flex-shrink-0"
                            title={`Paid ${rsvp.paymentAmount ? paymentService.formatCurrency(rsvp.paymentAmount) : ''} via ${rsvp.paymentMethod || 'unknown'}`}
                          >
                            <DollarSign className="h-3 w-3" />
                            <span className="hidden sm:inline">Paid</span>
                            <span className="sm:hidden">$</span>
                          </div>
                        )}
                        {rsvp.paymentRequired && rsvp.paymentStatus === 'pending' && (
                          <div 
                            className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-xs font-medium flex-shrink-0"
                            title={`Payment pending: ${rsvp.paymentAmount ? paymentService.formatCurrency(rsvp.paymentAmount) : ''}`}
                          >
                            <Clock className="h-3 w-3" />
                            <span className="hidden sm:inline">Payment Pending</span>
                            <span className="sm:hidden">⏱</span>
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 truncate">{rsvp.email}</p>
                      {rsvp.phone && (
                        <p className="text-xs text-gray-500">{rsvp.phone}</p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
                      <div className="text-right">
                        <div className="text-xs text-gray-500">
                          {formatDate(rsvp.submittedAt)}
                        </div>
                        <div className="text-sm font-medium text-primary-600">
                          {rsvp.attendees.length} attendee{rsvp.attendees.length !== 1 ? 's' : ''}
                        </div>
                      </div>
                      {(() => {
                        const canDelete = canDeleteRSVP();
                        console.log('RSVPListViewer: Rendering delete button for RSVP:', rsvp.id, 'canDelete:', canDelete);
                        return canDelete && (
                          <button
                            onClick={() => setShowDeleteConfirm(rsvp.id)}
                            disabled={deletingRSVP === rsvp.id}
                            className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors duration-200 disabled:opacity-50"
                            title="Delete RSVP"
                          >
                            {deletingRSVP === rsvp.id ? (
                              <RefreshCw className="w-3 h-3 animate-spin" />
                            ) : (
                              <Trash2 className="w-3 h-3" />
                            )}
                          </button>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Attendees */}
                  <div className="mb-3">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Attendees</h4>
                    <div className="grid grid-cols-1 gap-1.5">
                      {rsvp.attendees.map((attendee, index) => (
                        <div key={index} className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg">
                          <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                            attendee.isAdult ? 'bg-blue-500' : 'bg-green-500'
                          }`}></div>
                          <div className="flex-1 min-w-0">
                            <span className="text-sm font-medium text-gray-900">{attendee.name}</span>
                            <span className="text-xs text-gray-600 ml-2">
                              Age {attendee.age}
                              {attendee.den && ` • ${attendee.den}`}
                            </span>
                          </div>
                          {attendee.isAdult && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full flex-shrink-0">
                              Adult
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Additional Information */}
                  {(rsvp.dietaryRestrictions || rsvp.specialNeeds || rsvp.notes) && (
                    <div className="space-y-1.5">
                      {rsvp.dietaryRestrictions && (
                        <div>
                          <span className="text-xs font-medium text-gray-700">Dietary: </span>
                          <span className="text-xs text-gray-600">{rsvp.dietaryRestrictions}</span>
                        </div>
                      )}
                      {rsvp.specialNeeds && (
                        <div>
                          <span className="text-xs font-medium text-gray-700">Special Needs: </span>
                          <span className="text-xs text-gray-600">{rsvp.specialNeeds}</span>
                        </div>
                      )}
                      {rsvp.notes && (
                        <div>
                          <span className="text-xs font-medium text-gray-700">Notes: </span>
                          <span className="text-xs text-gray-600">{rsvp.notes}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Delete Confirmation Dialog */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-red-100 rounded-full">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Delete RSVP</h3>
              </div>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this RSVP? This action cannot be undone and will remove all attendee information.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteRSVP(showDeleteConfirm)}
                  disabled={deletingRSVP === showDeleteConfirm}
                  className="flex-1 px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors duration-200 disabled:opacity-50"
                >
                  {deletingRSVP === showDeleteConfirm ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer - More compact */}
        <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-600">
              {rsvps.length} RSVP{rsvps.length !== 1 ? 's' : ''} • {getTotalAttendees()} attendees
            </div>
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors duration-200 text-sm"
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
