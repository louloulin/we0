/**
 * Model Configuration API Route - /api/model
 * 
 * Returns available model configurations compatible with we-dev-next
 */

import { registerApiRoute } from '@mastra/core/server';

// Model configuration interface matching we-dev-next
interface ModelConfig {
  label: string;        // Display name
  value: string;        // Model key
  useImage: boolean;    // Image support
  description: string;  // Model description
  icon: string;        // Icon URL
  provider: string;    // Provider name
  functionCall: boolean; // Tool calling support
}

/**
 * Get model configurations
 * Returns the same model list as we-dev-next for compatibility
 */
function getModelConfigs(): ModelConfig[] {
  return [
    {
      label: "Claude 3.5 Sonnet",
      value: "claude-3-5-sonnet-20241022",
      useImage: true,
      description: "Anthropic's most capable model with vision support",
      icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/anthropic/anthropic-original.svg",
      provider: "anthropic",
      functionCall: true,
    },
    {
      label: "GPT-4o Mini",
      value: "gpt-4o-mini",
      useImage: true,
      description: "OpenAI's efficient model with vision support",
      icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/openai/openai-original.svg",
      provider: "openai",
      functionCall: true,
    },
    {
      label: "DeepSeek Reasoner",
      value: "deepseek-reasoner",
      useImage: false,
      description: "DeepSeek's reasoning-focused model",
      icon: "https://files.deepseek.com/api/file/deepseek-logo.svg",
      provider: "deepseek",
      functionCall: false,
    },
    {
      label: "DeepSeek Chat",
      value: "deepseek-chat",
      useImage: false,
      description: "DeepSeek's conversational model with tool support",
      icon: "https://files.deepseek.com/api/file/deepseek-logo.svg",
      provider: "deepseek",
      functionCall: true,
    },
  ];
}

/**
 * Model configuration handler
 */
async function modelHandler(c: any) {
  try {
    const configs = getModelConfigs();
    
    return c.json(configs);
    
  } catch (error) {
    console.error('Model API Error:', error);
    
    return c.json({
      error: 'Failed to fetch model configurations',
      message: error instanceof Error ? error.message : String(error)
    }, 500);
  }
}

// Register the model API route
export const modelRoute = registerApiRoute('/model', {
  method: 'POST', // Note: we-dev-next uses POST, not GET
  handler: modelHandler,
  middleware: [
    // CORS middleware
    async (c, next) => {
      c.header('Access-Control-Allow-Origin', '*');
      c.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
      c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      
      if (c.req.method === 'OPTIONS') {
        return new Response(null, { status: 204 });
      }
      
      await next();
    },
    // Request logging
    async (c, next) => {
      const start = Date.now();
      await next();
      const duration = Date.now() - start;
      console.log(`${c.req.method} ${c.req.url} - ${duration}ms`);
    },
  ],
});

// Export model configurations for use in other modules
export { getModelConfigs, type ModelConfig };
