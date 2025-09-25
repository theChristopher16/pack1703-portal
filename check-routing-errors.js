// Script to check for JavaScript errors and routing issues
// Run this in your browser console

async function checkRoutingAndErrors() {
  try {
    console.log('🔍 Checking for routing and JavaScript errors...');
    
    // Check current URL
    console.log('📍 Current URL:', window.location.href);
    console.log('📍 Current pathname:', window.location.pathname);
    
    // Check if React Router is working
    if (window.ReactRouterDOM) {
      console.log('✅ React Router DOM found');
    } else {
      console.log('❌ React Router DOM not found');
    }
    
    // Check for JavaScript errors
    console.log('🔍 Checking for JavaScript errors...');
    
    // Look for error messages in the console
    const originalError = console.error;
    const errors = [];
    console.error = function(...args) {
      errors.push(args);
      originalError.apply(console, args);
    };
    
    // Check React component tree
    console.log('🔍 Checking React component tree...');
    
    const reactRoot = document.querySelector('#root');
    if (reactRoot) {
      console.log('✅ React root found');
      
      // Check if there are any React components mounted
      if (reactRoot._reactInternalFiber) {
        console.log('✅ React fiber found');
        
        // Walk the React tree to see what's mounted
        function walkReactTree(fiber, depth = 0) {
          if (!fiber) return;
          
          const indent = '  '.repeat(depth);
          console.log(`${indent}${fiber.type?.name || fiber.type || 'Unknown'}`);
          
          if (fiber.child) {
            walkReactTree(fiber.child, depth + 1);
          }
          if (fiber.sibling) {
            walkReactTree(fiber.sibling, depth);
          }
        }
        
        console.log('📊 React component tree:');
        walkReactTree(reactRoot._reactInternalFiber);
      } else {
        console.log('❌ React fiber not found');
      }
    } else {
      console.log('❌ React root not found');
    }
    
    // Check if there are any network errors
    console.log('🔍 Checking for network errors...');
    
    // Check if the AdminUsers component is being loaded
    console.log('🔍 Checking if AdminUsers component exists...');
    
    // Look for the component in the DOM
    const adminUsersElements = document.querySelectorAll('[data-testid="admin-users"], .admin-users, #admin-users');
    if (adminUsersElements.length > 0) {
      console.log('✅ AdminUsers elements found in DOM:', adminUsersElements.length);
    } else {
      console.log('❌ No AdminUsers elements found in DOM');
    }
    
    // Check if there are any loading states
    const loadingElements = document.querySelectorAll('[data-testid="loading"], .loading, .spinner');
    if (loadingElements.length > 0) {
      console.log('⏳ Loading elements found:', loadingElements.length);
    }
    
    // Check if there are any error states
    const errorElements = document.querySelectorAll('[data-testid="error"], .error, .error-message');
    if (errorElements.length > 0) {
      console.log('❌ Error elements found:', errorElements.length);
    }
    
    // Check localStorage for any error states
    console.log('🔍 Checking localStorage for error states...');
    const localStorageKeys = Object.keys(window.localStorage);
    const errorKeys = localStorageKeys.filter(key => 
      key.includes('error') || key.includes('Error') || key.includes('ERROR')
    );
    if (errorKeys.length > 0) {
      console.log('❌ Error-related localStorage keys found:', errorKeys);
      errorKeys.forEach(key => {
        console.log(`  ${key}:`, window.localStorage.getItem(key));
      });
    }
    
    // Check if the page is stuck in a loading state
    console.log('🔍 Checking if page is stuck in loading...');
    
    // Look for any elements that might indicate loading
    const body = document.body;
    if (body.classList.contains('loading') || body.classList.contains('spinner')) {
      console.log('⏳ Body has loading class');
    }
    
    // Check if there are any React Suspense boundaries
    const suspenseElements = document.querySelectorAll('[data-testid="suspense"], .suspense');
    if (suspenseElements.length > 0) {
      console.log('⏳ Suspense elements found:', suspenseElements.length);
    }
    
    console.log('💡 Possible issues:');
    console.log('1. JavaScript error preventing component render');
    console.log('2. React Router not navigating properly');
    console.log('3. Component stuck in loading state');
    console.log('4. Authentication/authorization issue');
    console.log('5. Component crashed during render');
    
    // Restore original console.error
    console.error = originalError;
    
    if (errors.length > 0) {
      console.log('❌ JavaScript errors found:', errors.length);
      errors.forEach((error, index) => {
        console.log(`Error ${index + 1}:`, error);
      });
    } else {
      console.log('✅ No JavaScript errors found');
    }
    
  } catch (error) {
    console.error('❌ Error checking routing:', error);
  }
}

// Run the check
checkRoutingAndErrors();
