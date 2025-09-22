import React, { useEffect, useRef } from 'react';
import { 
  Send, MessageCircle, Settings, User, Search, Smile, Share2, 
  Bold, Italic, Underline, Loader2, Camera, Palette, Type, 
  List, Code, Quote, Link, Image, AtSign, Hash, Star, Lock
} from 'lucide-react';
import chatService, { ChatUser, ChatMessage, ChatChannel } from '../services/chatService';
import tenorService, { TenorGif } from '../services/tenorService';
import { useToast } from '../contexts/ToastContext';
import { authService, UserRole } from '../services/authService';
import ProfilePicture from '../components/ui/ProfilePicture';
import { useChatState } from '../hooks/useOptimizedState';

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

const ChatPage: React.FC = () => {
  // Use optimized state management instead of 20+ useState hooks
  const { state, actions, selectors } = useChatState();
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showSuccess, showError, showInfo } = useToast();

  // Initialize chat service and load data
  useEffect(() => {
    const initializeChat = async () => {
      try {
        actions.setLoading(true);
        
        // Initialize chat service
        await chatService.initialize();
        
        // Load initial data
        const [channels, users] = await Promise.all([
          chatService.getChannels(),
          chatService.getAllUsers()
        ]);
        
        actions.setChannels(channels);
        actions.setUsers(users);
        actions.setConnected(true);
        
        // TODO: Set up real-time listeners when available
        // chatService.onMessage((message) => {
        //   actions.addMessage(message);
        // });
        
        // chatService.onUserUpdate((user) => {
        //   actions.setUsers(prev => 
        //     prev.map(u => u.id === user.id ? user : u)
        //   );
        // });
        
        // chatService.onChannelUpdate((channel) => {
        //   actions.setChannels(prev => 
        //     prev.map(c => c.id === channel.id ? channel : c)
        //   );
        // });
        
      } catch (error) {
        console.error('Failed to initialize chat:', error);
        actions.setError('Failed to connect to chat service');
      } finally {
        actions.setLoading(false);
      }
    };

    initializeChat();
  }, [actions]);

  // Handle authentication state changes
  useEffect(() => {
    const unsubscribe = authService.onAuthStateChanged(async (user) => {
      if (user) {
        actions.setAuthenticated(true);
        actions.setUserRole(user.role);
        
        // Reinitialize chat service with authenticated user
        await chatService.reinitialize();
        const currentUser = await chatService.getCurrentUser();
        actions.setCurrentUser(currentUser);
      } else {
        actions.setAuthenticated(false);
        actions.setUserRole(UserRole.PARENT);
        actions.setCurrentUser(null);
      }
      actions.setAuthLoading(false);
    });

    return unsubscribe;
  }, [actions]);

  // Load messages when channel changes
  useEffect(() => {
    if (state.selectedChannel) {
      const loadMessages = async () => {
        try {
          const messages = await chatService.getMessages(state.selectedChannel);
          actions.setMessages(messages);
        } catch (error) {
          console.error('Failed to load messages:', error);
          actions.setError('Failed to load messages');
        }
      };
      
      loadMessages();
    }
  }, [state.selectedChannel, actions]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (state.isAtBottom && state.messageListRef) {
      state.messageListRef.scrollTop = state.messageListRef.scrollHeight;
    }
  }, [state.messages, state.isAtBottom, state.messageListRef]);

  // Handle sending messages
  const handleSendMessage = async () => {
    if (!state.newMessage.trim() || !selectors.canSendMessage) return;

    try {
      const message: ChatMessage = {
        id: Date.now().toString(),
        message: state.newMessage,
        userId: state.currentUser!.id,
        userName: state.currentUser!.name,
        channelId: state.selectedChannel,
        timestamp: new Date(),
        isSystem: false,
        isAdmin: state.currentUser!.isAdmin || false,
        reactions: []
      };

      await chatService.sendMessage(state.selectedChannel, state.newMessage);
      actions.setNewMessage('');
      actions.setUploadedImages([]);
      
      showSuccess('Message sent successfully');
    } catch (error) {
      console.error('Failed to send message:', error);
      showError('Failed to send message');
    }
  };

  // Handle channel selection
  const handleChannelSelect = (channelId: string) => {
    actions.setSelectedChannel(channelId);
    actions.setNewMessage('');
  };

  // Handle den expansion toggle
  const handleDenToggle = (den: string) => {
    actions.toggleDenExpansion(den);
  };

  // Handle rich text formatting
  const handleFormatText = (format: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = state.newMessage.substring(start, end);
    
    let formattedText = '';
    switch (format) {
      case 'bold':
        formattedText = `**${selectedText}**`;
        break;
      case 'italic':
        formattedText = `*${selectedText}*`;
        break;
      case 'underline':
        formattedText = `__${selectedText}__`;
        break;
      case 'strikethrough':
        formattedText = `~~${selectedText}~~`;
        break;
      case 'code':
        formattedText = `\`${selectedText}\``;
        break;
      default:
        formattedText = selectedText;
    }

    const newMessage = state.newMessage.substring(0, start) + formattedText + state.newMessage.substring(end);
    actions.setNewMessage(newMessage);
    
    // Update cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + formattedText.length, start + formattedText.length);
    }, 0);
  };

  // Handle GIF search
  const handleGifSearch = async (query: string) => {
    if (!query.trim()) return;

    try {
      actions.setLoadingGifs(true);
      const results = await tenorService.searchGifs(query);
      actions.setGifSearchResults(results);
    } catch (error) {
      console.error('Failed to search GIFs:', error);
      showError('Failed to search GIFs');
    } finally {
      actions.setLoadingGifs(false);
    }
  };

  // Handle GIF selection
  const handleGifSelect = (gif: any) => {
    const gifUrl = gif.media_formats?.gif?.url || gif.media_formats?.tinygif?.url || '';
    const gifMessage = `![${gif.title || 'GIF'}](${gifUrl})`;
    actions.setNewMessage(state.newMessage + gifMessage);
    actions.setShowGifPicker(false);
  };

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length > 0) {
      actions.setUploadedImages([...state.uploadedImages, ...imageFiles]);
      showSuccess(`${imageFiles.length} image(s) added`);
    }
  };

  // Handle message reactions
  const handleReaction = async (messageId: string, emoji: string) => {
    try {
      await chatService.addReaction(messageId, emoji, state.currentUser!.id, state.currentUser!.name);
      actions.setShowReactionPicker(null);
    } catch (error) {
      console.error('Failed to add reaction:', error);
      showError('Failed to add reaction');
    }
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.ctrlKey || event.metaKey) {
      switch (event.key) {
        case 'b':
          event.preventDefault();
          handleFormatText('bold');
          break;
        case 'i':
          event.preventDefault();
          handleFormatText('italic');
          break;
        case 'u':
          event.preventDefault();
          handleFormatText('underline');
          break;
        case 'Enter':
          event.preventDefault();
          handleSendMessage();
          break;
      }
    }
  };

  // Render loading state
  if (state.isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex items-center space-x-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading chat...</span>
        </div>
      </div>
    );
  }

  // Render error state
  if (state.error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="text-red-500 mb-2">Error: {state.error}</div>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Render chat interface
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`${state.isSidebarOpen ? 'w-80' : 'w-0'} transition-all duration-300 bg-white border-r border-gray-200 overflow-hidden`}>
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Channels</h2>
            <button
              onClick={() => actions.setSidebarOpen(false)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
          
          {/* Search */}
          <div className="mt-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search channels..."
                value={state.searchQuery}
                onChange={(e) => actions.setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Channels List */}
        <div className="flex-1 overflow-y-auto">
          {state.channels
            .filter(channel => 
              channel.name.toLowerCase().includes(state.searchQuery.toLowerCase())
            )
            .map(channel => (
              <div
                key={channel.id}
                onClick={() => handleChannelSelect(channel.id)}
                className={`p-3 hover:bg-gray-50 cursor-pointer border-l-4 ${
                  state.selectedChannel === channel.id 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-transparent'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Hash className="w-4 h-4 text-gray-400" />
                  <span className="font-medium">{channel.name}</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">{channel.description}</p>
              </div>
            ))}
        </div>

        {/* User Info */}
        {state.currentUser && (
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center space-x-3">
              <ProfilePicture
                src={state.currentUser.photoURL}
                alt={state.currentUser.name}
                size="sm"
              />
              <div>
                <div className="font-medium">{state.currentUser.name}</div>
                <div className="text-sm text-gray-500">{state.userRole}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {!state.isSidebarOpen && (
                <button
                  onClick={() => actions.setSidebarOpen(true)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <MessageCircle className="w-5 h-5" />
                </button>
              )}
              <div>
                <h1 className="text-lg font-semibold">
                  {selectors.currentChannel?.name || 'Select a channel'}
                </h1>
                <p className="text-sm text-gray-500">
                  {selectors.currentChannel?.description || ''}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1 text-sm text-gray-500">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>{selectors.onlineUsersCount} online</span>
              </div>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div 
          ref={(ref) => actions.setMessageListRef(ref)}
          className="flex-1 overflow-y-auto p-4 space-y-4"
          onScroll={(e) => {
            const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
            const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
            actions.setAtBottom(isAtBottom);
          }}
        >
          {selectors.filteredMessages.map(message => (
            <div key={message.id} className="flex space-x-3">
              <ProfilePicture
                src={undefined} // ChatMessage doesn't have photoURL
                alt={message.userName || 'Unknown'}
                size="sm"
              />
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <span className="font-medium">{message.userName || 'Unknown'}</span>
                  <span className="text-sm text-gray-500">
                    {message.timestamp.toLocaleTimeString()}
                  </span>
                </div>
                <div className="mt-1">
                  <p className="text-gray-900">{message.message}</p>
                  
                  {/* Reactions */}
                  {message.reactions && message.reactions.length > 0 && (
                    <div className="flex space-x-1 mt-2">
                      {message.reactions.map((reaction, index) => (
                        <button
                          key={index}
                          onClick={() => handleReaction(message.id, reaction.emoji)}
                          className="flex items-center space-x-1 px-2 py-1 bg-gray-100 rounded-full hover:bg-gray-200"
                        >
                          <span>{reaction.emoji}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Message Input */}
        <div className="p-4 border-t border-gray-200 bg-white">
          {/* Rich Text Toolbar */}
          {state.showRichToolbar && (
            <div className="flex items-center space-x-1 mb-2 p-2 bg-gray-50 rounded-lg">
              <button
                onClick={() => handleFormatText('bold')}
                className={`p-1 rounded ${state.richTextState.isBold ? 'bg-blue-100' : 'hover:bg-gray-200'}`}
                title="Bold (Ctrl+B)"
              >
                <Bold className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleFormatText('italic')}
                className={`p-1 rounded ${state.richTextState.isItalic ? 'bg-blue-100' : 'hover:bg-gray-200'}`}
                title="Italic (Ctrl+I)"
              >
                <Italic className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleFormatText('underline')}
                className={`p-1 rounded ${state.richTextState.isUnderline ? 'bg-blue-100' : 'hover:bg-gray-200'}`}
                title="Underline (Ctrl+U)"
              >
                <Underline className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleFormatText('code')}
                className={`p-1 rounded ${state.richTextState.isCode ? 'bg-blue-100' : 'hover:bg-gray-200'}`}
                title="Code (Ctrl+`)"
              >
                <Code className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Message Input */}
          <div className="flex items-end space-x-2">
            <div className="flex-1">
              <textarea
                ref={textareaRef}
                value={state.newMessage}
                onChange={(e) => actions.setNewMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => actions.setShowRichToolbar(true)}
                placeholder={selectors.canSendMessage ? "Type a message..." : "Please log in to send messages"}
                disabled={!selectors.canSendMessage}
                className="w-full p-3 border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
              />
              
              {/* Uploaded Images Preview */}
              {state.uploadedImages.length > 0 && (
                <div className="flex space-x-2 mt-2">
                  {state.uploadedImages.map((file, index) => (
                    <div key={index} className="relative">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={file.name}
                        className="w-16 h-16 object-cover rounded"
                      />
                      <button
                        onClick={() => actions.setUploadedImages(state.uploadedImages.filter((_, i) => i !== index))}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-1">
              {/* File Upload */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                title="Upload image"
              >
                <Camera className="w-5 h-5" />
              </button>
              
              {/* GIF Picker */}
              <button
                onClick={() => actions.setShowGifPicker(!state.showGifPicker)}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                title="Add GIF"
              >
                <Smile className="w-5 h-5" />
              </button>
              
              {/* Send Button */}
              <button
                onClick={handleSendMessage}
                disabled={!state.newMessage.trim() || !selectors.canSendMessage}
                className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Send message (Ctrl+Enter)"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* GIF Picker Modal */}
      {state.showGifPicker && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-h-96 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Choose a GIF</h3>
              <button
                onClick={() => actions.setShowGifPicker(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>
            
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search GIFs..."
                value={state.gifSearchQuery}
                onChange={(e) => actions.setGifSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleGifSearch(state.gifSearchQuery)}
                className="w-full p-2 border border-gray-200 rounded-lg"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              {state.gifSearchResults.map(gif => (
                <button
                  key={gif.id}
                  onClick={() => handleGifSelect(gif)}
                  className="aspect-square overflow-hidden rounded-lg hover:ring-2 hover:ring-blue-500"
                >
                  <img
                    src={gif.media_formats.tinygif?.url || gif.media_formats.gif?.url}
                    alt={gif.title}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatPage;
