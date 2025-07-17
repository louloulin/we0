/**
 * Chat Mode Workflow
 * 
 * Implements the conversational workflow for Chat Mode,
 * including context processing, response generation, and formatting
 */

import { createWorkflow, createStep } from '@mastra/core/workflows';
import { z } from 'zod';
import { AgentFactory } from '../agents/multi-model-agent';

// Schema definitions
const MessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string(),
});

const ContextProcessingOutputSchema = z.object({
  conversationContext: z.string(),
  userIntent: z.string(),
  topicCategory: z.enum(['general', 'technical', 'creative', 'educational']),
  requiresSpecialHandling: z.boolean(),
});

const ResponseGenerationOutputSchema = z.object({
  response: z.string(),
  confidence: z.number(),
  modelUsed: z.string(),
});

// Context Processing Step
const contextProcessingStep = createStep({
  id: 'context-processing',
  description: 'Analyze conversation context and user intent',
  inputSchema: z.object({
    messages: z.array(MessageSchema),
    model: z.string(),
    tools: z.array(z.any()).optional(),
  }),
  outputSchema: ContextProcessingOutputSchema,
  execute: async ({ inputData }) => {
    const { messages } = inputData;
    
    // Build conversation context
    const conversationContext = messages
      .slice(-5) // Keep last 5 messages for context
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n');
    
    // Analyze user intent from the latest message
    const latestUserMessage = messages
      .filter(msg => msg.role === 'user')
      .pop()?.content || '';
    
    let userIntent = 'general_conversation';
    let topicCategory: 'general' | 'technical' | 'creative' | 'educational' = 'general';
    let requiresSpecialHandling = false;
    
    // Intent analysis
    if (latestUserMessage.toLowerCase().includes('code') || 
        latestUserMessage.toLowerCase().includes('programming') ||
        latestUserMessage.toLowerCase().includes('function')) {
      userIntent = 'technical_assistance';
      topicCategory = 'technical';
    } else if (latestUserMessage.toLowerCase().includes('write') ||
               latestUserMessage.toLowerCase().includes('story') ||
               latestUserMessage.toLowerCase().includes('creative')) {
      userIntent = 'creative_assistance';
      topicCategory = 'creative';
    } else if (latestUserMessage.toLowerCase().includes('explain') ||
               latestUserMessage.toLowerCase().includes('learn') ||
               latestUserMessage.toLowerCase().includes('how')) {
      userIntent = 'educational_assistance';
      topicCategory = 'educational';
    }
    
    // Check for special handling requirements
    if (latestUserMessage.length > 1000 || 
        latestUserMessage.includes('urgent') ||
        latestUserMessage.includes('important')) {
      requiresSpecialHandling = true;
    }
    
    return {
      conversationContext,
      userIntent,
      topicCategory,
      requiresSpecialHandling,
    };
  },
});

// Response Generation Step
const responseGenerationStep = createStep({
  id: 'response-generation',
  description: 'Generate AI response using appropriate model',
  inputSchema: z.object({
    messages: z.array(MessageSchema),
    model: z.string(),
    conversationContext: z.string(),
    userIntent: z.string(),
    topicCategory: z.enum(['general', 'technical', 'creative', 'educational']),
    requiresSpecialHandling: z.boolean(),
  }),
  outputSchema: ResponseGenerationOutputSchema,
  execute: async ({ inputData }) => {
    const { messages, model, topicCategory, requiresSpecialHandling } = inputData;
    
    // Select the best model for the task
    let selectedModel = model;
    if (requiresSpecialHandling) {
      // Use reasoning model for complex queries
      selectedModel = AgentFactory.getBestModelForTask('reasoning');
    } else {
      // Use task-optimized model
      switch (topicCategory) {
        case 'technical':
          selectedModel = AgentFactory.getBestModelForTask('coding');
          break;
        case 'creative':
          selectedModel = AgentFactory.getBestModelForTask('general');
          break;
        case 'educational':
          selectedModel = AgentFactory.getBestModelForTask('reasoning');
          break;
        default:
          selectedModel = model;
      }
    }
    
    // Create a chat agent with the selected model
    const chatAgent = AgentFactory.createChatAgent(selectedModel);
    
    // Generate response using the agent
    const result = await chatAgent.generate(messages, {
      resourceId: 'chat_workflow',
      threadId: `chat_${Date.now()}`,
      maxSteps: 2,
    });
    
    // Calculate confidence based on response quality
    let confidence = 0.8; // Base confidence
    if (result.text && result.text.length > 50) {
      confidence += 0.1;
    }
    if (requiresSpecialHandling && selectedModel.includes('reasoner')) {
      confidence += 0.1;
    }
    
    return {
      response: result.text || 'I apologize, but I was unable to generate a response.',
      confidence: Math.min(confidence, 1.0),
      modelUsed: selectedModel,
    };
  },
});

// Response Enhancement Step
const responseEnhancementStep = createStep({
  id: 'response-enhancement',
  description: 'Enhance and format the response',
  inputSchema: z.object({
    response: z.string(),
    confidence: z.number(),
    modelUsed: z.string(),
    topicCategory: z.enum(['general', 'technical', 'creative', 'educational']),
    userIntent: z.string(),
  }),
  outputSchema: z.object({
    enhancedResponse: z.string(),
    metadata: z.object({
      confidence: z.number(),
      modelUsed: z.string(),
      category: z.string(),
    }),
  }),
  execute: async ({ inputData }) => {
    const { response, confidence, modelUsed, topicCategory, userIntent } = inputData;
    
    let enhancedResponse = response;
    
    // Add category-specific enhancements
    switch (topicCategory) {
      case 'technical':
        if (!response.includes('```') && response.includes('code')) {
          // Suggest code formatting if technical response doesn't have code blocks
          enhancedResponse += '\n\n💡 *Tip: If you need code examples, feel free to ask for specific implementations.*';
        }
        break;
      case 'creative':
        if (response.length < 100) {
          enhancedResponse += '\n\n✨ *Would you like me to expand on this creative idea?*';
        }
        break;
      case 'educational':
        enhancedResponse += '\n\n📚 *Feel free to ask follow-up questions if you need clarification on any part.*';
        break;
    }
    
    // Add confidence indicator for low confidence responses
    if (confidence < 0.7) {
      enhancedResponse += '\n\n⚠️ *Please note: This response may need verification. Feel free to ask for clarification.*';
    }
    
    return {
      enhancedResponse,
      metadata: {
        confidence,
        modelUsed,
        category: topicCategory,
      },
    };
  },
});

// Response Formatting Step
const responseFormattingStep = createStep({
  id: 'response-formatting',
  description: 'Format the final response for the client',
  inputSchema: z.object({
    enhancedResponse: z.string(),
    metadata: z.object({
      confidence: z.number(),
      modelUsed: z.string(),
      category: z.string(),
    }),
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
    const { enhancedResponse } = inputData;
    
    return {
      choices: [{
        message: {
          role: 'assistant' as const,
          content: enhancedResponse,
        },
      }],
    };
  },
});

// Create the Chat Workflow
export const chatWorkflow = createWorkflow({
  id: 'chat-workflow',
  description: 'Complete Chat Mode workflow for conversational AI',
  inputSchema: z.object({
    messages: z.array(MessageSchema),
    model: z.string(),
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
.then(contextProcessingStep)
.then(responseGenerationStep)
.then(responseEnhancementStep)
.then(responseFormattingStep)
.commit();
