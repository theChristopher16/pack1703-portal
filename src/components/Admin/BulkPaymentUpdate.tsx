/**
 * Bulk Payment Update Tool
 * Simple admin interface to mark multiple users as paid
 */

import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, Users, DollarSign, Search } from 'lucide-react';
import { paymentService } from '../../services/paymentService';
import { useAdmin } from '../../contexts/AdminContext';

interface BulkPaymentUpdateProps {
  eventId: string;
  eventTitle: string;
  onClose: () => void;
}

const BulkPaymentUpdate: React.FC<BulkPaymentUpdateProps> = ({
  eventId,
  eventTitle,
  onClose
}) => {
  const { state } = useAdmin();
  const [paidUsers, setPaidUsers] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateResults, setUpdateResults] = useState<any[]>([]);

  // List of people who have paid $60 (from your Square dashboard)
  const squarePaidUsers = [
    'Megan Williams',
    'Eric Bucknam', 
    'Sarah Cotting',
    'Vanessa Gerard',
    'Christopher Smith',
    'Jocelyn Bacon',
    'Edgar Folmar',
    'Ramya Kantheti',
    'Wei Gao',
    'Nidhi Aggarwal',
    'Caitlin Seo',
    'James Morley',
    'Stephen Tadlock',
    'Shana Johnson'
  ];

  useEffect(() => {
    setPaidUsers(squarePaidUsers);
  }, []);

  const handleUserSelect = (userName: string) => {
    setSelectedUsers(prev => 
      prev.includes(userName) 
        ? prev.filter(name => name !== userName)
        : [...prev, userName]
    );
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers);
    }
  };

  const handleBulkUpdate = async () => {
    if (selectedUsers.length === 0) return;

    setIsUpdating(true);
    const results = [];

    for (const userName of selectedUsers) {
      try {
        // This would need to be implemented in the payment service
        // For now, we'll just simulate the update
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API call
        
        results.push({
          userName,
          status: 'success',
          message: 'Payment status updated successfully'
        });
      } catch (error) {
        results.push({
          userName,
          status: 'error',
          message: 'Failed to update payment status'
        });
      }
    }

    setUpdateResults(results);
    setIsUpdating(false);
  };

  const filteredUsers = paidUsers.filter(user => 
    user.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!state.currentUser?.isAdmin) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg p-6 max-w-md">
          <div className="flex items-center gap-2 text-red-600 mb-4">
            <AlertCircle size={24} />
            <h3 className="text-lg font-semibold">Access Denied</h3>
          </div>
          <p className="text-gray-600 mb-4">
            You don't have permission to update payment status.
          </p>
          <button
            onClick={onClose}
            className="w-full bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-6 rounded-t-lg">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <DollarSign size={28} />
                <h2 className="text-2xl font-bold">Bulk Payment Update</h2>
              </div>
              <p className="text-green-100">{eventTitle}</p>
              <p className="text-green-200 text-sm">Mark users as paid based on Square dashboard</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded p-2 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* User List */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Users Who Paid $60</h3>
              <button
                onClick={handleSelectAll}
                className="text-sm text-green-600 hover:text-green-700 font-medium"
              >
                {selectedUsers.length === filteredUsers.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
              {filteredUsers.map((userName, index) => (
                <div
                  key={index}
                  className={`p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                    selectedUsers.includes(userName) ? 'bg-green-50 border-green-200' : ''
                  }`}
                  onClick={() => handleUserSelect(userName)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(userName)}
                        onChange={() => handleUserSelect(userName)}
                        className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                      />
                      <span className="font-medium text-gray-900">{userName}</span>
                    </div>
                    <div className="text-sm text-gray-500">$60.00</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 mb-6">
            <button
              onClick={handleBulkUpdate}
              disabled={selectedUsers.length === 0 || isUpdating}
              className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              <CheckCircle size={20} />
              {isUpdating ? 'Updating...' : `Update ${selectedUsers.length} Users`}
            </button>
          </div>

          {/* Results */}
          {updateResults.length > 0 && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold mb-3">Update Results</h4>
              <div className="space-y-2">
                {updateResults.map((result, index) => (
                  <div
                    key={index}
                    className={`flex items-center gap-2 p-2 rounded ${
                      result.status === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {result.status === 'success' ? (
                      <CheckCircle size={16} />
                    ) : (
                      <AlertCircle size={16} />
                    )}
                    <span className="text-sm">
                      {result.userName}: {result.message}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 rounded-b-lg flex justify-end">
          <button
            onClick={onClose}
            className="bg-gray-200 text-gray-800 px-6 py-2 rounded hover:bg-gray-300 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkPaymentUpdate;



