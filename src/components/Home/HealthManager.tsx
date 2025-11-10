import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Heart, Pill, Calendar as CalendarIcon, Syringe } from 'lucide-react';
import homeService from '../../services/homeService';
import { Medication, HealthAppointment, VaccinationRecord } from '../../types/home';
import { useToast } from '../../contexts/ToastContext';

const HealthManager: React.FC = () => {
  const [view, setView] = useState<'medications' | 'appointments' | 'vaccinations'>('medications');
  const [loading, setLoading] = useState(true);
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      // Load data here
    } catch (error: any) {
      showError('Failed to load health data', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setView('medications')}
            className={`flex-1 px-4 py-2 rounded-lg flex items-center justify-center gap-2 ${
              view === 'medications'
                ? 'bg-gradient-to-r from-pink-500 to-red-500 text-white'
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            <Pill className="w-5 h-5" />
            Medications
          </button>
          <button
            onClick={() => setView('appointments')}
            className={`flex-1 px-4 py-2 rounded-lg flex items-center justify-center gap-2 ${
              view === 'appointments'
                ? 'bg-gradient-to-r from-pink-500 to-red-500 text-white'
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            <CalendarIcon className="w-5 h-5" />
            Appointments
          </button>
          <button
            onClick={() => setView('vaccinations')}
            className={`flex-1 px-4 py-2 rounded-lg flex items-center justify-center gap-2 ${
              view === 'vaccinations'
                ? 'bg-gradient-to-r from-pink-500 to-red-500 text-white'
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            <Syringe className="w-5 h-5" />
            Vaccinations
          </button>
        </div>

        <div className="text-center py-12">
          <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600">Health tracking system ready</p>
          <p className="text-sm text-gray-500 mt-2">Add medications, appointments, and vaccination records</p>
        </div>
      </div>
    </div>
  );
};

export default HealthManager;

