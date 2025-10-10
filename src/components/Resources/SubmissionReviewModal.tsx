import React, { useState, useEffect } from 'react';
import { X, CheckCircle, XCircle, Download, Eye, Calendar, User } from 'lucide-react';
import { ResourceSubmission, resourceService } from '../../services/resourceService';

interface SubmissionReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  resourceId?: string;
  onReviewComplete?: () => void;
}

export const SubmissionReviewModal: React.FC<SubmissionReviewModalProps> = ({
  isOpen,
  onClose,
  resourceId,
  onReviewComplete
}) => {
  const [submissions, setSubmissions] = useState<ResourceSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<ResourceSubmission | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewing, setReviewing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  useEffect(() => {
    if (isOpen) {
      loadSubmissions();
    }
  }, [isOpen, resourceId, statusFilter]);

  const loadSubmissions = async () => {
    try {
      setLoading(true);
      let subs: ResourceSubmission[];
      
      if (resourceId) {
        subs = await resourceService.getResourceSubmissions(resourceId);
      } else {
        const filterStatus = statusFilter === 'all' ? undefined : statusFilter;
        subs = await resourceService.getAllSubmissions(filterStatus);
      }
      
      setSubmissions(subs);
    } catch (error) {
      console.error('Error loading submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (submissionId: string, status: 'approved' | 'rejected') => {
    try {
      setReviewing(true);
      await resourceService.reviewSubmission(submissionId, status, reviewNotes);
      
      // Reload submissions
      await loadSubmissions();
      setSelectedSubmission(null);
      setReviewNotes('');
      
      if (onReviewComplete) {
        onReviewComplete();
      }
    } catch (error: any) {
      console.error('Error reviewing submission:', error);
      alert(error.message || 'Failed to review submission');
    } finally {
      setReviewing(false);
    }
  };

  const handleDelete = async (submissionId: string) => {
    if (window.confirm('Are you sure you want to delete this submission?')) {
      try {
        await resourceService.deleteSubmission(submissionId);
        await loadSubmissions();
      } catch (error: any) {
        console.error('Error deleting submission:', error);
        alert(error.message || 'Failed to delete submission');
      }
    }
  };

  const downloadSubmission = (submission: ResourceSubmission) => {
    const link = document.createElement('a');
    link.href = submission.fileUrl;
    link.download = submission.fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-green-600 bg-green-50 border-green-200';
      case 'rejected': return 'text-red-600 bg-red-50 border-red-200';
      case 'pending': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Review Form Submissions</h2>
            <p className="text-primary-100 mt-1">
              {resourceId ? 'Submissions for this resource' : 'All submissions'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors duration-200"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex border-b border-gray-200 bg-gray-50 px-6">
          {['all', 'pending', 'approved', 'rejected'].map((filter) => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter as any)}
              className={`px-4 py-3 font-medium capitalize transition-colors duration-200 border-b-2 ${
                statusFilter === filter
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent"></div>
            </div>
          ) : submissions.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg">No submissions found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {submissions.map((submission) => (
                <div
                  key={submission.id}
                  className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow duration-200"
                >
                  {/* Submission Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{submission.resourceTitle}</h3>
                      <div className="flex items-center space-x-2 text-sm text-gray-600 mt-1">
                        <User className="h-3 w-3" />
                        <span>{submission.submittedByName}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-500 mt-1">
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(submission.submittedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(submission.status)}`}>
                      {submission.status}
                    </span>
                  </div>

                  {/* File Info */}
                  <div className="bg-gray-50 rounded-lg p-3 mb-3">
                    <p className="text-sm text-gray-700 font-medium">{submission.fileName}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {(submission.fileSize / 1024).toFixed(1)} KB
                    </p>
                  </div>

                  {/* Event/RSVP Link */}
                  {submission.eventId && (
                    <div className="text-xs text-gray-600 mb-3">
                      🎯 Linked to event: {submission.eventId.substring(0, 8)}...
                    </div>
                  )}

                  {/* Review Info */}
                  {submission.status !== 'pending' && submission.reviewedByName && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 mb-3 text-sm">
                      <p className="text-blue-900 font-medium">Reviewed by: {submission.reviewedByName}</p>
                      {submission.reviewedAt && (
                        <p className="text-blue-700 text-xs mt-1">
                          {new Date(submission.reviewedAt).toLocaleString()}
                        </p>
                      )}
                      {submission.reviewNotes && (
                        <p className="text-blue-800 mt-2">{submission.reviewNotes}</p>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => downloadSubmission(submission)}
                      className="flex-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2 text-sm"
                    >
                      <Download className="h-4 w-4" />
                      <span>Download</span>
                    </button>
                    
                    {submission.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleReview(submission.id, 'approved')}
                          disabled={reviewing}
                          className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2 text-sm disabled:opacity-50"
                        >
                          <CheckCircle className="h-4 w-4" />
                          <span>Approve</span>
                        </button>
                        <button
                          onClick={() => handleReview(submission.id, 'rejected')}
                          disabled={reviewing}
                          className="flex-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2 text-sm disabled:opacity-50"
                        >
                          <XCircle className="h-4 w-4" />
                          <span>Reject</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-between items-center">
          <p className="text-sm text-gray-600">
            {submissions.length} submission{submissions.length !== 1 ? 's' : ''}
          </p>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors duration-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

