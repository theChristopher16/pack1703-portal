import { doc, updateDoc, getDocs, query, where, orderBy, collection, Timestamp } from 'firebase/firestore';
import { db } from '../firebase/config';

interface ArchiveEventOptions {
  eventId: string;
  userId: string;
  scoutingYear?: string;
}

/**
 * Archive an event by setting isArchived flag and metadata
 */
export async function archiveEvent({ eventId, userId, scoutingYear }: ArchiveEventOptions): Promise<void> {
  try {
    const eventRef = doc(db, 'events', eventId);
    
    // Calculate scouting year if not provided (August to August)
    const currentYear = scoutingYear || getCurrentScoutingYear();
    
    await updateDoc(eventRef, {
      isArchived: true,
      archivedAt: Timestamp.now(),
      archivedBy: userId,
      scoutingYear: currentYear
    });
  } catch (error) {
    console.error('Error archiving event:', error);
    throw error;
  }
}

/**
 * Unarchive an event by removing archive flags
 */
export async function unarchiveEvent(eventId: string): Promise<void> {
  try {
    const eventRef = doc(db, 'events', eventId);
    
    await updateDoc(eventRef, {
      isArchived: false,
      archivedAt: null,
      archivedBy: null
    });
  } catch (error) {
    console.error('Error unarchiving event:', error);
    throw error;
  }
}

/**
 * Get all archived events organized by scouting year
 */
export async function getArchivedEvents(): Promise<Record<string, any[]>> {
  try {
    const eventsRef = collection(db, 'events');
    const q = query(
      eventsRef,
      where('isArchived', '==', true),
      orderBy('startDate', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const events: any[] = [];
    
    querySnapshot.forEach((doc) => {
      events.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    // Organize by scouting year
    const organizedByYear: Record<string, any[]> = {};
    events.forEach(event => {
      const year = event.scoutingYear || 'Unknown';
      if (!organizedByYear[year]) {
        organizedByYear[year] = [];
      }
      organizedByYear[year].push(event);
    });
    
    return organizedByYear;
  } catch (error) {
    console.error('Error fetching archived events:', error);
    throw error;
  }
}

/**
 * Get scouting year for a given date
 * Scouting year runs from August to August
 */
export function getScoutingYear(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = date.getMonth() + 1; // getMonth() is 0-indexed
  
  // If it's August or later, use current year - current year + 1
  // Otherwise, use previous year - current year
  if (month >= 8) {
    return `${year}-${year + 1}`;
  } else {
    return `${year - 1}-${year}`;
  }
}

/**
 * Get current scouting year
 */
export function getCurrentScoutingYear(): string {
  return getScoutingYear(new Date());
}

/**
 * Check if an event should be auto-archived
 * Events are auto-archived 1 day after they start
 */
export function shouldAutoArchive(event: any): boolean {
  if (event.isArchived) {
    return false; // Already archived
  }
  
  if (!event.startDate) {
    return false; // No start date
  }
  
  try {
    const startDate = event.startDate.toDate ? event.startDate.toDate() : new Date(event.startDate);
    const now = new Date();
    const daysSinceStart = (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
    
    // Archive if the event started more than 1 day ago
    return daysSinceStart > 1;
  } catch (error) {
    console.error('Error checking auto-archive:', error);
    return false;
  }
}

/**
 * Extract scouting year from event start date if not specified
 */
export function extractScoutingYearFromEvent(event: any): string {
  if (event.scoutingYear) {
    return event.scoutingYear;
  }
  
  if (event.startDate) {
    const date = event.startDate.toDate ? event.startDate.toDate() : new Date(event.startDate);
    return getScoutingYear(date);
  }
  
  return getCurrentScoutingYear();
}
