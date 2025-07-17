#!/usr/bin/env node

/**
 * DeepSeek Usage Examples
 * 
 * Comprehensive examples demonstrating how to use DeepSeek agents,
 * tools, and workflows with the Mastra framework.
 */

import { mastra } from '../mastra';
import { 
  codeGeneratorTool, 
  codeAnalysisTool, 
  projectStructureTool 
} from '../mastra/tools/code-generator-tool';
import { 
  documentationTool, 
  apiDocumentationTool 
} from '../mastra/tools/documentation-tool';

/**
 * Example 1: Basic Agent Conversation
 */
async function basicAgentExample() {
  console.log('🤖 Example 1: Basic Agent Conversation\n');

  const agent = mastra.getAgent('deepseekAgent');
  
  const response = await agent.generate(
    'Explain the key differences between TypeScript and JavaScript, and when to use each.',
    {
      resourceId: 'user-demo',
      threadId: 'conversation-basic',
    }
  );

  console.log('Agent Response:');
  console.log(response.text);
  console.log('\n' + '='.repeat(80) + '\n');
}

/**
 * Example 2: Code Generation with DeepSeek Coder
 */
async function codeGenerationExample() {
  console.log('👨‍💻 Example 2: Code Generation with DeepSeek Coder\n');

  const coderAgent = mastra.getAgent('deepseekCoderAgent');
  
  const response = await coderAgent.generate(
    'Create a TypeScript class for a simple task management system with methods to add, complete, and list tasks.',
    {
      resourceId: 'user-demo',
      threadId: 'conversation-coding',
    }
  );

  console.log('Generated Code:');
  console.log(response.text);
  console.log('\n' + '='.repeat(80) + '\n');
}

/**
 * Example 3: Using Tools Directly
 */
async function directToolUsageExample() {
  console.log('🛠️ Example 3: Using Tools Directly\n');

  // Code Generator Tool
  console.log('Using Code Generator Tool:');
  const codeResult = await codeGeneratorTool.execute({
    context: {
      type: 'function',
      language: 'typescript',
      description: 'A utility function to validate email addresses',
      requirements: [
        'Use regex for validation',
        'Return boolean result',
        'Include JSDoc comments',
        'Handle edge cases'
      ],
      style: 'production',
    },
  });

  console.log('Generated Function:');
  console.log(`File: ${codeResult.filename}`);
  console.log(codeResult.code);
  
  if (codeResult.dependencies) {
    console.log('Dependencies:', codeResult.dependencies);
  }

  console.log('\n' + '-'.repeat(40) + '\n');

  // Documentation Tool
  console.log('Using Documentation Tool:');
  const docResult = await documentationTool.execute({
    context: {
      type: 'readme',
      content: 'A TypeScript utility library for common development tasks',
      format: 'markdown',
      audience: 'developer',
      includeExamples: true,
    },
  });

  console.log('Generated Documentation:');
  console.log(docResult.documentation.substring(0, 500) + '...');
  console.log(`Word count: ${docResult.metadata.wordCount}`);
  console.log(`Estimated read time: ${docResult.metadata.estimatedReadTime} minutes`);

  console.log('\n' + '='.repeat(80) + '\n');
}

/**
 * Example 4: Memory and Context
 */
async function memoryContextExample() {
  console.log('🧠 Example 4: Memory and Context\n');

  const agent = mastra.getAgent('deepseekAgent');
  const resourceId = 'user-demo';
  const threadId = 'conversation-memory';

  // First interaction - establish context
  console.log('First interaction (establishing context):');
  const response1 = await agent.generate(
    'Hi, I\'m working on a React project with TypeScript. I prefer functional components and hooks.',
    { resourceId, threadId }
  );
  console.log(response1.text);

  console.log('\n' + '-'.repeat(40) + '\n');

  // Second interaction - agent should remember context
  console.log('Second interaction (using remembered context):');
  const response2 = await agent.generate(
    'Can you help me create a custom hook for managing form state?',
    { resourceId, threadId }
  );
  console.log(response2.text);

  console.log('\n' + '='.repeat(80) + '\n');
}

/**
 * Example 5: Workflow Execution
 */
async function workflowExample() {
  console.log('🔄 Example 5: Workflow Execution\n');

  try {
    const workflow = mastra.getWorkflow('deepseekCodeGenerationWorkflow');
    const run = await workflow.createRunAsync();

    console.log('Starting code generation workflow...');
    const result = await run.start({
      inputData: {
        projectName: 'todo-app',
        description: 'A simple todo application with CRUD operations',
        language: 'typescript',
        framework: 'react',
        features: [
          'Add new todos',
          'Mark todos as complete',
          'Delete todos',
          'Filter todos by status'
        ],
        includeTests: true,
        includeDocs: true,
      },
    });

    console.log('Workflow completed successfully!');
    console.log('Project Name:', result.projectName);
    console.log('Generated Files:', Object.keys(result.generatedFiles));
    console.log('Summary:', result.summary);

    // Show a sample of generated files
    console.log('\nSample Generated Files:');
    Object.entries(result.generatedFiles).slice(0, 2).forEach(([filename, content]) => {
      console.log(`\n--- ${filename} ---`);
      console.log(content.substring(0, 200) + '...');
    });

  } catch (error) {
    console.error('Workflow execution failed:', error);
  }

  console.log('\n' + '='.repeat(80) + '\n');
}

/**
 * Example 6: Code Analysis
 */
async function codeAnalysisExample() {
  console.log('🔍 Example 6: Code Analysis\n');

  const sampleCode = `
function calculateTotal(items) {
  let total = 0;
  for (let i = 0; i < items.length; i++) {
    total += items[i].price * items[i].quantity;
  }
  return total;
}
`;

  const analysisResult = await codeAnalysisTool.execute({
    context: {
      code: sampleCode,
      language: 'javascript',
      analysisType: 'comprehensive',
      includeRefactoring: true,
    },
  });

  console.log('Code Analysis Results:');
  console.log('Quality Score:', analysisResult.qualityScore);
  console.log('Issues Found:', analysisResult.issues.length);
  
  if (analysisResult.issues.length > 0) {
    console.log('\nIssues:');
    analysisResult.issues.forEach((issue, index) => {
      console.log(`${index + 1}. [${issue.severity}] ${issue.message}`);
      if (issue.line) console.log(`   Line: ${issue.line}`);
    });
  }

  if (analysisResult.suggestions.length > 0) {
    console.log('\nSuggestions:');
    analysisResult.suggestions.forEach((suggestion, index) => {
      console.log(`${index + 1}. ${suggestion}`);
    });
  }

  if (analysisResult.refactoredCode) {
    console.log('\nRefactored Code:');
    console.log(analysisResult.refactoredCode);
  }

  console.log('\n' + '='.repeat(80) + '\n');
}

/**
 * Main function to run all examples
 */
async function runAllExamples() {
  console.log('🚀 DeepSeek Mastra Integration Examples\n');
  console.log('This demo showcases various features and capabilities.\n');

  try {
    await basicAgentExample();
    await codeGenerationExample();
    await directToolUsageExample();
    await memoryContextExample();
    await workflowExample();
    await codeAnalysisExample();

    console.log('✅ All examples completed successfully!');
  } catch (error) {
    console.error('❌ Error running examples:', error);
  }
}

// Run examples if this file is executed directly
if (require.main === module) {
  runAllExamples().catch(console.error);
}

export {
  basicAgentExample,
  codeGenerationExample,
  directToolUsageExample,
  memoryContextExample,
  workflowExample,
  codeAnalysisExample,
  runAllExamples,
};
