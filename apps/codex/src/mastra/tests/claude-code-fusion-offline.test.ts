/**
 * Claude Code 融合系统离线测试套件
 * 专门用于无网络环境的测试，不依赖任何外部 API
 */

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';

// 设置测试环境变量
process.env.NODE_ENV = 'test';
process.env.JEST_WORKER_ID = '1';

// 导入测试目标
import { 
  claudeCodeFusionNetwork,
  executeClaudeCodeFusion,
  quickClaudeCodeExecution,
  getClaudeCodeFusionStatus,
  thinkingEnhancedDeepSeekAgent,
  architectureExpertAgent,
  claudeCodeIntelligentWorkflow,
  claudeCodeStreamingScheduler
} from '../networks/claude-code-fusion-network';

describe('Claude Code 融合系统 - 离线测试', () => {
  beforeEach(() => {
    // 确保测试环境设置
    process.env.NODE_ENV = 'test';
    console.log('🧪 开始离线测试模式');
  });

  afterEach(() => {
    console.log('✅ 离线测试完成');
  });

  describe('系统状态检查', () => {
    test('应该能够获取系统状态', () => {
      const status = getClaudeCodeFusionStatus();
      
      expect(status).toBeDefined();
      expect(status.system).toBeDefined();
      expect(status.system.name).toBe('Claude Code Fusion Network');
      expect(status.agents).toBeDefined();
      expect(status.models).toBeDefined();
      expect(status.memory).toBeDefined();
    });

    test('应该显示正确的模型配置', () => {
      const status = getClaudeCodeFusionStatus();
      
      expect(status.models.primary).toBe('Claude 3.5 Sonnet');
      expect(status.models.codeGeneration).toBe('DeepSeek Coder');
      expect(status.models.reasoning).toBe('DeepSeek R1');
      expect(status.models.embedding).toBe('OpenAI text-embedding-3-small');
    });
  });

  describe('智能体配置验证', () => {
    test('思维增强 DeepSeek 智能体应该正确配置', () => {
      expect(thinkingEnhancedDeepSeekAgent).toBeDefined();
      expect(thinkingEnhancedDeepSeekAgent.name).toBe('Claude Code DeepSeek Agent');
      expect(thinkingEnhancedDeepSeekAgent.description).toContain('思维增强');
    });

    test('架构专家智能体应该正确配置', () => {
      expect(architectureExpertAgent).toBeDefined();
      expect(architectureExpertAgent.name).toBe('Claude Code Architecture Expert');
      expect(architectureExpertAgent.description).toContain('架构专家');
    });
  });

  describe('工作流配置验证', () => {
    test('智能工作流应该正确配置', () => {
      expect(claudeCodeIntelligentWorkflow).toBeDefined();
      expect(claudeCodeIntelligentWorkflow.name).toBe('Claude Code Intelligent Workflow');
    });
  });

  describe('网络配置验证', () => {
    test('主网络应该正确配置', () => {
      expect(claudeCodeFusionNetwork).toBeDefined();
      expect(claudeCodeFusionNetwork.name).toBe('Claude Code Fusion Network');
    });
  });

  describe('快速执行功能测试', () => {
    test('应该能够处理简单的代码生成请求', async () => {
      const prompt = '创建一个简单的 TypeScript 函数来计算两个数的和';
      
      const results = await quickClaudeCodeExecution(prompt, {
        thinking: false,
        maxConcurrency: 1
      });
      
      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
      
      // 验证返回的结果包含预期的内容
      const firstResult = results[0];
      expect(firstResult).toBeDefined();
      expect(typeof firstResult).toBe('string');
      expect(firstResult.length).toBeGreaterThan(0);
    }, 30000); // 30秒超时

    test('应该能够处理思维模式请求', async () => {
      const prompt = '设计一个用户认证系统的架构';
      
      const results = await quickClaudeCodeExecution(prompt, {
        thinking: true,
        maxConcurrency: 1
      });
      
      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
      
      // 验证思维模式的输出
      const firstResult = results[0];
      expect(firstResult).toBeDefined();
      expect(typeof firstResult).toBe('string');
      expect(firstResult.length).toBeGreaterThan(0);
    }, 30000);
  });

  describe('流式调度器测试', () => {
    test('应该能够生成流式响应', async () => {
      const prompt = '解释 TypeScript 的类型系统';
      
      const stream = claudeCodeStreamingScheduler(prompt, {
        thinking: false,
        maxConcurrency: 1
      });
      
      const chunks: any[] = [];
      for await (const chunk of stream) {
        chunks.push(chunk);
        // 限制测试时间，只收集前几个 chunk
        if (chunks.length >= 5) break;
      }
      
      expect(chunks.length).toBeGreaterThan(0);
      
      // 验证 chunk 的结构
      const firstChunk = chunks[0];
      expect(firstChunk).toBeDefined();
      expect(firstChunk.type).toBeDefined();
    }, 30000);
  });

  describe('并发控制测试', () => {
    test('应该能够处理多个并发请求', async () => {
      const prompts = [
        '创建一个 React 组件',
        '编写一个 Node.js API',
        '设计数据库架构',
        '实现用户认证',
        '优化性能策略'
      ];
      
      const promises = prompts.map(prompt => 
        quickClaudeCodeExecution(prompt, {
          thinking: false,
          maxConcurrency: 5
        })
      );
      
      const results = await Promise.all(promises);
      
      expect(results).toBeDefined();
      expect(results.length).toBe(5);
      
      // 验证每个结果都有效
      results.forEach((result, index) => {
        expect(result).toBeDefined();
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBeGreaterThan(0);
      });
    }, 60000); // 60秒超时
  });

  describe('错误处理测试', () => {
    test('应该能够处理空输入', async () => {
      const results = await quickClaudeCodeExecution('', {
        thinking: false,
        maxConcurrency: 1
      });
      
      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
    });

    test('应该能够处理无效参数', async () => {
      const results = await quickClaudeCodeExecution('测试', {
        thinking: false,
        maxConcurrency: 0 // 无效的并发数
      });
      
      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
    });
  });

  describe('性能基准测试', () => {
    test('流式响应延迟应该小于 500ms', async () => {
      const startTime = Date.now();
      const prompt = '快速生成一个简单函数';
      
      const stream = claudeCodeStreamingScheduler(prompt, {
        thinking: false,
        maxConcurrency: 1
      });
      
      let firstChunkTime = 0;
      for await (const chunk of stream) {
        if (firstChunkTime === 0) {
          firstChunkTime = Date.now();
          break;
        }
      }
      
      const latency = firstChunkTime - startTime;
      console.log(`🚀 首个响应延迟: ${latency}ms`);
      
      // 在测试环境中，由于使用模拟响应，延迟应该很低
      expect(latency).toBeLessThan(500);
    }, 10000);

    test('并发处理应该无资源冲突', async () => {
      const startTime = Date.now();
      
      const promises = Array.from({ length: 10 }, (_, i) => 
        quickClaudeCodeExecution(`测试请求 ${i + 1}`, {
          thinking: false,
          maxConcurrency: 10
        })
      );
      
      const results = await Promise.all(promises);
      const endTime = Date.now();
      
      console.log(`🔄 10个并发请求总耗时: ${endTime - startTime}ms`);
      
      expect(results.length).toBe(10);
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(Array.isArray(result)).toBe(true);
      });
    }, 30000);
  });
});
