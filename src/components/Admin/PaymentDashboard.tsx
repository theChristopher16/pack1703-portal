/**
 * Payment Dashboard Component
 * Comprehensive admin interface for managing event payments
 */

import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  X,
  Download,
  CheckCircle,
  AlertCircle,
  Clock,
  CreditCard,
  Wallet,
  FileText,
  Users,
  TrendingUp,
  Plus
} from 'lucide-react';
import { paymentService, PaymentStatusSummary, RSVPPaymentInfo } from '../../services/paymentService';
import { useAdmin } from '../../contexts/AdminContext';

interface PaymentDashboardProps {
  eventId: string;
  eventTitle: string;
  onClose: () => void;
}

const PaymentDashboard: React.FC<PaymentDashboardProps> = ({
  eventId,
  eventTitle,
  onClose
}) => {
  const { hasRole } = useAdmin();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<PaymentStatusSummary | null>(null);
  const [paymentInfo, setPaymentInfo] = useState<RSVPPaymentInfo[]>([]);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'paid' | 'unpaid'>('all');
  const [showManualPaymentModal, setShowManualPaymentModal] = useState(false);
  const [selectedRSVP, setSelectedRSVP] = useState<RSVPPaymentInfo | null>(null);

  useEffect(() => {
    loadPaymentData();
  }, [eventId]);

  const loadPaymentData = async () => {
    try {
      setLoading(true);
      setError('');

      const [summaryData, paymentData] = await Promise.all([
        paymentService.getPaymentStatusSummary(eventId),
        paymentService.getRSVPPaymentInfo(eventId)
      ]);

      setSummary(summaryData);
      setPaymentInfo(paymentData);
    } catch (err: any) {
      console.error('Error loading payment data:', err);
      setError(err.message || 'Failed to load payment data');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (!summary || !paymentInfo.length) return;
    
    try {
      paymentService.exportPaymentData(eventTitle, paymentInfo, summary);
    } catch (err: any) {
      setError(err.message || 'Failed to export payment data');
    }
  };

  const handleManualPayment = (rsvp: RSVPPaymentInfo) => {
    setSelectedRSVP(rsvp);
    setShowManualPaymentModal(true);
  };

  const filteredPayments = paymentInfo.filter(info => {
    if (!info.paymentRequired) return false;
    if (filter === 'paid') return info.paymentStatus === 'completed';
    if (filter === 'unpaid') return info.paymentStatus === 'pending';
    return true;
  });

  if (!hasRole(['admin', 'super_admin', 'den_leader'])) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg p-6 max-w-md">
          <div className="flex items-center gap-2 text-red-600 mb-4">
            <AlertCircle size={24} />
            <h3 className="text-lg font-semibold">Access Denied</h3>
          </div>
          <p className="text-gray-600 mb-4">
            You don't have permission to view payment information.
          </p>
          <button
            onClick={onClose}
            className="w-full bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-6 rounded-t-lg">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <DollarSign size={28} />
                <h2 className="text-2xl font-bold">Payment Dashboard</h2>
              </div>
              <p className="text-green-100">{eventTitle}</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded p-2 transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              <div className="flex items-center gap-2">
                <AlertCircle size={20} />
                <span>{error}</span>
              </div>
            </div>
          ) : !summary ? (
            <div className="text-center py-12 text-gray-500">
              <p>No payment data available</p>
            </div>
          ) : (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-blue-700">
                      <Users size={20} />
                      <span className="font-semibold">Total RSVPs</span>
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-blue-900">
                    {summary.totalRSVPs}
                  </div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-green-700">
                      <CheckCircle size={20} />
                      <span className="font-semibold">Paid</span>
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-green-900">
                    {summary.paidCount}
                  </div>
                  <div className="text-sm text-green-600 mt-1">
                    {paymentService.formatCurrency(summary.totalReceived)}
                  </div>
                </div>

                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-orange-700">
                      <Clock size={20} />
                      <span className="font-semibold">Unpaid</span>
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-orange-900">
                    {summary.unpaidCount}
                  </div>
                  <div className="text-sm text-orange-600 mt-1">
                    {paymentService.formatCurrency(summary.pendingAmount)}
                  </div>
                </div>
              </div>

              {/* Financial Summary */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp size={20} className="text-gray-700" />
                  <h3 className="font-semibold text-gray-900">Financial Summary</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <div className="text-sm text-gray-600">Total Expected</div>
                    <div className="text-xl font-semibold text-gray-900">
                      {paymentService.formatCurrency(summary.totalExpected)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Total Received</div>
                    <div className="text-xl font-semibold text-green-600">
                      {paymentService.formatCurrency(summary.totalReceived)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Amount Pending</div>
                    <div className="text-xl font-semibold text-orange-600">
                      {paymentService.formatCurrency(summary.pendingAmount)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Controls */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                <div className="flex gap-2">
                  <button
                    onClick={() => setFilter('all')}
                    className={`px-4 py-2 rounded transition-colors ${
                      filter === 'all'
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setFilter('paid')}
                    className={`px-4 py-2 rounded transition-colors ${
                      filter === 'paid'
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Paid ({summary.paidCount})
                  </button>
                  <button
                    onClick={() => setFilter('unpaid')}
                    className={`px-4 py-2 rounded transition-colors ${
                      filter === 'unpaid'
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Unpaid ({summary.unpaidCount})
                  </button>
                </div>

                <button
                  onClick={handleExport}
                  className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                >
                  <Download size={20} />
                  <span>Export CSV</span>
                </button>
              </div>

              {/* Payment List */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Family
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Attendees
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Method
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredPayments.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                            No payments found
                          </td>
                        </tr>
                      ) : (
                        filteredPayments.map((info) => (
                          <tr key={info.rsvpId} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {info.familyName}
                              </div>
                              <div className="text-sm text-gray-500">
                                {info.email}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {info.attendeeCount}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {info.paymentAmount
                                ? paymentService.formatCurrency(info.paymentAmount)
                                : 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {info.paymentStatus === 'completed' ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  <CheckCircle size={14} />
                                  Paid
                                </span>
                              ) : info.paymentStatus === 'pending' ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                  <Clock size={14} />
                                  Pending
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                  Not Required
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {info.paymentMethod ? (
                                <span className="flex items-center gap-1 text-sm text-gray-600">
                                  {info.paymentMethod === 'square' && <CreditCard size={14} />}
                                  {info.paymentMethod === 'cash' && <Wallet size={14} />}
                                  {info.paymentMethod === 'check' && <FileText size={14} />}
                                  <span className="capitalize">{info.paymentMethod}</span>
                                </span>
                              ) : (
                                <span className="text-sm text-gray-400">-</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              {info.paymentStatus === 'pending' && (
                                <button
                                  onClick={() => handleManualPayment(info)}
                                  className="flex items-center gap-1 text-green-600 hover:text-green-900"
                                >
                                  <Plus size={16} />
                                  Record Payment
                                </button>
                              )}
                              {info.paymentStatus === 'completed' && info.paidAt && (
                                <div className="text-xs text-gray-500">
                                  {new Date(info.paidAt.seconds * 1000).toLocaleDateString()}
                                </div>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 rounded-b-lg flex justify-end">
          <button
            onClick={onClose}
            className="bg-gray-200 text-gray-800 px-6 py-2 rounded hover:bg-gray-300 transition-colors"
          >
            Close
          </button>
        </div>
      </div>

      {/* Manual Payment Modal */}
      {showManualPaymentModal && selectedRSVP && (
        <ManualPaymentModal
          rsvp={selectedRSVP}
          eventId={eventId}
          onClose={() => {
            setShowManualPaymentModal(false);
            setSelectedRSVP(null);
          }}
          onSuccess={() => {
            setShowManualPaymentModal(false);
            setSelectedRSVP(null);
            loadPaymentData();
          }}
        />
      )}
    </div>
  );
};

// Manual Payment Modal Component
interface ManualPaymentModalProps {
  rsvp: RSVPPaymentInfo;
  eventId: string;
  onClose: () => void;
  onSuccess: () => void;
}

const ManualPaymentModal: React.FC<ManualPaymentModalProps> = ({
  rsvp,
  eventId,
  onClose,
  onSuccess
}) => {
  const [method, setMethod] = useState<'cash' | 'check' | 'other'>('cash');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!rsvp.paymentAmount) {
      setError('Payment amount not set');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      await paymentService.recordManualPayment(
        rsvp.rsvpId,
        eventId,
        rsvp.paymentAmount,
        method,
        notes
      );

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to record payment');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="bg-green-600 text-white p-4 rounded-t-lg">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Record Manual Payment</h3>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded p-1"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-4">
            <div className="text-sm text-gray-600">Family</div>
            <div className="font-semibold text-gray-900">{rsvp.familyName}</div>
          </div>

          <div className="mb-4">
            <div className="text-sm text-gray-600">Amount</div>
            <div className="font-semibold text-gray-900">
              {rsvp.paymentAmount
                ? paymentService.formatCurrency(rsvp.paymentAmount)
                : 'N/A'}
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Method *
            </label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            >
              <option value="cash">Cash</option>
              <option value="check">Check</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              rows={3}
              placeholder="Check number, receipt info, etc."
            />
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              <div className="flex items-center gap-2">
                <AlertCircle size={20} />
                <span>{error}</span>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300 transition-colors"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors disabled:bg-gray-400"
              disabled={submitting}
            >
              {submitting ? 'Recording...' : 'Record Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PaymentDashboard;

