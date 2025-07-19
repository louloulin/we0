/**
 * 生产环境配置管理 - Phase 4 部署准备
 * 
 * 这个模块负责管理智能编程助手在生产环境中的配置，
 * 包括环境变量、数据库连接、监控设置等。
 * 
 * 核心功能：
 * - 环境配置验证和管理
 * - 数据库连接配置
 * - 监控和日志配置
 * - 性能优化设置
 * - 安全配置
 */

import { z } from 'zod';

/**
 * 生产环境配置模式
 */
export const ProductionConfigSchema = z.object({
  // 基础配置
  environment: z.enum(['development', 'staging', 'production', 'test']),
  port: z.number().min(1000).max(65535).default(3000),
  host: z.string().default('0.0.0.0'),
  
  // 数据库配置
  database: z.object({
    url: z.string().url(),
    maxConnections: z.number().min(1).max(100).default(10),
    connectionTimeout: z.number().min(1000).max(30000).default(5000),
    enableSSL: z.boolean().default(true),
    enableMigrations: z.boolean().default(true),
  }),
  
  // Agent Network 配置
  agentNetwork: z.object({
    memoryStorageUrl: z.string(),
    maxConcurrentTasks: z.number().min(1).max(50).default(10),
    taskTimeoutMs: z.number().min(5000).max(300000).default(60000),
    enableMemoryPersistence: z.boolean().default(true),
    enableTaskHistory: z.boolean().default(true),
  }),
  
  // 模型配置
  models: z.object({
    deepseek: z.object({
      apiKey: z.string().min(1),
      baseUrl: z.string().url().optional(),
      maxTokens: z.number().min(1000).max(200000).default(32000),
      temperature: z.number().min(0).max(2).default(0.7),
    }),
    fallbackModel: z.string().default('deepseek-chat'),
  }),
  
  // 监控配置
  monitoring: z.object({
    enableMetrics: z.boolean().default(true),
    enableTracing: z.boolean().default(true),
    enableLogging: z.boolean().default(true),
    logLevel: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
    metricsPort: z.number().min(1000).max(65535).default(9090),
  }),
  
  // 安全配置
  security: z.object({
    enableCORS: z.boolean().default(true),
    allowedOrigins: z.array(z.string()).default(['*']),
    enableRateLimit: z.boolean().default(true),
    rateLimitWindowMs: z.number().min(1000).max(3600000).default(60000),
    rateLimitMaxRequests: z.number().min(1).max(1000).default(100),
  }),
  
  // 性能配置
  performance: z.object({
    enableCaching: z.boolean().default(true),
    cacheMaxSize: z.number().min(1).max(1000).default(100),
    cacheTTLMs: z.number().min(1000).max(3600000).default(300000),
    enableCompression: z.boolean().default(true),
    maxRequestSizeBytes: z.number().min(1024).max(50 * 1024 * 1024).default(10 * 1024 * 1024),
  }),
});

export type ProductionConfig = z.infer<typeof ProductionConfigSchema>;

/**
 * 生产配置管理器
 */
export class ProductionConfigManager {
  private static instance: ProductionConfigManager;
  private config: ProductionConfig | null = null;
  
  private constructor() {}
  
  public static getInstance(): ProductionConfigManager {
    if (!ProductionConfigManager.instance) {
      ProductionConfigManager.instance = new ProductionConfigManager();
    }
    return ProductionConfigManager.instance;
  }
  
  /**
   * 加载和验证生产配置
   */
  public loadConfig(): ProductionConfig {
    if (this.config) {
      return this.config;
    }
    
    try {
      const rawConfig = {
        environment: process.env.NODE_ENV || 'development',
        port: parseInt(process.env.PORT || '3000'),
        host: process.env.HOST || '0.0.0.0',
        
        database: {
          url: process.env.DATABASE_URL || 'file:./production.db',
          maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '10'),
          connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT || '5000'),
          enableSSL: process.env.DB_ENABLE_SSL === 'true',
          enableMigrations: process.env.DB_ENABLE_MIGRATIONS !== 'false',
        },
        
        agentNetwork: {
          memoryStorageUrl: process.env.AGENT_MEMORY_URL || 'file:./agent-network-memory.db',
          maxConcurrentTasks: parseInt(process.env.AGENT_MAX_CONCURRENT_TASKS || '10'),
          taskTimeoutMs: parseInt(process.env.AGENT_TASK_TIMEOUT_MS || '60000'),
          enableMemoryPersistence: process.env.AGENT_ENABLE_MEMORY_PERSISTENCE !== 'false',
          enableTaskHistory: process.env.AGENT_ENABLE_TASK_HISTORY !== 'false',
        },
        
        models: {
          deepseek: {
            apiKey: process.env.DEEPSEEK_API_KEY || '',
            baseUrl: process.env.DEEPSEEK_BASE_URL,
            maxTokens: parseInt(process.env.DEEPSEEK_MAX_TOKENS || '32000'),
            temperature: parseFloat(process.env.DEEPSEEK_TEMPERATURE || '0.7'),
          },
          fallbackModel: process.env.FALLBACK_MODEL || 'deepseek-chat',
        },
        
        monitoring: {
          enableMetrics: process.env.ENABLE_METRICS !== 'false',
          enableTracing: process.env.ENABLE_TRACING !== 'false',
          enableLogging: process.env.ENABLE_LOGGING !== 'false',
          logLevel: process.env.LOG_LEVEL || 'info',
          metricsPort: parseInt(process.env.METRICS_PORT || '9090'),
        },
        
        security: {
          enableCORS: process.env.ENABLE_CORS !== 'false',
          allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || ['*'],
          enableRateLimit: process.env.ENABLE_RATE_LIMIT !== 'false',
          rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'),
          rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
        },
        
        performance: {
          enableCaching: process.env.ENABLE_CACHING !== 'false',
          cacheMaxSize: parseInt(process.env.CACHE_MAX_SIZE || '100'),
          cacheTTLMs: parseInt(process.env.CACHE_TTL_MS || '300000'),
          enableCompression: process.env.ENABLE_COMPRESSION !== 'false',
          maxRequestSizeBytes: parseInt(process.env.MAX_REQUEST_SIZE_BYTES || '10485760'),
        },
      };
      
      this.config = ProductionConfigSchema.parse(rawConfig);
      console.log('✅ 生产配置加载成功');
      return this.config;
      
    } catch (error) {
      console.error('❌ 生产配置加载失败:', error);
      throw new Error(`生产配置验证失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }
  
  /**
   * 获取当前配置
   */
  public getConfig(): ProductionConfig {
    if (!this.config) {
      return this.loadConfig();
    }
    return this.config;
  }
  
  /**
   * 验证配置完整性
   */
  public validateConfig(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    try {
      const config = this.getConfig();
      
      // 检查必需的环境变量
      if (!config.models.deepseek.apiKey) {
        errors.push('DEEPSEEK_API_KEY 环境变量未设置');
      }
      
      if (!config.database.url || config.database.url === 'file:./production.db') {
        errors.push('DATABASE_URL 环境变量未设置或使用默认值');
      }
      
      // 检查生产环境特定配置
      if (config.environment === 'production') {
        if (config.security.allowedOrigins.includes('*')) {
          errors.push('生产环境不应允许所有来源的CORS请求');
        }
        
        if (!config.database.enableSSL) {
          errors.push('生产环境应启用数据库SSL连接');
        }
        
        if (config.monitoring.logLevel === 'debug') {
          errors.push('生产环境不应使用debug日志级别');
        }
      }
      
      return {
        isValid: errors.length === 0,
        errors
      };
      
    } catch (error) {
      errors.push(`配置验证失败: ${error instanceof Error ? error.message : '未知错误'}`);
      return {
        isValid: false,
        errors
      };
    }
  }
  
  /**
   * 生成环境变量模板
   */
  public generateEnvTemplate(): string {
    return `# 智能编程助手生产环境配置模板
# 复制此文件为 .env 并填写实际值

# 基础配置
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# 数据库配置
DATABASE_URL=postgresql://user:password@localhost:5432/intelligent_coding
DB_MAX_CONNECTIONS=20
DB_CONNECTION_TIMEOUT=5000
DB_ENABLE_SSL=true
DB_ENABLE_MIGRATIONS=true

# Agent Network 配置
AGENT_MEMORY_URL=postgresql://user:password@localhost:5432/agent_memory
AGENT_MAX_CONCURRENT_TASKS=10
AGENT_TASK_TIMEOUT_MS=60000
AGENT_ENABLE_MEMORY_PERSISTENCE=true
AGENT_ENABLE_TASK_HISTORY=true

# 模型配置
DEEPSEEK_API_KEY=your_deepseek_api_key_here
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MAX_TOKENS=32000
DEEPSEEK_TEMPERATURE=0.7
FALLBACK_MODEL=deepseek-chat

# 监控配置
ENABLE_METRICS=true
ENABLE_TRACING=true
ENABLE_LOGGING=true
LOG_LEVEL=info
METRICS_PORT=9090

# 安全配置
ENABLE_CORS=true
ALLOWED_ORIGINS=https://yourdomain.com,https://app.yourdomain.com
ENABLE_RATE_LIMIT=true
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# 性能配置
ENABLE_CACHING=true
CACHE_MAX_SIZE=100
CACHE_TTL_MS=300000
ENABLE_COMPRESSION=true
MAX_REQUEST_SIZE_BYTES=10485760
`;
  }
}

/**
 * 导出单例实例
 */
export const productionConfig = ProductionConfigManager.getInstance();
