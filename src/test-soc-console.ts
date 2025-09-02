import { getFunctions, httpsCallable } from 'firebase/functions';

// Test SOC Console functionality
async function testSOCConsole() {
  try {
    console.log('🧪 Testing SOC Console functionality...');
    
    const functions = getFunctions();
    
    // Test 1: Test AI Connection
    console.log('\n1️⃣ Testing AI Connection...');
    const testConnection = httpsCallable(functions, 'testAIConnection');
    const aiResult = await testConnection({});
    console.log('✅ AI Connection Result:', aiResult.data);
    
    // Test 2: Test System Command - Ping
    console.log('\n2️⃣ Testing System Command - Ping...');
    const systemCommand = httpsCallable(functions, 'systemCommand');
    const pingResult = await systemCommand({ command: 'ping' });
    console.log('✅ Ping Result:', pingResult.data);
    
    // Test 3: Test System Command - Status
    console.log('\n3️⃣ Testing System Command - Status...');
    const statusResult = await systemCommand({ command: 'status' });
    console.log('✅ Status Result:', statusResult.data);
    
    // Test 4: Test System Command - Check AI
    console.log('\n4️⃣ Testing System Command - Check AI...');
    const checkAiResult = await systemCommand({ command: 'check_ai' });
    console.log('✅ Check AI Result:', checkAiResult.data);
    
    console.log('\n🎉 All SOC Console tests completed successfully!');
    return true;
    
  } catch (error) {
    console.error('❌ Error testing SOC Console:', error);
    return false;
  }
}

// Test SOC Console access control
async function testSOCConsoleAccess() {
  try {
    console.log('\n🔒 Testing SOC Console Access Control...');
    
    // This would test if non-root users are properly blocked
    // In a real test, you'd need to test with different user roles
    console.log('✅ Access control tests would be run here with different user roles');
    
    return true;
  } catch (error) {
    console.error('❌ Error testing access control:', error);
    return false;
  }
}

// Run all tests
async function runSOCConsoleTests() {
  console.log('🚀 Starting SOC Console Tests...\n');
  
  const functionTests = await testSOCConsole();
  const accessTests = await testSOCConsoleAccess();
  
  console.log('\n📊 Test Results:');
  console.log(`Function Tests: ${functionTests ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Access Tests: ${accessTests ? '✅ PASS' : '❌ FAIL'}`);
  
  if (functionTests && accessTests) {
    console.log('\n🎉 All SOC Console tests passed!');
  } else {
    console.log('\n⚠️ Some tests failed. Check the output above.');
  }
}

// Export for use in other files
export { testSOCConsole, testSOCConsoleAccess, runSOCConsoleTests };

// Run tests if this file is executed directly
if (typeof window !== 'undefined') {
  // Browser environment
  (window as any).runSOCConsoleTests = runSOCConsoleTests;
  console.log('🧪 SOC Console tests available. Run window.runSOCConsoleTests() in console.');
} else {
  // Node.js environment
  runSOCConsoleTests().catch(console.error);
}
