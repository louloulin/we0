
import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { LibSQLStore, LibSQLVector } from '@mastra/libsql';
import { weatherWorkflow } from './workflows/weather-workflow';
import { deepseekCodeGenerationWorkflow } from './workflows/deepseek-workflow';
import { weatherAgent } from './agents/weather-agent';
import { deepseekAgent, deepseekCoderAgent } from './agents/deepseek-agent';

// Import tools for direct access
import {
  codeGeneratorTool,
  codeAnalysisTool,
  projectStructureTool
} from './tools/code-generator-tool';
import {
  documentationTool,
  apiDocumentationTool,
  codeCommentTool
} from './tools/documentation-tool';
import {
  codebaseSearchTool,
  codeDocumentationSearchTool
} from './tools/codebase-rag-tool';

/**
 * Main Mastra Configuration
 *
 * Enhanced configuration with DeepSeek integration, comprehensive tooling,
 * and persistent storage for memory and vector operations.
 */

// Shared storage configuration for persistence
const storage = new LibSQLStore({
  url: 'file:../mastra.db', // Persistent storage for production use
});

export const mastra = new Mastra({
  workflows: {
    weatherWorkflow,
    deepseekCodeGenerationWorkflow,
  },
  agents: {
    weatherAgent,
    deepseekAgent,
    deepseekCoderAgent,
  },

  // Persistent storage for memory and data
  storage,

  // Register tools for direct access
  tools: {
    // Code generation and analysis tools
    codeGeneratorTool,
    codeAnalysisTool,
    projectStructureTool,

    // Documentation tools
    documentationTool,
    apiDocumentationTool,
    codeCommentTool,

    // RAG tools for codebase search
    codebaseSearchTool,
    codeDocumentationSearchTool,
  },

  // Enhanced logging
  logger: new PinoLogger({
    name: 'DeepSeek-Mastra',
    level: 'info',
  }),

  // Server configuration for development
  server: {
    port: 4111,
    host: 'localhost',
  },
});
