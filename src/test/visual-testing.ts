import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import AdminNav from '../components/Admin/AdminNav';
import { AdminProvider } from '../contexts/AdminContext';

// Mock IntersectionObserver for visual testing
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock ResizeObserver for responsive testing
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

interface VisualTestResult {
  testName: string;
  passed: boolean;
  issues: string[];
  elementInfo?: {
    position: { x: number; y: number };
    size: { width: number; height: number };
    visible: boolean;
    zIndex?: number;
  };
}

class VisualTestingFramework {
  private results: VisualTestResult[] = [];

  // Test dropdown positioning and behavior
  async testDropdownPositioning(component: React.ReactElement): Promise<VisualTestResult> {
    const { container } = render(
      <BrowserRouter>
        <AdminProvider>
          {component}
        </AdminProvider>
      </BrowserRouter>
    );

    const issues: string[] = [];
    let passed = true;

    // Find the More button
    const moreButton = screen.getByText('More');
    if (!moreButton) {
      issues.push('More button not found');
      passed = false;
      return { testName: 'Dropdown Positioning', passed, issues };
    }

    // Get button position
    const buttonRect = moreButton.getBoundingClientRect();
    
    // Click to open dropdown
    fireEvent.click(moreButton);
    
    await waitFor(() => {
      const dropdown = container.querySelector('[class*="absolute"]');
      if (!dropdown) {
        issues.push('Dropdown not found after click');
        passed = false;
        return;
      }

      const dropdownRect = dropdown.getBoundingClientRect();
      
      // Test 1: Dropdown should appear below the button
      const expectedTop = buttonRect.bottom + 4; // mt-1 = 4px
      if (Math.abs(dropdownRect.top - expectedTop) > 5) {
        issues.push(`Dropdown top position incorrect. Expected: ${expectedTop}, Got: ${dropdownRect.top}`);
        passed = false;
      }

      // Test 2: Dropdown should align with button left edge
      if (Math.abs(dropdownRect.left - buttonRect.left) > 5) {
        issues.push(`Dropdown left alignment incorrect. Expected: ${buttonRect.left}, Got: ${dropdownRect.left}`);
        passed = false;
      }

      // Test 3: Dropdown should have proper z-index
      const zIndex = window.getComputedStyle(dropdown).zIndex;
      if (zIndex === 'auto' || parseInt(zIndex) < 1000) {
        issues.push(`Dropdown z-index too low: ${zIndex}`);
        passed = false;
      }

      // Test 4: Dropdown should be visible
      if (dropdownRect.width === 0 || dropdownRect.height === 0) {
        issues.push('Dropdown has zero dimensions');
        passed = false;
      }

      // Test 5: Check for scrollbars in parent container
      const navContainer = container.querySelector('[class*="hidden lg:flex"]');
      if (navContainer) {
        const navStyle = window.getComputedStyle(navContainer);
        if (navStyle.overflowX === 'auto' || navStyle.overflowX === 'scroll') {
          issues.push('Navigation container has horizontal scrollbar');
          passed = false;
        }
      }
    });

    return {
      testName: 'Dropdown Positioning',
      passed,
      issues,
      elementInfo: {
        position: { x: buttonRect.left, y: buttonRect.top },
        size: { width: buttonRect.width, height: buttonRect.height },
        visible: true
      }
    };
  }

  // Test responsive behavior
  async testResponsiveLayout(component: React.ReactElement): Promise<VisualTestResult> {
    const issues: string[] = [];
    let passed = true;

    // Test different screen sizes
    const screenSizes = [
      { width: 1920, height: 1080, name: 'Desktop' },
      { width: 1024, height: 768, name: 'Tablet' },
      { width: 768, height: 1024, name: 'Mobile' }
    ];

    for (const size of screenSizes) {
      // Mock window size
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: size.width,
      });
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: size.height,
      });

      const { container } = render(
        <BrowserRouter>
          <AdminProvider>
            {component}
          </AdminProvider>
        </BrowserRouter>
      );

      // Test for overflow issues
      const navElements = container.querySelectorAll('[class*="flex"]');
      navElements.forEach((element, index) => {
        const rect = element.getBoundingClientRect();
        if (rect.right > size.width) {
          issues.push(`${size.name}: Element ${index} overflows right edge`);
          passed = false;
        }
        if (rect.left < 0) {
          issues.push(`${size.name}: Element ${index} overflows left edge`);
          passed = false;
        }
      });
    }

    return {
      testName: 'Responsive Layout',
      passed,
      issues
    };
  }

  // Test navigation item count and spacing
  async testNavigationSpacing(component: React.ReactElement): Promise<VisualTestResult> {
    const { container } = render(
      <BrowserRouter>
        <AdminProvider>
          {component}
        </AdminProvider>
      </BrowserRouter>
    );

    const issues: string[] = [];
    let passed = true;

    // Count primary navigation items
    const primaryNavItems = container.querySelectorAll('[class*="flex-shrink-0"]');
    if (primaryNavItems.length > 5) {
      issues.push(`Too many primary nav items: ${primaryNavItems.length} (max 5)`);
      passed = false;
    }

    // Check for proper spacing
    primaryNavItems.forEach((item, index) => {
      if (index > 0) {
        const prevItem = primaryNavItems[index - 1];
        const prevRect = prevItem.getBoundingClientRect();
        const currentRect = item.getBoundingClientRect();
        
        const spacing = currentRect.left - prevRect.right;
        if (spacing < 4) { // space-x-1 = 4px
          issues.push(`Insufficient spacing between nav items ${index-1} and ${index}: ${spacing}px`);
          passed = false;
        }
      }
    });

    return {
      testName: 'Navigation Spacing',
      passed,
      issues
    };
  }

  // Test accessibility and keyboard navigation
  async testAccessibility(component: React.ReactElement): Promise<VisualTestResult> {
    const { container } = render(
      <BrowserRouter>
        <AdminProvider>
          {component}
        </AdminProvider>
      </BrowserRouter>
    );

    const issues: string[] = [];
    let passed = true;

    // Test keyboard navigation
    const moreButton = screen.getByText('More');
    if (moreButton) {
      // Test Enter key
      fireEvent.keyDown(moreButton, { key: 'Enter' });
      await waitFor(() => {
        const dropdown = container.querySelector('[class*="absolute"]');
        if (!dropdown) {
          issues.push('Dropdown not accessible via Enter key');
          passed = false;
        }
      });

      // Test Escape key
      fireEvent.keyDown(moreButton, { key: 'Escape' });
      await waitFor(() => {
        const dropdown = container.querySelector('[class*="absolute"]');
        if (dropdown) {
          issues.push('Dropdown not closing via Escape key');
          passed = false;
        }
      });
    }

    return {
      testName: 'Accessibility',
      passed,
      issues
    };
  }

  // Run all visual tests
  async runAllTests(): Promise<void> {
    console.log('🔍 Starting Visual Testing Framework...\n');

    const tests = [
      this.testDropdownPositioning(<AdminNav />),
      this.testResponsiveLayout(<AdminNav />),
      this.testNavigationSpacing(<AdminNav />),
      this.testAccessibility(<AdminNav />)
    ];

    for (const testPromise of tests) {
      const result = await testPromise;
      this.results.push(result);
      
      console.log(`${result.passed ? '✅' : '❌'} ${result.testName}`);
      if (result.issues.length > 0) {
        result.issues.forEach(issue => console.log(`   • ${issue}`));
      }
      console.log('');
    }

    this.generateReport();
  }

  // Generate comprehensive report
  private generateReport(): void {
    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.passed).length;
    const failedTests = totalTests - passedTests;

    console.log('📊 Visual Testing Report');
    console.log('=' .repeat(50));
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${passedTests}`);
    console.log(`Failed: ${failedTests}`);
    console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
    console.log('');

    if (failedTests > 0) {
      console.log('🚨 Issues Found:');
      this.results
        .filter(r => !r.passed)
        .forEach(result => {
          console.log(`\n${result.testName}:`);
          result.issues.forEach(issue => console.log(`  - ${issue}`));
        });
    } else {
      console.log('🎉 All visual tests passed!');
    }
  }

  // Get test results for programmatic access
  getResults(): VisualTestResult[] {
    return this.results;
  }
}

// Export for use in other test files
export { VisualTestingFramework };
export type { VisualTestResult };

// Auto-run tests if this file is executed directly
if (import.meta.vitest) {
  const framework = new VisualTestingFramework();
  framework.runAllTests();
}
