# 智能编程助手全面重构计划 v6.0 - 基于 Mastra Client 和 MetaGPT 架构

## 🔍 全面项目分析与新架构设计

### 1. 当前项目状态深度分析 ✅

#### 1.1 codex - 智能编程 API 核心 🧠
**基于 Mastra vNext 的完整后端实现**:
- ✅ **Mastra vNext Agent Network**: 完整的多智能体协作系统
- ✅ **智能编程网络**: intelligent-coding-network (5个专业角色)
- ✅ **智能任务路由**: 根据复杂度自动选择处理方式
- ✅ **专业角色分工**: 需求分析师、架构师、高级开发工程师、代码审查员、文档专家
- ✅ **20+ 专业工具**: 文件处理、代码生成、文档生成等
- ✅ **流式 API**: 完整的 AI SDK 兼容流式响应 (已验证工作)
- ✅ **Memory 系统**: LibSQL 存储的上下文记忆
- ✅ **质量保证体系**: 多层验证和审查机制
- ✅ **API 兼容性**: 与标准 AI SDK 格式完全兼容

#### 1.2 we-dev-client - 完整前端 IDE 🎨
**基于现代技术栈的桌面级 IDE**:
- ✅ **完整 IDE 界面**: VS Code 风格的专业界面 (WeIde 组件)
- ✅ **CodeMirror 编辑器**: 多语言语法高亮和智能补全
- ✅ **WebContainer 集成**: 浏览器内完整开发环境
- ✅ **文件管理系统**: 完整的文件树和 CRUD 操作
- ✅ **终端模拟器**: xterm.js 多终端支持
- ✅ **AI 聊天界面**: 完整的对话式编程界面 (AiChat 组件)
- ✅ **实时预览**: iframe 预览和热重载
- ✅ **项目管理**: 项目创建、模板、依赖管理
- ✅ **Electron 桌面应用**: 跨平台桌面支持
- ✅ **MCP 集成**: 模型上下文协议支持
- ✅ **状态管理**: Zustand 状态管理系统

### 2. 基于 Mastra Client 的新架构设计 🚀

#### 2.1 Mastra Client 集成优势 📡
**根据 Mastra 官方文档分析**:
- ✅ **原生 TypeScript 支持**: 完整的类型安全
- ✅ **统一 API 接口**: 标准化的智能体调用方式
- ✅ **流式响应支持**: 原生支持实时流式交互
- ✅ **错误处理机制**: 完善的错误处理和重试机制
- ✅ **多智能体管理**: 统一管理多个智能体实例
- ✅ **内存和上下文**: 自动处理智能体记忆和上下文

#### 2.2 MetaGPT 多智能体架构集成 🧠
**基于 MetaGPT 论文的核心设计**:
- 🎯 **标准化操作流程 (SOPs)**: 模拟真实软件开发团队
- 👥 **专业角色分工**: 产品经理、架构师、工程师、QA工程师、项目经理
- 📋 **结构化通信**: 通过文档和图表而非对话进行协作
- 🔄 **发布-订阅机制**: 高效的信息共享和任务协调
- 🔧 **可执行反馈**: 代码执行和调试的自我修正机制
- 📊 **质量保证**: 多层次的代码审查和验证

#### 2.3 与 Cursor 的全面对比 🎯

| 维度 | 我们的方案 | Cursor | MetaGPT 优势 |
|------|------------|--------|--------------|
| **AI 架构** | ✅ MetaGPT 5角色协作 | ❌ 单一 AI 助手 | 专业团队 vs 个人助手 |
| **工作流程** | ✅ 标准化操作流程 | ❌ 简单对话模式 | 系统性 vs 随意性 |
| **代码质量** | ✅ 多层次质量保证 | ❌ 基础代码检查 | 团队审查 vs 单点检查 |
| **项目理解** | ✅ 全项目上下文分析 | ❌ 有限上下文窗口 | 全局视野 vs 局部视野 |
| **部署方式** | ✅ Web + 桌面双模式 | ❌ 仅桌面应用 | 灵活性 vs 限制性 |
| **开发环境** | ✅ WebContainer 浏览器内 | ❌ 依赖本地环境 | 一致性 vs 环境差异 |
| **协作能力** | ✅ 实时多人协作 | ❌ 单人使用 | 团队协作 vs 个人工具 |
| **技术栈** | ✅ Mastra + React + TS | ✅ VS Code + AI | 现代化 vs 传统扩展 |

### 3. 当前实现的核心问题分析

#### 3.1 架构连接问题 ❌
**问题**: codex (后端 AI) 和 we-dev-client (前端 IDE) 完全独立
- ❌ **API 连接缺失**: we-dev-client 无法调用 codex 的智能体 API
- ❌ **数据格式不匹配**: 两者的数据协议不兼容
- ❌ **认证系统分离**: 用户系统和权限管理不统一
- ❌ **部署架构分离**: 无法作为统一产品部署

#### 3.2 功能整合问题 ⚠️
**问题**: 两个项目的优势功能无法协同工作
- ⚠️ **智能体能力浪费**: codex 的多智能体协作无法在 IDE 中体现
- ⚠️ **IDE 功能孤立**: we-dev-client 的编辑器无法获得 AI 增强
- ⚠️ **用户体验割裂**: 无法提供统一的智能编程体验
- ⚠️ **数据孤岛**: 项目数据和 AI 上下文无法共享

#### 3.3 技术栈兼容问题 🔧
**问题**: 技术选型和架构设计需要统一
- 🔧 **通信协议**: 需要统一的 API 协议和数据格式
- 🔧 **状态管理**: 前后端状态同步和管理
- 🔧 **实时通信**: WebSocket 连接和事件处理
- 🔧 **错误处理**: 统一的错误处理和用户反馈

## 🛠️ 基于 Mastra Client 的全新架构方案

### 1. 核心架构重构策略 🏗️

#### 1.1 使用 Mastra Client 替换传统 API 调用
**核心思路**: 将 we-dev-client 改造为基于 Mastra Client 的前端

```
┌─────────────────────────────────────────────────────────────┐
│                    we-dev-client (重构后)                    │
│  ┌─────────────────┐    Mastra Client    ┌─────────────────┐ │
│  │   UI Components │ ◄─────────────────► │  Mastra Client  │ │
│  │                 │                     │                 │ │
│  │ ✅ WeIde 编辑器   │                     │ ✅ 智能体管理     │ │
│  │ ✅ AiChat 界面   │                     │ ✅ 流式响应处理   │ │
│  │ ✅ WebContainer  │                     │ ✅ 错误处理      │ │
│  │ ✅ 文件管理      │                     │ ✅ 上下文管理     │ │
│  │ ✅ 终端模拟器    │                     │ ✅ 内存管理      │ │
│  └─────────────────┘                     └─────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP/WebSocket
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      codex (Mastra Server)                  │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │ Product Manager │  │   Architect     │  │ Senior Engineer │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
│  ┌─────────────────┐  ┌─────────────────┐                    │
│  │ Code Reviewer   │  │ Doc Specialist  │                    │
│  └─────────────────┘  └─────────────────┘                    │
│                                                              │
│  ✅ MetaGPT 多智能体协作  ✅ 智能任务路由  ✅ 质量保证体系      │
└─────────────────────────────────────────────────────────────┘
```

#### 1.2 Mastra Client 集成设计 📡
**目标**: 完全替换传统 API 调用，使用 Mastra 原生客户端

```typescript
// 基于 Mastra Client 的新架构
import { MastraClient } from "@mastra/client-js";

export class IntelligentCodingClient {
  private mastraClient: MastraClient;

  constructor() {
    this.mastraClient = new MastraClient({
      baseUrl: process.env.VITE_MASTRA_API_URL || "http://localhost:4111",
    });
  }

  // 获取智能编程网络
  getIntelligentCodingNetwork() {
    return this.mastraClient.getAgent("intelligent-coding-network");
  }

  // 流式智能编程
  async streamIntelligentCoding(prompt: string): Promise<ReadableStream> {
    const agent = this.getIntelligentCodingNetwork();
    return await agent.stream({
      messages: [{ role: "user", content: prompt }]
    });
  }

  // 项目分析
  async analyzeProject(files: FileTree): Promise<ProjectAnalysis> {
    const agent = this.getIntelligentCodingNetwork();
    return await agent.generate({
      messages: [{
        role: "user",
        content: `请分析这个项目结构：\n${JSON.stringify(files, null, 2)}`
      }]
    });
  }
}
```

### 2. 基于 MetaGPT 的前端交互重构 🧠

#### 2.1 Phase 1: Mastra Client 集成 (2-3天)

**目标**: 将 we-dev-client 改造为基于 Mastra Client 的前端

```typescript
// 安装 Mastra Client 依赖
// package.json
{
  "dependencies": {
    "@mastra/client-js": "latest",
    // ... 其他现有依赖
  }
}

// 创建 Mastra Client 服务
// src/services/mastra/intelligent-coding-client.ts
import { MastraClient } from "@mastra/client-js";

export class IntelligentCodingClient {
  private mastraClient: MastraClient;

  constructor() {
    this.mastraClient = new MastraClient({
      baseUrl: import.meta.env.VITE_MASTRA_API_URL || "http://localhost:4111",
    });
  }

  // 获取智能编程网络智能体
  getIntelligentCodingAgent() {
    return this.mastraClient.getAgent("intelligent-coding-network");
  }

  // MetaGPT 风格的智能编程请求
  async requestIntelligentCoding(requirement: string): Promise<ReadableStream> {
    const agent = this.getIntelligentCodingAgent();

    return await agent.stream({
      messages: [{
        role: "user",
        content: `作为软件开发团队，请按照 MetaGPT 标准操作流程处理以下需求：\n\n${requirement}\n\n请按照以下角色分工协作：\n1. 产品经理：分析需求，生成 PRD\n2. 架构师：设计系统架构\n3. 高级工程师：实现代码\n4. 代码审查员：质量保证\n5. 文档专家：生成文档`
      }]
    });
  }

  // 特定角色的智能体调用
  async callSpecificAgent(role: string, task: string): Promise<any> {
    const agent = this.getIntelligentCodingAgent();

    return await agent.generate({
      messages: [{
        role: "user",
        content: `作为${role}，请处理以下任务：\n${task}`
      }]
    });
  }
}
```

#### 2.2 Phase 2: MetaGPT 多智能体界面设计 (2-3天)

**目标**: 重新设计 AiChat 界面，体现 MetaGPT 的多智能体协作

```typescript
// 重构 AiChat 组件，支持 MetaGPT 工作流
// src/components/AiChat/MetaGPTChat.tsx
import { IntelligentCodingClient } from '../../services/mastra/intelligent-coding-client';

interface MetaGPTAgent {
  id: string;
  name: string;
  role: string;
  description: string;
  status: 'idle' | 'working' | 'completed' | 'error';
}

export const MetaGPTChat: React.FC = () => {
  const [agents, setAgents] = useState<MetaGPTAgent[]>([
    { id: 'pm', name: '产品经理', role: 'Product Manager', description: '需求分析和 PRD 生成', status: 'idle' },
    { id: 'arch', name: '架构师', role: 'Architect', description: '系统设计和技术选型', status: 'idle' },
    { id: 'eng', name: '高级工程师', role: 'Senior Engineer', description: '代码实现和开发', status: 'idle' },
    { id: 'qa', name: '代码审查员', role: 'Code Reviewer', description: '代码审查和质量保证', status: 'idle' },
    { id: 'doc', name: '文档专家', role: 'Documentation Specialist', description: '文档生成和维护', status: 'idle' }
  ]);

  const [workflowProgress, setWorkflowProgress] = useState<string>('');
  const [currentPhase, setCurrentPhase] = useState<string>('');
  const intelligentCodingClient = new IntelligentCodingClient();

  const handleMetaGPTRequest = async (requirement: string) => {
    // 重置智能体状态
    setAgents(prev => prev.map(agent => ({ ...agent, status: 'idle' })));
    setCurrentPhase('需求分析阶段');

    try {
      const stream = await intelligentCodingClient.requestIntelligentCoding(requirement);
      const reader = stream.getReader();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);

        // 解析 MetaGPT 工作流进度
        parseMetaGPTProgress(chunk);
      }
    } catch (error) {
      console.error('MetaGPT 工作流执行失败:', error);
    }
  };

  const parseMetaGPTProgress = (chunk: string) => {
    // 解析智能体工作进度
    if (chunk.includes('🔧 正在调用工具: Product Manager')) {
      updateAgentStatus('pm', 'working');
      setCurrentPhase('产品需求分析');
    } else if (chunk.includes('🔧 正在调用工具: Architect')) {
      updateAgentStatus('pm', 'completed');
      updateAgentStatus('arch', 'working');
      setCurrentPhase('系统架构设计');
    } else if (chunk.includes('🔧 正在调用工具: Senior Developer')) {
      updateAgentStatus('arch', 'completed');
      updateAgentStatus('eng', 'working');
      setCurrentPhase('代码实现');
    } else if (chunk.includes('🔧 正在调用工具: Code Reviewer')) {
      updateAgentStatus('eng', 'completed');
      updateAgentStatus('qa', 'working');
      setCurrentPhase('代码审查');
    } else if (chunk.includes('🔧 正在调用工具: Documentation Specialist')) {
      updateAgentStatus('qa', 'completed');
      updateAgentStatus('doc', 'working');
      setCurrentPhase('文档生成');
    }

    setWorkflowProgress(prev => prev + chunk);
  };

  const updateAgentStatus = (agentId: string, status: MetaGPTAgent['status']) => {
    setAgents(prev => prev.map(agent =>
      agent.id === agentId ? { ...agent, status } : agent
    ));
  };

  return (
    <div className="metagpt-chat">
      {/* MetaGPT 智能体状态面板 */}
      <div className="agents-panel">
        <h3>MetaGPT 软件开发团队</h3>
        <div className="current-phase">当前阶段: {currentPhase}</div>
        <div className="agents-grid">
          {agents.map(agent => (
            <div key={agent.id} className={`agent-card ${agent.status}`}>
              <div className="agent-name">{agent.name}</div>
              <div className="agent-role">{agent.role}</div>
              <div className="agent-description">{agent.description}</div>
              <div className="agent-status">
                {agent.status === 'working' && '🔄 工作中...'}
                {agent.status === 'completed' && '✅ 已完成'}
                {agent.status === 'error' && '❌ 错误'}
                {agent.status === 'idle' && '⏸️ 待命'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 工作流进度显示 */}
      <div className="workflow-progress">
        <h4>工作流进度</h4>
        <div className="progress-content">
          {workflowProgress}
        </div>
      </div>

      {/* 输入界面 */}
      <div className="input-section">
        <textarea
          placeholder="请描述您的软件开发需求，MetaGPT 团队将为您提供完整的解决方案..."
          onKeyPress={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleMetaGPTRequest(e.currentTarget.value);
            }
          }}
        />
        <button onClick={() => handleMetaGPTRequest('创建一个 React 计数器应用')}>
          启动 MetaGPT 工作流
        </button>
      </div>
    </div>
  );
};
```

#### 2.3 Phase 3: 代码编辑器 AI 增强 (3-4天)

**目标**: 为 we-dev-client 的 CodeMirror 编辑器添加 AI 能力

```typescript
// 增强代码编辑器
// src/components/WeIde/components/Editor/AIEnhancedEditor.tsx
export const AIEnhancedEditor: React.FC = () => {
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestion[]>([]);
  const [isAIThinking, setIsAIThinking] = useState(false);

  const handleCodeChange = async (code: string) => {
    // 实时代码分析和建议
    if (shouldTriggerAI(code)) {
      setIsAIThinking(true);

      const suggestions = await codexAPI.getCodeSuggestions({
        code,
        language: currentLanguage,
        context: projectContext
      });

      setAiSuggestions(suggestions);
      setIsAIThinking(false);
    }
  };

  const handleAICompletion = async (trigger: string) => {
    // AI 代码补全
    const completion = await codexAPI.requestCodeCompletion({
      trigger,
      context: getEditorContext(),
      agent: 'senior-developer'
    });

    insertCodeCompletion(completion);
  };

  return (
    <div className="ai-enhanced-editor">
      <CodeMirrorEditor
        onChange={handleCodeChange}
        onAITrigger={handleAICompletion}
      />
      <AISuggestionsPanel suggestions={aiSuggestions} />
      <AIThinkingIndicator visible={isAIThinking} />
    </div>
  );
};
```

#### 2.4 Phase 4: 项目级 AI 功能 (2-3天)

**目标**: 实现项目级别的智能分析和管理

```typescript
// 项目级 AI 服务
// src/services/ai/project-ai.ts
export class ProjectAIService {
  async analyzeProjectStructure(): Promise<ProjectAnalysis> {
    const files = await fileSystemService.getAllFiles();
    return await codexAPI.analyzeProject(files);
  }

  async generateProjectDocumentation(): Promise<Documentation> {
    const analysis = await this.analyzeProjectStructure();
    return await codexAPI.generateDocumentation(analysis);
  }

  async suggestProjectImprovements(): Promise<Improvement[]> {
    const context = await this.getProjectContext();
    return await codexAPI.suggestImprovements(context);
  }

  async refactorProject(scope: RefactorScope): Promise<RefactorPlan> {
    return await codexAPI.planRefactoring({
      scope,
      context: await this.getProjectContext(),
      agent: 'architect'
    });
  }
}
```

### 3. 关键技术实现细节

#### 3.1 codex API 扩展 🔧

**目标**: 为 codex 添加前端 IDE 需要的 API 端点

```typescript
// 在 codex 中添加新的 API 路由
// src/mastra/api-routes.ts (扩展现有文件)

// 项目分析 API
export const projectAnalysisRoute = registerApiRoute({
  path: '/apix/project-analysis',
  method: 'POST',
  handler: async (req, res) => {
    const { files } = req.body;

    // 使用现有的智能编程网络分析项目
    const analysis = await intelligentCodingAgentNetwork.run({
      messages: [{
        role: 'user',
        content: `请分析这个项目的结构和特点：\n${JSON.stringify(files, null, 2)}`
      }],
      agent: 'system-architect' // 使用架构师角色
    });

    return res.json(analysis);
  }
});

// 代码补全 API
export const codeCompletionRoute = registerApiRoute({
  path: '/apix/code-completion',
  method: 'POST',
  handler: async (req, res) => {
    const { trigger, context, agent = 'senior-developer' } = req.body;

    const completion = await intelligentCodingAgentNetwork.run({
      messages: [{
        role: 'user',
        content: `请为以下代码提供智能补全：\n上下文：${context}\n触发：${trigger}`
      }],
      agent
    });

    return res.json(completion);
  }
});

// 实时协作 API
export const collaborationRoute = registerApiRoute({
  path: '/apix/collaboration/:projectId',
  method: 'GET',
  handler: async (req, res) => {
    const { projectId } = req.params;

    // 建立 WebSocket 连接用于实时协作
    // 这里可以集成现有的智能体系统

    return res.json({ status: 'connected', projectId });
  }
});
```

#### 2.2 智能体协作环境 🌐
```typescript
// packages/backend/src/mastra/environment/collaboration.ts
export class CollaborationEnvironment {
  private messageQueue: MessageQueue;
  private sharedWorkspace: SharedWorkspace;
  private qualityGate: QualityGate;
  
  async processMessage(message: AgentMessage): Promise<void> {
    // 消息路由和处理
    const targetAgent = this.getTargetAgent(message.to);
    const result = await targetAgent.process(message);
    
    // 质量检查
    if (message.type === 'code_implementation') {
      await this.qualityGate.check(result);
    }
    
    // 广播结果
    await this.broadcastResult(result);
  }
}
```

#### 2.3 工作流编排系统 ⚙️
```typescript
// packages/backend/src/mastra/workflows/software-development.ts
export class SoftwareDevelopmentWorkflow {
  async execute(requirement: string): Promise<ProjectResult> {
    const workflow = new WorkflowBuilder()
      .addStage('analysis', this.analysisStage)
      .addStage('design', this.designStage)
      .addStage('implementation', this.implementationStage)
      .addStage('testing', this.testingStage)
      .addStage('deployment', this.deploymentStage)
      .build();
      
    return await workflow.execute({ requirement });
  }
}
```

### Phase 3: 前端 IDE 集成 (3-4天)

#### 3.1 核心组件迁移 🎨
```typescript
// packages/frontend/src/components/IDE/
├── Editor/                   # 从 we-dev-client 迁移
│   ├── CodeMirrorEditor.tsx
│   ├── MonacoEditor.tsx
│   └── EditorTabs.tsx
├── FileExplorer/            # 文件管理
│   ├── FileTree.tsx
│   └── FileOperations.tsx
├── Terminal/                # 终端集成
│   ├── XTerminal.tsx
│   └── TerminalTabs.tsx
├── Preview/                 # 实时预览
│   ├── WebPreview.tsx
│   └── MobilePreview.tsx
└── AIChat/                  # AI 聊天界面
    ├── ChatInterface.tsx
    ├── AgentSelector.tsx
    └── WorkflowProgress.tsx
```

#### 3.2 WebContainer 服务集成 🐳
```typescript
// packages/frontend/src/services/webcontainer/
export class WebContainerService {
  private container: WebContainer;
  private fileSystem: FileSystemService;
  
  async initializeProject(template: ProjectTemplate): Promise<void> {
    await this.container.mount(template.files);
    await this.installDependencies();
    await this.startDevServer();
  }
  
  async executeCommand(command: string): Promise<CommandResult> {
    const process = await this.container.spawn('sh', ['-c', command]);
    return this.streamOutput(process);
  }
}
```

#### 3.3 状态管理重构 📊
```typescript
// packages/frontend/src/stores/
export const useIDEStore = create<IDEState>((set, get) => ({
  // 项目状态
  currentProject: null,
  files: new Map(),
  activeFile: null,
  
  // 智能体状态
  activeAgents: [],
  workflowProgress: null,
  
  // UI 状态
  layout: 'default',
  panels: {
    fileExplorer: true,
    terminal: true,
    preview: true,
    aiChat: true
  },
  
  // 操作方法
  setActiveFile: (path: string) => set({ activeFile: path }),
  updateFile: (path: string, content: string) => {
    const files = new Map(get().files);
    files.set(path, content);
    set({ files });
  },
  
  startWorkflow: async (requirement: string) => {
    // 启动 MetaGPT 工作流
    const workflow = new SoftwareDevelopmentWorkflow();
    set({ workflowProgress: 'starting' });
    
    const result = await workflow.execute(requirement);
    set({ workflowProgress: 'completed', currentProject: result });
  }
}));
```

### Phase 4: 智能化功能增强 (4-5天)

#### 4.1 AI 驱动的代码生成 🧠
```typescript
// packages/backend/src/services/ai/intelligent-coding.ts
export class IntelligentCodingService {
  async generateCode(
    requirement: string,
    context: ProjectContext
  ): Promise<GeneratedCode> {
    // 使用 MetaGPT 工作流
    const company = new SoftwareCompany();
    const result = await company.executeProject(requirement);
    
    return {
      files: result.files,
      tests: result.tests,
      documentation: result.docs,
      deployment: result.deployment
    };
  }
  
  async optimizeCode(code: string): Promise<OptimizedCode> {
    const qaEngineer = new QAEngineerAgent();
    return await qaEngineer.optimize(code);
  }
  
  async generateTests(code: string): Promise<TestSuite> {
    const qaEngineer = new QAEngineerAgent();
    return await qaEngineer.generateTests(code);
  }
}
```

#### 4.2 实时协作系统 🤝
```typescript
// packages/backend/src/services/collaboration/
export class CollaborationService {
  private io: SocketIOServer;
  private rooms: Map<string, CollaborationRoom>;
  
  async joinProject(userId: string, projectId: string): Promise<void> {
    const room = this.getOrCreateRoom(projectId);
    await room.addUser(userId);
    
    // 同步项目状态
    this.io.to(projectId).emit('user_joined', { userId });
    this.io.to(userId).emit('project_state', room.getState());
  }
  
  async syncFileChange(
    projectId: string, 
    filePath: string, 
    changes: TextChange[]
  ): Promise<void> {
    const room = this.rooms.get(projectId);
    await room.applyChanges(filePath, changes);
    
    // 广播变更
    this.io.to(projectId).emit('file_changed', { filePath, changes });
  }
}
```

#### 4.3 智能项目管理 📋
```typescript
// packages/backend/src/services/project/
export class ProjectManagementService {
  async createProject(template: ProjectTemplate): Promise<Project> {
    const projectManager = new ProjectManagerAgent();
    
    // 项目初始化
    const project = await projectManager.initializeProject(template);
    
    // 设置开发环境
    await this.setupDevelopmentEnvironment(project);
    
    // 创建初始任务
    const tasks = await projectManager.createInitialTasks(project);
    
    return { ...project, tasks };
  }
  
  async analyzeProgress(projectId: string): Promise<ProgressReport> {
    const project = await this.getProject(projectId);
    const projectManager = new ProjectManagerAgent();
    
    return await projectManager.analyzeProgress(project);
  }
}
```

### Phase 5: 用户体验优化 (2-3天)

#### 5.1 现代化 UI/UX 🎨
```typescript
// packages/frontend/src/components/UI/
├── Layout/
│   ├── IDELayout.tsx         # 主布局
│   ├── PanelManager.tsx      # 面板管理
│   └── StatusBar.tsx         # 状态栏
├── Theme/
│   ├── ThemeProvider.tsx     # 主题系统
│   ├── ColorScheme.ts        # 配色方案
│   └── DarkMode.tsx          # 暗色模式
└── Accessibility/
    ├── KeyboardShortcuts.tsx # 快捷键
    ├── ScreenReader.tsx      # 屏幕阅读器
    └── HighContrast.tsx      # 高对比度
```

#### 5.2 性能优化策略 ⚡
```typescript
// packages/frontend/src/utils/performance/
export class PerformanceOptimizer {
  // 虚拟滚动
  enableVirtualScrolling(container: HTMLElement): void {
    // 实现大文件的虚拟滚动
  }
  
  // 懒加载
  lazyLoadComponents(): void {
    // 组件懒加载
  }
  
  // 缓存策略
  setupIntelligentCaching(): void {
    // 智能缓存文件和状态
  }
  
  // 并发控制
  limitConcurrentRequests(maxConcurrent: number): void {
    // 限制并发请求数量
  }
}
```

## 📊 最终技术架构

### 整合后的技术栈
```json
{
  "backend": {
    "core": "codex (Mastra vNext Agent Network)",
    "framework": "Express.js + Mastra",
    "ai": "5个专业角色智能体 + 20+工具",
    "database": "LibSQL (现有)",
    "memory": "Mastra Memory (现有)",
    "api": "RESTful + 流式响应"
  },
  "frontend": {
    "core": "we-dev-client (完整 IDE)",
    "framework": "React + TypeScript + Electron",
    "editor": "CodeMirror 6 (现有)",
    "terminal": "xterm.js (现有)",
    "container": "WebContainer API (现有)",
    "ui": "Tailwind CSS + 自定义组件",
    "state": "Zustand (现有)"
  },
  "integration": {
    "communication": "HTTP API + WebSocket",
    "data_format": "JSON + 流式文本",
    "auth": "统一认证系统",
    "deployment": "Docker 容器化"
  }
}
```

### 部署架构
```
┌─────────────────────────────────────────────────────────────┐
│                        用户访问层                              │
├─────────────────────────────────────────────────────────────┤
│  Web 版本 (浏览器)          │    桌面版本 (Electron)          │
├─────────────────────────────────────────────────────────────┤
│                    we-dev-client (前端)                      │
│  ✅ 完整 IDE 界面  ✅ WebContainer  ✅ 文件管理  ✅ 终端       │
├─────────────────────────────────────────────────────────────┤
│                      API Bridge 层                          │
│  🌉 HTTP API  🌉 WebSocket  🌉 数据转换  🌉 错误处理        │
├─────────────────────────────────────────────────────────────┤
│                     codex (后端 AI 核心)                     │
│  🧠 多智能体协作  🧠 智能任务路由  🧠 质量保证  🧠 Memory     │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 基于 Mastra Client 的实施时间线

### 总体时间安排: 8-12 天 (进一步优化)

| Phase | 时间 | 主要任务 | 交付物 |
|-------|------|----------|--------|
| Phase 1 | 2-3天 | Mastra Client 集成 | 替换传统 API 调用 |
| Phase 2 | 2-3天 | MetaGPT 界面重构 | 多智能体协作界面 |
| Phase 3 | 2-3天 | 代码编辑器 AI 增强 | Mastra 驱动的智能编辑 |
| Phase 4 | 1-2天 | 项目级智能分析 | 完整的项目理解能力 |
| Phase 5 | 1-2天 | 性能优化和部署 | 生产就绪的产品 |

### 详细实施步骤

#### Phase 1: Mastra Client 集成 (2-3天)

**Day 1: 环境准备**
```bash
# 在 we-dev-client 中安装 Mastra Client
cd /Users/louloulin/Documents/linchong/code/we0/apps/we-dev-client
pnpm add @mastra/client-js

# 创建 Mastra 服务层
mkdir -p src/services/mastra
```

**Day 2-3: 核心服务实现**
- ✅ 创建 IntelligentCodingClient 类
- ✅ 替换现有的 API 调用
- ✅ 实现流式响应处理
- ✅ 添加错误处理和重试机制

#### Phase 2: MetaGPT 界面重构 (2-3天)

**Day 1: 组件设计**
- ✅ 设计 MetaGPT 智能体状态面板
- ✅ 创建工作流进度显示组件
- ✅ 重构 AiChat 界面

**Day 2-3: 交互实现**
- ✅ 实现智能体状态管理
- ✅ 添加工作流可视化
- ✅ 集成实时进度更新

## 🎯 基于 Mastra + MetaGPT 的产品优势

### 最终产品特性
- 🧠 **MetaGPT 多智能体协作**: 5个专业角色按标准操作流程协同工作
- 📡 **Mastra Client 原生集成**: 类型安全的智能体调用和管理
- 🎨 **完整 IDE 体验**: 基于 we-dev-client 的专业界面
- 🌐 **Web + 桌面双模式**: 浏览器即用 + Electron 桌面应用
- 🐳 **WebContainer 集成**: 浏览器内完整开发环境
- 🔧 **智能代码编辑**: Mastra 驱动的 AI 增强编辑器
- 📊 **项目级 AI 分析**: 全项目上下文感知和理解
- ⚡ **实时流式响应**: 流畅的多智能体协作可视化
- 🎯 **智能任务路由**: 根据复杂度自动选择最佳智能体
- 📋 **标准化操作流程**: 模拟真实软件开发团队的工作方式

### 与 Cursor 和其他竞品的全面对比

| 特性维度 | 我们的产品 | Cursor | GitHub Copilot | Replit | 优势说明 |
|----------|------------|--------|----------------|--------|----------|
| **AI 架构** | ✅ MetaGPT 5角色团队 | ❌ 单一 AI | ❌ 代码补全 | ❌ 基础 AI | 专业团队 vs 个人助手 |
| **工作流程** | ✅ 标准化操作流程 | ❌ 简单对话 | ❌ 无工作流 | ❌ 基础流程 | 系统性 vs 随意性 |
| **技术集成** | ✅ Mastra Client 原生 | ❌ 传统 API | ❌ VS Code 插件 | ❌ 自建 API | 现代化 vs 传统方式 |
| **部署方式** | ✅ Web + 桌面双模式 | ❌ 仅桌面 | ❌ 编辑器插件 | ✅ Web 原生 | 灵活性最佳 |
| **开发环境** | ✅ WebContainer 完整环境 | ❌ 依赖本地 | ❌ 依赖本地 | ✅ 云端环境 | 一致性 + 功能完整 |
| **代码质量** | ✅ 多智能体审查 | ❌ 基础检查 | ❌ 基础检查 | ❌ 基础检查 | 团队审查 vs 单点检查 |
| **项目理解** | ✅ 全项目上下文 | ❌ 有限窗口 | ❌ 文件级别 | ❌ 基础理解 | 全局视野 vs 局部视野 |
| **协作能力** | ✅ 实时多人协作 | ❌ 单人使用 | ❌ 单人使用 | ✅ 多人协作 | AI 增强的团队协作 |
| **学习成本** | ✅ 熟悉 IDE 界面 | ✅ VS Code 兼容 | ✅ 编辑器集成 | ⚠️ 新界面 | 功能强大且易用 |

---

## 📋 详细实施指南

### Phase 1 详细步骤

#### 1.1 Monorepo 初始化脚本
```bash
#!/bin/bash
# setup-monorepo.sh

echo "🚀 初始化智能编程助手 Monorepo..."

# 创建项目结构
mkdir -p we0-intelligent-ide/{packages/{backend,frontend,shared},apps/{web,desktop},docs}
cd we0-intelligent-ide

# 初始化根 package.json
cat > package.json << 'EOF'
{
  "name": "we0-intelligent-ide",
  "version": "1.0.0",
  "private": true,
  "workspaces": ["packages/*", "apps/*"],
  "scripts": {
    "dev": "concurrently \"npm run dev:backend\" \"npm run dev:frontend\"",
    "dev:backend": "cd packages/backend && npm run dev",
    "dev:frontend": "cd packages/frontend && npm run dev",
    "build": "npm run build:backend && npm run build:frontend",
    "test": "npm run test --workspaces",
    "lint": "npm run lint --workspaces",
    "type-check": "npm run type-check --workspaces"
  },
  "devDependencies": {
    "concurrently": "^8.2.2",
    "husky": "^8.0.3",
    "lint-staged": "^15.2.0"
  }
}
EOF

# 安装根依赖
pnpm install

echo "✅ Monorepo 结构创建完成"
```

#### 1.2 Backend 项目初始化
```bash
# packages/backend/package.json
{
  "name": "@we0/backend",
  "version": "1.0.0",
  "main": "dist/index.js",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "test": "jest",
    "lint": "eslint src --ext .ts"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "compression": "^1.7.4",
    "morgan": "^1.10.0",
    "socket.io": "^4.7.4",
    "redis": "^4.6.11",
    "bull": "^4.12.2",
    "@webcontainer/api": "1.5.1",
    "fs-extra": "^11.2.0",
    "chokidar": "^3.5.3",
    "@babel/parser": "^7.23.6",
    "@babel/traverse": "^7.23.6",
    "prettier": "^3.1.1",
    "@mastra/core": "^0.10.15",
    "@mastra/memory": "^0.11.3",
    "zod": "^3.22.4"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/cors": "^2.8.17",
    "@types/compression": "^1.7.5",
    "@types/morgan": "^1.9.9",
    "@types/fs-extra": "^11.0.4",
    "@types/babel__parser": "^7.1.1",
    "@types/babel__traverse": "^7.20.4",
    "tsx": "^4.7.0",
    "typescript": "^5.3.3"
  }
}
```

#### 1.3 Frontend 项目初始化
```bash
# packages/frontend/package.json
{
  "name": "@we0/frontend",
  "version": "1.0.0",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "jest",
    "lint": "eslint src --ext .ts,.tsx"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@codemirror/state": "^6.4.0",
    "@codemirror/view": "^6.23.0",
    "@codemirror/lang-javascript": "^6.2.1",
    "@codemirror/lang-typescript": "^6.0.4",
    "@codemirror/lang-html": "^6.4.7",
    "@codemirror/lang-css": "^6.2.1",
    "@xterm/xterm": "^5.3.0",
    "@xterm/addon-fit": "^0.8.0",
    "@xterm/addon-web-links": "^0.9.0",
    "@webcontainer/api": "1.5.1",
    "zustand": "^4.4.7",
    "@tanstack/react-query": "^5.17.0",
    "socket.io-client": "^4.7.4",
    "@radix-ui/react-slot": "^1.0.2",
    "@radix-ui/react-tabs": "^1.0.4",
    "@radix-ui/react-tooltip": "^1.0.7",
    "lucide-react": "^0.303.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.0.0",
    "tailwind-merge": "^2.2.0",
    "framer-motion": "^10.16.16"
  },
  "devDependencies": {
    "@types/react": "^18.2.45",
    "@types/react-dom": "^18.2.18",
    "@vitejs/plugin-react": "^4.2.1",
    "vite": "^5.0.10",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.32"
  }
}
```

### Phase 2 详细步骤

#### 2.1 MetaGPT 角色实现
```typescript
// packages/backend/src/agents/roles/product-manager.ts
export class ProductManagerAgent extends Agent {
  async analyzePRD(requirement: string): Promise<PRD> {
    const prompt = `
作为产品经理，请分析以下需求并生成产品需求文档：

需求：${requirement}

请按以下格式输出：
1. 功能需求
2. 非功能需求
3. 用户故事
4. 验收标准
5. 技术约束
`;

    const response = await this.llm.generate(prompt);
    return this.parsePRD(response);
  }

  private parsePRD(response: string): PRD {
    // 解析 LLM 响应为结构化 PRD
    return {
      functionalRequirements: [],
      nonFunctionalRequirements: [],
      userStories: [],
      acceptanceCriteria: [],
      technicalConstraints: []
    };
  }
}

// packages/backend/src/agents/roles/architect.ts
export class ArchitectAgent extends Agent {
  async designSystem(prd: PRD): Promise<SystemDesign> {
    const prompt = `
作为系统架构师，基于以下 PRD 设计系统架构：

${JSON.stringify(prd, null, 2)}

请设计：
1. 系统架构图
2. 技术栈选择
3. 数据库设计
4. API 设计
5. 部署架构
`;

    const response = await this.llm.generate(prompt);
    return this.parseSystemDesign(response);
  }
}

// packages/backend/src/agents/roles/senior-engineer.ts
export class SeniorEngineerAgent extends Agent {
  async implementFeature(task: DevelopmentTask): Promise<Implementation> {
    const prompt = `
作为高级工程师，请实现以下功能：

任务：${task.description}
技术栈：${task.techStack}
设计文档：${task.design}

请生成：
1. 完整的代码实现
2. 单元测试
3. 文档注释
4. 错误处理
`;

    const response = await this.llm.generate(prompt);
    return this.parseImplementation(response);
  }
}
```

#### 2.2 工作流编排器实现
```typescript
// packages/backend/src/workflows/software-development-workflow.ts
export class SoftwareDevelopmentWorkflow {
  private company: SoftwareCompany;
  private eventBus: EventBus;

  constructor() {
    this.company = new SoftwareCompany();
    this.eventBus = new EventBus();
  }

  async execute(requirement: string): Promise<ProjectResult> {
    const workflowId = generateId();

    try {
      // 1. 需求分析阶段
      this.eventBus.emit('workflow:stage:start', {
        workflowId,
        stage: 'analysis'
      });

      const prd = await this.company.productManager.analyzePRD(requirement);

      this.eventBus.emit('workflow:stage:complete', {
        workflowId,
        stage: 'analysis',
        result: prd
      });

      // 2. 架构设计阶段
      this.eventBus.emit('workflow:stage:start', {
        workflowId,
        stage: 'design'
      });

      const design = await this.company.architect.designSystem(prd);

      // 3. 任务分解阶段
      const tasks = await this.company.projectManager.decomposeTasks(design);

      // 4. 并行开发阶段
      this.eventBus.emit('workflow:stage:start', {
        workflowId,
        stage: 'implementation'
      });

      const implementations = await Promise.all([
        this.company.frontendEngineer.implement(tasks.frontend),
        this.company.backendEngineer.implement(tasks.backend)
      ]);

      // 5. 质量保证阶段
      const tested = await this.company.qaEngineer.validate(implementations);

      // 6. 部署准备阶段
      const deployed = await this.company.devOpsEngineer.deploy(tested);

      this.eventBus.emit('workflow:complete', {
        workflowId,
        result: deployed
      });

      return deployed;

    } catch (error) {
      this.eventBus.emit('workflow:error', {
        workflowId,
        error: error.message
      });
      throw error;
    }
  }
}
```

#### 2.3 智能体协作环境
```typescript
// packages/backend/src/environment/collaboration-environment.ts
export class CollaborationEnvironment {
  private agents: Map<string, Agent>;
  private messageQueue: MessageQueue;
  private sharedMemory: SharedMemory;

  constructor() {
    this.agents = new Map();
    this.messageQueue = new MessageQueue();
    this.sharedMemory = new SharedMemory();
  }

  async registerAgent(agent: Agent): Promise<void> {
    this.agents.set(agent.id, agent);

    // 订阅消息
    agent.onMessage((message) => {
      this.handleAgentMessage(agent.id, message);
    });
  }

  async sendMessage(
    from: string,
    to: string,
    message: AgentMessage
  ): Promise<void> {
    const targetAgent = this.agents.get(to);
    if (!targetAgent) {
      throw new Error(`Agent ${to} not found`);
    }

    // 消息路由和处理
    await this.messageQueue.enqueue({
      from,
      to,
      message,
      timestamp: Date.now()
    });

    // 异步处理消息
    this.processMessageQueue();
  }

  private async processMessageQueue(): Promise<void> {
    while (!this.messageQueue.isEmpty()) {
      const queuedMessage = await this.messageQueue.dequeue();
      const targetAgent = this.agents.get(queuedMessage.to);

      if (targetAgent) {
        const result = await targetAgent.processMessage(queuedMessage.message);

        // 更新共享内存
        await this.sharedMemory.update(queuedMessage.to, result);

        // 广播结果给相关智能体
        await this.broadcastResult(queuedMessage.to, result);
      }
    }
  }
}
```

### Phase 3 详细步骤

#### 3.1 前端组件架构
```typescript
// packages/frontend/src/components/IDE/IDELayout.tsx
export const IDELayout: React.FC = () => {
  const { layout, panels } = useIDEStore();

  return (
    <div className="h-screen flex flex-col">
      {/* 顶部菜单栏 */}
      <MenuBar />

      <div className="flex-1 flex">
        {/* 左侧面板 */}
        <div className="w-64 border-r">
          {panels.fileExplorer && <FileExplorer />}
        </div>

        {/* 主编辑区域 */}
        <div className="flex-1 flex flex-col">
          <EditorTabs />
          <div className="flex-1 flex">
            <CodeEditor />
            {panels.preview && <PreviewPanel />}
          </div>
        </div>

        {/* 右侧面板 */}
        <div className="w-80 border-l">
          {panels.aiChat && <AIChatPanel />}
        </div>
      </div>

      {/* 底部面板 */}
      <div className="h-48 border-t">
        {panels.terminal && <TerminalPanel />}
      </div>

      {/* 状态栏 */}
      <StatusBar />
    </div>
  );
};
```

#### 3.2 AI 聊天界面集成
```typescript
// packages/frontend/src/components/AI/AIChatPanel.tsx
export const AIChatPanel: React.FC = () => {
  const { messages, sendMessage, activeWorkflow } = useAIStore();
  const [input, setInput] = useState('');

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    // 发送消息到后端
    await sendMessage({
      type: 'user_message',
      content: input,
      timestamp: Date.now()
    });

    setInput('');
  };

  return (
    <div className="h-full flex flex-col">
      {/* 智能体选择器 */}
      <AgentSelector />

      {/* 工作流进度 */}
      {activeWorkflow && <WorkflowProgress workflow={activeWorkflow} />}

      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
      </div>

      {/* 输入区域 */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="描述你想要实现的功能..."
            className="flex-1 px-3 py-2 border rounded"
          />
          <button
            onClick={handleSendMessage}
            className="px-4 py-2 bg-blue-500 text-white rounded"
          >
            发送
          </button>
        </div>
      </div>
    </div>
  );
};
```

#### 3.3 WebContainer 集成
```typescript
// packages/frontend/src/services/webcontainer/webcontainer-manager.ts
export class WebContainerManager {
  private container: WebContainer | null = null;
  private fileSystem: FileSystemManager;
  private terminal: TerminalManager;

  async initialize(): Promise<void> {
    if (this.container) return;

    try {
      this.container = await WebContainer.boot();
      this.fileSystem = new FileSystemManager(this.container);
      this.terminal = new TerminalManager(this.container);

      console.log('✅ WebContainer 初始化成功');
    } catch (error) {
      console.error('❌ WebContainer 初始化失败:', error);
      throw error;
    }
  }

  async createProject(template: ProjectTemplate): Promise<void> {
    if (!this.container) {
      throw new Error('WebContainer not initialized');
    }

    // 挂载项目文件
    await this.container.mount(template.files);

    // 安装依赖
    if (template.packageJson) {
      await this.installDependencies();
    }

    // 启动开发服务器
    if (template.devScript) {
      await this.startDevServer(template.devScript);
    }
  }

  async installDependencies(): Promise<void> {
    const installProcess = await this.container!.spawn('npm', ['install']);

    return new Promise((resolve, reject) => {
      installProcess.output.pipeTo(
        new WritableStream({
          write(data) {
            console.log('📦 安装依赖:', data);
          }
        })
      );

      installProcess.exit.then((code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`依赖安装失败，退出码: ${code}`));
        }
      });
    });
  }

  async startDevServer(script: string): Promise<void> {
    const devProcess = await this.container!.spawn('npm', ['run', script]);

    // 监听服务器启动
    devProcess.output.pipeTo(
      new WritableStream({
        write(data) {
          console.log('🚀 开发服务器:', data);

          // 检测服务器启动成功
          if (data.includes('Local:') || data.includes('localhost')) {
            // 通知前端服务器已启动
            window.dispatchEvent(new CustomEvent('dev-server-ready'));
          }
        }
      })
    );
  }
}
```

## 🔧 开发工具配置

### TypeScript 配置
```json
// tsconfig.json (根目录)
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "paths": {
      "@we0/shared/*": ["./packages/shared/src/*"],
      "@we0/backend/*": ["./packages/backend/src/*"],
      "@we0/frontend/*": ["./packages/frontend/src/*"]
    }
  },
  "references": [
    { "path": "./packages/backend" },
    { "path": "./packages/frontend" },
    { "path": "./packages/shared" }
  ]
}
```

### ESLint 配置
```json
// .eslintrc.json
{
  "root": true,
  "extends": [
    "@typescript-eslint/recommended",
    "prettier"
  ],
  "parser": "@typescript-eslint/parser",
  "plugins": ["@typescript-eslint"],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/explicit-function-return-type": "off"
  },
  "overrides": [
    {
      "files": ["packages/frontend/**/*"],
      "extends": ["plugin:react/recommended", "plugin:react-hooks/recommended"],
      "settings": {
        "react": { "version": "detect" }
      }
    }
  ]
}
```

### Docker 配置
```dockerfile
# Dockerfile
FROM node:20-alpine AS base
RUN corepack enable pnpm

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
COPY packages/backend/package.json ./packages/backend/
COPY packages/frontend/package.json ./packages/frontend/
COPY packages/shared/package.json ./packages/shared/
RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY . .
COPY --from=deps /app/node_modules ./node_modules
RUN pnpm build

FROM base AS runner
WORKDIR /app
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
COPY --from=builder /app/packages/backend/dist ./backend
COPY --from=builder /app/packages/frontend/dist ./frontend
USER nextjs
EXPOSE 3000 4000
CMD ["node", "backend/index.js"]
```

---

## 🚀 立即执行计划

### 第一步：立即开始 (今天)

#### 1.1 创建 Monorepo 结构
```bash
# 在 we0 根目录执行
cd /Users/louloulin/Documents/linchong/code/we0
mkdir -p intelligent-ide/{packages/{backend,frontend,shared},apps/{web,desktop}}
cd intelligent-ide

# 初始化 Monorepo
cat > package.json << 'EOF'
{
  "name": "intelligent-ide",
  "private": true,
  "workspaces": ["packages/*", "apps/*"],
  "scripts": {
    "dev": "concurrently \"npm run dev:backend\" \"npm run dev:frontend\"",
    "dev:backend": "cd packages/backend && npm run dev",
    "dev:frontend": "cd packages/frontend && npm run dev"
  },
  "devDependencies": {
    "concurrently": "^8.2.2"
  }
}
EOF

pnpm install
```

#### 1.2 迁移 codex 后端到 packages/backend
```bash
# 复制 codex 核心代码
cp -r ../apps/codex/src packages/backend/
cp ../apps/codex/package.json packages/backend/
cp ../apps/codex/tsconfig.json packages/backend/

# 更新 backend package.json
cd packages/backend
pnpm install
```

#### 1.3 迁移 we-dev-client 前端到 packages/frontend
```bash
# 复制 we-dev-client 核心代码
cp -r ../apps/we-dev-client/src packages/frontend/
cp ../apps/we-dev-client/package.json packages/frontend/
cp ../apps/we-dev-client/vite.config.ts packages/frontend/
cp ../apps/we-dev-client/tailwind.config.mjs packages/frontend/

# 更新 frontend package.json
cd packages/frontend
pnpm install
```

### 第二步：核心功能整合 (明天开始)

#### 2.1 后端 API 服务增强
```typescript
// packages/backend/src/server/app.ts
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

const app = express();
const server = createServer(app);
const io = new SocketIOServer(server, {
  cors: { origin: "*" }
});

// 中间件
app.use(cors());
app.use(express.json());

// API 路由
app.use('/api/ai', aiRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/projects', projectRoutes);

// WebSocket 连接
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join-project', (projectId) => {
    socket.join(projectId);
  });

  socket.on('file-change', (data) => {
    socket.to(data.projectId).emit('file-updated', data);
  });
});

server.listen(4000, () => {
  console.log('🚀 Backend server running on port 4000');
});
```

#### 2.2 前端 IDE 界面整合
```typescript
// packages/frontend/src/App.tsx
import { IDELayout } from './components/IDE/IDELayout';
import { AIProvider } from './providers/AIProvider';
import { WebContainerProvider } from './providers/WebContainerProvider';

export default function App() {
  return (
    <AIProvider>
      <WebContainerProvider>
        <IDELayout />
      </WebContainerProvider>
    </AIProvider>
  );
}
```

#### 2.3 智能体网络连接
```typescript
// packages/frontend/src/services/ai-service.ts
export class AIService {
  private socket: Socket;

  constructor() {
    this.socket = io('http://localhost:4000');
  }

  async sendMessage(message: string): Promise<void> {
    return new Promise((resolve) => {
      this.socket.emit('ai-request', { message });
      this.socket.once('ai-response', resolve);
    });
  }

  async startWorkflow(requirement: string): Promise<void> {
    this.socket.emit('start-workflow', { requirement });

    this.socket.on('workflow-progress', (progress) => {
      // 更新 UI 进度
      console.log('Workflow progress:', progress);
    });
  }
}
```

### 第三步：MetaGPT 集成 (第3-4天)

#### 3.1 专业角色智能体实现
```typescript
// packages/backend/src/agents/software-company.ts
export class SoftwareCompany {
  private agents: Map<string, Agent>;

  constructor() {
    this.agents = new Map([
      ['pm', new ProductManagerAgent()],
      ['architect', new ArchitectAgent()],
      ['engineer', new SeniorEngineerAgent()],
      ['qa', new QAEngineerAgent()]
    ]);
  }

  async executeProject(requirement: string): Promise<ProjectResult> {
    // 1. 产品需求分析
    const prd = await this.agents.get('pm')!.analyze(requirement);

    // 2. 系统架构设计
    const design = await this.agents.get('architect')!.design(prd);

    // 3. 代码实现
    const code = await this.agents.get('engineer')!.implement(design);

    // 4. 质量保证
    const tested = await this.agents.get('qa')!.validate(code);

    return tested;
  }
}
```

### 第四步：完整功能实现 (第5-10天)

#### 4.1 文件系统集成
```typescript
// packages/frontend/src/services/file-system.ts
export class FileSystemService {
  private webContainer: WebContainer;

  async createFile(path: string, content: string): Promise<void> {
    await this.webContainer.fs.writeFile(path, content);

    // 通知后端
    await fetch('/api/files', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path, content })
    });
  }

  async readFile(path: string): Promise<string> {
    return await this.webContainer.fs.readFile(path, 'utf-8');
  }
}
```

#### 4.2 实时预览系统
```typescript
// packages/frontend/src/components/Preview/PreviewPanel.tsx
export const PreviewPanel: React.FC = () => {
  const [previewUrl, setPreviewUrl] = useState<string>('');

  useEffect(() => {
    // 监听 WebContainer 服务器启动
    window.addEventListener('dev-server-ready', (event) => {
      setPreviewUrl('http://localhost:3000');
    });
  }, []);

  return (
    <div className="w-1/2 border-l">
      <div className="h-8 bg-gray-100 flex items-center px-4">
        <span className="text-sm">预览</span>
      </div>
      <iframe
        src={previewUrl}
        className="w-full h-full border-0"
        title="Preview"
      />
    </div>
  );
};
```

## 📊 关键技术决策

### 1. 架构选择
- **Monorepo**: 统一管理前后端代码
- **WebContainer**: 浏览器内运行完整开发环境
- **Socket.IO**: 实时通信和协作
- **Zustand**: 轻量级状态管理

### 2. AI 智能体架构
- **基于 Mastra**: 利用现有的智能体框架
- **MetaGPT 模式**: 专业角色分工协作
- **流式响应**: 实时显示 AI 工作进度
- **上下文感知**: 基于项目上下文的智能建议

### 3. 用户体验设计
- **VS Code 风格**: 熟悉的 IDE 界面
- **实时协作**: 多人同时编辑
- **智能提示**: AI 驱动的代码建议
- **项目模板**: 快速项目初始化

## 🎯 成功指标

### 技术指标
- [ ] **启动时间** < 3秒
- [ ] **代码补全延迟** < 100ms
- [ ] **AI 响应时间** < 5秒
- [ ] **文件操作响应** < 50ms
- [ ] **内存使用** < 500MB

### 功能指标
- [ ] **支持项目类型** > 10种
- [ ] **代码语言支持** > 15种
- [ ] **AI 智能体角色** = 8个
- [ ] **并发用户支持** > 100人
- [ ] **文件大小支持** < 10MB

### 用户体验指标
- [ ] **学习成本** < 30分钟
- [ ] **错误率** < 1%
- [ ] **用户满意度** > 90%
- [ ] **功能完整度** > 95%

## 🔄 迭代计划

### v1.0 (基础版本 - 2周)
- ✅ 基础 IDE 功能
- ✅ 简单 AI 对话
- ✅ 文件管理
- ✅ 代码编辑

### v1.1 (智能体版本 - 1周)
- ✅ MetaGPT 智能体集成
- ✅ 工作流编排
- ✅ 专业角色分工

### v1.2 (协作版本 - 1周)
- ✅ 实时协作
- ✅ 项目管理
- ✅ 版本控制

### v2.0 (企业版本 - 2周)
- ✅ 高级 AI 功能
- ✅ 企业级安全
- ✅ 性能优化
- ✅ 插件系统

---

## 🚀 基于 Mastra Client 的立即行动计划

### 第一步：环境验证和准备 (30分钟)

```bash
# 1. 验证 codex 服务状态
cd /Users/louloulin/Documents/linchong/code/we0/apps/codex
npm run dev  # 确保运行在 localhost:4111

# 2. 验证 we-dev-client 状态
cd /Users/louloulin/Documents/linchong/code/we0/apps/we-dev-client
npm run dev  # 确保运行在 localhost:3000

# 3. 测试 API 兼容性
curl -X POST http://localhost:4111/apix/intelligent-coding \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"测试"}],"stream":true}'
# 验证流式响应正常工作
```

### 第二步：安装 Mastra Client (今天下午)

```bash
# 在 we-dev-client 中安装 Mastra Client
cd /Users/louloulin/Documents/linchong/code/we0/apps/we-dev-client
pnpm add @mastra/client-js

# 创建 Mastra 服务目录
mkdir -p src/services/mastra
mkdir -p src/components/MetaGPT
```

### 第三步：实现 Mastra Client 集成 (明天)

```typescript
// 创建 Mastra Client 服务
// src/services/mastra/intelligent-coding-client.ts
import { MastraClient } from "@mastra/client-js";

export class IntelligentCodingClient {
  private mastraClient: MastraClient;

  constructor() {
    this.mastraClient = new MastraClient({
      baseUrl: "http://localhost:4111",
    });
  }

  async streamIntelligentCoding(prompt: string): Promise<ReadableStream> {
    const agent = this.mastraClient.getAgent("intelligent-coding-network");
    return await agent.stream({
      messages: [{ role: "user", content: prompt }]
    });
  }
}

// 替换现有的 AiChat 组件
// src/components/AiChat/index.tsx
import { IntelligentCodingClient } from '../../services/mastra/intelligent-coding-client';

const intelligentCodingClient = new IntelligentCodingClient();

const handleSendMessage = async (message: string) => {
  const stream = await intelligentCodingClient.streamIntelligentCoding(message);
  // 处理 Mastra 流式响应
};
```

### 第四步：MetaGPT 界面实现 (后天)

```typescript
// 实现 MetaGPT 多智能体可视化界面
// src/components/MetaGPT/MetaGPTWorkflow.tsx
export const MetaGPTWorkflow: React.FC = () => {
  // 实现智能体状态管理和工作流可视化
};
```

---

## 🎯 核心技术优势总结

### 1. **Mastra Client 原生集成** 📡
- ✅ **类型安全**: 完整的 TypeScript 支持
- ✅ **统一接口**: 标准化的智能体调用方式
- ✅ **错误处理**: 完善的错误处理和重试机制
- ✅ **流式响应**: 原生支持实时交互

### 2. **MetaGPT 多智能体架构** 🧠
- ✅ **专业分工**: 5个专业角色协作
- ✅ **标准流程**: 模拟真实软件开发团队
- ✅ **质量保证**: 多层次代码审查
- ✅ **可视化协作**: 实时显示智能体工作状态

### 3. **完整 IDE 体验** 🎨
- ✅ **现有优势保持**: 基于成熟的 we-dev-client
- ✅ **WebContainer 集成**: 浏览器内完整开发环境
- ✅ **实时协作**: 多人同时开发
- ✅ **跨平台支持**: Web + Electron 双模式

### 4. **超越 Cursor 的核心竞争力** 🚀
- 🎯 **多智能体 vs 单一 AI**: 专业团队协作模式
- 🌐 **Web 原生 vs 桌面限制**: 更好的可访问性
- 🔧 **完整工作流 vs 简单对话**: 系统性开发流程
- 📊 **项目级理解 vs 有限上下文**: 全局视野和深度分析

**🎉 通过 Mastra Client + MetaGPT 架构，我们将创造一个真正革命性的智能编程助手，在技术架构、用户体验和功能完整性上全面超越 Cursor！**

**立即开始执行，8-12天内交付下一代 AI IDE！** 🚀
