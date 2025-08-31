#!/bin/bash

# Configuration System Deployment Script
# This script deploys the configuration management system to production

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID="pack-1703-portal"
REGION="us-central1"
FIREBASE_PROJECT="pack-1703-portal"

echo -e "${BLUE}🚀 Configuration System Deployment Script${NC}"
echo -e "${BLUE}=====================================${NC}"
echo ""

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    print_error "Firebase CLI is not installed. Please install it first:"
    echo "npm install -g firebase-tools"
    exit 1
fi

# Check if user is logged into Firebase
if ! firebase projects:list &> /dev/null; then
    print_error "Not logged into Firebase. Please run:"
    echo "firebase login"
    exit 1
fi

print_info "Starting deployment process..."

# Step 1: Build the application
print_info "Step 1: Building the application..."
if npm run build; then
    print_status "Application built successfully"
else
    print_error "Build failed"
    exit 1
fi

# Step 2: Deploy to Firebase Hosting
print_info "Step 2: Deploying to Firebase Hosting..."
if firebase deploy --only hosting; then
    print_status "Firebase Hosting deployment successful"
else
    print_error "Firebase Hosting deployment failed"
    exit 1
fi

# Step 3: Deploy Cloud Functions (if any)
print_info "Step 3: Deploying Cloud Functions..."
if firebase deploy --only functions; then
    print_status "Cloud Functions deployment successful"
else
    print_warning "Cloud Functions deployment failed or no functions to deploy"
fi

# Step 4: Deploy Firestore Rules
print_info "Step 4: Deploying Firestore Rules..."
if firebase deploy --only firestore:rules; then
    print_status "Firestore rules deployed successfully"
else
    print_error "Firestore rules deployment failed"
    exit 1
fi

# Step 5: Deploy Firestore Indexes
print_info "Step 5: Deploying Firestore Indexes..."
if firebase deploy --only firestore:indexes; then
    print_status "Firestore indexes deployed successfully"
else
    print_warning "Firestore indexes deployment failed or no indexes to deploy"
fi

print_status "Deployment completed successfully!"
echo ""

# Step 6: Initialize Configuration System
print_info "Step 6: Initializing Configuration System..."
echo ""

# Create a temporary script to initialize configurations
cat > temp-init-config.js << 'EOF'
// Temporary script to initialize configurations
const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc, getDoc, Timestamp } = require('firebase/firestore');

const firebaseConfig = {
  // Your Firebase config will be inserted here
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

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
  console.log('Initializing default configurations...');
  
  for (const config of defaultConfigs) {
    const configRef = doc(db, 'configurations', config.key);
    const existingDoc = await getDoc(configRef);
    
    if (!existingDoc.exists()) {
      const now = Timestamp.now();
      await setDoc(configRef, {
        ...config,
        id: config.key,
        isEditable: true,
        createdAt: now,
        createdBy: 'deployment-script',
        updatedAt: now,
        updatedBy: 'deployment-script'
      });
      console.log(`✅ Created configuration: ${config.key}`);
    } else {
      console.log(`⏭️  Configuration already exists: ${config.key}`);
    }
  }
  
  console.log('Configuration initialization completed!');
}

initializeConfigurations().catch(console.error);
EOF

print_info "Configuration initialization script created."
print_info "You can run this manually or visit the admin portal to initialize configurations."
echo ""

# Step 7: Verification
print_info "Step 7: Verification Steps..."
echo ""
echo "To verify the deployment:"
echo "1. Visit your production site: https://${FIREBASE_PROJECT}.web.app"
echo "2. Log into the admin portal: https://${FIREBASE_PROJECT}.web.app/admin"
echo "3. Click on the 'Configuration' tab"
echo "4. Click 'Initialize Defaults' to set up default configurations"
echo "5. Test editing a configuration value"
echo ""

print_status "Deployment script completed!"
print_info "Next steps:"
echo "  - Test the admin portal configuration interface"
echo "  - Initialize default configurations"
echo "  - Update any hardcoded values to use the configuration system"
echo "  - Monitor the system for any issues"

# Clean up temporary file
rm -f temp-init-config.js

echo ""
print_status "🎉 Configuration system is now deployed and ready to use!"
