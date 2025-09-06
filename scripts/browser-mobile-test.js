#!/usr/bin/env node

/**
 * Browser-based Mobile Test Runner
 * Tests actual mobile functionality using headless browser
 */

const puppeteer = require('puppeteer');

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
  devices: [],
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    successRate: 0
  }
};

// Test functions
const tests = {
  // Test 1: Check mobile navigation
  mobileNavigation: async (page) => {
    try {
      // Look for mobile menu button
      const mobileMenuButton = await page.$('button[aria-label*="menu"], button:has(svg)') ||
                               await page.$('button:has(svg)');
      
      if (!mobileMenuButton) {
        return { passed: false, error: 'Mobile menu button not found' };
      }

      // Test menu toggle
      await mobileMenuButton.click();
      await page.waitForTimeout(500);

      // Check if menu is visible
      const mobileMenu = await page.$('.mobile-menu, [class*="mobile"]');
      const isVisible = mobileMenu ? await mobileMenu.isVisible() : false;

      return { passed: isVisible, error: isVisible ? null : 'Mobile menu not visible after click' };
    } catch (error) {
      return { passed: false, error: error.message };
    }
  },

  // Test 2: Check responsive layout
  responsiveLayout: async (page) => {
    try {
      // Check for responsive classes
      const responsiveElements = await page.$$('[class*="sm:"], [class*="md:"], [class*="lg:"]');
      
      // Check for grid layouts
      const gridElements = await page.$$('[class*="grid"]');
      
      // Check for flex layouts
      const flexElements = await page.$$('[class*="flex"]');

      const hasResponsiveDesign = responsiveElements.length > 0;
      const hasLayoutStructure = gridElements.length > 0 || flexElements.length > 0;

      return { 
        passed: hasResponsiveDesign && hasLayoutStructure, 
        error: hasResponsiveDesign && hasLayoutStructure ? null : 'Missing responsive design or layout structure' 
      };
    } catch (error) {
      return { passed: false, error: error.message };
    }
  },

  // Test 3: Check touch-friendly buttons
  touchFriendlyButtons: async (page) => {
    try {
      const buttons = await page.$$('button, a[role="button"]');
      let touchFriendlyCount = 0;

      for (const button of buttons) {
        const box = await button.boundingBox();
        if (box && box.height >= 44 && box.width >= 44) {
          touchFriendlyCount++;
        }
      }

      return { 
        passed: touchFriendlyCount > 0, 
        error: touchFriendlyCount > 0 ? null : 'No touch-friendly buttons found' 
      };
    } catch (error) {
      return { passed: false, error: error.message };
    }
  },

  // Test 4: Check mobile performance
  mobilePerformance: async (page) => {
    try {
      const startTime = Date.now();
      
      // Navigate to a page
      await page.goto('http://localhost:3000/events', { waitUntil: 'networkidle0' });
      
      const loadTime = Date.now() - startTime;
      
      // Check for optimized images
      const images = await page.$$('img');
      let optimizedImages = 0;
      
      for (const img of images) {
        const src = await img.getAttribute('src');
        if (src && (src.includes('w_') || src.includes('h_') || src.includes('q_'))) {
          optimizedImages++;
        }
      }

      const performanceGood = loadTime < 3000;
      const imagesOptimized = optimizedImages > 0 || images.length === 0;

      return { 
        passed: performanceGood && imagesOptimized, 
        error: performanceGood && imagesOptimized ? null : `Performance issues: loadTime=${loadTime}ms, optimizedImages=${optimizedImages}/${images.length}` 
      };
    } catch (error) {
      return { passed: false, error: error.message };
    }
  },

  // Test 5: Check accessibility
  accessibility: async (page) => {
    try {
      // Check for ARIA labels
      const ariaElements = await page.$$('[aria-label], [aria-labelledby], [aria-describedby]');
      
      // Check for proper heading hierarchy
      const headings = await page.$$('h1, h2, h3, h4, h5, h6');
      let properHierarchy = true;
      let lastLevel = 0;
      
      for (const heading of headings) {
        const tagName = await heading.evaluate(el => el.tagName);
        const level = parseInt(tagName.charAt(1));
        if (level > lastLevel + 1) {
          properHierarchy = false;
          break;
        }
        lastLevel = level;
      }

      // Check for focusable elements
      const focusableElements = await page.$$('button, a, input, select, textarea, [tabindex]');

      const hasAria = ariaElements.length > 0;
      const hasProperHierarchy = properHierarchy;
      const hasFocusableElements = focusableElements.length > 0;

      return { 
        passed: hasAria && hasProperHierarchy && hasFocusableElements, 
        error: hasAria && hasProperHierarchy && hasFocusableElements ? null : 'Accessibility issues found' 
      };
    } catch (error) {
      return { passed: false, error: error.message };
    }
  }
};

// Run tests for a specific device
async function runDeviceTests(device, browser) {
  console.log(`📱 Testing ${device.name} (${device.width}x${device.height})`);
  
  const page = await browser.newPage();
  await page.setViewport({ width: device.width, height: device.height });
  
  const deviceResults = {
    device: device.name,
    viewport: { width: device.width, height: device.height },
    tests: []
  };

  for (const [testName, testFunction] of Object.entries(tests)) {
    console.log(`  ⚡ Running: ${testName}`);
    
    try {
      const result = await testFunction(page);
      deviceResults.tests.push({
        name: testName,
        passed: result.passed,
        error: result.error
      });
      
      console.log(`    ${result.passed ? '✅' : '❌'} ${testName}: ${result.passed ? 'PASSED' : 'FAILED'}`);
      if (result.error) {
        console.log(`      Error: ${result.error}`);
      }
    } catch (error) {
      deviceResults.tests.push({
        name: testName,
        passed: false,
        error: error.message
      });
      console.log(`    ❌ ${testName}: ERROR - ${error.message}`);
    }
  }

  await page.close();
  return deviceResults;
}

// Main test runner
async function runBrowserTests() {
  console.log('🚀 Starting Browser-based Mobile Test Runner...\n');
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    for (const device of MOBILE_DEVICES) {
      const deviceResults = await runDeviceTests(device, browser);
      testResults.devices.push(deviceResults);
      console.log('');
    }
  } finally {
    await browser.close();
  }

  // Calculate summary
  testResults.summary.total = testResults.devices.reduce((sum, device) => sum + device.tests.length, 0);
  testResults.summary.passed = testResults.devices.reduce((sum, device) => 
    sum + device.tests.filter(test => test.passed).length, 0
  );
  testResults.summary.failed = testResults.summary.total - testResults.summary.passed;
  testResults.summary.successRate = testResults.summary.total > 0 
    ? Math.round((testResults.summary.passed / testResults.summary.total) * 100) 
    : 0;

  // Print summary
  console.log('📊 Test Summary:');
  console.log(`  Total Devices: ${testResults.devices.length}`);
  console.log(`  Total Tests: ${testResults.summary.total}`);
  console.log(`  Passed: ${testResults.summary.passed}`);
  console.log(`  Failed: ${testResults.summary.failed}`);
  console.log(`  Success Rate: ${testResults.summary.successRate}%\n`);

  // Save results
  const fs = require('fs');
  const path = require('path');
  const reportPath = path.join(__dirname, 'browser-mobile-test-results.json');
  fs.writeFileSync(reportPath, JSON.stringify(testResults, null, 2));
  console.log(`📄 Results saved to: ${reportPath}`);

  // Print recommendations
  if (testResults.summary.failed > 0) {
    console.log('\n🔧 Recommendations:');
    testResults.devices.forEach(device => {
      device.tests.filter(test => !test.passed).forEach(test => {
        console.log(`  • ${device.device} - ${test.name}: ${test.error}`);
      });
    });
  }

  return testResults;
}

// Run if called directly
if (require.main === module) {
  runBrowserTests().then(results => {
    process.exit(results.summary.failed > 0 ? 1 : 0);
  }).catch(error => {
    console.error('❌ Browser test runner failed:', error);
    process.exit(1);
  });
}

module.exports = { runBrowserTests, tests };