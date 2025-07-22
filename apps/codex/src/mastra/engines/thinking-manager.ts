/**
 * 思维模型系统 - 动态思维深度调整和推理强度控制
 * 
 * 核心功能：
 * 1. 动态思维深度调整 (think/think hard/ultrathink)
 * 2. 思维过程记录和分析
 * 3. 推理强度控制
 * 4. 思维质量评估
 * 5. ThinkTool 集成
 * 
 * 基于 anon-kode 的思维模型理念，增强 Mastra Agent 的推理能力
 */

import { Agent } from '@mastra/core/agent';
import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { nanoid } from 'nanoid';

// 思维级别枚举
export enum ThinkingLevel {
  NONE = 'none',
  BASIC = 'basic',      // think - 4K tokens
  DEEP = 'deep',        // think hard - 10K tokens  
  ULTRA = 'ultra'       // ultrathink - 32K tokens
}

// 思维响应接口
export interface ThinkingResponse {
  content: string;
  thinking?: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    thinkingTokens: number;
    totalTokens: number;
  };
  qualityScore: number;
  metadata: {
    thinkingLevel: ThinkingLevel;
    reasoningEffort: string;
    executionTime: number;
    timestamp: Date;
  };
}

// 思维过程记录
export interface ThinkingProcess {
  id: string;
  agentId: string;
  thinking: string;
  quality: number;
  tokens: number;
  level: ThinkingLevel;
  timestamp: Date;
  sessionId?: string;
  userId?: string;
}

// 思维质量评估结果
export interface ThinkingQuality {
  score: number;
  reasoning: string;
  strengths: string[];
  improvements: string[];
  depth: 'shallow' | 'moderate' | 'deep' | 'profound';
}

/**
 * 思维增强的 Mastra Agent 类
 * 扩展标准 Agent 以支持思维能力
 */
export class ThinkingEnabledAgent extends Agent {
  private thinkingHistory: ThinkingProcess[] = [];
  
  /**
   * 带思维能力的生成方法
   */
  async generateWithThinking(
    messages: any[],
    maxThinkingTokens: number,
    options: {
      reasoningEffort?: string;
      sessionId?: string;
      userId?: string;
    } = {}
  ): Promise<ThinkingResponse> {
    
    const startTime = Date.now();
    const thinkingLevel = this.getThinkingLevelFromTokens(maxThinkingTokens);
    
    // 动态调整思维深度
    const thinkingConfig = {
      maxTokens: maxThinkingTokens,
      temperature: 0.7,
      enableThinking: maxThinkingTokens > 0,
      reasoningEffort: options.reasoningEffort || 'medium'
    };

    // 增强提示词以包含思维指令
    const enhancedMessages = this.enhanceMessagesWithThinking(messages, thinkingLevel);

    try {
      // 使用 Mastra Agent 的生成能力
      const response = await this.generate(enhancedMessages.join('\n'), {
        // 这里可以添加更多配置选项
      });

      // 提取思维过程（如果存在）
      const thinking = this.extractThinkingFromResponse(response.text);
      const content = this.extractContentFromResponse(response.text);

      // 思维过程记录和分析
      if (thinking) {
        const thinkingProcess = await this.recordThinkingProcess({
          agentId: this.name,
          thinking,
          quality: await this.assessThinkingQuality(thinking),
          tokens: this.estimateThinkingTokens(thinking),
          level: thinkingLevel,
          timestamp: new Date(),
          sessionId: options.sessionId,
          userId: options.userId
        });
        
        this.thinkingHistory.push(thinkingProcess);
      }

      const executionTime = Date.now() - startTime;
      const qualityScore = await this.calculateResponseQuality(content);

      return {
        content,
        thinking,
        usage: {
          promptTokens: this.estimateTokens(enhancedMessages.join('\n')),
          completionTokens: this.estimateTokens(content),
          thinkingTokens: thinking ? this.estimateThinkingTokens(thinking) : 0,
          totalTokens: 0 // 将在后面计算
        },
        qualityScore,
        metadata: {
          thinkingLevel,
          reasoningEffort: options.reasoningEffort || 'medium',
          executionTime,
          timestamp: new Date()
        }
      };

    } catch (error) {
      throw new Error(`思维生成失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 根据 tokens 数量确定思维级别
   */
  private getThinkingLevelFromTokens(tokens: number): ThinkingLevel {
    if (tokens >= 20000) return ThinkingLevel.ULTRA;
    if (tokens >= 8000) return ThinkingLevel.DEEP;
    if (tokens >= 2000) return ThinkingLevel.BASIC;
    return ThinkingLevel.NONE;
  }

  /**
   * 增强消息以包含思维指令
   */
  private enhanceMessagesWithThinking(messages: any[], level: ThinkingLevel): string[] {
    const thinkingInstructions = {
      [ThinkingLevel.NONE]: '',
      [ThinkingLevel.BASIC]: '\n\n请仔细思考这个问题，逐步分析解决方案。',
      [ThinkingLevel.DEEP]: '\n\n请深入思考这个问题。考虑多种方法、潜在问题和最佳实践。提供全面的推理过程。',
      [ThinkingLevel.ULTRA]: '\n\n请进行超深度思维。从多个角度分析问题，考虑边缘情况、架构影响，并提供全面的推理过程。展示你的完整思考过程。'
    };

    const lastMessage = messages[messages.length - 1];
    if (lastMessage && typeof lastMessage === 'string') {
      return [...messages.slice(0, -1), lastMessage + thinkingInstructions[level]];
    }
    
    return messages.map(msg => typeof msg === 'string' ? msg : JSON.stringify(msg));
  }

  /**
   * 从响应中提取思维过程
   */
  private extractThinkingFromResponse(response: string): string | undefined {
    // 查找思维标记
    const thinkingPatterns = [
      /<thinking>([\s\S]*?)<\/thinking>/,
      /思考过程：([\s\S]*?)(?=\n\n|$)/,
      /让我思考一下：([\s\S]*?)(?=\n\n|$)/,
    ];

    for (const pattern of thinkingPatterns) {
      const match = response.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }

    return undefined;
  }

  /**
   * 从响应中提取主要内容
   */
  private extractContentFromResponse(response: string): string {
    // 移除思维标记，保留主要内容
    let content = response
      .replace(/<thinking>[\s\S]*?<\/thinking>/g, '')
      .replace(/思考过程：[\s\S]*?(?=\n\n|$)/g, '')
      .replace(/让我思考一下：[\s\S]*?(?=\n\n|$)/g, '')
      .trim();

    return content || response;
  }

  /**
   * 记录思维过程
   */
  private async recordThinkingProcess(process: Omit<ThinkingProcess, 'id'>): Promise<ThinkingProcess> {
    const thinkingProcess: ThinkingProcess = {
      id: nanoid(),
      ...process
    };

    // 这里可以添加持久化逻辑
    console.log(`[思维记录] ${thinkingProcess.agentId}: ${thinkingProcess.quality.toFixed(2)} 分`);
    
    return thinkingProcess;
  }

  /**
   * 评估思维质量
   */
  private async assessThinkingQuality(thinking: string): Promise<number> {
    let score = 0.5; // 基础分数

    // 长度和深度 (0.2)
    if (thinking.length > 200) score += 0.1;
    if (thinking.length > 500) score += 0.1;

    // 结构化思维 (0.2)
    const hasStructure = /步骤|首先|然后|最后|因为|所以|考虑|分析/.test(thinking);
    if (hasStructure) score += 0.2;

    // 逻辑连贯性 (0.2)
    const hasLogic = /因此|由于|基于|根据|综合考虑/.test(thinking);
    if (hasLogic) score += 0.2;

    // 多角度思考 (0.1)
    const hasMultiplePerspectives = /另一方面|相比之下|同时|此外/.test(thinking);
    if (hasMultiplePerspectives) score += 0.1;

    return Math.min(score, 1.0);
  }

  /**
   * 计算响应质量
   */
  private async calculateResponseQuality(content: string): Promise<number> {
    let score = 0.5;

    // 长度合理性
    if (content.length > 100 && content.length < 5000) score += 0.1;

    // 结构化程度
    const hasStructure = /#{1,6}|```|\*\*|\*|-|\d+\./.test(content);
    if (hasStructure) score += 0.2;

    // 代码示例
    const hasCode = /```[\s\S]*?```/.test(content);
    if (hasCode) score += 0.1;

    // 详细程度
    const wordCount = content.split(/\s+/).length;
    if (wordCount > 50) score += 0.2;

    return Math.min(score, 1.0);
  }

  /**
   * 估算 tokens 数量
   */
  private estimateTokens(text: string): number {
    // 简单估算：中文约 1.5 字符/token，英文约 4 字符/token
    const chineseChars = (text.match(/[\u4e00-\u9fff]/g) || []).length;
    const otherChars = text.length - chineseChars;
    
    return Math.ceil(chineseChars / 1.5 + otherChars / 4);
  }

  /**
   * 估算思维 tokens 数量
   */
  private estimateThinkingTokens(thinking: string): number {
    return this.estimateTokens(thinking);
  }

  /**
   * 获取思维历史
   */
  getThinkingHistory(): ThinkingProcess[] {
    return [...this.thinkingHistory];
  }

  /**
   * 清除思维历史
   */
  clearThinkingHistory(): void {
    this.thinkingHistory = [];
  }
}

/**
 * ThinkTool - 思维过程记录和可视化工具
 */
export const thinkTool = createTool({
  id: 'think-tool',
  description: '记录和分析 AI 的思维过程，支持思维质量评估和优化建议',
  inputSchema: z.object({
    thinking: z.string().describe('思维过程内容'),
    level: z.enum(['basic', 'deep', 'ultra']).describe('思维深度级别'),
    context: z.string().optional().describe('思维上下文')
  }),
  outputSchema: z.object({
    quality: z.object({
      score: z.number(),
      reasoning: z.string(),
      strengths: z.array(z.string()),
      improvements: z.array(z.string()),
      depth: z.enum(['shallow', 'moderate', 'deep', 'profound'])
    }),
    insights: z.array(z.string()),
    recommendations: z.array(z.string())
  }),
  execute: async ({ context }) => {
    const { thinking, level, context: thinkingContext } = context;
    
    // 分析思维质量
    const quality = await analyzeThinkingQuality(thinking);
    
    // 生成洞察
    const insights = generateThinkingInsights(thinking, level);
    
    // 生成建议
    const recommendations = generateImprovementRecommendations(quality, level);
    
    return {
      quality,
      insights,
      recommendations
    };
  }
});

/**
 * 分析思维质量
 */
async function analyzeThinkingQuality(thinking: string): Promise<ThinkingQuality> {
  let score = 0.5;
  const strengths: string[] = [];
  const improvements: string[] = [];
  
  // 分析各个维度
  if (thinking.length > 300) {
    score += 0.1;
    strengths.push('思维内容丰富');
  } else {
    improvements.push('可以更详细地展开思考过程');
  }
  
  if (/步骤|首先|然后|最后/.test(thinking)) {
    score += 0.2;
    strengths.push('思维过程结构化');
  } else {
    improvements.push('建议使用更清晰的逻辑结构');
  }
  
  if (/因为|所以|由于|基于/.test(thinking)) {
    score += 0.2;
    strengths.push('逻辑推理清晰');
  } else {
    improvements.push('可以加强因果关系的表达');
  }
  
  // 确定深度级别
  let depth: 'shallow' | 'moderate' | 'deep' | 'profound' = 'shallow';
  if (score >= 0.9) depth = 'profound';
  else if (score >= 0.7) depth = 'deep';
  else if (score >= 0.5) depth = 'moderate';
  
  return {
    score: Math.min(score, 1.0),
    reasoning: `基于思维内容的长度、结构化程度和逻辑性进行评估`,
    strengths,
    improvements,
    depth
  };
}

/**
 * 生成思维洞察
 */
function generateThinkingInsights(thinking: string, level: string): string[] {
  const insights: string[] = [];
  
  if (level === 'ultra' && thinking.length > 1000) {
    insights.push('展现了深度思维能力，能够进行复杂的多层次分析');
  }
  
  if (/多个角度|不同方面|另一方面/.test(thinking)) {
    insights.push('具备多角度思考能力，能够全面分析问题');
  }
  
  if (/风险|挑战|问题|限制/.test(thinking)) {
    insights.push('具有风险意识，能够识别潜在问题');
  }
  
  return insights;
}

/**
 * 生成改进建议
 */
function generateImprovementRecommendations(quality: ThinkingQuality, level: string): string[] {
  const recommendations: string[] = [];
  
  if (quality.score < 0.7) {
    recommendations.push('建议增加思维深度，更详细地分析问题的各个方面');
  }
  
  if (quality.depth === 'shallow') {
    recommendations.push('可以尝试使用更高级的思维模式（think hard 或 ultrathink）');
  }
  
  if (!quality.strengths.includes('思维过程结构化')) {
    recommendations.push('建议使用"首先...然后...最后"的结构来组织思维过程');
  }
  
  return recommendations;
}
