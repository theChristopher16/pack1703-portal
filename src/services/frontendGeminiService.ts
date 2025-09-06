import { initializeApp } from 'firebase/app';
import { getAI, getGenerativeModel, GoogleAIBackend } from 'firebase/ai';
import { firebaseConfig } from '../firebase/config';

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firebase AI Logic
const ai = getAI(app, { backend: new GoogleAIBackend() });

// Create Gemini model instance
const model = getGenerativeModel(ai, { 
  model: "gemini-2.5-flash",
  generationConfig: {
    maxOutputTokens: 4000,
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
  /**
   * Generate a response using Gemini
   */
  async generateResponse(prompt: string): Promise<GeminiResponse> {
    try {
      const result = await model.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      return {
        content: text,
        model: "gemini-2.5-flash"
      };
    } catch (error) {
      console.error('Error generating Gemini response:', error);
      throw new Error(`Failed to generate response: ${error}`);
    }
  }

  /**
   * Generate event description
   */
  async generateEventDescription(eventData: EventData): Promise<string> {
    const prompt = `Generate an engaging, scout-appropriate event description for a Cub Scout Pack event. 

Event Details:
- Title: ${eventData.title}
- Date: ${eventData.date}
- Location: ${eventData.location || 'TBD'}
- Category: ${eventData.category || 'General'}
- Den Tags: ${eventData.denTags?.join(', ') || 'All Dens'}
- Important: ${eventData.isImportant ? 'Yes' : 'No'}

Requirements:
- 100-200 words
- Scout-appropriate language
- Include what scouts will learn/do
- Mention any special requirements
- Houston-area appropriate activities
- Engaging and exciting tone

Generate the description:`;

    const result = await this.generateResponse(prompt);
    return result.content;
  }

  /**
   * Generate announcement content
   */
  async generateAnnouncementContent(announcementData: AnnouncementData): Promise<string> {
    const prompt = `Generate a clear, informative announcement for Cub Scout Pack families.

Announcement Details:
- Title: ${announcementData.title}
- Category: ${announcementData.category}
- Priority: ${announcementData.priority}
- Related Event: ${announcementData.eventTitle || 'N/A'}

Requirements:
- Clear, family-friendly language
- Include important details
- Mention deadlines if applicable
- Professional but warm tone
- 50-150 words

Generate the announcement content:`;

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
