import { useCallback, useMemo, useRef, useEffect } from 'react';
import { debounce } from '@/lib/utils';

/**
 * 性能优化 Hooks 集合
 */

// 防抖 Hook
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// 节流 Hook
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const lastRun = useRef(Date.now());

  return useCallback(
    (...args: Parameters<T>) => {
      if (Date.now() - lastRun.current >= delay) {
        callback(...args);
        lastRun.current = Date.now();
      }
    },
    [callback, delay]
  ) as T;
}

// 懒加载图片 Hook
export function useLazyLoadImage(src: string, placeholder?: string) {
  const [imageSrc, setImageSrc] = useState(placeholder || '');
  const [isLoading, setIsLoading] = useState(true);
  const imgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = new Image();
            img.src = src;
            img.onload = () => {
              setImageSrc(src);
              setIsLoading(false);
            };
            observer.disconnect();
          }
        });
      },
      { threshold: 0.1 }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [src]);

  return { imageSrc, isLoading, imgRef };
}

// 虚拟滚动 Hook
export function useVirtualScroll<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number
) {
  const [scrollTop, setScrollTop] = useState(0);

  const startIndex = useMemo(
    () => Math.floor(scrollTop / itemHeight),
    [scrollTop, itemHeight]
  );

  const endIndex = useMemo(
    () => Math.min(
      items.length - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight)
    ),
    [scrollTop, containerHeight, itemHeight, items.length]
  );

  const visibleItems = useMemo(
    () => items.slice(startIndex, endIndex + 1),
    [items, startIndex, endIndex]
  );

  const totalHeight = items.length * itemHeight;
  const offsetY = startIndex * itemHeight;

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return {
    visibleItems,
    totalHeight,
    offsetY,
    handleScroll,
    startIndex,
    endIndex
  };
}

// 内存缓存 Hook
export function useMemoryCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 5 * 60 * 1000 // 默认5分钟
) {
  const cache = useRef<Map<string, { data: T; timestamp: number }>>(new Map());
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    const cached = cache.current.get(key);
    
    if (cached && Date.now() - cached.timestamp < ttl) {
      setData(cached.data);
      return cached.data;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await fetcher();
      cache.current.set(key, { data: result, timestamp: Date.now() });
      setData(result);
      return result;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [key, fetcher, ttl]);

  const clearCache = useCallback(() => {
    cache.current.delete(key);
  }, [key]);

  return { data, loading, error, fetchData, clearCache };
}

// Web Vitals 监控 Hook
export function useWebVitals(callback?: (metric: any) => void) {
  useEffect(() => {
    const reportWebVitals = async () => {
      if (typeof window !== 'undefined') {
        const { getCLS, getFID, getFCP, getLCP, getTTFB } = await import('web-vitals');
        
        const handleMetric = (metric: any) => {
          console.log(`${metric.name}: ${metric.value}`);
          callback?.(metric);
        };

        getCLS(handleMetric);
        getFID(handleMetric);
        getFCP(handleMetric);
        getLCP(handleMetric);
        getTTFB(handleMetric);
      }
    };

    reportWebVitals();
  }, [callback]);
}

// 预加载资源 Hook
export function usePreloadResources(resources: string[]) {
  useEffect(() => {
    resources.forEach((resource) => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = resource;
      document.head.appendChild(link);
    });
  }, [resources]);
}

// 性能观察者 Hook
export function usePerformanceObserver(
  callback: (entries: PerformanceEntry[]) => void,
  options: PerformanceObserverInit
) {
  useEffect(() => {
    if (!('PerformanceObserver' in window)) return;

    const observer = new PerformanceObserver((list) => {
      callback(list.getEntries());
    });

    observer.observe(options);

    return () => {
      observer.disconnect();
    };
  }, [callback, options]);
}

import { useState } from 'react';