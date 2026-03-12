// Performance optimization utilities
import { useState, useEffect } from 'react';

// Debounce function for search and API calls
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Throttle function for scroll events
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Memoization helper for expensive computations
export function memoize<T extends (...args: any[]) => any>(fn: T): T {
  const cache = new Map();
  
  return ((...args: Parameters<T>) => {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key);
    }
    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as T;
}

// Virtual scrolling helper for large datasets
export interface VirtualScrollItem {
  id: string | number;
  height?: number;
  [key: string]: any;
}

export function calculateVisibleItems<T extends VirtualScrollItem>(
  items: T[],
  scrollTop: number,
  containerHeight: number,
  itemHeight: number = 50
): {
  visibleItems: T[];
  startIndex: number;
  endIndex: number;
  offsetY: number;
} {
  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(
    startIndex + Math.ceil(containerHeight / itemHeight) + 1,
    items.length
  );
  const offsetY = startIndex * itemHeight;
  
  return {
    visibleItems: items.slice(startIndex, endIndex),
    startIndex,
    endIndex,
    offsetY,
  };
}

// Image lazy loading helper
export function lazyLoadImage(
  imgElement: HTMLImageElement,
  src: string,
  placeholder?: string
): void {
  imgElement.src = placeholder || '';
  
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          img.src = src;
          img.classList.remove('lazy');
          observer.unobserve(img);
        }
      });
    },
    { rootMargin: '50px' }
  );
  
  imgElement.classList.add('lazy');
  observer.observe(imgElement);
}

// Performance monitoring
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number[]> = new Map();
  
  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }
  
  startTimer(name: string): () => void {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      if (!this.metrics.has(name)) {
        this.metrics.set(name, []);
      }
      
      this.metrics.get(name)!.push(duration);
      
      // Keep only last 100 measurements
      const measurements = this.metrics.get(name)!;
      if (measurements.length > 100) {
        measurements.shift();
      }
      
      console.log(`⏱️ ${name}: ${duration.toFixed(2)}ms`);
    };
  }
  
  getAverageTime(name: string): number {
    const measurements = this.metrics.get(name);
    if (!measurements || measurements.length === 0) {
      return 0;
    }
    
    const sum = measurements.reduce((acc, time) => acc + time, 0);
    return sum / measurements.length;
  }
  
  getMetrics(): Record<string, { average: number; count: number }> {
    const result: Record<string, { average: number; count: number }> = {};
    
    this.metrics.forEach((measurements, name) => {
      result[name] = {
        average: this.getAverageTime(name),
        count: measurements.length,
      };
    });
    
    return result;
  }
  
  clear(): void {
    this.metrics.clear();
  }
}

// React performance hooks
export function usePerformanceMonitor(componentName: string) {
  const monitor = PerformanceMonitor.getInstance();
  
  return {
    startRender: () => monitor.startTimer(`${componentName}-render`),
    startEffect: (effectName: string) => monitor.startTimer(`${componentName}-${effectName}`),
    getMetrics: () => monitor.getMetrics(),
  };
}

// Bundle size monitoring
export function trackBundleSize(): void {
  if (typeof window !== 'undefined' && 'performance' in window) {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    
    const bundleSize = {
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
      loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
      totalTime: navigation.loadEventEnd - navigation.fetchStart,
    };
    
    console.log('📊 Bundle Performance:', bundleSize);
  }
}

// Memory usage monitoring
export function trackMemoryUsage(): void {
  if ('memory' in performance) {
    const memory = (performance as any).memory;
    
    console.log('💾 Memory Usage:', {
      used: `${(memory.usedJSHeapSize / 1048576).toFixed(2)} MB`,
      total: `${(memory.totalJSHeapSize / 1048576).toFixed(2)} MB`,
      limit: `${(memory.jsHeapSizeLimit / 1048576).toFixed(2)} MB`,
    });
  }
}

// Network request optimization
export function optimizedFetch(
  url: string,
  options: RequestInit & { cacheTime?: number } = {}
): Promise<Response> {
  const cacheKey = `${url}-${JSON.stringify(options)}`;
  const cacheTime = options.cacheTime || 5 * 60 * 1000; // 5 minutes default
  
  // Check cache first
  const cached = sessionStorage.getItem(cacheKey);
  if (cached) {
    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp < cacheTime) {
      return Promise.resolve(new Response(JSON.stringify(data)));
    }
  }
  
  // Make actual request
  return fetch(url, options).then(response => {
    if (response.ok) {
      response.clone().json().then(data => {
        sessionStorage.setItem(cacheKey, JSON.stringify({
          data,
          timestamp: Date.now(),
        }));
      });
    }
    return response;
  });
}

// Infinite scroll helper
export function useInfiniteScroll(
  loadMore: () => Promise<void>,
  hasMore: boolean,
  threshold: number = 100
) {
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    const handleScroll = throttle(async () => {
      if (
        window.innerHeight + document.documentElement.scrollTop >=
        document.documentElement.offsetHeight - threshold &&
        hasMore &&
        !loading
      ) {
        setLoading(true);
        await loadMore();
        setLoading(false);
      }
    }, 200);
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loadMore, hasMore, loading, threshold]);
  
  return { loading };
}

// Form validation optimization
export function validateField(
  value: string,
  rules: Array<(value: string) => string | null>
): string | null {
  for (const rule of rules) {
    const error = rule(value);
    if (error) return error;
  }
  return null;
}

// Common validation rules
export const validationRules = {
  required: (value: string) => value.trim() ? null : 'This field is required',
  email: (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? null : 'Invalid email address',
  minLength: (min: number) => (value: string) => 
    value.length >= min ? null : `Minimum ${min} characters required`,
  maxLength: (max: number) => (value: string) => 
    value.length <= max ? null : `Maximum ${max} characters allowed`,
  numeric: (value: string) => /^\d+$/.test(value) ? null : 'Only numbers allowed',
  phone: (value: string) => /^\d{10}$/.test(value) ? null : 'Invalid phone number',
};
