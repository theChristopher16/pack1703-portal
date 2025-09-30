// SMS service using Twilio for text notifications
// This service handles sending SMS messages to users who have opted in

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
  private readonly SENDER_PHONE = '+1234567890'; // Default Twilio number - should be configured via environment
  private readonly SENDER_NAME = 'Pack 1703';

  async sendSMS(smsData: SMSData): Promise<SMSResponse> {
    try {
      console.log('📱 SMS Service - Sending SMS:', {
        to: smsData.to,
        from: smsData.from || this.SENDER_PHONE,
        messageLength: smsData.message.length
      });

      // Try multiple SMS services in sequence
      const services = [
        () => this.sendViaTwilio(smsData),
        () => this.sendViaCloudFunction(smsData)
      ];

      for (const service of services) {
        try {
          const result = await service();
          if (result.success) {
            console.log(`✅ SMS sent successfully to ${smsData.to}`);
            return result;
          }
        } catch (error) {
          console.log('SMS service failed, trying next...', error);
          continue;
        }
      }

      // If all services fail, log for manual sending
      console.log('📱 All SMS services failed. SMS content for manual sending:', {
        to: smsData.to,
        message: smsData.message.substring(0, 100) + '...'
      });
      
      return {
        success: false,
        error: 'All SMS services failed'
      };
    } catch (error) {
      console.error('Error sending SMS:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Twilio service (primary SMS provider)
  private async sendViaTwilio(smsData: SMSData): Promise<SMSResponse> {
    try {
      const accountSid = process.env.REACT_APP_TWILIO_ACCOUNT_SID;
      const authToken = process.env.REACT_APP_TWILIO_AUTH_TOKEN;
      const fromNumber = process.env.REACT_APP_TWILIO_PHONE_NUMBER || this.SENDER_PHONE;

      if (!accountSid || !authToken) {
        console.log('❌ Twilio credentials not configured');
        return { success: false, error: 'Twilio not configured' };
      }

      // For client-side, we'll use a Cloud Function to send SMS
      // This keeps the Twilio credentials secure on the server
      const response = await fetch('/api/sendSMS', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: smsData.to,
          message: smsData.message,
          from: fromNumber
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ SMS sent via Twilio');
        return {
          success: true,
          messageId: result.messageId
        };
      } else {
        console.log('❌ Twilio SMS failed:', response.statusText);
        return { success: false, error: response.statusText };
      }
    } catch (error) {
      console.log('❌ Twilio SMS error:', error);
      return { success: false, error: 'Twilio service error' };
    }
  }

  // Cloud Function service (fallback)
  private async sendViaCloudFunction(smsData: SMSData): Promise<SMSResponse> {
    try {
      const response = await fetch('/api/sendSMS', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: smsData.to,
          message: smsData.message,
          from: smsData.from || this.SENDER_PHONE
        })
      });

      if (response.ok) {
        const result = await response.json();
        return {
          success: true,
          messageId: result.messageId
        };
      } else {
        return { success: false, error: 'Cloud Function SMS failed' };
      }
    } catch (error) {
      console.log('Cloud Function SMS failed:', error);
      return { success: false, error: 'Cloud Function service error' };
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
