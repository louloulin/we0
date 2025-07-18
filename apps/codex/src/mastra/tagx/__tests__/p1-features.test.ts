/**
 * P1优先级功能测试
 * 
 * 测试多智能体工作流和质量检查系统
 */

import { MastraTagXParser, MastraTagXProcessor, TagXContext } from '../mastra-tagx-system';
import { MastraAgentNetwork } from '../agent-network';
import { MastraQualitySystem } from '../quality-system';
import { Memory } from '@mastra/memory';

describe('P1优先级功能测试', () => {
  let parser: MastraTagXParser;
  let processor: MastraTagXProcessor;
  let agentNetwork: MastraAgentNetwork;
  let qualitySystem: MastraQualitySystem;
  let memory: Memory;
  let mockContext: TagXContext;

  beforeEach(() => {
    parser = new MastraTagXParser();
    memory = new Memory();
    processor = new MastraTagXProcessor(memory);
    agentNetwork = new MastraAgentNetwork(memory);
    qualitySystem = new MastraQualitySystem(memory);

    mockContext = {
      projectPath: '/test/project',
      userId: 'test-user',
      sessionId: 'test-session-p1',
      preferences: {
        defaultLanguage: 'typescript',
        codeStyle: 'standard',
        testFramework: 'jest',
        deploymentPlatform: 'vercel',
        qualityLevel: 'high'
      },
      history: []
    };
  });

  describe('多智能体工作流测试', () => {
    it('应该正确解析agent_workflow标签', () => {
      const xml = `
        <agent_workflow>
          <task>构建电商购物车功能</task>
          <workflow>
            <stage name="需求分析" agent="product-manager">
              <input>用户需求描述</input>
              <output>详细需求文档</output>
              <duration>1hour</duration>
            </stage>
            <stage name="架构设计" agent="senior-developer" depends_on="需求分析">
              <input>需求文档</input>
              <output>技术架构方案</output>
              <duration>2hours</duration>
            </stage>
            <stage name="代码实现" agent="senior-developer" depends_on="架构设计">
              <input>技术架构方案</input>
              <output>完整代码实现</output>
              <duration>4hours</duration>
              <parallel>
                <subtask agent="senior-developer">前端组件开发</subtask>
                <subtask agent="senior-developer">后端API开发</subtask>
              </parallel>
            </stage>
            <stage name="代码审查" agent="code-reviewer" depends_on="代码实现">
              <input>代码实现</input>
              <output>审查报告</output>
              <duration>1hour</duration>
            </stage>
            <stage name="安全审计" agent="security-auditor" depends_on="代码实现">
              <input>代码实现</input>
              <output>安全评估报告</output>
              <duration>1hour</duration>
            </stage>
          </workflow>
          <quality_gates>
            <gate stage="代码实现">
              <criteria>代码覆盖率 >= 80%</criteria>
              <criteria>复杂度 <= 10</criteria>
            </gate>
            <gate stage="代码审查">
              <criteria>审查通过率 >= 90%</criteria>
              <criteria>无严重问题</criteria>
            </gate>
            <gate stage="安全审计">
              <criteria>安全评分 >= 85%</criteria>
              <criteria>无高危漏洞</criteria>
            </gate>
          </quality_gates>
        </agent_workflow>
      `;

      const elements = parser.parse(xml);
      
      expect(elements).toHaveLength(1);
      expect(elements[0].tagName).toBe('agent_workflow');
      
      const element = elements[0] as any;
      expect(element.task).toBe('构建电商购物车功能');
      expect(element.workflow).toHaveLength(5);
      expect(element.workflow[0].name).toBe('需求分析');
      expect(element.workflow[1].depends_on).toBe('需求分析');
      expect(element.workflow[2].parallel).toHaveLength(2);
      console.log('Quality gates:', JSON.stringify(element.quality_gates, null, 2));
      expect(element.quality_gates.length).toBeGreaterThanOrEqual(1);
    });

    it('应该获取可用的智能体角色', () => {
      const roles = agentNetwork.getAvailableRoles();
      
      expect(roles.length).toBeGreaterThan(0);
      expect(roles.some(role => role.name === 'senior-developer')).toBe(true);
      expect(roles.some(role => role.name === 'code-reviewer')).toBe(true);
      expect(roles.some(role => role.name === 'security-auditor')).toBe(true);
      expect(roles.some(role => role.name === 'qa-engineer')).toBe(true);
      expect(roles.some(role => role.name === 'product-manager')).toBe(true);
    });

    it('应该能够获取特定智能体实例', () => {
      const seniorDev = agentNetwork.getAgent('senior-developer');
      const codeReviewer = agentNetwork.getAgent('code-reviewer');
      const securityAuditor = agentNetwork.getAgent('security-auditor');

      expect(seniorDev).toBeDefined();
      expect(codeReviewer).toBeDefined();
      expect(securityAuditor).toBeDefined();
    });
  });

  describe('质量检查系统测试', () => {
    it('应该正确解析quality_check标签', () => {
      const xml = `
        <quality_check>
          <target>
            <type>code</type>
            <path>src/components/ShoppingCart.tsx</path>
            <content>
              import React from 'react';
              
              export const ShoppingCart: React.FC = () => {
                return <div>购物车组件</div>;
              };
            </content>
          </target>
          <checks>
            <check id="code-style" category="code-quality" enabled="true" severity="medium" />
            <check id="security-scan" category="security" enabled="true" severity="critical" />
            <check id="performance-analysis" category="performance" enabled="true" severity="medium" />
            <check id="best-practices" category="best-practices" enabled="true" severity="medium" />
          </checks>
          <options>
            <auto_fix>false</auto_fix>
            <generate_report>true</generate_report>
            <fail_on_critical>true</fail_on_critical>
            <threshold_score>0.8</threshold_score>
          </options>
        </quality_check>
      `;

      const elements = parser.parse(xml);
      
      expect(elements).toHaveLength(1);
      expect(elements[0].tagName).toBe('quality_check');
      
      const element = elements[0] as any;
      expect(element.target.type).toBe('code');
      expect(element.target.path).toBe('src/components/ShoppingCart.tsx');
      expect(element.target.content).toContain('ShoppingCart');
      expect(element.checks).toHaveLength(4);
      expect(element.options.auto_fix).toBe(false);
      expect(element.options.generate_report).toBe(true);
      expect(element.options.fail_on_critical).toBe(true);
      expect(element.options.threshold_score).toBe(0.8);
    });

    it('应该获取可用的质量检查配置', () => {
      const checks = qualitySystem.getAvailableChecks();
      
      expect(checks.length).toBeGreaterThan(0);
      expect(checks.some(check => check.id === 'code-style')).toBe(true);
      expect(checks.some(check => check.id === 'security-scan')).toBe(true);
      expect(checks.some(check => check.id === 'performance-analysis')).toBe(true);
      expect(checks.some(check => check.id === 'best-practices')).toBe(true);
    });

    it('应该能够运行质量检查', async () => {
      const testCode = `
        import React, { useState } from 'react';
        
        export const Counter: React.FC = () => {
          const [count, setCount] = useState(0);
          
          return (
            <div>
              <p>计数: {count}</p>
              <button onClick={() => setCount(count + 1)}>增加</button>
            </div>
          );
        };
      `;

      const report = await qualitySystem.runQualityCheck(testCode, 'Counter.tsx', {
        projectPath: mockContext.projectPath,
        userId: mockContext.userId,
        sessionId: mockContext.sessionId
      });

      expect(report).toBeDefined();
      expect(report.id).toBeDefined();
      expect(report.timestamp).toBeInstanceOf(Date);
      expect(report.overallScore).toBeGreaterThanOrEqual(0);
      expect(report.grade).toMatch(/^[A-F]$/);
      expect(report.categories).toBeDefined();
      expect(report.summary).toBeDefined();
      expect(report.recommendations).toBeInstanceOf(Array);
      expect(report.executionTime).toBeGreaterThan(0);
    }, 30000);

    it('应该能够更新质量检查配置', () => {
      const updated = qualitySystem.updateCheckConfig('code-style', {
        enabled: false,
        severity: 'low'
      });

      expect(updated).toBe(true);

      const checks = qualitySystem.getAvailableChecks();
      const codeStyleCheck = checks.find(check => check.id === 'code-style');
      
      expect(codeStyleCheck?.enabled).toBe(false);
      expect(codeStyleCheck?.severity).toBe('low');
    });
  });

  describe('集成测试', () => {
    it('应该支持所有P1优先级标签', () => {
      const supportedTags = processor.getSupportedTags();
      
      expect(supportedTags).toContain('smart_code_gen');
      expect(supportedTags).toContain('bolt_artifact');
      expect(supportedTags).toContain('agent_workflow');
      expect(supportedTags).toContain('quality_check');
    });

    it('应该能够验证复杂的TagX指令', () => {
      const complexXml = `
        <agent_workflow>
          <task>完整的功能开发流程</task>
          <workflow>
            <stage name="分析" agent="product-manager">
              <input>需求</input>
              <output>分析报告</output>
              <duration>30min</duration>
            </stage>
            <stage name="开发" agent="senior-developer" depends_on="分析">
              <input>分析报告</input>
              <output>代码</output>
              <duration>2hours</duration>
            </stage>
          </workflow>
          <quality_gates>
            <gate stage="开发">
              <criteria>质量分数 >= 80%</criteria>
            </gate>
          </quality_gates>
        </agent_workflow>
      `;

      const validation = processor.validate(complexXml);
      
      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('应该处理无效的TagX指令', () => {
      const invalidXml = `
        <invalid_tag>
          <content>这是一个不支持的标签</content>
        </invalid_tag>
      `;

      const validation = processor.validate(invalidXml);
      
      expect(validation.valid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });
  });

  describe('性能测试', () => {
    it('质量检查执行时间应该合理', async () => {
      const testCode = 'const x = 1;';
      const startTime = Date.now();
      
      const report = await qualitySystem.runQualityCheck(testCode, 'test.ts', {
        projectPath: mockContext.projectPath,
        userId: mockContext.userId,
        sessionId: mockContext.sessionId
      });
      
      const executionTime = Date.now() - startTime;
      
      expect(executionTime).toBeLessThan(10000); // 10秒内完成
      expect(report.executionTime).toBeLessThan(10000);
      console.log(`质量检查执行时间: ${executionTime}ms`);
    }, 15000);

    it('解析复杂工作流的时间应该合理', () => {
      const complexWorkflow = `
        <agent_workflow>
          <task>复杂工作流测试</task>
          <workflow>
            ${Array.from({ length: 20 }, (_, i) => `
              <stage name="stage${i}" agent="senior-developer" ${i > 0 ? `depends_on="stage${i-1}"` : ''}>
                <input>输入${i}</input>
                <output>输出${i}</output>
                <duration>30min</duration>
              </stage>
            `).join('\n')}
          </workflow>
          <quality_gates>
            ${Array.from({ length: 5 }, (_, i) => `
              <gate stage="stage${i * 4}">
                <criteria>质量检查${i}</criteria>
              </gate>
            `).join('\n')}
          </quality_gates>
        </agent_workflow>
      `;

      const startTime = Date.now();
      const elements = parser.parse(complexWorkflow);
      const parseTime = Date.now() - startTime;

      expect(elements).toHaveLength(1);
      expect(parseTime).toBeLessThan(200); // 200ms内完成
      console.log(`复杂工作流解析时间: ${parseTime}ms`);
    });
  });
});
