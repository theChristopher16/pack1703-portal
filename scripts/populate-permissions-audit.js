const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: 'pack-1703-portal'
  });
}

const db = admin.firestore();

const permissionsAuditData = [
  {
    service: 'System Monitor',
    accessLevel: 'read',
    description: 'Real-time system metrics and performance data',
    securityLevel: 'high',
    lastAudit: new Date().toISOString(),
    status: 'active',
    dataTypes: ['metrics', 'performance', 'costs', 'usage'],
    restrictions: ['No user data access', 'Read-only operations'],
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    service: 'Chat System',
    accessLevel: 'read',
    description: 'Chat messages and channel management',
    securityLevel: 'medium',
    lastAudit: new Date().toISOString(),
    status: 'active',
    dataTypes: ['messages', 'channels', 'reactions'],
    restrictions: ['No user personal data', 'No message deletion'],
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    service: 'Events Management',
    accessLevel: 'write',
    description: 'Create and manage events with validation',
    securityLevel: 'high',
    lastAudit: new Date().toISOString(),
    status: 'active',
    dataTypes: ['events', 'locations', 'schedules'],
    restrictions: ['Requires confirmation', 'Location validation required', 'Duplicate checking'],
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    service: 'User Management',
    accessLevel: 'read',
    description: 'User activity and engagement data',
    securityLevel: 'high',
    lastAudit: new Date().toISOString(),
    status: 'restricted',
    dataTypes: ['activity', 'engagement', 'analytics'],
    restrictions: ['No personal information', 'Aggregated data only', 'No individual user access'],
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    service: 'Configuration',
    accessLevel: 'read',
    description: 'System configuration and settings',
    securityLevel: 'medium',
    lastAudit: new Date().toISOString(),
    status: 'active',
    dataTypes: ['settings', 'configurations', 'preferences'],
    restrictions: ['Read-only access', 'No sensitive settings'],
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    service: 'Analytics',
    accessLevel: 'read',
    description: 'Analytics and insights data',
    securityLevel: 'medium',
    lastAudit: new Date().toISOString(),
    status: 'active',
    dataTypes: ['analytics', 'insights', 'trends'],
    restrictions: ['Aggregated data only', 'No individual tracking'],
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    service: 'Security Audit',
    accessLevel: 'read',
    description: 'Security status and audit reports',
    securityLevel: 'high',
    lastAudit: new Date().toISOString(),
    status: 'active',
    dataTypes: ['security', 'audits', 'permissions'],
    restrictions: ['Read-only access', 'No security bypass'],
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

async function populatePermissionsAudit() {
  try {
    console.log('Starting to populate permissions audit data...');
    
    const batch = db.batch();
    
    for (const auditItem of permissionsAuditData) {
      const docRef = db.collection('permissionsAudit').doc();
      batch.set(docRef, auditItem);
    }
    
    await batch.commit();
    console.log('Successfully populated permissions audit data!');
  } catch (error) {
    console.error('Error populating permissions audit data:', error);
  }
}

populatePermissionsAudit();
