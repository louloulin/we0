/**
 * 基于Mastra的多智能体网络系统
 * 
 * 实现P1优先级功能：
 * - 多智能体协作工作流
 * - 智能体间通信和数据传递
 * - 工作流编排和依赖管理
 * - 质量门禁和检查点
 * 
 * 严格按照Mastra官方文档和最佳实践实现
 */

import { Agent } from '@mastra/core/agent';
import { Memory } from '@mastra/memory';
import { createTool } from '@mastra/core/tools';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

// 智能体角色定义
export interface AgentRole {
  name: string;
  description: string;
  instructions: string;
  capabilities: string[];
  model: any;
}

// 工作流阶段定义
export interface WorkflowStage {
  id: string;
  name: string;
  agentRole: string;
  dependsOn?: string[];
  input: {
    schema: z.ZodSchema;
    description: string;
  };
  output: {
    schema: z.ZodSchema;
    description: string;
  };
  timeout?: number;
  retryCount?: number;
  qualityGates?: QualityGate[];
}

// 质量门禁定义
export interface QualityGate {
  id: string;
  name: string;
  criteria: QualityCriteria[];
  threshold: number;
  action: 'continue' | 'retry' | 'escalate' | 'abort';
}

export interface QualityCriteria {
  metric: string;
  operator: 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'contains' | 'matches';
  value: any;
  weight: number;
}

// 工作流执行结果
export interface WorkflowExecutionResult {
  workflowId: string;
  status: 'running' | 'completed' | 'failed' | 'aborted';
  stages: StageExecutionResult[];
  startTime: Date;
  endTime?: Date;
  duration?: number;
  totalQualityScore: number;
  errors?: string[];
  warnings?: string[];
}

export interface StageExecutionResult {
  stageId: string;
  agentRole: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  input: any;
  output?: any;
  startTime?: Date;
  endTime?: Date;
  duration?: number;
  qualityScore?: number;
  qualityGateResults?: QualityGateResult[];
  errors?: string[];
  retryCount: number;
}

export interface QualityGateResult {
  gateId: string;
  passed: boolean;
  score: number;
  criteriaResults: {
    metric: string;
    passed: boolean;
    actualValue: any;
    expectedValue: any;
    score: number;
  }[];
  action: string;
}

/**
 * 基于Mastra的智能体网络管理器
 */
export class MastraAgentNetwork {
  private agents: Map<string, Agent>;
  private memory: Memory;
  private roles: Map<string, AgentRole>;

  constructor(memory: Memory) {
    this.agents = new Map();
    this.memory = memory;
    this.roles = new Map();
    this.initializeAgentRoles();
  }

  /**
   * 初始化预定义的智能体角色
   */
  private initializeAgentRoles(): void {
    const roles: AgentRole[] = [
      {
        name: 'senior-developer',
        description: '资深全栈开发工程师',
        instructions: `你是一个资深的全栈开发工程师，具备以下专业能力：
          - React/TypeScript前端开发专家
          - Node.js/Python后端开发专家
          - 数据库设计和优化专家
          - 微服务架构设计专家
          - DevOps和CI/CD流程专家
          
          你的职责：
          - 分析技术需求并提供最佳解决方案
          - 编写高质量、可维护的代码
          - 进行代码架构设计和技术选型
          - 提供详细的技术文档和注释
          - 确保代码符合最佳实践和安全标准`,
        capabilities: ['code-generation', 'architecture-design', 'technical-analysis', 'documentation'],
        model: openai('gpt-4')
      },
      {
        name: 'code-reviewer',
        description: '代码审查专家',
        instructions: `你是一个代码审查专家，专注于：
          - 代码质量和可维护性评估
          - 性能优化建议
          - 安全漏洞识别
          - 最佳实践验证
          - 代码风格一致性检查
          
          审查标准：
          - 代码可读性和清晰度
          - 错误处理和边界情况
          - 性能和内存使用
          - 安全性和数据保护
          - 测试覆盖率和质量`,
        capabilities: ['code-review', 'quality-assessment', 'security-analysis', 'performance-optimization'],
        model: openai('gpt-4')
      },
      {
        name: 'security-auditor',
        description: '安全审计专家',
        instructions: `你是一个安全审计专家，负责：
          - 识别安全漏洞和风险点
          - 验证输入验证和数据清理
          - 检查认证和授权机制
          - 评估数据加密和传输安全
          - 提供安全加固建议
          
          安全检查重点：
          - SQL注入和XSS防护
          - 身份认证和会话管理
          - 数据加密和隐私保护
          - API安全和访问控制
          - 第三方依赖安全性`,
        capabilities: ['security-audit', 'vulnerability-assessment', 'compliance-check', 'risk-analysis'],
        model: openai('gpt-4')
      },
      {
        name: 'qa-engineer',
        description: '质量保证工程师',
        instructions: `你是一个质量保证工程师，专注于：
          - 测试策略设计和执行
          - 自动化测试框架搭建
          - 性能测试和负载测试
          - 用户体验和可用性测试
          - 质量指标监控和报告
          
          测试范围：
          - 单元测试和集成测试
          - 端到端测试和回归测试
          - 性能基准测试
          - 兼容性和可访问性测试
          - 错误处理和恢复测试`,
        capabilities: ['test-design', 'automation', 'performance-testing', 'quality-metrics'],
        model: openai('gpt-4')
      },
      {
        name: 'product-manager',
        description: '产品经理',
        instructions: `你是一个产品经理，负责：
          - 需求分析和产品规划
          - 用户体验设计指导
          - 功能优先级排序
          - 项目进度管理
          - 跨团队协调沟通
          
          关注重点：
          - 用户需求和业务价值
          - 产品可用性和用户体验
          - 市场竞争力和差异化
          - 技术可行性和资源投入
          - 项目风险和时间管理`,
        capabilities: ['requirement-analysis', 'product-planning', 'user-experience', 'project-management'],
        model: openai('gpt-4')
      }
    ];

    roles.forEach(role => {
      this.roles.set(role.name, role);
      this.createAgent(role);
    });
  }

  /**
   * 创建智能体实例
   */
  private createAgent(role: AgentRole): Agent {
    const agent = new Agent({
      name: role.name,
      instructions: role.instructions,
      model: role.model,
      memory: this.memory
    });

    this.agents.set(role.name, agent);
    return agent;
  }

  /**
   * 获取智能体实例
   */
  getAgent(roleName: string): Agent | undefined {
    return this.agents.get(roleName);
  }

  /**
   * 获取所有可用的智能体角色
   */
  getAvailableRoles(): AgentRole[] {
    return Array.from(this.roles.values());
  }

  /**
   * 执行多智能体工作流
   */
  async executeWorkflow(
    workflowId: string,
    stages: WorkflowStage[],
    initialInput: any,
    context: {
      userId?: string;
      sessionId: string;
      projectPath: string;
    }
  ): Promise<WorkflowExecutionResult> {
    const result: WorkflowExecutionResult = {
      workflowId,
      status: 'running',
      stages: [],
      startTime: new Date(),
      totalQualityScore: 0,
      errors: [],
      warnings: []
    };

    try {
      // 构建依赖图并排序
      const sortedStages = this.topologicalSort(stages);
      const stageOutputs: Map<string, any> = new Map();
      stageOutputs.set('initial', initialInput);

      for (const stage of sortedStages) {
        const stageResult = await this.executeStage(stage, stageOutputs, context);
        result.stages.push(stageResult);

        if (stageResult.status === 'failed') {
          result.status = 'failed';
          result.errors?.push(`Stage ${stage.name} failed: ${stageResult.errors?.join(', ')}`);
          break;
        }

        if (stageResult.status === 'completed' && stageResult.output) {
          stageOutputs.set(stage.id, stageResult.output);
        }
      }

      // 计算总体质量分数
      const completedStages = result.stages.filter(s => s.status === 'completed');
      if (completedStages.length > 0) {
        result.totalQualityScore = completedStages.reduce((sum, stage) => 
          sum + (stage.qualityScore || 0), 0) / completedStages.length;
      }

      if (result.status === 'running') {
        result.status = 'completed';
      }

    } catch (error) {
      result.status = 'failed';
      result.errors?.push(error instanceof Error ? error.message : '未知错误');
    }

    result.endTime = new Date();
    result.duration = result.endTime.getTime() - result.startTime.getTime();

    return result;
  }

  /**
   * 执行单个工作流阶段
   */
  private async executeStage(
    stage: WorkflowStage,
    stageOutputs: Map<string, any>,
    context: any
  ): Promise<StageExecutionResult> {
    const stageResult: StageExecutionResult = {
      stageId: stage.id,
      agentRole: stage.agentRole,
      status: 'running',
      input: this.prepareStageInput(stage, stageOutputs),
      startTime: new Date(),
      retryCount: 0,
      qualityGateResults: []
    };

    try {
      const agent = this.getAgent(stage.agentRole);
      if (!agent) {
        throw new Error(`Agent role ${stage.agentRole} not found`);
      }

      // 构建提示
      const prompt = this.buildStagePrompt(stage, stageResult.input);

      // 执行智能体任务
      const response = await agent.generate(prompt, {
        memory: {
          thread: context.sessionId,
          resource: context.userId || 'anonymous'
        }
      });

      stageResult.output = this.parseStageOutput(stage, response.text);
      stageResult.status = 'completed';

      // 执行质量门禁检查
      if (stage.qualityGates && stage.qualityGates.length > 0) {
        const qualityResults = await this.executeQualityGates(stage.qualityGates, stageResult);
        stageResult.qualityGateResults = qualityResults;
        
        // 计算质量分数
        stageResult.qualityScore = this.calculateStageQualityScore(qualityResults);
      } else {
        stageResult.qualityScore = 0.8; // 默认分数
      }

    } catch (error) {
      stageResult.status = 'failed';
      stageResult.errors = [error instanceof Error ? error.message : '未知错误'];
    }

    stageResult.endTime = new Date();
    stageResult.duration = stageResult.endTime.getTime() - (stageResult.startTime?.getTime() || 0);

    return stageResult;
  }

  /**
   * 拓扑排序工作流阶段
   */
  private topologicalSort(stages: WorkflowStage[]): WorkflowStage[] {
    const visited = new Set<string>();
    const result: WorkflowStage[] = [];
    const stageMap = new Map(stages.map(s => [s.id, s]));

    const visit = (stageId: string) => {
      if (visited.has(stageId)) return;
      
      const stage = stageMap.get(stageId);
      if (!stage) return;

      visited.add(stageId);
      
      // 先访问依赖
      if (stage.dependsOn) {
        stage.dependsOn.forEach(depId => visit(depId));
      }
      
      result.push(stage);
    };

    stages.forEach(stage => visit(stage.id));
    return result;
  }

  /**
   * 准备阶段输入数据
   */
  private prepareStageInput(stage: WorkflowStage, stageOutputs: Map<string, any>): any {
    if (!stage.dependsOn || stage.dependsOn.length === 0) {
      return stageOutputs.get('initial');
    }

    const input: any = {};
    stage.dependsOn.forEach(depId => {
      const output = stageOutputs.get(depId);
      if (output) {
        Object.assign(input, output);
      }
    });

    return input;
  }

  /**
   * 构建阶段提示
   */
  private buildStagePrompt(stage: WorkflowStage, input: any): string {
    return `
执行工作流阶段: ${stage.name}

输入数据:
${JSON.stringify(input, null, 2)}

任务要求:
${stage.input.description}

期望输出:
${stage.output.description}

请根据输入数据和任务要求，生成符合期望输出格式的结果。
`;
  }

  /**
   * 解析阶段输出
   */
  private parseStageOutput(stage: WorkflowStage, response: string): any {
    try {
      // 尝试解析JSON格式的输出
      const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1]);
      }

      // 如果没有JSON格式，返回文本内容
      return { content: response, type: 'text' };
    } catch (error) {
      return { content: response, type: 'text', parseError: true };
    }
  }

  /**
   * 执行质量门禁检查
   */
  private async executeQualityGates(
    gates: QualityGate[],
    stageResult: StageExecutionResult
  ): Promise<QualityGateResult[]> {
    const results: QualityGateResult[] = [];

    for (const gate of gates) {
      const gateResult = await this.executeQualityGate(gate, stageResult);
      results.push(gateResult);
    }

    return results;
  }

  /**
   * 执行单个质量门禁
   */
  private async executeQualityGate(
    gate: QualityGate,
    stageResult: StageExecutionResult
  ): Promise<QualityGateResult> {
    const criteriaResults = gate.criteria.map(criteria => {
      const actualValue = this.extractMetricValue(criteria.metric, stageResult);
      const passed = this.evaluateCriteria(criteria, actualValue);
      
      return {
        metric: criteria.metric,
        passed,
        actualValue,
        expectedValue: criteria.value,
        score: passed ? criteria.weight : 0
      };
    });

    const totalScore = criteriaResults.reduce((sum, result) => sum + result.score, 0);
    const maxScore = gate.criteria.reduce((sum, criteria) => sum + criteria.weight, 0);
    const normalizedScore = maxScore > 0 ? totalScore / maxScore : 0;
    const passed = normalizedScore >= gate.threshold;

    return {
      gateId: gate.id,
      passed,
      score: normalizedScore,
      criteriaResults,
      action: passed ? 'continue' : gate.action
    };
  }

  /**
   * 提取指标值
   */
  private extractMetricValue(metric: string, stageResult: StageExecutionResult): any {
    switch (metric) {
      case 'duration':
        return stageResult.duration || 0;
      case 'output_length':
        return JSON.stringify(stageResult.output || {}).length;
      case 'error_count':
        return stageResult.errors?.length || 0;
      case 'has_output':
        return !!stageResult.output;
      default:
        return 0;
    }
  }

  /**
   * 评估质量标准
   */
  private evaluateCriteria(criteria: QualityCriteria, actualValue: any): boolean {
    switch (criteria.operator) {
      case 'gt': return actualValue > criteria.value;
      case 'gte': return actualValue >= criteria.value;
      case 'lt': return actualValue < criteria.value;
      case 'lte': return actualValue <= criteria.value;
      case 'eq': return actualValue === criteria.value;
      case 'contains': return String(actualValue).includes(String(criteria.value));
      case 'matches': return new RegExp(criteria.value).test(String(actualValue));
      default: return false;
    }
  }

  /**
   * 计算阶段质量分数
   */
  private calculateStageQualityScore(qualityResults: QualityGateResult[]): number {
    if (qualityResults.length === 0) return 0.8;
    
    const totalScore = qualityResults.reduce((sum, result) => sum + result.score, 0);
    return totalScore / qualityResults.length;
  }
}
