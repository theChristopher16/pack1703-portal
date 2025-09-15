import { onCall } from 'firebase-functions/v2/https';
import { getAuth } from 'firebase-admin/auth';
import { logger } from 'firebase-functions';

export const setAdminClaims = onCall(async (request) => {
  const { userId } = request.data;
  const callerUid = request.auth?.uid;

  if (!callerUid) {
    throw new Error('Authentication required');
  }

  try {
    const auth = getAuth();
    
    // Set custom claims for the specified user
    await auth.setCustomUserClaims(userId, {
      approved: true,
      role: 'admin'
    });
    
    logger.info(`Admin claims set for user: ${userId}`);
    
    return {
      success: true,
      message: 'Admin claims set successfully',
      userId
    };

  } catch (error) {
    logger.error('Error setting admin claims:', error);
    throw error;
  }
});

