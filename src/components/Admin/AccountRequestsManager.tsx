import React, { useState, useEffect, useRef } from 'react';
import { 
  UserPlus, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Mail, 
  Phone, 
  MapPin, 
  Shield,
  AlertCircle,
  Loader2,
  RefreshCw,
  Download
} from 'lucide-react';
import { accountRequestService, AccountRequest } from '../../services/accountRequestService';
import { useAdmin } from '../../contexts/AdminContext';
import { collection, query, where, orderBy, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { getFunctions, httpsCallable } from 'firebase/functions';

const AccountRequestsManager: React.FC = () => {
  const { addNotification } = useAdmin();
  const [requests, setRequests] = useState<AccountRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasLoaded = useRef(false);
  const unsubscribeRef = useRef<Unsubscribe | null>(null);

  // Set up real-time listener for account requests
  useEffect(() => {
    console.log('Setting up real-time listener for account requests');
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Query for pending account requests
      const requestsQuery = query(
        collection(db, 'accountRequests'),
        where('status', '==', 'pending'),
        orderBy('createdAt', 'desc')
      );
      
      // Set up real-time listener
      const unsubscribe = onSnapshot(
        requestsQuery,
        (snapshot) => {
          console.log('Account requests updated:', snapshot.size, 'pending requests');
          
          const requestsData: AccountRequest[] = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            requestsData.push({
              id: doc.id,
              email: data.email,
              displayName: data.displayName,
              phone: data.phone || '',
              address: data.address || '',
              scoutRank: data.scoutRank || '',
              den: data.den || '',
              emergencyContact: data.emergencyContact || '',
              reason: data.reason || '',
              status: data.status,
              submittedAt: data.submittedAt,
              createdAt: data.createdAt,
              approvedBy: data.approvedBy,
              approvedAt: data.approvedAt,
              approvedRole: data.approvedRole,
              rejectedBy: data.rejectedBy,
              rejectedAt: data.rejectedAt,
              rejectionReason: data.rejectionReason
            });
          });
          
          setRequests(requestsData);
          setIsLoading(false);
          hasLoaded.current = true;
        },
        (error) => {
          console.error('Error listening to account requests:', error);
          setError('Failed to load account requests');
          setIsLoading(false);
        }
      );
      
      // Store unsubscribe function
      unsubscribeRef.current = unsubscribe;
      
      // Cleanup function
      return () => {
        if (unsubscribeRef.current) {
          console.log('Cleaning up account requests listener');
          unsubscribeRef.current();
          unsubscribeRef.current = null;
        }
      };
    } catch (error: any) {
      console.error('Error setting up account requests listener:', error);
      setError('Failed to set up real-time updates');
      setIsLoading(false);
    }
  }, []); // Empty dependency array - only run once

  const handleApprove = async (requestId: string, role: string = 'parent') => {
    try {
      setIsProcessing(requestId);
      
      const result = await accountRequestService.approveRequest(requestId, role);
      
      if (result.success) {
        addNotification('success', 'Success', result.message);
        // No need to reload - real-time listener will update automatically
      } else {
        addNotification('error', 'Error', result.message);
      }
    } catch (error: any) {
      addNotification('error', 'Error', 'Failed to approve request');
    } finally {
      setIsProcessing(null);
    }
  };

  const handleReject = async (requestId: string, reason: string = '') => {
    try {
      setIsProcessing(requestId);
      
      const result = await accountRequestService.rejectRequest(requestId, reason);
      
      if (result.success) {
        addNotification('success', 'Success', result.message);
        // No need to reload - real-time listener will update automatically
      } else {
        addNotification('error', 'Error', result.message);
      }
    } catch (error: any) {
      addNotification('error', 'Error', 'Failed to reject request');
    } finally {
      setIsProcessing(null);
    }
  };

  const handleImportGoogleUsers = async () => {
    if (!window.confirm('This will create account requests for all Google sign-in users who don\'t have requests. Continue?')) {
      return;
    }

    try {
      setIsImporting(true);
      const functions = getFunctions();
      const createRequests = httpsCallable(functions, 'createRequestsForExistingGoogleUsers');
      
      const result = await createRequests({});
      const data = result.data as any;
      
      if (data.success) {
        addNotification('success', 'Import Complete', data.message || `Processed ${data.results?.processed || 0} users. Created ${data.results?.created || 0} new requests.`);
      } else {
        addNotification('error', 'Import Failed', data.message || 'Failed to import Google users');
      }
    } catch (error: any) {
      console.error('Error importing Google users:', error);
      addNotification('error', 'Import Failed', error.message || 'Failed to import Google users. Check console for details.');
    } finally {
      setIsImporting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading account requests...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center shadow-glow-primary/30">
            <UserPlus className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-display font-bold text-gray-900">Account Requests</h2>
            <p className="text-gray-600 font-medium">
              Review and approve new member requests
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={handleImportGoogleUsers}
            disabled={isImporting}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 rounded-xl transition-all duration-200 font-medium shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            title="Import Google sign-in users who don't have account requests"
          >
            <Download className={`w-4 h-4 ${isImporting ? 'animate-spin' : ''}`} />
            {isImporting ? 'Importing...' : 'Import Google Users'}
          </button>
          
          <button
            onClick={() => {
              // Force a refresh by temporarily disabling and re-enabling the listener
              if (unsubscribeRef.current) {
                unsubscribeRef.current();
                unsubscribeRef.current = null;
              }
              // The useEffect will automatically restart the listener
              window.location.reload();
            }}
            className="flex items-center gap-2 px-6 py-3 bg-white/90 backdrop-blur-sm text-gray-700 hover:text-gray-900 hover:bg-white rounded-xl transition-all duration-200 border border-gray-200/50 font-medium"
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        </div>
      )}

      {/* Requests List */}
      {requests.length === 0 ? (
        <div className="text-center py-12">
          <UserPlus className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Pending Requests</h3>
          <p className="text-gray-600">All account requests have been reviewed.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {requests.map((request) => (
            <div key={request.id} className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/50 shadow-soft">
              <div className="p-8">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center shadow-glow-primary/30">
                      <UserPlus className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">
                        {request.displayName}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        {getStatusIcon(request.status)}
                        <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(request.status)}`}>
                          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-sm text-gray-500 font-medium">
                      Submitted {request.submittedAt?.toDate?.()?.toLocaleDateString() || 'Recently'}
                    </p>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-xl p-6 mb-6">
                  <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-primary-600" />
                    Contact Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      <Mail className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-700 font-medium">{request.email}</span>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Phone className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-700 font-medium">{request.phone}</span>
                    </div>
                    
                    <div className="flex items-start gap-3 md:col-span-2">
                      <MapPin className="w-4 h-4 text-gray-500 mt-0.5" />
                      <span className="text-sm text-gray-700 font-medium">{request.address}</span>
                    </div>
                  </div>
                </div>

                {/* Scouting Information */}
                {(request.scoutRank || request.den || request.emergencyContact) && (
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50/50 rounded-xl p-6 mb-6">
                    <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                      <Shield className="w-4 h-4 text-green-600" />
                      Scouting Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {request.scoutRank && (
                        <div className="flex flex-col">
                          <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">Rank</span>
                          <span className="text-sm font-semibold text-gray-800">{request.scoutRank}</span>
                        </div>
                      )}
                      {request.den && (
                        <div className="flex flex-col">
                          <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">Den</span>
                          <span className="text-sm font-semibold text-gray-800">{request.den}</span>
                        </div>
                      )}
                      {request.emergencyContact && (
                        <div className="flex flex-col md:col-span-3">
                          <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">Emergency Contact</span>
                          <span className="text-sm font-semibold text-gray-800">{request.emergencyContact}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Reason */}
                {request.reason && (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50/50 rounded-xl p-6 mb-6">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-blue-600" />
                      Reason for Joining
                    </h4>
                    <p className="text-sm text-gray-700 leading-relaxed">{request.reason}</p>
                  </div>
                )}

                {/* Actions */}
                {request.status === 'pending' && (
                  <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200/50">
                    <button
                      onClick={() => handleReject(request.id)}
                      disabled={isProcessing === request.id}
                      className="flex items-center gap-2 px-6 py-3 text-red-600 hover:text-red-800 hover:bg-red-50/80 rounded-xl transition-all duration-200 disabled:opacity-50 font-medium"
                    >
                      {isProcessing === request.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <XCircle className="w-4 h-4" />
                      )}
                      Reject
                    </button>
                    
                    <button
                      onClick={() => handleApprove(request.id, 'parent')}
                      disabled={isProcessing === request.id}
                      className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 rounded-xl transition-all duration-200 disabled:opacity-50 font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                      {isProcessing === request.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <CheckCircle className="w-4 h-4" />
                      )}
                      Approve as Parent
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AccountRequestsManager;
