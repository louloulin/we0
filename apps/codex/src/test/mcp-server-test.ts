/**
 * MCP Server Test
 * 
 * Tests the MCP server functionality
 */

import { describe, test, expect } from '@jest/globals';

describe('MCP Server', () => {
  test('should be able to import MCP server module', async () => {
    // Test that the MCP server module can be imported without errors
    const { MCPServer } = await import('@mastra/mcp');
    expect(MCPServer).toBeDefined();
    expect(typeof MCPServer).toBe('function');
  });

  test('should be able to import all tools for MCP server', async () => {
    // Test that all tools can be imported
    const screenshotTools = await import('../mastra/tools/screenshot-tool');
    const tokenTools = await import('../mastra/tools/token-tool');
    const databaseTools = await import('../mastra/tools/database-prompt-tool');
    const utilityTools = await import('../mastra/tools/utility-functions-tool');
    const fileProcessingTools = await import('../mastra/tools/file-processing-tool');

    // Screenshot tools
    expect(screenshotTools.captureScreenshotTool).toBeDefined();
    expect(screenshotTools.captureFullPageScreenshotTool).toBeDefined();
    expect(screenshotTools.captureMobileScreenshotTool).toBeDefined();

    // Token tools
    expect(tokenTools.countTokensTool).toBeDefined();
    expect(tokenTools.calculateTokenCostTool).toBeDefined();
    expect(tokenTools.trackTokenUsageTool).toBeDefined();
    expect(tokenTools.checkTokenLimitsTool).toBeDefined();

    // Database tools
    expect(databaseTools.generateMySQLPromptTool).toBeDefined();
    expect(databaseTools.generatePostgreSQLPromptTool).toBeDefined();
    expect(databaseTools.generateRedisPromptTool).toBeDefined();
    expect(databaseTools.generateMongoDBPromptTool).toBeDefined();
    expect(databaseTools.generateSQLitePromptTool).toBeDefined();
    expect(databaseTools.compareDatabasesTool).toBeDefined();

    // Utility tools
    expect(utilityTools.jsonToZodTool).toBeDefined();
    expect(utilityTools.processMarkdownTool).toBeDefined();
    expect(utilityTools.detectLanguageTool).toBeDefined();
    expect(utilityTools.stripIndentsTool).toBeDefined();
    expect(utilityTools.formatCodeTool).toBeDefined();
    expect(utilityTools.extractImportsTool).toBeDefined();
    expect(utilityTools.generateIdTool).toBeDefined();
    expect(utilityTools.deepCloneTool).toBeDefined();
    expect(utilityTools.analyzeCodeComplexityTool).toBeDefined();
    expect(utilityTools.validateJsonSchemaTool).toBeDefined();

    // File processing tools
    expect(fileProcessingTools.parseArtifactTool).toBeDefined();
    expect(fileProcessingTools.processMessagesTool).toBeDefined();
    expect(fileProcessingTools.analyzeFileStructureTool).toBeDefined();
    expect(fileProcessingTools.filterFilesTool).toBeDefined();
    expect(fileProcessingTools.validateFilesTool).toBeDefined();
    expect(fileProcessingTools.summarizeFilesTool).toBeDefined();
  });

  test('should be able to import agents for MCP server', async () => {
    // Test that agents can be imported
    const deepseekAgents = await import('../mastra/agents/deepseek-agent');
    const multiModelAgent = await import('../mastra/agents/multi-model-agent');

    expect(deepseekAgents.deepseekAgent).toBeDefined();
    expect(deepseekAgents.deepseekCoderAgent).toBeDefined();
    expect(multiModelAgent.multiModelAgent).toBeDefined();
  });

  test('should be able to import workflows for MCP server', async () => {
    // Test that workflows can be imported
    const builderWorkflow = await import('../mastra/workflows/builder-workflow');
    const chatWorkflow = await import('../mastra/workflows/chat-workflow');

    expect(builderWorkflow.builderWorkflow).toBeDefined();
    expect(chatWorkflow.chatWorkflow).toBeDefined();
  });

  test('should have MCP configuration file', () => {
    // Test that MCP configuration exists
    const fs = require('fs');
    const path = require('path');
    
    const mcpConfigPath = path.join(process.cwd(), '.cursor', 'mcp.json');
    expect(fs.existsSync(mcpConfigPath)).toBe(true);
    
    const mcpConfig = JSON.parse(fs.readFileSync(mcpConfigPath, 'utf8'));
    expect(mcpConfig.mcpServers).toBeDefined();
    expect(mcpConfig.mcpServers['mastra-docs']).toBeDefined();
    expect(mcpConfig.mcpServers['codex-tools']).toBeDefined();
    
    // Check that the codex-tools server points to our MCP server
    expect(mcpConfig.mcpServers['codex-tools'].command).toBe('npx');
    expect(mcpConfig.mcpServers['codex-tools'].args).toEqual(['tsx', 'src/mcp-server.ts']);
  });

  test('should be able to create MCPServer instance', async () => {
    const { MCPServer } = await import('@mastra/mcp');
    
    // Import some tools for testing
    const { captureScreenshotTool } = await import('../mastra/tools/screenshot-tool');
    const { countTokensTool } = await import('../mastra/tools/token-tool');
    
    // Create MCP server instance
    const server = new MCPServer({
      name: "Test MCP Server",
      version: "1.0.0",
      description: "Test server for validation",
      tools: {
        captureScreenshotTool,
        countTokensTool,
      },
    });

    expect(server).toBeDefined();
    expect(typeof server.startStdio).toBe('function');
    expect(typeof server.startSSE).toBe('function');
  });

  test('should validate tool structure for MCP compatibility', async () => {
    // Test that tools have the expected structure for MCP
    const { captureScreenshotTool } = await import('../mastra/tools/screenshot-tool');
    const { generateMySQLPromptTool } = await import('../mastra/tools/database-prompt-tool');
    
    // Check tool structure
    expect(captureScreenshotTool).toBeDefined();
    expect(typeof captureScreenshotTool.execute).toBe('function');
    
    expect(generateMySQLPromptTool).toBeDefined();
    expect(typeof generateMySQLPromptTool.execute).toBe('function');
    
    // Tools should be compatible with MCP format
    // (The actual MCP compatibility is handled by Mastra internally)
  });

  test('should validate agent structure for MCP compatibility', async () => {
    // Test that agents have the expected structure for MCP
    const { deepseekAgent } = await import('../mastra/agents/deepseek-agent');
    
    expect(deepseekAgent).toBeDefined();
    expect(typeof deepseekAgent.generate).toBe('function');
    expect(typeof deepseekAgent.stream).toBe('function');
    
    // Agents should have description for MCP tool conversion
    expect(deepseekAgent.name).toBeDefined();
    expect(deepseekAgent.description).toBeDefined();
    expect(typeof deepseekAgent.description).toBe('string');
    expect(deepseekAgent.description.length).toBeGreaterThan(0);
  });

  test('should validate workflow structure for MCP compatibility', async () => {
    // Test that workflows have the expected structure for MCP
    const { builderWorkflow } = await import('../mastra/workflows/builder-workflow');
    
    expect(builderWorkflow).toBeDefined();
    expect(typeof builderWorkflow.createRunAsync).toBe('function');
    
    // Workflows should have description for MCP tool conversion
    expect(builderWorkflow.id).toBeDefined();
    expect(builderWorkflow.description).toBeDefined();
    expect(typeof builderWorkflow.description).toBe('string');
    expect(builderWorkflow.description.length).toBeGreaterThan(0);
  });

  test('should handle MCP server startup gracefully', async () => {
    // Test that MCP server can be started without errors
    // Note: This is a structure test, not actually starting the server
    
    const { MCPServer } = await import('@mastra/mcp');
    const { captureScreenshotTool } = await import('../mastra/tools/screenshot-tool');
    
    const server = new MCPServer({
      name: "Test Server",
      version: "1.0.0",
      tools: { captureScreenshotTool },
    });

    // Test that server methods exist
    expect(typeof server.startStdio).toBe('function');
    expect(typeof server.startSSE).toBe('function');
    
    // Note: We don't actually start the server in tests to avoid port conflicts
    // In a real scenario, you would test actual server startup and shutdown
  });
});
