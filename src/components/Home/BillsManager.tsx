import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Edit, CreditCard, AlertCircle, CheckCircle, Calendar } from 'lucide-react';
import homeService from '../../services/homeService';
import { Bill, BillFrequency } from '../../types/home';
import { useToast } from '../../contexts/ToastContext';

const BillsManager: React.FC = () => {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingBill, setEditingBill] = useState<Bill | null>(null);
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    loadBills();
  }, []);

  const loadBills = async () => {
    try {
      setLoading(true);
      const data = await homeService.getBills();
      setBills(data);
    } catch (error: any) {
      showError('Failed to load bills', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this bill?')) return;
    try {
      await homeService.deleteBill(id);
      setBills(bills.filter((b) => b.id !== id));
      showSuccess('Bill deleted');
    } catch (error: any) {
      showError('Failed to delete bill', error.message);
    }
  };

  const handleTogglePaid = async (bill: Bill) => {
    try {
      const now = new Date();
      const updates = {
        isPaid: !bill.isPaid,
        lastPaidDate: !bill.isPaid ? now : bill.lastPaidDate,
      };
      await homeService.updateBill(bill.id, updates);
      setBills(bills.map((b) => (b.id === bill.id ? { ...b, ...updates } : b)));
      showSuccess(bill.isPaid ? 'Marked as unpaid' : 'Marked as paid');
    } catch (error: any) {
      showError('Failed to update bill', error.message);
    }
  };

  const upcomingBills = bills.filter((b) => !b.isPaid);
  const paidBills = bills.filter((b) => b.isPaid);
  const totalMonthly = bills.reduce((sum, b) => {
    if (b.frequency === BillFrequency.MONTHLY) return sum + b.amount;
    if (b.frequency === BillFrequency.WEEKLY) return sum + b.amount * 4;
    if (b.frequency === BillFrequency.BIWEEKLY) return sum + b.amount * 2;
    if (b.frequency === BillFrequency.QUARTERLY) return sum + b.amount / 3;
    if (b.frequency === BillFrequency.ANNUALLY) return sum + b.amount / 12;
    return sum;
  }, 0);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600">Monthly Total</span>
            <CreditCard className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-gray-800">${totalMonthly.toFixed(2)}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600">Upcoming Bills</span>
            <AlertCircle className="w-5 h-5 text-orange-600" />
          </div>
          <p className="text-3xl font-bold text-gray-800">{upcomingBills.length}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600">Paid This Month</span>
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-gray-800">{paidBills.length}</p>
        </div>
      </div>

      {/* Add Button */}
      <div className="flex justify-end">
        <button
          onClick={() => {
            setEditingBill(null);
            setShowAddModal(true);
          }}
          className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:shadow-lg transition-all flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Bill
        </button>
      </div>

      {/* Bills List */}
      {bills.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No bills tracked</h3>
          <p className="text-gray-500">Add your first bill to start tracking</p>
        </div>
      ) : (
        <div className="space-y-4">
          {upcomingBills.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-bold text-lg text-gray-800 mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-orange-600" />
                Upcoming Bills
              </h3>
              <div className="space-y-3">
                {upcomingBills.map((bill) => (
                  <BillCard
                    key={bill.id}
                    bill={bill}
                    onTogglePaid={handleTogglePaid}
                    onEdit={() => {
                      setEditingBill(bill);
                      setShowAddModal(true);
                    }}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </div>
          )}

          {paidBills.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-bold text-lg text-gray-800 mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Paid Bills
              </h3>
              <div className="space-y-3">
                {paidBills.map((bill) => (
                  <BillCard
                    key={bill.id}
                    bill={bill}
                    onTogglePaid={handleTogglePaid}
                    onEdit={() => {
                      setEditingBill(bill);
                      setShowAddModal(true);
                    }}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showAddModal && (
          <BillModal
            bill={editingBill}
            onClose={() => {
              setShowAddModal(false);
              setEditingBill(null);
            }}
            onSave={() => {
              loadBills();
              setShowAddModal(false);
              setEditingBill(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// Bill Card Component
interface BillCardProps {
  bill: Bill;
  onTogglePaid: (bill: Bill) => void;
  onEdit: () => void;
  onDelete: (id: string) => void;
}

const BillCard: React.FC<BillCardProps> = ({ bill, onTogglePaid, onEdit, onDelete }) => {
  const daysUntilDue = Math.ceil(
    (new Date(bill.nextDueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
  const isOverdue = daysUntilDue < 0 && !bill.isPaid;
  const isDueSoon = daysUntilDue <= 3 && daysUntilDue >= 0 && !bill.isPaid;

  return (
    <div
      className={`border rounded-lg p-4 ${
        isOverdue
          ? 'border-red-300 bg-red-50'
          : isDueSoon
          ? 'border-yellow-300 bg-yellow-50'
          : bill.isPaid
          ? 'border-green-200 bg-green-50'
          : 'border-gray-200 bg-white'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          <button
            onClick={() => onTogglePaid(bill)}
            className={`flex-shrink-0 w-6 h-6 rounded border-2 flex items-center justify-center transition-all ${
              bill.isPaid
                ? 'bg-green-500 border-green-500'
                : 'border-gray-300 hover:border-green-500'
            }`}
          >
            {bill.isPaid && <CheckCircle className="w-4 h-4 text-white" />}
          </button>

          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className={`font-semibold ${bill.isPaid ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                {bill.name}
              </h4>
              {bill.autoPayEnabled && (
                <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs">
                  Auto-Pay
                </span>
              )}
            </div>

            <div className="space-y-1 text-sm">
              <div className="flex items-center gap-4 text-gray-600">
                <span className="font-medium text-gray-800">${bill.amount.toFixed(2)}</span>
                <span>•</span>
                <span>{bill.frequency}</span>
                {bill.category && (
                  <>
                    <span>•</span>
                    <span>{bill.category}</span>
                  </>
                )}
              </div>

              <div
                className={`flex items-center gap-2 ${
                  isOverdue ? 'text-red-600 font-medium' : isDueSoon ? 'text-yellow-600' : 'text-gray-600'
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span>
                  Due: {new Date(bill.nextDueDate).toLocaleDateString()}
                  {isOverdue && ' (Overdue)'}
                  {isDueSoon && ' (Due Soon)'}
                </span>
              </div>

              {bill.notes && <p className="text-gray-500 text-xs mt-1">{bill.notes}</p>}
            </div>
          </div>
        </div>

        <div className="flex gap-1">
          <button onClick={onEdit} className="p-1 text-blue-600 hover:bg-blue-50 rounded">
            <Edit className="w-4 h-4" />
          </button>
          <button onClick={() => onDelete(bill.id)} className="p-1 text-red-600 hover:bg-red-50 rounded">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

// Bill Modal Component
interface BillModalProps {
  bill: Bill | null;
  onClose: () => void;
  onSave: () => void;
}

const BillModal: React.FC<BillModalProps> = ({ bill, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: bill?.name || '',
    amount: bill?.amount || 0,
    frequency: bill?.frequency || BillFrequency.MONTHLY,
    dueDay: bill?.dueDay || 1,
    category: bill?.category || '',
    autoPayEnabled: bill?.autoPayEnabled || false,
    notes: bill?.notes || '',
  });
  const { showSuccess, showError } = useToast();
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Calculate next due date based on frequency and due day
      const today = new Date();
      const nextDue = new Date(today.getFullYear(), today.getMonth(), formData.dueDay);
      if (nextDue < today) {
        nextDue.setMonth(nextDue.getMonth() + 1);
      }

      const billData = {
        name: formData.name,
        amount: Number(formData.amount),
        frequency: formData.frequency,
        dueDay: Number(formData.dueDay),
        category: formData.category || undefined,
        autoPayEnabled: formData.autoPayEnabled,
        notes: formData.notes || undefined,
        nextDueDate: nextDue,
        isPaid: bill?.isPaid || false,
      };

      if (bill) {
        await homeService.updateBill(bill.id, billData);
        showSuccess('Bill updated');
      } else {
        await homeService.addBill(billData);
        showSuccess('Bill added');
      }

      onSave();
    } catch (error: any) {
      showError('Failed to save bill', error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.9 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-xl shadow-xl max-w-md w-full"
      >
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            {bill ? 'Edit Bill' : 'Add Bill'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bill Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Electric Bill, Netflix"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount *</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.amount || ''}
                  onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Due Day *</label>
                <input
                  type="number"
                  required
                  min="1"
                  max="31"
                  value={formData.dueDay}
                  onChange={(e) => setFormData({ ...formData, dueDay: Number(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Frequency *</label>
              <select
                required
                value={formData.frequency}
                onChange={(e) => setFormData({ ...formData, frequency: e.target.value as BillFrequency })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value={BillFrequency.WEEKLY}>Weekly</option>
                <option value={BillFrequency.BIWEEKLY}>Bi-weekly</option>
                <option value={BillFrequency.MONTHLY}>Monthly</option>
                <option value={BillFrequency.QUARTERLY}>Quarterly</option>
                <option value={BillFrequency.ANNUALLY}>Annually</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Utilities, Streaming, Insurance"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.autoPayEnabled}
                  onChange={(e) => setFormData({ ...formData, autoPayEnabled: e.target.checked })}
                  className="rounded text-blue-500 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Auto-pay enabled</span>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={2}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:shadow-lg disabled:opacity-50"
              >
                {saving ? 'Saving...' : bill ? 'Update' : 'Add'}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default BillsManager;

