"use strict";
// Temporarily disabled due to firebase-admin/ai import issue
// import { initializeApp, getApps } from 'firebase-admin/app';
// Temporarily disabled due to firebase-admin/ai import issue
// import { getAI, getGenerativeModel, GoogleAIBackend } from 'firebase-admin/ai';
Object.defineProperty(exports, "__esModule", { value: true });
class GeminiService {
    constructor() {
        // Initialize Firebase Admin if not already initialized
        // Temporarily disabled due to firebase-admin/ai import issue
        // if (getApps().length === 0) {
        //   this.app = initializeApp();
        // } else {
        //   this.app = getApps()[0];
        // }
        this.config = {
            model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
            maxTokens: parseInt(process.env.GEMINI_MAX_TOKENS || '4000'),
            temperature: parseFloat(process.env.GEMINI_TEMPERATURE || '0.7')
        };
        // Initialize Firebase AI Logic
        // Temporarily disabled due to firebase-admin/ai import issue
        // this.ai = getAI(this.app, { backend: new GoogleAIBackend() });
        // this.model = getGenerativeModel(this.ai, { 
        //   model: this.config.model,
        //   generationConfig: {
        //     maxOutputTokens: this.config.maxTokens,
        //     temperature: this.config.temperature,
        //   }
        // });
    }
    /**
     * Generate a response using Gemini
     */
    async generateResponse(messages, systemPrompt) {
        try {
            let prompt = '';
            if (systemPrompt) {
                prompt += `System: ${systemPrompt}\n\n`;
            }
            messages.forEach(msg => {
                prompt += `${msg.role}: ${msg.content}\n`;
            });
            const result = await this.model.generateContent(prompt);
            const response = result.response;
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
        }
        catch (error) {
            console.error('Error generating Gemini response:', error);
            throw new Error(`Failed to generate response: ${error}`);
        }
    }
    /**
     * Generate event description
     */
    async generateEventDescription(eventData) {
        var _a;
        const prompt = `Generate an engaging, scout-appropriate event description for a Cub Scout Pack event. 

Event Details:
- Title: ${eventData.title}
- Date: ${eventData.date}
- Location: ${eventData.location || 'TBD'}
- Category: ${eventData.category || 'General'}
- Den Tags: ${((_a = eventData.denTags) === null || _a === void 0 ? void 0 : _a.join(', ')) || 'All Dens'}
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
     * Generate announcement content
     */
    async generateAnnouncementContent(announcementData) {
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
     * Generate packing list
     */
    async generatePackingList(eventData) {
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
     * Generate event title
     */
    async generateEventTitle(eventData) {
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
     * Analyze user query
     */
    async analyzeQuery(query, context) {
        const prompt = `Analyze this user query and provide a helpful response for a Cub Scout Pack management system.

User Query: "${query}"

Context:
- User Role: ${context.userRole}
- Available Data: ${JSON.stringify(context.availableData)}

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
     * Test connection to Gemini
     */
    async testConnection() {
        try {
            const result = await this.generateResponse([
                { role: 'user', content: 'Hello, this is a test message.' }
            ]);
            return result.content.length > 0;
        }
        catch (error) {
            console.error('Gemini connection test failed:', error);
            return false;
        }
    }
    /**
     * Get model information
     */
    getModelInfo() {
        return {
            model: this.config.model,
            maxTokens: this.config.maxTokens,
            temperature: this.config.temperature
        };
    }
}
exports.default = GeminiService;
//# sourceMappingURL=geminiService.js.map