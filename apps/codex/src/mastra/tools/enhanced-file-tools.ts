/**
 * 增强文件工具集
 * 
 * 基于anon-kode的优秀工具实现，迁移到Mastra工具规范，
 * 保留权限管理和安全控制机制。
 */

import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { existsSync, readFileSync, writeFileSync, statSync } from 'fs';
import { dirname, extname, relative, resolve, isAbsolute } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// 权限管理系统（从anon-kode迁移）
class PermissionManager {
  private readAllowedDirs = new Set<string>();
  private writeAllowedDirs = new Set<string>();
  
  private toAbsolutePath(path: string): string {
    return isAbsolute(path) ? resolve(path) : resolve(process.cwd(), path);
  }
  
  hasReadPermission(path: string): boolean {
    const absolutePath = this.toAbsolutePath(path);
    for (const allowedPath of this.readAllowedDirs) {
      if (absolutePath.startsWith(allowedPath)) {
        return true;
      }
    }
    return false;
  }
  
  hasWritePermission(path: string): boolean {
    const absolutePath = this.toAbsolutePath(path);
    for (const allowedPath of this.writeAllowedDirs) {
      if (absolutePath.startsWith(allowedPath)) {
        return true;
      }
    }
    return false;
  }
  
  grantReadPermission(path: string): void {
    const absolutePath = this.toAbsolutePath(path);
    this.readAllowedDirs.add(absolutePath);
  }
  
  grantWritePermission(path: string): void {
    const absolutePath = this.toAbsolutePath(path);
    this.writeAllowedDirs.add(absolutePath);
  }
  
  // 初始化项目目录权限
  initProjectPermissions(): void {
    const projectRoot = process.cwd();
    this.grantReadPermission(projectRoot);
    this.grantWritePermission(projectRoot);
  }
}

// 全局权限管理器实例
const permissionManager = new PermissionManager();
permissionManager.initProjectPermissions();

// 文件大小限制
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_OUTPUT_SIZE = 0.25 * 1024 * 1024; // 0.25MB

/**
 * 增强文件读取工具
 * 基于anon-kode的FileReadTool，添加Mastra兼容性
 */
export const enhancedFileReadTool = createTool({
  id: 'enhanced-file-read',
  description: '安全地读取文件内容，支持多种文件格式和权限控制',
  inputSchema: z.object({
    file_path: z.string().describe('要读取的文件路径'),
    offset: z.number().optional().describe('起始行号（可选）'),
    limit: z.number().optional().describe('读取行数限制（可选）'),
    encoding: z.enum(['utf8', 'base64', 'binary']).default('utf8').describe('文件编码')
  }),
  outputSchema: z.object({
    content: z.string().describe('文件内容'),
    metadata: z.object({
      size: z.number(),
      mtime: z.string(),
      type: z.string(),
      lines: z.number().optional()
    })
  }),
  execute: async ({ context }) => {
    const { file_path, offset = 1, limit, encoding } = context;
    
    // 权限检查
    if (!permissionManager.hasReadPermission(file_path)) {
      throw new Error(`没有读取文件 ${file_path} 的权限`);
    }
    
    // 文件存在性检查
    if (!existsSync(file_path)) {
      throw new Error(`文件不存在: ${file_path}`);
    }
    
    // 获取文件信息
    const stats = statSync(file_path);
    const fileSize = stats.size;
    
    // 文件大小检查
    if (fileSize > MAX_FILE_SIZE) {
      throw new Error(`文件过大 (${Math.round(fileSize / 1024)}KB)，超过最大限制 (${Math.round(MAX_FILE_SIZE / 1024)}KB)`);
    }
    
    // 读取文件内容
    let content = readFileSync(file_path, encoding as BufferEncoding);
    
    // 处理行数限制
    let lines = 0;
    if (encoding === 'utf8' && (offset > 1 || limit)) {
      const allLines = content.split('\n');
      lines = allLines.length;
      
      const startIndex = Math.max(0, offset - 1);
      const endIndex = limit ? Math.min(allLines.length, startIndex + limit) : allLines.length;
      
      content = allLines.slice(startIndex, endIndex).join('\n');
    } else if (encoding === 'utf8') {
      lines = content.split('\n').length;
    }
    
    return {
      content,
      metadata: {
        size: fileSize,
        mtime: stats.mtime.toISOString(),
        type: extname(file_path),
        lines: encoding === 'utf8' ? lines : undefined
      }
    };
  }
});

/**
 * 增强文件写入工具
 * 基于anon-kode的FileWriteTool，添加安全检查
 */
export const enhancedFileWriteTool = createTool({
  id: 'enhanced-file-write',
  description: '安全地写入文件内容，支持权限控制和备份',
  inputSchema: z.object({
    file_path: z.string().describe('要写入的文件路径'),
    content: z.string().describe('文件内容'),
    encoding: z.enum(['utf8', 'base64', 'binary']).default('utf8').describe('文件编码'),
    create_backup: z.boolean().default(true).describe('是否创建备份')
  }),
  outputSchema: z.object({
    success: z.boolean(),
    message: z.string(),
    backup_path: z.string().optional()
  }),
  execute: async ({ context }) => {
    const { file_path, content, encoding, create_backup } = context;
    
    // 权限检查
    if (!permissionManager.hasWritePermission(file_path)) {
      throw new Error(`没有写入文件 ${file_path} 的权限`);
    }
    
    // 内容大小检查
    if (Buffer.byteLength(content, encoding as BufferEncoding) > MAX_FILE_SIZE) {
      throw new Error(`内容过大，超过最大限制 (${Math.round(MAX_FILE_SIZE / 1024)}KB)`);
    }
    
    let backup_path: string | undefined;
    
    // 创建备份
    if (create_backup && existsSync(file_path)) {
      backup_path = `${file_path}.backup.${Date.now()}`;
      const originalContent = readFileSync(file_path);
      writeFileSync(backup_path, originalContent);
    }
    
    // 确保目录存在
    const dir = dirname(file_path);
    if (!existsSync(dir)) {
      await execAsync(`mkdir -p "${dir}"`);
    }
    
    // 写入文件
    writeFileSync(file_path, content, encoding as BufferEncoding);
    
    return {
      success: true,
      message: `文件 ${file_path} 写入成功`,
      backup_path
    };
  }
});

/**
 * 增强Bash执行工具
 * 基于anon-kode的BashTool，添加安全限制
 */
export const enhancedBashTool = createTool({
  id: 'enhanced-bash',
  description: '安全地执行bash命令，支持超时和权限控制',
  inputSchema: z.object({
    command: z.string().describe('要执行的命令'),
    timeout: z.number().default(30000).describe('超时时间（毫秒）'),
    cwd: z.string().optional().describe('工作目录')
  }),
  outputSchema: z.object({
    stdout: z.string(),
    stderr: z.string(),
    exitCode: z.number(),
    interrupted: z.boolean()
  }),
  execute: async ({ context }) => {
    const { command, timeout, cwd } = context;
    
    // 危险命令检查
    const bannedCommands = [
      'rm -rf /', 'sudo rm', 'format', 'fdisk', 'mkfs',
      'dd if=', 'shutdown', 'reboot', 'halt', 'poweroff'
    ];
    
    const lowerCommand = command.toLowerCase();
    for (const banned of bannedCommands) {
      if (lowerCommand.includes(banned)) {
        throw new Error(`命令 '${banned}' 被禁止执行，存在安全风险`);
      }
    }
    
    try {
      const { stdout, stderr } = await execAsync(command, {
        timeout,
        cwd: cwd || process.cwd(),
        maxBuffer: MAX_OUTPUT_SIZE
      });
      
      return {
        stdout: stdout || '',
        stderr: stderr || '',
        exitCode: 0,
        interrupted: false
      };
    } catch (error: any) {
      return {
        stdout: error.stdout || '',
        stderr: error.stderr || error.message,
        exitCode: error.code || 1,
        interrupted: error.killed || false
      };
    }
  }
});

// 导出权限管理器供其他模块使用
export { permissionManager };

/**
 * 增强文件编辑工具
 * 支持部分文件内容的精确编辑
 */
export const enhancedFileEditTool = createTool({
  id: 'enhanced-file-edit',
  description: '精确编辑文件的特定部分，支持行号范围和模式匹配',
  inputSchema: z.object({
    file_path: z.string().describe('要编辑的文件路径'),
    operation: z.enum(['replace', 'insert', 'delete']).describe('编辑操作类型'),
    start_line: z.number().optional().describe('起始行号'),
    end_line: z.number().optional().describe('结束行号'),
    new_content: z.string().optional().describe('新内容'),
    pattern: z.string().optional().describe('匹配模式（正则表达式）')
  }),
  outputSchema: z.object({
    success: z.boolean(),
    message: z.string(),
    changes_made: z.number()
  }),
  execute: async ({ context }) => {
    const { file_path, operation, start_line, end_line, new_content, pattern } = context;

    // 权限检查
    if (!permissionManager.hasWritePermission(file_path)) {
      throw new Error(`没有编辑文件 ${file_path} 的权限`);
    }

    if (!existsSync(file_path)) {
      throw new Error(`文件不存在: ${file_path}`);
    }

    const originalContent = readFileSync(file_path, 'utf8');
    const lines = originalContent.split('\n');
    let changes_made = 0;

    switch (operation) {
      case 'replace':
        if (start_line && end_line && new_content !== undefined) {
          const startIdx = Math.max(0, start_line - 1);
          const endIdx = Math.min(lines.length, end_line);
          lines.splice(startIdx, endIdx - startIdx, ...new_content.split('\n'));
          changes_made = endIdx - startIdx;
        }
        break;

      case 'insert':
        if (start_line && new_content !== undefined) {
          const insertIdx = Math.max(0, start_line - 1);
          lines.splice(insertIdx, 0, ...new_content.split('\n'));
          changes_made = new_content.split('\n').length;
        }
        break;

      case 'delete':
        if (start_line && end_line) {
          const startIdx = Math.max(0, start_line - 1);
          const endIdx = Math.min(lines.length, end_line);
          lines.splice(startIdx, endIdx - startIdx);
          changes_made = endIdx - startIdx;
        }
        break;
    }

    const newContent = lines.join('\n');
    writeFileSync(file_path, newContent, 'utf8');

    return {
      success: true,
      message: `文件 ${file_path} 编辑成功`,
      changes_made
    };
  }
});

/**
 * 增强Grep搜索工具
 */
export const enhancedGrepTool = createTool({
  id: 'enhanced-grep',
  description: '在文件中搜索文本模式，支持正则表达式和上下文显示',
  inputSchema: z.object({
    pattern: z.string().describe('搜索模式（支持正则表达式）'),
    file_path: z.string().describe('搜索的文件路径'),
    context_lines: z.number().default(2).describe('显示上下文行数'),
    case_sensitive: z.boolean().default(false).describe('是否区分大小写')
  }),
  outputSchema: z.object({
    matches: z.array(z.object({
      line_number: z.number(),
      content: z.string(),
      context_before: z.array(z.string()),
      context_after: z.array(z.string())
    })),
    total_matches: z.number()
  }),
  execute: async ({ context }) => {
    const { pattern, file_path, context_lines, case_sensitive } = context;

    if (!permissionManager.hasReadPermission(file_path)) {
      throw new Error(`没有读取文件 ${file_path} 的权限`);
    }

    if (!existsSync(file_path)) {
      throw new Error(`文件不存在: ${file_path}`);
    }

    const content = readFileSync(file_path, 'utf8');
    const lines = content.split('\n');
    const regex = new RegExp(pattern, case_sensitive ? 'g' : 'gi');
    const matches = [];

    for (let i = 0; i < lines.length; i++) {
      if (regex.test(lines[i])) {
        const contextStart = Math.max(0, i - context_lines);
        const contextEnd = Math.min(lines.length, i + context_lines + 1);

        matches.push({
          line_number: i + 1,
          content: lines[i],
          context_before: lines.slice(contextStart, i),
          context_after: lines.slice(i + 1, contextEnd)
        });
      }
    }

    return {
      matches,
      total_matches: matches.length
    };
  }
});

/**
 * 增强Glob文件匹配工具
 */
export const enhancedGlobTool = createTool({
  id: 'enhanced-glob',
  description: '使用glob模式匹配文件和目录',
  inputSchema: z.object({
    pattern: z.string().describe('Glob匹配模式'),
    base_path: z.string().default('.').describe('基础搜索路径'),
    include_hidden: z.boolean().default(false).describe('是否包含隐藏文件')
  }),
  outputSchema: z.object({
    files: z.array(z.string()),
    directories: z.array(z.string()),
    total_count: z.number()
  }),
  execute: async ({ context }) => {
    const { pattern, base_path, include_hidden } = context;

    if (!permissionManager.hasReadPermission(base_path)) {
      throw new Error(`没有读取目录 ${base_path} 的权限`);
    }

    try {
      const command = `find "${base_path}" -name "${pattern}" ${include_hidden ? '' : '-not -path "*/.*"'}`;
      const { stdout } = await execAsync(command);

      const paths = stdout.trim().split('\n').filter(p => p);
      const files = [];
      const directories = [];

      for (const path of paths) {
        if (existsSync(path)) {
          const stats = statSync(path);
          if (stats.isFile()) {
            files.push(path);
          } else if (stats.isDirectory()) {
            directories.push(path);
          }
        }
      }

      return {
        files,
        directories,
        total_count: files.length + directories.length
      };
    } catch (error) {
      return {
        files: [],
        directories: [],
        total_count: 0
      };
    }
  }
});

/**
 * 增强Ls目录列表工具
 */
export const enhancedLsTool = createTool({
  id: 'enhanced-ls',
  description: '列出目录内容，支持详细信息和过滤',
  inputSchema: z.object({
    path: z.string().default('.').describe('要列出的目录路径'),
    show_hidden: z.boolean().default(false).describe('是否显示隐藏文件'),
    detailed: z.boolean().default(false).describe('是否显示详细信息')
  }),
  outputSchema: z.object({
    items: z.array(z.object({
      name: z.string(),
      type: z.enum(['file', 'directory', 'symlink']),
      size: z.number().optional(),
      modified: z.string().optional(),
      permissions: z.string().optional()
    })),
    total_count: z.number()
  }),
  execute: async ({ context }) => {
    const { path, show_hidden, detailed } = context;

    if (!permissionManager.hasReadPermission(path)) {
      throw new Error(`没有读取目录 ${path} 的权限`);
    }

    if (!existsSync(path)) {
      throw new Error(`目录不存在: ${path}`);
    }

    try {
      const command = `ls ${show_hidden ? '-la' : '-l'} "${path}"`;
      const { stdout } = await execAsync(command);

      const lines = stdout.trim().split('\n').slice(1); // 跳过总计行
      const items = [];

      for (const line of lines) {
        const parts = line.split(/\s+/);
        if (parts.length >= 9) {
          const permissions = parts[0];
          const size = parseInt(parts[4]);
          const name = parts.slice(8).join(' ');

          let type: 'file' | 'directory' | 'symlink' = 'file';
          if (permissions.startsWith('d')) type = 'directory';
          else if (permissions.startsWith('l')) type = 'symlink';

          items.push({
            name,
            type,
            size: detailed ? size : undefined,
            modified: detailed ? `${parts[5]} ${parts[6]} ${parts[7]}` : undefined,
            permissions: detailed ? permissions : undefined
          });
        }
      }

      return {
        items,
        total_count: items.length
      };
    } catch (error) {
      return {
        items: [],
        total_count: 0
      };
    }
  }
});

// 导出工具配置信息
export const toolConfigs = {
  fileRead: {
    id: 'enhanced-file-read',
    name: 'Enhanced File Read',
    category: 'file-operations',
    permissions: ['read']
  },
  fileWrite: {
    id: 'enhanced-file-write',
    name: 'Enhanced File Write',
    category: 'file-operations',
    permissions: ['write']
  },
  fileEdit: {
    id: 'enhanced-file-edit',
    name: 'Enhanced File Edit',
    category: 'file-operations',
    permissions: ['write']
  },
  bash: {
    id: 'enhanced-bash',
    name: 'Enhanced Bash',
    category: 'system-operations',
    permissions: ['execute']
  },
  grep: {
    id: 'enhanced-grep',
    name: 'Enhanced Grep',
    category: 'search-operations',
    permissions: ['read']
  },
  glob: {
    id: 'enhanced-glob',
    name: 'Enhanced Glob',
    category: 'search-operations',
    permissions: ['read']
  },
  ls: {
    id: 'enhanced-ls',
    name: 'Enhanced Ls',
    category: 'file-operations',
    permissions: ['read']
  }
};
