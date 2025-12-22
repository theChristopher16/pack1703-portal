"use strict";
/**
 * Stream Chat Integration for Copse
 *
 * Provides secure token generation for Stream Chat authentication
 * Must be configured with STREAM_API_KEY and STREAM_API_SECRET
 */
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.addUserToOrganizationChannels = exports.createStreamChatChannel = exports.generateStreamChatToken = void 0;
const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");
const stream_chat_1 = require("stream-chat");
// Initialize Stream Chat (server-side)
// TODO: Add STREAM_API_KEY and STREAM_API_SECRET to Firebase Functions config
const apiKey = (_a = functions.config().stream) === null || _a === void 0 ? void 0 : _a.api_key;
const apiSecret = (_b = functions.config().stream) === null || _b === void 0 ? void 0 : _b.api_secret;
/**
 * Generate Stream Chat token for authenticated user
 *
 * Usage from iOS:
 *   let functions = Functions.functions()
 *   let result = try await functions.httpsCallable("generateStreamChatToken").call()
 *   let token = result.data as! String
 */
exports.generateStreamChatToken = functions.https.onCall(async (data, context) => {
    // Verify user is authenticated
    if (!context || !context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated to generate Stream Chat token');
    }
    // Check if Stream Chat is configured
    if (!apiKey || !apiSecret) {
        console.error('Stream Chat not configured. Run: firebase functions:config:set stream.api_key="YOUR_KEY" stream.api_secret="YOUR_SECRET"');
        throw new functions.https.HttpsError('failed-precondition', 'Stream Chat is not configured');
    }
    try {
        const userId = context.auth.uid;
        // Initialize Stream Chat server client
        const serverClient = stream_chat_1.StreamChat.getInstance(apiKey, apiSecret);
        // Get user data from Firebase Auth
        const userRecord = await admin.auth().getUser(userId);
        // Get additional user data from Firestore if needed
        const userDoc = await admin.firestore().collection('users').doc(userId).get();
        const userData = userDoc.data();
        // Create or update Stream Chat user
        await serverClient.upsertUser({
            id: userId,
            name: userRecord.displayName || userRecord.email || 'User',
            image: userRecord.photoURL,
            role: 'user',
            // Add custom data
            email: userRecord.email,
            firebase_uid: userId,
            organization_ids: (userData === null || userData === void 0 ? void 0 : userData.organizationIds) || [],
        });
        // Generate token for this user
        const token = serverClient.createToken(userId);
        console.log(`Generated Stream Chat token for user: ${userId}`);
        return {
            token,
            userId,
            apiKey
        };
    }
    catch (error) {
        console.error('Error generating Stream Chat token:', error);
        throw new functions.https.HttpsError('internal', 'Failed to generate Stream Chat token');
    }
});
/**
 * Create a channel for an organization
 *
 * Only admins and den leaders can create channels
 */
exports.createStreamChatChannel = functions.https.onCall(async (data, context) => {
    var _a;
    // Verify authentication
    if (!context || !context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
    }
    // Verify user has permission (admin, den leader, or cubmaster)
    const userDoc = await admin.firestore().collection('users').doc(context.auth.uid).get();
    const userRole = (_a = userDoc.data()) === null || _a === void 0 ? void 0 : _a.role;
    if (!['admin', 'den-leader', 'cubmaster'].includes(userRole)) {
        throw new functions.https.HttpsError('permission-denied', 'Only admins and den leaders can create channels');
    }
    const channelType = data.channelType || 'messaging';
    const channelId = data.channelId;
    const channelName = data.channelName;
    const organizationId = data.organizationId;
    const members = data.members || [];
    const customData = data.customData || {};
    try {
        const serverClient = stream_chat_1.StreamChat.getInstance(apiKey, apiSecret);
        // Create the channel
        const channel = serverClient.channel(channelType, channelId, Object.assign({ name: channelName, created_by_id: context.auth.uid, organization_id: organizationId }, customData));
        // Add members
        await channel.create();
        if (members.length > 0) {
            await channel.addMembers(members);
        }
        console.log(`Created channel: ${channelId} for org: ${organizationId}`);
        return {
            channelId: channel.id,
            channelCid: channel.cid
        };
    }
    catch (error) {
        console.error('Error creating channel:', error);
        throw new functions.https.HttpsError('internal', 'Failed to create channel');
    }
});
/**
 * Automatically add users to organization channels when they join
 *
 * Triggered when a user is added to an organization
 */
exports.addUserToOrganizationChannels = functions.firestore
    .document('crossOrganizationUsers/{docId}')
    .onCreate(async (snapshot, context) => {
    const data = snapshot.data();
    const { userId, organizationId, isActive } = data;
    if (!isActive) {
        return;
    }
    try {
        const serverClient = stream_chat_1.StreamChat.getInstance(apiKey, apiSecret);
        // Get all channels for this organization
        const filter = {
            type: 'messaging',
            organization_id: organizationId
        };
        const channels = await serverClient.queryChannels(filter);
        // Add user to all organization channels
        for (const channel of channels) {
            try {
                await channel.addMembers([userId]);
                console.log(`Added user ${userId} to channel ${channel.id}`);
            }
            catch (error) {
                console.error(`Failed to add user to channel ${channel.id}:`, error);
            }
        }
    }
    catch (error) {
        console.error('Error adding user to organization channels:', error);
    }
});
/**
 * Setup instructions for Firebase Functions config:
 *
 * 1. Get your Stream Chat credentials from https://getstream.io/dashboard/
 *
 * 2. Set Firebase Functions config:
 *    firebase functions:config:set stream.api_key="YOUR_STREAM_API_KEY"
 *    firebase functions:config:set stream.api_secret="YOUR_STREAM_API_SECRET"
 *
 * 3. Deploy functions:
 *    firebase deploy --only functions:generateStreamChatToken,functions:createStreamChatChannel
 *
 * 4. Test from iOS app - the token will be securely generated on the server
 */
//# sourceMappingURL=streamChat.js.map