# Codex 文件更新修复测试

## 修复内容总结

### 1. 主要问题
- ❌ Codex 的 AI 不知道应该生成 boltArtifact 格式的输出
- ❌ 缺少文件上下文处理
- ❌ 缺少强制 XML 输出指令
- ❌ 流式转换可能不正确处理 XML 标签

### 2. 修复措施

#### A. 更新了 `api-routes.ts` 中的 `handleBuilderMode`
- ✅ 添加了文件处理逻辑 `processFiles(messages)`
- ✅ 添加了项目类型检测 `determineProjectType(files)`
- ✅ 添加了系统提示词构建 `buildSystemPromptForMastra`
- ✅ 添加了强制 XML 格式指令
- ✅ 添加了文件上下文处理

#### B. 更新了 `multi-model-agent.ts` 中的 Builder Agent
- ✅ 添加了完整的 boltArtifact 格式指令
- ✅ 添加了详细的输出格式示例
- ✅ 强调了必须使用 XML 格式，不能使用 markdown

#### C. 改进了 `convertMastraStreamToAISDK` 函数
- ✅ 更好地处理 XML 标签转义
- ✅ 正确处理特殊字符

#### D. 添加了工具函数
- ✅ `estimateTokens` - 估算 token 数量
- ✅ `buildSystemPromptForMastra` - 构建系统提示词
- ✅ 改进了 `filterFiles` 函数

## 测试步骤

### 1. 启动 Codex 服务
```bash
cd apps/codex
pnpm dev
```

### 2. 测试文件更新功能
发送一个创建简单 React 组件的请求，检查：
- AI 是否生成了 `<boltArtifact>` 标签
- 是否包含了 `<boltAction type="file" filePath="...">` 标签
- 前端是否能正确解析并更新文件

### 3. 预期输出格式
```xml
<boltArtifact id="react-component" title="React Component">
  <boltAction type="file" filePath="src/components/Example.jsx">
    import React from 'react';
    
    export default function Example() {
      return <div>Hello World</div>;
    }
  </boltAction>
</boltArtifact>
```

### 4. 验证点
- [ ] AI 生成的响应包含正确的 boltArtifact 格式
- [ ] 前端能够解析文件内容
- [ ] 文件能够正确更新到项目中
- [ ] 流式响应正常工作
- [ ] 没有格式错误或转义问题

## 关键修复点

1. **系统提示词**: 现在包含了完整的 boltArtifact 格式指令
2. **强制指令**: "output must be XML format using boltArtifact tags!!"
3. **文件上下文**: AI 现在了解当前项目的文件结构
4. **完整示例**: Agent 指令中包含了详细的输出格式示例
5. **流式处理**: 改进了 XML 内容的转义处理

这些修复应该能够解决文件更新不生效的问题，使 Codex 能够像 we-dev-next 一样正常工作。
