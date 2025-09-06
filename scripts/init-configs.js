// Configuration Initialization Script
// Run this script to set up default configurations in Firestore

const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc, getDoc, Timestamp } = require('firebase/firestore');

// Firebase configuration - update with your actual config
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "YOUR_FIREBASE_API_KEY_HERE",
  authDomain: "pack-1703-portal.firebaseapp.com",
  projectId: "pack-1703-portal",
  storageBucket: "pack-1703-portal.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdefghijklmnop"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Default configurations
const defaultConfigs = [
  {
    key: 'contact.email.primary',
    value: 'pack1703@gmail.com',
    category: 'email',
    description: 'Primary contact email address for the pack',
    validationRules: { type: 'email', required: true }
  },
  {
    key: 'contact.email.support',
    value: 'pack1703@gmail.com',
    category: 'email',
    description: 'Support email address for technical issues',
    validationRules: { type: 'email', required: true }
  },
  {
    key: 'contact.email.emergency',
    value: 'pack1703@gmail.com',
    category: 'email',
    description: 'Emergency contact email address',
    validationRules: { type: 'email', required: true }
  },
  {
    key: 'contact.phone.primary',
    value: '(555) 123-4567',
    category: 'contact',
    description: 'Primary contact phone number',
    validationRules: { type: 'phone', required: true }
  },
  {
    key: 'system.pack.name',
    value: 'Pack 1703',
    category: 'system',
    description: 'Official pack name',
    validationRules: { type: 'string', required: true, minLength: 1, maxLength: 100 }
  },
  {
    key: 'system.pack.location',
    value: 'Peoria, IL',
    category: 'system',
    description: 'Pack location/city',
    validationRules: { type: 'string', required: true, minLength: 1, maxLength: 100 }
  },
  {
    key: 'display.site.title',
    value: 'Pack 1703 Families Portal',
    category: 'display',
    description: 'Website title',
    validationRules: { type: 'string', required: true, minLength: 1, maxLength: 100 }
  },
  {
    key: 'notifications.enabled',
    value: true,
    category: 'notifications',
    description: 'Enable email notifications',
    validationRules: { type: 'boolean' }
  },
  {
    key: 'security.require.approval',
    value: false,
    category: 'security',
    description: 'Require admin approval for new registrations',
    validationRules: { type: 'boolean' }
  }
];

async function initializeConfigurations() {
  console.log('🚀 Initializing default configurations...');
  console.log('=====================================');
  
  let created = 0;
  let skipped = 0;
  
  for (const config of defaultConfigs) {
    try {
      const configRef = doc(db, 'configurations', config.key);
      const existingDoc = await getDoc(configRef);
      
      if (!existingDoc.exists()) {
        const now = Timestamp.now();
        await setDoc(configRef, {
          ...config,
          id: config.key,
          isEditable: true,
          createdAt: now,
          createdBy: 'init-script',
          updatedAt: now,
          updatedBy: 'init-script'
        });
        console.log(`✅ Created: ${config.key}`);
        created++;
      } else {
        console.log(`⏭️  Skipped (exists): ${config.key}`);
        skipped++;
      }
    } catch (error) {
      console.error(`❌ Error creating ${config.key}:`, error.message);
    }
  }
  
  console.log('');
  console.log('📊 Summary:');
  console.log(`   Created: ${created} configurations`);
  console.log(`   Skipped: ${skipped} configurations (already exist)`);
  console.log(`   Total: ${created + skipped} configurations processed`);
  console.log('');
  console.log('🎉 Configuration initialization completed!');
  console.log('');
  console.log('Next steps:');
  console.log('1. Visit your admin portal: /admin');
  console.log('2. Click on the "Configuration" tab');
  console.log('3. Verify all configurations are present');
  console.log('4. Test editing a configuration value');
}

// Run the initialization
initializeConfigurations()
  .then(() => {
    console.log('Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
