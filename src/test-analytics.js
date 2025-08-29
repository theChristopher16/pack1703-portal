// Simple test script to verify analytics functionality
// This would be run in the browser console to test analytics

console.log('🧪 Testing Analytics Functionality...');

// Test 1: Check if Firebase Analytics is available
console.log('1. Firebase Analytics Check:');
try {
  // Check if Firebase is loaded
  if (typeof firebase !== 'undefined') {
    console.log('✅ Firebase is loaded');
  } else {
    console.log('❌ Firebase is not loaded');
  }
} catch (error) {
  console.log('❌ Error checking Firebase:', error);
}

// Test 2: Check if Performance API is available
console.log('2. Performance API Check:');
try {
  if ('PerformanceObserver' in window) {
    console.log('✅ PerformanceObserver is available');
  } else {
    console.log('❌ PerformanceObserver is not available');
  }
  
  if ('performance' in window) {
    console.log('✅ Performance API is available');
  } else {
    console.log('❌ Performance API is not available');
  }
} catch (error) {
  console.log('❌ Error checking Performance API:', error);
}

// Test 3: Check if analytics service functions exist
console.log('3. Analytics Service Check:');
try {
  // These would be available if the analytics service is properly imported
  console.log('Note: Analytics functions would be available in the React app context');
} catch (error) {
  console.log('❌ Error checking analytics service:', error);
}

// Test 4: Check device detection
console.log('4. Device Detection Check:');
try {
  const deviceType = window.innerWidth < 768 ? 'mobile' : 
                     window.innerWidth < 1024 ? 'tablet' : 'desktop';
  console.log(`✅ Device type detected: ${deviceType}`);
  console.log(`✅ Screen dimensions: ${window.innerWidth}x${window.innerHeight}`);
} catch (error) {
  console.log('❌ Error detecting device:', error);
}

// Test 5: Check accessibility features
console.log('5. Accessibility Features Check:');
try {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const highContrast = window.matchMedia('(prefers-contrast: high)').matches;
  const darkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  console.log(`✅ Reduced motion preference: ${reducedMotion}`);
  console.log(`✅ High contrast preference: ${highContrast}`);
  console.log(`✅ Dark mode preference: ${darkMode}`);
} catch (error) {
  console.log('❌ Error checking accessibility features:', error);
}

console.log('🧪 Analytics Test Complete!');
console.log('To test full functionality, navigate to /analytics in the app');
