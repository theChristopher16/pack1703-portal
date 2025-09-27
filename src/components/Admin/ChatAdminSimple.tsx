import React, { useState, useEffect } from 'react';
import { Send, MessageCircle, Users, Settings } from 'lucide-react';
import { chatServiceCloudFunctions } from '../../services/chatServiceCloudFunctions';
import { useToast } from '../../contexts/ToastContext';

interface ChatChannel {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
}

interface ChatMessage {
  id: string;
  channelId: string;
  content: string;
  senderId: string;
  senderName: string;
  timestamp: any;
  createdAt: any;
}

const ChatAdminSimple: React.FC = () => {
  const [channels, setChannels] = useState<ChatChannel[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<string>('general');
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const { showError, showSuccess } = useToast();

  // Load channels on component mount
  useEffect(() => {
    loadChannels();
  }, []);

  // Load messages when channel changes
  useEffect(() => {
    if (selectedChannel) {
      loadMessages(selectedChannel);
    }
  }, [selectedChannel]);

  const loadChannels = async () => {
    try {
      setIsLoading(true);
      const channelData = await chatServiceCloudFunctions.getChannels();
      setChannels(channelData);
      
      // Set default channel if none selected
      if (channelData.length > 0 && !selectedChannel) {
        setSelectedChannel(channelData[0].id);
      }
    } catch (error) {
      console.error('Failed to load channels:', error);
      showError('Failed to load chat channels');
    } finally {
      setIsLoading(false);
    }
  };

  const loadMessages = async (channelId: string) => {
    try {
      const messageData = await chatServiceCloudFunctions.getMessages(channelId, 50);
      setMessages(messageData.reverse()); // Reverse to show newest at bottom
    } catch (error) {
      console.error('Failed to load messages:', error);
      showError('Failed to load chat messages');
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || isSending) return;

    try {
      setIsSending(true);
      const message = await chatServiceCloudFunctions.sendMessage(
        selectedChannel,
        newMessage.trim(),
        'Admin User' // TODO: Get actual user name
      );
      
      setNewMessage('');
      // Reload messages to show the new one
      await loadMessages(selectedChannel);
      showSuccess('Message sent successfully');
    } catch (error) {
      console.error('Failed to send message:', error);
      showError('Failed to send message');
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <span className="ml-3 text-gray-600">Loading chat...</span>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white rounded-lg shadow-sm border">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gray-50 rounded-t-lg">
        <div className="flex items-center space-x-2">
          <MessageCircle className="h-5 w-5 text-primary-600" />
          <h2 className="text-lg font-semibold text-gray-900">Chat Admin</h2>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <Users className="h-4 w-4" />
          <span>Channel: {selectedChannel}</span>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Channels */}
        <div className="w-64 border-r bg-gray-50 p-4">
          <h3 className="font-medium text-gray-900 mb-3">Channels</h3>
          <div className="space-y-2">
            {channels.map((channel) => (
              <button
                key={channel.id}
                onClick={() => setSelectedChannel(channel.id)}
                className={`w-full text-left p-2 rounded-md transition-colors ${
                  selectedChannel === channel.id
                    ? 'bg-primary-100 text-primary-900 border border-primary-200'
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                <div className="font-medium">{channel.name}</div>
                {channel.description && (
                  <div className="text-xs text-gray-500 mt-1">{channel.description}</div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <MessageCircle className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>No messages yet. Start the conversation!</p>
              </div>
            ) : (
              messages.map((message) => (
                <div key={message.id} className="flex space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-primary-600">
                        {(message.senderName || 'U').charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-900">{message.senderName || 'Unknown User'}</span>
                      <span className="text-xs text-gray-500">{formatTimestamp(message.timestamp)}</span>
                    </div>
                    <div className="mt-1 text-gray-700 whitespace-pre-wrap">{message.content}</div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Message Input */}
          <div className="border-t p-4">
            <div className="flex space-x-2">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                className="flex-1 resize-none border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                rows={2}
                disabled={isSending}
              />
              <button
                onClick={sendMessage}
                disabled={!newMessage.trim() || isSending}
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <Send className="h-4 w-4" />
                <span>{isSending ? 'Sending...' : 'Send'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatAdminSimple;
