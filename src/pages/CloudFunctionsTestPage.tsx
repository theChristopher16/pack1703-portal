import React, { useState } from 'react';
import { getFunctions, httpsCallable, connectFunctionsEmulator } from 'firebase/functions';
import app from '../firebase/config';
import { CheckCircle, AlertCircle, Loader2, Play, Database, Cloud, Calendar, Sun } from 'lucide-react';
import PWATest from '../components/PWATest/PWATest';

const CloudFunctionsTestPage: React.FC = () => {
  const [testResults, setTestResults] = useState<Array<{
    function: string;
    status: 'pending' | 'success' | 'error';
    message: string;
    data?: any;
  }>>([]);
  const [isTesting, setIsTesting] = useState(false);

  // Initialize Firebase Functions
  const functions = getFunctions(app);
  
  // Connect to emulator if in development
  if (process.env.NODE_ENV === 'development') {
    try {
      connectFunctionsEmulator(functions, 'localhost', 5001);
    } catch (error) {
      // Already connected
    }
  }

  const runTest = async (functionName: string, testFunction: () => Promise<any>) => {
    setTestResults(prev => prev.map(result => 
      result.function === functionName 
        ? { ...result, status: 'pending', message: 'Testing...' }
        : result
    ));

    try {
      const result = await testFunction();
      setTestResults(prev => prev.map(resultItem => 
        resultItem.function === functionName 
          ? { ...resultItem, status: 'success', message: 'Success!', data: result.data }
          : resultItem
      ));
    } catch (error: any) {
      setTestResults(prev => prev.map(resultItem => 
        resultItem.function === functionName 
          ? { ...resultItem, status: 'error', message: error.message || 'Unknown error' }
          : resultItem
      ));
    }
  };

  const runAllTests = async () => {
    setIsTesting(true);
    setTestResults([
      { function: 'helloWorld', status: 'pending', message: 'Ready to test' },
      { function: 'submitRSVP', status: 'pending', message: 'Ready to test' },
      { function: 'submitFeedback', status: 'pending', message: 'Ready to test' },
      { function: 'claimVolunteerRole', status: 'pending', message: 'Ready to test' },
      { function: 'icsFeed', status: 'pending', message: 'Ready to test' },
      { function: 'weatherProxy', status: 'pending', message: 'Ready to test' }
    ]);

    // Test 1: Hello World
    await runTest('helloWorld', async () => {
      const helloWorld = httpsCallable(functions, 'helloWorld');
      return await helloWorld({ test: 'Hello from React app!' });
    });

    // Test 2: Submit RSVP
    await runTest('submitRSVP', async () => {
      const submitRSVP = httpsCallable(functions, 'submitRSVP');
      return await submitRSVP({
        eventId: 'test-event-001',
        familyName: 'Test Family',
        email: 'test@example.com',
        phone: '555-123-4567',
        attendees: [
          { name: 'John Doe', age: 35, den: 'Adult', isAdult: true },
          { name: 'Jane Doe', age: 8, den: 'Wolves', isAdult: false }
        ],
        dietaryRestrictions: 'None',
        specialNeeds: 'None',
        notes: 'Test RSVP submission',
        ipHash: 'test-ip-hash-123',
        userAgent: 'Test User Agent'
      });
    });

    // Test 3: Submit Feedback
    await runTest('submitFeedback', async () => {
      const submitFeedback = httpsCallable(functions, 'submitFeedback');
      return await submitFeedback({
        category: 'general',
        rating: 5,
        title: 'Great Portal!',
        message: 'This is a test feedback submission. The portal looks amazing!',
        contactEmail: 'feedback@example.com',
        contactName: 'Test User',
        ipHash: 'test-ip-hash-456',
        userAgent: 'Test User Agent'
      });
    });

    // Test 4: Claim Volunteer Role
    await runTest('claimVolunteerRole', async () => {
      const claimVolunteerRole = httpsCallable(functions, 'claimVolunteerRole');
      return await claimVolunteerRole({
        volunteerNeedId: 'test-volunteer-001',
        volunteerName: 'Test Volunteer',
        email: 'volunteer@example.com',
        phone: '555-987-6543',
        age: 25,
        skills: ['Leadership', 'First Aid'],
        availability: 'Weekends and evenings',
        experience: '5 years of scouting experience',
        specialNeeds: 'None',
        emergencyContact: 'Emergency Contact: 555-000-0000',
        ipHash: 'test-ip-hash-789',
        userAgent: 'Test User Agent'
      });
    });

    // Test 5: ICS Feed
    await runTest('icsFeed', async () => {
      const icsFeed = httpsCallable(functions, 'icsFeed');
      return await icsFeed({
        season: 'Fall 2024',
        categories: ['campout', 'meeting'],
        denTags: ['Wolves', 'Bears'],
        startDate: '2024-10-01',
        endDate: '2024-12-31'
      });
    });

    // Test 6: Weather Proxy
    await runTest('weatherProxy', async () => {
      const weatherProxy = httpsCallable(functions, 'weatherProxy');
      return await weatherProxy({
        latitude: 40.7128,
        longitude: -74.0060
      });
    });

    setIsTesting(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error': return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'pending': return <Loader2 className="w-5 h-5 text-yellow-500 animate-spin" />;
      default: return <Play className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-600';
      case 'error': return 'text-red-600';
      case 'pending': return 'text-yellow-600';
      default: return 'text-gray-400';
    }
  };

  const getFunctionIcon = (functionName: string) => {
    switch (functionName) {
      case 'helloWorld': return <Database className="w-5 h-5" />;
      case 'submitRSVP': return <Calendar className="w-5 h-5" />;
      case 'submitFeedback': return <AlertCircle className="w-5 h-5" />;
      case 'claimVolunteerRole': return <CheckCircle className="w-5 h-5" />;
      case 'icsFeed': return <Calendar className="w-5 h-5" />;
      case 'weatherProxy': return <Sun className="w-5 h-5" />;
      default: return <Cloud className="w-5 h-5" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-primary-50/30 to-secondary-50/30 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-primary-100 to-secondary-100 text-primary-700 rounded-full text-sm font-medium mb-6">
            🧪 Cloud Functions Testing
          </div>
          
          <h1 className="text-4xl md:text-6xl font-display font-bold mb-6 text-gray-900">
            <span className="text-gradient">Cloud Functions</span> Test Suite
          </h1>
          
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Test all the Cloud Functions to ensure they're working correctly before moving to production.
          </p>
        </div>

        {/* Test Controls */}
        <div className="text-center mb-8">
          <button
            onClick={runAllTests}
            disabled={isTesting}
            className="px-8 py-4 bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-semibold text-lg rounded-2xl hover:from-primary-600 hover:to-secondary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 shadow-glow-primary/50"
          >
            {isTesting ? (
              <>
                <Loader2 className="w-6 h-6 mr-3 animate-spin inline" />
                Running Tests...
              </>
            ) : (
              <>
                <Play className="w-6 h-6 mr-3 inline" />
                Run All Tests
              </>
            )}
          </button>
        </div>

        {/* Test Results */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-soft">
            <h2 className="text-2xl font-display font-semibold text-gray-900 mb-6">Test Results</h2>
            
            <div className="space-y-4">
              {testResults.map((result, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(result.status)}
                    <div className="flex items-center space-x-2">
                      {getFunctionIcon(result.function)}
                      <h3 className="font-medium text-gray-900">{result.function}</h3>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className={`text-sm font-medium ${getStatusColor(result.status)}`}>
                      {result.message}
                    </p>
                    {result.data && (
                      <p className="text-xs text-gray-600 mt-1">
                        Data: {JSON.stringify(result.data).substring(0, 50)}...
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {testResults.length === 0 && (
              <div className="text-center py-8 text-gray-600">
                <Cloud className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p>No tests run yet. Click "Run All Tests" to start testing the Cloud Functions.</p>
              </div>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-soft">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Testing Instructions</h3>
          <div className="space-y-3 text-sm text-gray-600">
            <p>1. <strong>Start Firebase Emulator:</strong> Run <code>firebase emulators:start --only functions,firestore</code></p>
            <p>2. <strong>Run Tests:</strong> Click "Run All Tests" to test all Cloud Functions</p>
            <p>3. <strong>Check Results:</strong> Verify each function returns success</p>
            <p>4. <strong>Monitor Logs:</strong> Check emulator console for detailed logs</p>
            <p>5. <strong>Verify Data:</strong> Check Firestore emulator for stored data</p>
          </div>
        </div>

        {/* Troubleshooting */}
        <div className="mt-8 bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-soft">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Troubleshooting</h3>
          <div className="space-y-3 text-sm text-gray-600">
            <p>• <strong>Connection Error:</strong> Make sure Firebase emulator is running on port 5001</p>
            <p>• <strong>Function Not Found:</strong> Deploy functions to emulator first</p>
            <p>• <strong>Validation Errors:</strong> Check test data format matches function requirements</p>
            <p>• <strong>Rate Limiting:</strong> Wait for rate limit window to reset</p>
          </div>
        </div>

        {/* PWA Test */}
        <div className="mt-8">
          <PWATest />
        </div>
      </div>
    </div>
  );
};

export default CloudFunctionsTestPage;
