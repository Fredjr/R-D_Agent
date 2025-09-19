import React, { memo, useState, useEffect, useCallback } from 'react';
import { pubmedCache } from '@/utils/pubmedCache';

interface PerformanceMetrics {
  renderTime: number;
  networkLoadTime: number;
  cacheHitRate: number;
  memoryUsage: number;
  nodeCount: number;
  edgeCount: number;
  fps: number;
  lastUpdate: number;
}

interface PerformanceMonitorProps {
  visible?: boolean;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  onToggle?: () => void;
}

// Hook for performance monitoring
export const usePerformanceMonitor = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderTime: 0,
    networkLoadTime: 0,
    cacheHitRate: 0,
    memoryUsage: 0,
    nodeCount: 0,
    edgeCount: 0,
    fps: 0,
    lastUpdate: Date.now()
  });

  const [isMonitoring, setIsMonitoring] = useState(false);
  const frameCount = React.useRef(0);
  const lastFrameTime = React.useRef(performance.now());

  // FPS monitoring
  const measureFPS = useCallback(() => {
    const now = performance.now();
    frameCount.current++;
    
    if (now - lastFrameTime.current >= 1000) {
      const fps = Math.round((frameCount.current * 1000) / (now - lastFrameTime.current));
      setMetrics(prev => ({ ...prev, fps }));
      frameCount.current = 0;
      lastFrameTime.current = now;
    }
    
    if (isMonitoring) {
      requestAnimationFrame(measureFPS);
    }
  }, [isMonitoring]);

  // Memory usage monitoring
  const measureMemoryUsage = useCallback(() => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const usedMB = Math.round(memory.usedJSHeapSize / 1024 / 1024);
      setMetrics(prev => ({ ...prev, memoryUsage: usedMB }));
    }
  }, []);

  // Cache metrics monitoring
  const measureCacheMetrics = useCallback(() => {
    const cacheStats = pubmedCache.getStats();
    const hitRate = cacheStats.totalRequests > 0 
      ? Math.round(cacheStats.hitRate) 
      : 0;
    
    setMetrics(prev => ({ 
      ...prev, 
      cacheHitRate: hitRate,
      lastUpdate: Date.now()
    }));
  }, []);

  // Start monitoring
  const startMonitoring = useCallback(() => {
    setIsMonitoring(true);
    measureFPS();
    
    const interval = setInterval(() => {
      measureMemoryUsage();
      measureCacheMetrics();
    }, 1000);

    return () => {
      clearInterval(interval);
      setIsMonitoring(false);
    };
  }, [measureFPS, measureMemoryUsage, measureCacheMetrics]);

  // Record render time
  const recordRenderTime = useCallback((time: number) => {
    setMetrics(prev => ({ ...prev, renderTime: time }));
  }, []);

  // Record network load time
  const recordNetworkLoadTime = useCallback((time: number) => {
    setMetrics(prev => ({ ...prev, networkLoadTime: time }));
  }, []);

  // Update node/edge counts
  const updateCounts = useCallback((nodeCount: number, edgeCount: number) => {
    setMetrics(prev => ({ ...prev, nodeCount, edgeCount }));
  }, []);

  return {
    metrics,
    isMonitoring,
    startMonitoring,
    recordRenderTime,
    recordNetworkLoadTime,
    updateCounts
  };
};

// Performance monitor component
export const PerformanceMonitor = memo<PerformanceMonitorProps>(({
  visible = false,
  position = 'top-right',
  onToggle
}) => {
  const { metrics, isMonitoring, startMonitoring } = usePerformanceMonitor();
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (visible && !isMonitoring) {
      const cleanup = startMonitoring();
      return cleanup;
    }
  }, [visible, isMonitoring, startMonitoring]);

  if (!visible) return null;

  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4'
  };

  const getPerformanceColor = (value: number, thresholds: [number, number]) => {
    if (value >= thresholds[1]) return 'text-red-600';
    if (value >= thresholds[0]) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <div className={`fixed ${positionClasses[position]} z-50`}>
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
        {/* Header */}
        <div 
          className="flex items-center justify-between p-3 bg-gray-50 cursor-pointer"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isMonitoring ? 'bg-green-500' : 'bg-gray-400'}`} />
            <span className="text-sm font-medium text-gray-700">Performance</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`text-xs font-mono ${getPerformanceColor(metrics.fps, [30, 60])}`}>
              {metrics.fps} FPS
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggle?.();
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
        </div>

        {/* Expanded metrics */}
        {expanded && (
          <div className="p-3 space-y-2 text-xs">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-gray-500">Render Time</div>
                <div className={`font-mono ${getPerformanceColor(metrics.renderTime, [16, 33])}`}>
                  {metrics.renderTime.toFixed(1)}ms
                </div>
              </div>
              
              <div>
                <div className="text-gray-500">Network Load</div>
                <div className={`font-mono ${getPerformanceColor(metrics.networkLoadTime, [1000, 3000])}`}>
                  {metrics.networkLoadTime.toFixed(0)}ms
                </div>
              </div>
              
              <div>
                <div className="text-gray-500">Cache Hit Rate</div>
                <div className={`font-mono ${getPerformanceColor(100 - metrics.cacheHitRate, [30, 50])}`}>
                  {metrics.cacheHitRate}%
                </div>
              </div>
              
              <div>
                <div className="text-gray-500">Memory Usage</div>
                <div className={`font-mono ${getPerformanceColor(metrics.memoryUsage, [50, 100])}`}>
                  {metrics.memoryUsage}MB
                </div>
              </div>
              
              <div>
                <div className="text-gray-500">Nodes</div>
                <div className="font-mono text-gray-700">
                  {metrics.nodeCount}
                </div>
              </div>
              
              <div>
                <div className="text-gray-500">Edges</div>
                <div className="font-mono text-gray-700">
                  {metrics.edgeCount}
                </div>
              </div>
            </div>

            {/* Cache details */}
            <div className="pt-2 border-t border-gray-200">
              <div className="text-gray-500 mb-1">Cache Stats</div>
              <div className="text-xs text-gray-600">
                Last updated: {new Date(metrics.lastUpdate).toLocaleTimeString()}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

PerformanceMonitor.displayName = 'PerformanceMonitor';

// Performance wrapper for components
interface PerformanceWrapperProps {
  name: string;
  children: React.ReactNode;
  onMetrics?: (metrics: { renderTime: number }) => void;
}

export const PerformanceWrapper = memo<PerformanceWrapperProps>(({
  name,
  children,
  onMetrics
}) => {
  const renderStartTime = React.useRef<number | undefined>(undefined);

  useEffect(() => {
    renderStartTime.current = performance.now();
  });

  useEffect(() => {
    if (renderStartTime.current) {
      const renderTime = performance.now() - renderStartTime.current;
      onMetrics?.({ renderTime });
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`🎯 ${name} render time: ${renderTime.toFixed(2)}ms`);
      }
    }
  });

  return <>{children}</>;
});

PerformanceWrapper.displayName = 'PerformanceWrapper';

// Hook for measuring async operations
export const useAsyncPerformance = () => {
  const measureAsync = useCallback(async <T,>(
    operation: () => Promise<T>,
    name: string
  ): Promise<T> => {
    const startTime = performance.now();
    
    try {
      const result = await operation();
      const duration = performance.now() - startTime;
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`⚡ ${name} completed in ${duration.toFixed(2)}ms`);
      }
      
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      console.error(`❌ ${name} failed after ${duration.toFixed(2)}ms:`, error);
      throw error;
    }
  }, []);

  return { measureAsync };
};

// Performance optimization utilities
export const PerformanceUtils = {
  // Debounce function for expensive operations
  debounce: <T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): ((...args: Parameters<T>) => void) => {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  },

  // Throttle function for frequent operations
  throttle: <T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): ((...args: Parameters<T>) => void) => {
    let inThrottle: boolean;
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },

  // Batch DOM updates
  batchUpdates: (updates: (() => void)[]): void => {
    requestAnimationFrame(() => {
      updates.forEach(update => update());
    });
  },

  // Check if element is in viewport
  isInViewport: (element: HTMLElement): boolean => {
    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  }
};
