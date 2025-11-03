"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminNotificationService = exports.AdminNotificationService = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const emailService_1 = require("./emailService");
class AdminNotificationService {
    constructor() {
        this.db = admin.firestore();
    }
    /**
     * Send notification to all admins via email and push notification
     */
    async notifyAdmins(notification) {
        try {
            functions.logger.info(`📢 Sending admin notification:`, notification);
            // Get all admin users
            const admins = await this.getAdminUsers();
            if (admins.length === 0) {
                functions.logger.warn('⚠️ No admin users found to notify');
                return;
            }
            // Send email notifications
            await this.sendEmailNotifications(admins, notification);
            // Send push notifications
            await this.sendPushNotifications(admins, notification);
            // Log notification
            await this.logNotification(notification, admins.length);
            functions.logger.info(`✅ Admin notification sent to ${admins.length} admins`);
        }
        catch (error) {
            functions.logger.error('❌ Error sending admin notifications:', error);
            throw error;
        }
    }
    /**
     * Get all admin and super admin users
     */
    async getAdminUsers() {
        const usersSnapshot = await this.db.collection('users')
            .where('role', 'in', ['admin', 'super_admin', 'root', 'den_leader'])
            .where('status', '==', 'approved')
            .get();
        return usersSnapshot.docs.map(doc => (Object.assign({ id: doc.id }, doc.data())));
    }
    /**
     * Send email notifications to admins
     */
    async sendEmailNotifications(admins, notification) {
        const emailPromises = admins
            .filter(admin => admin.email && admin.emailNotifications !== false)
            .map(async (admin) => {
            const html = this.generateEmailHTML(notification, admin);
            const text = this.generateEmailText(notification);
            return emailService_1.emailService.sendEmail({
                to: admin.email,
                from: 'cubmaster@sfpack1703.com',
                subject: `[Pack 1703 Admin] ${notification.title}`,
                html,
                text
            });
        });
        await Promise.allSettled(emailPromises);
    }
    /**
     * Send push notifications to admins
     */
    async sendPushNotifications(admins, notification) {
        const fcmTokens = [];
        // Get FCM tokens for all admins
        for (const admin of admins) {
            if (admin.fcmToken && admin.pushNotifications !== false) {
                fcmTokens.push(admin.fcmToken);
            }
        }
        if (fcmTokens.length === 0) {
            functions.logger.info('ℹ️ No FCM tokens found for push notifications');
            return;
        }
        // Send push notification using Firebase Cloud Messaging
        const message = {
            tokens: fcmTokens,
            notification: {
                title: notification.title,
                body: notification.message,
            },
            data: Object.assign({ type: notification.type, priority: notification.priority, actionUrl: notification.actionUrl || '/admin/dashboard' }, notification.data),
            webpush: {
                notification: {
                    title: notification.title,
                    body: notification.message,
                    icon: '/logo192.png',
                    badge: '/logo192.png',
                    requireInteraction: notification.priority === 'high',
                    actions: notification.actionUrl ? [
                        {
                            action: 'view',
                            title: 'View Details'
                        },
                        {
                            action: 'dismiss',
                            title: 'Dismiss'
                        }
                    ] : undefined
                },
                fcmOptions: {
                    link: notification.actionUrl || '/admin/dashboard'
                }
            },
            android: {
                priority: notification.priority === 'high' ? 'high' : 'normal',
                notification: {
                    channelId: 'admin-notifications',
                    priority: notification.priority === 'high' ? 'high' : 'default',
                    defaultSound: true,
                    defaultVibrateTimings: true,
                }
            },
            apns: {
                payload: {
                    aps: {
                        sound: 'default',
                        badge: 1,
                    }
                }
            }
        };
        try {
            const response = await admin.messaging().sendEachForMulticast(message);
            functions.logger.info(`✅ Push notifications sent: ${response.successCount} successful, ${response.failureCount} failed`);
            // Clean up invalid tokens
            if (response.failureCount > 0) {
                await this.cleanupInvalidTokens(fcmTokens, response.responses);
            }
        }
        catch (error) {
            functions.logger.error('❌ Error sending push notifications:', error);
        }
    }
    /**
     * Clean up invalid FCM tokens
     */
    async cleanupInvalidTokens(tokens, responses) {
        const batch = this.db.batch();
        let cleanupCount = 0;
        for (let i = 0; i < responses.length; i++) {
            const response = responses[i];
            if (!response.success && response.error) {
                const errorCode = response.error.code;
                if (errorCode === 'messaging/invalid-registration-token' ||
                    errorCode === 'messaging/registration-token-not-registered') {
                    // Find and remove the invalid token
                    const token = tokens[i];
                    const usersWithToken = await this.db.collection('users')
                        .where('fcmToken', '==', token)
                        .limit(1)
                        .get();
                    if (!usersWithToken.empty) {
                        const userRef = usersWithToken.docs[0].ref;
                        batch.update(userRef, { fcmToken: admin.firestore.FieldValue.delete() });
                        cleanupCount++;
                    }
                }
            }
        }
        if (cleanupCount > 0) {
            await batch.commit();
            functions.logger.info(`🧹 Cleaned up ${cleanupCount} invalid FCM tokens`);
        }
    }
    /**
     * Log notification to Firestore for audit trail
     */
    async logNotification(notification, recipientCount) {
        await this.db.collection('adminNotifications').add(Object.assign(Object.assign({}, notification), { recipientCount, sentAt: admin.firestore.FieldValue.serverTimestamp(), status: 'sent' }));
    }
    /**
     * Generate HTML email content
     */
    generateEmailHTML(notification, admin) {
        const priorityColor = notification.priority === 'high' ? '#ef4444' :
            notification.priority === 'normal' ? '#3b82f6' : '#6b7280';
        const actionButton = notification.actionUrl ? `
      <div style="text-align: center; margin: 30px 0;">
        <a href="https://sfpack1703.web.app${notification.actionUrl}" 
           style="display: inline-block; background: ${priorityColor}; color: white; 
                  padding: 12px 30px; text-decoration: none; border-radius: 5px; 
                  font-weight: bold;">
          View Details
        </a>
      </div>
    ` : '';
        return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${notification.title}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, ${priorityColor} 0%, ${priorityColor}dd 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .priority-badge { display: inline-block; background: ${priorityColor}; color: white; padding: 5px 15px; border-radius: 20px; font-size: 12px; font-weight: bold; margin: 10px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          .data-box { background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid ${priorityColor}; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 24px;">🔔 ${notification.title}</h1>
            <div class="priority-badge">${notification.priority.toUpperCase()} PRIORITY</div>
          </div>
          <div class="content">
            <p style="color: #333; font-size: 16px; line-height: 1.6;">
              Hello ${admin.displayName || 'Admin'},
            </p>
            <p style="color: #555; font-size: 16px; line-height: 1.6;">
              ${notification.message}
            </p>
            ${notification.data ? `
              <div class="data-box">
                <h3 style="margin-top: 0; color: #333;">Details:</h3>
                <pre style="margin: 0; white-space: pre-wrap; word-wrap: break-word; font-family: monospace; font-size: 14px; color: #555;">${JSON.stringify(notification.data, null, 2)}</pre>
              </div>
            ` : ''}
            ${actionButton}
            <p style="color: #666; font-size: 14px; margin-top: 30px;">
              This is an automated notification from Pack 1703 Portal.
            </p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Pack 1703. All rights reserved.</p>
            <p style="font-size: 12px;">
              <a href="https://sfpack1703.web.app/settings" style="color: #3b82f6; text-decoration: none;">Manage notification preferences</a>
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
    }
    /**
     * Generate plain text email content
     */
    generateEmailText(notification) {
        return `
${notification.title}
${'='.repeat(notification.title.length)}

Priority: ${notification.priority.toUpperCase()}

${notification.message}

${notification.data ? `
Details:
${JSON.stringify(notification.data, null, 2)}
` : ''}

${notification.actionUrl ? `View details: https://sfpack1703.web.app${notification.actionUrl}` : ''}

---
This is an automated notification from Pack 1703 Portal.
Manage your notification preferences: https://sfpack1703.web.app/settings

© ${new Date().getFullYear()} Pack 1703. All rights reserved.
    `.trim();
    }
}
exports.AdminNotificationService = AdminNotificationService;
exports.adminNotificationService = new AdminNotificationService();
//# sourceMappingURL=adminNotificationService.js.map