import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, MessageCircle, Settings, User, Search, Smile, Share2, 
  Bold, Italic, Underline, Loader2, Camera, Palette, Type, 
  List, Code, Quote, Link, Image, AtSign, Hash, Star
} from 'lucide-react';
import chatService, { ChatUser, ChatMessage, ChatChannel } from '../services/chatService';
import tenorService, { TenorGif } from '../services/tenorService';
import { useToast } from '../contexts/ToastContext';

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
  const [showReactionPicker, setShowReactionPicker] = useState<string | null>(null);
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showSuccess, showError, showInfo } = useToast();

  // Den emoji mapping
  const denEmojis: Record<string, string> = {
    'pack': '🏕️',
    'lion': '🦁',
    'tiger': '🐯',
    'wolf': '🐺',
    'bear': '🐻',
    'webelos': '🏔️',
    'arrow-of-light': '🏹',
    'general': '💬'
  };

  // Den display names
  const denNames: Record<string, string> = {
    'pack': 'Pack Channels',
    'lion': 'Lion Den',
    'tiger': 'Tiger Den',
    'wolf': 'Wolf Den',
    'bear': 'Bear Den',
    'webelos': 'Webelos Den',
    'arrow-of-light': 'Arrow of Light',
    'general': 'General'
  };

  // Toggle den expansion
  const toggleDen = (denType: string) => {
    const newExpanded = new Set(expandedDens);
    if (newExpanded.has(denType)) {
      newExpanded.delete(denType);
    } else {
      newExpanded.add(denType);
    }
    setExpandedDens(newExpanded);
  };

  // Scroll handling functions
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget;
    const isAtBottomNow = element.scrollHeight - element.scrollTop <= element.clientHeight + 10; // 10px threshold
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

  // Rich text formatting functions
  const applyFormatting = (format: keyof typeof FORMATTING_PATTERNS) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const { selectionStart, selectionEnd } = textarea;
    const selectedText = newMessage.substring(selectionStart, selectionEnd);
    const beforeText = newMessage.substring(0, selectionStart);
    const afterText = newMessage.substring(selectionEnd);

    const pattern = FORMATTING_PATTERNS[format].pattern;
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
      case 'codeBlock':
        formattedText = `\`\`\`\n${selectedText}\n\`\`\``;
        break;
      case 'quote':
        formattedText = `> ${selectedText}`;
        break;
      case 'list':
        formattedText = `- ${selectedText}`;
        break;
      case 'link':
        formattedText = `[${selectedText}](url)`;
        break;
      case 'mention':
        formattedText = `@${selectedText}`;
        break;
      case 'hashtag':
        formattedText = `#${selectedText}`;
        break;
      default:
        return;
    }

    const newText = beforeText + formattedText + afterText;
    setNewMessage(newText);
    
    // Set cursor position after formatting
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = selectionStart + formattedText.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  // Apply color formatting
  const applyColor = (color: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const { selectionStart, selectionEnd } = textarea;
    const selectedText = newMessage.substring(selectionStart, selectionEnd);
    const beforeText = newMessage.substring(0, selectionStart);
    const afterText = newMessage.substring(selectionEnd);

    const colorClass = TEXT_COLORS.find(c => c.hex === color)?.value || 'inherit';
    const formattedText = `<span class="${colorClass}">${selectedText}</span>`;
    
    const newText = beforeText + formattedText + afterText;
    setNewMessage(newText);
    setShowColorPicker(false);
    
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = selectionStart + formattedText.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case 'b':
          e.preventDefault();
          applyFormatting('bold');
          break;
        case 'i':
          e.preventDefault();
          applyFormatting('italic');
          break;
        case 'u':
          e.preventDefault();
          applyFormatting('underline');
          break;
        case 's':
          e.preventDefault();
          applyFormatting('strikethrough');
          break;
        case '`':
          e.preventDefault();
          if (e.shiftKey) {
            applyFormatting('codeBlock');
          } else {
            applyFormatting('code');
          }
          break;
        case 'k':
          e.preventDefault();
          applyFormatting('link');
          break;
        case 'l':
          e.preventDefault();
          applyFormatting('list');
          break;
      }
    }
    
    // Handle special characters
    if (e.key === '@') {
      e.preventDefault();
      applyFormatting('mention');
    }
    if (e.key === '#') {
      e.preventDefault();
      applyFormatting('hashtag');
    }
  };

  // Enhanced message rendering with rich text support
  const renderMessageContent = (messageText: string) => {
    // First, handle HTML color spans
    let processedText = messageText.replace(
      /<span class="([^"]+)">([^<]+)<\/span>/g,
      (match, className, text) => {
        return `[color:${className}]${text}[/color]`;
      }
    );

    // Split the message into parts (text, images, code blocks, and color blocks)
    const parts = processedText.split(/(!\[.*?\]\(.*?\)|```[\s\S]*?```|\[color:[^\]]+\][^[]*\[\/color\])/g);
    
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
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
        );
      }
      
      // Check if this part is a code block
      const codeMatch = part.match(/```([\s\S]*?)```/);
      if (codeMatch) {
        const codeContent = codeMatch[1];
        return (
          <pre key={index} className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto my-2 text-sm font-mono">
            <code>{codeContent}</code>
          </pre>
        );
      }

      // Check if this part is a color block
      const colorMatch = part.match(/\[color:([^\]]+)\]([^[]*)\[\/color\]/);
      if (colorMatch) {
        const [, colorClass, text] = colorMatch;
        return (
          <span key={index} className={colorClass}>
            {renderFormattedText(text)}
          </span>
        );
      }
      
      // Regular text with formatting
      return (
        <span key={index}>
          {renderFormattedText(part)}
        </span>
      );
    });
  };

  // Render formatted text with markdown support
  const renderFormattedText = (text: string) => {
    // Handle @mentions
    text = text.replace(/(@(?:solyn|ai|assistant|user))/gi, (match) => (
      `<span class="bg-blue-100 text-blue-800 px-1 py-0.5 rounded-md font-medium text-sm">${match}</span>`
    ));

    // Handle #hashtags
    text = text.replace(/(#[a-zA-Z0-9_]+)/g, (match) => (
      `<span class="bg-purple-100 text-purple-800 px-1 py-0.5 rounded-md font-medium text-sm">${match}</span>`
    ));

    // Handle **bold**
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // Handle *italic*
    text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');

    // Handle __underline__
    text = text.replace(/__(.*?)__/g, '<u>$1</u>');

    // Handle ~~strikethrough~~
    text = text.replace(/~~(.*?)~~/g, '<del>$1</del>');

    // Handle `code`
    text = text.replace(/`([^`]+)`/g, '<code class="bg-gray-100 text-gray-800 px-1 py-0.5 rounded text-sm font-mono">$1</code>');

    // Handle > quotes
    text = text.replace(/^> (.+)$/gm, '<blockquote class="border-l-4 border-gray-300 pl-4 italic text-gray-600">$1</blockquote>');

    // Handle - lists
    text = text.replace(/^- (.+)$/gm, '<li class="list-disc ml-4">$1</li>');

    // Handle links
    text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 hover:text-blue-800 underline" target="_blank" rel="noopener noreferrer">$1</a>');

    return <span dangerouslySetInnerHTML={{ __html: text }} />;
  };

  // Function to apply formatting to selected text
  const applyTextFormatting = (format: string) => {
    const textarea = document.querySelector('textarea[name="message"]') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = newMessage.substring(start, end);
    const beforeText = newMessage.substring(0, start);
    const afterText = newMessage.substring(end);

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
      default:
        return;
    }

    const newText = beforeText + formattedText + afterText;
    setNewMessage(newText);
    
    // Set cursor position after formatting
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + formattedText.length, start + formattedText.length);
    }, 0);
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
      // You could add a toast notification here
    }
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

  // const handleGifSearch = (e: React.FormEvent) => {
  //   e.preventDefault();
  //   e.stopPropagation();
  //   searchGifs(gifSearchQuery);
  // };

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

  // Function to handle file uploads
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const imageFiles = Array.from(files).filter(file => 
      file.type.startsWith('image/')
    );

    if (imageFiles.length === 0) {
      showError('Invalid file type', 'Please select image files only.');
      return;
    }

    if (imageFiles.length > 5) {
      showError('Too many files', 'You can upload up to 5 images at once.');
      return;
    }

    setUploadedImages(prev => [...prev, ...imageFiles]);
    showSuccess('Images added', `${imageFiles.length} image(s) ready to send!`);
  };

  const removeUploadedImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  // Function to remove GIF from message
  const removeGifFromMessage = (gifUrl: string) => {
    const gifPattern = `!\\[.*?\\]\\(${gifUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\)`;
    const regex = new RegExp(gifPattern, 'g');
    setNewMessage(prev => prev.replace(regex, '').trim());
  };

  // Function to render uploaded images preview
  const renderUploadedImagesPreview = () => {
    if (uploadedImages.length === 0) return null;

    return (
      <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
        <p className="text-xs text-gray-500 mb-2">Uploaded Images:</p>
        <div className="flex flex-wrap gap-2">
          {uploadedImages.map((file, index) => (
            <div key={index} className="relative">
              <img
                src={URL.createObjectURL(file)}
                alt={`Uploaded ${index + 1}`}
                className="w-16 h-16 object-cover rounded-lg border border-gray-300"
              />
              <button
                onClick={() => removeUploadedImage(index)}
                className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600 transition-colors duration-200"
                title="Remove image"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Function to render GIF preview with delete option
  const renderGifPreview = () => {
    if (!newMessage.includes('![')) return null;

    const gifMatches = newMessage.match(/!\[(.*?)\]\((.*?)\)/g);
    if (!gifMatches) return null;

    return (
      <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
        <p className="text-xs text-gray-500 mb-2">GIF Preview:</p>
        <div className="space-y-2">
          {gifMatches.map((match, index) => {
            const imageMatch = match.match(/!\[(.*?)\]\((.*?)\)/);
            if (!imageMatch) return null;
            const [, altText, imageUrl] = imageMatch;
            
            return (
              <div key={index} className="relative">
                <img
                  src={imageUrl}
                  alt={altText}
                  className="max-w-xs max-h-32 rounded-lg shadow-sm"
                />
                <button
                  onClick={() => removeGifFromMessage(imageUrl)}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600 transition-colors duration-200"
                  title="Remove GIF"
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
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
    
    // Show separator if different days
    return currentDate.toDateString() !== previousDate.toDateString();
  };

  const shouldShowTimestamp = (currentMessage: ChatMessage, nextMessage: ChatMessage | null) => {
    if (!nextMessage) return true;
    
    const currentDate = new Date(currentMessage.timestamp);
    const nextDate = new Date(nextMessage.timestamp);
    
    // Show timestamp if different users or more than 5 minutes apart
    const timeDiff = Math.abs(currentDate.getTime() - nextDate.getTime());
    const fiveMinutes = 5 * 60 * 1000;
    
    return currentMessage.userName !== nextMessage.userName || timeDiff > fiveMinutes;
  };

  // Initialize chat (only once)
  useEffect(() => {
    const initializeChat = async () => {
      try {
        console.log('Initializing chat...');
        setIsLoading(true);
        setError(null);
        
        // Add timeout to prevent infinite loading
        const timeoutPromise = new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Chat initialization timeout')), 10000)
        );
        
        // Initialize chat service and get current user
        console.log('Initializing chat service...');
        const user = await Promise.race([
          chatService.initialize(),
          timeoutPromise
        ]) as ChatUser;
        console.log('Current user initialized:', user);
        setCurrentUser(user);
        
        // Load channels
        console.log('Loading channels...');
        const channelData = await chatService.getChannels();
        console.log('Channels loaded:', channelData);
        setChannels(channelData);
        
        // Load online users
        console.log('Loading online users...');
        const userData = await chatService.getOnlineUsers();
        console.log('Online users loaded:', userData);
        setUsers(userData);
        
        setIsConnected(true);
        setIsLoading(false); // Set loading to false on successful initialization
        console.log('Chat initialization complete');
        
        // Set up real-time subscriptions for users
        const unsubscribeUsers = chatService.subscribeToOnlineUsers(setUsers);
        
        // Cleanup function
        return () => {
          unsubscribeUsers();
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
    
    // Fallback timeout to ensure loading state is cleared
    const fallbackTimeout = setTimeout(() => {
      if (isLoading) {
        console.log('Fallback: Clearing loading state after timeout');
        setIsLoading(false);
        setIsConnected(true);
      }
    }, 15000); // 15 second fallback
    
    return () => clearTimeout(fallbackTimeout);
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
        
        // Return cleanup function
        return unsubscribeMessages;
      } catch (error) {
        console.error('Failed to load channel messages:', error);
      }
    };

    loadChannelMessages();
  }, [selectedChannel, isConnected]); // Only run when channel changes or connection status changes

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Debug logging
    console.log('Send message attempt:', {
      newMessage: newMessage,
      currentUser: currentUser,
      selectedChannel: selectedChannel,
      isConnected: isConnected,
      uploadedImages: uploadedImages.length
    });
    
    if (!newMessage.trim() && uploadedImages.length === 0) {
      console.log('Message is empty and no images uploaded');
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
      
      const formattedMessage = newMessage; // Rich text formatting is handled by renderFormattedText
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
  };

  // const formatTimestamp = (date: Date) => {
  //   const now = new Date();
  //   const diff = now.getTime() - date.getTime();
  //   const minutes = Math.floor(diff / 60000);
  //   const hours = Math.floor(diff / 3600000);
  //   const days = Math.floor(diff / 86400000);

  //   if (minutes < 1) return 'Just now';
  //   if (minutes < 60) return `${minutes}m ago`;
  //   if (hours < 24) return `${hours}h ago`;
  //   if (days < 7) return `${days}d ago`;
  //   return date.toLocaleDateString();
  // };

  const filteredChannels = channels.filter(channel => 
    channel.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Ensure unique channels by ID to prevent duplicates
  const uniqueChannels = React.useMemo(() => {
    const seen = new Set();
    return filteredChannels.filter(channel => {
      if (seen.has(channel.id)) {
        return false;
      }
      seen.add(channel.id);
      return true;
    });
  }, [filteredChannels]);

  // Group channels by den type
  const groupedChannels = React.useMemo(() => {
    const groups: Record<string, ChatChannel[]> = {};
    
    uniqueChannels.forEach(channel => {
      const denType = channel.denType || 'general';
      if (!groups[denType]) {
        groups[denType] = [];
      }
      groups[denType].push(channel);
    });
    
    return groups;
  }, [uniqueChannels]);

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

  // Removed loading animation for faster page transitions

  return (
    <div className="bg-gradient-to-br from-white via-gray-50/30 to-gray-100/30 min-h-[calc(100vh-4rem)]">
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
        {/* Error Banner */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Connection Error</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                  <p className="mt-1">Please check your connection and try refreshing the page.</p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-16rem)]">
          {/* Sidebar */}
          <div className={`${isSidebarOpen ? 'block' : 'hidden'} lg:block lg:w-80 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col`}>
            {/* User Profile */}
            {currentUser && (
              <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-500 to-indigo-600 text-white flex-shrink-0">
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
            <div className="p-4 border-b border-gray-200 flex-shrink-0">
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
            <div className="flex-1 overflow-y-auto min-h-0" style={{ maxHeight: 'calc(100vh - 400px)' }}>
              <div className="p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Channels</h3>
                
                {/* Den-organized Channels */}
                <div className="space-y-3">
                  {Object.entries(groupedChannels).map(([denType, denChannels]) => (
                    <div key={denType} className="space-y-1">
                      {/* Den Header */}
                      <button
                        onClick={() => toggleDen(denType)}
                        className="w-full flex items-center justify-between px-2 py-1 rounded text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center">
                          <span className="mr-2">{denEmojis[denType] || '💬'}</span>
                          <span>{denNames[denType]}</span>
                          <span className="ml-2 text-xs text-gray-500">({denChannels.length})</span>
                        </div>
                        <svg
                          className={`w-4 h-4 transform transition-transform ${
                            expandedDens.has(denType) ? 'rotate-90' : ''
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                      
                      {/* Den Channels */}
                      {expandedDens.has(denType) && (
                        <div className="ml-4 space-y-1">
                          {denChannels.map(channel => (
                            <button
                              key={`channel-${channel.id}`}
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
                      )}
                    </div>
                  ))}
                </div>
                
                {/* Debug Info */}
                {process.env.NODE_ENV === 'development' && (
                  <div className="mt-4 p-2 bg-gray-100 rounded text-xs">
                    <p>Channels: {channels.length}</p>
                    <p>Filtered Channels: {filteredChannels.length}</p>
                    <p>Unique Channels: {uniqueChannels.length}</p>
                    <p>Users: {users.length}</p>
                    <p>Current User: {currentUser?.name || 'None'}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Online Users */}
            <div className="p-4 border-t border-gray-200 bg-gray-50 flex-shrink-0">
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
                {users.length === 0 && (
                  <p className="text-xs text-gray-500">No users online</p>
                )}
              </div>
              
              {/* Debug Info */}
              {process.env.NODE_ENV === 'development' && (
                <div className="mt-2 p-2 bg-gray-100 rounded text-xs">
                  <p>Users loaded: {users.length}</p>
                  <p>Current user online: {currentUser?.isOnline ? 'Yes' : 'No'}</p>
                  <p>Current user ID: {currentUser?.id || 'None'}</p>
                </div>
              )}
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
                      {hasNewMessages && !isAtBottom && (
                        <span className="ml-3 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full flex-shrink-0 animate-pulse">
                          New messages
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
            <div 
              ref={setMessageListRef}
              className="flex-1 overflow-y-auto p-6 relative"
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
              
              <div className="space-y-4">
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
                              {showTimestamp && (
                                <span className="text-xs text-gray-500">
                                  {formatMessageTime(new Date(message.timestamp))}
                                </span>
                              )}
                            </div>
                            <div className={`text-sm ${
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
                          
                          {/* Message Actions */}
                          <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <button
                              onClick={() => setShowReactionPicker(showReactionPicker === message.id ? null : message.id)}
                              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                              title="Add reaction"
                            >
                              <Smile className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => shareMessage(message)}
                              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                              title="Share message"
                            >
                              <Share2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
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
            <div className="border-t border-gray-200 p-6 bg-gray-50">
              {/* User Status Indicator */}
              {!currentUser && (
                <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    ⚠️ Connecting to chat... Please wait a moment before sending messages.
                  </p>
                </div>
              )}
              
              <form onSubmit={handleSendMessage} className="space-y-3">
                {/* Rich Input Toolbar */}
                <div className="flex items-center space-x-2 p-3 bg-white border border-gray-200 rounded-lg">
                  {/* Formatting Buttons */}
                  <button
                    type="button"
                    onClick={() => applyFormatting('bold')}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                    title="Bold (Ctrl+B)"
                  >
                    <Bold className="w-4 h-4" />
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => applyFormatting('italic')}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                    title="Italic (Ctrl+I)"
                  >
                    <Italic className="w-4 h-4" />
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => applyFormatting('underline')}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                    title="Underline (Ctrl+U)"
                  >
                    <Underline className="w-4 h-4" />
                  </button>

                  {/* Code Button */}
                  <button
                    type="button"
                    onClick={() => {
                      const codeBlock = '```\n// Your code here\n```';
                      setNewMessage(prev => prev + codeBlock);
                    }}
                    className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-lg transition-colors duration-200 font-medium"
                    title="Insert Code Block (Ctrl+`)"
                  >
                    <Code className="w-4 h-4 mr-1" />
                    Code
                  </button>
                  
                  <div className="w-px h-6 bg-gray-300"></div>
                  
                  {/* List Button */}
                  <button
                    type="button"
                    onClick={() => applyFormatting('list')}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                    title="List (Ctrl+L)"
                  >
                    <List className="w-4 h-4 mr-1" />
                    List
                  </button>

                  {/* Quote Button */}
                  <button
                    type="button"
                    onClick={() => applyFormatting('quote')}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                    title="Quote (Ctrl+Shift+Q)"
                  >
                    <Quote className="w-4 h-4 mr-1" />
                    Quote
                  </button>

                  <div className="w-px h-6 bg-gray-300"></div>
                  
                  {/* GIF Button */}
                  <button
                    type="button"
                    onClick={() => setShowGifPicker(!showGifPicker)}
                    className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-lg transition-colors duration-200 font-medium"
                    title="Insert GIF"
                  >
                    <Smile className="w-4 h-4 mr-1" />
                    GIF
                  </button>

                  {/* Photo Upload Button */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                    title="Upload Photo"
                  >
                    <Image className="w-4 h-4 mr-1" />
                    Photo
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  
                  {/* Color Picker */}
                  <button
                    type="button"
                    onClick={() => setShowColorPicker(!showColorPicker)}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                    title="Text Color"
                  >
                    <Palette className="w-4 h-4 mr-1" />
                    Color
                  </button>
                  
                  <div className="w-px h-6 bg-gray-300"></div>
                  
                  {/* Font Selector */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => {
                        // This functionality is not yet implemented in the new rich text system
                        // setShowFontPicker(!showFontPicker); 
                      }}
                      className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-lg transition-colors duration-200 font-medium"
                      title="Font style"
                    >
                      <Type className="w-4 h-4 mr-1" />
                      Fonts
                    </button>
                    
                    {/* Font Picker Dropdown */}
                    {/* {showFontPicker && (
                      <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-32">
                      <div className="p-2 space-y-1">
                        {[
                          { value: 'normal', label: 'Normal', font: 'Inter' },
                          { value: 'monospace', label: 'Code', font: 'Monaco' },
                          { value: 'serif', label: 'Serif', font: 'Georgia' },
                          { value: 'cursive', label: 'Cursive', font: 'Brush Script MT' },
                          { value: 'fantasy', label: 'Fantasy', font: 'Papyrus' },
                          { value: 'sans-serif', label: 'Sans Serif', font: 'Arial' },
                          { value: 'system', label: 'System', font: 'System UI' }
                        ].map(font => (
                          <button
                            key={font.value}
                            onClick={() => {
                              setSelectedFont(font.value);
                              setShowFontPicker(false);
                            }}
                            className={`w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-100 transition-colors duration-200 ${
                              selectedFont === font.value ? 'bg-blue-100 text-blue-700' : 'text-gray-700'
                            }`}
                            style={{ fontFamily: font.font }}
                          >
                            {font.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )} */}
                </div>
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
                    <textarea
                      ref={textareaRef}
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={handleKeyDown}
                      onSelect={(e) => {
                        const target = e.target as HTMLTextAreaElement;
                        setRichTextState(prev => ({
                          ...prev,
                          selectedText: target.value.substring(target.selectionStart, target.selectionEnd),
                          cursorPosition: { start: target.selectionStart, end: target.selectionEnd }
                        }));
                      }}
                      placeholder={currentUser 
                        ? `Message #${channels.find(c => c.id === selectedChannel)?.name || 'general'}...`
                        : 'Connecting to chat...'
                      }
                      disabled={!currentUser}
                                          style={{
                      color: richTextState.selectedColor,
                      fontFamily: richTextState.isCode ? 'Monaco, monospace' : 'Inter, sans-serif', // Apply font based on rich text state
                      resize: 'none',
                      minHeight: '48px',
                      maxHeight: '200px',
                      overflowY: 'auto'
                    }}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                      rows={1}
                      onInput={(e) => {
                        const target = e.target as HTMLTextAreaElement;
                        target.style.height = 'auto';
                        target.style.height = Math.min(target.scrollHeight, 200) + 'px';
                      }}
                    />
                    
                    {/* Message Preview */}
                    {(newMessage.includes('**') || newMessage.includes('*') || newMessage.includes('__') || newMessage.includes('~~') || newMessage.includes('`') || newMessage.includes('![') || newMessage.includes('```') || newMessage.includes('<span class="') || newMessage.includes('@') || newMessage.includes('#')) && (
                      <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                        <p className="text-xs text-gray-500 mb-2">Preview:</p>
                        <div className="text-sm text-gray-700">
                          {renderMessageContent(newMessage)}
                        </div>
                      </div>
                    )}

                    {/* GIF Preview with Delete Buttons */}
                    {renderGifPreview()}

                    {/* Uploaded Images Preview */}
                    {renderUploadedImagesPreview()}
                  </div>
                  
                  <button
                    type="submit"
                    disabled={(!newMessage.trim() && uploadedImages.length === 0) || !currentUser || isUploading}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center space-x-2"
                  >
                    {isUploading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    <span>{isUploading ? 'Sending...' : 'Send'}</span>
                  </button>
                </div>
              </form>
              
              {/* Rich Text Toolbar */}
              {showRichToolbar && (
                <div className="bg-white border-t border-gray-200 p-3">
                  <div className="flex items-center space-x-2 flex-wrap">
                    {/* Text Formatting */}
                    <button
                      onClick={() => applyFormatting('bold')}
                      className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Bold (Ctrl+B)"
                    >
                      <Bold className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => applyFormatting('italic')}
                      className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Italic (Ctrl+I)"
                    >
                      <Italic className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => applyFormatting('underline')}
                      className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Underline (Ctrl+U)"
                    >
                      <Underline className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => applyFormatting('strikethrough')}
                      className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Strikethrough (Ctrl+S)"
                    >
                      <span className="w-4 h-4 border-b border-gray-600"></span>
                    </button>

                    <div className="w-px h-6 bg-gray-300"></div>

                    {/* Code and Lists */}
                    <button
                      onClick={() => applyFormatting('code')}
                      className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Code (Ctrl+`)"
                    >
                      <Code className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => applyFormatting('list')}
                      className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                      title="List (Ctrl+L)"
                    >
                      <List className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => applyFormatting('quote')}
                      className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Quote"
                    >
                      <Quote className="w-4 h-4" />
                    </button>

                    <div className="w-px h-6 bg-gray-300"></div>

                    {/* Colors */}
                    <div className="relative">
                      <button
                        onClick={() => setShowColorPicker(!showColorPicker)}
                        className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Text Color"
                      >
                        <Palette className="w-4 h-4" />
                      </button>
                      {showColorPicker && (
                        <div className="absolute bottom-full left-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-10">
                          <div className="grid grid-cols-3 gap-1">
                            {TEXT_COLORS.map((color) => (
                              <button
                                key={color.hex}
                                onClick={() => applyColor(color.hex)}
                                className="w-6 h-6 rounded border border-gray-200 hover:scale-110 transition-transform"
                                style={{ backgroundColor: color.hex }}
                                title={color.name}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Special Formatting */}
                    <button
                      onClick={() => applyFormatting('link')}
                      className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Link (Ctrl+K)"
                    >
                      <Link className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => applyFormatting('mention')}
                      className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Mention (@)"
                    >
                      <AtSign className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => applyFormatting('hashtag')}
                      className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Hashtag (#)"
                    >
                      <Hash className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Debug Info (remove in production) */}
              {process.env.NODE_ENV === 'development' && (
                <div className="mt-2 text-xs text-gray-500">
                  Debug: User: {currentUser ? 'Connected' : 'Not connected'} | 
                  Channel: {selectedChannel} | 
                  Connected: {isConnected ? 'Yes' : 'No'}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
