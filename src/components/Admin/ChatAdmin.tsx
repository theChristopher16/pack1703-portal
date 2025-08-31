import React, { useState, useEffect } from 'react';
import { Send, Users, MessageCircle, Settings, AlertTriangle, CheckCircle, User, Edit, Image, Smile, Type, Palette, Share2, Bold, Italic, Underline, Code, Quote, List, Link, Trash2, Shield, Ban, VolumeX, Loader2 } from 'lucide-react';
import chatService, { ChatUser, ChatMessage, ChatChannel, SessionManager, MessageReaction } from '../../services/chatService';
import tenorService, { TenorGif } from '../../services/tenorService';
import { useToast } from '../../contexts/ToastContext';



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
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [messageListRef, setMessageListRef] = useState<HTMLDivElement | null>(null);
  const [hasNewMessages, setHasNewMessages] = useState(false);
  const [showRichInput, setShowRichInput] = useState(false);
  const [selectedColor, setSelectedColor] = useState<string>('#000000');
  const [selectedFont, setSelectedFont] = useState<string>('normal');
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [gifs, setGifs] = useState<TenorGif[]>([]);
  const [gifSearchQuery, setGifSearchQuery] = useState('');
  const [isLoadingGifs, setIsLoadingGifs] = useState(false);
  const [gifSearchResults, setGifSearchResults] = useState<TenorGif[]>([]);
  const [showGifSearch, setShowGifSearch] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState<string | null>(null);
  const { showSuccess, showError, showInfo, showWarning } = useToast();
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

  // Initialize chat (only once)
  useEffect(() => {
    const initializeChat = async () => {
      try {
        setIsLoading(true);
        
        // Initialize chat service and get current user
        const user = await chatService.initializeAsAdmin();
        setCurrentUser(user);
        
        // Load channels
        const channelData = await chatService.getChannels();
        setChannels(channelData);
        
        // Load online users
        const userData = await chatService.getOnlineUsers();
        setUsers(userData);
        
        setIsConnected(true);
        
        // Set up real-time subscriptions for users
        const unsubscribeUsers = chatService.subscribeToOnlineUsers(setUsers);
        
        // Update system status
        setSystemStatus(prev => ({
          ...prev,
          totalUsers: userData.length,
          onlineUsers: userData.filter(u => u.isOnline).length,
          activeChannels: channelData.filter(c => c.isActive).length,
          totalDens: 6,
          activeDens: 6
        }));
        
        // Cleanup function
        return () => {
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
  }, []); // Empty dependency array - only run once

  // Handle channel switching (separate effect)
  useEffect(() => {
    if (!isConnected) return; // Don't run until chat is initialized
    
    const loadChannelMessages = async () => {
      try {
        // Load messages for selected channel
        const messageData = await chatService.getMessages(selectedChannel);
        setMessages(messageData);
        
        // Set up real-time subscription for messages
        const unsubscribeMessages = chatService.subscribeToMessages(selectedChannel, setMessages);
        
        // Update system status with message count
        setSystemStatus(prev => ({
          ...prev,
          totalMessages: messageData.length
        }));
        
        // Return cleanup function
        return unsubscribeMessages;
      } catch (error) {
        console.error('Failed to load channel messages:', error);
      }
    };

    loadChannelMessages();
  }, [selectedChannel, isConnected]);

  // Debug: Check for duplicate channels
  useEffect(() => {
    if (channels.length > 0) {
      const channelIds = channels.map(c => c.id);
      const uniqueIds = new Set(channelIds);
      if (channelIds.length !== uniqueIds.size) {
        console.warn('Admin: Duplicate channels detected:', channels);
      }
      console.log('Admin: Channels loaded:', channels.length, 'unique:', uniqueIds.size);
    }
  }, [channels]);

  // Ensure unique channels by ID to prevent duplicates
  const uniquePackChannels = React.useMemo(() => {
    const packChannels = channels.filter(channel => !channel.isDenChannel);
    const seen = new Set();
    return packChannels.filter(channel => {
      if (seen.has(channel.id)) {
        return false;
      }
      seen.add(channel.id);
      return true;
    });
  }, [channels]);

  const uniqueDenChannels = React.useMemo(() => {
    const seen = new Set();
    return channels.filter(channel => {
      if (seen.has(channel.id)) {
        return false;
      }
      seen.add(channel.id);
      return true;
    });
  }, [channels]);


  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Debug logging
    console.log('Admin send message attempt:', {
      newMessage: newMessage,
      currentUser: currentUser,
      selectedChannel: selectedChannel,
      isConnected: isConnected
    });
    
    if (!newMessage.trim()) {
      console.log('Message is empty or whitespace only');
      return;
    }
    
    if (!currentUser) {
      console.log('No current user available');
      return;
    }

    try {
      console.log('Sending message to channel:', selectedChannel);
      const formattedMessage = applyFormatting(newMessage.trim());
      await chatService.sendMessage(selectedChannel, formattedMessage);
      console.log('Message sent successfully');
      setNewMessage('');
      // Reset formatting
      setIsBold(false);
      setIsItalic(false);
      setIsUnderline(false);
      setSelectedColor('#000000');
      setSelectedFont('normal');
      showSuccess('Admin message sent!', 'Your message has been delivered to the channel.');
    } catch (error) {
      console.error('Failed to send message:', error);
      showError('Message failed to send', 'Please check your connection and try again.');
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!currentUser?.isAdmin) return;

    try {
      await chatService.deleteMessage(messageId);
      showSuccess('Message deleted', 'The message has been removed from the channel.');
    } catch (error) {
      console.error('Failed to delete message:', error);
      showError('Delete failed', 'Unable to delete the message. Please try again.');
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

  // Scroll handling functions
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget;
    const isAtBottomNow = element.scrollHeight - element.scrollTop <= element.clientHeight + 10;
    setIsAtBottom(isAtBottomNow);
  };

  const scrollToBottom = () => {
    if (messageListRef) {
      messageListRef.scrollTo({
        top: messageListRef.scrollHeight,
        behavior: 'smooth'
      });
      setHasNewMessages(false);
    }
  };

  // Auto-scroll when new messages arrive (only if user is at bottom)
  useEffect(() => {
    if (isAtBottom && messageListRef) {
      scrollToBottom();
      setHasNewMessages(false);
    } else if (!isAtBottom) {
      setHasNewMessages(true);
    }
  }, [messages, isAtBottom]);

  // Rich chat helper functions
  const applyFormatting = (text: string) => {
    let formattedText = text;
    if (isBold) formattedText = `**${formattedText}**`;
    if (isItalic) formattedText = `*${formattedText}*`;
    if (isUnderline) formattedText = `__${formattedText}__`;
    return formattedText;
  };

  // Load trending GIFs when GIF picker is opened
  useEffect(() => {
    if (showGifPicker && gifs.length === 0) {
      loadTrendingGifs();
    }
  }, [showGifPicker]);

  const loadTrendingGifs = async () => {
    setIsLoadingGifs(true);
    try {
      const trendingGifs = await tenorService.getTrendingGifs(20);
      setGifs(trendingGifs);
      showInfo('GIFs loaded', 'Trending GIFs are ready to use!');
    } catch (error) {
      console.error('Error loading trending GIFs:', error);
      showError('GIFs failed to load', 'Using fallback GIFs instead.');
    } finally {
      setIsLoadingGifs(false);
    }
  };

  const searchGifs = async (query: string) => {
    if (!query.trim()) {
      setGifSearchResults([]);
      return;
    }

    setIsLoadingGifs(true);
    try {
      const results = await tenorService.searchGifs(query, 20);
      setGifSearchResults(results);
      if (results.length > 0) {
        showSuccess('GIFs found', `Found ${results.length} GIFs for "${query}"`);
      } else {
        showInfo('No GIFs found', `Try a different search term for "${query}"`);
      }
    } catch (error) {
      console.error('Error searching GIFs:', error);
      showError('Search failed', 'Please try again or use trending GIFs.');
    } finally {
      setIsLoadingGifs(false);
    }
  };

  const handleGifSearch = (e: React.FormEvent) => {
    e.preventDefault();
    searchGifs(gifSearchQuery);
  };

  const insertGif = (gif: TenorGif) => {
    const gifUrl = gif.media_formats.gif?.url || gif.media_formats.tinygif?.url || gif.media_formats.nanogif?.url || '';
    setNewMessage(prev => prev + ` ![${gif.title}](${gifUrl})`);
    setShowGifPicker(false);
    setShowGifSearch(false);
    setGifSearchQuery('');
    setGifSearchResults([]);
    showSuccess('GIF added!', `"${gif.title}" has been added to your message.`);
  };

  const handleAddReaction = async (messageId: string, emoji: string) => {
    if (!currentUser) {
      showError('Not signed in', 'Please sign in to add reactions.');
      return;
    }

    try {
      await chatService.addReaction(messageId, emoji, currentUser.id, currentUser.name);
      setShowReactionPicker(null);
    } catch (error) {
      console.error('Error adding reaction:', error);
      showError('Reaction failed', 'Unable to add reaction. Please try again.');
    }
  };

  const getReactionCount = (message: ChatMessage, emoji: string): number => {
    return message.reactions?.filter(r => r.emoji === emoji).length || 0;
  };

  const hasUserReacted = (message: ChatMessage, emoji: string): boolean => {
    if (!currentUser) return false;
    return message.reactions?.some(r => r.userId === currentUser.id && r.emoji === emoji) || false;
  };

  const commonReactions = ['👍', '❤️', '😂', '😮', '😢', '😡', '🎉', '🔥', '👏', '🙏'];

  // Function to render message content with GIF support
  const renderMessageContent = (messageText: string) => {
    // Split the message into parts (text and images)
    const parts = messageText.split(/(!\[.*?\]\(.*?\))/g);
    
    return parts.map((part, index) => {
      // Check if this part is an image markdown
      const imageMatch = part.match(/!\[(.*?)\]\((.*?)\)/);
      if (imageMatch) {
        const [, altText, imageUrl] = imageMatch;
        return (
          <img
            key={index}
            src={imageUrl}
            alt={altText}
            className="max-w-xs max-h-48 rounded-lg shadow-sm my-2"
            onError={(e) => {
              // Fallback if image fails to load
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
        );
      }
      // Regular text
      return <span key={index}>{part}</span>;
    });
  };

  const shareMessage = (message: ChatMessage) => {
    const shareText = `${message.userName}: ${message.message}`;
    if (navigator.share) {
      navigator.share({
        title: 'Scout Chat Message',
        text: shareText,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(shareText);
    }
  };

  // Helper functions for message grouping and date separators
  const formatMessageTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);

    if (minutes < 1) return 'now';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDateSeparator = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / 86400000);

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return date.toLocaleDateString([], { weekday: 'long' });
    return date.toLocaleDateString([], { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  const shouldShowDateSeparator = (currentMessage: ChatMessage, previousMessage: ChatMessage | null) => {
    if (!previousMessage) return true;
    
    const currentDate = new Date(currentMessage.timestamp);
    const previousDate = new Date(previousMessage.timestamp);
    
    return currentDate.toDateString() !== previousDate.toDateString();
  };

  const shouldShowTimestamp = (currentMessage: ChatMessage, nextMessage: ChatMessage | null) => {
    if (!nextMessage) return true;
    
    const currentDate = new Date(currentMessage.timestamp);
    const nextDate = new Date(nextMessage.timestamp);
    
    const timeDiff = Math.abs(currentDate.getTime() - nextDate.getTime());
    const fiveMinutes = 5 * 60 * 1000;
    
    return currentMessage.userName !== nextMessage.userName || timeDiff > fiveMinutes;
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
          <div className="flex flex-col md:flex-row h-96 md:h-96 relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl overflow-hidden shadow-soft">
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
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-soft' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                <span>{isSidebarOpen ? 'Hide Channels' : 'Show Channels'}</span>
              </button>
            </div>

            {/* Modern Sidebar */}
            <div className={`${isSidebarOpen ? 'block' : 'hidden'} md:block md:w-64 bg-gradient-to-b from-white to-gray-50 border-r border-gray-200 overflow-hidden flex flex-col absolute md:relative top-0 left-0 w-full md:w-64 h-full z-20 backdrop-blur-sm`}>
              {/* User Profile Section */}
              {currentUser && (
                <div className="p-4 border-b border-gray-200 flex-shrink-0 bg-gradient-to-r from-blue-500 to-purple-600">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center backdrop-blur-sm">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">
                        {currentUser.name}
                      </p>
                      <p className="text-xs text-blue-100">
                        {currentUser.den ? `${currentUser.den} Den` : 'Pack Member'}
                      </p>
                      <p className="text-xs text-blue-200">
                        Admin Account
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveTab('settings')}
                      className="p-2 text-white hover:text-blue-200 hover:bg-white hover:bg-opacity-20 rounded-lg transition-all duration-200"
                      title="Admin Settings"
                    >
                      <Settings className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
              
              <div className="p-4 overflow-y-auto flex-1 min-h-0" style={{ maxHeight: 'calc(100vh - 300px)' }}>
                <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center">
                  <MessageCircle className="w-4 h-4 mr-2 text-blue-600" />
                  Channels
                </h3>
                
                {/* Pack Channels Section */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide bg-gray-100 px-2 py-1 rounded-full">Pack Channels</span>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">{uniquePackChannels.length}</span>
                  </div>
                  <div className="space-y-2">
                    {uniquePackChannels.map(channel => (
                      <button
                        key={`pack-channel-${channel.id}`}
                        onClick={() => setSelectedChannel(channel.id)}
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
                            {channel.messageCount}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Den Channels Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide bg-gray-100 px-2 py-1 rounded-full">Den Channels</span>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                      {uniqueDenChannels.filter(c => c.isDenChannel).length}
                    </span>
                  </div>
                  
                  {[
                    { id: 'lion', name: 'Lion Den', icon: '🦁', color: 'text-yellow-600', bgColor: 'bg-yellow-50' },
                    { id: 'tiger', name: 'Tiger Den', icon: '🐯', color: 'text-orange-600', bgColor: 'bg-orange-50' },
                    { id: 'wolf', name: 'Wolf Den', icon: '🐺', color: 'text-blue-600', bgColor: 'bg-blue-50' },
                    { id: 'bear', name: 'Bear Den', icon: '🐻', color: 'text-brown-600', bgColor: 'bg-brown-50' },
                    { id: 'webelos', name: 'Webelos Den', icon: '🏕️', color: 'text-green-600', bgColor: 'bg-green-50' },
                    { id: 'arrow-of-light', name: 'Arrow of Light', icon: '🏹', color: 'text-purple-600', bgColor: 'bg-purple-50' }
                  ].map(den => {
                    const denChannels = uniqueDenChannels.filter(channel => channel.denType === den.id);
                    const isExpanded = expandedDens.has(den.id);
                    
                    return (
                      <div key={`den-${den.id}`} className="space-y-2">
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
                          className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-all duration-200 flex items-center justify-between ${
                            denChannels.some(c => c.id === selectedChannel)
                              ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium shadow-soft'
                              : `${den.bgColor} text-gray-700 hover:shadow-soft`
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
                                onClick={() => setSelectedChannel(channel.id)}
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
                                    {channel.messageCount}
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
              </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col min-h-0">
              {/* Channel Header */}
              <div className="bg-gradient-to-r from-white to-gray-50 border-b border-gray-200 px-4 py-3">
                {(() => {
                  const currentChannel = channels.find(c => c.id === selectedChannel);
                  return (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center min-w-0">
                        <span className="text-lg font-semibold text-gray-900 truncate flex items-center">
                          <span className="mr-2">#</span>
                          {currentChannel?.name || 'general'}
                        </span>
                        {currentChannel?.isDenChannel && (
                          <span className="ml-2 px-2 py-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs rounded-full flex-shrink-0 shadow-soft">
                            {currentChannel.denLevel}
                          </span>
                        )}
                        {hasNewMessages && !isAtBottom && (
                          <span className="ml-2 px-2 py-1 bg-red-500 text-white text-xs rounded-full flex-shrink-0 animate-pulse">
                            New messages
                          </span>
                        )}
                      </div>
                      <span className="text-sm text-gray-500 flex-shrink-0 ml-2 bg-gray-100 px-2 py-1 rounded-full">
                        {currentChannel?.messageCount || 0} messages
                      </span>
                    </div>
                  );
                })()}
              </div>

                          {/* Message List */}
              <div 
                ref={setMessageListRef}
                className="flex-1 bg-gray-50 overflow-y-auto p-2 md:p-4 relative"
                onScroll={handleScroll}
              >
                {/* Scroll to Bottom Button */}
                {!isAtBottom && (
                  <button
                    onClick={scrollToBottom}
                    className="absolute bottom-4 right-4 z-10 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-3 shadow-lg transition-all duration-200 transform hover:scale-110"
                    title="Scroll to bottom"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                  </button>
                )}
                
                <div className="space-y-3 md:space-y-4">
                  {messages.map((message, index) => {
                    const previousMessage = index > 0 ? messages[index - 1] : null;
                    const nextMessage = index < messages.length - 1 ? messages[index + 1] : null;
                    const showDateSeparator = shouldShowDateSeparator(message, previousMessage);
                    const showTimestamp = shouldShowTimestamp(message, nextMessage);
                    
                    return (
                      <React.Fragment key={message.id}>
                        {/* Date Separator */}
                        {showDateSeparator && (
                          <div className="flex justify-center my-6">
                            <div className="px-4 py-2 bg-gray-100 text-gray-600 text-sm font-medium rounded-full">
                              {formatDateSeparator(new Date(message.timestamp))}
                            </div>
                          </div>
                        )}
                        
                                                {/* Message */}
                        <div
                          className={`p-3 rounded-lg relative group ${
                            message.isSystem 
                              ? 'bg-yellow-100 border-l-4 border-yellow-400' 
                              : message.isAdmin 
                                ? 'bg-blue-100 border-l-4 border-blue-400' 
                                : 'bg-white border-l-4 border-gray-200'
                          }`}
                        >
                          {/* Admin Controls */}
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex space-x-1">
                            <button
                              onClick={() => setShowReactionPicker(showReactionPicker === message.id ? null : message.id)}
                              className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                              title="Add reaction"
                            >
                              <Smile className="w-4 h-4" />
                            </button>
                            {currentUser?.isAdmin && !message.isSystem && (
                              <>
                                <button
                                  onClick={() => handleDeleteMessage(message.id)}
                                  className="p-1 text-red-500 hover:text-red-700 hover:bg-red-100 rounded"
                                  title="Delete message"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => shareMessage(message)}
                                  className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                                  title="Share message"
                                >
                                  <Share2 className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                          
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
                              {showTimestamp && (
                                <span className="text-xs text-gray-500 ml-2">
                                  {formatMessageTime(new Date(message.timestamp))}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className={`text-sm break-words ${
                            message.isSystem ? 'text-yellow-700' : 
                            message.isAdmin ? 'text-blue-700' : 'text-gray-700'
                          }`}>
                            {renderMessageContent(message.message)}
                          </div>
                          
                          {/* Reactions */}
                          {message.reactions && message.reactions.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {Array.from(new Set(message.reactions.map(r => r.emoji))).map(emoji => (
                                <button
                                  key={emoji}
                                  onClick={() => handleAddReaction(message.id, emoji)}
                                  className={`px-2 py-1 text-xs rounded-full transition-colors duration-200 ${
                                    hasUserReacted(message, emoji)
                                      ? 'bg-blue-100 text-blue-700 border border-blue-200'
                                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                  }`}
                                >
                                  {emoji} {getReactionCount(message, emoji)}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                                             </React.Fragment>
                     );
                   })}
                </div>
                
                {/* Reaction Picker */}
                {showReactionPicker && (
                  <div className="absolute bottom-20 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-10">
                    <div className="grid grid-cols-5 gap-1">
                      {commonReactions.map(emoji => (
                        <button
                          key={emoji}
                          onClick={() => handleAddReaction(showReactionPicker, emoji)}
                          className="w-8 h-8 text-lg hover:bg-gray-100 rounded transition-colors duration-200"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Send Message */}
              <div className="bg-white border-t border-gray-200 p-2 md:p-4">
                <form onSubmit={handleSendMessage} className="space-y-3">
                  {/* Rich Input Toolbar */}
                  <div className="flex items-center space-x-2 p-3 bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-xl">
                    <button 
                      onClick={() => setIsBold(!isBold)} 
                      className={`p-2 rounded-lg transition-all duration-200 ${
                        isBold ? 'bg-blue-100 text-blue-600 shadow-soft' : 'text-gray-600 hover:text-gray-800 hover:bg-gray-200'
                      }`} 
                      title="Bold"
                    >
                      <Bold className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => setIsItalic(!isItalic)} 
                      className={`p-2 rounded-lg transition-all duration-200 ${
                        isItalic ? 'bg-blue-100 text-blue-600 shadow-soft' : 'text-gray-600 hover:text-gray-800 hover:bg-gray-200'
                      }`} 
                      title="Italic"
                    >
                      <Italic className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => setIsUnderline(!isUnderline)} 
                      className={`p-2 rounded-lg transition-all duration-200 ${
                        isUnderline ? 'bg-blue-100 text-blue-600 shadow-soft' : 'text-gray-600 hover:text-gray-800 hover:bg-gray-200'
                      }`} 
                      title="Underline"
                    >
                      <Underline className="w-4 h-4" />
                    </button>
                    <div className="w-px h-6 bg-gray-300"></div>
                    <button 
                      onClick={() => setShowGifPicker(!showGifPicker)} 
                      className="p-2 rounded-lg text-gray-600 hover:text-gray-800 hover:bg-gray-200 transition-all duration-200" 
                      title="Insert GIF"
                    >
                      <Smile className="w-4 h-4" />
                    </button>
                    <input 
                      type="color" 
                      value={selectedColor} 
                      onChange={(e) => setSelectedColor(e.target.value)} 
                      className="w-8 h-8 rounded-lg border-2 border-gray-300 cursor-pointer" 
                      title="Text color" 
                    />
                    <div className="w-px h-6 bg-gray-300"></div>
                    <select 
                      value={selectedFont} 
                      onChange={(e) => setSelectedFont(e.target.value)} 
                      className="px-3 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                      title="Font style"
                    >
                      <option value="normal">Normal</option>
                      <option value="monospace">Code</option>
                      <option value="serif">Serif</option>
                    </select>
                  </div>
                  
                  {/* GIF Picker */}
                  {showGifPicker && (
                    <div className="p-4 bg-white border border-gray-200 rounded-xl shadow-soft">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-sm font-semibold text-gray-900">GIFs</h4>
                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() => setShowGifSearch(!showGifSearch)}
                            className="px-3 py-1 text-xs bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors duration-200"
                          >
                            {showGifSearch ? 'Trending' : 'Search'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowGifPicker(false)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            ×
                          </button>
                        </div>
                      </div>

                      {/* GIF Search */}
                      {showGifSearch && (
                        <div className="mb-4">
                          <div className="flex space-x-2">
                            <input
                              type="text"
                              value={gifSearchQuery}
                              onChange={(e) => setGifSearchQuery(e.target.value)}
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  searchGifs(gifSearchQuery);
                                }
                              }}
                              placeholder="Search GIFs..."
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            />
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                searchGifs(gifSearchQuery);
                              }}
                              disabled={isLoadingGifs}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors duration-200"
                            >
                              {isLoadingGifs ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* API Status */}
                      <div className="mb-3 p-2 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-600">
                          {tenorService.getApiStatus()}
                        </p>
                      </div>

                      {/* GIF Grid */}
                      <div className="grid grid-cols-5 gap-2">
                        {isLoadingGifs ? (
                          // Loading skeleton
                          Array.from({ length: 10 }).map((_, index) => (
                            <div
                              key={index}
                              className="w-full h-20 bg-gray-200 rounded-lg animate-pulse"
                            />
                          ))
                        ) : (showGifSearch ? gifSearchResults : gifs).length > 0 ? (
                          (showGifSearch ? gifSearchResults : gifs).map((gif) => (
                            <button
                              key={gif.id}
                              type="button"
                              onClick={() => insertGif(gif)}
                              className="w-full h-20 bg-gray-100 rounded-lg overflow-hidden hover:shadow-glow transition-all duration-200"
                              title={gif.title}
                            >
                              <img 
                                src={gif.media_formats.tinygif?.url || gif.media_formats.gif?.url || gif.media_formats.nanogif?.url || ''} 
                                alt={gif.title} 
                                className="w-full h-full object-cover"
                              />
                            </button>
                          ))
                        ) : (
                          <div className="col-span-5 text-center py-8 text-gray-500">
                            {showGifSearch ? 'No GIFs found. Try a different search term.' : 'Loading GIFs...'}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Message Input */}
                  <div className="flex space-x-4">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder={currentUser ? `Message #${channels.find(c => c.id === selectedChannel)?.name || 'general'}...` : 'Connecting to chat...'}
                        disabled={!currentUser}
                        style={{ 
                          color: selectedColor, 
                          fontFamily: selectedFont === 'monospace' ? 'monospace' : selectedFont === 'serif' ? 'serif' : 'inherit' 
                        }}
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm shadow-soft transition-all duration-200"
                      />
                      
                      {/* Message Preview */}
                      {newMessage.includes('![') && (
                        <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                          <p className="text-xs text-gray-500 mb-2">Preview:</p>
                          <div className="text-sm text-gray-700">
                            {renderMessageContent(newMessage)}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <button
                      type="submit"
                      disabled={!newMessage.trim() || !currentUser}
                      className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-xl shadow-soft hover:shadow-glow transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      <span>Send</span>
                    </button>
                  </div>
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
