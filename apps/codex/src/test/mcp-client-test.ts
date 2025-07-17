#!/usr/bin/env node

/**
 * DeepSeek MCP Client Test
 * 
 * Tests the DeepSeek MCP server by connecting as a client
 * and calling the exposed tools and agents.
 */

import { MCPClient } from '@mastra/mcp';

async function testDeepSeekMCPServer() {
  console.log('🚀 Testing DeepSeek MCP Server...\n');

  // Create MCP client that connects to our DeepSeek server
  const mcp = new MCPClient({
    servers: {
      deepseek: {
        command: 'npx',
        args: ['tsx', 'src/mastra/mcp/deepseek-mcp-server.ts', 'stdio'],
      },
    },
  });

  try {
    // Get available tools from the server
    console.log('📋 Getting available tools...');
    const tools = await mcp.getTools();
    
    console.log('Available tools:');
    Object.keys(tools).forEach(toolName => {
      const tool = tools[toolName];
      console.log(`  - ${toolName}: ${tool.description}`);
    });
    
    console.log('\n🔧 Testing code generation tool...');
    
    // Test the code generator tool
    if (tools.codeGeneratorTool) {
      try {
        const result = await tools.codeGeneratorTool.execute({
          context: {
            type: 'function',
            language: 'typescript',
            description: 'A function that calculates the factorial of a number',
            requirements: ['Add input validation', 'Include JSDoc comments'],
            style: 'production',
          },
        });
        
        console.log('Code generation result:');
        console.log('Filename:', result.filename);
        console.log('Code:');
        console.log(result.code);
        
        if (result.dependencies) {
          console.log('Dependencies:', result.dependencies);
        }
      } catch (error) {
        console.error('Error testing code generator:', error);
      }
    }
    
    console.log('\n🤖 Testing DeepSeek agent...');
    
    // Test the DeepSeek agent
    if (tools.ask_deepseekAgent) {
      try {
        const result = await tools.ask_deepseekAgent.execute({
          context: {
            message: 'Explain the benefits of using TypeScript over JavaScript for a large-scale application.',
          },
        });
        
        console.log('Agent response:');
        console.log(result);
      } catch (error) {
        console.error('Error testing DeepSeek agent:', error);
      }
    }
    
    console.log('\n👨‍💻 Testing DeepSeek Coder agent...');
    
    // Test the DeepSeek Coder agent
    if (tools.ask_deepseekCoderAgent) {
      try {
        const result = await tools.ask_deepseekCoderAgent.execute({
          context: {
            message: 'Write a simple React component for a todo list item with delete functionality.',
          },
        });
        
        console.log('Coder agent response:');
        console.log(result);
      } catch (error) {
        console.error('Error testing DeepSeek Coder agent:', error);
      }
    }
    
    console.log('\n📚 Testing documentation tool...');
    
    // Test the documentation tool
    if (tools.documentationTool) {
      try {
        const result = await tools.documentationTool.execute({
          context: {
            type: 'readme',
            content: 'A TypeScript library for handling user authentication and authorization',
            format: 'markdown',
            audience: 'developer',
            includeExamples: true,
          },
        });
        
        console.log('Documentation result:');
        console.log('Word count:', result.metadata.wordCount);
        console.log('Estimated read time:', result.metadata.estimatedReadTime, 'minutes');
        console.log('Documentation preview:');
        console.log(result.documentation.substring(0, 500) + '...');
      } catch (error) {
        console.error('Error testing documentation tool:', error);
      }
    }
    
  } catch (error) {
    console.error('❌ Error during MCP testing:', error);
  } finally {
    // Clean up
    await mcp.disconnect();
    console.log('\n✅ MCP client test completed!');
  }
}

// Run the test
if (require.main === module) {
  testDeepSeekMCPServer().catch((error) => {
    console.error('Test failed:', error);
    process.exit(1);
  });
}

export { testDeepSeekMCPServer };
