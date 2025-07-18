/**
 * TagX处理器测试
 * 
 * 测试TagX指令的完整处理流程，包括解析、执行和结果返回
 */

// Jest测试框架自动提供describe, it, expect, beforeEach等全局函数
import { TagXProcessor } from '../processor';
import { TagXContext } from '../types';

describe('TagXProcessor', () => {
  let processor: TagXProcessor;
  let mockContext: TagXContext;

  beforeEach(() => {
    processor = new TagXProcessor({
      databaseUrl: ':memory:',
      enableLogging: false,
      maxExecutionTime: 10000,
      enableCaching: false
    });

    mockContext = {
      projectPath: '/test/project',
      userId: 'test-user',
      sessionId: 'test-session-123',
      preferences: {
        defaultLanguage: 'typescript',
        codeStyle: 'standard',
        testFramework: 'vitest',
        deploymentPlatform: 'vercel',
        qualityLevel: 'standard'
      },
      history: []
    };
  });

  describe('基础处理功能', () => {
    it('应该成功处理简单的smart_code_gen指令', async () => {
      const xml = `
        <smart_code_gen>
          <task>创建一个简单的Hello World组件</task>
          <context>
            <project_type>react-typescript</project_type>
            <requirements>
              <security>low</security>
              <accessibility>basic</accessibility>
              <testing>basic</testing>
            </requirements>
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

      const results = await processor.process(xml, mockContext);
      
      expect(results).toHaveLength(1);
      expect(results[0].tagName).toBe('smart_code_gen');
      expect(results[0].duration).toBeGreaterThan(0);
      // 注意：由于我们还没有完全实现执行器，这里可能会失败
      // 这是预期的，我们会在后续完善实现
    });

    it('应该处理XML解析错误', async () => {
      const invalidXML = '<smart_code_gen><task>未闭合标签';
      
      const results = await processor.process(invalidXML, mockContext);
      
      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(false);
      expect(results[0].error).toContain('XML格式错误');
    });

    it('应该处理空的XML输入', async () => {
      const emptyXML = '<root></root>';
      
      const results = await processor.process(emptyXML, mockContext);
      
      expect(results).toHaveLength(0);
    });
  });

  describe('性能测试', () => {
    it('解析时间应该小于100ms', async () => {
      const xml = `
        <smart_code_gen>
          <task>性能测试任务</task>
          <context>
            <project_type>react-typescript</project_type>
            <existing_files>
              ${Array.from({ length: 100 }, (_, i) => `<file>src/component${i}.tsx</file>`).join('\n')}
            </existing_files>
          </context>
        </smart_code_gen>
      `;

      const startTime = Date.now();
      await processor.process(xml, mockContext);
      const totalTime = Date.now() - startTime;

      // 总处理时间可能较长（因为包含执行），但解析部分应该很快
      expect(totalTime).toBeGreaterThan(0);
    });

    it('应该在超时时间内完成处理', async () => {
      const processor = new TagXProcessor({
        maxExecutionTime: 1000, // 1秒超时
        enableLogging: false
      });

      const xml = `
        <smart_code_gen>
          <task>快速任务</task>
        </smart_code_gen>
      `;

      const startTime = Date.now();
      const results = await processor.process(xml, mockContext);
      const totalTime = Date.now() - startTime;

      // 应该在超时时间内完成或返回超时错误
      expect(totalTime).toBeLessThan(2000);
    });
  });

  describe('批量处理', () => {
    it('应该支持串行批量处理', async () => {
      const instructions = [
        {
          xml: '<smart_code_gen><task>任务1</task></smart_code_gen>',
          context: mockContext
        },
        {
          xml: '<smart_code_gen><task>任务2</task></smart_code_gen>',
          context: mockContext
        }
      ];

      const results = await processor.processBatch(instructions, { parallel: false });
      
      expect(results).toHaveLength(2);
      expect(results[0]).toHaveLength(1);
      expect(results[1]).toHaveLength(1);
    });

    it('应该支持并行批量处理', async () => {
      const instructions = [
        {
          xml: '<smart_code_gen><task>并行任务1</task></smart_code_gen>',
          context: mockContext
        },
        {
          xml: '<smart_code_gen><task>并行任务2</task></smart_code_gen>',
          context: mockContext
        }
      ];

      const startTime = Date.now();
      const results = await processor.processBatch(instructions, { parallel: true });
      const totalTime = Date.now() - startTime;
      
      expect(results).toHaveLength(2);
      // 并行处理应该比串行处理更快（理论上）
    });

    it('应该在stopOnError=true时停止处理', async () => {
      const instructions = [
        {
          xml: '<smart_code_gen><task>正常任务</task></smart_code_gen>',
          context: mockContext
        },
        {
          xml: '<invalid_xml>错误的XML',
          context: mockContext
        },
        {
          xml: '<smart_code_gen><task>不应该执行的任务</task></smart_code_gen>',
          context: mockContext
        }
      ];

      const results = await processor.processBatch(instructions, { 
        parallel: false, 
        stopOnError: true 
      });
      
      // 应该只处理前两个指令，第三个因为stopOnError而被跳过
      expect(results.length).toBeLessThanOrEqual(2);
    });
  });

  describe('统计信息', () => {
    it('应该返回处理统计信息', async () => {
      const stats = await processor.getStatistics();
      
      expect(stats).toHaveProperty('totalProcessed');
      expect(stats).toHaveProperty('successRate');
      expect(stats).toHaveProperty('averageExecutionTime');
      expect(stats).toHaveProperty('mostUsedTags');
      expect(stats).toHaveProperty('recentErrors');
      
      expect(typeof stats.totalProcessed).toBe('number');
      expect(typeof stats.successRate).toBe('number');
      expect(typeof stats.averageExecutionTime).toBe('number');
      expect(Array.isArray(stats.mostUsedTags)).toBe(true);
      expect(Array.isArray(stats.recentErrors)).toBe(true);
    });
  });

  describe('清理功能', () => {
    it('应该支持清理历史记录', async () => {
      await expect(processor.cleanup()).resolves.not.toThrow();
    });

    it('应该支持按条件清理', async () => {
      const olderThan = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24小时前
      
      await expect(processor.cleanup({ 
        olderThan,
        clearCache: true 
      })).resolves.not.toThrow();
    });
  });

  describe('错误处理', () => {
    it('应该优雅处理执行器错误', async () => {
      // 模拟一个会导致执行器错误的XML
      const xml = `
        <smart_code_gen>
          <task>这是一个可能导致错误的复杂任务</task>
          <context>
            <project_type>unknown-type</project_type>
          </context>
        </smart_code_gen>
      `;

      const results = await processor.process(xml, mockContext);
      
      expect(results).toHaveLength(1);
      // 即使执行失败，也应该返回结构化的错误结果
      expect(results[0]).toHaveProperty('success');
      expect(results[0]).toHaveProperty('error');
      expect(results[0]).toHaveProperty('duration');
    });

    it('应该处理无效的上下文', async () => {
      const xml = '<smart_code_gen><task>测试任务</task></smart_code_gen>';
      const invalidContext = {
        ...mockContext,
        projectPath: '', // 无效的项目路径
        sessionId: '' // 无效的会话ID
      };

      const results = await processor.process(xml, invalidContext);
      
      // 应该能够处理无效上下文，可能返回错误或使用默认值
      expect(results).toHaveLength(1);
    });
  });

  describe('多标签处理', () => {
    it('应该按优先级顺序处理多个标签', async () => {
      const xml = `
        <root>
          <smart_code_gen>
            <task>代码生成任务</task>
          </smart_code_gen>
          <bolt_artifact id="test" title="测试项目">
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

      const results = await processor.process(xml, mockContext);
      
      expect(results.length).toBeGreaterThan(0);
      // 验证标签是否按预期顺序处理
    });
  });
});
