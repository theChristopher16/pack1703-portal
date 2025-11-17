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
  metadata?: {
    [key: string]: any;
  };
}

export interface CreateNoteData {
  content: string;
  componentId: string;
  componentType: Note['componentType'];
  organizationId?: string;
  isPinned?: boolean;
  tags?: string[];
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
    const user = authService.currentUser;
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
    const user = authService.currentUser;
    if (!user) return false;
    
    const roles = authService.getUserRoles(user);
    return roles.some(role => 
      role === UserRole.ADMIN ||
      role === UserRole.SUPER_ADMIN ||
      role === UserRole.COPSE_ADMIN
    );
  }

  /**
   * Check if user can delete notes
   */
  canDeleteNotes(): boolean {
    const user = authService.currentUser;
    if (!user) return false;
    
    const roles = authService.getUserRoles(user);
    return roles.some(role => 
      role === UserRole.SUPER_ADMIN ||
      role === UserRole.COPSE_ADMIN
    );
  }

  /**
   * Check if user can delete a specific note (super-admin or note author if admin)
   */
  canDeleteNote(note: Note): boolean {
    const user = authService.currentUser;
    if (!user) return false;
    
    // Super admins can delete any note
    if (this.canDeleteNotes()) return true;
    
    // Admins can delete their own notes
    const roles = authService.getUserRoles(user);
    const isAdmin = roles.some(role => role === UserRole.ADMIN);
    if (isAdmin && note.authorId === user.id) return true;
    
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
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt || data.createdAt)
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

    const user = authService.currentUser;
    if (!user) {
      throw new Error('User must be authenticated to create notes');
    }

    try {
      const notesRef = collection(db, this.COLLECTION);
      const noteData = {
        content: data.content,
        componentId: data.componentId,
        componentType: data.componentType,
        organizationId: data.organizationId || null,
        authorId: user.id,
        authorName: user.displayName || user.email || 'Unknown User',
        authorEmail: user.email || null,
        isPinned: data.isPinned || false,
        tags: data.tags || [],
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
      throw error;
    }
  }

  /**
   * Update an existing note
   */
  async updateNote(noteId: string, updates: Partial<CreateNoteData>): Promise<void> {
    const user = authService.currentUser;
    if (!user) {
      throw new Error('User must be authenticated to update notes');
    }

    const note = await this.getNote(noteId);
    if (!note) {
      throw new Error('Note not found');
    }

    // Only super-admins or the note author (if admin) can update
    const canUpdate = this.canDeleteNotes() || (note.authorId === user.id && this.canAddNotes());
    if (!canUpdate) {
      throw new Error('You do not have permission to update this note');
    }

    try {
      const noteRef = doc(db, this.COLLECTION, noteId);
      await updateDoc(noteRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating note:', error);
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

    try {
      const noteRef = doc(db, this.COLLECTION, noteId);
      await deleteDoc(noteRef);
    } catch (error) {
      console.error('Error deleting note:', error);
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

    try {
      const noteRef = doc(db, this.COLLECTION, noteId);
      await updateDoc(noteRef, {
        isPinned,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error toggling pin:', error);
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

