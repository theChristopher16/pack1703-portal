import React, { useState, useEffect } from 'react';
import { useAdmin } from '../contexts/AdminContext';
import { List, Edit, Trash2, Plus, Search, Filter, Tag, FileText } from 'lucide-react';
import DatabaseMonitor from '../components/Admin/DatabaseMonitor';

interface PackList {
  id: string;
  name: string;
  category: 'camping' | 'day-trip' | 'uniform' | 'safety' | 'activity' | 'other';
  description: string;
  items: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const AdminLists: React.FC = () => {
  const { addNotification } = useAdmin();
  const [lists, setLists] = useState<PackList[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedList, setSelectedList] = useState<PackList | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');

  // Mock data for now - will be replaced with Firebase calls
  useEffect(() => {
    const mockLists: PackList[] = [
      {
        id: '1',
        name: 'Tent & Sleeping Gear',
        category: 'camping',
        description: 'Essential items for comfortable camping',
        items: ['Tent', 'Sleeping bag', 'Sleeping pad', 'Pillow', 'Ground cloth', 'Tent stakes', 'Mallet'],
        isActive: true,
        createdAt: '2024-01-01T00:00:00',
        updatedAt: '2024-01-01T00:00:00'
      },
      {
        id: '2',
        name: 'Warm Clothing',
        category: 'other',
        description: 'Clothing for cold weather camping',
        items: ['Warm jacket', 'Thermal underwear', 'Wool socks', 'Hat', 'Gloves', 'Scarf', 'Waterproof boots'],
        isActive: true,
        createdAt: '2024-01-15T00:00:00',
        updatedAt: '2024-01-15T00:00:00'
      },
      {
        id: '3',
        name: 'First Aid Kit',
        category: 'safety',
        description: 'Basic first aid supplies for outdoor activities',
        items: ['Bandages', 'Antiseptic wipes', 'Pain relievers', 'Tweezers', 'Medical tape', 'Emergency contact info'],
        isActive: true,
        createdAt: '2024-02-01T00:00:00',
        updatedAt: '2024-02-01T00:00:00'
      },
      {
        id: '4',
        name: 'Day Trip Essentials',
        category: 'day-trip',
        description: 'Items needed for day trips and activities',
        items: ['Water bottle', 'Snacks', 'Sunscreen', 'Hat', 'Comfortable shoes', 'Small first aid kit'],
        isActive: true,
        createdAt: '2024-02-15T00:00:00',
        updatedAt: '2024-02-15T00:00:00'
      }
    ];
    setLists(mockLists);
    setLoading(false);
  }, []);

  const handleCreateList = () => {
    setModalMode('create');
    setSelectedList(null);
    setIsModalOpen(true);
  };

  const handleEditList = (list: PackList) => {
    setModalMode('edit');
    setSelectedList(list);
    setIsModalOpen(true);
  };

  const handleDeleteList = async (listId: string) => {
    if (window.confirm('Are you sure you want to delete this list? This action cannot be undone.')) {
      try {
        // TODO: Replace with actual Firebase call
        setLists(prev => prev.filter(list => list.id !== listId));
        addNotification('success', 'Success', 'List deleted successfully');
      } catch (error) {
        addNotification('error', 'Error', 'Failed to delete list');
      }
    }
  };

  const handleSaveList = async (listData: Omit<PackList, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      if (modalMode === 'create') {
        // TODO: Replace with actual Firebase call
        const newList: PackList = {
          ...listData,
          id: Date.now().toString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        setLists(prev => [...prev, newList]);
        addNotification('success', 'Success', 'List created successfully');
      } else {
        // TODO: Replace with actual Firebase call
        setLists(prev => prev.map(list => 
          list.id === selectedList?.id 
            ? { ...list, ...listData, updatedAt: new Date().toISOString() }
            : list
        ));
        addNotification('success', 'Success', 'List updated successfully');
      }
      setIsModalOpen(false);
    } catch (error) {
              addNotification('error', 'Error', `Failed to ${modalMode} list`);
    }
  };

  const filteredLists = lists.filter(list => {
    const matchesSearch = list.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         list.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || list.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'camping': return 'bg-green-100 text-green-700 border-green-200';
      case 'day-trip': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'uniform': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'safety': return 'bg-red-100 text-red-700 border-red-200';
      case 'activity': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'camping': return '🏕️';
      case 'day-trip': return '🚶';
      case 'uniform': return '👕';
      case 'safety': return '🛡️';
      case 'activity': return '🎯';
      default: return '📋';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-primary-50/30 to-secondary-50/30 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Loading Lists...</h2>
          <p className="text-gray-600">Please wait while we fetch the latest data.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-primary-50/30 to-secondary-50/30 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-primary-100 to-secondary-100 text-primary-700 rounded-full text-sm font-medium mb-6">
            <List className="w-4 h-4 mr-2" />
            Manage Lists
          </div>
          
          <h1 className="text-4xl md:text-6xl font-display font-bold mb-6 text-gray-900">
            <span className="text-gradient">Pack 1703</span> Lists
          </h1>
          
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Manage packing lists, checklists, and other organized collections of items that scouts and families need for various activities.
          </p>
        </div>

        {/* Database Monitor */}
        <div className="mb-8">
          <DatabaseMonitor />
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="text-center p-6 bg-white/90 backdrop-blur-sm rounded-2xl border border-white/50">
            <List className="w-8 h-8 text-primary-500 mx-auto mb-3" />
            <div className="text-2xl font-bold text-gray-900">{lists.length}</div>
            <div className="text-sm text-gray-600">Total Lists</div>
          </div>
          
          <div className="text-center p-6 bg-white/90 backdrop-blur-sm rounded-2xl border border-white/50">
            <Tag className="w-8 h-8 text-secondary-500 mx-auto mb-3" />
            <div className="text-2xl font-bold text-gray-900">
              {lists.filter(l => l.isActive).length}
            </div>
            <div className="text-sm text-gray-600">Active Lists</div>
          </div>
          
          <div className="text-center p-6 bg-white/90 backdrop-blur-sm rounded-2xl border border-white/50">
            <FileText className="w-8 h-8 text-accent-500 mx-auto mb-3" />
            <div className="text-2xl font-bold text-gray-900">
              {lists.reduce((total, list) => total + list.items.length, 0)}
            </div>
            <div className="text-sm text-gray-600">Total Items</div>
          </div>
          
          <div className="text-center p-6 bg-white/90 backdrop-blur-sm rounded-2xl border border-white/50">
            <Filter className="w-8 h-8 text-purple-500 mx-auto mb-3" />
            <div className="text-2xl font-bold text-gray-900">
              {new Set(lists.map(l => l.category)).size}
            </div>
            <div className="text-sm text-gray-600">Categories</div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <button
            onClick={handleCreateList}
            className="flex items-center justify-center px-6 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-medium rounded-xl hover:from-primary-600 hover:to-secondary-600 transition-all duration-200 transform hover:scale-105"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create New List
          </button>
          
          <div className="flex-1 flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search lists..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">All Categories</option>
              <option value="camping">Camping</option>
              <option value="day-trip">Day Trip</option>
              <option value="uniform">Uniform</option>
              <option value="safety">Safety</option>
              <option value="activity">Activity</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        {/* Lists Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLists.map((list) => (
            <div
              key={list.id}
              className={`bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-soft transition-all duration-200 hover:shadow-lg ${
                !list.isActive ? 'opacity-60' : ''
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-secondary-500 rounded-xl flex items-center justify-center shadow-glow">
                      <List className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-display font-semibold text-gray-900">
                        {list.name}
                      </h3>
                      <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getCategoryColor(list.category)}`}>
                        <span className="mr-1">{getCategoryIcon(list.category)}</span>
                        {list.category}
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-3">{list.description}</p>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleEditList(list)}
                    className="p-2 text-gray-400 hover:text-primary-500 hover:bg-primary-50 rounded-lg transition-colors duration-200"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteList(list.id)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors duration-200"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Items */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Items ({list.items.length})</h4>
                <div className="space-y-1">
                  {list.items.slice(0, 5).map((item, index) => (
                    <div key={index} className="flex items-center space-x-2 text-sm text-gray-600">
                      <div className="w-1.5 h-1.5 bg-primary-400 rounded-full"></div>
                      <span className="truncate">{item}</span>
                    </div>
                  ))}
                  {list.items.length > 5 && (
                    <div className="text-xs text-gray-500 mt-2">
                      +{list.items.length - 5} more items
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${list.isActive ? 'bg-green-400' : 'bg-gray-400'}`}></div>
                  <span className="text-xs text-gray-500">
                    {list.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                
                <div className="text-xs text-gray-500">
                  Updated {new Date(list.updatedAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* No Results */}
        {filteredLists.length === 0 && (
          <div className="text-center py-12">
            <List className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-500 mb-2">No lists found</h3>
            <p className="text-gray-400">Try adjusting your search terms or filters.</p>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <ListModal
          mode={modalMode}
          list={selectedList}
          onSave={handleSaveList}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
};

// List Modal Component
interface ListModalProps {
  mode: 'create' | 'edit';
  list: PackList | null;
  onSave: (data: Omit<PackList, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onClose: () => void;
}

const ListModal: React.FC<ListModalProps> = ({ mode, list, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    name: list?.name || '',
    category: list?.category || 'camping',
    description: list?.description || '',
    items: list?.items || [''],
    isActive: list?.isActive ?? true
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanItems = formData.items.filter(item => item.trim() !== '');
    onSave({ ...formData, items: cleanItems });
  };

  const addItem = () => {
    setFormData(prev => ({ ...prev, items: [...prev.items, ''] }));
  };

  const removeItem = (index: number) => {
    setFormData(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }));
  };

  const updateItem = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => i === index ? value : item)
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-display font-semibold text-gray-900">
            {mode === 'create' ? 'Create New List' : 'Edit List'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                List Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="e.g., Camping Packing List"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <select
                required
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as any }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="camping">Camping</option>
                <option value="day-trip">Day Trip</option>
                <option value="uniform">Uniform</option>
                <option value="safety">Safety</option>
                <option value="activity">Activity</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Describe what this list is for..."
            />
          </div>

          {/* Items */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Items *
            </label>
            <div className="space-y-2">
              {formData.items.map((item, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <input
                    type="text"
                    required
                    value={item}
                    onChange={(e) => updateItem(index, e.target.value)}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder={`Item ${index + 1}`}
                  />
                  {formData.items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="p-3 text-red-500 hover:bg-red-50 rounded-lg transition-colors duration-200"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addItem}
                className="flex items-center space-x-2 px-4 py-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors duration-200"
              >
                <Plus className="w-4 h-4" />
                <span>Add Item</span>
              </button>
            </div>
          </div>

          {/* Active Status */}
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
              List is active and visible to users
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-primary-500 text-white font-medium rounded-xl hover:bg-primary-600 transition-colors duration-200"
            >
              {mode === 'create' ? 'Create List' : 'Update List'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminLists;
