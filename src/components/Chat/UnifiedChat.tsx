import React, { useState, useEffect, useRef } from 'react';
import chatService from '../../services/chatService';
import { ChatChannel, ChatMessage } from '../../services/chatService';
import { useToast } from '../../contexts/ToastContext';
import { useAdmin } from '../../contexts/AdminContext';
import { Send, MessageCircle, Users, Settings, Trash2, MoreVertical, ChevronDown, ChevronRight } from 'lucide-react';

const UnifiedChat: React.FC = () => {
  const [channels, setChannels] = useState<ChatChannel[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<string>('general');
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({
    pack: true,
    dens: true
  });
  const { showError, showSuccess } = useToast();
  const { state } = useAdmin();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  
  // Check if user can delete messages (admin and up)
  const canDeleteMessages = state.currentUser?.role === 'super-admin' ||
                           state.currentUser?.role === 'content-admin' ||
                           state.currentUser?.role === 'moderator';
  const currentUserName = state.currentUser?.displayName || state.currentUser?.email || 'Anonymous User';

  // Initialize chat service and load channels on component mount
  useEffect(() => {
    const initializeChat = async () => {
      try {
        setIsLoading(true);
        
        // Initialize chat service
        await chatService.initialize();
        
        // Load channels
        await loadChannels();
      } catch (error) {
        console.error('Failed to initialize chat:', error);
        showError('Failed to initialize chat');
      } finally {
        setIsLoading(false);
      }
    };

    initializeChat();

    // Cleanup on unmount
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
      chatService.cleanup();
    };
  }, []);

  // Set up real-time message subscription when selectedChannel changes
  useEffect(() => {
    if (selectedChannel) {
      // Unsubscribe from previous channel
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }

      // Subscribe to new channel messages
      unsubscribeRef.current = chatService.subscribeToMessages(selectedChannel, (newMessages) => {
        setMessages(newMessages);
        // Auto-scroll to bottom when new messages arrive
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      });

      // Load initial messages
      loadMessages(selectedChannel);
    }
  }, [selectedChannel]);

  const loadChannels = async () => {
    try {
      const channelData = await chatService.getChannels();
      
      // Additional client-side deduplication as a safeguard
      const uniqueChannels = channelData.filter((channel: ChatChannel, index: number, self: ChatChannel[]) => 
        index === self.findIndex(c => c.name?.toLowerCase() === channel.name?.toLowerCase())
      );
      
      console.log(`📊 Loaded ${channelData.length} channels, ${uniqueChannels.length} unique after deduplication`);
      
      setChannels(uniqueChannels);
      if (uniqueChannels.length > 0 && !selectedChannel) {
        setSelectedChannel(uniqueChannels[0].id);
      }
    } catch (error) {
      console.error('Failed to load channels:', error);
      showError('Failed to load chat channels');
    }
  };

  const loadMessages = async (channelId: string) => {
    try {
      const messageData = await chatService.getMessages(channelId, 50);
      setMessages(messageData); // Messages are already in chronological order
    } catch (error) {
      console.error('Failed to load messages:', error);
      showError('Failed to load chat messages');
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || isSending) return;

    const messageText = newMessage.trim();
    setNewMessage(''); // Clear input immediately for instant feedback
    setIsSending(true);

    try {
      // Send message using direct Firestore (much faster than Cloud Functions)
      await chatService.sendMessage(selectedChannel, messageText);
      
      // Success feedback (no need to reload messages - real-time listener will handle it)
      showSuccess('Message sent!');
    } catch (error) {
      console.error('Failed to send message:', error);
      showError('Failed to send message');
      // Restore message on error
      setNewMessage(messageText);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return '';
    
    try {
      let date;
      if (timestamp.toDate) {
        // Firestore Timestamp
        date = timestamp.toDate();
      } else if (timestamp.seconds) {
        // Firestore Timestamp from Cloud Functions (serialized)
        date = new Date(timestamp.seconds * 1000);
      } else if (typeof timestamp === 'string') {
        // ISO string
        date = new Date(timestamp);
      } else if (timestamp instanceof Date) {
        // Already a Date object
        date = timestamp;
      } else {
        // Try to parse as Date
        date = new Date(timestamp);
      }
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return '';
      }
      
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (error) {
      console.error('Error formatting timestamp:', error, timestamp);
      return '';
    }
  };

  const deleteMessage = async (messageId: string) => {
    if (!canDeleteMessages) {
      showError('You do not have permission to delete messages');
      return;
    }
    
    // Confirm deletion
    if (!window.confirm('Are you sure you want to delete this message? This action cannot be undone.')) {
      return;
    }
    
    try {
      await chatService.deleteMessage(messageId);
      showSuccess('Message deleted successfully');
    } catch (error) {
      console.error('Failed to delete message:', error);
      showError('Failed to delete message');
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const getChannelEmoji = (channelName: string) => {
    const name = channelName.toLowerCase();
    
    // Pack channels
    if (name.includes('general')) return '🏠';
    if (name.includes('announcements')) return '📢';
    if (name.includes('events')) return '📅';
    if (name.includes('volunteer')) return '🤝';
    
    // Den channels
    if (name.includes('lion')) return '🦁';
    if (name.includes('tiger')) return '🐅';
    if (name.includes('wolf')) return '🐺';
    if (name.includes('bear')) return '🐻';
    if (name.includes('webelos')) return '🏕️';
    if (name.includes('arrow of light')) return '🏹';
    
    // Default
    return '💬';
  };

  const getChannelColor = (channelName: string) => {
    const name = channelName.toLowerCase();
    
    // Pack channels
    if (name.includes('general')) return 'bg-gradient-to-r from-primary-100 to-primary-200 border-primary-300 text-primary-800';
    if (name.includes('announcements')) return 'bg-gradient-to-r from-accent-100 to-accent-200 border-accent-300 text-accent-800';
    if (name.includes('events')) return 'bg-gradient-to-r from-secondary-100 to-secondary-200 border-secondary-300 text-secondary-800';
    if (name.includes('volunteer')) return 'bg-gradient-to-r from-orange-100 to-orange-200 border-orange-300 text-orange-800';
    
    // Den channels
    if (name.includes('lion')) return 'bg-gradient-to-r from-yellow-100 to-yellow-200 border-yellow-300 text-yellow-800';
    if (name.includes('tiger')) return 'bg-gradient-to-r from-orange-100 to-orange-200 border-orange-300 text-orange-800';
    if (name.includes('wolf')) return 'bg-gradient-to-r from-gray-100 to-gray-200 border-gray-300 text-gray-800';
    if (name.includes('bear')) return 'bg-gradient-to-r from-amber-100 to-amber-200 border-amber-300 text-amber-800';
    if (name.includes('webelos')) return 'bg-gradient-to-r from-green-100 to-green-200 border-green-300 text-green-800';
    if (name.includes('arrow of light')) return 'bg-gradient-to-r from-purple-100 to-purple-200 border-purple-300 text-purple-800';
    
    // Default
    return 'bg-gradient-to-r from-gray-100 to-gray-200 border-gray-300 text-gray-800';
  };

  const organizeChannels = () => {
    const packChannels = channels.filter(channel => 
      ['general', 'announcements', 'events', 'volunteer'].includes(channel.name.toLowerCase())
    );
    
    // Define den order from youngest to oldest
    const denOrder = ['lion', 'tiger', 'wolf', 'bear', 'webelos', 'arrow of light'];
    
    const denChannels = channels.filter(channel => 
      denOrder.some(den => channel.name.toLowerCase().includes(den))
    );
    
    // Sort den channels by age order (youngest to oldest)
    const sortedDenChannels = denChannels.sort((a, b) => {
      const aDenIndex = denOrder.findIndex(den => a.name.toLowerCase().includes(den));
      const bDenIndex = denOrder.findIndex(den => b.name.toLowerCase().includes(den));
      return aDenIndex - bDenIndex;
    });
    
    const otherChannels = channels.filter(channel => 
      !packChannels.includes(channel) && !denChannels.includes(channel)
    );

    return { packChannels, denChannels: sortedDenChannels, otherChannels };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <span className="ml-2 text-gray-600">Loading chat...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-surface-50 via-primary-50/30 to-secondary-50/30">
      <header className="bg-white/80 backdrop-blur-sm shadow-glow-primary/20 border-b border-primary-200/50 p-3 sm:p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-solar rounded-lg flex items-center justify-center shadow-glow-primary/30">
                <MessageCircle className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-xl sm:text-2xl font-semibold text-gradient">
                Pack Chat
              </h1>
            </div>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-4">
            {canDeleteMessages && (
              <div className="hidden sm:flex items-center text-sm bg-primary-100 text-primary-800 px-3 py-1 rounded-full border border-primary-200">
                <Settings className="h-4 w-4 mr-1" />
                <span>Admin Mode</span>
              </div>
            )}
            <div className="text-xs sm:text-sm bg-secondary-100 text-secondary-800 px-3 py-1 rounded-full border border-secondary-200">
              <span className="hidden sm:inline">Channel: </span>
              <span className="font-medium truncate max-w-32 sm:max-w-none">{selectedChannel}</span>
            </div>
          </div>
        </div>
        {canDeleteMessages && (
          <div className="sm:hidden mt-2 flex items-center text-xs bg-primary-100 text-primary-800 px-2 py-1 rounded-full border border-primary-200 w-fit">
            <Settings className="h-3 w-3 mr-1" />
            <span>Admin Mode</span>
          </div>
        )}
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Channel List */}
        <aside className="w-48 sm:w-64 bg-white/60 backdrop-blur-sm border-r border-primary-200/50 p-2 sm:p-4 overflow-y-auto">
          <h2 className="text-sm sm:text-lg font-semibold mb-3 sm:mb-4 text-gradient flex items-center">
            <MessageCircle className="h-4 w-4 mr-2" />
            Channels
          </h2>
          
          {(() => {
            const { packChannels, denChannels, otherChannels } = organizeChannels();
            
            return (
              <div className="space-y-2">
                {/* Pack Channels */}
                {packChannels.length > 0 && (
                  <div>
                    <button
                      onClick={() => toggleSection('pack')}
                      className="flex items-center w-full text-left p-1.5 sm:p-2 text-xs sm:text-sm font-medium bg-gradient-to-r from-primary-100 to-primary-200 text-primary-800 hover:from-primary-200 hover:to-primary-300 rounded-lg border border-primary-300/50 transition-all duration-300 shadow-sm hover:shadow-glow-primary/20"
                    >
                      {expandedSections.pack ? (
                        <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                      ) : (
                        <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                      )}
                      <span className="truncate flex items-center">
                        <span className="mr-1">🏠</span>
                        Pack Channels
                      </span>
                    </button>
                    {expandedSections.pack && (
                      <ul className="ml-4 space-y-1">
                        {packChannels.map((channel) => (
                          <li key={channel.id}>
                            <button
                              onClick={() => setSelectedChannel(channel.id)}
                              className={`w-full text-left p-1.5 sm:p-2 rounded-lg transition-all duration-300 border ${
                                selectedChannel === channel.id
                                  ? `${getChannelColor(channel.name)} shadow-glow-primary/30 border-2`
                                  : 'bg-white/50 hover:bg-white/80 text-gray-700 border-gray-200/50 hover:border-gray-300/50 hover:shadow-sm'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-xs sm:text-sm truncate flex items-center">
                                  <span className="mr-1">{getChannelEmoji(channel.name)}</span>
                                  {channel.name}
                                </span>
                                {canDeleteMessages && (
                                  <MoreVertical className="h-3 w-3 opacity-50 flex-shrink-0 ml-1" />
                                )}
                              </div>
                              {channel.description && (
                                <div className="text-xs text-gray-500 mt-1 truncate">{channel.description}</div>
                              )}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                {/* Den Channels */}
                {denChannels.length > 0 && (
                  <div>
                    <button
                      onClick={() => toggleSection('dens')}
                      className="flex items-center w-full text-left p-1.5 sm:p-2 text-xs sm:text-sm font-medium bg-gradient-to-r from-secondary-100 to-secondary-200 text-secondary-800 hover:from-secondary-200 hover:to-secondary-300 rounded-lg border border-secondary-300/50 transition-all duration-300 shadow-sm hover:shadow-glow-secondary/20"
                    >
                      {expandedSections.dens ? (
                        <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                      ) : (
                        <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                      )}
                      <span className="truncate flex items-center">
                        <span className="mr-1">🏕️</span>
                        Den Channels
                      </span>
                    </button>
                    {expandedSections.dens && (
                      <ul className="ml-4 space-y-1">
                        {denChannels.map((channel) => (
                          <li key={channel.id}>
                            <button
                              onClick={() => setSelectedChannel(channel.id)}
                              className={`w-full text-left p-1.5 sm:p-2 rounded-lg transition-all duration-300 border ${
                                selectedChannel === channel.id
                                  ? `${getChannelColor(channel.name)} shadow-glow-secondary/30 border-2`
                                  : 'bg-white/50 hover:bg-white/80 text-gray-700 border-gray-200/50 hover:border-gray-300/50 hover:shadow-sm'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-xs sm:text-sm truncate flex items-center">
                                  <span className="mr-1">{getChannelEmoji(channel.name)}</span>
                                  {channel.name}
                                </span>
                                {canDeleteMessages && (
                                  <MoreVertical className="h-3 w-3 opacity-50 flex-shrink-0 ml-1" />
                                )}
                              </div>
                              {channel.description && (
                                <div className="text-xs text-gray-500 mt-1 truncate">{channel.description}</div>
                              )}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                    {/* Other Channels */}
                    {otherChannels.length > 0 && (
                      <div>
                        <div className="text-xs sm:text-sm font-medium bg-gradient-to-r from-accent-100 to-accent-200 text-accent-800 px-3 py-1 rounded-lg border border-accent-300/50 mb-2 flex items-center">
                          <span className="mr-1">💬</span>
                          Other Channels
                        </div>
                        <ul className="space-y-1">
                          {otherChannels.map((channel) => (
                            <li key={channel.id}>
                              <button
                                onClick={() => setSelectedChannel(channel.id)}
                                className={`w-full text-left p-1.5 sm:p-2 rounded-lg transition-all duration-300 border ${
                                  selectedChannel === channel.id
                                    ? `${getChannelColor(channel.name)} shadow-glow-accent/30 border-2`
                                    : 'bg-white/50 hover:bg-white/80 text-gray-700 border-gray-200/50 hover:border-gray-300/50 hover:shadow-sm'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-xs sm:text-sm truncate flex items-center">
                                    <span className="mr-1">{getChannelEmoji(channel.name)}</span>
                                    {channel.name}
                                  </span>
                                  {canDeleteMessages && (
                                    <MoreVertical className="h-3 w-3 opacity-50 flex-shrink-0 ml-1" />
                                  )}
                                </div>
                                {channel.description && (
                                  <div className="text-xs text-gray-500 mt-1 truncate">{channel.description}</div>
                                )}
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
              </div>
            );
          })()}
        </aside>

        {/* Message Area */}
        <main className="flex-1 flex flex-col bg-white/80 backdrop-blur-sm">
          <div className="flex-1 overflow-y-auto p-2 sm:p-4 space-y-3 sm:space-y-4">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 py-6 sm:py-8">
                <div className="w-16 h-16 bg-gradient-solar rounded-full flex items-center justify-center mx-auto mb-4 shadow-glow-primary/30">
                  <MessageCircle className="h-8 w-8 text-white" />
                </div>
                <p className="text-sm sm:text-base text-gradient">No messages yet. Start the conversation!</p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.isAdmin ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[85%] sm:max-w-xs lg:max-w-md p-2 sm:p-3 rounded-xl shadow-sm border transition-all duration-300 hover:shadow-md ${
                      message.isAdmin
                        ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white border-primary-400 shadow-glow-primary/20'
                        : 'bg-white/90 text-gray-800 border-gray-200/50 shadow-glow-secondary/10'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center space-x-2">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                          message.isAdmin 
                            ? 'bg-white/20 text-white' 
                            : 'bg-gradient-to-r from-secondary-400 to-secondary-500 text-white'
                        }`}>
                          {(message.senderName || message.userName || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div className="font-semibold text-xs sm:text-sm truncate">
                          {message.senderName || message.userName || 'Unknown User'}
                        </div>
                      </div>
                      {canDeleteMessages && (
                        <button
                          onClick={() => deleteMessage(message.id)}
                          className="opacity-50 hover:opacity-100 transition-opacity flex-shrink-0 ml-1 p-1 rounded hover:bg-red-500/20"
                          title="Delete message"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm break-words">{message.content || message.message}</p>
                    <div
                      className={`text-xs mt-1 ${
                        message.isAdmin ? 'text-primary-100' : 'text-gray-500'
                      }`}
                    >
                      {formatTimestamp(message.timestamp)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Message Input */}
          <div className="border-t border-primary-200/50 p-2 sm:p-4 bg-white/60 backdrop-blur-sm">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type a message..."
                className="flex-1 p-2 sm:p-3 text-sm sm:text-base border-2 border-primary-200/50 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary-100 focus:border-primary-400 bg-white/80 backdrop-blur-sm transition-all duration-300 shadow-sm hover:shadow-glow-primary/10"
                disabled={isSending}
              />
              <button
                onClick={sendMessage}
                className="p-2 sm:p-3 bg-gradient-solar text-white rounded-xl hover:shadow-glow-primary/30 transition-all duration-300 flex items-center justify-center flex-shrink-0 transform hover:scale-105 hover:-translate-y-0.5 disabled:opacity-50 disabled:transform-none"
                disabled={isSending}
              >
                {isSending ? (
                  <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white"></div>
                ) : (
                  <Send size={16} />
                )}
              </button>
            </div>
          </div>
          
          {/* Auto-scroll anchor */}
          <div ref={messagesEndRef} />
        </main>
      </div>
    </div>
  );
};

export default UnifiedChat;
