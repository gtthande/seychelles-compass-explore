import { useEffect, useRef } from 'react';

interface PerformanceEntry {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
}

export const usePerformanceMonitor = (componentName: string) => {
  const startTime = useRef<number>(0);
  const entries = useRef<PerformanceEntry[]>([]);

  useEffect(() => {
    startTime.current = performance.now();
    console.log(`🚀 ${componentName}: Component mounting...`);

    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime.current;
      console.log(`✅ ${componentName}: Component mounted in ${duration.toFixed(2)}ms`);
    };
  }, [componentName]);

  const markStart = (name: string) => {
    const entry: PerformanceEntry = {
      name,
      startTime: performance.now()
    };
    entries.current.push(entry);
    console.log(`🚀 ${componentName}: ${name} started`);
  };

  const markEnd = (name: string) => {
    const entry = entries.current.find(e => e.name === name && !e.endTime);
    if (entry) {
      entry.endTime = performance.now();
      entry.duration = entry.endTime - entry.startTime;
      console.log(`✅ ${componentName}: ${name} completed in ${entry.duration.toFixed(2)}ms`);
    }
  };

  const getTotalTime = () => {
    const endTime = performance.now();
    return endTime - startTime.current;
  };

  return {
    markStart,
    markEnd,
    getTotalTime
  };
};
