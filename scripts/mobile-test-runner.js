#!/usr/bin/env node

/**
 * Mobile Testing Script for Scout Families Portal
 * 
 * This script runs automated tests to validate mobile responsiveness
 * and functionality of the web application.
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Test configurations
const TEST_CONFIGS = {
  mobile: [
    { name: 'iPhone SE', width: 375, height: 667 },
    { name: 'iPhone 12', width: 390, height: 844 },
    { name: 'iPhone 12 Pro Max', width: 428, height: 926 },
    { name: 'Samsung Galaxy S21', width: 384, height: 854 }
  ],
  tablet: [
    { name: 'iPad', width: 768, height: 1024 },
    { name: 'iPad Pro', width: 1024, height: 1366 }
  ],
  desktop: [
    { name: 'Desktop Small', width: 1024, height: 768 },
    { name: 'Desktop Large', width: 1920, height: 1080 }
  ]
};

// Test cases
const TEST_CASES = [
  {
    name: 'Navigation Test',
    description: 'Test mobile navigation menu functionality',
    test: async (page) => {
      try {
        // Look for mobile menu button
        const mobileMenuButton = await page.$('button[aria-label*="menu"], button:has(svg)');
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
    }
  },
  {
    name: 'Layout Responsiveness',
    description: 'Test component layouts on different screen sizes',
    test: async (page) => {
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
    }
  },
  {
    name: 'Touch Interactions',
    description: 'Test touch-friendly button sizes and interactions',
    test: async (page) => {
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
    }
  },
  {
    name: 'Performance Check',
    description: 'Test mobile performance and loading times',
    test: async (page) => {
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
    }
  },
  {
    name: 'Accessibility',
    description: 'Test mobile accessibility features',
    test: async (page) => {
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
  }
];

class MobileTestRunner {
  constructor() {
    this.browser = null;
    this.results = [];
  }

  async init() {
    console.log('🚀 Starting Mobile Test Runner...');
    this.browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  }

  async runTests() {
    if (!this.browser) {
      throw new Error('Browser not initialized');
    }

    console.log('📱 Running mobile tests...');

    for (const [deviceType, devices] of Object.entries(TEST_CONFIGS)) {
      console.log(`\n🔍 Testing ${deviceType} devices...`);
      
      for (const device of devices) {
        console.log(`  📱 Testing ${device.name} (${device.width}x${device.height})`);
        
        const page = await this.browser.newPage();
        await page.setViewport({ width: device.width, height: device.height });
        
        const deviceResults = {
          device: device.name,
          type: deviceType,
          viewport: { width: device.width, height: device.height },
          tests: []
        };

        for (const testCase of TEST_CASES) {
          console.log(`    ⚡ Running: ${testCase.name}`);
          
          try {
            const result = await testCase.test(page);
            deviceResults.tests.push({
              name: testCase.name,
              description: testCase.description,
              passed: result.passed,
              error: result.error
            });
            
            console.log(`      ${result.passed ? '✅' : '❌'} ${testCase.name}: ${result.passed ? 'PASSED' : 'FAILED'}`);
            if (result.error) {
              console.log(`        Error: ${result.error}`);
            }
          } catch (error) {
            deviceResults.tests.push({
              name: testCase.name,
              description: testCase.description,
              passed: false,
              error: error.message
            });
            console.log(`      ❌ ${testCase.name}: ERROR - ${error.message}`);
          }
        }

        this.results.push(deviceResults);
        await page.close();
      }
    }
  }

  generateReport() {
    console.log('\n📊 Generating Test Report...');
    
    const report = {
      timestamp: new Date().toISOString(),
      summary: this.getSummary(),
      results: this.results
    };

    // Save report to file
    const reportPath = path.join(__dirname, 'mobile-test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`📄 Report saved to: ${reportPath}`);
    
    // Print summary
    console.log('\n📈 Test Summary:');
    console.log(`  Total Devices: ${report.summary.totalDevices}`);
    console.log(`  Total Tests: ${report.summary.totalTests}`);
    console.log(`  Passed: ${report.summary.passedTests}`);
    console.log(`  Failed: ${report.summary.failedTests}`);
    console.log(`  Success Rate: ${report.summary.successRate}%`);
    
    return report;
  }

  getSummary() {
    const totalDevices = this.results.length;
    const totalTests = this.results.reduce((sum, device) => sum + device.tests.length, 0);
    const passedTests = this.results.reduce((sum, device) => 
      sum + device.tests.filter(test => test.passed).length, 0
    );
    const failedTests = totalTests - passedTests;
    const successRate = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;

    return {
      totalDevices,
      totalTests,
      passedTests,
      failedTests,
      successRate
    };
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

// Main execution
async function main() {
  const runner = new MobileTestRunner();
  
  try {
    await runner.init();
    await runner.runTests();
    const report = runner.generateReport();
    
    // Exit with appropriate code
    process.exit(report.summary.failedTests > 0 ? 1 : 0);
  } catch (error) {
    console.error('❌ Test runner failed:', error);
    process.exit(1);
  } finally {
    await runner.cleanup();
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = MobileTestRunner;