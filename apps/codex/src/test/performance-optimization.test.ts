/**
 * Performance Optimization Tests
 * 
 * Tests for the new performance optimization features including
 * caching, performance monitoring, and workflow optimizations.
 */

import { describe, test, expect, beforeEach, afterEach, afterAll } from '@jest/globals';
import { CacheService } from '../mastra/services/cache-service';
import { PerformanceService } from '../mastra/services/performance-service';
import { apiOptimizationWorkflow } from '../mastra/workflows/api-optimization-workflow';

describe('Performance Optimization Features', () => {
  let testCacheService: CacheService;
  let testPerformanceService: PerformanceService;

  beforeEach(() => {
    // Create fresh instances for each test
    testCacheService = new CacheService({ ttl: 1000, maxSize: 100, enableMetrics: true });
    testPerformanceService = new PerformanceService();
  });

  afterEach(() => {
    // Clean up after each test
    testCacheService.destroy();
    testPerformanceService.destroy();
  });

  describe('Cache Service', () => {
    test('should store and retrieve cached values', () => {
      const key = 'test-key';
      const value = { message: 'test data' };

      testCacheService.set(key, value);
      const retrieved = testCacheService.get(key);

      expect(retrieved).toEqual(value);
    });

    test('should respect TTL and expire entries', async () => {
      const key = 'test-ttl';
      const value = { message: 'expires soon' };
      const shortTTL = 100; // 100ms

      testCacheService.set(key, value, shortTTL);

      // Should be available immediately
      expect(testCacheService.get(key)).toEqual(value);

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 150));

      // Should be expired
      expect(testCacheService.get(key)).toBeNull();
    });

    test('should track cache metrics', () => {
      const key1 = 'metrics-test-1';
      const key2 = 'metrics-test-2';
      const value = { data: 'test' };

      // Set some values
      testCacheService.set(key1, value);
      testCacheService.set(key2, value);

      // Get one value (hit)
      testCacheService.get(key1);

      // Try to get non-existent value (miss)
      testCacheService.get('non-existent');

      const metrics = testCacheService.getMetrics();

      expect(metrics.hits).toBe(1);
      expect(metrics.misses).toBe(1);
      expect(metrics.totalEntries).toBe(2);
      expect(metrics.hitRate).toBe(0.5);
    });

    test('should cache function results', async () => {
      let callCount = 0;
      const expensiveFunction = async () => {
        callCount++;
        return { result: 'expensive computation', timestamp: Date.now() };
      };

      const input = { param: 'test' };

      // First call should execute function
      const result1 = await testCacheService.cacheFunction('test-fn', expensiveFunction, input);
      expect(callCount).toBe(1);

      // Second call should use cache
      const result2 = await testCacheService.cacheFunction('test-fn', expensiveFunction, input);
      expect(callCount).toBe(1); // Should not increment
      expect(result2).toEqual(result1);
    });
  });

  describe('Performance Service', () => {
    test('should record performance metrics', () => {
      const metricName = 'test-metric';
      const value = 123.45;

      testPerformanceService.recordMetric(metricName, value);

      const metrics = testPerformanceService.getMetrics();
      const testMetric = metrics.find(m => m.name === metricName);

      expect(testMetric).toBeDefined();
      expect(testMetric?.value).toBe(value);
    });

    test('should record request metrics', () => {
      const requestMetrics = {
        endpoint: '/test',
        method: 'GET',
        statusCode: 200,
        responseTime: 150,
        userId: 'test-user',
        model: 'test-model',
        cached: false,
      };

      testPerformanceService.recordRequest(requestMetrics);

      const stats = testPerformanceService.getStats();

      expect(stats.requests.total).toBe(1);
      expect(stats.requests.successful).toBe(1);
      expect(stats.requests.failed).toBe(0);
      expect(stats.endpoints['/test']).toBeDefined();
      expect(stats.endpoints['/test'].count).toBe(1);
    });

    test('should calculate performance statistics', () => {
      // Record multiple requests
      const requests = [
        { endpoint: '/api/test', method: 'GET', statusCode: 200, responseTime: 100 },
        { endpoint: '/api/test', method: 'GET', statusCode: 200, responseTime: 200 },
        { endpoint: '/api/test', method: 'GET', statusCode: 500, responseTime: 300 },
        { endpoint: '/api/other', method: 'POST', statusCode: 201, responseTime: 150 },
      ];

      requests.forEach(req => testPerformanceService.recordRequest(req));

      const stats = testPerformanceService.getStats();

      expect(stats.requests.total).toBe(4);
      expect(stats.requests.successful).toBe(3);
      expect(stats.requests.failed).toBe(1);
      expect(stats.requests.averageResponseTime).toBe(187.5);
      
      expect(stats.endpoints['/api/test'].count).toBe(3);
      expect(stats.endpoints['/api/test'].errorRate).toBeCloseTo(0.333, 2);
      expect(stats.endpoints['/api/other'].count).toBe(1);
      expect(stats.endpoints['/api/other'].errorRate).toBe(0);
    });

    test('should create timing middleware', async () => {
      const middleware = testPerformanceService.createTimingMiddleware();

      let nextCalled = false;
      const mockContext = {
        req: {
          path: '/test-middleware',
          method: 'GET',
          header: () => null,
        },
        res: {
          status: 200,
          headers: new Map(),
        },
      };

      const next = async () => {
        nextCalled = true;
        // Simulate some processing time
        await new Promise(resolve => setTimeout(resolve, 50));
      };

      await middleware(mockContext, next);

      expect(nextCalled).toBe(true);

      const stats = testPerformanceService.getStats();
      expect(stats.endpoints['/test-middleware']).toBeDefined();
      expect(stats.endpoints['/test-middleware'].count).toBe(1);
    });
  });

  describe('Service Integration', () => {
    test('should integrate cache and performance monitoring', () => {
      // Test basic integration between services
      const key = 'integration-test';
      const value = { data: 'test integration' };

      // Cache some data
      testCacheService.set(key, value);
      const retrieved = testCacheService.get(key);
      expect(retrieved).toEqual(value);

      // Record some performance metrics
      testPerformanceService.recordMetric('integration.test', 100);
      const metrics = testPerformanceService.getMetrics();
      expect(metrics.length).toBeGreaterThan(0);

      // Record request metrics
      testPerformanceService.recordRequest({
        endpoint: '/integration',
        method: 'GET',
        statusCode: 200,
        responseTime: 150,
        cached: true,
      });

      const stats = testPerformanceService.getStats();
      expect(stats.requests.total).toBe(1);
      expect(stats.endpoints['/integration']).toBeDefined();
    });
  });

});
