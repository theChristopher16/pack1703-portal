import React, { useState, useEffect, useRef } from 'react';
import { useAdmin } from '../contexts/AdminContext';
import { Send, Bot, User, Sparkles, Loader2, RefreshCw, Settings, MessageSquare, TrendingUp, Shield, DollarSign, Activity } from 'lucide-react';
import aiService, { AIResponse, AIContext } from '../services/aiService';
import systemMonitorService from '../services/systemMonitorService';

interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  type: 'info' | 'warning' | 'error' | 'success';
  data?: any;
}

const AdminAI: React.FC = () => {
  const { state } = useAdmin();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [systemMetrics, setSystemMetrics] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Set page title
    document.title = 'Solyn - AI Assistant | Admin Panel';
    
    // Initialize with welcome message
    const welcomeMessage: ChatMessage = {
      id: 'welcome',
      content: `🤖 **Hello! I'm Solyn, your AI Assistant!**\n\nI'm here to help you manage your Scout Pack portal. I can help with:\n\n**📊 System Monitoring**\n• System status and performance\n• Cost analysis and optimization\n• Infrastructure health\n\n**👥 User Analytics**\n• User activity and engagement\n• Growth metrics and trends\n• User behavior patterns\n\n**📝 Content Management**\n• Content overview and health\n• Recent activity and recommendations\n• Content optimization\n\n**🔒 Security & Permissions**\n• Security status and alerts\n• Permission analysis\n• Security recommendations\n\nJust ask me anything about your system!`,
      sender: 'ai',
      timestamp: new Date(),
      type: 'info'
    };
    setMessages([welcomeMessage]);

    // Load initial system metrics
    loadSystemMetrics();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadSystemMetrics = async () => {
    try {
      const metrics = await systemMonitorService.getSystemMetrics();
      setSystemMetrics(metrics);
    } catch (error) {
      console.warn('Could not load system metrics:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: inputValue,
      sender: 'user',
      timestamp: new Date(),
      type: 'info'
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const context: AIContext = {
        userQuery: inputValue,
        userRole: 'admin',
        currentPage: 'admin-ai',
        availableData: {
          events: systemMetrics?.totalEvents || 0,
          locations: systemMetrics?.totalLocations || 0,
          announcements: systemMetrics?.totalAnnouncements || 0,
          messages: systemMetrics?.totalMessages || 0,
          users: systemMetrics?.totalUsers || 0
        }
      };

      const aiResponse = await aiService.processQuery(inputValue, context);
      
      const aiMessage: ChatMessage = {
        id: aiResponse.id,
        content: aiResponse.message,
        sender: 'ai',
        timestamp: aiResponse.timestamp,
        type: aiResponse.type,
        data: aiResponse.data
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        content: 'I apologize, but I encountered an error processing your request. Please try again.',
        sender: 'ai',
        timestamp: new Date(),
        type: 'error'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const autoResizeTextarea = () => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 120)}px`;
    }
  };

  const getQuickActions = () => [
    { label: 'System Status', icon: Activity, query: 'Show me the current system status and health' },
    { label: 'Cost Analysis', icon: DollarSign, query: 'What are our current costs and any optimization recommendations?' },
    { label: 'User Activity', icon: TrendingUp, query: 'How are users engaging with the platform?' },
    { label: 'Security Check', icon: Shield, query: 'What is our current security status and any concerns?' },
    { label: 'Content Health', icon: MessageSquare, query: 'How is our content performing and any recommendations?' }
  ];

  const handleQuickAction = (query: string) => {
    setInputValue(query);
    // Auto-submit after a brief delay
    setTimeout(() => {
      const event = new Event('submit', { bubbles: true, cancelable: true });
      const form = document.querySelector('form');
      form?.dispatchEvent(event);
    }, 100);
  };

  const formatMessage = (content: string) => {
    // Convert markdown-style formatting to HTML
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>')
      .replace(/•/g, '• ');
  };

  const getMessageTypeColor = (type: string) => {
    switch (type) {
      case 'success': return 'border-green-200 bg-green-50';
      case 'warning': return 'border-yellow-200 bg-yellow-50';
      case 'error': return 'border-red-200 bg-red-50';
      default: return 'border-blue-200 bg-blue-50';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Bot className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-display font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Solyn
          </h1>
          <p className="text-gray-600 text-lg">
            Your intelligent AI companion for managing the Scout Pack portal
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Chat Area */}
          <div className="lg:col-span-3">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/50 shadow-soft h-[600px] flex flex-col">
              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl p-4 ${
                        message.sender === 'user'
                          ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white'
                          : `border ${getMessageTypeColor(message.type)} text-gray-800`
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        {message.sender === 'ai' && (
                          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                            <Bot className="w-4 h-4 text-white" />
                          </div>
                        )}
                        <div className="flex-1">
                          <div
                            className="prose prose-sm max-w-none"
                            dangerouslySetInnerHTML={{ __html: formatMessage(message.content) }}
                          />
                          <div className={`text-xs mt-2 ${
                            message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
                          }`}>
                            {message.timestamp.toLocaleTimeString()}
                          </div>
                        </div>
                        {message.sender === 'user' && (
                          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                            <User className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="border border-blue-200 bg-blue-50 rounded-2xl p-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                          <Bot className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex items-center space-x-2">
                          <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                          <span className="text-gray-600">AI is thinking...</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="border-t border-gray-200 p-4">
                <form onSubmit={handleSubmit} className="flex space-x-3">
                  <div className="flex-1 relative">
                    <textarea
                      ref={inputRef}
                      value={inputValue}
                      onChange={(e) => {
                        setInputValue(e.target.value);
                        autoResizeTextarea();
                      }}
                      onKeyPress={handleKeyPress}
                      placeholder="Ask me anything about your system, costs, users, content, or security..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      rows={1}
                      disabled={isLoading}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isLoading || !inputValue.trim()}
                    className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/50 shadow-soft p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <Sparkles className="w-5 h-5 mr-2 text-purple-500" />
                Ask Solyn
              </h3>
              <div className="space-y-2">
                {getQuickActions().map((action, index) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={index}
                      onClick={() => handleQuickAction(action.query)}
                      className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-200 hover:border-blue-300"
                    >
                      <div className="flex items-center space-x-3">
                        <Icon className="w-4 h-4 text-blue-500" />
                        <span className="text-sm font-medium text-gray-700">{action.label}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* System Status */}
            {systemMetrics && (
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/50 shadow-soft p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <Activity className="w-5 h-5 mr-2 text-green-500" />
                  System Status
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Active Users:</span>
                    <span className="font-medium">{systemMetrics.activeUsers}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Monthly Cost:</span>
                    <span className="font-medium">${systemMetrics.estimatedMonthlyCost?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Storage:</span>
                    <span className="font-medium">{systemMetrics.storagePercentage?.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Response Time:</span>
                    <span className="font-medium">{Math.round(systemMetrics.averageResponseTime)}ms</span>
                  </div>
                </div>
                <button
                  onClick={loadSystemMetrics}
                  className="w-full mt-4 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm transition-colors flex items-center justify-center"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAI;
