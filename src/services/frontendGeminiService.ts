import { initializeApp } from 'firebase/app';
import { getAI, getGenerativeModel, GoogleAIBackend } from 'firebase/ai';
import { firebaseConfig } from '../firebase/config';
import { apiCacheService } from './apiCacheService';

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firebase AI Logic
const ai = getAI(app, { backend: new GoogleAIBackend() });

// Create Gemini model instance with reduced token limits
const model = getGenerativeModel(ai, { 
  model: "gemini-2.5-flash",
  generationConfig: {
    maxOutputTokens: 500, // Reduced from 4000 - 87.5% reduction
    temperature: 0.7,
  }
});

export interface GeminiResponse {
  content: string;
  model: string;
}

export interface EventData {
  title: string;
  description?: string;
  date: string;
  location?: string;
  category?: string;
  denTags?: string[];
  isImportant?: boolean;
}

export interface AnnouncementData {
  title: string;
  body?: string;
  category: string;
  priority: string;
  eventId?: string;
  eventTitle?: string;
}

class FrontendGeminiService {
  private dailyUsageCount = 0;
  private dailyUsageLimit = 50; // Limit to 50 Gemini calls per day
  private lastResetDate = new Date().toDateString();
  /**
   * Generate a response using Gemini with caching
   */
  async generateResponse(prompt: string): Promise<GeminiResponse> {
    try {
      // Reset daily counter if new day
      const today = new Date().toDateString();
      if (today !== this.lastResetDate) {
        this.dailyUsageCount = 0;
        this.lastResetDate = today;
      }

      // Check daily limit
      if (this.dailyUsageCount >= this.dailyUsageLimit) {
        console.warn('🚫 Daily Gemini usage limit reached');
        return {
          content: 'I apologize, but I\'ve reached my daily response limit. Please try again tomorrow.',
          model: "gemini-2.5-flash"
        };
      }

      // Check cache first
      const cacheKey = apiCacheService.generateKey('gemini', { prompt });
      const cachedResponse = await apiCacheService.get(cacheKey, 'gemini');
      
      if (cachedResponse) {
        console.log('🎯 Gemini cache hit - avoiding API call');
        return cachedResponse;
      }

      console.log(`💰 Making Gemini API call (${this.dailyUsageCount + 1}/${this.dailyUsageLimit})`);
      this.dailyUsageCount++;
      const result = await model.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      const geminiResponse = {
        content: text,
        model: "gemini-2.5-flash"
      };

      // Cache the response for 1 hour
      await apiCacheService.set(cacheKey, geminiResponse, 'gemini', 60 * 60 * 1000);
      
      return geminiResponse;
    } catch (error) {
      console.error('Error generating Gemini response:', error);
      throw new Error(`Failed to generate response: ${error}`);
    }
  }

  /**
   * Generate event description
   */
  async generateEventDescription(eventData: EventData): Promise<string> {
    const prompt = `Create a short, engaging Cub Scout event description.

Event: ${eventData.title} on ${eventData.date}
Location: ${eventData.location || 'TBD'}
Category: ${eventData.category || 'General'}

Requirements:
- 2-3 sentences only
- Scout-appropriate
- Include what scouts will do
- Houston-area activities

Description:`;

    const result = await this.generateResponse(prompt);
    return result.content;
  }

  /**
   * Generate announcement content
   */
  async generateAnnouncementContent(announcementData: AnnouncementData): Promise<string> {
    const prompt = `Create a brief Pack announcement.

Title: ${announcementData.title}
Category: ${announcementData.category}
Priority: ${announcementData.priority}

Requirements:
- 1-2 sentences
- Clear and friendly
- Include key details

Announcement:`;

    const result = await this.generateResponse(prompt);
    return result.content;
  }

  /**
   * Generate packing list
   */
  async generatePackingList(eventData: EventData): Promise<string[]> {
    const prompt = `Generate a comprehensive packing list for a Cub Scout Pack event.

Event Details:
- Title: ${eventData.title}
- Date: ${eventData.date}
- Location: ${eventData.location || 'TBD'}
- Category: ${eventData.category || 'General'}

Requirements:
- Scout-appropriate items only
- Consider Houston weather
- Include essentials and optional items
- Organize by category (clothing, gear, supplies, etc.)
- Return as a simple list of items

Generate the packing list (one item per line):`;

    const result = await this.generateResponse(prompt);

    // Split the response into individual items and clean them up
    return result.content
      .split('\n')
      .map(item => item.trim())
      .filter(item => item.length > 0 && !item.match(/^(packing list|items?|essentials?)/i))
      .map(item => item.replace(/^[-•*]\s*/, '')) // Remove bullet points
      .slice(0, 20); // Limit to 20 items
  }

  /**
   * Generate event title
   */
  async generateEventTitle(eventData: EventData): Promise<string> {
    const prompt = `Generate an engaging, scout-appropriate event title.

Event Details:
- Description: ${eventData.description || 'Scout activity'}
- Date: ${eventData.date}
- Location: ${eventData.location || 'TBD'}
- Category: ${eventData.category || 'General'}

Requirements:
- Engaging and exciting
- Scout-appropriate
- Include relevant emoji
- 5-10 words maximum
- Houston-area appropriate

Generate the event title:`;

    const result = await this.generateResponse(prompt);
    return result.content.trim();
  }

  /**
   * Test connection to Gemini
   */
  async testConnection(): Promise<boolean> {
    try {
      const result = await this.generateResponse('Hello, this is a test message.');
      return result.content.length > 0;
    } catch (error) {
      console.error('Gemini connection test failed:', error);
      return false;
    }
  }
}

export const frontendGeminiService = new FrontendGeminiService();
export default frontendGeminiService;
