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
              <a href="https://sfpack1703.web.app/users" class="action-button">Review User Request</a>
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

To review this request, go to: https://sfpack1703.web.app/users

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
</head>
<body style="margin:0;padding:0;background:#F4F6F7;font-family:Inter,system-ui,sans-serif;">
    <table role="presentation" width="100%" style="background:#F4F6F7;padding:24px 0;">
        <tr><td align="center">
            <table role="presentation" width="640" style="background:#ffffff;border:1px solid #E6EBED;border-radius:14px;overflow:hidden;">
                <!-- Header -->
                <tr>
                    <td style="padding:24px 28px;border-bottom:1px solid #E6EBED;">
                        <div style="font:700 22px/1.2 Inter,system-ui,sans-serif;color:#1C1C1C;">
                            🎉 Welcome to Pack 1703!
                        </div>
                        <div style="font:500 12px/1.4 Inter,system-ui,sans-serif;color:#4C6F7A;">
                            Community • Nature • Technology
                        </div>
                    </td>
                </tr>
                <!-- Content -->
                <tr>
                    <td style="padding:32px 28px;">
                        <h2 style="font:700 24px/1.3 Inter,system-ui,sans-serif;color:#1C1C1C;margin:0 0 16px 0;">
                            Hello ${userData.displayName}!
                        </h2>
                        <p style="font:400 16px/1.6 Inter,system-ui,sans-serif;color:#4C6F7A;margin:16px 0;">
                            Great news! Your account request has been approved and you're now a member of the Pack 1703 Portal.
                        </p>
                        
                        <div style="background:#F4F6F7;border:1px solid #E6EBED;border-radius:8px;padding:16px;margin:24px 0;">
                            <p style="font:600 14px Inter,system-ui,sans-serif;color:#1C1C1C;margin:0 0 8px 0;">Your Account Details:</p>
                            <ul style="font:400 14px/1.6 Inter,system-ui,sans-serif;color:#4C6F7A;margin:0;padding-left:20px;">
                                <li><strong>Name:</strong> ${userData.displayName}</li>
                                <li><strong>Email:</strong> ${userData.email}</li>
                                <li><strong>Role:</strong> ${userData.role || 'Member'}</li>
                                <li><strong>Status:</strong> Active</li>
                            </ul>
                        </div>
                        
                        <div style="text-align:center;margin:24px 0;">
                            <a href="https://pack1703-portal.web.app" 
                               style="background:#6BAA75;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;display:inline-block;font:600 16px Inter,system-ui,sans-serif;">
                                Access Portal
                            </a>
                        </div>
                        
                        <div style="background:#FFF8E1;border:2px solid #F6C945;border-radius:14px;padding:20px;margin:24px 0;">
                            <h3 style="font:700 18px Inter,system-ui,sans-serif;color:#1C1C1C;margin:0 0 12px 0;">🔐 First Time Setup Required</h3>
                            <p style="font:400 14px/1.5 Inter,system-ui,sans-serif;color:#4C6F7A;margin:0 0 16px 0;">
                                To complete your account setup, you need to create a secure password for your account.
                            </p>
                            <div style="text-align:center;">
                                <a href="https://sfpack1703.web.app/password-setup?token=${userData.setupToken}" 
                                   style="background:#4C6F7A;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;display:inline-block;font:600 16px Inter,system-ui,sans-serif;">
                                    Set Your Password
                                </a>
                            </div>
                            <p style="font:400 12px/1.4 Inter,system-ui,sans-serif;color:#6E5720;margin:12px 0 0 0;">
                                <strong>Important:</strong> This link will expire in 24 hours for security reasons.
                            </p>
                        </div>
                        
                        <p style="font:600 16px Inter,system-ui,sans-serif;color:#1C1C1C;margin:24px 0 12px 0;">What's Next?</p>
                        <ol style="font:400 14px/1.6 Inter,system-ui,sans-serif;color:#4C6F7A;margin:0;padding-left:20px;">
                            <li>Set your password using the link above</li>
                            <li>Sign in to your account using your email address and new password</li>
                            <li>Complete your profile information</li>
                            <li>Explore the portal features and upcoming events</li>
                            <li>Connect with other pack members</li>
                        </ol>
                        
                        <p style="font:400 14px/1.5 Inter,system-ui,sans-serif;color:#4C6F7A;margin:24px 0 16px 0;">
                            If you have any questions or need assistance, please don't hesitate to contact the pack leadership.
                        </p>
                        
                        <p style="font:600 16px Inter,system-ui,sans-serif;color:#6BAA75;margin:16px 0 0 0;">
                            Welcome to the Pack 1703 family!
                        </p>
                    </td>
                </tr>
                <!-- Footer Accent -->
                <tr>
                    <td style="height:6px;background:#F6C945;"></td>
                </tr>
                <!-- Footer Text -->
                <tr>
                    <td style="padding:16px 28px;text-align:center;background:#F4F6F7;">
                        <p style="font:400 14px/1.5 Inter,system-ui,sans-serif;color:#4C6F7A;margin:0 0 8px 0;">
                            Best regards,<br>Pack 1703 Leadership Team
                        </p>
                        <p style="font:400 12px/1.4 Inter,system-ui,sans-serif;color:#4C6F7A;margin:0;">
                            &copy; ${new Date().getFullYear()} Pack 1703. All rights reserved.
                        </p>
                    </td>
                </tr>
            </table>
        </td></tr>
    </table>
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

Access Portal: https://pack1703-portal.web.app

🔐 First Time Setup Required
To complete your account setup, you need to create a secure password for your account.

Set Your Password: https://sfpack1703.web.app/password-setup?token=${userData.setupToken}

Important: This link will expire in 24 hours for security reasons.

What's Next?
1. Set your password using the link above
2. Sign in to your account using your email address and new password
3. Complete your profile information
4. Explore the portal features and upcoming events
5. Connect with other pack members

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
</head>
<body style="margin:0;padding:0;background:#F4F6F7;font-family:Inter,system-ui,sans-serif;">
    <table role="presentation" width="100%" style="background:#F4F6F7;padding:24px 0;">
        <tr><td align="center">
            <table role="presentation" width="640" style="background:#ffffff;border:1px solid #E6EBED;border-radius:14px;overflow:hidden;">
                <!-- Header -->
                <tr>
                    <td style="padding:24px 28px;border-bottom:1px solid #E6EBED;">
                        <div style="font:700 22px/1.2 Inter,system-ui,sans-serif;color:#1C1C1C;">
                            Pack 1703 Portal
                        </div>
                        <div style="font:500 12px/1.4 Inter,system-ui,sans-serif;color:#4C6F7A;">
                            Community • Nature • Technology
                        </div>
                    </td>
                </tr>
                <!-- Content -->
                <tr>
                    <td style="padding:32px 28px;">
                        <h2 style="font:700 24px/1.3 Inter,system-ui,sans-serif;color:#1C1C1C;margin:0 0 16px 0;">
                            ${announcement.title}
                        </h2>
                        <div style="font:400 16px/1.6 Inter,system-ui,sans-serif;color:#4C6F7A;margin:20px 0;">
                            ${announcement.content || announcement.body || ''}
                        </div>
                        <div style="margin:32px 0 24px 0;">
                            <a href="https://pack1703-portal.web.app/announcements" 
                               style="background:#6BAA75;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;display:inline-block;font:600 16px Inter,system-ui,sans-serif;">
                                View in Portal
                            </a>
                        </div>
                        <p style="font:400 14px/1.5 Inter,system-ui,sans-serif;color:#4C6F7A;margin:16px 0 0 0;">
                            Stay connected with Pack 1703!
                        </p>
                        <p style="font:400 14px/1.5 Inter,system-ui,sans-serif;color:#4C6F7A;margin:8px 0 0 0;">
                            Best regards,<br>Pack 1703 Leadership Team
                        </p>
                    </td>
                </tr>
                <!-- Footer Accent -->
                <tr>
                    <td style="height:6px;background:#F6C945;"></td>
                </tr>
                <!-- Footer Text -->
                <tr>
                    <td style="padding:16px 28px;text-align:center;background:#F4F6F7;">
                        <p style="font:400 12px/1.4 Inter,system-ui,sans-serif;color:#4C6F7A;margin:0;">
                            &copy; ${new Date().getFullYear()} Pack 1703. All rights reserved.
                        </p>
                    </td>
                </tr>
            </table>
        </td></tr>
    </table>
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