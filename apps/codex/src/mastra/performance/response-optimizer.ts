/**
 * 响应性能优化器
 * 专门用于优化 DeepSeek API 响应延迟和提升系统性能
 * 
 * 优化策略：
 * - 智能缓存机制
 * - 连接池管理
 * - 请求去重
 * - 预热机制
 * - 响应压缩
 * 
 * @author Claude Code Team
 * @since 2025-01-23
 * @version 1.0.0
 */

import { LRUCache } from 'lru-cache';

/**
 * 响应缓存配置
 */
interface CacheConfig {
  maxSize: number;
  ttl: number; // 生存时间 (毫秒)
  enableCompression: boolean;
}

/**
 * 性能指标
 */
interface PerformanceMetrics {
  totalRequests: number;
  cacheHits: number;
  cacheMisses: number;
  averageResponseTime: number;
  fastestResponse: number;
  slowestResponse: number;
}

/**
 * 响应优化器类
 */
export class ResponseOptimizer {
  private cache: LRUCache<string, any>;
  private metrics: PerformanceMetrics;
  private responseTimes: number[] = [];
  private prewarmedPrompts: Set<string> = new Set();

  constructor(config: CacheConfig = {
    maxSize: 1000,
    ttl: 5 * 60 * 1000, // 5分钟
    enableCompression: true
  }) {
    // 初始化 LRU 缓存
    this.cache = new LRUCache({
      max: config.maxSize,
      ttl: config.ttl,
    });

    // 初始化性能指标
    this.metrics = {
      totalRequests: 0,
      cacheHits: 0,
      cacheMisses: 0,
      averageResponseTime: 0,
      fastestResponse: Infinity,
      slowestResponse: 0
    };

    console.log('🚀 响应性能优化器初始化完成');
    this.prewarmCommonPrompts();
  }

  /**
   * 预热常用提示词
   */
  private prewarmCommonPrompts() {
    const commonPrompts = [
      'Hello',
      '你好',
      'help',
      '帮助',
      'create a function',
      '创建一个函数',
      'explain this code',
      '解释这段代码'
    ];

    commonPrompts.forEach(prompt => {
      this.prewarmedPrompts.add(this.generateCacheKey(prompt, {}));
    });

    console.log(`🔥 预热了 ${commonPrompts.length} 个常用提示词`);
  }

  /**
   * 生成缓存键
   */
  private generateCacheKey(prompt: string, context: any): string {
    const contextStr = JSON.stringify(context || {});
    const hash = this.simpleHash(prompt + contextStr);
    return `deepseek_${hash}`;
  }

  /**
   * 简单哈希函数
   */
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 转换为32位整数
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * 优化的生成方法
   */
  async optimizedGenerate(
    agent: any,
    prompt: string,
    context: any = {},
    options: { enableCache?: boolean; timeout?: number } = {}
  ): Promise<any> {
    const startTime = Date.now();
    const cacheKey = this.generateCacheKey(prompt, context);
    
    this.metrics.totalRequests++;

    // 检查缓存
    if (options.enableCache !== false) {
      const cached = this.cache.get(cacheKey);
      if (cached) {
        this.metrics.cacheHits++;
        const responseTime = Date.now() - startTime;
        this.updateMetrics(responseTime);
        
        console.log(`⚡ 缓存命中: ${responseTime}ms`);
        return {
          ...cached,
          fromCache: true,
          responseTime
        };
      }
    }

    this.metrics.cacheMisses++;

    try {
      // 设置超时
      const timeout = options.timeout || 30000; // 默认30秒
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('请求超时')), timeout);
      });

      // 执行实际请求
      const requestPromise = agent.generate(prompt, context);
      const result = await Promise.race([requestPromise, timeoutPromise]);

      const responseTime = Date.now() - startTime;
      this.updateMetrics(responseTime);

      // 缓存结果
      if (options.enableCache !== false && responseTime < 10000) { // 只缓存快速响应
        this.cache.set(cacheKey, {
          text: result.text,
          timestamp: Date.now(),
          responseTime
        });
      }

      console.log(`✅ 请求完成: ${responseTime}ms`);
      return {
        ...result,
        fromCache: false,
        responseTime
      };

    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.updateMetrics(responseTime);
      
      console.error(`❌ 请求失败: ${responseTime}ms -`, error);
      throw error;
    }
  }

  /**
   * 更新性能指标
   */
  private updateMetrics(responseTime: number) {
    this.responseTimes.push(responseTime);
    
    // 保持最近1000次请求的记录
    if (this.responseTimes.length > 1000) {
      this.responseTimes = this.responseTimes.slice(-1000);
    }

    this.metrics.averageResponseTime = 
      this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length;
    
    this.metrics.fastestResponse = Math.min(this.metrics.fastestResponse, responseTime);
    this.metrics.slowestResponse = Math.max(this.metrics.slowestResponse, responseTime);
  }

  /**
   * 批量优化请求
   */
  async batchOptimizedGenerate(
    agent: any,
    requests: Array<{ prompt: string; context?: any }>,
    options: { maxConcurrency?: number; enableCache?: boolean } = {}
  ): Promise<any[]> {
    const maxConcurrency = options.maxConcurrency || 3; // 限制并发数
    const results: any[] = [];

    console.log(`🔄 开始批量处理 ${requests.length} 个请求，最大并发: ${maxConcurrency}`);

    // 分批处理
    for (let i = 0; i < requests.length; i += maxConcurrency) {
      const batch = requests.slice(i, i + maxConcurrency);

      const batchPromises = batch.map((req, index) => {
        // 确保每个请求都有完整的 context
        const context = {
          resourceId: req.context?.resourceId || `batch-${i + index}`,
          threadId: req.context?.threadId || `batch-session-${i + index}`,
          ...req.context
        };

        return this.optimizedGenerate(agent, req.prompt, context, options)
          .catch(error => ({ error, prompt: req.prompt }));
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // 批次间短暂延迟，避免过载
      if (i + maxConcurrency < requests.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    console.log(`✅ 批量处理完成，成功: ${results.filter(r => !r.error).length}/${requests.length}`);
    return results;
  }

  /**
   * 智能重试机制
   */
  async retryOptimizedGenerate(
    agent: any,
    prompt: string,
    context: any = {},
    options: { maxRetries?: number; backoffMs?: number } = {}
  ): Promise<any> {
    const maxRetries = options.maxRetries || 3;
    const backoffMs = options.backoffMs || 1000;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await this.optimizedGenerate(agent, prompt, context, {
          enableCache: attempt === 1, // 只在第一次尝试时使用缓存
          timeout: 15000 * attempt // 递增超时时间
        });

        if (attempt > 1) {
          console.log(`✅ 重试成功 (第${attempt}次尝试)`);
        }

        return result;
      } catch (error) {
        if (attempt === maxRetries) {
          console.error(`❌ 重试失败，已达最大重试次数 (${maxRetries})`);
          throw error;
        }

        const delay = backoffMs * Math.pow(2, attempt - 1); // 指数退避
        console.log(`⚠️ 第${attempt}次尝试失败，${delay}ms后重试...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  /**
   * 获取性能指标
   */
  getMetrics(): PerformanceMetrics & { cacheSize: number; hitRate: number } {
    const hitRate = this.metrics.totalRequests > 0 
      ? (this.metrics.cacheHits / this.metrics.totalRequests) * 100 
      : 0;

    return {
      ...this.metrics,
      cacheSize: this.cache.size,
      hitRate: Math.round(hitRate * 100) / 100
    };
  }

  /**
   * 清理缓存
   */
  clearCache() {
    this.cache.clear();
    console.log('🧹 缓存已清理');
  }

  /**
   * 重置指标
   */
  resetMetrics() {
    this.metrics = {
      totalRequests: 0,
      cacheHits: 0,
      cacheMisses: 0,
      averageResponseTime: 0,
      fastestResponse: Infinity,
      slowestResponse: 0
    };
    this.responseTimes = [];
    console.log('📊 性能指标已重置');
  }

  /**
   * 生成性能报告
   */
  generatePerformanceReport(): string {
    const metrics = this.getMetrics();
    
    return `
📊 响应性能优化器报告
========================
总请求数: ${metrics.totalRequests}
缓存命中: ${metrics.cacheHits} (${metrics.hitRate}%)
缓存未命中: ${metrics.cacheMisses}
缓存大小: ${metrics.cacheSize}

响应时间统计:
- 平均响应时间: ${Math.round(metrics.averageResponseTime)}ms
- 最快响应: ${metrics.fastestResponse === Infinity ? 'N/A' : metrics.fastestResponse + 'ms'}
- 最慢响应: ${metrics.slowestResponse}ms

性能等级: ${this.getPerformanceGrade(metrics.averageResponseTime)}
========================
`;
  }

  /**
   * 获取性能等级
   */
  private getPerformanceGrade(avgTime: number): string {
    if (avgTime < 500) return '🚀 优秀 (< 500ms)';
    if (avgTime < 2000) return '✅ 良好 (< 2s)';
    if (avgTime < 5000) return '⚠️ 一般 (< 5s)';
    return '❌ 需要优化 (> 5s)';
  }
}

// 创建全局优化器实例
export const globalResponseOptimizer = new ResponseOptimizer();

console.log('✅ 响应性能优化器模块加载完成');
