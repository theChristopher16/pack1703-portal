import React from 'react';
import { CalendarDays } from 'lucide-react';

const FamilyCalendar: React.FC = () => {
  return (
    <div className="bg-white rounded-xl shadow-sm p-12 text-center">
      <CalendarDays className="w-16 h-16 text-gray-300 mx-auto mb-4" />
      <h3 className="text-xl font-semibold text-gray-700 mb-2">Family Calendar</h3>
      <p className="text-gray-600">Shared family calendar for appointments and activities</p>
    </div>
  );
};

export default FamilyCalendar;

