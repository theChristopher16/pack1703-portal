import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import emailMonitorService from '../src/services/emailMonitorService';
import aiService from '../src/services/aiService';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
import * as fs from 'fs';
import * as path from 'path';

// Mock Firebase
vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => ({
    collection: vi.fn(),
    addDoc: vi.fn(),
    serverTimestamp: vi.fn(() => new Date()),
    doc: vi.fn(),
    updateDoc: vi.fn(),
    increment: vi.fn(),
    query: vi.fn(),
    where: vi.fn(),
    orderBy: vi.fn(),
    limit: vi.fn(),
    getDocs: vi.fn()
  })),
  collection: vi.fn(),
  addDoc: vi.fn(),
  serverTimestamp: vi.fn(),
  doc: vi.fn(),
  updateDoc: vi.fn(),
  increment: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  getDocs: vi.fn()
}));

vi.mock('firebase/functions', () => ({
  getFunctions: vi.fn(() => ({
    httpsCallable: vi.fn()
  })),
  httpsCallable: vi.fn()
}));

// Mock file system
vi.mock('fs', () => ({
  readFileSync: vi.fn(),
  existsSync: vi.fn()
}));

describe('Email Attachment Pipeline Test', () => {
  let mockAddDoc: any;
  let mockHttpsCallable: any;
  let mockCollection: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup mocks
    mockAddDoc = vi.fn().mockResolvedValue({ id: 'test-event-id' });
    mockCollection = vi.fn().mockReturnValue({ addDoc: mockAddDoc });
    mockHttpsCallable = vi.fn();

    vi.mocked(getFirestore).mockReturnValue({
      collection: mockCollection,
      addDoc: mockAddDoc,
      serverTimestamp: vi.fn(() => new Date()),
      doc: vi.fn(),
      updateDoc: vi.fn(),
      increment: vi.fn(),
      query: vi.fn(),
      where: vi.fn(),
      orderBy: vi.fn(),
      limit: vi.fn(),
      getDocs: vi.fn()
    } as any);

    vi.mocked(getFunctions).mockReturnValue({
      httpsCallable: mockHttpsCallable
    } as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Email with Flyer Attachment Processing', () => {
    it('should process email with flyer attachment and create event', async () => {
      // Mock the flyer file content
      const flyerContent = `
        🏕️ FALL CAMPING ADVENTURE
        Join us for an exciting weekend of outdoor fun!
        
        📅 Date: October 15-17, 2025
        📍 Location: Double Lake Recreation Area
        🕐 Time: Friday 6:00 PM - Sunday 2:00 PM
        
        Activities include:
        • Camping and outdoor skills
        • Hiking and nature exploration
        • Campfire and s'mores
        • Team building activities
        
        What to bring:
        • Tent and sleeping bag
        • Warm clothes and rain gear
        • Water bottle and snacks
        • Flashlight and first aid kit
        
        Cost: $25 per scout
        RSVP by: October 10th
        
        Contact: cubmaster@sfpack1703.com
        Phone: (555) 123-4567
      `;

      // Mock file system to return the flyer content
      vi.mocked(fs.readFileSync).mockReturnValue(Buffer.from(flyerContent));
      vi.mocked(fs.existsSync).mockReturnValue(true);

      // Create test email with attachment
      const testEmail = {
        id: 'test-email-1',
        from: 'cubmaster@sfpack1703.com',
        to: 'pack1703@example.com',
        subject: 'Fall Camping Adventure - Important Information',
        body: `
          Hi everyone!
          
          Please find attached the flyer for our upcoming Fall Camping Adventure.
          This is going to be an amazing weekend of outdoor activities and fun!
          
          Please review the details and let me know if you have any questions.
          
          Best regards,
          Cubmaster
        `,
        date: new Date('2025-01-15T10:00:00Z'),
        attachments: [
          {
            name: 'Fall_Camping_Flyer.pdf',
            type: 'application/pdf',
            size: 1024,
            content: flyerContent
          }
        ]
      };

      // Mock AI service to return event data
      const mockEventData = {
        title: '🏕️ Fall Camping Adventure',
        date: new Date('2025-10-15T18:00:00Z'),
        endDate: new Date('2025-10-17T14:00:00Z'),
        location: 'Double Lake Recreation Area',
        description: 'Join us for an exciting weekend of outdoor fun! Activities include camping and outdoor skills, hiking and nature exploration, campfire and s\'mores, and team building activities.',
        time: 'Friday 6:00 PM - Sunday 2:00 PM',
        cost: '$25 per scout',
        rsvpDeadline: new Date('2025-10-10T23:59:59Z'),
        contact: {
          email: 'cubmaster@sfpack1703.com',
          phone: '(555) 123-4567'
        },
        requirements: [
          'Tent and sleeping bag',
          'Warm clothes and rain gear',
          'Water bottle and snacks',
          'Flashlight and first aid kit'
        ]
      };

      // Mock the AI service response
      vi.spyOn(aiService, 'sendAIMessage').mockResolvedValue({
        id: 'ai-response-1',
        message: 'Event data extracted successfully',
        timestamp: new Date(),
        type: 'success',
        eventData: mockEventData
      });

      // Process the email
      const result = await emailMonitorService['processEmail'](testEmail);

      // Verify the email was processed
      expect(result.processed).toBe(true);
      expect(result.eventCreated).toBe(true);
      expect(result.confidence).toBeGreaterThan(0.7);
      expect(result.contentType).toBe('event');

      // Verify event data was extracted
      expect(result.eventData).toBeDefined();
      expect(result.eventData.title).toBe('🏕️ Fall Camping Adventure');
      expect(result.eventData.location).toBe('Double Lake Recreation Area');
      expect(result.eventData.date).toBeDefined();

      // Verify the event was created in the database
      expect(mockCollection).toHaveBeenCalledWith('events');
      expect(mockAddDoc).toHaveBeenCalledWith(expect.objectContaining({
        title: '🏕️ Fall Camping Adventure',
        location: 'Double Lake Recreation Area',
        startDate: expect.any(Date),
        endDate: expect.any(Date),
        description: expect.stringContaining('outdoor fun'),
        source: 'email_attachment',
        emailId: 'test-email-1'
      }));

      console.log('✅ Email attachment processing test passed!');
    });

    it('should handle email with multiple attachments', async () => {
      const flyerContent = `
        🎯 ARCHERY COMPETITION
        Test your skills in our annual archery competition!
        
        📅 Date: November 8, 2025
        📍 Location: Scout Camp Arrowhead
        🕐 Time: 9:00 AM - 4:00 PM
        
        Competition categories:
        • Cub Scouts (ages 8-10)
        • Webelos (ages 10-11)
        • Adults
        
        Equipment provided, no experience needed!
        Lunch included.
        
        Registration deadline: November 1st
      `;

      const registrationForm = `
        Archery Competition Registration
        Name: ________________
        Age: ________________
        Rank: ________________
        Emergency Contact: ________________
      `;

      vi.mocked(fs.readFileSync)
        .mockReturnValueOnce(Buffer.from(flyerContent))
        .mockReturnValueOnce(Buffer.from(registrationForm));
      vi.mocked(fs.existsSync).mockReturnValue(true);

      const testEmail = {
        id: 'test-email-2',
        from: 'cubmaster@sfpack1703.com',
        to: 'pack1703@example.com',
        subject: 'Archery Competition - Registration Open',
        body: 'Please find attached the competition flyer and registration form.',
        date: new Date('2025-01-15T11:00:00Z'),
        attachments: [
          {
            name: 'Archery_Competition_Flyer.pdf',
            type: 'application/pdf',
            size: 2048,
            content: flyerContent
          },
          {
            name: 'Registration_Form.pdf',
            type: 'application/pdf',
            size: 512,
            content: registrationForm
          }
        ]
      };

      const mockEventData = {
        title: '🎯 Archery Competition',
        date: new Date('2025-11-08T09:00:00Z'),
        endDate: new Date('2025-11-08T16:00:00Z'),
        location: 'Scout Camp Arrowhead',
        description: 'Test your skills in our annual archery competition! Competition categories include Cub Scouts (ages 8-10), Webelos (ages 10-11), and Adults. Equipment provided, no experience needed! Lunch included.',
        time: '9:00 AM - 4:00 PM',
        registrationDeadline: new Date('2025-11-01T23:59:59Z')
      };

      vi.spyOn(aiService, 'sendAIMessage').mockResolvedValue({
        id: 'ai-response-2',
        message: 'Event data extracted from multiple attachments',
        timestamp: new Date(),
        type: 'success',
        eventData: mockEventData
      });

      const result = await emailMonitorService['processEmail'](testEmail);

      expect(result.processed).toBe(true);
      expect(result.eventCreated).toBe(true);
      expect(result.hasAttachments).toBe(true);
      expect(result.eventData.title).toBe('🎯 Archery Competition');

      console.log('✅ Multiple attachment processing test passed!');
    });

    it('should handle email with non-event attachments gracefully', async () => {
      const newsletterContent = `
        Pack 1703 Newsletter - January 2025
        
        Welcome to the new year! Here's what's happening:
        
        • Monthly Pack Meeting: January 20th at 6:30 PM
        • Pinewood Derby: February 15th
        • Spring Camping: March 22-24
        
        Keep up the great work, scouts!
      `;

      vi.mocked(fs.readFileSync).mockReturnValue(Buffer.from(newsletterContent));
      vi.mocked(fs.existsSync).mockReturnValue(true);

      const testEmail = {
        id: 'test-email-3',
        from: 'cubmaster@sfpack1703.com',
        to: 'pack1703@example.com',
        subject: 'January Newsletter',
        body: 'Please find attached our January newsletter.',
        date: new Date('2025-01-15T12:00:00Z'),
        attachments: [
          {
            name: 'January_Newsletter.pdf',
            type: 'application/pdf',
            size: 1536,
            content: newsletterContent
          }
        ]
      };

      vi.spyOn(aiService, 'sendAIMessage').mockResolvedValue({
        id: 'ai-response-3',
        message: 'No specific event found in attachment',
        timestamp: new Date(),
        type: 'info'
      });

      const result = await emailMonitorService['processEmail'](testEmail);

      expect(result.processed).toBe(true);
      expect(result.eventCreated).toBe(false);
      expect(result.confidence).toBeLessThan(0.5);
      expect(result.contentType).toBe('announcement');

      console.log('✅ Non-event attachment handling test passed!');
    });

    it('should extract contact information from attachments', async () => {
      const flyerContent = `
        🏕️ WINTER CAMPING TRIP
        Experience the magic of winter camping!
        
        📅 Date: January 25-27, 2025
        📍 Location: Pine Ridge Campground
        🕐 Time: Friday 5:00 PM - Sunday 12:00 PM
        
        Contact Information:
        Event Coordinator: Sarah Johnson
        Email: sarah.johnson@sfpack1703.com
        Phone: (555) 987-6543
        
        Emergency Contact: Mike Smith
        Phone: (555) 456-7890
        
        Registration: $30 per scout
        Deadline: January 20th
      `;

      vi.mocked(fs.readFileSync).mockReturnValue(Buffer.from(flyerContent));
      vi.mocked(fs.existsSync).mockReturnValue(true);

      const testEmail = {
        id: 'test-email-4',
        from: 'cubmaster@sfpack1703.com',
        to: 'pack1703@example.com',
        subject: 'Winter Camping Trip Details',
        body: 'Attached are the details for our winter camping trip.',
        date: new Date('2025-01-15T13:00:00Z'),
        attachments: [
          {
            name: 'Winter_Camping_Flyer.pdf',
            type: 'application/pdf',
            size: 1024,
            content: flyerContent
          }
        ]
      };

      const mockEventData = {
        title: '🏕️ Winter Camping Trip',
        date: new Date('2025-01-25T17:00:00Z'),
        endDate: new Date('2025-01-27T12:00:00Z'),
        location: 'Pine Ridge Campground',
        description: 'Experience the magic of winter camping!',
        time: 'Friday 5:00 PM - Sunday 12:00 PM',
        cost: '$30 per scout',
        registrationDeadline: new Date('2025-01-20T23:59:59Z'),
        contacts: [
          {
            name: 'Sarah Johnson',
            email: 'sarah.johnson@sfpack1703.com',
            phone: '(555) 987-6543',
            role: 'Event Coordinator'
          },
          {
            name: 'Mike Smith',
            phone: '(555) 456-7890',
            role: 'Emergency Contact'
          }
        ]
      };

      vi.spyOn(aiService, 'sendAIMessage').mockResolvedValue({
        id: 'ai-response-4',
        message: 'Event and contact information extracted',
        timestamp: new Date(),
        type: 'success',
        eventData: mockEventData
      });

      const result = await emailMonitorService['processEmail'](testEmail);

      expect(result.processed).toBe(true);
      expect(result.eventCreated).toBe(true);
      expect(result.eventData.contacts).toBeDefined();
      expect(result.eventData.contacts).toHaveLength(2);
      expect(result.eventData.contacts[0].name).toBe('Sarah Johnson');

      console.log('✅ Contact information extraction test passed!');
    });
  });

  describe('Error Handling', () => {
    it('should handle corrupted attachment gracefully', async () => {
      const testEmail = {
        id: 'test-email-5',
        from: 'cubmaster@sfpack1703.com',
        to: 'pack1703@example.com',
        subject: 'Test Event',
        body: 'Test email body',
        date: new Date('2025-01-15T14:00:00Z'),
        attachments: [
          {
            name: 'corrupted.pdf',
            type: 'application/pdf',
            size: 0,
            content: null
          }
        ]
      };

      vi.spyOn(aiService, 'sendAIMessage').mockRejectedValue(new Error('Failed to process attachment'));

      const result = await emailMonitorService['processEmail'](testEmail);

      expect(result.processed).toBe(false);
      expect(result.eventCreated).toBe(false);
      expect(result.confidence).toBe(0);

      console.log('✅ Corrupted attachment handling test passed!');
    });

    it('should handle unsupported file types', async () => {
      const testEmail = {
        id: 'test-email-6',
        from: 'cubmaster@sfpack1703.com',
        to: 'pack1703@example.com',
        subject: 'Test Event',
        body: 'Test email body',
        date: new Date('2025-01-15T15:00:00Z'),
        attachments: [
          {
            name: 'image.jpg',
            type: 'image/jpeg',
            size: 1024,
            content: 'binary-image-data'
          }
        ]
      };

      const result = await emailMonitorService['processEmail'](testEmail);

      expect(result.processed).toBe(true);
      expect(result.eventCreated).toBe(false);
      expect(result.reason).toContain('unsupported file type');

      console.log('✅ Unsupported file type handling test passed!');
    });
  });

  describe('Integration Test', () => {
    it('should complete full pipeline from email to event creation', async () => {
      console.log('🚀 Starting full pipeline integration test...');

      // Step 1: Mock the flyer content
      const flyerContent = `
        🎉 SPRING CAMPING ADVENTURE
        Welcome spring with an amazing camping experience!
        
        📅 Date: March 22-24, 2025
        📍 Location: Lakeview Campground
        🕐 Time: Friday 4:00 PM - Sunday 11:00 AM
        
        Activities:
        • Nature hikes and wildlife observation
        • Canoeing and fishing
        • Campfire cooking
        • Star gazing and astronomy
        
        Equipment needed:
        • Tent, sleeping bag, and pad
        • Weather-appropriate clothing
        • Hiking boots and water shoes
        • Personal hygiene items
        
        Cost: $35 per scout
        Registration deadline: March 15th
        
        Questions? Contact:
        Cubmaster: cubmaster@sfpack1703.com
        Phone: (555) 123-4567
      `;

      vi.mocked(fs.readFileSync).mockReturnValue(Buffer.from(flyerContent));
      vi.mocked(fs.existsSync).mockReturnValue(true);

      // Step 2: Create test email
      const testEmail = {
        id: 'integration-test-email',
        from: 'cubmaster@sfpack1703.com',
        to: 'pack1703@example.com',
        subject: 'Spring Camping Adventure - Registration Open',
        body: `
          Hello Pack 1703 families!
          
          I'm excited to announce our Spring Camping Adventure! 
          Please find attached the detailed flyer with all the information.
          
          This promises to be an amazing weekend of outdoor activities,
          including canoeing, fishing, and stargazing!
          
          Please review the details and let me know if you have any questions.
          
          Best regards,
          Cubmaster
        `,
        date: new Date('2025-01-15T16:00:00Z'),
        attachments: [
          {
            name: 'Spring_Camping_Flyer.pdf',
            type: 'application/pdf',
            size: 2048,
            content: flyerContent
          }
        ]
      };

      // Step 3: Mock AI service response
      const mockEventData = {
        title: '🎉 Spring Camping Adventure',
        date: new Date('2025-03-22T16:00:00Z'),
        endDate: new Date('2025-03-24T11:00:00Z'),
        location: 'Lakeview Campground',
        description: 'Welcome spring with an amazing camping experience! Activities include nature hikes and wildlife observation, canoeing and fishing, campfire cooking, and star gazing and astronomy.',
        time: 'Friday 4:00 PM - Sunday 11:00 AM',
        cost: '$35 per scout',
        registrationDeadline: new Date('2025-03-15T23:59:59Z'),
        requirements: [
          'Tent, sleeping bag, and pad',
          'Weather-appropriate clothing',
          'Hiking boots and water shoes',
          'Personal hygiene items'
        ],
        contact: {
          email: 'cubmaster@sfpack1703.com',
          phone: '(555) 123-4567'
        }
      };

      vi.spyOn(aiService, 'sendAIMessage').mockResolvedValue({
        id: 'integration-ai-response',
        message: 'Event successfully extracted from attachment',
        timestamp: new Date(),
        type: 'success',
        eventData: mockEventData
      });

      // Step 4: Process the email
      console.log('📧 Processing email with attachment...');
      const result = await emailMonitorService['processEmail'](testEmail);

      // Step 5: Verify results
      expect(result.processed).toBe(true);
      expect(result.eventCreated).toBe(true);
      expect(result.confidence).toBeGreaterThan(0.8);
      expect(result.contentType).toBe('event');
      expect(result.hasAttachments).toBe(true);

      // Step 6: Verify event data
      expect(result.eventData).toBeDefined();
      expect(result.eventData.title).toBe('🎉 Spring Camping Adventure');
      expect(result.eventData.location).toBe('Lakeview Campground');
      expect(result.eventData.date).toBeDefined();
      expect(result.eventData.endDate).toBeDefined();
      expect(result.eventData.cost).toBe('$35 per scout');

      // Step 7: Verify database creation
      expect(mockCollection).toHaveBeenCalledWith('events');
      expect(mockAddDoc).toHaveBeenCalledWith(expect.objectContaining({
        title: '🎉 Spring Camping Adventure',
        location: 'Lakeview Campground',
        startDate: expect.any(Date),
        endDate: expect.any(Date),
        description: expect.stringContaining('amazing camping experience'),
        source: 'email_attachment',
        emailId: 'integration-test-email',
        cost: '$35 per scout',
        registrationDeadline: expect.any(Date)
      }));

      console.log('✅ Full pipeline integration test completed successfully!');
      console.log('📊 Test Results:');
      console.log(`   - Email processed: ${result.processed}`);
      console.log(`   - Event created: ${result.eventCreated}`);
      console.log(`   - Confidence: ${result.confidence}`);
      console.log(`   - Content type: ${result.contentType}`);
      console.log(`   - Has attachments: ${result.hasAttachments}`);
      console.log(`   - Event title: ${result.eventData?.title}`);
      console.log(`   - Event location: ${result.eventData?.location}`);
    });
  });
});


