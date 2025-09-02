import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AdminNav from '../components/Admin/AdminNav';
import { AdminProvider } from '../contexts/AdminContext';

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

interface VisualTestResult {
  testName: string;
  passed: boolean;
  issues: string[];
}

class VisualTestingFramework {
  private results: VisualTestResult[] = [];

  // Test dropdown positioning and behavior
  async testDropdownPositioning(): Promise<VisualTestResult> {
    const { container } = render(
      <BrowserRouter>
        <AdminProvider>
          <AdminNav />
        </AdminProvider>
      </BrowserRouter>
    );

    const issues: string[] = [];
    let passed = true;

    try {
      // Find the More button
      const moreButton = screen.getByText('More');
      if (!moreButton) {
        issues.push('More button not found');
        passed = false;
        return { testName: 'Dropdown Positioning', passed, issues };
      }

      // Click to open dropdown
      fireEvent.click(moreButton);
      
      await waitFor(() => {
        const dropdown = container.querySelector('[class*="absolute"]');
        if (!dropdown) {
          issues.push('Dropdown not found after click');
          passed = false;
          return;
        }

        // Test dropdown visibility
        const dropdownRect = dropdown.getBoundingClientRect();
        if (dropdownRect.width === 0 || dropdownRect.height === 0) {
          issues.push('Dropdown has zero dimensions');
          passed = false;
        }

        // Test z-index
        const zIndex = window.getComputedStyle(dropdown).zIndex;
        if (zIndex === 'auto' || parseInt(zIndex) < 1000) {
          issues.push(`Dropdown z-index too low: ${zIndex}`);
          passed = false;
        }
      });

    } catch (error) {
      issues.push(`Test error: ${error}`);
      passed = false;
    }

    return {
      testName: 'Dropdown Positioning',
      passed,
      issues
    };
  }

  // Test navigation item count
  async testNavigationSpacing(): Promise<VisualTestResult> {
    const { container } = render(
      <BrowserRouter>
        <AdminProvider>
          <AdminNav />
        </AdminProvider>
      </BrowserRouter>
    );

    const issues: string[] = [];
    let passed = true;

    try {
      // Count primary navigation items
      const primaryNavItems = container.querySelectorAll('[class*="flex-shrink-0"]');
      if (primaryNavItems.length > 5) {
        issues.push(`Too many primary nav items: ${primaryNavItems.length} (max 5)`);
        passed = false;
      }

      // Check for proper spacing classes
      const navContainer = container.querySelector('[class*="space-x-1"]');
      if (!navContainer) {
        issues.push('Navigation container missing spacing classes');
        passed = false;
      }

    } catch (error) {
      issues.push(`Test error: ${error}`);
      passed = false;
    }

    return {
      testName: 'Navigation Spacing',
      passed,
      issues
    };
  }

  // Test accessibility
  async testAccessibility(): Promise<VisualTestResult> {
    const { container } = render(
      <BrowserRouter>
        <AdminProvider>
          <AdminNav />
        </AdminProvider>
      </BrowserRouter>
    );

    const issues: string[] = [];
    let passed = true;

    try {
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

      // Test ARIA attributes
      const button = screen.getByRole('button', { name: /more/i });
      if (button) {
        const ariaExpanded = button.getAttribute('aria-expanded');
        const ariaHaspopup = button.getAttribute('aria-haspopup');
        
        if (!ariaExpanded) {
          issues.push('Missing aria-expanded attribute');
          passed = false;
        }
        
        if (!ariaHaspopup) {
          issues.push('Missing aria-haspopup attribute');
          passed = false;
        }
      }

    } catch (error) {
      issues.push(`Test error: ${error}`);
      passed = false;
    }

    return {
      testName: 'Accessibility',
      passed,
      issues
    };
  }

  // Test responsive behavior
  async testResponsiveLayout(): Promise<VisualTestResult> {
    const { container } = render(
      <BrowserRouter>
        <AdminProvider>
          <AdminNav />
        </AdminProvider>
      </BrowserRouter>
    );

    const issues: string[] = [];
    let passed = true;

    try {
      // Test for responsive classes
      const navElements = container.querySelectorAll('[class*="hidden lg:flex"]');
      if (navElements.length === 0) {
        issues.push('Missing responsive navigation classes');
        passed = false;
      }

      // Test mobile menu button
      const mobileButton = container.querySelector('[class*="lg:hidden"]');
      if (!mobileButton) {
        issues.push('Missing mobile menu button');
        passed = false;
      }

    } catch (error) {
      issues.push(`Test error: ${error}`);
      passed = false;
    }

    return {
      testName: 'Responsive Layout',
      passed,
      issues
    };
  }

  // Run all visual tests
  async runAllTests(): Promise<void> {
    console.log('🔍 Starting Visual Testing Framework...\n');

    const tests = [
      this.testDropdownPositioning(),
      this.testResponsiveLayout(),
      this.testNavigationSpacing(),
      this.testAccessibility()
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
if (typeof jest !== 'undefined') {
  describe('Visual Testing Framework', () => {
    it('should run all visual tests', async () => {
      const framework = new VisualTestingFramework();
      await framework.runAllTests();
      
      const results = framework.getResults();
      const failedTests = results.filter(r => !r.passed);
      
      expect(failedTests.length).toBe(0);
    });
  });
}
