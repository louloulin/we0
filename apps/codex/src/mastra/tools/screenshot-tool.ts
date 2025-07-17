/**
 * Screenshot Tool
 *
 * Provides screenshot capture capabilities for the Builder Agent
 * Integrates with ScreenshotOne API for website screenshots
 */

import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import {
  ScreenshotService,
  takeScreenshot,
  takeFullPageScreenshot,
  takeMobileScreenshot,
  type ScreenshotOptions
} from '../services/screenshot-service';

/**
 * Tool for capturing website screenshots
 */
export const captureScreenshotTool = createTool({
  id: 'capture-screenshot',
  description: 'Capture a screenshot of a website URL and return it as a base64 data URL',
  inputSchema: z.object({
    url: z.string().url().describe('The URL of the website to screenshot'),
    width: z.number().optional().default(1920).describe('Screenshot width in pixels'),
    height: z.number().optional().default(1080).describe('Screenshot height in pixels'),
    fullPage: z.boolean().optional().default(false).describe('Whether to capture the full page'),
    format: z.enum(['png', 'jpeg', 'webp']).optional().default('png').describe('Image format'),
    quality: z.number().min(1).max(100).optional().default(90).describe('Image quality (1-100)'),
    delay: z.number().optional().default(1000).describe('Delay before screenshot in milliseconds'),
  }),
  outputSchema: z.object({
    success: z.boolean().describe('Whether the screenshot was successful'),
    dataUrl: z.string().optional().describe('Base64 data URL of the screenshot'),
    error: z.string().optional().describe('Error message if screenshot failed'),
    metadata: z.object({
      width: z.number(),
      height: z.number(),
      format: z.string(),
      size: z.number(),
    }).optional().describe('Screenshot metadata'),
  }),
  execute: async ({ context: { url, width, height, fullPage, format, quality, delay } }) => {
    const service = new ScreenshotService();

    const result = await service.captureScreenshotWithRetry({
      url,
      width,
      height,
      fullPage,
      format,
      quality,
      delay,
    });

    return {
      success: result.success,
      dataUrl: result.dataUrl,
      error: result.error,
      metadata: result.metadata,
    };
  },
});

/**
 * Tool for capturing full page screenshots
 */
export const captureFullPageScreenshotTool = createTool({
  id: 'capture-fullpage-screenshot',
  description: 'Capture a full page screenshot of a website URL',
  inputSchema: z.object({
    url: z.string().url().describe('The URL of the website to screenshot'),
    width: z.number().optional().default(1920).describe('Screenshot width in pixels'),
    format: z.enum(['png', 'jpeg', 'webp']).optional().default('png').describe('Image format'),
    quality: z.number().min(1).max(100).optional().default(90).describe('Image quality (1-100)'),
    delay: z.number().optional().default(2000).describe('Delay before screenshot in milliseconds'),
  }),
  outputSchema: z.object({
    success: z.boolean().describe('Whether the screenshot was successful'),
    dataUrl: z.string().optional().describe('Base64 data URL of the screenshot'),
    error: z.string().optional().describe('Error message if screenshot failed'),
    metadata: z.object({
      width: z.number(),
      height: z.number(),
      format: z.string(),
      size: z.number(),
    }).optional().describe('Screenshot metadata'),
  }),
  execute: async ({ context: { url, width, format, quality, delay } }) => {
    const result = await takeFullPageScreenshot(url, {
      width,
      format,
      quality,
      delay,
    });

    return {
      success: result.success,
      dataUrl: result.dataUrl,
      error: result.error,
      metadata: result.metadata,
    };
  },
});

/**
 * Tool for capturing mobile screenshots
 */
export const captureMobileScreenshotTool = createTool({
  id: 'capture-mobile-screenshot',
  description: 'Capture a mobile-sized screenshot of a website URL',
  inputSchema: z.object({
    url: z.string().url().describe('The URL of the website to screenshot'),
    width: z.number().optional().default(375).describe('Mobile width in pixels'),
    height: z.number().optional().default(812).describe('Mobile height in pixels'),
    format: z.enum(['png', 'jpeg', 'webp']).optional().default('png').describe('Image format'),
    quality: z.number().min(1).max(100).optional().default(90).describe('Image quality (1-100)'),
    delay: z.number().optional().default(1500).describe('Delay before screenshot in milliseconds'),
  }),
  outputSchema: z.object({
    success: z.boolean().describe('Whether the screenshot was successful'),
    dataUrl: z.string().optional().describe('Base64 data URL of the screenshot'),
    error: z.string().optional().describe('Error message if screenshot failed'),
    metadata: z.object({
      width: z.number(),
      height: z.number(),
      format: z.string(),
      size: z.number(),
    }).optional().describe('Screenshot metadata'),
  }),
  execute: async ({ context: { url, width, height, format, quality, delay } }) => {
    const result = await takeMobileScreenshot(url, {
      width,
      height,
      format,
      quality,
      delay,
    });

    return {
      success: result.success,
      dataUrl: result.dataUrl,
      error: result.error,
      metadata: result.metadata,
    };
  },
});

/**
 * Tool for validating URLs before screenshot
 */
export const validateUrlTool = createTool({
  id: 'validate-url',
  description: 'Validate if a URL is suitable for screenshot capture',
  inputSchema: z.object({
    url: z.string().describe('The URL to validate'),
  }),
  outputSchema: z.object({
    isValid: z.boolean().describe('Whether the URL is valid for screenshots'),
    reason: z.string().optional().describe('Reason if URL is invalid'),
    normalizedUrl: z.string().optional().describe('Normalized URL if valid'),
  }),
  execute: async ({ context: { url } }) => {
    const service = new ScreenshotService();

    try {
      const isValid = service.validateUrl(url);

      if (!isValid) {
        return {
          isValid: false,
          reason: 'URL must use HTTP or HTTPS protocol',
        };
      }

      const urlObj = new URL(url);
      return {
        isValid: true,
        normalizedUrl: urlObj.toString(),
      };
    } catch (error) {
      return {
        isValid: false,
        reason: error instanceof Error ? error.message : 'Invalid URL format',
      };
    }
  },
});

/**
 * Tool for getting screenshot service status
 */
export const getScreenshotServiceStatusTool = createTool({
  id: 'get-screenshot-service-status',
  description: 'Get the current status of the screenshot service',
  inputSchema: z.object({}),
  outputSchema: z.object({
    configured: z.boolean().describe('Whether the service is properly configured'),
    apiKey: z.string().describe('API key status (masked)'),
    available: z.boolean().describe('Whether the service is available for use'),
  }),
  execute: async () => {
    const service = new ScreenshotService();
    const status = service.getStatus();

    return {
      configured: status.configured,
      apiKey: status.apiKey,
      available: status.configured,
    };
  },
});

/**
 * Tool for creating mock screenshots (for testing/development)
 */
export const createMockScreenshotTool = createTool({
  id: 'create-mock-screenshot',
  description: 'Create a mock screenshot for testing purposes',
  inputSchema: z.object({
    width: z.number().optional().default(1920).describe('Mock screenshot width'),
    height: z.number().optional().default(1080).describe('Mock screenshot height'),
  }),
  outputSchema: z.object({
    success: z.boolean().describe('Always true for mock screenshots'),
    dataUrl: z.string().describe('Base64 data URL of the mock screenshot'),
    metadata: z.object({
      width: z.number(),
      height: z.number(),
      format: z.string(),
      size: z.number(),
    }).describe('Mock screenshot metadata'),
  }),
  execute: async ({ context: { width, height } }) => {
    const service = new ScreenshotService();
    const mockResult = service.createMockScreenshot(width, height);

    return {
      success: mockResult.success,
      dataUrl: mockResult.dataUrl!,
      metadata: mockResult.metadata!,
    };
  },
});

/**
 * Tool for detecting URLs in text content
 */
export const detectUrlsInTextTool = createTool({
  id: 'detect-urls-in-text',
  description: 'Detect and extract URLs from text content that could be screenshotted',
  inputSchema: z.object({
    text: z.string().describe('Text content to search for URLs'),
  }),
  outputSchema: z.object({
    urls: z.array(z.string()).describe('Array of detected URLs'),
    validUrls: z.array(z.string()).describe('Array of valid URLs suitable for screenshots'),
    count: z.number().describe('Total number of URLs found'),
  }),
  execute: async ({ context: { text } }) => {
    // URL detection regex
    const urlRegex = /https?:\/\/[^\s<>"{}|\\^`[\]]+/gi;
    const matches = text.match(urlRegex) || [];

    const service = new ScreenshotService();
    const validUrls: string[] = [];

    for (const url of matches) {
      if (service.validateUrl(url)) {
        validUrls.push(url);
      }
    }

    return {
      urls: matches,
      validUrls,
      count: matches.length,
    };
  },
});
