"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchUrlContent = exports.fetchNewEmails = exports.testEmailConnection = exports.helloWorld = exports.moderationDigest = exports.weatherProxy = exports.icsFeed = exports.claimVolunteerRole = exports.submitFeedback = exports.submitRSVP = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const Imap = require('node-imap');
// Initialize Firebase Admin
admin.initializeApp();
// Get Firestore instance
const db = admin.firestore();
// Helper function to get timestamp (works in both emulator and production)
function getTimestamp() {
    try {
        // Try to use Firebase Timestamp if available
        if (admin.firestore.Timestamp && admin.firestore.Timestamp.now) {
            return admin.firestore.Timestamp.now();
        }
        // Fallback to Date object
        return new Date();
    }
    catch (error) {
        // Final fallback to ISO string
        return new Date().toISOString();
    }
}
// Location interface (ready for future use)
// interface Location {
//   id: string;
//   name: string;
//   address: string;
//   coordinates: {
//     latitude: number;
//     longitude: number;
//   };
//   description: string;
//   category: string;
//   notesPrivate?: string;
// }
// Rate limiting helper
const rateLimiter = new Map();
function checkRateLimit(ipHash, endpoint, limit, windowMs) {
    const key = `${ipHash}:${endpoint}`;
    const now = Date.now();
    if (!rateLimiter.has(key) || now > rateLimiter.get(key).resetTime) {
        rateLimiter.set(key, { count: 1, resetTime: now + windowMs });
        return true;
    }
    const entry = rateLimiter.get(key);
    if (entry.count >= limit) {
        return false;
    }
    entry.count++;
    return true;
}
// Input validation helpers
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}
function sanitizeInput(input) {
    // Basic HTML tag removal and length limiting
    return input
        .replace(/<[^>]*>/g, '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .substring(0, 1000);
}
// 1. Submit RSVP Function
exports.submitRSVP = functions.https.onCall(async (data, context) => {
    try {
        // Check App Check (required for production)
        if (process.env.FUNCTIONS_EMULATOR !== 'true' && !context.app) {
            throw new functions.https.HttpsError('unauthenticated', 'App Check verification required');
        }
        // Rate limiting (5 submissions per hour per IP)
        if (!checkRateLimit(data.ipHash, 'rsvp', 5, 60 * 60 * 1000)) {
            throw new functions.https.HttpsError('resource-exhausted', 'Rate limit exceeded');
        }
        // Validate required fields
        if (!data.eventId || !data.familyName || !data.email || !data.attendees || data.attendees.length === 0) {
            throw new functions.https.HttpsError('invalid-argument', 'Missing required fields');
        }
        // Validate email
        if (!validateEmail(data.email)) {
            throw new functions.https.HttpsError('invalid-argument', 'Invalid email format');
        }
        // Sanitize inputs
        const sanitizedData = Object.assign(Object.assign({}, data), { familyName: sanitizeInput(data.familyName), notes: data.notes ? sanitizeInput(data.notes) : undefined, dietaryRestrictions: data.dietaryRestrictions ? sanitizeInput(data.dietaryRestrictions) : undefined, specialNeeds: data.specialNeeds ? sanitizeInput(data.specialNeeds) : undefined, timestamp: getTimestamp() });
        // Check event capacity
        const eventRef = db.collection('events').doc(data.eventId);
        const eventDoc = await eventRef.get();
        if (!eventDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'Event not found');
        }
        const event = eventDoc.data();
        if (event.maxCapacity && event.currentRSVPs + data.attendees.length > event.maxCapacity) {
            throw new functions.https.HttpsError('resource-exhausted', 'Event is at capacity');
        }
        // Store RSVP submission
        const submissionData = {
            type: 'rsvp',
            eventId: sanitizedData.eventId,
            familyName: sanitizedData.familyName,
            email: sanitizedData.email,
            attendees: sanitizedData.attendees,
            ipHash: sanitizedData.ipHash,
            userAgent: sanitizedData.userAgent,
            timestamp: sanitizedData.timestamp,
            status: 'pending'
        };
        // Add optional fields only if they exist
        if (sanitizedData.phone)
            submissionData.phone = sanitizedData.phone;
        if (sanitizedData.notes)
            submissionData.notes = sanitizedData.notes;
        if (sanitizedData.dietaryRestrictions)
            submissionData.dietaryRestrictions = sanitizedData.dietaryRestrictions;
        if (sanitizedData.specialNeeds)
            submissionData.specialNeeds = sanitizedData.specialNeeds;
        const submissionRef = await db.collection('submissions').add(submissionData);
        // Update event RSVP count
        await eventRef.update({
            currentRSVPs: event.currentRSVPs + data.attendees.length
        });
        // Log analytics event
        await db.collection('analytics').add({
            type: 'rsvp_submission',
            eventId: data.eventId,
            attendees: data.attendees.length,
            timestamp: getTimestamp(),
            ipHash: data.ipHash
        });
        return {
            success: true,
            submissionId: submissionRef.id,
            message: 'RSVP submitted successfully'
        };
    }
    catch (error) {
        console.error('RSVP submission error:', error);
        throw new functions.https.HttpsError('internal', 'Failed to submit RSVP');
    }
});
// 2. Submit Feedback Function
exports.submitFeedback = functions.https.onCall(async (data, context) => {
    try {
        // Check App Check (required for production)
        if (process.env.FUNCTIONS_EMULATOR !== 'true' && !context.app) {
            throw new functions.https.HttpsError('unauthenticated', 'App Check verification required');
        }
        // Rate limiting (3 feedback submissions per hour per IP)
        if (!checkRateLimit(data.ipHash, 'feedback', 3, 60 * 60 * 1000)) {
            throw new functions.https.HttpsError('resource-exhausted', 'Rate limit exceeded');
        }
        // Validate required fields
        if (!data.category || !data.rating || !data.title || !data.message) {
            throw new functions.https.HttpsError('invalid-argument', 'Missing required fields');
        }
        // Validate rating
        if (data.rating < 1 || data.rating > 5) {
            throw new functions.https.HttpsError('invalid-argument', 'Invalid rating value');
        }
        // Sanitize inputs
        const sanitizedData = Object.assign(Object.assign({}, data), { title: sanitizeInput(data.title), message: sanitizeInput(data.message), timestamp: getTimestamp() });
        // Store feedback submission
        const submissionRef = await db.collection('submissions').add(Object.assign(Object.assign({ type: 'feedback' }, sanitizedData), { status: 'pending' }));
        // Log analytics event
        await db.collection('analytics').add({
            type: 'feedback_submission',
            category: data.category,
            rating: data.rating,
            timestamp: getTimestamp(),
            ipHash: data.ipHash
        });
        return {
            success: true,
            submissionId: submissionRef.id,
            message: 'Feedback submitted successfully'
        };
    }
    catch (error) {
        console.error('Feedback submission error:', error);
        throw new functions.https.HttpsError('internal', 'Failed to submit feedback');
    }
});
// 3. Claim Volunteer Role Function
exports.claimVolunteerRole = functions.https.onCall(async (data, context) => {
    try {
        // Check App Check (skip in emulator for testing)
        if (process.env.FUNCTIONS_EMULATOR !== 'true' && !context.app) {
            throw new functions.https.HttpsError('unauthenticated', 'App Check required');
        }
        // Rate limiting (2 volunteer signups per hour per IP)
        if (!checkRateLimit(data.ipHash, 'volunteer', 2, 60 * 60 * 1000)) {
            throw new functions.https.HttpsError('resource-exhausted', 'Rate limit exceeded');
        }
        // Validate required fields
        if (!data.volunteerNeedId || !data.volunteerName || !data.email || !data.age || !data.skills || !data.availability || !data.experience) {
            throw new functions.https.HttpsError('invalid-argument', 'Missing required fields');
        }
        // Validate email
        if (!validateEmail(data.email)) {
            throw new functions.https.HttpsError('invalid-argument', 'Invalid email format');
        }
        // Validate age
        if (data.age < 0 || data.age > 120) {
            throw new functions.https.HttpsError('invalid-argument', 'Invalid age value');
        }
        // Sanitize inputs
        const sanitizedData = Object.assign(Object.assign({}, data), { volunteerName: sanitizeInput(data.volunteerName), availability: sanitizeInput(data.availability), experience: sanitizeInput(data.experience), specialNeeds: data.specialNeeds ? sanitizeInput(data.specialNeeds) : undefined, emergencyContact: data.emergencyContact ? sanitizeInput(data.emergencyContact) : undefined, timestamp: getTimestamp() });
        // Check volunteer need availability
        const volunteerNeedRef = db.collection('volunteer-needs').doc(data.volunteerNeedId);
        const volunteerNeedDoc = await volunteerNeedRef.get();
        if (!volunteerNeedDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'Volunteer role not found');
        }
        const volunteerNeed = volunteerNeedDoc.data();
        if (volunteerNeed.currentVolunteers >= volunteerNeed.maxVolunteers) {
            throw new functions.https.HttpsError('resource-exhausted', 'Volunteer role is full');
        }
        // Store volunteer signup
        const submissionRef = await db.collection('submissions').add(Object.assign(Object.assign({ type: 'volunteer' }, sanitizedData), { status: 'pending' }));
        // Update volunteer need count
        await volunteerNeedRef.update({
            currentVolunteers: admin.firestore.FieldValue.increment(1)
        });
        // Log analytics event
        await db.collection('analytics').add({
            type: 'volunteer_signup',
            volunteerNeedId: data.volunteerNeedId,
            skills: data.skills,
            timestamp: getTimestamp(),
            ipHash: data.ipHash
        });
        return {
            success: true,
            submissionId: submissionRef.id,
            message: 'Volunteer role claimed successfully'
        };
    }
    catch (error) {
        console.error('Volunteer signup error:', error);
        throw new functions.https.HttpsError('internal', 'Failed to claim volunteer role');
    }
});
// 4. ICS Feed Generator Function
exports.icsFeed = functions.https.onCall(async (data, context) => {
    try {
        // Check App Check (skip in emulator for testing)
        if (process.env.FUNCTIONS_EMULATOR !== 'true' && !context.app) {
            throw new functions.https.HttpsError('unauthenticated', 'App Check required');
        }
        // Build query
        let query = db.collection('events').where('startDate', '>=', getTimestamp());
        if (data.season) {
            query = query.where('season', '==', data.season);
        }
        if (data.categories && data.categories.length > 0) {
            query = query.where('category', 'in', data.categories);
        }
        const eventsSnapshot = await query.get();
        const events = [];
        eventsSnapshot.forEach((doc) => {
            const event = doc.data();
            // Filter by den tags if specified
            if (data.denTags && data.denTags.length > 0) {
                if (!event.denTags.some(tag => data.denTags.includes(tag))) {
                    return;
                }
            }
            // Filter by date range if specified
            if (data.startDate && data.endDate) {
                const startDate = new Date(data.startDate);
                const endDate = new Date(data.endDate);
                if (event.startDate.toDate() < startDate || event.startDate.toDate() > endDate) {
                    return;
                }
            }
            events.push(event);
        });
        // Generate ICS content
        let icsContent = 'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Pack 1703//Events//EN\r\n';
        events.forEach(event => {
            const startDate = event.startDate.toDate();
            const endDate = event.endDate.toDate();
            icsContent += `BEGIN:VEVENT\r\n`;
            icsContent += `UID:${event.id}@pack1703.com\r\n`;
            icsContent += `DTSTART:${startDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z\r\n`;
            icsContent += `DTEND:${endDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z\r\n`;
            icsContent += `SUMMARY:${event.title}\r\n`;
            icsContent += `DESCRIPTION:${event.description}\r\n`;
            icsContent += `LOCATION:${event.location}\r\n`;
            icsContent += `END:VEVENT\r\n`;
        });
        icsContent += 'END:VCALENDAR\r\n';
        return {
            success: true,
            icsContent: icsContent,
            eventCount: events.length,
            message: 'ICS feed generated successfully'
        };
    }
    catch (error) {
        console.error('ICS feed generation error:', error);
        throw new functions.https.HttpsError('internal', 'Failed to generate ICS feed');
    }
});
// 5. Weather Proxy Function
exports.weatherProxy = functions.https.onCall(async (data, context) => {
    try {
        // Check App Check (skip in emulator for testing)
        if (process.env.FUNCTIONS_EMULATOR !== 'true' && !context.app) {
            throw new functions.https.HttpsError('unauthenticated', 'App Check required');
        }
        // Validate coordinates
        if (data.latitude < -90 || data.latitude > 90 || data.longitude < -180 || data.longitude > 180) {
            throw new functions.https.HttpsError('invalid-argument', 'Invalid coordinates');
        }
        // Fetch weather from Open-Meteo API
        const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${data.latitude}&longitude=${data.longitude}&current=temperature_2m,relative_humidity_2m,precipitation_probability,weather_code&hourly=temperature_2m,precipitation_probability,weather_code&timezone=auto`);
        if (!response.ok) {
            throw new functions.https.HttpsError('unavailable', 'Weather service unavailable');
        }
        const weatherData = await response.json();
        // Cache weather data for 10 minutes
        await db.collection('weather-cache').doc(`${data.latitude}_${data.longitude}`).set({
            data: weatherData,
            timestamp: getTimestamp(),
            expiresAt: new Date(Date.now() + 10 * 60 * 1000)
        });
        return {
            success: true,
            weather: weatherData,
            message: 'Weather data retrieved successfully'
        };
    }
    catch (error) {
        console.error('Weather proxy error:', error);
        throw new functions.https.HttpsError('internal', 'Failed to retrieve weather data');
    }
});
// 6. Moderation Digest Function (runs daily)
exports.moderationDigest = functions.pubsub.schedule('0 9 * * *').onRun(async (context) => {
    try {
        // Get pending submissions from the last 24 hours
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const submissionsSnapshot = await db.collection('submissions')
            .where('timestamp', '>=', yesterday)
            .where('status', '==', 'pending')
            .get();
        if (submissionsSnapshot.empty) {
            console.log('No pending submissions for moderation digest');
            return null;
        }
        // Group submissions by type
        const submissionsByType = {
            rsvp: 0,
            feedback: 0,
            volunteer: 0
        };
        submissionsSnapshot.forEach((doc) => {
            const submission = doc.data();
            submissionsByType[submission.type]++;
        });
        // Create digest document
        await db.collection('moderation-digests').add({
            date: getTimestamp(),
            totalSubmissions: submissionsSnapshot.size,
            submissionsByType,
            status: 'pending'
        });
        console.log(`Moderation digest created: ${submissionsSnapshot.size} pending submissions`);
        return null;
    }
    catch (error) {
        console.error('Moderation digest error:', error);
        return null;
    }
});
// 7. Hello World Function (for testing)
exports.helloWorld = functions.https.onCall(async (data, context) => {
    try {
        return {
            message: 'Hello from Firebase Cloud Functions!',
            timestamp: getTimestamp(),
            data: data
        };
    }
    catch (error) {
        console.error('HelloWorld error:', error);
        return {
            message: 'Hello from Firebase Cloud Functions!',
            timestamp: getTimestamp(),
            data: data
        };
    }
});
// 8. Email Monitoring Functions
exports.testEmailConnection = functions.https.onCall(async (data, context) => {
    try {
        const { emailAddress, password, imapServer, imapPort } = data;
        if (!emailAddress || !password || !imapServer || !imapPort) {
            throw new functions.https.HttpsError('invalid-argument', 'Missing required email configuration');
        }
        return new Promise((resolve, reject) => {
            const imap = new Imap({
                user: emailAddress,
                password: password,
                host: imapServer,
                port: imapPort,
                tls: true,
                tlsOptions: { rejectUnauthorized: false }
            });
            imap.once('ready', () => {
                console.log('IMAP connection successful');
                imap.end();
                resolve({
                    success: true,
                    message: 'Email connection successful'
                });
            });
            imap.once('error', (err) => {
                console.error('IMAP connection error:', err);
                reject(new functions.https.HttpsError('unavailable', `Email connection failed: ${err.message}`));
            });
            imap.connect();
        });
    }
    catch (error) {
        console.error('Test email connection error:', error);
        throw new functions.https.HttpsError('internal', 'Failed to test email connection');
    }
});
exports.fetchNewEmails = functions.https.onCall(async (data, context) => {
    try {
        const { emailAddress, password, imapServer, imapPort, lastChecked } = data;
        if (!emailAddress || !password || !imapServer || !imapPort) {
            throw new functions.https.HttpsError('invalid-argument', 'Missing required email configuration');
        }
        return new Promise((resolve, reject) => {
            const imap = new Imap({
                user: emailAddress,
                password: password,
                host: imapServer,
                port: imapPort,
                tls: true,
                tlsOptions: { rejectUnauthorized: false }
            });
            const emails = [];
            imap.once('ready', () => {
                imap.openBox('INBOX', false, (err, box) => {
                    if (err) {
                        console.error('Error opening inbox:', err);
                        imap.end();
                        reject(new functions.https.HttpsError('unavailable', `Failed to open inbox: ${err.message}`));
                        return;
                    }
                    // Search for unread emails or emails from the last check
                    const searchCriteria = lastChecked
                        ? ['UNSEEN', ['SINCE', new Date(lastChecked)]]
                        : ['UNSEEN'];
                    imap.search(searchCriteria, (err, results) => {
                        if (err) {
                            console.error('Error searching emails:', err);
                            imap.end();
                            reject(new functions.https.HttpsError('unavailable', `Failed to search emails: ${err.message}`));
                            return;
                        }
                        if (results.length === 0) {
                            console.log('No new emails found');
                            imap.end();
                            resolve({
                                success: true,
                                emails: [],
                                message: 'No new emails found'
                            });
                            return;
                        }
                        console.log(`Found ${results.length} new emails`);
                        const fetch = imap.fetch(results, { bodies: '', markSeen: false });
                        fetch.on('message', (msg, seqno) => {
                            const email = {
                                id: '',
                                from: '',
                                to: '',
                                subject: '',
                                body: '',
                                date: new Date(),
                                attachments: []
                            };
                            msg.on('body', (stream, info) => {
                                let buffer = '';
                                stream.on('data', (chunk) => {
                                    buffer += chunk.toString('utf8');
                                });
                                stream.once('end', () => {
                                    // Parse email headers and body
                                    const parsed = parseEmail(buffer);
                                    email.id = `${seqno}_${Date.now()}`;
                                    email.from = parsed.from;
                                    email.to = parsed.to;
                                    email.subject = parsed.subject;
                                    email.body = parsed.body;
                                    email.date = parsed.date;
                                });
                            });
                            msg.once('end', () => {
                                emails.push(email);
                            });
                        });
                        fetch.once('error', (err) => {
                            console.error('Error fetching emails:', err);
                            imap.end();
                            reject(new functions.https.HttpsError('unavailable', `Failed to fetch emails: ${err.message}`));
                        });
                        fetch.once('end', () => {
                            console.log(`Successfully fetched ${emails.length} emails`);
                            imap.end();
                            resolve({
                                success: true,
                                emails: emails,
                                message: `Successfully fetched ${emails.length} emails`
                            });
                        });
                    });
                });
            });
            imap.once('error', (err) => {
                console.error('IMAP connection error:', err);
                reject(new functions.https.HttpsError('unavailable', `IMAP connection failed: ${err.message}`));
            });
            imap.connect();
        });
    }
    catch (error) {
        console.error('Fetch new emails error:', error);
        throw new functions.https.HttpsError('internal', 'Failed to fetch emails');
    }
});
// Helper function to parse email content
function parseEmail(rawEmail) {
    const lines = rawEmail.split('\n');
    let from = '';
    let to = '';
    let subject = '';
    let body = '';
    let inBody = false;
    for (const line of lines) {
        if (inBody) {
            body += line + '\n';
            continue;
        }
        if (line.startsWith('From: ')) {
            from = line.substring(6).trim();
        }
        else if (line.startsWith('To: ')) {
            to = line.substring(4).trim();
        }
        else if (line.startsWith('Subject: ')) {
            subject = line.substring(9).trim();
        }
        else if (line.startsWith('Date: ')) {
            // Parse date if needed
        }
        else if (line === '') {
            // Empty line indicates start of body
            inBody = true;
        }
    }
    return {
        from,
        to,
        subject,
        body: body.trim(),
        date: new Date()
    };
}
// Cloud function to safely fetch URL content for Wolf Watch emails
exports.fetchUrlContent = functions.https.onCall(async (data, context) => {
    try {
        const { url } = data;
        if (!url) {
            throw new functions.https.HttpsError('invalid-argument', 'URL is required');
        }
        // Validate URL format
        const urlPattern = /^https?:\/\/.+/i;
        if (!urlPattern.test(url)) {
            throw new functions.https.HttpsError('invalid-argument', 'Invalid URL format');
        }
        // Security checks
        const blockedDomains = [
            'localhost',
            '127.0.0.1',
            '192.168.',
            '10.',
            '172.16.',
            '172.17.',
            '172.18.',
            '172.19.',
            '172.20.',
            '172.21.',
            '172.22.',
            '172.23.',
            '172.24.',
            '172.25.',
            '172.26.',
            '172.27.',
            '172.28.',
            '172.29.',
            '172.30.',
            '172.31.'
        ];
        const urlObj = new URL(url);
        const hostname = urlObj.hostname.toLowerCase();
        // Check for blocked domains
        if (blockedDomains.some(domain => hostname.includes(domain))) {
            throw new functions.https.HttpsError('permission-denied', 'Access to this domain is not allowed');
        }
        // Fetch content with timeout and size limits
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'User-Agent': 'Pack1703-EmailMonitor/1.0',
                'Accept': 'text/html,text/plain,*/*',
                'Accept-Language': 'en-US,en;q=0.9'
            },
            signal: AbortSignal.timeout(10000) // 10 second timeout
        });
        if (!response.ok) {
            throw new functions.https.HttpsError('unavailable', `HTTP ${response.status}: ${response.statusText}`);
        }
        // Check content type
        const contentType = response.headers.get('content-type') || '';
        if (!contentType.includes('text/html') && !contentType.includes('text/plain')) {
            throw new functions.https.HttpsError('invalid-argument', 'Unsupported content type');
        }
        // Read content with size limit
        const text = await response.text();
        if (text.length > 500000) { // 500KB limit
            throw new functions.https.HttpsError('resource-exhausted', 'Content too large');
        }
        // Basic content sanitization
        const sanitizedContent = text
            .replace(/<script[^>]*>.*?<\/script>/gi, '') // Remove scripts
            .replace(/<style[^>]*>.*?<\/style>/gi, '') // Remove styles
            .replace(/<[^>]*>/g, ' ') // Remove HTML tags
            .replace(/\s+/g, ' ') // Normalize whitespace
            .trim();
        return {
            success: true,
            content: sanitizedContent,
            url: url,
            contentType: contentType,
            size: sanitizedContent.length
        };
    }
    catch (error) {
        console.error('Error fetching URL content:', error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError('internal', 'Failed to fetch URL content');
    }
});
//# sourceMappingURL=index.js.map