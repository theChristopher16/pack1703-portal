import { initializeApp } from 'firebase/app';
import { firebaseConfig } from '../firebase/config';

// Vertex AI Configuration
interface VertexAIConfig {
  projectId: string;
  location: string;
  model: string;
}

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface VertexAIResponse {
  content: string;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

interface EventData {
  title: string;
  description?: string;
  date: string;
  location?: string;
  category?: string;
  denTags?: string[];
  isImportant?: boolean;
}

interface AnnouncementData {
  title: string;
  body?: string;
  category: string;
  priority: string;
  eventId?: string;
  eventTitle?: string;
}

class VertexAIService {
  private config: VertexAIConfig;
  private isInitialized = false;
  private genAI: any;
  private model: any;

  constructor() {
    this.config = {
      projectId: 'pack1703-portal',
      location: 'us-central1',
      model: 'gemini-1.5-pro' // Using Gemini Pro for better performance
    };
  }

  /**
   * Initialize Vertex AI service
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Check if we're in a browser environment
      if (typeof window === 'undefined') {
        throw new Error('Vertex AI service must be initialized in browser environment');
      }

      // Load Google AI SDK dynamically
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      
      // Initialize with API key from environment
      const apiKey = process.env.REACT_APP_GOOGLE_AI_API_KEY;
      if (!apiKey) {
        throw new Error('Google AI API key not found. Please set REACT_APP_GOOGLE_AI_API_KEY in environment variables.');
      }

      this.genAI = new GoogleGenerativeAI(apiKey);
      this.model = this.genAI.getGenerativeModel({ model: this.config.model });
      
      this.isInitialized = true;
      console.log('✅ Vertex AI service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Vertex AI service:', error);
      throw error;
    }
  }

  /**
   * Generate a response using Vertex AI Gemini
   */
  async generateResponse(
    messages: ChatMessage[],
    systemPrompt?: string
  ): Promise<VertexAIResponse> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      let prompt = '';
      
      if (systemPrompt) {
        prompt += `System: ${systemPrompt}\n\n`;
      }
      
      messages.forEach(msg => {
        prompt += `${msg.role}: ${msg.content}\n`;
      });

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      return {
        content: text,
        model: this.config.model,
        usage: {
          promptTokens: 0, // Gemini doesn't provide detailed token usage in this version
          completionTokens: 0,
          totalTokens: 0
        }
      };
    } catch (error) {
      console.error('Error generating Vertex AI response:', error);
      throw new Error(`Failed to generate response: ${error}`);
    }
  }

  /**
   * Generate event description using Vertex AI
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

    const result = await this.generateResponse([
      { role: 'user', content: prompt }
    ]);

    return result.content;
  }

  /**
   * Generate announcement content using Vertex AI
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

    const result = await this.generateResponse([
      { role: 'user', content: prompt }
    ]);

    return result.content;
  }

  /**
   * Generate packing list using Vertex AI
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

    const result = await this.generateResponse([
      { role: 'user', content: prompt }
    ]);

    // Split the response into individual items and clean them up
    return result.content
      .split('\n')
      .map(item => item.trim())
      .filter(item => item.length > 0 && !item.match(/^(packing list|items?|essentials?)/i))
      .map(item => item.replace(/^[-•*]\s*/, '')) // Remove bullet points
      .slice(0, 20); // Limit to 20 items
  }

  /**
   * Generate event title using Vertex AI
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

    const result = await this.generateResponse([
      { role: 'user', content: prompt }
    ]);

    return result.content.trim();
  }

  /**
   * Analyze user query using Vertex AI
   */
  async analyzeQuery(query: string, context: any): Promise<string> {
    const prompt = `Analyze this user query and provide a helpful response for a Cub Scout Pack management system.

User Query: "${query}"

Context:
- User Role: ${context.userRole || 'user'}
- Available Data: ${JSON.stringify(context.availableData || {})}

Requirements:
- Scout-appropriate response
- Helpful and informative
- Professional but friendly tone
- If asking about data, provide relevant information
- If asking for help, provide actionable guidance

Provide your analysis and response:`;

    const result = await this.generateResponse([
      { role: 'user', content: prompt }
    ]);

    return result.content;
  }

  /**
   * Test connection to Vertex AI
   */
  async testConnection(): Promise<boolean> {
    try {
      const result = await this.generateResponse([
        { role: 'user', content: 'Hello, this is a test message.' }
      ]);
      return result.content.length > 0;
    } catch (error) {
      console.error('Vertex AI connection test failed:', error);
      return false;
    }
  }

  /**
   * Get model information
   */
  getModelInfo(): { model: string; projectId: string; location: string } {
    return {
      model: this.config.model,
      projectId: this.config.projectId,
      location: this.config.location
    };
  }
}

export const vertexAIService = new VertexAIService();
export default vertexAIService;
