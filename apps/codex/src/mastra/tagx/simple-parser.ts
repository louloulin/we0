/**
 * 简化的TagX解析器 - 专注于功能实现
 * 
 * 为了快速实现P0优先级功能，创建一个简化但功能完整的解析器
 */

import { XMLParser } from 'fast-xml-parser';
import { TagXElement, SmartCodeGenElement, BoltArtifactElement, AgentWorkflowElement } from './types';

/**
 * 简化的TagX解析器类
 */
export class SimpleTagXParser {
  private parser: XMLParser;

  constructor() {
    this.parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      textNodeName: '#text',
      parseAttributeValue: true,
      parseTagValue: true,
      trimValues: true,
    });
  }

  /**
   * 解析TagX XML指令
   */
  parse(xmlString: string): TagXElement[] {
    try {
      const parsed = this.parser.parse(xmlString);
      const elements: TagXElement[] = [];

      // 查找smart_code_gen标签
      if (parsed.smart_code_gen) {
        elements.push(this.parseSmartCodeGen(parsed.smart_code_gen));
      }

      // 查找bolt_artifact标签
      if (parsed.bolt_artifact) {
        elements.push(this.parseBoltArtifact(parsed.bolt_artifact));
      }

      // 查找agent_workflow标签
      if (parsed.agent_workflow) {
        elements.push(this.parseAgentWorkflow(parsed.agent_workflow));
      }

      return elements;
    } catch (error) {
      throw new Error(`TagX解析失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 解析smart_code_gen标签
   */
  private parseSmartCodeGen(data: any): SmartCodeGenElement {
    return {
      tagName: 'smart_code_gen',
      attributes: this.extractAttributes(data),
      children: [],
      task: this.getString(data.task) || '未指定任务',
      context: {
        project_type: this.getString(data.context?.project_type) || 'unknown',
        existing_files: this.getStringArray(data.context?.existing_files?.file) || [],
        requirements: {
          security: this.getSecurityLevel(data.context?.requirements?.security),
          accessibility: this.getAccessibilityLevel(data.context?.requirements?.accessibility),
          testing: this.getTestingLevel(data.context?.requirements?.testing)
        }
      },
      agents: {
        primary: this.getString(data.agents?.primary) || 'senior-developer',
        reviewers: this.getStringArray(data.agents?.reviewers?.agent) || []
      },
      output: {
        include_tests: this.getBoolean(data.output?.include_tests),
        include_docs: this.getBoolean(data.output?.include_docs),
        include_types: this.getBoolean(data.output?.include_types)
      }
    };
  }

  /**
   * 解析bolt_artifact标签
   */
  private parseBoltArtifact(data: any): BoltArtifactElement {
    return {
      tagName: 'bolt_artifact',
      attributes: this.extractAttributes(data),
      children: [],
      id: this.getString(data['@_id']) || this.getString(data.id) || 'unknown',
      title: this.getString(data['@_title']) || this.getString(data.title) || 'Untitled',
      meta: {
        version: this.getString(data.meta?.version) || '1.0',
        agent: this.getString(data.meta?.agent) || 'code-generator',
        quality_score: this.getNumber(data.meta?.quality_score) || 0.8
      },
      environment: {
        type: this.getEnvironmentType(data.environment?.type),
        constraints: {
          no_native_binaries: this.getBoolean(data.environment?.constraints?.no_native_binaries),
          python_stdlib_only: this.getBoolean(data.environment?.constraints?.python_stdlib_only),
          prefer_vite: this.getBoolean(data.environment?.constraints?.prefer_vite)
        }
      },
      actions: this.parseActions(data.actions?.bolt_action || [])
    };
  }

  /**
   * 解析agent_workflow标签
   */
  private parseAgentWorkflow(data: any): AgentWorkflowElement {
    return {
      tagName: 'agent_workflow',
      attributes: this.extractAttributes(data),
      children: [],
      task: this.getString(data.task) || 'Unknown task',
      workflow: this.parseWorkflowStages(data.workflow?.stage || []),
      quality_gates: this.parseQualityGates(data.quality_gates?.gate || [])
    };
  }

  /**
   * 解析actions
   */
  private parseActions(actionsData: any): any[] {
    const actions = Array.isArray(actionsData) ? actionsData : [actionsData];
    return actions.filter(action => action).map(action => ({
      type: this.getString(action['@_type']) || this.getString(action.type) || 'file',
      path: this.getString(action['@_path']) || this.getString(action.path) || '',
      priority: this.getNumber(action['@_priority']) || this.getNumber(action.priority) || 1,
      content: this.getString(action.content) || '',
      command: this.getString(action.command) || '',
      validation: action.validation ? {
        syntax_check: this.getBoolean(action.validation.syntax_check),
        dependency_check: this.getBoolean(action.validation.dependency_check),
        type_check: this.getBoolean(action.validation.type_check),
        lint_check: this.getBoolean(action.validation.lint_check),
        test_impact: this.getString(action.validation.test_impact) || 'minimal'
      } : undefined,
      retry_on_failure: this.getBoolean(action.retry_on_failure),
      timeout: this.getNumber(action.timeout),
      health_check: action.health_check ? {
        url: this.getString(action.health_check.url),
        timeout: this.getNumber(action.health_check.timeout)
      } : undefined
    }));
  }

  /**
   * 解析workflow stages
   */
  private parseWorkflowStages(stagesData: any): any[] {
    const stages = Array.isArray(stagesData) ? stagesData : [stagesData];
    return stages.filter(stage => stage).map(stage => ({
      name: this.getString(stage['@_name']) || this.getString(stage.name) || '',
      agent: this.getString(stage['@_agent']) || this.getString(stage.agent) || '',
      depends_on: this.getString(stage['@_depends_on']) || this.getString(stage.depends_on),
      input: this.getString(stage.input) || '',
      output: this.getString(stage.output) || '',
      duration: this.getString(stage.duration) || '30min',
      parallel: stage.parallel ? this.parseSubtasks(stage.parallel.subtask || []) : undefined
    }));
  }

  /**
   * 解析subtasks
   */
  private parseSubtasks(subtasksData: any): any[] {
    const subtasks = Array.isArray(subtasksData) ? subtasksData : [subtasksData];
    return subtasks.filter(subtask => subtask).map(subtask => ({
      agent: this.getString(subtask['@_agent']) || this.getString(subtask.agent) || '',
      description: this.getString(subtask['#text']) || this.getString(subtask.description) || this.getString(subtask) || ''
    }));
  }

  /**
   * 解析quality gates
   */
  private parseQualityGates(gatesData: any): any[] {
    const gates = Array.isArray(gatesData) ? gatesData : [gatesData];
    return gates.filter(gate => gate).map(gate => ({
      stage: this.getString(gate['@_stage']) || this.getString(gate.stage) || '',
      criteria: this.getStringArray(gate.criteria) || []
    }));
  }

  /**
   * 工具方法：安全获取字符串
   */
  private getString(value: any): string {
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return String(value);
    if (typeof value === 'boolean') return String(value);
    return '';
  }

  /**
   * 工具方法：安全获取数字
   */
  private getNumber(value: any): number | undefined {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const num = parseFloat(value);
      return isNaN(num) ? undefined : num;
    }
    return undefined;
  }

  /**
   * 工具方法：安全获取布尔值
   */
  private getBoolean(value: any): boolean {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') return value.toLowerCase() === 'true';
    return false;
  }

  /**
   * 工具方法：安全获取字符串数组
   */
  private getStringArray(value: any): string[] {
    if (Array.isArray(value)) {
      return value.map(v => this.getString(v)).filter(s => s);
    }
    if (value) {
      const str = this.getString(value);
      return str ? [str] : [];
    }
    return [];
  }

  /**
   * 工具方法：安全获取安全级别
   */
  private getSecurityLevel(value: any): 'low' | 'medium' | 'high' {
    const str = this.getString(value).toLowerCase();
    if (str === 'low' || str === 'medium' || str === 'high') {
      return str as 'low' | 'medium' | 'high';
    }
    return 'medium';
  }

  /**
   * 工具方法：安全获取可访问性级别
   */
  private getAccessibilityLevel(value: any): 'basic' | 'wcag-aa' | 'wcag-aaa' {
    const str = this.getString(value).toLowerCase();
    if (str === 'basic' || str === 'wcag-aa' || str === 'wcag-aaa') {
      return str as 'basic' | 'wcag-aa' | 'wcag-aaa';
    }
    return 'basic';
  }

  /**
   * 工具方法：安全获取测试级别
   */
  private getTestingLevel(value: any): 'basic' | 'comprehensive' | 'enterprise' {
    const str = this.getString(value).toLowerCase();
    if (str === 'basic' || str === 'comprehensive' || str === 'enterprise') {
      return str as 'basic' | 'comprehensive' | 'enterprise';
    }
    return 'basic';
  }

  /**
   * 工具方法：安全获取环境类型
   */
  private getEnvironmentType(value: any): 'webcontainer' | 'local' | 'docker' {
    const str = this.getString(value).toLowerCase();
    if (str === 'webcontainer' || str === 'local' || str === 'docker') {
      return str as 'webcontainer' | 'local' | 'docker';
    }
    return 'webcontainer';
  }

  /**
   * 工具方法：提取XML属性
   */
  private extractAttributes(value: any): Record<string, string> {
    const attributes: Record<string, string> = {};
    if (typeof value === 'object' && value !== null) {
      for (const [key, val] of Object.entries(value)) {
        if (key.startsWith('@_')) {
          attributes[key.substring(2)] = String(val);
        }
      }
    }
    return attributes;
  }
}

/**
 * 创建简化TagX解析器实例
 */
export const createSimpleTagXParser = () => new SimpleTagXParser();
