import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Trash2,
  Edit,
  Search,
  Filter,
  Calendar,
  MapPin,
  Package,
  AlertCircle,
} from 'lucide-react';
import homeService from '../../services/homeService';
import { GroceryItem, GroceryCategory } from '../../types/home';
import { useToast } from '../../contexts/ToastContext';

const GroceryManager: React.FC = () => {
  const [groceries, setGroceries] = useState<GroceryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<GroceryItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<GroceryCategory | 'all'>('all');
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    loadGroceries();
  }, []);

  const loadGroceries = async () => {
    try {
      setLoading(true);
      const items = await homeService.getGroceries();
      setGroceries(items);
    } catch (error: any) {
      showError('Failed to load groceries', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;

    try {
      await homeService.deleteGroceryItem(id);
      setGroceries(groceries.filter((g) => g.id !== id));
      showSuccess('Item deleted successfully');
    } catch (error: any) {
      showError('Failed to delete item', error.message);
    }
  };

  const filteredGroceries = groceries.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryColor = (category: GroceryCategory) => {
    const colors: Record<GroceryCategory, string> = {
      [GroceryCategory.PRODUCE]: 'bg-green-100 text-green-800',
      [GroceryCategory.DAIRY]: 'bg-blue-100 text-blue-800',
      [GroceryCategory.MEAT]: 'bg-red-100 text-red-800',
      [GroceryCategory.BAKERY]: 'bg-yellow-100 text-yellow-800',
      [GroceryCategory.PANTRY]: 'bg-orange-100 text-orange-800',
      [GroceryCategory.FROZEN]: 'bg-cyan-100 text-cyan-800',
      [GroceryCategory.BEVERAGES]: 'bg-purple-100 text-purple-800',
      [GroceryCategory.SNACKS]: 'bg-pink-100 text-pink-800',
      [GroceryCategory.CONDIMENTS]: 'bg-amber-100 text-amber-800',
      [GroceryCategory.OTHER]: 'bg-gray-100 text-gray-800',
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const isExpiringSoon = (date?: Date) => {
    if (!date) return false;
    const daysUntilExpiry = Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 7 && daysUntilExpiry >= 0;
  };

  const isExpired = (date?: Date) => {
    if (!date) return false;
    return date.getTime() < Date.now();
  };

  const groupedGroceries = filteredGroceries.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<GroceryCategory, GroceryItem[]>);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search groceries..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          {/* Category Filter */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value as GroceryCategory | 'all')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="all">All Categories</option>
            {Object.values(GroceryCategory).map((cat) => (
              <option key={cat} value={cat}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </option>
            ))}
          </select>

          {/* Add Button */}
          <button
            onClick={() => {
              setEditingItem(null);
              setShowAddModal(true);
            }}
            className="px-6 py-2 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg hover:shadow-lg transition-all flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Item
          </button>
        </div>
      </div>

      {/* Groceries List */}
      {filteredGroceries.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No groceries found</h3>
          <p className="text-gray-500 mb-4">
            {searchQuery || filterCategory !== 'all'
              ? 'Try adjusting your filters'
              : 'Start by adding your first grocery item'}
          </p>
          {!searchQuery && filterCategory === 'all' && (
            <button
              onClick={() => setShowAddModal(true)}
              className="px-6 py-2 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg hover:shadow-lg transition-all"
            >
              Add Your First Item
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedGroceries).map(([category, items]) => (
            <div key={category} className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <span
                  className={`px-3 py-1 rounded-full text-sm ${getCategoryColor(category as GroceryCategory)}`}
                >
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </span>
                <span className="text-gray-400 text-sm">({items.length})</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-gray-800">{item.name}</h4>
                      <div className="flex gap-1">
                        <button
                          onClick={() => {
                            setEditingItem(item);
                            setShowAddModal(true);
                          }}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-700">
                          {item.quantity} {item.unit}
                        </span>
                      </div>

                      {item.location && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-700">{item.location}</span>
                        </div>
                      )}

                      {item.expirationDate && (
                        <div
                          className={`flex items-center gap-2 ${
                            isExpired(item.expirationDate)
                              ? 'text-red-600'
                              : isExpiringSoon(item.expirationDate)
                              ? 'text-yellow-600'
                              : 'text-gray-700'
                          }`}
                        >
                          {(isExpired(item.expirationDate) || isExpiringSoon(item.expirationDate)) && (
                            <AlertCircle className="w-4 h-4" />
                          )}
                          {!isExpired(item.expirationDate) && !isExpiringSoon(item.expirationDate) && (
                            <Calendar className="w-4 h-4 text-gray-400" />
                          )}
                          <span>
                            {isExpired(item.expirationDate)
                              ? 'Expired '
                              : isExpiringSoon(item.expirationDate)
                              ? 'Expires soon: '
                              : 'Expires: '}
                            {item.expirationDate.toLocaleDateString()}
                          </span>
                        </div>
                      )}

                      {item.notes && (
                        <p className="text-gray-500 text-xs mt-2 italic">{item.notes}</p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showAddModal && (
          <GroceryModal
            item={editingItem}
            onClose={() => {
              setShowAddModal(false);
              setEditingItem(null);
            }}
            onSave={() => {
              loadGroceries();
              setShowAddModal(false);
              setEditingItem(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// Grocery Modal Component
interface GroceryModalProps {
  item: GroceryItem | null;
  onClose: () => void;
  onSave: () => void;
}

const GroceryModal: React.FC<GroceryModalProps> = ({ item, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: item?.name || '',
    quantity: item?.quantity || 0,
    unit: item?.unit || 'items',
    category: item?.category || GroceryCategory.OTHER,
    location: item?.location || '',
    expirationDate: item?.expirationDate
      ? item.expirationDate.toISOString().split('T')[0]
      : '',
    notes: item?.notes || '',
  });
  const { showSuccess, showError } = useToast();
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const groceryData = {
        name: formData.name,
        quantity: Number(formData.quantity),
        unit: formData.unit,
        category: formData.category,
        location: formData.location || undefined,
        expirationDate: formData.expirationDate ? new Date(formData.expirationDate) : undefined,
        notes: formData.notes || undefined,
      };

      if (item) {
        await homeService.updateGroceryItem(item.id, groceryData);
        showSuccess('Grocery item updated successfully');
      } else {
        await homeService.addGroceryItem(groceryData);
        showSuccess('Grocery item added successfully');
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
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            {item ? 'Edit Grocery Item' : 'Add Grocery Item'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Item Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="e.g., Milk, Eggs, Chicken Breast"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unit *</label>
                <input
                  type="text"
                  required
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="e.g., lb, oz, cups, items"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category *
                </label>
                <select
                  required
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value as GroceryCategory })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  {Object.values(GroceryCategory).map((cat) => (
                    <option key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="e.g., pantry, fridge, freezer"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expiration Date
                </label>
                <input
                  type="date"
                  value={formData.expirationDate}
                  onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  rows={3}
                  placeholder="Any additional notes..."
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
                className="flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
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

export default GroceryManager;

