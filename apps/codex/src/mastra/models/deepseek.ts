import { createOpenAICompatible } from '@ai-sdk/openai-compatible';

/**
 * DeepSeek AI Model Provider
 *
 * DeepSeek provides OpenAI-compatible API endpoints for their language models.
 * This module configures the provider to work seamlessly with Mastra agents.
 *
 * @see https://platform.deepseek.com/api-docs for API documentation
 * @see https://mastra.ai/docs/getting-started/model-providers for Mastra model provider guide
 *
 * Environment variables required:
 * - DEEPSEEK_API_KEY: Your DeepSeek API key from https://platform.deepseek.com/api_keys
 * - DEEPSEEK_BASE_URL: DeepSeek API base URL (optional, defaults to official endpoint)
 */

// Configuration constants
const DEEPSEEK_BASE_URL = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1';
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;

// Validate required environment variables
if (!DEEPSEEK_API_KEY) {
  throw new Error(
    'DEEPSEEK_API_KEY environment variable is required. ' +
    'Get your API key from https://platform.deepseek.com/api_keys'
  );
}

/**
 * Create DeepSeek provider instance using OpenAI-compatible interface
 *
 * This follows Mastra's recommended pattern for OpenAI-compatible providers
 * as documented in the model providers guide.
 */
export const deepseek = createOpenAICompatible({
  name: 'deepseek',
  baseURL: DEEPSEEK_BASE_URL,
  apiKey: DEEPSEEK_API_KEY,
  headers: {
    'Content-Type': 'application/json',
    'User-Agent': 'Mastra-DeepSeek-Provider/1.0.0',
  },
});

// Available DeepSeek models (verified from API: 2025-01-23)
export const DEEPSEEK_MODELS = {
  // DeepSeek Chat - 通用对话和代码生成，支持多种编程任务
  CHAT: 'deepseek-chat',

  // DeepSeek Reasoner - 复杂推理和深度分析，适合架构设计等任务
  REASONER: 'deepseek-reasoner',
} as const;

// Helper function to create DeepSeek model instances
export const createDeepSeekModel = (model: string = DEEPSEEK_MODELS.CHAT) => {
  return deepseek(model);
};

// 主要模型导出
export const deepseekChat = () => createDeepSeekModel(DEEPSEEK_MODELS.CHAT);
export const deepseekReasoner = () => createDeepSeekModel(DEEPSEEK_MODELS.REASONER);

// 向后兼容的别名导出
export const deepseekCoder = () => createDeepSeekModel(DEEPSEEK_MODELS.CHAT); // 代码生成使用 chat 模型
export const deepseekR1 = () => createDeepSeekModel(DEEPSEEK_MODELS.REASONER); // R1 推理使用 reasoner 模型
export const deepseekV3 = () => createDeepSeekModel(DEEPSEEK_MODELS.CHAT); // V3 功能通过 chat 模型提供

/**
 * Model-specific configurations with parameter support
 *
 * These functions create model instances with custom parameters
 * following Mastra's model configuration patterns.
 */

export interface DeepSeekModelOptions {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
}

export const createDeepSeekChatModel = (options: DeepSeekModelOptions = {}) => {
  const model = createDeepSeekModel(DEEPSEEK_MODELS.CHAT);

  // Apply configuration options if provided
  if (Object.keys(options).length > 0) {
    // Note: AI SDK models are configured at generation time, not creation time
    // These options would be passed to the generate() call
    console.log('DeepSeek Chat model created with options:', options);
  }

  return model;
};

export const createDeepSeekCoderModel = (options: DeepSeekModelOptions = {}) => {
  const model = createDeepSeekModel(DEEPSEEK_MODELS.CHAT); // 使用 chat 模型进行代码生成

  // Apply configuration options if provided
  if (Object.keys(options).length > 0) {
    console.log('DeepSeek Coder model created with options:', options);
  }

  return model;
};

/**
 * DeepSeek Model Capabilities and Configuration
 *
 * This configuration object provides information about DeepSeek model
 * capabilities and recommended settings for optimal performance.
 */
export const DEEPSEEK_CONFIG = {
  // Maximum context length for available models (verified from API)
  maxTokens: {
    [DEEPSEEK_MODELS.CHAT]: 32768,      // DeepSeek Chat supports 32K context
    [DEEPSEEK_MODELS.REASONER]: 64000,  // DeepSeek Reasoner supports 64K context
  },

  // Recommended default parameters for optimal performance
  defaultParams: {
    temperature: 0.7,        // Balanced creativity vs consistency
    top_p: 0.9,             // Nucleus sampling parameter
    max_tokens: 2048,       // Conservative output limit
    frequency_penalty: 0,   // No repetition penalty by default
    presence_penalty: 0,    // No presence penalty by default
  },

  // Model capabilities based on DeepSeek documentation
  features: {
    streaming: true,         // Supports streaming responses
    functionCalling: true,   // Supports tool/function calling
    vision: false,          // Vision not supported yet
    embedding: false,       // No embedding models
    jsonMode: true,         // Supports JSON output format
    systemMessages: true,   // Supports system messages
  },

  // Recommended use cases for available models
  useCases: {
    [DEEPSEEK_MODELS.CHAT]: [
      'General conversation',
      'Code generation and review',
      'Creative writing',
      'Technical documentation',
      'Debugging assistance',
      'Algorithm explanation',
      'Question answering'
    ],
    [DEEPSEEK_MODELS.REASONER]: [
      'Complex reasoning tasks',
      'Mathematical problem solving',
      'Advanced logical analysis',
      'Multi-step reasoning',
      'Research assistance',
      'Chain-of-thought reasoning'
    ],
  },
} as const;

export default deepseek;
