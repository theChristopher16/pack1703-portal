import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { authService, UserRole } from './authService';
import { offlineService } from './offlineService';

export interface Note {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  authorEmail?: string;
  componentId: string; // e.g., 'events', 'announcements', 'locations'
  componentType: 'page' | 'event' | 'announcement' | 'location' | 'resource' | 'general';
  organizationId?: string;
  createdAt: Date | Timestamp;
  updatedAt?: Date | Timestamp;
  isPinned?: boolean;
  tags?: string[];
  // Organization/Categories
  category?: string; // Folder/notebook name
  notebook?: string; // Alternative to category
  // Color coding
  color?: string; // Hex color code for note background
  // Due dates and reminders
  dueDate?: Date | Timestamp;
  reminderDate?: Date | Timestamp;
  // Checklists
  checklist?: ChecklistItem[];
  // Archive
  isArchived?: boolean;
  archivedAt?: Date | Timestamp;
  // Rich content
  title?: string; // Optional title for the note
  isMarkdown?: boolean; // Whether content is markdown
  metadata?: {
    [key: string]: any;
  };
}

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
  createdAt: Date | Timestamp;
  completedAt?: Date | Timestamp;
}

export interface CreateNoteData {
  content: string;
  componentId: string;
  componentType: Note['componentType'];
  organizationId?: string;
  isPinned?: boolean;
  tags?: string[];
  // Organization/Categories
  category?: string;
  notebook?: string;
  // Color coding
  color?: string;
  // Due dates and reminders
  dueDate?: Date | Timestamp;
  reminderDate?: Date | Timestamp;
  // Checklists
  checklist?: ChecklistItem[];
  // Rich content
  title?: string;
  isMarkdown?: boolean;
  metadata?: {
    [key: string]: any;
  };
}

class NotesService {
  private readonly COLLECTION = 'notes';

  /**
   * Check if user can view notes
   */
  canViewNotes(): boolean {
    const user = authService.getCurrentUser();
    if (!user) return false;
    
    const roles = authService.getUserRoles(user);
    return roles.some(role => 
      role === UserRole.PARENT ||
      role === UserRole.DEN_LEADER ||
      role === UserRole.ADMIN ||
      role === UserRole.SUPER_ADMIN ||
      role === UserRole.COPSE_ADMIN
    );
  }

  /**
   * Check if user can add notes
   */
  canAddNotes(): boolean {
    const user = authService.getCurrentUser();
    if (!user) return false;
    
    const roles = authService.getUserRoles(user);
    return roles.some(role => 
      role === UserRole.DEN_LEADER ||
      role === UserRole.ADMIN ||
      role === UserRole.SUPER_ADMIN ||
      role === UserRole.COPSE_ADMIN
    );
  }

  /**
   * Check if user can delete notes
   */
  canDeleteNotes(): boolean {
    const user = authService.getCurrentUser();
    if (!user) return false;
    
    const roles = authService.getUserRoles(user);
    return roles.some(role => 
      role === UserRole.SUPER_ADMIN ||
      role === UserRole.COPSE_ADMIN
    );
  }

  /**
   * Check if user can delete a specific note (super-admin or note author if admin/den leader)
   */
  canDeleteNote(note: Note): boolean {
    const user = authService.getCurrentUser();
    if (!user) return false;
    
    // Super admins can delete any note
    if (this.canDeleteNotes()) return true;
    
    // Admins and den leaders can delete their own notes
    const roles = authService.getUserRoles(user);
    const isAdmin = roles.some(role => role === UserRole.ADMIN);
    const isDenLeader = roles.some(role => role === UserRole.DEN_LEADER);
    if ((isAdmin || isDenLeader) && note.authorId === user.uid) return true;
    
    return false;
  }

  /**
   * Get notes for a specific component
   */
  async getNotes(
    componentId: string,
    componentType: Note['componentType'],
    organizationId?: string
  ): Promise<Note[]> {
    try {
      const notesRef = collection(db, this.COLLECTION);
      const conditions: any[] = [
        where('componentId', '==', componentId),
        where('componentType', '==', componentType)
      ];

      if (organizationId) {
        conditions.push(where('organizationId', '==', organizationId));
      }

      const q = query(
        notesRef,
        ...conditions,
        orderBy('isPinned', 'desc'),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt || data.createdAt)
        } as Note;
      });
    } catch (error) {
      console.error('Error fetching notes:', error);
      throw error;
    }
  }

  /**
   * Get a single note by ID
   */
  async getNote(noteId: string): Promise<Note | null> {
    try {
      const noteRef = doc(db, this.COLLECTION, noteId);
      const noteSnap = await getDoc(noteRef);
      
      if (!noteSnap.exists()) {
        return null;
      }

      const data = noteSnap.data();
      return {
        id: noteSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt || data.createdAt),
        dueDate: data.dueDate?.toDate ? data.dueDate.toDate() : (data.dueDate ? new Date(data.dueDate) : undefined),
        reminderDate: data.reminderDate?.toDate ? data.reminderDate.toDate() : (data.reminderDate ? new Date(data.reminderDate) : undefined),
        archivedAt: data.archivedAt?.toDate ? data.archivedAt.toDate() : (data.archivedAt ? new Date(data.archivedAt) : undefined),
        checklist: data.checklist?.map((item: any) => ({
          ...item,
          createdAt: item.createdAt?.toDate ? item.createdAt.toDate() : new Date(item.createdAt),
          completedAt: item.completedAt?.toDate ? item.completedAt.toDate() : (item.completedAt ? new Date(item.completedAt) : undefined)
        })) || undefined
      } as Note;
    } catch (error) {
      console.error('Error fetching note:', error);
      throw error;
    }
  }

  /**
   * Create a new note
   */
  async createNote(data: CreateNoteData): Promise<Note> {
    if (!this.canAddNotes()) {
      throw new Error('You do not have permission to create notes');
    }

    const user = authService.getCurrentUser();
    if (!user) {
      throw new Error('User must be authenticated to create notes');
    }

    // Check if we have connectivity
    const hasConnectivity = offlineService.getOnlineStatus();
    
    // If offline, queue the action
    if (!hasConnectivity) {
      const actionId = offlineService.queueAction({
        type: 'create_note',
        payload: data
      }, false); // Notes can work with local connectivity
      
      // Return a temporary note object for optimistic UI
      return {
        id: `temp_${actionId}`,
        ...data,
        authorId: user.uid,
        authorName: user.displayName || user.email || 'Unknown User',
        authorEmail: user.email || null,
        createdAt: new Date(),
        updatedAt: new Date(),
        isPinned: data.isPinned || false,
        tags: data.tags || [],
        metadata: data.metadata || {},
        organizationId: data.organizationId || null
      } as Note;
    }

    try {
      const notesRef = collection(db, this.COLLECTION);
      const noteData = {
        content: data.content,
        componentId: data.componentId,
        componentType: data.componentType,
        organizationId: data.organizationId || null,
        authorId: user.uid,
        authorName: user.displayName || user.email || 'Unknown User',
        authorEmail: user.email || null,
        isPinned: data.isPinned || false,
        tags: data.tags || [],
        category: data.category || null,
        notebook: data.notebook || null,
        color: data.color || null,
        dueDate: data.dueDate || null,
        reminderDate: data.reminderDate || null,
        checklist: data.checklist || null,
        title: data.title || null,
        isMarkdown: data.isMarkdown || false,
        isArchived: false,
        metadata: data.metadata || {},
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(notesRef, noteData);
      const createdNote = await this.getNote(docRef.id);
      
      if (!createdNote) {
        throw new Error('Failed to retrieve created note');
      }

      return createdNote;
    } catch (error) {
      console.error('Error creating note:', error);
      // If error is due to connectivity, queue it
      if (error instanceof Error && (error.message.includes('network') || error.message.includes('offline'))) {
        const actionId = offlineService.queueAction({
          type: 'create_note',
          payload: data
        }, false);
        
        return {
          id: `temp_${actionId}`,
          ...data,
          authorId: user.uid,
          authorName: user.displayName || user.email || 'Unknown User',
          authorEmail: user.email || null,
          createdAt: new Date(),
          updatedAt: new Date(),
          isPinned: data.isPinned || false,
          tags: data.tags || [],
          metadata: data.metadata || {},
          organizationId: data.organizationId || null
        } as Note;
      }
      throw error;
    }
  }

  /**
   * Update an existing note
   */
  async updateNote(noteId: string, updates: Partial<CreateNoteData>): Promise<void> {
    const user = authService.getCurrentUser();
    if (!user) {
      throw new Error('User must be authenticated to update notes');
    }

    const note = await this.getNote(noteId);
    if (!note) {
      throw new Error('Note not found');
    }

    // Super-admins can update any note, or note author (if admin/den leader) can update their own
    const roles = authService.getUserRoles(user);
    const isSuperAdmin = roles.some(role => role === UserRole.SUPER_ADMIN || role === UserRole.COPSE_ADMIN);
    const canUpdate = isSuperAdmin || (note.authorId === user.uid && this.canAddNotes());
    if (!canUpdate) {
      throw new Error('You do not have permission to update this note');
    }

    // Check if we have connectivity
    const hasConnectivity = offlineService.getOnlineStatus();
    
    // If offline, queue the action
    if (!hasConnectivity) {
      offlineService.queueAction({
        type: 'update_note',
        payload: { noteId, updates }
      }, false); // Notes can work with local connectivity
      return;
    }

    try {
      const noteRef = doc(db, this.COLLECTION, noteId);
      await updateDoc(noteRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating note:', error);
      // If error is due to connectivity, queue it
      if (error instanceof Error && (error.message.includes('network') || error.message.includes('offline'))) {
        offlineService.queueAction({
          type: 'update_note',
          payload: { noteId, updates }
        }, false);
        return;
      }
      throw error;
    }
  }

  /**
   * Delete a note
   */
  async deleteNote(noteId: string): Promise<void> {
    const note = await this.getNote(noteId);
    if (!note) {
      throw new Error('Note not found');
    }

    if (!this.canDeleteNote(note)) {
      throw new Error('You do not have permission to delete this note');
    }

    // Check if we have connectivity
    const hasConnectivity = offlineService.getOnlineStatus();
    
    // If offline, queue the action
    if (!hasConnectivity) {
      offlineService.queueAction({
        type: 'delete_note',
        payload: { noteId }
      }, false); // Notes can work with local connectivity
      return;
    }

    try {
      const noteRef = doc(db, this.COLLECTION, noteId);
      await deleteDoc(noteRef);
    } catch (error) {
      console.error('Error deleting note:', error);
      // If error is due to connectivity, queue it
      if (error instanceof Error && (error.message.includes('network') || error.message.includes('offline'))) {
        offlineService.queueAction({
          type: 'delete_note',
          payload: { noteId }
        }, false);
        return;
      }
      throw error;
    }
  }

  /**
   * Pin/unpin a note
   */
  async togglePin(noteId: string, isPinned: boolean): Promise<void> {
    if (!this.canAddNotes()) {
      throw new Error('You do not have permission to pin notes');
    }

    // Check if we have connectivity
    const hasConnectivity = offlineService.getOnlineStatus();
    
    // If offline, queue the action
    if (!hasConnectivity) {
      offlineService.queueAction({
        type: 'toggle_pin_note',
        payload: { noteId, isPinned }
      }, false); // Notes can work with local connectivity
      return;
    }

    try {
      const noteRef = doc(db, this.COLLECTION, noteId);
      await updateDoc(noteRef, {
        isPinned,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error toggling pin:', error);
      // If error is due to connectivity, queue it
      if (error instanceof Error && (error.message.includes('network') || error.message.includes('offline'))) {
        offlineService.queueAction({
          type: 'toggle_pin_note',
          payload: { noteId, isPinned }
        }, false);
        return;
      }
      throw error;
    }
  }

  /**
   * Archive a note
   */
  async archiveNote(noteId: string): Promise<void> {
    const user = authService.getCurrentUser();
    if (!user) {
      throw new Error('User must be authenticated to archive notes');
    }

    const note = await this.getNote(noteId);
    if (!note) {
      throw new Error('Note not found');
    }

    // Check permissions - same as delete
    if (!this.canDeleteNote(note)) {
      throw new Error('You do not have permission to archive this note');
    }

    const hasConnectivity = offlineService.getOnlineStatus();
    
    if (!hasConnectivity) {
      offlineService.queueAction({
        type: 'update_note',
        payload: { 
          noteId, 
          updates: { isArchived: true, archivedAt: new Date() }
        }
      }, false);
      return;
    }

    try {
      const noteRef = doc(db, this.COLLECTION, noteId);
      await updateDoc(noteRef, {
        isArchived: true,
        archivedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error archiving note:', error);
      if (error instanceof Error && (error.message.includes('network') || error.message.includes('offline'))) {
        offlineService.queueAction({
          type: 'update_note',
          payload: { 
            noteId, 
            updates: { isArchived: true, archivedAt: new Date() }
          }
        }, false);
        return;
      }
      throw error;
    }
  }

  /**
   * Unarchive a note
   */
  async unarchiveNote(noteId: string): Promise<void> {
    const user = authService.getCurrentUser();
    if (!user) {
      throw new Error('User must be authenticated to unarchive notes');
    }

    const note = await this.getNote(noteId);
    if (!note) {
      throw new Error('Note not found');
    }

    if (!this.canDeleteNote(note)) {
      throw new Error('You do not have permission to unarchive this note');
    }

    const hasConnectivity = offlineService.getOnlineStatus();
    
    if (!hasConnectivity) {
      offlineService.queueAction({
        type: 'update_note',
        payload: { 
          noteId, 
          updates: { isArchived: false, archivedAt: null }
        }
      }, false);
      return;
    }

    try {
      const noteRef = doc(db, this.COLLECTION, noteId);
      await updateDoc(noteRef, {
        isArchived: false,
        archivedAt: null,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error unarchiving note:', error);
      if (error instanceof Error && (error.message.includes('network') || error.message.includes('offline'))) {
        offlineService.queueAction({
          type: 'update_note',
          payload: { 
            noteId, 
            updates: { isArchived: false, archivedAt: null }
          }
        }, false);
        return;
      }
      throw error;
    }
  }

  /**
   * Get archived notes
   */
  async getArchivedNotes(
    componentId: string,
    componentType: Note['componentType'],
    organizationId?: string
  ): Promise<Note[]> {
    try {
      const notesRef = collection(db, this.COLLECTION);
      const conditions: any[] = [
        where('componentId', '==', componentId),
        where('componentType', '==', componentType),
        where('isArchived', '==', true)
      ];

      if (organizationId) {
        conditions.push(where('organizationId', '==', organizationId));
      }

      const q = query(
        notesRef,
        ...conditions,
        orderBy('archivedAt', 'desc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt || data.createdAt),
          dueDate: data.dueDate?.toDate ? data.dueDate.toDate() : (data.dueDate ? new Date(data.dueDate) : undefined),
          reminderDate: data.reminderDate?.toDate ? data.reminderDate.toDate() : (data.reminderDate ? new Date(data.reminderDate) : undefined),
          archivedAt: data.archivedAt?.toDate ? data.archivedAt.toDate() : (data.archivedAt ? new Date(data.archivedAt) : undefined)
        } as Note;
      });
    } catch (error) {
      console.error('Error fetching archived notes:', error);
      throw error;
    }
  }

  /**
   * Search notes by content, title, or tags
   */
  async searchNotes(
    componentId: string,
    componentType: Note['componentType'],
    searchQuery: string,
    organizationId?: string
  ): Promise<Note[]> {
    try {
      // Get all notes first (Firestore doesn't support full-text search natively)
      const allNotes = await this.getNotes(componentId, componentType, organizationId);
      const queryLower = searchQuery.toLowerCase();
      
      return allNotes.filter(note => {
        const contentMatch = note.content.toLowerCase().includes(queryLower);
        const titleMatch = note.title?.toLowerCase().includes(queryLower);
        const tagMatch = note.tags?.some(tag => tag.toLowerCase().includes(queryLower));
        const authorMatch = note.authorName?.toLowerCase().includes(queryLower);
        const categoryMatch = note.category?.toLowerCase().includes(queryLower);
        
        return contentMatch || titleMatch || tagMatch || authorMatch || categoryMatch;
      });
    } catch (error) {
      console.error('Error searching notes:', error);
      throw error;
    }
  }

  /**
   * Get notes by category
   */
  async getNotesByCategory(
    componentId: string,
    componentType: Note['componentType'],
    category: string,
    organizationId?: string
  ): Promise<Note[]> {
    try {
      const notesRef = collection(db, this.COLLECTION);
      const conditions: any[] = [
        where('componentId', '==', componentId),
        where('componentType', '==', componentType),
        where('category', '==', category)
      ];

      if (organizationId) {
        conditions.push(where('organizationId', '==', organizationId));
      }

      const q = query(
        notesRef,
        ...conditions,
        orderBy('isPinned', 'desc'),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs
        .map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
            updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt || data.createdAt)
          } as Note;
        })
        .filter(note => !note.isArchived);
    } catch (error) {
      console.error('Error fetching notes by category:', error);
      throw error;
    }
  }

  /**
   * Get all categories for a component
   */
  async getCategories(
    componentId: string,
    componentType: Note['componentType'],
    organizationId?: string
  ): Promise<string[]> {
    try {
      const notes = await this.getNotes(componentId, componentType, organizationId);
      const categories = new Set<string>();
      notes.forEach(note => {
        if (note.category) {
          categories.add(note.category);
        }
      });
      return Array.from(categories).sort();
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  }

  /**
   * Update checklist item
   */
  async updateChecklistItem(
    noteId: string,
    itemId: string,
    updates: Partial<ChecklistItem>
  ): Promise<void> {
    const note = await this.getNote(noteId);
    if (!note) {
      throw new Error('Note not found');
    }

    const checklist = note.checklist || [];
    const updatedChecklist = checklist.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          ...updates,
          completedAt: updates.completed ? new Date() : undefined
        };
      }
      return item;
    });

    const hasConnectivity = offlineService.getOnlineStatus();
    
    if (!hasConnectivity) {
      offlineService.queueAction({
        type: 'update_note',
        payload: { noteId, updates: { checklist: updatedChecklist } }
      }, false);
      return;
    }

    try {
      const noteRef = doc(db, this.COLLECTION, noteId);
      await updateDoc(noteRef, {
        checklist: updatedChecklist,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating checklist item:', error);
      if (error instanceof Error && (error.message.includes('network') || error.message.includes('offline'))) {
        offlineService.queueAction({
          type: 'update_note',
          payload: { noteId, updates: { checklist: updatedChecklist } }
        }, false);
        return;
      }
      throw error;
    }
  }

  /**
   * Get all notes for an organization
   */
  async getOrganizationNotes(organizationId: string): Promise<Note[]> {
    try {
      const notesRef = collection(db, this.COLLECTION);
      const q = query(
        notesRef,
        where('organizationId', '==', organizationId),
        orderBy('isPinned', 'desc'),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt || data.createdAt)
        } as Note;
      });
    } catch (error) {
      console.error('Error fetching organization notes:', error);
      throw error;
    }
  }
}

export const notesService = new NotesService();
export default notesService;

