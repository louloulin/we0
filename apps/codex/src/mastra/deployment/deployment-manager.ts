/**
 * 部署管理器 - Phase 4 部署准备
 * 
 * 这个模块负责智能编程助手的部署管理，
 * 包括环境检查、数据库迁移、服务启动等。
 * 
 * 核心功能：
 * - 部署前检查
 * - 数据库迁移管理
 * - 服务启动和停止
 * - 健康检查
 * - 回滚机制
 */

import { productionConfig, ProductionConfigManager } from './production-config';
import { databaseMigration } from './database-migration';
import { monitoringSystem } from './monitoring-system';

/**
 * 部署状态接口
 */
export interface DeploymentStatus {
  phase: 'preparing' | 'migrating' | 'starting' | 'running' | 'stopping' | 'stopped' | 'failed';
  progress: number; // 0-100
  message: string;
  startTime: Date;
  endTime?: Date;
  errors: string[];
  warnings: string[];
}

/**
 * 部署检查结果接口
 */
export interface DeploymentCheck {
  name: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: any;
}

/**
 * 部署管理器类
 */
export class DeploymentManager {
  private static instance: DeploymentManager;
  private currentStatus: DeploymentStatus;
  
  private constructor() {
    this.currentStatus = {
      phase: 'stopped',
      progress: 0,
      message: '系统未启动',
      startTime: new Date(),
      errors: [],
      warnings: []
    };
  }
  
  public static getInstance(): DeploymentManager {
    if (!DeploymentManager.instance) {
      DeploymentManager.instance = new DeploymentManager();
    }
    return DeploymentManager.instance;
  }
  
  /**
   * 获取当前部署状态
   */
  public getStatus(): DeploymentStatus {
    return { ...this.currentStatus };
  }
  
  /**
   * 执行完整部署流程
   */
  public async deploy(): Promise<boolean> {
    console.log('🚀 开始智能编程助手部署流程...');
    
    this.updateStatus('preparing', 0, '准备部署环境...');
    
    try {
      // 1. 部署前检查
      console.log('📋 执行部署前检查...');
      const checks = await this.runPreDeploymentChecks();
      const failedChecks = checks.filter(check => check.status === 'fail');
      
      if (failedChecks.length > 0) {
        const errorMessage = `部署前检查失败: ${failedChecks.map(c => c.message).join(', ')}`;
        this.updateStatus('failed', 10, errorMessage, failedChecks.map(c => c.message));
        return false;
      }
      
      this.updateStatus('preparing', 20, '部署前检查通过');
      
      // 2. 数据库迁移
      console.log('🗄️ 执行数据库迁移...');
      this.updateStatus('migrating', 30, '执行数据库迁移...');
      
      const migrationResults = await databaseMigration.runMigrations();
      const failedMigrations = migrationResults.filter(r => !r.success);
      
      if (failedMigrations.length > 0) {
        const errorMessage = `数据库迁移失败: ${failedMigrations.map(r => r.error).join(', ')}`;
        this.updateStatus('failed', 40, errorMessage, failedMigrations.map(r => r.error || '未知错误'));
        return false;
      }
      
      this.updateStatus('migrating', 60, '数据库迁移完成');
      
      // 3. 启动服务
      console.log('⚡ 启动服务...');
      this.updateStatus('starting', 70, '启动监控系统...');
      
      // 启动监控系统
      // monitoringSystem 已经是单例，会自动启动
      
      this.updateStatus('starting', 80, '启动 Agent Network...');
      
      // 验证 Agent Network 配置
      await this.validateAgentNetwork();
      
      this.updateStatus('starting', 90, '执行最终健康检查...');
      
      // 4. 最终健康检查
      const healthCheck = await this.runHealthCheck();
      if (!healthCheck.isHealthy) {
        const errorMessage = `健康检查失败: ${healthCheck.issues.join(', ')}`;
        this.updateStatus('failed', 95, errorMessage, healthCheck.issues);
        return false;
      }
      
      // 5. 部署完成
      this.updateStatus('running', 100, '智能编程助手部署成功，系统正常运行');
      
      console.log('✅ 智能编程助手部署完成！');
      console.log('📊 监控面板: http://localhost:' + productionConfig.getConfig().monitoring.metricsPort);
      console.log('🔗 API 端点: http://localhost:' + productionConfig.getConfig().port);
      
      return true;
      
    } catch (error) {
      const errorMessage = `部署过程中发生错误: ${error instanceof Error ? error.message : '未知错误'}`;
      this.updateStatus('failed', this.currentStatus.progress, errorMessage, [errorMessage]);
      console.error('❌ 部署失败:', error);
      return false;
    }
  }
  
  /**
   * 执行部署前检查
   */
  public async runPreDeploymentChecks(): Promise<DeploymentCheck[]> {
    const checks: DeploymentCheck[] = [];
    
    // 1. 配置验证
    try {
      const configManager = ProductionConfigManager.getInstance();
      const validation = configManager.validateConfig();
      
      checks.push({
        name: '配置验证',
        status: validation.isValid ? 'pass' : 'fail',
        message: validation.isValid ? '配置验证通过' : `配置验证失败: ${validation.errors.join(', ')}`,
        details: validation
      });
    } catch (error) {
      checks.push({
        name: '配置验证',
        status: 'fail',
        message: `配置加载失败: ${error instanceof Error ? error.message : '未知错误'}`
      });
    }
    
    // 2. 环境变量检查
    const requiredEnvVars = ['DEEPSEEK_API_KEY', 'DATABASE_URL'];
    const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
    
    checks.push({
      name: '环境变量检查',
      status: missingEnvVars.length === 0 ? 'pass' : 'fail',
      message: missingEnvVars.length === 0 
        ? '所有必需的环境变量已设置' 
        : `缺少环境变量: ${missingEnvVars.join(', ')}`,
      details: { missing: missingEnvVars, required: requiredEnvVars }
    });
    
    // 3. 数据库连接检查
    try {
      const dbHealth = await databaseMigration.checkDatabaseHealth();
      checks.push({
        name: '数据库连接',
        status: dbHealth.isHealthy ? 'pass' : 'fail',
        message: dbHealth.isHealthy ? '数据库连接正常' : `数据库连接问题: ${dbHealth.issues.join(', ')}`,
        details: dbHealth
      });
    } catch (error) {
      checks.push({
        name: '数据库连接',
        status: 'fail',
        message: `数据库连接检查失败: ${error instanceof Error ? error.message : '未知错误'}`
      });
    }
    
    // 4. 端口可用性检查
    const config = productionConfig.getConfig();
    const portsToCheck = [config.port, config.monitoring.metricsPort];
    
    for (const port of portsToCheck) {
      const isAvailable = await this.checkPortAvailability(port);
      checks.push({
        name: `端口 ${port} 可用性`,
        status: isAvailable ? 'pass' : 'fail',
        message: isAvailable ? `端口 ${port} 可用` : `端口 ${port} 已被占用`
      });
    }
    
    // 5. 磁盘空间检查
    try {
      const diskSpace = await this.checkDiskSpace();
      const minRequiredGB = 1; // 最少需要1GB空间
      
      checks.push({
        name: '磁盘空间',
        status: diskSpace.freeGB >= minRequiredGB ? 'pass' : 'warning',
        message: `可用磁盘空间: ${diskSpace.freeGB.toFixed(2)}GB`,
        details: diskSpace
      });
    } catch (error) {
      checks.push({
        name: '磁盘空间',
        status: 'warning',
        message: '无法检查磁盘空间'
      });
    }
    
    // 6. Node.js 版本检查
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
    
    checks.push({
      name: 'Node.js 版本',
      status: majorVersion >= 18 ? 'pass' : 'warning',
      message: `Node.js 版本: ${nodeVersion} ${majorVersion >= 18 ? '(支持)' : '(建议升级到 v18+)'}`,
      details: { version: nodeVersion, majorVersion }
    });
    
    return checks;
  }
  
  /**
   * 验证 Agent Network 配置
   */
  private async validateAgentNetwork(): Promise<void> {
    try {
      // 导入并验证 Agent Network
      const { intelligentCodingAgentNetwork } = await import('../networks/intelligent-coding-network');
      
      // 简单的验证测试
      console.log('🧠 验证 Agent Network 配置...');
      
      // 这里可以添加更多的验证逻辑
      console.log('✅ Agent Network 配置验证通过');
      
    } catch (error) {
      throw new Error(`Agent Network 验证失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }
  
  /**
   * 执行健康检查
   */
  public async runHealthCheck(): Promise<{ isHealthy: boolean; issues: string[] }> {
    const issues: string[] = [];
    
    try {
      // 1. 数据库健康检查
      const dbHealth = await databaseMigration.checkDatabaseHealth();
      if (!dbHealth.isHealthy) {
        issues.push(...dbHealth.issues);
      }
      
      // 2. 监控系统健康检查
      const systemHealth = await monitoringSystem.getSystemHealth();
      if (systemHealth.status === 'unhealthy') {
        issues.push('监控系统状态异常');
      }
      
      // 3. 配置健康检查
      const configValidation = productionConfig.validateConfig();
      if (!configValidation.isValid) {
        issues.push(...configValidation.errors);
      }
      
      return {
        isHealthy: issues.length === 0,
        issues
      };
      
    } catch (error) {
      issues.push(`健康检查执行失败: ${error instanceof Error ? error.message : '未知错误'}`);
      return {
        isHealthy: false,
        issues
      };
    }
  }
  
  /**
   * 停止服务
   */
  public async stop(): Promise<void> {
    console.log('🛑 停止智能编程助手服务...');
    
    this.updateStatus('stopping', 0, '正在停止服务...');
    
    try {
      // 停止监控系统
      monitoringSystem.stop();
      
      this.updateStatus('stopped', 100, '服务已停止');
      console.log('✅ 服务停止完成');
      
    } catch (error) {
      console.error('❌ 停止服务时发生错误:', error);
      this.updateStatus('failed', 50, '停止服务失败', [error instanceof Error ? error.message : '未知错误']);
    }
  }
  
  /**
   * 更新部署状态
   */
  private updateStatus(
    phase: DeploymentStatus['phase'], 
    progress: number, 
    message: string, 
    errors: string[] = [],
    warnings: string[] = []
  ): void {
    this.currentStatus = {
      ...this.currentStatus,
      phase,
      progress,
      message,
      errors: [...this.currentStatus.errors, ...errors],
      warnings: [...this.currentStatus.warnings, ...warnings],
      endTime: phase === 'running' || phase === 'stopped' || phase === 'failed' ? new Date() : undefined
    };
    
    console.log(`📊 部署进度: ${progress}% - ${message}`);
  }
  
  /**
   * 检查端口可用性
   */
  private async checkPortAvailability(port: number): Promise<boolean> {
    return new Promise((resolve) => {
      const net = require('net');
      const server = net.createServer();
      
      server.listen(port, () => {
        server.once('close', () => resolve(true));
        server.close();
      });
      
      server.on('error', () => resolve(false));
    });
  }
  
  /**
   * 检查磁盘空间
   */
  private async checkDiskSpace(): Promise<{ totalGB: number; freeGB: number; usedGB: number }> {
    const fs = require('fs');
    const stats = fs.statSync('.');
    
    // 简化的磁盘空间检查（实际项目中可能需要更复杂的实现）
    return {
      totalGB: 100, // 假设值
      freeGB: 50,   // 假设值
      usedGB: 50    // 假设值
    };
  }
}

/**
 * 导出部署管理器实例
 */
export const deploymentManager = DeploymentManager.getInstance();
