# AI Contributor Guidelines

This repository contains infrastructure code managed with OpenTofu, Ansible and shell scripts. Follow these guidelines when contributing changes.

## Required Checks
- **Terraform/OpenTofu**: Run `tofu fmt -check` from the `tofu/` directory after modifying any `.tf` files.
- **Ansible**: Run `ansible-lint` from the repository root after changing playbooks or roles under `ansible/`.
- **Shell Scripts**: Run `shellcheck` on any updated `*.sh` script.

If any of these tools are unavailable in your environment, make a best effort attempt and note the failure in the PR description.

---

# 🤖 AI Agents Documentation

## Overview

The Pack 1703 Portal system features two intelligent AI agents designed to enhance the scouting experience:

- **Solyn** - Primary AI assistant for pack management and user interactions
- **Nova** - Administrative AI assistant for system management and insights

## 🤖 Solyn - Primary AI Assistant

### Identity & Personality
- **Name**: Solyn
- **Role**: AI Assistant for Pack 1703 Scout Pack
- **User ID**: `ai_solyn`
- **Tone**: Helpful, informative, scout-appropriate, positive
- **Style**: Mix of Navi from Legend of Zelda and Echo from Overwatch

### Core Capabilities

#### 🎯 Event Management
- **Event Creation**: Natural language event creation with automatic data gathering
- **Event Descriptions**: Generate engaging, scout-appropriate descriptions (100-200 words)
- **Event Titles**: Creative, engaging titles with relevant emojis
- **Packing Lists**: Comprehensive, practical packing lists for outdoor events
- **Location Validation**: Web search for location verification and details

#### 📢 Communications
- **Announcements**: Clear, informative announcements for scout families
- **Content Generation**: Optimized content for various communication channels
- **Message Processing**: Intelligent handling of user queries and mentions

#### 🔍 System Intelligence
- **Web Search**: Intelligent web search for enhanced information gathering
- **Data Analysis**: Real-time system insights and performance metrics
- **Resource Creation**: Automatic creation of system resources and documentation

#### 💬 Chat Integration
- **Mention Detection**: Responds to `@solyn`, `@ai`, `@assistant` mentions
- **Context Awareness**: Understands user roles, permissions, and current context
- **Dynamic Responses**: Adaptive conversation handling based on query type

### Technical Implementation

#### Service Architecture
```typescript
// Primary service: src/services/aiService.ts
class AIService {
  private aiName = 'Solyn';
  private aiUserId = 'ai_solyn';
  
  async processQuery(userQuery: string, context: AIContext): Promise<AIResponse>
  async handleEventCreation(userQuery: string, context: AIContext): Promise<AIResponse>
  async handleContentCreation(userQuery: string, context: AIContext): Promise<AIResponse>
  async handleDynamicConversation(userQuery: string, context: AIContext): Promise<AIResponse>
}
```

#### OpenAI Integration
```typescript
// Cloud Functions: functions/src/openaiService.ts
class OpenAIService {
  async generateEventDescription(eventData: EventData): Promise<string>
  async generateAnnouncementContent(announcementData: AnnouncementData): Promise<string>
  async generatePackingList(eventData: EventData): Promise<string[]>
  async generateEventTitle(eventData: EventData): Promise<string>
  async analyzeQuery(userQuery: string, context: QueryContext): Promise<string>
}
```

#### Permissions & Security
- **Admin Access**: Only admins, den leaders, and cubmaster can use AI features
- **Authentication Required**: All AI interactions require valid user authentication
- **Usage Logging**: Comprehensive logging of AI interactions for audit purposes

### Usage Examples

#### Event Creation
```
User: "Create a camping trip to Yosemite next month"
Solyn: *Searches for Yosemite camping details*
      *Generates event description and packing list*
      *Creates complete event with all details*
```

#### System Monitoring
```
User: "How is the system performing?"
Solyn: *Analyzes system metrics*
      *Provides cost analysis and performance insights*
      *Suggests optimizations if needed*
```

## 🤖 Nova - Administrative AI Assistant

### Identity & Personality
- **Name**: Nova
- **Role**: Administrative AI assistant for system management
- **Focus**: Administrative tasks, system insights, and technical support
- **Interface**: Dedicated admin chat interface

### Core Capabilities

#### 📊 Administrative Support
- **System Monitoring**: Real-time system health and performance analysis
- **User Management**: Insights into user activity and behavior patterns
- **Security Analysis**: Comprehensive security reviews and recommendations
- **Cost Optimization**: Detailed cost analysis and optimization suggestions

#### 🔧 Technical Assistance
- **Infrastructure Insights**: GCP/Firebase infrastructure monitoring
- **Database Analysis**: Firestore performance and usage analytics
- **API Integration**: External service status and integration health
- **Error Analysis**: Intelligent error detection and resolution suggestions

#### 📈 Analytics & Reporting
- **Usage Analytics**: Detailed usage patterns and trends
- **Performance Metrics**: System performance tracking and optimization
- **Resource Utilization**: Infrastructure resource usage analysis
- **Cost Tracking**: Detailed cost breakdown and optimization recommendations

### Technical Implementation

#### Admin Interface
```typescript
// Admin AI Interface: src/components/Admin/AIChatInterface.tsx
const AIChatInterface: React.FC = () => {
  // Dedicated admin chat interface for Nova
  // Real-time system insights and administrative support
}
```

#### System Integration
- **Admin Dashboard**: Integrated into main admin panel
- **Real-time Updates**: Live system metrics and status updates
- **Secure Access**: Admin-only access with comprehensive logging

## 🔧 AI Development Guidelines

### Code Quality Standards

#### TypeScript Requirements
- **Type Safety**: All AI services must use proper TypeScript types
- **Interface Definitions**: Clear interfaces for all AI interactions
- **Error Handling**: Comprehensive error handling with meaningful messages
- **Async/Await**: Proper async/await patterns for all AI operations

#### Testing Requirements
- **Unit Tests**: Comprehensive unit tests for all AI functions
- **Integration Tests**: End-to-end testing of AI workflows
- **Mock Data**: Use database queries instead of mock data (per user preference)
- **Error Scenarios**: Test error conditions and edge cases

### Security Guidelines

#### Authentication & Authorization
- **User Authentication**: All AI interactions require valid authentication
- **Role-based Access**: AI features restricted to appropriate user roles
- **Permission Validation**: Validate user permissions before AI operations
- **Audit Logging**: Comprehensive logging of all AI interactions

#### Data Protection
- **Input Validation**: Validate and sanitize all user inputs
- **Output Filtering**: Filter AI outputs for appropriate content
- **Privacy Protection**: Ensure no sensitive data exposure in AI responses
- **Rate Limiting**: Implement rate limiting for AI API calls

### Performance Guidelines

#### Response Time
- **Target Response Time**: < 3 seconds for most AI interactions
- **Async Processing**: Use background processing for complex operations
- **Caching**: Implement intelligent caching for repeated queries
- **Optimization**: Optimize AI prompts and context for efficiency

#### Resource Management
- **Token Usage**: Optimize OpenAI token usage for cost efficiency
- **Memory Management**: Proper memory management for large conversations
- **Connection Pooling**: Efficient database connection management
- **Error Recovery**: Graceful error recovery and fallback mechanisms

### Content Guidelines

#### Scout-Appropriate Content
- **Age-Appropriate**: All content must be appropriate for scout families
- **Positive Tone**: Maintain positive, encouraging tone in all interactions
- **Educational Value**: Provide educational value when possible
- **Safety First**: Prioritize safety in all recommendations and content

#### Communication Style
- **Clear Language**: Use clear, understandable language
- **Emoji Usage**: Appropriate use of emojis for engagement
- **Structured Responses**: Well-structured, easy-to-read responses
- **Context Awareness**: Adapt communication style to user context

## 🚀 Deployment & Monitoring

### Deployment Checklist
- [ ] Run `tofu fmt -check` for all Terraform/OpenTofu files
- [ ] Run `ansible-lint` for all Ansible playbooks and roles
- [ ] Run `shellcheck` for all shell scripts
- [ ] Test AI functionality in development environment
- [ ] Verify authentication and authorization controls
- [ ] Test error handling and fallback mechanisms
- [ ] Validate content filtering and safety measures

### Monitoring Requirements
- **AI Usage Tracking**: Monitor AI interaction patterns and usage
- **Performance Metrics**: Track response times and system performance
- **Error Monitoring**: Monitor and alert on AI-related errors
- **Cost Tracking**: Monitor OpenAI API usage and costs
- **Security Monitoring**: Monitor for security incidents and anomalies

### Maintenance Tasks
- **Regular Updates**: Keep AI models and dependencies updated
- **Content Review**: Regular review of AI-generated content
- **Performance Optimization**: Continuous performance monitoring and optimization
- **Security Audits**: Regular security audits of AI systems
- **User Feedback**: Collect and incorporate user feedback for improvements

## 📚 Additional Resources

- **API Setup Guide**: `API_SETUP_GUIDE.md` - External API configuration
- **Enhanced Solyn Test**: `ENHANCED_SOLYN_TEST.md` - Testing procedures
- **Wolf Watch Improvements**: `WOLF_WATCH_AND_SOLYN_IMPROVEMENTS.md` - Recent enhancements
- **Security Summary**: `SECURITY-SUMMARY.md` - Security considerations
- **Deployment Guide**: `DEPLOYMENT-GUIDE.md` - Deployment procedures

---

*Last Updated: January 2025*
*Version: 1.0*

