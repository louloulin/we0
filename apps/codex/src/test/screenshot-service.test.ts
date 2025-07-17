/**
 * Screenshot Service Tests
 * 
 * Tests for screenshot service functionality
 * Uses mocks to avoid actual API calls during testing
 */

import { describe, test, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { ScreenshotService, takeScreenshot, takeFullPageScreenshot, takeMobileScreenshot } from '../mastra/services/screenshot-service';

// Mock fetch globally
const mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>;
global.fetch = mockFetch;

describe('ScreenshotService', () => {
  let service: ScreenshotService;

  beforeEach(() => {
    service = new ScreenshotService('test-api-key');
    mockFetch.mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    test('should initialize with API key', () => {
      const serviceWithKey = new ScreenshotService('my-api-key');
      expect(serviceWithKey.isConfigured()).toBe(true);
    });

    test('should initialize without API key', () => {
      const serviceWithoutKey = new ScreenshotService();
      expect(serviceWithoutKey.isConfigured()).toBe(false);
    });

    test('should use environment variable for API key', () => {
      const originalEnv = process.env.SCREENSHOTONE_API_KEY;
      process.env.SCREENSHOTONE_API_KEY = 'env-api-key';
      
      const serviceFromEnv = new ScreenshotService();
      expect(serviceFromEnv.isConfigured()).toBe(true);
      
      process.env.SCREENSHOTONE_API_KEY = originalEnv;
    });
  });

  describe('validateUrl', () => {
    test('should validate correct HTTP URLs', () => {
      expect(service.validateUrl('http://example.com')).toBe(true);
      expect(service.validateUrl('https://example.com')).toBe(true);
      expect(service.validateUrl('https://example.com/path?query=1')).toBe(true);
    });

    test('should reject invalid URLs', () => {
      expect(service.validateUrl('ftp://example.com')).toBe(false);
      expect(service.validateUrl('not-a-url')).toBe(false);
      expect(service.validateUrl('')).toBe(false);
      expect(service.validateUrl('javascript:alert(1)')).toBe(false);
    });
  });

  describe('captureScreenshot', () => {
    test('should return error when API key is not configured', async () => {
      const serviceWithoutKey = new ScreenshotService('   '); // whitespace only

      const result = await serviceWithoutKey.captureScreenshot({
        url: 'https://example.com'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('API key not configured');
    });

    test('should return error for invalid URL', async () => {
      const result = await service.captureScreenshot({
        url: 'invalid-url'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid URL');
    });

    test('should successfully capture screenshot', async () => {
      const mockImageBuffer = Buffer.from('fake-image-data');
      const mockApiResponse = {
        url: 'https://api.screenshotone.com/image/123.png'
      };

      // Mock API response
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockApiResponse),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          arrayBuffer: () => Promise.resolve(mockImageBuffer.buffer),
        } as Response);

      const result = await service.captureScreenshot({
        url: 'https://example.com'
      });

      expect(result.success).toBe(true);
      expect(result.dataUrl).toContain('data:image/png;base64,');
      expect(result.metadata).toBeDefined();
      expect(result.metadata!.format).toBe('png');
    });

    test('should handle API errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
      } as Response);

      const result = await service.captureScreenshot({
        url: 'https://example.com'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('ScreenshotOne API error');
    });

    test('should handle API error responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ error: 'Invalid URL' }),
      } as Response);

      const result = await service.captureScreenshot({
        url: 'https://example.com'
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid URL');
    });

    test('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await service.captureScreenshot({
        url: 'https://example.com'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
    });
  });

  describe('captureScreenshotWithRetry', () => {
    test('should retry on failure and eventually succeed', async () => {
      const mockImageBuffer = Buffer.from('fake-image-data');
      const mockApiResponse = {
        url: 'https://api.screenshotone.com/image/123.png'
      };

      // First call fails, second succeeds
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockApiResponse),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          arrayBuffer: () => Promise.resolve(mockImageBuffer.buffer),
        } as Response);

      const result = await service.captureScreenshotWithRetry({
        url: 'https://example.com'
      }, 2, 100);

      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(3); // 1 failed + 2 successful
    });

    test('should fail after max retries', async () => {
      mockFetch.mockRejectedValue(new Error('Persistent error'));

      const result = await service.captureScreenshotWithRetry({
        url: 'https://example.com'
      }, 2, 100);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed after 2 attempts');
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('utility methods', () => {
    test('processImageData should create valid data URL', () => {
      const buffer = Buffer.from('test-data');
      const dataUrl = service.processImageData(buffer, 'png');
      
      expect(dataUrl).toMatch(/^data:image\/png;base64,/);
      expect(dataUrl).toContain(buffer.toString('base64'));
    });

    test('extractBase64FromDataUrl should extract base64 data', () => {
      const base64Data = 'dGVzdC1kYXRh'; // 'test-data' in base64
      const dataUrl = `data:image/png;base64,${base64Data}`;
      
      const extracted = service.extractBase64FromDataUrl(dataUrl);
      expect(extracted).toBe(base64Data);
    });

    test('getImageMetadata should parse data URL metadata', () => {
      const dataUrl = 'data:image/jpeg;base64,dGVzdC1kYXRh';
      const metadata = service.getImageMetadata(dataUrl);
      
      expect(metadata).toBeDefined();
      expect(metadata!.mimeType).toBe('image/jpeg');
      expect(metadata!.format).toBe('jpeg');
      expect(metadata!.size).toBeGreaterThan(0);
    });

    test('validateScreenshotResult should validate results', () => {
      const validResult = {
        success: true,
        dataUrl: 'data:image/png;base64,dGVzdA==',
      };
      
      const invalidResult = {
        success: false,
        error: 'Test error',
      };

      expect(service.validateScreenshotResult(validResult)).toBe(true);
      expect(service.validateScreenshotResult(invalidResult)).toBe(false);
    });

    test('createMockScreenshot should create valid mock', () => {
      const mock = service.createMockScreenshot(800, 600);
      
      expect(mock.success).toBe(true);
      expect(mock.dataUrl).toMatch(/^data:image\/png;base64,/);
      expect(mock.metadata!.width).toBe(800);
      expect(mock.metadata!.height).toBe(600);
    });

    test('getStatus should return service status', () => {
      const status = service.getStatus();
      
      expect(status.configured).toBe(true);
      expect(status.apiKey).toContain('test-api');
    });
  });

  describe('convenience functions', () => {
    test('takeScreenshot should work with configured service', async () => {
      // Mock the global service to have an API key
      const originalApiKey = (global as any).process?.env?.SCREENSHOTONE_API_KEY;
      process.env.SCREENSHOTONE_API_KEY = 'test-key';

      const mockImageBuffer = Buffer.from('fake-image-data');
      const mockApiResponse = {
        url: 'https://api.screenshotone.com/image/123.png'
      };

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockApiResponse),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          arrayBuffer: () => Promise.resolve(mockImageBuffer.buffer),
        } as Response);

      const result = await takeScreenshot('https://example.com');
      expect(result.success).toBe(true);

      // Restore original env
      if (originalApiKey) {
        process.env.SCREENSHOTONE_API_KEY = originalApiKey;
      } else {
        delete process.env.SCREENSHOTONE_API_KEY;
      }
    });

    test('takeFullPageScreenshot should set fullPage option', async () => {
      // Mock the global service to have an API key
      const originalApiKey = process.env.SCREENSHOTONE_API_KEY;
      process.env.SCREENSHOTONE_API_KEY = 'test-key';

      const mockImageBuffer = Buffer.from('fake-image-data');
      const mockApiResponse = {
        url: 'https://api.screenshotone.com/image/123.png'
      };

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockApiResponse),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          arrayBuffer: () => Promise.resolve(mockImageBuffer.buffer),
        } as Response);

      const result = await takeFullPageScreenshot('https://example.com');
      expect(result.success).toBe(true);

      // Check that the API was called with fullPage=true
      const apiCall = mockFetch.mock.calls[mockFetch.mock.calls.length - 2][0] as string;
      expect(apiCall).toContain('full_page=true');

      // Restore original env
      if (originalApiKey) {
        process.env.SCREENSHOTONE_API_KEY = originalApiKey;
      } else {
        delete process.env.SCREENSHOTONE_API_KEY;
      }
    });

    test('takeMobileScreenshot should set mobile dimensions', async () => {
      // Mock the global service to have an API key
      const originalApiKey = process.env.SCREENSHOTONE_API_KEY;
      process.env.SCREENSHOTONE_API_KEY = 'test-key';

      const mockImageBuffer = Buffer.from('fake-image-data');
      const mockApiResponse = {
        url: 'https://api.screenshotone.com/image/123.png'
      };

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockApiResponse),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          arrayBuffer: () => Promise.resolve(mockImageBuffer.buffer),
        } as Response);

      const result = await takeMobileScreenshot('https://example.com');
      expect(result.success).toBe(true);

      // Check that the API was called with mobile dimensions
      const apiCall = mockFetch.mock.calls[mockFetch.mock.calls.length - 2][0] as string;
      expect(apiCall).toContain('viewport_width=375');
      expect(apiCall).toContain('viewport_height=812');

      // Restore original env
      if (originalApiKey) {
        process.env.SCREENSHOTONE_API_KEY = originalApiKey;
      } else {
        delete process.env.SCREENSHOTONE_API_KEY;
      }
    });
  });
});
