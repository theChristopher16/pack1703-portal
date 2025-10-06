import React, { useState } from 'react';
import { Plus, Trash2, Calendar, Clock, MapPin } from 'lucide-react';

export interface DateOption {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  locationId?: string;
  notes?: string;
  maxCapacity?: number;
}

interface FlexibleDateOptionsProps {
  dateOptions: DateOption[];
  onChange: (options: DateOption[]) => void;
  availableLocations?: Array<{ id: string; name: string; address: string }>;
}

const FlexibleDateOptions: React.FC<FlexibleDateOptionsProps> = ({
  dateOptions,
  onChange,
  availableLocations = []
}) => {
  const [expandedOption, setExpandedOption] = useState<string | null>(null);

  const addDateOption = () => {
    const newOption: DateOption = {
      id: `option-${Date.now()}`,
      date: '',
      startTime: '09:00',
      endTime: '17:00',
      notes: '',
      maxCapacity: undefined
    };
    onChange([...dateOptions, newOption]);
    setExpandedOption(newOption.id);
  };

  const removeDateOption = (id: string) => {
    onChange(dateOptions.filter(option => option.id !== id));
    if (expandedOption === id) {
      setExpandedOption(null);
    }
  };

  const updateDateOption = (id: string, updates: Partial<DateOption>) => {
    onChange(dateOptions.map(option => 
      option.id === id ? { ...option, ...updates } : option
    ));
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-teal-900 flex items-center">
          <Calendar className="w-4 h-4 mr-2" />
          Flexible Date Options
        </h4>
        <button
          type="button"
          onClick={addDateOption}
          className="flex items-center space-x-2 px-3 py-2 bg-teal-100 text-teal-700 rounded-lg hover:bg-teal-200 transition-colors duration-200 text-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Add Date Option</span>
        </button>
      </div>

      {dateOptions.length === 0 ? (
        <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
          <Calendar className="w-8 h-8 mx-auto mb-2 text-gray-400" />
          <p>No date options added yet</p>
          <p className="text-sm">Click "Add Date Option" to create flexible scheduling</p>
        </div>
      ) : (
        <div className="space-y-3">
          {dateOptions.map((option, index) => (
            <div key={option.id} className="bg-white/70 rounded-lg border border-teal-200 overflow-hidden">
              {/* Header */}
              <div 
                className="p-4 cursor-pointer hover:bg-teal-50 transition-colors duration-200"
                onClick={() => setExpandedOption(expandedOption === option.id ? null : option.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-teal-100 text-teal-700 rounded-full flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium text-teal-800">
                        {option.date ? formatDate(option.date) : 'Select Date'}
                      </div>
                      <div className="text-sm text-teal-600 flex items-center space-x-4">
                        <span className="flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {formatTime(option.startTime)} - {formatTime(option.endTime)}
                        </span>
                        {option.maxCapacity && (
                          <span>Max {option.maxCapacity} people</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {option.notes && (
                      <span className="text-xs text-teal-600 bg-teal-100 px-2 py-1 rounded-full">
                        Has Notes
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeDateOption(option.id);
                      }}
                      className="text-red-500 hover:text-red-700 transition-colors duration-200"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Expanded Form */}
              {expandedOption === option.id && (
                <div className="px-4 pb-4 border-t border-teal-100 bg-teal-50/50">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                    {/* Date */}
                    <div>
                      <label className="block text-sm font-medium text-teal-800 mb-1">
                        Date
                      </label>
                      <input
                        type="date"
                        value={option.date}
                        onChange={(e) => updateDateOption(option.id, { date: e.target.value })}
                        className="w-full px-3 py-2 border border-teal-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                      />
                    </div>

                    {/* Times */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-sm font-medium text-teal-800 mb-1">
                          Start Time
                        </label>
                        <input
                          type="time"
                          value={option.startTime}
                          onChange={(e) => updateDateOption(option.id, { startTime: e.target.value })}
                          className="w-full px-3 py-2 border border-teal-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-teal-800 mb-1">
                          End Time
                        </label>
                        <input
                          type="time"
                          value={option.endTime}
                          onChange={(e) => updateDateOption(option.id, { endTime: e.target.value })}
                          className="w-full px-3 py-2 border border-teal-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                        />
                      </div>
                    </div>

                    {/* Location */}
                    {availableLocations.length > 0 && (
                      <div>
                        <label className="block text-sm font-medium text-teal-800 mb-1">
                          <MapPin className="w-3 h-3 inline mr-1" />
                          Location (Optional)
                        </label>
                        <select
                          value={option.locationId || ''}
                          onChange={(e) => updateDateOption(option.id, { locationId: e.target.value || undefined })}
                          className="w-full px-3 py-2 border border-teal-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                        >
                          <option value="">Same as main event</option>
                          {availableLocations.map(location => (
                            <option key={location.id} value={location.id}>
                              {location.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Max Capacity */}
                    <div>
                      <label className="block text-sm font-medium text-teal-800 mb-1">
                        Max Capacity (Optional)
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={option.maxCapacity || ''}
                        onChange={(e) => updateDateOption(option.id, { 
                          maxCapacity: e.target.value ? parseInt(e.target.value) : undefined 
                        })}
                        placeholder="No limit"
                        className="w-full px-3 py-2 border border-teal-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                      />
                    </div>

                    {/* Notes */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-teal-800 mb-1">
                        Special Notes for This Date
                      </label>
                      <textarea
                        value={option.notes || ''}
                        onChange={(e) => updateDateOption(option.id, { notes: e.target.value })}
                        placeholder="Any special information about this date option..."
                        className="w-full px-3 py-2 border border-teal-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 resize-none"
                        rows={2}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FlexibleDateOptions;
