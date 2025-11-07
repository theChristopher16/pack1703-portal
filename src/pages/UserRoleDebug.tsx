import React, { useState } from 'react';
import { Shield, Database, AlertCircle } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

/**
 * User Role Debug Tool
 * Shows exactly what's in the Firestore document for a user
 */
export const UserRoleDebug: React.FC = () => {
  const [userId, setUserId] = useState('');
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkUserData = async () => {
    if (!userId.trim()) {
      setError('Please enter a user ID');
      return;
    }

    setLoading(true);
    setError(null);
    setUserData(null);

    try {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        setError('User not found in Firestore');
        return;
      }

      const data = userDoc.data();
      setUserData(data);

      console.log('🔍 Firestore user data:', data);
      console.log('📋 Role field:', data.role);
      console.log('📋 Roles array:', data.roles);
    } catch (err: any) {
      console.error('Error checking user data:', err);
      setError(err.message || 'Failed to fetch user data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="flex items-center gap-3 mb-6 pb-6 border-b">
            <Database className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">User Role Debug Tool</h1>
              <p className="text-sm text-gray-600">Check what's actually stored in Firestore</p>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              User ID (UID)
            </label>
            <div className="flex gap-3">
              <input
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="Enter user ID (e.g., she4uvqd8QeyVm1Y43SvYvlH0DI2)"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={checkUserData}
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
              >
                {loading ? 'Checking...' : 'Check User'}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              💡 Find user IDs in the Copse Admin panel or Firebase Console
            </p>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-red-900 mb-1">Error</h3>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {userData && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Firestore Document Data</h3>
              
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Role Fields</h4>
                  <div className="bg-white rounded-lg p-4 space-y-2 font-mono text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">role:</span>
                      <span className={`font-semibold ${userData.role ? 'text-green-600' : 'text-red-600'}`}>
                        {userData.role || 'NOT SET'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">roles:</span>
                      <span className={`font-semibold ${userData.roles ? 'text-green-600' : 'text-red-600'}`}>
                        {userData.roles ? JSON.stringify(userData.roles) : 'NOT SET'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">isAdmin:</span>
                      <span className="font-semibold">{String(userData.isAdmin)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">isDenLeader:</span>
                      <span className="font-semibold">{String(userData.isDenLeader)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">isCubmaster:</span>
                      <span className="font-semibold">{String(userData.isCubmaster)}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Full Document</h4>
                  <pre className="bg-gray-900 text-green-400 rounded-lg p-4 overflow-auto max-h-96 text-xs">
                    {JSON.stringify(userData, null, 2)}
                  </pre>
                </div>

                {!userData.roles && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-yellow-900 mb-1">Migration Needed</h4>
                        <p className="text-sm text-yellow-700 mb-2">
                          This user doesn't have a 'roles' array yet. They need to be migrated to multi-role format.
                        </p>
                        <p className="text-sm text-yellow-700">
                          Go to <a href="/appcheck-debug" className="underline font-semibold">App Check Debug</a> and click "Run Multi-Role Migration"
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

