import { collection, doc, setDoc, getDocs, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Timestamp } from 'firebase/firestore';
import { InventoryItem, ItemCondition } from '../types/firestore';

export interface GoogleSheetInventoryRow {
  'Last Checked': string;
  'Item Name': string;
  'Qty': number | string;
  'Condition': string;
  'Description / Notes': string;
  'Est': string;
}

const GOOGLE_SHEETS_API_KEY = process.env.REACT_APP_GOOGLE_SHEETS_API_KEY || '';
const SPREADSHEET_ID = '1XD0YFbaecFUPG-8UuQcTi4p8AMK6oxiAgLtf0D133m4';
const RANGE = 'Inventory!A2:F100'; // Adjust based on your sheet name

// Map Google Sheets condition to ItemCondition type
const mapCondition = (condition: string): ItemCondition => {
  const normalized = condition.toLowerCase().trim();
  
  if (normalized.includes('excellent')) return 'excellent';
  if (normalized.includes('good')) return 'good';
  if (normalized.includes('fair')) return 'fair';
  if (normalized.includes('poor') || normalized.includes('needs replacement')) return 'poor';
  if (normalized.includes('replace') || normalized.includes('repair')) return 'needs_repair';
  
  return 'good'; // Default to good
};

// Parse date from various formats
const parseDate = (dateStr: string): Date => {
  if (!dateStr || dateStr.trim() === '') return new Date();
  
  // Try to parse as M/D/YYYY
  const dateMatch = dateStr.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (dateMatch) {
    const [, month, day, year] = dateMatch;
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  }
  
  return new Date();
};

// Extract estimated value from string
const parseEstValue = (estStr: string): number | undefined => {
  if (!estStr || estStr.trim() === '') return undefined;
  
  // Extract number from string like "$5" or "5" or "$10"
  const match = estStr.match(/\$?(\d+)/);
  if (match) {
    return Math.round(parseFloat(match[1]) * 100); // Convert to cents
  }
  
  return undefined;
};

export class GoogleSheetsSyncService {
  /**
   * Fetch data from Google Sheet using the public API
   */
  async fetchSheetData(): Promise<GoogleSheetInventoryRow[]> {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${RANGE}?key=${GOOGLE_SHEETS_API_KEY}`;
    
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Google Sheets API key is invalid or missing. Please add REACT_APP_GOOGLE_SHEETS_API_KEY to your environment variables.');
        }
        throw new Error(`Failed to fetch Google Sheet: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Convert rows to objects
      const rows = data.values || [];
      const headers = rows[0];
      
      return rows.slice(1).map((row: any[]) => {
        const obj: any = {};
        headers.forEach((header: string, index: number) => {
          obj[header] = row[index] || '';
        });
        return obj as GoogleSheetInventoryRow;
      }).filter((row: GoogleSheetInventoryRow) => 
        row['Item Name'] && row['Item Name'].trim() !== ''
      );
    } catch (error) {
      console.error('Error fetching Google Sheet:', error);
      throw error;
    }
  }

  /**
   * Convert Google Sheet row to InventoryItem
   */
  convertRowToInventoryItem(row: GoogleSheetInventoryRow, index: number): Partial<InventoryItem> {
    const qtyStr = row['Qty']?.toString() || '0';
    const qty = parseInt(qtyStr) || 1;
    
    return {
      name: row['Item Name'].trim(),
      quantity: qty,
      condition: mapCondition(row['Condition'] || 'good'),
      description: row['Description / Notes'] || '',
      notes: row['Description / Notes'] || '',
      estimatedValue: parseEstValue(row['Est']),
      lastChecked: Timestamp.fromDate(parseDate(row['Last Checked'])),
      checkedBy: 'google_sheets_sync',
      location: 'Pack Trailer',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
  }

  /**
   * Sync Google Sheet data to Firestore inventory
   */
  async syncInventory(): Promise<{ success: number; errors: number }> {
    try {
      console.log('🔄 Starting inventory sync from Google Sheets...');
      
      // Fetch data from Google Sheet
      const rows = await this.fetchSheetData();
      console.log(`📊 Fetched ${rows.length} items from Google Sheet`);
      
      if (rows.length === 0) {
        throw new Error('No data found in Google Sheet');
      }

      // Get existing inventory items
      const existingItemsSnapshot = await getDocs(collection(db, 'inventory'));
      const existingItems = new Map<string, InventoryItem>();
      
      existingItemsSnapshot.forEach((doc) => {
        const item = { id: doc.id, ...doc.data() } as InventoryItem;
        existingItems.set(item.name.toLowerCase().trim(), item);
      });

      let successCount = 0;
      let errorCount = 0;

      // Sync each row
      for (let index = 0; index < rows.length; index++) {
        const row = rows[index];
        
        try {
          const itemData = this.convertRowToInventoryItem(row, index);
          const itemName = itemData.name?.toLowerCase().trim() || '';
          
          if (!itemData.name) {
            console.warn(`⚠️ Skipping row ${index + 1}: Missing item name`);
            errorCount++;
            continue;
          }

          // Check if item exists
          const existingItem = existingItems.get(itemName);
          
          if (existingItem) {
            // Update existing item
            await setDoc(doc(db, 'inventory', existingItem.id), {
              ...itemData,
              id: existingItem.id,
            }, { merge: true });
            console.log(`✅ Updated: ${itemData.name}`);
          } else {
            // Create new item
            const newItemRef = doc(collection(db, 'inventory'));
            await setDoc(newItemRef, {
              ...itemData,
              id: newItemRef.id,
            });
            console.log(`➕ Created: ${itemData.name}`);
          }
          
          successCount++;
        } catch (error) {
          console.error(`❌ Error processing row ${index + 1}:`, error);
          errorCount++;
        }
      }

      console.log(`✅ Sync complete: ${successCount} items synced, ${errorCount} errors`);
      
      return { success: successCount, errors: errorCount };
    } catch (error) {
      console.error('❌ Error syncing inventory:', error);
      throw error;
    }
  }

  /**
   * Clear all inventory items (use with caution!)
   */
  async clearInventory(): Promise<void> {
    try {
      const snapshot = await getDocs(collection(db, 'inventory'));
      
      const deletePromises = snapshot.docs.map((doc) => 
        deleteDoc(doc.ref)
      );
      
      await Promise.all(deletePromises);
      console.log('🗑️ All inventory items cleared');
    } catch (error) {
      console.error('Error clearing inventory:', error);
      throw error;
    }
  }
}

export const googleSheetsSyncService = new GoogleSheetsSyncService();

