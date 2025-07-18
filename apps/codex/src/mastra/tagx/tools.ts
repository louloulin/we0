/**
 * TagX工具集成 - 将TagX处理器集成到Mastra工具系统
 * 
 * 提供标准的Mastra工具接口，支持在智能体中调用TagX指令
 */

import { Tool } from '@mastra/core';
import { z } from 'zod';
import { TagXProcessor, createTagXProcessor } from './processor';
import { TagXContext, TagXResult } from './types';

/**
 * TagX工具输入模式
 */
const TagXToolInputSchema = z.object({
  xml: z.string().describe('TagX XML指令字符串'),
  projectPath: z.string().describe('项目路径'),
  userId: z.string().optional().describe('用户ID'),
  sessionId: z.string().describe('会话ID'),
  preferences: z.object({
    defaultLanguage: z.string().default('typescript'),
    codeStyle: z.string().default('standard'),
    testFramework: z.string().default('vitest'),
    deploymentPlatform: z.string().default('vercel'),
    qualityLevel: z.enum(['basic', 'standard', 'strict']).default('standard')
  }).optional().describe('用户偏好设置')
});

/**
 * TagX工具输出模式
 */
const TagXToolOutputSchema = z.object({
  success: z.boolean().describe('执行是否成功'),
  results: z.array(z.object({
    success: z.boolean(),
    tagName: z.string(),
    duration: z.number(),
    output: z.any(),
    files_changed: z.array(z.string()).optional(),
    quality_score: z.number().optional(),
    error: z.string().optional(),
    warnings: z.array(z.string()).optional(),
    next_steps: z.array(z.string()).optional()
  })).describe('执行结果列表'),
  totalDuration: z.number().describe('总执行时间（毫秒）'),
  summary: z.string().describe('执行摘要')
});

/**
 * 创建TagX工具
 */
export function createTagXTool(processor?: TagXProcessor): Tool {
  const tagxProcessor = processor || createTagXProcessor();

  return new Tool({
    id: 'tagx_processor',
    name: 'TagX指令处理器',
    description: `
      TagX指令处理器 - 下一代智能编程助手指令体系
      
      支持的TagX标签：
      - <smart_code_gen>: 智能代码生成
      - <bolt_artifact>: 增强项目生成
      - <agent_workflow>: 多智能体工作流
      - <quality_check>: 代码质量检查
      - <smart_refactor>: 智能重构
      - <batch_file_ops>: 批量文件操作
      - <analyze_project>: 项目分析
      - <generate_tests>: 测试生成
      - <generate_deployment>: 部署配置生成
      - <generate_cicd>: CI/CD流水线生成
      
      特性：
      - 融合多系统优势（MastraCode、we-dev-next、Claude Code、Cursor、Augment Code）
      - 多智能体协作支持
      - 企业级质量保证
      - 高性能解析和执行
      - 完整的错误处理和恢复机制
    `,
    inputSchema: TagXToolInputSchema,
    outputSchema: TagXToolOutputSchema,
    execute: async ({ xml, projectPath, userId, sessionId, preferences }) => {
      const startTime = Date.now();

      try {
        // 构建执行上下文
        const context: TagXContext = {
          projectPath,
          userId,
          sessionId,
          preferences: preferences || {
            defaultLanguage: 'typescript',
            codeStyle: 'standard',
            testFramework: 'vitest',
            deploymentPlatform: 'vercel',
            qualityLevel: 'standard'
          },
          history: []
        };

        // 执行TagX指令
        const results = await tagxProcessor.process(xml, context);
        const totalDuration = Date.now() - startTime;

        // 生成执行摘要
        const summary = generateExecutionSummary(results, totalDuration);

        return {
          success: results.every(r => r.success),
          results,
          totalDuration,
          summary
        };

      } catch (error) {
        const totalDuration = Date.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : '未知错误';

        return {
          success: false,
          results: [{
            success: false,
            tagName: 'error',
            duration: totalDuration,
            output: null,
            error: errorMessage
          }],
          totalDuration,
          summary: `执行失败: ${errorMessage}`
        };
      }
    }
  });
}

/**
 * 创建智能代码生成工具
 */
export function createSmartCodeGenTool(processor?: TagXProcessor): Tool {
  const tagxProcessor = processor || createTagXProcessor();

  return new Tool({
    id: 'smart_code_gen',
    name: '智能代码生成',
    description: '基于TagX的智能代码生成工具，支持多智能体协作和质量保证',
    inputSchema: z.object({
      task: z.string().describe('代码生成任务描述'),
      projectType: z.string().default('react-typescript').describe('项目类型'),
      existingFiles: z.array(z.string()).default([]).describe('现有文件列表'),
      requirements: z.object({
        security: z.enum(['low', 'medium', 'high']).default('medium'),
        accessibility: z.enum(['basic', 'wcag-aa', 'wcag-aaa']).default('basic'),
        testing: z.enum(['basic', 'comprehensive', 'enterprise']).default('basic')
      }).default({}).describe('质量要求'),
      includeTests: z.boolean().default(true).describe('是否包含测试'),
      includeDocs: z.boolean().default(true).describe('是否包含文档'),
      includeTypes: z.boolean().default(true).describe('是否包含类型定义'),
      projectPath: z.string().describe('项目路径'),
      sessionId: z.string().describe('会话ID')
    }),
    outputSchema: TagXToolOutputSchema,
    execute: async ({ 
      task, 
      projectType, 
      existingFiles, 
      requirements, 
      includeTests, 
      includeDocs, 
      includeTypes,
      projectPath,
      sessionId
    }) => {
      // 构建smart_code_gen XML
      const xml = `
        <smart_code_gen>
          <task>${task}</task>
          <context>
            <project_type>${projectType}</project_type>
            <existing_files>
              ${existingFiles.map(file => `<file>${file}</file>`).join('\n')}
            </existing_files>
            <requirements>
              <security>${requirements.security}</security>
              <accessibility>${requirements.accessibility}</accessibility>
              <testing>${requirements.testing}</testing>
            </requirements>
          </context>
          <agents>
            <primary>senior-developer</primary>
            <reviewers>
              <agent>code-reviewer</agent>
              <agent>security-auditor</agent>
            </reviewers>
          </agents>
          <output>
            <include_tests>${includeTests}</include_tests>
            <include_docs>${includeDocs}</include_docs>
            <include_types>${includeTypes}</include_types>
          </output>
        </smart_code_gen>
      `;

      // 使用TagX处理器执行
      const tagxTool = createTagXTool(tagxProcessor);
      return await tagxTool.execute({
        xml,
        projectPath,
        sessionId,
        preferences: {
          defaultLanguage: 'typescript',
          codeStyle: 'standard',
          testFramework: 'vitest',
          deploymentPlatform: 'vercel',
          qualityLevel: 'standard'
        }
      });
    }
  });
}

/**
 * 创建增强boltArtifact工具
 */
export function createBoltArtifactTool(processor?: TagXProcessor): Tool {
  const tagxProcessor = processor || createTagXProcessor();

  return new Tool({
    id: 'bolt_artifact',
    name: '增强项目生成',
    description: '基于TagX的增强boltArtifact项目生成工具，支持WebContainer环境',
    inputSchema: z.object({
      id: z.string().describe('项目ID'),
      title: z.string().describe('项目标题'),
      template: z.string().default('react-typescript').describe('项目模板'),
      features: z.array(z.string()).default([]).describe('项目特性'),
      qualityScore: z.number().min(0).max(1).default(0.9).describe('质量分数'),
      projectPath: z.string().describe('项目路径'),
      sessionId: z.string().describe('会话ID')
    }),
    outputSchema: TagXToolOutputSchema,
    execute: async ({ 
      id, 
      title, 
      template, 
      features, 
      qualityScore,
      projectPath,
      sessionId
    }) => {
      // 构建bolt_artifact XML
      const xml = `
        <bolt_artifact id="${id}" title="${title}">
          <meta>
            <version>2.0</version>
            <agent>code-generator</agent>
            <quality_score>${qualityScore}</quality_score>
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
  "name": "${id}",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "test": "vitest"
  }
}</content>
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
            <bolt_action type="start" priority="3">
              <command>npm run dev</command>
              <health_check>
                <url>http://localhost:3000</url>
                <timeout>30</timeout>
              </health_check>
            </bolt_action>
          </actions>
        </bolt_artifact>
      `;

      // 使用TagX处理器执行
      const tagxTool = createTagXTool(tagxProcessor);
      return await tagxTool.execute({
        xml,
        projectPath,
        sessionId
      });
    }
  });
}

/**
 * 生成执行摘要
 */
function generateExecutionSummary(results: TagXResult[], totalDuration: number): string {
  const successCount = results.filter(r => r.success).length;
  const totalCount = results.length;
  const failureCount = totalCount - successCount;

  let summary = `执行完成: ${successCount}/${totalCount} 成功`;
  
  if (failureCount > 0) {
    summary += `, ${failureCount} 失败`;
  }
  
  summary += `, 总耗时: ${totalDuration}ms`;

  // 添加质量分数信息
  const qualityScores = results
    .filter(r => r.quality_score !== undefined)
    .map(r => r.quality_score!);
  
  if (qualityScores.length > 0) {
    const avgQuality = qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length;
    summary += `, 平均质量分数: ${(avgQuality * 100).toFixed(1)}%`;
  }

  // 添加文件变更信息
  const changedFiles = results
    .filter(r => r.files_changed && r.files_changed.length > 0)
    .flatMap(r => r.files_changed!);
  
  if (changedFiles.length > 0) {
    summary += `, 变更文件: ${changedFiles.length} 个`;
  }

  return summary;
}

/**
 * 默认TagX工具实例
 */
export const defaultTagXTool = createTagXTool();
export const defaultSmartCodeGenTool = createSmartCodeGenTool();
export const defaultBoltArtifactTool = createBoltArtifactTool();
