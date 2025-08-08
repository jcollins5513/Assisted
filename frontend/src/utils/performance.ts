// Performance monitoring utilities

// Types
export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface PerformanceObserver {
  onMetric: (metric: PerformanceMetric) => void;
}

export interface PerformanceConfig {
  enabled: boolean;
  sampleRate: number; // 0-1, percentage of metrics to collect
  maxMetrics: number; // Maximum number of metrics to store
  reportInterval: number; // How often to report metrics (ms)
}

// Performance metrics
export const PERFORMANCE_METRICS = {
  // Page load metrics
  PAGE_LOAD_TIME: 'page_load_time',
  DOM_CONTENT_LOADED: 'dom_content_loaded',
  FIRST_CONTENTFUL_PAINT: 'first_contentful_paint',
  LARGEST_CONTENTFUL_PAINT: 'largest_contentful_paint',
  FIRST_INPUT_DELAY: 'first_input_delay',
  CUMULATIVE_LAYOUT_SHIFT: 'cumulative_layout_shift',
  
  // API metrics
  API_RESPONSE_TIME: 'api_response_time',
  API_SUCCESS_RATE: 'api_success_rate',
  API_ERROR_RATE: 'api_error_rate',
  
  // Component metrics
  COMPONENT_RENDER_TIME: 'component_render_time',
  COMPONENT_MOUNT_TIME: 'component_mount_time',
  
  // User interaction metrics
  CLICK_RESPONSE_TIME: 'click_response_time',
  SCROLL_PERFORMANCE: 'scroll_performance',
  
  // Memory metrics
  MEMORY_USAGE: 'memory_usage',
  HEAP_SIZE: 'heap_size',
  
  // Custom metrics
  CUSTOM_METRIC: 'custom_metric',
} as const;

// Performance monitoring class
class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private config: PerformanceConfig;
  private metrics: PerformanceMetric[] = [];
  private observers: PerformanceObserver[] = [];
  private reportTimer: NodeJS.Timeout | null = null;

  private constructor() {
    this.config = {
      enabled: true,
      sampleRate: 1.0, // Collect all metrics by default
      maxMetrics: 1000,
      reportInterval: 60000, // Report every minute
    };

    this.initialize();
  }

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  // Initialize performance monitoring
  private initialize(): void {
    if (typeof window === 'undefined' || !this.config.enabled) {
      return;
    }

    // Set up performance observers
    this.setupPerformanceObservers();
    
    // Start reporting timer
    this.startReporting();
    
    // Set up memory monitoring
    this.setupMemoryMonitoring();
  }

  // Set up performance observers
  private setupPerformanceObservers(): void {
    if (!('PerformanceObserver' in window)) {
      return;
    }

    // Observe navigation timing
    try {
      const navigationObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming;
            this.recordMetric(PERFORMANCE_METRICS.PAGE_LOAD_TIME, navEntry.loadEventEnd - navEntry.loadEventStart, 'ms');
            this.recordMetric(PERFORMANCE_METRICS.DOM_CONTENT_LOADED, navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart, 'ms');
          }
        });
      });
      navigationObserver.observe({ entryTypes: ['navigation'] });
    } catch (error) {
      console.warn('Failed to set up navigation observer:', error);
    }

    // Observe paint timing
    try {
      const paintObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.entryType === 'paint') {
            const paintEntry = entry as PerformancePaintTiming;
            if (paintEntry.name === 'first-contentful-paint') {
              this.recordMetric(PERFORMANCE_METRICS.FIRST_CONTENTFUL_PAINT, paintEntry.startTime, 'ms');
            }
          }
        });
      });
      paintObserver.observe({ entryTypes: ['paint'] });
    } catch (error) {
      console.warn('Failed to set up paint observer:', error);
    }

    // Observe largest contentful paint
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        if (lastEntry) {
          this.recordMetric(PERFORMANCE_METRICS.LARGEST_CONTENTFUL_PAINT, lastEntry.startTime, 'ms');
        }
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
    } catch (error) {
      console.warn('Failed to set up LCP observer:', error);
    }

    // Observe first input delay
    try {
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.entryType === 'first-input') {
            const fidEntry = entry as PerformanceEventTiming;
            this.recordMetric(PERFORMANCE_METRICS.FIRST_INPUT_DELAY, fidEntry.processingStart - fidEntry.startTime, 'ms');
          }
        });
      });
      fidObserver.observe({ entryTypes: ['first-input'] });
    } catch (error) {
      console.warn('Failed to set up FID observer:', error);
    }

    // Observe layout shifts
    try {
      const clsObserver = new PerformanceObserver((list) => {
        let clsValue = 0;
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.entryType === 'layout-shift' && !(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
          }
        });
        this.recordMetric(PERFORMANCE_METRICS.CUMULATIVE_LAYOUT_SHIFT, clsValue, 'score');
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
    } catch (error) {
      console.warn('Failed to set up CLS observer:', error);
    }
  }

  // Set up memory monitoring
  private setupMemoryMonitoring(): void {
    if (!('memory' in performance)) {
      return;
    }

    setInterval(() => {
      const memory = (performance as any).memory;
      if (memory) {
        this.recordMetric(PERFORMANCE_METRICS.MEMORY_USAGE, memory.usedJSHeapSize / 1024 / 1024, 'MB');
        this.recordMetric(PERFORMANCE_METRICS.HEAP_SIZE, memory.totalJSHeapSize / 1024 / 1024, 'MB');
      }
    }, 30000); // Check memory every 30 seconds
  }

  // Record a performance metric
  recordMetric(
    name: string,
    value: number,
    unit: string,
    metadata?: Record<string, any>
  ): void {
    if (!this.config.enabled || Math.random() > this.config.sampleRate) {
      return;
    }

    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: new Date(),
      metadata,
    };

    this.metrics.push(metric);

    // Limit the number of stored metrics
    if (this.metrics.length > this.config.maxMetrics) {
      this.metrics = this.metrics.slice(-this.config.maxMetrics);
    }

    // Notify observers
    this.notifyObservers(metric);
  }

  // Record API performance
  recordApiMetric(
    endpoint: string,
    responseTime: number,
    success: boolean,
    statusCode?: number
  ): void {
    this.recordMetric(PERFORMANCE_METRICS.API_RESPONSE_TIME, responseTime, 'ms', {
      endpoint,
      success,
      statusCode,
    });

    if (success) {
      this.recordMetric(PERFORMANCE_METRICS.API_SUCCESS_RATE, 1, 'count', { endpoint });
    } else {
      this.recordMetric(PERFORMANCE_METRICS.API_ERROR_RATE, 1, 'count', { endpoint });
    }
  }

  // Record component performance
  recordComponentMetric(
    componentName: string,
    renderTime: number,
    type: 'render' | 'mount' = 'render'
  ): void {
    const metricName = type === 'mount' 
      ? PERFORMANCE_METRICS.COMPONENT_MOUNT_TIME 
      : PERFORMANCE_METRICS.COMPONENT_RENDER_TIME;

    this.recordMetric(metricName, renderTime, 'ms', {
      component: componentName,
      type,
    });
  }

  // Record user interaction performance
  recordInteractionMetric(
    interactionType: string,
    responseTime: number
  ): void {
    this.recordMetric(PERFORMANCE_METRICS.CLICK_RESPONSE_TIME, responseTime, 'ms', {
      interactionType,
    });
  }

  // Start performance reporting
  private startReporting(): void {
    if (this.reportTimer) {
      clearInterval(this.reportTimer);
    }

    this.reportTimer = setInterval(() => {
      this.reportMetrics();
    }, this.config.reportInterval);
  }

  // Report metrics to analytics
  private reportMetrics(): void {
    if (this.metrics.length === 0) {
      return;
    }

    // Group metrics by name
    const metricGroups = this.metrics.reduce((groups, metric) => {
      if (!groups[metric.name]) {
        groups[metric.name] = [];
      }
      groups[metric.name].push(metric);
      return groups;
    }, {} as Record<string, PerformanceMetric[]>);

    // Calculate statistics for each metric group
    const statistics = Object.entries(metricGroups).map(([name, metrics]) => {
      const values = metrics.map(m => m.value);
      const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
      const min = Math.min(...values);
      const max = Math.max(...values);
      const p95 = this.calculatePercentile(values, 95);

      return {
        name,
        count: metrics.length,
        average: avg,
        min,
        max,
        p95,
        unit: metrics[0].unit,
        lastValue: metrics[metrics.length - 1].value,
        timestamp: new Date(),
      };
    });

    // Send to analytics
    this.sendToAnalytics(statistics);

    // Clear old metrics
    this.metrics = [];
  }

  // Calculate percentile
  private calculatePercentile(values: number[], percentile: number): number {
    const sorted = values.sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index] || 0;
  }

  // Send metrics to analytics
  private sendToAnalytics(statistics: any[]): void {
    // This would integrate with your analytics service
    // Example: Google Analytics, Mixpanel, etc.
    if (typeof window !== 'undefined' && (window as any).gtag) {
      statistics.forEach(stat => {
        (window as any).gtag('event', 'performance_metric', {
          metric_name: stat.name,
          metric_value: stat.average,
          metric_unit: stat.unit,
          metric_count: stat.count,
          metric_min: stat.min,
          metric_max: stat.max,
          metric_p95: stat.p95,
        });
      });
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Performance Metrics:', statistics);
    }
  }

  // Add observer
  addObserver(observer: PerformanceObserver): () => void {
    this.observers.push(observer);
    
    return () => {
      const index = this.observers.indexOf(observer);
      if (index > -1) {
        this.observers.splice(index, 1);
      }
    };
  }

  // Notify observers
  private notifyObservers(metric: PerformanceMetric): void {
    this.observers.forEach(observer => {
      try {
        observer.onMetric(metric);
      } catch (error) {
        console.error('Error in performance observer:', error);
      }
    });
  }

  // Get current metrics
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  // Get metrics by name
  getMetricsByName(name: string): PerformanceMetric[] {
    return this.metrics.filter(metric => metric.name === name);
  }

  // Clear metrics
  clearMetrics(): void {
    this.metrics = [];
  }

  // Update configuration
  updateConfig(config: Partial<PerformanceConfig>): void {
    this.config = { ...this.config, ...config };
    
    if (config.reportInterval) {
      this.startReporting();
    }
  }

  // Enable/disable monitoring
  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
  }

  // Destroy monitor
  destroy(): void {
    if (this.reportTimer) {
      clearInterval(this.reportTimer);
      this.reportTimer = null;
    }
    this.observers = [];
    this.metrics = [];
  }
}

// Create singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance();

// Utility functions
export function recordMetric(
  name: string,
  value: number,
  unit: string,
  metadata?: Record<string, any>
): void {
  performanceMonitor.recordMetric(name, value, unit, metadata);
}

export function recordApiMetric(
  endpoint: string,
  responseTime: number,
  success: boolean,
  statusCode?: number
): void {
  performanceMonitor.recordApiMetric(endpoint, responseTime, success, statusCode);
}

export function recordComponentMetric(
  componentName: string,
  renderTime: number,
  type?: 'render' | 'mount'
): void {
  performanceMonitor.recordComponentMetric(componentName, renderTime, type);
}

export function recordInteractionMetric(
  interactionType: string,
  responseTime: number
): void {
  performanceMonitor.recordInteractionMetric(interactionType, responseTime);
}

// React hook for performance monitoring
export function usePerformanceMonitor() {
  return {
    recordMetric,
    recordApiMetric,
    recordComponentMetric,
    recordInteractionMetric,
    addObserver: performanceMonitor.addObserver.bind(performanceMonitor),
    getMetrics: performanceMonitor.getMetrics.bind(performanceMonitor),
    getMetricsByName: performanceMonitor.getMetricsByName.bind(performanceMonitor),
    clearMetrics: performanceMonitor.clearMetrics.bind(performanceMonitor),
  };
}

// Performance measurement decorator for components
export function measurePerformance(componentName: string) {
  return function <T extends { new (...args: any[]): any }>(constructor: T) {
    return class extends constructor {
      constructor(...args: any[]) {
        const startTime = performance.now();
        super(...args);
        const endTime = performance.now();
        recordComponentMetric(componentName, endTime - startTime, 'mount');
      }
    };
  };
}

import React from 'react';

// Performance measurement hook for components
export function usePerformanceMeasurement(componentName: string) {
  const startTime = React.useRef(performance.now());

  React.useEffect(() => {
    const endTime = performance.now();
    recordComponentMetric(componentName, endTime - startTime.current, 'mount');
  }, []);

  const measureRender = React.useCallback(() => {
    const endTime = performance.now();
    recordComponentMetric(componentName, endTime - startTime.current, 'render');
    startTime.current = performance.now();
  }, [componentName]);

  return { measureRender };
}

// Export types and constants
export type { PerformanceMetric, PerformanceObserver, PerformanceConfig };
export { PERFORMANCE_METRICS };
