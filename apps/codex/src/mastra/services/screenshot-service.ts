/**
 * Screenshot Service
 * 
 * Integrates with ScreenshotOne API to capture website screenshots
 * Compatible with we-dev-next screenshot functionality
 */

export interface ScreenshotOptions {
  url: string;
  width?: number;
  height?: number;
  format?: 'png' | 'jpeg' | 'webp';
  quality?: number;
  fullPage?: boolean;
  delay?: number;
  timeout?: number;
}

export interface ScreenshotResult {
  success: boolean;
  dataUrl?: string;
  error?: string;
  metadata?: {
    width: number;
    height: number;
    format: string;
    size: number;
  };
}

/**
 * Screenshot Service Class
 * Handles website screenshot capture using ScreenshotOne API
 */
export class ScreenshotService {
  private apiKey: string;
  private baseUrl: string = 'https://api.screenshotone.com/take';
  private defaultOptions: Partial<ScreenshotOptions> = {
    width: 1920,
    height: 1080,
    format: 'png',
    quality: 90,
    fullPage: false,
    delay: 1000,
    timeout: 30000,
  };

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.SCREENSHOTONE_API_KEY || '';

    if (!this.isConfigured()) {
      console.warn('ScreenshotOne API key not provided. Screenshot functionality will be limited.');
    }
  }

  /**
   * Validates if a URL is valid for screenshot capture
   */
  validateUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return ['http:', 'https:'].includes(urlObj.protocol);
    } catch {
      return false;
    }
  }

  /**
   * Captures a screenshot of the given URL
   */
  async captureScreenshot(options: ScreenshotOptions): Promise<ScreenshotResult> {
    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'ScreenshotOne API key not configured',
      };
    }

    if (!this.validateUrl(options.url)) {
      return {
        success: false,
        error: 'Invalid URL provided',
      };
    }

    const finalOptions = { ...this.defaultOptions, ...options };

    try {
      const params = new URLSearchParams({
        access_key: this.apiKey,
        url: finalOptions.url,
        viewport_width: finalOptions.width!.toString(),
        viewport_height: finalOptions.height!.toString(),
        format: finalOptions.format!,
        image_quality: finalOptions.quality!.toString(),
        full_page: finalOptions.fullPage!.toString(),
        delay: finalOptions.delay!.toString(),
        timeout: finalOptions.timeout!.toString(),
        response_type: 'json',
      });

      const response = await fetch(`${this.baseUrl}?${params.toString()}`, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mastra-Screenshot-Service/1.0',
        },
      });

      if (!response.ok) {
        throw new Error(`ScreenshotOne API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();

      if (result.error) {
        return {
          success: false,
          error: result.error,
        };
      }

      // Convert the image URL to base64 data URL
      const imageResponse = await fetch(result.url);
      if (!imageResponse.ok) {
        throw new Error('Failed to fetch screenshot image');
      }

      const imageBuffer = await imageResponse.arrayBuffer();
      const base64 = Buffer.from(imageBuffer).toString('base64');
      const mimeType = `image/${finalOptions.format}`;
      const dataUrl = `data:${mimeType};base64,${base64}`;

      return {
        success: true,
        dataUrl,
        metadata: {
          width: finalOptions.width!,
          height: finalOptions.height!,
          format: finalOptions.format!,
          size: imageBuffer.byteLength,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Captures a screenshot with retry logic
   */
  async captureScreenshotWithRetry(
    options: ScreenshotOptions,
    maxRetries: number = 3,
    retryDelay: number = 1000
  ): Promise<ScreenshotResult> {
    let lastError: string = '';

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const result = await this.captureScreenshot(options);

      if (result.success) {
        return result;
      }

      lastError = result.error || 'Unknown error';

      if (attempt < maxRetries) {
        console.warn(`Screenshot attempt ${attempt} failed: ${lastError}. Retrying in ${retryDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        retryDelay *= 2; // Exponential backoff
      }
    }

    return {
      success: false,
      error: `Failed after ${maxRetries} attempts. Last error: ${lastError}`,
    };
  }

  /**
   * Processes image data and converts to base64 data URL
   */
  processImageData(buffer: Buffer, format: string = 'png'): string {
    const base64 = buffer.toString('base64');
    const mimeType = `image/${format}`;
    return `data:${mimeType};base64,${base64}`;
  }

  /**
   * Extracts base64 data from data URL
   */
  extractBase64FromDataUrl(dataUrl: string): string {
    const base64Match = dataUrl.match(/^data:image\/[^;]+;base64,(.+)$/);
    return base64Match ? base64Match[1] : '';
  }

  /**
   * Gets image metadata from data URL
   */
  getImageMetadata(dataUrl: string): { mimeType: string; format: string; size: number } | null {
    try {
      const mimeMatch = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (!mimeMatch) return null;

      const mimeType = mimeMatch[1];
      const base64Data = mimeMatch[2];
      const format = mimeType.split('/')[1];
      const size = Math.round((base64Data.length * 3) / 4); // Approximate size

      return { mimeType, format, size };
    } catch {
      return null;
    }
  }

  /**
   * Validates screenshot result
   */
  validateScreenshotResult(result: ScreenshotResult): boolean {
    if (!result.success || !result.dataUrl) {
      return false;
    }

    // Check if data URL is valid
    const metadata = this.getImageMetadata(result.dataUrl);
    return metadata !== null;
  }

  /**
   * Creates a mock screenshot for testing/development
   */
  createMockScreenshot(width: number = 1920, height: number = 1080): ScreenshotResult {
    // Create a simple 1x1 pixel PNG in base64
    const mockPngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    const dataUrl = `data:image/png;base64,${mockPngBase64}`;

    return {
      success: true,
      dataUrl,
      metadata: {
        width,
        height,
        format: 'png',
        size: 67, // Approximate size of the mock PNG
      },
    };
  }

  /**
   * Checks if the service is properly configured
   */
  isConfigured(): boolean {
    return !!this.apiKey && this.apiKey.trim().length > 0;
  }

  /**
   * Gets service status
   */
  getStatus(): { configured: boolean; apiKey: string } {
    return {
      configured: this.isConfigured(),
      apiKey: this.apiKey ? `${this.apiKey.substring(0, 8)}...` : 'Not configured',
    };
  }
}

// Global screenshot service instance
export const screenshotService = new ScreenshotService();

// Clean up global instance on process exit
if (typeof process !== 'undefined') {
  process.on('exit', () => {
    // Cleanup if needed
  });
}

/**
 * Convenience function for taking screenshots
 */
export async function takeScreenshot(url: string, options?: Partial<ScreenshotOptions>): Promise<ScreenshotResult> {
  // Create a new service instance to ensure fresh configuration
  const service = new ScreenshotService();
  return service.captureScreenshotWithRetry({
    url,
    ...options,
  });
}

/**
 * Convenience function for taking full page screenshots
 */
export async function takeFullPageScreenshot(url: string, options?: Partial<ScreenshotOptions>): Promise<ScreenshotResult> {
  // Create a new service instance to ensure fresh configuration
  const service = new ScreenshotService();
  return service.captureScreenshotWithRetry({
    url,
    fullPage: true,
    ...options,
  });
}

/**
 * Convenience function for taking mobile screenshots
 */
export async function takeMobileScreenshot(url: string, options?: Partial<ScreenshotOptions>): Promise<ScreenshotResult> {
  // Create a new service instance to ensure fresh configuration
  const service = new ScreenshotService();
  return service.captureScreenshotWithRetry({
    url,
    width: 375,
    height: 812,
    ...options,
  });
}
