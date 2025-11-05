import React, { useState } from 'react';
import { collection, addDoc, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

const InitializePack1703Page: React.FC = () => {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const createPack1703 = async () => {
    setStatus('loading');
    setMessage('Creating Pack 1703 organization...');

    try {
      // Check if it already exists
      const orgsRef = collection(db, 'organizations');
      const q = query(orgsRef, where('slug', '==', 'pack1703'));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        setStatus('error');
        setMessage('Pack 1703 already exists! Check the Organizations page.');
        return;
      }

      // Create Pack 1703 organization
      const pack1703Data = {
        name: 'Pack 1703',
        slug: 'pack1703',
        description: 'Cub Scout Pack 1703 - Main portal application',
        orgType: 'pack',
        isActive: true,
        
        // Enable all pack components
        enabledComponents: [
          // Base components
          'chat',
          'calendar',
          'announcements',
          'locations',
          'resources',
          'profile',
          
          // Pack-specific components
          'analytics',
          'userManagement',
          'finances',
          'seasons',
          'lists',
          'volunteer',
          'ecology',
          'fundraising',
          'dues'
        ],
        
        // Branding
        branding: {
          name: 'Pack 1703',
          displayName: 'Cub Scout Pack 1703',
          shortName: 'Pack 1703',
          email: 'cubmaster@sfpack1703.com',
          description: 'Peoria, IL - Cub Scout Pack Portal',
          primaryColor: '#0d9488', // teal-600
          secondaryColor: '#065f46'  // emerald-800
        },
        
        // Timestamps
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        
        // Metadata
        memberCount: 0,
        eventCount: 0,
        locationCount: 0
      };

      const docRef = await addDoc(orgsRef, pack1703Data);
      
      setStatus('success');
      setMessage(`Pack 1703 created successfully! Document ID: ${docRef.id}`);
      
    } catch (error: any) {
      console.error('Error creating Pack 1703:', error);
      setStatus('error');
      setMessage(`Error: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-fog via-forest-50/30 to-solar-50/30 py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-3xl font-display font-bold text-ink mb-4">
            Initialize Pack 1703
          </h1>
          
          <p className="text-forest-600 mb-6">
            This will create Pack 1703 as an editable organization in Firestore.
            Click the button below to create it with all components enabled.
          </p>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> This only creates the organization management document.
              All your existing Pack 1703 data (users, events, announcements, etc.) is safe and untouched.
            </p>
          </div>

          <button
            onClick={createPack1703}
            disabled={status === 'loading' || status === 'success'}
            className="w-full solarpunk-btn-primary py-3 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {status === 'loading' ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Creating...
              </>
            ) : status === 'success' ? (
              <>
                <CheckCircle className="w-5 h-5 mr-2" />
                Created!
              </>
            ) : (
              'Create Pack 1703 Organization'
            )}
          </button>

          {/* Status Message */}
          {message && (
            <div className={`mt-6 p-4 rounded-lg ${
              status === 'success' ? 'bg-green-50 border border-green-200' :
              status === 'error' ? 'bg-red-50 border border-red-200' :
              'bg-blue-50 border border-blue-200'
            }`}>
              <div className="flex items-start gap-3">
                {status === 'success' && <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />}
                {status === 'error' && <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />}
                {status === 'loading' && <Loader2 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5 animate-spin" />}
                <p className={`text-sm ${
                  status === 'success' ? 'text-green-800' :
                  status === 'error' ? 'text-red-800' :
                  'text-blue-800'
                }`}>
                  {message}
                </p>
              </div>
            </div>
          )}

          {status === 'success' && (
            <div className="mt-6 text-center">
              <a 
                href="/organizations"
                className="inline-block solarpunk-btn-secondary"
              >
                Go to Organizations Page
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InitializePack1703Page;

