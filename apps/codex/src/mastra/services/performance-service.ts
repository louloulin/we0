/**
 * Performance Monitoring Service
 * 
 * Tracks API performance, response times, and system metrics
 * to ensure optimal performance and identify bottlenecks.
 */

export interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  tags?: Record<string, string>;
}

export interface RequestMetrics {
  endpoint: string;
  method: string;
  statusCode: number;
  responseTime: number;
  timestamp: number;
  userId?: string;
  model?: string;
  cached?: boolean;
}

export interface SystemMetrics {
  cpuUsage: number;
  memoryUsage: number;
  heapUsed: number;
  heapTotal: number;
  uptime: number;
  timestamp: number;
}

export interface PerformanceStats {
  requests: {
    total: number;
    successful: number;
    failed: number;
    averageResponseTime: number;
    p95ResponseTime: number;
    p99ResponseTime: number;
    requestsPerSecond: number;
  };
  endpoints: Record<string, {
    count: number;
    averageResponseTime: number;
    errorRate: number;
  }>;
  models: Record<string, {
    count: number;
    averageResponseTime: number;
    cacheHitRate: number;
  }>;
  system: SystemMetrics;
}

/**
 * Performance monitoring and metrics collection service
 */
export class PerformanceService {
  private metrics: PerformanceMetric[] = [];
  private requestMetrics: RequestMetrics[] = [];
  private readonly maxMetrics = 10000; // Keep last 10k metrics
  private readonly maxAge = 24 * 60 * 60 * 1000; // 24 hours
  private cleanupInterval?: NodeJS.Timeout;
  private metricsInterval?: NodeJS.Timeout;

  constructor() {
    // Clean up old metrics every hour
    this.cleanupInterval = setInterval(() => this.cleanup(), 60 * 60 * 1000);

    // Collect system metrics every 30 seconds
    this.metricsInterval = setInterval(() => this.collectSystemMetrics(), 30 * 1000);
  }

  /**
   * Record a performance metric
   */
  recordMetric(name: string, value: number, tags?: Record<string, string>): void {
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      tags,
    };

    this.metrics.push(metric);
    this.enforceRetentionPolicy();
  }

  /**
   * Record request metrics
   */
  recordRequest(metrics: Omit<RequestMetrics, 'timestamp'>): void {
    const requestMetric: RequestMetrics = {
      ...metrics,
      timestamp: Date.now(),
    };

    this.requestMetrics.push(requestMetric);
    this.enforceRetentionPolicy();
  }

  /**
   * Start timing a request
   */
  startTimer(name: string): () => number {
    const startTime = process.hrtime.bigint();
    
    return () => {
      const endTime = process.hrtime.bigint();
      const duration = Number(endTime - startTime) / 1000000; // Convert to milliseconds
      this.recordMetric(name, duration);
      return duration;
    };
  }

  /**
   * Middleware for automatic request timing
   */
  createTimingMiddleware() {
    return async (c: any, next: () => Promise<void>) => {
      const startTime = Date.now();
      const endpoint = c.req.path;
      const method = c.req.method;
      
      try {
        await next();
        
        const responseTime = Date.now() - startTime;
        const statusCode = c.res.status || 200;
        
        this.recordRequest({
          endpoint,
          method,
          statusCode,
          responseTime,
          userId: c.req.header('userId'),
          model: c.req.header('X-Model'),
          cached: c.res.headers.get('X-Cache-Hit') === 'true',
        });
        
      } catch (error) {
        const responseTime = Date.now() - startTime;
        
        this.recordRequest({
          endpoint,
          method,
          statusCode: 500,
          responseTime,
          userId: c.req.header('userId'),
          model: c.req.header('X-Model'),
          cached: false,
        });
        
        throw error;
      }
    };
  }

  /**
   * Collect system metrics
   */
  private collectSystemMetrics(): void {
    const memUsage = process.memoryUsage();
    
    this.recordMetric('system.memory.rss', memUsage.rss);
    this.recordMetric('system.memory.heapUsed', memUsage.heapUsed);
    this.recordMetric('system.memory.heapTotal', memUsage.heapTotal);
    this.recordMetric('system.memory.external', memUsage.external);
    this.recordMetric('system.uptime', process.uptime());
    
    // CPU usage (simplified - would need more sophisticated monitoring in production)
    const cpuUsage = process.cpuUsage();
    this.recordMetric('system.cpu.user', cpuUsage.user);
    this.recordMetric('system.cpu.system', cpuUsage.system);
  }

  /**
   * Clean up old metrics
   */
  private cleanup(): void {
    const cutoff = Date.now() - this.maxAge;
    
    this.metrics = this.metrics.filter(m => m.timestamp > cutoff);
    this.requestMetrics = this.requestMetrics.filter(m => m.timestamp > cutoff);
  }

  /**
   * Enforce retention policy
   */
  private enforceRetentionPolicy(): void {
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
    
    if (this.requestMetrics.length > this.maxMetrics) {
      this.requestMetrics = this.requestMetrics.slice(-this.maxMetrics);
    }
  }

  /**
   * Calculate percentile from array of numbers
   */
  private calculatePercentile(values: number[], percentile: number): number {
    if (values.length === 0) return 0;
    
    const sorted = values.sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  /**
   * Get performance statistics
   */
  getStats(timeRange?: number): PerformanceStats {
    const cutoff = timeRange ? Date.now() - timeRange : 0;
    const recentRequests = this.requestMetrics.filter(m => m.timestamp > cutoff);
    const recentMetrics = this.metrics.filter(m => m.timestamp > cutoff);

    // Request statistics
    const responseTimes = recentRequests.map(r => r.responseTime);
    const successfulRequests = recentRequests.filter(r => r.statusCode < 400);
    const failedRequests = recentRequests.filter(r => r.statusCode >= 400);

    // Calculate requests per second
    const timeSpan = timeRange || (24 * 60 * 60 * 1000); // Default to 24 hours
    const requestsPerSecond = recentRequests.length / (timeSpan / 1000);

    // Endpoint statistics
    const endpointStats: Record<string, any> = {};
    for (const request of recentRequests) {
      if (!endpointStats[request.endpoint]) {
        endpointStats[request.endpoint] = {
          requests: [],
          errors: 0,
        };
      }
      
      endpointStats[request.endpoint].requests.push(request.responseTime);
      if (request.statusCode >= 400) {
        endpointStats[request.endpoint].errors++;
      }
    }

    const endpoints: Record<string, any> = {};
    for (const [endpoint, stats] of Object.entries(endpointStats)) {
      const requests = (stats as any).requests;
      endpoints[endpoint] = {
        count: requests.length,
        averageResponseTime: requests.reduce((a: number, b: number) => a + b, 0) / requests.length || 0,
        errorRate: (stats as any).errors / requests.length || 0,
      };
    }

    // Model statistics
    const modelStats: Record<string, any> = {};
    for (const request of recentRequests.filter(r => r.model)) {
      if (!modelStats[request.model!]) {
        modelStats[request.model!] = {
          requests: [],
          cached: 0,
        };
      }
      
      modelStats[request.model!].requests.push(request.responseTime);
      if (request.cached) {
        modelStats[request.model!].cached++;
      }
    }

    const models: Record<string, any> = {};
    for (const [model, stats] of Object.entries(modelStats)) {
      const requests = (stats as any).requests;
      models[model] = {
        count: requests.length,
        averageResponseTime: requests.reduce((a: number, b: number) => a + b, 0) / requests.length || 0,
        cacheHitRate: (stats as any).cached / requests.length || 0,
      };
    }

    // System metrics
    const latestSystemMetrics = recentMetrics.filter(m => m.name.startsWith('system.'));
    const systemMetrics: SystemMetrics = {
      cpuUsage: 0, // Would need more sophisticated CPU monitoring
      memoryUsage: this.getLatestMetricValue(latestSystemMetrics, 'system.memory.rss'),
      heapUsed: this.getLatestMetricValue(latestSystemMetrics, 'system.memory.heapUsed'),
      heapTotal: this.getLatestMetricValue(latestSystemMetrics, 'system.memory.heapTotal'),
      uptime: this.getLatestMetricValue(latestSystemMetrics, 'system.uptime'),
      timestamp: Date.now(),
    };

    return {
      requests: {
        total: recentRequests.length,
        successful: successfulRequests.length,
        failed: failedRequests.length,
        averageResponseTime: responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length || 0,
        p95ResponseTime: this.calculatePercentile(responseTimes, 95),
        p99ResponseTime: this.calculatePercentile(responseTimes, 99),
        requestsPerSecond,
      },
      endpoints,
      models,
      system: systemMetrics,
    };
  }

  /**
   * Get latest value for a metric
   */
  private getLatestMetricValue(metrics: PerformanceMetric[], name: string): number {
    const filtered = metrics.filter(m => m.name === name);
    return filtered.length > 0 ? filtered[filtered.length - 1].value : 0;
  }

  /**
   * Get raw metrics for external monitoring systems
   */
  getMetrics(timeRange?: number): PerformanceMetric[] {
    const cutoff = timeRange ? Date.now() - timeRange : 0;
    return this.metrics.filter(m => m.timestamp > cutoff);
  }

  /**
   * Get request metrics for analysis
   */
  getRequestMetrics(timeRange?: number): RequestMetrics[] {
    const cutoff = timeRange ? Date.now() - timeRange : 0;
    return this.requestMetrics.filter(m => m.timestamp > cutoff);
  }

  /**
   * Destroy the performance service and clean up resources
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = undefined;
    }
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = undefined;
    }
    this.metrics = [];
    this.requestMetrics = [];
  }
}

// Global performance service instance
export const performanceService = new PerformanceService();

// Clean up global instance on process exit
if (typeof process !== 'undefined') {
  process.on('exit', () => {
    performanceService.destroy();
  });
  process.on('SIGINT', () => {
    performanceService.destroy();
    process.exit(0);
  });
  process.on('SIGTERM', () => {
    performanceService.destroy();
    process.exit(0);
  });
}

export default performanceService;
