# 🚀 快速启动实施指南

基于plan7.md的全面规划，本指南提供了立即可执行的实施步骤，帮助团队快速启动下一代智能编程助手系统的开发。

## 📋 第一周实施清单

### Day 1-2: MCP协议研究和设计

#### 1. MCP协议深度研究
```bash
# 克隆MCP相关仓库进行研究
git clone https://github.com/modelcontextprotocol/specification
git clone https://github.com/modelcontextprotocol/typescript-sdk

# 研究现有MCP实现
cd typescript-sdk
npm install
npm run build
```

#### 2. 设计MCP集成架构
创建 `apps/codex/src/mcp/` 目录结构：
```
apps/codex/src/mcp/
├── client/
│   ├── MCPClient.ts
│   ├── MCPConnection.ts
│   └── MCPToolAdapter.ts
├── server/
│   ├── MCPServer.ts
│   ├── MCPToolExporter.ts
│   └── MCPResourceProvider.ts
├── bridge/
│   ├── MastraToMCPBridge.ts
│   └── MCPToMastraBridge.ts
└── types/
    ├── MCPTypes.ts
    └── MCPInterfaces.ts
```

#### 3. 实现基础MCP客户端
```typescript
// apps/codex/src/mcp/client/MCPClient.ts
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

export class MCPClient {
  private client: Client;
  private transport: StdioClientTransport;

  async connect(serverCommand: string[]): Promise<void> {
    this.transport = new StdioClientTransport({
      command: serverCommand[0],
      args: serverCommand.slice(1)
    });

    this.client = new Client({
      name: 'codex-mcp-client',
      version: '1.0.0'
    }, {
      capabilities: {
        tools: {},
        resources: {}
      }
    });

    await this.client.connect(this.transport);
  }

  async listTools(): Promise<any[]> {
    const response = await this.client.request(
      { method: 'tools/list' },
      { tools: [] }
    );
    return response.tools;
  }

  async callTool(name: string, arguments_: any): Promise<any> {
    const response = await this.client.request(
      { 
        method: 'tools/call',
        params: { name, arguments: arguments_ }
      },
      { content: [] }
    );
    return response;
  }
}
```

### Day 3-4: 核心工具重构

#### 1. 创建模块化工具基类
```typescript
// apps/codex/src/tools/base/BaseTool.ts
import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

export abstract class BaseTool {
  abstract name: string;
  abstract description: string;
  abstract inputSchema: z.ZodSchema;
  abstract outputSchema: z.ZodSchema;

  // 权限检查
  protected async checkPermission(
    action: string, 
    resource: string
  ): Promise<void> {
    const hasPermission = await this.permissionManager.check(
      this.currentUser,
      action,
      resource
    );
    
    if (!hasPermission) {
      throw new Error(`权限不足: ${action} on ${resource}`);
    }
  }

  // 审计日志
  protected async auditLog(
    action: string, 
    details: any
  ): Promise<void> {
    await this.auditLogger.log({
      user: this.currentUser.id,
      action,
      details,
      timestamp: new Date(),
      sessionId: this.sessionId
    });
  }

  // 创建Mastra工具
  createMastraTool() {
    return createTool({
      id: this.name,
      description: this.description,
      inputSchema: this.inputSchema,
      outputSchema: this.outputSchema,
      execute: async ({ context }) => {
        return await this.execute(context);
      }
    });
  }

  abstract execute(args: any): Promise<any>;
}
```

#### 2. 实现核心工具
```typescript
// apps/codex/src/tools/BashTool.ts
export class BashTool extends BaseTool {
  name = 'bash';
  description = '执行Shell命令';
  
  inputSchema = z.object({
    command: z.string().describe('要执行的Shell命令'),
    workingDir: z.string().optional().describe('工作目录'),
    timeout: z.number().optional().default(30000).describe('超时时间(ms)')
  });

  outputSchema = z.object({
    stdout: z.string(),
    stderr: z.string(),
    exitCode: z.number(),
    duration: z.number()
  });

  async execute(args: any): Promise<any> {
    const { command, workingDir, timeout } = args;
    
    // 权限检查
    await this.checkPermission('command.execute', command);
    
    // 安全检查
    await this.validateCommand(command);
    
    const startTime = Date.now();
    
    try {
      const result = await this.executeInSandbox(command, {
        cwd: workingDir,
        timeout
      });
      
      const duration = Date.now() - startTime;
      
      // 审计日志
      await this.auditLog('bash.execute', {
        command,
        exitCode: result.exitCode,
        duration
      });
      
      return {
        ...result,
        duration
      };
    } catch (error) {
      await this.auditLog('bash.error', {
        command,
        error: error.message
      });
      throw error;
    }
  }

  private async validateCommand(command: string): Promise<void> {
    // 危险命令检查
    const dangerousPatterns = [
      /rm\s+-rf\s+\//, // 删除根目录
      /dd\s+if=.*of=/, // 磁盘操作
      /mkfs/, // 格式化
      /fdisk/, // 分区操作
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(command)) {
        throw new Error(`危险命令被阻止: ${command}`);
      }
    }
  }
}
```

### Day 5-7: 终端界面开发

#### 1. 安装React Ink依赖
```bash
cd apps/we-dev-client
npm install ink react commander chalk boxen
npm install -D @types/react
```

#### 2. 创建终端UI组件
```typescript
// apps/we-dev-client/src/terminal/TerminalApp.tsx
import React, { useState, useEffect } from 'react';
import { render, Box, Text, useInput } from 'ink';
import { ChatInterface } from './components/ChatInterface';
import { CommandInput } from './components/CommandInput';
import { StatusBar } from './components/StatusBar';

interface TerminalAppProps {
  apiUrl: string;
  sessionId: string;
}

export const TerminalApp: React.FC<TerminalAppProps> = ({ 
  apiUrl, 
  sessionId 
}) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentCommand, setCurrentCommand] = useState('');

  const handleCommand = async (command: string) => {
    setIsLoading(true);
    
    try {
      const response = await fetch(`${apiUrl}/api/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: command,
          sessionId
        })
      });

      const result = await response.json();
      
      setMessages(prev => [...prev, {
        type: 'user',
        content: command,
        timestamp: new Date()
      }, {
        type: 'assistant',
        content: result.response,
        timestamp: new Date()
      }]);
    } catch (error) {
      setMessages(prev => [...prev, {
        type: 'error',
        content: `错误: ${error.message}`,
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box flexDirection="column" height="100%">
      <StatusBar sessionId={sessionId} isLoading={isLoading} />
      
      <Box flexGrow={1} flexDirection="column">
        <ChatInterface messages={messages} />
      </Box>
      
      <CommandInput 
        onSubmit={handleCommand}
        disabled={isLoading}
        value={currentCommand}
        onChange={setCurrentCommand}
      />
    </Box>
  );
};
```

#### 3. 创建CLI入口
```typescript
// apps/we-dev-client/src/cli/index.ts
#!/usr/bin/env node
import { Command } from 'commander';
import { render } from 'ink';
import React from 'react';
import { TerminalApp } from '../terminal/TerminalApp';

const program = new Command();

program
  .name('codex')
  .description('Codex AI编程助手')
  .version('1.0.0');

program
  .command('chat')
  .description('启动聊天界面')
  .option('-s, --session <id>', '会话ID')
  .option('-u, --url <url>', 'API地址', 'http://localhost:3000')
  .action((options) => {
    const sessionId = options.session || `session-${Date.now()}`;
    
    render(React.createElement(TerminalApp, {
      apiUrl: options.url,
      sessionId
    }));
  });

program
  .command('exec <command>')
  .description('执行单个命令')
  .option('-s, --session <id>', '会话ID')
  .action(async (command, options) => {
    const sessionId = options.session || `session-${Date.now()}`;
    
    try {
      const response = await fetch(`${options.url}/api/v1/tools/bash/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          command,
          sessionId
        })
      });

      const result = await response.json();
      console.log(result.stdout);
      
      if (result.stderr) {
        console.error(result.stderr);
      }
      
      process.exit(result.exitCode);
    } catch (error) {
      console.error(`错误: ${error.message}`);
      process.exit(1);
    }
  });

program.parse();
```

## 🔧 第二周实施计划

### Day 8-10: MCP服务器实现
1. 实现MCPServer类
2. 将现有Mastra工具暴露为MCP工具
3. 实现资源提供者接口
4. 添加工具权限控制

### Day 11-12: 权限管理系统
1. 设计三级权限模型
2. 实现权限检查中间件
3. 添加审计日志功能
4. 创建权限管理界面

### Day 13-14: 集成测试和优化
1. 编写单元测试和集成测试
2. 性能优化和内存管理
3. 错误处理和异常恢复
4. 文档编写和示例创建

## 📊 进度跟踪

### 完成标准
- [ ] MCP客户端可以连接外部服务器
- [ ] 核心工具重构完成并通过测试
- [ ] 终端界面可以正常交互
- [ ] 权限系统基本功能可用
- [ ] 集成测试通过率 > 80%

### 质量指标
- 代码覆盖率 > 70%
- 响应时间 < 2s
- 内存使用 < 512MB
- 错误率 < 5%

### 风险缓解
1. **技术风险**: 提前进行技术验证和原型开发
2. **时间风险**: 采用敏捷开发，每日站会跟踪进度
3. **质量风险**: 持续集成和自动化测试
4. **集成风险**: 早期集成测试和兼容性验证

## 🎯 成功指标

### 第一周目标
- ✅ 完成MCP协议研究和架构设计
- ✅ 实现基础MCP客户端
- ✅ 重构3个核心工具
- ✅ 创建终端UI原型

### 第二周目标
- 🎯 MCP服务器基本功能完成
- 🎯 权限管理系统可用
- 🎯 终端界面功能完整
- 🎯 集成测试通过

### 验收标准
1. 可以通过终端与AI助手交互
2. 可以执行基本的文件和命令操作
3. 权限控制正常工作
4. MCP工具可以正常调用
5. 性能指标达到要求

---

**实施负责人**: 开发团队  
**开始时间**: 2024年12月23日  
**预计完成**: 2025年1月5日  
**状态**: 准备启动 🚀
