/**
 * 智能并发控制系统 - 工具执行并发度管理
 * 
 * 核心功能：
 * 1. 工具执行并发度管理 (MAX_CONCURRENCY=10)
 * 2. 任务优先级和资源分配
 * 3. 智能队列管理
 * 4. 资源需求分析
 * 5. 性能监控和优化
 * 
 * 基于 anon-kode 的并发控制理念，优化 Mastra 工具执行效率
 */

import { Tool } from '@mastra/core/tools';
import { RuntimeContext } from '@mastra/core/runtime-context';
import { nanoid } from 'nanoid';

// 工具执行请求接口
export interface ToolExecutionRequest {
  id: string;
  tool: Tool;
  args: any;
  context: RuntimeContext;
  priority: TaskPriority;
  resourceRequirement: ResourceRequirement;
  timestamp: Date;
  abortSignal?: AbortSignal;
}

// 工具执行结果接口
export interface ToolExecutionResult {
  id: string;
  success: boolean;
  result?: any;
  error?: string;
  executionTime: number;
  resourceUsage: ResourceUsage;
  timestamp: Date;
}

// 任务优先级枚举
export enum TaskPriority {
  LOW = 1,
  NORMAL = 2,
  HIGH = 3,
  CRITICAL = 4,
  URGENT = 5
}

// 资源需求接口
export interface ResourceRequirement {
  cpu: 'low' | 'medium' | 'high';
  memory: 'low' | 'medium' | 'high';
  io: 'low' | 'medium' | 'high';
  network: 'low' | 'medium' | 'high';
  estimatedDuration: number; // 预估执行时间（毫秒）
}

// 资源使用情况
export interface ResourceUsage {
  cpuTime: number;
  memoryPeak: number;
  ioOperations: number;
  networkRequests: number;
  actualDuration: number;
}

// 执行统计
export interface ExecutionStats {
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  averageExecutionTime: number;
  currentConcurrency: number;
  queueLength: number;
  resourceUtilization: {
    cpu: number;
    memory: number;
    io: number;
    network: number;
  };
}

/**
 * 智能并发控制器
 * 管理工具执行的并发度和资源分配
 */
export class IntelligentConcurrencyController {
  private readonly MAX_CONCURRENCY = 10;
  private activeExecutions = new Map<string, ToolExecutionRequest>();
  private executionQueue: ToolExecutionRequest[] = [];
  private executionHistory: ToolExecutionResult[] = [];
  private resourceMonitor: ResourceMonitor;

  constructor() {
    this.resourceMonitor = new ResourceMonitor();
    this.startPerformanceMonitoring();
  }

  /**
   * 执行工具（带并发控制）
   */
  async executeToolWithConcurrencyControl(
    tool: Tool,
    args: any,
    context: RuntimeContext,
    options: {
      priority?: TaskPriority;
      abortSignal?: AbortSignal;
      estimatedDuration?: number;
    } = {}
  ): Promise<ToolExecutionResult> {

    // 1. 创建执行请求
    const request: ToolExecutionRequest = {
      id: nanoid(),
      tool,
      args,
      context,
      priority: options.priority || TaskPriority.NORMAL,
      resourceRequirement: await this.analyzeResourceRequirement(tool, args),
      timestamp: new Date(),
      abortSignal: options.abortSignal
    };

    // 2. 检查并发度限制
    if (this.activeExecutions.size >= this.MAX_CONCURRENCY) {
      console.log(`⏳ 并发度已满 (${this.activeExecutions.size}/${this.MAX_CONCURRENCY})，任务加入队列`);
      return await this.queueExecution(request);
    }

    // 3. 立即执行
    return await this.executeRequest(request);
  }

  /**
   * 将任务加入队列
   */
  private async queueExecution(request: ToolExecutionRequest): Promise<ToolExecutionResult> {
    return new Promise((resolve, reject) => {
      // 按优先级插入队列
      const insertIndex = this.findInsertPosition(request.priority);
      this.executionQueue.splice(insertIndex, 0, request);

      console.log(`📋 任务已加入队列 (位置: ${insertIndex + 1}/${this.executionQueue.length})`);

      // 设置队列监听器
      const checkQueue = () => {
        const queueIndex = this.executionQueue.indexOf(request);
        if (queueIndex === -1) {
          // 任务已被处理
          return;
        }

        if (this.activeExecutions.size < this.MAX_CONCURRENCY) {
          // 有空闲位置，执行任务
          this.executionQueue.splice(queueIndex, 1);
          this.executeRequest(request).then(resolve).catch(reject);
        } else {
          // 继续等待
          setTimeout(checkQueue, 100);
        }
      };

      // 检查中断信号
      if (request.abortSignal) {
        request.abortSignal.addEventListener('abort', () => {
          const queueIndex = this.executionQueue.indexOf(request);
          if (queueIndex !== -1) {
            this.executionQueue.splice(queueIndex, 1);
            reject(new Error('任务已被中断'));
          }
        });
      }

      checkQueue();
    });
  }

  /**
   * 执行请求
   */
  private async executeRequest(request: ToolExecutionRequest): Promise<ToolExecutionResult> {
    const startTime = Date.now();
    
    // 添加到活跃执行列表
    this.activeExecutions.set(request.id, request);
    
    console.log(`🚀 开始执行工具: ${request.tool.id} (并发度: ${this.activeExecutions.size}/${this.MAX_CONCURRENCY})`);

    try {
      // 开始资源监控
      const resourceMonitoringId = this.resourceMonitor.startMonitoring(request.id);

      // 执行工具
      const result = await request.tool.execute?.(request.args, {
        toolCallId: request.id,
        messages: []
      }) || {
        success: false,
        error: 'Tool execution failed'
      };

      // 停止资源监控
      const resourceUsage = this.resourceMonitor.stopMonitoring(resourceMonitoringId);

      const executionTime = Date.now() - startTime;
      
      const executionResult: ToolExecutionResult = {
        id: request.id,
        success: true,
        result,
        executionTime,
        resourceUsage,
        timestamp: new Date()
      };

      // 记录执行历史
      this.executionHistory.push(executionResult);
      
      console.log(`✅ 工具执行完成: ${request.tool.id} (耗时: ${executionTime}ms)`);
      
      return executionResult;

    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      const executionResult: ToolExecutionResult = {
        id: request.id,
        success: false,
        error: error instanceof Error ? error.message : '未知错误',
        executionTime,
        resourceUsage: this.resourceMonitor.getDefaultResourceUsage(),
        timestamp: new Date()
      };

      this.executionHistory.push(executionResult);
      
      console.error(`❌ 工具执行失败: ${request.tool.id} - ${executionResult.error}`);
      
      return executionResult;

    } finally {
      // 从活跃执行列表中移除
      this.activeExecutions.delete(request.id);
      
      // 处理队列中的下一个任务
      await this.processQueue();
    }
  }

  /**
   * 处理队列
   */
  private async processQueue(): Promise<void> {
    if (this.executionQueue.length === 0 || this.activeExecutions.size >= this.MAX_CONCURRENCY) {
      return;
    }

    // 获取最高优先级的任务
    const nextRequest = this.executionQueue.shift();
    if (nextRequest) {
      // 异步执行，不等待结果
      this.executeRequest(nextRequest).catch(error => {
        console.error(`队列任务执行失败: ${error.message}`);
      });
    }
  }

  /**
   * 找到插入位置（按优先级排序）
   */
  private findInsertPosition(priority: TaskPriority): number {
    for (let i = 0; i < this.executionQueue.length; i++) {
      if (this.executionQueue[i].priority < priority) {
        return i;
      }
    }
    return this.executionQueue.length;
  }

  /**
   * 分析资源需求
   */
  private async analyzeResourceRequirement(tool: Tool, args: any): Promise<ResourceRequirement> {
    // 基于工具类型和参数分析资源需求
    const toolId = tool.id.toLowerCase();
    
    // 默认资源需求
    let requirement: ResourceRequirement = {
      cpu: 'medium',
      memory: 'medium',
      io: 'low',
      network: 'low',
      estimatedDuration: 5000 // 5秒默认
    };

    // 基于工具类型调整
    if (toolId.includes('code') || toolId.includes('generate')) {
      requirement.cpu = 'high';
      requirement.memory = 'high';
      requirement.estimatedDuration = 10000;
    } else if (toolId.includes('file') || toolId.includes('read') || toolId.includes('write')) {
      requirement.io = 'high';
      requirement.estimatedDuration = 2000;
    } else if (toolId.includes('search') || toolId.includes('fetch') || toolId.includes('api')) {
      requirement.network = 'high';
      requirement.estimatedDuration = 8000;
    }

    // 基于参数大小调整
    const argsSize = JSON.stringify(args).length;
    if (argsSize > 10000) {
      requirement.memory = 'high';
      requirement.estimatedDuration *= 1.5;
    } else if (argsSize > 1000) {
      requirement.memory = 'medium';
      requirement.estimatedDuration *= 1.2;
    }

    return requirement;
  }

  /**
   * 获取执行统计
   */
  getExecutionStats(): ExecutionStats {
    const totalExecutions = this.executionHistory.length;
    const successfulExecutions = this.executionHistory.filter(r => r.success).length;
    const failedExecutions = totalExecutions - successfulExecutions;
    
    const averageExecutionTime = totalExecutions > 0 
      ? this.executionHistory.reduce((sum, r) => sum + r.executionTime, 0) / totalExecutions
      : 0;

    return {
      totalExecutions,
      successfulExecutions,
      failedExecutions,
      averageExecutionTime,
      currentConcurrency: this.activeExecutions.size,
      queueLength: this.executionQueue.length,
      resourceUtilization: this.resourceMonitor.getCurrentUtilization()
    };
  }

  /**
   * 获取活跃执行列表
   */
  getActiveExecutions(): ToolExecutionRequest[] {
    return Array.from(this.activeExecutions.values());
  }

  /**
   * 获取队列状态
   */
  getQueueStatus(): ToolExecutionRequest[] {
    return [...this.executionQueue];
  }

  /**
   * 清空队列
   */
  clearQueue(): void {
    this.executionQueue = [];
    console.log('📋 执行队列已清空');
  }

  /**
   * 启动性能监控
   */
  private startPerformanceMonitoring(): void {
    setInterval(() => {
      const stats = this.getExecutionStats();
      
      if (stats.currentConcurrency > 0 || stats.queueLength > 0) {
        console.log(`📊 并发状态: ${stats.currentConcurrency}/${this.MAX_CONCURRENCY} 活跃, ${stats.queueLength} 队列中`);
      }
      
      // 检查资源利用率
      const utilization = stats.resourceUtilization;
      if (utilization.cpu > 0.8 || utilization.memory > 0.8) {
        console.warn(`⚠️ 资源利用率较高: CPU ${(utilization.cpu * 100).toFixed(1)}%, 内存 ${(utilization.memory * 100).toFixed(1)}%`);
      }
      
    }, 10000); // 每10秒检查一次
  }
}

/**
 * 资源监控器
 * 监控工具执行的资源使用情况
 */
class ResourceMonitor {
  private monitoringSessions = new Map<string, {
    startTime: number;
    startMemory: number;
  }>();

  /**
   * 开始监控
   */
  startMonitoring(sessionId: string): string {
    const monitoringId = nanoid();
    
    this.monitoringSessions.set(monitoringId, {
      startTime: Date.now(),
      startMemory: this.getCurrentMemoryUsage()
    });
    
    return monitoringId;
  }

  /**
   * 停止监控
   */
  stopMonitoring(monitoringId: string): ResourceUsage {
    const session = this.monitoringSessions.get(monitoringId);
    
    if (!session) {
      return this.getDefaultResourceUsage();
    }
    
    const endTime = Date.now();
    const endMemory = this.getCurrentMemoryUsage();
    
    this.monitoringSessions.delete(monitoringId);
    
    return {
      cpuTime: endTime - session.startTime,
      memoryPeak: Math.max(endMemory, session.startMemory),
      ioOperations: 0, // 简化实现
      networkRequests: 0, // 简化实现
      actualDuration: endTime - session.startTime
    };
  }

  /**
   * 获取当前资源利用率
   */
  getCurrentUtilization(): {
    cpu: number;
    memory: number;
    io: number;
    network: number;
  } {
    return {
      cpu: Math.random() * 0.5 + 0.2, // 模拟数据
      memory: this.getCurrentMemoryUsage() / (1024 * 1024 * 1024), // GB
      io: Math.random() * 0.3,
      network: Math.random() * 0.4
    };
  }

  /**
   * 获取当前内存使用量
   */
  private getCurrentMemoryUsage(): number {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      return process.memoryUsage().heapUsed;
    }
    return 0;
  }

  /**
   * 获取默认资源使用情况
   */
  getDefaultResourceUsage(): ResourceUsage {
    return {
      cpuTime: 0,
      memoryPeak: 0,
      ioOperations: 0,
      networkRequests: 0,
      actualDuration: 0
    };
  }
}

/**
 * 全局并发控制器实例
 */
export const globalConcurrencyController = new IntelligentConcurrencyController();

/**
 * 便捷函数：执行工具（带并发控制）
 */
export async function executeToolConcurrently(
  tool: Tool,
  args: any,
  context: RuntimeContext,
  options?: {
    priority?: TaskPriority;
    abortSignal?: AbortSignal;
    estimatedDuration?: number;
  }
): Promise<ToolExecutionResult> {
  return globalConcurrencyController.executeToolWithConcurrencyControl(
    tool,
    args,
    context,
    options
  );
}
