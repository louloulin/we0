/**
 * 增强的 Codex Agent Network - 基于 Mastra vNext 的完整智能编程助手
 *
 * 核心功能：
 * 1. 基于 NewAgentNetwork 的智能体网络
 * 2. 完整的 MCP 协议支持
 * 3. 持久化内存系统
 * 4. 流式响应处理
 * 5. 工具生态集成
 *
 * 严格按照 Mastra.ai 官方文档实现，参考 Augment Code 设计理念
 */

import { NewAgentNetwork } from '@mastra/core/network/vNext';
import { Agent } from '@mastra/core/agent';
import { Memory } from '@mastra/memory';
import { LibSQLStore } from '@mastra/libsql';
import { anthropic } from '@ai-sdk/anthropic';
import { openai } from '@ai-sdk/openai';
import { RuntimeContext } from '@mastra/core/runtime-context';
import { MCPClient } from '@mastra/mcp';
import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

// 增强的执行选项
export interface EnhancedExecutionOptions {
  maxSteps?: number;
  thinkingLevel?: ThinkingLevel;
  enableBinaryFeedback?: boolean;
  enableConcurrencyControl?: boolean;
  priority?: TaskPriority;
  abortSignal?: AbortSignal;
  sessionId?: string;
  userId?: string;
}

/**
 * 创建增强的内存系统
 */
const enhancedMemory = new Memory({
  storage: new LibSQLStore({
    url: process.env.DATABASE_URL || 'file:./mastra.db',
  }),
});

/**
 * 创建思维增强的智能体
 */
const enhancedDeepseekAgent = new ThinkingEnabledAgent({
  ...deepseekAgent,
  name: 'enhanced-deepseek-agent',
  instructions: `
    ${deepseekAgent.instructions}
    
    你现在具备了增强的思维能力：
    - 当用户说 "think" 时，进行基础思维分析 (4K tokens)
    - 当用户说 "think hard" 时，进行深度思维分析 (10K tokens)  
    - 当用户说 "ultrathink" 时，进行超深度思维分析 (32K tokens)
    
    请根据任务复杂度自动调整思维深度，并在 <thinking> 标签中展示你的思考过程。
  `
});

const enhancedDeepseekCoderAgent = new ThinkingEnabledAgent({
  ...deepseekCoderAgent,
  name: 'enhanced-deepseek-coder-agent',
  instructions: `
    ${deepseekCoderAgent.instructions}
    
    作为增强的编程助手，你具备：
    1. 深度代码分析和生成能力
    2. 架构设计思维能力
    3. 最佳实践推荐能力
    
    在处理复杂编程任务时，请展示你的完整思考过程。
  `
});

/**
 * 创建二元反馈管理器
 */
const binaryFeedbackManager = new BinaryFeedbackManager();

/**
 * 增强的 Codex Agent Network
 */
export const enhancedCodexNetwork = new NewAgentNetwork({
  id: 'enhanced-codex-network',
  name: 'Enhanced Codex Agent Network',
  instructions: `
    你是一个增强的智能编程助手网络，具备以下核心能力：
    
    🧠 **思维能力**：
    - 支持多级思维深度 (think/think hard/ultrathink)
    - 实时思维过程展示
    - 思维质量评估和优化
    
    ⚡ **流式处理**：
    - 实时响应流式输出
    - 异步任务并发处理
    - 智能资源管理
    
    ⚖️ **质量保证**：
    - A/B 测试响应质量
    - 用户反馈学习机制
    - 自动质量评估
    
    🛠️ **工具生态**：
    - 完整的代码生成和分析工具
    - MCP 协议外部工具集成
    - 智能并发控制
    
    请根据用户需求选择最合适的处理方式，并充分利用你的增强能力。
  `,
  model: anthropic('claude-3-5-sonnet-20240620'),
  
  // 集成增强的智能体
  agents: {
    enhancedDeepseekAgent,
    enhancedDeepseekCoderAgent,
  },
  
  // 集成增强的工具
  tools: {
    codeGeneratorTool,
    documentationTool,
    codebaseSearchTool,
    thinkTool,
    binaryFeedbackTool,
  },
  
  // 持久化内存
  memory: enhancedMemory,
});

/**
 * 流式执行函数
 * 集成所有增强功能的主要入口点
 */
export async function* executeEnhancedStreaming(
  prompt: string,
  options: EnhancedExecutionOptions = {}
): AsyncGenerator<StreamingResponse, void> {
  
  console.log('🚀 启动增强流式执行...');
  
  // 1. 创建运行时上下文
  const runtimeContext = new RuntimeContext();
  runtimeContext.set('sessionId', options.sessionId || 'default-session');
  runtimeContext.set('userId', options.userId || 'default-user');
  runtimeContext.set('enableConcurrencyControl', options.enableConcurrencyControl ?? true);
  
  // 2. 检测思维级别
  const detectedThinking = detectThinkingKeywords(prompt);
  const thinkingLevel = options.thinkingLevel || detectedThinking;
  
  if (thinkingLevel !== ThinkingLevel.NONE) {
    yield {
      type: 'progress',
      content: `🧠 启用思维模式: ${thinkingLevel}`,
      timestamp: Date.now()
    };
  }
  
  // 3. 检查二元反馈
  if (options.enableBinaryFeedback) {
    yield {
      type: 'progress',
      content: '⚖️ 启用二元反馈机制，将生成多个响应供比较...',
      timestamp: Date.now()
    };
    
    // 执行二元反馈
    const feedbackResult = await binaryFeedbackManager.executeBinaryFeedback(
      prompt,
      enhancedCodexNetwork,
      {
        runtimeContext,
        autoSelect: true
      }
    );
    
    yield {
      type: 'binary-feedback-request',
      content: '二元反馈结果已生成',
      timestamp: Date.now(),
      metadata: {
        responseA: feedbackResult.responseA.content,
        responseB: feedbackResult.responseB.content,
        winner: feedbackResult.comparison.winner,
        confidence: feedbackResult.comparison.confidence
      }
    };
    
    if (feedbackResult.selectedResponse) {
      yield {
        type: 'final-result',
        content: feedbackResult.selectedResponse.content,
        timestamp: Date.now(),
        metadata: {
          qualityScore: feedbackResult.selectedResponse.qualityScore,
          binaryFeedback: true
        }
      };
    }
    
    return;
  }
  
  // 4. 标准流式执行
  const executionContext: ExecutionContext = {
    maxSteps: options.maxSteps || 20,
    abortSignal: options.abortSignal,
    runtimeContext,
    sessionId: options.sessionId,
    userId: options.userId
  };
  
  // 使用流式调度器
  for await (const response of mastraStreamingScheduler(
    prompt,
    enhancedCodexNetwork,
    executionContext
  )) {
    yield response;
  }
}

/**
 * 增强的工具执行函数
 * 集成并发控制的工具执行
 */
export async function executeEnhancedTool(
  toolName: string,
  args: any,
  options: EnhancedExecutionOptions = {}
): Promise<any> {
  
  const tool = enhancedCodexNetwork.tools[toolName];
  if (!tool) {
    throw new Error(`工具不存在: ${toolName}`);
  }
  
  const runtimeContext = new RuntimeContext();
  runtimeContext.set('sessionId', options.sessionId || 'default-session');
  runtimeContext.set('userId', options.userId || 'default-user');
  
  // 使用并发控制执行工具
  if (options.enableConcurrencyControl) {
    const result = await executeToolConcurrently(
      tool,
      args,
      runtimeContext,
      {
        priority: options.priority || TaskPriority.NORMAL,
        abortSignal: options.abortSignal
      }
    );
    
    if (!result.success) {
      throw new Error(result.error || '工具执行失败');
    }
    
    return result.result;
  } else {
    // 直接执行
    return await tool.execute({
      context: args,
      runtimeContext,
      abortSignal: options.abortSignal
    });
  }
}

/**
 * 检测思维关键词
 */
function detectThinkingKeywords(prompt: string): ThinkingLevel {
  const content = prompt.toLowerCase();
  
  if (content.includes('ultrathink') || content.includes('think super hard')) {
    return ThinkingLevel.ULTRA;
  }
  if (content.includes('think hard') || content.includes('think intensely')) {
    return ThinkingLevel.DEEP;
  }
  if (content.includes('think')) {
    return ThinkingLevel.BASIC;
  }
  
  return ThinkingLevel.NONE;
}

/**
 * 获取网络状态
 */
export function getNetworkStatus() {
  const concurrencyStats = globalConcurrencyController.getExecutionStats();
  const feedbackData = binaryFeedbackManager.getLearningData();
  
  return {
    concurrency: {
      active: concurrencyStats.currentConcurrency,
      queued: concurrencyStats.queueLength,
      total: concurrencyStats.totalExecutions,
      success: concurrencyStats.successfulExecutions,
      avgTime: concurrencyStats.averageExecutionTime
    },
    binaryFeedback: {
      totalComparisons: feedbackData.totalComparisons,
      preferences: feedbackData.userPreferences,
      qualityTrends: feedbackData.qualityTrends
    },
    memory: {
      // 可以添加内存使用统计
    }
  };
}

/**
 * 便捷函数：快速执行
 */
export async function quickExecute(
  prompt: string,
  options: {
    thinking?: boolean;
    binaryFeedback?: boolean;
    priority?: TaskPriority;
  } = {}
): Promise<string> {
  
  const responses: string[] = [];
  
  for await (const response of executeEnhancedStreaming(prompt, {
    thinkingLevel: options.thinking ? ThinkingLevel.BASIC : ThinkingLevel.NONE,
    enableBinaryFeedback: options.binaryFeedback || false,
    priority: options.priority || TaskPriority.NORMAL
  })) {
    if (response.type === 'text-delta' && response.content) {
      responses.push(response.content);
    } else if (response.type === 'final-result' && response.content) {
      responses.push(response.content);
      break;
    }
  }
  
  return responses.join('');
}

// 导出主要接口
export {
  enhancedCodexNetwork as default,
  ThinkingLevel,
  TaskPriority,
  binaryFeedbackManager,
  globalConcurrencyController
};
