import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Trash2,
  Edit,
  Search,
  ShoppingCart,
  Check,
  Archive,
  ArchiveRestore,
} from 'lucide-react';
import homeService from '../../services/homeService';
import { ShoppingList, ShoppingListItem, GroceryCategory } from '../../types/home';
import { useToast } from '../../contexts/ToastContext';

const ShoppingListManager: React.FC = () => {
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingList, setEditingList] = useState<ShoppingList | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    loadShoppingLists();
  }, []);

  const loadShoppingLists = async () => {
    try {
      setLoading(true);
      const items = await homeService.getShoppingLists();
      setLists(items);
    } catch (error: any) {
      showError('Failed to load shopping lists', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this shopping list?')) return;

    try {
      await homeService.deleteShoppingList(id);
      setLists(lists.filter((l) => l.id !== id));
      showSuccess('Shopping list deleted successfully');
    } catch (error: any) {
      showError('Failed to delete shopping list', error.message);
    }
  };

  const handleToggleArchive = async (list: ShoppingList) => {
    try {
      await homeService.updateShoppingList(list.id, { isArchived: !list.isArchived });
      setLists(lists.map((l) => (l.id === list.id ? { ...l, isArchived: !l.isArchived } : l)));
      showSuccess(list.isArchived ? 'List unarchived' : 'List archived');
    } catch (error: any) {
      showError('Failed to update list', error.message);
    }
  };

  const handleToggleItem = async (listId: string, itemIndex: number) => {
    const list = lists.find((l) => l.id === listId);
    if (!list) return;

    const updatedItems = [...list.items];
    updatedItems[itemIndex].isPurchased = !updatedItems[itemIndex].isPurchased;

    try {
      await homeService.updateShoppingList(listId, { items: updatedItems });
      setLists(lists.map((l) => (l.id === listId ? { ...l, items: updatedItems } : l)));
    } catch (error: any) {
      showError('Failed to update item', error.message);
    }
  };

  const filteredLists = lists.filter((list) => {
    const matchesSearch = list.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesArchive = showArchived ? list.isArchived : !list.isArchived;
    return matchesSearch && matchesArchive;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
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
              placeholder="Search shopping lists..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Archive Toggle */}
          <button
            onClick={() => setShowArchived(!showArchived)}
            className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
              showArchived
                ? 'bg-gray-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Archive className="w-5 h-5" />
            {showArchived ? 'Show Active' : 'Show Archived'}
          </button>

          {/* Add Button */}
          <button
            onClick={() => {
              setEditingList(null);
              setShowAddModal(true);
            }}
            className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:shadow-lg transition-all flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            New List
          </button>
        </div>
      </div>

      {/* Shopping Lists */}
      {filteredLists.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No shopping lists found</h3>
          <p className="text-gray-500 mb-4">
            {searchQuery
              ? 'Try adjusting your search'
              : showArchived
              ? 'No archived lists yet'
              : 'Start by creating your first shopping list'}
          </p>
          {!searchQuery && !showArchived && (
            <button
              onClick={() => setShowAddModal(true)}
              className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:shadow-lg transition-all"
            >
              Create Your First List
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLists.map((list) => (
            <motion.div
              key={list.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={`bg-white rounded-xl shadow-sm hover:shadow-lg transition-shadow overflow-hidden ${
                list.isArchived ? 'opacity-60' : ''
              }`}
            >
              <div className="p-5">
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-bold text-lg text-gray-800">{list.name}</h3>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleToggleArchive(list)}
                      className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                      title={list.isArchived ? 'Unarchive' : 'Archive'}
                    >
                      {list.isArchived ? (
                        <ArchiveRestore className="w-4 h-4" />
                      ) : (
                        <Archive className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setEditingList(list);
                        setShowAddModal(true);
                      }}
                      className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(list.id)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Progress */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>
                      {list.items.filter((i) => i.isPurchased).length} of {list.items.length}{' '}
                      purchased
                    </span>
                    <span>
                      {list.items.length > 0
                        ? Math.round(
                            (list.items.filter((i) => i.isPurchased).length / list.items.length) *
                              100
                          )
                        : 0}
                      %
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all"
                      style={{
                        width: `${
                          list.items.length > 0
                            ? (list.items.filter((i) => i.isPurchased).length /
                                list.items.length) *
                              100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>

                {/* Items */}
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {list.items.length === 0 ? (
                    <p className="text-gray-400 text-sm text-center py-4">No items yet</p>
                  ) : (
                    list.items.map((item, index) => (
                      <div
                        key={index}
                        className={`flex items-center gap-2 p-2 rounded hover:bg-gray-50 ${
                          item.isPurchased ? 'opacity-50' : ''
                        }`}
                      >
                        <button
                          onClick={() => handleToggleItem(list.id, index)}
                          className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                            item.isPurchased
                              ? 'bg-green-500 border-green-500'
                              : 'border-gray-300 hover:border-green-500'
                          }`}
                        >
                          {item.isPurchased && <Check className="w-3 h-3 text-white" />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-sm ${
                              item.isPurchased ? 'line-through text-gray-400' : 'text-gray-700'
                            }`}
                          >
                            {item.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {item.quantity} {item.unit}
                            {item.category && ` • ${item.category}`}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showAddModal && (
          <ShoppingListModal
            list={editingList}
            onClose={() => {
              setShowAddModal(false);
              setEditingList(null);
            }}
            onSave={() => {
              loadShoppingLists();
              setShowAddModal(false);
              setEditingList(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// Shopping List Modal Component
interface ShoppingListModalProps {
  list: ShoppingList | null;
  onClose: () => void;
  onSave: () => void;
}

const ShoppingListModal: React.FC<ShoppingListModalProps> = ({ list, onClose, onSave }) => {
  const [name, setName] = useState(list?.name || '');
  const [items, setItems] = useState<ShoppingListItem[]>(
    list?.items || [
      { name: '', quantity: 1, unit: 'items', isPurchased: false, category: undefined },
    ]
  );
  const { showSuccess, showError } = useToast();
  const [saving, setSaving] = useState(false);

  const handleAddItem = () => {
    setItems([...items, { name: '', quantity: 1, unit: 'items', isPurchased: false }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof ShoppingListItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const listData = {
        name,
        items: items.filter((i) => i.name.trim() !== ''),
        isArchived: list?.isArchived || false,
      };

      if (list) {
        await homeService.updateShoppingList(list.id, listData);
        showSuccess('Shopping list updated successfully');
      } else {
        await homeService.addShoppingList(listData);
        showSuccess('Shopping list created successfully');
      }

      onSave();
    } catch (error: any) {
      showError('Failed to save shopping list', error.message);
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
        className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            {list ? 'Edit Shopping List' : 'Create Shopping List'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* List Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                List Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Weekly Groceries, Party Shopping"
              />
            </div>

            {/* Items */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-gray-700">Items</h3>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                >
                  + Add Item
                </button>
              </div>

              {items.map((item, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Item name"
                    value={item.name}
                    onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="number"
                    placeholder="Qty"
                    min="0"
                    step="0.01"
                    value={item.quantity || ''}
                    onChange={(e) => handleItemChange(index, 'quantity', Number(e.target.value))}
                    className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    placeholder="Unit"
                    value={item.unit}
                    onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                    className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <select
                    value={item.category || ''}
                    onChange={(e) =>
                      handleItemChange(
                        index,
                        'category',
                        e.target.value || undefined
                      )
                    }
                    className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Category</option>
                    {Object.values(GroceryCategory).map((cat) => (
                      <option key={cat} value={cat}>
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(index)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
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
                className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
              >
                {saving ? 'Saving...' : list ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ShoppingListManager;

