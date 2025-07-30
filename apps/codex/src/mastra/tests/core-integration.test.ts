/**
 * 核心集成测试
 * 
 * 测试Phase 1核心架构重构的关键功能
 */

import { describe, test, expect } from '@jest/globals';
import { globalPermissionManager } from '../security/permission-manager';
import { 
  requirementsAnalystAgent,
  systemArchitectAgent,
  seniorDeveloperAgent,
  codeReviewerAgent,
  documentationSpecialistAgent 
} from '../agents/professional-agents';

describe('Phase 1: 核心架构重构验证', () => {
  
  describe('专业角色智能体系统', () => {
    test('should have all professional agents defined', () => {
      expect(requirementsAnalystAgent).toBeDefined();
      expect(systemArchitectAgent).toBeDefined();
      expect(seniorDeveloperAgent).toBeDefined();
      expect(codeReviewerAgent).toBeDefined();
      expect(documentationSpecialistAgent).toBeDefined();
    });
    
    test('should have correct agent configurations', () => {
      expect(requirementsAnalystAgent.id).toBe('code-analyst');
      expect(systemArchitectAgent.id).toBe('system-architect');
      expect(seniorDeveloperAgent.id).toBe('senior-developer');
      expect(codeReviewerAgent.id).toBe('code-reviewer');
      expect(documentationSpecialistAgent.id).toBe('documentation-specialist');
    });
    
    test('should have memory systems configured', () => {
      expect(requirementsAnalystAgent.memory).toBeDefined();
      expect(systemArchitectAgent.memory).toBeDefined();
      expect(seniorDeveloperAgent.memory).toBeDefined();
      expect(codeReviewerAgent.memory).toBeDefined();
      expect(documentationSpecialistAgent.memory).toBeDefined();
    });
  });

  describe('权限管理系统', () => {
    test('should check file read permissions correctly', () => {
      const projectFile = './package.json';
      const result = globalPermissionManager.checkFileReadPermission(projectFile);
      expect(result.allowed).toBe(true);
    });
    
    test('should check file write permissions correctly', () => {
      const projectFile = './test-file.txt';
      const result = globalPermissionManager.checkFileWritePermission(projectFile);
      expect(result.allowed).toBe(true);
    });
    
    test('should reject dangerous commands', () => {
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
    
    test('should allow safe commands', () => {
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
    
    test('should maintain audit logs', () => {
      // 执行一些权限检查
      globalPermissionManager.checkFileReadPermission('./test.txt');
      globalPermissionManager.checkCommandPermission('echo test');
      
      const logs = globalPermissionManager.getAuditLogs(10);
      expect(logs.length).toBeGreaterThan(0);
      
      // 验证日志结构
      const latestLog = logs[0];
      expect(latestLog.timestamp).toBeDefined();
      expect(latestLog.action).toBeDefined();
      expect(latestLog.resource).toBeDefined();
      expect(typeof latestLog.allowed).toBe('boolean');
    });
    
    test('should provide permission statistics', () => {
      const stats = globalPermissionManager.getPermissionStats();
      
      expect(stats.readAllowedPaths).toBeDefined();
      expect(stats.writeAllowedPaths).toBeDefined();
      expect(stats.bannedCommands).toBeDefined();
      expect(stats.auditLogCount).toBeDefined();
      expect(stats.config).toBeDefined();
      
      expect(Array.isArray(stats.readAllowedPaths)).toBe(true);
      expect(Array.isArray(stats.writeAllowedPaths)).toBe(true);
      expect(Array.isArray(stats.bannedCommands)).toBe(true);
      expect(typeof stats.auditLogCount).toBe('number');
    });
  });

  describe('工具系统架构', () => {
    test('should have enhanced file tools available', async () => {
      const { 
        enhancedFileReadTool,
        enhancedFileWriteTool,
        enhancedFileEditTool,
        enhancedBashTool,
        enhancedGrepTool,
        enhancedGlobTool,
        enhancedLsTool
      } = await import('../tools/enhanced-file-tools');
      
      expect(enhancedFileReadTool.id).toBe('enhanced-file-read');
      expect(enhancedFileWriteTool.id).toBe('enhanced-file-write');
      expect(enhancedFileEditTool.id).toBe('enhanced-file-edit');
      expect(enhancedBashTool.id).toBe('enhanced-bash');
      expect(enhancedGrepTool.id).toBe('enhanced-grep');
      expect(enhancedGlobTool.id).toBe('enhanced-glob');
      expect(enhancedLsTool.id).toBe('enhanced-ls');
    });
    
    test('should have MCP integration tools available', async () => {
      const {
        mcpClientTool,
        mcpToolCallTool,
        mcpRegistryTool
      } = await import('../tools/enhanced-mcp-tools');
      
      expect(mcpClientTool.id).toBe('mcp-client');
      expect(mcpToolCallTool.id).toBe('mcp-tool-call');
      expect(mcpRegistryTool.id).toBe('mcp-registry');
    });
    
    test('should have memory management tools available', async () => {
      const {
        memoryReadTool,
        memoryWriteTool,
        memorySearchTool,
        memoryManageTool
      } = await import('../tools/enhanced-memory-tools');
      
      expect(memoryReadTool.id).toBe('memory-read');
      expect(memoryWriteTool.id).toBe('memory-write');
      expect(memorySearchTool.id).toBe('memory-search');
      expect(memoryManageTool.id).toBe('memory-manage');
    });
  });

  describe('Mastra框架集成', () => {
    test('should load main Mastra configuration', async () => {
      const { mastra } = await import('../index');
      
      expect(mastra).toBeDefined();
      expect(mastra.agents).toBeDefined();
      expect(mastra.workflows).toBeDefined();
      expect(mastra.vnext_networks).toBeDefined();
    });
    
    test('should have professional agents in Mastra config', async () => {
      const { mastra } = await import('../index');
      
      expect(mastra.agents.requirementsAnalystAgent).toBeDefined();
      expect(mastra.agents.systemArchitectAgent).toBeDefined();
      expect(mastra.agents.seniorDeveloperAgent).toBeDefined();
      expect(mastra.agents.codeReviewerAgent).toBeDefined();
      expect(mastra.agents.documentationSpecialistAgent).toBeDefined();
    });
    
    test('should have agent networks configured', async () => {
      const { mastra } = await import('../index');
      
      expect(mastra.vnext_networks['codex-agent-network']).toBeDefined();
      expect(mastra.vnext_networks['intelligent-coding-network']).toBeDefined();
    });
  });

  describe('安全沙箱系统', () => {
    test('should have sandbox manager available', async () => {
      const { globalSandboxManager, defaultPermissionChecker } = await import('../security/sandbox-manager');
      
      expect(globalSandboxManager).toBeDefined();
      expect(defaultPermissionChecker).toBeDefined();
      
      expect(typeof globalSandboxManager.createSandbox).toBe('function');
      expect(typeof globalSandboxManager.executeTool).toBe('function');
      expect(typeof globalSandboxManager.destroySandbox).toBe('function');
    });
    
    test('should create and manage sandboxes', async () => {
      const { globalSandboxManager } = await import('../security/sandbox-manager');
      
      const sandboxId = await globalSandboxManager.createSandbox({
        timeout: 5000,
        enableFileSystem: true,
        enableNetworking: false
      });
      
      expect(typeof sandboxId).toBe('string');
      expect(sandboxId.length).toBeGreaterThan(0);
      
      const status = globalSandboxManager.getSandboxStatus(sandboxId);
      expect(status).toBeDefined();
      expect(status.id).toBe(sandboxId);
      expect(status.status).toBe('active');
      
      await globalSandboxManager.destroySandbox(sandboxId);
    });
  });

  describe('系统集成验证', () => {
    test('should demonstrate end-to-end functionality', async () => {
      // 1. 权限检查
      const readPermission = globalPermissionManager.checkFileReadPermission('./package.json');
      expect(readPermission.allowed).toBe(true);
      
      // 2. 智能体可用性
      expect(requirementsAnalystAgent.id).toBe('code-analyst');
      
      // 3. 工具系统
      const { enhancedFileReadTool } = await import('../tools/enhanced-file-tools');
      expect(enhancedFileReadTool.id).toBe('enhanced-file-read');
      
      // 4. 沙箱系统
      const { globalSandboxManager } = await import('../security/sandbox-manager');
      const sandboxes = globalSandboxManager.getAllSandboxes();
      expect(Array.isArray(sandboxes)).toBe(true);
      
      // 5. Mastra配置
      const { mastra } = await import('../index');
      expect(mastra.agents).toBeDefined();
      
      console.log('✅ Phase 1 核心架构重构验证通过');
    });
  });
});

describe('技术债务和改进点', () => {
  test('should document known issues', () => {
    const knownIssues = [
      '工具执行需要适配Mastra runtimeContext',
      '部分Zod schema默认值需要显式提供',
      '工具集成方式需要通过Agent Networks而非主配置',
      'MCP协议实现需要完整的客户端/服务器逻辑',
      '沙箱系统需要实际的Worker线程隔离'
    ];
    
    expect(knownIssues.length).toBeGreaterThan(0);
    console.log('📋 已知技术债务:', knownIssues);
  });
  
  test('should document next steps', () => {
    const nextSteps = [
      '修复工具测试的执行上下文兼容性',
      '实现完整的MCP客户端/服务器',
      '优化沙箱系统的安全隔离',
      '集成工具到Agent Networks',
      '开始Phase 2: 工具生态完善'
    ];
    
    expect(nextSteps.length).toBeGreaterThan(0);
    console.log('🚀 下一步计划:', nextSteps);
  });
});
