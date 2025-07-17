/**
 * Multi-Model Agent Factory
 * 
 * Creates agents that can dynamically switch between different model providers
 * based on the request context and model requirements
 */

import { Agent } from '@mastra/core/agent';
import { Memory } from '@mastra/memory';
import { LibSQLStore } from '@mastra/libsql';
import { modelManager } from '../models/model-manager';
import {
  codeGeneratorTool,
  codeAnalysisTool,
  projectStructureTool
} from '../tools/code-generator-tool';
import {
  documentationTool,
  apiDocumentationTool,
  codeCommentTool
} from '../tools/documentation-tool';

// Memory configuration for agents
const createMemory = () => new Memory({
  storage: new LibSQLStore({
    url: process.env.DATABASE_URL || 'file:../mastra.db',
  }),
});

/**
 * Chat Agent - General conversation with multiple model support
 */
export function createChatAgent(modelKey: string = 'deepseek-chat') {
  const model = modelManager.getModelByKey(modelKey);
  
  return new Agent({
    name: 'Multi-Model Chat Agent',
    instructions: `You are a helpful AI assistant powered by ${modelKey}. 
    
    You can engage in natural conversations, answer questions, provide explanations, 
    and help with various tasks. You have access to multiple AI models and can 
    adapt your responses based on the complexity and nature of the request.
    
    Key capabilities:
    - General knowledge and reasoning
    - Problem-solving assistance
    - Creative writing and brainstorming
    - Educational support
    - Technical discussions
    
    Always be helpful, accurate, and engaging in your responses.`,
    model,
    memory: createMemory(),
  });
}

/**
 * Builder Agent - Code generation and development with multiple model support
 */
export function createBuilderAgent(modelKey: string = 'deepseek-chat') {
  const model = modelManager.getModelByKey(modelKey);
  
  return new Agent({
    name: 'Multi-Model Builder Agent',
    instructions: `You are an expert software development assistant powered by ${modelKey}.
    
    Your primary function is to help with code generation, project building, 
    and software development tasks. You have access to powerful development tools 
    and can work with multiple programming languages and frameworks.
    
    Core capabilities:
    🔧 **Code Development**
    - Generate production-ready code in multiple programming languages
    - Provide code reviews with actionable feedback
    - Debug complex issues with systematic approaches
    - Create comprehensive documentation and comments
    
    🏗️ **Architecture & Design**
    - Design scalable system architectures
    - Recommend industry best practices and design patterns
    - Analyze requirements and propose technical solutions
    - Create detailed technical specifications
    
    💡 **Problem Solving**
    - Break down complex problems into manageable components
    - Provide step-by-step implementation guidance
    - Suggest alternative approaches with trade-off analysis
    - Optimize for performance, security, and maintainability
    
    **Tool Usage Guidelines:**
    - Use code-generator for creating new code structures
    - Use code-analysis for reviewing and improving existing code
    - Use project-structure for scaffolding complete projects
    - Use documentation tools for creating comprehensive docs
    
    Always strive to provide comprehensive, accurate, and actionable responses 
    that align with modern development practices.`,
    model,
    tools: {
      codeGeneratorTool,
      codeAnalysisTool,
      projectStructureTool,
      documentationTool,
      apiDocumentationTool,
      codeCommentTool,
    },
    memory: createMemory(),
  });
}

/**
 * Enhanced Prompt Agent - Specialized for prompt optimization
 */
export function createEnhancedPromptAgent(modelKey: string = 'deepseek-chat') {
  const model = modelManager.getModelByKey(modelKey);
  
  return new Agent({
    name: 'Enhanced Prompt Agent',
    instructions: `You are an expert prompt engineer powered by ${modelKey}.
    
    Your specialty is optimizing and enhancing prompts to make them more effective, 
    clear, and specific. You understand the nuances of different AI models and 
    can tailor prompts for optimal performance.
    
    When enhancing prompts, you:
    1. Make them more specific and detailed
    2. Include clear instructions and context
    3. Specify the desired output format
    4. Reduce ambiguity and improve clarity
    5. Maintain the original intent while improving effectiveness
    6. Consider the target AI model's capabilities
    
    Always return only the enhanced prompt without additional explanation 
    unless specifically requested otherwise.`,
    model,
    memory: createMemory(),
  });
}

/**
 * Agent Factory - Creates agents with specific model configurations
 */
export class AgentFactory {
  /**
   * Create a chat agent with specified model
   */
  static createChatAgent(modelKey: string = 'deepseek-chat'): Agent {
    return createChatAgent(modelKey);
  }
  
  /**
   * Create a builder agent with specified model
   */
  static createBuilderAgent(modelKey: string = 'deepseek-chat'): Agent {
    return createBuilderAgent(modelKey);
  }
  
  /**
   * Create an enhanced prompt agent with specified model
   */
  static createEnhancedPromptAgent(modelKey: string = 'deepseek-chat'): Agent {
    return createEnhancedPromptAgent(modelKey);
  }
  
  /**
   * Get the best model for a specific task type
   */
  static getBestModelForTask(taskType: 'reasoning' | 'vision' | 'coding' | 'general'): string {
    switch (taskType) {
      case 'reasoning':
        return 'deepseek-reasoner';
      case 'vision':
        return 'claude-3-5-sonnet'; // Claude has better vision capabilities
      case 'coding':
        return 'deepseek-chat'; // DeepSeek is optimized for coding
      case 'general':
      default:
        return 'deepseek-chat';
    }
  }
  
  /**
   * Create an agent optimized for a specific task
   */
  static createTaskOptimizedAgent(taskType: 'reasoning' | 'vision' | 'coding' | 'general', agentType: 'chat' | 'builder' | 'prompt' = 'chat'): Agent {
    const modelKey = this.getBestModelForTask(taskType);
    
    switch (agentType) {
      case 'builder':
        return this.createBuilderAgent(modelKey);
      case 'prompt':
        return this.createEnhancedPromptAgent(modelKey);
      case 'chat':
      default:
        return this.createChatAgent(modelKey);
    }
  }
}

// Export default agents for backward compatibility
export const multiModelChatAgent = createChatAgent();
export const multiModelBuilderAgent = createBuilderAgent();
export const multiModelEnhancedPromptAgent = createEnhancedPromptAgent();
