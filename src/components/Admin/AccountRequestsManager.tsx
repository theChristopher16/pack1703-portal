import React, { useState, useEffect, useCallback } from 'react';
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
  RefreshCw
} from 'lucide-react';
import { accountRequestService, AccountRequest } from '../../services/accountRequestService';
import { useAdmin } from '../../contexts/AdminContext';

const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes cache for account requests

const AccountRequestsManager: React.FC = () => {
  const { addNotification } = useAdmin();
  const [requests, setRequests] = useState<AccountRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);

  // Check if cache is still valid
  const isCacheValid = useCallback((): boolean => {
    return (Date.now() - lastFetchTime) < CACHE_DURATION;
  }, [lastFetchTime]);

  const loadRequests = useCallback(async (forceRefresh: boolean = false) => {
    // Use cache if available and not forcing refresh
    if (!forceRefresh && requests.length > 0 && isCacheValid()) {
      console.log('Using cached account requests data');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const result = await accountRequestService.getPendingRequests();
      
      if (result.success) {
        setRequests(result.requests || []);
        setLastFetchTime(Date.now());
      } else {
        setError(result.message);
        addNotification('error', 'Error', result.message);
      }
    } catch (error: any) {
      setError(error.message);
      addNotification('error', 'Error', 'Failed to load account requests');
    } finally {
      setIsLoading(false);
    }
  }, [requests.length, isCacheValid, addNotification]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const handleApprove = async (requestId: string, role: string = 'parent') => {
    try {
      setIsProcessing(requestId);
      
      const result = await accountRequestService.approveRequest(requestId, role);
      
      if (result.success) {
        addNotification('success', 'Success', result.message);
        await loadRequests(); // Reload to update the list
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
        await loadRequests(); // Reload to update the list
      } else {
        addNotification('error', 'Error', result.message);
      }
    } catch (error: any) {
      addNotification('error', 'Error', 'Failed to reject request');
    } finally {
      setIsProcessing(null);
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <UserPlus className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Account Requests</h2>
            <p className="text-sm text-gray-600">
              Review and approve new member requests
            </p>
          </div>
        </div>
        
        <button
          onClick={() => loadRequests(true)}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          disabled={isLoading}
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
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
        <div className="grid gap-6">
          {requests.map((request) => (
            <div key={request.id} className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <UserPlus className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
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
                    <p className="text-sm text-gray-600">
                      Submitted {request.submittedAt?.toDate?.()?.toLocaleDateString() || 'Recently'}
                    </p>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">{request.email}</span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">{request.phone}</span>
                  </div>
                  
                  <div className="flex items-center gap-3 md:col-span-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">{request.address}</span>
                  </div>
                </div>

                {/* Scouting Information */}
                {(request.scoutRank || request.den || request.emergencyContact) && (
                  <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center gap-2">
                      <Shield className="w-4 h-4 text-green-600" />
                      Scouting Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      {request.scoutRank && (
                        <div>
                          <span className="text-gray-600">Rank:</span>
                          <span className="ml-1 font-medium">{request.scoutRank}</span>
                        </div>
                      )}
                      {request.den && (
                        <div>
                          <span className="text-gray-600">Den:</span>
                          <span className="ml-1 font-medium">{request.den}</span>
                        </div>
                      )}
                      {request.emergencyContact && (
                        <div className="md:col-span-3">
                          <span className="text-gray-600">Emergency Contact:</span>
                          <span className="ml-1 font-medium">{request.emergencyContact}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Reason */}
                {request.reason && (
                  <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Reason for Joining</h4>
                    <p className="text-sm text-gray-700">{request.reason}</p>
                  </div>
                )}

                {/* Actions */}
                {request.status === 'pending' && (
                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => handleReject(request.id)}
                      disabled={isProcessing === request.id}
                      className="flex items-center gap-2 px-4 py-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
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
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50"
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
