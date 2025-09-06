#!/usr/bin/env node

/**
 * Simple Mobile Test Runner
 * Tests mobile functionality without complex dependencies
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

// Test configurations
const MOBILE_DEVICES = [
  { name: 'iPhone SE', width: 375, height: 667 },
  { name: 'iPhone 12', width: 390, height: 844 },
  { name: 'iPhone 12 Pro Max', width: 428, height: 926 },
  { name: 'Samsung Galaxy S21', width: 384, height: 854 }
];

// Test results
let testResults = {
  timestamp: new Date().toISOString(),
  tests: [],
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    successRate: 0
  }
};

// Test functions
const tests = {
  // Test 1: Check if server is running
  serverRunning: () => {
    return new Promise((resolve) => {
      const req = http.get('http://localhost:3000', (res) => {
        resolve({
          name: 'Server Running',
          passed: res.statusCode === 200,
          details: `Status: ${res.statusCode}`
        });
      });
      
      req.on('error', () => {
        resolve({
          name: 'Server Running',
          passed: false,
          details: 'Server not accessible'
        });
      });
      
      req.setTimeout(5000, () => {
        resolve({
          name: 'Server Running',
          passed: false,
          details: 'Server timeout'
        });
      });
    });
  },

  // Test 2: Check mobile CSS file exists
  mobileCSSExists: () => {
    const cssPath = path.join(__dirname, '../src/styles/mobile.css');
    const exists = fs.existsSync(cssPath);
    
    return Promise.resolve({
      name: 'Mobile CSS File',
      passed: exists,
      details: exists ? 'mobile.css found' : 'mobile.css not found'
    });
  },

  // Test 3: Check mobile CSS content
  mobileCSSContent: () => {
    const cssPath = path.join(__dirname, '../src/styles/mobile.css');
    
    try {
      const content = fs.readFileSync(cssPath, 'utf8');
      const hasMobileMediaQuery = content.includes('@media (max-width: 768px)');
      const hasButtonSizing = content.includes('min-height: 44px');
      const hasTouchAction = content.includes('touch-action: manipulation');
      const hasViewportMeta = content.includes('viewport');
      
      const passed = hasMobileMediaQuery && hasButtonSizing && hasTouchAction;
      
      return Promise.resolve({
        name: 'Mobile CSS Content',
        passed: passed,
        details: `Media queries: ${hasMobileMediaQuery}, Button sizing: ${hasButtonSizing}, Touch action: ${hasTouchAction}`
      });
    } catch (error) {
      return Promise.resolve({
        name: 'Mobile CSS Content',
        passed: false,
        details: `Error reading CSS: ${error.message}`
      });
    }
  },

  // Test 4: Check Layout component for mobile fixes
  layoutComponentMobile: () => {
    const layoutPath = path.join(__dirname, '../src/components/Layout/Layout.tsx');
    
    try {
      const content = fs.readFileSync(layoutPath, 'utf8');
      const hasMobileMenu = content.includes('isMobileMenuOpen');
      const hasHandleNavigation = content.includes('handleNavigation');
      const hasReactRouter = content.includes('useNavigate');
      
      const passed = hasMobileMenu && hasHandleNavigation && hasReactRouter;
      
      return Promise.resolve({
        name: 'Layout Component Mobile Fixes',
        passed: passed,
        details: `Mobile menu: ${hasMobileMenu}, Navigation handler: ${hasHandleNavigation}, React Router: ${hasReactRouter}`
      });
    } catch (error) {
      return Promise.resolve({
        name: 'Layout Component Mobile Fixes',
        passed: false,
        details: `Error reading Layout: ${error.message}`
      });
    }
  },

  // Test 5: Check HomePage mobile fixes
  homePageMobile: () => {
    const homePagePath = path.join(__dirname, '../src/pages/HomePage.tsx');
    
    try {
      const content = fs.readFileSync(homePagePath, 'utf8');
      const hasResponsiveText = content.includes('text-4xl sm:text-5xl');
      const hasMobileButtons = content.includes('w-full sm:w-auto');
      const hasMobilePadding = content.includes('px-4');
      
      const passed = hasResponsiveText && hasMobileButtons && hasMobilePadding;
      
      return Promise.resolve({
        name: 'HomePage Mobile Fixes',
        passed: passed,
        details: `Responsive text: ${hasResponsiveText}, Mobile buttons: ${hasMobileButtons}, Mobile padding: ${hasMobilePadding}`
      });
    } catch (error) {
      return Promise.resolve({
        name: 'HomePage Mobile Fixes',
        passed: false,
        details: `Error reading HomePage: ${error.message}`
      });
    }
  },

  // Test 6: Check EventsPage mobile fixes
  eventsPageMobile: () => {
    const eventsPagePath = path.join(__dirname, '../src/pages/EventsPage.tsx');
    
    try {
      const content = fs.readFileSync(eventsPagePath, 'utf8');
      const hasMobileLayout = content.includes('flex-col sm:flex-row');
      const hasMobileButtons = content.includes('w-full sm:w-auto');
      const hasMobileToggle = content.includes('flex-1 sm:flex-none');
      
      const passed = hasMobileLayout && hasMobileButtons && hasMobileToggle;
      
      return Promise.resolve({
        name: 'EventsPage Mobile Fixes',
        passed: passed,
        details: `Mobile layout: ${hasMobileLayout}, Mobile buttons: ${hasMobileButtons}, Mobile toggle: ${hasMobileToggle}`
      });
    } catch (error) {
      return Promise.resolve({
        name: 'EventsPage Mobile Fixes',
        passed: false,
        details: `Error reading EventsPage: ${error.message}`
      });
    }
  },

  // Test 7: Check EventCard mobile fixes
  eventCardMobile: () => {
    const eventCardPath = path.join(__dirname, '../src/components/Events/EventCard.tsx');
    
    try {
      const content = fs.readFileSync(eventCardPath, 'utf8');
      const hasMobileLayout = content.includes('flex-col sm:flex-row');
      const hasMobileButtons = content.includes('flex-1 sm:flex-none');
      const hasMobileSpacing = content.includes('space-y-2 sm:space-y-0');
      
      const passed = hasMobileLayout && hasMobileButtons && hasMobileSpacing;
      
      return Promise.resolve({
        name: 'EventCard Mobile Fixes',
        passed: passed,
        details: `Mobile layout: ${hasMobileLayout}, Mobile buttons: ${hasMobileButtons}, Mobile spacing: ${hasMobileSpacing}`
      });
    } catch (error) {
      return Promise.resolve({
        name: 'EventCard Mobile Fixes',
        passed: false,
        details: `Error reading EventCard: ${error.message}`
      });
    }
  },

  // Test 8: Check mobile testing suite exists
  mobileTestingSuite: () => {
    const testSuitePath = path.join(__dirname, '../src/components/Testing/MobileTestSuite.tsx');
    const testPagePath = path.join(__dirname, '../src/pages/MobileTestingPage.tsx');
    
    const suiteExists = fs.existsSync(testSuitePath);
    const pageExists = fs.existsSync(testPagePath);
    
    return Promise.resolve({
      name: 'Mobile Testing Suite',
      passed: suiteExists && pageExists,
      details: `Test suite: ${suiteExists}, Test page: ${pageExists}`
    });
  },

  // Test 9: Check package.json for mobile test script
  packageJsonMobileScript: () => {
    const packagePath = path.join(__dirname, '../package.json');
    
    try {
      const content = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      const hasMobileScript = content.scripts && content.scripts['test:mobile'];
      
      return Promise.resolve({
        name: 'Package.json Mobile Script',
        passed: !!hasMobileScript,
        details: hasMobileScript ? `Script: ${hasMobileScript}` : 'No mobile test script found'
      });
    } catch (error) {
      return Promise.resolve({
        name: 'Package.json Mobile Script',
        passed: false,
        details: `Error reading package.json: ${error.message}`
      });
    }
  },

  // Test 10: Check Tailwind config for mobile breakpoints
  tailwindMobileConfig: () => {
    const tailwindPath = path.join(__dirname, '../tailwind.config.js');
    
    try {
      const content = fs.readFileSync(tailwindPath, 'utf8');
      const hasConfig = content.includes('module.exports') || content.includes('export default');
      const hasMobileColors = content.includes('primary') && content.includes('secondary');
      const hasResponsiveConfig = content.includes('extend') || content.includes('theme');
      
      return Promise.resolve({
        name: 'Tailwind Mobile Config',
        passed: hasConfig && hasMobileColors && hasResponsiveConfig,
        details: `Config exists: ${hasConfig}, Colors: ${hasMobileColors}, Responsive: ${hasResponsiveConfig}`
      });
    } catch (error) {
      return Promise.resolve({
        name: 'Tailwind Mobile Config',
        passed: false,
        details: `Error reading tailwind.config.js: ${error.message}`
      });
    }
  }
};

// Run all tests
async function runTests() {
  console.log('🚀 Starting Mobile Test Runner...\n');
  
  for (const [testName, testFunction] of Object.entries(tests)) {
    console.log(`⚡ Running: ${testName}`);
    
    try {
      const result = await testFunction();
      testResults.tests.push(result);
      
      console.log(`  ${result.passed ? '✅' : '❌'} ${result.name}: ${result.passed ? 'PASSED' : 'FAILED'}`);
      if (result.details) {
        console.log(`    Details: ${result.details}`);
      }
    } catch (error) {
      const errorResult = {
        name: testName,
        passed: false,
        details: `Error: ${error.message}`
      };
      testResults.tests.push(errorResult);
      console.log(`  ❌ ${testName}: ERROR - ${error.message}`);
    }
    
    console.log('');
  }
  
  // Calculate summary
  testResults.summary.total = testResults.tests.length;
  testResults.summary.passed = testResults.tests.filter(t => t.passed).length;
  testResults.summary.failed = testResults.summary.total - testResults.summary.passed;
  testResults.summary.successRate = testResults.summary.total > 0 
    ? Math.round((testResults.summary.passed / testResults.summary.total) * 100) 
    : 0;
  
  // Print summary
  console.log('📊 Test Summary:');
  console.log(`  Total Tests: ${testResults.summary.total}`);
  console.log(`  Passed: ${testResults.summary.passed}`);
  console.log(`  Failed: ${testResults.summary.failed}`);
  console.log(`  Success Rate: ${testResults.summary.successRate}%\n`);
  
  // Save results
  const reportPath = path.join(__dirname, 'mobile-test-results.json');
  fs.writeFileSync(reportPath, JSON.stringify(testResults, null, 2));
  console.log(`📄 Results saved to: ${reportPath}`);
  
  // Print recommendations
  if (testResults.summary.failed > 0) {
    console.log('\n🔧 Recommendations:');
    testResults.tests.filter(t => !t.passed).forEach(test => {
      console.log(`  • Fix ${test.name}: ${test.details}`);
    });
  }
  
  return testResults;
}

// Run if called directly
if (require.main === module) {
  runTests().then(results => {
    process.exit(results.summary.failed > 0 ? 1 : 0);
  }).catch(error => {
    console.error('❌ Test runner failed:', error);
    process.exit(1);
  });
}

module.exports = { runTests, tests };