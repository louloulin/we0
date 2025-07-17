/**
 * Jest Test Setup
 * 
 * Global test configuration and setup for the DeepSeek Mastra integration.
 */

// Extend Jest timeout for AI model calls
jest.setTimeout(30000);

// Mock environment variables for testing
process.env.DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || 'test-key';
process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'test-key';
process.env.DATABASE_URL = process.env.DATABASE_URL || ':memory:';

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
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidCode(): R;
    }
  }
}
