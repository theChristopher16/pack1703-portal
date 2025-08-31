import React, { useState, useEffect } from 'react';
import { Send, Users, MessageCircle, Settings, AlertTriangle, CheckCircle, User, Edit } from 'lucide-react';
import chatService, { ChatUser, ChatMessage, ChatChannel, SessionManager } from '../../services/chatService';



const ChatAdmin: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'messages' | 'users' | 'channels' | 'dens' | 'settings'>('overview');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [channels, setChannels] = useState<ChatChannel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<string>('general');
  const [newMessage, setNewMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [expandedDens, setExpandedDens] = useState<Set<string>>(new Set());
  const [currentUser, setCurrentUser] = useState<ChatUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [systemStatus, setSystemStatus] = useState({
    totalUsers: 0,
    onlineUsers: 0,
    totalMessages: 0,
    activeChannels: 0,
    totalDens: 0,
    activeDens: 0,
    uptime: '2 days, 14 hours',
    lastRestart: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
  });

  // Mock data for demonstration
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
        
        // Update system status
        setSystemStatus(prev => ({
          ...prev,
          totalUsers: userData.length,
          onlineUsers: userData.filter(u => u.isOnline).length,
          totalMessages: messageData.length,
          activeChannels: channelData.filter(c => c.isActive).length,
          totalDens: 6,
          activeDens: 6
        }));
        
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
      // You could show an error toast here
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!currentUser?.isAdmin) return;

    try {
      await chatService.deleteMessage(messageId);
    } catch (error) {
      console.error('Failed to delete message:', error);
    }
  };

  const handleBanUser = async (userId: string, reason: string) => {
    if (!currentUser?.isAdmin) return;

    try {
      await chatService.banUser(userId, reason);
    } catch (error) {
      console.error('Failed to ban user:', error);
    }
  };

  const handleMuteUser = async (userId: string, durationMinutes: number, reason: string) => {
    if (!currentUser?.isAdmin) return;

    try {
      await chatService.muteUser(userId, durationMinutes, reason);
    } catch (error) {
      console.error('Failed to mute user:', error);
    }
  };

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatLastSeen = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Chat Admin - Discord-lite</h1>
        <p className="text-gray-600">Manage pack communication and chat system</p>
      </div>

      {/* Connection Status */}
      <div className="mb-6">
        <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
          isConnected 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {isConnected ? (
            <>
              <CheckCircle className="w-4 h-4 mr-2" />
              Connected
            </>
          ) : (
            <>
              <AlertTriangle className="w-4 h-4 mr-2" />
              Disconnected
            </>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-1 mb-8 bg-gray-100 rounded-lg p-1">
        {[
          { id: 'overview', label: 'Overview', icon: '📊' },
          { id: 'messages', label: 'Messages', icon: '💬' },
          { id: 'users', label: 'Users', icon: '👥' },
          { id: 'channels', label: 'Channels', icon: '📢' },
          { id: 'dens', label: 'Dens', icon: '🏕️' },
          { id: 'settings', label: 'Settings', icon: '⚙️' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center px-3 md:px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <span className="mr-1 md:mr-2">{tab.icon}</span>
            <span className="hidden sm:inline">{tab.label}</span>
            <span className="sm:hidden">{tab.label.charAt(0)}</span>
          </button>
        ))}
      </div>

                      {/* Content Area */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <>
            {activeTab === 'overview' && (
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">System Overview</h2>
            
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center">
                  <Users className="w-8 h-8 text-blue-600 mr-3" />
                  <div>
                    <p className="text-sm text-blue-600">Total Users</p>
                    <p className="text-2xl font-bold text-blue-900">{systemStatus.totalUsers}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center">
                  <CheckCircle className="w-8 h-8 text-green-600 mr-3" />
                  <div>
                    <p className="text-sm text-green-600">Online Users</p>
                    <p className="text-2xl font-bold text-green-900">{systemStatus.onlineUsers}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="flex items-center">
                  <MessageCircle className="w-8 h-8 text-purple-600 mr-3" />
                  <div>
                    <p className="text-sm text-purple-600">Total Messages</p>
                    <p className="text-2xl font-bold text-purple-900">{systemStatus.totalMessages}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-orange-50 rounded-lg p-4">
                <div className="flex items-center">
                  <Settings className="w-8 h-8 text-orange-600 mr-3" />
                  <div>
                    <p className="text-sm text-orange-600">Active Channels</p>
                    <p className="text-2xl font-bold text-orange-900">{systemStatus.activeChannels}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-indigo-50 rounded-lg p-4">
                <div className="flex items-center">
                  <span className="text-2xl mr-3">🏕️</span>
                  <div>
                    <p className="text-sm text-indigo-600">Total Dens</p>
                    <p className="text-2xl font-bold text-indigo-900">{systemStatus.totalDens}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-teal-50 rounded-lg p-4">
                <div className="flex items-center">
                  <span className="text-2xl mr-3">🌟</span>
                  <div>
                    <p className="text-sm text-teal-600">Active Dens</p>
                    <p className="text-2xl font-bold text-teal-900">{systemStatus.activeDens}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* System Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-3">System Status</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Uptime:</span>
                    <span className="text-gray-900">{systemStatus.uptime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Last Restart:</span>
                    <span className="text-gray-900">{systemStatus.lastRestart.toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Connection:</span>
                    <span className="text-green-600">✓ Stable</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Recent Activity</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Last Message:</span>
                    <span className="text-gray-900">2 minutes ago</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">New Users Today:</span>
                    <span className="text-gray-900">3</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Messages Today:</span>
                    <span className="text-gray-900">47</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'messages' && (
          <div className="flex flex-col md:flex-row h-96 md:h-96 relative">
            {/* Mobile Overlay */}
            {isSidebarOpen && (
              <div 
                className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-10"
                onClick={() => setIsSidebarOpen(false)}
              />
            )}
            {/* Mobile Sidebar Toggle */}
            <div className="md:hidden bg-white border-b border-gray-200 p-3">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                  isSidebarOpen 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                <span>{isSidebarOpen ? 'Hide Channels' : 'Show Channels'}</span>
              </button>
            </div>

            {/* Discord-style Sidebar */}
            <div className={`${isSidebarOpen ? 'block' : 'hidden'} md:block md:w-64 bg-gray-50 border-r border-gray-200 overflow-y-auto flex-shrink-0 absolute md:relative top-0 left-0 w-full md:w-64 h-full z-20`}>
              {/* User Profile Section */}
              {currentUser && (
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {currentUser.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {currentUser.den ? `${currentUser.den} Den` : 'Pack Member'}
                      </p>
                      <p className="text-xs text-blue-500">
                        Auto-assigned name
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveTab('settings')}
                      className="p-1 text-gray-400 hover:text-gray-600"
                      title="Edit Den & Family Name"
                    >
                      <Edit className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}
              
              <div className="p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Channels</h3>
                
                {/* Pack Channels Section */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">Pack Channels</span>
                    <span className="text-xs text-gray-400">3</span>
                  </div>
                  <div className="space-y-1">
                    {channels.filter(channel => !channel.isDenChannel).map(channel => (
                      <button
                        key={channel.id}
                        onClick={() => setSelectedChannel(channel.id)}
                        className={`w-full text-left px-2 py-1 rounded text-sm transition-colors duration-200 ${
                          selectedChannel === channel.id
                            ? 'bg-blue-100 text-blue-700 font-medium'
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

                {/* Den Channels Section */}
                <div className="space-y-3">
                  {[
                    { id: 'lion', name: 'Lion Den', icon: '🦁', color: 'text-yellow-600' },
                    { id: 'tiger', name: 'Tiger Den', icon: '🐯', color: 'text-orange-600' },
                    { id: 'wolf', name: 'Wolf Den', icon: '🐺', color: 'text-blue-600' },
                    { id: 'bear', name: 'Bear Den', icon: '🐻', color: 'text-brown-600' },
                    { id: 'webelos', name: 'Webelos Den', icon: '🏕️', color: 'text-green-600' },
                    { id: 'arrow-of-light', name: 'Arrow of Light', icon: '🏹', color: 'text-purple-600' }
                  ].map(den => {
                    const denChannels = channels.filter(channel => channel.denType === den.id);
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
                          className="w-full text-left px-2 py-1 rounded text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors duration-200 flex items-center justify-between"
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
                                className={`w-full text-left px-2 py-1 rounded text-sm transition-colors duration-200 ${
                                  selectedChannel === channel.id
                                    ? 'bg-blue-100 text-blue-700 font-medium'
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

            {/* Chat Area */}
            <div className="flex-1 flex flex-col min-h-0">
              {/* Channel Header */}
              <div className="bg-white border-b border-gray-200 px-4 py-3">
                {(() => {
                  const currentChannel = channels.find(c => c.id === selectedChannel);
                  return (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center min-w-0">
                        <span className="text-lg font-semibold text-gray-900 truncate">
                          #{currentChannel?.name || 'general'}
                        </span>
                        {currentChannel?.isDenChannel && (
                          <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full flex-shrink-0">
                            {currentChannel.denLevel}
                          </span>
                        )}
                      </div>
                      <span className="text-sm text-gray-500 flex-shrink-0 ml-2">
                        {currentChannel?.messageCount || 0} messages
                      </span>
                    </div>
                  );
                })()}
              </div>

                          {/* Message List */}
              <div className="flex-1 bg-gray-50 overflow-y-auto p-2 md:p-4">
                <div className="space-y-3 md:space-y-4">
                  {messages.map(message => (
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
                      {/* Admin Delete Button */}
                      {currentUser?.isAdmin && !message.isSystem && (
                        <button
                          onClick={() => handleDeleteMessage(message.id)}
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 text-red-500 hover:text-red-700 hover:bg-red-100 rounded"
                          title="Delete message"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                      
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
                        <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                          {formatTimestamp(message.timestamp)}
                        </span>
                      </div>
                      <p className={`text-sm break-words ${
                        message.isSystem ? 'text-yellow-700' : 
                        message.isAdmin ? 'text-blue-700' : 'text-gray-700'
                      }`}>
                        {message.message}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Send Message */}
              <div className="bg-white border-t border-gray-200 p-2 md:p-4">
                <form onSubmit={handleSendMessage} className="flex gap-2 md:gap-3">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={`Message #${channels.find(c => c.id === selectedChannel)?.name || 'general'}...`}
                    className="flex-1 px-3 md:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm md:text-base"
                  />
                  <button
                    type="submit"
                    className="px-4 md:px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center text-sm md:text-base"
                  >
                    <Send className="w-4 h-4 mr-1 md:mr-2" />
                    <span className="hidden sm:inline">Send</span>
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">User Management</h2>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Den
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Seen
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map(user => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className={`w-3 h-3 rounded-full mr-3 ${
                            user.isOnline ? 'bg-green-400' : 'bg-gray-400'
                          }`} />
                          <div>
                            <div className="text-sm font-medium text-gray-900">{user.name}</div>
                            <div className="text-sm text-gray-500">{user.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.isOnline 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {user.isOnline ? 'Online' : 'Offline'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {user.den ? (
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            user.den === 'lion' ? 'bg-yellow-100 text-yellow-800' :
                            user.den === 'tiger' ? 'bg-orange-100 text-orange-800' :
                            user.den === 'wolf' ? 'bg-blue-100 text-blue-800' :
                            user.den === 'bear' ? 'bg-brown-100 text-brown-800' :
                            user.den === 'webelos' ? 'bg-green-100 text-green-800' :
                            user.den === 'arrow-of-light' ? 'bg-purple-100 text-purple-800' :
                            user.den === 'pack-leader' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {user.scoutRank || user.den}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">No Den</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatLastSeen(user.lastSeen)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.isAdmin 
                            ? 'bg-purple-100 text-purple-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {user.isAdmin ? 'Admin' : 'User'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button className="text-blue-600 hover:text-blue-900 mr-3">
                          Edit
                        </button>
                        <button className="text-red-600 hover:text-red-900">
                          Ban
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'channels' && (
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Channel Management</h2>
            
                        {/* Pack Channels */}
            <div className="mb-8">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Pack Channels</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {channels.filter(channel => !channel.isDenChannel).map(channel => (
                  <div key={channel.id} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-medium text-gray-900">#{channel.name}</h3>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      channel.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {channel.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-3">{channel.description}</p>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Messages:</span>
                      <span className="text-gray-900">{channel.messageCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Last Activity:</span>
                      <span className="text-gray-900">{formatLastSeen(channel.lastActivity)}</span>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex gap-2">
                    <button className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors duration-200">
                      Edit
                    </button>
                    <button className={`px-3 py-1 text-xs rounded transition-colors duration-200 ${
                      channel.isActive 
                        ? 'bg-red-600 text-white hover:bg-red-700' 
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}>
                      {channel.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                </div>
                ))}
              </div>
            </div>
            
            {/* Den Channels */}
            <div className="mb-8">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Den Channels</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {channels.filter(channel => channel.isDenChannel).map(channel => (
                  <div key={channel.id} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center">
                        <h3 className="text-lg font-medium text-gray-900">#{channel.name}</h3>
                        <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          {channel.denLevel}
                        </span>
                      </div>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        channel.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {channel.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-3">{channel.description}</p>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Messages:</span>
                        <span className="text-gray-900">{channel.messageCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Last Activity:</span>
                        <span className="text-gray-900">{formatLastSeen(channel.lastActivity)}</span>
                      </div>
                    </div>
                    
                    <div className="mt-4 flex gap-2">
                      <button className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors duration-200">
                        Edit
                      </button>
                      <button className={`px-3 py-1 text-xs rounded transition-colors duration-200 ${
                        channel.isActive 
                          ? 'bg-red-600 text-white hover:bg-red-700' 
                          : 'bg-green-600 text-white hover:bg-green-700'
                      }`}>
                        {channel.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="mt-6">
              <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200">
                Create New Channel
              </button>
            </div>
          </div>
        )}

        {activeTab === 'dens' && (
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Den Management</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { id: 'lion', name: 'Lion Den', color: 'bg-yellow-50', textColor: 'text-yellow-800', borderColor: 'border-yellow-200', icon: '🦁' },
                { id: 'tiger', name: 'Tiger Den', color: 'bg-orange-50', textColor: 'text-orange-800', borderColor: 'border-orange-200', icon: '🐯' },
                { id: 'wolf', name: 'Wolf Den', color: 'bg-blue-50', textColor: 'text-blue-800', borderColor: 'border-blue-200', icon: '🐺' },
                { id: 'bear', name: 'Bear Den', color: 'bg-brown-50', textColor: 'text-brown-800', borderColor: 'border-brown-200', icon: '🐻' },
                { id: 'webelos', name: 'Webelos Den', color: 'bg-green-50', textColor: 'text-green-800', borderColor: 'border-green-200', icon: '🏕️' },
                { id: 'arrow-of-light', name: 'Arrow of Light', color: 'bg-purple-50', textColor: 'text-purple-800', borderColor: 'border-purple-200', icon: '🏹' }
              ].map(den => {
                const denUsers = users.filter(u => u.den === den.id);
                const denChannel = channels.find(c => c.denType === den.id);
                const onlineUsers = denUsers.filter(u => u.isOnline).length;
                
                return (
                  <div key={den.id} className={`${den.color} rounded-lg p-4 border ${den.borderColor}`}>
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center">
                        <span className="text-2xl mr-2">{den.icon}</span>
                        <h3 className="text-lg font-medium text-gray-900">{den.name}</h3>
                      </div>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${den.color} ${den.textColor}`}>
                        {denUsers.length} Scouts
                      </span>
                    </div>
                    
                    <div className="space-y-2 text-sm mb-4">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Scouts:</span>
                        <span className="text-gray-900">{denUsers.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Online:</span>
                        <span className="text-green-600">{onlineUsers}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Channel Messages:</span>
                        <span className="text-gray-900">{denChannel?.messageCount || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Last Activity:</span>
                        <span className="text-gray-900">{denChannel ? formatLastSeen(denChannel.lastActivity) : 'No activity'}</span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <button className={`px-3 py-1 ${den.textColor} ${den.color} text-xs rounded hover:opacity-80 transition-opacity duration-200`}>
                        View Scouts
                      </button>
                      <button className={`px-3 py-1 ${den.textColor} ${den.color} text-xs rounded hover:opacity-80 transition-opacity duration-200`}>
                        Den Chat
                      </button>
                      <button className={`px-3 py-1 ${den.textColor} ${den.color} text-xs rounded hover:opacity-80 transition-opacity duration-200`}>
                        Settings
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="mt-6">
              <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200">
                Create New Den
              </button>
            </div>
                    </div>
        )}

        {activeTab === 'settings' && (
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Settings</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* User Profile Settings */}
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Your Profile</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Display Name</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={currentUser?.name || ''}
                        readOnly
                        className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-600 cursor-not-allowed"
                      />
                      <span className="text-xs text-gray-500 bg-blue-50 px-2 py-1 rounded">
                        Auto-assigned
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Your name is automatically assigned and will persist across sessions. 
                      Clear your browser data to get a new name.
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Den</label>
                    <select
                      value={currentUser?.den || ''}
                      onChange={(e) => {
                        if (currentUser) {
                          setCurrentUser({ ...currentUser, den: e.target.value as any });
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select Den</option>
                      <option value="lion">Lion Den</option>
                      <option value="tiger">Tiger Den</option>
                      <option value="wolf">Wolf Den</option>
                      <option value="bear">Bear Den</option>
                      <option value="webelos">Webelos Den</option>
                      <option value="arrow-of-light">Arrow of Light</option>
                      <option value="pack-leader">Pack Leader</option>
                      <option value="parent">Parent</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Family Name</label>
                    <input
                      type="text"
                      value={currentUser?.familyName || ''}
                      onChange={(e) => {
                        if (currentUser) {
                          setCurrentUser({ ...currentUser, familyName: e.target.value });
                        }
                      }}
                      placeholder="Optional: Your family name"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <button
                    onClick={async () => {
                      if (currentUser) {
                        try {
                          await chatService.updateUserProfile(currentUser.name, currentUser.den);
                          alert('Profile updated successfully!');
                        } catch (error) {
                          console.error('Failed to update profile:', error);
                          alert('Failed to update profile');
                        }
                      }
                    }}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                  >
                    Update Den & Family Name
                  </button>
                </div>
              </div>
              
              {/* System Settings */}
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 mb-4">System Settings</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Message Retention (days)</label>
                    <input
                      type="number"
                      defaultValue={30}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Max Message Length</label>
                    <input
                      type="number"
                      defaultValue={500}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Rate Limit (messages/min)</label>
                    <input
                      type="number"
                      defaultValue={10}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end">
              <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200">
                Save Settings
              </button>
            </div>
          </div>
        )}
          </>
        </div>
    </div>
  );
};

export default ChatAdmin;
