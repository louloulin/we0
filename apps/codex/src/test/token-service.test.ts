/**
 * Token Service Tests
 * 
 * Tests for token management, usage tracking, and billing functionality
 */

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { TokenService, countTokens, calculateTokenCost } from '../mastra/services/token-service';

describe('TokenService', () => {
  let tokenService: TokenService;

  beforeEach(() => {
    tokenService = new TokenService();
  });

  afterEach(() => {
    // Clean up any test data
  });

  describe('constructor', () => {
    test('should initialize with default limits', () => {
      const service = new TokenService();
      const stats = service.getServiceStats();
      
      expect(stats.supportedModels).toBeGreaterThan(0);
      expect(stats.totalUsers).toBe(0);
      expect(stats.totalTokensUsed).toBe(0);
    });

    test('should initialize with custom limits', () => {
      const customLimits = {
        maxTokensPerRequest: 2000,
        maxTokensPerDay: 50000,
      };
      
      const service = new TokenService(customLimits);
      
      // Test limits by checking a user request
      const result = service.checkLimits('test-user', 1500);
      expect(result.allowed).toBe(true);
      expect(result.remainingDaily).toBe(50000);
    });
  });

  describe('token counting', () => {
    test('should count tokens in simple text', () => {
      const text = 'Hello world, this is a test message.';
      const result = tokenService.countTokens(text);
      
      expect(result.tokens).toBeGreaterThan(0);
      expect(result.characters).toBe(text.length);
      expect(result.words).toBe(7);
    });

    test('should handle empty text', () => {
      const result = tokenService.countTokens('');
      
      expect(result.tokens).toBe(0);
      expect(result.characters).toBe(0);
      expect(result.words).toBe(0);
    });

    test('should handle null/undefined text', () => {
      const result1 = tokenService.countTokens(null as any);
      const result2 = tokenService.countTokens(undefined as any);
      
      expect(result1.tokens).toBe(0);
      expect(result2.tokens).toBe(0);
    });

    test('should count tokens in messages array', () => {
      const messages = [
        { role: 'user', content: 'Hello, how are you?' },
        { role: 'assistant', content: 'I am doing well, thank you for asking!' },
        { role: 'user', content: 'Can you help me with a task?' },
      ];
      
      const result = tokenService.countMessagesTokens(messages);
      
      expect(result.tokens).toBeGreaterThan(0);
      expect(result.characters).toBeGreaterThan(0);
      expect(result.words).toBeGreaterThan(0);
      
      // Should include overhead for message formatting
      const totalText = messages.map(m => m.content).join(' ');
      const simpleCount = tokenService.countTokens(totalText);
      expect(result.tokens).toBeGreaterThan(simpleCount.tokens);
    });
  });

  describe('cost calculation', () => {
    test('should calculate cost for GPT-4', () => {
      const usage = {
        promptTokens: 1000,
        completionTokens: 500,
        totalTokens: 1500,
      };
      
      const cost = tokenService.calculateCost(usage, 'gpt-4');
      
      // GPT-4: $0.03 input + $0.06 output per 1K tokens
      // Expected: (1000/1000 * 0.03) + (500/1000 * 0.06) = 0.03 + 0.03 = 0.06
      expect(cost).toBeCloseTo(0.06, 4);
    });

    test('should calculate cost for GPT-3.5-turbo', () => {
      const usage = {
        promptTokens: 2000,
        completionTokens: 1000,
        totalTokens: 3000,
      };
      
      const cost = tokenService.calculateCost(usage, 'gpt-3.5-turbo');
      
      // GPT-3.5: $0.0015 input + $0.002 output per 1K tokens
      // Expected: (2000/1000 * 0.0015) + (1000/1000 * 0.002) = 0.003 + 0.002 = 0.005
      expect(cost).toBeCloseTo(0.005, 4);
    });

    test('should return 0 for unknown model', () => {
      const usage = {
        promptTokens: 1000,
        completionTokens: 500,
        totalTokens: 1500,
      };
      
      const cost = tokenService.calculateCost(usage, 'unknown-model');
      expect(cost).toBe(0);
    });
  });

  describe('usage tracking', () => {
    test('should track usage for new user', () => {
      const usage = {
        promptTokens: 1000,
        completionTokens: 500,
        totalTokens: 1500,
      };
      
      tokenService.trackUsage('user1', usage, 'gpt-4');
      
      const userUsage = tokenService.getUserUsage('user1');
      expect(userUsage).toBeDefined();
      expect(userUsage!.totalUsage).toBe(1500);
      expect(userUsage!.dailyUsage).toBe(1500);
      expect(userUsage!.monthlyUsage).toBe(1500);
    });

    test('should accumulate usage for existing user', () => {
      const usage1 = {
        promptTokens: 1000,
        completionTokens: 500,
        totalTokens: 1500,
      };
      
      const usage2 = {
        promptTokens: 800,
        completionTokens: 400,
        totalTokens: 1200,
      };
      
      tokenService.trackUsage('user1', usage1, 'gpt-4');
      tokenService.trackUsage('user1', usage2, 'gpt-4');
      
      const userUsage = tokenService.getUserUsage('user1');
      expect(userUsage!.totalUsage).toBe(2700);
      expect(userUsage!.dailyUsage).toBe(2700);
      expect(userUsage!.monthlyUsage).toBe(2700);
    });

    test('should return null for non-existent user', () => {
      const userUsage = tokenService.getUserUsage('non-existent');
      expect(userUsage).toBeNull();
    });
  });

  describe('limit checking', () => {
    test('should allow request within limits', () => {
      const result = tokenService.checkLimits('user1', 1000);
      
      expect(result.allowed).toBe(true);
      expect(result.reason).toBeUndefined();
      expect(result.remainingDaily).toBeDefined();
      expect(result.remainingMonthly).toBeDefined();
    });

    test('should reject request exceeding per-request limit', () => {
      const result = tokenService.checkLimits('user1', 5000); // Default limit is 4000
      
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('maximum tokens per request');
    });

    test('should reject request exceeding daily limit', () => {
      // First, use up most of the daily limit
      const largeUsage = {
        promptTokens: 50000,
        completionTokens: 49000,
        totalTokens: 99000,
      };
      
      tokenService.trackUsage('user1', largeUsage, 'gpt-4');
      
      // Now try to use more tokens
      const result = tokenService.checkLimits('user1', 2000);
      
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Daily token limit exceeded');
    });

    test('should use custom limits when provided', () => {
      const customLimits = {
        maxTokensPerRequest: 1000,
        maxTokensPerDay: 5000,
      };
      
      const result = tokenService.checkLimits('user1', 1500, customLimits);
      
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('maximum tokens per request');
    });
  });

  describe('model pricing', () => {
    test('should get pricing for supported model', () => {
      const pricing = tokenService.getModelPricing('gpt-4');
      
      expect(pricing).toBeDefined();
      expect(pricing!.inputTokenPrice).toBe(0.03);
      expect(pricing!.outputTokenPrice).toBe(0.06);
      expect(pricing!.currency).toBe('USD');
    });

    test('should return null for unsupported model', () => {
      const pricing = tokenService.getModelPricing('unsupported-model');
      expect(pricing).toBeNull();
    });

    test('should set custom pricing', () => {
      const customPricing = {
        inputTokenPrice: 0.01,
        outputTokenPrice: 0.02,
        currency: 'USD',
      };
      
      tokenService.setModelPricing('custom-model', customPricing);
      
      const retrievedPricing = tokenService.getModelPricing('custom-model');
      expect(retrievedPricing).toEqual(customPricing);
    });

    test('should list all supported models', () => {
      const models = tokenService.getSupportedModels();
      
      expect(models.length).toBeGreaterThan(0);
      expect(models.some(m => m.model === 'gpt-4')).toBe(true);
      expect(models.some(m => m.model === 'claude-3-opus')).toBe(true);
    });
  });

  describe('service management', () => {
    test('should clear user usage', () => {
      const usage = {
        promptTokens: 1000,
        completionTokens: 500,
        totalTokens: 1500,
      };
      
      tokenService.trackUsage('user1', usage, 'gpt-4');
      expect(tokenService.getUserUsage('user1')).toBeDefined();
      
      tokenService.clearUserUsage('user1');
      expect(tokenService.getUserUsage('user1')).toBeNull();
    });

    test('should provide service statistics', () => {
      const usage = {
        promptTokens: 1000,
        completionTokens: 500,
        totalTokens: 1500,
      };
      
      tokenService.trackUsage('user1', usage, 'gpt-4');
      tokenService.trackUsage('user2', usage, 'gpt-4');
      
      const stats = tokenService.getServiceStats();
      
      expect(stats.totalUsers).toBe(2);
      expect(stats.totalTokensUsed).toBe(3000);
      expect(stats.supportedModels).toBeGreaterThan(0);
    });
  });

  describe('convenience functions', () => {
    test('countTokens should work', () => {
      const result = countTokens('Hello world');
      
      expect(result.tokens).toBeGreaterThan(0);
      expect(result.characters).toBe(11);
      expect(result.words).toBe(2);
    });

    test('calculateTokenCost should work', () => {
      const usage = {
        promptTokens: 1000,
        completionTokens: 500,
        totalTokens: 1500,
      };
      
      const cost = calculateTokenCost(usage, 'gpt-4');
      expect(cost).toBeCloseTo(0.06, 4);
    });
  });
});
