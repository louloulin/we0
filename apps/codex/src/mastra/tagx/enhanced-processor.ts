/**
 * 增强的TagX处理器
 * 
 * 整合解析器和执行器，提供完整的TagX指令处理能力
 * 基于我们设计的Agent Network架构和质量保证系统
 */

import { Memory } from '@mastra/memory';
import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { TagXParser } from './parser';
import { EnhancedTagXExecutor } from './enhanced-executor';
import { 
  TagXElement, 
  TagXContext, 
  TagXResult,
  UserPreferences 
} from './types';

/**
 * 增强的TagX处理器类
 * 
 * 提供完整的TagX指令处理流程：解析 → 验证 → 执行 → 质量保证
 */
export class EnhancedTagXProcessor {
  private parser: TagXParser;
  private executor: EnhancedTagXExecutor;
  private memory: Memory;

  constructor(memory?: Memory) {
    this.memory = memory || new Memory();
    this.parser = new TagXParser();
    this.executor = new EnhancedTagXExecutor(this.memory);
  }

  /**
   * 处理TagX指令 - 主要入口点
   * 
   * @param xmlString TagX XML指令字符串
   * @param context 执行上下文
   * @returns 执行结果数组
   */
  async process(xmlString: string, context: TagXContext): Promise<TagXResult[]> {
    const startTime = Date.now();

    try {
      // 1. 验证输入
      this.validateInput(xmlString, context);

      // 2. 解析TagX指令
      const elements = this.parser.parse(xmlString);
      
      if (elements.length === 0) {
        return [{
          success: false,
          tagName: 'unknown',
          duration: Date.now() - startTime,
          output: null,
          error: '未找到有效的TagX指令'
        }];
      }

      // 3. 预处理和优化
      const optimizedElements = await this.optimizeElements(elements, context);

      // 4. 执行TagX指令
      const results = await this.executor.execute(optimizedElements, context);

      // 5. 后处理和质量检查
      const finalResults = await this.postProcessResults(results, context);

      // 6. 记录性能指标
      await this.recordPerformanceMetrics(xmlString, finalResults, Date.now() - startTime);

      return finalResults;

    } catch (error) {
      const errorResult: TagXResult = {
        success: false,
        tagName: 'processor',
        duration: Date.now() - startTime,
        output: null,
        error: error instanceof Error ? error.message : '处理器内部错误'
      };

      await this.recordError(xmlString, errorResult, context);
      return [errorResult];
    }
  }

  /**
   * 验证TagX指令格式
   * 
   * @param xmlString XML指令字符串
   * @returns 验证结果
   */
  validate(xmlString: string): { valid: boolean; errors: string[] } {
    try {
      const validation = this.parser.validateXML(xmlString);
      if (!validation.valid) {
        return {
          valid: false,
          errors: [validation.error || 'XML格式错误']
        };
      }

      // 尝试解析以验证TagX语法
      this.parser.parse(xmlString);
      
      return { valid: true, errors: [] };
    } catch (error) {
      return {
        valid: false,
        errors: [error instanceof Error ? error.message : '未知验证错误']
      };
    }
  }

  /**
   * 获取支持的TagX标签列表
   */
  getSupportedTags(): string[] {
    return [
      'smart_code_gen',
      'bolt_artifact', 
      'agent_workflow',
      'quality_check',
      'smart_refactor',
      'batch_file_ops',
      'analyze_project',
      'generate_project',
      'generate_tests',
      'generate_deployment',
      'generate_cicd'
    ];
  }

  /**
   * 获取TagX使用统计
   */
  async getUsageStats(userId?: string): Promise<any> {
    try {
      // 从memory中获取使用统计
      const stats = await this.memory.search({
        resourceId: userId || 'global',
        query: 'TagX执行记录',
        limit: 100
      });

      return this.aggregateStats(stats);
    } catch (error) {
      console.warn('获取使用统计失败:', error);
      return { total: 0, success: 0, failed: 0, avgDuration: 0 };
    }
  }

  /**
   * 创建TagX工具 - 用于Mastra Agent集成
   */
  createTagXTool() {
    return createTool({
      id: 'enhanced-tagx-processor',
      description: '增强的TagX指令处理器，支持智能代码生成、多智能体协作和质量保证',
      inputSchema: z.object({
        xml: z.string().describe('TagX XML指令'),
        projectPath: z.string().describe('项目路径'),
        userId: z.string().optional().describe('用户ID'),
        sessionId: z.string().describe('会话ID'),
        preferences: z.object({
          defaultLanguage: z.string().default('typescript'),
          codeStyle: z.string().default('standard'),
          testFramework: z.string().default('jest'),
          deploymentPlatform: z.string().default('vercel'),
          qualityLevel: z.enum(['basic', 'standard', 'strict']).default('standard')
        }).optional(),
        timeout: z.number().optional().describe('执行超时时间（毫秒）')
      }),
      outputSchema: z.object({
        success: z.boolean(),
        results: z.array(z.object({
          success: z.boolean(),
          tagName: z.string(),
          duration: z.number(),
          output: z.any().optional(),
          error: z.string().optional(),
          quality_score: z.number().optional(),
          files_changed: z.array(z.string()).optional(),
          next_steps: z.array(z.string()).optional()
        })),
        summary: z.string(),
        totalDuration: z.number(),
        qualityReport: z.object({
          averageScore: z.number(),
          totalChecks: z.number(),
          passedChecks: z.number(),
          recommendations: z.array(z.string())
        }).optional()
      }),
      execute: async ({ context }) => {
        const startTime = Date.now();
        const { xml, projectPath, userId, sessionId, preferences, timeout } = context;

        // 构建TagX上下文
        const tagxContext: TagXContext = {
          projectPath,
          userId,
          sessionId,
          preferences: preferences || {
            defaultLanguage: 'typescript',
            codeStyle: 'standard',
            testFramework: 'jest',
            deploymentPlatform: 'vercel',
            qualityLevel: 'standard'
          },
          history: [],
          timeout
        };

        // 处理TagX指令
        const results = await this.process(xml, tagxContext);
        const totalDuration = Date.now() - startTime;

        // 生成摘要
        const successCount = results.filter(r => r.success).length;
        const summary = `处理了${results.length}个TagX指令，${successCount}个成功，${results.length - successCount}个失败`;

        // 生成质量报告
        const qualityReport = this.generateQualityReport(results);

        return {
          success: successCount > 0,
          results,
          summary,
          totalDuration,
          qualityReport
        };
      }
    });
  }

  /**
   * 私有方法：验证输入
   */
  private validateInput(xmlString: string, context: TagXContext): void {
    if (!xmlString || typeof xmlString !== 'string') {
      throw new Error('XML指令不能为空');
    }

    if (!context.sessionId) {
      throw new Error('会话ID不能为空');
    }

    if (!context.projectPath) {
      throw new Error('项目路径不能为空');
    }
  }

  /**
   * 私有方法：优化元素
   */
  private async optimizeElements(elements: TagXElement[], context: TagXContext): Promise<TagXElement[]> {
    // 根据用户偏好和历史记录优化执行顺序
    return elements.sort((a, b) => {
      const priorityMap = {
        'quality_check': 1,
        'smart_code_gen': 2,
        'bolt_artifact': 3,
        'agent_workflow': 4
      };
      
      const aPriority = priorityMap[a.tagName as keyof typeof priorityMap] || 5;
      const bPriority = priorityMap[b.tagName as keyof typeof priorityMap] || 5;
      
      return aPriority - bPriority;
    });
  }

  /**
   * 私有方法：后处理结果
   */
  private async postProcessResults(results: TagXResult[], context: TagXContext): Promise<TagXResult[]> {
    // 添加质量分析和建议
    return results.map(result => {
      if (result.success && result.quality_score !== undefined) {
        result.warnings = this.generateQualityWarnings(result.quality_score);
      }
      return result;
    });
  }

  /**
   * 私有方法：生成质量警告
   */
  private generateQualityWarnings(score: number): string[] {
    const warnings = [];
    
    if (score < 0.6) {
      warnings.push('代码质量较低，建议进行重构');
    } else if (score < 0.8) {
      warnings.push('代码质量中等，建议进行优化');
    }
    
    return warnings;
  }

  /**
   * 私有方法：生成质量报告
   */
  private generateQualityReport(results: TagXResult[]): any {
    const qualityScores = results
      .filter(r => r.quality_score !== undefined)
      .map(r => r.quality_score!);

    if (qualityScores.length === 0) {
      return undefined;
    }

    const averageScore = qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length;
    const passedChecks = qualityScores.filter(score => score >= 0.8).length;

    return {
      averageScore,
      totalChecks: qualityScores.length,
      passedChecks,
      recommendations: this.generateRecommendations(averageScore, results)
    };
  }

  /**
   * 私有方法：生成建议
   */
  private generateRecommendations(averageScore: number, results: TagXResult[]): string[] {
    const recommendations = [];

    if (averageScore < 0.7) {
      recommendations.push('整体代码质量需要改进');
      recommendations.push('建议增加代码审查流程');
    }

    if (results.some(r => r.error)) {
      recommendations.push('存在执行错误，建议检查输入参数');
    }

    if (averageScore >= 0.9) {
      recommendations.push('代码质量优秀，继续保持');
    }

    return recommendations;
  }

  /**
   * 私有方法：聚合统计数据
   */
  private aggregateStats(stats: any[]): any {
    return {
      total: stats.length,
      success: stats.filter(s => s.metadata?.success).length,
      failed: stats.filter(s => !s.metadata?.success).length,
      avgDuration: stats.reduce((sum, s) => sum + (s.metadata?.duration || 0), 0) / stats.length || 0
    };
  }

  /**
   * 私有方法：记录性能指标
   */
  private async recordPerformanceMetrics(xml: string, results: TagXResult[], duration: number): Promise<void> {
    try {
      await this.memory.createThread({
        resourceId: 'performance-metrics',
        title: 'TagX性能指标',
        metadata: {
          xmlLength: xml.length,
          resultsCount: results.length,
          totalDuration: duration,
          successRate: results.filter(r => r.success).length / results.length,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.warn('记录性能指标失败:', error);
    }
  }

  /**
   * 私有方法：记录错误
   */
  private async recordError(xml: string, error: TagXResult, context: TagXContext): Promise<void> {
    try {
      await this.memory.createThread({
        resourceId: context.userId || 'anonymous',
        title: 'TagX执行错误',
        metadata: {
          error: error.error,
          xmlLength: xml.length,
          sessionId: context.sessionId,
          timestamp: new Date().toISOString()
        }
      });
    } catch (err) {
      console.warn('记录错误失败:', err);
    }
  }
}

/**
 * 创建增强的TagX处理器实例
 */
export const createEnhancedTagXProcessor = (memory?: Memory) => {
  return new EnhancedTagXProcessor(memory);
};

/**
 * 默认的TagX处理器实例
 */
export const defaultTagXProcessor = new EnhancedTagXProcessor();
