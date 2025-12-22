import React, { useState } from 'react';
import { Shield, AlertTriangle, CheckCircle } from 'lucide-react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase/config';

/**
 * App Check Debug Tool
 * Temporary admin tool to diagnose and fix App Check 403 errors
 */
export const AppCheckDebug: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [migrationLoading, setMigrationLoading] = useState(false);
  const [migrationResult, setMigrationResult] = useState<any>(null);

  const testFunctionCall = async (functionName: string) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      console.log(`Testing function: ${functionName}`);
      const testFunction = httpsCallable(functions, functionName);
      const response = await testFunction({});
      console.log('Function response:', response);
      setResult(response.data);
    } catch (err: any) {
      console.error('Function call error:', err);
      setError(err.message || 'Unknown error');
      
      // Capture detailed error info
      setResult({
        error: true,
        message: err.message,
        code: err.code,
        details: err.details || 'No additional details',
        stack: err.stack?.split('\n').slice(0, 5).join('\n'),
        raw: JSON.stringify(err, null, 2)
      });
    } finally {
      setLoading(false);
    }
  };

  const runMigration = async () => {
    if (!window.confirm('⚠️ This will migrate all users to multi-role format. Continue?')) {
      return;
    }

    setMigrationLoading(true);
    setMigrationResult(null);

    try {
      console.log('Running multi-role migration...');
      const migrateFunction = httpsCallable(functions, 'migrateUsersToMultiRole');
      const response = await migrateFunction({});
      console.log('Migration response:', response);
      setMigrationResult(response.data);
    } catch (err: any) {
      console.error('Migration error:', err);
      setMigrationResult({
        success: false,
        error: err.message,
        code: err.code
      });
    } finally {
      setMigrationLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6 pb-6 border-b">
            <Shield className="w-8 h-8 text-red-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">App Check Debug Tool</h1>
              <p className="text-sm text-gray-600">Diagnose and fix Cloud Functions 403 errors</p>
            </div>
          </div>

          {/* Current Issue */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-900 mb-1">Current Issue</h3>
                <p className="text-sm text-red-700 mb-2">
                  Cloud Functions returning 403 Preflight errors
                </p>
                <code className="text-xs bg-red-100 px-2 py-1 rounded">
                  Fetch API cannot load https://us-central1-pack1703-portal.cloudfunctions.net/updateUserRole
                </code>
              </div>
            </div>
          </div>

          {/* Debug Info */}
          <div className="space-y-4 mb-6">
            <h3 className="font-semibold text-gray-900">Debug Information</h3>
            
            <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm font-mono">
              <div className="flex justify-between">
                <span className="text-gray-600">App Check Debug Token:</span>
                <span className="text-green-600 font-semibold">
                  {(window as any).FIREBASE_APPCHECK_DEBUG_TOKEN ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Environment:</span>
                <span className="text-gray-900">{process.env.NODE_ENV}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Functions Region:</span>
                <span className="text-gray-900">us-central1</span>
              </div>
            </div>
          </div>

          {/* Solution Steps */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-blue-900 mb-3">Solution Steps</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
              <li>Open Firebase Console: <a href="https://console.firebase.google.com/project/pack1703-portal/appcheck/apis" target="_blank" rel="noopener noreferrer" className="underline font-semibold">App Check Settings</a></li>
              <li>Find "Cloud Functions for Firebase" in the APIs list</li>
              <li>Change enforcement from "Enforced" to <strong>"Unenforced"</strong></li>
              <li>Also disable enforcement for "Cloud Firestore" if needed</li>
              <li>Click Save and reload this page</li>
            </ol>
          </div>

          {/* Test Buttons */}
          <div className="mb-6 space-y-3">
            <h3 className="font-semibold text-gray-900 mb-2">Test Cloud Functions</h3>
            <button
              onClick={() => testFunctionCall('getSystemMetrics')}
              disabled={loading}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              {loading ? 'Testing...' : 'Test getSystemMetrics (Working Function)'}
            </button>
            <button
              onClick={() => testFunctionCall('updateUserRole')}
              disabled={loading}
              className="w-full px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              {loading ? 'Testing...' : 'Test updateUserRole (Broken Function)'}
            </button>
            <button
              onClick={() => testFunctionCall('testAppCheckStatus')}
              disabled={loading}
              className="w-full px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              {loading ? 'Testing...' : 'Test testAppCheckStatus (Not Deployed Yet)'}
            </button>
            <p className="text-xs text-gray-500 mt-2 text-center">
              Test functions to verify IAM permissions and identify which functions are working
            </p>
          </div>

          {/* Results */}
          {(result || error) && (
            <div className={`rounded-lg p-4 ${error ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}>
              <div className="flex items-start gap-3">
                {error ? (
                  <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <h4 className={`font-semibold mb-2 ${error ? 'text-red-900' : 'text-green-900'}`}>
                    {error ? 'Error Detected' : 'Success!'}
                  </h4>
                  <pre className={`text-xs overflow-auto p-3 rounded ${error ? 'bg-red-100' : 'bg-green-100'} font-mono`}>
                    {JSON.stringify(result, null, 2)}
                  </pre>
                  {error && (
                    <p className="text-sm text-red-700 mt-3">
                      <strong>Still seeing 403 errors?</strong> You must disable App Check enforcement in the Firebase Console using the steps above.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Migration Tool */}
          <div className="mt-6 pt-6 border-t">
            <h4 className="font-semibold text-gray-900 mb-3">🔄 Multi-Role Migration</h4>
            <p className="text-sm text-gray-600 mb-4">
              Migrate all users from single-role to multi-role format. This allows users to have multiple roles simultaneously (e.g., Den Leader + Admin).
            </p>
            <button
              onClick={runMigration}
              disabled={migrationLoading}
              className="w-full px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              {migrationLoading ? 'Migrating Users...' : 'Run Multi-Role Migration'}
            </button>
            
            {migrationResult && (
              <div className={`mt-4 p-4 rounded-lg ${migrationResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <pre className="text-xs font-mono overflow-auto">
                  {JSON.stringify(migrationResult, null, 2)}
                </pre>
              </div>
            )}
          </div>

          {/* Additional Help */}
          <div className="mt-6 pt-6 border-t">
            <h4 className="font-semibold text-gray-900 mb-2">Need More Help?</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Check browser console for detailed error messages</li>
              <li>• Verify you're logged in as a super admin</li>
              <li>• Clear browser cache after changing App Check settings</li>
              <li>• Contact support if issues persist</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

