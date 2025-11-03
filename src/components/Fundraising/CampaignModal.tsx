import React, { useState, useEffect } from 'react';
import { X, Calendar, DollarSign, Users, AlertCircle } from 'lucide-react';
import { Timestamp } from 'firebase/firestore';
import { FundraisingCampaign } from '../../services/fundraisingService';

interface CampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (campaignData: Partial<FundraisingCampaign>) => Promise<void>;
  mode: 'create' | 'edit';
  campaign?: FundraisingCampaign | null;
}

export const CampaignModal: React.FC<CampaignModalProps> = ({
  isOpen,
  onClose,
  onSave,
  mode,
  campaign
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    goal: '',
    startDate: '',
    endDate: '',
    status: 'upcoming' as 'active' | 'completed' | 'upcoming' | 'paused',
    type: 'general' as 'popcorn' | 'camping' | 'general' | 'event' | 'donation',
    maxParticipants: '',
    isActive: true
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (mode === 'edit' && campaign) {
      const startDateStr = campaign.startDate instanceof Timestamp 
        ? campaign.startDate.toDate().toISOString().split('T')[0]
        : campaign.startDate;
      const endDateStr = campaign.endDate instanceof Timestamp
        ? campaign.endDate.toDate().toISOString().split('T')[0]
        : campaign.endDate;

      setFormData({
        name: campaign.name,
        description: campaign.description,
        goal: campaign.goal.toString(),
        startDate: startDateStr,
        endDate: endDateStr,
        status: campaign.status,
        type: campaign.type,
        maxParticipants: campaign.maxParticipants?.toString() || '',
        isActive: campaign.isActive
      });
    } else {
      // Set default dates for new campaigns
      const today = new Date().toISOString().split('T')[0];
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      const nextMonthStr = nextMonth.toISOString().split('T')[0];
      
      setFormData({
        name: '',
        description: '',
        goal: '',
        startDate: today,
        endDate: nextMonthStr,
        status: 'upcoming',
        type: 'general',
        maxParticipants: '',
        isActive: true
      });
    }
    setErrors({});
  }, [mode, campaign, isOpen]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Campaign name is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    const goalNum = parseFloat(formData.goal);
    if (!formData.goal || isNaN(goalNum) || goalNum <= 0) {
      newErrors.goal = 'Goal must be a positive number';
    }

    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    }

    if (!formData.endDate) {
      newErrors.endDate = 'End date is required';
    }

    if (formData.startDate && formData.endDate && formData.startDate > formData.endDate) {
      newErrors.endDate = 'End date must be after start date';
    }

    if (formData.maxParticipants && (isNaN(parseInt(formData.maxParticipants)) || parseInt(formData.maxParticipants) <= 0)) {
      newErrors.maxParticipants = 'Max participants must be a positive number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSaving(true);

    try {
      const campaignData: Partial<FundraisingCampaign> = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        goal: parseFloat(formData.goal),
        startDate: Timestamp.fromDate(new Date(formData.startDate)),
        endDate: Timestamp.fromDate(new Date(formData.endDate)),
        status: formData.status,
        type: formData.type,
        isActive: formData.isActive
      };

      if (formData.maxParticipants) {
        campaignData.maxParticipants = parseInt(formData.maxParticipants);
      }

      await onSave(campaignData);
      onClose();
    } catch (error) {
      console.error('Error saving campaign:', error);
      setErrors({ submit: 'Failed to save campaign. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-white/50 shadow-soft">
        <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-gray-200 p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            {mode === 'create' ? 'Create New Campaign' : 'Edit Campaign'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isSaving}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Campaign Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Campaign Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.name ? 'border-red-500' : 'border-gray-200'
              }`}
              placeholder="e.g., Fall Popcorn Sale 2025"
              disabled={isSaving}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.name}
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={4}
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.description ? 'border-red-500' : 'border-gray-200'
              }`}
              placeholder="Describe the campaign goals and details..."
              disabled={isSaving}
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.description}
              </p>
            )}
          </div>

          {/* Goal and Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fundraising Goal ($) *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <DollarSign className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.goal}
                  onChange={(e) => handleChange('goal', e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.goal ? 'border-red-500' : 'border-gray-200'
                  }`}
                  placeholder="5000.00"
                  disabled={isSaving}
                />
              </div>
              {errors.goal && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.goal}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Campaign Type *
              </label>
              <select
                value={formData.type}
                onChange={(e) => handleChange('type', e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isSaving}
              >
                <option value="popcorn">Popcorn Sale</option>
                <option value="camping">Camping Trip</option>
                <option value="event">Event Fundraiser</option>
                <option value="donation">Donation Drive</option>
                <option value="general">General Fundraising</option>
              </select>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => handleChange('startDate', e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.startDate ? 'border-red-500' : 'border-gray-200'
                  }`}
                  disabled={isSaving}
                />
              </div>
              {errors.startDate && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.startDate}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => handleChange('endDate', e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.endDate ? 'border-red-500' : 'border-gray-200'
                  }`}
                  disabled={isSaving}
                />
              </div>
              {errors.endDate && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.endDate}
                </p>
              )}
            </div>
          </div>

          {/* Status and Max Participants */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Campaign Status *
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleChange('status', e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isSaving}
              >
                <option value="upcoming">Upcoming</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Participants (Optional)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Users className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="number"
                  min="0"
                  value={formData.maxParticipants}
                  onChange={(e) => handleChange('maxParticipants', e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.maxParticipants ? 'border-red-500' : 'border-gray-200'
                  }`}
                  placeholder="Leave empty for unlimited"
                  disabled={isSaving}
                />
              </div>
              {errors.maxParticipants && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.maxParticipants}
                </p>
              )}
            </div>
          </div>

          {/* Active Toggle */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => handleChange('isActive', e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              disabled={isSaving}
            />
            <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
              Campaign is active and visible
            </label>
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-sm text-red-600 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                {errors.submit}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors duration-200 font-medium"
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 shadow-soft disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Saving...
                </>
              ) : (
                mode === 'create' ? 'Create Campaign' : 'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


