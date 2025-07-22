/**
 * 二元反馈机制 - A/B 测试响应质量提升系统
 * 
 * 核心功能：
 * 1. 并行响应生成和智能选择
 * 2. A/B 测试框架
 * 3. 用户反馈学习机制
 * 4. 响应质量评估和比较
 * 5. 自动化质量选择算法
 * 
 * 基于 anon-kode 的二元反馈理念，提升 AI 响应质量
 */

import { NewAgentNetwork } from '@mastra/core/network/vNext';
import { RuntimeContext } from '@mastra/core/runtime-context';
import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { nanoid } from 'nanoid';

// 二元反馈响应接口
export interface BinaryFeedbackResponse {
  id: string;
  content: string;
  thinking?: string;
  qualityScore: number;
  metadata: {
    model: string;
    tokens: number;
    executionTime: number;
    timestamp: Date;
    variant: 'A' | 'B';
  };
}

// 用户选择结果
export interface UserChoice {
  sessionId: string;
  responseAId: string;
  responseBId: string;
  choice: 'prefer-A' | 'prefer-B' | 'neither' | 'no-preference';
  reason?: string;
  timestamp: Date;
  userId?: string;
}

// 质量比较结果
export interface QualityComparison {
  winner: 'A' | 'B' | 'tie';
  confidence: number;
  reasoning: string;
  metrics: {
    clarity: { A: number; B: number };
    completeness: { A: number; B: number };
    accuracy: { A: number; B: number };
    helpfulness: { A: number; B: number };
  };
}

// 反馈学习数据
export interface FeedbackLearningData {
  totalComparisons: number;
  userPreferences: {
    preferA: number;
    preferB: number;
    neither: number;
    noPreference: number;
  };
  qualityTrends: {
    averageQualityA: number;
    averageQualityB: number;
    improvementRate: number;
  };
  lastUpdated: Date;
}

/**
 * 二元反馈管理器
 * 负责管理 A/B 测试流程和用户反馈学习
 */
export class BinaryFeedbackManager {
  private feedbackHistory: UserChoice[] = [];
  private learningData: FeedbackLearningData = {
    totalComparisons: 0,
    userPreferences: {
      preferA: 0,
      preferB: 0,
      neither: 0,
      noPreference: 0
    },
    qualityTrends: {
      averageQualityA: 0.5,
      averageQualityB: 0.5,
      improvementRate: 0
    },
    lastUpdated: new Date()
  };

  /**
   * 执行二元反馈测试
   * 并行生成两个响应并进行质量比较
   */
  async executeBinaryFeedback(
    prompt: string,
    agentNetwork: NewAgentNetwork,
    options: {
      runtimeContext?: RuntimeContext;
      enableUserChoice?: boolean;
      autoSelect?: boolean;
    } = {}
  ): Promise<{
    responseA: BinaryFeedbackResponse;
    responseB: BinaryFeedbackResponse;
    comparison: QualityComparison;
    selectedResponse?: BinaryFeedbackResponse;
  }> {
    
    const sessionId = nanoid();
    const startTime = Date.now();

    try {
      // 1. 并行生成两个响应
      console.log('🔄 正在并行生成两个响应进行 A/B 测试...');
      
      const [resultA, resultB] = await Promise.all([
        this.generateResponse(prompt, agentNetwork, 'A', options.runtimeContext),
        this.generateResponse(prompt, agentNetwork, 'B', options.runtimeContext)
      ]);

      // 2. 质量比较
      const comparison = await this.compareResponses(resultA, resultB);
      
      // 3. 自动选择最优响应（如果启用）
      let selectedResponse: BinaryFeedbackResponse | undefined;
      if (options.autoSelect) {
        selectedResponse = comparison.winner === 'A' ? resultA : 
                          comparison.winner === 'B' ? resultB : 
                          (resultA.qualityScore >= resultB.qualityScore ? resultA : resultB);
      }

      // 4. 更新学习数据
      await this.updateLearningData(resultA, resultB, comparison);

      console.log(`✅ 二元反馈完成 - 获胜者: ${comparison.winner} (置信度: ${(comparison.confidence * 100).toFixed(1)}%)`);

      return {
        responseA: resultA,
        responseB: resultB,
        comparison,
        selectedResponse
      };

    } catch (error) {
      throw new Error(`二元反馈执行失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 生成单个响应
   */
  private async generateResponse(
    prompt: string,
    agentNetwork: NewAgentNetwork,
    variant: 'A' | 'B',
    runtimeContext?: RuntimeContext
  ): Promise<BinaryFeedbackResponse> {
    
    const startTime = Date.now();
    
    // 为不同变体添加轻微的随机性
    const enhancedPrompt = variant === 'A' ? 
      prompt : 
      prompt + '\n\n请提供一个详细且全面的回答。';

    const result = await agentNetwork.generate(enhancedPrompt, {
      runtimeContext: runtimeContext || new RuntimeContext()
    });

    const executionTime = Date.now() - startTime;
    const qualityScore = await this.calculateQualityScore(result.result);

    return {
      id: nanoid(),
      content: result.result,
      thinking: undefined, // 可以从结果中提取
      qualityScore,
      metadata: {
        model: 'deepseek-chat', // 可以从配置中获取
        tokens: this.estimateTokens(result.result),
        executionTime,
        timestamp: new Date(),
        variant
      }
    };
  }

  /**
   * 比较两个响应的质量
   */
  private async compareResponses(
    responseA: BinaryFeedbackResponse,
    responseB: BinaryFeedbackResponse
  ): Promise<QualityComparison> {
    
    // 计算各项指标
    const clarityA = await this.assessClarity(responseA.content);
    const clarityB = await this.assessClarity(responseB.content);
    
    const completenessA = await this.assessCompleteness(responseA.content);
    const completenessB = await this.assessCompleteness(responseB.content);
    
    const accuracyA = await this.assessAccuracy(responseA.content);
    const accuracyB = await this.assessAccuracy(responseB.content);
    
    const helpfulnessA = await this.assessHelpfulness(responseA.content);
    const helpfulnessB = await this.assessHelpfulness(responseB.content);

    // 综合评分
    const scoreA = (clarityA + completenessA + accuracyA + helpfulnessA) / 4;
    const scoreB = (clarityB + completenessB + accuracyB + helpfulnessB) / 4;

    // 确定获胜者
    const scoreDiff = Math.abs(scoreA - scoreB);
    let winner: 'A' | 'B' | 'tie';
    let confidence: number;

    if (scoreDiff < 0.05) {
      winner = 'tie';
      confidence = 1 - scoreDiff * 10; // 差异越小，平局置信度越高
    } else {
      winner = scoreA > scoreB ? 'A' : 'B';
      confidence = Math.min(scoreDiff * 5, 0.95); // 差异越大，置信度越高
    }

    const reasoning = this.generateComparisonReasoning(
      { clarity: clarityA, completeness: completenessA, accuracy: accuracyA, helpfulness: helpfulnessA },
      { clarity: clarityB, completeness: completenessB, accuracy: accuracyB, helpfulness: helpfulnessB },
      winner
    );

    return {
      winner,
      confidence,
      reasoning,
      metrics: {
        clarity: { A: clarityA, B: clarityB },
        completeness: { A: completenessA, B: completenessB },
        accuracy: { A: accuracyA, B: accuracyB },
        helpfulness: { A: helpfulnessA, B: helpfulnessB }
      }
    };
  }

  /**
   * 评估清晰度
   */
  private async assessClarity(content: string): Promise<number> {
    let score = 0.5;
    
    // 结构化程度
    if (/#{1,6}|```|\*\*|\*|-|\d+\./.test(content)) score += 0.2;
    
    // 段落组织
    const paragraphs = content.split('\n\n').filter(p => p.trim().length > 0);
    if (paragraphs.length >= 2) score += 0.1;
    if (paragraphs.length >= 4) score += 0.1;
    
    // 语言简洁性
    const avgSentenceLength = content.split(/[。！？.!?]/).reduce((sum, s) => sum + s.length, 0) / content.split(/[。！？.!?]/).length;
    if (avgSentenceLength < 50) score += 0.1;
    
    return Math.min(score, 1.0);
  }

  /**
   * 评估完整性
   */
  private async assessCompleteness(content: string): Promise<number> {
    let score = 0.5;
    
    // 长度合理性
    if (content.length > 200) score += 0.1;
    if (content.length > 500) score += 0.1;
    
    // 包含示例
    if (/例如|比如|举例|示例|```/.test(content)) score += 0.2;
    
    // 包含总结
    if (/总结|综上|总的来说|总之/.test(content)) score += 0.1;
    
    return Math.min(score, 1.0);
  }

  /**
   * 评估准确性
   */
  private async assessAccuracy(content: string): Promise<number> {
    // 这里可以实现更复杂的准确性检查
    // 目前使用基础的启发式方法
    let score = 0.7; // 基础分数
    
    // 包含具体信息
    if (/\d+|具体|详细|准确/.test(content)) score += 0.1;
    
    // 避免模糊表达
    if (!/可能|也许|大概|估计/.test(content)) score += 0.1;
    
    // 包含引用或来源
    if (/根据|基于|参考|来源/.test(content)) score += 0.1;
    
    return Math.min(score, 1.0);
  }

  /**
   * 评估有用性
   */
  private async assessHelpfulness(content: string): Promise<number> {
    let score = 0.5;
    
    // 包含行动建议
    if (/建议|推荐|应该|可以|步骤/.test(content)) score += 0.2;
    
    // 包含代码示例
    if (/```[\s\S]*?```/.test(content)) score += 0.2;
    
    // 包含注意事项
    if (/注意|小心|避免|警告/.test(content)) score += 0.1;
    
    return Math.min(score, 1.0);
  }

  /**
   * 生成比较推理
   */
  private generateComparisonReasoning(
    metricsA: any,
    metricsB: any,
    winner: 'A' | 'B' | 'tie'
  ): string {
    if (winner === 'tie') {
      return '两个响应在各项指标上表现相近，质量相当。';
    }
    
    const winnerMetrics = winner === 'A' ? metricsA : metricsB;
    const loserMetrics = winner === 'A' ? metricsB : metricsA;
    
    const advantages: string[] = [];
    
    if (winnerMetrics.clarity > loserMetrics.clarity + 0.1) {
      advantages.push('更清晰的表达');
    }
    if (winnerMetrics.completeness > loserMetrics.completeness + 0.1) {
      advantages.push('更完整的内容');
    }
    if (winnerMetrics.accuracy > loserMetrics.accuracy + 0.1) {
      advantages.push('更准确的信息');
    }
    if (winnerMetrics.helpfulness > loserMetrics.helpfulness + 0.1) {
      advantages.push('更实用的建议');
    }
    
    return `响应 ${winner} 获胜，主要优势：${advantages.join('、')}。`;
  }

  /**
   * 记录用户选择
   */
  async recordUserChoice(choice: Omit<UserChoice, 'timestamp'>): Promise<void> {
    const userChoice: UserChoice = {
      ...choice,
      timestamp: new Date()
    };
    
    this.feedbackHistory.push(userChoice);
    
    // 更新用户偏好统计
    this.learningData.userPreferences[choice.choice.replace('-', '') as keyof typeof this.learningData.userPreferences]++;
    this.learningData.totalComparisons++;
    this.learningData.lastUpdated = new Date();
    
    console.log(`📝 用户反馈已记录: ${choice.choice}`);
  }

  /**
   * 更新学习数据
   */
  private async updateLearningData(
    responseA: BinaryFeedbackResponse,
    responseB: BinaryFeedbackResponse,
    comparison: QualityComparison
  ): Promise<void> {
    
    // 更新质量趋势
    const currentAvgA = this.learningData.qualityTrends.averageQualityA;
    const currentAvgB = this.learningData.qualityTrends.averageQualityB;
    
    this.learningData.qualityTrends.averageQualityA = 
      (currentAvgA * this.learningData.totalComparisons + responseA.qualityScore) / 
      (this.learningData.totalComparisons + 1);
      
    this.learningData.qualityTrends.averageQualityB = 
      (currentAvgB * this.learningData.totalComparisons + responseB.qualityScore) / 
      (this.learningData.totalComparisons + 1);
    
    // 计算改进率
    const previousAvg = (currentAvgA + currentAvgB) / 2;
    const currentAvg = (this.learningData.qualityTrends.averageQualityA + this.learningData.qualityTrends.averageQualityB) / 2;
    this.learningData.qualityTrends.improvementRate = currentAvg - previousAvg;
  }

  /**
   * 计算质量分数
   */
  private async calculateQualityScore(content: string): Promise<number> {
    const clarity = await this.assessClarity(content);
    const completeness = await this.assessCompleteness(content);
    const accuracy = await this.assessAccuracy(content);
    const helpfulness = await this.assessHelpfulness(content);
    
    return (clarity + completeness + accuracy + helpfulness) / 4;
  }

  /**
   * 估算 tokens 数量
   */
  private estimateTokens(text: string): number {
    const chineseChars = (text.match(/[\u4e00-\u9fff]/g) || []).length;
    const otherChars = text.length - chineseChars;
    return Math.ceil(chineseChars / 1.5 + otherChars / 4);
  }

  /**
   * 获取学习数据
   */
  getLearningData(): FeedbackLearningData {
    return { ...this.learningData };
  }

  /**
   * 获取反馈历史
   */
  getFeedbackHistory(): UserChoice[] {
    return [...this.feedbackHistory];
  }
}

/**
 * 二元反馈工具
 * 用于在 Agent 中集成二元反馈功能
 */
export const binaryFeedbackTool = createTool({
  id: 'binary-feedback-tool',
  description: '执行 A/B 测试，生成两个响应并进行质量比较，支持用户反馈学习',
  inputSchema: z.object({
    prompt: z.string().describe('要测试的提示词'),
    autoSelect: z.boolean().default(true).describe('是否自动选择最优响应'),
    enableUserChoice: z.boolean().default(false).describe('是否启用用户选择')
  }),
  outputSchema: z.object({
    responseA: z.object({
      content: z.string(),
      qualityScore: z.number()
    }),
    responseB: z.object({
      content: z.string(),
      qualityScore: z.number()
    }),
    winner: z.enum(['A', 'B', 'tie']),
    confidence: z.number(),
    reasoning: z.string(),
    selectedResponse: z.string().optional()
  }),
  execute: async ({ context }) => {
    // 这里需要传入 agentNetwork 实例
    // 在实际使用中，可以通过 RuntimeContext 传递
    throw new Error('二元反馈工具需要在具体的 Agent Network 上下文中使用');
  }
});
