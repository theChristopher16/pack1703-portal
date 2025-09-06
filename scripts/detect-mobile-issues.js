#!/usr/bin/env node

/**
 * Targeted Mobile Issue Detection
 * Identifies specific mobile problems and provides fixes
 */

const fs = require('fs');
const path = require('path');

// Check for specific mobile issues
const mobileIssues = {
  // Issue 1: Check if mobile CSS is properly imported
  mobileCSSImport: () => {
    const appPath = path.join(__dirname, '../src/App.tsx');
    const content = fs.readFileSync(appPath, 'utf8');
    const hasMobileCSS = content.includes("import './styles/mobile.css'");
    
    return {
      issue: 'Mobile CSS Import',
      found: hasMobileCSS,
      fix: hasMobileCSS ? null : "Add 'import './styles/mobile.css';' to App.tsx",
      severity: hasMobileCSS ? 'none' : 'high'
    };
  },

  // Issue 2: Check Layout component for mobile menu
  layoutMobileMenu: () => {
    const layoutPath = path.join(__dirname, '../src/components/Layout/Layout.tsx');
    const content = fs.readFileSync(layoutPath, 'utf8');
    
    const hasMobileMenuState = content.includes('isMobileMenuOpen');
    const hasMobileMenuButton = content.includes('md:hidden');
    const hasMobileMenuToggle = content.includes('setIsMobileMenuOpen');
    
    const issues = [];
    if (!hasMobileMenuState) issues.push('Missing isMobileMenuOpen state');
    if (!hasMobileMenuButton) issues.push('Missing mobile menu button visibility class');
    if (!hasMobileMenuToggle) issues.push('Missing mobile menu toggle function');
    
    return {
      issue: 'Layout Mobile Menu',
      found: issues.length === 0,
      fix: issues.length > 0 ? `Fix: ${issues.join(', ')}` : null,
      severity: issues.length > 0 ? 'high' : 'none'
    };
  },

  // Issue 3: Check for proper mobile navigation
  mobileNavigation: () => {
    const layoutPath = path.join(__dirname, '../src/components/Layout/Layout.tsx');
    const content = fs.readFileSync(layoutPath, 'utf8');
    
    const hasHandleNavigation = content.includes('handleNavigation');
    const hasReactRouter = content.includes('useNavigate');
    const hasWindowLocation = content.includes('window.location.href');
    
    const issues = [];
    if (!hasHandleNavigation) issues.push('Missing handleNavigation function');
    if (!hasReactRouter) issues.push('Missing React Router navigation');
    if (hasWindowLocation) issues.push('Still using window.location.href instead of React Router');
    
    return {
      issue: 'Mobile Navigation',
      found: issues.length === 0,
      fix: issues.length > 0 ? `Fix: ${issues.join(', ')}` : null,
      severity: issues.length > 0 ? 'high' : 'none'
    };
  },

  // Issue 4: Check HomePage mobile responsiveness
  homePageMobile: () => {
    const homePagePath = path.join(__dirname, '../src/pages/HomePage.tsx');
    const content = fs.readFileSync(homePagePath, 'utf8');
    
    const hasResponsiveText = content.includes('text-4xl sm:text-5xl');
    const hasMobileButtons = content.includes('w-full sm:w-auto');
    const hasMobilePadding = content.includes('px-4');
    
    const issues = [];
    if (!hasResponsiveText) issues.push('Missing responsive text sizing');
    if (!hasMobileButtons) issues.push('Missing mobile button sizing');
    if (!hasMobilePadding) issues.push('Missing mobile padding');
    
    return {
      issue: 'HomePage Mobile',
      found: issues.length === 0,
      fix: issues.length > 0 ? `Fix: ${issues.join(', ')}` : null,
      severity: issues.length > 0 ? 'medium' : 'none'
    };
  },

  // Issue 5: Check EventsPage mobile responsiveness
  eventsPageMobile: () => {
    const eventsPagePath = path.join(__dirname, '../src/pages/EventsPage.tsx');
    const content = fs.readFileSync(eventsPagePath, 'utf8');
    
    const hasMobileLayout = content.includes('flex-col sm:flex-row');
    const hasMobileButtons = content.includes('w-full sm:w-auto');
    const hasMobileToggle = content.includes('flex-1 sm:flex-none');
    
    const issues = [];
    if (!hasMobileLayout) issues.push('Missing mobile layout classes');
    if (!hasMobileButtons) issues.push('Missing mobile button classes');
    if (!hasMobileToggle) issues.push('Missing mobile toggle classes');
    
    return {
      issue: 'EventsPage Mobile',
      found: issues.length === 0,
      fix: issues.length > 0 ? `Fix: ${issues.join(', ')}` : null,
      severity: issues.length > 0 ? 'medium' : 'none'
    };
  },

  // Issue 6: Check EventCard mobile responsiveness
  eventCardMobile: () => {
    const eventCardPath = path.join(__dirname, '../src/components/Events/EventCard.tsx');
    const content = fs.readFileSync(eventCardPath, 'utf8');
    
    const hasMobileLayout = content.includes('flex-col sm:flex-row');
    const hasMobileButtons = content.includes('flex-1 sm:flex-none');
    const hasMobileSpacing = content.includes('space-y-2 sm:space-y-0');
    
    const issues = [];
    if (!hasMobileLayout) issues.push('Missing mobile layout classes');
    if (!hasMobileButtons) issues.push('Missing mobile button classes');
    if (!hasMobileSpacing) issues.push('Missing mobile spacing classes');
    
    return {
      issue: 'EventCard Mobile',
      found: issues.length === 0,
      fix: issues.length > 0 ? `Fix: ${issues.join(', ')}` : null,
      severity: issues.length > 0 ? 'medium' : 'none'
    };
  },

  // Issue 7: Check mobile CSS content
  mobileCSSContent: () => {
    const cssPath = path.join(__dirname, '../src/styles/mobile.css');
    const content = fs.readFileSync(cssPath, 'utf8');
    
    const hasMediaQuery = content.includes('@media (max-width: 768px)');
    const hasButtonSizing = content.includes('min-height: 44px');
    const hasTouchAction = content.includes('touch-action: manipulation');
    const hasMobileText = content.includes('font-size: 2rem');
    
    const issues = [];
    if (!hasMediaQuery) issues.push('Missing mobile media query');
    if (!hasButtonSizing) issues.push('Missing button sizing rules');
    if (!hasTouchAction) issues.push('Missing touch action rules');
    if (!hasMobileText) issues.push('Missing mobile text sizing');
    
    return {
      issue: 'Mobile CSS Content',
      found: issues.length === 0,
      fix: issues.length > 0 ? `Fix: ${issues.join(', ')}` : null,
      severity: issues.length > 0 ? 'high' : 'none'
    };
  },

  // Issue 8: Check for mobile testing suite
  mobileTestingSuite: () => {
    const testSuitePath = path.join(__dirname, '../src/components/Testing/MobileTestSuite.tsx');
    const testPagePath = path.join(__dirname, '../src/pages/MobileTestingPage.tsx');
    
    const suiteExists = fs.existsSync(testSuitePath);
    const pageExists = fs.existsSync(testPagePath);
    
    const issues = [];
    if (!suiteExists) issues.push('Missing MobileTestSuite component');
    if (!pageExists) issues.push('Missing MobileTestingPage');
    
    return {
      issue: 'Mobile Testing Suite',
      found: issues.length === 0,
      fix: issues.length > 0 ? `Fix: ${issues.join(', ')}` : null,
      severity: issues.length > 0 ? 'low' : 'none'
    };
  }
};

// Run mobile issue detection
function detectMobileIssues() {
  console.log('🔍 Detecting Mobile Issues...\n');
  
  const results = [];
  let totalIssues = 0;
  let highSeverityIssues = 0;
  
  for (const [issueName, checkFunction] of Object.entries(mobileIssues)) {
    const result = checkFunction();
    results.push(result);
    
    if (!result.found) {
      totalIssues++;
      if (result.severity === 'high') {
        highSeverityIssues++;
      }
      
      console.log(`❌ ${result.issue}: ${result.fix}`);
    } else {
      console.log(`✅ ${result.issue}: OK`);
    }
  }
  
  console.log(`\n📊 Summary:`);
  console.log(`  Total Issues: ${totalIssues}`);
  console.log(`  High Severity: ${highSeverityIssues}`);
  console.log(`  Medium Severity: ${results.filter(r => !r.found && r.severity === 'medium').length}`);
  console.log(`  Low Severity: ${results.filter(r => !r.found && r.severity === 'low').length}`);
  
  if (totalIssues === 0) {
    console.log('\n🎉 No mobile issues detected! Your app is mobile-ready.');
  } else {
    console.log('\n🔧 Issues found. Please fix the high and medium severity issues first.');
  }
  
  return results;
}

// Run if called directly
if (require.main === module) {
  detectMobileIssues();
}

module.exports = { detectMobileIssues, mobileIssues };