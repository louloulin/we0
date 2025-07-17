/**
 * Token Management Tools
 * 
 * Provides token counting, usage tracking, and billing tools for the Builder Agent
 * Integrates with the TokenService for comprehensive token management
 */

import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { TokenService, countTokens, calculateTokenCost } from '../services/token-service';

/**
 * Tool for counting tokens in text
 */
export const countTokensTool = createTool({
  id: 'count-tokens',
  description: 'Count tokens, characters, and words in text content',
  inputSchema: z.object({
    text: z.string().describe('Text content to count tokens for'),
  }),
  outputSchema: z.object({
    tokens: z.number().describe('Number of tokens in the text'),
    characters: z.number().describe('Number of characters in the text'),
    words: z.number().describe('Number of words in the text'),
  }),
  execute: async ({ context: { text } }) => {
    const result = countTokens(text);
    return {
      tokens: result.tokens,
      characters: result.characters,
      words: result.words,
    };
  },
});

/**
 * Tool for counting tokens in messages array
 */
export const countMessagesTokensTool = createTool({
  id: 'count-messages-tokens',
  description: 'Count tokens in an array of chat messages',
  inputSchema: z.object({
    messages: z.array(z.object({
      role: z.string().describe('Message role (user, assistant, system)'),
      content: z.string().describe('Message content'),
    })).describe('Array of chat messages'),
  }),
  outputSchema: z.object({
    tokens: z.number().describe('Total number of tokens in all messages'),
    characters: z.number().describe('Total number of characters in all messages'),
    words: z.number().describe('Total number of words in all messages'),
  }),
  execute: async ({ context: { messages } }) => {
    const service = new TokenService();
    const result = service.countMessagesTokens(messages);
    return {
      tokens: result.tokens,
      characters: result.characters,
      words: result.words,
    };
  },
});

/**
 * Tool for calculating token usage cost
 */
export const calculateTokenCostTool = createTool({
  id: 'calculate-token-cost',
  description: 'Calculate the cost of token usage for a specific model',
  inputSchema: z.object({
    promptTokens: z.number().describe('Number of input/prompt tokens'),
    completionTokens: z.number().describe('Number of output/completion tokens'),
    modelName: z.string().describe('Name of the LLM model (e.g., gpt-4, claude-3-opus)'),
  }),
  outputSchema: z.object({
    cost: z.number().describe('Total cost in USD'),
    inputCost: z.number().describe('Cost for input tokens'),
    outputCost: z.number().describe('Cost for output tokens'),
    currency: z.string().describe('Currency of the cost'),
    pricing: z.object({
      inputTokenPrice: z.number(),
      outputTokenPrice: z.number(),
      currency: z.string(),
    }).optional().describe('Pricing information for the model'),
  }),
  execute: async ({ context: { promptTokens, completionTokens, modelName } }) => {
    const service = new TokenService();
    const usage = {
      promptTokens,
      completionTokens,
      totalTokens: promptTokens + completionTokens,
    };
    
    const totalCost = service.calculateCost(usage, modelName);
    const pricing = service.getModelPricing(modelName);
    
    let inputCost = 0;
    let outputCost = 0;
    
    if (pricing) {
      inputCost = (promptTokens / 1000) * pricing.inputTokenPrice;
      outputCost = (completionTokens / 1000) * pricing.outputTokenPrice;
    }
    
    return {
      cost: totalCost,
      inputCost,
      outputCost,
      currency: 'USD',
      pricing: pricing || undefined,
    };
  },
});

/**
 * Tool for checking user token limits
 */
export const checkTokenLimitsTool = createTool({
  id: 'check-token-limits',
  description: 'Check if a user can make a request within their token limits',
  inputSchema: z.object({
    userId: z.string().describe('User ID to check limits for'),
    requestTokens: z.number().describe('Number of tokens for the planned request'),
    maxTokensPerRequest: z.number().optional().describe('Custom per-request token limit'),
    maxTokensPerDay: z.number().optional().describe('Custom daily token limit'),
    maxTokensPerMonth: z.number().optional().describe('Custom monthly token limit'),
  }),
  outputSchema: z.object({
    allowed: z.boolean().describe('Whether the request is allowed'),
    reason: z.string().optional().describe('Reason if request is not allowed'),
    remainingDaily: z.number().optional().describe('Remaining daily tokens'),
    remainingMonthly: z.number().optional().describe('Remaining monthly tokens'),
  }),
  execute: async ({ context: { userId, requestTokens, maxTokensPerRequest, maxTokensPerDay, maxTokensPerMonth } }) => {
    const service = new TokenService();
    const customLimits = {
      ...(maxTokensPerRequest && { maxTokensPerRequest }),
      ...(maxTokensPerDay && { maxTokensPerDay }),
      ...(maxTokensPerMonth && { maxTokensPerMonth }),
    };
    
    const result = service.checkLimits(userId, requestTokens, customLimits);
    return {
      allowed: result.allowed,
      reason: result.reason,
      remainingDaily: result.remainingDaily,
      remainingMonthly: result.remainingMonthly,
    };
  },
});

/**
 * Tool for tracking token usage
 */
export const trackTokenUsageTool = createTool({
  id: 'track-token-usage',
  description: 'Track token usage for a user',
  inputSchema: z.object({
    userId: z.string().describe('User ID to track usage for'),
    promptTokens: z.number().describe('Number of input/prompt tokens used'),
    completionTokens: z.number().describe('Number of output/completion tokens used'),
    modelName: z.string().describe('Name of the LLM model used'),
  }),
  outputSchema: z.object({
    success: z.boolean().describe('Whether usage was tracked successfully'),
    cost: z.number().describe('Cost of this usage'),
    totalUsage: z.number().describe('User total token usage after this request'),
    dailyUsage: z.number().describe('User daily token usage after this request'),
    monthlyUsage: z.number().describe('User monthly token usage after this request'),
  }),
  execute: async ({ context: { userId, promptTokens, completionTokens, modelName } }) => {
    const service = new TokenService();
    const usage = {
      promptTokens,
      completionTokens,
      totalTokens: promptTokens + completionTokens,
    };
    
    const cost = service.calculateCost(usage, modelName);
    service.trackUsage(userId, usage, modelName);
    
    const userUsage = service.getUserUsage(userId);
    
    return {
      success: true,
      cost,
      totalUsage: userUsage?.totalUsage || 0,
      dailyUsage: userUsage?.dailyUsage || 0,
      monthlyUsage: userUsage?.monthlyUsage || 0,
    };
  },
});

/**
 * Tool for getting user usage statistics
 */
export const getUserUsageTool = createTool({
  id: 'get-user-usage',
  description: 'Get token usage statistics for a user',
  inputSchema: z.object({
    userId: z.string().describe('User ID to get usage for'),
  }),
  outputSchema: z.object({
    found: z.boolean().describe('Whether user usage data was found'),
    userId: z.string().describe('User ID'),
    totalUsage: z.number().optional().describe('Total tokens used by user'),
    dailyUsage: z.number().optional().describe('Daily tokens used by user'),
    monthlyUsage: z.number().optional().describe('Monthly tokens used by user'),
    lastUsageDate: z.string().optional().describe('Last usage date (ISO string)'),
  }),
  execute: async ({ context: { userId } }) => {
    const service = new TokenService();
    const usage = service.getUserUsage(userId);
    
    if (!usage) {
      return {
        found: false,
        userId,
      };
    }
    
    return {
      found: true,
      userId,
      totalUsage: usage.totalUsage,
      dailyUsage: usage.dailyUsage,
      monthlyUsage: usage.monthlyUsage,
      lastUsageDate: usage.lastUsageDate.toISOString(),
    };
  },
});

/**
 * Tool for getting supported models and pricing
 */
export const getSupportedModelsTool = createTool({
  id: 'get-supported-models',
  description: 'Get list of supported models with pricing information',
  inputSchema: z.object({}),
  outputSchema: z.object({
    models: z.array(z.object({
      model: z.string().describe('Model name'),
      inputTokenPrice: z.number().describe('Price per 1K input tokens'),
      outputTokenPrice: z.number().describe('Price per 1K output tokens'),
      currency: z.string().describe('Currency'),
    })).describe('Array of supported models with pricing'),
    count: z.number().describe('Number of supported models'),
  }),
  execute: async () => {
    const service = new TokenService();
    const supportedModels = service.getSupportedModels();
    
    const models = supportedModels.map(({ model, pricing }) => ({
      model,
      inputTokenPrice: pricing.inputTokenPrice,
      outputTokenPrice: pricing.outputTokenPrice,
      currency: pricing.currency,
    }));
    
    return {
      models,
      count: models.length,
    };
  },
});

/**
 * Tool for getting service statistics
 */
export const getTokenServiceStatsTool = createTool({
  id: 'get-token-service-stats',
  description: 'Get overall token service statistics',
  inputSchema: z.object({}),
  outputSchema: z.object({
    totalUsers: z.number().describe('Total number of users tracked'),
    totalTokensUsed: z.number().describe('Total tokens used across all users'),
    supportedModels: z.number().describe('Number of supported models'),
  }),
  execute: async () => {
    const service = new TokenService();
    const stats = service.getServiceStats();
    
    return {
      totalUsers: stats.totalUsers,
      totalTokensUsed: stats.totalTokensUsed,
      supportedModels: stats.supportedModels,
    };
  },
});

/**
 * Tool for setting custom model pricing
 */
export const setModelPricingTool = createTool({
  id: 'set-model-pricing',
  description: 'Set custom pricing for a model',
  inputSchema: z.object({
    modelName: z.string().describe('Name of the model'),
    inputTokenPrice: z.number().describe('Price per 1K input tokens'),
    outputTokenPrice: z.number().describe('Price per 1K output tokens'),
    currency: z.string().default('USD').describe('Currency for pricing'),
  }),
  outputSchema: z.object({
    success: z.boolean().describe('Whether pricing was set successfully'),
    modelName: z.string().describe('Model name'),
    pricing: z.object({
      inputTokenPrice: z.number(),
      outputTokenPrice: z.number(),
      currency: z.string(),
    }).describe('Set pricing information'),
  }),
  execute: async ({ context: { modelName, inputTokenPrice, outputTokenPrice, currency } }) => {
    const service = new TokenService();
    const pricing = {
      inputTokenPrice,
      outputTokenPrice,
      currency,
    };
    
    service.setModelPricing(modelName, pricing);
    
    return {
      success: true,
      modelName,
      pricing,
    };
  },
});
