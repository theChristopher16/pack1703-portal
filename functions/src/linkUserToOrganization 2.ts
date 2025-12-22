import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';

/**
 * Link a user to an organization in the crossOrganizationUsers collection
 * This is needed for the cross-org sync service to discover user's organizations
 */
export const linkUserToOrganization = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
  // Verify authentication
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  // Only super admins can link users
  if (context.auth.token.super !== true && context.auth.token.super_admin !== true) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Only super admins can link users to organizations'
    );
  }

  const { userId, organizationId, role } = data;

  if (!userId || !organizationId) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'userId and organizationId are required'
    );
  }

  try {
    const db = admin.firestore();

    // Get organization details
    const orgDoc = await db.collection('organizations').doc(organizationId).get();
    if (!orgDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Organization not found');
    }

    const orgData = orgDoc.data()!;

    // Check if link already exists
    const existingQuery = await db
      .collection('crossOrganizationUsers')
      .where('userId', '==', userId)
      .where('organizationId', '==', organizationId)
      .get();

    if (!existingQuery.empty) {
      return {
        success: true,
        message: 'User is already linked to this organization',
        existingLinkId: existingQuery.docs[0].id,
      };
    }

    // Create crossOrganizationUsers record
    const crossOrgRef = await db.collection('crossOrganizationUsers').add({
      userId,
      organizationId,
      organizationName: orgData.name,
      organizationType: orgData.orgType || 'general',
      role: role || 'member',
      isActive: true,
      joinedAt: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {
      success: true,
      message: `User linked to ${orgData.name} successfully`,
      linkId: crossOrgRef.id,
      organizationName: orgData.name,
    };
  } catch (error: any) {
    console.error('Error linking user to organization:', error);
    throw new functions.https.HttpsError('internal', error.message || 'Failed to link user');
  }
});

/**
 * Auto-link user to Pack 1703 if they have RSVPs but no crossOrganizationUsers record
 * Can be called by the user themselves to fix their own account
 */
export const autoLinkToPack1703 = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = context.auth.uid;

  try {
    const db = admin.firestore();

    // Find Pack 1703 organization
    const pack1703Query = await db.collection('organizations').where('slug', '==', 'pack1703').get();

    if (pack1703Query.empty) {
      throw new functions.https.HttpsError('not-found', 'Pack 1703 organization not found');
    }

    const pack1703Doc = pack1703Query.docs[0];
    const pack1703Id = pack1703Doc.id;
    const pack1703Data = pack1703Doc.data();

    // Check if user has RSVPs to Pack 1703 events
    const rsvpsQuery = await db.collection('rsvps').where('userId', '==', userId).limit(1).get();

    if (rsvpsQuery.empty) {
      return {
        success: false,
        message: 'No RSVPs found. Cannot auto-link without evidence of membership.',
      };
    }

    // Check if already linked
    const existingQuery = await db
      .collection('crossOrganizationUsers')
      .where('userId', '==', userId)
      .where('organizationId', '==', pack1703Id)
      .get();

    if (!existingQuery.empty) {
      return {
        success: true,
        message: 'Already linked to Pack 1703',
        existingLinkId: existingQuery.docs[0].id,
      };
    }

    // Get user's role from users collection
    const userDoc = await db.collection('users').doc(userId).get();
    const userRole = userDoc.exists ? userDoc.data()?.role || 'parent' : 'parent';

    // Create the link
    const crossOrgRef = await db.collection('crossOrganizationUsers').add({
      userId,
      organizationId: pack1703Id,
      organizationName: pack1703Data.name,
      organizationType: pack1703Data.orgType || 'pack',
      role: userRole,
      isActive: true,
      joinedAt: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {
      success: true,
      message: 'Successfully linked to Pack 1703!',
      linkId: crossOrgRef.id,
      organizationName: pack1703Data.name,
    };
  } catch (error: any) {
    console.error('Error auto-linking to Pack 1703:', error);
    throw new functions.https.HttpsError('internal', error.message || 'Failed to auto-link');
  }
});

