"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.helloWorld = exports.submitRSVP = exports.adminCreateEvent = exports.adminUpdateEvent = exports.updateUserRole = void 0;
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
// CRITICAL: Update user role function
exports.updateUserRole = functions.https.onCall(async (data, context) => {
    try {
        const { userId, newRole, email } = data;
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
exports.adminUpdateEvent = functions.https.onCall(async (request) => {
    var _a;
    try {
        const data = request.data;
        const context = request;
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
// CRITICAL: Submit RSVP function
exports.submitRSVP = functions.https.onCall(async (data, context) => {
    try {
        // Check authentication
        if (!context.auth) {
            throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
        }
        // Create RSVP submission
        const rsvpData = Object.assign(Object.assign({}, data), { userId: context.auth.uid, userEmail: context.auth.token.email, submittedAt: getTimestamp() });
        const rsvpRef = await db.collection('rsvps').add(rsvpData);
        return {
            success: true,
            rsvpId: rsvpRef.id,
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
// Simple test function
exports.helloWorld = functions.https.onCall(async (data, context) => {
    return {
        message: 'Hello from Firebase Cloud Functions!',
        timestamp: new Date().toISOString()
    };
});
//# sourceMappingURL=emergency-functions%202.js.map