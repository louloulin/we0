# We0 AI 基于 Mastra 框架重构计划

## 🎉 最新进展 - DeepSeek LLM Provider 实现完成

**实现时间：** 2025-01-16
**状态：** ✅ 已完成并通过测试

### 已实现功能

1. **DeepSeek 模型集成**
   - 使用 `@ai-sdk/openai-compatible` 实现 DeepSeek API 集成
   - 支持 `deepseek-chat` 和 `deepseek-coder` 模型
   - 完整的环境变量配置支持

2. **智能代理 (Agents)**
   - `deepseekAgent`: 通用开发助手，专注于软件开发和技术问题解决
   - `deepseekCoderAgent`: 专业编程助手，专注于代码生成和分析

3. **专业工具集 (Tools)**
   - 代码生成工具：支持函数、类、组件、API、测试等多种代码生成
   - 代码分析工具：质量、性能、安全性、可维护性分析
   - 项目结构工具：完整项目脚手架生成
   - 文档工具：API文档、README、代码注释自动生成

4. **测试验证**
   - 完整的集成测试套件
   - 基本功能验证脚本
   - 环境配置检查工具

### 文件结构
```
apps/codex/src/mastra/
├── models/deepseek.ts          # DeepSeek 模型配置
├── agents/deepseek-agent.ts    # DeepSeek 智能代理
├── tools/
│   ├── code-generator-tool.ts  # 代码生成工具
│   └── documentation-tool.ts   # 文档生成工具
├── workflows/                  # 工作流 (待完善)
└── index.ts                   # 主配置文件
```

### 使用方法
1. 配置环境变量：`DEEPSEEK_API_KEY=your-api-key`
2. 启动开发服务器：`pnpm run dev`
3. 在 Mastra 界面中使用 DeepSeek 代理

---

## 📋 项目概述

### 当前架构分析

基于对 `apps/we-dev-next` 的代码分析，当前项目具有以下特点：

**现有功能模块：**

- 🤖 AI 聊天系统（支持多模型：Claude、GPT、DeepSeek）
- 🛠️ 代码生成工具（Builder 模式）
- 🌐 多语言支持（i18n）
- 📊 Token 管理系统
- 🔧 工具系统（Tools/MCP 支持）
- 💾 数据库配置（MySQL、Redis）
- 🚀 部署功能
- 📝 文档系统（MDX）

**技术栈：**

- Next.js 14 + TypeScript
- Vercel AI SDK
- 流式响应处理
- Ant Design + Tailwind CSS
- MongoDB/MySQL 数据库支持

## 🎯 重构目标

### 为什么选择 Mastra？

1. **TypeScript 原生支持** - 与现有技术栈完美契合
2. **统一的 AI 模型接口** - 简化多模型管理
3. **内置工作流引擎** - 支持复杂的代码生成流程
4. **Agent 系统** - 提供更智能的交互体验
5. **RAG 支持** - 增强知识检索能力
6. **内置观测性** - 更好的调试和监控
7. **云部署支持** - 简化部署流程

## 🏗️ 整体设计架构

### 核心架构图

```
┌─────────────────────────────────────────────────────────────┐
│                    Mastra Application                       │
├─────────────────────────────────────────────────────────────┤
│  Frontend (Next.js)                                        │
│  ├── Chat Interface                                        │
│  ├── Code Builder                                          │
│  ├── Project Manager                                       │
│  └── Settings & Config                                     │
├─────────────────────────────────────────────────────────────┤
│  Mastra Core Layer                                         │
│  ├── Agent Network                                         │
│  │   ├── Code Generation Agent                             │
│  │   ├── Chat Assistant Agent                              │
│  │   ├── Project Analysis Agent                            │
│  │   └── Deployment Agent                                  │
│  ├── Workflow Engine                                       │
│  │   ├── Code Generation Workflow                          │
│  │   ├── Project Build Workflow                            │
│  │   └── Deployment Workflow                               │
│  ├── Tools & MCP                                           │
│  │   ├── File System Tools                                 │
│  │   ├── Database Tools                                    │
│  │   ├── Git Tools                                         │
│  │   └── Deployment Tools                                  │
│  ├── Memory & RAG                                          │
│  │   ├── Conversation Memory                               │
│  │   ├── Project Knowledge Base                            │
│  │   └── Code Templates                                    │
│  └── Model Management                                      │
│      ├── OpenAI/Claude/DeepSeek                            │
│      ├── Model Routing                                     │
│      └── Token Management                                  │
├─────────────────────────────────────────────────────────────┤
│  Storage Layer                                             │
│  ├── Vector Database (RAG)                                 │
│  ├── Conversation Storage                                  │
│  ├── Project Metadata                                      │
│  └── User Preferences                                      │
└─────────────────────────────────────────────────────────────┘
```

## 📁 新包结构设计

### 目录结构

```
apps/codex/
├── src/
│   ├── agents/                    # Mastra Agents
│   │   ├── chat-agent.ts         # 聊天助手 Agent
│   │   ├── code-generator.ts     # 代码生成 Agent
│   │   ├── project-analyzer.ts   # 项目分析 Agent
│   │   └── deployment-agent.ts   # 部署 Agent
│   ├── workflows/                # Mastra Workflows
│   │   ├── code-generation.ts    # 代码生成工作流
│   │   ├── project-build.ts      # 项目构建工作流
│   │   └── deployment.ts         # 部署工作流
│   ├── tools/                    # Mastra Tools & MCP
│   │   ├── file-system.ts        # 文件系统工具
│   │   ├── database.ts           # 数据库工具
│   │   ├── git.ts                # Git 工具
│   │   └── deployment.ts         # 部署工具
│   ├── memory/                   # Memory & RAG
│   │   ├── conversation.ts       # 对话记忆
│   │   ├── knowledge-base.ts     # 知识库
│   │   └── templates.ts          # 代码模板
│   ├── app/                      # Next.js App Router
│   │   ├── api/                  # API Routes
│   │   │   ├── agents/           # Agent API
│   │   │   ├── workflows/        # Workflow API
│   │   │   └── chat/             # Chat API (重构)
│   │   ├── [locale]/             # 国际化路由
│   │   │   ├── chat/             # 聊天界面
│   │   │   ├── builder/          # 代码构建器
│   │   │   └── projects/         # 项目管理
│   │   └── globals.css
│   ├── components/               # React 组件
│   │   ├── chat/                 # 聊天组件
│   │   ├── builder/              # 构建器组件
│   │   ├── projects/             # 项目组件
│   │   └── ui/                   # 通用 UI 组件
│   ├── lib/                      # 工具库
│   │   ├── mastra.ts             # Mastra 配置
│   │   ├── models.ts             # 模型配置
│   │   └── storage.ts            # 存储配置
│   └── types/                    # TypeScript 类型
├── mastra.config.ts              # Mastra 配置文件
├── package.json
└── README.md
```

## 🤖 Agent 系统设计

### 1. Chat Assistant Agent

```typescript
const chatAgent = new Agent({
  name: 'Chat Assistant',
  instructions: `
    You are We0 AI, an expert AI assistant for software development.
    You help users with coding questions, provide explanations, and assist with debugging.
  `,
  model: openai('gpt-4o-mini'),
  memory: conversationMemory,
  tools: [
    codeAnalysisTool,
    documentationTool,
    debuggingTool
  ]
});
```

### 2. Code Generation Agent

```typescript
const codeGeneratorAgent = new Agent({
  name: 'Code Generator',
  instructions: `
    You are a senior software developer specializing in full-stack development.
    Generate high-quality, production-ready code based on user requirements.
  `,
  model: claude('claude-3-5-sonnet-20240620'),
  memory: projectMemory,
  tools: [
    fileSystemTool,
    templateTool,
    databaseTool,
    gitTool
  ],
  workflow: codeGenerationWorkflow
});
```

### 3. Project Analysis Agent

```typescript
const projectAnalyzerAgent = new Agent({
  name: 'Project Analyzer',
  instructions: `
    Analyze project structure, dependencies, and provide optimization suggestions.
  `,
  model: deepseek('deepseek-chat'),
  memory: knowledgeBase,
  tools: [
    projectScanTool,
    dependencyAnalysisTool,
    securityScanTool
  ]
});
```

## 🔄 Workflow 系统设计

### 代码生成工作流

```typescript
const codeGenerationWorkflow = workflow
  .step('analyze_requirements', analyzeRequirements)
  .then('generate_structure', generateProjectStructure)
  .then('generate_backend', generateBackendCode)
  .parallel([
    workflow.step('generate_frontend', generateFrontendCode),
    workflow.step('generate_database', generateDatabaseSchema)
  ])
  .then('integrate_components', integrateComponents)
  .then('generate_tests', generateTests)
  .then('finalize', finalizeProject)
  .commit();
```

### 部署工作流

```typescript
const deploymentWorkflow = workflow
  .step('validate_project', validateProject)
  .then('build_project', buildProject)
  .branch({
    'docker': workflow.step('docker_deploy', dockerDeploy),
    'vercel': workflow.step('vercel_deploy', vercelDeploy),
    'aws': workflow.step('aws_deploy', awsDeploy)
  })
  .then('verify_deployment', verifyDeployment)
  .commit();
```

## 🛠️ Tools & MCP 集成

### 文件系统工具

```typescript
const fileSystemTool = createTool({
  id: 'file-system',
  description: 'Manage project files and directories',
  parameters: z.object({
    action: z.enum(['create', 'read', 'update', 'delete']),
    path: z.string(),
    content: z.string().optional()
  }),
  execute: async ({ action, path, content }) => {
    // 文件系统操作实现
  }
});
```

### 数据库工具

```typescript
const databaseTool = createTool({
  id: 'database',
  description: 'Generate database schemas and configurations',
  parameters: z.object({
    type: z.enum(['mysql', 'postgresql', 'mongodb']),
    schema: z.object({}).passthrough()
  }),
  execute: async ({ type, schema }) => {
    // 数据库操作实现
  }
});
```

## 💾 Memory & RAG 系统

### 对话记忆

```typescript
const conversationMemory = new Memory({
  provider: new PostgreSQLStorage({
    connectionString: process.env.DATABASE_URL
  }),
  embedder: openai.embedding('text-embedding-3-small')
});
```

### 知识库 RAG

```typescript
const knowledgeBase = new RAG({
  vectorStore: new PineconeVector({
    apiKey: process.env.PINECONE_API_KEY,
    indexName: 'we0-knowledge'
  }),
  embedder: openai.embedding('text-embedding-3-small'),
  reranker: cohere.rerank('rerank-english-v2.0')
});
```

## 🚀 部署策略

### 1. 开发环境

```bash
npm create mastra@latest we-dev-mastra
cd we-dev-mastra
npm run dev
```

### 2. 生产部署

- **Vercel**: 利用 Mastra 的 Vercel 部署器
- **Docker**: 容器化部署
- **AWS Lambda**: 无服务器部署
- **Mastra Cloud**: 官方云平台

## 📈 未来规划

### Phase 1: 核心重构 (4-6 周)

- [x] **设置 Mastra 项目结构** ✅ 已完成
  - [x] 初始化 Mastra 项目框架
  - [x] 配置 TypeScript 和依赖包
  - [x] 建立标准目录结构 (agents/, tools/, workflows/, models/)

- [x] **实现 DeepSeek LLM Provider** ✅ 已完成 (优先实现)
  - [x] 安装 @ai-sdk/openai-compatible 依赖
  - [x] 创建 DeepSeek 模型配置 (src/mastra/models/deepseek.ts)
  - [x] 实现 DeepSeek Agent (deepseekAgent, deepseekCoderAgent)
  - [x] 创建专用工具集成
    - [x] 代码生成工具 (codeGeneratorTool)
    - [x] 代码分析工具 (codeAnalysisTool)
    - [x] 项目结构工具 (projectStructureTool)
    - [x] 文档生成工具 (documentationTool, apiDocumentationTool, codeCommentTool)
  - [x] 集成到主 Mastra 配置
  - [x] 编写测试验证代码
  - [x] 环境变量配置 (.env 文件)

- [ ] 迁移现有 API 到 Mastra Agents
- [ ] 实现基础工作流
- [ ] 集成现有数据库

### Phase 2: 功能增强 (6-8 周)

- [ ] 实现 RAG 知识库
- [ ] 添加高级工作流
- [ ] 集成更多工具
- [ ] 优化用户体验

### Phase 3: 扩展功能 (8-10 周)

- [ ] 多租户支持
- [ ] 高级分析功能
- [ ] 插件系统
- [ ] 企业级功能

### Phase 4: 生态系统 (持续)

- [ ] 社区插件市场
- [ ] 第三方集成
- [ ] API 开放平台
- [ ] 移动端支持

## 🔧 技术优势

### Mastra 带来的改进

1. **统一的 AI 接口** - 简化模型切换和管理
2. **内置工作流引擎** - 复杂任务的可视化管理
3. **Agent 协作** - 多 Agent 协同工作
4. **内置观测性** - 更好的调试和监控
5. **云原生部署** - 简化部署和扩展
6. **TypeScript 优先** - 更好的开发体验

### 性能优化

- 流式响应优化
- 智能缓存策略
- 并行处理能力
- 资源使用优化

## 📊 迁移策略

### 数据迁移

1. 现有聊天记录迁移到 Mastra Memory
2. 用户配置迁移到新的存储系统
3. 项目模板迁移到 RAG 知识库

### API 兼容性

- 保持现有 API 端点兼容
- 逐步迁移到新的 Agent API
- 提供迁移工具和文档

### 用户体验

- 保持现有 UI/UX 设计
- 渐进式功能升级
- 向后兼容支持

## 🎉 预期收益

### 开发效率提升

- 减少 40% 的样板代码
- 提高 60% 的开发速度
- 简化 80% 的部署流程

### 功能增强

- 更智能的代码生成
- 更好的错误处理
- 更强的扩展能力

### 维护性改善

- 更清晰的代码结构
- 更好的测试覆盖
- 更简单的调试过程

---

**下一步行动：**

1. 创建 Mastra 项目骨架
2. 实现第一个 Agent（Chat Assistant）
3. 迁移核心 API 功能
4. 设置开发和测试环境
