'use client';

import { useEffect, useState } from 'react';
import { useWebVitals } from '@/hooks/usePerformance';

interface PerformanceMetrics {
  FCP?: number;  // First Contentful Paint
  LCP?: number;  // Largest Contentful Paint
  FID?: number;  // First Input Delay
  CLS?: number;  // Cumulative Layout Shift
  TTFB?: number; // Time to First Byte
  memoryUsage?: number;
  connectionSpeed?: string;
}

export default function PerformanceMonitor({ 
  show = false,
  position = 'bottom-right' 
}: { 
  show?: boolean;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}) {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({});
  const [isVisible, setIsVisible] = useState(show);

  // 收集 Web Vitals
  useWebVitals((metric) => {
    setMetrics(prev => ({
      ...prev,
      [metric.name]: Math.round(metric.value)
    }));
  });

  useEffect(() => {
    // 监控内存使用（如果支持）
    const monitorMemory = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        setMetrics(prev => ({
          ...prev,
          memoryUsage: Math.round(memory.usedJSHeapSize / 1048576) // MB
        }));
      }
    };

    // 监控网络连接
    const monitorConnection = () => {
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        setMetrics(prev => ({
          ...prev,
          connectionSpeed: connection.effectiveType
        }));
      }
    };

    monitorMemory();
    monitorConnection();

    const interval = setInterval(monitorMemory, 5000);
    return () => clearInterval(interval);
  }, []);

  // 只在开发环境显示
  if (process.env.NODE_ENV === 'production' && !show) {
    return null;
  }

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 bg-blue-500 text-white px-3 py-1 rounded-md text-xs shadow-lg hover:bg-blue-600 z-50"
      >
        显示性能
      </button>
    );
  }

  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
  };

  const getMetricColor = (metric: string, value: number): string => {
    const thresholds: Record<string, { good: number; moderate: number }> = {
      FCP: { good: 1800, moderate: 3000 },
      LCP: { good: 2500, moderate: 4000 },
      FID: { good: 100, moderate: 300 },
      CLS: { good: 0.1, moderate: 0.25 },
      TTFB: { good: 800, moderate: 1800 },
    };

    const threshold = thresholds[metric];
    if (!threshold) return 'text-gray-600';

    if (value <= threshold.good) return 'text-green-600';
    if (value <= threshold.moderate) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div 
      className={`fixed ${positionClasses[position]} bg-white shadow-lg rounded-lg p-4 z-50 min-w-[200px] border border-gray-200`}
    >
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-semibold text-gray-800">性能指标</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-gray-600"
        >
          ×
        </button>
      </div>
      
      <div className="space-y-1 text-xs">
        {metrics.FCP !== undefined && (
          <div className="flex justify-between">
            <span className="text-gray-600">FCP:</span>
            <span className={getMetricColor('FCP', metrics.FCP)}>
              {metrics.FCP}ms
            </span>
          </div>
        )}
        
        {metrics.LCP !== undefined && (
          <div className="flex justify-between">
            <span className="text-gray-600">LCP:</span>
            <span className={getMetricColor('LCP', metrics.LCP)}>
              {metrics.LCP}ms
            </span>
          </div>
        )}
        
        {metrics.FID !== undefined && (
          <div className="flex justify-between">
            <span className="text-gray-600">FID:</span>
            <span className={getMetricColor('FID', metrics.FID)}>
              {metrics.FID}ms
            </span>
          </div>
        )}
        
        {metrics.CLS !== undefined && (
          <div className="flex justify-between">
            <span className="text-gray-600">CLS:</span>
            <span className={getMetricColor('CLS', metrics.CLS)}>
              {metrics.CLS.toFixed(3)}
            </span>
          </div>
        )}
        
        {metrics.TTFB !== undefined && (
          <div className="flex justify-between">
            <span className="text-gray-600">TTFB:</span>
            <span className={getMetricColor('TTFB', metrics.TTFB)}>
              {metrics.TTFB}ms
            </span>
          </div>
        )}
        
        {metrics.memoryUsage !== undefined && (
          <div className="flex justify-between border-t pt-1 mt-1">
            <span className="text-gray-600">内存:</span>
            <span className="text-gray-800">{metrics.memoryUsage}MB</span>
          </div>
        )}
        
        {metrics.connectionSpeed && (
          <div className="flex justify-between">
            <span className="text-gray-600">网络:</span>
            <span className="text-gray-800">{metrics.connectionSpeed}</span>
          </div>
        )}
      </div>

      <div className="mt-3 pt-2 border-t text-xs text-gray-500">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
          <span>良好</span>
          <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
          <span>需改进</span>
          <span className="w-2 h-2 bg-red-500 rounded-full"></span>
          <span>较差</span>
        </div>
      </div>
    </div>
  );
}