"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const openai_1 = require("openai");
class OpenAIService {
    constructor() {
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            throw new Error('OPENAI_API_KEY environment variable is required');
        }
        this.config = {
            apiKey,
            model: process.env.OPENAI_MODEL || 'gpt-5',
            maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || '4000'),
            temperature: parseFloat(process.env.OPENAI_TEMPERATURE || '0.7')
        };
        this.client = new openai_1.default({
            apiKey: this.config.apiKey
        });
    }
    /**
     * Generate a response using GPT-5
     */
    async generateResponse(messages, options) {
        try {
            const response = await this.client.chat.completions.create({
                model: (options === null || options === void 0 ? void 0 : options.model) || this.config.model,
                messages: messages.map(msg => ({
                    role: msg.role,
                    content: msg.content
                })),
                max_tokens: (options === null || options === void 0 ? void 0 : options.maxTokens) || this.config.maxTokens,
                temperature: (options === null || options === void 0 ? void 0 : options.temperature) || this.config.temperature,
                stream: false
            });
            const choice = response.choices[0];
            if (!choice || !choice.message) {
                throw new Error('No response from OpenAI');
            }
            return {
                content: choice.message.content || '',
                usage: response.usage ? {
                    promptTokens: response.usage.prompt_tokens,
                    completionTokens: response.usage.completion_tokens,
                    totalTokens: response.usage.total_tokens
                } : undefined,
                model: response.model
            };
        }
        catch (error) {
            console.error('OpenAI API error:', error);
            throw new Error(`OpenAI API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Generate event description using GPT-5
     */
    async generateEventDescription(eventData) {
        const systemPrompt = `You are Solyn, an AI assistant for Pack 1703 Scout Pack. Generate engaging, scout-appropriate event descriptions that are informative and exciting for scouts and their families. Keep descriptions between 100-200 words and include relevant scouting themes.`;
        const userPrompt = `Create an engaging event description for:
Title: ${eventData.title}
${eventData.date ? `Date: ${eventData.date}` : ''}
${eventData.location ? `Location: ${eventData.location}` : ''}
${eventData.type ? `Type: ${eventData.type}` : ''}

Make it exciting and informative for scouts and their families.`;
        const messages = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
        ];
        const response = await this.generateResponse(messages, {
            maxTokens: 300,
            temperature: 0.8
        });
        return response.content;
    }
    /**
     * Generate announcement content using GPT-5
     */
    async generateAnnouncementContent(announcementData) {
        const systemPrompt = `You are Solyn, an AI assistant for Pack 1703 Scout Pack. Generate clear, informative announcements that are appropriate for scout families. Keep announcements concise but informative.`;
        const userPrompt = `Create an announcement for:
Title: ${announcementData.title}
Topic: ${announcementData.topic}
${announcementData.audience ? `Audience: ${announcementData.audience}` : ''}
${announcementData.urgency ? `Urgency: ${announcementData.urgency}` : ''}

Make it clear, informative, and appropriate for scout families.`;
        const messages = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
        ];
        const response = await this.generateResponse(messages, {
            maxTokens: 250,
            temperature: 0.7
        });
        return response.content;
    }
    /**
     * Analyze user query and provide intelligent response
     */
    async analyzeQuery(userQuery, context) {
        const systemPrompt = `You are Solyn, an AI assistant for Pack 1703 Scout Pack. You help with:
- Event creation and management
- Announcements and communications
- System monitoring and analytics
- User support and guidance
- Content generation and optimization

You have access to real-time system data and can provide insights about performance, costs, user activity, and more. Be helpful, informative, and maintain a positive, scout-appropriate tone.`;
        const userPrompt = `User Query: "${userQuery}"
User Role: ${context.userRole}
${context.availableData ? `Available Data: ${JSON.stringify(context.availableData)}` : ''}

Please provide a helpful, informative response.`;
        const messages = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
        ];
        const response = await this.generateResponse(messages, {
            maxTokens: 500,
            temperature: 0.7
        });
        return response.content;
    }
    /**
     * Generate packing list for outdoor events
     */
    async generatePackingList(eventData) {
        const systemPrompt = `You are Solyn, an AI assistant for Pack 1703 Scout Pack. Generate comprehensive but practical packing lists for scout events. Focus on essential items that scouts should bring for safety and comfort.`;
        const userPrompt = `Create a packing list for:
Event: ${eventData.title}
${eventData.location ? `Location: ${eventData.location}` : ''}
${eventData.duration ? `Duration: ${eventData.duration}` : ''}
${eventData.season ? `Season: ${eventData.season}` : ''}

Provide a list of essential items that scouts should bring. Format as a simple list.`;
        const messages = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
        ];
        const response = await this.generateResponse(messages, {
            maxTokens: 400,
            temperature: 0.6
        });
        // Parse the response into a list
        return response.content
            .split('\n')
            .map(item => item.replace(/^[-•*]\s*/, '').trim())
            .filter(item => item.length > 0);
    }
    /**
     * Generate creative event titles
     */
    async generateEventTitle(eventData) {
        const systemPrompt = `You are Solyn, an AI assistant for Pack 1703 Scout Pack. Generate creative, engaging event titles that are appropriate for scouts. Include relevant emojis when appropriate.`;
        const userPrompt = `Generate a creative event title for:
Type: ${eventData.type}
${eventData.location ? `Location: ${eventData.location}` : ''}
${eventData.date ? `Date: ${eventData.date}` : ''}
${eventData.theme ? `Theme: ${eventData.theme}` : ''}

Make it exciting and memorable for scouts!`;
        const messages = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
        ];
        const response = await this.generateResponse(messages, {
            maxTokens: 50,
            temperature: 0.9
        });
        return response.content.trim();
    }
    /**
     * Get model information
     */
    getModelInfo() {
        return Object.assign({}, this.config);
    }
    /**
     * Test the OpenAI connection
     */
    async testConnection() {
        try {
            const response = await this.generateResponse([
                { role: 'user', content: 'Hello! Please respond with "Connection successful" if you can hear me.' }
            ], {
                maxTokens: 10,
                temperature: 0
            });
            return response.content.toLowerCase().includes('connection successful');
        }
        catch (error) {
            console.error('OpenAI connection test failed:', error);
            return false;
        }
    }
}
exports.default = OpenAIService;
//# sourceMappingURL=openaiService.js.map