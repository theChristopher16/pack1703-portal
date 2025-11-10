import React, { useState, useEffect } from 'react';
import { Car } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';

const VehicleManager: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const { showError } = useToast();

  return (
    <div className="bg-white rounded-xl shadow-sm p-12 text-center">
      <Car className="w-16 h-16 text-gray-300 mx-auto mb-4" />
      <h3 className="text-xl font-semibold text-gray-700 mb-2">Vehicle Management</h3>
      <p className="text-gray-600">Track vehicle maintenance, registration, and expenses</p>
    </div>
  );
};

export default VehicleManager;

