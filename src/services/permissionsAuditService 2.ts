import { collection, query, getDocs, orderBy, where } from 'firebase/firestore';
import { db } from '../firebase/config';

export interface PermissionAudit {
  id: string;
  service: string;
  accessLevel: 'read' | 'write' | 'admin';
  description: string;
  securityLevel: 'high' | 'medium' | 'low';
  lastAudit: string;
  status: 'active' | 'review' | 'restricted';
  dataTypes: string[];
  restrictions: string[];
  createdAt: string;
  updatedAt: string;
}

class PermissionsAuditService {
  private readonly COLLECTION_NAME = 'permissionsAudit';

  async getPermissionsAudit(): Promise<PermissionAudit[]> {
    try {
      const auditQuery = query(
        collection(db, this.COLLECTION_NAME),
        where('isActive', '==', true),
        orderBy('updatedAt', 'desc')
      );

      const snapshot = await getDocs(auditQuery);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as PermissionAudit[];
    } catch (error) {
      console.error('Error getting permissions audit:', error);
      return [];
    }
  }

  async getAuditSummary(): Promise<{
    totalServices: number;
    activePermissions: number;
    highSecurity: number;
    lastUpdated: string;
  }> {
    try {
      const auditData = await this.getPermissionsAudit();
      
      return {
        totalServices: auditData.length,
        activePermissions: auditData.filter(item => item.status === 'active').length,
        highSecurity: auditData.filter(item => item.securityLevel === 'high').length,
        lastUpdated: new Date().toLocaleDateString()
      };
    } catch (error) {
      console.error('Error getting audit summary:', error);
      return {
        totalServices: 0,
        activePermissions: 0,
        highSecurity: 0,
        lastUpdated: new Date().toLocaleDateString()
      };
    }
  }
}

export const permissionsAuditService = new PermissionsAuditService();
