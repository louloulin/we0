/**
 * Token Management Service
 * 
 * Handles token counting, usage tracking, and billing for the Builder Agent
 * Compatible with various LLM providers and token counting methods
 */

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cost?: number;
}

export interface TokenLimits {
  maxTokensPerRequest: number;
  maxTokensPerDay: number;
  maxTokensPerMonth: number;
}

export interface TokenPricing {
  inputTokenPrice: number;  // Price per 1K input tokens
  outputTokenPrice: number; // Price per 1K output tokens
  currency: string;
}

export interface UserTokenUsage {
  userId: string;
  dailyUsage: number;
  monthlyUsage: number;
  totalUsage: number;
  lastResetDate: Date;
  lastUsageDate: Date;
}

export interface TokenCountResult {
  tokens: number;
  characters: number;
  words: number;
}

/**
 * Token Management Service Class
 * Handles token counting, usage tracking, and cost calculation
 */
export class TokenService {
  private modelPricing: Map<string, TokenPricing> = new Map();
  private userUsage: Map<string, UserTokenUsage> = new Map();
  private defaultLimits: TokenLimits;

  constructor(defaultLimits?: Partial<TokenLimits>) {
    this.defaultLimits = {
      maxTokensPerRequest: 4000,
      maxTokensPerDay: 100000,
      maxTokensPerMonth: 1000000,
      ...defaultLimits,
    };

    // Initialize default pricing for common models
    this.initializeDefaultPricing();
  }

  /**
   * Initialize default pricing for common LLM models
   */
  private initializeDefaultPricing(): void {
    // OpenAI GPT-4 pricing (as of 2024)
    this.modelPricing.set('gpt-4', {
      inputTokenPrice: 0.03,   // $0.03 per 1K tokens
      outputTokenPrice: 0.06,  // $0.06 per 1K tokens
      currency: 'USD',
    });

    this.modelPricing.set('gpt-4-turbo', {
      inputTokenPrice: 0.01,
      outputTokenPrice: 0.03,
      currency: 'USD',
    });

    this.modelPricing.set('gpt-3.5-turbo', {
      inputTokenPrice: 0.0015,
      outputTokenPrice: 0.002,
      currency: 'USD',
    });

    // Claude pricing
    this.modelPricing.set('claude-3-opus', {
      inputTokenPrice: 0.015,
      outputTokenPrice: 0.075,
      currency: 'USD',
    });

    this.modelPricing.set('claude-3-sonnet', {
      inputTokenPrice: 0.003,
      outputTokenPrice: 0.015,
      currency: 'USD',
    });

    this.modelPricing.set('claude-3-haiku', {
      inputTokenPrice: 0.00025,
      outputTokenPrice: 0.00125,
      currency: 'USD',
    });
  }

  /**
   * Count tokens in text using a simple approximation
   * For production, consider using tiktoken or similar libraries
   */
  countTokens(text: string): TokenCountResult {
    if (!text || typeof text !== 'string') {
      return { tokens: 0, characters: 0, words: 0 };
    }

    const characters = text.length;
    const words = text.trim().split(/\s+/).filter(word => word.length > 0).length;
    
    // Rough approximation: 1 token ≈ 4 characters for English text
    // This is a simplified approach; real tokenization varies by model
    const tokens = Math.ceil(characters / 4);

    return { tokens, characters, words };
  }

  /**
   * Count tokens for messages array (common in chat completions)
   */
  countMessagesTokens(messages: Array<{ role: string; content: string }>): TokenCountResult {
    let totalText = '';
    
    for (const message of messages) {
      // Add some overhead for message structure
      totalText += `${message.role}: ${message.content}\n`;
    }

    const result = this.countTokens(totalText);
    
    // Add overhead for message formatting (rough estimate)
    result.tokens += messages.length * 4;
    
    return result;
  }

  /**
   * Calculate cost for token usage
   */
  calculateCost(usage: TokenUsage, modelName: string): number {
    const pricing = this.modelPricing.get(modelName);
    if (!pricing) {
      console.warn(`No pricing found for model: ${modelName}`);
      return 0;
    }

    const inputCost = (usage.promptTokens / 1000) * pricing.inputTokenPrice;
    const outputCost = (usage.completionTokens / 1000) * pricing.outputTokenPrice;
    
    return inputCost + outputCost;
  }

  /**
   * Track token usage for a user
   */
  trackUsage(userId: string, usage: TokenUsage, modelName: string): void {
    const cost = this.calculateCost(usage, modelName);
    const now = new Date();

    let userUsage = this.userUsage.get(userId);
    if (!userUsage) {
      userUsage = {
        userId,
        dailyUsage: 0,
        monthlyUsage: 0,
        totalUsage: 0,
        lastResetDate: now,
        lastUsageDate: now,
      };
      this.userUsage.set(userId, userUsage);
    }

    // Check if we need to reset daily/monthly counters
    this.resetUsageCountersIfNeeded(userUsage, now);

    // Update usage
    userUsage.dailyUsage += usage.totalTokens;
    userUsage.monthlyUsage += usage.totalTokens;
    userUsage.totalUsage += usage.totalTokens;
    userUsage.lastUsageDate = now;
  }

  /**
   * Reset usage counters if needed (daily/monthly)
   */
  private resetUsageCountersIfNeeded(userUsage: UserTokenUsage, now: Date): void {
    const lastReset = userUsage.lastResetDate;
    
    // Reset daily counter if it's a new day
    if (now.getDate() !== lastReset.getDate() || 
        now.getMonth() !== lastReset.getMonth() || 
        now.getFullYear() !== lastReset.getFullYear()) {
      userUsage.dailyUsage = 0;
    }

    // Reset monthly counter if it's a new month
    if (now.getMonth() !== lastReset.getMonth() || 
        now.getFullYear() !== lastReset.getFullYear()) {
      userUsage.monthlyUsage = 0;
    }

    userUsage.lastResetDate = now;
  }

  /**
   * Check if user has exceeded limits
   */
  checkLimits(userId: string, requestTokens: number, limits?: Partial<TokenLimits>): {
    allowed: boolean;
    reason?: string;
    remainingDaily?: number;
    remainingMonthly?: number;
  } {
    const effectiveLimits = { ...this.defaultLimits, ...limits };
    const userUsage = this.userUsage.get(userId);

    // Check request size limit
    if (requestTokens > effectiveLimits.maxTokensPerRequest) {
      return {
        allowed: false,
        reason: `Request exceeds maximum tokens per request (${effectiveLimits.maxTokensPerRequest})`,
      };
    }

    if (!userUsage) {
      return {
        allowed: true,
        remainingDaily: effectiveLimits.maxTokensPerDay,
        remainingMonthly: effectiveLimits.maxTokensPerMonth,
      };
    }

    // Update counters if needed
    this.resetUsageCountersIfNeeded(userUsage, new Date());

    // Check daily limit
    if (userUsage.dailyUsage + requestTokens > effectiveLimits.maxTokensPerDay) {
      return {
        allowed: false,
        reason: 'Daily token limit exceeded',
        remainingDaily: Math.max(0, effectiveLimits.maxTokensPerDay - userUsage.dailyUsage),
        remainingMonthly: Math.max(0, effectiveLimits.maxTokensPerMonth - userUsage.monthlyUsage),
      };
    }

    // Check monthly limit
    if (userUsage.monthlyUsage + requestTokens > effectiveLimits.maxTokensPerMonth) {
      return {
        allowed: false,
        reason: 'Monthly token limit exceeded',
        remainingDaily: Math.max(0, effectiveLimits.maxTokensPerDay - userUsage.dailyUsage),
        remainingMonthly: Math.max(0, effectiveLimits.maxTokensPerMonth - userUsage.monthlyUsage),
      };
    }

    return {
      allowed: true,
      remainingDaily: effectiveLimits.maxTokensPerDay - userUsage.dailyUsage,
      remainingMonthly: effectiveLimits.maxTokensPerMonth - userUsage.monthlyUsage,
    };
  }

  /**
   * Get user usage statistics
   */
  getUserUsage(userId: string): UserTokenUsage | null {
    const usage = this.userUsage.get(userId);
    if (!usage) return null;

    // Update counters if needed
    this.resetUsageCountersIfNeeded(usage, new Date());
    
    return { ...usage };
  }

  /**
   * Set custom pricing for a model
   */
  setModelPricing(modelName: string, pricing: TokenPricing): void {
    this.modelPricing.set(modelName, pricing);
  }

  /**
   * Get pricing for a model
   */
  getModelPricing(modelName: string): TokenPricing | null {
    return this.modelPricing.get(modelName) || null;
  }

  /**
   * Get all supported models with pricing
   */
  getSupportedModels(): Array<{ model: string; pricing: TokenPricing }> {
    return Array.from(this.modelPricing.entries()).map(([model, pricing]) => ({
      model,
      pricing,
    }));
  }

  /**
   * Clear usage data for a user (useful for testing or admin operations)
   */
  clearUserUsage(userId: string): void {
    this.userUsage.delete(userId);
  }

  /**
   * Get service statistics
   */
  getServiceStats(): {
    totalUsers: number;
    totalTokensUsed: number;
    supportedModels: number;
  } {
    let totalTokensUsed = 0;
    
    for (const usage of this.userUsage.values()) {
      totalTokensUsed += usage.totalUsage;
    }

    return {
      totalUsers: this.userUsage.size,
      totalTokensUsed,
      supportedModels: this.modelPricing.size,
    };
  }
}

// Global token service instance
export const tokenService = new TokenService();

/**
 * Convenience function for counting tokens
 */
export function countTokens(text: string): TokenCountResult {
  return tokenService.countTokens(text);
}

/**
 * Convenience function for calculating cost
 */
export function calculateTokenCost(usage: TokenUsage, modelName: string): number {
  return tokenService.calculateCost(usage, modelName);
}
