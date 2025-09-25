// Script to force clear browser cache and reload with fresh data
// Run this in your browser console

async function forceClearCacheAndReload() {
  try {
    console.log('🧹 Force clearing browser cache and reloading...');
    
    // Clear all caches
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      console.log('🗑️ Found caches:', cacheNames);
      
      for (const cacheName of cacheNames) {
        await caches.delete(cacheName);
        console.log('✅ Deleted cache:', cacheName);
      }
    }
    
    // Clear localStorage
    if (window.localStorage) {
      const keys = Object.keys(window.localStorage);
      console.log('🗑️ Clearing localStorage keys:', keys.length);
      
      // Keep only essential auth data
      const authKeys = keys.filter(key => 
        key.includes('firebase') || 
        key.includes('auth') || 
        key.includes('token') ||
        key.includes('user')
      );
      
      // Clear non-auth data
      keys.forEach(key => {
        if (!authKeys.includes(key)) {
          window.localStorage.removeItem(key);
        }
      });
      
      console.log('✅ Cleared non-auth localStorage data');
      console.log('🔐 Preserved auth keys:', authKeys);
    }
    
    // Clear sessionStorage
    if (window.sessionStorage) {
      window.sessionStorage.clear();
      console.log('✅ Cleared sessionStorage');
    }
    
    // Force reload with cache bypass
    console.log('🔄 Reloading page with cache bypass...');
    
    // Add timestamp to force fresh load
    const timestamp = Date.now();
    const currentUrl = window.location.href;
    const separator = currentUrl.includes('?') ? '&' : '?';
    const newUrl = `${currentUrl}${separator}_t=${timestamp}`;
    
    console.log('📍 New URL:', newUrl);
    
    // Reload with cache bypass
    window.location.href = newUrl;
    
  } catch (error) {
    console.error('❌ Error clearing cache:', error);
    console.log('🔄 Falling back to simple reload...');
    window.location.reload(true);
  }
}

// Also provide a simple reload function
function simpleReload() {
  console.log('🔄 Simple reload with cache bypass...');
  window.location.reload(true);
}

// Export functions to window for easy access
window.forceClearCacheAndReload = forceClearCacheAndReload;
window.simpleReload = simpleReload;

console.log('🚀 Cache clearing functions loaded!');
console.log('📝 Run: forceClearCacheAndReload() or simpleReload()');
console.log('💡 Or just run: window.location.reload(true)');
