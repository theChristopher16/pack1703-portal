"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAuditLogs = exports.getPendingUsers = exports.approveUser = exports.createPendingUser = exports.UserStatus = exports.UserRole = void 0;
const https_1 = require("firebase-functions/v2/https");
const auth_1 = require("firebase-admin/auth");
const firestore_1 = require("firebase-admin/firestore");
const firebase_functions_1 = require("firebase-functions");
// User roles enum
var UserRole;
(function (UserRole) {
    UserRole["PARENT"] = "parent";
    UserRole["LEADER"] = "leader";
    UserRole["ADMIN"] = "admin";
})(UserRole || (exports.UserRole = UserRole = {}));
// User status enum
var UserStatus;
(function (UserStatus) {
    UserStatus["PENDING"] = "pending";
    UserStatus["APPROVED"] = "approved";
    UserStatus["DENIED"] = "denied";
})(UserStatus || (exports.UserStatus = UserStatus = {}));
/**
 * Callable function to create a pending user document
 * This should be called after Firebase Auth user creation
 */
exports.createPendingUser = (0, https_1.onCall)(async (request) => {
    const { userId, email, displayName } = request.data;
    if (!userId || !email) {
        throw new Error('Missing required parameters: userId and email');
    }
    try {
        const db = (0, firestore_1.getFirestore)();
        // Check if user document already exists
        const existingDoc = await db.collection('users').doc(userId).get();
        if (existingDoc.exists) {
            firebase_functions_1.logger.info('User document already exists:', userId);
            return { success: true, message: 'User document already exists' };
        }
        // Create user document with pending status
        const userDoc = {
            email: email,
            displayName: displayName || '',
            status: UserStatus.PENDING,
            role: UserRole.PARENT,
            createdAt: firestore_1.FieldValue.serverTimestamp(),
            approvedAt: null,
            approvedBy: null
        };
        // Create the user document in Firestore
        await db.collection('users').doc(userId).set(userDoc);
        firebase_functions_1.logger.info('User document created with pending status:', userId);
        return {
            success: true,
            message: 'User document created successfully',
            userId
        };
    }
    catch (error) {
        firebase_functions_1.logger.error('Error creating user document:', error);
        throw error;
    }
});
/**
 * Callable function for admins to approve or deny users
 */
exports.approveUser = (0, https_1.onCall)(async (request) => {
    var _a;
    const { userId, action, role, reason } = request.data;
    const callerUid = (_a = request.auth) === null || _a === void 0 ? void 0 : _a.uid;
    // Validate input
    if (!userId || !action || !callerUid) {
        throw new Error('Missing required parameters');
    }
    if (!['approve', 'deny'].includes(action)) {
        throw new Error('Invalid action. Must be "approve" or "deny"');
    }
    if (action === 'approve' && !role) {
        throw new Error('Role is required when approving a user');
    }
    if (!Object.values(UserRole).includes(role)) {
        throw new Error('Invalid role');
    }
    try {
        const db = (0, firestore_1.getFirestore)();
        const auth = (0, auth_1.getAuth)();
        // Verify caller is admin
        const callerToken = await auth.getUser(callerUid);
        const callerCustomClaims = callerToken.customClaims;
        if (!(callerCustomClaims === null || callerCustomClaims === void 0 ? void 0 : callerCustomClaims.approved) || (callerCustomClaims === null || callerCustomClaims === void 0 ? void 0 : callerCustomClaims.role) !== UserRole.ADMIN) {
            throw new Error('Unauthorized: Admin access required');
        }
        // Get target user info
        const targetUser = await auth.getUser(userId);
        const userDoc = await db.collection('users').doc(userId).get();
        if (!userDoc.exists) {
            throw new Error('User document not found');
        }
        const userData = userDoc.data();
        // Check if user is already processed
        if (userData.status !== UserStatus.PENDING) {
            throw new Error('User has already been processed');
        }
        const newStatus = action === 'approve' ? UserStatus.APPROVED : UserStatus.DENIED;
        const timestamp = firestore_1.FieldValue.serverTimestamp();
        // Update user document
        const updateData = {
            status: newStatus,
            approvedAt: timestamp,
            approvedBy: callerUid
        };
        if (action === 'approve') {
            updateData.role = role;
        }
        await db.collection('users').doc(userId).update(updateData);
        // Set custom claims for approved users
        if (action === 'approve') {
            await auth.setCustomUserClaims(userId, {
                approved: true,
                role: role
            });
        }
        else {
            // For denied users, delete their Firebase Auth account entirely
            // This prevents them from accessing the system at all
            await auth.deleteUser(userId);
            firebase_functions_1.logger.info(`Firebase Auth user deleted for denied user: ${userId}`);
        }
        // Create audit log
        const auditLog = {
            action: action,
            targetUserId: userId,
            targetUserEmail: targetUser.email || userData.email,
            adminUserId: callerUid,
            adminEmail: callerToken.email || '',
            role: action === 'approve' ? role : undefined,
            timestamp: timestamp,
            reason: reason || null
        };
        await db.collection('adminAuditLogs').add(auditLog);
        firebase_functions_1.logger.info(`User ${action}d:`, {
            userId,
            action,
            role: action === 'approve' ? role : undefined,
            adminId: callerUid
        });
        return {
            success: true,
            message: `User ${action}d successfully`,
            userId,
            status: newStatus,
            role: action === 'approve' ? role : undefined
        };
    }
    catch (error) {
        firebase_functions_1.logger.error('Error in approveUser function:', error);
        throw error;
    }
});
/**
 * Callable function to get pending users (admin only)
 */
exports.getPendingUsers = (0, https_1.onCall)(async (request) => {
    var _a;
    const callerUid = (_a = request.auth) === null || _a === void 0 ? void 0 : _a.uid;
    if (!callerUid) {
        throw new Error('Authentication required');
    }
    try {
        const db = (0, firestore_1.getFirestore)();
        const auth = (0, auth_1.getAuth)();
        firebase_functions_1.logger.info('getPendingUsers called by:', callerUid);
        // Verify caller is admin
        const callerToken = await auth.getUser(callerUid);
        const callerCustomClaims = callerToken.customClaims;
        if (!(callerCustomClaims === null || callerCustomClaims === void 0 ? void 0 : callerCustomClaims.approved) || (callerCustomClaims === null || callerCustomClaims === void 0 ? void 0 : callerCustomClaims.role) !== UserRole.ADMIN) {
            throw new Error('Unauthorized: Admin access required');
        }
        firebase_functions_1.logger.info('Admin verified, getting pending users...');
        // Get pending users
        const pendingUsersSnapshot = await db
            .collection('users')
            .where('status', '==', UserStatus.PENDING)
            .get();
        firebase_functions_1.logger.info(`Found ${pendingUsersSnapshot.docs.length} pending users`);
        const pendingUsers = pendingUsersSnapshot.docs.map(doc => {
            var _a, _b;
            const data = doc.data();
            return Object.assign(Object.assign({ id: doc.id }, data), { 
                // Convert Firestore Timestamps to JavaScript Dates
                createdAt: ((_a = data.createdAt) === null || _a === void 0 ? void 0 : _a.toDate) ? data.createdAt.toDate() : data.createdAt, approvedAt: ((_b = data.approvedAt) === null || _b === void 0 ? void 0 : _b.toDate) ? data.approvedAt.toDate() : data.approvedAt });
        });
        firebase_functions_1.logger.info('Pending users:', pendingUsers);
        return {
            success: true,
            users: pendingUsers
        };
    }
    catch (error) {
        firebase_functions_1.logger.error('Error in getPendingUsers function:', error);
        throw error;
    }
});
/**
 * Callable function to get audit logs (admin only)
 */
exports.getAuditLogs = (0, https_1.onCall)(async (request) => {
    var _a;
    const callerUid = (_a = request.auth) === null || _a === void 0 ? void 0 : _a.uid;
    const { limit = 50 } = request.data || {};
    if (!callerUid) {
        throw new Error('Authentication required');
    }
    try {
        const db = (0, firestore_1.getFirestore)();
        const auth = (0, auth_1.getAuth)();
        // Verify caller is admin
        const callerToken = await auth.getUser(callerUid);
        const callerCustomClaims = callerToken.customClaims;
        if (!(callerCustomClaims === null || callerCustomClaims === void 0 ? void 0 : callerCustomClaims.approved) || (callerCustomClaims === null || callerCustomClaims === void 0 ? void 0 : callerCustomClaims.role) !== UserRole.ADMIN) {
            throw new Error('Unauthorized: Admin access required');
        }
        // Get audit logs
        const auditLogsSnapshot = await db
            .collection('adminAuditLogs')
            .orderBy('timestamp', 'desc')
            .limit(limit)
            .get();
        const auditLogs = auditLogsSnapshot.docs.map(doc => (Object.assign({ id: doc.id }, doc.data())));
        return {
            success: true,
            logs: auditLogs
        };
    }
    catch (error) {
        firebase_functions_1.logger.error('Error in getAuditLogs function:', error);
        throw error;
    }
});
//# sourceMappingURL=userApproval.js.map