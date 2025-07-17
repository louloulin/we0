#!/usr/bin/env node

/**
 * Test Runner for DeepSeek Integration
 * 
 * A simple test runner to verify DeepSeek integration without requiring Jest setup.
 * This can be run directly with: npx tsx src/test/run-tests.ts
 */

import { mastra } from '../mastra';
import { deepseek, deepseekChat, DEEPSEEK_MODELS } from '../mastra/models/deepseek';

// Simple test framework
class TestRunner {
  private tests: Array<{ name: string; fn: () => Promise<void> | void }> = [];
  private passed = 0;
  private failed = 0;

  test(name: string, fn: () => Promise<void> | void) {
    this.tests.push({ name, fn });
  }

  async run() {
    console.log('🚀 Running DeepSeek Integration Tests...\n');

    for (const test of this.tests) {
      try {
        await test.fn();
        console.log(`✅ ${test.name}`);
        this.passed++;
      } catch (error) {
        console.log(`❌ ${test.name}`);
        console.log(`   Error: ${error instanceof Error ? error.message : String(error)}`);
        this.failed++;
      }
    }

    console.log(`\n📊 Test Results:`);
    console.log(`   Passed: ${this.passed}`);
    console.log(`   Failed: ${this.failed}`);
    console.log(`   Total: ${this.tests.length}`);

    if (this.failed > 0) {
      process.exit(1);
    }
  }
}

const runner = new TestRunner();

// Test 1: Basic configuration
runner.test('DeepSeek provider should be configured', () => {
  if (!deepseek) {
    throw new Error('DeepSeek provider not found');
  }
  if (typeof deepseek !== 'function') {
    throw new Error('DeepSeek provider is not a function');
  }
});

// Test 2: Model constants
runner.test('DeepSeek model constants should be defined', () => {
  if (DEEPSEEK_MODELS.CHAT !== 'deepseek-chat') {
    throw new Error('CHAT model constant incorrect');
  }
  if (DEEPSEEK_MODELS.CODER !== 'deepseek-coder') {
    throw new Error('CODER model constant incorrect');
  }
});

// Test 3: Model creation
runner.test('DeepSeek chat model should be creatable', () => {
  const model = deepseekChat();
  if (!model) {
    throw new Error('Failed to create DeepSeek chat model');
  }
});

// Test 4: Mastra agents registration
runner.test('DeepSeek agents should be registered in Mastra', () => {
  const agents = mastra.getAgents();
  
  if (!agents.deepseekAgent) {
    throw new Error('deepseekAgent not found in Mastra');
  }
  if (!agents.deepseekCoderAgent) {
    throw new Error('deepseekCoderAgent not found in Mastra');
  }
  
  if (agents.deepseekAgent.name !== 'DeepSeek Agent') {
    throw new Error('deepseekAgent has incorrect name');
  }
  if (agents.deepseekCoderAgent.name !== 'DeepSeek Coder') {
    throw new Error('deepseekCoderAgent has incorrect name');
  }
});

// Test 5: Agent tools
runner.test('DeepSeek agents should have tools configured', () => {
  const deepseekAgent = mastra.getAgent('deepseekAgent');
  const deepseekCoderAgent = mastra.getAgent('deepseekCoderAgent');
  
  if (!deepseekAgent.tools) {
    throw new Error('deepseekAgent has no tools');
  }
  if (!deepseekCoderAgent.tools) {
    throw new Error('deepseekCoderAgent has no tools');
  }
  
  const requiredTools = ['codeGeneratorTool', 'codeAnalysisTool', 'projectStructureTool'];
  for (const tool of requiredTools) {
    if (!deepseekAgent.tools[tool]) {
      throw new Error(`deepseekAgent missing tool: ${tool}`);
    }
    if (!deepseekCoderAgent.tools[tool]) {
      throw new Error(`deepseekCoderAgent missing tool: ${tool}`);
    }
  }
  
  // Check documentation tools for main agent
  const docTools = ['documentationTool', 'apiDocumentationTool', 'codeCommentTool'];
  for (const tool of docTools) {
    if (!deepseekAgent.tools[tool]) {
      throw new Error(`deepseekAgent missing documentation tool: ${tool}`);
    }
  }
});

// Test 6: Agent memory
runner.test('DeepSeek agents should have memory configured', () => {
  const deepseekAgent = mastra.getAgent('deepseekAgent');
  const deepseekCoderAgent = mastra.getAgent('deepseekCoderAgent');
  
  if (!deepseekAgent.memory) {
    throw new Error('deepseekAgent has no memory configured');
  }
  if (!deepseekCoderAgent.memory) {
    throw new Error('deepseekCoderAgent has no memory configured');
  }
});

// Test 7: Workflows
runner.test('DeepSeek workflow should be registered', () => {
  const workflows = mastra.getWorkflows();
  
  if (!workflows.deepseekCodeGenerationWorkflow) {
    throw new Error('deepseekCodeGenerationWorkflow not found in Mastra');
  }
  
  const workflow = mastra.getWorkflow('deepseekCodeGenerationWorkflow');
  if (!workflow) {
    throw new Error('Failed to get deepseekCodeGenerationWorkflow');
  }
  
  if (workflow.id !== 'deepseek-code-generation') {
    throw new Error('Workflow has incorrect ID');
  }
});

// Test 8: Tool functionality (basic validation)
runner.test('Tools should have correct structure', () => {
  const deepseekAgent = mastra.getAgent('deepseekAgent');
  const codeGenTool = deepseekAgent.tools.codeGeneratorTool;
  
  if (!codeGenTool.id) {
    throw new Error('codeGeneratorTool missing id');
  }
  if (!codeGenTool.description) {
    throw new Error('codeGeneratorTool missing description');
  }
  if (!codeGenTool.execute) {
    throw new Error('codeGeneratorTool missing execute function');
  }
  
  if (codeGenTool.id !== 'code-generator') {
    throw new Error('codeGeneratorTool has incorrect id');
  }
});

// Test 9: Environment validation
runner.test('Environment should be properly configured', () => {
  if (!process.env.DEEPSEEK_API_KEY) {
    console.warn('⚠️  DEEPSEEK_API_KEY not set - API tests will be skipped');
  }
  
  // Check that required environment variables are at least defined
  const requiredEnvVars = ['DEEPSEEK_API_KEY'];
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      console.warn(`⚠️  ${envVar} not set`);
    }
  }
});

// Test 10: Mastra configuration
runner.test('Mastra should be properly configured', () => {
  if (!mastra) {
    throw new Error('Mastra instance not found');
  }
  
  const storage = mastra.getStorage();
  if (!storage) {
    throw new Error('Mastra storage not configured');
  }
  
  const logger = mastra.getLogger();
  if (!logger) {
    throw new Error('Mastra logger not configured');
  }
});

// API Integration Test (only if API key is available)
if (process.env.DEEPSEEK_API_KEY) {
  runner.test('DeepSeek API integration should work', async () => {
    console.log('   Testing API integration (this may take a moment)...');
    
    const deepseekAgent = mastra.getAgent('deepseekAgent');
    
    try {
      const response = await deepseekAgent.generate('Say "Hello from DeepSeek!" and nothing else.');
      
      if (!response) {
        throw new Error('No response from DeepSeek API');
      }
      if (typeof response !== 'string') {
        throw new Error('Response is not a string');
      }
      if (response.length === 0) {
        throw new Error('Empty response from DeepSeek API');
      }
      
      console.log(`   API Response: ${response.substring(0, 100)}${response.length > 100 ? '...' : ''}`);
    } catch (error) {
      throw new Error(`API integration failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  });
} else {
  runner.test('API integration test skipped (no API key)', () => {
    console.log('   Skipping API test - DEEPSEEK_API_KEY not provided');
  });
}

// Run all tests
runner.run().catch((error) => {
  console.error('Test runner failed:', error);
  process.exit(1);
});

export { runner };
