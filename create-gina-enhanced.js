// Enhanced script to create Gina Messa's account
// This version tries multiple methods to find Firebase

async function createGinaAccountEnhanced() {
  try {
    console.log('🚀 Starting Gina Messa account creation...');
    
    // Method 1: Try to find Firebase app in React context
    console.log('🔍 Method 1: Looking for Firebase in React context...');
    
    // Get all React fiber nodes
    const reactRoot = document.querySelector('#root') || document.querySelector('[data-reactroot]') || document.body;
    const reactFiber = reactRoot._reactInternalFiber || reactRoot._reactInternalInstance;
    
    if (reactFiber) {
      console.log('✅ Found React fiber, searching for Firebase...');
      
      // Walk the React tree to find Firebase
      function findFirebaseInFiber(fiber) {
        if (!fiber) return null;
        
        // Check if this fiber has Firebase
        if (fiber.memoizedProps && fiber.memoizedProps.firebase) {
          return fiber.memoizedProps.firebase;
        }
        if (fiber.stateNode && fiber.stateNode.firebase) {
          return fiber.stateNode.firebase;
        }
        if (fiber.props && fiber.props.firebase) {
          return fiber.props.firebase;
        }
        
        // Check children
        if (fiber.child) {
          const result = findFirebaseInFiber(fiber.child);
          if (result) return result;
        }
        
        // Check sibling
        if (fiber.sibling) {
          const result = findFirebaseInFiber(fiber.sibling);
          if (result) return result;
        }
        
        return null;
      }
      
      const firebaseFromFiber = findFirebaseInFiber(reactFiber);
      if (firebaseFromFiber) {
        console.log('✅ Found Firebase in React fiber!');
        return await createUserWithFirebase(firebaseFromFiber);
      }
    }
    
    // Method 2: Try to find Firebase in window objects
    console.log('🔍 Method 2: Looking for Firebase in window objects...');
    
    const possibleFirebaseObjects = [
      window.firebase,
      window.__firebase,
      window.firebaseApp,
      window.__firebaseApp,
      window.app,
      window.firebaseInstance,
      window.__firebaseInstance
    ].filter(Boolean);
    
    for (const firebaseObj of possibleFirebaseObjects) {
      if (firebaseObj && firebaseObj.functions) {
        console.log('✅ Found Firebase with functions!');
        return await createUserWithFirebase(firebaseObj);
      }
    }
    
    // Method 3: Try to find Firebase in global scope
    console.log('🔍 Method 3: Looking for Firebase in global scope...');
    
    // Check if Firebase is available globally
    if (typeof firebase !== 'undefined' && firebase.functions) {
      console.log('✅ Found global Firebase!');
      return await createUserWithFirebase(firebase);
    }
    
    // Method 4: Try to import Firebase dynamically
    console.log('🔍 Method 4: Trying to import Firebase dynamically...');
    
    try {
      const { getApp, getFunctions, httpsCallable } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js');
      const { getFunctions: getFunctionsModule } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-functions.js');
      
      // Try to get the default app
      const app = getApp();
      const functions = getFunctionsModule(app);
      const httpsCallableFn = httpsCallable;
      
      console.log('✅ Successfully imported Firebase modules!');
      return await createUserWithFunctions(functions, httpsCallableFn);
    } catch (importError) {
      console.log('❌ Failed to import Firebase modules:', importError.message);
    }
    
    // Method 5: Try to find Firebase in DOM
    console.log('🔍 Method 5: Looking for Firebase in DOM...');
    
    // Look for Firebase configuration in script tags
    const scriptTags = document.querySelectorAll('script');
    for (const script of scriptTags) {
      if (script.textContent && script.textContent.includes('firebase')) {
        console.log('✅ Found Firebase script tag!');
        // Try to evaluate the script content
        try {
          eval(script.textContent);
          if (typeof firebase !== 'undefined' && firebase.functions) {
            console.log('✅ Firebase available after script evaluation!');
            return await createUserWithFirebase(firebase);
          }
        } catch (e) {
          // Ignore evaluation errors
        }
      }
    }
    
    throw new Error('Could not find Firebase in any of the attempted methods');
    
  } catch (error) {
    console.error('❌ Error creating Gina\'s account:', error);
    console.log('💡 Troubleshooting tips:');
    console.log('1. Make sure you are logged in as an admin');
    console.log('2. Make sure you are on the Pack 1703 Portal page');
    console.log('3. Try refreshing the page and running this script again');
    console.log('4. Check if there are any console errors before running this script');
  }
}

async function createUserWithFirebase(firebase) {
  try {
    const functions = firebase.functions();
    const httpsCallable = firebase.functions.httpsCallable;
    
    return await createUserWithFunctions(functions, httpsCallable);
  } catch (error) {
    console.error('❌ Error setting up Firebase functions:', error);
    throw error;
  }
}

async function createUserWithFunctions(functions, httpsCallable) {
  try {
    // Create the user manually
    const createUserManually = httpsCallable(functions, 'createUserManually');
    
    const userData = {
      email: 'gina_daigle@yahoo.com',
      displayName: 'Gina Messa',
      firstName: 'Gina',
      lastName: 'Messa',
      phone: '7133762589',
      address: '5122 Rutherglenn Dr',
      city: 'Houston',
      state: 'TX',
      zipCode: '77025',
      den: 'Arrow of Light Den',
      rank: 'Adult',
      role: 'parent',
      reasonForJoining: 'Info sharing between packs! I am with pack 34'
    };
    
    console.log('📝 Creating user with data:', userData);
    
    const result = await createUserManually(userData);
    
    if (result.data.success) {
      console.log('🎉 SUCCESS! Gina Messa account created!');
      console.log('User ID:', result.data.userId);
      console.log('Email:', result.data.email);
      console.log('Display Name:', result.data.displayName);
      console.log('Role:', result.data.role);
      console.log('✅ Gina should now appear in the approved users list!');
    } else {
      console.error('❌ Failed to create account:', result.data.error);
    }
    
    return result;
  } catch (error) {
    console.error('❌ Error calling createUserManually:', error);
    throw error;
  }
}

// Run the enhanced function
createGinaAccountEnhanced();
