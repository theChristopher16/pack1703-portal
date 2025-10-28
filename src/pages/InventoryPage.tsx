import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Edit, ArrowLeft, Package, DollarSign, Image as ImageIcon, RefreshCw } from 'lucide-react';
import { useAdmin } from '../contexts/AdminContext';
import { InventoryItem, ItemCondition } from '../types/firestore';
import { Timestamp, collection, query, getDocs, addDoc, updateDoc, deleteDoc, doc, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';
import { googleSheetsSyncService } from '../services/googleSheetsSyncService';

const InventoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { hasRole, addNotification, state } = useAdmin();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  
  const canManageInventory = hasRole('super-admin') || hasRole('content-admin') || hasRole('parent');
  
  const [formData, setFormData] = useState({
    name: '',
    quantity: 1,
    condition: 'good' as ItemCondition,
    description: '',
    notes: '',
    imageUrl: '',
    estimatedValue: '',
    location: ''
  });

  useEffect(() => {
    if (!canManageInventory) {
      addNotification('error', 'Access Denied', 'You do not have permission to access the inventory.');
      navigate('/resources');
      return;
    }
    
    loadInventory();
  }, [canManageInventory, navigate, addNotification]);

  const loadInventory = async () => {
    try {
      setIsLoading(true);
      const q = query(collection(db, 'inventory'), orderBy('lastChecked', 'desc'));
      const querySnapshot = await getDocs(q);
      const items: InventoryItem[] = [];
      
      querySnapshot.forEach((doc) => {
        items.push({
          id: doc.id,
          ...doc.data(),
          lastChecked: doc.data().lastChecked,
          createdAt: doc.data().createdAt,
          updatedAt: doc.data().updatedAt
        } as InventoryItem);
      });
      
      setInventory(items);
    } catch (error) {
      console.error('Error loading inventory:', error);
      addNotification('error', 'Failed to Load', 'Could not load inventory items.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = () => {
    setIsEditMode(false);
    setSelectedItem(null);
    setFormData({
      name: '',
      quantity: 1,
      condition: 'good',
      description: '',
      notes: '',
      imageUrl: '',
      estimatedValue: '',
      location: ''
    });
    setIsModalOpen(true);
  };

  const handleEdit = (item: InventoryItem) => {
    setIsEditMode(true);
    setSelectedItem(item);
    setFormData({
      name: item.name,
      quantity: item.quantity,
      condition: item.condition,
      description: item.description,
      notes: item.notes || '',
      imageUrl: item.imageUrl || '',
      estimatedValue: item.estimatedValue ? (item.estimatedValue / 100).toString() : '',
      location: item.location || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (itemId: string) => {
    if (!window.confirm('Are you sure you want to delete this item from the inventory?')) {
      return;
    }
    
    try {
      setDeletingItemId(itemId);
      await deleteDoc(doc(db, 'inventory', itemId));
      
      setInventory(prevInventory => prevInventory.filter(item => item.id !== itemId));
      addNotification('success', 'Item Deleted', 'The item has been removed from the inventory.');
    } catch (error) {
      console.error('Error deleting item:', error);
      addNotification('error', 'Delete Failed', 'Could not delete the item.');
    } finally {
      setDeletingItemId(null);
    }
  };

  const handleSyncFromGoogleSheet = async () => {
    if (!window.confirm('This will sync all items from the Google Sheet to your inventory. Existing items may be updated. Continue?')) {
      return;
    }
    
    try {
      setIsSyncing(true);
      const result = await googleSheetsSyncService.syncInventory();
      
      addNotification(
        'success', 
        'Sync Complete', 
        `Successfully synced ${result.success} items from Google Sheet. ${result.errors} errors.`
      );
      
      // Reload inventory
      await loadInventory();
    } catch (error: any) {
      console.error('Error syncing from Google Sheet:', error);
      addNotification('error', 'Sync Failed', error.message || 'Could not sync from Google Sheet.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const currentUser = state.currentUser;
      if (!currentUser) {
        addNotification('error', 'Authentication Required', 'You must be logged in to manage inventory.');
        return;
      }
      
      const itemData = {
        name: formData.name,
        quantity: formData.quantity,
        condition: formData.condition,
        description: formData.description,
        notes: formData.notes || undefined,
        imageUrl: formData.imageUrl || undefined,
        estimatedValue: formData.estimatedValue ? Math.round(parseFloat(formData.estimatedValue) * 100) : undefined,
        location: formData.location || undefined,
        lastChecked: Timestamp.now(),
        checkedBy: currentUser.uid,
        updatedAt: Timestamp.now()
      };
      
      if (isEditMode && selectedItem) {
        await updateDoc(doc(db, 'inventory', selectedItem.id), itemData);
        addNotification('success', 'Item Updated', 'The inventory item has been updated.');
      } else {
        await addDoc(collection(db, 'inventory'), {
          ...itemData,
          createdAt: Timestamp.now()
        });
        addNotification('success', 'Item Added', 'The new item has been added to the inventory.');
      }
      
      setIsModalOpen(false);
      loadInventory();
    } catch (error) {
      console.error('Error saving item:', error);
      addNotification('error', 'Save Failed', 'Could not save the inventory item.');
    }
  };

  const formatDate = (timestamp: Timestamp | any): string => {
    if (!timestamp) return 'Unknown';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : (timestamp as any);
      return date.toLocaleDateString('en-US', { 
        month: 'numeric', 
        day: 'numeric', 
        year: 'numeric' 
      });
    } catch {
      return 'Unknown';
    }
  };

  const formatCurrency = (cents: number | undefined): string => {
    if (!cents) return '';
    return `$${(cents / 100).toFixed(2)}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-fog via-forest-50/30 to-solar-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-forest-600 mx-auto mb-4"></div>
          <p className="text-forest-600 font-medium">Loading inventory...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-fog via-forest-50/30 to-solar-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/resources')}
            className="inline-flex items-center gap-2 text-forest-600 hover:text-forest-700 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Resources
          </button>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Package className="w-8 h-8 text-forest-600" />
              <div>
                <h1 className="text-4xl font-solarpunk-display font-bold text-forest-800">
                  Pack Inventory
                </h1>
                <p className="text-forest-600">
                  Manage pack equipment and supplies
                </p>
              </div>
            </div>
            
            {canManageInventory && (
              <div className="flex items-center gap-3">
                <button
                  onClick={handleSyncFromGoogleSheet}
                  disabled={isSyncing}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white text-forest-600 font-semibold rounded-xl hover:shadow-lg transition-all duration-200 border-2 border-forest-300 hover:border-forest-400 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RefreshCw className={`w-5 h-5 ${isSyncing ? 'animate-spin' : ''}`} />
                  {isSyncing ? 'Syncing...' : 'Sync from Google Sheet'}
                </button>
                <button
                  onClick={handleCreate}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-forest-600 to-ocean-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all duration-200 hover:scale-105"
                >
                  <Plus className="w-5 h-5" />
                  Add Item
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Inventory Table */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-forest-200/30 shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-forest-100">
              <thead className="bg-forest-50">
                <tr>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-forest-700 uppercase tracking-wider">
                    Image
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-forest-700 uppercase tracking-wider">
                    Item Name
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-forest-700 uppercase tracking-wider">
                    Qty
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-forest-700 uppercase tracking-wider">
                    Condition
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-forest-700 uppercase tracking-wider">
                    Description / Notes
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-forest-700 uppercase tracking-wider">
                    Est. Value
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-forest-700 uppercase tracking-wider">
                    Last Checked
                  </th>
                  {canManageInventory && (
                    <th className="px-4 py-4 text-left text-xs font-semibold text-forest-700 uppercase tracking-wider">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-forest-100">
                {inventory.length === 0 ? (
                  <tr>
                    <td colSpan={canManageInventory ? 8 : 7} className="px-4 py-12 text-center text-forest-600">
                      No inventory items yet. Add your first item to get started!
                    </td>
                  </tr>
                ) : (
                  inventory.map((item) => (
                    <tr key={item.id} className="hover:bg-forest-50/30 transition-colors">
                      <td className="px-4 py-4 whitespace-nowrap">
                        <button
                          onClick={() => item.imageUrl && window.open(item.imageUrl, '_blank')}
                          className="inline-flex items-center justify-center w-16 h-16 rounded-lg border-2 border-forest-200 hover:border-forest-300 hover:shadow-md transition-all"
                          disabled={!item.imageUrl}
                        >
                          {item.imageUrl ? (
                            <img 
                              src={item.imageUrl} 
                              alt={item.name}
                              className="w-full h-full object-cover rounded-lg cursor-pointer"
                            />
                          ) : (
                            <ImageIcon className="w-8 h-8 text-forest-300" />
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-forest-800">{item.name}</div>
                        {item.location && (
                          <div className="text-xs text-forest-500">{item.location}</div>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-forest-600">
                        {item.quantity}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                          item.condition === 'excellent' ? 'bg-green-100 text-green-800' :
                          item.condition === 'good' ? 'bg-blue-100 text-blue-800' :
                          item.condition === 'fair' ? 'bg-yellow-100 text-yellow-800' :
                          item.condition === 'poor' ? 'bg-orange-100 text-orange-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {item.condition.split('_').map(word => 
                            word.charAt(0).toUpperCase() + word.slice(1)
                          ).join(' ')}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm text-forest-600">{item.description}</div>
                        {item.notes && (
                          <div className="text-xs text-forest-500 mt-1 italic">{item.notes}</div>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-forest-600 font-medium">
                        {formatCurrency(item.estimatedValue)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-forest-600">
                        {formatDate(item.lastChecked)}
                      </td>
                      {canManageInventory && (
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEdit(item)}
                              className="text-blue-600 hover:text-blue-700 transition-colors"
                              title="Edit Item"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              disabled={deletingItemId === item.id}
                              className={`transition-colors ${
                                deletingItemId === item.id 
                                  ? 'text-yellow-600 cursor-wait' 
                                  : 'text-red-600 hover:text-red-700'
                              }`}
                              title={deletingItemId === item.id ? "Deleting..." : "Delete Item"}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add/Edit Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-forest-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-solarpunk-display font-bold text-forest-800">
                    {isEditMode ? 'Edit Item' : 'Add New Item'}
                  </h2>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="text-forest-400 hover:text-forest-600"
                  >
                    ✕
                  </button>
                </div>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-forest-700 mb-2">
                    Item Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-forest-200 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-transparent"
                    placeholder="e.g., Coffee Dispenser"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-forest-700 mb-2">
                      Quantity *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 border border-forest-200 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-forest-700 mb-2">
                      Condition *
                    </label>
                    <select
                      required
                      value={formData.condition}
                      onChange={(e) => setFormData({ ...formData, condition: e.target.value as ItemCondition })}
                      className="w-full px-4 py-2 border border-forest-200 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-transparent"
                    >
                      <option value="excellent">Excellent</option>
                      <option value="good">Good</option>
                      <option value="fair">Fair</option>
                      <option value="poor">Poor</option>
                      <option value="needs_repair">Needs Repair</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-forest-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    required
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-forest-200 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-transparent"
                    placeholder="Brief description of the item"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-forest-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={2}
                    className="w-full px-4 py-2 border border-forest-200 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-transparent"
                    placeholder="Additional notes or special instructions"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-forest-700 mb-2">
                      Image URL
                    </label>
                    <input
                      type="url"
                      value={formData.imageUrl}
                      onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                      className="w-full px-4 py-2 border border-forest-200 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-transparent"
                      placeholder="https://..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-forest-700 mb-2">
                      Estimated Value ($)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.estimatedValue}
                      onChange={(e) => setFormData({ ...formData, estimatedValue: e.target.value })}
                      className="w-full px-4 py-2 border border-forest-200 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-transparent"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-forest-700 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-4 py-2 border border-forest-200 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-transparent"
                    placeholder="e.g., Storage Room 1"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-6 py-2 border border-forest-200 text-forest-700 rounded-lg hover:bg-forest-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-gradient-to-r from-forest-600 to-ocean-600 text-white rounded-lg hover:shadow-lg transition-all"
                  >
                    {isEditMode ? 'Update Item' : 'Add Item'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InventoryPage;
