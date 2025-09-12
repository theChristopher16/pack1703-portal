import React, { useState, useEffect } from 'react';
import { Eye, Monitor, Smartphone, Tablet, AlertTriangle, CheckCircle } from 'lucide-react';

interface UIIssue {
  component: string;
  issue: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  fixed: boolean;
  description: string;
}

const UIAuditComponent: React.FC = () => {
  const [issues, setIssues] = useState<UIIssue[]>([]);
  const [currentViewport, setCurrentViewport] = useState('desktop');
  const [auditResults, setAuditResults] = useState<string[]>([]);

  const knownIssues: UIIssue[] = [
    {
      component: 'AdminNav',
      issue: 'Toolbar overflow',
      severity: 'high',
      fixed: true,
      description: 'Fixed: Added overflow-x-auto and flex-shrink-0 to prevent bleeding'
    },
    {
      component: 'AdminNav',
      issue: 'Portal title formatting',
      severity: 'medium',
      fixed: true,
      description: 'Fixed: Updated title to "Pack 1703 Families Portal - Admin"'
    },
    {
      component: 'All Components',
      issue: 'Custom text color classes',
      severity: 'high',
      fixed: true,
      description: 'Fixed: Replaced text-text-primary/secondary with standard Tailwind classes'
    }
  ];

  const viewportSizes = {
    mobile: { width: 375, label: 'Mobile (375px)' },
    tablet: { width: 768, label: 'Tablet (768px)' },
    desktop: { width: 1280, label: 'Desktop (1280px)' },
    wide: { width: 1920, label: 'Wide (1920px)' }
  };

  const runAutomatedAudit = () => {
    const results: string[] = [];
    
    // Check for horizontal overflow
    const overflowElements = Array.from(document.querySelectorAll('*')).filter(el => {
      return el.scrollWidth > el.clientWidth;
    });
    
    if (overflowElements.length > 0) {
      results.push(`⚠️ Found ${overflowElements.length} elements with horizontal overflow`);
    } else {
      results.push('✅ No horizontal overflow detected');
    }

    // Check for missing focus states
    const interactiveElements = document.querySelectorAll('button, a, input, select, textarea');
    const missingFocus = Array.from(interactiveElements).filter(el => {
      const styles = getComputedStyle(el, ':focus');
      return styles.outline === 'none' && !styles.boxShadow.includes('ring') && !styles.boxShadow.includes('0 0 0');
    });

    if (missingFocus.length > 0) {
      results.push(`⚠️ Found ${missingFocus.length} interactive elements missing focus states`);
    } else {
      results.push('✅ All interactive elements have focus states');
    }

    // Check for invisible text
    const textElements = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, div')).filter(el => {
      const text = el.textContent?.trim();
      if (!text || text.length === 0) return false;
      
      const styles = getComputedStyle(el);
      const color = styles.color;
      const bgColor = styles.backgroundColor;
      
      // Check for very light text on light backgrounds
      return color.includes('255, 255, 255') || color.includes('rgb(255, 255, 255)');
    });

    if (textElements.length > 0) {
      results.push(`⚠️ Found ${textElements.length} potentially invisible text elements`);
    } else {
      results.push('✅ No invisible text detected');
    }

    setAuditResults(results);
  };

  useEffect(() => {
    setIssues(knownIssues);
  }, []);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getSeverityIcon = (severity: string, fixed: boolean) => {
    if (fixed) return <CheckCircle className="w-4 h-4 text-green-600" />;
    
    switch (severity) {
      case 'critical':
      case 'high':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'medium':
        return <AlertTriangle className="w-4 h-4 text-orange-600" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-soft border border-gray-200 p-6">
      <div className="flex items-center space-x-3 mb-6">
        <Eye className="w-6 h-6 text-blue-600" />
        <h2 className="text-2xl font-display font-bold text-gray-900">UI/UX Audit Dashboard</h2>
      </div>

      {/* Viewport Testing */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Responsive Testing</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.entries(viewportSizes).map(([key, viewport]) => (
            <button
              key={key}
              onClick={() => setCurrentViewport(key)}
              className={`p-3 rounded-lg border text-sm font-medium transition-colors duration-200 ${
                currentViewport === key
                  ? 'bg-blue-500 text-white border-blue-500'
                  : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
              }`}
            >
              {key === 'mobile' && <Smartphone className="w-4 h-4 mx-auto mb-1" />}
              {key === 'tablet' && <Tablet className="w-4 h-4 mx-auto mb-1" />}
              {key === 'desktop' && <Monitor className="w-4 h-4 mx-auto mb-1" />}
              {key === 'wide' && <Monitor className="w-4 h-4 mx-auto mb-1" />}
              <div>{viewport.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Known Issues Status */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Known UI Issues</h3>
        <div className="space-y-3">
          {issues.map((issue, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border ${getSeverityColor(issue.severity)} ${
                issue.fixed ? 'opacity-60' : ''
              }`}
            >
              <div className="flex items-start space-x-3">
                {getSeverityIcon(issue.severity, issue.fixed)}
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h4 className="font-medium">{issue.component}</h4>
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-white/50">
                      {issue.severity}
                    </span>
                    {issue.fixed && (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                        FIXED
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-medium mb-1">{issue.issue}</p>
                  <p className="text-sm opacity-80">{issue.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Automated Audit */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Automated Audit</h3>
          <button
            onClick={runAutomatedAudit}
            className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors duration-200"
          >
            Run Audit
          </button>
        </div>
        
        {auditResults.length > 0 && (
          <div className="space-y-2">
            {auditResults.map((result, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg ${
                  result.startsWith('✅') 
                    ? 'bg-green-50 text-green-800 border border-green-200' 
                    : 'bg-orange-50 text-orange-800 border border-orange-200'
                }`}
              >
                {result}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Fixes Applied */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-green-900 mb-3 flex items-center">
          <CheckCircle className="w-5 h-5 mr-2" />
          Recent Fixes Applied
        </h3>
        <ul className="space-y-2 text-sm text-green-800">
          <li>✅ Fixed admin login white text visibility issues</li>
          <li>✅ Fixed admin toolbar bleeding off page</li>
          <li>✅ Fixed "Pack 1703 Families Portal" title formatting</li>
          <li>✅ Replaced all custom text-text-* classes with standard Tailwind</li>
          <li>✅ Added responsive overflow handling to admin navigation</li>
          <li>✅ Improved mobile responsiveness across components</li>
        </ul>
      </div>

      {/* Browser Console Audit Script */}
      <div className="mt-8 bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Browser Console Audit</h3>
        <p className="text-sm text-gray-600 mb-3">
          Copy and paste this script into your browser console to run additional checks:
        </p>
        <pre className="bg-gray-800 text-green-400 p-4 rounded-lg text-sm overflow-x-auto">
{`// UI Audit Script
console.log('🔍 Running UI Audit...');

// Check for horizontal overflow
const overflow = Array.from(document.querySelectorAll('*'))
  .filter(el => el.scrollWidth > el.clientWidth);
console.log('📏 Overflow elements:', overflow.length);

// Check for invisible text
const invisible = Array.from(document.querySelectorAll('*'))
  .filter(el => {
    const styles = getComputedStyle(el);
    return styles.color.includes('255, 255, 255') && 
           el.textContent?.trim().length > 0;
  });
console.log('👻 Invisible text elements:', invisible.length);

// Check for missing focus states
const noFocus = Array.from(document.querySelectorAll('button, a, input'))
  .filter(el => getComputedStyle(el, ':focus').outline === 'none');
console.log('🎯 Missing focus states:', noFocus.length);

console.log('✅ Audit complete!');`}
        </pre>
      </div>
    </div>
  );
};

export default UIAuditComponent;

