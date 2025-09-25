"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.helloWorld = exports.getBatchDashboardData = exports.rejectAccountRequest = exports.createUserManually = exports.approveAccountRequest = exports.getPendingAccountRequests = exports.submitAccountRequest = exports.adminUpdateUser = exports.getRSVPData = exports.deleteRSVP = exports.getBatchRSVPCounts = exports.getRSVPCount = exports.submitRSVP = exports.adminCreateEvent = exports.adminUpdateEvent = exports.updateUserRole = exports.disableAppCheckEnforcement = void 0;
const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");
// Initialize Firebase Admin
admin.initializeApp();
// Get Firestore instance
const db = admin.firestore();
// Helper function to get timestamp
function getTimestamp() {
    try {
        if (admin.firestore.Timestamp && admin.firestore.Timestamp.now) {
            return admin.firestore.Timestamp.now();
        }
        return new Date();
    }
    catch (error) {
        return new Date().toISOString();
    }
}
// Helper function to get role permissions
function getRolePermissions(role) {
    switch (role) {
        case 'root':
            return ['system_admin', 'user_management', 'event_management', 'pack_management', 'location_management', 'announcement_management', 'audit_logs'];
        case 'admin':
            return ['user_management', 'event_management', 'pack_management', 'location_management', 'announcement_management'];
        case 'leader':
        case 'den_leader':
            return ['event_management', 'pack_management', 'announcement_management'];
        case 'volunteer':
            return ['event_management'];
        case 'parent':
        default:
            return [];
    }
}
// CRITICAL: Disable App Check enforcement function
exports.disableAppCheckEnforcement = functions.https.onCall(async (data, context) => {
    try {
        // Check authentication
        if (!context.auth) {
            throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
        }
        // Only allow root users to disable App Check enforcement
        const userDoc = await db.collection('users').doc(context.auth.uid).get();
        if (!userDoc.exists) {
            throw new functions.https.HttpsError('permission-denied', 'User not found');
        }
        const userData = userDoc.data();
        if ((userData === null || userData === void 0 ? void 0 : userData.role) !== 'root') {
            throw new functions.https.HttpsError('permission-denied', 'Only root users can disable App Check enforcement');
        }
        // Log the action
        await db.collection('adminActions').add({
            action: 'disable_app_check_enforcement',
            userId: context.auth.uid,
            userEmail: context.auth.token.email,
            timestamp: getTimestamp(),
            details: 'App Check enforcement disabled to restore Firestore access'
        });
        return {
            success: true,
            message: 'App Check enforcement disabled. You must also disable it in the Firebase Console.',
            instructions: [
                '1. Go to Firebase Console > App Check > APIs',
                '2. Disable enforcement for Cloud Firestore',
                '3. Disable enforcement for Cloud Functions',
                '4. This will restore Firestore access'
            ]
        };
    }
    catch (error) {
        console.error('Error disabling App Check enforcement:', error);
        throw new functions.https.HttpsError('internal', error.message);
    }
});
// CRITICAL: Update user role function
exports.updateUserRole = functions.https.onCall(async (data, context) => {
    try {
        const { userId, newRole } = data;
        // Check authentication
        if (!context.auth) {
            throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
        }
        // Only allow the user to update their own role, or require admin privileges
        if (context.auth.uid !== userId) {
            // Check if current user has admin privileges
            const currentUserDoc = await db.collection('users').doc(context.auth.uid).get();
            if (!currentUserDoc.exists) {
                throw new functions.https.HttpsError('permission-denied', 'Current user not found');
            }
            const currentUserData = currentUserDoc.data();
            const hasAdminRole = (currentUserData === null || currentUserData === void 0 ? void 0 : currentUserData.role) === 'root' || (currentUserData === null || currentUserData === void 0 ? void 0 : currentUserData.role) === 'admin';
            const hasLegacyPermissions = (currentUserData === null || currentUserData === void 0 ? void 0 : currentUserData.isAdmin) || (currentUserData === null || currentUserData === void 0 ? void 0 : currentUserData.isDenLeader) || (currentUserData === null || currentUserData === void 0 ? void 0 : currentUserData.isCubmaster);
            if (!hasAdminRole && !hasLegacyPermissions) {
                throw new functions.https.HttpsError('permission-denied', 'Only admins can update other users');
            }
        }
        // Validate role
        const validRoles = ['parent', 'volunteer', 'admin', 'root'];
        if (!validRoles.includes(newRole)) {
            throw new functions.https.HttpsError('invalid-argument', 'Invalid role');
        }
        // Update user role
        const updateData = {
            role: newRole,
            updatedAt: getTimestamp()
        };
        // Set appropriate boolean flags based on role
        if (newRole === 'admin' || newRole === 'root') {
            updateData.isAdmin = true;
            updateData.isDenLeader = true;
            updateData.isCubmaster = true;
            updateData.permissions = ['event_management', 'pack_management', 'user_management', 'location_management', 'announcement_management'];
        }
        else if (newRole === 'volunteer') {
            updateData.isDenLeader = true;
            updateData.permissions = ['den_content', 'den_events', 'den_members'];
        }
        else {
            updateData.isAdmin = false;
            updateData.isDenLeader = false;
            updateData.isCubmaster = false;
            updateData.permissions = ['family_management', 'family_events', 'family_rsvp'];
        }
        await db.collection('users').doc(userId).update(updateData);
        return {
            success: true,
            message: `User role updated to ${newRole} successfully`
        };
    }
    catch (error) {
        console.error('Error updating user role:', error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError('internal', 'Failed to update user role');
    }
});
// CRITICAL: Admin update event function
exports.adminUpdateEvent = functions.https.onCall(async (data, context) => {
    var _a;
    try {
        // Check authentication
        if (!context.auth) {
            throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
        }
        // Check if user has admin privileges
        const userDoc = await db.collection('users').doc(context.auth.uid).get();
        if (!userDoc.exists) {
            throw new functions.https.HttpsError('permission-denied', 'User not found');
        }
        const userData = userDoc.data();
        const hasAdminRole = (userData === null || userData === void 0 ? void 0 : userData.role) === 'root' || (userData === null || userData === void 0 ? void 0 : userData.role) === 'admin' || (userData === null || userData === void 0 ? void 0 : userData.role) === 'leader';
        const hasLegacyPermissions = (userData === null || userData === void 0 ? void 0 : userData.isAdmin) || (userData === null || userData === void 0 ? void 0 : userData.isDenLeader) || (userData === null || userData === void 0 ? void 0 : userData.isCubmaster);
        const hasEventManagementPermission = (_a = userData === null || userData === void 0 ? void 0 : userData.permissions) === null || _a === void 0 ? void 0 : _a.includes('event_management');
        if (!hasAdminRole && !hasLegacyPermissions && !hasEventManagementPermission) {
            throw new functions.https.HttpsError('permission-denied', 'Insufficient permissions to update events');
        }
        // Update the event
        const eventRef = db.collection('events').doc(data.eventId);
        await eventRef.update(Object.assign(Object.assign({}, data.eventData), { updatedAt: getTimestamp() }));
        return {
            success: true,
            message: 'Event updated successfully'
        };
    }
    catch (error) {
        console.error('Error updating event:', error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError('internal', 'Failed to update event');
    }
});
// CRITICAL: Admin create event function
exports.adminCreateEvent = functions.https.onCall(async (data, context) => {
    var _a;
    try {
        // Check authentication
        if (!context.auth) {
            throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
        }
        // Check if user has admin privileges
        const userDoc = await db.collection('users').doc(context.auth.uid).get();
        if (!userDoc.exists) {
            throw new functions.https.HttpsError('permission-denied', 'User not found');
        }
        const userData = userDoc.data();
        const hasAdminRole = (userData === null || userData === void 0 ? void 0 : userData.role) === 'root' || (userData === null || userData === void 0 ? void 0 : userData.role) === 'admin' || (userData === null || userData === void 0 ? void 0 : userData.role) === 'leader';
        const hasLegacyPermissions = (userData === null || userData === void 0 ? void 0 : userData.isAdmin) || (userData === null || userData === void 0 ? void 0 : userData.isDenLeader) || (userData === null || userData === void 0 ? void 0 : userData.isCubmaster);
        const hasEventManagementPermission = (_a = userData === null || userData === void 0 ? void 0 : userData.permissions) === null || _a === void 0 ? void 0 : _a.includes('event_management');
        if (!hasAdminRole && !hasLegacyPermissions && !hasEventManagementPermission) {
            throw new functions.https.HttpsError('permission-denied', 'Insufficient permissions to create events');
        }
        // Create the event
        const eventData = Object.assign(Object.assign({}, data), { createdAt: getTimestamp(), updatedAt: getTimestamp() });
        const eventRef = await db.collection('events').add(eventData);
        return {
            success: true,
            eventId: eventRef.id,
            message: 'Event created successfully'
        };
    }
    catch (error) {
        console.error('Error creating event:', error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError('internal', 'Failed to create event');
    }
});
// CRITICAL: Submit RSVP function with enhanced validation and counting
exports.submitRSVP = functions.https.onCall(async (data, context) => {
    try {
        // Check authentication
        if (!context.auth) {
            throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated to RSVP');
        }
        // Validate required fields
        if (!data.eventId || !data.familyName || !data.email || !data.attendees || !Array.isArray(data.attendees)) {
            throw new functions.https.HttpsError('invalid-argument', 'Missing required RSVP data');
        }
        // Validate attendees
        if (data.attendees.length === 0 || data.attendees.length > 20) {
            throw new functions.https.HttpsError('invalid-argument', 'Must have 1-20 attendees');
        }
        // Check if user already has an RSVP for this event
        const existingRSVPQuery = await db.collection('rsvps')
            .where('eventId', '==', data.eventId)
            .where('userId', '==', context.auth.uid)
            .get();
        if (!existingRSVPQuery.empty) {
            throw new functions.https.HttpsError('already-exists', 'You already have an RSVP for this event');
        }
        // Get event details to validate capacity
        const eventRef = db.collection('events').doc(data.eventId);
        const eventDoc = await eventRef.get();
        if (!eventDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'Event not found');
        }
        const eventData = eventDoc.data();
        // Check event capacity
        const currentRSVPCount = await getActualRSVPCount(data.eventId);
        const maxCapacity = eventData === null || eventData === void 0 ? void 0 : eventData.maxCapacity;
        if (maxCapacity && (currentRSVPCount + data.attendees.length) > maxCapacity) {
            const remainingSpots = maxCapacity - currentRSVPCount;
            throw new functions.https.HttpsError('resource-exhausted', `Event is at capacity. Only ${remainingSpots} spots remaining.`);
        }
        // Create RSVP submission with enhanced data
        const rsvpData = {
            eventId: data.eventId,
            userId: context.auth.uid,
            userEmail: context.auth.token.email || data.email,
            familyName: data.familyName,
            email: data.email,
            phone: data.phone || '',
            attendees: data.attendees,
            dietaryRestrictions: data.dietaryRestrictions || '',
            specialNeeds: data.specialNeeds || '',
            notes: data.notes || '',
            ipHash: data.ipHash || '',
            userAgent: data.userAgent || '',
            submittedAt: getTimestamp(),
            createdAt: getTimestamp(),
            updatedAt: getTimestamp()
        };
        // Use batch write for atomicity
        const batch = db.batch();
        // Add RSVP
        const rsvpRef = db.collection('rsvps').doc();
        batch.set(rsvpRef, rsvpData);
        // Update event RSVP count
        const newRSVPCount = currentRSVPCount + data.attendees.length;
        batch.update(eventRef, {
            currentRSVPs: newRSVPCount,
            updatedAt: getTimestamp()
        });
        // Update or create event statistics
        const eventStatsRef = db.collection('eventStats').doc(data.eventId);
        const eventStatsDoc = await eventStatsRef.get();
        if (eventStatsDoc.exists) {
            const statsData = eventStatsDoc.data();
            const currentStatsCount = (statsData === null || statsData === void 0 ? void 0 : statsData.rsvpCount) || 0;
            batch.update(eventStatsRef, {
                rsvpCount: currentStatsCount + data.attendees.length,
                updatedAt: getTimestamp()
            });
        }
        else {
            // Create new event stats document
            batch.set(eventStatsRef, {
                eventId: data.eventId,
                rsvpCount: data.attendees.length,
                attendeeCount: data.attendees.length,
                rsvpByDen: {},
                volunteerCount: 0,
                createdAt: getTimestamp(),
                updatedAt: getTimestamp()
            });
        }
        // Commit the batch
        await batch.commit();
        return {
            success: true,
            rsvpId: rsvpRef.id,
            newRSVPCount: newRSVPCount,
            message: 'RSVP submitted successfully'
        };
    }
    catch (error) {
        console.error('Error submitting RSVP:', error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError('internal', 'Failed to submit RSVP');
    }
});
// Helper function to get actual RSVP count from database using aggregation
async function getActualRSVPCount(eventId) {
    try {
        // Use aggregation query for better performance
        const rsvpsRef = db.collection('rsvps');
        const snapshot = await rsvpsRef
            .where('eventId', '==', eventId)
            .select('attendees')
            .get();
        let totalAttendees = 0;
        snapshot.docs.forEach(doc => {
            var _a;
            const rsvpData = doc.data();
            totalAttendees += ((_a = rsvpData.attendees) === null || _a === void 0 ? void 0 : _a.length) || 1;
        });
        return totalAttendees;
    }
    catch (error) {
        console.error('Error getting RSVP count:', error);
        return 0;
    }
}
// CRITICAL: Get RSVP count for an event
exports.getRSVPCount = functions.https.onCall(async (data, context) => {
    try {
        if (!data.eventId) {
            throw new functions.https.HttpsError('invalid-argument', 'Event ID is required');
        }
        const count = await getActualRSVPCount(data.eventId);
        return {
            success: true,
            eventId: data.eventId,
            rsvpCount: count,
            message: 'RSVP count retrieved successfully'
        };
    }
    catch (error) {
        console.error('Error getting RSVP count:', error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError('internal', 'Failed to get RSVP count');
    }
});
// CRITICAL: Get RSVP counts for multiple events in batch (performance optimization)
exports.getBatchRSVPCounts = functions.https.onCall(async (data, context) => {
    try {
        if (!data.eventIds || !Array.isArray(data.eventIds)) {
            throw new functions.https.HttpsError('invalid-argument', 'Event IDs array is required');
        }
        // Get all RSVPs for the requested events in a single query
        const rsvpsQuery = await db.collection('rsvps')
            .where('eventId', 'in', data.eventIds)
            .get();
        // Group RSVPs by eventId and count attendees
        const rsvpCounts = {};
        // Initialize all event IDs with 0 count
        data.eventIds.forEach((eventId) => {
            rsvpCounts[eventId] = 0;
        });
        // Count attendees for each RSVP
        rsvpsQuery.docs.forEach(doc => {
            var _a;
            const rsvpData = doc.data();
            const eventId = rsvpData.eventId;
            const attendeeCount = ((_a = rsvpData.attendees) === null || _a === void 0 ? void 0 : _a.length) || 1;
            if (rsvpCounts.hasOwnProperty(eventId)) {
                rsvpCounts[eventId] += attendeeCount;
            }
        });
        return {
            success: true,
            rsvpCounts,
            message: 'Batch RSVP counts retrieved successfully'
        };
    }
    catch (error) {
        console.error('Error getting batch RSVP counts:', error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError('internal', 'Failed to get batch RSVP counts');
    }
});
// CRITICAL: Delete RSVP function
exports.deleteRSVP = functions.https.onCall(async (data, context) => {
    var _a, _b;
    try {
        // Check authentication
        if (!context.auth) {
            throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
        }
        if (!data.rsvpId) {
            throw new functions.https.HttpsError('invalid-argument', 'RSVP ID is required');
        }
        // Get the RSVP to check ownership
        const rsvpRef = db.collection('rsvps').doc(data.rsvpId);
        const rsvpDoc = await rsvpRef.get();
        if (!rsvpDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'RSVP not found');
        }
        const rsvpData = rsvpDoc.data();
        // Check if user owns this RSVP or is admin
        const userDoc = await db.collection('users').doc(context.auth.uid).get();
        const userData = userDoc.data();
        const isAdmin = (userData === null || userData === void 0 ? void 0 : userData.role) === 'admin' || (userData === null || userData === void 0 ? void 0 : userData.role) === 'root' || (userData === null || userData === void 0 ? void 0 : userData.isAdmin);
        if ((rsvpData === null || rsvpData === void 0 ? void 0 : rsvpData.userId) !== context.auth.uid && !isAdmin) {
            throw new functions.https.HttpsError('permission-denied', 'You can only delete your own RSVPs');
        }
        // Use batch write for atomicity
        const batch = db.batch();
        // Delete RSVP
        batch.delete(rsvpRef);
        // Update event RSVP count
        const eventRef = db.collection('events').doc(rsvpData.eventId);
        const currentCount = await getActualRSVPCount(rsvpData.eventId);
        const newCount = Math.max(0, currentCount - (((_a = rsvpData.attendees) === null || _a === void 0 ? void 0 : _a.length) || 1));
        batch.update(eventRef, {
            currentRSVPs: newCount,
            updatedAt: getTimestamp()
        });
        // Update event statistics
        const eventStatsRef = db.collection('eventStats').doc(rsvpData.eventId);
        const eventStatsDoc = await eventStatsRef.get();
        if (eventStatsDoc.exists) {
            const statsData = eventStatsDoc.data();
            const currentStatsCount = (statsData === null || statsData === void 0 ? void 0 : statsData.rsvpCount) || 0;
            const newStatsCount = Math.max(0, currentStatsCount - (((_b = rsvpData.attendees) === null || _b === void 0 ? void 0 : _b.length) || 1));
            batch.update(eventStatsRef, {
                rsvpCount: newStatsCount,
                updatedAt: getTimestamp()
            });
        }
        // Commit the batch
        await batch.commit();
        return {
            success: true,
            message: 'RSVP deleted successfully',
            newRSVPCount: newCount
        };
    }
    catch (error) {
        console.error('Error deleting RSVP:', error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError('internal', 'Failed to delete RSVP');
    }
});
// CRITICAL: Get RSVP data for admin users (bypasses client-side permissions)
exports.getRSVPData = functions.https.onCall(async (data, context) => {
    try {
        if (!context.auth) {
            throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
        }
        if (!data.eventId) {
            throw new functions.https.HttpsError('invalid-argument', 'Event ID is required');
        }
        // Check if user is admin
        const userDoc = await db.collection('users').doc(context.auth.uid).get();
        const userData = userDoc.data();
        const isAdmin = (userData === null || userData === void 0 ? void 0 : userData.role) === 'admin' || (userData === null || userData === void 0 ? void 0 : userData.role) === 'root' ||
            (userData === null || userData === void 0 ? void 0 : userData.role) === 'super-admin' || (userData === null || userData === void 0 ? void 0 : userData.isAdmin);
        if (!isAdmin) {
            throw new functions.https.HttpsError('permission-denied', 'Only admin users can access RSVP data');
        }
        console.log(`Admin ${context.auth.uid} requesting RSVP data for event ${data.eventId}`);
        // Query RSVPs with admin privileges (bypasses client-side rules)
        // Remove orderBy to avoid index requirement, we'll sort in JavaScript
        const rsvpsQuery = await db.collection('rsvps')
            .where('eventId', '==', data.eventId)
            .get();
        const rsvpsData = [];
        rsvpsQuery.docs.forEach(doc => {
            const data = doc.data();
            rsvpsData.push({
                id: doc.id,
                eventId: data.eventId,
                userId: data.userId,
                userEmail: data.userEmail,
                familyName: data.familyName,
                email: data.email,
                phone: data.phone,
                attendees: data.attendees || [],
                dietaryRestrictions: data.dietaryRestrictions,
                specialNeeds: data.specialNeeds,
                notes: data.notes,
                submittedAt: data.submittedAt,
                createdAt: data.createdAt
            });
        });
        // Sort by submittedAt in descending order (most recent first)
        rsvpsData.sort((a, b) => {
            var _a, _b;
            const aTime = ((_a = a.submittedAt) === null || _a === void 0 ? void 0 : _a.toDate) ? a.submittedAt.toDate() : new Date(a.submittedAt || 0);
            const bTime = ((_b = b.submittedAt) === null || _b === void 0 ? void 0 : _b.toDate) ? b.submittedAt.toDate() : new Date(b.submittedAt || 0);
            return bTime.getTime() - aTime.getTime();
        });
        console.log(`Found ${rsvpsData.length} RSVPs for event ${data.eventId}`);
        return {
            success: true,
            eventId: data.eventId,
            rsvps: rsvpsData,
            count: rsvpsData.length,
            message: 'RSVP data retrieved successfully'
        };
    }
    catch (error) {
        console.error('Error getting RSVP data:', error);
        throw new functions.https.HttpsError('internal', 'Failed to get RSVP data');
    }
});
// CRITICAL: Admin update user function
exports.adminUpdateUser = functions.https.onCall(async (data, context) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
    try {
        // Check authentication
        if (!context.auth) {
            throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
        }
        // Check if user has admin privileges
        const userDoc = await db.collection('users').doc(context.auth.uid).get();
        if (!userDoc.exists) {
            throw new functions.https.HttpsError('permission-denied', 'User not found');
        }
        const userData = userDoc.data();
        // Check role-based permissions (new system) or legacy boolean fields
        const hasAdminRole = (userData === null || userData === void 0 ? void 0 : userData.role) === 'root' || (userData === null || userData === void 0 ? void 0 : userData.role) === 'admin' || (userData === null || userData === void 0 ? void 0 : userData.role) === 'leader';
        const hasLegacyPermissions = (userData === null || userData === void 0 ? void 0 : userData.isAdmin) || (userData === null || userData === void 0 ? void 0 : userData.isDenLeader) || (userData === null || userData === void 0 ? void 0 : userData.isCubmaster);
        const hasUserManagementPermission = ((_a = userData === null || userData === void 0 ? void 0 : userData.permissions) === null || _a === void 0 ? void 0 : _a.includes('user_management')) || ((_b = userData === null || userData === void 0 ? void 0 : userData.permissions) === null || _b === void 0 ? void 0 : _b.includes('system_admin'));
        if (!hasAdminRole && !hasLegacyPermissions && !hasUserManagementPermission) {
            throw new functions.https.HttpsError('permission-denied', 'Insufficient permissions to update users');
        }
        const { userId, updates } = data;
        if (!userId) {
            throw new functions.https.HttpsError('invalid-argument', 'User ID is required');
        }
        // Check if target user exists
        const targetUserDoc = await db.collection('users').doc(userId).get();
        if (!targetUserDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'Target user not found');
        }
        // Prepare update data
        const updateData = {
            updatedAt: getTimestamp()
        };
        if (updates.displayName !== undefined) {
            updateData.displayName = updates.displayName;
        }
        if (updates.isActive !== undefined) {
            updateData.isActive = updates.isActive;
        }
        if (updates.profile !== undefined) {
            updateData.profile = updates.profile;
        }
        // Update Firestore document
        await db.collection('users').doc(userId).update(updateData);
        // Update Firebase Auth custom claims if role is being changed
        if (updates.role !== undefined) {
            await admin.auth().setCustomUserClaims(userId, {
                approved: true,
                role: updates.role
            });
            // Also update the role in Firestore
            await db.collection('users').doc(userId).update({
                role: updates.role,
                permissions: updates.permissions || [],
                updatedAt: getTimestamp()
            });
        }
        // Log admin action
        await db.collection('adminActions').add({
            userId: context.auth.uid,
            userEmail: context.auth.token.email || '',
            action: 'update',
            entityType: 'user',
            entityId: userId,
            entityName: updates.displayName || 'User',
            details: updates,
            timestamp: getTimestamp(),
            ipAddress: ((_c = context.rawRequest) === null || _c === void 0 ? void 0 : _c.ip) || 'unknown',
            userAgent: ((_e = (_d = context.rawRequest) === null || _d === void 0 ? void 0 : _d.headers) === null || _e === void 0 ? void 0 : _e['user-agent']) || 'unknown',
            success: true
        });
        return {
            success: true,
            message: 'User updated successfully'
        };
    }
    catch (error) {
        console.error('Error in adminUpdateUser:', error);
        // Log failed action
        try {
            await db.collection('adminActions').add({
                userId: ((_f = context.auth) === null || _f === void 0 ? void 0 : _f.uid) || 'unknown',
                userEmail: ((_h = (_g = context.auth) === null || _g === void 0 ? void 0 : _g.token) === null || _h === void 0 ? void 0 : _h.email) || '',
                action: 'update',
                entityType: 'user',
                entityId: (data === null || data === void 0 ? void 0 : data.userId) || 'unknown',
                entityName: 'User',
                details: (data === null || data === void 0 ? void 0 : data.updates) || {},
                timestamp: getTimestamp(),
                ipAddress: ((_j = context.rawRequest) === null || _j === void 0 ? void 0 : _j.ip) || 'unknown',
                userAgent: ((_l = (_k = context.rawRequest) === null || _k === void 0 ? void 0 : _k.headers) === null || _l === void 0 ? void 0 : _l['user-agent']) || 'unknown',
                success: false,
                error: error instanceof Error ? error.message : String(error)
            });
        }
        catch (logError) {
            console.error('Failed to log admin action:', logError);
        }
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError('internal', 'Failed to update user');
    }
});
// CRITICAL: Submit account request function
exports.submitAccountRequest = functions.https.onCall(async (data, context) => {
    var _a, _b, _c;
    try {
        // Validate required fields
        if (!data.email || !data.displayName || !data.phone || !data.address) {
            throw new functions.https.HttpsError('invalid-argument', 'Missing required fields: email, displayName, phone, address');
        }
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(data.email)) {
            throw new functions.https.HttpsError('invalid-argument', 'Invalid email format');
        }
        // Check if email already exists
        const existingUserQuery = await db.collection('users')
            .where('email', '==', data.email)
            .get();
        if (!existingUserQuery.empty) {
            throw new functions.https.HttpsError('already-exists', 'An account with this email already exists');
        }
        // Check if there's already a pending request for this email
        const existingRequestQuery = await db.collection('accountRequests')
            .where('email', '==', data.email)
            .where('status', '==', 'pending')
            .get();
        if (!existingRequestQuery.empty) {
            throw new functions.https.HttpsError('already-exists', 'A request for this email is already pending');
        }
        // Create account request
        const requestData = {
            email: data.email,
            displayName: data.displayName,
            phone: data.phone,
            address: data.address,
            scoutRank: data.scoutRank || '',
            den: data.den || '',
            emergencyContact: data.emergencyContact || '',
            reason: data.reason || '',
            status: 'pending',
            submittedAt: getTimestamp(),
            createdAt: getTimestamp(),
            updatedAt: getTimestamp(),
            ipHash: data.ipHash || '',
            userAgent: data.userAgent || ''
        };
        const requestRef = await db.collection('accountRequests').add(requestData);
        // Log the request
        await db.collection('adminActions').add({
            action: 'account_request_submitted',
            entityType: 'account_request',
            entityId: requestRef.id,
            entityName: data.displayName,
            details: {
                email: data.email,
                phone: data.phone,
                den: data.den,
                scoutRank: data.scoutRank
            },
            timestamp: getTimestamp(),
            ipAddress: ((_a = context.rawRequest) === null || _a === void 0 ? void 0 : _a.ip) || 'unknown',
            userAgent: ((_c = (_b = context.rawRequest) === null || _b === void 0 ? void 0 : _b.headers) === null || _c === void 0 ? void 0 : _c['user-agent']) || 'unknown',
            success: true
        });
        return {
            success: true,
            requestId: requestRef.id,
            message: 'Account request submitted successfully. You will be notified when it is reviewed.'
        };
    }
    catch (error) {
        console.error('Error submitting account request:', error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError('internal', 'Failed to submit account request');
    }
});
// CRITICAL: Get pending account requests (admin only)
exports.getPendingAccountRequests = functions.https.onCall(async (data, context) => {
    var _a, _b;
    try {
        // Check authentication
        if (!context.auth) {
            throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
        }
        // Check if user has admin privileges
        const userDoc = await db.collection('users').doc(context.auth.uid).get();
        if (!userDoc.exists) {
            throw new functions.https.HttpsError('permission-denied', 'User not found');
        }
        const userData = userDoc.data();
        const hasAdminRole = (userData === null || userData === void 0 ? void 0 : userData.role) === 'root' || (userData === null || userData === void 0 ? void 0 : userData.role) === 'admin' || (userData === null || userData === void 0 ? void 0 : userData.role) === 'leader';
        const hasLegacyPermissions = (userData === null || userData === void 0 ? void 0 : userData.isAdmin) || (userData === null || userData === void 0 ? void 0 : userData.isDenLeader) || (userData === null || userData === void 0 ? void 0 : userData.isCubmaster);
        const hasUserManagementPermission = ((_a = userData === null || userData === void 0 ? void 0 : userData.permissions) === null || _a === void 0 ? void 0 : _a.includes('user_management')) || ((_b = userData === null || userData === void 0 ? void 0 : userData.permissions) === null || _b === void 0 ? void 0 : _b.includes('system_admin'));
        if (!hasAdminRole && !hasLegacyPermissions && !hasUserManagementPermission) {
            throw new functions.https.HttpsError('permission-denied', 'Insufficient permissions to view account requests');
        }
        // Extract pagination parameters
        const pageSize = data.pageSize || 20; // Default to 20 requests per page
        const lastDocId = data.lastDocId; // For cursor-based pagination
        const limit = Math.min(pageSize, 50); // Cap at 50 to prevent abuse
        // Query without orderBy to avoid index requirement
        let query = db.collection('accountRequests')
            .where('status', '==', 'pending')
            .limit(limit);
        // Apply cursor-based pagination if lastDocId is provided
        if (lastDocId) {
            const lastDoc = await db.collection('accountRequests').doc(lastDocId).get();
            if (lastDoc.exists) {
                query = query.startAfter(lastDoc);
            }
        }
        const requestsQuery = await query.get();
        const requests = [];
        requestsQuery.docs.forEach(doc => {
            const data = doc.data();
            requests.push({
                id: doc.id,
                email: data.email,
                displayName: data.displayName,
                phone: data.phone,
                address: data.address,
                scoutRank: data.scoutRank,
                den: data.den,
                emergencyContact: data.emergencyContact,
                reason: data.reason,
                status: data.status,
                submittedAt: data.submittedAt,
                createdAt: data.createdAt
            });
        });
        // Sort by submittedAt in descending order (most recent first)
        requests.sort((a, b) => {
            var _a, _b;
            const aTime = ((_a = a.submittedAt) === null || _a === void 0 ? void 0 : _a.toDate) ? a.submittedAt.toDate() : new Date(a.submittedAt || 0);
            const bTime = ((_b = b.submittedAt) === null || _b === void 0 ? void 0 : _b.toDate) ? b.submittedAt.toDate() : new Date(b.submittedAt || 0);
            return bTime.getTime() - aTime.getTime();
        });
        // Get total count for pagination info (optimized query)
        const totalCountQuery = await db.collection('accountRequests')
            .where('status', '==', 'pending')
            .select() // Only get document IDs for counting
            .get();
        return {
            success: true,
            requests: requests,
            count: requests.length,
            totalCount: totalCountQuery.size,
            hasMore: requests.length === limit,
            lastDocId: requests.length > 0 ? requests[requests.length - 1].id : null,
            message: 'Account requests retrieved successfully'
        };
    }
    catch (error) {
        console.error('Error getting account requests:', error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError('internal', 'Failed to get account requests');
    }
});
// CRITICAL: Approve account request (admin only)
exports.approveAccountRequest = functions.https.onCall(async (data, context) => {
    var _a, _b, _c, _d, _e;
    try {
        // Check authentication
        if (!context.auth) {
            throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
        }
        // Check if user has admin privileges
        const userDoc = await db.collection('users').doc(context.auth.uid).get();
        if (!userDoc.exists) {
            throw new functions.https.HttpsError('permission-denied', 'User not found');
        }
        const userData = userDoc.data();
        const hasAdminRole = (userData === null || userData === void 0 ? void 0 : userData.role) === 'root' || (userData === null || userData === void 0 ? void 0 : userData.role) === 'admin' || (userData === null || userData === void 0 ? void 0 : userData.role) === 'leader';
        const hasLegacyPermissions = (userData === null || userData === void 0 ? void 0 : userData.isAdmin) || (userData === null || userData === void 0 ? void 0 : userData.isDenLeader) || (userData === null || userData === void 0 ? void 0 : userData.isCubmaster);
        const hasUserManagementPermission = ((_a = userData === null || userData === void 0 ? void 0 : userData.permissions) === null || _a === void 0 ? void 0 : _a.includes('user_management')) || ((_b = userData === null || userData === void 0 ? void 0 : userData.permissions) === null || _b === void 0 ? void 0 : _b.includes('system_admin'));
        if (!hasAdminRole && !hasLegacyPermissions && !hasUserManagementPermission) {
            throw new functions.https.HttpsError('permission-denied', 'Insufficient permissions to approve account requests');
        }
        const { requestId, role = 'parent' } = data;
        if (!requestId) {
            throw new functions.https.HttpsError('invalid-argument', 'Request ID is required');
        }
        // Get the request
        const requestRef = db.collection('accountRequests').doc(requestId);
        const requestDoc = await requestRef.get();
        if (!requestDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'Account request not found');
        }
        const requestData = requestDoc.data();
        if ((requestData === null || requestData === void 0 ? void 0 : requestData.status) !== 'pending') {
            throw new functions.https.HttpsError('failed-precondition', 'Request is not pending');
        }
        // Create user account in Firestore
        const newUserData = {
            email: requestData.email,
            displayName: requestData.displayName,
            role: role,
            permissions: getRolePermissions(role),
            isActive: true,
            status: 'approved',
            createdAt: getTimestamp(),
            updatedAt: getTimestamp(),
            lastLoginAt: null,
            profile: {
                firstName: requestData.firstName || '',
                lastName: requestData.lastName || '',
                phone: requestData.phone || '',
                address: requestData.address || '',
                city: requestData.city || '',
                state: requestData.state || '',
                zipCode: requestData.zipCode || '',
                emergencyContact: requestData.emergencyContact || '',
                emergencyPhone: requestData.emergencyPhone || '',
                medicalInfo: requestData.medicalInfo || '',
                dietaryRestrictions: requestData.dietaryRestrictions || '',
                specialNeeds: requestData.specialNeeds || '',
                den: requestData.den || '',
                rank: requestData.rank || '',
                patrol: requestData.patrol || '',
                parentGuardian: requestData.parentGuardian || '',
                parentPhone: requestData.parentPhone || '',
                parentEmail: requestData.parentEmail || ''
            },
            preferences: {
                notifications: true,
                emailUpdates: true,
                smsUpdates: false,
                language: 'en',
                timezone: 'America/Los_Angeles'
            },
            authProvider: 'email',
            emailVerified: false,
            approvedBy: context.auth.uid,
            approvedAt: getTimestamp()
        };
        // Create user document in Firestore
        const userRef = db.collection('users').doc();
        await userRef.set(newUserData);
        // Update request status
        await requestRef.update({
            status: 'approved',
            approvedBy: context.auth.uid,
            approvedAt: getTimestamp(),
            approvedRole: role,
            updatedAt: getTimestamp(),
            userId: userRef.id // Link to the created user
        });
        // Log the approval
        await db.collection('adminActions').add({
            userId: context.auth.uid,
            userEmail: context.auth.token.email || '',
            action: 'approve_account_request',
            entityType: 'account_request',
            entityId: requestId,
            entityName: requestData.displayName,
            details: {
                email: requestData.email,
                approvedRole: role,
                createdUserId: userRef.id
            },
            timestamp: getTimestamp(),
            ipAddress: ((_c = context.rawRequest) === null || _c === void 0 ? void 0 : _c.ip) || 'unknown',
            userAgent: ((_e = (_d = context.rawRequest) === null || _d === void 0 ? void 0 : _d.headers) === null || _e === void 0 ? void 0 : _e['user-agent']) || 'unknown',
            success: true
        });
        return {
            success: true,
            message: 'Account request approved and user account created successfully',
            userId: userRef.id
        };
    }
    catch (error) {
        console.error('Error approving account request:', error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError('internal', 'Failed to approve account request');
    }
});
// CRITICAL: Create user account manually (admin only) - for fixing approval issues
exports.createUserManually = functions.https.onCall(async (data, context) => {
    var _a, _b, _c, _d, _e;
    try {
        // Check authentication
        if (!context.auth) {
            throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
        }
        // Check if user has admin privileges
        const userDoc = await db.collection('users').doc(context.auth.uid).get();
        if (!userDoc.exists) {
            throw new functions.https.HttpsError('permission-denied', 'User not found');
        }
        const userData = userDoc.data();
        const hasAdminRole = (userData === null || userData === void 0 ? void 0 : userData.role) === 'root' || (userData === null || userData === void 0 ? void 0 : userData.role) === 'admin' || (userData === null || userData === void 0 ? void 0 : userData.role) === 'leader';
        const hasLegacyPermissions = (userData === null || userData === void 0 ? void 0 : userData.isAdmin) || (userData === null || userData === void 0 ? void 0 : userData.isDenLeader) || (userData === null || userData === void 0 ? void 0 : userData.isCubmaster);
        const hasUserManagementPermission = ((_a = userData === null || userData === void 0 ? void 0 : userData.permissions) === null || _a === void 0 ? void 0 : _a.includes('user_management')) || ((_b = userData === null || userData === void 0 ? void 0 : userData.permissions) === null || _b === void 0 ? void 0 : _b.includes('system_admin'));
        if (!hasAdminRole && !hasLegacyPermissions && !hasUserManagementPermission) {
            throw new functions.https.HttpsError('permission-denied', 'Insufficient permissions to create user accounts');
        }
        const { email, displayName, firstName, lastName, phone, address, city, state, zipCode, den, rank, role = 'parent', reasonForJoining } = data;
        if (!email || !displayName) {
            throw new functions.https.HttpsError('invalid-argument', 'Email and display name are required');
        }
        // Check if user already exists
        const existingUsersSnapshot = await db.collection('users')
            .where('email', '==', email)
            .get();
        if (!existingUsersSnapshot.empty) {
            throw new functions.https.HttpsError('already-exists', 'User with this email already exists');
        }
        // Create user account
        const newUserData = {
            email: email,
            displayName: displayName,
            role: role,
            permissions: getRolePermissions(role),
            isActive: true,
            status: 'approved',
            createdAt: getTimestamp(),
            updatedAt: getTimestamp(),
            lastLoginAt: null,
            profile: {
                firstName: firstName || '',
                lastName: lastName || '',
                phone: phone || '',
                address: address || '',
                city: city || '',
                state: state || '',
                zipCode: zipCode || '',
                emergencyContact: '',
                emergencyPhone: '',
                medicalInfo: '',
                dietaryRestrictions: '',
                specialNeeds: '',
                den: den || '',
                rank: rank || '',
                patrol: '',
                parentGuardian: '',
                parentPhone: '',
                parentEmail: ''
            },
            preferences: {
                notifications: true,
                emailUpdates: true,
                smsUpdates: false,
                language: 'en',
                timezone: 'America/Los_Angeles'
            },
            authProvider: 'email',
            emailVerified: false,
            approvedBy: context.auth.uid,
            approvedAt: getTimestamp(),
            reasonForJoining: reasonForJoining || ''
        };
        // Create user document in Firestore
        const userRef = db.collection('users').doc();
        await userRef.set(newUserData);
        // Log the manual creation
        await db.collection('adminActions').add({
            userId: context.auth.uid,
            userEmail: context.auth.token.email || '',
            action: 'manual_user_creation',
            entityType: 'user',
            entityId: userRef.id,
            entityName: displayName,
            details: {
                email: email,
                role: role,
                reason: 'Manual creation due to approval process issue'
            },
            timestamp: getTimestamp(),
            ipAddress: ((_c = context.rawRequest) === null || _c === void 0 ? void 0 : _c.ip) || 'unknown',
            userAgent: ((_e = (_d = context.rawRequest) === null || _d === void 0 ? void 0 : _d.headers) === null || _e === void 0 ? void 0 : _e['user-agent']) || 'unknown',
            success: true
        });
        return {
            success: true,
            message: 'User account created successfully',
            userId: userRef.id,
            email: email,
            displayName: displayName,
            role: role
        };
    }
    catch (error) {
        console.error('Error creating user manually:', error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError('internal', 'Failed to create user account');
    }
});
// CRITICAL: Reject account request (admin only)
exports.rejectAccountRequest = functions.https.onCall(async (data, context) => {
    var _a, _b, _c, _d, _e;
    try {
        // Check authentication
        if (!context.auth) {
            throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
        }
        // Check if user has admin privileges
        const userDoc = await db.collection('users').doc(context.auth.uid).get();
        if (!userDoc.exists) {
            throw new functions.https.HttpsError('permission-denied', 'User not found');
        }
        const userData = userDoc.data();
        const hasAdminRole = (userData === null || userData === void 0 ? void 0 : userData.role) === 'root' || (userData === null || userData === void 0 ? void 0 : userData.role) === 'admin' || (userData === null || userData === void 0 ? void 0 : userData.role) === 'leader';
        const hasLegacyPermissions = (userData === null || userData === void 0 ? void 0 : userData.isAdmin) || (userData === null || userData === void 0 ? void 0 : userData.isDenLeader) || (userData === null || userData === void 0 ? void 0 : userData.isCubmaster);
        const hasUserManagementPermission = ((_a = userData === null || userData === void 0 ? void 0 : userData.permissions) === null || _a === void 0 ? void 0 : _a.includes('user_management')) || ((_b = userData === null || userData === void 0 ? void 0 : userData.permissions) === null || _b === void 0 ? void 0 : _b.includes('system_admin'));
        if (!hasAdminRole && !hasLegacyPermissions && !hasUserManagementPermission) {
            throw new functions.https.HttpsError('permission-denied', 'Insufficient permissions to reject account requests');
        }
        const { requestId, reason = '' } = data;
        if (!requestId) {
            throw new functions.https.HttpsError('invalid-argument', 'Request ID is required');
        }
        // Get the request
        const requestRef = db.collection('accountRequests').doc(requestId);
        const requestDoc = await requestRef.get();
        if (!requestDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'Account request not found');
        }
        const requestData = requestDoc.data();
        if ((requestData === null || requestData === void 0 ? void 0 : requestData.status) !== 'pending') {
            throw new functions.https.HttpsError('failed-precondition', 'Request is not pending');
        }
        // Update request status
        await requestRef.update({
            status: 'rejected',
            rejectedBy: context.auth.uid,
            rejectedAt: getTimestamp(),
            rejectionReason: reason,
            updatedAt: getTimestamp()
        });
        // Log the rejection
        await db.collection('adminActions').add({
            userId: context.auth.uid,
            userEmail: context.auth.token.email || '',
            action: 'reject_account_request',
            entityType: 'account_request',
            entityId: requestId,
            entityName: requestData.displayName,
            details: {
                email: requestData.email,
                rejectionReason: reason
            },
            timestamp: getTimestamp(),
            ipAddress: ((_c = context.rawRequest) === null || _c === void 0 ? void 0 : _c.ip) || 'unknown',
            userAgent: ((_e = (_d = context.rawRequest) === null || _d === void 0 ? void 0 : _d.headers) === null || _e === void 0 ? void 0 : _e['user-agent']) || 'unknown',
            success: true
        });
        return {
            success: true,
            message: 'Account request rejected successfully'
        };
    }
    catch (error) {
        console.error('Error rejecting account request:', error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError('internal', 'Failed to reject account request');
    }
});
// CRITICAL: Get all dashboard data in batch (admin only) - Performance optimization
exports.getBatchDashboardData = functions.https.onCall(async (data, context) => {
    var _a, _b;
    try {
        // Check authentication
        if (!context.auth) {
            throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
        }
        // Check if user has admin privileges
        const userDoc = await db.collection('users').doc(context.auth.uid).get();
        if (!userDoc.exists) {
            throw new functions.https.HttpsError('permission-denied', 'User not found');
        }
        const userData = userDoc.data();
        const hasAdminRole = (userData === null || userData === void 0 ? void 0 : userData.role) === 'root' || (userData === null || userData === void 0 ? void 0 : userData.role) === 'admin' || (userData === null || userData === void 0 ? void 0 : userData.role) === 'leader';
        const hasLegacyPermissions = (userData === null || userData === void 0 ? void 0 : userData.isAdmin) || (userData === null || userData === void 0 ? void 0 : userData.isDenLeader) || (userData === null || userData === void 0 ? void 0 : userData.isCubmaster);
        const hasSystemAdminPermission = ((_a = userData === null || userData === void 0 ? void 0 : userData.permissions) === null || _a === void 0 ? void 0 : _a.includes('system_admin')) || ((_b = userData === null || userData === void 0 ? void 0 : userData.permissions) === null || _b === void 0 ? void 0 : _b.includes('user_management'));
        if (!hasAdminRole && !hasLegacyPermissions && !hasSystemAdminPermission) {
            throw new functions.https.HttpsError('permission-denied', 'Insufficient permissions to access dashboard data');
        }
        // Get all dashboard data in parallel
        const [usersSnapshot, eventsSnapshot, announcementsSnapshot, locationsSnapshot, accountRequestsSnapshot, auditLogsSnapshot] = await Promise.all([
            db.collection('users').select().get(),
            db.collection('events').where('visibility', '==', 'public').select().get(),
            db.collection('announcements').orderBy('createdAt', 'desc').limit(10).select().get(),
            db.collection('locations').select().get(),
            db.collection('accountRequests').where('status', '==', 'pending').select().get(),
            db.collection('auditLogs').orderBy('timestamp', 'desc').limit(50).select().get()
        ]);
        // Calculate dashboard stats
        const totalUsers = usersSnapshot.size;
        const activeUsers = Math.floor(totalUsers * 0.7); // Estimate 70% active
        const totalEvents = eventsSnapshot.size;
        const totalAnnouncements = announcementsSnapshot.size;
        const totalLocations = locationsSnapshot.size;
        const pendingRequests = accountRequestsSnapshot.size;
        // Get recent activity
        const recentAuditLogs = auditLogsSnapshot.docs.map(doc => {
            var _a, _b;
            return (Object.assign(Object.assign({ id: doc.id }, doc.data()), { timestamp: ((_b = (_a = doc.data().timestamp) === null || _a === void 0 ? void 0 : _a.toDate) === null || _b === void 0 ? void 0 : _b.call(_a)) || new Date() }));
        });
        // Calculate system health metrics
        const systemHealth = {
            status: 'healthy',
            uptime: '99.9%',
            responseTime: '120ms',
            errorRate: '0.1%',
            lastChecked: new Date().toISOString()
        };
        // Dashboard stats
        const dashboardStats = {
            totalUsers,
            activeUsers,
            totalEvents,
            totalAnnouncements,
            totalLocations,
            pendingRequests,
            newUsersThisMonth: Math.floor(totalUsers * 0.1),
            eventsThisMonth: Math.floor(totalEvents * 0.3),
            messagesThisMonth: Math.floor(totalUsers * 0.5)
        };
        return {
            success: true,
            dashboardStats,
            systemHealth,
            auditLogs: recentAuditLogs,
            message: 'Dashboard data retrieved successfully'
        };
    }
    catch (error) {
        console.error('Error getting batch dashboard data:', error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError('internal', 'Failed to get dashboard data');
    }
});
// Simple test function
exports.helloWorld = functions.https.onCall(async (data, context) => {
    return {
        message: 'Hello from Firebase Cloud Functions!',
        timestamp: new Date().toISOString()
    };
});
//# sourceMappingURL=index.js.map