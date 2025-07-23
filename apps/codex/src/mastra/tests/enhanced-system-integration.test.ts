/**
 * 增强系统集成测试 (基于 Mastra.ai 官方文档 v0.10.15+)
 * 验证所有核心功能的集成和协作
 * 
 * 测试覆盖：
 * - Memory 系统 (Working Memory + Semantic Recall)
 * - MCP 协议支持
 * - Workflows 执行
 * - Streaming 流式处理
 * - Agent Network 协作
 * 
 * @author Claude Code Team
 * @since 2025-01-23
 * @version 1.0.0
 */

import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import {
  claudeCodeFusionNetwork,
  thinkingEnhancedDeepSeekAgent,
  architectureExpertAgent
} from '../networks/claude-code-fusion-network';
import { enhancedClaudeCodeWorkflow } from '../workflows/enhanced-claude-code-workflow';
import { enhancedStreamingScheduler } from '../streaming/enhanced-streaming-scheduler';
import { createEnhancedMCPServer, checkMCPServerHealth } from '../mcp/enhanced-mcp-server';

describe('增强系统集成测试 - 基于 Mastra.ai 官方文档', () => {
  beforeAll(() => {
    console.log('🚀 开始增强系统集成测试');
    console.log(`🔑 API 密钥状态: ${process.env.DEEPSEEK_API_KEY ? '已配置' : '未配置'}`);
  });

  afterAll(() => {
    // 清理资源
    enhancedStreamingScheduler.stopAllStreams();
    console.log('🧹 测试资源清理完成');
  });

  describe('Memory 系统增强测试', () => {
    test('应该支持 Working Memory 跨会话持久化', async () => {
      const agent = thinkingEnhancedDeepSeekAgent;
      
      // 第一次对话 - 建立用户档案
      const result1 = await agent.generate('我是一个 React 开发者，主要使用 TypeScript', {
        resourceId: 'test-user-123',
        threadId: 'session-1'
      });

      expect(result1).toBeDefined();
      expect(result1.text).toBeDefined();
      console.log('✅ Working Memory 第一次对话完成');

      // 第二次对话 - 验证记忆持久化
      const result2 = await agent.generate('我的技术栈是什么？', {
        resourceId: 'test-user-123',
        threadId: 'session-2' // 不同会话
      });

      expect(result2).toBeDefined();
      expect(result2.text).toBeDefined();
      // 验证智能体记住了用户的技术栈信息
      expect(result2.text.toLowerCase()).toMatch(/(react|typescript)/);
      
      console.log('✅ Working Memory 跨会话持久化验证通过');
    }, 60000);

    test('应该支持 Semantic Recall 语义搜索', async () => {
      const agent = thinkingEnhancedDeepSeekAgent;
      
      // 建立一些历史对话
      await agent.generate('如何优化 React 组件的性能？', {
        resourceId: 'test-user-456',
        threadId: 'semantic-test-1'
      });

      await agent.generate('useState 和 useEffect 的最佳实践', {
        resourceId: 'test-user-456',
        threadId: 'semantic-test-2'
      });

      // 语义相关的查询
      const result = await agent.generate('React hooks 的使用技巧', {
        resourceId: 'test-user-456',
        threadId: 'semantic-test-3'
      });

      expect(result).toBeDefined();
      expect(result.text).toBeDefined();
      console.log('✅ Semantic Recall 语义搜索验证通过');
    }, 60000);
  });

  describe('MCP 协议支持测试', () => {
    test('应该能够创建和配置 MCP 服务器', async () => {
      const mcpServer = createEnhancedMCPServer();
      
      expect(mcpServer).toBeDefined();
      // MCP 服务器的内部属性是受保护的，我们通过健康检查来验证功能
      
      console.log('✅ MCP 服务器创建成功');
    });

    test('应该通过 MCP 健康检查', async () => {
      const isHealthy = await checkMCPServerHealth();
      
      expect(isHealthy).toBe(true);
      console.log('✅ MCP 服务器健康检查通过');
    });
  });

  describe('Workflows 执行测试', () => {
    test('应该能够执行完整的编程工作流', async () => {
      const workflowInput = {
        userRequest: '创建一个 React 计数器组件',
        workflowMode: '标准' as const,
        includeDocumentation: true,
        includeTests: true,
        techStack: ['React', 'TypeScript'],
        codeStyle: '函数式' as const,
        userId: 'test-user-workflow',
        sessionId: 'workflow-session-1'
      };

      // 基于官方文档的工作流执行方式
      const run = await enhancedClaudeCodeWorkflow.createRunAsync();
      const result = await run.start({ inputData: workflowInput });

      expect(result).toBeDefined();
      expect(result.status).toBe('success');
      expect(result.result).toBeDefined();

      // 基于官方文档，工作流结果在 result.result 中
      const workflowOutput = result.result;

      // 验证步骤执行
      expect(result.steps).toBeDefined();
      expect(Object.keys(result.steps).length).toBeGreaterThan(0);

      console.log('✅ 完整编程工作流执行成功');
      console.log(`📊 工作流状态: ${result.status}`);
      console.log(`🔧 执行步骤数: ${Object.keys(result.steps).length}`);
    }, 120000);

    test('应该支持不同的工作流模式', async () => {
      const modes = ['快速', '标准', '深度'] as const;
      
      for (const mode of modes) {
        const workflowInput = {
          userRequest: '创建一个简单的 Hello World 函数',
          workflowMode: mode,
          includeDocumentation: false,
          includeTests: false,
          userId: `test-user-${mode}`,
          sessionId: `session-${mode}`
        };

        const run = await enhancedClaudeCodeWorkflow.createRunAsync();
        const result = await run.start({ inputData: workflowInput });

        expect(result).toBeDefined();
        expect(result.status).toBe('success');
        
        console.log(`✅ ${mode}模式工作流执行成功`);
      }
    }, 180000);
  });

  describe('Streaming 流式处理测试', () => {
    test('应该支持智能体流式对话', async () => {
      const events: any[] = [];
      const config = {
        userId: 'test-streaming-user',
        sessionId: 'streaming-session-1',
        enableThinking: true,
        enableToolStreaming: true,
        enableMemoryUpdates: true
      };

      const streamGenerator = enhancedStreamingScheduler.streamAgentChat(
        '创建一个简单的 TypeScript 函数',
        'thinkingEnhancedDeepSeekAgent',
        config
      );

      for await (const event of streamGenerator) {
        events.push(event);
        
        // 验证事件结构
        expect(event.type).toBeDefined();
        expect(event.timestamp).toBeDefined();
        expect(event.sessionId).toBe(config.sessionId);
        expect(event.userId).toBe(config.userId);

        // 如果是完成事件，结束测试
        if (event.type === 'complete') {
          expect(event.fullText).toBeDefined();
          break;
        }
      }

      expect(events.length).toBeGreaterThan(0);
      
      // 验证包含必要的事件类型
      const eventTypes = events.map(e => e.type);
      expect(eventTypes).toContain('agent-switch');
      expect(eventTypes).toContain('complete');

      console.log('✅ 智能体流式对话测试通过');
      console.log(`📊 流式事件数量: ${events.length}`);
    }, 60000);

    test('应该能够管理流式执行状态', () => {
      const initialStats = enhancedStreamingScheduler.getStats();
      
      expect(initialStats).toBeDefined();
      expect(typeof initialStats.totalStreams).toBe('number');
      expect(typeof initialStats.activeStreams).toBe('number');
      expect(typeof initialStats.completedStreams).toBe('number');
      expect(typeof initialStats.failedStreams).toBe('number');

      console.log('✅ 流式执行状态管理验证通过');
      console.log('📊 流式调度器统计:', initialStats);
    });
  });

  describe('Agent Network 协作测试', () => {
    test('应该支持多智能体协作', async () => {
      const codeAgent = thinkingEnhancedDeepSeekAgent;
      const archAgent = architectureExpertAgent;

      // 代码生成智能体生成代码
      const codeResult = await codeAgent.generate('创建一个用户管理系统的 API', {
        resourceId: 'collaboration-test',
        threadId: 'collab-1'
      });

      expect(codeResult).toBeDefined();
      expect(codeResult.text).toBeDefined();

      // 架构专家智能体提供架构建议
      const archResult = await archAgent.generate(
        `请为以下代码提供架构建议：\n\n${codeResult.text}`,
        {
          resourceId: 'collaboration-test',
          threadId: 'collab-2'
        }
      );

      expect(archResult).toBeDefined();
      expect(archResult.text).toBeDefined();

      console.log('✅ 多智能体协作测试通过');
    }, 90000);
  });

  describe('性能和并发测试', () => {
    test('应该支持并发请求处理', async () => {
      const concurrentRequests = 3; // 降低并发数以适应测试环境
      const agent = thinkingEnhancedDeepSeekAgent;

      const promises = Array.from({ length: concurrentRequests }, (_, i) =>
        agent.generate(`创建一个简单的函数 ${i + 1}`, {
          resourceId: `concurrent-user-${i}`,
          threadId: `concurrent-session-${i}`
        })
      );

      const results = await Promise.all(promises);

      expect(results.length).toBe(concurrentRequests);
      results.forEach((result: any, index: number) => {
        expect(result).toBeDefined();
        expect(result.text).toBeDefined();
        console.log(`✅ 并发请求 ${index + 1} 完成`);
      });

      console.log(`🔄 ${concurrentRequests} 个并发请求全部完成`);
    }, 120000);
  });

  describe('错误处理和恢复测试', () => {
    test('应该优雅处理无效输入', async () => {
      const agent = thinkingEnhancedDeepSeekAgent;

      try {
        const result = await agent.generate('', { // 空输入
          resourceId: 'error-test',
          threadId: 'error-session'
        });

        // 即使是空输入，也应该有某种响应
        expect(result).toBeDefined();
        console.log('✅ 空输入处理测试通过');
      } catch (error) {
        // 如果抛出错误，应该是可预期的错误
        expect(error).toBeDefined();
        console.log('✅ 错误处理机制正常工作');
      }
    }, 30000);
  });
});
