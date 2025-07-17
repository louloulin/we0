#!/usr/bin/env node

/**
 * DeepSeek MCP Server
 * 
 * Exposes DeepSeek agents and tools via Model Context Protocol (MCP)
 * for use with compatible clients like Cursor, Windsurf, and other IDEs.
 */

import { MCPServer } from '@mastra/mcp';
import { deepseekAgent, deepseekCoderAgent } from '../agents/deepseek-agent';
import { 
  codeGeneratorTool, 
  codeAnalysisTool, 
  projectStructureTool 
} from '../tools/code-generator-tool';
import { 
  documentationTool, 
  apiDocumentationTool, 
  codeCommentTool 
} from '../tools/documentation-tool';

/**
 * Initialize the DeepSeek MCP Server
 * 
 * This server exposes:
 * - DeepSeek agents as callable tools (ask_deepseekAgent, ask_deepseekCoderAgent)
 * - Individual tools for direct use
 */
async function startDeepSeekMCPServer() {
  const server = new MCPServer({
    name: 'DeepSeek Development Assistant',
    version: '1.0.0',
    
    // Expose agents as tools
    agents: {
      deepseekAgent,
      deepseekCoderAgent,
    },
    
    // Expose individual tools
    tools: {
      codeGeneratorTool,
      codeAnalysisTool,
      projectStructureTool,
      documentationTool,
      apiDocumentationTool,
      codeCommentTool,
    },
  });

  // Start server based on transport method
  const transport = process.argv[2] || 'stdio';
  
  switch (transport) {
    case 'stdio':
      console.error('Starting DeepSeek MCP Server on stdio...');
      await server.startStdio();
      break;
      
    case 'sse':
      const port = parseInt(process.argv[3] || '3001');
      console.error(`Starting DeepSeek MCP Server on SSE port ${port}...`);
      await server.startSSE({ port });
      break;
      
    default:
      console.error('Usage: node deepseek-mcp-server.js [stdio|sse] [port]');
      process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.error('Shutting down DeepSeek MCP Server...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.error('Shutting down DeepSeek MCP Server...');
  process.exit(0);
});

// Start the server
if (require.main === module) {
  startDeepSeekMCPServer().catch((error) => {
    console.error('Failed to start DeepSeek MCP Server:', error);
    process.exit(1);
  });
}

export { startDeepSeekMCPServer };
