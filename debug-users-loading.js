// Script to debug the users loading issue
// Run this in your browser console

async function debugUsersLoading() {
  try {
    console.log('🔍 Debugging users loading issue...');
    
    // Get auth token
    let authToken = null;
    if (window.localStorage) {
      const keys = Object.keys(window.localStorage);
      for (const key of keys) {
        if (key.includes('firebase') || key.includes('auth') || key.includes('token')) {
          try {
            const value = JSON.parse(window.localStorage.getItem(key));
            if (value && value.stsTokenManager && value.stsTokenManager.accessToken) {
              authToken = value.stsTokenManager.accessToken;
              console.log('✅ Found auth token');
              break;
            }
          } catch (e) {
            // Ignore parsing errors
          }
        }
      }
    }
    
    if (!authToken) {
      console.log('❌ Could not find auth token');
      return;
    }
    
    console.log('🔍 Let\'s check what users are actually being returned...');
    
    // Try to call the getUsers method directly
    console.log('📝 Checking if we can access the authService...');
    
    // Look for authService in the global scope
    if (window.authService) {
      console.log('✅ Found authService in global scope');
      try {
        const users = await window.authService.getUsers();
        console.log('📊 Users returned by getUsers():', users.length);
        console.log('👥 Users:', users);
        
        // Check if Gina is in the list
        const gina = users.find(user => user.email === 'gina_daigle@yahoo.com');
        if (gina) {
          console.log('✅ Gina found in getUsers() result:', gina);
        } else {
          console.log('❌ Gina NOT found in getUsers() result');
        }
      } catch (error) {
        console.error('❌ Error calling getUsers():', error);
      }
    } else {
      console.log('❌ authService not found in global scope');
    }
    
    // Also try to check the React component state
    console.log('🔍 Checking React component state...');
    
    // Look for the AdminUsers component
    const reactRoot = document.querySelector('#root');
    if (reactRoot && reactRoot._reactInternalFiber) {
      console.log('✅ Found React root');
      
      // Walk the React tree to find the AdminUsers component
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
        console.log('✅ Found AdminUsers component');
        console.log('📊 Component state:', adminUsersComponent.memoizedState);
        console.log('📊 Component props:', adminUsersComponent.memoizedProps);
      } else {
        console.log('❌ AdminUsers component not found');
      }
    }
    
    console.log('💡 Next steps:');
    console.log('1. Check if Gina exists in Firestore directly');
    console.log('2. Check if there are any JavaScript errors');
    console.log('3. Check if the getUsers() method is being called');
    console.log('4. Check if there are any network errors');
    
  } catch (error) {
    console.error('❌ Error debugging:', error);
  }
}

// Run the debug function
debugUsersLoading();
