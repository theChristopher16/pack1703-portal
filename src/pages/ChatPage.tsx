import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Send, MessageCircle, Settings, User, Search, Smile, Share2, 
  Bold, Italic, Underline, Loader2, Camera, Palette, Type, 
  List, Code, Quote, Link, Image, AtSign, Hash, Star, Lock
} from 'lucide-react';
import chatService, { ChatUser, ChatMessage, ChatChannel } from '../services/chatService';
import tenorService, { TenorGif } from '../services/tenorService';
import { useToast } from '../contexts/ToastContext';
import { authService, UserRole } from '../services/authService';
import analyticsService from '../services/analyticsService';
import ProfilePicture from '../components/ui/ProfilePicture';
import { useAdmin } from '../contexts/AdminContext';
import LoginModal from '../components/Auth/LoginModal';

// Rich text formatting utilities
const FORMATTING_PATTERNS = {
  bold: { pattern: '**', shortcut: 'Ctrl+B', icon: Bold },
  italic: { pattern: '*', shortcut: 'Ctrl+I', icon: Italic },
  underline: { pattern: '__', shortcut: 'Ctrl+U', icon: Underline },
  strikethrough: { pattern: '~~', shortcut: 'Ctrl+S', icon: 'Strikethrough' },
  code: { pattern: '`', shortcut: 'Ctrl+`', icon: Code },
  codeBlock: { pattern: '```', shortcut: 'Ctrl+Shift+`', icon: Code },
  quote: { pattern: '> ', shortcut: 'Ctrl+Shift+Q', icon: Quote },
  list: { pattern: '- ', shortcut: 'Ctrl+L', icon: List },
  link: { pattern: '[text](url)', shortcut: 'Ctrl+K', icon: Link },
  mention: { pattern: '@', shortcut: '@', icon: AtSign },
  hashtag: { pattern: '#', shortcut: '#', icon: Hash },
};

// Color palette for text colors
const TEXT_COLORS = [
  { name: 'Default', value: 'inherit', hex: '#000000' },
  { name: 'Red', value: 'text-red-500', hex: '#EF4444' },
  { name: 'Orange', value: 'text-orange-500', hex: '#F97316' },
  { name: 'Yellow', value: 'text-yellow-500', hex: '#EAB308' },
  { name: 'Green', value: 'text-green-500', hex: '#22C55E' },
  { name: 'Blue', value: 'text-blue-500', hex: '#3B82F6' },
  { name: 'Purple', value: 'text-purple-500', hex: '#A855F7' },
  { name: 'Pink', value: 'text-pink-500', hex: '#EC4899' },
  { name: 'Gray', value: 'text-gray-500', hex: '#6B7280' },
];

interface RichTextState {
  isBold: boolean;
  isItalic: boolean;
  isUnderline: boolean;
  isStrikethrough: boolean;
  isCode: boolean;
  selectedColor: string;
  selectedText: string;
  cursorPosition: { start: number; end: number };
}

const ChatPage: React.FC = () => {
  // All hooks must be called at the top level - NO EXCEPTIONS
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [channels, setChannels] = useState<ChatChannel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<string>('general');
  const [newMessage, setNewMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [expandedDens, setExpandedDens] = useState<Set<string>>(new Set(['pack', 'general']));
  const [currentUser, setCurrentUser] = useState<ChatUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [messageListRef, setMessageListRef] = useState<HTMLDivElement | null>(null);
  const [hasNewMessages, setHasNewMessages] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  
  // Rich text state
  const [richTextState, setRichTextState] = useState<RichTextState>({
    isBold: false,
    isItalic: false,
    isUnderline: false,
    isStrikethrough: false,
    isCode: false,
    selectedColor: 'inherit',
    selectedText: '',
    cursorPosition: { start: 0, end: 0 },
  });
  
  const [showRichToolbar, setShowRichToolbar] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [gifs, setGifs] = useState<TenorGif[]>([]);
  const [gifSearchQuery, setGifSearchQuery] = useState('');
  const [isLoadingGifs, setIsLoadingGifs] = useState(false);
  const [gifSearchResults, setGifSearchResults] = useState<TenorGif[]>([]);
  const [showGifSearch, setShowGifSearch] = useState(false);
  const [gifApiStatus, setGifApiStatus] = useState<string>('Loading...');
  const [showReactionPicker, setShowReactionPicker] = useState<string | null>(null);
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showSuccess, showError, showInfo } = useToast();
  
  // Get authentication state from AdminContext
  const { state } = useAdmin();
  const isAuthenticated = !!state.currentUser;
  const userRole = state.currentUser?.role as UserRole || UserRole.PARENT;
  const authLoading = state.isLoading;
  
  // Handle successful login
  const handleLoginSuccess = useCallback((user: any) => {
    console.log('Login successful:', user);
    setIsLoginModalOpen(false);
    // The AdminContext will automatically update the currentUser state
  }, []);

  // Den emoji mapping
  const denEmojis: Record<string, string> = {
    'lion': '🦁',
    'tiger': '🐯',
    'wolf': '🐺',
    'bear': '🐻',
    'webelos': '🏕️',
    'arrow-of-light': '🏹',
    'pack-leader': '👑',
    'parent': '👨‍👩‍👧‍👦'
  };

  // Den color mapping
  const denColors: Record<string, string> = {
    'lion': 'text-yellow-600',
    'tiger': 'text-orange-600',
    'wolf': 'text-blue-600',
    'bear': 'text-brown-600',
    'webelos': 'text-green-600',
    'arrow-of-light': 'text-purple-600',
    'pack-leader': 'text-red-600',
    'parent': 'text-gray-600'
  };

  // Reinitialize chat when authentication state changes
  useEffect(() => {
    if (authLoading) return; // Wait for auth check to complete
    
    if (!isAuthenticated) {
      // User signed out - cleanup chat
      if (isConnected) {
        chatService.cleanup();
        setIsConnected(false);
        setCurrentUser(null);
        setUsers([]);
        setChannels([]);
        setMessages([]);
      }
      setIsLoading(false);
      return;
    }

    // User signed in - reinitialize chat with new user data
    const reinitializeChat = async () => {
      try {
        console.log('Reinitializing chat for authenticated user...');
        setIsLoading(true);
        setError(null);
        
        // Cleanup existing chat session
        if (isConnected) {
          chatService.cleanup();
        }
        
        // Check if user is admin/volunteer to determine initialization method
        const currentAuthUser = authService.getCurrentUser();
        const isAdmin = currentAuthUser && (
          currentAuthUser.role === 'root' ||
          currentAuthUser.role === 'admin' ||
          currentAuthUser.role === 'volunteer'
        );
        
        // Initialize chat service with new user data
        const user = await chatService.reinitialize();
        console.log('Current user reinitialized:', user);
        setCurrentUser(user);
        
        // Load channels and users
        const channelData = await chatService.getChannels();
        setChannels(channelData);
        
        const userData = await chatService.getOnlineUsers();
        setUsers(userData);
        
        setIsConnected(true);
        setIsLoading(false);
        console.log('Chat reinitialization complete');
        
        // Set up real-time subscriptions
        const unsubscribeUsers = chatService.subscribeToOnlineUsers(setUsers);
        
        // Set up periodic refresh of online users (every 30 seconds)
        const refreshInterval = setInterval(async () => {
          try {
            const userData = await chatService.getOnlineUsers();
            setUsers(userData);
          } catch (error) {
            console.warn('Failed to refresh online users:', error);
          }
        }, 30000);
        
        return () => {
          unsubscribeUsers();
          clearInterval(refreshInterval);
        };
      } catch (error) {
        console.error('Failed to reinitialize chat:', error);
        setIsConnected(false);
        setError('Unable to reconnect to chat server. Please refresh the page.');
        setIsLoading(false);
      }
    };

    reinitializeChat();
  }, [isAuthenticated, authLoading, isConnected]); // Re-run when auth state changes

  // Initialize chat (only for authenticated users)
  useEffect(() => {
    if (authLoading) return; // Wait for auth check to complete
    
    if (!isAuthenticated) {
      setIsLoading(false);
      return; // Don't initialize chat for anonymous users
    }

    const initializeChat = async () => {
      try {
        console.log('Initializing chat for authenticated user...');
        setIsLoading(true);
        setError(null);
        
        // Add timeout to prevent infinite loading
        const timeoutPromise = new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Chat initialization timeout')), 10000)
        );
        
        // Initialize chat service and get current user
        console.log('Initializing chat service...');
        
        // Check if user is admin/root to initialize with admin privileges
        const isAdmin = state.currentUser?.isAdmin || state.currentUser?.role === 'root' || state.currentUser?.role === 'super-admin' || state.currentUser?.role === 'content-admin';
        
        const user = await Promise.race([
          isAdmin ? chatService.initializeAsAdmin() : chatService.initialize(),
          timeoutPromise
        ]) as ChatUser;
        console.log('Current user initialized:', user);
        setCurrentUser(user);
        
        // Load channels and users
        const channelData = await chatService.getChannels();
        console.log('Channels loaded:', channelData);
        setChannels(channelData);
        
        const userData = await chatService.getOnlineUsers();
        console.log('Users loaded:', userData);
        setUsers(userData);
        
        setIsConnected(true);
        setIsLoading(false);
        console.log('Chat initialization complete');
        
        // Set up real-time subscriptions
        const unsubscribeUsers = chatService.subscribeToOnlineUsers(setUsers);
        
        // Set up periodic refresh of online users (every 30 seconds)
        const refreshInterval = setInterval(async () => {
          try {
            const userData = await chatService.getOnlineUsers();
            setUsers(userData);
          } catch (error) {
            console.warn('Failed to refresh online users:', error);
          }
        }, 30000);
        
        // Cleanup function
        return () => {
          unsubscribeUsers();
          clearInterval(refreshInterval);
          chatService.cleanup();
        };
      } catch (error) {
        console.error('Failed to initialize chat:', error);
        setIsConnected(false);
        setError('Unable to connect to chat server. Please check your connection and try again.');
        // Set loading to false even on error to prevent infinite loading
        setIsLoading(false);
      }
    };

    initializeChat();
  }, [authLoading, isAuthenticated, state.currentUser?.isAdmin, state.currentUser?.role]); // Only run once for authenticated users

  // Handle channel switching (separate effect)
  useEffect(() => {
    if (!isConnected || !selectedChannel) return; // Don't run until chat is initialized
    
    const loadChannelMessages = async () => {
      try {
        console.log('Loading messages for channel:', selectedChannel);
        
        // Load messages for selected channel
        const messageData = await chatService.getMessages(selectedChannel);
        console.log('Messages loaded:', messageData);
        setMessages(messageData);
        
        // Set up real-time subscription for messages
        const unsubscribeMessages = chatService.subscribeToMessages(selectedChannel, setMessages);
        
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
        console.warn('Duplicate channels detected:', channels);
      }
      console.log('Channels loaded:', channels.length, 'unique:', uniqueIds.size);
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

  // Handle sending messages
  const handleSendMessage = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() && uploadedImages.length === 0) {
      return;
    }
    
    if (!currentUser) {
      console.log('No current user available');
      return;
    }

    try {
      setIsUploading(true);
      console.log('Sending message to channel:', selectedChannel);
      
      // Handle uploaded images
      let messageWithImages = newMessage.trim();
      if (uploadedImages.length > 0) {
        // For now, we'll add image placeholders to the message
        // In a real implementation, you'd upload to Firebase Storage and get URLs
        const imageTexts = uploadedImages.map((file, index) => 
          `![Uploaded Image ${index + 1}](${URL.createObjectURL(file)})`
        );
        messageWithImages = messageWithImages + (messageWithImages ? '\n' : '') + imageTexts.join('\n');
      }
      
      const formattedMessage = messageWithImages;
      await chatService.sendMessage(selectedChannel, formattedMessage);
      console.log('Message sent successfully');
      
      // Reset everything
      setNewMessage('');
      setUploadedImages([]);
      setRichTextState({
        isBold: false,
        isItalic: false,
        isUnderline: false,
        isStrikethrough: false,
        isCode: false,
        selectedColor: 'inherit',
        selectedText: '',
        cursorPosition: { start: 0, end: 0 },
      });
      setShowRichToolbar(false);
      setShowColorPicker(false);
      showSuccess('Message sent!', 'Your message has been delivered to the channel.');
    } catch (error) {
      console.error('Failed to send message:', error);
      showError('Message failed to send', 'Please check your connection and try again.');
    } finally {
      setIsUploading(false);
    }
  }, [newMessage, currentUser, selectedChannel, uploadedImages, showSuccess, showError]);

  // Conditional rendering based on authentication state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <MessageCircle className="h-16 w-16 text-blue-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Login Required</h2>
          <p className="text-gray-600 mb-6">Please log in to access the chat.</p>
          <button
            onClick={() => setIsLoginModalOpen(true)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Login
          </button>
        </div>
        
        <LoginModal
          isOpen={isLoginModalOpen}
          onClose={() => setIsLoginModalOpen(false)}
          onSuccess={handleLoginSuccess}
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Connecting to chat...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Connection Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Main chat interface
  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-primary-50/30 to-secondary-50/30 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <MessageCircle className="h-6 w-6 text-blue-600" />
            <h1 className="text-xl font-semibold text-gray-900">Scout Chat</h1>
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
          </div>
          <div className="flex items-center space-x-2">
            {currentUser && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <span>Welcome, {currentUser.name}</span>
                {currentUser.den && (
                  <span className={`px-2 py-1 rounded-full text-xs ${denColors[currentUser.den] || 'text-gray-600'}`}>
                    {denEmojis[currentUser.den]} {currentUser.den}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Chat Interface */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className={`${isSidebarOpen ? 'w-64' : 'w-0'} transition-all duration-300 bg-white border-r border-gray-200 overflow-hidden flex flex-col`}>
          {/* User Profile */}
          {currentUser && (
            <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-500 to-purple-600">
              <div className="flex items-center space-x-3">
                <ProfilePicture 
                  src={currentUser.photoURL} 
                  alt={currentUser.name} 
                  size="sm" 
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">
                    {currentUser.name}
                  </p>
                  <p className="text-xs text-blue-100">
                    {currentUser.den ? `${currentUser.den} Den` : 'Pack Member'}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Channels */}
          <div className="flex-1 overflow-y-auto p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center">
              <MessageCircle className="w-4 h-4 mr-2 text-blue-600" />
              Channels
            </h3>
            
            {/* Pack Channels */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Pack Channels</span>
                <span className="text-xs text-gray-500">{uniquePackChannels.length}</span>
              </div>
              <div className="space-y-2">
                {uniquePackChannels.map(channel => (
                  <button
                    key={channel.id}
                    onClick={() => setSelectedChannel(channel.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                      selectedChannel === channel.id
                        ? 'bg-blue-100 text-blue-900 font-medium'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="flex items-center">
                        <span className="mr-2">#</span>
                        {channel.name}
                      </span>
                      <span className="text-xs px-2 py-1 bg-gray-100 rounded-full">
                        {channel.messageCount}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Den Channels */}
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Den Channels</span>
                <span className="text-xs text-gray-500">
                  {uniqueDenChannels.filter(c => c.isDenChannel).length}
                </span>
              </div>
              
              {Object.entries(denEmojis).map(([denType, emoji]) => {
                const denChannels = uniqueDenChannels.filter(channel => channel.denType === denType);
                const isExpanded = expandedDens.has(denType);
                
                return (
                  <div key={denType} className="space-y-2">
                    <button
                      onClick={() => {
                        const newExpanded = new Set(expandedDens);
                        if (isExpanded) {
                          newExpanded.delete(denType);
                        } else {
                          newExpanded.add(denType);
                        }
                        setExpandedDens(newExpanded);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all duration-200 flex items-center justify-between ${
                        denChannels.some(c => c.id === selectedChannel)
                          ? 'bg-blue-100 text-blue-900 font-medium'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center">
                        <span className="text-lg mr-2">{emoji}</span>
                        <span className="capitalize">{denType.replace('-', ' ')}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs px-2 py-1 bg-gray-100 rounded-full">
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
                            key={channel.id}
                            onClick={() => setSelectedChannel(channel.id)}
                            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                              selectedChannel === channel.id
                                ? 'bg-blue-100 text-blue-900 font-medium'
                                : 'text-gray-600 hover:bg-gray-100'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="flex items-center">
                                <span className="mr-2">#</span>
                                {channel.name}
                              </span>
                              <span className="text-xs px-2 py-1 bg-gray-100 rounded-full">
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
          <div className="bg-white border-b border-gray-200 px-4 py-3 flex-shrink-0">
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
                      <span className="ml-2 px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
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
          <div 
            ref={setMessageListRef}
            className="flex-1 bg-gray-50 overflow-y-auto p-4"
          >
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div
                  key={message.id}
                  className={`p-3 rounded-lg ${
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
                        <span className="ml-2 px-2 py-1 bg-blue-200 text-blue-800 text-xs rounded-full">
                          Admin
                        </span>
                      )}
                      {message.isSystem && (
                        <span className="ml-2 px-2 py-1 bg-yellow-200 text-yellow-800 text-xs rounded-full">
                          System
                        </span>
                      )}
                      <span className="text-xs text-gray-500 ml-2">
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                  <div className={`text-sm break-words ${
                    message.isSystem ? 'text-yellow-700' : 
                    message.isAdmin ? 'text-blue-700' : 'text-gray-700'
                  }`}>
                    {message.message}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Message Input */}
          <div className="bg-white border-t border-gray-200 p-4 flex-shrink-0">
            <form onSubmit={handleSendMessage} className="flex space-x-4">
              <div className="flex-1">
                <textarea
                  ref={textareaRef}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={`Message #${channels.find(c => c.id === selectedChannel)?.name || 'general'}...`}
                  disabled={!currentUser}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={1}
                />
              </div>
              <button
                type="submit"
                disabled={(!newMessage.trim() && uploadedImages.length === 0) || !currentUser || isUploading}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
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
        </div>
      </div>
    </div>
  );
};

export default ChatPage;