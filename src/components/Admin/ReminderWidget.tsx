import React, { useState, useEffect } from 'react';
import { Bell, Clock, CheckCircle, AlertTriangle, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import reminderService from '../../services/reminderService';
import { ReminderStats } from '../../types/reminder';

const ReminderWidget: React.FC = () => {
  const [stats, setStats] = useState<ReminderStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const statsResponse = await reminderService.getStats();
      setStats(statsResponse.data || null);
    } catch (error) {
      console.error('Error loading reminder stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-soft">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-soft">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Bell className="w-5 h-5 mr-2 text-primary-600" />
          Team Reminders
        </h3>
        <Link
          to="/admin/reminders"
          className="inline-flex items-center px-3 py-1 text-sm bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200 transition-colors"
        >
          <Plus className="w-4 h-4 mr-1" />
          Manage
        </Link>
      </div>

      {stats ? (
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Clock className="w-6 h-6 text-yellow-500" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
            <p className="text-sm text-gray-600">Pending</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <CheckCircle className="w-6 h-6 text-green-500" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
            <p className="text-sm text-gray-600">Completed</p>
          </div>
          {stats.overdue > 0 && (
            <div className="col-span-2">
              <div className="flex items-center justify-center p-2 bg-red-50 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-red-500 mr-2" />
                <span className="text-sm text-red-700">
                  {stats.overdue} overdue reminder{stats.overdue !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-4">
          <Bell className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600">No reminder data available</p>
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-gray-200">
        <Link
          to="/admin/reminders"
          className="text-sm text-primary-600 hover:text-primary-700 font-medium"
        >
          View all reminders →
        </Link>
      </div>
    </div>
  );
};

export default ReminderWidget;