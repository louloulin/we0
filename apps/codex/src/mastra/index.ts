
import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { LibSQLStore, LibSQLVector } from '@mastra/libsql';
import { weatherWorkflow } from './workflows/weather-workflow';
import { deepseekCodeGenerationWorkflow } from './workflows/deepseek-workflow';
import { builderWorkflow } from './workflows/builder-workflow';
import { chatWorkflow } from './workflows/chat-workflow';
import { weatherAgent } from './agents/weather-agent';
import { deepseekAgent, deepseekCoderAgent } from './agents/deepseek-agent';

// Import API routes
import { chatRoute } from './routes/chat';
import { modelRoute } from './routes/model';
import { deployRoute } from './routes/deploy';
import { enhancedPromptRoute } from './routes/enhanced-prompt';

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
    builderWorkflow,
    chatWorkflow,
  },
  agents: {
    weatherAgent,
    deepseekAgent,
    deepseekCoderAgent,
  },

  // Persistent storage for memory and data
  storage,

  // Note: Tools are registered with agents, not directly with Mastra
  // The tools are available through the agents that use them

  // Enhanced logging
  logger: new PinoLogger({
    name: 'DeepSeek-Mastra-API',
    level: 'info',
  }),

  // Server configuration with API routes
  server: {
    port: 4111,
    host: 'localhost',
    cors: {
      origin: '*',
      allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowHeaders: ['Content-Type', 'Authorization', 'userId'],
      credentials: false,
    },
    apiRoutes: [
      chatRoute,
      modelRoute,
      deployRoute,
      enhancedPromptRoute,
    ],
  },
});

// Make Mastra instance globally available for API routes
declare global {
  var mastra: Mastra;
}
globalThis.mastra = mastra;
