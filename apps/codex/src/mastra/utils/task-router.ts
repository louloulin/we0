/**
 * 任务路由器 - 智能任务分析和路由逻辑
 * 
 * 基于用户输入和项目上下文，智能分析任务类型和复杂度，
 * 为 Agent Network 提供最优的路由决策。
 * 
 * 设计理念：
 * - 智能分析：基于自然语言理解和上下文分析
 * - 动态路由：根据任务特点选择最适合的处理方式
 * - 效率优化：避免不必要的复杂流程，提高响应速度
 * - 质量保证：确保复杂任务得到充分的协作处理
 */

import { RuntimeContext } from '@mastra/core/runtime-context';

/**
 * 任务类型定义
 */
export type TaskType = 
  | 'code_generation'     // 代码生成
  | 'code_review'         // 代码审查
  | 'documentation'       // 文档生成
  | 'architecture'        // 架构设计
  | 'requirements'        // 需求分析
  | 'debugging'           // 调试修复
  | 'refactoring'         // 代码重构
  | 'testing'             // 测试相关
  | 'optimization';       // 性能优化

/**
 * 复杂度级别定义
 */
export type ComplexityLevel = 'simple' | 'medium' | 'complex';

/**
 * 项目类型定义
 */
export type ProjectType = 
  | 'web_app'             // Web 应用
  | 'mobile_app'          // 移动应用
  | 'api_service'         // API 服务
  | 'desktop_app'         // 桌面应用
  | 'library'             // 库/包
  | 'component'           // 组件
  | 'utility'             // 工具函数
  | 'configuration'       // 配置文件
  | 'documentation'       // 文档
  | 'other';              // 其他

/**
 * 任务分析结果
 */
export interface TaskAnalysis {
  taskType: TaskType;
  complexity: ComplexityLevel;
  projectType: ProjectType;
  recommendedAgent: string;
  requiresFullWorkflow: boolean;
  estimatedFiles: number;
  confidence: number;
  reasoning: string;
  suggestedApproach: string;
}

/**
 * 文件上下文信息
 */
export interface FileContext {
  [filePath: string]: {
    content: string;
    size: number;
    type: string;
  };
}

/**
 * 智能任务路由器
 * 
 * 分析用户输入和项目上下文，提供智能的任务路由建议
 */
export class IntelligentTaskRouter {
  
  /**
   * 分析任务并提供路由建议
   */
  static analyzeTask(
    userInput: string, 
    fileContext?: FileContext,
    runtimeContext?: RuntimeContext
  ): TaskAnalysis {
    
    const input = userInput.toLowerCase().trim();
    
    // 1. 分析任务类型
    const taskType = this.detectTaskType(input);
    
    // 2. 分析项目类型
    const projectType = this.detectProjectType(input, fileContext);
    
    // 3. 评估复杂度
    const complexity = this.assessComplexity(input, fileContext, taskType);
    
    // 4. 推荐处理策略
    const { recommendedAgent, requiresFullWorkflow, suggestedApproach } = 
      this.recommendStrategy(taskType, complexity, projectType);
    
    // 5. 估算文件数量
    const estimatedFiles = this.estimateFileCount(input, projectType, complexity);
    
    // 6. 计算置信度
    const confidence = this.calculateConfidence(input, taskType, projectType);
    
    // 7. 生成推理说明
    const reasoning = this.generateReasoning(taskType, complexity, projectType, recommendedAgent);
    
    return {
      taskType,
      complexity,
      projectType,
      recommendedAgent,
      requiresFullWorkflow,
      estimatedFiles,
      confidence,
      reasoning,
      suggestedApproach
    };
  }
  
  /**
   * 检测任务类型
   */
  private static detectTaskType(input: string): TaskType {
    const taskPatterns: Record<TaskType, string[]> = {
      code_review: [
        'review', 'check', 'audit', 'inspect', 'validate',
        '审查', '检查', '验证', '审核', '评估'
      ],
      documentation: [
        'document', 'readme', 'docs', 'guide', 'manual', 'help',
        '文档', '说明', '指南', '手册', '帮助'
      ],
      architecture: [
        'architect', 'design', 'structure', 'pattern', 'framework',
        '架构', '设计', '结构', '模式', '框架'
      ],
      requirements: [
        'requirement', 'spec', 'analysis', 'plan', 'scope',
        '需求', '规格', '分析', '计划', '范围'
      ],
      debugging: [
        'debug', 'fix', 'bug', 'error', 'issue', 'problem',
        '调试', '修复', '错误', '问题', '故障'
      ],
      refactoring: [
        'refactor', 'restructure', 'reorganize', 'improve', 'optimize',
        '重构', '重组', '改进', '优化', '整理'
      ],
      testing: [
        'test', 'unit test', 'integration test', 'e2e', 'spec',
        '测试', '单元测试', '集成测试', '端到端'
      ],
      optimization: [
        'optimize', 'performance', 'speed', 'efficiency', 'memory',
        '优化', '性能', '速度', '效率', '内存'
      ],
      code_generation: [
        'create', 'build', 'generate', 'implement', 'develop', 'write',
        '创建', '构建', '生成', '实现', '开发', '编写'
      ]
    };
    
    for (const [type, patterns] of Object.entries(taskPatterns)) {
      if (patterns.some(pattern => input.includes(pattern))) {
        return type as TaskType;
      }
    }
    
    return 'code_generation'; // 默认为代码生成
  }
  
  /**
   * 检测项目类型
   */
  private static detectProjectType(input: string, fileContext?: FileContext): ProjectType {
    // 基于文件扩展名分析
    if (fileContext) {
      const files = Object.keys(fileContext);
      const extensions = files.map(f => f.split('.').pop()?.toLowerCase()).filter(Boolean);
      
      if (extensions.includes('tsx') || extensions.includes('jsx')) {
        return input.includes('mobile') || input.includes('react native') ? 'mobile_app' : 'web_app';
      }
      if (extensions.includes('swift') || extensions.includes('kt')) {
        return 'mobile_app';
      }
      if (extensions.includes('py') && input.includes('api')) {
        return 'api_service';
      }
    }
    
    // 基于关键词分析
    const projectPatterns: Record<ProjectType, string[]> = {
      web_app: ['website', 'web app', 'react', 'vue', 'angular', '网站', '网页应用'],
      mobile_app: ['mobile', 'ios', 'android', 'react native', '移动应用', '手机应用'],
      api_service: ['api', 'service', 'backend', 'server', 'endpoint', '接口', '服务'],
      desktop_app: ['desktop', 'electron', 'tauri', '桌面应用'],
      library: ['library', 'package', 'npm', 'module', '库', '包', '模块'],
      component: ['component', 'widget', 'element', '组件', '控件'],
      utility: ['utility', 'helper', 'tool', 'function', '工具', '函数', '辅助'],
      configuration: ['config', 'setting', 'env', 'setup', '配置', '设置'],
      documentation: ['readme', 'docs', 'guide', '文档', '说明'],
      other: ['other', 'misc', 'general', '其他', '通用']
    };
    
    for (const [type, patterns] of Object.entries(projectPatterns)) {
      if (patterns.some(pattern => input.includes(pattern))) {
        return type as ProjectType;
      }
    }
    
    return 'other';
  }
  
  /**
   * 评估任务复杂度
   */
  private static assessComplexity(
    input: string, 
    fileContext?: FileContext, 
    taskType?: TaskType
  ): ComplexityLevel {
    let complexityScore = 0;
    
    // 基于关键词评分
    const complexityIndicators = {
      complex: [
        'application', 'system', 'platform', 'full', 'complete', 'entire',
        'multiple', 'many', 'several', 'various', 'different',
        '应用', '系统', '平台', '完整', '全部', '多个', '各种'
      ],
      medium: [
        'feature', 'module', 'page', 'screen', 'section',
        '功能', '模块', '页面', '屏幕', '部分'
      ],
      simple: [
        'function', 'component', 'utility', 'helper', 'small',
        '函数', '组件', '工具', '辅助', '小'
      ]
    };
    
    if (complexityIndicators.complex.some(word => input.includes(word))) {
      complexityScore += 3;
    }
    if (complexityIndicators.medium.some(word => input.includes(word))) {
      complexityScore += 2;
    }
    if (complexityIndicators.simple.some(word => input.includes(word))) {
      complexityScore += 1;
    }
    
    // 基于文件数量评分
    if (fileContext) {
      const fileCount = Object.keys(fileContext).length;
      if (fileCount > 10) complexityScore += 3;
      else if (fileCount > 5) complexityScore += 2;
      else if (fileCount > 1) complexityScore += 1;
    }
    
    // 基于任务类型调整
    if (taskType === 'architecture' || taskType === 'requirements') {
      complexityScore += 2;
    }
    
    // 基于输入长度评分
    if (input.length > 200) complexityScore += 2;
    else if (input.length > 100) complexityScore += 1;
    
    // 转换为复杂度级别
    if (complexityScore >= 6) return 'complex';
    if (complexityScore >= 3) return 'medium';
    return 'simple';
  }
  
  /**
   * 推荐处理策略
   */
  private static recommendStrategy(
    taskType: TaskType, 
    complexity: ComplexityLevel, 
    projectType: ProjectType
  ): {
    recommendedAgent: string;
    requiresFullWorkflow: boolean;
    suggestedApproach: string;
  } {
    
    // 专项任务直接路由到专门 Agent
    const specializedTasks: Record<string, string> = {
      code_review: 'codeReviewer',
      documentation: 'documentationSpecialist',
      architecture: 'systemArchitect',
      requirements: 'requirementsAnalyst'
    };
    
    if (specializedTasks[taskType]) {
      return {
        recommendedAgent: specializedTasks[taskType],
        requiresFullWorkflow: false,
        suggestedApproach: `直接使用专门的 ${specializedTasks[taskType]} 处理 ${taskType} 任务`
      };
    }
    
    // 代码生成任务根据复杂度决策
    if (taskType === 'code_generation') {
      if (complexity === 'complex' || projectType === 'web_app' || projectType === 'mobile_app') {
        return {
          recommendedAgent: 'requirementsAnalyst',
          requiresFullWorkflow: true,
          suggestedApproach: '使用完整工作流：需求分析 → 架构设计 → 代码实现 → 质量审查'
        };
      } else {
        return {
          recommendedAgent: 'seniorDeveloper',
          requiresFullWorkflow: false,
          suggestedApproach: '直接使用高级开发工程师进行代码实现'
        };
      }
    }
    
    // 其他任务默认使用高级开发工程师
    return {
      recommendedAgent: 'seniorDeveloper',
      requiresFullWorkflow: false,
      suggestedApproach: '使用高级开发工程师处理通用任务'
    };
  }
  
  /**
   * 估算文件数量
   */
  private static estimateFileCount(
    input: string, 
    projectType: ProjectType, 
    complexity: ComplexityLevel
  ): number {
    const baseCount: Record<ProjectType, number> = {
      web_app: 8,
      mobile_app: 10,
      api_service: 6,
      desktop_app: 8,
      library: 4,
      component: 2,
      utility: 1,
      configuration: 1,
      documentation: 1,
      other: 3
    };
    
    const multiplier: Record<ComplexityLevel, number> = {
      simple: 0.5,
      medium: 1,
      complex: 2
    };
    
    return Math.ceil(baseCount[projectType] * multiplier[complexity]);
  }
  
  /**
   * 计算分析置信度
   */
  private static calculateConfidence(
    input: string, 
    taskType: TaskType, 
    projectType: ProjectType
  ): number {
    let confidence = 0.7; // 基础置信度
    
    // 输入越详细，置信度越高
    if (input.length > 100) confidence += 0.1;
    if (input.length > 200) confidence += 0.1;
    
    // 包含明确关键词提高置信度
    const explicitKeywords = ['create', 'build', 'implement', 'develop', '创建', '构建', '实现'];
    if (explicitKeywords.some(keyword => input.includes(keyword))) {
      confidence += 0.1;
    }
    
    return Math.min(confidence, 0.95);
  }
  
  /**
   * 生成推理说明
   */
  private static generateReasoning(
    taskType: TaskType, 
    complexity: ComplexityLevel, 
    projectType: ProjectType, 
    recommendedAgent: string
  ): string {
    return `基于输入分析，识别为 ${taskType} 类型的 ${complexity} 复杂度 ${projectType} 项目。推荐使用 ${recommendedAgent} 进行处理，以确保最佳的输出质量和效率。`;
  }
}
