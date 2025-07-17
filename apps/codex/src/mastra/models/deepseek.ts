import { createOpenAICompatible } from '@ai-sdk/openai-compatible';

/**
 * DeepSeek AI model provider configuration
 * 
 * DeepSeek provides OpenAI-compatible API endpoints for their language models.
 * This configuration sets up the provider to work with Mastra agents.
 * 
 * Environment variables required:
 * - DEEPSEEK_API_KEY: Your DeepSeek API key
 * - DEEPSEEK_BASE_URL: DeepSeek API base URL (optional, defaults to official endpoint)
 */

// DeepSeek API configuration
const DEEPSEEK_BASE_URL = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com';
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;

if (!DEEPSEEK_API_KEY) {
  throw new Error('DEEPSEEK_API_KEY environment variable is required');
}

// Create DeepSeek provider instance
export const deepseek = createOpenAICompatible({
  name: 'deepseek',
  baseUrl: `${DEEPSEEK_BASE_URL}/v1`,
  apiKey: DEEPSEEK_API_KEY,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Available DeepSeek models
export const DEEPSEEK_MODELS = {
  // DeepSeek Chat models
  CHAT: 'deepseek-chat',
  CODER: 'deepseek-coder',
  
  // Specific model versions (if needed)
  CHAT_V2: 'deepseek-chat-v2',
  CODER_V2: 'deepseek-coder-v2',
} as const;

// Helper function to create DeepSeek model instances
export const createDeepSeekModel = (model: string = DEEPSEEK_MODELS.CHAT) => {
  return deepseek(model);
};

// Convenience exports for common models
export const deepseekChat = () => createDeepSeekModel(DEEPSEEK_MODELS.CHAT);
export const deepseekCoder = () => createDeepSeekModel(DEEPSEEK_MODELS.CODER);

// Model-specific configurations
export const createDeepSeekChatModel = (options?: {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
}) => {
  const model = createDeepSeekModel(DEEPSEEK_MODELS.CHAT);
  // Apply any specific configurations for chat model
  return model;
};

export const createDeepSeekCoderModel = (options?: {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
}) => {
  const model = createDeepSeekModel(DEEPSEEK_MODELS.CODER);
  // Apply any specific configurations for coder model
  return model;
};

// Model capabilities and configurations
export const DEEPSEEK_CONFIG = {
  // Maximum tokens for different models
  maxTokens: {
    [DEEPSEEK_MODELS.CHAT]: 4096,
    [DEEPSEEK_MODELS.CODER]: 4096,
    [DEEPSEEK_MODELS.CHAT_V2]: 8192,
    [DEEPSEEK_MODELS.CODER_V2]: 8192,
  },
  
  // Default parameters
  defaultParams: {
    temperature: 0.7,
    top_p: 0.9,
    max_tokens: 2048,
  },
  
  // Supported features
  features: {
    streaming: true,
    functionCalling: true,
    vision: false, // DeepSeek doesn't support vision yet
    embedding: false,
  },
};

export default deepseek;
