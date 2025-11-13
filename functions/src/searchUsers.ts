import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';

/**
 * Search for users to invite to household
 * Returns basic user info (name, email) for approved users only
 */
export const searchUsersForHousehold = functions.https.onCall(async (data: any, context) => {
  // Verify user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { searchQuery, excludeEmails } = data as { searchQuery: string; excludeEmails?: string[] };

  if (!searchQuery || typeof searchQuery !== 'string') {
    throw new functions.https.HttpsError('invalid-argument', 'Search query is required');
  }

  try {
    const query = searchQuery.toLowerCase().trim();
    const db = admin.firestore();
    
    // Get all approved users
    const usersSnapshot = await db.collection('users')
      .where('status', '==', 'approved')
      .where('isActive', '==', true)
      .get();

    const results: any[] = [];
    const excludeEmailsLower = (excludeEmails || []).map((e: string) => e.toLowerCase());

    usersSnapshot.forEach(doc => {
      const userData = doc.data();
      const email = userData.email?.toLowerCase() || '';
      
      // Skip if email is in exclude list
      if (excludeEmailsLower.includes(email)) {
        return;
      }

      const displayName = userData.displayName?.toLowerCase() || '';
      const firstName = userData.profile?.firstName?.toLowerCase() || '';
      const lastName = userData.profile?.lastName?.toLowerCase() || '';

      // Check if user matches search query
      if (
        email.includes(query) ||
        displayName.includes(query) ||
        firstName.includes(query) ||
        lastName.includes(query)
      ) {
        results.push({
          uid: doc.id,
          email: userData.email,
          displayName: userData.displayName,
          profile: {
            firstName: userData.profile?.firstName,
            lastName: userData.profile?.lastName,
          },
        });
      }
    });

    // Limit results to 10
    return results.slice(0, 10);
  } catch (error: any) {
    console.error('Error searching users:', error);
    throw new functions.https.HttpsError('internal', 'Failed to search users');
  }
});

