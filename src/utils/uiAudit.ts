// UI/UX Audit Utility
// This file helps identify common UI issues across the application

export interface UIIssue {
  component: string;
  issue: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  solution: string;
  location: string;
}

export const knownUIIssues: UIIssue[] = [
  {
    component: 'AdminLogin',
    issue: 'White text on light background',
    severity: 'critical',
    description: 'Text appears white/invisible on light background, making it unreadable',
    solution: 'Use text-gray-900 or text-text-primary instead of white text classes',
    location: 'app/sfpack1703app/src/pages/AdminLogin.tsx'
  },
  {
    component: 'AdminNav',
    issue: 'Toolbar bleeding off page',
    severity: 'high', 
    description: 'Admin navigation items overflow horizontally causing layout breaks',
    solution: 'Add overflow-x-auto, flex-shrink-0, and better responsive spacing',
    location: 'app/sfpack1703app/src/components/Admin/AdminNav.tsx'
  },
  {
    component: 'AdminNav',
    issue: 'Portal title formatting incorrect',
    severity: 'medium',
    description: '"Pack 1703 Families Portal" title not properly formatted in admin toolbar',
    solution: 'Update title text and ensure proper truncation on mobile',
    location: 'app/sfpack1703app/src/components/Admin/AdminNav.tsx'
  }
];

/**
 * Common UI/UX issues to check for across components
 */
export const uiAuditChecklist = [
  // Color & Contrast Issues
  'White text on light backgrounds (invisible text)',
  'Low color contrast ratios (< 4.5:1 for normal text)',
  'Missing focus states on interactive elements',
  'Inconsistent color usage across components',
  
  // Layout & Spacing Issues  
  'Content bleeding off page edges',
  'Horizontal scrollbars on mobile',
  'Inconsistent padding/margins',
  'Poor mobile responsive behavior',
  'Overlapping elements',
  
  // Typography Issues
  'Text truncation problems',
  'Inconsistent font sizes/weights',
  'Poor line height/spacing',
  'Missing text hierarchy',
  
  // Interactive Issues
  'Buttons without hover states',
  'Missing loading states',
  'Poor error message visibility',
  'Inaccessible form elements',
  
  // Performance Issues
  'Large images without optimization',
  'Missing lazy loading',
  'Excessive re-renders',
  'Poor Core Web Vitals scores'
];

/**
 * Automated checks that can be run in browser console
 */
export const browserAuditChecks = `
// Run this in browser console to check for common UI issues

console.log('🔍 UI Audit Starting...');

// 1. Check for invisible text (white text on light backgrounds)
const invisibleText = Array.from(document.querySelectorAll('*')).filter(el => {
  const styles = getComputedStyle(el);
  const textColor = styles.color;
  const bgColor = styles.backgroundColor;
  
  // Simple check for white text on light backgrounds
  return textColor.includes('255, 255, 255') && 
         (bgColor.includes('255') || bgColor === 'rgba(0, 0, 0, 0)');
});

console.log('⚠️ Potential invisible text elements:', invisibleText.length);
invisibleText.forEach(el => console.log(el));

// 2. Check for horizontal overflow
const overflowElements = Array.from(document.querySelectorAll('*')).filter(el => {
  return el.scrollWidth > el.clientWidth;
});

console.log('📏 Elements with horizontal overflow:', overflowElements.length);
overflowElements.forEach(el => console.log(el));

// 3. Check for missing focus states
const interactiveElements = document.querySelectorAll('button, a, input, select, textarea');
const missingFocus = Array.from(interactiveElements).filter(el => {
  const styles = getComputedStyle(el, ':focus');
  return styles.outline === 'none' && !styles.boxShadow.includes('ring');
});

console.log('🎯 Interactive elements missing focus states:', missingFocus.length);

// 4. Check for poor color contrast
const checkContrast = (element) => {
  const styles = getComputedStyle(element);
  const color = styles.color;
  const bgColor = styles.backgroundColor;
  // This is a simplified check - full contrast calculation would be more complex
  return { element, color, bgColor };
};

console.log('✅ UI Audit Complete - Check above for issues');
`;

/**
 * Pages to audit for UI issues
 */
export const pagesToAudit = [
  { path: '/', name: 'Home Page' },
  { path: '/events', name: 'Events Page' },
  { path: '/locations', name: 'Locations Page' },
  { path: '/resources', name: 'Resources Page' },
  { path: '/volunteer', name: 'Volunteer Page' },
  { path: '/feedback', name: 'Feedback Page' },
  { path: '/admin', name: 'Admin Dashboard' },
  { path: '/admin/login', name: 'Admin Login' },
  { path: '/events/test-event', name: 'Event Detail Page' },
];

/**
 * Responsive breakpoints to test
 */
export const responsiveBreakpoints = [
  { name: 'Mobile', width: 375, height: 667 },
  { name: 'Mobile Large', width: 414, height: 896 },
  { name: 'Tablet', width: 768, height: 1024 },
  { name: 'Tablet Large', width: 1024, height: 768 },
  { name: 'Desktop', width: 1280, height: 800 },
  { name: 'Desktop Large', width: 1920, height: 1080 },
];

const uiAuditConfig = {
  knownUIIssues,
  uiAuditChecklist,
  browserAuditChecks,
  pagesToAudit,
  responsiveBreakpoints
};

export default uiAuditConfig;

