/**
 * 智能编程 Agent Network - 基于 Mastra vNext 的多智能体协作系统
 * 
 * 设计理念：
 * - 基于 Mastra vNext Agent Network 的非确定性编排
 * - 参考 MetaGPT 的多智能体协作模式
 * - 实现类似 Cursor/Augment Code 的智能编程体验
 * - 支持智能任务路由和动态协作
 * 
 * 核心功能：
 * 1. 智能任务路由：根据任务复杂度自动选择最适合的处理方式
 * 2. 专业角色协作：5个专业角色分工协作，模拟真实开发团队
 * 3. 质量保证体系：多层验证确保代码质量和完整性
 * 4. 上下文感知：Memory 系统记住项目历史和用户偏好
 */

import { NewAgentNetwork } from '@mastra/core/network/vNext';
import { RuntimeContext } from '@mastra/core/runtime-context';
import { Memory } from '@mastra/memory';
import { LibSQLStore } from '@mastra/libsql';
import { deepseek } from '../models/deepseek';

// 导入专业角色 Agents
import { 
  requirementsAnalystAgent,
  systemArchitectAgent, 
  seniorDeveloperAgent,
  codeReviewerAgent,
  documentationSpecialistAgent 
} from '../agents/professional-agents';

// 导入现有工具
import {
  parseArtifactTool,
  processMessagesTool,
  analyzeFileStructureTool,
  validateFilesTool,
  filterFilesTool,
  summarizeFilesTool,
} from '../tools/file-processing-tool';

import {
  codeGeneratorTool,
  codeAnalysisTool,
  projectStructureTool,
} from '../tools/code-generator-tool';

import {
  documentationTool,
} from '../tools/documentation-tool';

import {
  detectLanguageTool,
  formatCodeTool,
  analyzeCodeComplexityTool,
  validateJsonSchemaTool,
  generateIdTool,
} from '../tools/utility-functions-tool';

/**
 * 创建智能编程 Agent Network 的内存系统
 */
const createIntelligentCodingMemory = () => new Memory({
  storage: new LibSQLStore({
    url: process.env.DATABASE_URL || 'file:./intelligent-coding-network.db',
  }),
});

/**
 * 智能编程 Agent Network
 * 
 * 基于 Mastra vNext 的多智能体协作系统，实现智能编程助手功能
 * 
 * 特性：
 * - 智能路由：根据任务复杂度和类型自动选择最适合的 Agent
 * - 专业协作：5个专业角色分工协作，确保高质量输出
 * - 上下文感知：Memory 系统支持项目历史和用户偏好记忆
 * - 质量保证：多层验证和审查机制
 * - 流式响应：支持实时流式输出，提供流畅的用户体验
 */
export const intelligentCodingAgentNetwork = new NewAgentNetwork({
  id: 'intelligent-coding-network',
  name: 'Intelligent Coding Assistant Network',
  instructions: `
    你是一个智能编程助手网络，类似于 Cursor、Augment Code 和 Claude Code 的专业级编程助手。
    
    ## 核心使命
    通过多智能体协作，为用户提供高质量、完整、生产就绪的代码解决方案。
    
    ## 智能任务路由策略
    
    ### 简单任务 (直接路由到 Senior Developer)
    - 单文件修改或创建
    - 简单的组件实现
    - 工具函数编写
    - 样式调整
    - Bug 修复
    
    ### 复杂项目 (完整工作流协作)
    - 多文件项目生成
    - 完整应用开发
    - 系统架构设计
    - 大型重构
    
    工作流：Requirements Analyst → System Architect → Senior Developer → Code Reviewer
    
    ### 专项任务 (专门 Agent 处理)
    - 代码审查 → Code Reviewer
    - 文档生成 → Documentation Specialist
    - 架构咨询 → System Architect
    - 需求分析 → Requirements Analyst
    
    ## 关键输出要求
    
    ### 必须使用 boltArtifact XML 格式
    所有代码生成都必须使用标准的 boltArtifact 格式：
    
    <boltArtifact id="unique-id" title="项目标题">
      <boltAction type="file" filePath="src/App.tsx">
        // 完整的文件内容 - 绝不使用占位符
        import React from 'react';
        
        const App: React.FC = () => {
          return <div>Hello World</div>;
        };
        
        export default App;
      </boltAction>
      <boltAction type="file" filePath="src/styles.css">
        .app {
          padding: 20px;
        }
      </boltAction>
    </boltArtifact>
    
    ### 质量标准
    1. **完整性**：生成完整可运行的代码，无占位符
    2. **类型安全**：使用 TypeScript 确保类型安全
    3. **最佳实践**：遵循行业最佳实践和编码规范
    4. **错误处理**：实现适当的错误处理机制
    5. **性能优化**：考虑性能影响和优化机会
    6. **可维护性**：代码结构清晰，易于维护
    7. **文档完整**：提供必要的注释和文档
    
    ## 协作机制
    
    ### Memory 驱动的上下文管理
    - 记住用户的编程偏好和习惯
    - 保持项目历史和演进记录
    - 学习用户反馈，持续优化输出质量
    
    ### 智能决策
    - 基于任务描述和上下文自动选择最优处理策略
    - 动态调整协作流程，确保效率和质量
    - 实时评估输出质量，必要时进行迭代优化
    
    ### 质量保证
    - 多 Agent 协作确保代码完整性
    - 自动化代码审查和质量检查
    - 持续的改进建议和优化方案
    
    ## 用户体验目标
    - 提供类似 Cursor 的流畅编程体验
    - 确保代码质量达到 Augment Code 的专业水准
    - 实现 Claude Code 级别的智能理解和响应
    - 支持从简单修改到复杂项目的全覆盖
  `,
  model: deepseek('deepseek-chat'),
  
  agents: {
    requirementsAnalyst: requirementsAnalystAgent,
    systemArchitect: systemArchitectAgent,
    seniorDeveloper: seniorDeveloperAgent,
    codeReviewer: codeReviewerAgent,
    documentationSpecialist: documentationSpecialistAgent,
  },
  
  tools: {
    // 文件处理工具
    parseArtifactTool,
    processMessagesTool,
    analyzeFileStructureTool,
    validateFilesTool,
    filterFilesTool,
    summarizeFilesTool,
    
    // 代码生成和分析工具
    codeGeneratorTool,
    codeAnalysisTool,
    projectStructureTool,
    formatCodeTool,
    analyzeCodeComplexityTool,
    
    // 文档工具
    documentationTool,
    
    // 实用工具
    detectLanguageTool,
    generateIdTool,
    validateJsonSchemaTool,
  },
  
  memory: createIntelligentCodingMemory(),
});

/**
 * 任务路由辅助函数
 * 
 * 分析用户输入，确定任务类型和复杂度，为智能路由提供决策依据
 */
export function analyzeTaskComplexity(userInput: string, fileContext?: any): {
  complexity: 'simple' | 'medium' | 'complex';
  taskType: 'code_generation' | 'code_review' | 'documentation' | 'architecture' | 'analysis';
  recommendedAgent: string;
  requiresFullWorkflow: boolean;
} {
  const input = userInput.toLowerCase();
  const hasMultipleFiles = fileContext && Object.keys(fileContext).length > 3;
  
  // 检测任务类型
  let taskType: 'code_generation' | 'code_review' | 'documentation' | 'architecture' | 'analysis' = 'code_generation';
  
  if (input.includes('review') || input.includes('审查') || input.includes('检查')) {
    taskType = 'code_review';
  } else if (input.includes('document') || input.includes('文档') || input.includes('readme')) {
    taskType = 'documentation';
  } else if (input.includes('architect') || input.includes('架构') || input.includes('设计')) {
    taskType = 'architecture';
  } else if (input.includes('analyze') || input.includes('分析') || input.includes('需求')) {
    taskType = 'analysis';
  }
  
  // 评估复杂度
  let complexity: 'simple' | 'medium' | 'complex' = 'simple';
  
  const complexityIndicators = [
    'app', 'application', '应用', '系统', 'system',
    'multiple', '多个', '完整', 'complete', 'full',
    'project', '项目', 'website', '网站'
  ];
  
  const mediumIndicators = [
    'component', '组件', 'page', '页面', 'feature', '功能'
  ];
  
  if (complexityIndicators.some(indicator => input.includes(indicator)) || hasMultipleFiles) {
    complexity = 'complex';
  } else if (mediumIndicators.some(indicator => input.includes(indicator))) {
    complexity = 'medium';
  }
  
  // 推荐 Agent 和工作流
  let recommendedAgent = 'seniorDeveloper';
  let requiresFullWorkflow = false;
  
  switch (taskType) {
    case 'code_review':
      recommendedAgent = 'codeReviewer';
      break;
    case 'documentation':
      recommendedAgent = 'documentationSpecialist';
      break;
    case 'architecture':
      recommendedAgent = 'systemArchitect';
      break;
    case 'analysis':
      recommendedAgent = 'requirementsAnalyst';
      break;
    case 'code_generation':
      if (complexity === 'complex') {
        requiresFullWorkflow = true;
        recommendedAgent = 'requirementsAnalyst'; // 开始完整工作流
      } else {
        recommendedAgent = 'seniorDeveloper'; // 直接代码生成
      }
      break;
  }
  
  return {
    complexity,
    taskType,
    recommendedAgent,
    requiresFullWorkflow
  };
}
