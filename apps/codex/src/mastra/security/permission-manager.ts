/**
 * 权限管理器
 * 
 * 基于anon-kode的权限管理机制，为Mastra工具提供细粒度的权限控制，
 * 包括文件系统访问、命令执行和资源使用限制。
 */

import { resolve, isAbsolute } from 'path';
import { existsSync, statSync } from 'fs';

// 权限类型枚举
export enum PermissionType {
  READ = 'read',
  WRITE = 'write',
  EXECUTE = 'execute',
  NETWORK = 'network',
  SYSTEM = 'system'
}

// 权限检查结果接口
export interface PermissionResult {
  allowed: boolean;
  reason?: string;
  details?: any;
}

// 权限配置接口
export interface PermissionConfig {
  userId?: string;
  sessionId?: string;
  allowedPaths: string[];
  bannedCommands: string[];
  maxFileSize: number;
  maxExecutionTime: number;
  enableNetworking: boolean;
  enableSystemAccess: boolean;
}

// 审计日志接口
export interface AuditLog {
  timestamp: string;
  userId?: string;
  sessionId?: string;
  action: string;
  resource: string;
  permission: PermissionType;
  allowed: boolean;
  reason?: string;
  details?: any;
}

/**
 * 权限管理器类
 * 
 * 提供细粒度的权限控制和审计功能
 */
export class PermissionManager {
  private readAllowedPaths = new Set<string>();
  private writeAllowedPaths = new Set<string>();
  private bannedCommands = new Set<string>();
  private auditLogs: AuditLog[] = [];
  private config: PermissionConfig;
  
  constructor(config: Partial<PermissionConfig> = {}) {
    this.config = {
      allowedPaths: [process.cwd()],
      bannedCommands: [
        'rm -rf /', 'sudo rm', 'format', 'fdisk', 'mkfs',
        'dd if=', 'shutdown', 'reboot', 'halt', 'poweroff',
        'sudo', 'su', 'chmod 777', 'chown root'
      ],
      maxFileSize: 10 * 1024 * 1024, // 10MB
      maxExecutionTime: 30000, // 30秒
      enableNetworking: false,
      enableSystemAccess: false,
      ...config
    };
    
    // 初始化允许的路径
    this.initializePermissions();
  }
  
  private initializePermissions(): void {
    // 默认允许项目根目录的读写权限
    const projectRoot = process.cwd();
    this.grantReadPermission(projectRoot);
    this.grantWritePermission(projectRoot);
    
    // 设置禁止的命令
    this.config.bannedCommands.forEach(cmd => {
      this.bannedCommands.add(cmd.toLowerCase());
    });
  }
  
  /**
   * 检查文件读取权限
   */
  checkFileReadPermission(filePath: string, userId?: string): PermissionResult {
    const absolutePath = this.toAbsolutePath(filePath);
    
    // 检查路径是否在允许的范围内
    const hasPermission = this.hasReadPermission(absolutePath);
    
    // 记录审计日志
    this.addAuditLog({
      userId,
      action: 'file_read_check',
      resource: absolutePath,
      permission: PermissionType.READ,
      allowed: hasPermission,
      reason: hasPermission ? 'Path allowed' : 'Path not in allowed list'
    });
    
    if (!hasPermission) {
      return {
        allowed: false,
        reason: `没有读取文件 ${filePath} 的权限`
      };
    }
    
    // 检查文件是否存在
    if (!existsSync(absolutePath)) {
      return {
        allowed: false,
        reason: `文件不存在: ${filePath}`
      };
    }
    
    // 检查文件大小
    try {
      const stats = statSync(absolutePath);
      if (stats.size > this.config.maxFileSize) {
        return {
          allowed: false,
          reason: `文件过大 (${Math.round(stats.size / 1024)}KB)，超过限制 (${Math.round(this.config.maxFileSize / 1024)}KB)`
        };
      }
    } catch (error) {
      return {
        allowed: false,
        reason: `无法访问文件: ${filePath}`
      };
    }
    
    return { allowed: true };
  }
  
  /**
   * 检查文件写入权限
   */
  checkFileWritePermission(filePath: string, userId?: string): PermissionResult {
    const absolutePath = this.toAbsolutePath(filePath);
    
    // 检查路径是否在允许的范围内
    const hasPermission = this.hasWritePermission(absolutePath);
    
    // 记录审计日志
    this.addAuditLog({
      userId,
      action: 'file_write_check',
      resource: absolutePath,
      permission: PermissionType.WRITE,
      allowed: hasPermission,
      reason: hasPermission ? 'Path allowed' : 'Path not in allowed list'
    });
    
    if (!hasPermission) {
      return {
        allowed: false,
        reason: `没有写入文件 ${filePath} 的权限`
      };
    }
    
    return { allowed: true };
  }
  
  /**
   * 检查命令执行权限
   */
  checkCommandPermission(command: string, userId?: string): PermissionResult {
    const lowerCommand = command.toLowerCase().trim();
    
    // 检查是否包含禁止的命令
    for (const bannedCmd of this.bannedCommands) {
      if (lowerCommand.includes(bannedCmd)) {
        this.addAuditLog({
          userId,
          action: 'command_check',
          resource: command,
          permission: PermissionType.EXECUTE,
          allowed: false,
          reason: `Command contains banned pattern: ${bannedCmd}`
        });
        
        return {
          allowed: false,
          reason: `命令 '${bannedCmd}' 被禁止执行，存在安全风险`
        };
      }
    }
    
    // 检查系统访问权限
    const systemCommands = ['sudo', 'su', 'passwd', 'useradd', 'userdel'];
    const hasSystemCommand = systemCommands.some(cmd => lowerCommand.includes(cmd));
    
    if (hasSystemCommand && !this.config.enableSystemAccess) {
      this.addAuditLog({
        userId,
        action: 'command_check',
        resource: command,
        permission: PermissionType.SYSTEM,
        allowed: false,
        reason: 'System access disabled'
      });
      
      return {
        allowed: false,
        reason: '系统级命令被禁止执行'
      };
    }
    
    // 检查网络访问权限
    const networkCommands = ['curl', 'wget', 'ping', 'telnet', 'ssh', 'scp'];
    const hasNetworkCommand = networkCommands.some(cmd => lowerCommand.includes(cmd));
    
    if (hasNetworkCommand && !this.config.enableNetworking) {
      this.addAuditLog({
        userId,
        action: 'command_check',
        resource: command,
        permission: PermissionType.NETWORK,
        allowed: false,
        reason: 'Network access disabled'
      });
      
      return {
        allowed: false,
        reason: '网络访问被禁止'
      };
    }
    
    this.addAuditLog({
      userId,
      action: 'command_check',
      resource: command,
      permission: PermissionType.EXECUTE,
      allowed: true,
      reason: 'Command allowed'
    });
    
    return { allowed: true };
  }
  
  /**
   * 授予读取权限
   */
  grantReadPermission(path: string): void {
    const absolutePath = this.toAbsolutePath(path);
    this.readAllowedPaths.add(absolutePath);
  }
  
  /**
   * 授予写入权限
   */
  grantWritePermission(path: string): void {
    const absolutePath = this.toAbsolutePath(path);
    this.writeAllowedPaths.add(absolutePath);
  }
  
  /**
   * 撤销读取权限
   */
  revokeReadPermission(path: string): void {
    const absolutePath = this.toAbsolutePath(path);
    this.readAllowedPaths.delete(absolutePath);
  }
  
  /**
   * 撤销写入权限
   */
  revokeWritePermission(path: string): void {
    const absolutePath = this.toAbsolutePath(path);
    this.writeAllowedPaths.delete(absolutePath);
  }
  
  /**
   * 获取审计日志
   */
  getAuditLogs(limit?: number): AuditLog[] {
    const logs = [...this.auditLogs].reverse(); // 最新的在前
    return limit ? logs.slice(0, limit) : logs;
  }
  
  /**
   * 清除审计日志
   */
  clearAuditLogs(): void {
    this.auditLogs = [];
  }
  
  /**
   * 获取权限统计信息
   */
  getPermissionStats(): any {
    return {
      readAllowedPaths: Array.from(this.readAllowedPaths),
      writeAllowedPaths: Array.from(this.writeAllowedPaths),
      bannedCommands: Array.from(this.bannedCommands),
      auditLogCount: this.auditLogs.length,
      config: this.config
    };
  }
  
  // 私有方法
  private toAbsolutePath(path: string): string {
    return isAbsolute(path) ? resolve(path) : resolve(process.cwd(), path);
  }
  
  private hasReadPermission(absolutePath: string): boolean {
    for (const allowedPath of this.readAllowedPaths) {
      if (absolutePath.startsWith(allowedPath)) {
        return true;
      }
    }
    return false;
  }
  
  private hasWritePermission(absolutePath: string): boolean {
    for (const allowedPath of this.writeAllowedPaths) {
      if (absolutePath.startsWith(allowedPath)) {
        return true;
      }
    }
    return false;
  }
  
  private addAuditLog(log: Omit<AuditLog, 'timestamp'>): void {
    this.auditLogs.push({
      timestamp: new Date().toISOString(),
      ...log
    });
    
    // 限制审计日志数量，避免内存泄漏
    if (this.auditLogs.length > 1000) {
      this.auditLogs = this.auditLogs.slice(-500); // 保留最新的500条
    }
  }
}

// 全局权限管理器实例
export const globalPermissionManager = new PermissionManager();

// 导出类型
export type { PermissionConfig, PermissionResult, AuditLog };
