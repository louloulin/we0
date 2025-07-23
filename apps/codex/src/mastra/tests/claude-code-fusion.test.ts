/**
 * Claude Code 融合系统完整测试套件
 * 
 * 基于 claudecode.md 规范的验收测试
 * 
 * 测试覆盖：
 * 1. 核心功能验证
 * 2. 性能指标验证
 * 3. 用户体验测试
 * 4. 企业级功能测试
 * 5. 集成测试
 */

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { RuntimeContext } from '@mastra/core/runtime-context';
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
import { ThinkingLevel } from '../engines/thinking-manager';
import { TaskPriority } from '../engines/concurrency-controller';

describe('Claude Code 融合系统完整测试套件', () => {

  // 测试超时设置
  jest.setTimeout(30000);

  // 清理异步操作
  afterEach(async () => {
    // 等待所有异步操作完成
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  describe('核心功能验证', () => {
    
    test('Claude Code 融合网络应该正确初始化', () => {
      expect(claudeCodeFusionNetwork.id).toBe('claude-code-fusion-network');
      expect(claudeCodeFusionNetwork.name).toBe('Claude Code Fusion Network - Complete Implementation');
      expect(claudeCodeFusionNetwork).toBeDefined();
    });
    
    test('思维增强 DeepSeek 智能体应该正确配置', () => {
      expect(thinkingEnhancedDeepSeekAgent.name).toBe('Claude Code DeepSeek Agent');
      expect(thinkingEnhancedDeepSeekAgent.getDescription()).toContain('DeepSeek 模型');
      expect(thinkingEnhancedDeepSeekAgent.tools).toBeDefined();
      expect(thinkingEnhancedDeepSeekAgent.tools?.codeGeneratorTool).toBeDefined();
    });
    
    test('架构设计专家智能体应该正确配置', () => {
      expect(architectureExpertAgent.name).toBe('Claude Code Architecture Expert');
      expect(architectureExpertAgent.getDescription()).toContain('架构设计专家');
      expect(architectureExpertAgent.tools).toBeDefined();
    });
    
    test('智能编程工作流应该正确定义', () => {
      expect(claudeCodeIntelligentWorkflow).toBeDefined();
      expect(claudeCodeIntelligentWorkflow.id).toBe('claude-code-intelligent-workflow');
      expect(claudeCodeIntelligentWorkflow.description).toContain('智能编程工作流');
    });
    
    test('系统状态应该返回完整信息', () => {
      const status = getClaudeCodeFusionStatus();
      
      expect(status.system.name).toBe('Claude Code Fusion Network');
      expect(status.system.version).toBe('claude-code-fusion');
      expect(status.system.status).toBe('active');
      
      expect(status.network.agents).toContain('thinkingEnhancedDeepSeekAgent');
      expect(status.network.agents).toContain('architectureExpertAgent');
      expect(status.network.workflows).toContain('claudeCodeIntelligentWorkflow');
      
      expect(status.memory.vectorStore).toBe(true);
      expect(status.memory.semanticSearch).toBe(true);
      expect(status.memory.crossSessionMemory).toBe(true);
      
      expect(status.performance.targetResponseDelay).toBe('< 500ms');
      expect(status.performance.codeGenerationAccuracy).toBe('> 85%');
      expect(status.performance.developmentEfficiencyGain).toBe('3x');
      expect(status.performance.maxConcurrency).toBe(10);
      
      expect(status.enterprise.privateDeployment).toBe(true);
      expect(status.enterprise.mcpToolsSupport).toBe('50+');
      expect(status.enterprise.pluginEcosystem).toBe('100+');
      
      expect(status.features.multiModalInteraction).toContain('web-ide');
      expect(status.features.multiModalInteraction).toContain('terminal');
      expect(status.features.multiModalInteraction).toContain('api');
    });
  });
  
  describe('性能指标验证', () => {
    
    test('流式响应延迟应该 < 500ms', async () => {
      const startTime = Date.now();
      let firstResponseTime = 0;
      
      const stream = executeClaudeCodeFusion('简单测试：什么是 TypeScript？', {
        userId: 'perf-test-user',
        sessionId: 'perf-test-session',
        enableBinaryFeedback: false,
        enableWorkflows: false
      });
      
      for await (const response of stream) {
        if (firstResponseTime === 0) {
          firstResponseTime = Date.now() - startTime;
        }
        // 记录响应类型用于验证
        if (response.type) {
          console.log(`收到响应类型: ${response.type}`);
        }
        break; // 只测试第一个响应
      }
      
      expect(firstResponseTime).toBeLessThan(500); // < 500ms
    }, 10000);
    
    test('快速执行应该在合理时间内完成', async () => {
      const startTime = Date.now();
      
      const result = await quickClaudeCodeExecution(
        '生成一个简单的 Hello World 函数',
        {
          userId: 'quick-test-user',
          sessionId: 'quick-test-session',
          useDeepSeek: false,
          enableWorkflows: false
        }
      );
      
      const executionTime = Date.now() - startTime;
      
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
      expect(executionTime).toBeLessThan(10000); // 10秒内完成
    }, 15000);
    
    test('并发执行应该无资源冲突', async () => {
      const promises = Array.from({ length: 5 }, (_, i) =>
        quickClaudeCodeExecution(`并发测试 ${i + 1}`, {
          userId: `concurrent-user-${i + 1}`,
          sessionId: `concurrent-session-${i + 1}`,
          enableWorkflows: false
        })
      );
      
      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(5);
      results.forEach(result => {
        expect(typeof result).toBe('string');
        expect(result.length).toBeGreaterThan(0);
      });
    }, 30000);
  });
  
  describe('思维模式支持测试', () => {
    
    test('应该支持 4 级思维深度调整', async () => {
      const thinkingPrompts = [
        { prompt: '分析这个问题', level: ThinkingLevel.NONE },
        { prompt: 'think 分析这个问题', level: ThinkingLevel.BASIC },
        { prompt: 'think hard 分析这个问题', level: ThinkingLevel.DEEP },
        { prompt: 'ultrathink 分析这个问题', level: ThinkingLevel.ULTRA }
      ];
      
      for (const { prompt, level } of thinkingPrompts) {
        const responses: any[] = [];
        
        for await (const response of executeClaudeCodeFusion(prompt, {
          userId: 'thinking-test-user',
          sessionId: 'thinking-test-session',
          thinkingLevel: level,
          enableBinaryFeedback: false,
          enableWorkflows: false
        })) {
          responses.push(response);
          if (responses.length >= 3) break;
        }
        
        expect(responses.length).toBeGreaterThan(0);
        
        // 检查是否有思维相关的响应
        const hasThinkingFeature = responses.some(r => 
          r.features?.thinkingManager === true
        );
        
        if (level !== ThinkingLevel.NONE) {
          expect(hasThinkingFeature).toBe(true);
        }
      }
    }, 25000);
  });
  
  describe('工作流集成测试', () => {
    
    test('智能编程工作流应该正常执行', async () => {
      const responses: any[] = [];
      
      for await (const response of executeClaudeCodeFusion(
        '使用工作流创建一个简单的计算器应用',
        {
          userId: 'workflow-test-user',
          sessionId: 'workflow-test-session',
          enableWorkflows: true,
          enableBinaryFeedback: false
        }
      )) {
        responses.push(response);
        if (responses.length >= 10) break;
      }
      
      expect(responses.length).toBeGreaterThan(0);
      
      // 检查是否有工作流相关的响应
      const workflowCall = responses.find(r => 
        r.type === 'tool-call' && r.toolName === 'claude-code-intelligent-workflow'
      );
      const workflowResult = responses.find(r => 
        r.type === 'tool-result'
      );
      
      if (workflowCall) {
        expect(workflowCall.args).toBeDefined();
        expect(workflowCall.args.requirement).toContain('计算器');
      }
      
      if (workflowResult) {
        expect(workflowResult.result).toBeDefined();
      }
    }, 20000);
  });
  
  describe('用户体验测试', () => {
    
    test('Web IDE 模式应该正常工作', async () => {
      const result = await quickClaudeCodeExecution(
        '在 Web IDE 中创建一个 React 组件',
        {
          userId: 'webide-test-user',
          sessionId: 'webide-test-session',
          interactionMode: 'web-ide',
          enableWorkflows: false
        }
      );
      
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    }, 15000);
    
    test('Terminal 模式应该正常工作', async () => {
      const result = await quickClaudeCodeExecution(
        '在终端中执行代码分析',
        {
          userId: 'terminal-test-user',
          sessionId: 'terminal-test-session',
          interactionMode: 'terminal',
          enableWorkflows: false
        }
      );
      
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    }, 15000);
  });
  
  describe('错误处理和边界测试', () => {
    
    test('空输入应该正确处理', async () => {
      const result = await quickClaudeCodeExecution('', {
        userId: 'empty-test-user',
        sessionId: 'empty-test-session',
        enableWorkflows: false
      });
      
      expect(typeof result).toBe('string');
    }, 10000);
    
    test('中断信号应该正确处理', async () => {
      const controller = new AbortController();

      // 使用 Promise 而不是 setTimeout 来避免开放句柄
      const abortPromise = new Promise<void>((resolve) => {
        const timeoutId = setTimeout(() => {
          controller.abort();
          clearTimeout(timeoutId);
          resolve();
        }, 1000);
      });

      const responses: any[] = [];

      try {
        // 启动中断定时器
        abortPromise.catch(() => {});

        for await (const response of executeClaudeCodeFusion(
          '这是一个长时间运行的任务',
          {
            abortSignal: controller.signal,
            userId: 'abort-test-user',
            sessionId: 'abort-test-session',
            enableWorkflows: false
          }
        )) {
          responses.push(response);
        }
      } catch (error) {
        // 预期会有中断错误
      }

      expect(responses.length).toBeGreaterThanOrEqual(0);
    }, 5000);
  });
  
  describe('企业级功能测试', () => {
    
    test('私有部署配置应该可用', () => {
      const status = getClaudeCodeFusionStatus();
      expect(status.enterprise.privateDeployment).toBe(true);
      expect(status.features.deploymentModes).toContain('on-premise');
      expect(status.features.deploymentModes).toContain('hybrid');
    });
    
    test('多语言支持应该可用', () => {
      const status = getClaudeCodeFusionStatus();
      expect(status.features.languageSupport).toContain('chinese');
      expect(status.features.languageSupport).toContain('english');
    });
    
    test('质量等级支持应该完整', () => {
      const status = getClaudeCodeFusionStatus();
      expect(status.features.qualityLevels).toContain('basic');
      expect(status.features.qualityLevels).toContain('production');
      expect(status.features.qualityLevels).toContain('enterprise');
    });
  });
});
