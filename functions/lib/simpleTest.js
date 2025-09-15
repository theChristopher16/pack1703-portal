"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.testAuth = void 0;
const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");
// Simple test function to check authentication
exports.testAuth = functions.https.onCall(async (request) => {
    try {
        const context = request;
        // Check authentication
        if (!context.auth) {
            throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
        }
        // Get user data
        const userDoc = await admin.firestore().collection('users').doc(context.auth.uid).get();
        if (!userDoc.exists) {
            throw new functions.https.HttpsError('permission-denied', 'User not found');
        }
        const userData = userDoc.data();
        return {
            success: true,
            message: 'Authentication test successful',
            user: {
                uid: context.auth.uid,
                email: context.auth.token.email,
                role: (userData === null || userData === void 0 ? void 0 : userData.role) || 'unknown',
                isAdmin: (userData === null || userData === void 0 ? void 0 : userData.role) === 'root' || (userData === null || userData === void 0 ? void 0 : userData.role) === 'admin' || (userData === null || userData === void 0 ? void 0 : userData.role) === 'volunteer'
            }
        };
    }
    catch (error) {
        console.error('Test auth error:', error);
        throw new functions.https.HttpsError('internal', `Test failed: ${error}`);
    }
});
//# sourceMappingURL=simpleTest.js.map