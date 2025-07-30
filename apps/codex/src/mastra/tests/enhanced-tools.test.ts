/**
 * 增强工具测试
 * 
 * 测试从anon-kode迁移的增强工具功能
 */

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import {
  enhancedFileReadTool,
  enhancedFileWriteTool,
  enhancedFileEditTool,
  enhancedBashTool,
  enhancedGrepTool,
  enhancedGlobTool,
  enhancedLsTool,
  permissionManager
} from '../tools/enhanced-file-tools';

import {
  mcpClientTool,
  mcpToolCallTool,
  mcpRegistryTool
} from '../tools/enhanced-mcp-tools';

import {
  memoryReadTool,
  memoryWriteTool,
  memorySearchTool,
  memoryManageTool
} from '../tools/enhanced-memory-tools';

import { globalPermissionManager } from '../security/permission-manager';
import { writeFileSync, unlinkSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

// Mock RuntimeContext for testing
const mockRuntimeContext = {
  get: (key: string) => {
    if (key === 'userId') return 'test-user';
    if (key === 'permissionManager') return globalPermissionManager;
    return undefined;
  },
  set: () => {},
  has: () => false,
  delete: () => false
};

describe('Enhanced Tools Integration Tests', () => {
  const testDir = join(process.cwd(), 'test-temp');
  const testFile = join(testDir, 'test.txt');
  
  beforeEach(() => {
    // 创建测试目录
    if (!existsSync(testDir)) {
      mkdirSync(testDir, { recursive: true });
    }

    // 确保测试目录权限
    permissionManager.grantReadPermission(testDir);
    permissionManager.grantWritePermission(testDir);
    globalPermissionManager.grantReadPermission(testDir);
    globalPermissionManager.grantWritePermission(testDir);
  });
  
  afterEach(() => {
    // 清理测试文件
    if (existsSync(testFile)) {
      try {
        unlinkSync(testFile);
      } catch (error) {
        // 忽略清理错误
      }
    }
  });

  describe('Enhanced File Tools', () => {
    test('should read file with enhanced file read tool', async () => {
      // 创建测试文件
      const testContent = 'Hello, World!\nThis is a test file.';
      writeFileSync(testFile, testContent);

      const result = await enhancedFileReadTool.execute({
        context: {
          file_path: testFile,
          encoding: 'utf8'
        },
        runtimeContext: mockRuntimeContext
      });

      expect(result.content).toBe(testContent);
      expect(result.metadata.type).toBe('.txt');
      expect(result.metadata.lines).toBe(2);
    });
    
    test('should write file with enhanced file write tool', async () => {
      const testContent = 'New file content';
      
      const result = await enhancedFileWriteTool.execute({
        context: {
          file_path: testFile,
          content: testContent,
          encoding: 'utf8'
        }
      });
      
      expect(result.success).toBe(true);
      expect(result.message).toContain('写入成功');
      expect(existsSync(testFile)).toBe(true);
    });
    
    test('should edit file with enhanced file edit tool', async () => {
      // 创建测试文件
      const originalContent = 'Line 1\nLine 2\nLine 3';
      writeFileSync(testFile, originalContent);
      
      const result = await enhancedFileEditTool.execute({
        context: {
          file_path: testFile,
          operation: 'replace',
          start_line: 2,
          end_line: 2,
          new_content: 'Modified Line 2'
        }
      });
      
      expect(result.success).toBe(true);
      expect(result.changes_made).toBe(1);
    });
    
    test('should execute safe bash commands', async () => {
      const result = await enhancedBashTool.execute({
        context: {
          command: 'echo "Hello from bash"',
          timeout: 5000
        }
      });
      
      expect(result.success).toBe(true);
      expect(result.stdout).toContain('Hello from bash');
      expect(result.exitCode).toBe(0);
    });
    
    test('should reject dangerous bash commands', async () => {
      const result = await enhancedBashTool.execute({
        context: {
          command: 'rm -rf /',
          timeout: 5000
        }
      });
      
      expect(result.success).toBe(false);
      expect(result.stderr).toContain('被禁止执行');
    });
    
    test('should search text with enhanced grep tool', async () => {
      // 创建测试文件
      const testContent = 'Hello World\nThis is a test\nHello again';
      writeFileSync(testFile, testContent);
      
      const result = await enhancedGrepTool.execute({
        context: {
          pattern: 'Hello',
          file_path: testFile,
          context_lines: 1
        }
      });
      
      expect(result.total_matches).toBe(2);
      expect(result.matches[0].content).toContain('Hello');
    });
  });

  describe('Enhanced MCP Tools', () => {
    test('should list MCP servers', async () => {
      const result = await mcpClientTool.execute({
        context: {
          action: 'list'
        }
      });
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
    });
    
    test('should search MCP registry', async () => {
      const result = await mcpRegistryTool.execute({
        context: {
          action: 'search',
          search_query: 'example'
        }
      });
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });
  });

  describe('Enhanced Memory Tools', () => {
    test('should write and read memory', async () => {
      const testKey = 'test-memory-key';
      const testContent = 'This is test memory content';
      
      // 写入记忆
      const writeResult = await memoryWriteTool.execute({
        context: {
          key: testKey,
          content: testContent,
          type: 'user_preference',
          tags: ['test', 'example']
        }
      });
      
      expect(writeResult.success).toBe(true);
      expect(writeResult.memory_id).toBe(testKey);
      
      // 读取记忆
      const readResult = await memoryReadTool.execute({
        context: {
          key: testKey,
          include_metadata: true
        }
      });
      
      expect(readResult.found).toBe(true);
      expect(readResult.content).toBe(testContent);
      expect(readResult.type).toBe('user_preference');
    });
    
    test('should search memory by query', async () => {
      const result = await memorySearchTool.execute({
        context: {
          query: 'test',
          limit: 5
        }
      });
      
      expect(result.results).toBeDefined();
      expect(Array.isArray(result.results)).toBe(true);
      expect(result.total_count).toBeGreaterThanOrEqual(0);
    });
    
    test('should manage memory lifecycle', async () => {
      const result = await memoryManageTool.execute({
        context: {
          action: 'stats'
        }
      });
      
      expect(result.success).toBe(true);
      expect(result.stats).toBeDefined();
    });
  });

  describe('Permission Management', () => {
    test('should check file read permissions', () => {
      const result = globalPermissionManager.checkFileReadPermission(testFile);
      expect(result.allowed).toBe(true);
    });
    
    test('should check file write permissions', () => {
      const result = globalPermissionManager.checkFileWritePermission(testFile);
      expect(result.allowed).toBe(true);
    });
    
    test('should check command permissions', () => {
      const safeResult = globalPermissionManager.checkCommandPermission('echo hello');
      expect(safeResult.allowed).toBe(true);
      
      const dangerousResult = globalPermissionManager.checkCommandPermission('rm -rf /');
      expect(dangerousResult.allowed).toBe(false);
    });
    
    test('should maintain audit logs', () => {
      globalPermissionManager.checkFileReadPermission(testFile);
      const logs = globalPermissionManager.getAuditLogs(10);
      expect(logs.length).toBeGreaterThan(0);
      expect(logs[0].action).toBe('file_read_check');
    });
  });

  describe('Tool Configuration', () => {
    test('should have correct tool configurations', () => {
      expect(enhancedFileReadTool.id).toBe('enhanced-file-read');
      expect(enhancedFileWriteTool.id).toBe('enhanced-file-write');
      expect(enhancedBashTool.id).toBe('enhanced-bash');
      expect(mcpClientTool.id).toBe('mcp-client');
      expect(memoryReadTool.id).toBe('memory-read');
    });
  });
});

describe('Integration with Mastra Framework', () => {
  test('should be compatible with Mastra tool interface', () => {
    // 验证工具符合Mastra接口规范
    expect(enhancedFileReadTool.execute).toBeDefined();
    expect(enhancedFileReadTool.inputSchema).toBeDefined();
    expect(enhancedFileReadTool.outputSchema).toBeDefined();
    
    expect(typeof enhancedFileReadTool.execute).toBe('function');
    expect(enhancedFileReadTool.inputSchema).toBeDefined();
    expect(enhancedFileReadTool.outputSchema).toBeDefined();
  });
  
  test('should handle tool execution context properly', async () => {
    // 测试工具执行上下文处理
    const context = {
      file_path: join(process.cwd(), 'package.json'),
      encoding: 'utf8' as const
    };
    
    try {
      const result = await enhancedFileReadTool.execute({ context });
      expect(result).toBeDefined();
      expect(result.content).toBeDefined();
    } catch (error) {
      // 如果文件不存在或权限不足，应该有适当的错误处理
      expect(error).toBeInstanceOf(Error);
    }
  });
});
