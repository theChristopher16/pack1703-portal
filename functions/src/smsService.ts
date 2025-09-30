// SMS service for Cloud Functions using Twilio
// This service handles sending SMS messages server-side

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

interface SMSData {
  to: string;
  message: string;
  from?: string;
}

interface SMSResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

class SMSService {
  private readonly SENDER_PHONE = '+1234567890'; // Default Twilio number
  private readonly SENDER_NAME = 'Pack 1703';

  async sendSMS(smsData: SMSData): Promise<SMSResponse> {
    try {
      functions.logger.info('📱 SMS Service - Sending SMS:', {
        to: smsData.to,
        from: smsData.from || this.SENDER_PHONE,
        messageLength: smsData.message.length
      });

      // Try Twilio first
      const twilioResult = await this.sendViaTwilio(smsData);
      if (twilioResult.success) {
        return twilioResult;
      }

      // Fallback to other services if needed
      functions.logger.warn('📱 Twilio SMS failed, no fallback available');
      return {
        success: false,
        error: 'SMS service unavailable'
      };
    } catch (error) {
      functions.logger.error('Error sending SMS:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Twilio service (primary SMS provider)
  private async sendViaTwilio(smsData: SMSData): Promise<SMSResponse> {
    try {
      const accountSid = functions.config().twilio?.account_sid || process.env.TWILIO_ACCOUNT_SID;
      const authToken = functions.config().twilio?.auth_token || process.env.TWILIO_AUTH_TOKEN;
      const fromNumber = functions.config().twilio?.phone_number || process.env.TWILIO_PHONE_NUMBER || this.SENDER_PHONE;

      if (!accountSid || !authToken) {
        functions.logger.error('❌ Twilio credentials not configured');
        return { success: false, error: 'Twilio not configured' };
      }

      // Import Twilio dynamically to avoid issues if not installed
      let twilio;
      try {
        twilio = require('twilio');
      } catch (error) {
        functions.logger.error('❌ Twilio package not installed');
        return { success: false, error: 'Twilio package not available' };
      }

      const client = twilio(accountSid, authToken);

      const message = await client.messages.create({
        body: smsData.message,
        from: fromNumber,
        to: smsData.to
      });

      functions.logger.info('✅ SMS sent via Twilio:', {
        messageId: message.sid,
        to: smsData.to
      });

      return {
        success: true,
        messageId: message.sid
      };
    } catch (error) {
      functions.logger.error('❌ Twilio SMS error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Twilio service error' 
      };
    }
  }

  async sendAnnouncementSMS(to: string, announcement: any): Promise<SMSResponse> {
    const message = this.generateAnnouncementSMS(announcement);
    
    return this.sendSMS({
      to,
      message,
      from: this.SENDER_PHONE
    });
  }

  async sendEventReminderSMS(to: string, event: any): Promise<SMSResponse> {
    const message = this.generateEventReminderSMS(event);
    
    return this.sendSMS({
      to,
      message,
      from: this.SENDER_PHONE
    });
  }

  async sendEmergencySMS(to: string, emergencyMessage: string): Promise<SMSResponse> {
    const message = this.generateEmergencySMS(emergencyMessage);
    
    return this.sendSMS({
      to,
      message,
      from: this.SENDER_PHONE
    });
  }

  private generateAnnouncementSMS(announcement: any): string {
    const priority = announcement.priority === 'high' ? '🚨 ' : 
                   announcement.priority === 'medium' ? '⚠️ ' : '📢 ';
    
    // SMS has 160 character limit, so we need to be concise
    let message = `${priority}Pack 1703: ${announcement.title}`;
    
    // Add key content if there's room
    const content = announcement.content.replace(/\n/g, ' ').substring(0, 100);
    if (content && message.length + content.length + 3 < 160) {
      message += ` - ${content}`;
    }
    
    // Add contact info if there's room
    if (message.length < 140) {
      message += ' Contact cubmaster@sfpack1703.com for details.';
    }
    
    return message;
  }

  private generateEventReminderSMS(event: any): string {
    const eventDate = new Date(event.date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
    
    let message = `🏕️ Pack 1703 Event: ${event.title} on ${eventDate}`;
    
    if (event.location && message.length + event.location.length + 3 < 160) {
      message += ` at ${event.location}`;
    }
    
    if (message.length < 140) {
      message += ' RSVP required.';
    }
    
    return message;
  }

  private generateEmergencySMS(emergencyMessage: string): string {
    return `🚨 EMERGENCY - Pack 1703: ${emergencyMessage}`;
  }

  // Utility method to format phone numbers
  formatPhoneNumber(phone: string): string {
    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, '');
    
    // Add +1 if it's a 10-digit US number
    if (cleaned.length === 10) {
      return `+1${cleaned}`;
    }
    
    // Add + if it's an 11-digit number starting with 1
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return `+${cleaned}`;
    }
    
    // Return as-is if it already has country code
    return cleaned.startsWith('+') ? cleaned : `+${cleaned}`;
  }

  // Utility method to validate phone numbers
  isValidPhoneNumber(phone: string): boolean {
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length >= 10 && cleaned.length <= 15;
  }
}

export const smsService = new SMSService();
export default smsService;
