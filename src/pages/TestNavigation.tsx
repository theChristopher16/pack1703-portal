import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const TestNavigation: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const handleTestNavigation = () => {
    console.log('TestNavigation: Navigating to /events/lu6kyov2tFPWdFhpcgaj');
    navigate('/events/lu6kyov2tFPWdFhpcgaj');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Navigation Test</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Event Navigation</h2>
          <p className="text-gray-600 mb-4">
            This will test navigation to the event detail page with a known event ID.
          </p>
          <button
            onClick={handleTestNavigation}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Navigate to Event Detail Page
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Current Route Info</h2>
          <p className="text-gray-600">
            <strong>Current URL:</strong> {window.location.href}
          </p>
          <p className="text-gray-600">
            <strong>Current Path:</strong> {window.location.pathname}
          </p>
          {id && (
            <p className="text-gray-600">
              <strong>Route Parameter ID:</strong> {id}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default TestNavigation;
