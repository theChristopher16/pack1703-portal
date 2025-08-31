import React, { useState, useEffect } from 'react';
import { Settings, Save, Edit3, X, Plus, Trash2, RefreshCw } from 'lucide-react';
import { Configuration, ConfigCategory } from '../../types/firestore';
import configService from '../../services/configService';
import { useAdmin } from '../../contexts/AdminContext';

interface ConfigManagerProps {
  className?: string;
}

export const ConfigManager: React.FC<ConfigManagerProps> = ({ className = '' }) => {
  const { state, addNotification } = useAdmin();
  const [configs, setConfigs] = useState<Configuration[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Configuration>>({});
  const [selectedCategory, setSelectedCategory] = useState<ConfigCategory | 'all'>('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState<Partial<Configuration>>({});
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});

  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    setLoading(true);
    try {
      const allConfigs = await configService.getAllConfigs();
      setConfigs(allConfigs);
    } catch (error) {
      addNotification('error', 'Error Loading Configurations', 'Failed to load configuration data.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (config: Configuration) => {
    setEditingKey(config.key);
    setEditForm({
      value: config.value,
      description: config.description,
      isEditable: config.isEditable
    });
    setValidationErrors({});
  };

  const handleSave = async () => {
    if (!editingKey) return;

    const config = configs.find(c => c.key === editingKey);
    if (!config) return;

    // Validate the value
    const validation = configService.validateConfigValue(editForm.value, config.validationRules);
    if (!validation.isValid) {
      setValidationErrors({ [editingKey]: validation.errors });
      return;
    }

    try {
      const success = await configService.updateConfig(editingKey, editForm, state.currentUser?.uid || 'admin');
      if (success) {
        addNotification('success', 'Configuration Updated', 'Configuration has been successfully updated.');
        await loadConfigs(); // Reload to get updated data
        setEditingKey(null);
        setEditForm({});
        setValidationErrors({});
      } else {
        addNotification('error', 'Update Failed', 'Failed to update configuration.');
      }
    } catch (error) {
      addNotification('error', 'Update Error', 'An error occurred while updating the configuration.');
    }
  };

  const handleCancel = () => {
    setEditingKey(null);
    setEditForm({});
    setValidationErrors({});
  };

  const handleAdd = async () => {
    if (!addForm.key || !addForm.value || !addForm.category) {
      addNotification('error', 'Missing Fields', 'Please fill in all required fields.');
      return;
    }

    // Validate the value
    const validation = configService.validateConfigValue(addForm.value, addForm.validationRules);
    if (!validation.isValid) {
      setValidationErrors({ new: validation.errors });
      return;
    }

    try {
      const success = await configService.setConfig(
        addForm.key,
        addForm.value,
        addForm.category as ConfigCategory,
        addForm.description || '',
        addForm.isEditable !== false,
        addForm.validationRules,
        state.currentUser?.uid || 'admin'
      );

      if (success) {
        addNotification('success', 'Configuration Added', 'New configuration has been successfully added.');
        await loadConfigs();
        setShowAddForm(false);
        setAddForm({});
        setValidationErrors({});
      } else {
        addNotification('error', 'Add Failed', 'Failed to add new configuration.');
      }
    } catch (error) {
      addNotification('error', 'Add Error', 'An error occurred while adding the configuration.');
    }
  };

  const handleDelete = async (key: string) => {
    if (!confirm('Are you sure you want to delete this configuration? This action cannot be undone.')) {
      return;
    }

    try {
      const success = await configService.deleteConfig(key);
      if (success) {
        addNotification('success', 'Configuration Deleted', 'Configuration has been successfully deleted.');
        await loadConfigs();
      } else {
        addNotification('error', 'Delete Failed', 'Failed to delete configuration.');
      }
    } catch (error) {
      addNotification('error', 'Delete Error', 'An error occurred while deleting the configuration.');
    }
  };

  const handleInitializeDefaults = async () => {
    try {
      await configService.initializeDefaultConfigs(state.currentUser?.uid || 'admin');
      addNotification('success', 'Defaults Initialized', 'Default configurations have been initialized.');
      await loadConfigs();
    } catch (error) {
      addNotification('error', 'Initialization Failed', 'Failed to initialize default configurations.');
    }
  };

  const filteredConfigs = selectedCategory === 'all' 
    ? configs 
    : configs.filter(config => config.category === selectedCategory);

  const renderValueInput = (config: Configuration, value: any, onChange: (value: any) => void) => {
    const type = config.validationRules?.type || 'string';

    switch (type) {
      case 'boolean':
        return (
          <select
            value={value ? 'true' : 'false'}
            onChange={(e) => onChange(e.target.value === 'true')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="true">True</option>
            <option value="false">False</option>
          </select>
        );

      case 'number':
        return (
          <input
            type="number"
            value={value || ''}
            onChange={(e) => onChange(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        );

      case 'email':
        return (
          <input
            type="email"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        );

      case 'url':
        return (
          <input
            type="url"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        );

      default:
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        );
    }
  };

  if (loading) {
    return (
      <div className={`bg-white/90 backdrop-blur-sm rounded-2xl p-8 border border-white/50 shadow-soft ${className}`}>
        <div className="flex items-center justify-center">
          <RefreshCw className="w-6 h-6 animate-spin text-primary" />
          <span className="ml-2 text-gray-600">Loading configurations...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white/90 backdrop-blur-sm rounded-2xl p-8 border border-white/50 shadow-soft ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-3">
          <Settings className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-display font-semibold text-gray-900">
            Configuration Manager
          </h2>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleInitializeDefaults}
            className="flex items-center space-x-2 px-4 py-2 bg-secondary-500 text-white rounded-lg hover:bg-secondary-600 transition-colors duration-200"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Initialize Defaults</span>
          </button>
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors duration-200"
          >
            <Plus className="w-4 h-4" />
            <span>Add Configuration</span>
          </button>
        </div>
      </div>

      {/* Category Filter */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-900 mb-2">Filter by Category</label>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value as ConfigCategory | 'all')}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
        >
          <option value="all">All Categories</option>
          <option value="contact">Contact</option>
          <option value="email">Email</option>
          <option value="system">System</option>
          <option value="display">Display</option>
          <option value="security">Security</option>
          <option value="notifications">Notifications</option>
          <option value="integrations">Integrations</option>
        </select>
      </div>

      {/* Add Configuration Form */}
      {showAddForm && (
        <div className="mb-6 p-6 bg-gray-50 rounded-lg border">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Configuration</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Key</label>
              <input
                type="text"
                value={addForm.key || ''}
                onChange={(e) => setAddForm({ ...addForm, key: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="e.g., contact.email.primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Category</label>
              <select
                value={addForm.category || ''}
                onChange={(e) => setAddForm({ ...addForm, category: e.target.value as ConfigCategory })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">Select Category</option>
                <option value="contact">Contact</option>
                <option value="email">Email</option>
                <option value="system">System</option>
                <option value="display">Display</option>
                <option value="security">Security</option>
                <option value="notifications">Notifications</option>
                <option value="integrations">Integrations</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Value</label>
              <input
                type="text"
                value={String(addForm.value || '')}
                onChange={(e) => setAddForm({ ...addForm, value: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Enter value"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Description</label>
              <input
                type="text"
                value={addForm.description || ''}
                onChange={(e) => setAddForm({ ...addForm, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Brief description"
              />
            </div>
          </div>
          {validationErrors.new && (
            <div className="mt-2 text-sm text-red-600">
              {validationErrors.new.map((error, index) => (
                <div key={index}>{error}</div>
              ))}
            </div>
          )}
          <div className="flex space-x-3 mt-4">
            <button
              onClick={handleAdd}
              className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors duration-200"
            >
              <Save className="w-4 h-4" />
              <span>Add Configuration</span>
            </button>
            <button
              onClick={() => {
                setShowAddForm(false);
                setAddForm({});
                setValidationErrors({});
              }}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors duration-200"
            >
              <X className="w-4 h-4" />
              <span>Cancel</span>
            </button>
          </div>
        </div>
      )}

      {/* Configurations List */}
      <div className="space-y-4">
        {filteredConfigs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Settings className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No configurations found for the selected category.</p>
          </div>
        ) : (
          filteredConfigs.map((config) => (
            <div key={config.key} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{config.key}</h3>
                  <p className="text-sm text-gray-600">{config.description}</p>
                  <div className="flex items-center space-x-4 mt-1">
                    <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                      {config.category}
                    </span>
                    {config.isEditable ? (
                      <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                        Editable
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                        Read-only
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex space-x-2">
                  {config.isEditable && (
                    <button
                      onClick={() => handleEdit(config)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(config.key)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {editingKey === config.key ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">Value</label>
                    {renderValueInput(config, editForm.value, (value) => setEditForm({ ...editForm, value }))}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">Description</label>
                    <input
                      type="text"
                      value={editForm.description || ''}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                  {validationErrors[config.key] && (
                    <div className="text-sm text-red-600">
                      {validationErrors[config.key].map((error, index) => (
                        <div key={index}>{error}</div>
                      ))}
                    </div>
                  )}
                  <div className="flex space-x-3">
                    <button
                      onClick={handleSave}
                      className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors duration-200"
                    >
                      <Save className="w-4 h-4" />
                      <span>Save</span>
                    </button>
                    <button
                      onClick={handleCancel}
                      className="flex items-center space-x-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors duration-200"
                    >
                      <X className="w-4 h-4" />
                      <span>Cancel</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-sm text-gray-600 mb-1">Current Value:</div>
                  <div className="font-mono text-gray-900 break-all">
                    {typeof config.value === 'boolean' 
                      ? (config.value ? 'true' : 'false')
                      : String(config.value)
                    }
                  </div>
                </div>
              )}

              <div className="mt-3 text-xs text-gray-500">
                Last updated: {config.updatedAt.toDate().toLocaleString()} by {config.updatedBy}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ConfigManager;
