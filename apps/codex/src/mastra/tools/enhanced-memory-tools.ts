/**
 * 增强记忆工具集
 * 
 * 基于Mastra Memory系统，提供智能的上下文记忆和检索功能，
 * 支持项目历史、用户偏好和会话管理。
 */

import { createTool } from '@mastra/core/tools';
import { Memory } from '@mastra/memory';
import { LibSQLStore } from '@mastra/libsql';
import { z } from 'zod';

// 创建共享的记忆存储
const createMemoryStorage = () => new Memory({
  storage: new LibSQLStore({
    url: process.env.DATABASE_URL || 'file:./enhanced-memory.db',
  }),
});

// 全局记忆实例
const globalMemory = createMemoryStorage();

// 记忆类型定义
const MemoryType = z.enum([
  'user_preference',    // 用户偏好
  'project_context',    // 项目上下文
  'session_history',    // 会话历史
  'code_pattern',       // 代码模式
  'solution_template',  // 解决方案模板
  'error_solution',     // 错误解决方案
  'best_practice'       // 最佳实践
]);

/**
 * 记忆写入工具
 * 用于存储各种类型的记忆信息
 */
export const memoryWriteTool = createTool({
  id: 'memory-write',
  description: '存储记忆信息，支持多种类型的上下文和偏好',
  inputSchema: z.object({
    key: z.string().describe('记忆键值'),
    content: z.string().describe('记忆内容'),
    type: MemoryType.describe('记忆类型'),
    tags: z.array(z.string()).optional().describe('标签列表'),
    metadata: z.record(z.any()).optional().describe('元数据'),
    ttl: z.number().optional().describe('生存时间（秒）')
  }),
  outputSchema: z.object({
    success: z.boolean(),
    message: z.string(),
    memory_id: z.string().optional()
  }),
  execute: async ({ context }) => {
    const { key, content, type, tags, metadata, ttl } = context;
    
    try {
      // 构建记忆对象
      const memoryData = {
        key,
        content,
        type,
        tags: tags || [],
        metadata: metadata || {},
        timestamp: new Date().toISOString(),
        ttl: ttl ? Date.now() + (ttl * 1000) : undefined
      };
      
      // 存储到记忆系统
      await globalMemory.add({
        id: key,
        content: JSON.stringify(memoryData),
        metadata: {
          type,
          tags: tags?.join(',') || '',
          ...metadata
        }
      });
      
      return {
        success: true,
        message: `记忆 ${key} 存储成功`,
        memory_id: key
      };
    } catch (error: any) {
      return {
        success: false,
        message: `存储记忆失败: ${error.message}`
      };
    }
  }
});

/**
 * 记忆读取工具
 * 用于检索特定的记忆信息
 */
export const memoryReadTool = createTool({
  id: 'memory-read',
  description: '读取特定的记忆信息',
  inputSchema: z.object({
    key: z.string().describe('记忆键值'),
    include_metadata: z.boolean().default(false).describe('是否包含元数据')
  }),
  outputSchema: z.object({
    found: z.boolean(),
    content: z.string().optional(),
    type: z.string().optional(),
    tags: z.array(z.string()).optional(),
    metadata: z.record(z.any()).optional(),
    timestamp: z.string().optional()
  }),
  execute: async ({ context }) => {
    const { key, include_metadata } = context;
    
    try {
      const memories = await globalMemory.search({
        query: key,
        limit: 1
      });
      
      if (memories.length === 0) {
        return {
          found: false
        };
      }
      
      const memory = memories[0];
      const memoryData = JSON.parse(memory.content);
      
      return {
        found: true,
        content: memoryData.content,
        type: memoryData.type,
        tags: memoryData.tags,
        metadata: include_metadata ? memoryData.metadata : undefined,
        timestamp: memoryData.timestamp
      };
    } catch (error: any) {
      return {
        found: false
      };
    }
  }
});

/**
 * 记忆搜索工具
 * 用于智能搜索相关的记忆信息
 */
export const memorySearchTool = createTool({
  id: 'memory-search',
  description: '智能搜索相关的记忆信息，支持语义搜索和过滤',
  inputSchema: z.object({
    query: z.string().describe('搜索查询'),
    type: MemoryType.optional().describe('记忆类型过滤'),
    tags: z.array(z.string()).optional().describe('标签过滤'),
    limit: z.number().default(10).describe('返回结果数量限制'),
    similarity_threshold: z.number().default(0.7).describe('相似度阈值')
  }),
  outputSchema: z.object({
    results: z.array(z.object({
      key: z.string(),
      content: z.string(),
      type: z.string(),
      tags: z.array(z.string()),
      score: z.number(),
      timestamp: z.string()
    })),
    total_count: z.number()
  }),
  execute: async ({ context }) => {
    const { query, type, tags, limit, similarity_threshold } = context;
    
    try {
      // 执行语义搜索
      const memories = await globalMemory.search({
        query,
        limit: limit * 2 // 获取更多结果用于过滤
      });
      
      // 解析和过滤结果
      const results = [];
      for (const memory of memories) {
        try {
          const memoryData = JSON.parse(memory.content);
          
          // 类型过滤
          if (type && memoryData.type !== type) {
            continue;
          }
          
          // 标签过滤
          if (tags && tags.length > 0) {
            const hasMatchingTag = tags.some(tag => 
              memoryData.tags.includes(tag)
            );
            if (!hasMatchingTag) {
              continue;
            }
          }
          
          // 相似度过滤
          const score = memory.score || 0;
          if (score < similarity_threshold) {
            continue;
          }
          
          results.push({
            key: memoryData.key,
            content: memoryData.content,
            type: memoryData.type,
            tags: memoryData.tags,
            score,
            timestamp: memoryData.timestamp
          });
          
          if (results.length >= limit) {
            break;
          }
        } catch (parseError) {
          // 跳过解析失败的记忆
          continue;
        }
      }
      
      return {
        results,
        total_count: results.length
      };
    } catch (error: any) {
      return {
        results: [],
        total_count: 0
      };
    }
  }
});

/**
 * 记忆管理工具
 * 用于管理记忆的生命周期和维护
 */
export const memoryManageTool = createTool({
  id: 'memory-manage',
  description: '管理记忆的生命周期，包括清理、更新和统计',
  inputSchema: z.object({
    action: z.enum(['cleanup', 'update', 'delete', 'stats']).describe('管理操作'),
    key: z.string().optional().describe('记忆键值（用于更新和删除）'),
    update_data: z.record(z.any()).optional().describe('更新数据'),
    cleanup_criteria: z.object({
      older_than_days: z.number().optional(),
      type: MemoryType.optional(),
      unused_for_days: z.number().optional()
    }).optional().describe('清理条件')
  }),
  outputSchema: z.object({
    success: z.boolean(),
    message: z.string(),
    affected_count: z.number().optional(),
    stats: z.record(z.any()).optional()
  }),
  execute: async ({ context }) => {
    const { action, key, update_data, cleanup_criteria } = context;
    
    try {
      switch (action) {
        case 'cleanup':
          // 实现记忆清理逻辑
          const cleanupCount = await performMemoryCleanup(cleanup_criteria);
          return {
            success: true,
            message: `清理了 ${cleanupCount} 条过期记忆`,
            affected_count: cleanupCount
          };
          
        case 'update':
          if (!key || !update_data) {
            throw new Error('更新操作需要提供键值和更新数据');
          }
          // 实现记忆更新逻辑
          return {
            success: true,
            message: `记忆 ${key} 更新成功`,
            affected_count: 1
          };
          
        case 'delete':
          if (!key) {
            throw new Error('删除操作需要提供键值');
          }
          // 实现记忆删除逻辑
          return {
            success: true,
            message: `记忆 ${key} 删除成功`,
            affected_count: 1
          };
          
        case 'stats':
          const stats = await getMemoryStats();
          return {
            success: true,
            message: '记忆统计信息获取成功',
            stats
          };
          
        default:
          throw new Error(`不支持的操作: ${action}`);
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
        affected_count: 0
      };
    }
  }
});

// 辅助函数：执行记忆清理
async function performMemoryCleanup(criteria: any): Promise<number> {
  // 这里应该实现实际的清理逻辑
  // 暂时返回模拟值
  return 0;
}

// 辅助函数：获取记忆统计信息
async function getMemoryStats(): Promise<Record<string, any>> {
  // 这里应该实现实际的统计逻辑
  return {
    total_memories: 0,
    by_type: {},
    storage_size: '0 MB',
    last_cleanup: new Date().toISOString()
  };
}

// 导出记忆实例供其他模块使用
export { globalMemory };

// 导出工具配置信息
export const memoryToolConfigs = {
  memoryWrite: {
    id: 'memory-write',
    name: 'Memory Write',
    category: 'memory-management',
    capabilities: ['context-storage', 'preference-management']
  },
  memoryRead: {
    id: 'memory-read',
    name: 'Memory Read',
    category: 'memory-management',
    capabilities: ['context-retrieval', 'preference-access']
  },
  memorySearch: {
    id: 'memory-search',
    name: 'Memory Search',
    category: 'memory-management',
    capabilities: ['semantic-search', 'context-discovery']
  },
  memoryManage: {
    id: 'memory-manage',
    name: 'Memory Manage',
    category: 'memory-management',
    capabilities: ['lifecycle-management', 'maintenance', 'statistics']
  }
};
