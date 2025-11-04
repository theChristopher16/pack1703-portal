import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';

/**
 * Cloud Function to create or link a GCP billing account for an organization
 * This allows tracking usage per organization
 */
export const createOrganizationBillingAccount = functions.https.onCall(
  async (data: any, context: functions.https.CallableContext) => {
    // Verify authentication
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User must be authenticated'
      );
    }

    // Verify user is super admin
    const userDoc = await admin.firestore().collection('users').doc(context.auth.uid).get();
    const userData = userDoc.data();
    const isSuperAdmin = userData?.role === 'super-admin' || userData?.role === 'root';

    if (!isSuperAdmin) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Only super admins can create billing accounts'
      );
    }

    const { organizationId, organizationName, organizationSlug, billingAccountId } = data;

    if (!organizationId) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Organization ID is required'
      );
    }

    try {
      // If billingAccountId is provided, link to existing billing account
      if (billingAccountId) {
        // Verify billing account exists and is accessible
        // Note: This requires proper GCP permissions and billing API access
        // For now, we'll just store the billing account ID
        
        await admin.firestore().collection('organizations').doc(organizationId).update({
          billingAccountId: billingAccountId,
          billingAccountLinkedAt: admin.firestore.FieldValue.serverTimestamp(),
          billingAccountLinkedBy: context.auth.uid,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        return {
          success: true,
          message: 'Billing account linked successfully',
          billingAccountId: billingAccountId
        };
      } else {
        // Create a new billing account label/identifier
        // Note: Actually creating a billing account requires GCP Billing API access
        // and proper permissions. For now, we'll create a unique identifier
        // that can be linked to a billing account later.
        
        const billingAccountLabel = `org-${organizationSlug || organizationId}-${Date.now()}`;
        
        await admin.firestore().collection('organizations').doc(organizationId).update({
          billingAccountLabel: billingAccountLabel,
          billingAccountCreatedAt: admin.firestore.FieldValue.serverTimestamp(),
          billingAccountCreatedBy: context.auth.uid,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        return {
          success: true,
          message: 'Billing account label created successfully',
          billingAccountLabel: billingAccountLabel,
          note: 'Link this label to a GCP billing account in the GCP Console'
        };
      }
    } catch (error: any) {
      console.error('Error creating/linking billing account:', error);
      throw new functions.https.HttpsError(
        'internal',
        `Failed to create/link billing account: ${error.message}`
      );
    }
  }
);

/**
 * Cloud Function to get organization usage metrics
 * This queries GCP billing data for the organization's billing account
 */
export const getOrganizationUsage = functions.https.onCall(
  async (data: any, context: functions.https.CallableContext) => {
    // Verify authentication
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User must be authenticated'
      );
    }

    const { organizationId } = data;

    if (!organizationId) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Organization ID is required'
      );
    }

    try {
      // Get organization document
      const orgDoc = await admin.firestore().collection('organizations').doc(organizationId).get();
      
      if (!orgDoc.exists) {
        throw new functions.https.HttpsError(
          'not-found',
          'Organization not found'
        );
      }

      const orgData = orgDoc.data();
      const billingAccountId = orgData?.billingAccountId;

      if (!billingAccountId) {
        return {
          success: false,
          message: 'No billing account linked to this organization',
          usage: {
            totalCost: 0,
            period: 'N/A',
            services: []
          }
        };
      }

      // TODO: Query GCP Billing API for usage data
      // This requires:
      // 1. GCP Billing API enabled
      // 2. Proper service account with billing.viewer permissions
      // 3. Billing API client library
      
      // For now, return placeholder data
      return {
        success: true,
        billingAccountId: billingAccountId,
        usage: {
          totalCost: 0,
          currency: 'USD',
          period: {
            start: new Date().toISOString(),
            end: new Date().toISOString()
          },
          services: [],
          note: 'Billing API integration pending'
        }
      };
    } catch (error: any) {
      console.error('Error getting organization usage:', error);
      throw new functions.https.HttpsError(
        'internal',
        `Failed to get organization usage: ${error.message}`
      );
    }
  }
);

