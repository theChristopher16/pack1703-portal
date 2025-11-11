import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';
import axios from 'axios';
import { parseStringPromise } from 'xml2js';

/**
 * Apple Calendar Integration via CalDAV
 * 
 * CalDAV is the standard protocol for accessing calendar data.
 * Apple Calendar (iCloud) uses CalDAV at caldav.icloud.com
 * 
 * IMPORTANT: Users must create app-specific passwords at appleid.apple.com
 * Regular Apple ID passwords won't work for CalDAV access.
 */

interface CalDAVEvent {
  uid: string;
  summary: string;
  description?: string;
  dtstart: string;
  dtend: string;
  location?: string;
  status?: string;
}

/**
 * Connect Apple Calendar
 * Validates credentials and retrieves available calendars
 */
export const connectAppleCalendar = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
  // Verify authentication
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { username, appSpecificPassword } = data;

  if (!username || !appSpecificPassword) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Username and app-specific password are required'
    );
  }

  try {
    const caldavUrl = `https://caldav.icloud.com`;
    const auth = Buffer.from(`${username}:${appSpecificPassword}`).toString('base64');

    // Test connection with PROPFIND request to discover calendars
    const response = await axios({
      method: 'PROPFIND',
      url: `${caldavUrl}/`,
      headers: {
        Authorization: `Basic ${auth}`,
        Depth: '1',
        'Content-Type': 'application/xml',
      },
      data: `<?xml version="1.0" encoding="UTF-8"?>
        <d:propfind xmlns:d="DAV:" xmlns:cs="http://calendarserver.org/ns/" xmlns:c="urn:ietf:params:xml:ns:caldav">
          <d:prop>
            <d:displayname />
            <d:resourcetype />
            <cs:getctag />
            <c:calendar-description />
          </d:prop>
        </d:propfind>`,
      validateStatus: () => true, // Don't throw on any status
    });

    if (response.status === 401) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Invalid credentials. Please check your Apple ID and app-specific password.'
      );
    }

    if (response.status !== 207) {
      throw new functions.https.HttpsError(
        'internal',
        `CalDAV request failed with status ${response.status}`
      );
    }

    // Parse XML response to get calendars
    const xmlData = await parseStringPromise(response.data);
    const calendars: any[] = [];

    // Extract calendar information (simplified - real implementation would be more robust)
    if (xmlData && xmlData['d:multistatus'] && xmlData['d:multistatus']['d:response']) {
      const responses = xmlData['d:multistatus']['d:response'];
      responses.forEach((resp: any) => {
        const props = resp['d:propstat']?.[0]?.['d:prop']?.[0];
        if (props && props['d:resourcetype']?.[0]?.['c:calendar']) {
          calendars.push({
            id: resp['d:href']?.[0] || 'unknown',
            name: props['d:displayname']?.[0] || 'Unnamed Calendar',
            description: props['c:calendar-description']?.[0] || '',
          });
        }
      });
    }

    // Store encrypted credentials in Firestore (using Secret Manager would be better for production)
    const db = admin.firestore();
    await db.collection('calendarCredentials').doc(context.auth.uid).set(
      {
        provider: 'apple',
        username,
        // In production, use encryption or Secret Manager
        encryptedPassword: appSpecificPassword, // TODO: Encrypt this
        caldavUrl,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    return {
      success: true,
      displayName: username,
      availableCalendars: calendars,
    };
  } catch (error: any) {
    console.error('Apple Calendar connection error:', error);
    throw new functions.https.HttpsError(
      'internal',
      error.message || 'Failed to connect to Apple Calendar'
    );
  }
});

/**
 * Sync Apple Calendar events
 * Fetches events from Apple Calendar and stores them in Firestore
 */
export const syncAppleCalendar = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { integrationId } = data;

  try {
    const db = admin.firestore();

    // Get integration details
    const integrationDoc = await db.collection('calendarIntegrations').doc(integrationId).get();
    if (!integrationDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Integration not found');
    }

    const integration = integrationDoc.data()!;
    if (integration.userId !== context.auth.uid) {
      throw new functions.https.HttpsError('permission-denied', 'Access denied');
    }

    // Get stored credentials
    const credentialsDoc = await db.collection('calendarCredentials').doc(context.auth.uid).get();
    if (!credentialsDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Credentials not found');
    }

    const credentials = credentialsDoc.data()!;
    const auth = Buffer.from(`${credentials.username}:${credentials.encryptedPassword}`).toString('base64');

    // Fetch events for next 3 months
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 1); // Include past month
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 3); // Next 3 months

    const caldavUrl = credentials.caldavUrl || 'https://caldav.icloud.com';

    // Use calendar-query REPORT method to get events
    const response = await axios({
      method: 'REPORT',
      url: `${caldavUrl}/`,
      headers: {
        Authorization: `Basic ${auth}`,
        Depth: '1',
        'Content-Type': 'application/xml',
      },
      data: `<?xml version="1.0" encoding="UTF-8"?>
        <c:calendar-query xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav">
          <d:prop>
            <d:getetag />
            <c:calendar-data />
          </d:prop>
          <c:filter>
            <c:comp-filter name="VCALENDAR">
              <c:comp-filter name="VEVENT">
                <c:time-range start="${startDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z"
                              end="${endDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z"/>
              </c:comp-filter>
            </c:comp-filter>
          </c:filter>
        </c:calendar-query>`,
      validateStatus: () => true,
    });

    if (response.status !== 207) {
      throw new Error(`CalDAV sync failed with status ${response.status}`);
    }

    // Parse iCalendar data (simplified - production would use proper iCal parser)
    const events: any[] = [];
    const xmlData = await parseStringPromise(response.data);

    if (xmlData && xmlData['d:multistatus'] && xmlData['d:multistatus']['d:response']) {
      const responses = xmlData['d:multistatus']['d:response'];
      
      for (const resp of responses) {
        const calendarData = resp['d:propstat']?.[0]?.['d:prop']?.[0]?.['c:calendar-data']?.[0];
        if (calendarData) {
          // Parse iCalendar format (basic parsing - production would use ical.js)
          const event = parseICalendarEvent(calendarData);
          if (event) {
            events.push(event);
          }
        }
      }
    }

    // Store events in Firestore
    const batch = db.batch();
    const syncedEventsRef = db.collection('syncedCalendarEvents');

    // Delete old events from this integration
    const oldEventsQuery = await db
      .collection('syncedCalendarEvents')
      .where('userId', '==', context.auth.uid)
      .where('integrationId', '==', integrationId)
      .get();

    oldEventsQuery.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    // Add new events
    events.forEach((event) => {
      const docRef = syncedEventsRef.doc();
      batch.set(docRef, {
        externalEventId: event.uid,
        integrationId,
        title: event.summary || 'Untitled Event',
        description: event.description || null,
        startTime: admin.firestore.Timestamp.fromDate(new Date(event.dtstart)),
        endTime: admin.firestore.Timestamp.fromDate(new Date(event.dtend)),
        location: event.location || null,
        isAllDay: event.isAllDay || false,
        status: event.status || 'confirmed',
        provider: 'apple',
        userId: context.auth!.uid,
        lastSyncedAt: admin.firestore.FieldValue.serverTimestamp(),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });

    await batch.commit();

    return {
      success: true,
      eventCount: events.length,
    };
  } catch (error: any) {
    console.error('Calendar sync error:', error);
    throw new functions.https.HttpsError('internal', error.message || 'Failed to sync calendar');
  }
});

/**
 * Basic iCalendar parser (simplified version)
 * Production should use ical.js library
 */
function parseICalendarEvent(icalData: string): CalDAVEvent | null {
  try {
    const lines = icalData.split('\n');
    const event: any = {};

    lines.forEach((line) => {
      line = line.trim();
      if (line.startsWith('UID:')) {
        event.uid = line.substring(4);
      } else if (line.startsWith('SUMMARY:')) {
        event.summary = line.substring(8);
      } else if (line.startsWith('DESCRIPTION:')) {
        event.description = line.substring(12);
      } else if (line.startsWith('DTSTART')) {
        const dateMatch = line.match(/:(.*)/);
        if (dateMatch) event.dtstart = parseICalDate(dateMatch[1]);
      } else if (line.startsWith('DTEND')) {
        const dateMatch = line.match(/:(.*)/);
        if (dateMatch) event.dtend = parseICalDate(dateMatch[1]);
      } else if (line.startsWith('LOCATION:')) {
        event.location = line.substring(9);
      } else if (line.startsWith('STATUS:')) {
        event.status = line.substring(7).toLowerCase();
      }
    });

    if (!event.uid || !event.dtstart || !event.dtend) {
      return null;
    }

    return event;
  } catch (error) {
    console.error('Failed to parse iCalendar event:', error);
    return null;
  }
}

/**
 * Parse iCalendar date format to ISO string
 */
function parseICalDate(icalDate: string): string {
  // Format: 20250110T120000Z or 20250110
  const isAllDay = icalDate.length === 8;
  
  if (isAllDay) {
    // YYYYMMDD
    const year = icalDate.substring(0, 4);
    const month = icalDate.substring(4, 6);
    const day = icalDate.substring(6, 8);
    return `${year}-${month}-${day}T00:00:00Z`;
  } else {
    // YYYYMMDDTHHmmssZ
    const year = icalDate.substring(0, 4);
    const month = icalDate.substring(4, 6);
    const day = icalDate.substring(6, 8);
    const hour = icalDate.substring(9, 11);
    const minute = icalDate.substring(11, 13);
    const second = icalDate.substring(13, 15);
    return `${year}-${month}-${day}T${hour}:${minute}:${second}Z`;
  }
}

