# DeepSeek LLM Provider for Mastra

## 🎯 概述

本项目成功集成了 DeepSeek AI 作为 Mastra 框架的 LLM 提供者，提供强大的代码生成、分析和文档编写能力。

## 🚀 快速开始

### 1. 环境配置

在 `.env` 文件中添加 DeepSeek API 配置：

```bash
# DeepSeek AI Configuration
DEEPSEEK_API_KEY=your-deepseek-api-key
DEEPSEEK_BASE_URL=https://api.deepseek.com
```

### 2. 启动服务

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm run dev
```

### 3. 访问界面

打开浏览器访问 Mastra 开发界面，选择 DeepSeek 代理开始使用。

## 🤖 可用代理

### DeepSeek Agent (通用开发助手)

专注于软件开发和技术问题解决的通用助手。

**核心能力：**
- 代码开发和优化
- 架构设计指导
- 技术问题解决
- 开发流程建议

**使用示例：**
```typescript
const response = await deepseekAgent.generate(
  "帮我设计一个用户认证系统的架构，包括JWT令牌管理和权限控制"
);
```

### DeepSeek Coder (专业编程助手)

专门针对编程任务优化的代理。

**核心能力：**
- 代码生成和重构
- 代码审查和分析
- 调试协助
- 测试编写

**使用示例：**
```typescript
const response = await deepseekCoderAgent.generate(
  "生成一个TypeScript的用户管理API，包括CRUD操作和数据验证",
  { tools: ['code-generator'] }
);
```

## 🛠️ 可用工具

### 1. 代码生成工具 (codeGeneratorTool)

生成各种类型的代码结构。

**支持类型：**
- `function` - 函数生成
- `class` - 类生成
- `component` - 组件生成
- `api` - API 接口生成
- `test` - 测试代码生成
- `config` - 配置文件生成
- `schema` - 数据模式生成
- `project` - 完整项目生成

**使用示例：**
```typescript
const result = await codeGeneratorTool.execute({
  context: {
    type: 'function',
    language: 'typescript',
    description: '计算两个数字的和',
    requirements: ['添加类型检查', '包含错误处理'],
    style: 'production'
  }
});
```

### 2. 代码分析工具 (codeAnalysisTool)

分析代码质量和性能问题。

**分析类型：**
- `quality` - 代码质量
- `performance` - 性能分析
- `security` - 安全检查
- `maintainability` - 可维护性
- `complexity` - 复杂度分析
- `best-practices` - 最佳实践检查

**使用示例：**
```typescript
const analysis = await codeAnalysisTool.execute({
  context: {
    code: 'function add(a, b) { return a + b; }',
    language: 'javascript',
    analysisType: ['quality', 'security'],
    severity: 'medium'
  }
});
```

### 3. 项目结构工具 (projectStructureTool)

生成完整的项目脚手架。

**项目类型：**
- `web-app` - Web 应用
- `api` - API 服务
- `library` - 库项目
- `cli` - 命令行工具
- `mobile-app` - 移动应用
- `desktop-app` - 桌面应用
- `microservice` - 微服务

**使用示例：**
```typescript
const project = await projectStructureTool.execute({
  context: {
    projectType: 'web-app',
    language: 'typescript',
    framework: 'react',
    features: ['auth', 'database', 'testing'],
    name: 'my-awesome-app'
  }
});
```

### 4. 文档生成工具

#### documentationTool - 通用文档生成
```typescript
const docs = await documentationTool.execute({
  context: {
    type: 'readme',
    content: '项目描述和功能说明',
    format: 'markdown',
    audience: 'developer',
    includeExamples: true
  }
});
```

#### apiDocumentationTool - API 文档生成
```typescript
const apiDocs = await apiDocumentationTool.execute({
  context: {
    source: 'openapi',
    content: 'OpenAPI 规范内容',
    includeExamples: true,
    authType: 'bearer',
    baseUrl: 'https://api.example.com'
  }
});
```

#### codeCommentTool - 代码注释生成
```typescript
const commented = await codeCommentTool.execute({
  context: {
    code: '// 你的代码',
    language: 'typescript',
    style: 'jsdoc',
    includeTypes: true,
    verbosity: 'comprehensive'
  }
});
```

## 🧪 测试

### 运行基本测试

```bash
# 运行简单的集成测试
node src/test/simple-test.js

# 运行完整的测试套件（需要 Jest）
npm test
```

### 测试内容

- ✅ 模块导入和配置验证
- ✅ 环境变量检查
- ✅ 依赖包验证
- ✅ 代码结构检查
- ✅ 工具功能验证
- ✅ API 集成测试（需要 API 密钥）

## 📁 项目结构

```
src/mastra/
├── models/
│   └── deepseek.ts              # DeepSeek 模型配置
├── agents/
│   └── deepseek-agent.ts        # DeepSeek 代理实现
├── tools/
│   ├── code-generator-tool.ts   # 代码生成工具
│   └── documentation-tool.ts    # 文档生成工具
├── workflows/
│   └── deepseek-workflow.ts     # DeepSeek 工作流（开发中）
└── index.ts                     # 主配置文件

test/
├── deepseek-integration.test.ts # 完整测试套件
├── run-tests.ts                 # 测试运行器
└── simple-test.js               # 基本验证测试
```

## 🔧 配置选项

### DeepSeek 模型配置

```typescript
// 可用模型
export const DEEPSEEK_MODELS = {
  CHAT: 'deepseek-chat',      // 通用对话模型
  CODER: 'deepseek-coder',    // 编程专用模型
  CHAT_V2: 'deepseek-chat-v2',
  CODER_V2: 'deepseek-coder-v2',
};

// 模型参数配置
export const DEEPSEEK_CONFIG = {
  maxTokens: {
    'deepseek-chat': 4096,
    'deepseek-coder': 4096,
  },
  defaultParams: {
    temperature: 0.7,
    top_p: 0.9,
    max_tokens: 2048,
  },
};
```

## 🚨 故障排除

### 常见问题

1. **API 密钥错误**
   - 确保 `DEEPSEEK_API_KEY` 正确设置
   - 检查 API 密钥是否有效

2. **模块导入错误**
   - 运行 `pnpm install` 确保依赖安装完整
   - 检查 TypeScript 配置

3. **工具执行失败**
   - 检查输入参数格式
   - 查看错误日志获取详细信息

### 调试模式

启用详细日志：
```bash
DEBUG=mastra:* pnpm run dev
```

## 🤝 贡献

欢迎提交 Issue 和 Pull Request 来改进 DeepSeek 集成功能。

## 📄 许可证

本项目遵循 MIT 许可证。
