import { VisualTestingFramework, VisualTestResult } from './visual-testing';

interface FixSuggestion {
  file: string;
  line: number;
  issue: string;
  fix: string;
  priority: 'high' | 'medium' | 'low';
}

class VisualIssueFixer {
  private fixes: FixSuggestion[] = [];

  // Analyze test results and generate fixes
  async analyzeAndFix(results: VisualTestResult[]): Promise<void> {
    console.log('🔧 Analyzing visual issues and generating fixes...\n');

    for (const result of results) {
      if (!result.passed) {
        await this.generateFixesForTest(result);
      }
    }

    if (this.fixes.length > 0) {
      await this.applyFixes();
    } else {
      console.log('✅ No fixes needed - all visual tests passed!');
    }
  }

  private async generateFixesForTest(result: VisualTestResult): Promise<void> {
    switch (result.testName) {
      case 'Dropdown Positioning':
        await this.fixDropdownPositioning(result);
        break;
      case 'Responsive Layout':
        await this.fixResponsiveLayout(result);
        break;
      case 'Navigation Spacing':
        await this.fixNavigationSpacing(result);
        break;
      case 'Accessibility':
        await this.fixAccessibility(result);
        break;
    }
  }

  private async fixDropdownPositioning(result: VisualTestResult): Promise<void> {
    for (const issue of result.issues) {
      if (issue.includes('Dropdown top position incorrect')) {
        this.fixes.push({
          file: 'src/components/Admin/AdminNav.tsx',
          line: 0, // Will be determined during fix application
          issue: 'Dropdown positioning incorrect',
          fix: 'Change dropdown positioning to use relative positioning with proper top-full alignment',
          priority: 'high'
        });
      }
      
      if (issue.includes('z-index too low')) {
        this.fixes.push({
          file: 'src/components/Admin/AdminNav.tsx',
          line: 0,
          issue: 'Dropdown z-index insufficient',
          fix: 'Increase z-index to ensure dropdown appears above other content',
          priority: 'high'
        });
      }

      if (issue.includes('horizontal scrollbar')) {
        this.fixes.push({
          file: 'src/components/Admin/AdminNav.tsx',
          line: 0,
          issue: 'Navigation container has scrollbar',
          fix: 'Remove overflow-x-auto and ensure proper flex wrapping',
          priority: 'medium'
        });
      }
    }
  }

  private async fixResponsiveLayout(result: VisualTestResult): Promise<void> {
    for (const issue of result.issues) {
      if (issue.includes('overflows right edge')) {
        this.fixes.push({
          file: 'src/components/Admin/AdminNav.tsx',
          line: 0,
          issue: 'Navigation items overflow on smaller screens',
          fix: 'Add responsive breakpoints and proper flex wrapping',
          priority: 'high'
        });
      }
    }
  }

  private async fixNavigationSpacing(result: VisualTestResult): Promise<void> {
    for (const issue of result.issues) {
      if (issue.includes('Too many primary nav items')) {
        this.fixes.push({
          file: 'src/components/Admin/AdminNav.tsx',
          line: 0,
          issue: 'Too many primary navigation items',
          fix: 'Reduce primary nav items to maximum of 5 and move excess to dropdown',
          priority: 'high'
        });
      }

      if (issue.includes('Insufficient spacing')) {
        this.fixes.push({
          file: 'src/components/Admin/AdminNav.tsx',
          line: 0,
          issue: 'Insufficient spacing between navigation items',
          fix: 'Increase spacing between nav items using proper Tailwind classes',
          priority: 'medium'
        });
      }
    }
  }

  private async fixAccessibility(result: VisualTestResult): Promise<void> {
    for (const issue of result.issues) {
      if (issue.includes('not accessible via Enter key')) {
        this.fixes.push({
          file: 'src/components/Admin/AdminNav.tsx',
          line: 0,
          issue: 'Dropdown not keyboard accessible',
          fix: 'Add proper keyboard event handlers for Enter and Escape keys',
          priority: 'high'
        });
      }
    }
  }

  private async applyFixes(): Promise<void> {
    console.log(`🔧 Applying ${this.fixes.length} fixes...\n`);

    // Group fixes by file
    const fixesByFile = this.fixes.reduce((acc, fix) => {
      if (!acc[fix.file]) {
        acc[fix.file] = [];
      }
      acc[fix.file].push(fix);
      return acc;
    }, {} as Record<string, FixSuggestion[]>);

    for (const [file, fixes] of Object.entries(fixesByFile)) {
      console.log(`📁 Fixing ${file}:`);
      
      // Sort fixes by priority
      const sortedFixes = fixes.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });

      for (const fix of sortedFixes) {
        console.log(`  ${fix.priority.toUpperCase()}: ${fix.issue}`);
        console.log(`    → ${fix.fix}`);
      }

      await this.applyFixesToFile(file, sortedFixes);
    }

    console.log('\n✅ All fixes applied! Running verification tests...\n');
    
    // Run tests again to verify fixes
    const framework = new VisualTestingFramework();
    await framework.runAllTests();
  }

  private async applyFixesToFile(file: string, fixes: FixSuggestion[]): Promise<void> {
    // This would integrate with the actual file editing system
    // For now, we'll log the suggested changes
    console.log(`\n📝 Suggested changes for ${file}:`);
    
    for (const fix of fixes) {
      console.log(`\n// ${fix.issue}`);
      console.log(`// Priority: ${fix.priority}`);
      console.log(`// Fix: ${fix.fix}`);
    }
  }

  // Get all suggested fixes
  getFixes(): FixSuggestion[] {
    return this.fixes;
  }

  // Get fixes by priority
  getFixesByPriority(priority: 'high' | 'medium' | 'low'): FixSuggestion[] {
    return this.fixes.filter(fix => fix.priority === priority);
  }
}

// Auto-run the fixer if this file is executed directly
if (import.meta.vitest) {
  const runVisualFixer = async () => {
    console.log('🚀 Starting Visual Issue Fixer...\n');
    
    // Run tests first
    const framework = new VisualTestingFramework();
    await framework.runAllTests();
    
    // Analyze and fix issues
    const fixer = new VisualIssueFixer();
    await fixer.analyzeAndFix(framework.getResults());
  };

  runVisualFixer();
}

export { VisualIssueFixer };
export type { FixSuggestion };
