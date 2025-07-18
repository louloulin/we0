/**
 * TagX指令体系类型定义
 * 
 * 定义所有TagX标签的TypeScript类型，确保类型安全和IDE支持
 */

import { z } from 'zod';

// 基础TagX标签接口
export interface BaseTagXElement {
  tagName: string;
  attributes: Record<string, string>;
  children: TagXElement[];
  textContent?: string;
}

// TagX元素联合类型
export type TagXElement = 
  | SmartCodeGenElement
  | BoltArtifactElement
  | AgentWorkflowElement
  | QualityCheckElement
  | SmartRefactorElement
  | BatchFileOpsElement
  | AnalyzeProjectElement
  | GenerateProjectElement
  | GenerateTestsElement
  | GenerateDeploymentElement
  | GenerateCicdElement;

// 智能代码生成标签
export interface SmartCodeGenElement extends BaseTagXElement {
  tagName: 'smart_code_gen';
  task: string;
  context: {
    project_type: string;
    existing_files: string[];
    requirements: {
      security: 'low' | 'medium' | 'high';
      accessibility: 'basic' | 'wcag-aa' | 'wcag-aaa';
      testing: 'basic' | 'comprehensive' | 'enterprise';
    };
  };
  agents: {
    primary: string;
    reviewers: string[];
  };
  output: {
    include_tests: boolean;
    include_docs: boolean;
    include_types: boolean;
  };
}

// 增强boltArtifact标签
export interface BoltArtifactElement extends BaseTagXElement {
  tagName: 'bolt_artifact';
  id: string;
  title: string;
  meta: {
    version: string;
    agent: string;
    quality_score: number;
  };
  environment: {
    type: 'webcontainer' | 'local' | 'docker';
    constraints: {
      no_native_binaries?: boolean;
      python_stdlib_only?: boolean;
      prefer_vite?: boolean;
    };
  };
  actions: BoltAction[];
}

export interface BoltAction {
  type: 'file' | 'shell' | 'start';
  path?: string;
  priority: number;
  content?: string;
  command?: string;
  validation?: {
    syntax_check?: boolean;
    dependency_check?: boolean;
    type_check?: boolean;
    lint_check?: boolean;
    test_impact?: 'none' | 'minimal' | 'moderate' | 'significant';
  };
  retry_on_failure?: boolean;
  timeout?: number;
  health_check?: {
    url?: string;
    timeout?: number;
  };
}

// 多智能体工作流标签
export interface AgentWorkflowElement extends BaseTagXElement {
  tagName: 'agent_workflow';
  task: string;
  workflow: WorkflowStage[];
  quality_gates: QualityGate[];
}

export interface WorkflowStage {
  name: string;
  agent: string;
  depends_on?: string;
  input: string;
  output: string;
  duration: string;
  parallel?: SubTask[];
}

export interface SubTask {
  agent: string;
  description: string;
}

export interface QualityGate {
  stage: string;
  criteria: string[];
}

// 质量检查标签
export interface QualityCheckElement extends BaseTagXElement {
  tagName: 'quality_check';
  scope: {
    files: {
      pattern: string;
      exclude?: string;
    };
  };
  checks: {
    static_analysis: {
      tool: string[];
      custom_rules?: string;
    };
    security: {
      tool: string[];
      custom_rules?: string;
    };
    performance: {
      bundle_analysis?: boolean;
      memory_leaks?: boolean;
      async_patterns?: boolean;
    };
    accessibility?: {
      tool: string;
      standard: string;
    };
  };
  thresholds: {
    code_coverage: string;
    security_score: string;
    performance_score: string;
    maintainability_index: number;
  };
  agent: string;
}

// 智能重构标签
export interface SmartRefactorElement extends BaseTagXElement {
  tagName: 'smart_refactor';
  target: {
    files: string[];
  };
  goals: {
    performance?: boolean;
    maintainability?: boolean;
    type_safety?: boolean;
  };
  constraints: {
    preserve_api?: boolean;
    maintain_tests?: boolean;
    backward_compatible?: boolean;
  };
  agent: string;
}

// 批量文件操作标签
export interface BatchFileOpsElement extends BaseTagXElement {
  tagName: 'batch_file_ops';
  transaction: boolean;
  operations: FileOperation[];
  validation: {
    syntax_check?: boolean;
    type_check?: boolean;
    test_run?: boolean;
  };
}

export interface FileOperation {
  type: 'create' | 'modify' | 'delete' | 'test';
  priority: number;
  depends_on?: number;
  path: string;
  content?: string;
  action?: string;
  import?: string;
  template?: string;
  generate_tests?: boolean;
  coverage_target?: string;
}

// 项目分析标签
export interface AnalyzeProjectElement extends BaseTagXElement {
  tagName: 'analyze_project';
  scope: 'full' | 'partial' | 'specific';
  focus: {
    architecture?: boolean;
    dependencies?: boolean;
    quality?: boolean;
    security?: boolean;
    performance?: boolean;
  };
  output_format: 'structured' | 'summary' | 'detailed';
}

// 项目生成标签
export interface GenerateProjectElement extends BaseTagXElement {
  tagName: 'generate_project';
  template: string;
  name: string;
  features: string[];
  tech_stack: {
    frontend: string;
    backend: string;
    database: string;
    deployment: string;
  };
  quality_level: 'prototype' | 'development' | 'production';
}

// 测试生成标签
export interface GenerateTestsElement extends BaseTagXElement {
  tagName: 'generate_tests';
  target: {
    files: string[];
  };
  test_types: {
    unit_tests?: {
      framework: string;
      coverage_target: string;
      include_edge_cases: boolean;
    };
    integration_tests?: {
      framework: string;
      scenarios: string[];
    };
    performance_tests?: {
      framework: string;
      load_patterns: string[];
    };
  };
  mocking: {
    external_apis?: boolean;
    database?: boolean;
    file_system?: boolean;
  };
  agent: string;
}

// 部署配置生成标签
export interface GenerateDeploymentElement extends BaseTagXElement {
  tagName: 'generate_deployment';
  target_platform: 'vercel' | 'netlify' | 'aws' | 'docker';
  environment: 'development' | 'staging' | 'production';
  configuration: {
    build_command: string;
    output_directory: string;
    node_version: string;
    environment_variables: EnvironmentVariable[];
  };
  optimizations: {
    compression?: boolean;
    caching?: 'none' | 'basic' | 'aggressive';
    cdn?: boolean;
    monitoring?: boolean;
  };
  security: {
    https_only?: boolean;
    security_headers?: boolean;
    rate_limiting?: boolean;
  };
  agent: string;
}

export interface EnvironmentVariable {
  name: string;
  value: string;
  secret: boolean;
}

// CI/CD流水线生成标签
export interface GenerateCicdElement extends BaseTagXElement {
  tagName: 'generate_cicd';
  platform: 'github-actions' | 'gitlab-ci' | 'jenkins';
  triggers: {
    push?: {
      branches: string[];
    };
    pull_request?: {
      target_branches: string[];
    };
  };
  stages: CicdStage[];
  notifications?: {
    slack?: {
      webhook: string;
      on_failure: boolean;
      on_success: boolean;
    };
  };
  agent: string;
}

export interface CicdStage {
  name: string;
  depends_on?: string;
  condition?: string;
  jobs: CicdJob[];
}

export interface CicdJob {
  name: string;
  commands: string[];
  artifacts?: string[];
  services?: string[];
  environment?: string;
}

// TagX执行上下文
export interface TagXContext {
  projectPath: string;
  userId?: string;
  sessionId: string;
  preferences: UserPreferences;
  history: TagXExecutionHistory[];
}

export interface UserPreferences {
  defaultLanguage: string;
  codeStyle: string;
  testFramework: string;
  deploymentPlatform: string;
  qualityLevel: 'basic' | 'standard' | 'strict';
}

export interface TagXExecutionHistory {
  timestamp: Date;
  tagName: string;
  success: boolean;
  duration: number;
  error?: string;
}

// TagX执行结果
export interface TagXResult {
  success: boolean;
  tagName: string;
  duration: number;
  output: any;
  files_changed?: string[];
  quality_score?: number;
  error?: string;
  warnings?: string[];
  next_steps?: string[];
}

// Zod验证模式
export const SmartCodeGenSchema = z.object({
  task: z.string(),
  context: z.object({
    project_type: z.string(),
    existing_files: z.array(z.string()),
    requirements: z.object({
      security: z.enum(['low', 'medium', 'high']),
      accessibility: z.enum(['basic', 'wcag-aa', 'wcag-aaa']),
      testing: z.enum(['basic', 'comprehensive', 'enterprise'])
    })
  }),
  agents: z.object({
    primary: z.string(),
    reviewers: z.array(z.string())
  }),
  output: z.object({
    include_tests: z.boolean(),
    include_docs: z.boolean(),
    include_types: z.boolean()
  })
});

export const BoltArtifactSchema = z.object({
  id: z.string(),
  title: z.string(),
  meta: z.object({
    version: z.string(),
    agent: z.string(),
    quality_score: z.number().min(0).max(1)
  }),
  environment: z.object({
    type: z.enum(['webcontainer', 'local', 'docker']),
    constraints: z.object({
      no_native_binaries: z.boolean().optional(),
      python_stdlib_only: z.boolean().optional(),
      prefer_vite: z.boolean().optional()
    })
  }),
  actions: z.array(z.object({
    type: z.enum(['file', 'shell', 'start']),
    path: z.string().optional(),
    priority: z.number(),
    content: z.string().optional(),
    command: z.string().optional(),
    validation: z.object({
      syntax_check: z.boolean().optional(),
      dependency_check: z.boolean().optional(),
      type_check: z.boolean().optional(),
      lint_check: z.boolean().optional(),
      test_impact: z.enum(['none', 'minimal', 'moderate', 'significant']).optional()
    }).optional(),
    retry_on_failure: z.boolean().optional(),
    timeout: z.number().optional(),
    health_check: z.object({
      url: z.string().optional(),
      timeout: z.number().optional()
    }).optional()
  }))
});

export const AgentWorkflowSchema = z.object({
  task: z.string(),
  workflow: z.array(z.object({
    name: z.string(),
    agent: z.string(),
    depends_on: z.string().optional(),
    input: z.string(),
    output: z.string(),
    duration: z.string(),
    parallel: z.array(z.object({
      agent: z.string(),
      description: z.string()
    })).optional()
  })),
  quality_gates: z.array(z.object({
    stage: z.string(),
    criteria: z.array(z.string())
  }))
});
