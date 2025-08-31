import { getFirestore, collection, addDoc, serverTimestamp, query, where, orderBy, limit as firestoreLimit, getDocs } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { externalApiService } from './externalApiService';
import aiService from './aiService';

interface EmailMessage {
  id: string;
  from: string;
  to: string;
  subject: string;
  body: string;
  date: Date;
  attachments?: EmailAttachment[];
}

interface EmailAttachment {
  name: string;
  type: string;
  size: number;
  content?: string;
}

interface EmailProcessingResult {
  processed: boolean;
  eventCreated?: boolean;
  eventData?: any;
  confidence: number;
  reason: string;
  extractedData?: any;
  detectedTypes?: Array<{ type: string; confidence: number }>;
  hasAttachments?: boolean;
  contentType?: 'event' | 'announcement' | 'resource' | 'volunteer' | 'fundraising';
}

interface EmailConfig {
  emailAddress: string;
  password?: string; // For IMAP
  oauthToken?: string; // For OAuth2
  imapServer: string;
  imapPort: number;
  smtpServer: string;
  smtpPort: number;
  checkInterval: number; // minutes
  autoCreateEvents: boolean;
  notifyOnCreation: boolean;
}

class EmailMonitorService {
  private db = getFirestore();
  private functions = getFunctions();
  private isMonitoring = false;
  private checkInterval: NodeJS.Timeout | null = null;
  private config: EmailConfig;
  private lastChecked: Date | null = null;

  constructor() {
    // Zoho email configuration
    this.config = {
      emailAddress: 'cubmaster@sfpack1703.com',
      password: 'Double_Lake_Wolf33',
      imapServer: 'imappro.zoho.com',
      imapPort: 993,
      smtpServer: 'smtppro.zoho.com',
      smtpPort: 587,
      checkInterval: 5, // Check every 5 minutes
      autoCreateEvents: true,
      notifyOnCreation: true
    };
  }

  // Initialize email monitoring
  async initialize(config?: Partial<EmailConfig>): Promise<boolean> {
    try {
      if (config) {
        this.config = { ...this.config, ...config };
      }

      // Test email connection via cloud function
      const connectionTest = await this.testEmailConnection();
      if (!connectionTest.success) {
        console.error('Email connection failed:', connectionTest.error);
        return false;
      }

      // Start monitoring
      await this.startMonitoring();
      
      // Log initialization
      await this.logEmailActivity('monitor_started', {
        emailAddress: this.config.emailAddress,
        checkInterval: this.config.checkInterval,
        autoCreateEvents: this.config.autoCreateEvents
      });

      return true;
    } catch (error) {
      console.error('Failed to initialize email monitoring:', error);
      return false;
    }
  }

  // Test email connection via cloud function
  private async testEmailConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('Testing email connection to:', this.config.emailAddress);
      
      const testEmailConnection = httpsCallable(this.functions, 'testEmailConnection');
      const result = await testEmailConnection({
        emailAddress: this.config.emailAddress,
        password: this.config.password,
        imapServer: this.config.imapServer,
        imapPort: this.config.imapPort
      });

      const data = result.data as any;
      return { success: data.success, error: data.error };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Start monitoring emails
  async startMonitoring(): Promise<void> {
    if (this.isMonitoring) {
      console.log('Email monitoring already active');
      return;
    }

    this.isMonitoring = true;
    console.log('Starting email monitoring...');

    // Check immediately
    await this.checkNewEmails();

    // Set up periodic checking
    this.checkInterval = setInterval(async () => {
      await this.checkNewEmails();
    }, this.config.checkInterval * 60 * 1000);
  }

  // Stop monitoring emails
  async stopMonitoring(): Promise<void> {
    if (!this.isMonitoring) {
      return;
    }

    this.isMonitoring = false;
    
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }

    await this.logEmailActivity('monitor_stopped', {
      emailAddress: this.config.emailAddress
    });

    console.log('Email monitoring stopped');
  }

  // Check for new emails
  private async checkNewEmails(): Promise<void> {
    try {
      console.log('Checking for new emails...');
      
      // Get emails since last check
      const emails = await this.fetchNewEmails();
      
      if (emails.length === 0) {
        console.log('No new emails found');
        return;
      }

      console.log(`Found ${emails.length} new emails`);

      // Process each email
      for (const email of emails) {
        await this.processEmail(email);
      }

      this.lastChecked = new Date();
      
    } catch (error) {
      console.error('Error checking emails:', error);
      await this.logEmailActivity('check_error', { error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  // Fetch new emails from the server
  private async fetchNewEmails(): Promise<EmailMessage[]> {
    try {
      console.log('Fetching new emails via cloud function...');
      
      const fetchNewEmails = httpsCallable(this.functions, 'fetchNewEmails');
      const result = await fetchNewEmails({
        emailAddress: this.config.emailAddress,
        password: this.config.password,
        imapServer: this.config.imapServer,
        imapPort: this.config.imapPort,
        lastChecked: this.lastChecked
      });

      const data = result.data as any;
      if (data.success) {
        console.log(`Successfully fetched ${data.emails.length} emails`);
        return data.emails.map((email: any) => ({
          id: email.id,
          from: email.from,
          to: email.to,
          subject: email.subject,
          body: email.body,
          date: new Date(email.date),
          attachments: email.attachments || []
        }));
      } else {
        console.error('Failed to fetch emails:', data.error);
        return [];
      }
    } catch (error) {
      console.error('Error in fetchNewEmails:', error);
      return [];
    }
  }

  // Parse email content
  private parseEmail(rawEmail: string): { from: string; to: string; subject: string; body: string; date: Date } {
    const lines = rawEmail.split('\n');
    let from = '';
    let to = '';
    let subject = '';
    let body = '';
    let inBody = false;

    for (const line of lines) {
      if (inBody) {
        body += line + '\n';
        continue;
      }

      if (line.startsWith('From: ')) {
        from = line.substring(6).trim();
      } else if (line.startsWith('To: ')) {
        to = line.substring(4).trim();
      } else if (line.startsWith('Subject: ')) {
        subject = line.substring(9).trim();
      } else if (line.startsWith('Date: ')) {
        // Parse date if needed
      } else if (line === '') {
        // Empty line indicates start of body
        inBody = true;
      }
    }

    return {
      from,
      to,
      subject,
      body: body.trim(),
      date: new Date()
    };
  }

  // Process individual email
  private async processEmail(email: EmailMessage): Promise<void> {
    try {
      console.log(`Processing email: ${email.subject}`);

      // Analyze email content
      const analysis = await this.analyzeEmailContent(email);
      
      // Log email processing
      await this.logEmailActivity('email_processed', {
        emailId: email.id,
        from: email.from,
        subject: email.subject,
        analysis: analysis
      });

      // If email contains event information, create event
      if (analysis.processed && analysis.eventData && this.config.autoCreateEvents) {
        const created = await this.createEventFromEmail(email, analysis);
        
        // Send notification to chat if event was created
        if (created) {
          await this.sendChatNotification(email, analysis);
        }
      }

    } catch (error) {
      console.error('Error processing email:', error);
      await this.logEmailActivity('email_processing_error', {
        emailId: email.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Analyze email content for different types of information
  private async analyzeEmailContent(email: EmailMessage): Promise<EmailProcessingResult> {
    const content = `${email.subject}\n${email.body}`.toLowerCase();
    
    // Enhanced keyword detection for different content types
    const contentTypes = {
      event: {
        keywords: [
          'meeting', 'event', 'camp', 'outing', 'activity', 'gathering',
          'registration', 'deadline', 'date', 'time', 'location', 'venue',
          'campout', 'derby', 'banquet', 'ceremony', 'award', 'recognition'
        ],
        confidence: 0
      },
      announcement: {
        keywords: [
          'announcement', 'update', 'news', 'important', 'reminder',
          'notice', 'information', 'change', 'schedule', 'cancellation'
        ],
        confidence: 0
      },
      resource: {
        keywords: [
          'resource', 'document', 'form', 'guide', 'manual', 'policy',
          'procedure', 'template', 'checklist', 'handbook', 'reference'
        ],
        confidence: 0
      },
      volunteer: {
        keywords: [
          'volunteer', 'help', 'assist', 'support', 'needed', 'opportunity',
          'sign up', 'participate', 'contribute', 'assistance'
        ],
        confidence: 0
      },
      fundraising: {
        keywords: [
          'fundraiser', 'donation', 'money', 'cost', 'fee', 'payment',
          'sponsor', 'support', 'contribution', 'financial'
        ],
        confidence: 0
      }
    };

    // Calculate confidence for each content type
    Object.keys(contentTypes).forEach(type => {
      const typeConfig = contentTypes[type as keyof typeof contentTypes];
      const keywordMatches = typeConfig.keywords.filter(keyword => content.includes(keyword));
      typeConfig.confidence = keywordMatches.length / typeConfig.keywords.length;
    });

    // Check for attachments
    const hasAttachments = email.attachments && email.attachments.length > 0;
    
    // Determine the most likely content type
    const detectedTypes = Object.entries(contentTypes)
      .filter(([_, config]) => config.confidence > 0.2)
      .sort(([_, a], [__, b]) => b.confidence - a.confidence);

    if (detectedTypes.length === 0) {
      return {
        processed: false,
        confidence: 0,
        reason: 'No recognizable content type found',
        detectedTypes: [],
        hasAttachments
      };
    }

    const primaryType = detectedTypes[0][0];
    const primaryConfidence = detectedTypes[0][1].confidence;

    // Process based on content type
    switch (primaryType) {
      case 'event':
        return await this.processEventEmail(email, primaryConfidence, hasAttachments || false);
      case 'announcement':
        return await this.processAnnouncementEmail(email, primaryConfidence, hasAttachments || false);
      case 'resource':
        return await this.processResourceEmail(email, primaryConfidence, hasAttachments || false);
      case 'volunteer':
        return await this.processVolunteerEmail(email, primaryConfidence, hasAttachments || false);
      case 'fundraising':
        return await this.processFundraisingEmail(email, primaryConfidence, hasAttachments || false);
      default:
        return {
          processed: false,
          confidence: primaryConfidence,
          reason: `Unsupported content type: ${primaryType}`,
          detectedTypes: detectedTypes.map(([type, config]) => ({ type, confidence: config.confidence })),
          hasAttachments
        };
    }
  }

  // Process event emails
  private async processEventEmail(email: EmailMessage, confidence: number, hasAttachments: boolean): Promise<EmailProcessingResult> {
    const extractedData = await this.extractEventDataFromEmail(email);
    
    if (!extractedData.title) {
      return {
        processed: false,
        confidence: 0.3,
        reason: 'Event keywords found but no clear event title',
        detectedTypes: [{ type: 'event', confidence }],
        hasAttachments,
        contentType: 'event'
      };
    }

    // Validate extracted data
    const validation = await this.validateExtractedEventData(extractedData);
    
    return {
      processed: true,
      eventCreated: validation.isValid,
      eventData: extractedData,
      confidence: validation.confidence,
      reason: validation.isValid ? 'Valid event information found' : 'Event information incomplete',
      extractedData: extractedData,
      detectedTypes: [{ type: 'event', confidence }],
      hasAttachments,
      contentType: 'event'
    };
  }

  // Process announcement emails
  private async processAnnouncementEmail(email: EmailMessage, confidence: number, hasAttachments: boolean): Promise<EmailProcessingResult> {
    const announcementData = await this.extractAnnouncementDataFromEmail(email);
    
    return {
      processed: true,
      confidence: confidence,
      reason: 'Announcement content detected',
      extractedData: announcementData,
      detectedTypes: [{ type: 'announcement', confidence }],
      hasAttachments,
      contentType: 'announcement'
    };
  }

  // Process resource emails
  private async processResourceEmail(email: EmailMessage, confidence: number, hasAttachments: boolean): Promise<EmailProcessingResult> {
    const resourceData = await this.extractResourceDataFromEmail(email);
    
    return {
      processed: true,
      confidence: confidence,
      reason: 'Resource content detected',
      extractedData: resourceData,
      detectedTypes: [{ type: 'resource', confidence }],
      hasAttachments,
      contentType: 'resource'
    };
  }

  // Process volunteer emails
  private async processVolunteerEmail(email: EmailMessage, confidence: number, hasAttachments: boolean): Promise<EmailProcessingResult> {
    const volunteerData = await this.extractVolunteerDataFromEmail(email);
    
    return {
      processed: true,
      confidence: confidence,
      reason: 'Volunteer opportunity detected',
      extractedData: volunteerData,
      detectedTypes: [{ type: 'volunteer', confidence }],
      hasAttachments,
      contentType: 'volunteer'
    };
  }

  // Process fundraising emails
  private async processFundraisingEmail(email: EmailMessage, confidence: number, hasAttachments: boolean): Promise<EmailProcessingResult> {
    const fundraisingData = await this.extractFundraisingDataFromEmail(email);
    
    return {
      processed: true,
      confidence: confidence,
      reason: 'Fundraising content detected',
      extractedData: fundraisingData,
      detectedTypes: [{ type: 'fundraising', confidence }],
      hasAttachments,
      contentType: 'fundraising'
    };
  }

  // Extract event data from email
  private async extractEventDataFromEmail(email: EmailMessage): Promise<any> {
    const content = `${email.subject}\n${email.body}`;
    
    const eventData: any = {
      title: '',
      description: '',
      startDate: '',
      endDate: '',
      location: {
        name: '',
        address: '',
        city: '',
        state: '',
        zip: ''
      },
      contact: {
        name: '',
        phone: '',
        email: email.from
      },
      details: {
        cost: '',
        maxAttendees: 0,
        requirements: ''
      },
      source: {
        type: 'email',
        emailId: email.id,
        from: email.from,
        subject: email.subject,
        receivedDate: email.date
      }
    };

    // Extract title from subject or body
    const titleMatch = content.match(/(?:event|meeting|activity|camp):\s*([^\n]+)/i) ||
                      content.match(/([^:]+)\s*-\s*(?:march|april|may|june|july|august|september|october|november|december)/i);
    
    if (titleMatch) {
      eventData.title = titleMatch[1].trim();
    } else {
      // Use subject as title if it looks like an event
      if (email.subject.toLowerCase().includes('meeting') || email.subject.toLowerCase().includes('event')) {
        eventData.title = email.subject;
      }
    }

    // Extract date
    const dateMatch = content.match(/(?:date|when):\s*([^\n]+)/i) ||
                     content.match(/(\w+\s+\d{1,2},?\s+\d{4})/i) ||
                     content.match(/(\d{1,2}\/\d{1,2}\/\d{4})/i);
    
    if (dateMatch) {
      eventData.startDate = dateMatch[1].trim();
    }

    // Extract location
    const locationMatch = content.match(/(?:location|venue|where):\s*([^\n]+)/i) ||
                         content.match(/(\d+\s+[^,]+,\s*[^,]+,\s*[A-Z]{2}\s+\d{5})/i);
    
    if (locationMatch) {
      eventData.location.name = locationMatch[1].trim();
    }

    // Extract address
    const addressMatch = content.match(/(\d+\s+[^,]+,\s*[^,]+,\s*[A-Z]{2}\s+\d{5})/i);
    if (addressMatch) {
      eventData.location.address = addressMatch[1].trim();
    }

    // Extract cost
    const costMatch = content.match(/\$(\d+(?:\.\d{2})?)/i);
    if (costMatch) {
      eventData.details.cost = `$${costMatch[1]}`;
    }

    // Extract time
    const timeMatch = content.match(/(\d{1,2}:\d{2}\s*(?:AM|PM))/i);
    if (timeMatch) {
      eventData.startTime = timeMatch[1].trim();
    }

    return eventData;
  }

  // Validate extracted event data
  private async validateExtractedEventData(eventData: any): Promise<{ isValid: boolean; confidence: number; issues: string[] }> {
    const issues: string[] = [];
    let confidence = 0;

    // Check required fields
    if (eventData.title) {
      confidence += 0.3;
    } else {
      issues.push('Missing event title');
    }

    if (eventData.startDate) {
      confidence += 0.3;
    } else {
      issues.push('Missing event date');
    }

    if (eventData.location.name || eventData.location.address) {
      confidence += 0.2;
    } else {
      issues.push('Missing location information');
    }

    // Validate date format
    if (eventData.startDate) {
      const date = new Date(eventData.startDate);
      if (isNaN(date.getTime())) {
        issues.push('Invalid date format');
        confidence -= 0.1;
      } else {
        confidence += 0.1;
      }
    }

    // Validate location if we have coordinates
    if (eventData.location.name || eventData.location.address) {
      try {
        const locationData = await externalApiService.verifyLocation(
          eventData.location.address || eventData.location.name
        );
        
        if (locationData.verified) {
          confidence += 0.1;
          // Update location with verified data
          Object.assign(eventData.location, locationData);
        }
      } catch (error) {
        console.warn('Location validation failed:', error);
      }
    }

    return {
      isValid: confidence >= 0.6 && issues.length <= 2,
      confidence: Math.min(confidence, 1.0),
      issues
    };
  }

  // Extract announcement data from email
  private async extractAnnouncementDataFromEmail(email: EmailMessage): Promise<any> {
    const content = `${email.subject}\n${email.body}`;
    
    const announcementData = {
      title: email.subject,
      content: email.body,
      priority: 'normal',
      category: 'general',
      source: {
        type: 'email',
        emailId: email.id,
        from: email.from,
        subject: email.subject,
        receivedDate: email.date
      }
    };

    // Determine priority based on keywords
    const urgentKeywords = ['urgent', 'important', 'critical', 'immediate', 'asap'];
    const urgentMatch = urgentKeywords.some(keyword => content.toLowerCase().includes(keyword));
    if (urgentMatch) {
      announcementData.priority = 'high';
    }

    // Determine category based on content
    const categoryKeywords = {
      'event': ['event', 'meeting', 'activity'],
      'safety': ['safety', 'emergency', 'alert'],
      'policy': ['policy', 'rule', 'guideline'],
      'schedule': ['schedule', 'timeline', 'deadline']
    };

    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.some(keyword => content.toLowerCase().includes(keyword))) {
        announcementData.category = category;
        break;
      }
    }

    return announcementData;
  }

  // Extract resource data from email
  private async extractResourceDataFromEmail(email: EmailMessage): Promise<any> {
    const content = `${email.subject}\n${email.body}`;
    
    const resourceData = {
      title: email.subject,
      description: email.body,
      type: 'document',
      category: 'general',
      attachments: email.attachments || [],
      source: {
        type: 'email',
        emailId: email.id,
        from: email.from,
        subject: email.subject,
        receivedDate: email.date
      }
    };

    // Determine resource type based on keywords
    const typeKeywords = {
      'form': ['form', 'application', 'registration'],
      'guide': ['guide', 'manual', 'instruction'],
      'policy': ['policy', 'procedure', 'rule'],
      'template': ['template', 'sample', 'example']
    };

    for (const [type, keywords] of Object.entries(typeKeywords)) {
      if (keywords.some(keyword => content.toLowerCase().includes(keyword))) {
        resourceData.type = type;
        break;
      }
    }

    return resourceData;
  }

  // Extract volunteer data from email
  private async extractVolunteerDataFromEmail(email: EmailMessage): Promise<any> {
    const content = `${email.subject}\n${email.body}`;
    
    const volunteerData = {
      title: email.subject,
      description: email.body,
      type: 'general',
      needed: 1,
      skills: [] as string[],
      date: null as string | null,
      location: '',
      source: {
        type: 'email',
        emailId: email.id,
        from: email.from,
        subject: email.subject,
        receivedDate: email.date
      }
    };

    // Extract number of volunteers needed
    const numberMatch = content.match(/(\d+)\s+(?:volunteers?|people|helpers?)/i);
    if (numberMatch) {
      volunteerData.needed = parseInt(numberMatch[1]);
    }

    // Extract skills needed
    const skillKeywords = ['driver', 'cook', 'supervisor', 'coordinator', 'leader', 'assistant'];
    const foundSkills = skillKeywords.filter(skill => content.toLowerCase().includes(skill));
    volunteerData.skills = foundSkills;

    // Extract date if mentioned
    const dateMatch = content.match(/(\w+\s+\d{1,2},?\s+\d{4})/i) ||
                     content.match(/(\d{1,2}\/\d{1,2}\/\d{4})/i);
    if (dateMatch) {
      volunteerData.date = dateMatch[1].trim();
    }

    return volunteerData;
  }

  // Extract fundraising data from email
  private async extractFundraisingDataFromEmail(email: EmailMessage): Promise<any> {
    const content = `${email.subject}\n${email.body}`;
    
    const fundraisingData = {
      title: email.subject,
      description: email.body,
      type: 'general',
      goal: 0,
      current: 0,
      deadline: null as string | null,
      source: {
        type: 'email',
        emailId: email.id,
        from: email.from,
        subject: email.subject,
        receivedDate: email.date
      }
    };

    // Extract fundraising goal
    const goalMatch = content.match(/\$(\d+(?:,\d{3})*(?:\.\d{2})?)/i);
    if (goalMatch) {
      fundraisingData.goal = parseFloat(goalMatch[1].replace(/,/g, ''));
    }

    // Extract deadline
    const deadlineMatch = content.match(/(?:deadline|due|end):\s*([^\n]+)/i) ||
                         content.match(/(\w+\s+\d{1,2},?\s+\d{4})/i);
    if (deadlineMatch) {
      fundraisingData.deadline = deadlineMatch[1].trim();
    }

    return fundraisingData;
  }

  // Create event from email
  private async createEventFromEmail(email: EmailMessage, analysis: EmailProcessingResult): Promise<boolean> {
    try {
      if (!analysis.eventData) {
        throw new Error('No event data available');
      }

      console.log('Creating event from email:', analysis.eventData.title);

      // Create the event in the database
      const eventDoc = await addDoc(collection(this.db, 'events'), {
        ...analysis.eventData,
        createdAt: serverTimestamp(),
        createdBy: 'email_monitor',
        source: {
          type: 'email',
          emailId: email.id,
          from: email.from,
          subject: email.subject,
          processedAt: serverTimestamp()
        },
        status: 'active',
        visibility: 'public'
      });

      // Log event creation
      await this.logEmailActivity('event_created', {
        emailId: email.id,
        eventId: eventDoc.id,
        eventTitle: analysis.eventData.title,
        confidence: analysis.confidence
      });

      // Send notification if enabled
      if (this.config.notifyOnCreation) {
        await this.sendEventCreationNotification(email, analysis.eventData, eventDoc.id);
      }

      console.log('Event created successfully:', eventDoc.id);
      return true;

    } catch (error) {
      console.error('Error creating event from email:', error);
      await this.logEmailActivity('event_creation_error', {
        emailId: email.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return false;
    }
  }

  // Send notification about event creation
  private async sendEventCreationNotification(email: EmailMessage, eventData: any, eventId: string): Promise<void> {
    try {
      // This would send a notification to the admin
      // For now, we'll just log it
      console.log(`Event created from email: ${eventData.title} (ID: ${eventId})`);
      
      // Could send email notification, push notification, etc.
      
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }

  // Send chat notification about created event
  private async sendChatNotification(email: EmailMessage, analysis: EmailProcessingResult): Promise<void> {
    try {
      const message = `📧 **Email Event Created**\n\nI just processed an email from **${email.from}** and created a new event:\n\n**${analysis.eventData?.title || 'Untitled Event'}**\n\n*Subject: ${email.subject}*\n\nThis event has been automatically added to the calendar. Please review and make any necessary adjustments.`;
      
      // Send to general announcements channel
      await aiService.sendAIMessage('general', message, true);
      
      console.log('Chat notification sent about created event');
    } catch (error) {
      console.error('Error sending chat notification:', error);
    }
  }

  // Log email monitoring activities
  private async logEmailActivity(action: string, data: any): Promise<void> {
    try {
      await addDoc(collection(this.db, 'email-monitor-logs'), {
        action,
        data,
        timestamp: serverTimestamp(),
        emailAddress: this.config.emailAddress
      });
    } catch (error) {
      console.error('Error logging email activity:', error);
    }
  }

  // Get monitoring status
  getMonitoringStatus(): { isActive: boolean; lastChecked: Date | null; config: EmailConfig } {
    return {
      isActive: this.isMonitoring,
      lastChecked: this.lastChecked,
      config: this.config
    };
  }

  // Get recent email processing history
  async getProcessingHistory(limit: number = 50): Promise<any[]> {
    try {
      const q = query(
        collection(this.db, 'email-monitor-logs'),
        orderBy('timestamp', 'desc'),
        firestoreLimit(limit)
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting processing history:', error);
      return [];
    }
  }

  // Update configuration
  async updateConfig(newConfig: Partial<EmailConfig>): Promise<boolean> {
    try {
      this.config = { ...this.config, ...newConfig };
      
      // Restart monitoring with new config
      if (this.isMonitoring) {
        await this.stopMonitoring();
        await this.startMonitoring();
      }
      
      await this.logEmailActivity('config_updated', { newConfig });
      return true;
    } catch (error) {
      console.error('Error updating config:', error);
      return false;
    }
  }
}

export default new EmailMonitorService();
