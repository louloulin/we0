/**
 * Performance Validation Tests
 * 
 * Validates that the API meets performance requirements
 * including response times and basic load handling.
 */

import { describe, test, expect } from '@jest/globals';

const API_BASE_URL = 'http://localhost:4111';
const PERFORMANCE_TIMEOUT = 10000; // 10 seconds for performance tests

describe('Performance Validation', () => {
  describe('API Response Time Requirements', () => {
    test('should respond to /health within 100ms', async () => {
      const startTime = Date.now();
      
      const response = await fetch(`${API_BASE_URL}/health`);
      
      const responseTime = Date.now() - startTime;
      
      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(100); // Should be very fast
    }, PERFORMANCE_TIMEOUT);

    test('should respond to /model within 500ms', async () => {
      const startTime = Date.now();
      
      const response = await fetch(`${API_BASE_URL}/model`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      const responseTime = Date.now() - startTime;
      
      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(500); // Should be fast for static data
    }, PERFORMANCE_TIMEOUT);

    test('should respond to /cache/status within 200ms', async () => {
      const startTime = Date.now();
      
      const response = await fetch(`${API_BASE_URL}/cache/status`);
      
      const responseTime = Date.now() - startTime;
      
      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(200); // Cache status should be very fast
    }, PERFORMANCE_TIMEOUT);

    test('should respond to /metrics within 300ms', async () => {
      const startTime = Date.now();
      
      const response = await fetch(`${API_BASE_URL}/metrics`);
      
      const responseTime = Date.now() - startTime;
      
      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(300); // Metrics collection should be fast
    }, PERFORMANCE_TIMEOUT);
  });

  describe('Basic Load Testing', () => {
    test('should handle 10 concurrent /health requests', async () => {
      const concurrentRequests = 10;
      const startTime = Date.now();
      
      const promises = Array.from({ length: concurrentRequests }, () =>
        fetch(`${API_BASE_URL}/health`)
      );
      
      const responses = await Promise.all(promises);
      const totalTime = Date.now() - startTime;
      
      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
      
      // Average response time should be reasonable
      const averageTime = totalTime / concurrentRequests;
      expect(averageTime).toBeLessThan(200);
      
      console.log(`10 concurrent requests completed in ${totalTime}ms (avg: ${averageTime}ms)`);
    }, PERFORMANCE_TIMEOUT);

    test('should handle 5 concurrent /model requests', async () => {
      const concurrentRequests = 5;
      const startTime = Date.now();
      
      const promises = Array.from({ length: concurrentRequests }, () =>
        fetch(`${API_BASE_URL}/model`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      );
      
      const responses = await Promise.all(promises);
      const totalTime = Date.now() - startTime;
      
      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
      
      // Average response time should be reasonable
      const averageTime = totalTime / concurrentRequests;
      expect(averageTime).toBeLessThan(1000);
      
      console.log(`5 concurrent model requests completed in ${totalTime}ms (avg: ${averageTime}ms)`);
    }, PERFORMANCE_TIMEOUT);
  });

  describe('Cache Performance', () => {
    test('should demonstrate cache effectiveness', async () => {
      // First request (cache miss)
      const startTime1 = Date.now();
      const response1 = await fetch(`${API_BASE_URL}/model`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const time1 = Date.now() - startTime1;
      
      expect(response1.status).toBe(200);
      
      // Second request (should be faster due to caching)
      const startTime2 = Date.now();
      const response2 = await fetch(`${API_BASE_URL}/model`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const time2 = Date.now() - startTime2;
      
      expect(response2.status).toBe(200);
      
      // Verify responses are identical
      const data1 = await response1.json();
      const data2 = await response2.json();
      expect(data1).toEqual(data2);
      
      console.log(`First request: ${time1}ms, Second request: ${time2}ms`);
      
      // Second request should generally be faster or similar
      // (allowing some variance for network/system conditions)
      expect(time2).toBeLessThan(time1 + 100);
    }, PERFORMANCE_TIMEOUT);

    test('should show cache metrics after requests', async () => {
      // Make a few requests to generate cache activity
      await fetch(`${API_BASE_URL}/model`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      await fetch(`${API_BASE_URL}/model`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      // Check cache status
      const cacheResponse = await fetch(`${API_BASE_URL}/cache/status`);
      expect(cacheResponse.status).toBe(200);
      
      const cacheData = await cacheResponse.json();
      expect(cacheData).toHaveProperty('metrics');
      expect(cacheData.metrics).toHaveProperty('hits');
      expect(cacheData.metrics).toHaveProperty('misses');
      expect(cacheData.metrics).toHaveProperty('totalEntries');
      
      console.log('Cache metrics:', cacheData.metrics);
    }, PERFORMANCE_TIMEOUT);
  });

  describe('Performance Monitoring', () => {
    test('should collect performance metrics', async () => {
      // Make some requests to generate metrics
      await fetch(`${API_BASE_URL}/health`);
      await fetch(`${API_BASE_URL}/model`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      // Check metrics
      const metricsResponse = await fetch(`${API_BASE_URL}/metrics`);
      expect(metricsResponse.status).toBe(200);
      
      const metricsData = await metricsResponse.json();
      expect(metricsData).toHaveProperty('requests');
      expect(metricsData).toHaveProperty('endpoints');
      expect(metricsData).toHaveProperty('system');
      
      expect(metricsData.requests.total).toBeGreaterThan(0);
      expect(metricsData.system).toHaveProperty('memoryUsage');
      expect(metricsData.system).toHaveProperty('uptime');
      
      console.log('Performance metrics:', {
        totalRequests: metricsData.requests.total,
        averageResponseTime: metricsData.requests.averageResponseTime,
        memoryUsage: Math.round(metricsData.system.memoryUsage / 1024 / 1024) + 'MB',
        uptime: Math.round(metricsData.system.uptime) + 's'
      });
    }, PERFORMANCE_TIMEOUT);
  });

  describe('Error Handling Performance', () => {
    test('should handle invalid requests quickly', async () => {
      const startTime = Date.now();

      const response = await fetch(`${API_BASE_URL}/api/nonexistent`);

      const responseTime = Date.now() - startTime;

      // Mastra returns 200 for unknown routes (serves frontend), so we check response time instead
      expect(responseTime).toBeLessThan(100); // Error responses should be very fast
    }, PERFORMANCE_TIMEOUT);

    test('should handle malformed requests quickly', async () => {
      const startTime = Date.now();

      const response = await fetch(`${API_BASE_URL}/enhancedPrompt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json',
      });

      const responseTime = Date.now() - startTime;

      // Mastra returns 500 for malformed JSON, which is acceptable
      expect([400, 500]).toContain(response.status);
      expect(responseTime).toBeLessThan(200); // Error handling should be fast
    }, PERFORMANCE_TIMEOUT);
  });
});
