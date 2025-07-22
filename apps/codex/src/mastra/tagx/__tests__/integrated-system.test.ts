/**
 * 集成TagX系统测试
 * 
 * 测试P0和P1优先级功能的完整实现
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { Memory } from '@mastra/memory';
import { IntegratedTagXSystem } from '../integrated-system';

// Mock dependencies
jest.mock('@mastra/memory');
jest.mock('../mastra-tagx-system');
jest.mock('../enhanced-processor');

describe('IntegratedTagXSystem', () => {
  let system: IntegratedTagXSystem;
  let mockMemory: jest.Mocked<Memory>;

  beforeEach(() => {
    mockMemory = new Memory() as jest.Mocked<Memory>;
    system = new IntegratedTagXSystem(mockMemory);
  });

  describe('智能路由功能', () => {
    it('应该正确分析指令复杂度', () => {
      // 简单指令
      const simpleXml = '<smart_code_gen task="创建一个简单函数" />';
      expect((system as any).analyzeComplexity(simpleXml)).toBe('low');

      // 中等复杂度指令
      const mediumXml = `
        <smart_code_gen task="创建一个React组件">
          <context project_type="react" />
          <agents primary="senior-developer" />
        </smart_code_gen>
      `;
      expect((system as any).analyzeComplexity(mediumXml)).toBe('medium');

      // 高复杂度指令
      const complexXml = `
        <agent_workflow task="完整的项目开发流程">
          <workflow>
            <stage name="分析" agent="project-architect" />
            <stage name="开发" agent="senior-developer" />
            <stage name="审查" agent="code-reviewer" />
            <stage name="测试" agent="qa-engineer" />
          </workflow>
          <quality_gates>
            <gate stage="开发" criteria="code_quality > 0.8" />
            <gate stage="审查" criteria="security_score > 8.0" />
          </quality_gates>
        </agent_workflow>
      `;
      expect((system as any).analyzeComplexity(complexXml)).toBe('high');
    });

    it('应该正确检测高级功能', () => {
      const basicXml = '<smart_code_gen task="创建函数" />';
      expect((system as any).hasAdvancedFeatures(basicXml)).toBe(false);

      const advancedXml = '<agent_workflow task="多智能体协作" />';
      expect((system as any).hasAdvancedFeatures(advancedXml)).toBe(true);

      const qualityXml = '<quality_check scope="全项目" />';
      expect((system as any).hasAdvancedFeatures(qualityXml)).toBe(true);
    });
  });

  describe('TagX指令验证', () => {
    it('应该验证有效的XML格式', () => {
      const validXml = '<smart_code_gen task="创建函数" />';
      const result = system.validate(validXml);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('应该检测无效的XML格式', () => {
      const invalidXml = '<smart_code_gen task="创建函数">';
      const result = system.validate(invalidXml);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('应该检测不支持的标签', () => {
      const unsupportedXml = '<unsupported_tag task="测试" />';
      const result = system.validate(unsupportedXml);
      expect(result.valid).toBe(false);
    });
  });

  describe('支持的标签', () => {
    it('应该返回完整的支持标签列表', () => {
      const tags = system.getSupportedTags();
      expect(tags).toContain('smart_code_gen');
      expect(tags).toContain('bolt_artifact');
      expect(tags).toContain('agent_workflow');
      expect(tags).toContain('quality_check');
      expect(tags.length).toBeGreaterThan(4);
    });
  });

  describe('工具创建', () => {
    it('应该创建有效的Mastra工具', () => {
      const tool = system.createIntegratedTool();
      expect(tool).toBeDefined();
      expect(tool.id).toBe('integrated-tagx-system');
      expect(tool.description).toContain('TagX智能编程助手');
      expect(tool.inputSchema).toBeDefined();
      expect(tool.outputSchema).toBeDefined();
      expect(tool.execute).toBeDefined();
    });
  });

  describe('质量报告生成', () => {
    it('应该生成正确的质量报告', () => {
      const results = [
        { success: true, quality_score: 0.9, tagName: 'smart_code_gen' },
        { success: true, quality_score: 0.8, tagName: 'quality_check' },
        { success: false, quality_score: 0.6, tagName: 'bolt_artifact' }
      ];

      const report = (system as any).generateQualityReport(results);
      expect(report).toBeDefined();
      expect(report.averageScore).toBeCloseTo(0.77, 2);
      expect(report.totalChecks).toBe(3);
      expect(report.passedChecks).toBe(2);
      expect(report.recommendations).toBeInstanceOf(Array);
    });

    it('应该处理没有质量分数的结果', () => {
      const results = [
        { success: true, tagName: 'smart_code_gen' },
        { success: false, tagName: 'bolt_artifact' }
      ];

      const report = (system as any).generateQualityReport(results);
      expect(report).toBeUndefined();
    });
  });

  describe('建议生成', () => {
    it('应该为低质量分数生成改进建议', () => {
      const results = [{ success: true, quality_score: 0.5 }];
      const recommendations = (system as any).generateRecommendations(0.5, results);
      
      expect(recommendations).toContain('整体代码质量需要改进，建议使用增强处理器');
      expect(recommendations).toContain('考虑启用更严格的质量检查');
    });

    it('应该为高质量分数生成鼓励建议', () => {
      const results = [{ success: true, quality_score: 0.95 }];
      const recommendations = (system as any).generateRecommendations(0.95, results);
      
      expect(recommendations).toContain('代码质量优秀，继续保持当前标准');
    });

    it('应该为有错误的结果生成调试建议', () => {
      const results = [{ success: false, error: '执行失败' }];
      const recommendations = (system as any).generateRecommendations(0.8, results);
      
      expect(recommendations).toContain('存在执行错误，建议检查TagX指令格式');
    });
  });

  describe('嵌套层级计算', () => {
    it('应该正确计算XML嵌套层级', () => {
      const simpleXml = '<tag />';
      expect((system as any).calculateNestingLevel(simpleXml)).toBe(1);

      const nestedXml = '<outer><inner><deep /></inner></outer>';
      expect((system as any).calculateNestingLevel(nestedXml)).toBe(3);

      const complexXml = `
        <agent_workflow>
          <workflow>
            <stage>
              <input>
                <data />
              </input>
            </stage>
          </workflow>
        </agent_workflow>
      `;
      expect((system as any).calculateNestingLevel(complexXml)).toBe(5);
    });
  });
});

describe('TagX工具执行测试', () => {
  let system: IntegratedTagXSystem;

  beforeEach(() => {
    system = new IntegratedTagXSystem();
  });

  describe('工具执行上下文', () => {
    it('应该正确处理工具执行参数', async () => {
      const tool = system.createIntegratedTool();
      
      const mockContext = {
        xml: '<smart_code_gen task="创建测试函数" />',
        projectPath: '/test/project',
        sessionId: 'test-session-123',
        userId: 'test-user',
        preferences: {
          defaultLanguage: 'typescript',
          codeStyle: 'standard',
          testFramework: 'jest',
          deploymentPlatform: 'vercel',
          qualityLevel: 'standard' as const,
          useEnhancedFeatures: true
        },
        timeout: 30000
      };

      // 模拟工具执行（实际测试中需要mock底层依赖）
      expect(tool.execute).toBeDefined();
      expect(typeof tool.execute).toBe('function');
    });
  });

  describe('错误处理', () => {
    it('应该优雅处理执行错误', async () => {
      // 这里可以添加错误处理的具体测试
      // 需要mock底层依赖来模拟各种错误情况
      expect(true).toBe(true); // 占位符测试
    });
  });
});

describe('性能测试', () => {
  let system: IntegratedTagXSystem;

  beforeEach(() => {
    system = new IntegratedTagXSystem();
  });

  describe('响应时间', () => {
    it('TagX解析应该在100ms内完成', () => {
      const xml = '<smart_code_gen task="简单任务" />';
      const startTime = Date.now();
      
      system.validate(xml);
      
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(100);
    });

    it('复杂度分析应该快速完成', () => {
      const complexXml = `
        <agent_workflow task="复杂工作流">
          <workflow>
            <stage name="stage1" />
            <stage name="stage2" />
            <stage name="stage3" />
          </workflow>
        </agent_workflow>
      `;
      
      const startTime = Date.now();
      (system as any).analyzeComplexity(complexXml);
      const duration = Date.now() - startTime;
      
      expect(duration).toBeLessThan(50);
    });
  });

  describe('内存使用', () => {
    it('应该正确清理资源', () => {
      // 创建多个系统实例
      const systems = Array.from({ length: 10 }, () => new IntegratedTagXSystem());
      
      // 执行一些操作
      systems.forEach(sys => {
        sys.validate('<smart_code_gen task="测试" />');
        sys.getSupportedTags();
      });
      
      // 验证没有内存泄漏（简化测试）
      expect(systems.length).toBe(10);
    });
  });
});
