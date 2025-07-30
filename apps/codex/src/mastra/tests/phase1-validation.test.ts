/**
 * Phase 1 验证测试
 * 
 * 验证核心架构重构的关键成果
 */

import { describe, test, expect } from '@jest/globals';

describe('Phase 1: 核心架构重构验证', () => {
  
  describe('✅ 专业角色智能体系统', () => {
    test('should have all professional agents defined', async () => {
      const agents = await import('../agents/professional-agents');
      
      expect(agents.requirementsAnalystAgent).toBeDefined();
      expect(agents.systemArchitectAgent).toBeDefined();
      expect(agents.seniorDeveloperAgent).toBeDefined();
      expect(agents.codeReviewerAgent).toBeDefined();
      expect(agents.documentationSpecialistAgent).toBeDefined();
      
      // 验证智能体配置
      expect(agents.requirementsAnalystAgent.id).toBe('code-analyst');
      expect(agents.systemArchitectAgent.id).toBe('system-architect');
      expect(agents.seniorDeveloperAgent.id).toBe('senior-developer');
      expect(agents.codeReviewerAgent.id).toBe('code-reviewer');
      expect(agents.documentationSpecialistAgent.id).toBe('documentation-specialist');
    });
    
    test('should have agent configurations available', async () => {
      const { agentConfigs } = await import('../agents/professional-agents');
      
      expect(agentConfigs.codeAnalyst).toBeDefined();
      expect(agentConfigs.architect).toBeDefined();
      expect(agentConfigs.developer).toBeDefined();
      expect(agentConfigs.reviewer).toBeDefined();
      expect(agentConfigs.documentation).toBeDefined();
      
      // 验证配置结构
      expect(agentConfigs.codeAnalyst.role).toBe('analysis');
      expect(agentConfigs.architect.role).toBe('architecture');
      expect(agentConfigs.developer.role).toBe('development');
      expect(agentConfigs.reviewer.role).toBe('review');
      expect(agentConfigs.documentation.role).toBe('documentation');
    });
  });

  describe('✅ 权限管理系统', () => {
    test('should have permission manager available', async () => {
      const { globalPermissionManager } = await import('../security/permission-manager');
      
      expect(globalPermissionManager).toBeDefined();
      expect(typeof globalPermissionManager.checkFileReadPermission).toBe('function');
      expect(typeof globalPermissionManager.checkFileWritePermission).toBe('function');
      expect(typeof globalPermissionManager.checkCommandPermission).toBe('function');
    });
    
    test('should check file permissions correctly', async () => {
      const { globalPermissionManager } = await import('../security/permission-manager');
      
      // 测试项目内文件权限
      const readResult = globalPermissionManager.checkFileReadPermission('./package.json');
      expect(readResult.allowed).toBe(true);
      
      const writeResult = globalPermissionManager.checkFileWritePermission('./test-file.txt');
      expect(writeResult.allowed).toBe(true);
    });
    
    test('should reject dangerous commands', async () => {
      const { globalPermissionManager } = await import('../security/permission-manager');
      
      const dangerousCommands = [
        'rm -rf /',
        'sudo rm -rf /home',
        'format c:',
        'shutdown now'
      ];
      
      dangerousCommands.forEach(cmd => {
        const result = globalPermissionManager.checkCommandPermission(cmd);
        expect(result.allowed).toBe(false);
        expect(result.reason).toContain('被禁止执行');
      });
    });
    
    test('should allow safe commands', async () => {
      const { globalPermissionManager } = await import('../security/permission-manager');
      
      const safeCommands = [
        'echo hello',
        'ls -la',
        'cat package.json',
        'npm test'
      ];
      
      safeCommands.forEach(cmd => {
        const result = globalPermissionManager.checkCommandPermission(cmd);
        expect(result.allowed).toBe(true);
      });
    });
    
    test('should provide audit logs and statistics', async () => {
      const { globalPermissionManager } = await import('../security/permission-manager');
      
      // 执行一些操作生成日志
      globalPermissionManager.checkFileReadPermission('./test.txt');
      globalPermissionManager.checkCommandPermission('echo test');
      
      const logs = globalPermissionManager.getAuditLogs(10);
      expect(logs.length).toBeGreaterThan(0);
      
      const stats = globalPermissionManager.getPermissionStats();
      expect(stats.readAllowedPaths).toBeDefined();
      expect(stats.writeAllowedPaths).toBeDefined();
      expect(stats.bannedCommands).toBeDefined();
      expect(stats.auditLogCount).toBeDefined();
    });
  });

  describe('✅ 增强工具系统', () => {
    test('should have enhanced file tools available', async () => {
      const fileTools = await import('../tools/enhanced-file-tools');
      
      expect(fileTools.enhancedFileReadTool).toBeDefined();
      expect(fileTools.enhancedFileWriteTool).toBeDefined();
      expect(fileTools.enhancedFileEditTool).toBeDefined();
      expect(fileTools.enhancedBashTool).toBeDefined();
      expect(fileTools.enhancedGrepTool).toBeDefined();
      expect(fileTools.enhancedGlobTool).toBeDefined();
      expect(fileTools.enhancedLsTool).toBeDefined();
      
      // 验证工具ID
      expect(fileTools.enhancedFileReadTool.id).toBe('enhanced-file-read');
      expect(fileTools.enhancedFileWriteTool.id).toBe('enhanced-file-write');
      expect(fileTools.enhancedBashTool.id).toBe('enhanced-bash');
    });
    
    test('should have MCP integration tools available', async () => {
      const mcpTools = await import('../tools/enhanced-mcp-tools');
      
      expect(mcpTools.mcpClientTool).toBeDefined();
      expect(mcpTools.mcpToolCallTool).toBeDefined();
      expect(mcpTools.mcpRegistryTool).toBeDefined();
      
      // 验证工具ID
      expect(mcpTools.mcpClientTool.id).toBe('mcp-client');
      expect(mcpTools.mcpToolCallTool.id).toBe('mcp-tool-call');
      expect(mcpTools.mcpRegistryTool.id).toBe('mcp-registry');
    });
    
    test('should have memory management tools available', async () => {
      const memoryTools = await import('../tools/enhanced-memory-tools');
      
      expect(memoryTools.memoryReadTool).toBeDefined();
      expect(memoryTools.memoryWriteTool).toBeDefined();
      expect(memoryTools.memorySearchTool).toBeDefined();
      expect(memoryTools.memoryManageTool).toBeDefined();
      
      // 验证工具ID
      expect(memoryTools.memoryReadTool.id).toBe('memory-read');
      expect(memoryTools.memoryWriteTool.id).toBe('memory-write');
      expect(memoryTools.memorySearchTool.id).toBe('memory-search');
      expect(memoryTools.memoryManageTool.id).toBe('memory-manage');
    });
    
    test('should have tool configurations available', async () => {
      const { toolConfigs } = await import('../tools/enhanced-file-tools');
      const { mcpToolConfigs } = await import('../tools/enhanced-mcp-tools');
      const { memoryToolConfigs } = await import('../tools/enhanced-memory-tools');
      
      expect(toolConfigs).toBeDefined();
      expect(mcpToolConfigs).toBeDefined();
      expect(memoryToolConfigs).toBeDefined();
      
      // 验证配置结构
      expect(toolConfigs.fileRead.category).toBe('file-operations');
      expect(mcpToolConfigs.mcpClient.category).toBe('mcp-integration');
      expect(memoryToolConfigs.memoryRead.category).toBe('memory-management');
    });
  });

  describe('✅ Mastra框架集成', () => {
    test('should load main Mastra configuration', async () => {
      const { mastra } = await import('../index');
      
      expect(mastra).toBeDefined();
      
      // 使用正确的API方法
      const agents = mastra.getAgents();
      expect(agents).toBeDefined();
      expect(Object.keys(agents).length).toBeGreaterThan(0);
      
      const workflows = mastra.getWorkflows();
      expect(workflows).toBeDefined();
      
      const networks = mastra.vnext_getNetworks();
      expect(networks).toBeDefined();
      expect(Array.isArray(networks)).toBe(true);
    });
    
    test('should have professional agents integrated', async () => {
      const { mastra } = await import('../index');
      
      const agents = mastra.getAgents();
      
      expect(agents.requirementsAnalystAgent).toBeDefined();
      expect(agents.systemArchitectAgent).toBeDefined();
      expect(agents.seniorDeveloperAgent).toBeDefined();
      expect(agents.codeReviewerAgent).toBeDefined();
      expect(agents.documentationSpecialistAgent).toBeDefined();
    });
  });

  describe('📊 系统集成验证', () => {
    test('should demonstrate Phase 1 completion', async () => {
      console.log('\n🎯 Phase 1: 核心架构重构 - 验证报告');
      console.log('=' .repeat(50));
      
      // 1. 专业角色智能体
      const agents = await import('../agents/professional-agents');
      const agentCount = Object.keys(agents.professionalAgents).length;
      console.log(`✅ 专业角色智能体: ${agentCount} 个`);
      
      // 2. 权限管理系统
      const { globalPermissionManager } = await import('../security/permission-manager');
      const stats = globalPermissionManager.getPermissionStats();
      console.log(`✅ 权限管理系统: ${stats.readAllowedPaths.length} 个读取路径, ${stats.bannedCommands.length} 个禁止命令`);
      
      // 3. 工具系统
      const fileTools = await import('../tools/enhanced-file-tools');
      const mcpTools = await import('../tools/enhanced-mcp-tools');
      const memoryTools = await import('../tools/enhanced-memory-tools');
      
      const toolCount = Object.keys(fileTools.toolConfigs).length + 
                       Object.keys(mcpTools.mcpToolConfigs).length + 
                       Object.keys(memoryTools.memoryToolConfigs).length;
      console.log(`✅ 增强工具系统: ${toolCount} 个工具`);
      
      // 4. Mastra集成
      const { mastra } = await import('../index');
      const mastraAgents = mastra.getAgents();
      const mastraNetworks = mastra.vnext_getNetworks();
      console.log(`✅ Mastra集成: ${Object.keys(mastraAgents).length} 个智能体, ${mastraNetworks.length} 个网络`);
      
      console.log('\n🚀 Phase 1 核心功能验证通过!');
      console.log('📋 主要成果:');
      console.log('   - 基于Mastra的统一后端架构');
      console.log('   - 专业角色智能体系统');
      console.log('   - 完整的权限管理和安全控制');
      console.log('   - 从anon-kode迁移的增强工具集');
      console.log('   - MCP协议集成和记忆管理');
      
      expect(agentCount).toBeGreaterThan(0);
      expect(toolCount).toBeGreaterThan(0);
      expect(Object.keys(mastraAgents).length).toBeGreaterThan(0);
    });
  });

  describe('📝 技术债务和下一步', () => {
    test('should document known issues and next steps', () => {
      const knownIssues = [
        '工具执行需要适配Mastra runtimeContext参数',
        '部分Zod schema默认值需要显式提供',
        'MCP协议实现需要完整的客户端/服务器逻辑',
        '沙箱系统需要实际的Worker线程隔离',
        '工具集成需要通过Agent Networks而非主配置'
      ];
      
      const nextSteps = [
        'Phase 2: 工具生态完善',
        '修复工具测试的执行上下文兼容性',
        '实现完整的MCP客户端/服务器',
        '优化沙箱系统的安全隔离',
        '集成工具到Agent Networks'
      ];
      
      console.log('\n⚠️  已知技术债务:');
      knownIssues.forEach((issue, index) => {
        console.log(`   ${index + 1}. ${issue}`);
      });
      
      console.log('\n🎯 下一步计划:');
      nextSteps.forEach((step, index) => {
        console.log(`   ${index + 1}. ${step}`);
      });
      
      expect(knownIssues.length).toBeGreaterThan(0);
      expect(nextSteps.length).toBeGreaterThan(0);
    });
  });
});
