// Simple email service for sending invitation emails
// This can be replaced with SendGrid, Mailgun, or Firebase Extensions

interface EmailData {
  to: string;
  from: string;
  subject: string;
  html: string;
  text: string;
}

class EmailService {
  private readonly SENDER_EMAIL = 'cubmaster@sfpack1703.com';
  private readonly SENDER_NAME = 'Pack 1703 Cubmaster';

  async sendEmail(emailData: EmailData): Promise<boolean> {
    try {
      // For now, we'll use a simple approach that logs the email
      // In production, you'd integrate with a real email service
      
      console.log('📧 Email Service - Sending email:', {
        to: emailData.to,
        from: emailData.from,
        subject: emailData.subject,
        hasHtml: !!emailData.html,
        hasText: !!emailData.text
      });

      // TODO: Replace this with actual email service integration
      // Here are some options:

      // Option 1: SendGrid
      // const sgMail = require('@sendgrid/mail');
      // sgMail.setApiKey(process.env.SENDGRID_API_KEY);
      // await sgMail.send({
      //   to: emailData.to,
      //   from: emailData.from,
      //   subject: emailData.subject,
      //   html: emailData.html,
      //   text: emailData.text
      // });

      // Option 2: Mailgun
      // const formData = new FormData();
      // formData.append('from', emailData.from);
      // formData.append('to', emailData.to);
      // formData.append('subject', emailData.subject);
      // formData.append('html', emailData.html);
      // formData.append('text', emailData.text);
      // await fetch(`https://api.mailgun.net/v3/your-domain.com/messages`, {
      //   method: 'POST',
      //   headers: {
      //     'Authorization': 'Basic ' + btoa('api:' + process.env.MAILGUN_API_KEY)
      //   },
      //   body: formData
      // });

      // Option 3: Firebase Extensions (Email Trigger)
      // This would require setting up the Firebase Extensions for email

      // For now, we'll just log it and return success
      // The admin will see the invite URL in the UI to copy and share manually
      
      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      return false;
    }
  }

  async sendInviteEmail(to: string, inviteUrl: string, invite: any): Promise<boolean> {
    const subject = `You're invited to join Pack 1703!`;
    const htmlContent = this.generateInviteEmailHTML(invite, inviteUrl);
    const textContent = this.generateInviteEmailText(invite, inviteUrl);

    return this.sendEmail({
      to,
      from: this.SENDER_EMAIL,
      subject,
      html: htmlContent,
      text: textContent
    });
  }

  private generateInviteEmailHTML(invite: any, inviteUrl: string): string {
    const roleDisplay = invite.role.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
    const expiresDate = invite.expiresAt.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Join Pack 1703</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #4CAF50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          .role-badge { display: inline-block; background: #e3f2fd; color: #1976d2; padding: 5px 15px; border-radius: 20px; font-weight: bold; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏕️ Welcome to Pack 1703!</h1>
            <p>You've been invited to join our Scout Pack</p>
          </div>
          
          <div class="content">
            <h2>Hello!</h2>
            <p>You've been invited to join <strong>Pack 1703</strong> as a <span class="role-badge">${roleDisplay}</span>.</p>
            
            ${invite.message ? `<p><em>"${invite.message}"</em></p>` : ''}
            
            <p>Invited by: <strong>${invite.invitedByName}</strong></p>
            <p>This invitation expires on: <strong>${expiresDate}</strong></p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${inviteUrl}" class="button">Join Pack 1703</a>
            </div>
            
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background: #f0f0f0; padding: 10px; border-radius: 5px; font-family: monospace;">${inviteUrl}</p>
            
            <p>Once you join, you'll be able to:</p>
            <ul>
              <li>View upcoming events and activities</li>
              <li>Register for events and activities</li>
              <li>Stay connected with other pack members</li>
              <li>Receive important updates and announcements</li>
            </ul>
            
            <p>We're excited to have you join our pack!</p>
            
            <p>Best regards,<br>
            <strong>Pack 1703 Leadership</strong></p>
          </div>
          
          <div class="footer">
            <p>This invitation was sent to ${invite.email}</p>
            <p>If you didn't expect this invitation, please ignore this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generateInviteEmailText(invite: any, inviteUrl: string): string {
    const roleDisplay = invite.role.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
    const expiresDate = invite.expiresAt.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    
    return `
Welcome to Pack 1703!

You've been invited to join Pack 1703 as a ${roleDisplay}.

${invite.message ? `Message: "${invite.message}"` : ''}

Invited by: ${invite.invitedByName}
This invitation expires on: ${expiresDate}

To join Pack 1703, visit this link:
${inviteUrl}

Once you join, you'll be able to:
- View upcoming events and activities
- Register for events and activities
- Stay connected with other pack members
- Receive important updates and announcements

We're excited to have you join our pack!

Best regards,
Pack 1703 Leadership

---
This invitation was sent to ${invite.email}
If you didn't expect this invitation, please ignore this email.
    `.trim();
  }
}

export const emailService = new EmailService();
export default emailService;
