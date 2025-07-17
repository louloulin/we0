/**
 * Middleware System
 * 
 * Production-ready middleware for error handling, logging, rate limiting, and CORS
 */

import { productionConfig } from '../config/production';
import { performanceService } from '../services/performance-service';

/**
 * Error Handler Middleware
 */
export function createErrorHandler() {
  return async (request: Request, next: Function) => {
    try {
      return await next(request);
    } catch (error) {
      console.error('API Error:', error);

      // Log error details in development
      if (process.env.NODE_ENV === 'development') {
        console.error('Error stack:', error instanceof Error ? error.stack : error);
      }

      if (error instanceof Error) {
        // API key related errors
        if (error.message?.includes('API key') || error.message?.includes('Unauthorized')) {
          return new Response(
            JSON.stringify({
              error: 'Authentication failed',
              message: 'Invalid or missing API key',
              code: 'AUTH_ERROR'
            }),
            {
              status: 401,
              headers: { 'Content-Type': 'application/json' }
            }
          );
        }

        // Rate limiting errors
        if (error.message?.includes('rate limit') || error.message?.includes('Too Many Requests')) {
          return new Response(
            JSON.stringify({
              error: 'Rate limit exceeded',
              message: 'Too many requests, please try again later',
              code: 'RATE_LIMIT_ERROR'
            }),
            {
              status: 429,
              headers: { 'Content-Type': 'application/json' }
            }
          );
        }

        // Stream processing errors
        if (error.message?.includes('pipe response') || error.message?.includes('stream')) {
          return new Response(
            JSON.stringify({
              error: 'Stream processing error',
              message: 'Failed to process streaming response',
              code: 'STREAM_ERROR'
            }),
            {
              status: 500,
              headers: { 'Content-Type': 'application/json' }
            }
          );
        }

        // Content length errors
        if (error.message?.includes('Maximum segments reached') || error.message?.includes('too long')) {
          return new Response(
            JSON.stringify({
              error: 'Content too long',
              message: 'Response content exceeds maximum length',
              code: 'CONTENT_LENGTH_ERROR'
            }),
            {
              status: 413,
              headers: { 'Content-Type': 'application/json' }
            }
          );
        }

        // Validation errors
        if (error.message?.includes('validation') || error.message?.includes('invalid')) {
          return new Response(
            JSON.stringify({
              error: 'Validation error',
              message: error.message,
              code: 'VALIDATION_ERROR'
            }),
            {
              status: 400,
              headers: { 'Content-Type': 'application/json' }
            }
          );
        }

        // Timeout errors
        if (error.message?.includes('timeout') || error.message?.includes('ETIMEDOUT')) {
          return new Response(
            JSON.stringify({
              error: 'Request timeout',
              message: 'Request took too long to process',
              code: 'TIMEOUT_ERROR'
            }),
            {
              status: 408,
              headers: { 'Content-Type': 'application/json' }
            }
          );
        }
      }

      // Generic server error
      return new Response(
        JSON.stringify({
          error: 'Internal server error',
          message: process.env.NODE_ENV === 'development' 
            ? (error instanceof Error ? error.message : String(error))
            : 'An unexpected error occurred',
          code: 'INTERNAL_ERROR'
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  };
}

/**
 * CORS Middleware
 */
export function createCORSHandler() {
  const corsConfig = productionConfig.server.cors;

  return async (request: Request, next: Function) => {
    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': corsConfig.origin.includes('*') ? '*' : corsConfig.origin.join(','),
          'Access-Control-Allow-Methods': corsConfig.methods.join(','),
          'Access-Control-Allow-Headers': corsConfig.headers.join(','),
          'Access-Control-Allow-Credentials': corsConfig.credentials.toString(),
          'Access-Control-Max-Age': '86400', // 24 hours
        },
      });
    }

    // Process the request
    const response = await next(request);

    // Add CORS headers to response
    const headers = new Headers(response.headers);
    headers.set('Access-Control-Allow-Origin', corsConfig.origin.includes('*') ? '*' : corsConfig.origin.join(','));
    headers.set('Access-Control-Allow-Credentials', corsConfig.credentials.toString());

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  };
}

/**
 * Request Logger Middleware
 */
export function createRequestLogger() {
  return async (request: Request, next: Function) => {
    const startTime = Date.now();
    const method = request.method;
    const url = new URL(request.url);
    const path = url.pathname;

    // Log request start
    if (productionConfig.monitoring.logLevel === 'debug') {
      console.log(`📥 ${method} ${path} - Started`);
    }

    try {
      const response = await next(request);
      const duration = Date.now() - startTime;
      const status = response.status;

      // Log request completion
      const logLevel = status >= 400 ? 'error' : status >= 300 ? 'warn' : 'info';
      
      if (shouldLog(logLevel)) {
        const statusEmoji = status >= 400 ? '❌' : status >= 300 ? '⚠️' : '✅';
        console.log(`${statusEmoji} ${method} ${path} - ${status} - ${duration}ms`);
      }

      return response;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`💥 ${method} ${path} - ERROR - ${duration}ms:`, error);
      throw error;
    }
  };
}

/**
 * Rate Limiter Middleware (Simple in-memory implementation)
 */
export function createRateLimiter() {
  const requests = new Map<string, { count: number; resetTime: number }>();
  const config = productionConfig.server.rateLimit;

  return async (request: Request, next: Function) => {
    // Skip rate limiting in development
    if (process.env.NODE_ENV === 'development') {
      return next(request);
    }

    const clientIP = getClientIP(request);
    const now = Date.now();
    const windowStart = now - config.windowMs;

    // Clean up old entries
    for (const [ip, data] of requests.entries()) {
      if (data.resetTime < now) {
        requests.delete(ip);
      }
    }

    // Get or create client data
    let clientData = requests.get(clientIP);
    if (!clientData || clientData.resetTime < now) {
      clientData = { count: 0, resetTime: now + config.windowMs };
      requests.set(clientIP, clientData);
    }

    // Check rate limit
    if (clientData.count >= config.max) {
      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded',
          message: config.message,
          retryAfter: Math.ceil((clientData.resetTime - now) / 1000),
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': Math.ceil((clientData.resetTime - now) / 1000).toString(),
            'X-RateLimit-Limit': config.max.toString(),
            'X-RateLimit-Remaining': Math.max(0, config.max - clientData.count - 1).toString(),
            'X-RateLimit-Reset': clientData.resetTime.toString(),
          },
        }
      );
    }

    // Increment counter
    clientData.count++;

    // Add rate limit headers to response
    const response = await next(request);
    const headers = new Headers(response.headers);
    headers.set('X-RateLimit-Limit', config.max.toString());
    headers.set('X-RateLimit-Remaining', Math.max(0, config.max - clientData.count).toString());
    headers.set('X-RateLimit-Reset', clientData.resetTime.toString());

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  };
}

/**
 * Performance Monitoring Middleware
 */
export function createPerformanceMonitor() {
  return async (request: Request, next: Function) => {
    const startTime = Date.now();
    const url = new URL(request.url);
    const endpoint = url.pathname;
    const method = request.method;

    try {
      const response = await next(request);
      const responseTime = Date.now() - startTime;

      // Record request metrics
      performanceService.recordRequest({
        endpoint,
        method,
        statusCode: response.status,
        responseTime,
        userId: request.headers.get('userId') || undefined,
        model: request.headers.get('X-Model') || undefined,
        cached: response.headers.get('X-Cache-Hit') === 'true',
      });

      return response;
    } catch (error) {
      const responseTime = Date.now() - startTime;

      // Record error metrics
      performanceService.recordRequest({
        endpoint,
        method,
        statusCode: 500,
        responseTime,
        userId: request.headers.get('userId') || undefined,
        model: request.headers.get('X-Model') || undefined,
        cached: false,
      });

      throw error;
    }
  };
}

/**
 * Health Check Middleware
 */
export function createHealthCheck() {
  return async (request: Request, next: Function) => {
    const url = new URL(request.url);

    if (url.pathname === productionConfig.monitoring.healthCheckEndpoint) {
      const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        environment: process.env.NODE_ENV || 'development',
        version: process.env.npm_package_version || '1.0.0',
      };

      return new Response(JSON.stringify(health), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return next(request);
  };
}

/**
 * Helper Functions
 */
function getClientIP(request: Request): string {
  // Try to get IP from various headers
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }

  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  if (cfConnectingIP) {
    return cfConnectingIP;
  }

  // Fallback to a default IP
  return '127.0.0.1';
}

function shouldLog(level: string): boolean {
  const levels = ['debug', 'info', 'warn', 'error'];
  const currentLevel = productionConfig.monitoring.logLevel;
  return levels.indexOf(level) >= levels.indexOf(currentLevel);
}

/**
 * Combine all middleware
 */
export function createMiddlewareStack() {
  return [
    createHealthCheck(),
    createCORSHandler(),
    createPerformanceMonitor(),
    createRequestLogger(),
    createRateLimiter(),
    createErrorHandler(),
  ];
}
