import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Volume2, VolumeX, Keyboard, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

interface AccessibilityIssue {
  id: string;
  type: 'error' | 'warning' | 'info';
  message: string;
  element?: string;
  wcag?: string;
  impact: 'high' | 'medium' | 'low';
}

const AccessibilityAudit: React.FC = () => {
  const [issues, setIssues] = useState<AccessibilityIssue[]>([]);
  const [isAuditing, setIsAuditing] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [largeText, setLargeText] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    // Check for user preferences
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setReducedMotion(prefersReducedMotion);
  }, []);

  const runAccessibilityAudit = () => {
    setIsAuditing(true);
    const newIssues: AccessibilityIssue[] = [];

    // Check for missing alt text on images
    const images = document.querySelectorAll('img');
    images.forEach((img, index) => {
      if (!img.alt && !img.getAttribute('aria-label')) {
        newIssues.push({
          id: `img-${index}`,
          type: 'error',
          message: 'Image missing alt text or aria-label',
          element: img.outerHTML.substring(0, 100),
          wcag: '1.1.1',
          impact: 'high'
        });
      }
    });

    // Check for proper heading hierarchy
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    let previousLevel = 0;
    headings.forEach((heading, index) => {
      const level = parseInt(heading.tagName.charAt(1));
      if (level > previousLevel + 1) {
        newIssues.push({
          id: `heading-${index}`,
          type: 'warning',
          message: `Heading level skipped from h${previousLevel} to h${level}`,
          element: heading.outerHTML.substring(0, 100),
          wcag: '1.3.1',
          impact: 'medium'
        });
      }
      previousLevel = level;
    });

    // Check for proper form labels
    const formControls = document.querySelectorAll('input, select, textarea');
    formControls.forEach((control, index) => {
      const id = control.getAttribute('id');
      const label = document.querySelector(`label[for="${id}"]`);
      const ariaLabel = control.getAttribute('aria-label');
      
      if (!label && !ariaLabel && !control.getAttribute('aria-labelledby')) {
        newIssues.push({
          id: `form-${index}`,
          type: 'error',
          message: 'Form control missing label or aria-label',
          element: control.outerHTML.substring(0, 100),
          wcag: '3.3.2',
          impact: 'high'
        });
      }
    });

    // Check for sufficient color contrast (simplified)
    const textElements = document.querySelectorAll('p, span, div, h1, h2, h3, h4, h5, h6');
    textElements.forEach((element, index) => {
      const style = window.getComputedStyle(element);
      const color = style.color;
      const backgroundColor = style.backgroundColor;
      
      // This is a simplified check - in production you'd use a proper contrast checker
      if (color === backgroundColor) {
        newIssues.push({
          id: `contrast-${index}`,
          type: 'warning',
          message: 'Potential color contrast issue detected',
          element: element.outerHTML.substring(0, 100),
          wcag: '1.4.3',
          impact: 'medium'
        });
      }
    });

    // Check for keyboard navigation
    const interactiveElements = document.querySelectorAll('button, a, input, select, textarea');
    interactiveElements.forEach((element, index) => {
      if (!element.hasAttribute('tabindex') && element.getAttribute('tabindex') !== '0') {
        // Check if element is naturally focusable
        const tagName = element.tagName.toLowerCase();
        if (tagName === 'div' || tagName === 'span') {
          newIssues.push({
            id: `keyboard-${index}`,
            type: 'warning',
            message: 'Interactive element may not be keyboard accessible',
            element: element.outerHTML.substring(0, 100),
            wcag: '2.1.1',
            impact: 'medium'
          });
        }
      }
    });

    setIssues(newIssues);
    setIsAuditing(false);
  };

  const toggleHighContrast = () => {
    setHighContrast(!highContrast);
    document.documentElement.classList.toggle('high-contrast');
  };

  const toggleLargeText = () => {
    setLargeText(!largeText);
    document.documentElement.classList.toggle('large-text');
  };

  const getIssueIcon = (type: string) => {
    switch (type) {
      case 'error': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'info': return <CheckCircle className="w-4 h-4 text-blue-500" />;
      default: return <CheckCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-soft border border-gray-200/50 p-6">
      <div className="flex items-center space-x-2 mb-6">
        <Eye className="w-5 h-5 text-blue-500" />
        <h2 className="text-lg font-semibold text-gray-900">Accessibility Audit</h2>
      </div>

      {/* Accessibility Controls */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <button
          onClick={toggleHighContrast}
          className={`p-3 rounded-lg border transition-colors duration-200 ${
            highContrast 
              ? 'bg-blue-500 text-white border-blue-500' 
              : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
          }`}
        >
          <div className="flex items-center space-x-2">
            {highContrast ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            <span className="text-sm font-medium">High Contrast</span>
          </div>
        </button>

        <button
          onClick={toggleLargeText}
          className={`p-3 rounded-lg border transition-colors duration-200 ${
            largeText 
              ? 'bg-blue-500 text-white border-blue-500' 
              : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
          }`}
        >
          <div className="flex items-center space-x-2">
            <Volume2 className="w-4 h-4" />
            <span className="text-sm font-medium">Large Text</span>
          </div>
        </button>

        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-2">
            <Keyboard className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Keyboard Nav</span>
          </div>
        </div>

        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-2">
            <VolumeX className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">
              {reducedMotion ? 'Reduced Motion' : 'Motion OK'}
            </span>
          </div>
        </div>
      </div>

      {/* Audit Button */}
      <div className="text-center mb-6">
        <button
          onClick={runAccessibilityAudit}
          disabled={isAuditing}
          className="px-6 py-3 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
        >
          {isAuditing ? 'Running Audit...' : 'Run Accessibility Audit'}
        </button>
      </div>

      {/* Audit Results */}
      {issues.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Audit Results</h3>
          
          {issues.map((issue) => (
            <div key={issue.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-start space-x-3">
                {getIssueIcon(issue.type)}
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className={`text-sm font-medium ${getImpactColor(issue.impact)}`}>
                      {issue.impact.toUpperCase()}
                    </span>
                    {issue.wcag && (
                      <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">
                        WCAG {issue.wcag}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 mb-2">{issue.message}</p>
                  {issue.element && (
                    <details className="text-xs">
                      <summary className="cursor-pointer text-gray-500 hover:text-gray-700">
                        Show element
                      </summary>
                      <pre className="mt-2 p-2 bg-gray-100 rounded text-gray-600 overflow-x-auto">
                        {issue.element}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Accessibility Tips */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-semibold text-blue-900 mb-2">Accessibility Tips</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Use semantic HTML elements (header, nav, main, section, article)</li>
          <li>• Provide alt text for all images</li>
          <li>• Ensure proper heading hierarchy (h1 → h2 → h3)</li>
          <li>• Make sure all interactive elements are keyboard accessible</li>
          <li>• Maintain sufficient color contrast (4.5:1 for normal text)</li>
          <li>• Provide clear focus indicators</li>
        </ul>
      </div>
    </div>
  );
};

export default AccessibilityAudit;
