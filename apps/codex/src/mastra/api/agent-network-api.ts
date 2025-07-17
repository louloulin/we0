/**
 * Agent Network API Routes
 * 
 * Provides HTTP endpoints for Agent Network (vNext) functionality
 */

import { z } from 'zod';
import { RuntimeContext } from '@mastra/core/runtime-context';
import { registerApiRoute } from '@mastra/core/server';

// Request schemas
const NetworkTaskSchema = z.object({
  task: z.string().min(1, 'Task cannot be empty'),
  mode: z.enum(['generate', 'loop', 'stream']).default('generate'),
  runtimeContext: z.record(z.any()).optional(),
});

const NetworkStatusSchema = z.object({
  networkId: z.string().optional().default('codex-agent-network'),
});

/**
 * POST /api/network/execute
 * Execute a task using Agent Network
 */
export const networkExecuteRoute = registerApiRoute('/network/execute', {
  method: 'POST',
  handler: async (c) => {
    try {
      const body = await c.req.json();
      const { task, mode, runtimeContext: contextData } = NetworkTaskSchema.parse(body);

      // Get the Agent Network
      const network = globalThis.mastra.vnext_getNetwork('codex-agent-network');
      if (!network) {
        return c.json({ error: 'Agent Network not found' }, 404);
      }

      // Create runtime context
      const runtimeContext = new RuntimeContext();
      if (contextData) {
        // Add context data if provided
        Object.entries(contextData).forEach(([key, value]) => {
          runtimeContext.set(key, value);
        });
      }

      // Execute based on mode
      let result;
      const startTime = Date.now();

      switch (mode) {
        case 'generate':
          result = await network.generate(task, { runtimeContext });
          break;
        case 'loop':
          result = await network.loop(task, { runtimeContext });
          break;
        case 'stream':
          // For streaming, we'll return a different response
          const stream = await network.stream(task, { runtimeContext });
          
          // Convert stream to array for HTTP response
          const chunks: string[] = [];
          const reader = stream.stream.getReader();
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              if (value?.type === 'text-delta') {
                chunks.push(value.textDelta || '');
              }
            }
          } finally {
            reader.releaseLock();
          }
          
          return c.json({
            success: true,
            mode: 'stream',
            task,
            result: {
              text: chunks.join(''),
              chunks,
              chunkCount: chunks.length,
            },
            executionTime: Date.now() - startTime,
            timestamp: new Date().toISOString(),
          });
        default:
          return c.json({ error: 'Invalid execution mode' }, 400);
      }

      return c.json({
        success: true,
        mode,
        task,
        result: {
          text: mode === 'loop' ? (result.result as any).text : result.result,
          resourceId: (result as any).resourceId,
          resourceType: (result as any).resourceType,
          iteration: mode === 'loop' ? (result.result as any).iteration : undefined,
        },
        executionTime: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      });

    } catch (error) {
      console.error('Network execution error:', error);
      
      if (error instanceof z.ZodError) {
        return c.json({
          error: 'Invalid request format',
          details: error.errors,
        }, 400);
      }

      return c.json({
        error: 'Network execution failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      }, 500);
    }
  },
});

/**
 * GET /api/network/status
 * Get Agent Network status and capabilities
 */
export const networkStatusRoute = registerApiRoute('/network/status', {
  method: 'GET',
  handler: async (c) => {
    try {
      const { networkId } = NetworkStatusSchema.parse({
        networkId: c.req.query('networkId'),
      });

      const network = globalThis.mastra.vnext_getNetwork(networkId);
      if (!network) {
        return c.json({ error: 'Agent Network not found' }, 404);
      }

      // Get available networks
      const allNetworks = globalThis.mastra.getNetworks?.() || [];

      return c.json({
        success: true,
        network: {
          id: network.id,
          name: network.name,
          description: network.getInstructions?.({ runtimeContext: new RuntimeContext() }) || 'Agent Network',
          capabilities: {
            generate: true,
            loop: true,
            stream: true,
          },
        },
        availableNetworks: allNetworks.map((n: any) => n.id || n.name),
        timestamp: new Date().toISOString(),
      });

    } catch (error) {
      console.error('Network status error:', error);
      
      return c.json({
        error: 'Failed to get network status',
        message: error instanceof Error ? error.message : 'Unknown error',
      }, 500);
    }
  },
});

/**
 * GET /api/network/capabilities
 * Get detailed capabilities of the Agent Network
 */
export const networkCapabilitiesRoute = registerApiRoute('/network/capabilities', {
  method: 'GET',
  handler: async (c) => {
    try {
      const network = globalThis.mastra.vnext_getNetwork('codex-agent-network');
      if (!network) {
        return c.json({ error: 'Agent Network not found' }, 404);
      }

      // Get Mastra instance capabilities
      const workflows = globalThis.mastra.getWorkflows();
      const agents = globalThis.mastra.getAgents();

      return c.json({
        success: true,
        capabilities: {
          network: {
            id: network.id,
            name: network.name,
            modes: ['generate', 'loop', 'stream'],
            description: 'Intelligent orchestration of agents, workflows, and tools',
          },
          primitives: {
            agents: {
              count: Object.keys(agents).length,
              available: Object.keys(agents),
            },
            workflows: {
              count: Object.keys(workflows).length,
              available: Object.keys(workflows),
            },
            tools: {
              categories: [
                'Screenshot Tools',
                'Token Management',
                'Database Configuration',
                'File Processing',
                'Utility Functions',
              ],
              description: 'Comprehensive tool suite for development tasks',
            },
          },
          features: [
            'Intelligent task routing',
            'Multi-step workflow orchestration',
            'Context-aware decision making',
            'Memory-driven intelligence',
            'Real-time streaming responses',
            'Human-in-the-loop approval processes',
            'Event-driven monitoring',
            'Multi-modal support',
          ],
        },
        timestamp: new Date().toISOString(),
      });

    } catch (error) {
      console.error('Network capabilities error:', error);
      
      return c.json({
        error: 'Failed to get network capabilities',
        message: error instanceof Error ? error.message : 'Unknown error',
      }, 500);
    }
  },
});

/**
 * POST /api/network/batch
 * Execute multiple tasks in batch
 */
export const networkBatchRoute = registerApiRoute('/network/batch', {
  method: 'POST',
  handler: async (c) => {
    try {
      const body = await c.req.json();
      const BatchSchema = z.object({
        tasks: z.array(z.object({
          id: z.string(),
          task: z.string().min(1),
          mode: z.enum(['generate', 'loop']).default('generate'),
        })).min(1).max(10), // Limit to 10 tasks per batch
        runtimeContext: z.record(z.any()).optional(),
      });

      const { tasks, runtimeContext: contextData } = BatchSchema.parse(body);

      const network = globalThis.mastra.vnext_getNetwork('codex-agent-network');
      if (!network) {
        return c.json({ error: 'Agent Network not found' }, 404);
      }

      // Create runtime context
      const runtimeContext = new RuntimeContext();
      if (contextData) {
        Object.entries(contextData).forEach(([key, value]) => {
          runtimeContext.set(key, value);
        });
      }

      // Execute tasks
      const results = [];
      const startTime = Date.now();

      for (const taskItem of tasks) {
        try {
          const taskStartTime = Date.now();
          let result;

          if (taskItem.mode === 'loop') {
            result = await network.loop(taskItem.task, { runtimeContext });
          } else {
            result = await network.generate(taskItem.task, { runtimeContext });
          }

          results.push({
            id: taskItem.id,
            success: true,
            task: taskItem.task,
            mode: taskItem.mode,
            result: {
              text: taskItem.mode === 'loop' ? (result.result as any).text : result.result,
              resourceId: (result as any).resourceId,
              resourceType: (result as any).resourceType,
              iteration: taskItem.mode === 'loop' ? (result.result as any).iteration : undefined,
            },
            executionTime: Date.now() - taskStartTime,
          });

        } catch (error) {
          results.push({
            id: taskItem.id,
            success: false,
            task: taskItem.task,
            mode: taskItem.mode,
            error: error instanceof Error ? error.message : 'Unknown error',
            executionTime: Date.now() - startTime,
          });
        }
      }

      return c.json({
        success: true,
        batchId: `batch-${Date.now()}`,
        results,
        summary: {
          total: tasks.length,
          successful: results.filter(r => r.success).length,
          failed: results.filter(r => !r.success).length,
          totalExecutionTime: Date.now() - startTime,
        },
        timestamp: new Date().toISOString(),
      });

    } catch (error) {
      console.error('Network batch execution error:', error);
      
      if (error instanceof z.ZodError) {
        return c.json({
          error: 'Invalid batch request format',
          details: error.errors,
        }, 400);
      }

      return c.json({
        error: 'Batch execution failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      }, 500);
    }
  },
});
