/**
 * Jest Test Setup
 * 
 * Global test configuration and setup for the DeepSeek Mastra integration.
 */

// Extend Jest timeout for AI model calls
jest.setTimeout(30000);

// Load environment variables from .env file
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Set environment variables for testing
process.env.NODE_ENV = 'test';
process.env.DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || 'sk-74222fbc3182478da8a0f8857ef04b1a';
process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'sk-proj-test-key-for-embeddings';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'file:../mastra.db';
process.env.DEEPSEEK_BASE_URL = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1';

// Global test utilities
global.console = {
  ...console,
  // Suppress console.log in tests unless explicitly needed
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: console.warn,
  error: console.error,
};

// Setup and teardown hooks
beforeAll(async () => {
  // Global setup before all tests
});

afterAll(async () => {
  // Global cleanup after all tests
});

beforeEach(() => {
  // Reset mocks before each test
  jest.clearAllMocks();
});

afterEach(() => {
  // Cleanup after each test
});

// Custom matchers or utilities can be added here
expect.extend({
  toBeValidCode(received: string) {
    const pass = received.length > 0 && !received.includes('undefined');
    if (pass) {
      return {
        message: () => `expected ${received} not to be valid code`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be valid code`,
        pass: false,
      };
    }
  },
});

// Type declarations for custom matchers
declare module '@jest/expect' {
  interface Matchers<R> {
    toBeValidCode(): R;
  }
}
