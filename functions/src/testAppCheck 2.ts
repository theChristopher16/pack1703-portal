import * as functions from 'firebase-functions/v1';

/**
 * Simple test function with no App Check enforcement
 * Used to test if App Check is blocking all Cloud Functions or just specific ones
 */
export const testAppCheckStatus = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
  console.log('[testAppCheckStatus] Function called');
  console.log('[testAppCheckStatus] Auth UID:', context.auth?.uid);
  console.log('[testAppCheckStatus] App Check Token:', context.app ? 'Present' : 'Not present');
  
  return {
    success: true,
    message: 'Function executed successfully!',
    timestamp: new Date().toISOString(),
    auth: {
      authenticated: !!context.auth,
      uid: context.auth?.uid || null,
      email: context.auth?.token?.email || null
    },
    appCheck: {
      hasToken: !!context.app,
      alreadyConsumed: context.app?.alreadyConsumed || null
    }
  };
});

