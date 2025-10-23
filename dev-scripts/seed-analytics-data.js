/**
 * ⚠️ DEVELOPMENT ONLY - DO NOT USE IN PRODUCTION ⚠️
 * 
 * Seed Analytics Data Script for Pack 1703 Portal
 * 
 * This script generates FAKE analytics data for development and testing ONLY.
 * 
 * ⚠️ WARNING: Running this script will populate your analytics collection with fake data!
 * - Page views, feature usage, and session data will be FABRICATED
 * - Use only in development/testing environments
 * - Production portal should NEVER run this script
 * - Real analytics should be collected from actual user interactions
 * 
 * Usage:
 * node dev-scripts/seed-analytics-data.js
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, serverTimestamp } = require('firebase/firestore');

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBvOkBwv6wJ6n6J6n6J6n6J6n6J6n6J6n6",
  authDomain: "sfpack1703app.firebaseapp.com",
  projectId: "sfpack1703app",
  storageBucket: "sfpack1703app.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456789"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function seedAnalyticsData() {
  console.log('🌱 Seeding analytics data...');
  
  const analyticsData = [];
  const now = new Date();
  
  // Generate sample analytics data for the last 30 days
  for (let i = 0; i < 30; i++) {
    const date = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000));
    
    // Generate page views
    for (let j = 0; j < Math.floor(Math.random() * 20) + 5; j++) {
      const pages = ['/', '/events', '/announcements', '/locations', '/volunteer', '/ecology', '/chat', '/profile'];
      const page = pages[Math.floor(Math.random() * pages.length)];
      
      analyticsData.push({
        type: 'page_view',
        page: page,
        userId: `user_${Math.floor(Math.random() * 10) + 1}`,
        userEmail: `user${Math.floor(Math.random() * 10) + 1}@example.com`,
        timestamp: new Date(date.getTime() + Math.random() * 24 * 60 * 60 * 1000),
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        screenResolution: '1920x1080',
        language: 'en-US',
        timezone: 'America/Los_Angeles'
      });
    }
    
    // Generate feature usage
    for (let j = 0; j < Math.floor(Math.random() * 15) + 3; j++) {
      const features = ['chat', 'events', 'rsvp', 'volunteer', 'feedback', 'profile'];
      const feature = features[Math.floor(Math.random() * features.length)];
      
      analyticsData.push({
        type: 'feature_usage',
        feature: feature,
        userId: `user_${Math.floor(Math.random() * 10) + 1}`,
        userEmail: `user${Math.floor(Math.random() * 10) + 1}@example.com`,
        timestamp: new Date(date.getTime() + Math.random() * 24 * 60 * 60 * 1000),
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        screenResolution: '1920x1080',
        language: 'en-US',
        timezone: 'America/Los_Angeles',
        metadata: {
          action: 'click',
          page: '/events'
        }
      });
    }
    
    // Generate sessions
    for (let j = 0; j < Math.floor(Math.random() * 8) + 2; j++) {
      const sessionDuration = Math.floor(Math.random() * 30 * 60 * 1000) + 5 * 60 * 1000; // 5-35 minutes
      
      analyticsData.push({
        type: 'session_start',
        userId: `user_${Math.floor(Math.random() * 10) + 1}`,
        userEmail: `user${Math.floor(Math.random() * 10) + 1}@example.com`,
        timestamp: new Date(date.getTime() + Math.random() * 24 * 60 * 60 * 1000),
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        screenResolution: '1920x1080',
        language: 'en-US',
        timezone: 'America/Los_Angeles'
      });
      
      analyticsData.push({
        type: 'session_end',
        duration: sessionDuration,
        userId: `user_${Math.floor(Math.random() * 10) + 1}`,
        userEmail: `user${Math.floor(Math.random() * 10) + 1}@example.com`,
        timestamp: new Date(date.getTime() + Math.random() * 24 * 60 * 60 * 1000 + sessionDuration),
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        screenResolution: '1920x1080',
        language: 'en-US',
        timezone: 'America/Los_Angeles'
      });
    }
  }
  
  console.log(`📊 Generated ${analyticsData.length} analytics records`);
  
  // Add data to Firestore in batches
  const batchSize = 100;
  for (let i = 0; i < analyticsData.length; i += batchSize) {
    const batch = analyticsData.slice(i, i + batchSize);
    console.log(`📤 Adding batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(analyticsData.length / batchSize)}...`);
    
    for (const data of batch) {
      try {
        await addDoc(collection(db, 'analytics'), {
          ...data,
          timestamp: serverTimestamp()
        });
      } catch (error) {
        console.error('Error adding document:', error);
      }
    }
  }
  
  console.log('✅ Analytics data seeded successfully!');
  process.exit(0);
}

seedAnalyticsData().catch(console.error);

