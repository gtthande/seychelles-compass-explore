// Performance monitoring utilities
export const performanceLog = (message: string, startTime?: number) => {
  if (import.meta.env.DEV) {
    if (startTime) {
      const duration = performance.now() - startTime;
      console.log(`⚡ ${message} - ${duration.toFixed(2)}ms`);
    } else {
      console.log(`⚡ ${message}`);
    }
  }
};

export const measurePerformance = (name: string, fn: () => void) => {
  if (import.meta.env.DEV) {
    const start = performance.now();
    fn();
    const end = performance.now();
    console.log(`⚡ ${name} took ${(end - start).toFixed(2)}ms`);
  } else {
    fn();
  }
};

export const createPerformanceTimer = (name: string) => {
  const start = performance.now();
  return () => {
    const duration = performance.now() - start;
    if (import.meta.env.DEV) {
      console.log(`⚡ ${name} completed in ${duration.toFixed(2)}ms`);
    }
    return duration;
  };
};
