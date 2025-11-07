"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.testAppCheckStatus = void 0;
const functions = require("firebase-functions/v1");
/**
 * Simple test function with no App Check enforcement
 * Used to test if App Check is blocking all Cloud Functions or just specific ones
 */
exports.testAppCheckStatus = functions.https.onCall(async (data, context) => {
    var _a, _b, _c, _d, _e;
    console.log('[testAppCheckStatus] Function called');
    console.log('[testAppCheckStatus] Auth UID:', (_a = context.auth) === null || _a === void 0 ? void 0 : _a.uid);
    console.log('[testAppCheckStatus] App Check Token:', context.app ? 'Present' : 'Not present');
    return {
        success: true,
        message: 'Function executed successfully!',
        timestamp: new Date().toISOString(),
        auth: {
            authenticated: !!context.auth,
            uid: ((_b = context.auth) === null || _b === void 0 ? void 0 : _b.uid) || null,
            email: ((_d = (_c = context.auth) === null || _c === void 0 ? void 0 : _c.token) === null || _d === void 0 ? void 0 : _d.email) || null
        },
        appCheck: {
            hasToken: !!context.app,
            alreadyConsumed: ((_e = context.app) === null || _e === void 0 ? void 0 : _e.alreadyConsumed) || null
        }
    };
});
//# sourceMappingURL=testAppCheck.js.map