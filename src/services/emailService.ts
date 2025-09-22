// EmailService.ts
// Front-end email sender with EmailJS (primary) and Resend/Brevo (fallbacks).
// NOTE: Resend/Brevo often block browser-origin calls; keep them as "best effort"
// and prefer server-side for production.

// ===== Env expectations (React):
// REACT_APP_EMAILJS_SERVICE_ID=service_xxx
// REACT_APP_EMAILJS_TEMPLATE_ID=template_xxx
// REACT_APP_EMAILJS_PUBLIC_KEY=public_xxx           // used as user_id
// REACT_APP_EMAILJS_PRIVATE_KEY=private_xxx         // optional: used as accessToken
// REACT_APP_RESEND_API_KEY=...                      // optional (usually server-side)
// REACT_APP_BREVO_API_KEY=...                       // optional (usually server-side)

export interface EmailData {
  to: string;
  from: string;
  subject: string;
  html: string;
  text: string;

  // optional template variables for invites
  roleDisplay?: string;
  message?: string;
  invitedByName?: string;
  expiresDate?: string;
  inviteUrl?: string;
}

export interface Invite {
  email: string;
  role: string;
  invitedByName?: string;
  message?: string;
  // Firestore Timestamp | Date | epoch | ISO
  expiresAt?: Date | { toDate: () => Date } | number | string | null;
}

class EmailService {
  private readonly SENDER_EMAIL = 'cubmaster@sfpack1703.com';
  private readonly SENDER_NAME = 'Pack 1703 Cubmaster';

  // ---------- Public API ----------
  async sendEmail(emailData: EmailData): Promise<boolean> {
    try {
      // Try EmailJS first (browser-friendly), then fallbacks
      const pipelines: Array<() => Promise<boolean>> = [
        () => this.sendViaEmailJS(emailData),
        () => this.sendViaResend(emailData),
        () => this.sendViaBrevo(emailData),
      ];

      for (const fn of pipelines) {
        try {
          const ok = await fn();
          if (ok) return true;
        } catch {
          // continue to next service
        }
      }

      // Log a short preview for manual follow-up
      console.log('All email services failed. Preview:', {
        to: emailData.to,
        subject: emailData.subject,
        htmlPreview: (emailData.html || '').slice(0, 200),
        textPreview: (emailData.text || '').slice(0, 200),
      });
      return false;
    } catch (err) {
      console.error('sendEmail fatal error:', err);
      return false;
    }
  }

  async sendInviteEmail(to: string, inviteUrl: string, invite: Invite): Promise<boolean> {
    const roleDisplay = this.humanizeRole(invite?.role);
    const expiresDate = this.formatExpires(invite?.expiresAt);
    const html = this.generateInviteEmailHTML(
      { ...invite, roleDisplay, expiresDate, inviteUrl },
      inviteUrl
    );
    const text = this.generateInviteEmailText(
      { ...invite, roleDisplay, expiresDate, inviteUrl },
      inviteUrl
    );

    return this.sendEmail({
      to,
      from: this.SENDER_EMAIL,
      subject: `You're invited to join Pack 1703!`,
      html,
      text,
      roleDisplay,
      message: invite?.message || '',
      invitedByName: invite?.invitedByName || 'Pack Leadership',
      expiresDate,
      inviteUrl,
    });
  }

  // ---------- Primary: EmailJS ----------
  private async sendViaEmailJS(emailData: EmailData & Record<string, any>): Promise<boolean> {
    const serviceId = process.env.REACT_APP_EMAILJS_SERVICE_ID;
    const templateId = process.env.REACT_APP_EMAILJS_TEMPLATE_ID;
    const publicKey = process.env.REACT_APP_EMAILJS_PUBLIC_KEY;   // MUST be public
    const privateKey = process.env.REACT_APP_EMAILJS_PRIVATE_KEY; // optional accessToken

    if (!serviceId || !templateId || !publicKey) {
      console.log('EmailJS not configured (service/template/public key missing).');
      return false;
    }

    try {
      const body: any = {
        service_id: serviceId,
        template_id: templateId,
        user_id: publicKey, // per EmailJS docs: user_id = PUBLIC KEY
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
          text_content: emailData.text,
        },
      };

      // If you've enabled private key auth in EmailJS settings, include it as accessToken
      if (privateKey) body.accessToken = privateKey;

      const res = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errText = await safeRead(res);
        console.warn('EmailJS error:', res.status, errText);
      }
      return res.ok;
    } catch (err) {
      console.warn('EmailJS request failed:', err);
      return false;
    }
  }

  // ---------- Fallbacks (often require server-side) ----------
  private async sendViaResend(emailData: EmailData): Promise<boolean> {
    const apiKey = process.env.REACT_APP_RESEND_API_KEY;
    if (!apiKey) {
      // Not configured in front-end
      return false;
    }

    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: emailData.from || this.SENDER_EMAIL,
          to: emailData.to,
          subject: emailData.subject,
          html: emailData.html,
          text: emailData.text,
        }),
      });

      if (!res.ok) {
        const errText = await safeRead(res);
        console.warn('Resend error:', res.status, errText);
      }
      return res.ok;
    } catch (err) {
      console.warn('Resend request failed:', err);
      return false;
    }
  }

  private async sendViaBrevo(emailData: EmailData): Promise<boolean> {
    const apiKey = process.env.REACT_APP_BREVO_API_KEY;
    if (!apiKey) {
      // Not configured in front-end
      return false;
    }

    try {
      const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sender: { name: this.SENDER_NAME, email: emailData.from || this.SENDER_EMAIL },
          to: [{ email: emailData.to, name: emailData.to.split('@')[0] }],
          subject: emailData.subject,
          htmlContent: emailData.html,
          textContent: emailData.text,
        }),
      });

      if (!res.ok) {
        const errText = await safeRead(res);
        console.warn('Brevo error:', res.status, errText);
      }
      return res.ok;
    } catch (err) {
      console.warn('Brevo request failed:', err);
      return false;
    }
  }

  // ---------- Templates ----------
  private generateInviteEmailHTML(inv: any, inviteUrl: string): string {
    const roleDisplay = inv?.roleDisplay || 'Member';
    const expiresDate = inv?.expiresDate || '';

    return `<!DOCTYPE html>
<html>
<head>
  <meta charSet="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Join Pack 1703</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #fff; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
    .button { display: inline-block; background: #4CAF50; color: #fff; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
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
      ${inv?.message ? `<p><em>"${escapeHtml(inv.message)}"</em></p>` : ''}

      <p>Invited by: <strong>${inv?.invitedByName || 'Pack Leadership'}</strong></p>
      ${expiresDate ? `<p>This invitation expires on: <strong>${expiresDate}</strong></p>` : ''}

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

      <p>Best regards,<br /><strong>Pack 1703 Leadership</strong></p>
    </div>
    <div class="footer">
      ${inv?.email ? `<p>This invitation was sent to ${inv.email}</p>` : ''}
      <p>If you didn't expect this invitation, please ignore this email.</p>
    </div>
  </div>
</body>
</html>`;
  }

  private generateInviteEmailText(inv: any, inviteUrl: string): string {
    const roleDisplay = inv?.roleDisplay || 'Member';
    const expiresDate = inv?.expiresDate ? `\nThis invitation expires on: ${inv.expiresDate}\n` : '';

    return [
      'Welcome to Pack 1703!',
      '',
      `You've been invited to join Pack 1703 as a ${roleDisplay}.`,
      inv?.message ? `\nMessage: "${inv.message}"` : '',
      `\nInvited by: ${inv?.invitedByName || 'Pack Leadership'}`,
      expiresDate,
      '\nTo join Pack 1703, visit this link:',
      inviteUrl,
      '',
      'Once you join, you\'ll be able to:',
      '- View upcoming events and activities',
      '- Register for events and activities',
      '- Stay connected with other pack members',
      '- Receive important updates and announcements',
      '',
      "We're excited to have you join our pack!",
      '',
      'Best regards,',
      'Pack 1703 Leadership',
      '',
      '---',
      inv?.email ? `This invitation was sent to ${inv.email}` : '',
      "If you didn't expect this invitation, please ignore this email.",
    ].filter(Boolean).join('\n');
  }

  // ---------- Helpers ----------
  private humanizeRole(role?: string): string {
    if (!role) return 'Member';
    return role.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }

  private formatExpires(expiresAt: Invite['expiresAt']): string {
    if (!expiresAt) return '';
    let d: Date;
    if (expiresAt instanceof Date) d = expiresAt;
    else if (typeof expiresAt === 'number' || typeof expiresAt === 'string') d = new Date(expiresAt);
    else if (typeof (expiresAt as any).toDate === 'function') d = (expiresAt as any).toDate();
    else d = new Date(String(expiresAt));
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

async function safeRead(res: Response): Promise<string> {
  try {
    const t = await res.text();
    return t?.slice(0, 800) || '';
  } catch {
    return '';
  }
}

export const emailService = new EmailService();
export default emailService;
