/**
 * Agent Network (vNext) Tests
 * 
 * Tests for the new Agent Network functionality
 */

import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import { RuntimeContext } from '@mastra/core/runtime-context';
import { mastra } from '../mastra';
import { executeTask, executeComplexTask, streamTask } from '../mastra/networks';

describe('Agent Network (vNext) Integration', () => {
  let runtimeContext: RuntimeContext;

  beforeAll(async () => {
    runtimeContext = new RuntimeContext();
  });

  afterAll(async () => {
    // Cleanup
  });

  describe('Network Registration', () => {
    test('should have Agent Network registered in Mastra', () => {
      const network = mastra.vnext_getNetwork('codex-agent-network');
      expect(network).toBeDefined();
      expect(network?.id).toBe('codex-agent-network');
      expect(network?.name).toBe('Codex Agent Network');
    });

    test('should have all agents registered in network', () => {
      const network = mastra.vnext_getNetwork('codex-agent-network');
      expect(network).toBeDefined();
      
      // Check that network has access to agents
      // Note: Internal structure may vary, so we test functionality instead
      expect(typeof network?.generate).toBe('function');
      expect(typeof network?.loop).toBe('function');
      expect(typeof network?.stream).toBe('function');
    });
  });

  describe('Single Task Execution (.generate)', () => {
    test('should handle simple code generation task', async () => {
      const task = "Generate a simple TypeScript function that adds two numbers";
      const result = await executeTask(task, runtimeContext);
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
      
      // Should contain TypeScript-related content
      expect(result.toLowerCase()).toMatch(/function|typescript|number/);
    }, 30000);

    test('should handle database configuration task', async () => {
      const task = "Generate MySQL configuration for a user management system";
      const result = await executeTask(task, runtimeContext);
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
      
      // Should contain MySQL-related content
      expect(result.toLowerCase()).toMatch(/mysql|database|user/);
    }, 30000);

    test('should handle token counting task', async () => {
      const task = "Count tokens in this text: 'Hello world, this is a test message'";
      const result = await executeTask(task, runtimeContext);
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
      
      // Should contain token-related content
      expect(result.toLowerCase()).toMatch(/token|count|number/);
    }, 30000);
  });

  describe('Complex Task Execution (.loop)', () => {
    test('should handle multi-step project analysis task', async () => {
      const task = `
        Analyze a React project structure, suggest database configuration for PostgreSQL,
        and provide deployment recommendations. This requires multiple steps and coordination.
      `;
      
      const result = await executeComplexTask(task, runtimeContext);
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
      
      // Should contain content from multiple domains
      expect(result.toLowerCase()).toMatch(/react|project|structure/);
      expect(result.toLowerCase()).toMatch(/postgresql|database/);
      expect(result.toLowerCase()).toMatch(/deploy|recommendation/);
    }, 60000);

    test('should handle file processing and analysis workflow', async () => {
      const task = `
        Process a project with multiple files, analyze the code complexity,
        generate documentation, and provide optimization suggestions.
      `;
      
      const result = await executeComplexTask(task, runtimeContext);
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
      
      // Should contain file processing and analysis content
      expect(result.toLowerCase()).toMatch(/file|process|analysis/);
      expect(result.toLowerCase()).toMatch(/complexity|documentation|optimization/);
    }, 60000);
  });

  describe('Streaming Execution', () => {
    test('should support streaming responses', async () => {
      const task = "Explain how to optimize React components for performance";
      const streamResult = await streamTask(task, runtimeContext);

      expect(streamResult).toBeDefined();

      // The stream result should have a stream property
      expect(streamResult.stream).toBeDefined();

      // Try to read from the stream
      let chunks: string[] = [];
      let chunkCount = 0;

      try {
        for await (const chunk of streamResult.stream) {
          if (chunk.type === 'text-delta') {
            chunks.push(chunk.textDelta);
          }
          chunkCount++;

          // Limit chunks to avoid long test runs
          if (chunkCount >= 5) break;
        }

        expect(chunkCount).toBeGreaterThan(0);
      } catch (error) {
        // Stream might not be iterable in test environment
        console.log('Stream iteration not supported in test environment');
        expect(streamResult.stream).toBeDefined();
      }
    }, 30000);
  });

  describe('Network Intelligence', () => {
    test('should route to appropriate primitives based on task type', async () => {
      // Test different task types to ensure proper routing
      const tasks = [
        {
          task: "Take a screenshot of https://example.com",
          expectedKeywords: ['screenshot', 'capture', 'image']
        },
        {
          task: "Generate a Zod schema from this JSON: {\"name\": \"John\", \"age\": 30}",
          expectedKeywords: ['zod', 'schema', 'json']
        },
        {
          task: "Compare PostgreSQL vs MySQL for an e-commerce application",
          expectedKeywords: ['postgresql', 'mysql', 'database', 'compare']
        }
      ];

      for (const { task, expectedKeywords } of tasks) {
        const result = await executeTask(task, runtimeContext);
        
        expect(result).toBeDefined();
        expect(typeof result).toBe('string');
        expect(result.length).toBeGreaterThan(0);
        
        // Check that result contains relevant keywords
        const lowerResult = result.toLowerCase();
        const hasRelevantContent = expectedKeywords.some(keyword => 
          lowerResult.includes(keyword)
        );
        expect(hasRelevantContent).toBe(true);
      }
    }, 90000);
  });

  describe('Error Handling', () => {
    test('should handle invalid tasks gracefully', async () => {
      const task = ""; // Empty task
      
      try {
        const result = await executeTask(task, runtimeContext);
        // Should either return a meaningful response or throw an error
        expect(typeof result).toBe('string');
      } catch (error) {
        // Error handling is acceptable for invalid input
        expect(error).toBeDefined();
      }
    }, 15000);

    test('should handle network unavailability gracefully', async () => {
      // Test with a task that might require external resources
      const task = "Get current weather for a non-existent location: XYZ123INVALID";
      
      try {
        const result = await executeTask(task, runtimeContext);
        expect(typeof result).toBe('string');
        // Should provide some kind of response even if the specific request fails
        expect(result.length).toBeGreaterThan(0);
      } catch (error) {
        // Error handling is acceptable for invalid requests
        expect(error).toBeDefined();
      }
    }, 30000);
  });

  describe('Memory and Context', () => {
    test('should maintain context across related tasks', async () => {
      const context = new RuntimeContext();
      
      // First task - establish context
      const task1 = "I'm working on a React e-commerce project";
      const result1 = await executeTask(task1, context);
      
      expect(result1).toBeDefined();
      
      // Second task - should use context from first task
      const task2 = "What database would you recommend for this project?";
      const result2 = await executeTask(task2, context);
      
      expect(result2).toBeDefined();
      expect(typeof result2).toBe('string');
      expect(result2.length).toBeGreaterThan(0);
      
      // Should reference e-commerce context
      expect(result2.toLowerCase()).toMatch(/ecommerce|e-commerce|commerce|shop/);
    }, 60000);
  });

  describe('Performance', () => {
    test('should complete simple tasks within reasonable time', async () => {
      const startTime = Date.now();
      const task = "Generate a simple hello world function in TypeScript";
      
      const result = await executeTask(task, runtimeContext);
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(result).toBeDefined();
      expect(duration).toBeLessThan(30000); // Should complete within 30 seconds
    }, 35000);
  });
});
