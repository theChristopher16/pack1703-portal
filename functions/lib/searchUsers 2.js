"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchUsersForHousehold = void 0;
const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");
/**
 * Search for users to invite to household
 * Returns basic user info (name, email) for approved users only
 */
exports.searchUsersForHousehold = functions.https.onCall(async (data, context) => {
    // Verify user is authenticated
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { searchQuery, excludeEmails } = data;
    if (typeof searchQuery !== 'string') {
        throw new functions.https.HttpsError('invalid-argument', 'Search query must be a string');
    }
    try {
        const query = searchQuery.toLowerCase().trim();
        const db = admin.firestore();
        // Get all approved users
        const usersSnapshot = await db.collection('users')
            .where('status', '==', 'approved')
            .where('isActive', '==', true)
            .get();
        const results = [];
        const excludeEmailsLower = (excludeEmails || []).map((e) => e.toLowerCase());
        usersSnapshot.forEach(doc => {
            var _a, _b, _c, _d, _e, _f, _g, _h;
            const userData = doc.data();
            const email = ((_a = userData.email) === null || _a === void 0 ? void 0 : _a.toLowerCase()) || '';
            // Skip if email is in exclude list
            if (excludeEmailsLower.includes(email)) {
                return;
            }
            const displayName = ((_b = userData.displayName) === null || _b === void 0 ? void 0 : _b.toLowerCase()) || '';
            const firstName = ((_d = (_c = userData.profile) === null || _c === void 0 ? void 0 : _c.firstName) === null || _d === void 0 ? void 0 : _d.toLowerCase()) || '';
            const lastName = ((_f = (_e = userData.profile) === null || _e === void 0 ? void 0 : _e.lastName) === null || _f === void 0 ? void 0 : _f.toLowerCase()) || '';
            // Check if user matches search query
            if (email.includes(query) ||
                displayName.includes(query) ||
                firstName.includes(query) ||
                lastName.includes(query)) {
                results.push({
                    uid: doc.id,
                    email: userData.email,
                    displayName: userData.displayName,
                    profile: {
                        firstName: (_g = userData.profile) === null || _g === void 0 ? void 0 : _g.firstName,
                        lastName: (_h = userData.profile) === null || _h === void 0 ? void 0 : _h.lastName,
                    },
                });
            }
        });
        // Limit results to 10
        return results.slice(0, 10);
    }
    catch (error) {
        console.error('Error searching users:', error);
        throw new functions.https.HttpsError('internal', 'Failed to search users');
    }
});
//# sourceMappingURL=searchUsers.js.map