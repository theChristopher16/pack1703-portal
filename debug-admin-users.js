// Comprehensive debug script for AdminUsers component
// Run this in your browser console

async function debugAdminUsersComponent() {
  try {
    console.log('🔍 Comprehensive AdminUsers component debug...');
    
    // Check current URL
    console.log('📍 Current URL:', window.location.href);
    console.log('📍 Current pathname:', window.location.pathname);
    
    // Check if we're on the right page
    if (!window.location.pathname.includes('/admin/users')) {
      console.log('❌ Not on admin/users page. Current path:', window.location.pathname);
      console.log('💡 Navigate to: https://sfpack1703.com/admin/users');
      return;
    }
    
    console.log('✅ On admin/users page');
    
    // Check React component tree
    console.log('🔍 Checking React component tree...');
    
    const reactRoot = document.querySelector('#root');
    if (reactRoot) {
      console.log('✅ React root found');
      
      // Walk the React tree to find AdminUsers component
      function findAdminUsersComponent(fiber) {
        if (!fiber) return null;
        
        if (fiber.type && fiber.type.name === 'AdminUsers') {
          return fiber;
        }
        
        if (fiber.child) {
          const result = findAdminUsersComponent(fiber.child);
          if (result) return result;
        }
        
        if (fiber.sibling) {
          const result = findAdminUsersComponent(fiber.sibling);
          if (result) return result;
        }
        
        return null;
      }
      
      const adminUsersComponent = findAdminUsersComponent(reactRoot._reactInternalFiber);
      if (adminUsersComponent) {
        console.log('✅ AdminUsers component found');
        console.log('📊 Component state:', adminUsersComponent.memoizedState);
        
        // Check if component is in loading state
        const state = adminUsersComponent.memoizedState;
        if (state && state.memoizedState) {
          const componentState = state.memoizedState;
          console.log('📊 Component state details:', componentState);
          
          // Check for loading state
          if (componentState.isLoading) {
            console.log('⏳ Component is in loading state');
          } else {
            console.log('✅ Component is not loading');
          }
          
          // Check for error state
          if (componentState.error) {
            console.log('❌ Component has error:', componentState.error);
          } else {
            console.log('✅ Component has no errors');
          }
          
          // Check users data
          if (componentState.users && componentState.users.length > 0) {
            console.log('✅ Users data loaded:', componentState.users.length, 'users');
            console.log('👥 Users:', componentState.users);
            
            // Check if Gina is in the list
            const gina = componentState.users.find(user => 
              user.email === 'gina_daigle@yahoo.com' || 
              user.displayName === 'Gina Messa'
            );
            if (gina) {
              console.log('✅ Gina found in component state:', gina);
            } else {
              console.log('❌ Gina NOT found in component state');
            }
          } else {
            console.log('❌ No users data in component state');
          }
        }
      } else {
        console.log('❌ AdminUsers component not found in React tree');
        
        // Check what components are actually mounted
        function listAllComponents(fiber, depth = 0) {
          if (!fiber) return;
          
          const indent = '  '.repeat(depth);
          if (fiber.type && fiber.type.name) {
            console.log(`${indent}${fiber.type.name}`);
          }
          
          if (fiber.child) {
            listAllComponents(fiber.child, depth + 1);
          }
          if (fiber.sibling) {
            listAllComponents(fiber.sibling, depth);
          }
        }
        
        console.log('📊 All mounted components:');
        listAllComponents(reactRoot._reactInternalFiber);
      }
    } else {
      console.log('❌ React root not found');
    }
    
    // Check for JavaScript errors
    console.log('🔍 Checking for JavaScript errors...');
    
    // Check console for errors
    const originalError = console.error;
    const errors = [];
    console.error = function(...args) {
      errors.push(args);
      originalError.apply(console, args);
    };
    
    // Check if there are any network errors
    console.log('🔍 Checking for network errors...');
    
    // Check if the page is stuck in a loading state
    const loadingElements = document.querySelectorAll('[data-testid="loading"], .loading, .spinner, [class*="loading"]');
    if (loadingElements.length > 0) {
      console.log('⏳ Loading elements found:', loadingElements.length);
      loadingElements.forEach((el, index) => {
        console.log(`  Loading element ${index + 1}:`, el);
      });
    } else {
      console.log('✅ No loading elements found');
    }
    
    // Check for error elements
    const errorElements = document.querySelectorAll('[data-testid="error"], .error, .error-message, [class*="error"]');
    if (errorElements.length > 0) {
      console.log('❌ Error elements found:', errorElements.length);
      errorElements.forEach((el, index) => {
        console.log(`  Error element ${index + 1}:`, el);
      });
    } else {
      console.log('✅ No error elements found');
    }
    
    // Check if the page content is actually the home page
    const homePageElements = document.querySelectorAll('[class*="home"], [class*="welcome"], [class*="portal"]');
    if (homePageElements.length > 0) {
      console.log('🏠 Home page elements found:', homePageElements.length);
      console.log('⚠️  This suggests the page is showing home content instead of admin users');
    }
    
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
    
    console.log('💡 Next steps:');
    console.log('1. If AdminUsers component is not found, there might be a routing issue');
    console.log('2. If component is found but no users data, check the loadUsers function');
    console.log('3. If component is loading indefinitely, check for infinite loops');
    console.log('4. Try clearing browser cache and reloading');
    
  } catch (error) {
    console.error('❌ Error debugging AdminUsers component:', error);
  }
}

// Run the debug function
debugAdminUsersComponent();
