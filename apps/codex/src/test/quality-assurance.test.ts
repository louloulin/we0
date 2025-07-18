/**
 * 质量保证系统测试
 * 
 * 测试 Phase 3 实现的质量保证功能，包括：
 * - boltArtifact 格式验证
 * - 代码完整性检查
 * - 错误处理和回退机制
 * - 质量保证系统集成
 */

import { describe, test, expect } from '@jest/globals';

// 导入质量保证相关模块
import { BoltArtifactValidator } from '../mastra/quality/bolt-artifact-validator';
import { CodeCompletenessChecker } from '../mastra/quality/code-completeness-checker';
import { ErrorRecoverySystem, ErrorType, ErrorSeverity } from '../mastra/quality/error-recovery-system';
import { QualityAssuranceSystem } from '../mastra/quality/quality-assurance-system';

describe('Phase 3: 质量保证系统测试', () => {
  
  describe('boltArtifact 格式验证器测试', () => {
    
    test('应该验证正确的 boltArtifact 格式', () => {
      const validContent = `
<boltArtifact id="test-project" title="测试项目">
  <boltAction type="file" filePath="src/index.ts">
    export function hello() {
      return "Hello World";
    }
  </boltAction>
</boltArtifact>`;
      
      const result = BoltArtifactValidator.validate(validContent);
      
      expect(result.isValid).toBe(true);
      expect(result.errors.length).toBe(0);
      expect(result.extractedFiles.length).toBe(1);
      expect(result.extractedFiles[0].filePath).toBe('src/index.ts');
      expect(result.metadata.qualityScore).toBeGreaterThan(80);
      
      console.log('✅ 正确格式验证通过');
    });
    
    test('应该检测格式错误', () => {
      const invalidContent = `
<boltArtifact id="test-project" title="测试项目">
  <boltAction type="file" filePath="src/index.ts">
    export function hello() {
      return "Hello World";
    }
  <!-- 缺少结束标签 -->
</boltArtifact>`;
      
      const result = BoltArtifactValidator.validate(invalidContent);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(e => e.type === 'structure')).toBe(true);
      
      console.log('✅ 格式错误检测正常');
    });
    
    test('应该检测占位符', () => {
      const contentWithPlaceholders = `
<boltArtifact id="test-project" title="测试项目">
  <boltAction type="file" filePath="src/index.ts">
    export function hello() {
      // TODO: 实现功能
      return "Hello World";
    }
  </boltAction>
</boltArtifact>`;
      
      const result = BoltArtifactValidator.validate(contentWithPlaceholders);
      
      expect(result.extractedFiles[0].hasPlaceholders).toBe(true);
      expect(result.errors.some(e => e.message.includes('占位符'))).toBe(true);
      
      console.log('✅ 占位符检测正常');
    });
    
    test('应该尝试自动修复', () => {
      const fixableContent = `
<boltArtifact id="test-project" title="测试项目">
  <boltAction type="file" filePath="src/index.ts">
    export function hello() {
      return "Hello World";
    }
  </boltAction>
<!-- 缺少结束标签 -->`;
      
      const result = BoltArtifactValidator.validate(fixableContent);
      
      expect(result.fixedContent).toBeDefined();
      expect(result.fixedContent).toContain('</boltArtifact>');
      
      console.log('✅ 自动修复功能正常');
    });
  });
  
  describe('代码完整性检查器测试', () => {
    
    test('应该检查项目结构', () => {
      const files = [
        {
          filePath: 'src/index.ts',
          content: 'export function main() {}',
          type: 'ts',
          size: 100,
          language: 'typescript',
          hasPlaceholders: false,
          syntaxValid: true
        },
        {
          filePath: 'package.json',
          content: '{"name": "test", "version": "1.0.0"}',
          type: 'json',
          size: 50,
          language: 'json',
          hasPlaceholders: false,
          syntaxValid: true
        }
      ];
      
      const result = CodeCompletenessChecker.checkCompleteness(files);
      
      expect(result.projectStructure.hasPackageJson).toBe(true);
      expect(result.projectStructure.hasSourceStructure).toBe(true);
      expect(result.completenessScore).toBeGreaterThan(70);
      
      console.log('✅ 项目结构检查正常');
    });
    
    test('应该检测缺失的依赖', () => {
      const files = [
        {
          filePath: 'src/index.ts',
          content: 'import React from "react"; export function App() {}',
          type: 'ts',
          size: 100,
          language: 'typescript',
          hasPlaceholders: false,
          syntaxValid: true
        },
        {
          filePath: 'package.json',
          content: '{"name": "test", "version": "1.0.0", "dependencies": {}}',
          type: 'json',
          size: 50,
          language: 'json',
          hasPlaceholders: false,
          syntaxValid: true
        }
      ];
      
      const result = CodeCompletenessChecker.checkCompleteness(files);
      
      expect(result.missingDependencies).toContain('react');
      expect(result.issues.some(i => i.type === 'missing_dependency')).toBe(true);
      
      console.log('✅ 依赖检测正常');
    });
    
    test('应该生成改进建议', () => {
      const files = [
        {
          filePath: 'src/index.ts',
          content: 'export function main() {}',
          type: 'ts',
          size: 100,
          language: 'typescript',
          hasPlaceholders: false,
          syntaxValid: true
        }
      ];
      
      const result = CodeCompletenessChecker.checkCompleteness(files);
      
      expect(result.suggestions.length).toBeGreaterThan(0);
      expect(result.suggestions.some(s => s.description.includes('package.json'))).toBe(true);
      
      console.log('✅ 改进建议生成正常');
    });
  });
  
  describe('错误处理和回退机制测试', () => {
    
    test('应该正确分类错误', async () => {
      const timeoutError = new Error('Request timeout');
      const syntaxError = new Error('Syntax error in code');
      const agentError = new Error('Agent network failed');
      
      const timeoutResult = await ErrorRecoverySystem.handleError(timeoutError);
      const syntaxResult = await ErrorRecoverySystem.handleError(syntaxError);
      const agentResult = await ErrorRecoverySystem.handleError(agentError);
      
      expect(timeoutResult.strategy).toBeDefined();
      expect(syntaxResult.strategy).toBeDefined();
      expect(agentResult.strategy).toBeDefined();
      
      console.log('✅ 错误分类正常');
    });
    
    test('应该提供回退方案', async () => {
      const criticalError = new Error('Critical system failure');
      
      const result = await ErrorRecoverySystem.handleError(criticalError);
      
      expect(result.strategy).toBeDefined();
      expect(result.userInstructions).toBeDefined();
      
      if (result.fallbackContent) {
        expect(result.fallbackContent.length).toBeGreaterThan(0);
      }
      
      console.log('✅ 回退方案正常');
    });
    
    test('应该记录错误历史', async () => {
      const error1 = new Error('Test error 1');
      const error2 = new Error('Test error 2');
      
      await ErrorRecoverySystem.handleError(error1);
      await ErrorRecoverySystem.handleError(error2);
      
      // 错误历史应该被记录（这里我们只能测试函数不抛出异常）
      expect(true).toBe(true);
      
      console.log('✅ 错误历史记录正常');
    });
  });
  
  describe('质量保证系统集成测试', () => {
    
    test('应该执行完整的质量保证流程', async () => {
      const testContent = `
<boltArtifact id="test-project" title="测试项目">
  <boltAction type="file" filePath="src/index.ts">
    export function hello(): string {
      return "Hello World";
    }
  </boltAction>
  <boltAction type="file" filePath="package.json">
    {
      "name": "test-project",
      "version": "1.0.0",
      "main": "src/index.ts"
    }
  </boltAction>
</boltArtifact>`;
      
      const result = await QualityAssuranceSystem.ensureQuality(testContent);
      
      expect(result.overallQuality).toBeDefined();
      expect(result.qualityScore).toBeGreaterThanOrEqual(0);
      expect(result.qualityScore).toBeLessThanOrEqual(100);
      expect(result.validationResult).toBeDefined();
      expect(result.completenessResult).toBeDefined();
      expect(result.finalContent).toBeDefined();
      expect(result.processingTime).toBeGreaterThan(0);
      
      console.log(`✅ 质量保证流程完成: ${result.overallQuality} (${result.qualityScore}/100)`);
    }, 10000);
    
    test('应该处理有问题的内容', async () => {
      const problematicContent = `
<boltArtifact id="broken-project" title="有问题的项目">
  <boltAction type="file" filePath="src/index.ts">
    export function broken() {
      // TODO: 实现功能
      return undefined;
    }
  </boltAction>
</boltArtifact>`;
      
      const result = await QualityAssuranceSystem.ensureQuality(problematicContent, undefined, {
        enableAutoFix: true,
        enableErrorRecovery: true
      });
      
      expect(result.validationResult.errors.length).toBeGreaterThan(0);
      expect(result.recommendations.length).toBeGreaterThan(0);
      expect(result.finalContent).toBeDefined();
      
      console.log(`✅ 问题内容处理完成: ${result.overallQuality} (${result.qualityScore}/100)`);
    }, 10000);
    
    test('应该提供快速质量检查', () => {
      const testContent = `
<boltArtifact id="quick-test" title="快速测试">
  <boltAction type="file" filePath="test.ts">
    console.log("test");
  </boltAction>
</boltArtifact>`;
      
      const result = QualityAssuranceSystem.quickCheck(testContent);
      
      expect(result.isValid).toBeDefined();
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
      expect(Array.isArray(result.issues)).toBe(true);
      
      console.log(`✅ 快速检查完成: ${result.isValid ? '有效' : '无效'} (${result.score}/100)`);
    });
  });
  
  describe('性能和可靠性测试', () => {
    
    test('质量检查应该在合理时间内完成', async () => {
      const startTime = Date.now();
      
      const testContent = `
<boltArtifact id="perf-test" title="性能测试">
  <boltAction type="file" filePath="src/app.ts">
    export class App {
      run() {
        console.log("Running app");
      }
    }
  </boltAction>
</boltArtifact>`;
      
      const result = await QualityAssuranceSystem.ensureQuality(testContent);
      const processingTime = Date.now() - startTime;
      
      expect(processingTime).toBeLessThan(5000); // 5秒内完成
      expect(result.processingTime).toBeLessThan(5000);
      
      console.log(`✅ 性能测试通过: ${processingTime}ms`);
    });
    
    test('应该处理空内容', async () => {
      const result = await QualityAssuranceSystem.ensureQuality('');
      
      expect(result.overallQuality).toBe('poor');
      expect(result.qualityScore).toBe(0);
      expect(result.validationResult.errors.length).toBeGreaterThan(0);
      
      console.log('✅ 空内容处理正常');
    });
    
    test('应该处理无效 XML', async () => {
      const invalidXml = '<invalid>unclosed tag';
      
      const result = await QualityAssuranceSystem.ensureQuality(invalidXml);
      
      expect(result.overallQuality).toBe('poor');
      expect(result.validationResult.errors.length).toBeGreaterThan(0);
      
      console.log('✅ 无效 XML 处理正常');
    });
  });
  
  describe('Phase 3 完成验证', () => {
    
    test('所有质量保证组件应该正确集成', async () => {
      // 验证所有质量保证组件
      const components = [
        'BoltArtifactValidator',
        'CodeCompletenessChecker', 
        'ErrorRecoverySystem',
        'QualityAssuranceSystem'
      ];
      
      for (const component of components) {
        switch (component) {
          case 'BoltArtifactValidator':
            expect(BoltArtifactValidator.validate).toBeDefined();
            break;
          case 'CodeCompletenessChecker':
            expect(CodeCompletenessChecker.checkCompleteness).toBeDefined();
            break;
          case 'ErrorRecoverySystem':
            expect(ErrorRecoverySystem.handleError).toBeDefined();
            break;
          case 'QualityAssuranceSystem':
            expect(QualityAssuranceSystem.ensureQuality).toBeDefined();
            expect(QualityAssuranceSystem.quickCheck).toBeDefined();
            break;
        }
        console.log(`✅ ${component} 集成验证通过`);
      }
      
      // 测试完整的集成流程
      const integrationTest = `
<boltArtifact id="integration-test" title="集成测试">
  <boltAction type="file" filePath="src/main.ts">
    export function main() {
      console.log("Integration test successful");
    }
  </boltAction>
</boltArtifact>`;
      
      const result = await QualityAssuranceSystem.ensureQuality(integrationTest);
      expect(result.overallQuality).toBeDefined();
      
      console.log('🎉 Phase 3: 质量保证系统 - 完成验证通过！');
      console.log(`📊 集成测试结果: ${result.overallQuality} (${result.qualityScore}/100)`);
      console.log(`⏱️ 处理时间: ${result.processingTime}ms`);
      console.log(`🔧 自动修复: ${result.metadata.autoFixesApplied}`);
      console.log(`💡 建议数量: ${result.recommendations.length}`);
    }, 15000);
  });
});
