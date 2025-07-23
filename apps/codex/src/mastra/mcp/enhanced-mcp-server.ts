/**
 * 增强的 MCP 服务器 (基于 Mastra.ai 官方文档 v0.10.15+)
 * 集成 Claude Code 智能编程助手的所有工具、智能体和工作流
 * 
 * 功能特性：
 * - 完整的 MCP 协议支持
 * - 工具、智能体、工作流的统一暴露
 * - 结构化输出支持
 * - 企业级错误处理
 * 
 * @author Claude Code Team
 * @since 2025-01-23
 * @version 1.0.0
 */

import { MCPServer } from '@mastra/mcp';
import { 
  thinkingEnhancedDeepSeekAgent,
  architectureExpertAgent,
  claudeCodeFusionNetwork
} from '../networks/claude-code-fusion-network';
import {
  codeGeneratorTool,
  codeAnalysisTool,
  projectStructureTool,
  documentationTool,
  apiDocumentationTool,
  codeCommentTool
} from '../tools/claude-code-tools';
import { claudeCodeIntelligentWorkflow } from '../workflows/claude-code-workflow';

/**
 * 创建增强的 Claude Code MCP 服务器
 * 基于官方文档的最佳实践配置
 */
export const createEnhancedMCPServer = () => {
  console.log('🚀 初始化 Claude Code 增强 MCP 服务器...');

  const server = new MCPServer({
    name: 'Claude Code 智能编程助手 MCP 服务器',
    version: '1.0.0',
    
    // 暴露所有核心工具 (基于官方文档的工具暴露模式)
    tools: {
      // 代码生成和分析工具
      codeGeneratorTool,
      codeAnalysisTool,
      projectStructureTool,
      documentationTool,
      apiDocumentationTool,
      codeCommentTool,
    },

    // 暴露智能体作为工具 (基于官方文档的智能体暴露模式)
    agents: {
      // 思维增强的 DeepSeek 智能体 - 专门用于代码生成和问题解决
      thinkingEnhancedDeepSeekAgent: {
        ...thinkingEnhancedDeepSeekAgent,
        description: '思维增强的 DeepSeek 代码生成智能体，支持深度思考和高质量代码生成'
      },
      
      // 架构专家智能体 - 专门用于系统架构设计和技术决策
      architectureExpertAgent: {
        ...architectureExpertAgent,
        description: '企业级架构专家智能体，提供系统设计、技术选型和架构优化建议'
      }
    },

    // 暴露工作流 (基于官方文档的工作流暴露模式)
    workflows: {
      // Claude Code 智能工作流 - 完整的编程助手流程
      claudeCodeIntelligentWorkflow: {
        ...claudeCodeIntelligentWorkflow,
        description: 'Claude Code 智能编程工作流，集成代码生成、分析、优化的完整流程'
      }
    }
  });

  console.log('✅ Claude Code MCP 服务器初始化完成');
  console.log('📊 服务器配置:');
  console.log(`   - 工具数量: ${Object.keys(server.tools || {}).length}`);
  console.log(`   - 智能体数量: ${Object.keys(server.agents || {}).length}`);
  console.log(`   - 工作流数量: ${Object.keys(server.workflows || {}).length}`);

  return server;
};

/**
 * 启动 MCP 服务器 (stdio 模式)
 * 适用于 IDE 集成 (Cursor, Windsurf, VSCode)
 */
export const startMCPServerStdio = async () => {
  try {
    console.log('🔌 启动 Claude Code MCP 服务器 (stdio 模式)...');
    
    const server = createEnhancedMCPServer();
    await server.startStdio();
    
    console.log('✅ MCP 服务器已启动 (stdio 模式)');
    console.log('💡 现在可以在支持 MCP 的 IDE 中使用 Claude Code 智能编程助手');
  } catch (error) {
    console.error('❌ MCP 服务器启动失败:', error);
    process.exit(1);
  }
};

/**
 * 启动 MCP 服务器 (SSE 模式)
 * 适用于 Web 应用集成
 */
export const startMCPServerSSE = async (port: number = 3001) => {
  try {
    console.log(`🌐 启动 Claude Code MCP 服务器 (SSE 模式, 端口: ${port})...`);
    
    const server = createEnhancedMCPServer();
    await server.startSSE(port);
    
    console.log(`✅ MCP 服务器已启动 (SSE 模式)`);
    console.log(`🔗 服务器地址: http://localhost:${port}`);
    console.log('💡 现在可以通过 HTTP 接口使用 Claude Code 智能编程助手');
  } catch (error) {
    console.error('❌ MCP 服务器启动失败:', error);
    process.exit(1);
  }
};

/**
 * MCP 服务器健康检查
 */
export const checkMCPServerHealth = async () => {
  try {
    const server = createEnhancedMCPServer();
    
    console.log('🔍 执行 MCP 服务器健康检查...');
    
    // 检查工具可用性
    const toolsCount = Object.keys(server.tools || {}).length;
    const agentsCount = Object.keys(server.agents || {}).length;
    const workflowsCount = Object.keys(server.workflows || {}).length;
    
    console.log('📊 健康检查结果:');
    console.log(`   ✅ 工具: ${toolsCount} 个可用`);
    console.log(`   ✅ 智能体: ${agentsCount} 个可用`);
    console.log(`   ✅ 工作流: ${workflowsCount} 个可用`);
    
    if (toolsCount > 0 && agentsCount > 0 && workflowsCount > 0) {
      console.log('🎉 MCP 服务器健康状态: 优秀');
      return true;
    } else {
      console.log('⚠️ MCP 服务器健康状态: 需要检查');
      return false;
    }
  } catch (error) {
    console.error('❌ MCP 服务器健康检查失败:', error);
    return false;
  }
};

// 命令行启动支持
if (require.main === module) {
  const args = process.argv.slice(2);
  const mode = args[0] || 'stdio';
  const port = parseInt(args[1]) || 3001;

  switch (mode) {
    case 'stdio':
      startMCPServerStdio();
      break;
    case 'sse':
      startMCPServerSSE(port);
      break;
    case 'health':
      checkMCPServerHealth().then(healthy => {
        process.exit(healthy ? 0 : 1);
      });
      break;
    default:
      console.log('使用方法:');
      console.log('  npx tsx enhanced-mcp-server.ts stdio     # 启动 stdio 模式');
      console.log('  npx tsx enhanced-mcp-server.ts sse 3001  # 启动 SSE 模式');
      console.log('  npx tsx enhanced-mcp-server.ts health    # 健康检查');
      process.exit(1);
  }
}

export default {
  createEnhancedMCPServer,
  startMCPServerStdio,
  startMCPServerSSE,
  checkMCPServerHealth
};
