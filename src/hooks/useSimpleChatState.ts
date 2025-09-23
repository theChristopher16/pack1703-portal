import { useState, useCallback, useMemo } from 'react';
import { ChatMessage, ChatChannel, ChatUser } from '../services/chatService';
import { UserRole } from '../services/authService';

// Simplified chat state interface
export interface SimpleChatState {
  // Core data
  currentUser: ChatUser | null;
  channels: ChatChannel[];
  messages: ChatMessage[];
  users: ChatUser[];
  
  // UI state
  selectedChannel: string;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  isSidebarOpen: boolean;
  isAtBottom: boolean;
  hasNewMessages: boolean;
  
  // Message input
  newMessage: string;
  isUploading: boolean;
  uploadedImages: File[];
  
  // UI toggles
  showGifPicker: boolean;
  showReactionPicker: string | null;
  expandedDens: Set<string>;
}

// Simple state management with useState instead of useReducer
export const useSimpleChatState = () => {
  const [currentUser, setCurrentUser] = useState<ChatUser | null>(null);
  const [channels, setChannels] = useState<ChatChannel[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<string>('general');
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [isAtBottom, setIsAtBottom] = useState<boolean>(true);
  const [hasNewMessages, setHasNewMessages] = useState<boolean>(false);
  const [newMessage, setNewMessage] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [showGifPicker, setShowGifPicker] = useState<boolean>(false);
  const [showReactionPicker, setShowReactionPicker] = useState<string | null>(null);
  const [expandedDens, setExpandedDens] = useState<Set<string>>(new Set(['all-dens']));

  // Memoized state object
  const state = useMemo((): SimpleChatState => ({
    currentUser,
    channels,
    messages,
    users,
    selectedChannel,
    isConnected,
    isLoading,
    error,
    isSidebarOpen,
    isAtBottom,
    hasNewMessages,
    newMessage,
    isUploading,
    uploadedImages,
    showGifPicker,
    showReactionPicker,
    expandedDens
  }), [
    currentUser,
    channels,
    messages,
    users,
    selectedChannel,
    isConnected,
    isLoading,
    error,
    isSidebarOpen,
    isAtBottom,
    hasNewMessages,
    newMessage,
    isUploading,
    uploadedImages,
    showGifPicker,
    showReactionPicker,
    expandedDens
  ]);

  // Action creators - using useCallback for each action
  const addChannel = useCallback((channel: ChatChannel) => {
    setChannels(prev => [...prev, channel]);
  }, [setChannels]);
  
  const updateChannel = useCallback((updatedChannel: ChatChannel) => {
    setChannels(prev => prev.map(channel => 
      channel.id === updatedChannel.id ? updatedChannel : channel
    ));
  }, [setChannels]);
  
  const removeChannel = useCallback((channelId: string) => {
    setChannels(prev => prev.filter(channel => channel.id !== channelId));
  }, [setChannels]);
  
  const addMessage = useCallback((message: ChatMessage) => {
    setMessages(prev => [...prev, message]);
  }, [setMessages]);
  
  const updateMessage = useCallback((updatedMessage: ChatMessage) => {
    setMessages(prev => prev.map(message => 
      message.id === updatedMessage.id ? updatedMessage : message
    ));
  }, [setMessages]);
  
  const removeMessage = useCallback((messageId: string) => {
    setMessages(prev => prev.filter(message => message.id !== messageId));
  }, [setMessages]);
  
  const addUser = useCallback((user: ChatUser) => {
    setUsers(prev => [...prev, user]);
  }, [setUsers]);
  
  const updateUser = useCallback((updatedUser: ChatUser) => {
    setUsers(prev => prev.map(user => 
      user.id === updatedUser.id ? updatedUser : user
    ));
  }, [setUsers]);
  
  const removeUser = useCallback((userId: string) => {
    setUsers(prev => prev.filter(user => user.id !== userId));
  }, [setUsers]);
  
  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen(prev => !prev);
  }, [setIsSidebarOpen]);
  
  const addUploadedImage = useCallback((file: File) => {
    setUploadedImages(prev => [...prev, file]);
  }, [setUploadedImages]);
  
  const removeUploadedImage = useCallback((index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  }, [setUploadedImages]);
  
  const toggleGifPicker = useCallback(() => {
    setShowGifPicker(prev => !prev);
  }, [setShowGifPicker]);
  
  const toggleExpandedDen = useCallback((denId: string) => {
    setExpandedDens(prev => {
      const newSet = new Set(prev);
      if (newSet.has(denId)) {
        newSet.delete(denId);
      } else {
        newSet.add(denId);
      }
      return newSet;
    });
  }, [setExpandedDens]);
  
  const resetState = useCallback(() => {
    setCurrentUser(null);
    setChannels([]);
    setMessages([]);
    setUsers([]);
    setSelectedChannel('general');
    setIsConnected(false);
    setIsLoading(true);
    setError(null);
    setIsSidebarOpen(true);
    setIsAtBottom(true);
    setHasNewMessages(false);
    setNewMessage('');
    setIsUploading(false);
    setUploadedImages([]);
    setShowGifPicker(false);
    setShowReactionPicker(null);
      setExpandedDens(new Set(['all-dens']));
  }, [setCurrentUser, setChannels, setMessages, setUsers, setSelectedChannel, setIsConnected, setIsLoading, setError, setIsSidebarOpen, setIsAtBottom, setHasNewMessages, setNewMessage, setIsUploading, setUploadedImages, setShowGifPicker, setShowReactionPicker, setExpandedDens]);

  // Action creators
  const actions = useMemo(() => ({
    // User actions
    setCurrentUser,
    
    // Channel actions
    setChannels,
    addChannel,
    updateChannel,
    removeChannel,
    
    // Message actions
    setMessages,
    addMessage,
    updateMessage,
    removeMessage,
    
    // User list actions
    setUsers,
    addUser,
    updateUser,
    removeUser,
    
    // UI actions
    setSelectedChannel,
    setIsConnected,
    setIsLoading,
    setError,
    setIsSidebarOpen,
    toggleSidebar,
    setIsAtBottom,
    setHasNewMessages,
    
    // Message input actions
    setNewMessage,
    setIsUploading,
    setUploadedImages,
    addUploadedImage,
    removeUploadedImage,
    
    // UI toggle actions
    setShowGifPicker,
    toggleGifPicker,
    setShowReactionPicker,
    
    // Den expansion actions
    toggleExpandedDen,
    
    // Reset action
    resetState
  }), [
    setCurrentUser,
    setChannels,
    addChannel,
    updateChannel,
    removeChannel,
    setMessages,
    addMessage,
    updateMessage,
    removeMessage,
    setUsers,
    addUser,
    updateUser,
    removeUser,
    setSelectedChannel,
    setIsConnected,
    setIsLoading,
    setError,
    setIsSidebarOpen,
    toggleSidebar,
    setIsAtBottom,
    setHasNewMessages,
    setNewMessage,
    setIsUploading,
    setUploadedImages,
    addUploadedImage,
    removeUploadedImage,
    setShowGifPicker,
    toggleGifPicker,
    setShowReactionPicker,
    toggleExpandedDen,
    resetState
  ]);

  return { state, actions };
};

export default useSimpleChatState;

