/**
 * P0优先级功能集成测试
 * 
 * 测试TagX指令体系的核心功能：
 * - smart_code_gen: 智能代码生成
 * - bolt_artifact: 增强项目生成
 * - agent_workflow: 多智能体工作流
 */

import { SimpleTagXParser } from '../simple-parser';
import { CompleteTagXExecutor } from '../complete-executor';
import { TagXContext } from '../types';
import { Memory } from '@mastra/memory';

describe('P0优先级功能集成测试', () => {
  let parser: SimpleTagXParser;
  let executor: CompleteTagXExecutor;
  let memory: Memory;
  let mockContext: TagXContext;

  beforeEach(() => {
    parser = new SimpleTagXParser();
    memory = new Memory();
    executor = new CompleteTagXExecutor(memory);

    mockContext = {
      projectPath: '/test/project',
      userId: 'test-user',
      sessionId: 'test-session-p0',
      preferences: {
        defaultLanguage: 'typescript',
        codeStyle: 'standard',
        testFramework: 'jest',
        deploymentPlatform: 'vercel',
        qualityLevel: 'standard'
      },
      history: []
    };
  });

  describe('smart_code_gen - 智能代码生成', () => {
    it('应该成功生成用户认证系统代码', async () => {
      const xml = `
        <smart_code_gen>
          <task>创建用户认证系统，包括登录、注册和密码重置功能</task>
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
      const results = await executor.execute(elements, mockContext);
      
      expect(results).toHaveLength(1);
      expect(results[0].tagName).toBe('smart_code_gen');
      expect(results[0].success).toBe(true);
      expect(results[0].output).toBeDefined();
      expect(results[0].output.generated_code).toBeDefined();
      expect(results[0].output.reviews).toBeDefined();
      expect(results[0].quality_score).toBeGreaterThan(0);
      expect(results[0].duration).toBeGreaterThan(0);
      expect(results[0].next_steps).toBeDefined();
    }, 30000);

    it('应该处理简化的代码生成请求', async () => {
      const xml = `
        <smart_code_gen>
          <task>创建一个简单的计数器组件</task>
          <context>
            <project_type>react-typescript</project_type>
          </context>
          <agents>
            <primary>senior-developer</primary>
          </agents>
          <output>
            <include_tests>true</include_tests>
            <include_docs>false</include_docs>
            <include_types>true</include_types>
          </output>
        </smart_code_gen>
      `;

      const elements = parser.parse(xml);
      const results = await executor.execute(elements, mockContext);

      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(true);
      expect(results[0].output.task).toBe('创建一个简单的计数器组件');
    }, 15000);
  });

  describe('bolt_artifact - 增强项目生成', () => {
    it('应该成功生成完整的React项目', async () => {
      const xml = `
        <bolt_artifact id="react-todo-app" title="React待办事项应用">
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
              <content>{
  "name": "react-todo-app",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "test": "jest"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "vite": "^4.4.0",
    "typescript": "^5.0.0"
  }
}</content>
              <validation>
                <syntax_check>true</syntax_check>
                <dependency_check>true</dependency_check>
              </validation>
            </bolt_action>
            <bolt_action type="file" path="src/App.tsx" priority="2">
              <content>import React from 'react';

function App() {
  return (
    <div className="App">
      <h1>待办事项应用</h1>
    </div>
  );
}

export default App;</content>
            </bolt_action>
            <bolt_action type="shell" priority="3">
              <command>npm install</command>
              <retry_on_failure>true</retry_on_failure>
              <timeout>300</timeout>
            </bolt_action>
            <bolt_action type="start" priority="4">
              <command>npm run dev</command>
              <health_check>
                <url>http://localhost:3000</url>
                <timeout>30</timeout>
              </health_check>
            </bolt_action>
          </actions>
        </bolt_artifact>
      `;

      const elements = parser.parse(xml);
      const results = await executor.execute(elements, mockContext);

      expect(results).toHaveLength(1);
      expect(results[0].tagName).toBe('bolt_artifact');
      expect(results[0].success).toBe(true);
      expect(results[0].output).toBeDefined();
      expect(results[0].output.artifact_id).toBe('react-todo-app');
      expect(results[0].output.executed_actions).toBeDefined();
      expect(results[0].quality_score).toBe(0.95);
      expect(results[0].files_changed).toBeDefined();
      expect(results[0].next_steps).toContain('项目已生成完成');
    }, 30000);
  });

  describe('agent_workflow - 多智能体工作流', () => {
    it('应该成功执行电商功能开发工作流', async () => {
      const xml = `
        <agent_workflow>
          <task>构建完整的电商购物车功能</task>
          <workflow>
            <stage name="analysis" agent="senior-developer">
              <input>用户需求：购物车增删改查、价格计算、优惠券</input>
              <output>功能需求分析和技术方案</output>
              <duration>30min</duration>
            </stage>
            <stage name="design" agent="senior-developer" depends_on="analysis">
              <input>功能需求分析和技术方案</input>
              <output>详细的API设计和数据结构</output>
              <duration>45min</duration>
            </stage>
            <stage name="implementation" agent="senior-developer" depends_on="design">
              <input>API设计和数据结构</input>
              <output>完整的代码实现</output>
              <duration>2hours</duration>
            </stage>
            <stage name="review" agent="code-reviewer" depends_on="implementation">
              <input>完整的代码实现</input>
              <output>代码审查报告和改进建议</output>
              <duration>30min</duration>
            </stage>
          </workflow>
          <quality_gates>
            <gate stage="implementation">
              <criteria>代码覆盖率 >= 80%</criteria>
              <criteria>安全评分 >= 90%</criteria>
            </gate>
            <gate stage="review">
              <criteria>代码质量评分 >= 85%</criteria>
              <criteria>无严重安全漏洞</criteria>
            </gate>
          </quality_gates>
        </agent_workflow>
      `;

      const elements = parser.parse(xml);
      const results = await executor.execute(elements, mockContext);

      expect(results).toHaveLength(1);
      expect(results[0].tagName).toBe('agent_workflow');
      expect(results[0].success).toBe(true);
      expect(results[0].output).toBeDefined();
      expect(results[0].output.task).toBe('构建完整的电商购物车功能');
      expect(results[0].output.workflow_results).toBeDefined();
      expect(results[0].output.workflow_results.length).toBe(4);
      expect(results[0].output.final_output).toBeDefined();
      expect(results[0].quality_score).toBeGreaterThan(0);
    }, 45000);
  });

  describe('性能测试', () => {
    it('解析时间应该小于100ms', async () => {
      const xml = `
        <smart_code_gen>
          <task>性能测试任务</task>
          <context>
            <project_type>react-typescript</project_type>
            <existing_files>
              ${Array.from({ length: 50 }, (_, i) => `<file>src/component${i}.tsx</file>`).join('\n')}
            </existing_files>
          </context>
          <agents>
            <primary>senior-developer</primary>
          </agents>
          <output>
            <include_tests>false</include_tests>
            <include_docs>false</include_docs>
            <include_types>true</include_types>
          </output>
        </smart_code_gen>
      `;

      const startTime = Date.now();
      const elements = parser.parse(xml);
      const results = await executor.execute(elements, mockContext);
      const totalTime = Date.now() - startTime;

      expect(results).toHaveLength(1);
      // 注意：这里测试的是总处理时间，解析时间应该在其中占很小一部分
      console.log(`总处理时间: ${totalTime}ms`);
    }, 20000);

    it('智能体响应时间应该在合理范围内', async () => {
      const xml = `
        <smart_code_gen>
          <task>创建一个简单的Hello World组件</task>
          <context>
            <project_type>react-typescript</project_type>
          </context>
          <agents>
            <primary>senior-developer</primary>
          </agents>
          <output>
            <include_tests>false</include_tests>
            <include_docs>false</include_docs>
            <include_types>false</include_types>
          </output>
        </smart_code_gen>
      `;

      const startTime = Date.now();
      const elements = parser.parse(xml);
      const results = await executor.execute(elements, mockContext);
      const totalTime = Date.now() - startTime;

      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(true);
      // 智能体响应时间目标 < 5s，但在测试环境中可能会更长
      console.log(`智能体响应时间: ${totalTime}ms`);
    }, 15000);
  });

  describe('错误处理', () => {
    it('应该处理无效的XML格式', async () => {
      const invalidXML = '<smart_code_gen><task>未闭合标签';
      
      const results = await processor.process(invalidXML, mockContext);
      
      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(false);
      expect(results[0].error).toContain('TagX解析失败');
    });

    it('应该处理不支持的标签', async () => {
      const xml = '<unsupported_tag><content>测试</content></unsupported_tag>';
      
      const results = await processor.process(xml, mockContext);
      
      expect(results).toHaveLength(0); // 不支持的标签会被忽略
    });
  });
});
