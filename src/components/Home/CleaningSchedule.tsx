import React from 'react';
import { Sparkles } from 'lucide-react';

const CleaningSchedule: React.FC = () => {
  return (
    <div className="bg-white rounded-xl shadow-sm p-12 text-center">
      <Sparkles className="w-16 h-16 text-gray-300 mx-auto mb-4" />
      <h3 className="text-xl font-semibold text-gray-700 mb-2">Cleaning Schedule</h3>
      <p className="text-gray-600">Room-by-room cleaning checklists</p>
    </div>
  );
};

export default CleaningSchedule;

