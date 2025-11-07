"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.migrateUsersToMultiRole = void 0;
const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");
/**
 * Migration function to convert existing single-role users to multi-role format
 *
 * This function:
 * 1. Reads all users from Firestore
 * 2. For users with only a 'role' field, creates a 'roles' array with that single role
 * 3. Updates Firebase Auth custom claims to include the roles array
 * 4. Maintains backward compatibility by keeping the 'role' field
 */
exports.migrateUsersToMultiRole = functions.https.onCall(async (data, context) => {
    try {
        // Check authentication
        if (!context.auth) {
            throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
        }
        // Only super admins can run migrations
        const db = admin.firestore();
        const userDoc = await db.collection('users').doc(context.auth.uid).get();
        const userData = userDoc.data();
        if ((userData === null || userData === void 0 ? void 0 : userData.role) !== 'super_admin' && (userData === null || userData === void 0 ? void 0 : userData.role) !== 'copse_admin') {
            throw new functions.https.HttpsError('permission-denied', 'Only super admins can run migrations');
        }
        console.log('[migrateUsersToMultiRole] Starting migration...');
        // Get all users
        const usersSnapshot = await db.collection('users').get();
        const migratedUsers = [];
        const skippedUsers = [];
        const errors = [];
        // Use batch writes for efficiency
        let batch = db.batch();
        let batchCount = 0;
        const maxBatchSize = 500; // Firestore batch limit
        for (const userDocSnap of usersSnapshot.docs) {
            const userId = userDocSnap.id;
            const userData = userDocSnap.data();
            try {
                // Skip if user already has roles array
                if (userData.roles && Array.isArray(userData.roles) && userData.roles.length > 0) {
                    console.log(`[migrateUsersToMultiRole] User ${userId} already has roles array, skipping`);
                    skippedUsers.push(userId);
                    continue;
                }
                // Get the current role
                const currentRole = userData.role || 'parent'; // Default to parent if no role
                const rolesArray = [currentRole];
                console.log(`[migrateUsersToMultiRole] Migrating user ${userId} from role '${currentRole}' to roles ${JSON.stringify(rolesArray)}`);
                // Update Firestore document
                const userRef = db.collection('users').doc(userId);
                batch.update(userRef, {
                    roles: rolesArray,
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                });
                // Update Firebase Auth custom claims
                try {
                    await admin.auth().setCustomUserClaims(userId, Object.assign(Object.assign({}, userData.customClaims || {}), { role: currentRole, roles: rolesArray, approved: userData.status === 'approved' || userData.isActive || true }));
                    console.log(`[migrateUsersToMultiRole] Updated custom claims for user ${userId}`);
                }
                catch (authError) {
                    if (authError.code !== 'auth/user-not-found') {
                        console.error(`[migrateUsersToMultiRole] Error updating Auth claims for ${userId}:`, authError);
                        errors.push({ userId, error: `Auth error: ${authError.message}` });
                    }
                    else {
                        console.log(`[migrateUsersToMultiRole] User ${userId} not found in Auth, skipping claims update`);
                    }
                }
                migratedUsers.push(userId);
                batchCount++;
                // Commit batch if we hit the limit
                if (batchCount >= maxBatchSize) {
                    await batch.commit();
                    console.log(`[migrateUsersToMultiRole] Committed batch of ${batchCount} users`);
                    batch = db.batch();
                    batchCount = 0;
                }
            }
            catch (error) {
                console.error(`[migrateUsersToMultiRole] Error migrating user ${userId}:`, error);
                errors.push({ userId, error: error.message });
            }
        }
        // Commit any remaining batch writes
        if (batchCount > 0) {
            await batch.commit();
            console.log(`[migrateUsersToMultiRole] Committed final batch of ${batchCount} users`);
        }
        console.log(`[migrateUsersToMultiRole] Migration complete!`);
        console.log(`[migrateUsersToMultiRole] Migrated: ${migratedUsers.length} users`);
        console.log(`[migrateUsersToMultiRole] Skipped: ${skippedUsers.length} users (already migrated)`);
        console.log(`[migrateUsersToMultiRole] Errors: ${errors.length} errors`);
        return {
            success: true,
            message: 'Multi-role migration completed successfully',
            stats: {
                total: usersSnapshot.size,
                migrated: migratedUsers.length,
                skipped: skippedUsers.length,
                errors: errors.length
            },
            errors: errors.length > 0 ? errors : undefined
        };
    }
    catch (error) {
        console.error('[migrateUsersToMultiRole] Migration failed:', error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError('internal', `Migration failed: ${error.message}`);
    }
});
//# sourceMappingURL=migrateToMultiRole.js.map