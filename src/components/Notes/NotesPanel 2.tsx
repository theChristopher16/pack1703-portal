import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  StickyNote, 
  Plus, 
  X, 
  Pin, 
  PinOff, 
  Trash2, 
  Edit2, 
  Save, 
  User, 
  Clock,
  Tag,
  AlertCircle,
  Search,
  Filter,
  Archive,
  ArchiveRestore,
  Calendar,
  CheckSquare,
  Square,
  Folder,
  Palette,
  SortAsc,
  SortDesc,
  List,
  Grid,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { notesService, Note, CreateNoteData, ChecklistItem } from '../../services/notesService';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useToast } from '../../contexts/ToastContext';
import { useAdmin } from '../../contexts/AdminContext';
import { ComponentId } from '../../types/organization';

interface NotesPanelProps {
  componentId: string;
  componentType: Note['componentType'];
  className?: string;
}

type SortOption = 'date-desc' | 'date-asc' | 'title-asc' | 'title-desc' | 'author-asc' | 'author-desc';
type ViewMode = 'list' | 'grid';

const NOTE_COLORS = [
  { name: 'Default', value: null },
  { name: 'Yellow', value: '#FEF3C7' },
  { name: 'Green', value: '#D1FAE5' },
  { name: 'Blue', value: '#DBEAFE' },
  { name: 'Pink', value: '#FCE7F3' },
  { name: 'Purple', value: '#E9D5FF' },
  { name: 'Orange', value: '#FED7AA' },
  { name: 'Red', value: '#FEE2E2' },
];

const NotesPanel: React.FC<NotesPanelProps> = ({ 
  componentId, 
  componentType,
  className = '' 
}) => {
  const { organizationId } = useOrganization();
  const { showSuccess, showError, showInfo } = useToast();
  const { state } = useAdmin();
  const [notes, setNotes] = useState<Note[]>([]);
  const [allNotes, setAllNotes] = useState<Note[]>([]); // Includes archived
  const [loading, setLoading] = useState(true);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  
  // Note form state
  const [newNoteContent, setNewNoteContent] = useState('');
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [editingContent, setEditingContent] = useState('');
  const [editingTitle, setEditingTitle] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [category, setCategory] = useState('');
  const [categoryInput, setCategoryInput] = useState('');
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [dueDate, setDueDate] = useState('');
  const [reminderDate, setReminderDate] = useState('');
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [isMarkdown, setIsMarkdown] = useState(false);
  
  // UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [sortOption, setSortOption] = useState<SortOption>('date-desc');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [categories, setCategories] = useState<string[]>([]);
  const [expandedNoteId, setExpandedNoteId] = useState<string | null>(null);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const editTextareaRef = useRef<HTMLTextAreaElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  const { enabledComponents } = useOrganization();
  const canView = notesService.canViewNotes();
  const canAdd = notesService.canAddNotes();
  const canDelete = notesService.canDeleteNotes();
  
  const isNotesEnabled = enabledComponents?.includes('notes' as ComponentId) ?? true;

  useEffect(() => {
    if (canView && isNotesEnabled) {
      loadNotes();
      loadCategories();
    }
  }, [componentId, componentType, organizationId, canView, isNotesEnabled]);

  useEffect(() => {
    if (isAddingNote && titleInputRef.current) {
      titleInputRef.current.focus();
    }
  }, [isAddingNote]);

  const loadNotes = async () => {
    try {
      setLoading(true);
      const fetchedNotes = await notesService.getNotes(
        componentId,
        componentType,
        organizationId ?? undefined
      );
      setAllNotes(fetchedNotes);
      
      // Load archived notes if showing archived
      if (showArchived) {
        const archivedNotes = await notesService.getArchivedNotes(
          componentId,
          componentType,
          organizationId ?? undefined
        );
        setAllNotes([...fetchedNotes, ...archivedNotes]);
      }
    } catch (error) {
      console.error('Error loading notes:', error);
      showError('Failed to load notes');
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const cats = await notesService.getCategories(
        componentId,
        componentType,
        organizationId ?? undefined
      );
      setCategories(cats);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  // Filter and sort notes
  const filteredAndSortedNotes = useMemo(() => {
    let filtered = [...allNotes];

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(note => {
        const contentMatch = note.content.toLowerCase().includes(query);
        const titleMatch = note.title?.toLowerCase().includes(query);
        const tagMatch = note.tags?.some(tag => tag.toLowerCase().includes(query));
        const authorMatch = note.authorName?.toLowerCase().includes(query);
        const categoryMatch = note.category?.toLowerCase().includes(query);
        return contentMatch || titleMatch || tagMatch || authorMatch || categoryMatch;
      });
    }

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter(note => note.category === selectedCategory);
    }

    // Filter archived
    if (!showArchived) {
      filtered = filtered.filter(note => !note.isArchived);
    } else {
      filtered = filtered.filter(note => note.isArchived);
    }

    // Sort
    filtered.sort((a, b) => {
      // Pinned notes always first
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;

      const getDate = (date: Date | any): Date => {
        return date.toDate ? date.toDate() : new Date(date);
      };

      switch (sortOption) {
        case 'date-desc':
          return getDate(b.createdAt).getTime() - getDate(a.createdAt).getTime();
        case 'date-asc':
          return getDate(a.createdAt).getTime() - getDate(b.createdAt).getTime();
        case 'title-asc':
          return (a.title || a.content).localeCompare(b.title || b.content);
        case 'title-desc':
          return (b.title || b.content).localeCompare(a.title || a.content);
        case 'author-asc':
          return a.authorName.localeCompare(b.authorName);
        case 'author-desc':
          return b.authorName.localeCompare(a.authorName);
        default:
          return 0;
      }
    });

    return filtered;
  }, [allNotes, searchQuery, selectedCategory, showArchived, sortOption]);

  useEffect(() => {
    setNotes(filteredAndSortedNotes);
  }, [filteredAndSortedNotes]);

  const handleAddNote = async () => {
    if (!newNoteContent.trim() && checklist.length === 0) {
      showInfo('Please enter note content or add checklist items');
      return;
    }

    try {
      const noteData: CreateNoteData = {
        content: newNoteContent.trim(),
        title: newNoteTitle.trim() || undefined,
        componentId,
        componentType,
        organizationId: organizationId ?? undefined,
        isPinned,
        tags: tags.filter(t => t.trim()),
        category: category.trim() || undefined,
        color: selectedColor || undefined,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        reminderDate: reminderDate ? new Date(reminderDate) : undefined,
        checklist: checklist.length > 0 ? checklist : undefined,
        isMarkdown
      };

      await notesService.createNote(noteData);
      resetForm();
      showSuccess('Note added successfully');
      loadNotes();
      loadCategories();
    } catch (error: any) {
      console.error('Error adding note:', error);
      showError(error.message || 'Failed to add note');
    }
  };

  const handleUpdateNote = async (noteId: string) => {
    if (!editingContent.trim() && checklist.length === 0) {
      showInfo('Please enter note content or add checklist items');
      return;
    }

    try {
      await notesService.updateNote(noteId, {
        content: editingContent.trim(),
        title: editingTitle.trim() || undefined,
        tags: tags.filter(t => t.trim()),
        category: category.trim() || undefined,
        color: selectedColor || undefined,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        reminderDate: reminderDate ? new Date(reminderDate) : undefined,
        checklist: checklist.length > 0 ? checklist : undefined,
        isMarkdown
      });
      cancelEditing();
      showSuccess('Note updated successfully');
      loadNotes();
      loadCategories();
    } catch (error: any) {
      console.error('Error updating note:', error);
      showError(error.message || 'Failed to update note');
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!window.confirm('Are you sure you want to delete this note? This action cannot be undone.')) {
      return;
    }

    try {
      await notesService.deleteNote(noteId);
      showSuccess('Note deleted successfully');
      loadNotes();
    } catch (error: any) {
      console.error('Error deleting note:', error);
      showError(error.message || 'Failed to delete note');
    }
  };

  const handleArchiveNote = async (noteId: string) => {
    try {
      await notesService.archiveNote(noteId);
      showSuccess('Note archived');
      loadNotes();
    } catch (error: any) {
      console.error('Error archiving note:', error);
      showError(error.message || 'Failed to archive note');
    }
  };

  const handleUnarchiveNote = async (noteId: string) => {
    try {
      await notesService.unarchiveNote(noteId);
      showSuccess('Note unarchived');
      loadNotes();
    } catch (error: any) {
      console.error('Error unarchiving note:', error);
      showError(error.message || 'Failed to unarchive note');
    }
  };

  const handleTogglePin = async (noteId: string, currentPinned: boolean) => {
    try {
      await notesService.togglePin(noteId, !currentPinned);
      showSuccess(currentPinned ? 'Note unpinned' : 'Note pinned');
      loadNotes();
    } catch (error: any) {
      console.error('Error toggling pin:', error);
      showError(error.message || 'Failed to toggle pin');
    }
  };

  const startEditing = (note: Note) => {
    const getDateString = (date: Date | any): string => {
      if (!date) return '';
      const d = date.toDate ? date.toDate() : new Date(date);
      return d.toISOString().split('T')[0];
    };

    setEditingNoteId(note.id);
    setEditingContent(note.content);
    setEditingTitle(note.title || '');
    setTags(note.tags || []);
    setCategory(note.category || '');
    setSelectedColor(note.color || null);
    setDueDate(getDateString(note.dueDate));
    setReminderDate(getDateString(note.reminderDate));
    setChecklist(note.checklist || []);
    setIsMarkdown(note.isMarkdown || false);
  };

  const cancelEditing = () => {
    setEditingNoteId(null);
    setEditingContent('');
    setEditingTitle('');
    setTags([]);
    setCategory('');
    setSelectedColor(null);
    setDueDate('');
    setReminderDate('');
    setChecklist([]);
    setIsMarkdown(false);
  };

  const resetForm = () => {
    setIsAddingNote(false);
    setNewNoteContent('');
    setNewNoteTitle('');
    setIsPinned(false);
    setTags([]);
    setTagInput('');
    setCategory('');
    setCategoryInput('');
    setSelectedColor(null);
    setDueDate('');
    setReminderDate('');
    setChecklist([]);
    setNewChecklistItem('');
    setIsMarkdown(false);
  };

  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const addCategory = () => {
    const cat = categoryInput.trim();
    if (cat && !categories.includes(cat)) {
      setCategory(cat);
      setCategoryInput('');
    }
  };

  const addChecklistItem = () => {
    if (newChecklistItem.trim()) {
      const newItem: ChecklistItem = {
        id: Date.now().toString(),
        text: newChecklistItem.trim(),
        completed: false,
        createdAt: new Date()
      };
      setChecklist([...checklist, newItem]);
      setNewChecklistItem('');
    }
  };

  const toggleChecklistItem = async (noteId: string, itemId: string, completed: boolean) => {
    try {
      await notesService.updateChecklistItem(noteId, itemId, { completed: !completed });
      loadNotes();
    } catch (error) {
      console.error('Error updating checklist item:', error);
    }
  };

  const removeChecklistItem = (itemId: string) => {
    setChecklist(checklist.filter(item => item.id !== itemId));
  };

  const formatDate = (date: Date | any) => {
    if (!date) return 'Unknown date';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const formatDateShort = (date: Date | any) => {
    if (!date) return '';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const isOverdue = (dueDate?: Date | any) => {
    if (!dueDate) return false;
    const due = dueDate.toDate ? dueDate.toDate() : new Date(dueDate);
    return due < new Date() && !due.toDateString().includes(new Date().toDateString());
  };

  if (!canView || !isNotesEnabled) {
    return null;
  }

  return (
    <div className={`bg-white/90 backdrop-blur-sm rounded-2xl border border-forest-200/50 shadow-soft p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <StickyNote className="w-5 h-5 text-forest-600" />
          <h3 className="text-lg font-solarpunk-display font-semibold text-forest-600">
            Notes
          </h3>
          {notes.length > 0 && (
            <span className="text-sm text-forest-500 bg-forest-100 px-2 py-1 rounded-full">
              {notes.length}
            </span>
          )}
        </div>
        {canAdd && (
          <button
            onClick={() => setIsAddingNote(!isAddingNote)}
            className="flex items-center space-x-1 px-3 py-1.5 bg-forest-500 text-white rounded-lg hover:bg-forest-600 transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            <span>Add Note</span>
          </button>
        )}
      </div>

      {/* Search and Filters */}
      <div className="mb-4 space-y-2">
        <div className="flex items-center space-x-2">
          <div className="flex-1 relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-forest-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notes..."
              className="w-full pl-8 pr-3 py-2 border border-forest-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-400 text-sm"
            />
          </div>
          <button
            onClick={() => setShowArchived(!showArchived)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              showArchived
                ? 'bg-forest-500 text-white'
                : 'bg-forest-100 text-forest-700 hover:bg-forest-200'
            }`}
          >
            <Archive className="w-4 h-4" />
          </button>
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value as SortOption)}
            className="px-3 py-2 border border-forest-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-400 text-sm"
          >
            <option value="date-desc">Newest First</option>
            <option value="date-asc">Oldest First</option>
            <option value="title-asc">Title A-Z</option>
            <option value="title-desc">Title Z-A</option>
            <option value="author-asc">Author A-Z</option>
            <option value="author-desc">Author Z-A</option>
          </select>
        </div>
        
        {/* Category Filter */}
        {categories.length > 0 && (
          <div className="flex items-center space-x-2 flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-2 py-1 rounded text-xs font-medium ${
                selectedCategory === null
                  ? 'bg-forest-500 text-white'
                  : 'bg-forest-100 text-forest-700 hover:bg-forest-200'
              }`}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2 py-1 rounded text-xs font-medium ${
                  selectedCategory === cat
                    ? 'bg-forest-500 text-white'
                    : 'bg-forest-100 text-forest-700 hover:bg-forest-200'
                }`}
              >
                <Folder className="w-3 h-3 inline mr-1" />
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <div className="text-center py-8 text-forest-500">Loading notes...</div>
      ) : (
        <div className="space-y-4">
          {/* Add Note Form */}
          {isAddingNote && canAdd && (
            <div className="bg-forest-50 border border-forest-200 rounded-xl p-4 space-y-3">
              <input
                ref={titleInputRef}
                type="text"
                value={newNoteTitle}
                onChange={(e) => setNewNoteTitle(e.target.value)}
                placeholder="Note title (optional)"
                className="w-full px-3 py-2 border border-forest-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-400 text-sm"
              />
              <textarea
                ref={textareaRef}
                value={newNoteContent}
                onChange={(e) => setNewNoteContent(e.target.value)}
                placeholder="Write your note here... (or add checklist items below)"
                className="w-full min-h-[100px] p-3 border border-forest-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-400 resize-none text-sm"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.ctrlKey) {
                    handleAddNote();
                  }
                }}
              />
              
              {/* Checklist */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={newChecklistItem}
                    onChange={(e) => setNewChecklistItem(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addChecklistItem();
                      }
                    }}
                    placeholder="Add checklist item..."
                    className="flex-1 px-2 py-1 text-sm border border-forest-300 rounded focus:outline-none focus:ring-2 focus:ring-forest-400"
                  />
                  <button
                    onClick={addChecklistItem}
                    className="px-2 py-1 bg-forest-500 text-white rounded text-sm hover:bg-forest-600"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                {checklist.map((item) => (
                  <div key={item.id} className="flex items-center space-x-2">
                    <Square className="w-4 h-4 text-forest-500" />
                    <span className="flex-1 text-sm">{item.text}</span>
                    <button
                      onClick={() => removeChecklistItem(item.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Options Row */}
              <div className="flex items-center space-x-2 flex-wrap gap-2">
                <button
                  onClick={() => setIsPinned(!isPinned)}
                  className={`flex items-center space-x-1 px-2 py-1 rounded text-xs ${
                    isPinned
                      ? 'bg-yellow-100 text-yellow-700 border border-yellow-300'
                      : 'bg-gray-100 text-gray-600 border border-gray-300'
                  }`}
                >
                  {isPinned ? <Pin className="w-3 h-3" /> : <PinOff className="w-3 h-3" />}
                  <span>Pin</span>
                </button>

                {/* Category */}
                <div className="flex items-center space-x-1">
                  <Folder className="w-3 h-3 text-forest-500" />
                  <input
                    type="text"
                    value={categoryInput}
                    onChange={(e) => setCategoryInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addCategory();
                      }
                    }}
                    placeholder="Category..."
                    className="px-2 py-1 text-xs border border-forest-300 rounded focus:outline-none focus:ring-2 focus:ring-forest-400"
                    list="categories-list"
                  />
                  <datalist id="categories-list">
                    {categories.map((cat) => (
                      <option key={cat} value={cat} />
                    ))}
                  </datalist>
                  {category && (
                    <button
                      onClick={() => setCategory('')}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Color Picker */}
                <div className="flex items-center space-x-1">
                  <Palette className="w-3 h-3 text-forest-500" />
                  <select
                    value={selectedColor || ''}
                    onChange={(e) => setSelectedColor(e.target.value || null)}
                    className="px-2 py-1 text-xs border border-forest-300 rounded focus:outline-none focus:ring-2 focus:ring-forest-400"
                  >
                    {NOTE_COLORS.map((color) => (
                      <option key={color.value || 'default'} value={color.value || ''}>
                        {color.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Due Date */}
                <div className="flex items-center space-x-1">
                  <Calendar className="w-3 h-3 text-forest-500" />
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="px-2 py-1 text-xs border border-forest-300 rounded focus:outline-none focus:ring-2 focus:ring-forest-400"
                  />
                </div>
              </div>

              {/* Tags */}
              <div className="flex items-center space-x-2 flex-wrap gap-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                  placeholder="Add tag..."
                  className="flex-1 min-w-[120px] px-2 py-1 text-sm border border-forest-300 rounded focus:outline-none focus:ring-2 focus:ring-forest-400"
                />
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center space-x-1 bg-forest-100 text-forest-700 px-2 py-1 rounded text-xs"
                  >
                    <Tag className="w-3 h-3" />
                    <span>{tag}</span>
                    <button
                      onClick={() => removeTag(tag)}
                      className="hover:text-forest-900"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>

              <div className="flex items-center justify-end space-x-2">
                <button
                  onClick={resetForm}
                  className="px-4 py-2 text-forest-600 hover:text-forest-800 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddNote}
                  className="px-4 py-2 bg-forest-500 text-white rounded-lg hover:bg-forest-600 transition-colors text-sm font-medium flex items-center space-x-1"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Note</span>
                </button>
              </div>
            </div>
          )}

          {/* Notes List */}
          {notes.length === 0 ? (
            <div className="text-center py-8 text-forest-500">
              <StickyNote className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>{showArchived ? 'No archived notes' : 'No notes yet'}</p>
              {canAdd && !showArchived && (
                <p className="text-sm mt-1">Click "Add Note" to create one</p>
              )}
            </div>
          ) : (
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-4'}>
              {notes.map((note) => (
                <div
                  key={note.id}
                  className={`border rounded-xl p-4 space-y-3 ${
                    note.isPinned
                      ? 'border-yellow-300 bg-yellow-50/50'
                      : 'border-forest-200'
                  }`}
                  style={{
                    backgroundColor: note.color || undefined
                  }}
                >
                  {editingNoteId === note.id ? (
                    // Edit Mode
                    <>
                      <input
                        type="text"
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        placeholder="Note title (optional)"
                        className="w-full px-3 py-2 border border-forest-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-400 text-sm font-semibold"
                      />
                      <textarea
                        ref={editTextareaRef}
                        value={editingContent}
                        onChange={(e) => setEditingContent(e.target.value)}
                        className="w-full min-h-[100px] p-3 border border-forest-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-400 resize-none text-sm"
                      />
                      
                      {/* Checklist in edit mode */}
                      {checklist.length > 0 && (
                        <div className="space-y-1">
                          {checklist.map((item) => (
                            <div key={item.id} className="flex items-center space-x-2">
                              <Square className="w-4 h-4 text-forest-500" />
                              <span className="flex-1 text-sm">{item.text}</span>
                              <button
                                onClick={() => removeChecklistItem(item.id)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Edit form options - similar to add form */}
                      <div className="flex items-center space-x-2 flex-wrap gap-2 text-xs">
                        <div className="flex items-center space-x-1">
                          <Folder className="w-3 h-3 text-forest-500" />
                          <input
                            type="text"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            placeholder="Category..."
                            className="px-2 py-1 border border-forest-300 rounded"
                          />
                        </div>
                        <div className="flex items-center space-x-1">
                          <Palette className="w-3 h-3 text-forest-500" />
                          <select
                            value={selectedColor || ''}
                            onChange={(e) => setSelectedColor(e.target.value || null)}
                            className="px-2 py-1 border border-forest-300 rounded"
                          >
                            {NOTE_COLORS.map((color) => (
                              <option key={color.value || 'default'} value={color.value || ''}>
                                {color.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3 text-forest-500" />
                          <input
                            type="date"
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                            className="px-2 py-1 border border-forest-300 rounded"
                          />
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 flex-wrap gap-2">
                        <input
                          type="text"
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addTag();
                            }
                          }}
                          placeholder="Add tag..."
                          className="flex-1 min-w-[120px] px-2 py-1 text-sm border border-forest-300 rounded focus:outline-none focus:ring-2 focus:ring-forest-400"
                        />
                        {tags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center space-x-1 bg-forest-100 text-forest-700 px-2 py-1 rounded text-xs"
                          >
                            <span>{tag}</span>
                            <button
                              onClick={() => removeTag(tag)}
                              className="hover:text-forest-900"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={cancelEditing}
                          className="px-3 py-1.5 text-forest-600 hover:text-forest-800 text-sm"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleUpdateNote(note.id)}
                          className="px-3 py-1.5 bg-forest-500 text-white rounded hover:bg-forest-600 text-sm flex items-center space-x-1"
                        >
                          <Save className="w-3 h-3" />
                          <span>Save</span>
                        </button>
                      </div>
                    </>
                  ) : (
                    // View Mode
                    <>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          {note.title && (
                            <h4 className="font-semibold text-forest-900 mb-2">{note.title}</h4>
                          )}
                          <div className="flex items-center space-x-2 mb-2">
                            {note.isPinned && (
                              <Pin className="w-4 h-4 text-yellow-600" />
                            )}
                            <p className="text-forest-800 whitespace-pre-wrap text-sm">{note.content}</p>
                          </div>

                          {/* Checklist Display */}
                          {note.checklist && note.checklist.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {note.checklist.map((item) => (
                                <div key={item.id} className="flex items-center space-x-2">
                                  {item.completed ? (
                                    <CheckSquare className="w-4 h-4 text-green-600" />
                                  ) : (
                                    <Square className="w-4 h-4 text-forest-500" />
                                  )}
                                  <span
                                    className={`text-sm ${
                                      item.completed ? 'line-through text-forest-500' : 'text-forest-800'
                                    }`}
                                  >
                                    {item.text}
                                  </span>
                                  {canAdd && (
                                    <button
                                      onClick={() => toggleChecklistItem(note.id, item.id, item.completed)}
                                      className="ml-auto text-forest-500 hover:text-forest-700 text-xs"
                                    >
                                      {item.completed ? 'Uncheck' : 'Check'}
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Due Date Warning */}
                          {note.dueDate && isOverdue(note.dueDate) && (
                            <div className="mt-2 flex items-center space-x-1 text-red-600 text-xs">
                              <AlertCircle className="w-4 h-4" />
                              <span>Overdue: {formatDateShort(note.dueDate)}</span>
                            </div>
                          )}
                          {note.dueDate && !isOverdue(note.dueDate) && (
                            <div className="mt-2 flex items-center space-x-1 text-forest-600 text-xs">
                              <Calendar className="w-4 h-4" />
                              <span>Due: {formatDateShort(note.dueDate)}</span>
                            </div>
                          )}

                          {/* Tags and Category */}
                          <div className="mt-2 space-y-1">
                            {note.category && (
                              <div className="flex items-center space-x-1">
                                <Folder className="w-3 h-3 text-forest-500" />
                                <span className="text-xs text-forest-600">{note.category}</span>
                              </div>
                            )}
                            {note.tags && note.tags.length > 0 && (
                              <div className="flex items-center space-x-1 flex-wrap gap-1">
                                <Tag className="w-3 h-3 text-forest-500" />
                                {note.tags.map((tag) => (
                                  <span
                                    key={tag}
                                    className="text-xs bg-forest-100 text-forest-700 px-2 py-0.5 rounded"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-forest-100">
                        <div className="flex items-center space-x-4 text-xs text-forest-500">
                          <div className="flex items-center space-x-1">
                            <User className="w-3 h-3" />
                            <span>{note.authorName}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>{formatDate(note.createdAt)}</span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          {canAdd && (
                            <>
                              <button
                                onClick={() => handleTogglePin(note.id, note.isPinned || false)}
                                className="p-1.5 hover:bg-forest-100 rounded transition-colors"
                                title={note.isPinned ? 'Unpin' : 'Pin'}
                              >
                                {note.isPinned ? (
                                  <PinOff className="w-4 h-4 text-forest-600" />
                                ) : (
                                  <Pin className="w-4 h-4 text-forest-600" />
                                )}
                              </button>
                              <button
                                onClick={() => startEditing(note)}
                                className="p-1.5 hover:bg-forest-100 rounded transition-colors"
                                title="Edit"
                              >
                                <Edit2 className="w-4 h-4 text-forest-600" />
                              </button>
                              {!note.isArchived ? (
                                <button
                                  onClick={() => handleArchiveNote(note.id)}
                                  className="p-1.5 hover:bg-forest-100 rounded transition-colors"
                                  title="Archive"
                                >
                                  <Archive className="w-4 h-4 text-forest-600" />
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleUnarchiveNote(note.id)}
                                  className="p-1.5 hover:bg-forest-100 rounded transition-colors"
                                  title="Unarchive"
                                >
                                  <ArchiveRestore className="w-4 h-4 text-forest-600" />
                                </button>
                              )}
                            </>
                          )}
                          {notesService.canDeleteNote(note) && (
                            <button
                              onClick={() => handleDeleteNote(note.id)}
                              className="p-1.5 hover:bg-red-100 rounded transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </button>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotesPanel;
