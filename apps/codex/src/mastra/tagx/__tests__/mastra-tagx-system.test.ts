/**
 * 基于Mastra的TagX系统完整测试
 * 
 * 测试P0优先级功能：
 * - smart_code_gen: 智能代码生成
 * - bolt_artifact: 增强项目生成
 * - agent_workflow: 多智能体工作流
 */

import { MastraTagXParser, MastraTagXExecutor, MastraTagXProcessor, TagXContext } from '../mastra-tagx-system';
import { MockTagXExecutor } from '../mock-executor';
import { Memory } from '@mastra/memory';

describe('基于Mastra的TagX系统测试', () => {
  let parser: MastraTagXParser;
  let executor: MastraTagXExecutor;
  let mockExecutor: MockTagXExecutor;
  let processor: MastraTagXProcessor;
  let memory: Memory;
  let mockContext: TagXContext;

  beforeEach(() => {
    parser = new MastraTagXParser();
    memory = new Memory();
    executor = new MastraTagXExecutor(memory);
    mockExecutor = new MockTagXExecutor(memory);
    processor = new MastraTagXProcessor(memory);

    mockContext = {
      projectPath: '/test/project',
      userId: 'test-user',
      sessionId: 'test-session-mastra',
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

  describe('TagX解析器测试', () => {
    it('应该正确解析smart_code_gen标签', () => {
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
      expect(elements[0].tagName).toBe('smart_code_gen');
      
      const element = elements[0] as any;
      expect(element.task).toBe('创建用户认证系统');
      expect(element.context.project_type).toBe('react-typescript');
      expect(element.context.requirements.security).toBe('high');
      expect(element.agents.primary).toBe('senior-developer');
      expect(element.output.include_tests).toBe(true);
    });

    it('应该正确解析bolt_artifact标签', () => {
      const xml = `
        <bolt_artifact id="react-app" title="React应用">
          <meta>
            <version>1.0</version>
            <agent>code-generator</agent>
            <quality_score>0.9</quality_score>
          </meta>
          <environment>
            <type>webcontainer</type>
            <constraints>
              <no_native_binaries>true</no_native_binaries>
              <prefer_vite>true</prefer_vite>
            </constraints>
          </environment>
          <actions>
            <bolt_action type="file" path="package.json" priority="1">
              <content>{"name": "test-app"}</content>
            </bolt_action>
          </actions>
        </bolt_artifact>
      `;

      const elements = parser.parse(xml);
      
      expect(elements).toHaveLength(1);
      expect(elements[0].tagName).toBe('bolt_artifact');
      
      const element = elements[0] as any;
      expect(element.id).toBe('react-app');
      expect(element.title).toBe('React应用');
      expect(element.meta.quality_score).toBe(0.9);
      expect(element.environment.type).toBe('webcontainer');
    });

    it('应该正确解析agent_workflow标签', () => {
      const xml = `
        <agent_workflow>
          <task>构建电商功能</task>
          <workflow>
            <stage name="analysis" agent="senior-developer">
              <input>用户需求分析</input>
              <output>技术方案</output>
              <duration>30min</duration>
            </stage>
            <stage name="implementation" agent="senior-developer" depends_on="analysis">
              <input>技术方案</input>
              <output>代码实现</output>
              <duration>2hours</duration>
            </stage>
          </workflow>
          <quality_gates>
            <gate stage="implementation">
              <criteria>代码覆盖率 >= 80%</criteria>
              <criteria>安全评分 >= 90%</criteria>
            </gate>
          </quality_gates>
        </agent_workflow>
      `;

      const elements = parser.parse(xml);
      
      expect(elements).toHaveLength(1);
      expect(elements[0].tagName).toBe('agent_workflow');
      
      const element = elements[0] as any;
      expect(element.task).toBe('构建电商功能');
      expect(element.workflow).toHaveLength(2);
      expect(element.workflow[0].name).toBe('analysis');
      expect(element.workflow[1].depends_on).toBe('analysis');
    });

    it('应该处理解析错误', () => {
      const invalidXml = '<smart_code_gen><task>未闭合标签';
      
      expect(() => parser.parse(invalidXml)).toThrow('TagX解析失败');
    });
  });

  describe('TagX执行器测试', () => {
    it('应该成功执行smart_code_gen', async () => {
      const element = {
        tagName: 'smart_code_gen',
        attributes: {},
        children: [],
        task: '创建简单组件',
        context: {
          project_type: 'react-typescript',
          existing_files: [],
          requirements: {
            security: 'medium' as const,
            accessibility: 'basic' as const,
            testing: 'basic' as const
          }
        },
        agents: {
          primary: 'senior-developer',
          reviewers: []
        },
        output: {
          include_tests: true,
          include_docs: false,
          include_types: true
        }
      };

      const results = await mockExecutor.execute([element], mockContext);
      
      expect(results).toHaveLength(1);
      expect(results[0].tagName).toBe('smart_code_gen');
      expect(results[0].success).toBe(true);
      expect(results[0].output).toBeDefined();
      expect(results[0].duration).toBeGreaterThan(0);
    }, 30000);

    it('应该成功执行bolt_artifact', async () => {
      const element = {
        tagName: 'bolt_artifact',
        attributes: {},
        children: [],
        id: 'test-project',
        title: '测试项目',
        meta: {
          version: '1.0',
          agent: 'code-generator',
          quality_score: 0.8
        },
        environment: {
          type: 'webcontainer' as const,
          constraints: {
            no_native_binaries: true,
            python_stdlib_only: false,
            prefer_vite: true
          }
        },
        actions: [
          {
            type: 'file',
            path: 'package.json',
            priority: 1,
            content: '{"name": "test"}',
            command: '',
            validation: undefined,
            retry_on_failure: false,
            timeout: undefined,
            health_check: undefined
          }
        ]
      };

      const results = await mockExecutor.execute([element], mockContext);
      
      expect(results).toHaveLength(1);
      expect(results[0].tagName).toBe('bolt_artifact');
      expect(results[0].success).toBe(true);
      expect(results[0].output.artifact_id).toBe('test-project');
      expect(results[0].quality_score).toBe(0.8);
    }, 30000);

    it('应该处理不支持的标签', async () => {
      const element = {
        tagName: 'unsupported_tag',
        attributes: {},
        children: []
      };

      const results = await mockExecutor.execute([element], mockContext);
      
      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(false);
      expect(results[0].error).toContain('不支持的TagX标签');
    });
  });

  describe('TagX处理器集成测试', () => {
    it('应该完整处理smart_code_gen指令', async () => {
      // 创建使用模拟执行器的处理器
      const mockProcessor = new MastraTagXProcessor(memory);
      // 替换内部执行器为模拟版本
      (mockProcessor as any).executor = mockExecutor;

      const xml = `
        <smart_code_gen>
          <task>创建计数器组件</task>
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

      const results = await mockProcessor.process(xml, mockContext);

      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(true);
      expect(results[0].tagName).toBe('smart_code_gen');
      expect(results[0].output.task).toBe('创建计数器组件');
    }, 30000);

    it('应该验证TagX指令格式', () => {
      const validXml = '<smart_code_gen><task>测试</task></smart_code_gen>';
      const invalidXml = '<invalid><unclosed>';

      const validResult = processor.validate(validXml);
      expect(validResult.valid).toBe(true);
      expect(validResult.errors).toHaveLength(0);

      const invalidResult = processor.validate(invalidXml);
      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.errors.length).toBeGreaterThan(0);
    });

    it('应该返回支持的标签列表', () => {
      const supportedTags = processor.getSupportedTags();
      
      expect(supportedTags).toContain('smart_code_gen');
      expect(supportedTags).toContain('bolt_artifact');
      expect(supportedTags).toContain('agent_workflow');
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
      const parseTime = Date.now() - startTime;

      expect(elements).toHaveLength(1);
      expect(parseTime).toBeLessThan(100);
      console.log(`解析时间: ${parseTime}ms`);
    });
  });
});
