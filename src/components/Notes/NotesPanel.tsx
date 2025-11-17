import React, { useState, useEffect, useRef } from 'react';
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
  AlertCircle
} from 'lucide-react';
import { notesService, Note, CreateNoteData } from '../../services/notesService';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useToast } from '../../contexts/ToastContext';
import { useAdmin } from '../../contexts/AdminContext';
import { ComponentId } from '../../types/organization';

interface NotesPanelProps {
  componentId: string;
  componentType: Note['componentType'];
  className?: string;
}

const NotesPanel: React.FC<NotesPanelProps> = ({ 
  componentId, 
  componentType,
  className = '' 
}) => {
  const { organizationId } = useOrganization();
  const { showSuccess, showError, showInfo } = useToast();
  const { state } = useAdmin();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [editingContent, setEditingContent] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const editTextareaRef = useRef<HTMLTextAreaElement>(null);

  const { enabledComponents } = useOrganization();
  const canView = notesService.canViewNotes();
  const canAdd = notesService.canAddNotes();
  const canDelete = notesService.canDeleteNotes();
  
  // Check if notes component is enabled for this organization
  const isNotesEnabled = enabledComponents?.includes('notes' as ComponentId) ?? true; // Default to true for backward compatibility

  useEffect(() => {
    if (canView && isNotesEnabled) {
      loadNotes();
    }
  }, [componentId, componentType, organizationId, canView, isNotesEnabled]);

  useEffect(() => {
    if (isAddingNote && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isAddingNote]);

  useEffect(() => {
    if (editingNoteId && editTextareaRef.current) {
      editTextareaRef.current.focus();
    }
  }, [editingNoteId]);

  const loadNotes = async () => {
    try {
      setLoading(true);
      const fetchedNotes = await notesService.getNotes(
        componentId,
        componentType,
        organizationId ?? undefined
      );
      setNotes(fetchedNotes);
    } catch (error) {
      console.error('Error loading notes:', error);
      showError('Failed to load notes');
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNoteContent.trim()) {
      showInfo('Please enter note content');
      return;
    }

    try {
      const noteData: CreateNoteData = {
        content: newNoteContent.trim(),
        componentId,
        componentType,
        organizationId: organizationId ?? undefined,
        isPinned,
        tags: tags.filter(t => t.trim())
      };

      await notesService.createNote(noteData);
      setNewNoteContent('');
      setIsPinned(false);
      setTags([]);
      setTagInput('');
      setIsAddingNote(false);
      showSuccess('Note added successfully');
      loadNotes();
    } catch (error: any) {
      console.error('Error adding note:', error);
      showError(error.message || 'Failed to add note');
    }
  };

  const handleUpdateNote = async (noteId: string) => {
    if (!editingContent.trim()) {
      showInfo('Please enter note content');
      return;
    }

    try {
      await notesService.updateNote(noteId, {
        content: editingContent.trim(),
        tags: tags.filter(t => t.trim())
      });
      setEditingNoteId(null);
      setEditingContent('');
      setTags([]);
      setTagInput('');
      showSuccess('Note updated successfully');
      loadNotes();
    } catch (error: any) {
      console.error('Error updating note:', error);
      showError(error.message || 'Failed to update note');
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!window.confirm('Are you sure you want to delete this note?')) {
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
    setEditingNoteId(note.id);
    setEditingContent(note.content);
    setTags(note.tags || []);
  };

  const cancelEditing = () => {
    setEditingNoteId(null);
    setEditingContent('');
    setTags([]);
    setTagInput('');
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

  if (!canView || !isNotesEnabled) {
    return null;
  }

  return (
    <div className={`bg-white/90 backdrop-blur-sm rounded-2xl border border-forest-200/50 shadow-soft p-6 ${className}`}>
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

      {loading ? (
        <div className="text-center py-8 text-forest-500">Loading notes...</div>
      ) : (
        <div className="space-y-4">
          {/* Add Note Form */}
          {isAddingNote && canAdd && (
            <div className="bg-forest-50 border border-forest-200 rounded-xl p-4 space-y-3">
              <div className="flex items-start space-x-2">
                <textarea
                  ref={textareaRef}
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  placeholder="Write your note here..."
                  className="flex-1 min-h-[100px] p-3 border border-forest-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-400 resize-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.ctrlKey) {
                      handleAddNote();
                    }
                  }}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsPinned(!isPinned)}
                  className={`flex items-center space-x-1 px-2 py-1 rounded ${
                    isPinned
                      ? 'bg-yellow-100 text-yellow-700 border border-yellow-300'
                      : 'bg-gray-100 text-gray-600 border border-gray-300'
                  }`}
                >
                  {isPinned ? <Pin className="w-4 h-4" /> : <PinOff className="w-4 h-4" />}
                  <span className="text-xs">Pin</span>
                </button>
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
                  onClick={() => {
                    setIsAddingNote(false);
                    setNewNoteContent('');
                    setIsPinned(false);
                    setTags([]);
                    setTagInput('');
                  }}
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
              <p>No notes yet</p>
              {canAdd && (
                <p className="text-sm mt-1">Click "Add Note" to create one</p>
              )}
            </div>
          ) : (
            notes.map((note) => (
              <div
                key={note.id}
                className={`bg-white border rounded-xl p-4 space-y-3 ${
                  note.isPinned
                    ? 'border-yellow-300 bg-yellow-50/50'
                    : 'border-forest-200'
                }`}
              >
                {editingNoteId === note.id ? (
                  // Edit Mode
                  <>
                    <textarea
                      ref={editTextareaRef}
                      value={editingContent}
                      onChange={(e) => setEditingContent(e.target.value)}
                      className="w-full min-h-[100px] p-3 border border-forest-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-400 resize-none"
                    />
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
                        <div className="flex items-center space-x-2 mb-2">
                          {note.isPinned && (
                            <Pin className="w-4 h-4 text-yellow-600" />
                          )}
                          <p className="text-forest-800 whitespace-pre-wrap">{note.content}</p>
                        </div>
                        {note.tags && note.tags.length > 0 && (
                          <div className="flex items-center space-x-1 flex-wrap gap-1 mt-2">
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
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default NotesPanel;

