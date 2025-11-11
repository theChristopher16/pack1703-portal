import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bug, RefreshCw, Database, Calendar, Users, CheckCircle, XCircle } from 'lucide-react';
import crossOrgSyncService from '../../services/crossOrgSyncService';
import authService from '../../services/authService';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useToast } from '../../contexts/ToastContext';
import FixOrgLink from './FixOrgLink';

/**
 * Debug component to help troubleshoot calendar sync issues
 */
const CalendarDebug: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { showSuccess, showError } = useToast();

  const runDiagnostics = async () => {
    try {
      setLoading(true);
      const user = authService.getCurrentUser();
      if (!user) {
        setDebugInfo({ error: 'User not authenticated' });
        return;
      }

      const info: any = {
        userId: user.uid,
        userEmail: user.email,
        timestamp: new Date().toLocaleString(),
      };

      // 1. Check crossOrganizationUsers
      const crossOrgQuery = query(
        collection(db, 'crossOrganizationUsers'),
        where('userId', '==', user.uid)
      );
      const crossOrgSnapshot = await getDocs(crossOrgQuery);
      info.crossOrgUsers = {
        count: crossOrgSnapshot.size,
        data: crossOrgSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })),
      };

      // 2. Discover organizations
      const orgs = await crossOrgSyncService.discoverUserOrganizations();
      info.discoveredOrganizations = {
        count: orgs.length,
        organizations: orgs,
      };

      // 3. Check events from each org
      for (const org of orgs) {
        const eventsQuery = query(
          collection(db, 'events'),
          where('organizationId', '==', org.organizationId),
          where('isActive', '==', true)
        );
        const eventsSnapshot = await getDocs(eventsQuery);
        
        info[`org_${org.organizationId}_events`] = {
          orgName: org.organizationName,
          eventCount: eventsSnapshot.size,
          events: eventsSnapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              title: data.title,
              startDate: data.startDate?.toDate()?.toLocaleDateString(),
              requiresRSVP: data.requiresRSVP,
              isActive: data.isActive,
            };
          }),
        };
      }

      // 4. Check user's RSVPs
      const rsvpsQuery = query(
        collection(db, 'rsvps'),
        where('userId', '==', user.uid)
      );
      const rsvpsSnapshot = await getDocs(rsvpsQuery);
      info.userRSVPs = {
        count: rsvpsSnapshot.size,
        rsvps: rsvpsSnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            eventId: data.eventId,
            status: data.status,
            attendees: data.attendees,
            createdAt: data.createdAt?.toDate()?.toLocaleDateString(),
          };
        }),
      };

      // 5. Test aggregated calendar
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      const aggregatedEvents = await crossOrgSyncService.getAggregatedCalendarEvents(
        monthStart,
        monthEnd
      );
      info.aggregatedEvents = {
        count: aggregatedEvents.length,
        events: aggregatedEvents.map((e) => ({
          title: e.title,
          startDate: e.startDate.toLocaleDateString(),
          source: e.sourceName,
          rsvpStatus: e.rsvpStatus,
          canRSVP: e.canRSVP,
        })),
      };

      // 6. Check sync preferences
      const syncPrefs = await crossOrgSyncService.getSyncPreferences();
      info.syncPreferences = syncPrefs;

      setDebugInfo(info);
      showSuccess('Diagnostics completed');
    } catch (error: any) {
      showError('Diagnostics failed', error.message);
      setDebugInfo({ error: error.message, stack: error.stack });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl">
              <Bug className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Calendar Sync Diagnostics</h2>
              <p className="text-sm text-gray-600">Debug tool for troubleshooting calendar sync issues</p>
            </div>
          </div>
          
          <button
            onClick={runDiagnostics}
            disabled={loading}
            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:shadow-lg disabled:opacity-50 flex items-center gap-2"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Running...' : 'Run Diagnostics'}
          </button>
        </div>
      </div>

      {/* Auto-Fix Banner */}
      {debugInfo && debugInfo.crossOrgUsers?.count === 0 && debugInfo.userRSVPs?.count > 0 && (
        <FixOrgLink onSuccess={() => runDiagnostics()} />
      )}

      {/* Debug Results */}
      {debugInfo && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Database className="w-6 h-6" />
              Diagnostic Results
            </h3>

            {/* User Info */}
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">User Information</h4>
              <p className="text-sm text-blue-800">
                <strong>ID:</strong> {debugInfo.userId}
              </p>
              <p className="text-sm text-blue-800">
                <strong>Email:</strong> {debugInfo.userEmail}
              </p>
              <p className="text-sm text-blue-800">
                <strong>Time:</strong> {debugInfo.timestamp}
              </p>
            </div>

            {/* Cross-Org Users */}
            {debugInfo.crossOrgUsers && (
              <div className="mb-6 p-4 bg-purple-50 rounded-lg">
                <h4 className="font-semibold text-purple-900 mb-2 flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  crossOrganizationUsers Collection
                  {debugInfo.crossOrgUsers.count > 0 ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                </h4>
                <p className="text-sm text-purple-800 mb-2">
                  <strong>Records Found:</strong> {debugInfo.crossOrgUsers.count}
                </p>
                {debugInfo.crossOrgUsers.count === 0 && (
                  <p className="text-sm text-red-600 font-medium">
                    ⚠️ No organization memberships found! This is why events aren't showing.
                  </p>
                )}
                <pre className="text-xs bg-purple-100 p-3 rounded overflow-auto max-h-40">
                  {JSON.stringify(debugInfo.crossOrgUsers.data, null, 2)}
                </pre>
              </div>
            )}

            {/* Discovered Organizations */}
            {debugInfo.discoveredOrganizations && (
              <div className="mb-6 p-4 bg-green-50 rounded-lg">
                <h4 className="font-semibold text-green-900 mb-2">Discovered Organizations</h4>
                <p className="text-sm text-green-800 mb-2">
                  <strong>Count:</strong> {debugInfo.discoveredOrganizations.count}
                </p>
                <pre className="text-xs bg-green-100 p-3 rounded overflow-auto max-h-40">
                  {JSON.stringify(debugInfo.discoveredOrganizations.organizations, null, 2)}
                </pre>
              </div>
            )}

            {/* Organization Events */}
            {Object.keys(debugInfo)
              .filter((key) => key.startsWith('org_'))
              .map((key) => (
                <div key={key} className="mb-6 p-4 bg-yellow-50 rounded-lg">
                  <h4 className="font-semibold text-yellow-900 mb-2 flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    {debugInfo[key].orgName} - Events
                  </h4>
                  <p className="text-sm text-yellow-800 mb-2">
                    <strong>Event Count:</strong> {debugInfo[key].eventCount}
                  </p>
                  <pre className="text-xs bg-yellow-100 p-3 rounded overflow-auto max-h-40">
                    {JSON.stringify(debugInfo[key].events, null, 2)}
                  </pre>
                </div>
              ))}

            {/* User RSVPs */}
            {debugInfo.userRSVPs && (
              <div className="mb-6 p-4 bg-pink-50 rounded-lg">
                <h4 className="font-semibold text-pink-900 mb-2 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  User RSVPs
                  {debugInfo.userRSVPs.count > 0 ? (
                    <span className="text-green-600">(Found {debugInfo.userRSVPs.count})</span>
                  ) : (
                    <span className="text-red-600">(None Found)</span>
                  )}
                </h4>
                <pre className="text-xs bg-pink-100 p-3 rounded overflow-auto max-h-40">
                  {JSON.stringify(debugInfo.userRSVPs.rsvps, null, 2)}
                </pre>
              </div>
            )}

            {/* Aggregated Events */}
            {debugInfo.aggregatedEvents && (
              <div className="mb-6 p-4 bg-indigo-50 rounded-lg">
                <h4 className="font-semibold text-indigo-900 mb-2 flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Final Aggregated Events (What Should Appear)
                </h4>
                <p className="text-sm text-indigo-800 mb-2">
                  <strong>Count:</strong> {debugInfo.aggregatedEvents.count}
                </p>
                {debugInfo.aggregatedEvents.count === 0 && (
                  <p className="text-sm text-red-600 font-medium mb-2">
                    ⚠️ No events passed the filters! Check sync preferences below.
                  </p>
                )}
                <pre className="text-xs bg-indigo-100 p-3 rounded overflow-auto max-h-60">
                  {JSON.stringify(debugInfo.aggregatedEvents.events, null, 2)}
                </pre>
              </div>
            )}

            {/* Sync Preferences */}
            {debugInfo.syncPreferences && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">Sync Preferences (Filters)</h4>
                <div className="text-sm space-y-2">
                  <p>
                    <strong>Include RSVP'd Events:</strong>{' '}
                    {debugInfo.syncPreferences.syncSettings.events.includeRSVPd ? '✅' : '❌'}
                  </p>
                  <p>
                    <strong>Include Pending Events:</strong>{' '}
                    {debugInfo.syncPreferences.syncSettings.events.includePending ? '✅' : '❌'}
                  </p>
                  <p>
                    <strong>Include Public Events:</strong>{' '}
                    {debugInfo.syncPreferences.syncSettings.events.includePublic ? '✅' : '❌'}
                  </p>
                </div>
                <details className="mt-3">
                  <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                    Show Full Preferences JSON
                  </summary>
                  <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto max-h-40 mt-2">
                    {JSON.stringify(debugInfo.syncPreferences, null, 2)}
                  </pre>
                </details>
              </div>
            )}

            {/* Error Display */}
            {debugInfo.error && (
              <div className="p-4 bg-red-50 border-2 border-red-200 rounded-lg">
                <h4 className="font-semibold text-red-900 mb-2">❌ Error</h4>
                <p className="text-sm text-red-800 mb-2">{debugInfo.error}</p>
                {debugInfo.stack && (
                  <pre className="text-xs bg-red-100 p-3 rounded overflow-auto max-h-40">
                    {debugInfo.stack}
                  </pre>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Instructions */}
      {!debugInfo && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="font-semibold text-blue-900 mb-2">How to Use</h3>
          <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
            <li>Click "Run Diagnostics" button above</li>
            <li>Review the results to see what data exists in Firestore</li>
            <li>Check if crossOrganizationUsers has records (if not, that's the issue)</li>
            <li>Verify events exist in the events collection</li>
            <li>Confirm RSVPs are recorded properly</li>
            <li>Check sync preferences aren't filtering everything out</li>
          </ol>
        </div>
      )}
    </div>
  );
};

export default CalendarDebug;

