/**
 * TagX解析器测试
 * 
 * 测试TagX XML指令解析功能，确保解析准确性和性能
 */

// Jest测试框架自动提供describe, it, expect, beforeEach等全局函数
import { TagXParser } from '../parser';
import { SmartCodeGenElement, BoltArtifactElement, AgentWorkflowElement } from '../types';

describe('TagXParser', () => {
  let parser: TagXParser;

  beforeEach(() => {
    parser = new TagXParser();
  });

  describe('XML验证', () => {
    it('应该验证有效的XML', () => {
      const validXML = '<smart_code_gen><task>测试任务</task></smart_code_gen>';
      const result = parser.validateXML(validXML);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('应该检测无效的XML', () => {
      const invalidXML = '<smart_code_gen><task>测试任务</task>';
      const result = parser.validateXML(invalidXML);
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('smart_code_gen标签解析', () => {
    it('应该正确解析基础smart_code_gen标签', () => {
      const xml = `
        <smart_code_gen>
          <task>创建用户认证系统</task>
          <context>
            <project_type>react-typescript</project_type>
            <existing_files>
              <file>src/types/user.ts</file>
              <file>src/utils/api.ts</file>
            </existing_files>
            <requirements>
              <security>high</security>
              <accessibility>wcag-aa</accessibility>
              <testing>comprehensive</testing>
            </requirements>
          </context>
          <agents>
            <primary>senior-developer</primary>
            <reviewers>
              <agent>security-auditor</agent>
              <agent>code-reviewer</agent>
            </reviewers>
          </agents>
          <output>
            <include_tests>true</include_tests>
            <include_docs>true</include_docs>
            <include_types>true</include_types>
          </output>
        </smart_code_gen>
      `;

      const elements = parser.parse(xml);
      expect(elements).toHaveLength(1);
      
      const element = elements[0] as SmartCodeGenElement;
      expect(element.tagName).toBe('smart_code_gen');
      expect(element.task).toBe('创建用户认证系统');
      expect(element.context.project_type).toBe('react-typescript');
      expect(element.context.existing_files).toContain('src/types/user.ts');
      expect(element.context.requirements.security).toBe('high');
      expect(element.agents.primary).toBe('senior-developer');
      expect(element.agents.reviewers).toContain('security-auditor');
      expect(element.output.include_tests).toBe(true);
    });

    it('应该处理缺失的可选字段', () => {
      const xml = `
        <smart_code_gen>
          <task>简单任务</task>
        </smart_code_gen>
      `;

      const elements = parser.parse(xml);
      expect(elements).toHaveLength(1);
      
      const element = elements[0] as SmartCodeGenElement;
      expect(element.tagName).toBe('smart_code_gen');
      expect(element.task).toBe('简单任务');
      expect(element.context.project_type).toBe('unknown');
      expect(element.agents.primary).toBe('senior-developer');
    });
  });

  describe('bolt_artifact标签解析', () => {
    it('应该正确解析bolt_artifact标签', () => {
      const xml = `
        <bolt_artifact id="test-project" title="测试项目">
          <meta>
            <version>2.0</version>
            <agent>code-generator</agent>
            <quality_score>0.95</quality_score>
          </meta>
          <environment>
            <type>webcontainer</type>
            <constraints>
              <no_native_binaries>true</no_native_binaries>
              <python_stdlib_only>true</python_stdlib_only>
              <prefer_vite>true</prefer_vite>
            </constraints>
          </environment>
          <actions>
            <bolt_action type="file" path="package.json" priority="1">
              <content>{"name": "test-project"}</content>
              <validation>
                <syntax_check>true</syntax_check>
                <dependency_check>true</dependency_check>
              </validation>
            </bolt_action>
            <bolt_action type="shell" priority="2">
              <command>npm install</command>
              <retry_on_failure>true</retry_on_failure>
              <timeout>300</timeout>
            </bolt_action>
          </actions>
        </bolt_artifact>
      `;

      const elements = parser.parse(xml);
      expect(elements).toHaveLength(1);
      
      const element = elements[0] as BoltArtifactElement;
      expect(element.tagName).toBe('bolt_artifact');
      expect(element.id).toBe('test-project');
      expect(element.title).toBe('测试项目');
      expect(element.meta.version).toBe('2.0');
      expect(element.meta.quality_score).toBe(0.95);
      expect(element.environment.type).toBe('webcontainer');
      expect(element.environment.constraints.no_native_binaries).toBe(true);
      expect(element.actions).toHaveLength(2);
      expect(element.actions[0].type).toBe('file');
      expect(element.actions[0].path).toBe('package.json');
      expect(element.actions[0].priority).toBe(1);
    });
  });

  describe('agent_workflow标签解析', () => {
    it('应该正确解析agent_workflow标签', () => {
      const xml = `
        <agent_workflow>
          <task>构建完整的电商功能</task>
          <workflow>
            <stage name="analysis" agent="product-manager">
              <input>用户需求和业务目标</input>
              <output>产品需求文档(PRD)</output>
              <duration>30min</duration>
            </stage>
            <stage name="design" agent="architect" depends_on="analysis">
              <input>PRD from analysis stage</input>
              <output>系统架构和API设计</output>
              <duration>45min</duration>
            </stage>
            <stage name="implementation" agent="senior-developer" depends_on="design">
              <input>架构和API设计</input>
              <output>完整代码实现</output>
              <duration>2hours</duration>
              <parallel>
                <subtask agent="frontend-specialist">UI组件</subtask>
                <subtask agent="backend-specialist">API端点</subtask>
              </parallel>
            </stage>
          </workflow>
          <quality_gates>
            <gate stage="implementation">
              <criteria>code_coverage >= 80%</criteria>
              <criteria>security_score >= 90%</criteria>
            </gate>
          </quality_gates>
        </agent_workflow>
      `;

      const elements = parser.parse(xml);
      expect(elements).toHaveLength(1);
      
      const element = elements[0] as AgentWorkflowElement;
      expect(element.tagName).toBe('agent_workflow');
      expect(element.task).toBe('构建完整的电商功能');
      expect(element.workflow).toHaveLength(3);
      expect(element.workflow[0].name).toBe('analysis');
      expect(element.workflow[0].agent).toBe('product-manager');
      expect(element.workflow[1].depends_on).toBe('analysis');
      expect(element.workflow[2].parallel).toHaveLength(2);
      expect(element.quality_gates).toHaveLength(1);
      expect(element.quality_gates[0].stage).toBe('implementation');
      expect(element.quality_gates[0].criteria).toContain('code_coverage >= 80%');
    });
  });

  describe('性能测试', () => {
    it('解析时间应该小于100ms', () => {
      const xml = `
        <smart_code_gen>
          <task>性能测试任务</task>
          <context>
            <project_type>react-typescript</project_type>
            <existing_files>
              ${Array.from({ length: 50 }, (_, i) => `<file>src/file${i}.ts</file>`).join('\n')}
            </existing_files>
          </context>
        </smart_code_gen>
      `;

      const startTime = Date.now();
      const elements = parser.parse(xml);
      const parseTime = Date.now() - startTime;

      expect(parseTime).toBeLessThan(100);
      expect(elements).toHaveLength(1);
    });
  });

  describe('错误处理', () => {
    it('应该抛出有意义的错误信息', () => {
      const invalidXML = '<invalid_tag>内容</invalid_tag>';
      
      expect(() => {
        parser.parse(invalidXML);
      }).not.toThrow(); // 无效标签应该被忽略，不抛出错误
      
      const elements = parser.parse(invalidXML);
      expect(elements).toHaveLength(0);
    });

    it('应该处理格式错误的XML', () => {
      const malformedXML = '<smart_code_gen><task>未闭合标签';
      
      expect(() => {
        parser.parse(malformedXML);
      }).toThrow('XML格式错误');
    });
  });

  describe('多标签解析', () => {
    it('应该解析包含多个TagX标签的XML', () => {
      const xml = `
        <root>
          <smart_code_gen>
            <task>任务1</task>
          </smart_code_gen>
          <bolt_artifact id="project1" title="项目1">
            <meta>
              <version>1.0</version>
              <agent>generator</agent>
              <quality_score>0.8</quality_score>
            </meta>
            <environment>
              <type>webcontainer</type>
            </environment>
            <actions>
              <bolt_action type="file" path="test.js" priority="1">
                <content>console.log('test');</content>
              </bolt_action>
            </actions>
          </bolt_artifact>
        </root>
      `;

      const elements = parser.parse(xml);
      expect(elements).toHaveLength(2);
      expect(elements[0].tagName).toBe('smart_code_gen');
      expect(elements[1].tagName).toBe('bolt_artifact');
    });
  });
});
