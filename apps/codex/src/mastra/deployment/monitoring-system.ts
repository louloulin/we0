/**
 * 监控系统 - Phase 4 部署准备
 * 
 * 这个模块负责智能编程助手的监控和性能指标收集，
 * 提供实时的系统健康状态和性能数据。
 * 
 * 核心功能：
 * - 性能指标收集和存储
 * - 实时监控和告警
 * - 错误追踪和分析
 * - 质量指标统计
 * - 用户行为分析
 */

import { productionConfig } from './production-config';
import { LibSQLStore } from '@mastra/libsql';

/**
 * 性能指标接口
 */
export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  tags?: Record<string, string>;
  timestamp?: Date;
}

/**
 * 错误日志接口
 */
export interface ErrorLog {
  type: string;
  message: string;
  stackTrace?: string;
  userId?: string;
  sessionId?: string;
  taskId?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp?: Date;
}

/**
 * 质量指标接口
 */
export interface QualityMetric {
  taskId: string;
  overallScore: number;
  validationScore?: number;
  completenessScore?: number;
  recommendations?: string[];
  autoFixesApplied?: number;
  timestamp?: Date;
}

/**
 * 系统健康状态接口
 */
export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  uptime: number;
  memoryUsage: {
    used: number;
    total: number;
    percentage: number;
  };
  cpuUsage: number;
  activeConnections: number;
  activeTasks: number;
  errorRate: number;
  averageResponseTime: number;
  lastChecked: Date;
}

/**
 * 监控系统类
 */
// 监控系统的数据库适配器
class MonitoringDatabaseAdapter {
  constructor(private store: LibSQLStore) {}

  async execute(sql: string, params?: any[]): Promise<{ rows: any[] }> {
    try {
      // 模拟数据库操作，实际项目中需要根据LibSQLStore的真实API调整
      console.log('执行SQL:', sql, params);
      return { rows: [] };
    } catch (error) {
      console.warn('监控数据库操作失败:', error);
      return { rows: [] };
    }
  }
}

export class MonitoringSystem {
  private static instance: MonitoringSystem;
  private config = productionConfig.getConfig();
  private db: MonitoringDatabaseAdapter;
  private metrics: Map<string, PerformanceMetric[]> = new Map();
  private startTime = Date.now();
  private healthCheckInterval?: NodeJS.Timeout;

  private constructor() {
    const store = new LibSQLStore({
      url: this.config.database.url,
    });
    this.db = new MonitoringDatabaseAdapter(store);

    if (this.config.monitoring.enableMetrics) {
      this.startHealthChecks();
    }
  }
  
  public static getInstance(): MonitoringSystem {
    if (!MonitoringSystem.instance) {
      MonitoringSystem.instance = new MonitoringSystem();
    }
    return MonitoringSystem.instance;
  }
  
  /**
   * 记录性能指标
   */
  public async recordMetric(metric: PerformanceMetric): Promise<void> {
    if (!this.config.monitoring.enableMetrics) {
      return;
    }
    
    try {
      const timestamp = metric.timestamp || new Date();
      const tags = JSON.stringify(metric.tags || {});
      
      // 存储到数据库
      await this.db.execute(
        'INSERT INTO performance_metrics (id, metric_name, metric_value, metric_unit, tags, recorded_at) VALUES (?, ?, ?, ?, ?, ?)',
        [
          `metric_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          metric.name,
          metric.value,
          metric.unit,
          tags,
          timestamp.toISOString()
        ]
      );
      
      // 保存到内存缓存（用于快速查询）
      if (!this.metrics.has(metric.name)) {
        this.metrics.set(metric.name, []);
      }
      
      const metricList = this.metrics.get(metric.name)!;
      metricList.push({ ...metric, timestamp });
      
      // 保持最近1000条记录
      if (metricList.length > 1000) {
        metricList.splice(0, metricList.length - 1000);
      }
      
    } catch (error) {
      console.error('记录性能指标失败:', error);
    }
  }
  
  /**
   * 记录错误日志
   */
  public async recordError(error: ErrorLog): Promise<void> {
    if (!this.config.monitoring.enableLogging) {
      return;
    }
    
    try {
      const timestamp = error.timestamp || new Date();
      
      await this.db.execute(
        'INSERT INTO error_logs (id, error_type, error_message, stack_trace, user_id, session_id, task_id, severity, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          error.type,
          error.message,
          error.stackTrace || null,
          error.userId || null,
          error.sessionId || null,
          error.taskId || null,
          error.severity,
          timestamp.toISOString()
        ]
      );
      
      // 如果是严重错误，立即告警
      if (error.severity === 'critical') {
        await this.triggerAlert('critical_error', error.message);
      }
      
    } catch (err) {
      console.error('记录错误日志失败:', err);
    }
  }
  
  /**
   * 记录质量指标
   */
  public async recordQualityMetric(metric: QualityMetric): Promise<void> {
    try {
      const timestamp = metric.timestamp || new Date();
      const recommendations = JSON.stringify(metric.recommendations || []);
      
      await this.db.execute(
        'INSERT INTO quality_assessments (id, task_id, overall_score, validation_score, completeness_score, recommendations, auto_fixes_applied, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [
          `quality_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          metric.taskId,
          metric.overallScore,
          metric.validationScore || null,
          metric.completenessScore || null,
          recommendations,
          metric.autoFixesApplied || 0,
          timestamp.toISOString()
        ]
      );
      
      // 同时记录为性能指标
      await this.recordMetric({
        name: 'quality_score',
        value: metric.overallScore,
        unit: 'score',
        tags: { taskId: metric.taskId }
      });
      
    } catch (error) {
      console.error('记录质量指标失败:', error);
    }
  }
  
  /**
   * 获取系统健康状态
   */
  public async getSystemHealth(): Promise<SystemHealth> {
    try {
      const now = Date.now();
      const uptime = now - this.startTime;
      
      // 获取内存使用情况
      const memoryUsage = process.memoryUsage();
      const memoryInfo = {
        used: memoryUsage.heapUsed,
        total: memoryUsage.heapTotal,
        percentage: (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100
      };
      
      // 获取CPU使用率（简化版本）
      const cpuUsage = process.cpuUsage();
      const cpuPercent = (cpuUsage.user + cpuUsage.system) / 1000000; // 转换为秒
      
      // 获取错误率（最近1小时）
      const oneHourAgo = new Date(now - 60 * 60 * 1000);
      const errorCount = await this.getErrorCount(oneHourAgo);
      const totalRequests = await this.getRequestCount(oneHourAgo);
      const errorRate = totalRequests > 0 ? (errorCount / totalRequests) * 100 : 0;
      
      // 获取平均响应时间
      const avgResponseTime = await this.getAverageResponseTime(oneHourAgo);
      
      // 确定系统状态
      let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
      if (errorRate > 5 || memoryInfo.percentage > 90 || avgResponseTime > 10000) {
        status = 'unhealthy';
      } else if (errorRate > 1 || memoryInfo.percentage > 70 || avgResponseTime > 5000) {
        status = 'degraded';
      }
      
      return {
        status,
        uptime,
        memoryUsage: memoryInfo,
        cpuUsage: cpuPercent,
        activeConnections: 0, // TODO: 实现连接计数
        activeTasks: 0, // TODO: 实现任务计数
        errorRate,
        averageResponseTime: avgResponseTime,
        lastChecked: new Date()
      };
      
    } catch (error) {
      console.error('获取系统健康状态失败:', error);
      return {
        status: 'unhealthy',
        uptime: 0,
        memoryUsage: { used: 0, total: 0, percentage: 0 },
        cpuUsage: 0,
        activeConnections: 0,
        activeTasks: 0,
        errorRate: 100,
        averageResponseTime: 0,
        lastChecked: new Date()
      };
    }
  }
  
  /**
   * 获取性能指标统计
   */
  public async getMetricStats(metricName: string, timeRange: { start: Date; end: Date }): Promise<{
    count: number;
    average: number;
    min: number;
    max: number;
    latest: number;
  }> {
    try {
      const result = await this.db.execute(
        'SELECT COUNT(*) as count, AVG(metric_value) as avg, MIN(metric_value) as min, MAX(metric_value) as max FROM performance_metrics WHERE metric_name = ? AND recorded_at BETWEEN ? AND ?',
        [metricName, timeRange.start.toISOString(), timeRange.end.toISOString()]
      );
      
      const row = result.rows[0] as any;
      
      // 获取最新值
      const latestResult = await this.db.execute(
        'SELECT metric_value FROM performance_metrics WHERE metric_name = ? ORDER BY recorded_at DESC LIMIT 1',
        [metricName]
      );
      
      const latest = latestResult.rows[0] ? (latestResult.rows[0] as any).metric_value : 0;
      
      return {
        count: row.count || 0,
        average: row.avg || 0,
        min: row.min || 0,
        max: row.max || 0,
        latest
      };
      
    } catch (error) {
      console.error('获取指标统计失败:', error);
      return { count: 0, average: 0, min: 0, max: 0, latest: 0 };
    }
  }
  
  /**
   * 获取质量指标趋势
   */
  public async getQualityTrend(timeRange: { start: Date; end: Date }): Promise<{
    averageScore: number;
    totalTasks: number;
    improvementRate: number;
    commonIssues: string[];
  }> {
    try {
      // 获取平均质量分数
      const scoreResult = await this.db.execute(
        'SELECT AVG(overall_score) as avg_score, COUNT(*) as total FROM quality_assessments WHERE created_at BETWEEN ? AND ?',
        [timeRange.start.toISOString(), timeRange.end.toISOString()]
      );
      
      const scoreRow = scoreResult.rows[0] as any;
      
      // 获取改进率（与前一个时间段比较）
      const previousStart = new Date(timeRange.start.getTime() - (timeRange.end.getTime() - timeRange.start.getTime()));
      const previousResult = await this.db.execute(
        'SELECT AVG(overall_score) as avg_score FROM quality_assessments WHERE created_at BETWEEN ? AND ?',
        [previousStart.toISOString(), timeRange.start.toISOString()]
      );
      
      const previousRow = previousResult.rows[0] as any;
      const currentAvg = scoreRow.avg_score || 0;
      const previousAvg = previousRow.avg_score || 0;
      const improvementRate = previousAvg > 0 ? ((currentAvg - previousAvg) / previousAvg) * 100 : 0;
      
      // 获取常见问题（从推荐中提取）
      const recommendationsResult = await this.db.execute(
        'SELECT recommendations FROM quality_assessments WHERE created_at BETWEEN ? AND ? AND recommendations IS NOT NULL',
        [timeRange.start.toISOString(), timeRange.end.toISOString()]
      );
      
      const allRecommendations: string[] = [];
      recommendationsResult.rows.forEach((row: any) => {
        try {
          const recs = JSON.parse(row.recommendations);
          allRecommendations.push(...recs);
        } catch (e) {
          // 忽略解析错误
        }
      });
      
      // 统计最常见的问题
      const issueCount = new Map<string, number>();
      allRecommendations.forEach(issue => {
        issueCount.set(issue, (issueCount.get(issue) || 0) + 1);
      });
      
      const commonIssues = Array.from(issueCount.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([issue]) => issue);
      
      return {
        averageScore: currentAvg,
        totalTasks: scoreRow.total || 0,
        improvementRate,
        commonIssues
      };
      
    } catch (error) {
      console.error('获取质量趋势失败:', error);
      return {
        averageScore: 0,
        totalTasks: 0,
        improvementRate: 0,
        commonIssues: []
      };
    }
  }
  
  /**
   * 启动健康检查
   */
  private startHealthChecks(): void {
    this.healthCheckInterval = setInterval(async () => {
      const health = await this.getSystemHealth();
      
      // 记录健康状态指标
      await this.recordMetric({
        name: 'system_health_score',
        value: health.status === 'healthy' ? 100 : health.status === 'degraded' ? 50 : 0,
        unit: 'score'
      });
      
      await this.recordMetric({
        name: 'memory_usage_percentage',
        value: health.memoryUsage.percentage,
        unit: 'percent'
      });
      
      await this.recordMetric({
        name: 'error_rate',
        value: health.errorRate,
        unit: 'percent'
      });
      
      await this.recordMetric({
        name: 'average_response_time',
        value: health.averageResponseTime,
        unit: 'ms'
      });
      
    }, 60000); // 每分钟检查一次
  }
  
  /**
   * 停止监控
   */
  public stop(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
  }
  
  /**
   * 触发告警
   */
  private async triggerAlert(type: string, message: string): Promise<void> {
    console.error(`🚨 告警 [${type}]: ${message}`);
    // TODO: 实现实际的告警机制（邮件、Slack、钉钉等）
  }
  
  /**
   * 获取错误数量
   */
  private async getErrorCount(since: Date): Promise<number> {
    try {
      const result = await this.db.execute(
        'SELECT COUNT(*) as count FROM error_logs WHERE created_at >= ?',
        [since.toISOString()]
      );
      return (result.rows[0] as any).count || 0;
    } catch (error) {
      return 0;
    }
  }
  
  /**
   * 获取请求数量
   */
  private async getRequestCount(since: Date): Promise<number> {
    try {
      const result = await this.db.execute(
        'SELECT COUNT(*) as count FROM task_history WHERE created_at >= ?',
        [since.toISOString()]
      );
      return (result.rows[0] as any).count || 0;
    } catch (error) {
      return 0;
    }
  }
  
  /**
   * 获取平均响应时间
   */
  private async getAverageResponseTime(since: Date): Promise<number> {
    try {
      const result = await this.db.execute(
        'SELECT AVG(processing_time_ms) as avg_time FROM task_history WHERE created_at >= ? AND processing_time_ms IS NOT NULL',
        [since.toISOString()]
      );
      return (result.rows[0] as any).avg_time || 0;
    } catch (error) {
      return 0;
    }
  }
}

/**
 * 导出监控系统实例
 */
export const monitoringSystem = MonitoringSystem.getInstance();
