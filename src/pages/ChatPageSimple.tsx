import React, { useEffect, useRef } from 'react';
import { useAdmin } from '../contexts/AdminContext';
import { useSimpleChatState } from '../hooks/useSimpleChatState';
import chatService from '../services/chatService';
import { 
  MessageSquare, 
  Users, 
  Settings, 
  Send, 
  Smile, 
  Camera,
  Hash,
  Loader2,
  AlertCircle,
  CheckCircle,
  X
} from 'lucide-react';
import LoadingSpinner from '../components/Loading/LoadingSpinner';
import ChatDebugger from '../components/Debug/ChatDebugger';

// Error boundary for individual chat components
class ChatComponentErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Chat component error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">Chat component error. Please refresh the page.</span>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Simple channel list component
const SimpleChannelList: React.FC<{
  channels: any[];
  selectedChannel: string;
  onSelectChannel: (channelId: string) => void;
  expandedDens: Set<string>;
  onToggleDen: (denId: string) => void;
  onToggleSidebar: () => void;
}> = ({ channels, selectedChannel, onSelectChannel, expandedDens, onToggleDen, onToggleSidebar }) => {
  const [isPackChannelsExpanded, setIsPackChannelsExpanded] = React.useState(true);
  
  return (
    <ChatComponentErrorBoundary>
      <div className="h-full flex flex-col">
        <div className="p-4 pb-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center">
              <MessageSquare className="w-4 h-4 mr-2 text-blue-600" />
              Channels
            </h3>
            {/* Mobile Close Button */}
            <button
              onClick={onToggleSidebar}
              className="md:hidden p-1 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors duration-200 flex items-center justify-center"
              aria-label="Close channel list"
            >
              <X className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4 min-h-0">
        
        {/* Pack Channels - Collapsible */}
        <div className="space-y-2">
          <button
            onClick={() => setIsPackChannelsExpanded(!isPackChannelsExpanded)}
            className="w-full text-left px-3 py-2 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-100 transition-all duration-200 flex items-center justify-between"
          >
            <span className="flex items-center">
              <span className="mr-2">🏕️</span>
              Pack Channels
            </span>
            <span className="flex items-center">
              <span className="text-xs px-2 py-1 rounded-full bg-gray-100 mr-2">
                {channels ? channels.filter(channel => !channel.isDenChannel).length : 0}
              </span>
              <span className={`transform transition-transform duration-200 ${isPackChannelsExpanded ? 'rotate-180' : ''}`}>
                ▼
              </span>
            </span>
          </button>
          
          {isPackChannelsExpanded && (
            <div className="ml-6 space-y-2">
              {channels && channels.filter(channel => !channel.isDenChannel).map(channel => (
                <button
                  key={`pack-channel-${channel.id}`}
                  onClick={() => onSelectChannel(channel.id)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-all duration-200 ${
                    selectedChannel === channel.id
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium shadow-soft'
                      : 'text-gray-700 hover:bg-gray-100 hover:shadow-soft'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="flex items-center">
                      <span className="mr-2">#</span>
                      {channel.name}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      selectedChannel === channel.id ? 'bg-white bg-opacity-20' : 'bg-gray-100'
                    }`}>
                      {channel.messageCount || 0}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Den Channels - Collapsible */}
        <div className="space-y-2">
          <button
            onClick={() => onToggleDen('all-dens')}
            className="w-full text-left px-3 py-2 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-100 transition-all duration-200 flex items-center justify-between"
          >
            <span className="flex items-center">
              <span className="mr-2">👥</span>
              Den Channels
            </span>
            <span className="flex items-center">
              <span className="text-xs px-2 py-1 rounded-full bg-gray-100 mr-2">
                {channels ? channels.filter(channel => channel.isDenChannel).length : 0}
              </span>
              <span className={`transform transition-transform duration-200 ${expandedDens.has('all-dens') ? 'rotate-180' : ''}`}>
                ▼
              </span>
            </span>
          </button>
          
          {expandedDens.has('all-dens') && (
            <div className="ml-6 space-y-2">
          
          {[
            { id: 'lion', name: 'Lion Den', icon: '🦁' },
            { id: 'tiger', name: 'Tiger Den', icon: '🐯' },
            { id: 'wolf', name: 'Wolf Den', icon: '🐺' },
            { id: 'bear', name: 'Bear Den', icon: '🐻' },
            { id: 'webelos', name: 'Webelos Den', icon: '🏕️' },
            { id: 'arrow-of-light', name: 'Arrow of Light', icon: '🏹' }
          ].map(den => {
            const denChannels = channels ? channels.filter(channel => channel.denType === den.id) : [];
            const isExpanded = expandedDens.has(den.id);
            
            return (
              <div key={`den-${den.id}`} className="space-y-2">
                <button
                  onClick={() => onToggleDen(den.id)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-all duration-200 flex items-center justify-between ${
                    denChannels.some(c => c.id === selectedChannel)
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium shadow-soft'
                      : 'bg-gray-50 text-gray-700 hover:shadow-soft'
                  }`}
                >
                  <div className="flex items-center">
                    <span className="text-lg mr-2">{den.icon}</span>
                    <span>{den.name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      denChannels.some(c => c.id === selectedChannel) 
                        ? 'bg-white bg-opacity-20' 
                        : 'bg-white bg-opacity-60'
                    }`}>
                      {denChannels.length}
                    </span>
                    <svg className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>
                
                {isExpanded && (
                  <div className="ml-6 space-y-2">
                    {denChannels.map(channel => (
                      <button
                        key={`den-channel-${channel.id}`}
                        onClick={() => onSelectChannel(channel.id)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                          selectedChannel === channel.id
                            ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium shadow-soft'
                            : 'text-gray-600 hover:bg-gray-100 hover:shadow-soft'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="flex items-center">
                            <span className="mr-2">#</span>
                            {channel.name}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            selectedChannel === channel.id ? 'bg-white bg-opacity-20' : 'bg-gray-100'
                          }`}>
                            {channel.messageCount || 0}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
            </div>
          )}
        </div>
        </div>
      </div>
    </ChatComponentErrorBoundary>
  );
};

// Simple message list component
const SimpleMessageList: React.FC<{
  messages: any[];
  currentUser: any;
  onAddReaction: (messageId: string, emoji: string) => void;
  onDeleteMessage: (messageId: string) => void;
}> = ({ messages, currentUser, onAddReaction, onDeleteMessage }) => {
  return (
    <ChatComponentErrorBoundary>
      <div className="flex-1 bg-gray-50 overflow-y-auto">
        <div className="space-y-4">
          {messages && messages.map((message) => (
            <div
              key={message.id}
              className={`p-3 rounded-lg relative group ${
                message.isSystem 
                  ? 'bg-yellow-100 border-l-4 border-yellow-400' 
                  : message.isAdmin 
                    ? 'bg-blue-100 border-l-4 border-blue-400' 
                    : 'bg-white border-l-4 border-gray-200'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center min-w-0">
                  <span className={`font-medium truncate ${
                    message.isSystem ? 'text-yellow-800' : 
                    message.isAdmin ? 'text-blue-800' : 'text-gray-800'
                  }`}>
                    {message.userName}
                  </span>
                  {message.isAdmin && (
                    <span className="ml-2 px-2 py-1 bg-blue-200 text-blue-800 text-xs rounded-full flex-shrink-0">
                      Admin
                    </span>
                  )}
                  {message.isSystem && (
                    <span className="ml-2 px-2 py-1 bg-yellow-200 text-yellow-800 text-xs rounded-full flex-shrink-0">
                      System
                    </span>
                  )}
                </div>
              </div>
              <div className={`text-sm break-words ${
                message.isSystem ? 'text-yellow-700' : 
                message.isAdmin ? 'text-blue-700' : 'text-gray-700'
              }`}>
                {message.message}
              </div>
              
              {/* Reactions */}
              {message.reactions && message.reactions.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {message.reactions && Array.from(new Set(message.reactions.map((r: any) => r.emoji))).map((emoji: any) => (
                    <button
                      key={emoji}
                      onClick={() => onAddReaction(message.id, emoji)}
                      className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors duration-200"
                    >
                      {emoji} {message.reactions.filter((r: any) => r.emoji === emoji).length}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </ChatComponentErrorBoundary>
  );
};

// Simple message input component
const SimpleMessageInput: React.FC<{
  newMessage: string;
  onMessageChange: (message: string) => void;
  onSendMessage: () => void;
  isUploading: boolean;
  currentUser: any;
  selectedChannel: string;
  channels: any[];
}> = ({ newMessage, onMessageChange, onSendMessage, isUploading, currentUser, selectedChannel, channels }) => {
  const currentChannel = channels.find(c => c.id === selectedChannel);
  
  return (
    <ChatComponentErrorBoundary>
      <div className="bg-white border-t border-gray-200 p-4">
        <form onSubmit={(e) => { e.preventDefault(); onSendMessage(); }} className="flex space-x-4">
          <div className="flex-1">
            <textarea
              value={newMessage}
              onChange={(e) => onMessageChange(e.target.value)}
              placeholder={currentUser ? `Message #${currentChannel?.name || 'general'}...` : 'Connecting to chat...'}
              disabled={!currentUser}
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm shadow-soft transition-all duration-200"
              rows={1}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = Math.min(target.scrollHeight, 200) + 'px';
              }}
            />
          </div>
          
          <button
            type="submit"
            disabled={!newMessage.trim() || !currentUser || isUploading}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-xl shadow-soft hover:shadow-glow transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {isUploading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Send className="w-4 h-4 mr-2" />
            )}
            <span>{isUploading ? 'Sending...' : 'Send'}</span>
          </button>
        </form>
      </div>
    </ChatComponentErrorBoundary>
  );
};

// Main simplified chat page component
const ChatPageSimple: React.FC = () => {
  const { state: adminState } = useAdmin();
  const { state, actions } = useSimpleChatState();
  const messageListRef = useRef<HTMLDivElement>(null);

  // Initialize chat
  useEffect(() => {
    const initializeChat = async () => {
      try {
        actions.setIsLoading(true);
        actions.setError(null);
        
        console.log('ChatPageSimple: Initializing chat...');
        
        // Initialize chat service
        const user = await chatService.initialize();
        actions.setCurrentUser(user);
        
        // Load channels
        const channels = await chatService.getChannels();
        actions.setChannels(channels);
        
        // Load users
        const users = await chatService.getOnlineUsers();
        actions.setUsers(users);
        
        actions.setIsConnected(true);
        console.log('ChatPageSimple: Chat initialized successfully');
        
      } catch (error: any) {
        console.error('ChatPageSimple: Failed to initialize chat:', error);
        actions.setError(error.message || 'Failed to initialize chat');
        actions.setIsConnected(false);
      } finally {
        actions.setIsLoading(false);
      }
    };

    initializeChat();
  }, []);

  // Handle channel switching
  useEffect(() => {
    if (!state.isConnected || !state.selectedChannel) return;
    
    const loadChannelMessages = async () => {
      try {
        console.log('ChatPageSimple: Loading messages for channel:', state.selectedChannel);
        const messages = await chatService.getMessages(state.selectedChannel);
        actions.setMessages(messages);
        
        // Set up real-time subscription
        const unsubscribe = chatService.subscribeToMessages(state.selectedChannel, (newMessages) => {
          actions.setMessages(newMessages);
        });
        
        return unsubscribe;
      } catch (error) {
        console.error('ChatPageSimple: Failed to load channel messages:', error);
        actions.setError('Failed to load messages');
      }
    };

    loadChannelMessages();
  }, [state.selectedChannel, state.isConnected]);

  // Handle sending messages
  const handleSendMessage = async () => {
    if (!state.newMessage.trim() || !state.currentUser) return;

    try {
      actions.setIsUploading(true);
      await chatService.sendMessage(state.selectedChannel, state.newMessage);
      actions.setNewMessage('');
      console.log('ChatPageSimple: Message sent successfully');
    } catch (error) {
      console.error('ChatPageSimple: Failed to send message:', error);
      actions.setError('Failed to send message');
    } finally {
      actions.setIsUploading(false);
    }
  };

  // Handle adding reactions
  const handleAddReaction = async (messageId: string, emoji: string) => {
    if (!state.currentUser) return;

    try {
      await chatService.addReaction(messageId, emoji, state.currentUser.id, state.currentUser.name);
    } catch (error) {
      console.error('ChatPageSimple: Failed to add reaction:', error);
    }
  };

  // Handle deleting messages
  const handleDeleteMessage = async (messageId: string) => {
    if (!state.currentUser?.isAdmin) return;

    try {
      await chatService.deleteMessage(messageId);
    } catch (error) {
      console.error('ChatPageSimple: Failed to delete message:', error);
    }
  };

  // Loading state
  if (state.isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" text="Loading chat..." />
      </div>
    );
  }

  // Error state
  if (state.error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="w-5 h-5" />
            <span className="font-medium">Chat Error</span>
          </div>
          <p className="text-red-600 mt-2">{state.error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!adminState.currentUser) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-yellow-600">
            <AlertCircle className="w-5 h-5" />
            <span className="font-medium">Authentication Required</span>
          </div>
          <p className="text-yellow-600 mt-2">Please log in to access the chat.</p>
        </div>
      </div>
    );
  }

  return (
    <ChatComponentErrorBoundary>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Pack Chat</h1>
          <p className="text-gray-600">Connect with your pack members</p>
        </div>

        {/* Connection Status */}
        <div className="mb-6">
          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
            state.isConnected 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {state.isConnected ? (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Connected
              </>
            ) : (
              <>
                <AlertCircle className="w-4 h-4 mr-2" />
                Disconnected
              </>
            )}
          </div>
        </div>

        {/* Chat Interface */}
        <div className="flex flex-col md:flex-row h-[700px] md:h-[700px] relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl overflow-hidden shadow-soft">
          {/* Mobile Backdrop */}
          {state.isSidebarOpen && (
            <div 
              className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
              onClick={() => actions.toggleSidebar()}
            />
          )}
          
          {/* Sidebar */}
          <div className={`${state.isSidebarOpen ? 'block' : 'hidden'} md:block md:w-64 bg-gradient-to-b from-white to-gray-50 border-r border-gray-200 overflow-hidden flex flex-col ${
            state.isSidebarOpen ? 'absolute md:relative z-50 w-64 h-full' : ''
          }`}>
            {/* User Profile Section */}
            {state.currentUser && (
              <div className="p-4 border-b border-gray-200 flex-shrink-0 bg-gradient-to-r from-blue-500 to-purple-600">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center backdrop-blur-sm">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">
                      {state.currentUser.name}
                    </p>
                    <p className="text-xs text-blue-100">
                      {state.currentUser.den ? `${state.currentUser.den} Den` : 'Pack Member'}
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Channel List */}
            <div className="overflow-y-auto flex-1 min-h-0 max-h-full">
              <SimpleChannelList
                channels={state.channels}
                selectedChannel={state.selectedChannel}
                onSelectChannel={actions.setSelectedChannel}
                expandedDens={state.expandedDens}
                onToggleDen={actions.toggleExpandedDen}
                onToggleSidebar={actions.toggleSidebar}
              />
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col min-h-0">
            {/* Channel Header */}
            <div className="bg-gradient-to-r from-white to-gray-50 border-b border-gray-200 px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center min-w-0">
                  {/* Mobile Channel Toggle Button */}
                  <button
                    onClick={() => actions.toggleSidebar()}
                    className="md:hidden mr-3 px-3 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 transition-all duration-200 flex items-center justify-center shadow-soft"
                    aria-label="Show channel list"
                  >
                    <MessageSquare className="w-4 h-4 text-white mr-2" />
                    <span className="text-sm font-medium text-white">Channels</span>
                  </button>
                  
                  <span className="text-lg font-semibold text-gray-900 truncate flex items-center">
                    <span className="mr-2">#</span>
                    {state.channels.find(c => c.id === state.selectedChannel)?.name || 'general'}
                    {/* Mobile Channel Count Indicator */}
                    <span className="md:hidden ml-2 text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">
                      {state.channels.length} channels
                    </span>
                  </span>
                </div>
                <span className="text-sm text-gray-500 flex-shrink-0 ml-2 bg-gray-100 px-2 py-1 rounded-full">
                  {state.messages.length} messages
                </span>
              </div>
            </div>

            {/* Message List */}
            <div ref={messageListRef} className="flex-1 min-h-0 overflow-y-auto">
              <div className="p-4 pb-6">
                <SimpleMessageList
                  messages={state.messages}
                  currentUser={state.currentUser}
                  onAddReaction={handleAddReaction}
                  onDeleteMessage={handleDeleteMessage}
                />
              </div>
            </div>

            {/* Message Input */}
            <SimpleMessageInput
              newMessage={state.newMessage}
              onMessageChange={actions.setNewMessage}
              onSendMessage={handleSendMessage}
              isUploading={state.isUploading}
              currentUser={state.currentUser}
              selectedChannel={state.selectedChannel}
              channels={state.channels}
            />
          </div>
        </div>
        
        {/* Debug Component - Only show in development */}
        {process.env.NODE_ENV === 'development' && <ChatDebugger />}
      </div>
    </ChatComponentErrorBoundary>
  );
};

export default ChatPageSimple;
