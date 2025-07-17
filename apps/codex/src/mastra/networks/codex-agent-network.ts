/**
 * Codex Agent Network (vNext)
 *
 * Intelligent orchestration layer that lets AI decide how to best use agents, workflows, and tools
 * Based on Mastra vNext Agent Network implementation
 *
 * Note: This is a simplified implementation due to current API limitations
 */

import { NewAgentNetwork } from '@mastra/core/network/vNext';
import { RuntimeContext } from '@mastra/core/runtime-context';
import { Memory } from '@mastra/memory';
import { LibSQLStore } from '@mastra/libsql';
import { deepseek } from '../models/deepseek';

// Import all agents
import { deepseekAgent, deepseekCoderAgent } from '../agents/deepseek-agent';

// Import all workflows
import { builderWorkflow } from '../workflows/builder-workflow';
import { chatWorkflow } from '../workflows/chat-workflow';
import { apiOptimizationWorkflow } from '../workflows/api-optimization-workflow';
import { approvalWorkflow } from '../workflows/approval-workflow';
import { eventDrivenWorkflow } from '../workflows/event-driven-workflow';

// Import all tools
import { captureScreenshotTool, captureFullPageScreenshotTool, captureMobileScreenshotTool } from '../tools/screenshot-tool';
import { countTokensTool, calculateTokenCostTool, trackTokenUsageTool, checkTokenLimitsTool } from '../tools/token-tool';
import { 
  generateMySQLPromptTool, 
  generatePostgreSQLPromptTool, 
  generateRedisPromptTool, 
  generateMongoDBPromptTool, 
  generateSQLitePromptTool,
  compareDatabaseOptionsTool
} from '../tools/database-prompt-tool';
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
} from '../tools/utility-functions-tool';
import { 
  parseArtifactTool, 
  processMessagesTool, 
  analyzeFileStructureTool, 
  filterFilesTool, 
  validateFilesTool, 
  summarizeFilesTool 
} from '../tools/file-processing-tool';

/**
 * Create memory instance for Agent Network
 */
function createAgentNetworkMemory() {
  return new Memory({
    storage: new LibSQLStore({
      url: 'file:./agent-network-memory.db',
    }),
    options: {
      lastMessages: 20,
      workingMemory: { enabled: true, scope: 'resource' }
    }
  });
}

/**
 * Codex Agent Network for intelligent task orchestration
 * 
 * This network can handle:
 * - Code generation and analysis
 * - File processing and manipulation
 * - Database configuration and optimization
 * - Screenshot capture and processing
 * - Token management and cost calculation
 * - Multi-step workflows with human approval
 * - Event-driven monitoring and alerting
 */
export const codexAgentNetwork = new NewAgentNetwork({
  id: 'codex-agent-network',
  name: 'Codex Agent Network',
  instructions: `
You are an intelligent orchestration system for a comprehensive code development and AI assistance platform.

Your capabilities include:

**Code Development & Analysis:**
- Generate, analyze, and optimize code in multiple languages
- Process and manipulate files and project structures
- Detect programming languages and analyze code complexity
- Format code and extract imports/dependencies

**Database & Infrastructure:**
- Generate configuration prompts for MySQL, PostgreSQL, Redis, MongoDB, SQLite
- Compare database options and provide recommendations
- Optimize API performance and caching strategies

**Visual & Media Processing:**
- Capture screenshots (standard, full-page, mobile)
- Process images and visual content
- Handle multimedia file processing

**Token & Cost Management:**
- Count tokens and calculate costs for different models
- Track usage and enforce limits
- Optimize token usage for cost efficiency

**Workflow Orchestration:**
- Execute complex multi-step workflows
- Handle human-in-the-loop approval processes
- Monitor systems and respond to events automatically
- Coordinate between different agents and tools

**File & Content Processing:**
- Parse boltArtifact tags and extract file content
- Process messages and analyze project structures
- Validate file content and generate summaries
- Filter and organize files based on criteria

**Decision Making Guidelines:**
1. For simple code questions or single tasks, use individual agents
2. For complex multi-step processes, use workflows
3. For file processing tasks, use file processing tools
4. For database-related questions, use database prompt tools
5. For visual content, use screenshot tools
6. For cost analysis, use token management tools
7. For approval processes, use approval workflow
8. For monitoring tasks, use event-driven workflow

Always choose the most specific and appropriate primitive for each task.
Provide clear, actionable responses with proper context and explanations.
  `.trim(),
  model: deepseek('deepseek-chat'),

  // Register all agents
  agents: {
    deepseekAgent,
    deepseekCoderAgent,
  },

  // Register all workflows
  workflows: {
    builderWorkflow,
    chatWorkflow,
    apiOptimizationWorkflow,
    approvalWorkflow,
    eventDrivenWorkflow,
  },

  // Memory for context-aware routing
  memory: createAgentNetworkMemory(),
});

/**
 * Convenience function for single task execution
 * Perfect for chat interfaces and one-off tasks
 */
export async function executeTask(
  task: string,
  runtimeContext?: RuntimeContext
): Promise<string> {
  const context = runtimeContext || new RuntimeContext();
  const result = await codexAgentNetwork.generate(task, { runtimeContext: context });
  return result.result;
}

/**
 * Convenience function for complex multi-step task execution
 * For tasks requiring multiple primitives and sophisticated planning
 */
export async function executeComplexTask(
  task: string,
  runtimeContext?: RuntimeContext
): Promise<string> {
  const context = runtimeContext || new RuntimeContext();
  const result = await codexAgentNetwork.loop(task, { runtimeContext: context });
  return result.result.text;
}

/**
 * Stream task execution for real-time responses
 */
export async function streamTask(
  task: string, 
  runtimeContext?: RuntimeContext
) {
  const context = runtimeContext || new RuntimeContext();
  return await codexAgentNetwork.stream(task, { runtimeContext: context });
}

/**
 * Example usage patterns:
 * 
 * // Simple task - uses .generate()
 * const result = await executeTask("Generate a React component for a login form");
 * 
 * // Complex task - uses .loop()
 * const result = await executeComplexTask(
 *   "Analyze this project structure, generate database configuration for PostgreSQL, " +
 *   "create API endpoints, and provide deployment recommendations"
 * );
 * 
 * // Streaming response
 * const stream = await streamTask("Explain how to optimize this code for performance");
 * for await (const chunk of stream) {
 *   console.log(chunk);
 * }
 */
