"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailService = void 0;
const firebase_functions_1 = require("firebase-functions");
const functions = require("firebase-functions");
class EmailService {
    constructor() {
        this.SENDER_EMAIL = 'cubmaster@sfpack1703.com';
        this.SENDER_NAME = 'Pack 1703 Cubmaster';
    }
    async sendEmail(emailData) {
        try {
            firebase_functions_1.logger.info('📧 Email Service - Sending email:', {
                to: emailData.to,
                from: emailData.from,
                subject: emailData.subject,
                hasHtml: !!emailData.html,
                hasText: !!emailData.text
            });
            // Try multiple email services in sequence
            const services = [
                () => this.sendViaGoogleWorkspace(emailData),
                () => this.sendViaResend(emailData),
                () => this.sendViaBrevo(emailData),
                () => this.sendViaEmailJS(emailData)
            ];
            for (const service of services) {
                try {
                    const success = await service();
                    if (success) {
                        firebase_functions_1.logger.info(`✅ Email sent successfully to ${emailData.to}`);
                        return true;
                    }
                }
                catch (error) {
                    firebase_functions_1.logger.info('Service failed, trying next...');
                    continue;
                }
            }
            // If all services fail, log for manual sending
            firebase_functions_1.logger.warn('📧 All email services failed. Email content for manual sending:', {
                to: emailData.to,
                subject: emailData.subject,
                html: emailData.html.substring(0, 200) + '...',
                text: emailData.text.substring(0, 200) + '...'
            });
            return false;
        }
        catch (error) {
            firebase_functions_1.logger.error('Error sending email:', error);
            return false;
        }
    }
    // Google Workspace SMTP service
    async sendViaGoogleWorkspace(emailData) {
        var _a, _b;
        try {
            const nodemailer = require('nodemailer');
            const config = functions.config();
            const email = ((_a = config.google) === null || _a === void 0 ? void 0 : _a.workspace_email) || 'cubmaster@sfpack1703.com';
            const password = (_b = config.google) === null || _b === void 0 ? void 0 : _b.workspace_app_password;
            if (!password) {
                firebase_functions_1.logger.warn('❌ Google Workspace app password not configured');
                return false;
            }
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: email,
                    pass: password
                }
            });
            const mailOptions = {
                from: `"${this.SENDER_NAME}" <${this.SENDER_EMAIL}>`,
                to: emailData.to,
                subject: emailData.subject,
                html: emailData.html,
                text: emailData.text
            };
            const result = await transporter.sendMail(mailOptions);
            firebase_functions_1.logger.info('✅ Email sent via Google Workspace:', result.messageId);
            return true;
        }
        catch (error) {
            firebase_functions_1.logger.error('❌ Google Workspace email error:', error);
            return false;
        }
    }
    // Resend service (free tier available)
    async sendViaResend(emailData) {
        try {
            const apiKey = process.env.RESEND_API_KEY;
            if (!apiKey) {
                firebase_functions_1.logger.info('Resend API key not configured');
                return false;
            }
            const response = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    from: emailData.from,
                    to: emailData.to,
                    subject: emailData.subject,
                    html: emailData.html,
                    text: emailData.text
                })
            });
            return response.ok;
        }
        catch (error) {
            firebase_functions_1.logger.info('Resend failed:', error);
            return false;
        }
    }
    // Brevo service (free tier available)
    async sendViaBrevo(emailData) {
        try {
            const apiKey = process.env.BREVO_API_KEY;
            if (!apiKey) {
                firebase_functions_1.logger.info('Brevo API key not configured');
                return false;
            }
            const response = await fetch('https://api.brevo.com/v3/smtp/email', {
                method: 'POST',
                headers: {
                    'api-key': apiKey,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    sender: {
                        name: this.SENDER_NAME,
                        email: emailData.from
                    },
                    to: [{
                            email: emailData.to,
                            name: emailData.to.split('@')[0]
                        }],
                    subject: emailData.subject,
                    htmlContent: emailData.html,
                    textContent: emailData.text
                })
            });
            return response.ok;
        }
        catch (error) {
            firebase_functions_1.logger.info('Brevo failed:', error);
            return false;
        }
    }
    // EmailJS service (free tier available)
    async sendViaEmailJS(emailData) {
        try {
            // Check if EmailJS is configured
            const serviceId = process.env.EMAILJS_SERVICE_ID;
            const templateId = process.env.EMAILJS_TEMPLATE_ID;
            const userId = process.env.EMAILJS_USER_ID;
            if (!serviceId || !templateId || !userId) {
                firebase_functions_1.logger.info('EmailJS not configured - missing environment variables');
                return false;
            }
            const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    service_id: serviceId,
                    template_id: templateId,
                    user_id: userId,
                    template_params: {
                        to_email: emailData.to,
                        to_name: emailData.to.split('@')[0],
                        from_email: emailData.from,
                        subject: emailData.subject,
                        role_display: emailData.roleDisplay || 'Member',
                        message: emailData.message || '',
                        invited_by_name: emailData.invitedByName || 'Pack Leadership',
                        expires_date: emailData.expiresDate || '',
                        invite_url: emailData.inviteUrl || '',
                        html_content: emailData.html,
                        text_content: emailData.text
                    }
                })
            });
            return response.ok;
        }
        catch (error) {
            firebase_functions_1.logger.info('EmailJS failed:', error);
            return false;
        }
    }
    async sendUserApprovalNotification(userData) {
        const subject = `🔔 New User Request - Pack 1703 Portal`;
        const htmlContent = this.generateUserApprovalEmailHTML(userData);
        const textContent = this.generateUserApprovalEmailText(userData);
        return this.sendEmail({
            to: this.SENDER_EMAIL, // Send to cubmaster
            from: this.SENDER_EMAIL,
            subject,
            html: htmlContent,
            text: textContent
        });
    }
    async sendWelcomeEmail(userData) {
        const subject = `🎉 Welcome to Pack 1703 Portal!`;
        const htmlContent = this.generateWelcomeEmailHTML(userData);
        const textContent = this.generateWelcomeEmailText(userData);
        return this.sendEmail({
            to: userData.email, // Send to the user
            from: this.SENDER_EMAIL,
            subject,
            html: htmlContent,
            text: textContent
        });
    }
    async sendAnnouncementEmail(to, announcement) {
        const subject = `📢 Pack 1703 Announcement: ${announcement.title}`;
        const htmlContent = this.generateAnnouncementEmailHTML(announcement);
        const textContent = this.generateAnnouncementEmailText(announcement);
        return this.sendEmail({
            to,
            from: this.SENDER_EMAIL,
            subject,
            html: htmlContent,
            text: textContent
        });
    }
    generateUserApprovalEmailHTML(userData) {
        const requestDate = new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New User Request - Pack 1703</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .user-info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ff6b6b; }
          .action-button { display: inline-block; background: #4CAF50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 10px 5px; }
          .deny-button { background: #f44336; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔔 New User Request</h1>
            <p>Someone wants to join Pack 1703 Portal</p>
          </div>
          
          <div class="content">
            <h2>User Details</h2>
            
            <div class="user-info">
              <p><strong>Name:</strong> ${userData.displayName || 'Not provided'}</p>
              <p><strong>Email:</strong> ${userData.email}</p>
              <p><strong>Request Date:</strong> ${requestDate}</p>
              ${userData.phone ? `<p><strong>Phone:</strong> ${userData.phone}</p>` : ''}
              ${userData.address ? `<p><strong>Address:</strong> ${userData.address}</p>` : ''}
              ${userData.emergencyContact ? `<p><strong>Emergency Contact:</strong> ${userData.emergencyContact}</p>` : ''}
              ${userData.medicalInfo ? `<p><strong>Medical Info:</strong> ${userData.medicalInfo}</p>` : ''}
            </div>
            
            <p>This user has requested access to the Pack 1703 Portal. Please review their information and approve or deny their request.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://sfpack1703.web.app/admin/users" class="action-button">Review User Request</a>
            </div>
            
            <p><strong>Next Steps:</strong></p>
            <ul>
              <li>Review the user's information above</li>
              <li>Click the button above to go to the admin panel</li>
              <li>Approve or deny the user request</li>
              <li>Assign appropriate role and permissions</li>
            </ul>
            
            <p>Best regards,<br>
            <strong>Pack 1703 Portal System</strong></p>
          </div>
          
          <div class="footer">
            <p>This notification was sent because a new user requested access to the Pack 1703 Portal.</p>
            <p>User ID: ${userData.uid || 'Unknown'}</p>
          </div>
        </div>
      </body>
      </html>
    `;
    }
    generateUserApprovalEmailText(userData) {
        const requestDate = new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        return `
New User Request - Pack 1703 Portal

Someone wants to join Pack 1703 Portal

User Details:
- Name: ${userData.displayName || 'Not provided'}
- Email: ${userData.email}
- Request Date: ${requestDate}
${userData.phone ? `- Phone: ${userData.phone}` : ''}
${userData.address ? `- Address: ${userData.address}` : ''}
${userData.emergencyContact ? `- Emergency Contact: ${userData.emergencyContact}` : ''}
${userData.medicalInfo ? `- Medical Info: ${userData.medicalInfo}` : ''}

This user has requested access to the Pack 1703 Portal. Please review their information and approve or deny their request.

To review this request, go to: https://sfpack1703.web.app/admin/users

Next Steps:
1. Review the user's information above
2. Go to the admin panel
3. Approve or deny the user request
4. Assign appropriate role and permissions

Best regards,
Pack 1703 Portal System

---
This notification was sent because a new user requested access to the Pack 1703 Portal.
User ID: ${userData.uid || 'Unknown'}
    `.trim();
    }
    generateWelcomeEmailHTML(userData) {
        return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to Pack 1703 Portal</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #1e40af; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 Welcome to Pack 1703 Portal!</h1>
        </div>
        <div class="content">
            <h2>Hello ${userData.displayName}!</h2>
            
            <p>Great news! Your account request has been approved and you're now a member of the Pack 1703 Portal.</p>
            
            <p><strong>Your Account Details:</strong></p>
            <ul>
                <li><strong>Name:</strong> ${userData.displayName}</li>
                <li><strong>Email:</strong> ${userData.email}</li>
                <li><strong>Role:</strong> ${userData.role || 'Member'}</li>
                <li><strong>Status:</strong> Active</li>
            </ul>
            
            <p>You can now access the portal and enjoy all the features available to members of Pack 1703.</p>
            
            <div style="text-align: center;">
                <a href="https://sfpack1703.com" class="button">Access Portal</a>
            </div>
            
            <p><strong>What's Next?</strong></p>
            <ul>
                <li>Sign in to your account using your email address</li>
                <li>Complete your profile information</li>
                <li>Explore the portal features and upcoming events</li>
                <li>Connect with other pack members</li>
            </ul>
            
            <p>If you have any questions or need assistance, please don't hesitate to contact the pack leadership.</p>
            
            <p>Welcome to the Pack 1703 family!</p>
        </div>
        <div class="footer">
            <p>Best regards,<br>Pack 1703 Leadership Team</p>
            <p>This email was sent because your account was approved for the Pack 1703 Portal.</p>
        </div>
    </div>
</body>
</html>
    `.trim();
    }
    generateWelcomeEmailText(userData) {
        return `
🎉 Welcome to Pack 1703 Portal!

Hello ${userData.displayName}!

Great news! Your account request has been approved and you're now a member of the Pack 1703 Portal.

Your Account Details:
- Name: ${userData.displayName}
- Email: ${userData.email}
- Role: ${userData.role || 'Member'}
- Status: Active

You can now access the portal and enjoy all the features available to members of Pack 1703.

Access Portal: https://sfpack1703.com

What's Next?
1. Sign in to your account using your email address
2. Complete your profile information
3. Explore the portal features and upcoming events
4. Connect with other pack members

If you have any questions or need assistance, please don't hesitate to contact the pack leadership.

Welcome to the Pack 1703 family!

Best regards,
Pack 1703 Leadership Team

This email was sent because your account was approved for the Pack 1703 Portal.
    `.trim();
    }
    generateAnnouncementEmailHTML(announcement) {
        return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Pack 1703 Announcement</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #1e40af; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
        .announcement-title { color: #1e40af; font-size: 1.5em; margin-bottom: 15px; }
        .announcement-content { margin: 20px 0; }
        .footer { text-align: center; font-size: 0.8em; color: #777; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📢 Pack 1703 Announcement</h1>
        </div>
        <div class="content">
            <h2 class="announcement-title">${announcement.title}</h2>
            <div class="announcement-content">
                ${announcement.content || announcement.body || ''}
            </div>
            <p>Stay connected with Pack 1703!</p>
            <p>Best regards,<br>Pack 1703 Leadership Team</p>
        </div>
        <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Pack 1703. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
    `.trim();
    }
    generateAnnouncementEmailText(announcement) {
        return `
Pack 1703 Announcement

${announcement.title}

${announcement.content || announcement.body || ''}

Stay connected with Pack 1703!

Best regards,
Pack 1703 Leadership Team

© ${new Date().getFullYear()} Pack 1703. All rights reserved.
    `.trim();
    }
}
exports.emailService = new EmailService();
exports.default = exports.emailService;
//# sourceMappingURL=emailService.js.map