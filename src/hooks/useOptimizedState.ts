import { useState, useReducer, useCallback, useMemo } from 'react';
import { ChatMessage, ChatChannel, ChatUser } from '../services/chatService';
import { AppUser, UserRole } from '../services/authService';

// Utility function for debouncing
function debounce(func: Function, wait: number) {
  let timeout: NodeJS.Timeout;
  return function executedFunction(...args: any[]) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Define missing types
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

interface TenorGif {
  id: string;
  title: string;
  media_formats: {
    gif?: {
      url: string;
      width: number;
      height: number;
    };
    tinygif?: {
      url: string;
      width: number;
      height: number;
    };
  };
}

// Define missing types
interface UserWithChildren extends AppUser {
  children?: AppUser[];
  parentId?: string;
}

interface CreateUserForm {
  email: string;
  password: string;
  confirmPassword: string;
  displayName: string;
  role: UserRole;
  den: string;
  scoutRank: string;
  emergencyContact: string;
  address: string;
  isActive: boolean;
}

interface Invite {
  id: string;
  email: string;
  role: UserRole;
  message: string;
  denId: string;
  expiresInDays: number;
  createdAt: string;
  expiresAt: string;
  status: 'pending' | 'accepted' | 'expired';
  invitedBy: string;
}

interface InviteFormData {
  email: string;
  role: UserRole;
  message: string;
  denId: string;
  expiresInDays: number;
}

// Chat State Management with useReducer
interface ChatState {
  // Data state
  messages: ChatMessage[];
  users: ChatUser[];
  channels: ChatChannel[];
  
  // UI state
  selectedChannel: string;
  newMessage: string;
  isConnected: boolean;
  expandedDens: Set<string>;
  currentUser: ChatUser | null;
  isLoading: boolean;
  isSidebarOpen: boolean;
  searchQuery: string;
  error: string | null;
  isAtBottom: boolean;
  messageListRef: HTMLDivElement | null;
  hasNewMessages: boolean;
  
  // Auth state
  isAuthenticated: boolean;
  userRole: UserRole;
  authLoading: boolean;
  
  // Rich text state
  richTextState: RichTextState;
  showRichToolbar: boolean;
  showColorPicker: boolean;
  showGifPicker: boolean;
  gifs: TenorGif[];
  gifSearchQuery: string;
  isLoadingGifs: boolean;
  gifSearchResults: TenorGif[];
  showGifSearch: boolean;
  showReactionPicker: string | null;
  uploadedImages: File[];
  isUploading: boolean;
}

type ChatAction = 
  | { type: 'SET_MESSAGES'; payload: ChatMessage[] }
  | { type: 'ADD_MESSAGE'; payload: ChatMessage }
  | { type: 'SET_USERS'; payload: ChatUser[] }
  | { type: 'SET_CHANNELS'; payload: ChatChannel[] }
  | { type: 'SET_SELECTED_CHANNEL'; payload: string }
  | { type: 'SET_NEW_MESSAGE'; payload: string }
  | { type: 'SET_CONNECTED'; payload: boolean }
  | { type: 'TOGGLE_DEN_EXPANSION'; payload: string }
  | { type: 'SET_CURRENT_USER'; payload: ChatUser | null }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_SIDEBAR_OPEN'; payload: boolean }
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_AT_BOTTOM'; payload: boolean }
  | { type: 'SET_MESSAGE_LIST_REF'; payload: HTMLDivElement | null }
  | { type: 'SET_HAS_NEW_MESSAGES'; payload: boolean }
  | { type: 'SET_AUTHENTICATED'; payload: boolean }
  | { type: 'SET_USER_ROLE'; payload: UserRole }
  | { type: 'SET_AUTH_LOADING'; payload: boolean }
  | { type: 'UPDATE_RICH_TEXT_STATE'; payload: Partial<RichTextState> }
  | { type: 'SET_SHOW_RICH_TOOLBAR'; payload: boolean }
  | { type: 'SET_SHOW_COLOR_PICKER'; payload: boolean }
  | { type: 'SET_SHOW_GIF_PICKER'; payload: boolean }
  | { type: 'SET_GIFS'; payload: TenorGif[] }
  | { type: 'SET_GIF_SEARCH_QUERY'; payload: string }
  | { type: 'SET_LOADING_GIFS'; payload: boolean }
  | { type: 'SET_GIF_SEARCH_RESULTS'; payload: TenorGif[] }
  | { type: 'SET_SHOW_GIF_SEARCH'; payload: boolean }
  | { type: 'SET_SHOW_REACTION_PICKER'; payload: string | null }
  | { type: 'SET_UPLOADED_IMAGES'; payload: File[] }
  | { type: 'SET_UPLOADING'; payload: boolean }
  | { type: 'RESET_CHAT_STATE' };

const initialChatState: ChatState = {
  messages: [],
  users: [],
  channels: [],
  selectedChannel: 'general',
  newMessage: '',
  isConnected: false,
  expandedDens: new Set(['pack', 'general']),
  currentUser: null,
  isLoading: true,
  isSidebarOpen: false,
  searchQuery: '',
  error: null,
  isAtBottom: true,
  messageListRef: null,
  hasNewMessages: false,
  isAuthenticated: false,
  userRole: UserRole.PARENT,
  authLoading: true,
  richTextState: {
    isBold: false,
    isItalic: false,
    isUnderline: false,
    isStrikethrough: false,
    isCode: false,
    selectedColor: 'inherit',
    selectedText: '',
    cursorPosition: { start: 0, end: 0 },
  },
  showRichToolbar: false,
  showColorPicker: false,
  showGifPicker: false,
  gifs: [],
  gifSearchQuery: '',
  isLoadingGifs: false,
  gifSearchResults: [],
  showGifSearch: false,
  showReactionPicker: null,
  uploadedImages: [],
  isUploading: false,
};

function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'SET_MESSAGES':
      return { ...state, messages: action.payload };
    
    case 'ADD_MESSAGE':
      return { ...state, messages: [...state.messages, action.payload] };
    
    case 'SET_USERS':
      return { ...state, users: action.payload };
    
    case 'SET_CHANNELS':
      return { ...state, channels: action.payload };
    
    case 'SET_SELECTED_CHANNEL':
      return { ...state, selectedChannel: action.payload };
    
    case 'SET_NEW_MESSAGE':
      return { ...state, newMessage: action.payload };
    
    case 'SET_CONNECTED':
      return { ...state, isConnected: action.payload };
    
    case 'TOGGLE_DEN_EXPANSION':
      const newExpandedDens = new Set(state.expandedDens);
      if (newExpandedDens.has(action.payload)) {
        newExpandedDens.delete(action.payload);
      } else {
        newExpandedDens.add(action.payload);
      }
      return { ...state, expandedDens: newExpandedDens };
    
    case 'SET_CURRENT_USER':
      return { ...state, currentUser: action.payload };
    
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_SIDEBAR_OPEN':
      return { ...state, isSidebarOpen: action.payload };
    
    case 'SET_SEARCH_QUERY':
      return { ...state, searchQuery: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    
    case 'SET_AT_BOTTOM':
      return { ...state, isAtBottom: action.payload };
    
    case 'SET_MESSAGE_LIST_REF':
      return { ...state, messageListRef: action.payload };
    
    case 'SET_HAS_NEW_MESSAGES':
      return { ...state, hasNewMessages: action.payload };
    
    case 'SET_AUTHENTICATED':
      return { ...state, isAuthenticated: action.payload };
    
    case 'SET_USER_ROLE':
      return { ...state, userRole: action.payload };
    
    case 'SET_AUTH_LOADING':
      return { ...state, authLoading: action.payload };
    
    case 'UPDATE_RICH_TEXT_STATE':
      return { 
        ...state, 
        richTextState: { ...state.richTextState, ...action.payload } 
      };
    
    case 'SET_SHOW_RICH_TOOLBAR':
      return { ...state, showRichToolbar: action.payload };
    
    case 'SET_SHOW_COLOR_PICKER':
      return { ...state, showColorPicker: action.payload };
    
    case 'SET_SHOW_GIF_PICKER':
      return { ...state, showGifPicker: action.payload };
    
    case 'SET_GIFS':
      return { ...state, gifs: action.payload };
    
    case 'SET_GIF_SEARCH_QUERY':
      return { ...state, gifSearchQuery: action.payload };
    
    case 'SET_LOADING_GIFS':
      return { ...state, isLoadingGifs: action.payload };
    
    case 'SET_GIF_SEARCH_RESULTS':
      return { ...state, gifSearchResults: action.payload };
    
    case 'SET_SHOW_GIF_SEARCH':
      return { ...state, showGifSearch: action.payload };
    
    case 'SET_SHOW_REACTION_PICKER':
      return { ...state, showReactionPicker: action.payload };
    
    case 'SET_UPLOADED_IMAGES':
      return { ...state, uploadedImages: action.payload };
    
    case 'SET_UPLOADING':
      return { ...state, isUploading: action.payload };
    
    case 'RESET_CHAT_STATE':
      return initialChatState;
    
    default:
      return state;
  }
}

// Custom hook for chat state management with performance optimizations
export function useChatState() {
  const [state, dispatch] = useReducer(chatReducer, initialChatState);

  // Performance optimizations - memoize expensive operations
  const memoizedChannels = useMemo(() => {
    // Group channels by den type for efficient rendering (similar to events grouping)
    const groupedChannels: Record<string, ChatChannel[]> = {};
    state.channels.forEach(channel => {
      const denType = channel.denType || 'general';
      if (!groupedChannels[denType]) {
        groupedChannels[denType] = [];
      }
      groupedChannels[denType].push(channel);
    });
    return groupedChannels;
  }, [state.channels]);

  // Optimized message filtering with caching
  const memoizedFilteredMessages = useMemo(() => {
    if (!state.searchQuery) return state.messages;

    // Use efficient string matching (similar to events search)
    const query = state.searchQuery.toLowerCase();
    return state.messages.filter(message =>
      message.message.toLowerCase().includes(query) ||
      message.userName.toLowerCase().includes(query)
    );
  }, [state.messages, state.searchQuery]);

  // Optimized user filtering
  const memoizedOnlineUsers = useMemo(() => {
    return state.users.filter(user => user.isOnline);
  }, [state.users]);

  // Performance optimization: Debounced search
  const debouncedSearch = useCallback(
    debounce((query: string) => {
      dispatch({ type: 'SET_SEARCH_QUERY', payload: query });
    }, 300),
    []
  );

  // Memoized action creators for better performance
  const actions = useMemo(() => ({
    setMessages: (messages: ChatMessage[]) => 
      dispatch({ type: 'SET_MESSAGES', payload: messages }),
    
    addMessage: (message: ChatMessage) => 
      dispatch({ type: 'ADD_MESSAGE', payload: message }),
    
    setUsers: (users: ChatUser[]) => 
      dispatch({ type: 'SET_USERS', payload: users }),
    
    setChannels: (channels: ChatChannel[]) => 
      dispatch({ type: 'SET_CHANNELS', payload: channels }),
    
    setSelectedChannel: (channel: string) => 
      dispatch({ type: 'SET_SELECTED_CHANNEL', payload: channel }),
    
    setNewMessage: (message: string) => 
      dispatch({ type: 'SET_NEW_MESSAGE', payload: message }),
    
    setConnected: (connected: boolean) => 
      dispatch({ type: 'SET_CONNECTED', payload: connected }),
    
    toggleDenExpansion: (den: string) => 
      dispatch({ type: 'TOGGLE_DEN_EXPANSION', payload: den }),
    
    setCurrentUser: (user: ChatUser | null) => 
      dispatch({ type: 'SET_CURRENT_USER', payload: user }),
    
    setLoading: (loading: boolean) => 
      dispatch({ type: 'SET_LOADING', payload: loading }),
    
    setSidebarOpen: (open: boolean) => 
      dispatch({ type: 'SET_SIDEBAR_OPEN', payload: open }),
    
    setSearchQuery: (query: string) => 
      dispatch({ type: 'SET_SEARCH_QUERY', payload: query }),
    
    setError: (error: string | null) => 
      dispatch({ type: 'SET_ERROR', payload: error }),
    
    setAtBottom: (atBottom: boolean) => 
      dispatch({ type: 'SET_AT_BOTTOM', payload: atBottom }),
    
    setMessageListRef: (ref: HTMLDivElement | null) => 
      dispatch({ type: 'SET_MESSAGE_LIST_REF', payload: ref }),
    
    setHasNewMessages: (hasNew: boolean) => 
      dispatch({ type: 'SET_HAS_NEW_MESSAGES', payload: hasNew }),
    
    setAuthenticated: (authenticated: boolean) => 
      dispatch({ type: 'SET_AUTHENTICATED', payload: authenticated }),
    
    setUserRole: (role: UserRole) => 
      dispatch({ type: 'SET_USER_ROLE', payload: role }),
    
    setAuthLoading: (loading: boolean) => 
      dispatch({ type: 'SET_AUTH_LOADING', payload: loading }),
    
    updateRichTextState: (updates: Partial<RichTextState>) => 
      dispatch({ type: 'UPDATE_RICH_TEXT_STATE', payload: updates }),
    
    setShowRichToolbar: (show: boolean) => 
      dispatch({ type: 'SET_SHOW_RICH_TOOLBAR', payload: show }),
    
    setShowColorPicker: (show: boolean) => 
      dispatch({ type: 'SET_SHOW_COLOR_PICKER', payload: show }),
    
    setShowGifPicker: (show: boolean) => 
      dispatch({ type: 'SET_SHOW_GIF_PICKER', payload: show }),
    
    setGifs: (gifs: TenorGif[]) => 
      dispatch({ type: 'SET_GIFS', payload: gifs }),
    
    setGifSearchQuery: (query: string) => 
      dispatch({ type: 'SET_GIF_SEARCH_QUERY', payload: query }),
    
    setLoadingGifs: (loading: boolean) => 
      dispatch({ type: 'SET_LOADING_GIFS', payload: loading }),
    
    setGifSearchResults: (results: TenorGif[]) => 
      dispatch({ type: 'SET_GIF_SEARCH_RESULTS', payload: results }),
    
    setShowGifSearch: (show: boolean) => 
      dispatch({ type: 'SET_SHOW_GIF_SEARCH', payload: show }),
    
    setShowReactionPicker: (messageId: string | null) => 
      dispatch({ type: 'SET_SHOW_REACTION_PICKER', payload: messageId }),
    
    setUploadedImages: (images: File[]) => 
      dispatch({ type: 'SET_UPLOADED_IMAGES', payload: images }),
    
    setUploading: (uploading: boolean) => 
      dispatch({ type: 'SET_UPLOADING', payload: uploading }),
    
    resetChatState: () => 
      dispatch({ type: 'RESET_CHAT_STATE' }),
  }), []);

  // Memoized selectors for computed values (using optimized memoized data)
  const selectors = useMemo(() => ({
    // Use memoized filtered messages
    filteredMessages: memoizedFilteredMessages,

    // Current channel info
    currentChannel: state.channels.find(channel => channel.id === state.selectedChannel),

    // Use memoized online users count
    onlineUsersCount: memoizedOnlineUsers.length,

    // Can send message (authenticated and connected)
    canSendMessage: state.isAuthenticated && state.isConnected && state.currentUser,

    // Rich text formatting active
    hasActiveFormatting: state.richTextState.isBold ||
                        state.richTextState.isItalic ||
                        state.richTextState.isUnderline ||
                        state.richTextState.isStrikethrough ||
                        state.richTextState.isCode,

    // Grouped channels for efficient rendering
    groupedChannels: memoizedChannels,

    // Optimized online users list
    onlineUsers: memoizedOnlineUsers
  }), [state, memoizedFilteredMessages, memoizedOnlineUsers, memoizedChannels]);

  return { state, actions, selectors };
}

// User Management State Hook
interface UserManagementState {
  // Data state
  users: UserWithChildren[];
  filteredUsers: UserWithChildren[];
  invites: Invite[];
  
  // UI state
  isLoading: boolean;
  error: string | null;
  searchTerm: string;
  roleFilter: UserRole | 'all';
  denFilter: string;
  statusFilter: 'all' | 'active' | 'inactive';
  
  // Modal states
  showCreateModal: boolean;
  showEditModal: boolean;
  showDeleteModal: boolean;
  showRoleModal: boolean;
  showPermissionsModal: boolean;
  showCreateInviteModal: boolean;
  showInviteLinkModal: boolean;
  
  // Selected items
  selectedUser: UserWithChildren | null;
  selectedRole: UserRole | null;
  selectedInvite: Invite | null;
  copySuccess: string | null;
  
  // Form states
  createForm: CreateUserForm;
  inviteFormData: InviteFormData;
}

export function useUserManagementState() {
  const [state, setState] = useState<UserManagementState>({
    users: [],
    filteredUsers: [],
    invites: [],
    isLoading: true,
    error: null,
    searchTerm: '',
    roleFilter: 'all',
    denFilter: 'all',
    statusFilter: 'all',
    showCreateModal: false,
    showEditModal: false,
    showDeleteModal: false,
    showRoleModal: false,
    showPermissionsModal: false,
    showCreateInviteModal: false,
    showInviteLinkModal: false,
    selectedUser: null,
    selectedRole: null,
    selectedInvite: null,
    copySuccess: null,
    createForm: {
      email: '',
      password: '',
      confirmPassword: '',
      displayName: '',
      role: UserRole.PARENT,
      den: '',
      scoutRank: '',
      emergencyContact: '',
      address: '',
      isActive: true
    },
    inviteFormData: {
      email: '',
      role: UserRole.PARENT,
      message: '',
      denId: '',
      expiresInDays: 7
    }
  });

  // Memoized actions
  const actions = useMemo(() => ({
    setUsers: (users: UserWithChildren[]) => 
      setState(prev => ({ ...prev, users, filteredUsers: users })),
    
    setFilteredUsers: (filteredUsers: UserWithChildren[]) => 
      setState(prev => ({ ...prev, filteredUsers })),
    
    setInvites: (invites: Invite[]) => 
      setState(prev => ({ ...prev, invites })),
    
    setLoading: (isLoading: boolean) => 
      setState(prev => ({ ...prev, isLoading })),
    
    setError: (error: string | null) => 
      setState(prev => ({ ...prev, error })),
    
    setSearchTerm: (searchTerm: string) => 
      setState(prev => ({ ...prev, searchTerm })),
    
    setRoleFilter: (roleFilter: UserRole | 'all') => 
      setState(prev => ({ ...prev, roleFilter })),
    
    setDenFilter: (denFilter: string) => 
      setState(prev => ({ ...prev, denFilter })),
    
    setStatusFilter: (statusFilter: 'all' | 'active' | 'inactive') => 
      setState(prev => ({ ...prev, statusFilter })),
    
    setShowCreateModal: (show: boolean) => 
      setState(prev => ({ ...prev, showCreateModal: show })),
    
    setShowEditModal: (show: boolean) => 
      setState(prev => ({ ...prev, showEditModal: show })),
    
    setShowDeleteModal: (show: boolean) => 
      setState(prev => ({ ...prev, showDeleteModal: show })),
    
    setShowRoleModal: (show: boolean) => 
      setState(prev => ({ ...prev, showRoleModal: show })),
    
    setShowPermissionsModal: (show: boolean) => 
      setState(prev => ({ ...prev, showPermissionsModal: show })),
    
    setShowCreateInviteModal: (show: boolean) => 
      setState(prev => ({ ...prev, showCreateInviteModal: show })),
    
    setShowInviteLinkModal: (show: boolean) => 
      setState(prev => ({ ...prev, showInviteLinkModal: show })),
    
    setSelectedUser: (user: UserWithChildren | null) => 
      setState(prev => ({ ...prev, selectedUser: user })),
    
    setSelectedRole: (role: UserRole | null) => 
      setState(prev => ({ ...prev, selectedRole: role })),
    
    setSelectedInvite: (invite: Invite | null) => 
      setState(prev => ({ ...prev, selectedInvite: invite })),
    
    setCopySuccess: (message: string | null) => 
      setState(prev => ({ ...prev, copySuccess: message })),
    
    updateCreateForm: (updates: Partial<CreateUserForm>) => 
      setState(prev => ({ 
        ...prev, 
        createForm: { ...prev.createForm, ...updates } 
      })),
    
    updateInviteFormData: (updates: Partial<InviteFormData>) => 
      setState(prev => ({ 
        ...prev, 
        inviteFormData: { ...prev.inviteFormData, ...updates } 
      })),
    
    resetCreateForm: () => 
      setState(prev => ({ 
        ...prev, 
        createForm: {
          email: '',
          password: '',
          confirmPassword: '',
          displayName: '',
          role: UserRole.PARENT,
          den: '',
          scoutRank: '',
          emergencyContact: '',
          address: '',
          isActive: true
        }
      })),
    
    resetInviteFormData: () => 
      setState(prev => ({ 
        ...prev, 
        inviteFormData: {
          email: '',
          role: UserRole.PARENT,
          message: '',
          denId: '',
          expiresInDays: 7
        }
      })),
  }), []);

  return { state, actions };
}

export default { useChatState, useUserManagementState };
