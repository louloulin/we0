/**
 * Builder Mode Workflow
 * 
 * Implements the complex code generation workflow for Builder Mode,
 * including file processing, prompt building, and code generation
 */

import { createWorkflow, createStep } from '@mastra/core/workflows';
import { z } from 'zod';
import { AgentFactory } from '../agents/multi-model-agent';

// Schema definitions
const MessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string(),
});

const OtherConfigSchema = z.object({
  isBackEnd: z.boolean().optional(),
  backendLanguage: z.string().optional(),
  type: z.enum(['miniProgram', 'other']).optional(),
});

const FileProcessingOutputSchema = z.object({
  files: z.record(z.string()),
  allContent: z.string(),
  filesPath: z.array(z.string()),
  diffString: z.string(),
  hasFiles: z.boolean(),
  messages: z.array(MessageSchema),
  model: z.string(),
  otherConfig: OtherConfigSchema.optional(),
});

const PromptBuildingOutputSchema = z.object({
  enhancedPrompt: z.string(),
  context: z.string(),
  requirements: z.array(z.string()),
});

const CodeGenerationOutputSchema = z.object({
  generatedCode: z.string(),
  explanation: z.string(),
  suggestions: z.array(z.string()),
});

// File Processing Step
const fileProcessingStep = createStep({
  id: 'file-processing',
  description: 'Process and analyze uploaded files',
  inputSchema: z.object({
    messages: z.array(MessageSchema),
    model: z.string(),
    otherConfig: OtherConfigSchema.optional(),
    tools: z.array(z.any()).optional(),
  }),
  outputSchema: FileProcessingOutputSchema,
  execute: async ({ inputData }) => {
    const { messages } = inputData;
    
    // Extract file information from messages
    const files: Record<string, string> = {};
    const filesPath: string[] = [];
    let allContent = '';
    
    // Process messages to extract file content
    for (const message of messages) {
      if (message.role === 'user') {
        // Look for file patterns in content
        const fileMatches = message.content.match(/```(\w+)?\n([\s\S]*?)```/g);
        
        if (fileMatches) {
          fileMatches.forEach((match, index) => {
            const codeMatch = match.match(/```(\w+)?\n([\s\S]*?)```/);
            if (codeMatch) {
              const language = codeMatch[1] || 'text';
              const content = codeMatch[2];
              const fileName = `file_${index}.${language}`;
              
              files[fileName] = content;
              filesPath.push(fileName);
              allContent += `\n// File: ${fileName}\n${content}\n`;
            }
          });
        }
      }
    }
    
    // Generate diff string for context
    const diffString = Object.entries(files)
      .map(([path, content]) => `+++ ${path}\n${content}`)
      .join('\n\n');
    
    return {
      files,
      allContent,
      filesPath,
      diffString,
      hasFiles: Object.keys(files).length > 0,
      messages: inputData.messages,
      model: inputData.model,
      otherConfig: inputData.otherConfig,
    };
  },
});

// Prompt Building Step
const promptBuildingStep = createStep({
  id: 'prompt-building',
  description: 'Build enhanced prompt with context and requirements',
  inputSchema: FileProcessingOutputSchema,
  outputSchema: PromptBuildingOutputSchema,
  execute: async ({ inputData }) => {
    const { messages, files, diffString, otherConfig, hasFiles } = inputData;
    
    // Extract user requirements from messages
    const userMessage = messages.find(m => m.role === 'user')?.content || '';
    
    // Build context based on configuration
    let context = '';
    if (hasFiles) {
      context += `\n## Existing Code Context:\n${diffString}\n`;
    }
    
    if (otherConfig?.isBackEnd) {
      context += `\n## Backend Configuration:\n`;
      context += `- Language: ${otherConfig.backendLanguage || 'Not specified'}\n`;
      context += `- Type: Backend service\n`;
    }
    
    if (otherConfig?.type === 'miniProgram') {
      context += `\n## Project Type: Mini Program\n`;
      context += `- Focus on mini-program specific patterns and APIs\n`;
    }
    
    // Extract requirements
    const requirements: string[] = [];
    if (userMessage.toLowerCase().includes('function')) {
      requirements.push('Generate functions with proper documentation');
    }
    if (userMessage.toLowerCase().includes('class')) {
      requirements.push('Create well-structured classes');
    }
    if (userMessage.toLowerCase().includes('api')) {
      requirements.push('Design RESTful API endpoints');
    }
    if (userMessage.toLowerCase().includes('test')) {
      requirements.push('Include comprehensive tests');
    }
    
    // Build enhanced prompt
    const enhancedPrompt = `
${userMessage}

${context}

## Requirements:
${requirements.map(req => `- ${req}`).join('\n')}

## Instructions:
- Provide clean, production-ready code
- Include proper error handling
- Add comprehensive comments
- Follow best practices for ${otherConfig?.backendLanguage || 'the specified language'}
- Ensure code is maintainable and scalable
${hasFiles ? '- Consider the existing code context when making changes' : ''}
`.trim();

    return {
      enhancedPrompt,
      context,
      requirements,
    };
  },
});

// Code Generation Step
const codeGenerationStep = createStep({
  id: 'code-generation',
  description: 'Generate code using AI agent',
  inputSchema: z.object({
    enhancedPrompt: z.string(),
    context: z.string(),
    requirements: z.array(z.string()),
    otherConfig: OtherConfigSchema.optional(),
  }),
  outputSchema: CodeGenerationOutputSchema,
  execute: async ({ inputData }) => {
    const { enhancedPrompt, otherConfig } = inputData;
    
    // Determine the best model for the task
    let modelKey = 'deepseek-chat'; // Default for coding
    if (otherConfig?.type === 'miniProgram' || otherConfig?.isBackEnd) {
      modelKey = AgentFactory.getBestModelForTask('coding');
    }
    
    // Create a builder agent for code generation
    const builderAgent = AgentFactory.createBuilderAgent(modelKey);
    
    // Generate code using the agent
    const result = await builderAgent.generate([
      {
        role: 'user',
        content: enhancedPrompt,
      }
    ], {
      resourceId: 'builder_workflow',
      threadId: `build_${Date.now()}`,
      maxSteps: 3,
    });
    
    // Extract suggestions from the response
    const suggestions = [
      'Consider adding unit tests for the generated code',
      'Review error handling and edge cases',
      'Optimize for performance if needed',
      'Add logging for debugging purposes',
    ];
    
    return {
      generatedCode: result.text || 'No code generated',
      explanation: 'Code generated using AI agent with enhanced prompt',
      suggestions,
    };
  },
});

// Response Formatting Step
const responseFormattingStep = createStep({
  id: 'response-formatting',
  description: 'Format the final response for the client',
  inputSchema: z.object({
    generatedCode: z.string(),
    explanation: z.string(),
    suggestions: z.array(z.string()),
    requirements: z.array(z.string()),
  }),
  outputSchema: z.object({
    choices: z.array(z.object({
      message: z.object({
        role: z.literal('assistant'),
        content: z.string(),
      }),
    })),
  }),
  execute: async ({ inputData }) => {
    const { generatedCode, explanation, suggestions, requirements } = inputData;
    
    // Format the response in a structured way
    const formattedResponse = `
## Generated Code

${generatedCode}

## Explanation

${explanation}

## Requirements Addressed
${requirements.map(req => `✅ ${req}`).join('\n')}

## Suggestions for Improvement
${suggestions.map(suggestion => `💡 ${suggestion}`).join('\n')}

---
*Generated by Mastra Builder Workflow*
`.trim();

    return {
      choices: [{
        message: {
          role: 'assistant' as const,
          content: formattedResponse,
        },
      }],
    };
  },
});

// Create the Builder Workflow
export const builderWorkflow = createWorkflow({
  id: 'builder-workflow',
  description: 'Complete Builder Mode workflow for code generation',
  inputSchema: z.object({
    messages: z.array(MessageSchema),
    model: z.string(),
    otherConfig: OtherConfigSchema.optional(),
    tools: z.array(z.any()).optional(),
  }),
  outputSchema: z.object({
    choices: z.array(z.object({
      message: z.object({
        role: z.literal('assistant'),
        content: z.string(),
      }),
    })),
  }),
})
.then(fileProcessingStep)
.then(promptBuildingStep)
.then(codeGenerationStep)
.then(responseFormattingStep)
.commit();
