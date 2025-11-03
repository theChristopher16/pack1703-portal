import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';
import { adminNotificationService } from './adminNotificationService';

const db = admin.firestore();

/**
 * Trigger when a new RSVP is submitted
 */
export const onRSVPCreate = functions.firestore
  .document('rsvps/{rsvpId}')
  .onCreate(async (snapshot: functions.firestore.QueryDocumentSnapshot, context: functions.EventContext) => {
    try {
      const rsvp = snapshot.data();
      const rsvpId = context.params.rsvpId;
      
      // Get event details
      const eventDoc = await db.collection('events').doc(rsvp.eventId).get();
      const event = eventDoc.data();
      
      // Get user details
      const userDoc = await db.collection('users').doc(rsvp.userId).get();
      const user = userDoc.data();
      
      const attendeeCount = rsvp.attendees?.length || 0;
      const paymentStatus = rsvp.paymentRequired ? ` (Payment: ${rsvp.paymentStatus})` : '';
      
      await adminNotificationService.notifyAdmins({
        type: 'rsvp',
        title: `New RSVP for ${event?.title || 'Event'}`,
        message: `${user?.displayName || rsvp.familyName} has RSVP'd with ${attendeeCount} attendee(s)${paymentStatus}.`,
        priority: rsvp.paymentRequired && rsvp.paymentStatus === 'pending' ? 'high' : 'normal',
        actionUrl: `/events/${rsvp.eventId}`,
        data: {
          eventTitle: event?.title,
          familyName: rsvp.familyName,
          email: rsvp.email,
          phone: rsvp.phone,
          attendees: attendeeCount,
          paymentRequired: rsvp.paymentRequired,
          paymentStatus: rsvp.paymentStatus,
          dietaryRestrictions: rsvp.dietaryRestrictions,
          specialNeeds: rsvp.specialNeeds,
          notes: rsvp.notes
        }
      });
      
      functions.logger.info(`✅ Admin notified of new RSVP: ${rsvpId}`);
    } catch (error) {
      functions.logger.error('❌ Error processing RSVP notification:', error);
    }
  });

/**
 * Trigger when a new chat message is posted
 */
export const onMessageCreate = functions.firestore
  .document('chat-messages/{messageId}')
  .onCreate(async (snapshot: functions.firestore.QueryDocumentSnapshot, context: functions.EventContext) => {
    try {
      const message = snapshot.data();
      const messageId = context.params.messageId;
      
      // Don't notify for AI messages
      if (message.userId === 'ai_solyn' || message.userId === 'ai_nova') {
        return;
      }
      
      // Get channel details
      const channelDoc = await db.collection('chat-channels').doc(message.channelId).get();
      const channel = channelDoc.data();
      
      // Get user details
      const userDoc = await db.collection('users').doc(message.userId).get();
      const user = userDoc.data();
      
      // Check if message mentions @admin or contains urgent keywords
      const messageText = message.message || '';
      const isUrgent = messageText.toLowerCase().includes('@admin') || 
                      messageText.toLowerCase().includes('urgent') ||
                      messageText.toLowerCase().includes('emergency') ||
                      messageText.toLowerCase().includes('help needed');
      
      if (isUrgent) {
        await adminNotificationService.notifyAdmins({
          type: 'message',
          title: `Urgent Message in #${channel?.name || 'chat'}`,
          message: `${user?.displayName || 'A user'} posted: "${messageText.substring(0, 100)}${messageText.length > 100 ? '...' : ''}"`,
          priority: 'high',
          actionUrl: `/chat?channel=${message.channelId}`,
          data: {
            channelName: channel?.name,
            userName: user?.displayName,
            message: messageText,
            timestamp: message.timestamp
          }
        });
        
        functions.logger.info(`✅ Admin notified of urgent message: ${messageId}`);
      }
    } catch (error) {
      functions.logger.error('❌ Error processing message notification:', error);
    }
  });

/**
 * Trigger when a new account request is submitted
 */
export const onAccountRequestCreate = functions.firestore
  .document('accountRequests/{requestId}')
  .onCreate(async (snapshot: functions.firestore.QueryDocumentSnapshot, context: functions.EventContext) => {
    try {
      const request = snapshot.data();
      const requestId = context.params.requestId;
      
      await adminNotificationService.notifyAdmins({
        type: 'account_request',
        title: 'New Account Request',
        message: `${request.displayName || request.firstName + ' ' + request.lastName} (${request.email}) has requested access to Pack 1703 Portal.`,
        priority: 'high',
        actionUrl: `/users`,
        data: {
          name: request.displayName || `${request.firstName} ${request.lastName}`,
          email: request.email,
          phone: request.phone,
          reason: request.reason,
          source: request.source,
          submittedAt: request.submittedAt
        }
      });
      
      functions.logger.info(`✅ Admin notified of new account request: ${requestId}`);
    } catch (error) {
      functions.logger.error('❌ Error processing account request notification:', error);
    }
  });

/**
 * Trigger when new feedback is submitted
 */
export const onFeedbackCreate = functions.firestore
  .document('feedback/{feedbackId}')
  .onCreate(async (snapshot: functions.firestore.QueryDocumentSnapshot, context: functions.EventContext) => {
    try {
      const feedback = snapshot.data();
      const feedbackId = context.params.feedbackId;
      
      // Get user details
      const userDoc = await db.collection('users').doc(feedback.userId).get();
      const user = userDoc.data();
      
      const priority = feedback.priority === 'high' || feedback.type === 'complaint' ? 'high' : 'normal';
      
      await adminNotificationService.notifyAdmins({
        type: 'feedback',
        title: `New ${feedback.type || 'Feedback'} Submitted`,
        message: `${user?.displayName || 'A user'} submitted feedback: "${feedback.message?.substring(0, 100)}${feedback.message?.length > 100 ? '...' : ''}"`,
        priority,
        actionUrl: `/feedback`,
        data: {
          userName: user?.displayName,
          userEmail: user?.email,
          type: feedback.type,
          category: feedback.category,
          priority: feedback.priority,
          message: feedback.message,
          submittedAt: feedback.createdAt
        }
      });
      
      functions.logger.info(`✅ Admin notified of new feedback: ${feedbackId}`);
    } catch (error) {
      functions.logger.error('❌ Error processing feedback notification:', error);
    }
  });

/**
 * Trigger when a new resource is submitted for review
 */
export const onResourceSubmissionCreate = functions.firestore
  .document('resource-submissions/{submissionId}')
  .onCreate(async (snapshot: functions.firestore.QueryDocumentSnapshot, context: functions.EventContext) => {
    try {
      const submission = snapshot.data();
      const submissionId = context.params.submissionId;
      
      // Get user details
      const userDoc = await db.collection('users').doc(submission.submittedBy).get();
      const user = userDoc.data();
      
      await adminNotificationService.notifyAdmins({
        type: 'resource_submission',
        title: 'New Resource Submission',
        message: `${user?.displayName || submission.submittedByName} submitted "${submission.resourceTitle}" for review.`,
        priority: 'normal',
        actionUrl: `/resources`,
        data: {
          submitterName: user?.displayName || submission.submittedByName,
          submitterEmail: user?.email,
          resourceTitle: submission.resourceTitle,
          description: submission.description,
          category: submission.category,
          fileName: submission.fileName,
          submittedAt: submission.submittedAt
        }
      });
      
      functions.logger.info(`✅ Admin notified of new resource submission: ${submissionId}`);
    } catch (error) {
      functions.logger.error('❌ Error processing resource submission notification:', error);
    }
  });

/**
 * Trigger when a new volunteer signup is submitted
 */
export const onVolunteerSignupCreate = functions.firestore
  .document('volunteer-signups/{signupId}')
  .onCreate(async (snapshot: functions.firestore.QueryDocumentSnapshot, context: functions.EventContext) => {
    try {
      const signup = snapshot.data();
      const signupId = context.params.signupId;
      
      // Get volunteer need details
      const needDoc = await db.collection('volunteer-needs').doc(signup.needId).get();
      const need = needDoc.data();
      
      // Get user details
      const userDoc = await db.collection('users').doc(signup.volunteerUserId).get();
      const user = userDoc.data();
      
      await adminNotificationService.notifyAdmins({
        type: 'volunteer_signup',
        title: 'New Volunteer Signup',
        message: `${user?.displayName || signup.volunteerName} signed up to help with "${need?.title || 'volunteer opportunity'}".`,
        priority: 'normal',
        actionUrl: `/volunteer`,
        data: {
          volunteerName: user?.displayName || signup.volunteerName,
          volunteerEmail: user?.email || signup.volunteerEmail,
          volunteerPhone: signup.volunteerPhone,
          opportunityTitle: need?.title,
          hours: signup.hours,
          availability: signup.availability,
          notes: signup.notes,
          signedUpAt: signup.signedUpAt
        }
      });
      
      functions.logger.info(`✅ Admin notified of new volunteer signup: ${signupId}`);
    } catch (error) {
      functions.logger.error('❌ Error processing volunteer signup notification:', error);
    }
  });

/**
 * Trigger when RSVP payment status changes to 'completed'
 */
export const onRSVPPaymentComplete = functions.firestore
  .document('rsvps/{rsvpId}')
  .onUpdate(async (change: functions.Change<functions.firestore.QueryDocumentSnapshot>, context: functions.EventContext) => {
    try {
      const before = change.before.data();
      const after = change.after.data();
      const rsvpId = context.params.rsvpId;
      
      // Check if payment status changed to completed
      if (before.paymentStatus !== 'completed' && after.paymentStatus === 'completed') {
        // Get event details
        const eventDoc = await db.collection('events').doc(after.eventId).get();
        const event = eventDoc.data();
        
        await adminNotificationService.notifyAdmins({
          type: 'rsvp',
          title: `Payment Received for ${event?.title || 'Event'}`,
          message: `${after.familyName} completed payment of $${after.paymentAmount} for their RSVP.`,
          priority: 'normal',
          actionUrl: `/events/${after.eventId}`,
          data: {
            eventTitle: event?.title,
            familyName: after.familyName,
            email: after.email,
            paymentAmount: after.paymentAmount,
            paymentId: after.paymentId,
            attendees: after.attendees?.length || 0
          }
        });
        
        functions.logger.info(`✅ Admin notified of payment completion: ${rsvpId}`);
      }
    } catch (error) {
      functions.logger.error('❌ Error processing payment notification:', error);
    }
  });

