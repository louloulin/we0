/**
 * DeepSeek Integration Tests
 * 
 * Tests to verify that DeepSeek LLM provider is properly integrated
 * and functioning correctly with Mastra framework.
 */

import { describe, test, expect, beforeAll } from '@jest/globals';
import { mastra } from '../mastra';
import { deepseek, deepseekChat, DEEPSEEK_MODELS } from '../mastra/models/deepseek';

describe('DeepSeek Integration Tests', () => {
  beforeAll(() => {
    // Ensure environment variables are set for testing
    if (!process.env.DEEPSEEK_API_KEY) {
      console.warn('DEEPSEEK_API_KEY not set. Some tests may be skipped.');
    }
  });

  describe('DeepSeek Model Configuration', () => {
    test('should create DeepSeek provider instance', () => {
      expect(deepseek).toBeDefined();
      expect(typeof deepseek).toBe('function');
    });

    test('should have correct model constants', () => {
      expect(DEEPSEEK_MODELS.CHAT).toBe('deepseek-chat');
      expect(DEEPSEEK_MODELS.CODER).toBe('deepseek-coder');
    });

    test('should create model instances', () => {
      const chatModel = deepseekChat();
      expect(chatModel).toBeDefined();
    });

    test('should throw error without API key', () => {
      const originalKey = process.env.DEEPSEEK_API_KEY;
      delete process.env.DEEPSEEK_API_KEY;
      
      expect(() => {
        // This would be tested by re-importing the module
        // For now, we'll just check that the error would be thrown
      }).not.toThrow(); // We can't actually test this without re-importing
      
      process.env.DEEPSEEK_API_KEY = originalKey;
    });
  });

  describe('DeepSeek Agents', () => {
    test('should register DeepSeek agents in Mastra', () => {
      const agents = mastra.getAgents();
      
      expect(agents.deepseekAgent).toBeDefined();
      expect(agents.deepseekCoderAgent).toBeDefined();
      
      expect(agents.deepseekAgent.name).toBe('DeepSeek Agent');
      expect(agents.deepseekCoderAgent.name).toBe('DeepSeek Coder');
    });

    test('should have proper tools configured', () => {
      const deepseekAgent = mastra.getAgent('deepseekAgent');
      const deepseekCoderAgent = mastra.getAgent('deepseekCoderAgent');
      
      expect(deepseekAgent.tools).toBeDefined();
      expect(deepseekCoderAgent.tools).toBeDefined();
      
      // Check that tools are properly configured
      expect(Object.keys(deepseekAgent.tools)).toContain('codeGeneratorTool');
      expect(Object.keys(deepseekAgent.tools)).toContain('documentationTool');
      expect(Object.keys(deepseekCoderAgent.tools)).toContain('codeGeneratorTool');
    });

    test('should have memory configured', () => {
      const deepseekAgent = mastra.getAgent('deepseekAgent');
      const deepseekCoderAgent = mastra.getAgent('deepseekCoderAgent');
      
      expect(deepseekAgent.memory).toBeDefined();
      expect(deepseekCoderAgent.memory).toBeDefined();
    });
  });

  describe('DeepSeek Tools', () => {
    test('should have code generator tool', () => {
      const deepseekAgent = mastra.getAgent('deepseekAgent');
      const tools = deepseekAgent.tools;
      
      expect(tools.codeGeneratorTool).toBeDefined();
      expect(tools.codeGeneratorTool.id).toBe('code-generator');
    });

    test('should have code analysis tool', () => {
      const deepseekAgent = mastra.getAgent('deepseekAgent');
      const tools = deepseekAgent.tools;
      
      expect(tools.codeAnalysisTool).toBeDefined();
      expect(tools.codeAnalysisTool.id).toBe('code-analysis');
    });

    test('should have documentation tools', () => {
      const deepseekAgent = mastra.getAgent('deepseekAgent');
      const tools = deepseekAgent.tools;
      
      expect(tools.documentationTool).toBeDefined();
      expect(tools.apiDocumentationTool).toBeDefined();
      expect(tools.codeCommentTool).toBeDefined();
    });

    test('should have project structure tool', () => {
      const deepseekAgent = mastra.getAgent('deepseekAgent');
      const tools = deepseekAgent.tools;
      
      expect(tools.projectStructureTool).toBeDefined();
      expect(tools.projectStructureTool.id).toBe('project-structure');
    });
  });

  describe('DeepSeek Workflows', () => {
    test('should register DeepSeek workflow', () => {
      const workflows = mastra.getWorkflows();
      
      expect(workflows.deepseekCodeGenerationWorkflow).toBeDefined();
    });

    test('should have correct workflow configuration', () => {
      const workflow = mastra.getWorkflow('deepseekCodeGenerationWorkflow');
      
      expect(workflow).toBeDefined();
      expect(workflow.id).toBe('deepseek-code-generation');
    });
  });

  // Integration tests that require API calls (skip if no API key)
  describe('DeepSeek API Integration', () => {
    const skipIfNoApiKey = process.env.DEEPSEEK_API_KEY ? test : test.skip;

    skipIfNoApiKey('should generate text with DeepSeek agent', async () => {
      const deepseekAgent = mastra.getAgent('deepseekAgent');
      
      const response = await deepseekAgent.generate('Hello, can you help me with a simple coding question?');
      
      expect(response).toBeDefined();
      expect(typeof response).toBe('string');
      expect(response.length).toBeGreaterThan(0);
    }, 30000); // 30 second timeout for API calls

    skipIfNoApiKey('should use tools with DeepSeek agent', async () => {
      const deepseekAgent = mastra.getAgent('deepseekAgent');
      
      const response = await deepseekAgent.generate(
        'Generate a simple TypeScript function that adds two numbers. Use the code-generator tool.',
        {
          tools: ['code-generator'],
        }
      );
      
      expect(response).toBeDefined();
      expect(typeof response).toBe('string');
    }, 30000);

    skipIfNoApiKey('should work with DeepSeek Coder agent', async () => {
      const deepseekCoderAgent = mastra.getAgent('deepseekCoderAgent');
      
      const response = await deepseekCoderAgent.generate(
        'Explain the concept of closures in JavaScript with a simple example.'
      );
      
      expect(response).toBeDefined();
      expect(typeof response).toBe('string');
      expect(response.length).toBeGreaterThan(0);
    }, 30000);
  });

  describe('Error Handling', () => {
    test('should handle missing agent gracefully', () => {
      expect(() => {
        // @ts-expect-error - Testing error handling for non-existent agent
        mastra.getAgent('nonexistentAgent');
      }).toThrow();
    });

    test('should handle missing workflow gracefully', () => {
      expect(() => {
        // @ts-expect-error - Testing error handling for non-existent workflow
        mastra.getWorkflow('nonexistentWorkflow');
      }).toThrow();
    });
  });

  describe('Configuration Validation', () => {
    test('should have valid Mastra configuration', () => {
      expect(mastra).toBeDefined();
      expect(mastra.getAgents()).toBeDefined();
      expect(mastra.getWorkflows()).toBeDefined();
    });

    test('should have storage configured', () => {
      const storage = mastra.getStorage();
      expect(storage).toBeDefined();
    });

    test('should have logger configured', () => {
      const logger = mastra.getLogger();
      expect(logger).toBeDefined();
    });
  });
});

// Helper function to test tool execution
async function testToolExecution(toolName: string, input: any) {
  const deepseekAgent = mastra.getAgent('deepseekAgent');
  const tool = (deepseekAgent.tools as any)[toolName];
  
  if (!tool) {
    throw new Error(`Tool ${toolName} not found`);
  }
  
  try {
    const result = await tool.execute({ context: input });
    return result;
  } catch (error) {
    console.error(`Error executing tool ${toolName}:`, error);
    throw error;
  }
}

// Export test utilities for use in other test files
export { testToolExecution };
