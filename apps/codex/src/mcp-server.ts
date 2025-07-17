#!/usr/bin/env node

/**
 * Codex MCP Server
 * 
 * Exposes Codex tools as MCP server for IDE integration
 */

import { MCPServer } from "@mastra/mcp";

// Import all tools
import { captureScreenshotTool, captureFullPageScreenshotTool, captureMobileScreenshotTool } from "./mastra/tools/screenshot-tool";
import { countTokensTool, calculateTokenCostTool, trackTokenUsageTool, checkTokenLimitsTool } from "./mastra/tools/token-tool";
import { 
  generateMySQLPromptTool, 
  generatePostgreSQLPromptTool, 
  generateRedisPromptTool, 
  generateMongoDBPromptTool, 
  generateSQLitePromptTool,
  compareDatabasesTool 
} from "./mastra/tools/database-prompt-tool";
import { 
  jsonToZodTool, 
  processMarkdownTool, 
  detectLanguageTool, 
  stripIndentsTool, 
  formatCodeTool, 
  extractImportsTool, 
  generateIdTool, 
  deepCloneTool, 
  analyzeCodeComplexityTool, 
  validateJsonSchemaTool 
} from "./mastra/tools/utility-functions-tool";
import {
  parseArtifactTool,
  processMessagesTool,
  analyzeFileStructureTool,
  filterFilesTool,
  validateFilesTool,
  summarizeFilesTool
} from "./mastra/tools/file-processing-tool";

// Import agents
import { deepseekAgent, deepseekCoderAgent } from "./mastra/agents/deepseek-agent";
import { multiModelAgent } from "./mastra/agents/multi-model-agent";

// Import workflows
import { builderWorkflow } from "./mastra/workflows/builder-workflow";
import { chatWorkflow } from "./mastra/workflows/chat-workflow";

async function startServer() {
  const server = new MCPServer({
    name: "Codex Tools Server",
    version: "2.0.0",
    description: "Mastra-powered tools for code generation, file processing, and AI assistance",
    
    // Expose all tools
    tools: {
      // Screenshot tools
      captureScreenshotTool,
      captureFullPageScreenshotTool,
      captureMobileScreenshotTool,
      
      // Token management tools
      countTokensTool,
      calculateTokenCostTool,
      trackTokenUsageTool,
      checkTokenLimitsTool,
      
      // Database prompt tools
      generateMySQLPromptTool,
      generatePostgreSQLPromptTool,
      generateRedisPromptTool,
      generateMongoDBPromptTool,
      generateSQLitePromptTool,
      compareDatabasesTool,
      
      // Utility function tools
      jsonToZodTool,
      processMarkdownTool,
      detectLanguageTool,
      stripIndentsTool,
      formatCodeTool,
      extractImportsTool,
      generateIdTool,
      deepCloneTool,
      analyzeCodeComplexityTool,
      validateJsonSchemaTool,
      
      // File processing tools
      parseArtifactTool,
      processMessagesTool,
      analyzeFileStructureTool,
      filterFilesTool,
      validateFilesTool,
      summarizeFilesTool,
    },
    
    // Expose agents as tools
    agents: {
      deepseekAgent,
      deepseekCoderAgent,
      multiModelAgent,
    },
    
    // Expose workflows as tools
    workflows: {
      builderWorkflow,
      chatWorkflow,
    },
  });

  // Start the server based on command line arguments
  const transport = process.argv[2] || "stdio";
  
  if (transport === "stdio") {
    await server.startStdio();
    console.error("Codex MCP Server started on stdio");
  } else if (transport === "sse") {
    const port = parseInt(process.argv[3] || "3001");
    await server.startSSE(port);
    console.error(`Codex MCP Server started on SSE port ${port}`);
  } else {
    console.error("Usage: tsx src/mcp-server.ts [stdio|sse] [port]");
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.error('Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.error('Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

// Start the server
startServer().catch((error) => {
  console.error("Failed to start MCP server:", error);
  process.exit(1);
});
