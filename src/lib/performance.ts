// Performance monitoring utilities for free hosting optimization

export function measurePerformance<T>(
  operation: () => Promise<T>,
  operationName: string
): Promise<T> {
  const start = Date.now()
  
  return operation().finally(() => {
    const duration = Date.now() - start
    console.log(`[Performance] ${operationName}: ${duration}ms`)
    
    // Log slow operations
    if (duration > 5000) {
      console.warn(`[Performance] Slow operation detected: ${operationName} took ${duration}ms`)
    }
  })
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}