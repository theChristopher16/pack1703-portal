"use strict";
// SMS service for Cloud Functions using Twilio
// This service handles sending SMS messages server-side
Object.defineProperty(exports, "__esModule", { value: true });
exports.smsService = void 0;
const functions = require("firebase-functions");
class SMSService {
    constructor() {
        this.SENDER_PHONE = '+1234567890'; // Default Twilio number
        this.SENDER_NAME = 'Pack 1703';
    }
    async sendSMS(smsData) {
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
        }
        catch (error) {
            functions.logger.error('Error sending SMS:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    // Twilio service (primary SMS provider)
    async sendViaTwilio(smsData) {
        var _a, _b, _c;
        try {
            const accountSid = ((_a = functions.config().twilio) === null || _a === void 0 ? void 0 : _a.account_sid) || process.env.TWILIO_ACCOUNT_SID;
            const authToken = ((_b = functions.config().twilio) === null || _b === void 0 ? void 0 : _b.auth_token) || process.env.TWILIO_AUTH_TOKEN;
            const fromNumber = ((_c = functions.config().twilio) === null || _c === void 0 ? void 0 : _c.phone_number) || process.env.TWILIO_PHONE_NUMBER || this.SENDER_PHONE;
            if (!accountSid || !authToken) {
                functions.logger.error('❌ Twilio credentials not configured');
                return { success: false, error: 'Twilio not configured' };
            }
            // Import Twilio dynamically to avoid issues if not installed
            let twilio;
            try {
                twilio = require('twilio');
            }
            catch (error) {
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
        }
        catch (error) {
            functions.logger.error('❌ Twilio SMS error:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Twilio service error'
            };
        }
    }
    async sendAnnouncementSMS(to, announcement) {
        const message = this.generateAnnouncementSMS(announcement);
        return this.sendSMS({
            to,
            message,
            from: this.SENDER_PHONE
        });
    }
    async sendEventReminderSMS(to, event) {
        const message = this.generateEventReminderSMS(event);
        return this.sendSMS({
            to,
            message,
            from: this.SENDER_PHONE
        });
    }
    async sendEmergencySMS(to, emergencyMessage) {
        const message = this.generateEmergencySMS(emergencyMessage);
        return this.sendSMS({
            to,
            message,
            from: this.SENDER_PHONE
        });
    }
    generateAnnouncementSMS(announcement) {
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
    generateEventReminderSMS(event) {
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
    generateEmergencySMS(emergencyMessage) {
        return `🚨 EMERGENCY - Pack 1703: ${emergencyMessage}`;
    }
    // Utility method to format phone numbers
    formatPhoneNumber(phone) {
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
    isValidPhoneNumber(phone) {
        const cleaned = phone.replace(/\D/g, '');
        return cleaned.length >= 10 && cleaned.length <= 15;
    }
}
exports.smsService = new SMSService();
exports.default = exports.smsService;
//# sourceMappingURL=smsService.js.map