// Browser script to debug chat channels and identify duplicates
// Run this in the browser console on the Pack 1703 Portal page

async function debugChatChannels() {
  console.log('🔍 Debugging chat channels...');
  
  try {
    // Try to find Firebase app and functions
    let functions, auth, currentUser;
    
    // Method 1: Try to get from existing Firebase app
    try {
      const { getFunctions, getAuth } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js');
      const { getFunctions: getFunctionsAuth, getAuth: getAuthAuth } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
      const { getFunctions: getFunctionsFunctions, httpsCallable } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-functions.js');
      
      // Get the default app
      const apps = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js');
      const app = apps.getApps()[0];
      
      if (app) {
        functions = getFunctionsFunctions(app);
        auth = getAuthAuth(app);
        currentUser = auth.currentUser;
        console.log('✅ Found Firebase app via modular SDK');
      }
    } catch (error) {
      console.log('❌ Could not find Firebase via modular SDK:', error.message);
    }
    
    // Method 2: Try legacy Firebase
    if (!currentUser && window.firebase) {
      auth = window.firebase.auth();
      currentUser = auth.currentUser;
      functions = window.firebase.functions();
      console.log('✅ Found Firebase via legacy SDK');
    }
    
    if (!currentUser) {
      console.error('❌ No authenticated user found. Please make sure you are logged in.');
      return;
    }
    
    console.log('👤 Current user:', currentUser.email, currentUser.uid);
    
    // Get the getChatChannels function
    let getChatChannelsFunction;
    if (functions) {
      if (window.firebase) {
        // Legacy SDK
        getChatChannelsFunction = functions.httpsCallable('getChatChannels');
      } else {
        // Modular SDK
        const { httpsCallable } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-functions.js');
        getChatChannelsFunction = httpsCallable(functions, 'getChatChannels');
      }
    } else {
      console.error('❌ Could not access Firebase Functions');
      return;
    }
    
    // Call the Cloud Function
    console.log('🔄 Calling getChatChannels Cloud Function...');
    const result = await getChatChannelsFunction();
    
    console.log('📊 Cloud Function Response:', result.data);
    
    if (result.data.success) {
      const channels = result.data.channels;
      console.log(`📋 Total channels returned: ${channels.length}`);
      
      // Analyze for duplicates
      const channelNames = channels.map(c => c.name?.toLowerCase()).filter(Boolean);
      const uniqueNames = [...new Set(channelNames)];
      
      console.log(`🔍 Unique channel names: ${uniqueNames.length}`);
      console.log(`📝 All channel names:`, channelNames);
      
      if (channelNames.length !== uniqueNames.length) {
        console.warn('⚠️ DUPLICATES DETECTED!');
        
        // Find duplicates
        const duplicates = channelNames.filter((name, index) => 
          channelNames.indexOf(name) !== index
        );
        
        console.log('🔄 Duplicate names found:', [...new Set(duplicates)]);
        
        // Show duplicate channels
        const duplicateChannels = channels.filter(channel => 
          duplicates.includes(channel.name?.toLowerCase())
        );
        
        console.log('📋 Duplicate channels:', duplicateChannels);
        
        // Show what the deduplication should return
        const deduplicatedChannels = channels.filter((channel, index, self) => 
          index === self.findIndex(c => c.name?.toLowerCase() === channel.name?.toLowerCase())
        );
        
        console.log('✅ After deduplication:', deduplicatedChannels);
        console.log(`📊 Deduplicated count: ${deduplicatedChannels.length}`);
        
      } else {
        console.log('✅ No duplicates found in Cloud Function response');
      }
      
      // Show channel organization
      const packChannels = channels.filter(channel => 
        ['general', 'announcements', 'events', 'volunteer'].includes(channel.name?.toLowerCase())
      );
      
      const denChannels = channels.filter(channel => 
        ['lion', 'tiger', 'wolf', 'bear', 'webelos', 'arrow of light'].some(den => 
          channel.name?.toLowerCase().includes(den)
        )
      );
      
      console.log('📦 Pack channels:', packChannels.map(c => c.name));
      console.log('🏠 Den channels:', denChannels.map(c => c.name));
      
    } else {
      console.error('❌ Cloud Function returned error:', result.data);
    }
    
  } catch (error) {
    console.error('❌ Error debugging chat channels:', error);
    console.log('Error details:', error.message, error.stack);
  }
}

// Export to window for easy access
window.debugChatChannels = debugChatChannels;

console.log('🔧 debugChatChannels function loaded');
console.log('💡 Run debugChatChannels() to analyze chat channel duplicates');
