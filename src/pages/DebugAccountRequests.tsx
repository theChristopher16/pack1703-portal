import React, { useState } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Loader2, Search, User as UserIcon } from 'lucide-react';

const DebugAccountRequests: React.FC = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAccountRequests = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const requestsRef = collection(db, 'accountRequests');
      const q = query(requestsRef, orderBy('submittedAt', 'desc'));
      const snapshot = await getDocs(q);
      
      const requestsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        submittedAt: doc.data().submittedAt?.toDate?.()?.toISOString() || doc.data().submittedAt
      }));
      
      console.log('Account Requests:', requestsData);
      setRequests(requestsData);
    } catch (err: any) {
      console.error('Error loading account requests:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-fog via-forest-50/30 to-solar-50/30 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-3xl font-display font-bold text-ink mb-4">
            Debug: Account Requests
          </h1>
          
          <button
            onClick={loadAccountRequests}
            disabled={isLoading}
            className="solarpunk-btn-primary mb-6"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Loading...
              </>
            ) : (
              <>
                <Search className="w-5 h-5 mr-2" />
                Load Account Requests
              </>
            )}
          </button>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-800"><strong>Error:</strong> {error}</p>
            </div>
          )}

          {requests.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-ink mb-4">
                Found {requests.length} Account Request(s)
              </h2>
              
              {requests.map((req) => (
                <div key={req.id} className="border border-teal-200 rounded-lg p-4 bg-teal-50">
                  <div className="flex items-start gap-4">
                    <UserIcon className="w-6 h-6 text-teal-600 flex-shrink-0 mt-1" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-ink">{req.displayName || req.email}</h3>
                      <p className="text-sm text-forest-600">{req.email}</p>
                      <p className="text-xs text-forest-500 mt-2">
                        Status: <strong>{req.status}</strong>
                      </p>
                      <p className="text-xs text-forest-500">
                        Submitted: {req.submittedAt}
                      </p>
                      {req.linkedUserId && (
                        <p className="text-xs text-teal-700 mt-1">
                          Linked User ID: <code className="bg-teal-100 px-1 rounded">{req.linkedUserId}</code>
                        </p>
                      )}
                      <details className="mt-2">
                        <summary className="text-xs text-teal-600 cursor-pointer hover:text-teal-800">
                          View Full Data
                        </summary>
                        <pre className="text-xs bg-gray-100 p-2 rounded mt-2 overflow-x-auto">
                          {JSON.stringify(req, null, 2)}
                        </pre>
                      </details>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!isLoading && requests.length === 0 && (
            <p className="text-forest-600 text-center py-8">
              No account requests loaded. Click the button above to load them.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default DebugAccountRequests;

