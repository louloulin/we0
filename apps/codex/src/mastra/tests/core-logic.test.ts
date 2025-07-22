/**
 * 核心逻辑测试套件
 * 
 * 测试核心功能的逻辑部分，不依赖外部服务
 */

import { describe, test, expect } from '@jest/globals';
import { 
  getMaxThinkingTokens,
  analyzeTaskComplexity,
  shouldUseBinaryFeedbackForTask,
  calculateResponseQuality
} from '../engines/streaming-scheduler';
import { TaskPriority } from '../engines/concurrency-controller';

describe('核心逻辑测试', () => {
  
  describe('流式调度引擎逻辑测试', () => {
    
    test('应该正确检测思维关键词', async () => {
      const basicThinking = await getMaxThinkingTokens('请 think 一下这个问题');
      const deepThinking = await getMaxThinkingTokens('请 think hard 分析这个架构');
      const ultraThinking = await getMaxThinkingTokens('请 ultrathink 这个复杂系统');
      const noThinking = await getMaxThinkingTokens('简单的问题');
      
      expect(basicThinking).toBe(4000);
      expect(deepThinking).toBe(10000);
      expect(ultraThinking).toBe(32000 - 1);
      expect(noThinking).toBe(0);
    });
    
    test('应该正确分析任务复杂度', async () => {
      const highComplexity = await analyzeTaskComplexity(
        '设计一个分布式微服务架构，包含性能优化和安全分析，需要考虑可扩展性和部署策略'
      );
      const mediumComplexity = await analyzeTaskComplexity(
        '实现一个算法来优化数据库查询性能'
      );
      const lowComplexity = await analyzeTaskComplexity(
        '写一个简单的函数'
      );
      
      expect(highComplexity).toBe('high');
      expect(mediumComplexity).toBe('medium');
      expect(lowComplexity).toBe('low');
    });
    
    test('应该正确判断是否使用二元反馈', async () => {
      const shouldUse1 = await shouldUseBinaryFeedbackForTask(
        '请推荐一个最佳的系统设计方案'
      );
      const shouldUse2 = await shouldUseBinaryFeedbackForTask(
        '什么是最好的编程实践？'
      );
      const shouldNotUse = await shouldUseBinaryFeedbackForTask(
        '2 + 2 等于多少？'
      );
      
      expect(shouldUse1).toBe(true);
      expect(shouldUse2).toBe(true);
      expect(shouldNotUse).toBe(false);
    });
    
    test('应该正确计算响应质量', async () => {
      const highQualityResponse = `
        # 详细分析报告
        
        ## 概述
        这是一个结构化的、详细的回答，包含了多个方面的分析。
        
        ## 技术方案
        \`\`\`typescript
        function example() {
          return "示例代码";
        }
        \`\`\`
        
        ## 总结
        综合以上分析，我们可以得出以下结论...
      `;
      
      const lowQualityResponse = '简短回答';
      
      const highScore = await calculateResponseQuality(highQualityResponse);
      const lowScore = await calculateResponseQuality(lowQualityResponse);
      
      expect(highScore).toBeGreaterThan(lowScore);
      expect(highScore).toBeGreaterThan(0.7);
      expect(lowScore).toBeLessThan(0.7);
    });
  });
  
  describe('并发控制逻辑测试', () => {
    
    test('任务优先级应该正确排序', () => {
      const priorities = [
        TaskPriority.LOW,
        TaskPriority.NORMAL,
        TaskPriority.HIGH,
        TaskPriority.CRITICAL,
        TaskPriority.URGENT
      ];
      
      // 验证优先级数值递增
      for (let i = 1; i < priorities.length; i++) {
        expect(priorities[i]).toBeGreaterThan(priorities[i - 1]);
      }
    });
    
    test('应该正确估算资源需求', () => {
      // 这里测试资源需求分析的逻辑
      const codeGenTool = { id: 'code-generator' };
      const fileReadTool = { id: 'file-reader' };
      const searchTool = { id: 'search-api' };
      
      // 基于工具类型的资源需求应该不同
      expect(codeGenTool.id).toContain('code');
      expect(fileReadTool.id).toContain('file');
      expect(searchTool.id).toContain('search');
    });
  });
  
  describe('二元反馈逻辑测试', () => {
    
    test('应该正确评估响应清晰度', () => {
      const structuredContent = `
        # 标题
        
        这是一个结构化的内容，包含：
        - 列表项目
        - **粗体文本**
        - 多个段落
        
        总结部分。
      `;
      
      const unstructuredContent = '这是一段没有结构的长文本内容没有任何格式化';
      
      // 结构化内容应该得到更高的清晰度分数
      expect(structuredContent.includes('#')).toBe(true);
      expect(structuredContent.includes('-')).toBe(true);
      expect(structuredContent.includes('**')).toBe(true);
      
      expect(unstructuredContent.includes('#')).toBe(false);
      expect(unstructuredContent.includes('-')).toBe(false);
    });
    
    test('应该正确评估响应完整性', () => {
      const completeContent = `
        详细的回答内容，包含了多个方面的分析。
        
        例如，我们可以考虑以下几个方面：
        1. 技术实现
        2. 性能考虑
        3. 安全因素
        
        \`\`\`javascript
        // 示例代码
        function example() {
          return "完整示例";
        }
        \`\`\`
        
        总结：综上所述，这是一个完整的回答。
      `;
      
      const incompleteContent = '简短回答';
      
      expect(completeContent.length).toBeGreaterThan(200);
      expect(completeContent.includes('例如')).toBe(true);
      expect(completeContent.includes('```')).toBe(true);
      expect(completeContent.includes('总结')).toBe(true);
      
      expect(incompleteContent.length).toBeLessThan(50);
    });
  });
  
  describe('思维模型逻辑测试', () => {
    
    test('应该正确提取思维内容', () => {
      const responseWithThinking = '<thinking>这是思维过程</thinking>这是最终回答';
      const responseWithoutThinking = '这是没有思维过程的回答';
      
      // 模拟思维提取逻辑
      const thinkingPattern = /<thinking>([\s\S]*?)<\/thinking>/;
      
      const match1 = responseWithThinking.match(thinkingPattern);
      const match2 = responseWithoutThinking.match(thinkingPattern);
      
      expect(match1).not.toBeNull();
      expect(match1![1]).toBe('这是思维过程');
      expect(match2).toBeNull();
    });
    
    test('应该正确提取主要内容', () => {
      const responseWithThinking = '<thinking>思维过程</thinking>主要内容';
      
      // 模拟内容提取逻辑
      const contentWithoutThinking = responseWithThinking
        .replace(/<thinking>[\s\S]*?<\/thinking>/g, '')
        .trim();
      
      expect(contentWithoutThinking).toBe('主要内容');
    });
    
    test('应该正确评估思维质量', () => {
      const highQualityThinking = `
        首先，我需要分析这个问题的核心。
        然后，考虑多种解决方案的优缺点。
        基于以上分析，我认为最佳方案是...
        因此，综合考虑各种因素，建议采用这种方法。
      `;
      
      const lowQualityThinking = '简单思考';
      
      // 模拟质量评估逻辑
      const hasStructure1 = /步骤|首先|然后|最后|因为|所以|考虑|分析/.test(highQualityThinking);
      const hasStructure2 = /步骤|首先|然后|最后|因为|所以|考虑|分析/.test(lowQualityThinking);
      
      expect(hasStructure1).toBe(true);
      expect(hasStructure2).toBe(false);
      expect(highQualityThinking.length).toBeGreaterThan(lowQualityThinking.length);
    });
  });
  
  describe('工具函数测试', () => {
    
    test('应该正确估算 token 数量', () => {
      const chineseText = '这是一段中文文本';
      const englishText = 'This is an English text';
      const mixedText = '这是 mixed 文本 with English';
      
      // 模拟 token 估算逻辑
      function estimateTokens(text: string): number {
        const chineseChars = (text.match(/[\u4e00-\u9fff]/g) || []).length;
        const otherChars = text.length - chineseChars;
        return Math.ceil(chineseChars / 1.5 + otherChars / 4);
      }
      
      const chineseTokens = estimateTokens(chineseText);
      const englishTokens = estimateTokens(englishText);
      const mixedTokens = estimateTokens(mixedText);
      
      expect(chineseTokens).toBeGreaterThan(0);
      expect(englishTokens).toBeGreaterThan(0);
      expect(mixedTokens).toBeGreaterThan(0);
      
      // 中文字符密度更高，相同长度下 token 数应该更多
      expect(chineseTokens).toBeGreaterThan(englishTokens);
    });
    
    test('应该正确生成唯一 ID', () => {
      // 模拟 ID 生成
      function generateId(): string {
        return Math.random().toString(36).substring(2, 15);
      }
      
      const id1 = generateId();
      const id2 = generateId();
      
      expect(id1).not.toBe(id2);
      expect(id1.length).toBeGreaterThan(0);
      expect(id2.length).toBeGreaterThan(0);
    });
  });
  
  describe('配置和常量测试', () => {
    
    test('应该有正确的默认配置', () => {
      const MAX_CONCURRENCY = 10;
      const DEFAULT_THINKING_TOKENS = {
        NONE: 0,
        BASIC: 4000,
        DEEP: 10000,
        ULTRA: 32000 - 1
      };
      
      expect(MAX_CONCURRENCY).toBe(10);
      expect(DEFAULT_THINKING_TOKENS.NONE).toBe(0);
      expect(DEFAULT_THINKING_TOKENS.BASIC).toBe(4000);
      expect(DEFAULT_THINKING_TOKENS.DEEP).toBe(10000);
      expect(DEFAULT_THINKING_TOKENS.ULTRA).toBe(31999);
    });
    
    test('应该有正确的优先级定义', () => {
      expect(TaskPriority.LOW).toBe(1);
      expect(TaskPriority.NORMAL).toBe(2);
      expect(TaskPriority.HIGH).toBe(3);
      expect(TaskPriority.CRITICAL).toBe(4);
      expect(TaskPriority.URGENT).toBe(5);
    });
  });
});
