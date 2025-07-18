
import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { LibSQLStore, LibSQLVector } from '@mastra/libsql';
import { weatherWorkflow } from './workflows/weather-workflow';
import { deepseekCodeGenerationWorkflow } from './workflows/deepseek-workflow';
import { builderWorkflow } from './workflows/builder-workflow';
import { chatWorkflow } from './workflows/chat-workflow';
import { apiOptimizationWorkflow } from './workflows/api-optimization-workflow';
import { approvalWorkflow } from './workflows/approval-workflow';
import { eventDrivenWorkflow } from './workflows/event-driven-workflow';

// Import Agent Network (vNext)
import { codexAgentNetwork } from './networks/codex-agent-network';
import { intelligentCodingAgentNetwork } from './networks/intelligent-coding-network';
import { weatherAgent } from './agents/weather-agent';
import { deepseekAgent, deepseekCoderAgent } from './agents/deepseek-agent';

// Import API routes
import {
  chatApiRoute,
  modelApiRoute,
  deployApiRoute,
  enhancedPromptApiRoute,
  intelligentCodingApiRoute,
  intelligentCodingStatusRoute
} from './api-routes';
import { registerApiRoute } from '@mastra/core/server';
import {
  networkExecuteRoute,
  networkStatusRoute,
  networkCapabilitiesRoute,
  networkBatchRoute
} from './api/agent-network-api';

// Import services and configuration
import { productionConfig, logConfigurationStatus } from './config/production';
import { createMiddlewareStack } from './middleware';
import { fileProcessor } from './services/file-processor';
import { deploymentService } from './services/deployment-service';
import { cacheService } from './services/cache-service';
import { performanceService } from './services/performance-service';

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
    apiOptimizationWorkflow,
    approvalWorkflow,
    eventDrivenWorkflow,
  },
  agents: {
    weatherAgent,
    deepseekAgent,
    deepseekCoderAgent,
  },

  // vNext Agent Networks for intelligent orchestration
  vnext_networks: {
    'codex-agent-network': codexAgentNetwork,
    'intelligent-coding-network': intelligentCodingAgentNetwork,
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
    middleware: [
      // Performance monitoring middleware
      async (c, next) => {
        const startTime = Date.now();
        const url = new URL(c.req.url);
        const endpoint = url.pathname;
        const method = c.req.method;

        try {
          await next();
          const responseTime = Date.now() - startTime;

          // Record request metrics
          performanceService.recordRequest({
            endpoint,
            method,
            statusCode: c.res.status,
            responseTime,
            userId: c.req.header('userId') || undefined,
            model: c.req.header('X-Model') || undefined,
            cached: c.res.headers.get('X-Cache-Hit') === 'true',
          });
        } catch (error) {
          const responseTime = Date.now() - startTime;

          // Record error metrics
          performanceService.recordRequest({
            endpoint,
            method,
            statusCode: 500,
            responseTime,
            userId: c.req.header('userId') || undefined,
            model: c.req.header('X-Model') || undefined,
            cached: false,
          });

          throw error;
        }
      },
    ],
    apiRoutes: [
      // Test route
      registerApiRoute('/test', {
        method: 'GET',
        handler: async (c) => {
          return c.json({ message: 'Test route working!' });
        },
      }),
      // Health check route
      registerApiRoute('/health', {
        method: 'GET',
        handler: async (c) => {
          const health = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            environment: process.env.NODE_ENV || 'development',
            version: process.env.npm_package_version || '1.0.0',
            services: {
              fileProcessor: 'available',
              deploymentService: 'available',
              modelManager: 'available',
            },
          };
          return c.json(health);
        },
      }),
      // File processing status route
      registerApiRoute('/files/status', {
        method: 'GET',
        handler: async (c) => {
          const stats = {
            supportedExtensions: fileProcessor.getSupportedExtensions(),
            maxFileSize: '10MB',
            maxTotalSize: '50MB',
            supportedLanguages: ['javascript', 'typescript', 'python', 'java', 'cpp', 'go', 'rust', 'html', 'css'],
          };
          return c.json(stats);
        },
      }),
      // Deployment status route
      registerApiRoute('/deploy/status', {
        method: 'GET',
        handler: async (c) => {
          const stats = deploymentService.getDeploymentStats();
          const platforms = deploymentService.getSupportedPlatforms();
          return c.json({ ...stats, supportedPlatforms: platforms });
        },
      }),
      // Cache status route
      registerApiRoute('/cache/status', {
        method: 'GET',
        handler: async (c) => {
          const status = cacheService.getStatus();
          return c.json(status);
        },
      }),
      // Performance metrics route
      registerApiRoute('/metrics', {
        method: 'GET',
        handler: async (c) => {
          const timeRange = c.req.query('timeRange');
          const range = timeRange ? parseInt(timeRange) : undefined;
          const stats = performanceService.getStats(range);
          return c.json(stats);
        },
      }),
      // All we-dev-next compatible API routes
      chatApiRoute,
      modelApiRoute,
      deployApiRoute,
      enhancedPromptApiRoute,

      // Intelligent Coding API routes
      intelligentCodingApiRoute,
      intelligentCodingStatusRoute,

      // Agent Network (vNext) API routes
      networkExecuteRoute,
      networkStatusRoute,
      networkCapabilitiesRoute,
      networkBatchRoute,
    ],
  },
});

// Log configuration status on startup
if (process.env.NODE_ENV !== 'test') {
  logConfigurationStatus();

  console.log('\n🚀 Mastra Instance Created:');
  console.log(`   Workflows: ${Object.keys(mastra.getWorkflows()).length} registered`);
  console.log(`   Tools: Available and configured`);
  console.log(`   Agents: Available and configured`);
  console.log(`   API Routes: Available at http://localhost:${productionConfig.server.port}`);
}

// Make Mastra instance globally available for API routes
declare global {
  var mastra: Mastra;
}
globalThis.mastra = mastra;
