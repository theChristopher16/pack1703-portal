"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setAdminClaims = void 0;
const https_1 = require("firebase-functions/v2/https");
const auth_1 = require("firebase-admin/auth");
const firebase_functions_1 = require("firebase-functions");
exports.setAdminClaims = (0, https_1.onCall)(async (request) => {
    var _a;
    const { userId } = request.data;
    const callerUid = (_a = request.auth) === null || _a === void 0 ? void 0 : _a.uid;
    if (!callerUid) {
        throw new Error('Authentication required');
    }
    try {
        const auth = (0, auth_1.getAuth)();
        // Set custom claims for the specified user
        await auth.setCustomUserClaims(userId, {
            approved: true,
            role: 'admin'
        });
        firebase_functions_1.logger.info(`Admin claims set for user: ${userId}`);
        return {
            success: true,
            message: 'Admin claims set successfully',
            userId
        };
    }
    catch (error) {
        firebase_functions_1.logger.error('Error setting admin claims:', error);
        throw error;
    }
});
//# sourceMappingURL=setAdminClaims.js.map