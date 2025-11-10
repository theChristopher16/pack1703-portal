import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Trash2,
  Edit,
  Wrench,
  Calendar,
  DollarSign,
  Phone,
  AlertCircle,
  CheckCircle,
  Clock,
} from 'lucide-react';
import homeService from '../../services/homeService';
import { MaintenanceItem, MaintenanceLog, MaintenanceFrequency } from '../../types/home';
import { useToast } from '../../contexts/ToastContext';

const MaintenanceManager: React.FC = () => {
  const [items, setItems] = useState<MaintenanceItem[]>([]);
  const [logs, setLogs] = useState<MaintenanceLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showLogModal, setShowLogModal] = useState<MaintenanceItem | null>(null);
  const [editingItem, setEditingItem] = useState<MaintenanceItem | null>(null);
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [itemsData, logsData] = await Promise.all([
        homeService.getMaintenanceItems(),
        homeService.getMaintenanceLogs(),
      ]);
      setItems(itemsData);
      setLogs(logsData);
    } catch (error: any) {
      showError('Failed to load maintenance data', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this maintenance item?')) return;
    try {
      await homeService.deleteMaintenanceItem(id);
      setItems(items.filter((i) => i.id !== id));
      showSuccess('Item deleted');
    } catch (error: any) {
      showError('Failed to delete item', error.message);
    }
  };

  const handleComplete = async (item: MaintenanceItem) => {
    setShowLogModal(item);
  };

  const getDaysUntilDue = (dueDate: Date) => {
    return Math.ceil((new Date(dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  };

  const overdueItems = items.filter((i) => getDaysUntilDue(i.nextDue) < 0);
  const upcomingItems = items.filter((i) => {
    const days = getDaysUntilDue(i.nextDue);
    return days >= 0 && days <= 30;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600">Total Items</span>
            <Wrench className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-gray-800">{items.length}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600">Overdue</span>
            <AlertCircle className="w-5 h-5 text-red-600" />
          </div>
          <p className="text-3xl font-bold text-gray-800">{overdueItems.length}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600">Due in 30 Days</span>
            <Clock className="w-5 h-5 text-yellow-600" />
          </div>
          <p className="text-3xl font-bold text-gray-800">{upcomingItems.length}</p>
        </div>
      </div>

      {/* Add Button */}
      <div className="flex justify-end">
        <button
          onClick={() => {
            setEditingItem(null);
            setShowAddModal(true);
          }}
          className="px-6 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:shadow-lg transition-all flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Item
        </button>
      </div>

      {/* Maintenance Items */}
      {items.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <Wrench className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No maintenance items</h3>
          <p className="text-gray-500">Add your first maintenance task</p>
        </div>
      ) : (
        <div className="space-y-4">
          {overdueItems.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-bold text-lg text-gray-800 mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                Overdue
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {overdueItems.map((item) => (
                  <MaintenanceCard
                    key={item.id}
                    item={item}
                    onEdit={() => {
                      setEditingItem(item);
                      setShowAddModal(true);
                    }}
                    onDelete={handleDelete}
                    onComplete={handleComplete}
                  />
                ))}
              </div>
            </div>
          )}

          {upcomingItems.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-bold text-lg text-gray-800 mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-yellow-600" />
                Due Soon (Next 30 Days)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {upcomingItems.map((item) => (
                  <MaintenanceCard
                    key={item.id}
                    item={item}
                    onEdit={() => {
                      setEditingItem(item);
                      setShowAddModal(true);
                    }}
                    onDelete={handleDelete}
                    onComplete={handleComplete}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {showAddModal && (
          <MaintenanceModal
            item={editingItem}
            onClose={() => {
              setShowAddModal(false);
              setEditingItem(null);
            }}
            onSave={() => {
              loadData();
              setShowAddModal(false);
              setEditingItem(null);
            }}
          />
        )}

        {showLogModal && (
          <CompleteModal
            item={showLogModal}
            onClose={() => setShowLogModal(null)}
            onSave={() => {
              loadData();
              setShowLogModal(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// Maintenance Card Component
interface MaintenanceCardProps {
  item: MaintenanceItem;
  onEdit: () => void;
  onDelete: (id: string) => void;
  onComplete: (item: MaintenanceItem) => void;
}

const MaintenanceCard: React.FC<MaintenanceCardProps> = ({ item, onEdit, onDelete, onComplete }) => {
  const daysUntilDue = Math.ceil(
    (new Date(item.nextDue).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
  const isOverdue = daysUntilDue < 0;

  return (
    <div
      className={`border rounded-lg p-4 ${
        isOverdue ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'
      }`}
    >
      <div className="flex justify-between items-start mb-2">
        <div>
          <h4 className="font-semibold text-gray-800">{item.name}</h4>
          <span className="text-xs text-gray-600">{item.category}</span>
        </div>
        <div className="flex gap-1">
          <button onClick={onEdit} className="p-1 text-blue-600 hover:bg-blue-50 rounded">
            <Edit className="w-3 h-3" />
          </button>
          <button onClick={() => onDelete(item.id)} className="p-1 text-red-600 hover:bg-red-50 rounded">
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      <div className="space-y-1 text-sm mb-3">
        <div className={`flex items-center gap-2 ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
          <Calendar className="w-4 h-4" />
          <span>
            Due: {new Date(item.nextDue).toLocaleDateString()}
            {isOverdue && ` (${Math.abs(daysUntilDue)} days overdue)`}
          </span>
        </div>

        <div className="flex items-center gap-2 text-gray-600">
          <Clock className="w-4 h-4" />
          <span>{item.frequency}</span>
        </div>

        {item.estimatedCost && (
          <div className="flex items-center gap-2 text-gray-600">
            <DollarSign className="w-4 h-4" />
            <span>~${item.estimatedCost.toFixed(2)}</span>
          </div>
        )}

        {item.serviceProvider && (
          <div className="flex items-center gap-2 text-gray-600">
            <Phone className="w-4 h-4" />
            <span>{item.serviceProvider}</span>
          </div>
        )}
      </div>

      <button
        onClick={() => onComplete(item)}
        className="w-full px-4 py-2 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg hover:shadow-lg transition-all flex items-center justify-center gap-2"
      >
        <CheckCircle className="w-4 h-4" />
        Mark Complete
      </button>
    </div>
  );
};

// Maintenance Modal Component (simplified)
interface MaintenanceModalProps {
  item: MaintenanceItem | null;
  onClose: () => void;
  onSave: () => void;
}

const MaintenanceModal: React.FC<MaintenanceModalProps> = ({ item, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: item?.name || '',
    category: item?.category || '',
    frequency: item?.frequency || MaintenanceFrequency.ANNUALLY,
    nextDue: item?.nextDue ? new Date(item.nextDue).toISOString().split('T')[0] : '',
    estimatedCost: item?.estimatedCost || 0,
    serviceProvider: item?.serviceProvider || '',
    providerContact: item?.providerContact || '',
    warrantyExpiration: item?.warrantyExpiration
      ? new Date(item.warrantyExpiration).toISOString().split('T')[0]
      : '',
    notes: item?.notes || '',
  });
  const { showSuccess, showError } = useToast();
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const itemData = {
        name: formData.name,
        category: formData.category,
        frequency: formData.frequency,
        nextDue: new Date(formData.nextDue),
        estimatedCost: formData.estimatedCost || undefined,
        serviceProvider: formData.serviceProvider || undefined,
        providerContact: formData.providerContact || undefined,
        warrantyExpiration: formData.warrantyExpiration ? new Date(formData.warrantyExpiration) : undefined,
        notes: formData.notes || undefined,
      };

      if (item) {
        await homeService.updateMaintenanceItem(item.id, itemData);
        showSuccess('Maintenance item updated');
      } else {
        await homeService.addMaintenanceItem(itemData);
        showSuccess('Maintenance item added');
      }

      onSave();
    } catch (error: any) {
      showError('Failed to save item', error.message);
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
        className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            {item ? 'Edit Maintenance Item' : 'Add Maintenance Item'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Item Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  placeholder="e.g., Replace HVAC Filter, Clean Gutters"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                <input
                  type="text"
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  placeholder="e.g., HVAC, Plumbing"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Frequency *</label>
                <select
                  required
                  value={formData.frequency}
                  onChange={(e) =>
                    setFormData({ ...formData, frequency: e.target.value as MaintenanceFrequency })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                >
                  <option value={MaintenanceFrequency.MONTHLY}>Monthly</option>
                  <option value={MaintenanceFrequency.QUARTERLY}>Quarterly</option>
                  <option value={MaintenanceFrequency.SEMIANNUALLY}>Semi-annually</option>
                  <option value={MaintenanceFrequency.ANNUALLY}>Annually</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Next Due *</label>
                <input
                  type="date"
                  required
                  value={formData.nextDue}
                  onChange={(e) => setFormData({ ...formData, nextDue: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Est. Cost</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.estimatedCost || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, estimatedCost: Number(e.target.value) })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Service Provider</label>
                <input
                  type="text"
                  value={formData.serviceProvider}
                  onChange={(e) => setFormData({ ...formData, serviceProvider: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact</label>
                <input
                  type="text"
                  value={formData.providerContact}
                  onChange={(e) => setFormData({ ...formData, providerContact: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  placeholder="Phone or email"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Warranty Expires</label>
                <input
                  type="date"
                  value={formData.warrantyExpiration}
                  onChange={(e) => setFormData({ ...formData, warrantyExpiration: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  rows={2}
                />
              </div>
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
                className="flex-1 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:shadow-lg disabled:opacity-50"
              >
                {saving ? 'Saving...' : item ? 'Update' : 'Add'}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </motion.div>
  );
};

// Complete Modal Component
interface CompleteModalProps {
  item: MaintenanceItem;
  onClose: () => void;
  onSave: () => void;
}

const CompleteModal: React.FC<CompleteModalProps> = ({ item, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    cost: item.estimatedCost || 0,
    performedBy: 'self',
    notes: '',
  });
  const { showSuccess, showError } = useToast();
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      await homeService.completeMaintenanceItem(item.id, {
        cost: formData.cost || undefined,
        performedBy: formData.performedBy,
        notes: formData.notes || undefined,
      });
      showSuccess('Maintenance completed and logged');
      onSave();
    } catch (error: any) {
      showError('Failed to complete maintenance', error.message);
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
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Complete: {item.name}</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Actual Cost</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.cost || ''}
                onChange={(e) => setFormData({ ...formData, cost: Number(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Performed By</label>
              <input
                type="text"
                value={formData.performedBy}
                onChange={(e) => setFormData({ ...formData, performedBy: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                placeholder="self or service provider name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                rows={3}
                placeholder="Any issues or observations..."
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
                className="flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg hover:shadow-lg disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Complete'}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default MaintenanceManager;

