/**
 * Model Manager - Unified model management system
 * 
 * Handles multiple AI providers (DeepSeek, Claude, GPT) with dynamic model selection
 */

import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { LanguageModel } from 'ai';

export interface ModelConfig {
  modelName: string;
  modelKey: string;
  useImage: boolean;
  provider: string;
  functionCall: boolean;
  apiKey?: string;
  apiUrl?: string;
}

/**
 * Model Manager Class
 */
export class ModelManager {
  private modelConfigs: ModelConfig[] = [
    {
      modelName: "claude-3-5-sonnet-20241022",
      modelKey: "claude-3-5-sonnet",
      useImage: true,
      provider: "anthropic",
      functionCall: true,
      apiKey: process.env.ANTHROPIC_API_KEY,
      apiUrl: process.env.ANTHROPIC_API_URL || "https://api.anthropic.com",
    },
    {
      modelName: "gpt-4o-mini",
      modelKey: "gpt-4o-mini",
      useImage: true,
      provider: "openai",
      functionCall: true,
      apiKey: process.env.OPENAI_API_KEY,
      apiUrl: process.env.OPENAI_API_URL || "https://api.openai.com/v1",
    },
    {
      modelName: "deepseek-reasoner",
      modelKey: "deepseek-reasoner",
      useImage: false,
      provider: "deepseek",
      functionCall: false,
      apiKey: process.env.DEEPSEEK_API_KEY,
      apiUrl: process.env.DEEPSEEK_API_URL || "https://api.deepseek.com/v1",
    },
    {
      modelName: "deepseek-chat",
      modelKey: "deepseek-chat",
      useImage: false,
      provider: "deepseek",
      functionCall: true,
      apiKey: process.env.DEEPSEEK_API_KEY,
      apiUrl: process.env.DEEPSEEK_API_URL || "https://api.deepseek.com/v1",
    },
  ];

  /**
   * Get model configuration by key
   */
  getModelConfig(modelKey: string): ModelConfig | undefined {
    return this.modelConfigs.find(config => config.modelKey === modelKey);
  }

  /**
   * Get all model configurations
   */
  getAllConfigs(): ModelConfig[] {
    return this.modelConfigs;
  }

  /**
   * Get public model configurations (without API keys)
   */
  getPublicConfigs() {
    return this.modelConfigs.map(config => ({
      label: this.getDisplayName(config.modelKey),
      value: config.modelKey,
      useImage: config.useImage,
      description: this.getDescription(config.modelKey),
      icon: this.getIcon(config.provider),
      provider: config.provider,
      functionCall: config.functionCall,
    }));
  }

  /**
   * Create a language model instance by key
   */
  getModelByKey(modelKey: string): LanguageModel {
    const config = this.getModelConfig(modelKey);
    if (!config) {
      throw new Error(`Model ${modelKey} not found`);
    }

    if (!config.apiKey) {
      // In development/testing, return a mock model instead of throwing
      if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
        console.warn(`⚠️  API key not configured for model ${modelKey}, using mock model`);
        return this.createMockModel(config);
      }
      throw new Error(`API key not configured for model ${modelKey}`);
    }

    switch (config.provider) {
      case "deepseek":
        return this.createDeepSeekModel(config);
      case "anthropic":
        return this.createAnthropicModel(config);
      case "openai":
        return this.createOpenAIModel(config);
      default:
        throw new Error(`Unsupported provider: ${config.provider}`);
    }
  }

  /**
   * Create a mock model for testing/development
   */
  private createMockModel(config: ModelConfig): LanguageModel {
    // Create a mock model that implements the LanguageModel interface
    return {
      modelId: `mock-${config.modelKey}`,
      provider: config.provider,
      // Mock implementation that returns a simple response
      doGenerate: async () => ({
        text: 'This is a mock response for testing purposes.',
        finishReason: 'stop' as const,
        usage: { promptTokens: 10, completionTokens: 20 }
      }),
      doStream: async function* () {
        yield {
          type: 'text-delta' as const,
          textDelta: 'Mock streaming response'
        };
      }
    } as any; // Type assertion for mock
  }

  /**
   * Create DeepSeek model (OpenAI-compatible)
   */
  private createDeepSeekModel(config: ModelConfig): LanguageModel {
    const openai = createOpenAI({
      apiKey: config.apiKey!,
      baseURL: config.apiUrl,
    });
    return openai(config.modelName);
  }

  /**
   * Create Anthropic model
   */
  private createAnthropicModel(config: ModelConfig): LanguageModel {
    const anthropic = createAnthropic({
      apiKey: config.apiKey!,
      baseURL: config.apiUrl,
    });
    return anthropic(config.modelName);
  }

  /**
   * Create OpenAI model
   */
  private createOpenAIModel(config: ModelConfig): LanguageModel {
    const openai = createOpenAI({
      apiKey: config.apiKey!,
      baseURL: config.apiUrl,
    });
    return openai(config.modelName);
  }

  /**
   * Get display name for model
   */
  private getDisplayName(modelKey: string): string {
    const displayNames: Record<string, string> = {
      'claude-3-5-sonnet': 'Claude 3.5 Sonnet',
      'gpt-4o-mini': 'GPT-4o Mini',
      'deepseek-reasoner': 'DeepSeek Reasoner',
      'deepseek-chat': 'DeepSeek Chat',
    };
    return displayNames[modelKey] || modelKey;
  }

  /**
   * Get description for model
   */
  private getDescription(modelKey: string): string {
    const descriptions: Record<string, string> = {
      'claude-3-5-sonnet': "Anthropic's most capable model with vision support",
      'gpt-4o-mini': "OpenAI's efficient model with vision support",
      'deepseek-reasoner': "DeepSeek's reasoning-focused model",
      'deepseek-chat': "DeepSeek's conversational model with tool support",
    };
    return descriptions[modelKey] || 'AI language model';
  }

  /**
   * Get icon URL for provider
   */
  private getIcon(provider: string): string {
    const icons: Record<string, string> = {
      anthropic: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/anthropic/anthropic-original.svg",
      openai: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/openai/openai-original.svg",
      deepseek: "https://files.deepseek.com/api/file/deepseek-logo.svg",
    };
    return icons[provider] || '';
  }

  /**
   * Validate model configuration
   */
  validateConfig(modelKey: string): boolean {
    const config = this.getModelConfig(modelKey);
    return !!(config && config.apiKey);
  }
}

// Export singleton instance
export const modelManager = new ModelManager();
