import React, { useState, useEffect } from 'react';
import { Send, Users, MessageCircle, Settings, User, Edit, MoreVertical, Search } from 'lucide-react';
import chatService, { ChatUser, ChatMessage, ChatChannel } from '../services/chatService';

const ChatPage: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [channels, setChannels] = useState<ChatChannel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<string>('general');
  const [newMessage, setNewMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [expandedDens, setExpandedDens] = useState<Set<string>>(new Set());
  const [currentUser, setCurrentUser] = useState<ChatUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Initialize chat
  useEffect(() => {
    const initializeChat = async () => {
      try {
        setIsLoading(true);
        
        // Initialize chat service and get current user
        const user = await chatService.initialize();
        setCurrentUser(user);
        
        // Load channels
        const channelData = await chatService.getChannels();
        setChannels(channelData);
        
        // Load online users
        const userData = await chatService.getOnlineUsers();
        setUsers(userData);
        
        // Load messages for selected channel
        const messageData = await chatService.getMessages(selectedChannel);
        setMessages(messageData);
        
        setIsConnected(true);
        
        // Set up real-time subscriptions
        const unsubscribeMessages = chatService.subscribeToMessages(selectedChannel, setMessages);
        const unsubscribeUsers = chatService.subscribeToOnlineUsers(setUsers);
        
        // Cleanup function
        return () => {
          unsubscribeMessages();
          unsubscribeUsers();
          chatService.cleanup();
        };
      } catch (error) {
        console.error('Failed to initialize chat:', error);
        setIsConnected(false);
      } finally {
        setIsLoading(false);
      }
    };

    initializeChat();
  }, [selectedChannel]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser) return;

    try {
      await chatService.sendMessage(selectedChannel, newMessage);
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const filteredChannels = channels.filter(channel => 
    channel.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-100 min-h-[calc(100vh-4rem)]">
      {/* Page Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 mb-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <MessageCircle className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-xl font-bold text-gray-900">Pack Chat</h1>
              {isConnected && (
                <div className="ml-3 flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-sm text-gray-500">Connected</span>
                </div>
              )}
            </div>
            
            {/* Mobile menu button */}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="md:hidden p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-16rem)]">
          {/* Sidebar */}
          <div className={`${isSidebarOpen ? 'block' : 'hidden'} lg:block lg:w-80 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden`}>
            {/* User Profile */}
            {currentUser && (
              <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{currentUser.name}</p>
                    <p className="text-sm text-blue-100 truncate">
                      {currentUser.den ? `${currentUser.den} Den` : 'Pack Member'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Search */}
            <div className="p-4 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search channels..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
            </div>

            {/* Channels */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Channels</h3>
                
                {/* Pack Channels */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">Pack Channels</span>
                    <span className="text-xs text-gray-400">{channels.filter(c => !c.isDenChannel).length}</span>
                  </div>
                  <div className="space-y-1">
                    {filteredChannels.filter(channel => !channel.isDenChannel).map(channel => (
                      <button
                        key={channel.id}
                        onClick={() => setSelectedChannel(channel.id)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                          selectedChannel === channel.id
                            ? 'bg-blue-100 text-blue-700 font-medium shadow-sm'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span>#{channel.name}</span>
                          <span className="text-xs text-gray-500">{channel.messageCount}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Den Channels */}
                <div className="space-y-4">
                  {[
                    { id: 'lion', name: 'Lion Den', icon: '🦁', color: 'text-yellow-600' },
                    { id: 'tiger', name: 'Tiger Den', icon: '🐯', color: 'text-orange-600' },
                    { id: 'wolf', name: 'Wolf Den', icon: '🐺', color: 'text-blue-600' },
                    { id: 'bear', name: 'Bear Den', icon: '🐻', color: 'text-brown-600' },
                    { id: 'webelos', name: 'Webelos Den', icon: '🏕️', color: 'text-green-600' },
                    { id: 'arrow-of-light', name: 'Arrow of Light', icon: '🏹', color: 'text-purple-600' }
                  ].map(den => {
                    const denChannels = filteredChannels.filter(channel => channel.denType === den.id);
                    const isExpanded = expandedDens.has(den.id);
                    
                    return (
                      <div key={den.id} className="space-y-1">
                        <button
                          onClick={() => {
                            const newExpanded = new Set(expandedDens);
                            if (isExpanded) {
                              newExpanded.delete(den.id);
                            } else {
                              newExpanded.add(den.id);
                            }
                            setExpandedDens(newExpanded);
                          }}
                          className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors duration-200 flex items-center justify-between"
                        >
                          <div className="flex items-center">
                            <span className="mr-2">{den.icon}</span>
                            <span>{den.name}</span>
                          </div>
                          <div className="flex items-center">
                            <span className="text-xs text-gray-500 mr-1">{denChannels.length}</span>
                            <svg
                              className={`w-3 h-3 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </button>
                        
                        {isExpanded && (
                          <div className="ml-4 space-y-1">
                            {denChannels.map(channel => (
                              <button
                                key={channel.id}
                                onClick={() => setSelectedChannel(channel.id)}
                                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                                  selectedChannel === channel.id
                                    ? 'bg-blue-100 text-blue-700 font-medium shadow-sm'
                                    : 'text-gray-600 hover:bg-gray-100'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <span>#{channel.name}</span>
                                  <span className="text-xs text-gray-500">{channel.messageCount}</span>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Online Users */}
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Online ({users.length})</h3>
              <div className="space-y-2">
                {users.slice(0, 5).map(user => (
                  <div key={user.id} className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-700 truncate">{user.name}</span>
                  </div>
                ))}
                {users.length > 5 && (
                  <p className="text-xs text-gray-500">+{users.length - 5} more</p>
                )}
              </div>
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Channel Header */}
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 px-6 py-4">
              {(() => {
                const currentChannel = channels.find(c => c.id === selectedChannel);
                return (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center min-w-0">
                      <span className="text-lg font-semibold text-gray-900 truncate">
                        #{currentChannel?.name || 'general'}
                      </span>
                      {currentChannel?.isDenChannel && (
                        <span className="ml-3 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full flex-shrink-0">
                          {currentChannel.denLevel}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>{currentChannel?.messageCount || 0} messages</span>
                      <span>{users.length} online</span>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Message List */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                {messages.map(message => (
                  <div
                    key={message.id}
                    className={`group ${
                      message.isSystem 
                        ? 'bg-yellow-50 border border-yellow-200 rounded-lg p-4' 
                        : 'hover:bg-gray-50 rounded-lg p-4 transition-colors duration-200'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          message.isSystem 
                            ? 'bg-yellow-200 text-yellow-800' 
                            : message.isAdmin 
                              ? 'bg-blue-200 text-blue-800' 
                              : 'bg-gray-200 text-gray-800'
                        }`}>
                          {message.isSystem ? (
                            <Settings className="w-4 h-4" />
                          ) : (
                            <span className="text-sm font-medium">
                              {message.userName.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className={`font-medium text-sm ${
                            message.isSystem ? 'text-yellow-800' : 
                            message.isAdmin ? 'text-blue-800' : 'text-gray-900'
                          }`}>
                            {message.userName}
                          </span>
                          {message.isAdmin && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                              Admin
                            </span>
                          )}
                          {message.isSystem && (
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                              System
                            </span>
                          )}
                          <span className="text-xs text-gray-500">
                            {formatTimestamp(message.timestamp)}
                          </span>
                        </div>
                        <p className={`text-sm ${
                          message.isSystem ? 'text-yellow-700' : 
                          message.isAdmin ? 'text-blue-700' : 'text-gray-700'
                        }`}>
                          {message.message}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Send Message */}
            <div className="border-t border-gray-200 p-6 bg-gray-50">
              <form onSubmit={handleSendMessage} className="flex space-x-4">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={`Message #${channels.find(c => c.id === selectedChannel)?.name || 'general'}...`}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center space-x-2"
                >
                  <Send className="w-4 h-4" />
                  <span>Send</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
