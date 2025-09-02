import { getFunctions, httpsCallable } from 'firebase/functions';

// Test GPT-5 connection
async function testGPT5Connection() {
  try {
    console.log('🧪 Testing GPT-5 connection...');
    
    const functions = getFunctions();
    const testConnection = httpsCallable(functions, 'testAIConnection');
    
    const result = await testConnection({});
    const data = result.data as any;
    
    if (data.success && data.connected) {
      console.log('✅ GPT-5 Connection Successful!');
      console.log(`🤖 Model: ${data.model}`);
      console.log(`📝 Max Tokens: ${data.maxTokens}`);
      console.log(`🌡️ Temperature: ${data.temperature}`);
      return true;
    } else {
      console.log('❌ GPT-5 Connection Failed');
      console.log(`Error: ${data.error || 'Unknown error'}`);
      return false;
    }
  } catch (error) {
    console.error('❌ Error testing GPT-5 connection:', error);
    return false;
  }
}

// Test GPT-5 content generation
async function testGPT5ContentGeneration() {
  try {
    console.log('\n🎯 Testing GPT-5 content generation...');
    
    const functions = getFunctions();
    const generateContent = httpsCallable(functions, 'aiGenerateContent');
    
    // Test event description generation
    const eventData = {
      title: 'Pack Meeting',
      date: 'December 15, 2024',
      location: 'Community Center',
      type: 'Meeting'
    };
    
    const result = await generateContent({
      type: 'event_description',
      prompt: 'Generate an engaging event description',
      eventData: eventData
    });
    
    const data = result.data as any;
    
    if (data.success) {
      console.log('✅ GPT-5 Content Generation Successful!');
      console.log(`🤖 Model Used: ${data.model}`);
      console.log(`📝 Generated Content:`);
      console.log(data.result.content);
      return true;
    } else {
      console.log('❌ GPT-5 Content Generation Failed');
      return false;
    }
  } catch (error) {
    console.error('❌ Error testing GPT-5 content generation:', error);
    return false;
  }
}

// Main test function
async function runGPT5Tests() {
  console.log('🚀 Starting GPT-5 Integration Tests...\n');
  
  const connectionTest = await testGPT5Connection();
  
  if (connectionTest) {
    await testGPT5ContentGeneration();
  }
  
  console.log('\n🎉 GPT-5 Integration Tests Complete!');
}

// Export for use in other files
export { testGPT5Connection, testGPT5ContentGeneration, runGPT5Tests };

// Run tests if this file is executed directly
if (typeof window !== 'undefined') {
  // Browser environment
  (window as any).runGPT5Tests = runGPT5Tests;
} else {
  // Node.js environment
  runGPT5Tests().catch(console.error);
}
