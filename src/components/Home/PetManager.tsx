import React from 'react';
import { PawPrint } from 'lucide-react';

const PetManager: React.FC = () => {
  return (
    <div className="bg-white rounded-xl shadow-sm p-12 text-center">
      <PawPrint className="w-16 h-16 text-gray-300 mx-auto mb-4" />
      <h3 className="text-xl font-semibold text-gray-700 mb-2">Pet Care</h3>
      <p className="text-gray-600">Manage pet health, appointments, and supplies</p>
    </div>
  );
};

export default PetManager;

