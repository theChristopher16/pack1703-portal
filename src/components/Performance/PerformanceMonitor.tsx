import React, { useEffect, useState } from 'react';
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';
import { TrendingUp, Clock, Zap, Target } from 'lucide-react';

interface PerformanceMetrics {
  cls: number | null;
  fid: number | null;
  fcp: number | null;
  lcp: number | null;
  ttfb: number | null;
}

const PerformanceMonitor: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    cls: null,
    fid: null,
    fcp: null,
    lcp: null,
    ttfb: null
  });

  useEffect(() => {
    // Measure Core Web Vitals
    getCLS((metric) => {
      setMetrics(prev => ({ ...prev, cls: metric.value }));
      console.log('CLS:', metric);
    });

    getFID((metric) => {
      setMetrics(prev => ({ ...prev, fid: metric.value }));
      console.log('FID:', metric);
    });

    getFCP((metric) => {
      setMetrics(prev => ({ ...prev, fcp: metric.value }));
      console.log('FCP:', metric);
    });

    getLCP((metric) => {
      setMetrics(prev => ({ ...prev, lcp: metric.value }));
      console.log('LCP:', metric);
    });

    getTTFB((metric) => {
      setMetrics(prev => ({ ...prev, ttfb: metric.value }));
      console.log('TTFB:', metric);
    });
  }, []);

  const getMetricStatus = (value: number | null, threshold: number, good: number) => {
    if (value === null) return 'pending';
    if (value <= good) return 'good';
    if (value <= threshold) return 'needs-improvement';
    return 'poor';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'text-green-600';
      case 'needs-improvement': return 'text-yellow-600';
      case 'poor': return 'text-red-600';
      default: return 'text-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good': return <Target className="w-4 h-4 text-green-500" />;
      case 'needs-improvement': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'poor': return <TrendingUp className="w-4 h-4 text-red-500" />;
      default: return <Zap className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-soft border border-gray-200/50 p-6">
      <div className="flex items-center space-x-2 mb-4">
        <Zap className="w-5 h-5 text-blue-500" />
        <h2 className="text-lg font-semibold text-gray-900">Performance Metrics</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* CLS - Cumulative Layout Shift */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">CLS</span>
            {getStatusIcon(getMetricStatus(metrics.cls, 0.25, 0.1))}
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {metrics.cls !== null ? metrics.cls.toFixed(3) : '...'}
          </div>
          <p className="text-xs text-gray-500">Cumulative Layout Shift</p>
          <div className="mt-2">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  getMetricStatus(metrics.cls, 0.25, 0.1) === 'good' ? 'bg-green-500' :
                  getMetricStatus(metrics.cls, 0.25, 0.1) === 'needs-improvement' ? 'bg-yellow-500' :
                  getMetricStatus(metrics.cls, 0.25, 0.1) === 'poor' ? 'bg-red-500' : 'bg-gray-300'
                }`}
                style={{ width: `${Math.min((metrics.cls || 0) * 1000, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* FID - First Input Delay */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">FID</span>
            {getStatusIcon(getMetricStatus(metrics.fid, 300, 100))}
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {metrics.fid !== null ? `${metrics.fid.toFixed(0)}ms` : '...'}
          </div>
          <p className="text-xs text-gray-500">First Input Delay</p>
          <div className="mt-2">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  getMetricStatus(metrics.fid, 300, 100) === 'good' ? 'bg-green-500' :
                  getMetricStatus(metrics.fid, 300, 100) === 'needs-improvement' ? 'bg-yellow-500' :
                  getMetricStatus(metrics.fid, 300, 100) === 'poor' ? 'bg-red-500' : 'bg-gray-300'
                }`}
                style={{ width: `${Math.min((metrics.fid || 0) / 3, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* LCP - Largest Contentful Paint */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">LCP</span>
            {getStatusIcon(getMetricStatus(metrics.lcp, 4000, 2500))}
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {metrics.lcp !== null ? `${metrics.lcp.toFixed(0)}ms` : '...'}
          </div>
          <p className="text-xs text-gray-500">Largest Contentful Paint</p>
          <div className="mt-2">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  getMetricStatus(metrics.lcp, 4000, 2500) === 'good' ? 'bg-green-500' :
                  getMetricStatus(metrics.lcp, 4000, 2500) === 'needs-improvement' ? 'bg-yellow-500' :
                  getMetricStatus(metrics.lcp, 4000, 2500) === 'poor' ? 'bg-red-500' : 'bg-gray-300'
                }`}
                style={{ width: `${Math.min((metrics.lcp || 0) / 40, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-700">
          <strong>Performance Targets:</strong> CLS &lt; 0.1, FID &lt; 100ms, LCP &lt; 2.5s
        </p>
      </div>
    </div>
  );
};

export default PerformanceMonitor;
