/**
 * 集成的TagX系统
 * 
 * 将现有的优秀实现与我们设计的增强功能相结合
 * 提供完整的TagX智能编程助手系统
 */

import { Memory } from '@mastra/memory';
import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
// import { MastraTagXSystem } from './mastra-tagx-system';
import { EnhancedTagXProcessor } from './enhanced-processor';
import { codexAgentNetwork } from '../networks/codex-agent-network';

/**
 * 集成的TagX系统类
 * 
 * 结合现有实现和增强功能，提供统一的TagX处理接口
 */
export class IntegratedTagXSystem {
  // private mastraSystem: MastraTagXSystem;
  private enhancedProcessor: EnhancedTagXProcessor;
  private memory: Memory;

  constructor(memory?: Memory) {
    this.memory = memory || new Memory();
    // this.mastraSystem = new MastraTagXSystem(this.memory);
    this.enhancedProcessor = new EnhancedTagXProcessor(this.memory);
  }

  /**
   * 处理TagX指令 - 智能路由到最佳处理器
   * 
   * @param xmlString TagX XML指令
   * @param context 执行上下文
   * @returns 执行结果
   */
  async process(xmlString: string, context: any) {
    try {
      // 1. 分析指令复杂度和类型
      const complexity = this.analyzeComplexity(xmlString);
      const hasAdvancedFeatures = this.hasAdvancedFeatures(xmlString);

      // 2. 智能路由选择处理器
      if (hasAdvancedFeatures || complexity === 'high') {
        // 使用增强处理器处理复杂指令
        console.log('🚀 使用增强处理器处理复杂TagX指令');
        return await this.enhancedProcessor.process(xmlString, context);
      } else {
        // 暂时都使用增强处理器，直到集成完成
        console.log('⚡ 使用增强处理器处理TagX指令');
        return await this.enhancedProcessor.process(xmlString, context);
      }
    } catch (error) {
      console.error('TagX处理失败:', error);
      throw error;
    }
  }

  /**
   * 验证TagX指令
   */
  validate(xmlString: string) {
    // 使用增强处理器的验证功能
    return this.enhancedProcessor.validate(xmlString);
  }

  /**
   * 获取支持的标签
   */
  getSupportedTags() {
    // const mastraTags = this.mastraSystem.getSupportedTags();
    const enhancedTags = this.enhancedProcessor.getSupportedTags();

    // 暂时只返回增强处理器的标签
    return enhancedTags;
  }

  /**
   * 获取使用统计
   */
  async getUsageStats(userId?: string) {
    return await this.enhancedProcessor.getUsageStats(userId);
  }

  /**
   * 创建集成的TagX工具
   */
  createIntegratedTool() {
    return createTool({
      id: 'integrated-tagx-system',
      description: '集成的TagX智能编程助手系统，支持智能路由、多智能体协作和质量保证',
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
          qualityLevel: z.enum(['basic', 'standard', 'strict']).default('standard'),
          useEnhancedFeatures: z.boolean().default(true)
        }).optional(),
        timeout: z.number().optional().describe('执行超时时间（毫秒）').default(30000)
      }),
      outputSchema: z.object({
        success: z.boolean(),
        processor: z.enum(['standard', 'enhanced']),
        results: z.array(z.object({
          success: z.boolean(),
          tagName: z.string(),
          duration: z.number(),
          output: z.any().optional(),
          error: z.string().optional(),
          quality_score: z.number().optional(),
          files_changed: z.array(z.string()).optional(),
          next_steps: z.array(z.string()).optional(),
          warnings: z.array(z.string()).optional()
        })),
        summary: z.string(),
        totalDuration: z.number(),
        qualityReport: z.object({
          averageScore: z.number(),
          totalChecks: z.number(),
          passedChecks: z.number(),
          recommendations: z.array(z.string())
        }).optional(),
        metadata: z.object({
          complexity: z.enum(['low', 'medium', 'high']),
          hasAdvancedFeatures: z.boolean(),
          processorUsed: z.string(),
          timestamp: z.string()
        })
      }),
      execute: async ({ context }) => {
        const startTime = Date.now();
        const { xml, projectPath, userId, sessionId, preferences, timeout } = context;

        // 构建执行上下文
        const execContext = {
          projectPath,
          userId,
          sessionId,
          preferences: preferences || {
            defaultLanguage: 'typescript',
            codeStyle: 'standard',
            testFramework: 'jest',
            deploymentPlatform: 'vercel',
            qualityLevel: 'standard',
            useEnhancedFeatures: true
          },
          history: [],
          timeout
        };

        // 分析指令特征
        const complexity = this.analyzeComplexity(xml);
        const hasAdvancedFeatures = this.hasAdvancedFeatures(xml);
        
        // 选择处理器
        const useEnhanced = (preferences?.useEnhancedFeatures !== false) && 
                           (hasAdvancedFeatures || complexity === 'high');
        
        const processorUsed: 'enhanced' | 'standard' = useEnhanced ? 'enhanced' : 'standard';

        // 执行处理
        let results;
        if (useEnhanced) {
          results = await this.enhancedProcessor.process(xml, execContext);
        } else {
          // 暂时都使用增强处理器
          results = await this.enhancedProcessor.process(xml, execContext);
        }

        const totalDuration = Date.now() - startTime;
        const successCount = results.filter((r: any) => r.success).length;

        // 生成摘要
        const summary = `使用${processorUsed === 'enhanced' ? '增强' : '标准'}处理器处理了${results.length}个TagX指令，${successCount}个成功，${results.length - successCount}个失败`;

        // 生成质量报告
        const qualityReport = this.generateQualityReport(results);

        return {
          success: successCount > 0,
          processor: processorUsed,
          results,
          summary,
          totalDuration,
          qualityReport,
          metadata: {
            complexity,
            hasAdvancedFeatures,
            processorUsed,
            timestamp: new Date().toISOString()
          }
        };
      }
    });
  }

  /**
   * 分析指令复杂度
   */
  private analyzeComplexity(xmlString: string): 'low' | 'medium' | 'high' {
    const length = xmlString.length;
    const tagCount = (xmlString.match(/<[^\/][^>]*>/g) || []).length;
    const nestingLevel = this.calculateNestingLevel(xmlString);

    if (length > 5000 || tagCount > 10 || nestingLevel > 3) {
      return 'high';
    } else if (length > 1000 || tagCount > 3 || nestingLevel > 2) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  /**
   * 检查是否包含高级功能
   */
  private hasAdvancedFeatures(xmlString: string): boolean {
    const advancedTags = [
      'agent_workflow',
      'quality_check',
      'smart_refactor',
      'batch_file_ops',
      'analyze_project'
    ];

    return advancedTags.some(tag => xmlString.includes(`<${tag}`));
  }

  /**
   * 计算嵌套层级
   */
  private calculateNestingLevel(xmlString: string): number {
    let maxLevel = 0;
    let currentLevel = 0;

    for (let i = 0; i < xmlString.length; i++) {
      if (xmlString[i] === '<') {
        if (xmlString[i + 1] === '/') {
          currentLevel--;
        } else {
          currentLevel++;
          maxLevel = Math.max(maxLevel, currentLevel);
        }
      }
    }

    return maxLevel;
  }

  /**
   * 生成质量报告
   */
  private generateQualityReport(results: any[]): any {
    const qualityScores = results
      .filter(r => r.quality_score !== undefined)
      .map(r => r.quality_score);

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
   * 生成建议
   */
  private generateRecommendations(averageScore: number, results: any[]): string[] {
    const recommendations = [];

    if (averageScore < 0.7) {
      recommendations.push('整体代码质量需要改进，建议使用增强处理器');
      recommendations.push('考虑启用更严格的质量检查');
    }

    if (results.some(r => r.error)) {
      recommendations.push('存在执行错误，建议检查TagX指令格式');
    }

    if (averageScore >= 0.9) {
      recommendations.push('代码质量优秀，继续保持当前标准');
    }

    const hasWarnings = results.some(r => r.warnings && r.warnings.length > 0);
    if (hasWarnings) {
      recommendations.push('注意处理质量警告，提升代码标准');
    }

    return recommendations;
  }
}

/**
 * 创建集成TagX系统实例
 */
export const createIntegratedTagXSystem = (memory?: Memory) => {
  return new IntegratedTagXSystem(memory);
};

/**
 * 默认的集成TagX系统实例
 */
export const defaultIntegratedTagXSystem = new IntegratedTagXSystem();

/**
 * 导出集成工具
 */
export const integratedTagXTool = defaultIntegratedTagXSystem.createIntegratedTool();
