import { getFirestore, collection, query, where, orderBy, limit as firestoreLimit, getDocs, doc, getDoc } from 'firebase/firestore';

interface AuditEntry {
  id: string;
  collection: string;
  documentId: string;
  action: 'create' | 'update' | 'delete';
  userId: string;
  timestamp: any; // Can be Date or Firestore Timestamp
  oldValues?: any;
  newValues?: any;
  changes?: FieldChange[];
  metadata?: any;
}

interface FieldChange {
  field: string;
  oldValue: any;
  newValue: any;
  type: 'added' | 'modified' | 'removed';
  timestamp?: any;
}

interface DataHistory {
  documentId: string;
  collection: string;
  currentValue: any;
  history: AuditEntry[];
  lastModified: Date;
  createdBy: string;
  modifiedBy: string;
}

interface AuditSummary {
  totalChanges: number;
  changesByCollection: { [collection: string]: number };
  changesByUser: { [userId: string]: number };
  changesByDate: { [date: string]: number };
  recentActivity: AuditEntry[];
}

class DataAuditService {
  private db = getFirestore();

  // Get audit trail for a specific document
  async getDocumentAuditTrail(collectionName: string, documentId: string): Promise<DataHistory | null> {
    try {
      // Get current document
      const docRef = doc(this.db, collectionName, documentId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return null;
      }

      const currentData = docSnap.data();
      
      // Get audit logs for this document
      const auditQuery = query(
        collection(this.db, 'audit-logs'),
        where('collection', '==', collectionName),
        where('documentId', '==', documentId),
        orderBy('timestamp', 'desc')
      );
      
      const auditSnapshot = await getDocs(auditQuery);
      const auditEntries: AuditEntry[] = auditSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AuditEntry[];

      return {
        documentId,
        collection: collectionName,
        currentValue: currentData,
        history: auditEntries,
        lastModified: auditEntries[0]?.timestamp || new Date(),
        createdBy: auditEntries[auditEntries.length - 1]?.userId || 'unknown',
        modifiedBy: auditEntries[0]?.userId || 'unknown'
      };
    } catch (error) {
      console.error('Error getting document audit trail:', error);
      return null;
    }
  }

  // Get audit summary for the entire system
  async getAuditSummary(days: number = 30): Promise<AuditSummary> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      const auditQuery = query(
        collection(this.db, 'audit-logs'),
        where('timestamp', '>=', startDate),
        orderBy('timestamp', 'desc'),
        firestoreLimit(1000)
      );
      
      const auditSnapshot = await getDocs(auditQuery);
      const auditEntries: AuditEntry[] = auditSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AuditEntry[];

      // Analyze changes
      const changesByCollection: { [collection: string]: number } = {};
      const changesByUser: { [userId: string]: number } = {};
      const changesByDate: { [date: string]: number } = {};

      auditEntries.forEach(entry => {
        // Count by collection
        changesByCollection[entry.collection] = (changesByCollection[entry.collection] || 0) + 1;
        
        // Count by user
        changesByUser[entry.userId] = (changesByUser[entry.userId] || 0) + 1;
        
        // Count by date
        const timestamp = entry.timestamp && typeof entry.timestamp.toDate === 'function' ? 
          entry.timestamp.toDate() : new Date(entry.timestamp);
        const dateKey = timestamp.toISOString().split('T')[0];
        changesByDate[dateKey] = (changesByDate[dateKey] || 0) + 1;
      });

      return {
        totalChanges: auditEntries.length,
        changesByCollection,
        changesByUser,
        changesByDate,
        recentActivity: auditEntries.slice(0, 20)
      };
    } catch (error) {
      console.error('Error getting audit summary:', error);
      return {
        totalChanges: 0,
        changesByCollection: {},
        changesByUser: {},
        changesByDate: {},
        recentActivity: []
      };
    }
  }

  // Get field change history for a specific field
  async getFieldHistory(collectionName: string, documentId: string, fieldName: string): Promise<FieldChange[]> {
    try {
      const auditQuery = query(
        collection(this.db, 'audit-logs'),
        where('collection', '==', collectionName),
        where('documentId', '==', documentId),
        orderBy('timestamp', 'desc')
      );
      
      const auditSnapshot = await getDocs(auditQuery);
      const fieldChanges: FieldChange[] = [];

      auditSnapshot.docs.forEach(doc => {
        const entry = doc.data() as AuditEntry;
        if (entry.changes) {
          const fieldChange = entry.changes.find(change => change.field === fieldName);
          if (fieldChange) {
            fieldChanges.push({
              ...fieldChange,
              timestamp: entry.timestamp
            });
          }
        }
      });

      return fieldChanges;
    } catch (error) {
      console.error('Error getting field history:', error);
      return [];
    }
  }

  // Get all changes made by a specific user
  async getUserChanges(userId: string, limit: number = 50): Promise<AuditEntry[]> {
    try {
      const auditQuery = query(
        collection(this.db, 'audit-logs'),
        where('userId', '==', userId),
        orderBy('timestamp', 'desc'),
        firestoreLimit(limit)
      );
      
      const auditSnapshot = await getDocs(auditQuery);
      return auditSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AuditEntry[];
    } catch (error) {
      console.error('Error getting user changes:', error);
      return [];
    }
  }

  // Get changes for a specific collection
  async getCollectionChanges(collectionName: string, limit: number = 50): Promise<AuditEntry[]> {
    try {
      const auditQuery = query(
        collection(this.db, 'audit-logs'),
        where('collection', '==', collectionName),
        orderBy('timestamp', 'desc'),
        firestoreLimit(limit)
      );
      
      const auditSnapshot = await getDocs(auditQuery);
      return auditSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AuditEntry[];
    } catch (error) {
      console.error('Error getting collection changes:', error);
      return [];
    }
  }

  // Get data integrity report
  async getDataIntegrityReport(): Promise<any> {
    try {
      const collections = ['events', 'announcements', 'locations', 'users', 'chat-messages'];
      const report: any = {};

      for (const collectionName of collections) {
              const collectionQuery = query(
        collection(this.db, collectionName),
        firestoreLimit(100)
      );
        
        const snapshot = await getDocs(collectionQuery);
        const documents = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        report[collectionName] = {
          totalDocuments: documents.length,
          documentsWithAuditTrail: 0,
          lastModified: null,
          dataQuality: {
            missingRequiredFields: 0,
            invalidDataTypes: 0,
            duplicateEntries: 0
          }
        };

        // Check each document for audit trail
        for (const document of documents) {
          const auditTrail = await this.getDocumentAuditTrail(collectionName, document.id);
          if (auditTrail && auditTrail.history.length > 0) {
            report[collectionName].documentsWithAuditTrail++;
          }
        }
      }

      return report;
    } catch (error) {
      console.error('Error getting data integrity report:', error);
      return {};
    }
  }

  // Get data recovery options for a document
  async getDataRecoveryOptions(collectionName: string, documentId: string): Promise<any> {
    try {
      const auditTrail = await this.getDocumentAuditTrail(collectionName, documentId);
      
      if (!auditTrail) {
        return { available: false, reason: 'Document not found' };
      }

      const recoveryOptions = auditTrail.history
        .filter(entry => entry.action === 'update' && entry.oldValues)
        .map(entry => ({
          timestamp: entry.timestamp,
          userId: entry.userId,
          oldValues: entry.oldValues,
          changes: entry.changes
        }));

      return {
        available: recoveryOptions.length > 0,
        options: recoveryOptions,
        currentValue: auditTrail.currentValue
      };
    } catch (error) {
      console.error('Error getting data recovery options:', error);
      return { available: false, reason: 'Error retrieving recovery options' };
    }
  }

  // Export audit data for analysis
  async exportAuditData(startDate: Date, endDate: Date): Promise<any[]> {
    try {
      const auditQuery = query(
        collection(this.db, 'audit-logs'),
        where('timestamp', '>=', startDate),
        where('timestamp', '<=', endDate),
        orderBy('timestamp', 'desc')
      );
      
      const auditSnapshot = await getDocs(auditQuery);
      return auditSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error exporting audit data:', error);
      return [];
    }
  }

  // Get system-wide data statistics
  async getDataStatistics(): Promise<any> {
    try {
      const collections = ['events', 'announcements', 'locations', 'users', 'chat-messages', 'ai-interactions', 'email-monitor-logs'];
      const stats: any = {};

      for (const collectionName of collections) {
        const collectionQuery = query(
          collection(this.db, collectionName),
          firestoreLimit(1000)
        );
        
        const snapshot = await getDocs(collectionQuery);
        const documents = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Calculate statistics
        const timestamps = documents
          .map(doc => (doc as any).createdAt || (doc as any).timestamp)
          .filter(timestamp => timestamp)
          .map(timestamp => timestamp.toDate ? timestamp.toDate() : new Date(timestamp));

        stats[collectionName] = {
          totalDocuments: documents.length,
          dateRange: timestamps.length > 0 ? {
            earliest: new Date(Math.min(...timestamps.map(t => t.getTime()))),
            latest: new Date(Math.max(...timestamps.map(t => t.getTime())))
          } : null,
          averageDocumentsPerDay: timestamps.length > 0 ? 
            documents.length / Math.ceil((Date.now() - Math.min(...timestamps.map(t => t.getTime()))) / (1000 * 60 * 60 * 24)) : 0
        };
      }

      return stats;
    } catch (error) {
      console.error('Error getting data statistics:', error);
      return {};
    }
  }

  // Check for data anomalies
  async checkDataAnomalies(): Promise<any[]> {
    try {
      const anomalies: any[] = [];
      
      // Check for documents without audit trails
      const collections = ['events', 'announcements', 'locations'];
      
      for (const collectionName of collections) {
        const collectionQuery = query(
          collection(this.db, collectionName),
          firestoreLimit(50)
        );
        
        const snapshot = await getDocs(collectionQuery);
        
        for (const doc of snapshot.docs) {
          const auditTrail = await this.getDocumentAuditTrail(collectionName, doc.id);
          if (!auditTrail || auditTrail.history.length === 0) {
            anomalies.push({
              type: 'missing_audit_trail',
              collection: collectionName,
              documentId: doc.id,
              severity: 'medium'
            });
          }
        }
      }

      // Check for suspicious activity patterns
      const recentAuditQuery = query(
        collection(this.db, 'audit-logs'),
        orderBy('timestamp', 'desc'),
        firestoreLimit(100)
      );
      
      const auditSnapshot = await getDocs(recentAuditQuery);
      const recentEntries = auditSnapshot.docs.map(doc => doc.data());

             // Check for rapid successive changes
       const rapidChanges = recentEntries.filter((entry, index) => {
         if (index === 0) return false;
         const timestamp1 = entry.timestamp && typeof entry.timestamp.toDate === 'function' ? 
           entry.timestamp.toDate() : new Date(entry.timestamp);
         const timestamp2 = recentEntries[index - 1].timestamp && typeof recentEntries[index - 1].timestamp.toDate === 'function' ? 
           recentEntries[index - 1].timestamp.toDate() : new Date(recentEntries[index - 1].timestamp);
         const timeDiff = timestamp1.getTime() - timestamp2.getTime();
         return timeDiff < 1000; // Less than 1 second between changes
       });

      if (rapidChanges.length > 0) {
        anomalies.push({
          type: 'rapid_changes',
          count: rapidChanges.length,
          severity: 'high'
        });
      }

      return anomalies;
    } catch (error) {
      console.error('Error checking data anomalies:', error);
      return [];
    }
  }
}

const dataAuditService = new DataAuditService();
export default dataAuditService;
