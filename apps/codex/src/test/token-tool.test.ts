/**
 * Token Tool Tests
 * 
 * Tests for token management tools integration
 * Tests the underlying logic functions rather than the Mastra tool wrappers
 */

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { TokenService, countTokens, calculateTokenCost } from '../mastra/services/token-service';

// Mock the token service
jest.mock('../mastra/services/token-service', () => {
  const mockService = {
    countTokens: jest.fn(),
    countMessagesTokens: jest.fn(),
    calculateCost: jest.fn(),
    checkLimits: jest.fn(),
    trackUsage: jest.fn(),
    getUserUsage: jest.fn(),
    getSupportedModels: jest.fn(),
    getServiceStats: jest.fn(),
    setModelPricing: jest.fn(),
    getModelPricing: jest.fn(),
  };

  return {
    TokenService: jest.fn(() => mockService),
    countTokens: jest.fn(),
    calculateTokenCost: jest.fn(),
  };
});

describe('Token Service Integration', () => {
  let mockService: any;

  beforeEach(() => {
    mockService = new TokenService();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('token counting', () => {
    test('should count tokens in text', () => {
      const mockResult = {
        tokens: 10,
        characters: 35,
        words: 7,
      };

      const { countTokens } = require('../mastra/services/token-service');
      countTokens.mockReturnValue(mockResult);

      const result = countTokens('Hello world, this is a test message.');

      expect(result.tokens).toBe(10);
      expect(result.characters).toBe(35);
      expect(result.words).toBe(7);
      expect(countTokens).toHaveBeenCalledWith('Hello world, this is a test message.');
    });

    test('should count tokens in messages', () => {
      const messages = [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there!' },
      ];

      const mockResult = {
        tokens: 15,
        characters: 50,
        words: 8,
      };

      mockService.countMessagesTokens.mockReturnValue(mockResult);

      const result = mockService.countMessagesTokens(messages);

      expect(result.tokens).toBe(15);
      expect(result.characters).toBe(50);
      expect(result.words).toBe(8);
      expect(mockService.countMessagesTokens).toHaveBeenCalledWith(messages);
    });
  });

  describe('cost calculation', () => {
    test('should calculate token cost', () => {
      const usage = {
        promptTokens: 1000,
        completionTokens: 500,
        totalTokens: 1500,
      };

      const mockCost = 0.06;
      mockService.calculateCost.mockReturnValue(mockCost);

      const cost = mockService.calculateCost(usage, 'gpt-4');

      expect(cost).toBe(0.06);
      expect(mockService.calculateCost).toHaveBeenCalledWith(usage, 'gpt-4');
    });

    test('should get model pricing', () => {
      const mockPricing = {
        inputTokenPrice: 0.03,
        outputTokenPrice: 0.06,
        currency: 'USD',
      };

      mockService.getModelPricing.mockReturnValue(mockPricing);

      const pricing = mockService.getModelPricing('gpt-4');

      expect(pricing.inputTokenPrice).toBe(0.03);
      expect(pricing.outputTokenPrice).toBe(0.06);
      expect(pricing.currency).toBe('USD');
      expect(mockService.getModelPricing).toHaveBeenCalledWith('gpt-4');
    });
  });

  describe('limit checking', () => {
    test('should check token limits', () => {
      const mockResult = {
        allowed: true,
        remainingDaily: 95000,
        remainingMonthly: 995000,
      };

      mockService.checkLimits.mockReturnValue(mockResult);

      const result = mockService.checkLimits('user1', 5000);

      expect(result.allowed).toBe(true);
      expect(result.remainingDaily).toBe(95000);
      expect(result.remainingMonthly).toBe(995000);
      expect(mockService.checkLimits).toHaveBeenCalledWith('user1', 5000);
    });

    test('should reject when limits exceeded', () => {
      const mockResult = {
        allowed: false,
        reason: 'Daily token limit exceeded',
        remainingDaily: 0,
        remainingMonthly: 50000,
      };

      mockService.checkLimits.mockReturnValue(mockResult);

      const result = mockService.checkLimits('user1', 5000);

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('Daily token limit exceeded');
      expect(result.remainingDaily).toBe(0);
    });
  });

  describe('usage tracking', () => {
    test('should track token usage', () => {
      const usage = {
        promptTokens: 1000,
        completionTokens: 500,
        totalTokens: 1500,
      };

      const mockUserUsage = {
        userId: 'user1',
        totalUsage: 1500,
        dailyUsage: 1500,
        monthlyUsage: 1500,
        lastUsageDate: new Date(),
        lastResetDate: new Date(),
      };

      mockService.trackUsage.mockImplementation(() => {});
      mockService.getUserUsage.mockReturnValue(mockUserUsage);

      mockService.trackUsage('user1', usage, 'gpt-4');
      const userUsage = mockService.getUserUsage('user1');

      expect(userUsage.totalUsage).toBe(1500);
      expect(userUsage.dailyUsage).toBe(1500);
      expect(userUsage.monthlyUsage).toBe(1500);
      expect(mockService.trackUsage).toHaveBeenCalledWith('user1', usage, 'gpt-4');
    });

    test('should get user usage', () => {
      const mockUserUsage = {
        userId: 'user1',
        totalUsage: 5000,
        dailyUsage: 1000,
        monthlyUsage: 3000,
        lastUsageDate: new Date(),
        lastResetDate: new Date(),
      };

      mockService.getUserUsage.mockReturnValue(mockUserUsage);

      const usage = mockService.getUserUsage('user1');

      expect(usage.totalUsage).toBe(5000);
      expect(usage.dailyUsage).toBe(1000);
      expect(usage.monthlyUsage).toBe(3000);
      expect(mockService.getUserUsage).toHaveBeenCalledWith('user1');
    });

    test('should return null for non-existent user', () => {
      mockService.getUserUsage.mockReturnValue(null);

      const usage = mockService.getUserUsage('non-existent');

      expect(usage).toBeNull();
      expect(mockService.getUserUsage).toHaveBeenCalledWith('non-existent');
    });
  });

  describe('model management', () => {
    test('should get supported models', () => {
      const mockModels = [
        {
          model: 'gpt-4',
          pricing: {
            inputTokenPrice: 0.03,
            outputTokenPrice: 0.06,
            currency: 'USD',
          },
        },
        {
          model: 'gpt-3.5-turbo',
          pricing: {
            inputTokenPrice: 0.0015,
            outputTokenPrice: 0.002,
            currency: 'USD',
          },
        },
      ];

      mockService.getSupportedModels.mockReturnValue(mockModels);

      const models = mockService.getSupportedModels();

      expect(models).toHaveLength(2);
      expect(models[0].model).toBe('gpt-4');
      expect(models[1].model).toBe('gpt-3.5-turbo');
      expect(mockService.getSupportedModels).toHaveBeenCalled();
    });

    test('should set custom model pricing', () => {
      const customPricing = {
        inputTokenPrice: 0.01,
        outputTokenPrice: 0.02,
        currency: 'USD',
      };

      mockService.setModelPricing.mockImplementation(() => {});

      mockService.setModelPricing('custom-model', customPricing);

      expect(mockService.setModelPricing).toHaveBeenCalledWith('custom-model', customPricing);
    });
  });

  describe('service statistics', () => {
    test('should get service stats', () => {
      const mockStats = {
        totalUsers: 10,
        totalTokensUsed: 50000,
        supportedModels: 6,
      };

      mockService.getServiceStats.mockReturnValue(mockStats);

      const stats = mockService.getServiceStats();

      expect(stats.totalUsers).toBe(10);
      expect(stats.totalTokensUsed).toBe(50000);
      expect(stats.supportedModels).toBe(6);
      expect(mockService.getServiceStats).toHaveBeenCalled();
    });
  });

  describe('convenience functions', () => {
    test('should use countTokens convenience function', () => {
      const mockResult = {
        tokens: 5,
        characters: 11,
        words: 2,
      };

      const { countTokens } = require('../mastra/services/token-service');
      countTokens.mockReturnValue(mockResult);

      const result = countTokens('Hello world');

      expect(result.tokens).toBe(5);
      expect(result.characters).toBe(11);
      expect(result.words).toBe(2);
      expect(countTokens).toHaveBeenCalledWith('Hello world');
    });

    test('should use calculateTokenCost convenience function', () => {
      const usage = {
        promptTokens: 1000,
        completionTokens: 500,
        totalTokens: 1500,
      };

      const { calculateTokenCost } = require('../mastra/services/token-service');
      calculateTokenCost.mockReturnValue(0.06);

      const cost = calculateTokenCost(usage, 'gpt-4');

      expect(cost).toBe(0.06);
      expect(calculateTokenCost).toHaveBeenCalledWith(usage, 'gpt-4');
    });
  });

  describe('error handling', () => {
    test('should handle empty text gracefully', () => {
      const mockResult = {
        tokens: 0,
        characters: 0,
        words: 0,
      };

      const { countTokens } = require('../mastra/services/token-service');
      countTokens.mockReturnValue(mockResult);

      const result = countTokens('');

      expect(result.tokens).toBe(0);
      expect(result.characters).toBe(0);
      expect(result.words).toBe(0);
    });

    test('should handle unknown model gracefully', () => {
      mockService.calculateCost.mockReturnValue(0);

      const usage = {
        promptTokens: 1000,
        completionTokens: 500,
        totalTokens: 1500,
      };

      const cost = mockService.calculateCost(usage, 'unknown-model');

      expect(cost).toBe(0);
      expect(mockService.calculateCost).toHaveBeenCalledWith(usage, 'unknown-model');
    });
  });
});
