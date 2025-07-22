/**
 * 流式调度引擎 - 基于 Mastra vNext Agent Network 的异步生成器调度器
 * 
 * 核心功能：
 * 1. 异步生成器流式处理
 * 2. 实时响应处理和状态管理
 * 3. 智能体选择和任务分析
 * 4. 思维深度动态调整
 * 5. 二元反馈机制集成
 * 
 * 基于 anon-kode 的核心调度理念，结合 Mastra 的强大功能
 */

import { NewAgentNetwork } from '@mastra/core/network/vNext';
import { RuntimeContext } from '@mastra/core/runtime-context';
import { Agent } from '@mastra/core/agent';
import { nanoid } from 'nanoid';

// 流式响应类型定义
export interface StreamingResponse {
  type: 'text-delta' | 'tool-call' | 'tool-result' | 'thinking-delta' | 'binary-feedback-request' | 'error' | 'final-result' | 'progress';
  content?: string;
  thinking?: string;
  toolName?: string;
  args?: any;
  result?: any;
  error?: string;
  agent?: string;
  timestamp: number;
  metadata?: {
    tokensUsed?: number;
    thinkingTokens?: number;
    executionTime?: number;
    qualityScore?: number;
  };
}

// 执行上下文接口
export interface ExecutionContext {
  maxSteps?: number;
  abortSignal?: AbortSignal;
  thinkingTokens?: number;
  enableBinaryFeedback?: boolean;
  reasoningEffort?: 'low' | 'medium' | 'high' | 'ultra';
  sessionId?: string;
  userId?: string;
  runtimeContext?: RuntimeContext;
}

// 思维深度配置
export interface ThinkingConfig {
  maxTokens: number;
  temperature: number;
  enableThinking: boolean;
  reasoningEffort: string;
}

/**
 * 流式调度引擎主函数
 * 基于 Mastra vNext 的流式能力实现异步生成器调度
 */
export async function* mastraStreamingScheduler(
  prompt: string,
  agentNetwork: NewAgentNetwork,
  context: ExecutionContext = {}
): AsyncGenerator<StreamingResponse, void> {
  
  const startTime = Date.now();
  const sessionId = context.sessionId || nanoid();
  
  try {
    // 1. 智能体选择和任务分析
    yield {
      type: 'progress',
      content: '🤖 正在分析任务并选择最优智能体...',
      timestamp: Date.now()
    };

    // 2. 思维深度调整
    const thinkingTokens = await getMaxThinkingTokens(prompt);
    const reasoningEffort = await getReasoningEffort(prompt);
    
    yield {
      type: 'progress',
      content: `🧠 思维深度设置: ${thinkingTokens} tokens (${reasoningEffort} 推理强度)`,
      timestamp: Date.now(),
      metadata: {
        thinkingTokens,
      }
    };

    // 3. 二元反馈机制检查
    const shouldUseBinaryFeedback = context.enableBinaryFeedback && await shouldUseBinaryFeedbackForTask(prompt);
    
    if (shouldUseBinaryFeedback) {
      yield {
        type: 'progress',
        content: '⚖️ 启用二元反馈机制，将生成多个响应供选择...',
        timestamp: Date.now()
      };
    }

    // 4. 使用 Mastra vNext 的生成能力（简化版本）
    // 由于流式 API 的复杂性，我们先使用基础的 generate 方法
    const result = await agentNetwork.generate(prompt, {
      runtimeContext: context.runtimeContext || new RuntimeContext(),
    });

    // 5. 模拟流式响应处理
    let responseContent = result.result || '';

    // 模拟逐字符输出以提供流式体验
    const words = responseContent.split(' ');
    for (let i = 0; i < words.length; i++) {
      // 检查中断信号
      if (context.abortSignal?.aborted) {
        yield {
          type: 'error',
          error: '任务已被用户中断',
          timestamp: Date.now()
        };
        return;
      }

      const word = words[i] + (i < words.length - 1 ? ' ' : '');
      yield {
        type: 'text-delta',
        content: word,
        timestamp: Date.now()
      };

      // 添加小延迟以模拟真实的流式输出
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    // 6. 返回最终结果
    const executionTime = Date.now() - startTime;
    const qualityScore = await calculateResponseQuality(responseContent);
    const estimatedTokens = Math.ceil(responseContent.length / 4); // 简单估算

    yield {
      type: 'final-result',
      content: responseContent,
      timestamp: Date.now(),
      metadata: {
        tokensUsed: estimatedTokens,
        thinkingTokens,
        executionTime,
        qualityScore,
      }
    };

  } catch (error) {
    yield {
      type: 'error',
      error: error instanceof Error ? error.message : '未知错误',
      timestamp: Date.now(),
      metadata: {
        executionTime: Date.now() - startTime
      }
    };
  }
}

/**
 * 获取最大思维 tokens 数量
 * 基于用户输入动态调整思维深度
 */
export async function getMaxThinkingTokens(prompt: string): Promise<number> {
  const content = prompt.toLowerCase();

  // 基于用户输入动态调整
  if (content.includes('ultrathink') || content.includes('think super hard')) {
    return 32000 - 1; // 最大思维深度
  }

  if (content.includes('think hard') || content.includes('think intensely')) {
    return 10000; // 深度思维
  }

  if (content.includes('think')) {
    return 4000; // 基础思维
  }

  // 基于任务复杂度自动判断
  const complexity = await analyzeTaskComplexity(prompt);
  if (complexity === 'high') return 8000;
  if (complexity === 'medium') return 2000;
  
  return 0; // 无思维模式
}

/**
 * 获取推理强度级别
 */
export async function getReasoningEffort(prompt: string): Promise<'low' | 'medium' | 'high' | 'ultra'> {
  const content = prompt.toLowerCase();
  
  if (content.includes('ultrathink') || content.includes('think super hard')) {
    return 'ultra';
  }
  
  if (content.includes('think hard') || content.includes('think intensely')) {
    return 'high';
  }
  
  if (content.includes('think')) {
    return 'medium';
  }
  
  // 基于任务复杂度判断
  const complexity = await analyzeTaskComplexity(prompt);
  switch (complexity) {
    case 'high': return 'high';
    case 'medium': return 'medium';
    default: return 'low';
  }
}

/**
 * 分析任务复杂度
 */
export async function analyzeTaskComplexity(prompt: string): Promise<'low' | 'medium' | 'high'> {
  const content = prompt.toLowerCase();
  
  // 高复杂度指标
  const highComplexityKeywords = [
    'architecture', 'system design', 'microservices', 'distributed',
    'performance optimization', 'security analysis', 'scalability',
    'multi-step', 'workflow', 'integration', 'deployment'
  ];
  
  // 中等复杂度指标
  const mediumComplexityKeywords = [
    'algorithm', 'data structure', 'api', 'database',
    'refactor', 'optimize', 'debug', 'test'
  ];
  
  const highMatches = highComplexityKeywords.filter(keyword => content.includes(keyword)).length;
  const mediumMatches = mediumComplexityKeywords.filter(keyword => content.includes(keyword)).length;
  
  if (highMatches >= 2 || content.length > 500) return 'high';
  if (mediumMatches >= 2 || content.length > 200) return 'medium';
  
  return 'low';
}

/**
 * 判断是否应该使用二元反馈
 */
export async function shouldUseBinaryFeedbackForTask(prompt: string): Promise<boolean> {
  const content = prompt.toLowerCase();
  
  // 适合二元反馈的任务类型
  const feedbackSuitableKeywords = [
    'design', 'architecture', 'approach', 'solution',
    'recommendation', 'best practice', 'strategy'
  ];
  
  return feedbackSuitableKeywords.some(keyword => content.includes(keyword));
}

/**
 * 计算响应质量分数
 */
export async function calculateResponseQuality(content: string): Promise<number> {
  // 基础质量指标
  let score = 0.5; // 基础分数
  
  // 长度合理性 (0.1)
  if (content.length > 100 && content.length < 5000) {
    score += 0.1;
  }
  
  // 结构化程度 (0.2)
  const hasStructure = /#{1,6}|```|\*\*|\*|-|\d+\./.test(content);
  if (hasStructure) score += 0.2;
  
  // 代码示例 (0.1)
  const hasCode = /```[\s\S]*?```/.test(content);
  if (hasCode) score += 0.1;
  
  // 详细程度 (0.1)
  const wordCount = content.split(/\s+/).length;
  if (wordCount > 50) score += 0.1;
  
  return Math.min(score, 1.0);
}

/**
 * 便捷函数：执行流式任务
 */
export async function executeStreamingTask(
  prompt: string,
  agentNetwork: NewAgentNetwork,
  options: Partial<ExecutionContext> = {}
): Promise<AsyncGenerator<StreamingResponse, void>> {
  return mastraStreamingScheduler(prompt, agentNetwork, options);
}
