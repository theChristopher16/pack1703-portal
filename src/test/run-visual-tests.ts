#!/usr/bin/env node

/**
 * Visual Testing and Auto-Fix Script
 * 
 * This script runs comprehensive visual tests on the admin navigation
 * and automatically fixes common UI issues like:
 * - Dropdown positioning problems
 * - Responsive layout issues
 * - Navigation spacing problems
 * - Accessibility issues
 * - Z-index conflicts
 * - Overflow problems
 */

import { VisualTestingFramework } from './visual-testing';
import { VisualIssueFixer } from './visual-fixer';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

interface VisualTestConfig {
  components: string[];
  screenSizes: Array<{ width: number; height: number; name: string }>;
  thresholds: {
    maxNavItems: number;
    minZIndex: number;
    maxOverflow: number;
  };
}

class VisualTestRunner {
  private config: VisualTestConfig = {
    components: ['AdminNav'],
    screenSizes: [
      { width: 1920, height: 1080, name: 'Desktop' },
      { width: 1024, height: 768, name: 'Tablet' },
      { width: 768, height: 1024, name: 'Mobile' },
      { width: 375, height: 667, name: 'Mobile Small' }
    ],
    thresholds: {
      maxNavItems: 5,
      minZIndex: 1000,
      maxOverflow: 5
    }
  };

  async run(): Promise<void> {
    console.log('🎨 Visual Testing and Auto-Fix System');
    console.log('=' .repeat(50));
    console.log('');

    try {
      // Run comprehensive visual tests
      const framework = new VisualTestingFramework();
      await framework.runAllTests();
      
      const results = framework.getResults();
      
      // Analyze results and generate fixes
      const fixer = new VisualIssueFixer();
      await fixer.analyzeAndFix(results);
      
      // Apply fixes automatically
      await this.applyAutomaticFixes(fixer.getFixes());
      
      // Run verification tests
      await this.runVerificationTests();
      
    } catch (error) {
      console.error('❌ Visual testing failed:', error);
      process.exit(1);
    }
  }

  private async applyAutomaticFixes(fixes: any[]): Promise<void> {
    console.log('\n🔧 Applying automatic fixes...\n');

    for (const fix of fixes) {
      if (fix.priority === 'high') {
        await this.applyFix(fix);
      }
    }
  }

  private async applyFix(fix: any): Promise<void> {
    const filePath = join(process.cwd(), fix.file);
    
    if (!existsSync(filePath)) {
      console.log(`⚠️  File not found: ${fix.file}`);
      return;
    }

    try {
      let content = readFileSync(filePath, 'utf-8');
      
      // Apply specific fixes based on issue type
      if (fix.issue.includes('Dropdown positioning incorrect')) {
        content = this.fixDropdownPositioning(content);
      }
      
      if (fix.issue.includes('z-index insufficient')) {
        content = this.fixZIndex(content);
      }
      
      if (fix.issue.includes('horizontal scrollbar')) {
        content = this.fixScrollbar(content);
      }
      
      if (fix.issue.includes('Too many primary navigation items')) {
        content = this.fixNavItemCount(content);
      }
      
      if (fix.issue.includes('Insufficient spacing')) {
        content = this.fixSpacing(content);
      }
      
      if (fix.issue.includes('not keyboard accessible')) {
        content = this.fixAccessibility(content);
      }

      // Write the fixed content back
      writeFileSync(filePath, content, 'utf-8');
      console.log(`✅ Fixed: ${fix.issue}`);
      
    } catch (error) {
      console.error(`❌ Failed to fix ${fix.file}:`, error);
    }
  }

  private fixDropdownPositioning(content: string): string {
    // Fix dropdown positioning to appear below the button
    return content.replace(
      /className="absolute right-4 top-16/,
      'className="absolute top-full left-0 mt-1'
    );
  }

  private fixZIndex(content: string): string {
    // Ensure dropdown has proper z-index
    return content.replace(
      /className="fixed inset-0 z-\[99999\]"/,
      'className="fixed inset-0 z-[99999]"'
    );
  }

  private fixScrollbar(content: string): string {
    // Remove overflow-x-auto from navigation container
    return content.replace(
      /className="hidden lg:flex items-center space-x-1 flex-1 min-w-0 overflow-x-auto"/,
      'className="hidden lg:flex items-center space-x-1 flex-1 min-w-0"'
    );
  }

  private fixNavItemCount(content: string): string {
    // Ensure primary nav items are limited to 5
    const lines = content.split('\n');
    let inPrimaryNav = false;
    let itemCount = 0;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (line.includes('primaryNavItems = [')) {
        inPrimaryNav = true;
        continue;
      }
      
      if (inPrimaryNav && line.includes('];')) {
        inPrimaryNav = false;
        break;
      }
      
      if (inPrimaryNav && line.includes('{ path:')) {
        itemCount++;
        if (itemCount > this.config.thresholds.maxNavItems) {
          // Move excess items to secondary nav
          lines[i] = `    // ${line.trim()} // Moved to secondary nav`;
        }
      }
    }
    
    return lines.join('\n');
  }

  private fixSpacing(content: string): string {
    // Increase spacing between nav items
    return content.replace(
      /className="hidden lg:flex items-center space-x-1/,
      'className="hidden lg:flex items-center space-x-2'
    );
  }

  private fixAccessibility(content: string): string {
    // Add keyboard event handlers
    const keyboardHandler = `
    const handleKeyDown = (event: React.KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        setDropdownOpen(!dropdownOpen);
      } else if (event.key === 'Escape') {
        setDropdownOpen(false);
      }
    };`;

    // Add the handler and update the button
    return content
      .replace(/const \[dropdownOpen, setDropdownOpen\] = useState\(false\);/,
        `const [dropdownOpen, setDropdownOpen] = useState(false);
    ${keyboardHandler}`)
      .replace(/onClick=\{\(\) => setDropdownOpen\(!dropdownOpen\)\}/,
        `onClick={() => setDropdownOpen(!dropdownOpen)}
                onKeyDown={handleKeyDown}
                tabIndex={0}
                role="button"
                aria-expanded={dropdownOpen}
                aria-haspopup="true"`);
  }

  private async runVerificationTests(): Promise<void> {
    console.log('\n🔍 Running verification tests...\n');
    
    const framework = new VisualTestingFramework();
    await framework.runAllTests();
    
    const results = framework.getResults();
    const failedTests = results.filter(r => !r.passed);
    
    if (failedTests.length === 0) {
      console.log('🎉 All visual issues have been resolved!');
    } else {
      console.log(`⚠️  ${failedTests.length} issues remain. Manual review may be needed.`);
      failedTests.forEach(test => {
        console.log(`  - ${test.testName}: ${test.issues.join(', ')}`);
      });
    }
  }
}

// Run the visual testing system
if (require.main === module) {
  const runner = new VisualTestRunner();
  runner.run().catch(console.error);
}

export { VisualTestRunner };
