/**
 * Chat API Route - /api/chat
 * 
 * Implements the dual-mode chat system (Chat + Builder) compatible with we-dev-next
 * Supports streaming responses and tool calling
 */

import { registerApiRoute } from '@mastra/core/server';
import { z } from 'zod';

// Request/Response schemas matching we-dev-next API
const ChatRequestSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant', 'system']),
    content: z.string(),
  })),
  model: z.string(),
  mode: z.enum(['chat', 'builder']).default('builder'),
  otherConfig: z.object({
    isBackEnd: z.boolean().optional(),
    backendLanguage: z.string().optional(),
    type: z.enum(['miniProgram', 'other']).optional(),
  }).optional(),
  tools: z.array(z.any()).optional(),
});

type ChatRequest = z.infer<typeof ChatRequestSchema>;

/**
 * Chat Mode Handler - General conversation
 */
async function handleChatMode(
  messages: ChatRequest['messages'],
  model: string,
  userId: string | null,
  tools?: any[]
) {
  // Import the agent factory
  const { AgentFactory } = await import('../agents/multi-model-agent');

  // Create a chat agent with the specified model
  const chatAgent = AgentFactory.createChatAgent(model);

  // Convert messages to Mastra format
  const mastraMessages = messages.map(msg => ({
    role: msg.role,
    content: msg.content,
  }));

  // Generate response using the agent with memory context
  const result = await chatAgent.generate(mastraMessages, {
    resourceId: userId || 'anonymous',
    threadId: `chat_${Date.now()}`,
    maxSteps: 3, // Allow multi-step reasoning
  });

  return result;
}

/**
 * Builder Mode Handler - Code generation and project building
 */
async function handleBuilderMode(
  messages: ChatRequest['messages'],
  model: string,
  userId: string | null,
  otherConfig?: ChatRequest['otherConfig'],
  tools?: any[]
) {
  // Import the agent factory
  const { AgentFactory } = await import('../agents/multi-model-agent');

  // Determine the best model for the task
  let selectedModel = model;
  if (otherConfig?.type === 'miniProgram' || otherConfig?.isBackEnd) {
    // For complex coding tasks, use the best coding model
    selectedModel = AgentFactory.getBestModelForTask('coding');
  }

  // Create a builder agent with the selected model
  const builderAgent = AgentFactory.createBuilderAgent(selectedModel);

  // Convert messages to Mastra format
  const mastraMessages = messages.map(msg => ({
    role: msg.role,
    content: msg.content,
  }));

  // Generate response using the builder agent with enhanced context
  const result = await builderAgent.generate(mastraMessages, {
    resourceId: userId || 'anonymous',
    threadId: `builder_${Date.now()}`,
    maxSteps: 5, // Allow more steps for complex code generation
  });

  return result;
}

/**
 * Main chat handler - routes to appropriate mode
 */
async function chatHandler(c: any) {
  try {
    const body = await c.req.json();
    const validatedRequest = ChatRequestSchema.parse(body);
    
    const { messages, model, mode, otherConfig, tools } = validatedRequest;
    const userId = c.req.header('userId') || null;

    let result;

    // Route to appropriate handler based on mode
    if (mode === 'chat') {
      result = await handleChatMode(messages, model, userId, tools);
    } else {
      result = await handleBuilderMode(messages, model, userId, otherConfig, tools);
    }

    // Check if streaming is requested
    const isStreaming = c.req.header('Accept')?.includes('text/event-stream') ||
                       c.req.query('stream') === 'true';

    if (isStreaming) {
      // Handle streaming response
      return handleStreamingResponse(c, result, mode, model, userId);
    } else {
      // Regular JSON response
      return c.json({
        choices: [{
          message: {
            role: 'assistant',
            content: result.text,
          },
        }],
      });
    }

  } catch (error) {
    console.error('Chat API Error:', error);
    
    // Handle specific error types
    if (error instanceof z.ZodError) {
      return c.json({ error: 'Invalid request format', details: error.errors }, 400);
    }
    
    if (error instanceof Error) {
      if (error.message?.includes('API key')) {
        return c.json({ error: 'Invalid or missing API key' }, 401);
      }
      if (error.message?.includes('pipe response')) {
        return c.json({ error: 'Stream processing error' }, 500);
      }
      if (error.message?.includes('Maximum segments reached')) {
        return c.json({ error: 'Response too long' }, 413);
      }
    }

    return c.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : String(error)
    }, 500);
  }
}

// Register the chat API route
export const chatRoute = registerApiRoute('/chat', {
  method: 'POST',
  handler: chatHandler,
  middleware: [
    // CORS middleware
    async (c, next) => {
      c.header('Access-Control-Allow-Origin', '*');
      c.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
      c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, userId');
      
      if (c.req.method === 'OPTIONS') {
        return new Response(null, { status: 204 });
      }
      
      await next();
    },
    // Request logging
    async (c, next) => {
      const start = Date.now();
      await next();
      const duration = Date.now() - start;
      console.log(`${c.req.method} ${c.req.url} - ${duration}ms`);
    },
  ],
});

/**
 * Handle streaming response using Server-Sent Events (SSE)
 */
async function handleStreamingResponse(
  c: any,
  result: any,
  mode: string,
  model: string,
  userId: string | null
) {
  // Set SSE headers
  c.header('Content-Type', 'text/event-stream');
  c.header('Cache-Control', 'no-cache');
  c.header('Connection', 'keep-alive');
  c.header('Access-Control-Allow-Origin', '*');
  c.header('Access-Control-Allow-Headers', 'Cache-Control');

  // Create a readable stream for SSE
  const stream = new ReadableStream({
    start(controller) {
      // Send initial metadata
      const metadata = {
        id: `chatcmpl-${Date.now()}`,
        object: 'chat.completion.chunk',
        created: Math.floor(Date.now() / 1000),
        model: model,
        choices: [{
          index: 0,
          delta: { role: 'assistant' },
          finish_reason: null
        }]
      };

      controller.enqueue(`data: ${JSON.stringify(metadata)}\n\n`);

      // If we have text content, stream it
      if (result.text) {
        // Split text into chunks for streaming effect
        const words = result.text.split(' ');

        const sendChunk = (index: number) => {
          if (index >= words.length) {
            // Send final chunk
            const finalChunk = {
              id: `chatcmpl-${Date.now()}`,
              object: 'chat.completion.chunk',
              created: Math.floor(Date.now() / 1000),
              model: model,
              choices: [{
                index: 0,
                delta: {},
                finish_reason: 'stop'
              }]
            };
            controller.enqueue(`data: ${JSON.stringify(finalChunk)}\n\n`);
            controller.enqueue('data: [DONE]\n\n');
            controller.close();
            return;
          }

          const chunk = {
            id: `chatcmpl-${Date.now()}`,
            object: 'chat.completion.chunk',
            created: Math.floor(Date.now() / 1000),
            model: model,
            choices: [{
              index: 0,
              delta: { content: words[index] + (index < words.length - 1 ? ' ' : '') },
              finish_reason: null
            }]
          };

          controller.enqueue(`data: ${JSON.stringify(chunk)}\n\n`);

          // Continue with next word after a small delay
          setTimeout(() => sendChunk(index + 1), 50);
        };

        sendChunk(0);
      } else {
        // No content, just close
        const finalChunk = {
          id: `chatcmpl-${Date.now()}`,
          object: 'chat.completion.chunk',
          created: Math.floor(Date.now() / 1000),
          model: model,
          choices: [{
            index: 0,
            delta: {},
            finish_reason: 'stop'
          }]
        };
        controller.enqueue(`data: ${JSON.stringify(finalChunk)}\n\n`);
        controller.enqueue('data: [DONE]\n\n');
        controller.close();
      }
    }
  });

  return new Response(stream);
}
