// Email service using a working email API
// Since Zoho SMTP requires server-side implementation, we'll use a browser-compatible service

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
      console.log('📧 Email Service - Sending email:', {
        to: emailData.to,
        from: emailData.from,
        subject: emailData.subject,
        hasHtml: !!emailData.html,
        hasText: !!emailData.text
      });

      // Try multiple email services in sequence
      const services = [
        () => this.sendViaGoogleWorkspace(emailData),
        () => this.sendViaEmailJS(emailData),
        () => this.sendViaResend(emailData),
        () => this.sendViaBrevo(emailData)
      ];

      for (const service of services) {
        try {
          const success = await service();
          if (success) {
            console.log(`✅ Email sent successfully to ${emailData.to}`);
            return true;
          }
        } catch (error) {
          console.log('Service failed, trying next...');
          continue;
        }
      }

      // If all services fail, log for manual sending
      console.log('📧 All email services failed. Email content for manual sending:', {
        to: emailData.to,
        subject: emailData.subject,
        html: emailData.html.substring(0, 200) + '...',
        text: emailData.text.substring(0, 200) + '...'
      });
      return false;
    } catch (error) {
      console.error('Error sending email:', error);
      return false;
    }
  }

  // Google Workspace SMTP service
  private async sendViaGoogleWorkspace(emailData: any): Promise<boolean> {
    try {
      const smtpConfig = {
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
          user: process.env.REACT_APP_GOOGLE_WORKSPACE_EMAIL || 'cubmaster@sfpack1703.com',
          pass: process.env.REACT_APP_GOOGLE_WORKSPACE_APP_PASSWORD
        }
      };

      if (!smtpConfig.auth.pass) {
        console.log('❌ Google Workspace app password not configured');
        return false;
      }

      // For client-side, we'll use EmailJS with Gmail service
      const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          service_id: process.env.REACT_APP_EMAILJS_GMAIL_SERVICE_ID || 'gmail',
          template_id: process.env.REACT_APP_EMAILJS_GMAIL_TEMPLATE_ID || 'template_gmail',
          user_id: process.env.REACT_APP_EMAILJS_USER_ID,
          template_params: {
            to_email: emailData.to,
            to_name: emailData.to.split('@')[0],
            from_email: emailData.from,
            subject: emailData.subject,
            message_html: emailData.html,
            message_text: emailData.text
          }
        })
      });

      if (response.ok) {
        console.log('✅ Email sent via Google Workspace');
        return true;
      } else {
        console.log('❌ Google Workspace email failed:', response.statusText);
        return false;
      }
    } catch (error) {
      console.log('❌ Google Workspace email error:', error);
      return false;
    }
  }

  // EmailJS service (free tier available)
  private async sendViaEmailJS(emailData: any): Promise<boolean> {
    try {
      // Check if EmailJS is configured
      const serviceId = process.env.REACT_APP_EMAILJS_SERVICE_ID;
      const templateId = process.env.REACT_APP_EMAILJS_TEMPLATE_ID;
      const userId = process.env.REACT_APP_EMAILJS_USER_ID;
      
      if (!serviceId || !templateId || !userId) {
        console.log('EmailJS not configured - missing environment variables');
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
    } catch (error) {
      console.log('EmailJS failed:', error);
      return false;
    }
  }

  // Resend service (free tier available)
  private async sendViaResend(emailData: any): Promise<boolean> {
    try {
      const apiKey = process.env.REACT_APP_RESEND_API_KEY;
      if (!apiKey) {
        console.log('Resend API key not configured');
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
    } catch (error) {
      console.log('Resend failed:', error);
      return false;
    }
  }

  // Brevo service (free tier available)
  private async sendViaBrevo(emailData: any): Promise<boolean> {
    try {
      const apiKey = process.env.REACT_APP_BREVO_API_KEY;
      if (!apiKey) {
        console.log('Brevo API key not configured');
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
    } catch (error) {
      console.log('Brevo failed:', error);
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

  async sendAnnouncementEmail(to: string, announcement: any): Promise<boolean> {
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

  async sendUserApprovalNotification(userData: any): Promise<boolean> {
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

  private generateAnnouncementEmailHTML(announcement: any): string {
    const priorityColor = announcement.priority === 'high' ? '#ff4444' : 
                         announcement.priority === 'medium' ? '#ff8800' : '#4CAF50';
    const priorityText = announcement.priority?.toUpperCase() || 'GENERAL';
    const formattedContent = this.formatAnnouncementContent(announcement.content || announcement.body || '');
    
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
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .priority-badge { display: inline-block; background: ${priorityColor}; color: white; padding: 5px 15px; border-radius: 20px; font-weight: bold; margin: 10px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏕️ Pack 1703 Announcement</h1>
            <p>Important information for our Scout families</p>
          </div>
          
          <div class="content">
            <h2>${announcement.title}</h2>
            <div class="priority-badge">${priorityText}</div>
            
            <div style="margin: 20px 0; padding: 15px; background: white; border-radius: 8px; border-left: 4px solid ${priorityColor};">
              ${formattedContent}
            </div>
            
            ${announcement.category ? `<p><strong>Category:</strong> ${announcement.category}</p>` : ''}
            
            <p>Please review this announcement carefully and take any necessary action.</p>
            
            <p>Best regards,<br>
            <strong>Pack 1703 Leadership</strong></p>
          </div>
          
          <div class="footer">
            <p>This announcement was sent to all Pack 1703 families.</p>
            <p>If you have questions, please contact the cubmaster at ${this.SENDER_EMAIL}</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private formatAnnouncementContent(content: string): string {
    if (!content) return '';
    
    // Convert line breaks to HTML
    let formatted = content.replace(/\n/g, '<br>');
    
    // Convert bullet points (• or - or *) to proper HTML lists
    // Handle different bullet styles
    formatted = formatted.replace(/(?:^|<br>)(\s*)(?:•|[-*])\s+(.+?)(?=<br>|$)/gm, '<br>$1• $2');
    
    // Convert multiple consecutive bullet points into proper lists
    const lines = formatted.split('<br>');
    const processedLines: string[] = [];
    let inList = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const isBulletPoint = /^\s*•\s+/.test(line);
      
      if (isBulletPoint) {
        if (!inList) {
          processedLines.push('<ul style="margin: 8px 0; padding-left: 20px;">');
          inList = true;
        }
        const listItem = line.replace(/^\s*•\s+/, '').trim();
        processedLines.push(`<li style="margin: 4px 0;">${listItem}</li>`);
      } else {
        if (inList) {
          processedLines.push('</ul>');
          inList = false;
        }
        processedLines.push(line);
      }
    }
    
    // Close any remaining list
    if (inList) {
      processedLines.push('</ul>');
    }
    
    return processedLines.join('<br>');
  }

  private generateAnnouncementEmailText(announcement: any): string {
    const priorityText = announcement.priority?.toUpperCase() || 'GENERAL';
    
    return `
Pack 1703 Announcement

${announcement.title}
Priority: ${priorityText}

${announcement.content}

${announcement.category ? `Category: ${announcement.category}` : ''}

Please review this announcement carefully and take any necessary action.

Best regards,
Pack 1703 Leadership

---
This announcement was sent to all Pack 1703 families.
If you have questions, please contact the cubmaster at ${this.SENDER_EMAIL}
    `.trim();
  }

  private generateUserApprovalEmailHTML(userData: any): string {
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
              <a href="${window.location.origin}/admin/users" class="action-button">Review User Request</a>
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

  private generateUserApprovalEmailText(userData: any): string {
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

To review this request, go to: ${window.location.origin}/admin/users

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
}

export const emailService = new EmailService();
export default emailService;
