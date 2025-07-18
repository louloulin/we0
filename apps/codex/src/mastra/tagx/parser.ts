/**
 * TagX XML指令解析器
 * 
 * 基于fast-xml-parser实现高性能XML解析，支持所有TagX标签
 * 性能目标：解析时间 < 100ms
 */

import { XMLParser, XMLValidator } from 'fast-xml-parser';
import { z } from 'zod';
import {
  TagXElement,
  SmartCodeGenElement,
  BoltArtifactElement,
  AgentWorkflowElement,
  QualityCheckElement,
  SmartRefactorElement,
  BatchFileOpsElement,
  AnalyzeProjectElement,
  GenerateProjectElement,
  GenerateTestsElement,
  GenerateDeploymentElement,
  GenerateCicdElement,
  SmartCodeGenSchema,
  BoltArtifactSchema,
  AgentWorkflowSchema
} from './types';

/**
 * TagX解析器配置
 */
const parserOptions = {
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text',
  parseAttributeValue: true,
  parseTagValue: true,
  trimValues: true,
  parseTrueNumberOnly: false,
  arrayMode: false,
  alwaysCreateTextNode: false,
  // 移除isArray配置，让解析器自然处理数组
};

/**
 * TagX XML解析器类
 */
export class TagXParser {
  private parser: XMLParser;

  constructor() {
    this.parser = new XMLParser(parserOptions);
  }

  /**
   * 验证XML格式是否正确
   */
  validateXML(xmlString: string): { valid: boolean; error?: string } {
    const result = XMLValidator.validate(xmlString);
    if (result === true) {
      return { valid: true };
    } else {
      return { 
        valid: false, 
        error: typeof result === 'object' ? result.err.msg : 'XML格式错误' 
      };
    }
  }

  /**
   * 解析TagX XML指令
   */
  parse(xmlString: string): TagXElement[] {
    // 首先验证XML格式
    const validation = this.validateXML(xmlString);
    if (!validation.valid) {
      throw new Error(`XML格式错误: ${validation.error}`);
    }

    try {
      const parsed = this.parser.parse(xmlString);
      return this.extractTagXElements(parsed);
    } catch (error) {
      throw new Error(`TagX解析失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 从解析结果中提取TagX元素
   */
  private extractTagXElements(parsed: any): TagXElement[] {
    const elements: TagXElement[] = [];

    // 递归遍历解析结果，查找TagX标签
    const traverse = (obj: any, path: string = '') => {
      if (typeof obj !== 'object' || obj === null) return;

      for (const [key, value] of Object.entries(obj)) {
        if (this.isTagXElement(key)) {
          const element = this.parseTagXElement(key, value);
          if (element) {
            elements.push(element);
          }
        } else if (typeof value === 'object') {
          traverse(value, `${path}.${key}`);
        }
      }
    };

    traverse(parsed);
    return elements;
  }

  /**
   * 检查是否为TagX标签
   */
  private isTagXElement(tagName: string): boolean {
    const tagXTags = [
      'smart_code_gen',
      'bolt_artifact', 
      'agent_workflow',
      'quality_check',
      'smart_refactor',
      'batch_file_ops',
      'analyze_project',
      'generate_project',
      'generate_tests',
      'generate_deployment',
      'generate_cicd'
    ];
    return tagXTags.includes(tagName);
  }

  /**
   * 解析具体的TagX元素
   */
  private parseTagXElement(tagName: string, value: any): TagXElement | null {
    try {
      switch (tagName) {
        case 'smart_code_gen':
          return this.parseSmartCodeGen(value);
        case 'bolt_artifact':
          return this.parseBoltArtifact(value);
        case 'agent_workflow':
          return this.parseAgentWorkflow(value);
        case 'quality_check':
          return this.parseQualityCheck(value);
        case 'smart_refactor':
          return this.parseSmartRefactor(value);
        case 'batch_file_ops':
          return this.parseBatchFileOps(value);
        case 'analyze_project':
          return this.parseAnalyzeProject(value);
        case 'generate_project':
          return this.parseGenerateProject(value);
        case 'generate_tests':
          return this.parseGenerateTests(value);
        case 'generate_deployment':
          return this.parseGenerateDeployment(value);
        case 'generate_cicd':
          return this.parseGenerateCicd(value);
        default:
          console.warn(`未知的TagX标签: ${tagName}`);
          return null;
      }
    } catch (error) {
      console.error(`解析${tagName}标签失败:`, error);
      return null;
    }
  }

  /**
   * 解析smart_code_gen标签
   */
  private parseSmartCodeGen(value: any): SmartCodeGenElement {
    const data = this.normalizeXMLData(value);

    // 安全提取文件列表
    const extractFiles = (filesData: any): string[] => {
      if (!filesData) return [];
      if (Array.isArray(filesData)) {
        return filesData.map(f => this.getTextContent(f));
      }
      if (filesData.file) {
        const files = filesData.file;
        if (Array.isArray(files)) {
          return files.filter(f => f).map(f => String(f));
        } else {
          return [String(files)];
        }
      }
      return [];
    };

    // 安全提取审查者列表
    const extractReviewers = (reviewersData: any): string[] => {
      if (!reviewersData) return [];
      if (Array.isArray(reviewersData)) {
        return reviewersData.map(r => this.getTextContent(r));
      }
      if (reviewersData.agent) {
        const agents = reviewersData.agent;
        if (Array.isArray(agents)) {
          return agents.filter(a => a).map(a => String(a));
        } else {
          return [String(agents)];
        }
      }
      return [];
    };

    // 使用Zod验证数据结构
    const validated = SmartCodeGenSchema.parse({
      task: this.getTextContent(data.task) || 'Unknown task',
      context: {
        project_type: this.getTextContent(data.context?.project_type) || 'unknown',
        existing_files: Array.isArray(data.context?.existing_files?.file) ?
          data.context.existing_files.file :
          (data.context?.existing_files?.file ? [data.context.existing_files.file] : []),
        requirements: {
          security: this.getTextContent(data.context?.requirements?.security) || 'medium',
          accessibility: this.getTextContent(data.context?.requirements?.accessibility) || 'basic',
          testing: this.getTextContent(data.context?.requirements?.testing) || 'basic'
        }
      },
      agents: {
        primary: this.getTextContent(data.agents?.primary) || 'senior-developer',
        reviewers: Array.isArray(data.agents?.reviewers?.agent) ?
          data.agents.reviewers.agent :
          (data.agents?.reviewers?.agent ? [data.agents.reviewers.agent] : [])
      },
      output: {
        include_tests: this.getTextContent(data.output?.include_tests) === 'true',
        include_docs: this.getTextContent(data.output?.include_docs) === 'true',
        include_types: this.getTextContent(data.output?.include_types) === 'true'
      }
    });

    return {
      tagName: 'smart_code_gen',
      attributes: this.extractAttributes(value),
      children: [],
      ...validated
    };
  }

  /**
   * 解析bolt_artifact标签
   */
  private parseBoltArtifact(value: any): BoltArtifactElement {
    const data = this.normalizeXMLData(value);

    // 使用Zod验证数据结构
    const validated = BoltArtifactSchema.parse({
      id: this.getAttributeValue(data, 'id', 'unknown'),
      title: this.getAttributeValue(data, 'title', 'Untitled'),
      meta: {
        version: this.getTextContent(data.meta?.version) || '1.0',
        agent: this.getTextContent(data.meta?.agent) || 'code-generator',
        quality_score: parseFloat(this.getTextContent(data.meta?.quality_score) || '0.8')
      },
      environment: {
        type: this.getTextContent(data.environment?.type) || 'webcontainer',
        constraints: {
          no_native_binaries: this.getTextContent(data.environment?.constraints?.no_native_binaries) === 'true',
          python_stdlib_only: this.getTextContent(data.environment?.constraints?.python_stdlib_only) === 'true',
          prefer_vite: this.getTextContent(data.environment?.constraints?.prefer_vite) === 'true'
        }
      },
      actions: this.ensureArray(data.actions?.bolt_action || []).map((action: any) => ({
        type: this.getAttributeValue(action, 'type', 'file') as 'file' | 'shell' | 'start',
        path: this.getAttributeValue(action, 'path'),
        priority: parseInt(this.getAttributeValue(action, 'priority', '1')),
        content: this.getTextContent(action.content),
        command: this.getTextContent(action.command),
        validation: action.validation ? {
          syntax_check: this.getTextContent(action.validation.syntax_check) === 'true',
          dependency_check: this.getTextContent(action.validation.dependency_check) === 'true',
          type_check: this.getTextContent(action.validation.type_check) === 'true',
          lint_check: this.getTextContent(action.validation.lint_check) === 'true',
          test_impact: this.getTextContent(action.validation.test_impact) || 'minimal'
        } : undefined,
        retry_on_failure: this.getTextContent(action.retry_on_failure) === 'true',
        timeout: action.timeout ? parseInt(this.getTextContent(action.timeout)) : undefined,
        health_check: action.health_check ? {
          url: this.getTextContent(action.health_check.url),
          timeout: action.health_check.timeout ? parseInt(this.getTextContent(action.health_check.timeout)) : undefined
        } : undefined
      }))
    });

    return {
      tagName: 'bolt_artifact',
      attributes: this.extractAttributes(value),
      children: [],
      ...validated
    };
  }

  /**
   * 解析agent_workflow标签
   */
  private parseAgentWorkflow(value: any): AgentWorkflowElement {
    const data = this.normalizeXMLData(value);

    // 使用Zod验证数据结构
    const validated = AgentWorkflowSchema.parse({
      task: this.getTextContent(data.task) || 'Unknown task',
      workflow: this.ensureArray(data.workflow?.stage || []).map((stage: any) => ({
        name: this.getAttributeValue(stage, 'name') || this.getTextContent(stage.name),
        agent: this.getAttributeValue(stage, 'agent') || this.getTextContent(stage.agent),
        depends_on: this.getAttributeValue(stage, 'depends_on') || this.getTextContent(stage.depends_on),
        input: this.getTextContent(stage.input),
        output: this.getTextContent(stage.output),
        duration: this.getTextContent(stage.duration) || '30min',
        parallel: stage.parallel ? this.ensureArray(stage.parallel.subtask || []).map((subtask: any) => ({
          agent: this.getAttributeValue(subtask, 'agent') || this.getTextContent(subtask.agent),
          description: this.getTextContent(subtask) || this.getTextContent(subtask.description)
        })) : undefined
      })),
      quality_gates: this.ensureArray(data.quality_gates?.gate || []).map((gate: any) => ({
        stage: this.getAttributeValue(gate, 'stage') || this.getTextContent(gate.stage),
        criteria: this.ensureArray(gate.criteria || []).map((criterion: any) => this.getTextContent(criterion))
      }))
    });

    return {
      tagName: 'agent_workflow',
      attributes: this.extractAttributes(value),
      children: [],
      ...validated
    };
  }

  /**
   * 解析其他TagX标签的占位符方法
   */
  private parseQualityCheck(value: any): QualityCheckElement {
    // TODO: 实现quality_check解析逻辑
    throw new Error('quality_check标签解析尚未实现');
  }

  private parseSmartRefactor(value: any): SmartRefactorElement {
    // TODO: 实现smart_refactor解析逻辑
    throw new Error('smart_refactor标签解析尚未实现');
  }

  private parseBatchFileOps(value: any): BatchFileOpsElement {
    // TODO: 实现batch_file_ops解析逻辑
    throw new Error('batch_file_ops标签解析尚未实现');
  }

  private parseAnalyzeProject(value: any): AnalyzeProjectElement {
    // TODO: 实现analyze_project解析逻辑
    throw new Error('analyze_project标签解析尚未实现');
  }

  private parseGenerateProject(value: any): GenerateProjectElement {
    // TODO: 实现generate_project解析逻辑
    throw new Error('generate_project标签解析尚未实现');
  }

  private parseGenerateTests(value: any): GenerateTestsElement {
    // TODO: 实现generate_tests解析逻辑
    throw new Error('generate_tests标签解析尚未实现');
  }

  private parseGenerateDeployment(value: any): GenerateDeploymentElement {
    // TODO: 实现generate_deployment解析逻辑
    throw new Error('generate_deployment标签解析尚未实现');
  }

  private parseGenerateCicd(value: any): GenerateCicdElement {
    // TODO: 实现generate_cicd解析逻辑
    throw new Error('generate_cicd标签解析尚未实现');
  }

  /**
   * 工具方法：标准化XML数据
   */
  private normalizeXMLData(data: any): any {
    if (typeof data !== 'object' || data === null) {
      return data;
    }

    const normalized: any = {};
    for (const [key, value] of Object.entries(data)) {
      if (key.startsWith('@_')) {
        // 属性
        normalized[key] = value;
      } else if (key === '#text') {
        // 文本内容
        normalized.textContent = value;
      } else {
        // 子元素
        normalized[key] = this.normalizeXMLData(value);
      }
    }
    return normalized;
  }

  /**
   * 工具方法：确保返回数组
   */
  private ensureArray(value: any): any[] {
    if (Array.isArray(value)) return value;
    if (value === undefined || value === null) return [];
    return [value];
  }

  /**
   * 工具方法：安全获取文本内容
   */
  private getTextContent(value: any): string {
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return String(value);
    if (typeof value === 'boolean') return String(value);
    if (typeof value === 'object' && value !== null) {
      if (value['#text']) return String(value['#text']);
      if (value.textContent) return String(value.textContent);
      // 如果是对象但没有文本内容，返回空字符串
      return '';
    }
    return String(value || '');
  }

  /**
   * 工具方法：安全获取属性值
   */
  private getAttributeValue(obj: any, attrName: string, defaultValue: string = ''): string {
    if (!obj || typeof obj !== 'object') return defaultValue;

    // 尝试从属性中获取
    const attrKey = `@_${attrName}`;
    if (obj[attrKey] !== undefined) return String(obj[attrKey]);

    // 尝试从直接属性获取
    if (obj[attrName] !== undefined) return String(obj[attrName]);

    return defaultValue;
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
 * 创建TagX解析器实例
 */
export const createTagXParser = () => new TagXParser();
