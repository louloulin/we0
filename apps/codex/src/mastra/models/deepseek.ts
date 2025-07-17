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

// Available DeepSeek models
export const DEEPSEEK_MODELS = {
  // DeepSeek Chat models
  CHAT: 'deepseek-chat',
  CODER: 'deepseek-coder',

  // DeepSeek Reasoning models
  REASONER: 'deepseek-reasoner',

  // DeepSeek R1 models (latest reasoning models)
  R1: 'deepseek-r1',
  R1_DISTILL_LLAMA_70B: 'deepseek-r1-distill-llama-70b',
  R1_DISTILL_QWEN_32B: 'deepseek-r1-distill-qwen-32b',
  R1_DISTILL_QWEN_14B: 'deepseek-r1-distill-qwen-14b',
  R1_DISTILL_QWEN_7B: 'deepseek-r1-distill-qwen-7b',
  R1_DISTILL_QWEN_1_5B: 'deepseek-r1-distill-qwen-1.5b',

  // Specific model versions (if needed)
  CHAT_V2: 'deepseek-chat-v2',
  CODER_V2: 'deepseek-coder-v2',

  // DeepSeek V3 models (latest generation)
  V3: 'deepseek-v3',
} as const;

// Helper function to create DeepSeek model instances
export const createDeepSeekModel = (model: string = DEEPSEEK_MODELS.CHAT) => {
  return deepseek(model);
};

// Convenience exports for common models
export const deepseekChat = () => createDeepSeekModel(DEEPSEEK_MODELS.CHAT);
export const deepseekCoder = () => createDeepSeekModel(DEEPSEEK_MODELS.CODER);
export const deepseekReasoner = () => createDeepSeekModel(DEEPSEEK_MODELS.REASONER);
export const deepseekR1 = () => createDeepSeekModel(DEEPSEEK_MODELS.R1);
export const deepseekV3 = () => createDeepSeekModel(DEEPSEEK_MODELS.V3);

// Convenience exports for R1 distilled models
export const deepseekR1Llama70B = () => createDeepSeekModel(DEEPSEEK_MODELS.R1_DISTILL_LLAMA_70B);
export const deepseekR1Qwen32B = () => createDeepSeekModel(DEEPSEEK_MODELS.R1_DISTILL_QWEN_32B);
export const deepseekR1Qwen14B = () => createDeepSeekModel(DEEPSEEK_MODELS.R1_DISTILL_QWEN_14B);
export const deepseekR1Qwen7B = () => createDeepSeekModel(DEEPSEEK_MODELS.R1_DISTILL_QWEN_7B);
export const deepseekR1Qwen1_5B = () => createDeepSeekModel(DEEPSEEK_MODELS.R1_DISTILL_QWEN_1_5B);

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
  const model = createDeepSeekModel(DEEPSEEK_MODELS.CODER);

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
  // Maximum context length for different models
  maxTokens: {
    [DEEPSEEK_MODELS.CHAT]: 32768,      // DeepSeek Chat supports 32K context
    [DEEPSEEK_MODELS.CODER]: 16384,     // DeepSeek Coder supports 16K context
    [DEEPSEEK_MODELS.REASONER]: 64000,  // DeepSeek Reasoner supports 64K context
    [DEEPSEEK_MODELS.R1]: 128000,       // DeepSeek R1 supports 128K context
    [DEEPSEEK_MODELS.V3]: 128000,       // DeepSeek V3 supports 128K context
    [DEEPSEEK_MODELS.CHAT_V2]: 32768,   // V2 models maintain same context
    [DEEPSEEK_MODELS.CODER_V2]: 16384,
    // R1 distilled models have varying context lengths
    [DEEPSEEK_MODELS.R1_DISTILL_LLAMA_70B]: 32768,
    [DEEPSEEK_MODELS.R1_DISTILL_QWEN_32B]: 32768,
    [DEEPSEEK_MODELS.R1_DISTILL_QWEN_14B]: 32768,
    [DEEPSEEK_MODELS.R1_DISTILL_QWEN_7B]: 32768,
    [DEEPSEEK_MODELS.R1_DISTILL_QWEN_1_5B]: 32768,
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

  // Recommended use cases for each model
  useCases: {
    [DEEPSEEK_MODELS.CHAT]: [
      'General conversation',
      'Question answering',
      'Creative writing',
      'Analysis and reasoning'
    ],
    [DEEPSEEK_MODELS.CODER]: [
      'Code generation',
      'Code review and analysis',
      'Debugging assistance',
      'Technical documentation'
    ],
    [DEEPSEEK_MODELS.REASONER]: [
      'Complex reasoning tasks',
      'Mathematical problem solving',
      'Logical analysis',
      'Multi-step reasoning'
    ],
    [DEEPSEEK_MODELS.R1]: [
      'Advanced reasoning',
      'Research assistance',
      'Complex problem solving',
      'Chain-of-thought reasoning'
    ],
    [DEEPSEEK_MODELS.V3]: [
      'Latest generation tasks',
      'High-performance reasoning',
      'Advanced code generation',
      'Complex analysis'
    ],
  },
} as const;

export default deepseek;
