/**
 * 模拟TagX执行器 - 用于测试
 * 
 * 避免真实的Agent调用，提供可预测的测试结果
 */

import { Memory } from '@mastra/memory';
import {
  TagXElement,
  TagXContext,
  TagXResult,
  SmartCodeGenElement,
  BoltArtifactElement,
  AgentWorkflowElement
} from './mastra-tagx-system';

/**
 * 模拟TagX执行器类
 */
export class MockTagXExecutor {
  private memory: Memory;

  constructor(memory: Memory) {
    this.memory = memory;
  }

  /**
   * 执行TagX指令（模拟版本）
   */
  async execute(
    elements: TagXElement[],
    context: TagXContext
  ): Promise<TagXResult[]> {
    const results: TagXResult[] = [];

    for (const element of elements) {
      const startTime = Date.now();
      
      try {
        let result: TagXResult;
        
        switch (element.tagName) {
          case 'smart_code_gen':
            result = await this.mockExecuteSmartCodeGen(element as SmartCodeGenElement, context);
            break;
          case 'bolt_artifact':
            result = await this.mockExecuteBoltArtifact(element as BoltArtifactElement, context);
            break;
          case 'agent_workflow':
            result = await this.mockExecuteAgentWorkflow(element as AgentWorkflowElement, context);
            break;
          default:
            result = {
              success: false,
              tagName: element.tagName,
              duration: Date.now() - startTime,
              error: `不支持的TagX标签: ${element.tagName}`
            };
        }

        result.duration = Date.now() - startTime;
        results.push(result);

        // 记录执行历史（简化版本）
        await this.mockRecordExecution(element, result, context);

      } catch (error) {
        const errorResult: TagXResult = {
          success: false,
          tagName: element.tagName,
          duration: Date.now() - startTime,
          error: error instanceof Error ? error.message : '未知错误'
        };
        results.push(errorResult);
        await this.mockRecordExecution(element, errorResult, context);
      }
    }

    return results;
  }

  /**
   * 模拟执行智能代码生成
   */
  private async mockExecuteSmartCodeGen(
    element: SmartCodeGenElement,
    context: TagXContext
  ): Promise<TagXResult> {
    // 模拟延迟
    await new Promise(resolve => setTimeout(resolve, 10));

    const mockGeneratedCode = `
// 生成的${element.context.project_type}代码
// 任务: ${element.task}

import React from 'react';

export const GeneratedComponent: React.FC = () => {
  return (
    <div>
      <h1>生成的组件</h1>
      <p>任务: ${element.task}</p>
    </div>
  );
};

export default GeneratedComponent;
`;

    const mockReviews = element.agents.reviewers.map(reviewer => ({
      reviewer,
      feedback: `${reviewer}的审查反馈：代码质量良好，建议添加更多注释。`,
      timestamp: new Date()
    }));

    return {
      success: true,
      tagName: 'smart_code_gen',
      duration: 0, // 将在外层设置
      output: {
        generated_code: mockGeneratedCode,
        reviews: mockReviews,
        task: element.task,
        context: element.context
      },
      quality_score: 0.85,
      files_changed: ['src/components/GeneratedComponent.tsx'],
      next_steps: [
        '代码生成完成',
        '建议进行代码审查',
        '运行测试验证功能'
      ]
    };
  }

  /**
   * 模拟执行增强boltArtifact
   */
  private async mockExecuteBoltArtifact(
    element: BoltArtifactElement,
    context: TagXContext
  ): Promise<TagXResult> {
    // 模拟延迟
    await new Promise(resolve => setTimeout(resolve, 10));

    const mockGeneratedProject = `
# ${element.title}

这是一个自动生成的项目，包含以下特性：
- 项目ID: ${element.id}
- 环境类型: ${element.environment.type}
- 质量分数: ${element.meta.quality_score}

## 项目结构
- package.json
- src/
  - components/
  - utils/
- README.md
`;

    const mockExecutedActions = element.actions.map(action => ({
      action: action.type,
      path: action.path,
      status: 'completed',
      timestamp: new Date()
    }));

    return {
      success: true,
      tagName: 'bolt_artifact',
      duration: 0,
      output: {
        artifact_id: element.id,
        generated_project: mockGeneratedProject,
        executed_actions: mockExecutedActions,
        environment: element.environment
      },
      quality_score: element.meta.quality_score,
      files_changed: element.actions.filter(a => a.path).map(a => a.path!),
      next_steps: [
        '项目已生成完成',
        '运行 npm install 安装依赖',
        '运行 npm run dev 启动开发服务器',
        '查看生成的代码和文档'
      ]
    };
  }

  /**
   * 模拟执行智能体工作流
   */
  private async mockExecuteAgentWorkflow(
    element: AgentWorkflowElement,
    context: TagXContext
  ): Promise<TagXResult> {
    // 模拟延迟
    await new Promise(resolve => setTimeout(resolve, 10));

    const mockWorkflowResults = element.workflow.map((stage, index) => ({
      stage_name: stage.name,
      agent: stage.agent,
      input: stage.input,
      output: `${stage.agent}完成了${stage.name}阶段的工作，输出：${stage.output}`,
      duration: stage.duration,
      timestamp: new Date()
    }));

    const finalOutput = mockWorkflowResults[mockWorkflowResults.length - 1].output;

    return {
      success: true,
      tagName: 'agent_workflow',
      duration: 0,
      output: {
        task: element.task,
        workflow_results: mockWorkflowResults,
        final_output: finalOutput
      },
      quality_score: 0.9,
      next_steps: [
        '工作流执行完成',
        '查看各阶段输出结果',
        '进行后续开发工作'
      ]
    };
  }

  /**
   * 模拟记录执行历史
   */
  private async mockRecordExecution(element: TagXElement, result: TagXResult, context: TagXContext): Promise<void> {
    try {
      // 简化的记录逻辑，避免真实的Memory操作
      console.log(`模拟记录执行历史: ${element.tagName} - ${result.success ? '成功' : '失败'}`);
    } catch (error) {
      console.warn('模拟记录执行历史失败:', error);
    }
  }
}

/**
 * 创建模拟TagX执行器实例
 */
export const createMockTagXExecutor = (memory: Memory) => {
  return new MockTagXExecutor(memory);
};
