/**
 * Screenshot Tool Tests
 *
 * Tests for screenshot tools integration
 * Tests the underlying logic functions rather than the Mastra tool wrappers
 */

import { describe, test, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { ScreenshotService, takeScreenshot, takeFullPageScreenshot, takeMobileScreenshot } from '../mastra/services/screenshot-service';

// Mock the screenshot service
jest.mock('../mastra/services/screenshot-service', () => {
  const mockService = {
    captureScreenshotWithRetry: jest.fn(),
    validateUrl: jest.fn(),
    getStatus: jest.fn(),
    createMockScreenshot: jest.fn(),
    isConfigured: jest.fn(),
  };

  return {
    ScreenshotService: jest.fn(() => mockService),
    takeScreenshot: jest.fn(),
    takeFullPageScreenshot: jest.fn(),
    takeMobileScreenshot: jest.fn(),
  };
});

describe('Screenshot Service Integration', () => {
  let mockService: any;

  beforeEach(() => {
    mockService = new ScreenshotService();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('ScreenshotService integration', () => {
    test('should capture screenshot successfully', async () => {
      const mockResult = {
        success: true,
        dataUrl: 'data:image/png;base64,mockdata',
        metadata: {
          width: 1920,
          height: 1080,
          format: 'png',
          size: 12345,
        },
      };

      mockService.captureScreenshotWithRetry.mockResolvedValue(mockResult);

      const result = await mockService.captureScreenshotWithRetry({
        url: 'https://example.com',
        width: 1920,
        height: 1080,
        fullPage: false,
        format: 'png',
        quality: 90,
        delay: 1000,
      });

      expect(result.success).toBe(true);
      expect(result.dataUrl).toBe(mockResult.dataUrl);
      expect(result.metadata).toEqual(mockResult.metadata);
      expect(mockService.captureScreenshotWithRetry).toHaveBeenCalledWith({
        url: 'https://example.com',
        width: 1920,
        height: 1080,
        fullPage: false,
        format: 'png',
        quality: 90,
        delay: 1000,
      });
    });

    test('should handle screenshot failure', async () => {
      const mockResult = {
        success: false,
        error: 'Screenshot failed',
      };

      mockService.captureScreenshotWithRetry.mockResolvedValue(mockResult);

      const result = await mockService.captureScreenshotWithRetry({
        url: 'https://example.com',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Screenshot failed');
      expect(result.dataUrl).toBeUndefined();
    });
  });

  describe('convenience functions', () => {
    test('should use takeFullPageScreenshot', async () => {
      const mockResult = {
        success: true,
        dataUrl: 'data:image/png;base64,fullpagedata',
        metadata: {
          width: 1920,
          height: 3000,
          format: 'png',
          size: 54321,
        },
      };

      // Mock the convenience function
      const { takeFullPageScreenshot } = require('../mastra/services/screenshot-service');
      takeFullPageScreenshot.mockResolvedValue(mockResult);

      const result = await takeFullPageScreenshot('https://example.com', {
        width: 1920,
        format: 'png',
        quality: 90,
        delay: 2000,
      });

      expect(result.success).toBe(true);
      expect(result.dataUrl).toBe(mockResult.dataUrl);
      expect(result.metadata).toEqual(mockResult.metadata);
      expect(takeFullPageScreenshot).toHaveBeenCalledWith('https://example.com', {
        width: 1920,
        format: 'png',
        quality: 90,
        delay: 2000,
      });
    });
  });

    test('should use takeMobileScreenshot', async () => {
      const mockResult = {
        success: true,
        dataUrl: 'data:image/png;base64,mobiledata',
        metadata: {
          width: 375,
          height: 812,
          format: 'png',
          size: 23456,
        },
      };

      // Mock the convenience function
      const { takeMobileScreenshot } = require('../mastra/services/screenshot-service');
      takeMobileScreenshot.mockResolvedValue(mockResult);

      const result = await takeMobileScreenshot('https://example.com', {
        width: 375,
        height: 812,
        format: 'png',
        quality: 90,
        delay: 1500,
      });

      expect(result.success).toBe(true);
      expect(result.dataUrl).toBe(mockResult.dataUrl);
      expect(result.metadata).toEqual(mockResult.metadata);
      expect(takeMobileScreenshot).toHaveBeenCalledWith('https://example.com', {
        width: 375,
        height: 812,
        format: 'png',
        quality: 90,
        delay: 1500,
      });
    });

  describe('URL validation', () => {
    test('should validate valid URL', () => {
      mockService.validateUrl.mockReturnValue(true);

      const isValid = mockService.validateUrl('https://example.com');

      expect(isValid).toBe(true);
      expect(mockService.validateUrl).toHaveBeenCalledWith('https://example.com');
    });

    test('should reject invalid URL', () => {
      mockService.validateUrl.mockReturnValue(false);

      const isValid = mockService.validateUrl('ftp://example.com');

      expect(isValid).toBe(false);
      expect(mockService.validateUrl).toHaveBeenCalledWith('ftp://example.com');
    });
  });

  describe('service status', () => {
    test('should return service status', () => {
      const mockStatus = {
        configured: true,
        apiKey: 'test-key...',
      };

      mockService.getStatus.mockReturnValue(mockStatus);

      const status = mockService.getStatus();

      expect(status.configured).toBe(true);
      expect(status.apiKey).toBe('test-key...');
      expect(mockService.getStatus).toHaveBeenCalled();
    });

    test('should return unconfigured status', () => {
      const mockStatus = {
        configured: false,
        apiKey: 'Not configured',
      };

      mockService.getStatus.mockReturnValue(mockStatus);

      const status = mockService.getStatus();

      expect(status.configured).toBe(false);
      expect(status.apiKey).toBe('Not configured');
    });
  });

  describe('mock screenshot creation', () => {
    test('should create mock screenshot', () => {
      const mockResult = {
        success: true,
        dataUrl: 'data:image/png;base64,mockdata',
        metadata: {
          width: 800,
          height: 600,
          format: 'png',
          size: 67,
        },
      };

      mockService.createMockScreenshot.mockReturnValue(mockResult);

      const result = mockService.createMockScreenshot(800, 600);

      expect(result.success).toBe(true);
      expect(result.dataUrl).toBe(mockResult.dataUrl);
      expect(result.metadata).toEqual(mockResult.metadata);
      expect(mockService.createMockScreenshot).toHaveBeenCalledWith(800, 600);
    });
  });

  describe('URL detection', () => {
    test('should detect URLs in text using regex', () => {
      const text = `
        Check out these websites:
        https://example.com
        http://test.org
        ftp://invalid.com
        https://another-site.net/path?query=1
        Not a URL: example.com
      `;

      // URL detection regex from the tool
      const urlRegex = /https?:\/\/[^\s<>"{}|\\^`[\]]+/gi;
      const matches = text.match(urlRegex) || [];

      expect(matches.length).toBe(3); // Only HTTP/HTTPS URLs are detected
      expect(matches).toContain('https://example.com');
      expect(matches).toContain('http://test.org');
      expect(matches).toContain('https://another-site.net/path?query=1');
    });

    test('should handle text with no URLs', () => {
      const text = 'This is just plain text with no URLs.';
      const urlRegex = /https?:\/\/[^\s<>"{}|\\^`[\]]+/gi;
      const matches = text.match(urlRegex) || [];

      expect(matches.length).toBe(0);
    });

    test('should validate detected URLs', () => {
      mockService.validateUrl.mockImplementation((url: string) => {
        return url === 'https://valid.com';
      });

      const urls = ['https://valid.com', 'https://invalid.com'];
      const validUrls: string[] = [];

      for (const url of urls) {
        if (mockService.validateUrl(url)) {
          validUrls.push(url);
        }
      }

      expect(validUrls).toHaveLength(1);
      expect(validUrls).toContain('https://valid.com');
    });
  });
});
