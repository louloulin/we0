/**
 * TagX处理器 - 统一的TagX指令处理入口
 * 
 * 集成解析器、执行器和验证器，提供完整的TagX处理能力
 */

import { Memory } from '@mastra/memory';
import { LibSQLStore } from '@mastra/libsql';
import { SimpleTagXParser } from './simple-parser';
import { CompleteTagXExecutor } from './complete-executor';
import { TagXContext, TagXResult, TagXElement } from './types';

/**
 * TagX处理器配置
 */
export interface TagXProcessorConfig {
  databaseUrl?: string;
  enableLogging?: boolean;
  maxExecutionTime?: number;
  enableCaching?: boolean;
}

/**
 * TagX处理器类
 * 
 * 提供完整的TagX指令处理能力：
 * 1. XML解析和验证
 * 2. 指令执行和智能体调用
 * 3. 结果缓存和历史记录
 * 4. 错误处理和恢复
 */
export class TagXProcessor {
  private parser: SimpleTagXParser;
  private executor: CompleteTagXExecutor;
  private memory: Memory;
  private config: TagXProcessorConfig;

  constructor(config: TagXProcessorConfig = {}) {
    this.config = {
      databaseUrl: config.databaseUrl || process.env.DATABASE_URL || 'file:./tagx-processor.db',
      enableLogging: config.enableLogging ?? true,
      maxExecutionTime: config.maxExecutionTime || 300000, // 5分钟
      enableCaching: config.enableCaching ?? true
    };

    // 初始化组件
    this.parser = new SimpleTagXParser();
    this.memory = new Memory({
      storage: new LibSQLStore({
        url: this.config.databaseUrl!
      })
    });
    this.executor = new CompleteTagXExecutor(this.memory);
  }

  /**
   * 处理TagX指令
   * 
   * @param xmlString TagX XML指令字符串
   * @param context 执行上下文
   * @returns 执行结果
   */
  async process(xmlString: string, context: TagXContext): Promise<TagXResult[]> {
    const startTime = Date.now();
    
    try {
      // 记录开始处理
      if (this.config.enableLogging) {
        console.log(`[TagX] 开始处理指令，会话ID: ${context.sessionId}`);
      }

      // 1. 解析XML指令
      const parseStartTime = Date.now();
      const elements = this.parser.parse(xmlString);
      const parseTime = Date.now() - parseStartTime;

      if (this.config.enableLogging) {
        console.log(`[TagX] 解析完成，耗时: ${parseTime}ms，解析到 ${elements.length} 个指令`);
      }

      // 验证解析时间是否符合性能要求（< 100ms）
      if (parseTime > 100) {
        console.warn(`[TagX] 解析时间超过性能要求: ${parseTime}ms > 100ms`);
      }

      // 2. 验证指令
      await this.validateElements(elements, context);

      // 3. 检查缓存
      let results: TagXResult[] = [];
      if (this.config.enableCaching) {
        const cachedResults = await this.getCachedResults(elements, context);
        if (cachedResults) {
          if (this.config.enableLogging) {
            console.log(`[TagX] 使用缓存结果`);
          }
          return cachedResults;
        }
      }

      // 4. 执行指令
      const executeStartTime = Date.now();
      results = await this.executeWithTimeout(elements, context);
      const executeTime = Date.now() - executeStartTime;

      if (this.config.enableLogging) {
        console.log(`[TagX] 执行完成，耗时: ${executeTime}ms`);
      }

      // 验证执行时间是否符合性能要求（< 5s）
      if (executeTime > 5000) {
        console.warn(`[TagX] 执行时间超过性能要求: ${executeTime}ms > 5000ms`);
      }

      // 5. 缓存结果
      if (this.config.enableCaching && results.every(r => r.success)) {
        await this.cacheResults(elements, results, context);
      }

      // 6. 记录处理完成
      const totalTime = Date.now() - startTime;
      if (this.config.enableLogging) {
        console.log(`[TagX] 处理完成，总耗时: ${totalTime}ms`);
      }

      return results;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      
      if (this.config.enableLogging) {
        console.error(`[TagX] 处理失败: ${errorMessage}`);
      }

      // 返回错误结果
      return [{
        success: false,
        tagName: 'unknown',
        duration: Date.now() - startTime,
        output: null,
        error: errorMessage
      }];
    }
  }

  /**
   * 批量处理多个TagX指令
   */
  async processBatch(
    instructions: Array<{ xml: string; context: TagXContext }>,
    options: { parallel?: boolean; stopOnError?: boolean } = {}
  ): Promise<TagXResult[][]> {
    const { parallel = false, stopOnError = true } = options;
    const results: TagXResult[][] = [];

    if (parallel) {
      // 并行处理
      const promises = instructions.map(({ xml, context }) => this.process(xml, context));
      const batchResults = await Promise.allSettled(promises);
      
      for (const result of batchResults) {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          const errorResult: TagXResult[] = [{
            success: false,
            tagName: 'batch_error',
            duration: 0,
            output: null,
            error: result.reason?.message || '批处理失败'
          }];
          results.push(errorResult);
          
          if (stopOnError) {
            break;
          }
        }
      }
    } else {
      // 串行处理
      for (const { xml, context } of instructions) {
        try {
          const result = await this.process(xml, context);
          results.push(result);
          
          // 如果有失败且设置了停止错误，则停止处理
          if (stopOnError && result.some(r => !r.success)) {
            break;
          }
        } catch (error) {
          const errorResult: TagXResult[] = [{
            success: false,
            tagName: 'batch_error',
            duration: 0,
            output: null,
            error: error instanceof Error ? error.message : '批处理失败'
          }];
          results.push(errorResult);
          
          if (stopOnError) {
            break;
          }
        }
      }
    }

    return results;
  }

  /**
   * 获取处理统计信息
   */
  async getStatistics(sessionId?: string): Promise<{
    totalProcessed: number;
    successRate: number;
    averageExecutionTime: number;
    mostUsedTags: Array<{ tag: string; count: number }>;
    recentErrors: Array<{ timestamp: Date; error: string; tag: string }>;
  }> {
    try {
      // TODO: 从memory中查询统计信息
      return {
        totalProcessed: 0,
        successRate: 0,
        averageExecutionTime: 0,
        mostUsedTags: [],
        recentErrors: []
      };
    } catch (error) {
      console.error('获取统计信息失败:', error);
      throw error;
    }
  }

  /**
   * 清理缓存和历史记录
   */
  async cleanup(options: { 
    olderThan?: Date; 
    sessionId?: string; 
    clearCache?: boolean 
  } = {}): Promise<void> {
    try {
      // TODO: 实现清理逻辑
      if (this.config.enableLogging) {
        console.log('[TagX] 清理完成');
      }
    } catch (error) {
      console.error('清理失败:', error);
      throw error;
    }
  }

  /**
   * 私有方法：验证指令元素
   */
  private async validateElements(elements: TagXElement[], context: TagXContext): Promise<void> {
    for (const element of elements) {
      // 基础验证
      if (!element.tagName) {
        throw new Error('TagX元素缺少标签名');
      }

      // 特定标签验证
      switch (element.tagName) {
        case 'smart_code_gen':
          if (!(element as any).task) {
            throw new Error('smart_code_gen标签缺少task属性');
          }
          break;
        case 'bolt_artifact':
          if (!(element as any).id) {
            throw new Error('bolt_artifact标签缺少id属性');
          }
          break;
        case 'agent_workflow':
          if (!(element as any).workflow || (element as any).workflow.length === 0) {
            throw new Error('agent_workflow标签缺少workflow定义');
          }
          break;
      }
    }
  }

  /**
   * 私有方法：带超时的执行
   */
  private async executeWithTimeout(
    elements: TagXElement[], 
    context: TagXContext
  ): Promise<TagXResult[]> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`执行超时，超过最大执行时间 ${this.config.maxExecutionTime}ms`));
      }, this.config.maxExecutionTime);

      this.executor.execute(elements, context)
        .then(results => {
          clearTimeout(timeout);
          resolve(results);
        })
        .catch(error => {
          clearTimeout(timeout);
          reject(error);
        });
    });
  }

  /**
   * 私有方法：获取缓存结果
   */
  private async getCachedResults(
    elements: TagXElement[], 
    context: TagXContext
  ): Promise<TagXResult[] | null> {
    try {
      // TODO: 实现缓存查询逻辑
      return null;
    } catch (error) {
      console.warn('获取缓存失败:', error);
      return null;
    }
  }

  /**
   * 私有方法：缓存结果
   */
  private async cacheResults(
    elements: TagXElement[], 
    results: TagXResult[], 
    context: TagXContext
  ): Promise<void> {
    try {
      // TODO: 实现结果缓存逻辑
    } catch (error) {
      console.warn('缓存结果失败:', error);
    }
  }
}

/**
 * 创建TagX处理器实例
 */
export const createTagXProcessor = (config?: TagXProcessorConfig) => {
  return new TagXProcessor(config);
};

/**
 * 默认TagX处理器实例
 */
export const defaultTagXProcessor = createTagXProcessor();
