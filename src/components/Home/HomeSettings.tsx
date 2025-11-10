import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings, RotateCcw, Save, Info } from 'lucide-react';
import homePreferencesService from '../../services/homePreferencesService';
import { HomePreferences, HOME_FEATURES } from '../../types/homePreferences';
import { useToast } from '../../contexts/ToastContext';

const HomeSettings: React.FC = () => {
  const [preferences, setPreferences] = useState<HomePreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      const prefs = await homePreferencesService.getPreferences();
      setPreferences(prefs);
    } catch (error: any) {
      showError('Failed to load preferences', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (featureKey: keyof HomePreferences['features']) => {
    if (!preferences) return;

    try {
      const newValue = !preferences.features[featureKey];
      
      // Update local state immediately for responsive UI
      setPreferences({
        ...preferences,
        features: {
          ...preferences.features,
          [featureKey]: newValue,
        },
      });

      // Save to database
      await homePreferencesService.toggleFeature(featureKey);
      showSuccess(`${HOME_FEATURES[featureKey].name} ${newValue ? 'enabled' : 'disabled'}`);
      
      // Dispatch event to notify parent component for live update
      window.dispatchEvent(new CustomEvent('homePreferencesUpdated'));
    } catch (error: any) {
      showError('Failed to update preference', error.message);
      // Revert on error
      loadPreferences();
    }
  };

  const handleResetToDefaults = async () => {
    if (!window.confirm('Are you sure you want to reset all settings to defaults?')) return;

    try {
      setSaving(true);
      await homePreferencesService.resetToDefaults();
      await loadPreferences();
      showSuccess('Settings reset to defaults');
    } catch (error: any) {
      showError('Failed to reset settings', error.message);
    } finally {
      setSaving(false);
    }
  };

  const groupedFeatures = {
    essential: Object.entries(HOME_FEATURES).filter(([_, f]) => f.category === 'essential'),
    financial: Object.entries(HOME_FEATURES).filter(([_, f]) => f.category === 'financial'),
    organization: Object.entries(HOME_FEATURES).filter(([_, f]) => f.category === 'organization'),
    health: Object.entries(HOME_FEATURES).filter(([_, f]) => f.category === 'health'),
    maintenance: Object.entries(HOME_FEATURES).filter(([_, f]) => f.category === 'maintenance'),
  };

  const categoryInfo = {
    essential: {
      title: 'Essential Features',
      description: 'Core home management features for daily use',
      color: 'blue',
    },
    financial: {
      title: 'Financial Management',
      description: 'Track budgets, expenses, bills, and subscriptions',
      color: 'green',
    },
    organization: {
      title: 'Organization & Planning',
      description: 'Keep your household organized and planned',
      color: 'purple',
    },
    health: {
      title: 'Health & Wellness',
      description: 'Manage health, medications, and pet care',
      color: 'pink',
    },
    maintenance: {
      title: 'Maintenance & Care',
      description: 'Home, vehicle, and cleaning management',
      color: 'orange',
    },
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!preferences) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-12 text-center">
        <Settings className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-700 mb-2">No preferences found</h3>
        <p className="text-gray-500">Failed to load your preferences</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Settings className="w-6 h-6" />
              Feature Settings
            </h2>
            <p className="text-gray-600 mt-1">
              Enable or disable features to customize your home management experience
            </p>
          </div>
          <button
            onClick={handleResetToDefaults}
            disabled={saving}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <RotateCcw className="w-4 h-4" />
            Reset to Defaults
          </button>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800">
          <p className="font-medium mb-1">Customize Your Experience</p>
          <p>
            Toggle features on or off to show only what you need. Changes are saved automatically and
            will update your navigation tabs immediately.
          </p>
        </div>
      </div>

      {/* Feature Categories */}
      {Object.entries(groupedFeatures).map(([category, features]) => {
        const info = categoryInfo[category as keyof typeof categoryInfo];
        if (features.length === 0) return null;

        return (
          <motion.div
            key={category}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-sm overflow-hidden"
          >
            {/* Category Header */}
            <div className={`bg-gradient-to-r from-${info.color}-500 to-${info.color}-600 p-4`}>
              <h3 className="text-lg font-semibold text-white">{info.title}</h3>
              <p className="text-white/90 text-sm">{info.description}</p>
            </div>

            {/* Features List */}
            <div className="p-4 space-y-3">
              {features.map(([key, feature]) => {
                const isEnabled = preferences.features[key as keyof HomePreferences['features']];

                return (
                  <div
                    key={key}
                    className={`flex items-center justify-between p-4 border-2 rounded-lg transition-all ${
                      isEnabled
                        ? 'border-green-400 bg-green-50 shadow-sm'
                        : 'border-gray-200 bg-white hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className={`font-semibold ${isEnabled ? 'text-green-900' : 'text-gray-800'}`}>
                          {feature.name}
                        </h4>
                        {isEnabled && (
                          <span className="px-2 py-0.5 bg-green-500 text-white text-xs font-medium rounded-full">
                            Active
                          </span>
                        )}
                      </div>
                      <p className={`text-sm ${isEnabled ? 'text-green-700' : 'text-gray-600'}`}>
                        {feature.description}
                      </p>
                    </div>

                    {/* Toggle Switch */}
                    <button
                      onClick={() => handleToggle(key as keyof HomePreferences['features'])}
                      className={`relative inline-flex h-8 w-14 flex-shrink-0 items-center rounded-full transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 border-2 ${
                        isEnabled 
                          ? 'bg-gradient-to-r from-green-400 to-blue-500 border-green-500' 
                          : 'bg-gray-200 border-gray-300'
                      }`}
                      role="switch"
                      aria-checked={isEnabled}
                    >
                      <span
                        className={`inline-block h-6 w-6 transform rounded-full shadow-lg transition-all duration-200 ease-in-out flex items-center justify-center ${
                          isEnabled 
                            ? 'translate-x-7 bg-white' 
                            : 'translate-x-1 bg-gray-400'
                        }`}
                      >
                        {isEnabled && (
                          <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </span>
                    </button>
                  </div>
                );
              })}
            </div>
          </motion.div>
        );
      })}

      {/* Summary */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-800 mb-1">Active Features</h3>
            <p className="text-gray-600">
              {Object.values(preferences.features).filter(Boolean).length} of{' '}
              {Object.keys(preferences.features).length} features enabled
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Last Updated</p>
            <p className="font-medium text-gray-800">
              {preferences.updatedAt.toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeSettings;

