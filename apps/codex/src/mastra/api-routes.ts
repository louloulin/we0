/**
 * API Routes Configuration
 * 
 * All custom API routes for the we-dev-next compatible API
 */

import { registerApiRoute } from '@mastra/core/server';
import { z } from 'zod';

// Chat API Route
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

export const chatApiRoute = registerApiRoute('apix/chat', {
  method: 'POST',
  handler: async (c) => {
    try {
      const body = await c.req.json();
      const validatedRequest = ChatRequestSchema.parse(body);

      const { messages, model, mode, otherConfig, tools } = validatedRequest;
      const userId = c.req.header('userId') || null;

      // Import the agent factory
      const { AgentFactory } = await import('./agents/multi-model-agent');

      // Check if streaming is requested
      const isStreaming = c.req.header('Accept')?.includes('text/event-stream') ||
                         c.req.query('stream') === 'true';

      // Route to appropriate handler based on mode
      if (mode === 'chat') {
        return await handleChatMode(messages, model, userId, tools, isStreaming, c);
      } else {
        return await handleBuilderMode(messages, model, userId, otherConfig, tools, isStreaming, c);
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
  },
});

// Model Configuration API Route
export const modelApiRoute = registerApiRoute('/apix/model', {
  method: 'POST',
  handler: async (c) => {
    const modelConfigs = [
          {
        label: "DeepSeek Reasoner",
        value: "deepseek-reasoner",
        useImage: false,
        description: "DeepSeek's reasoning-focused model",
        icon: "https://files.deepseek.com/api/file/deepseek-logo.svg",
        provider: "deepseek",
        functionCall: false,
      },
      {
        label: "DeepSeek Chat",
        value: "deepseek-chat",
        useImage: false,
        description: "DeepSeek's conversational model with tool support",
        icon: "https://files.deepseek.com/api/file/deepseek-logo.svg",
        provider: "deepseek",
        functionCall: true,
      },
      {
        label: "DeepSeek V3",
        value: "deepseek-v3",
        useImage: false,
        description: "DeepSeek's most advanced model with 128K context",
        icon: "https://files.deepseek.com/api/file/deepseek-logo.svg",
        provider: "deepseek",
        functionCall: true,
      }
    ];
    return c.json(modelConfigs);
  },
});

// Deploy API Route
export const deployApiRoute = registerApiRoute('apix/deploy', {
  method: 'POST',
  handler: async (c) => {
    try {
      const formData = await c.req.formData();
      const file = formData.get('file') as File;

      if (!file) {
        return c.json({
          success: false,
          message: 'No file provided'
        }, 400);
      }

      // Validate file type
      if (file.type !== 'application/zip') {
        return c.json({
          success: false,
          message: 'Invalid file type. Please upload a zip file'
        }, 400);
      }

      // Check environment variables
      const netlifyToken = process.env.NETLIFY_TOKEN;
      const netlifyDeployUrl = process.env.NETLIFY_DEPLOY_URL;

      if (!netlifyToken || !netlifyDeployUrl) {
        return c.json({
          success: false,
          message: 'Netlify configuration missing. Please set NETLIFY_TOKEN and NETLIFY_DEPLOY_URL environment variables'
        }, 500);
      }

      // Prepare deployment request
      const headers = {
        'Content-Type': 'application/zip',
        'Authorization': `Bearer ${netlifyToken}`
      };

      console.log('Deploying to Netlify...');

      // Deploy to Netlify
      const response = await fetch(netlifyDeployUrl, {
        method: 'POST',
        headers: headers,
        body: file
      });

      if (response.ok) {
        const siteInfo = await response.json();
        console.log('Site deployed successfully:', siteInfo.url);
        
        return c.json({
          success: true,
          url: siteInfo.url
        });
      } else {
        const errorText = await response.text();
        console.error(`Deployment failed. Status: ${response.status}, Response: ${errorText}`);
        
        return c.json({
          success: false,
          message: `Deployment failed with status ${response.status}`
        }, 500);
      }

    } catch (error) {
      console.error('Deploy API Error:', error);
      
      return c.json({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown deployment error'
      }, 500);
    }
  },
});

// Enhanced Prompt API Route
export const enhancedPromptApiRoute = registerApiRoute('apix/enhancedPrompt', {
  method: 'POST',
  handler: async (c) => {
    try {
      const { text } = await c.req.json();
      
      if (!text) {
        return c.json({ code: 1, messages: 'Text is required' }, 400);
      }

      // Import the agent factory
      const { AgentFactory } = await import('./agents/multi-model-agent');

      // Create an enhanced prompt agent
      const agent = AgentFactory.createEnhancedPromptAgent('deepseek-chat');

      // Create enhancement prompt
      const enhancementPrompt = `You are an expert prompt engineer. Your task is to improve and optimize the following prompt to make it more effective, clear, and specific.

Original prompt:
"${text}"

Please provide an enhanced version that:
1. Is more specific and detailed
2. Includes clear instructions and context
3. Specifies the desired output format
4. Reduces ambiguity
5. Maintains the original intent

Return only the enhanced prompt without any additional explanation or formatting.`;

      // Generate enhanced prompt
      const result = await agent.generate([
        {
          role: 'user',
          content: enhancementPrompt,
        }
      ], {
        resourceId: 'prompt_enhancement',
        threadId: `enhance_${Date.now()}`,
        maxSteps: 2,
      });

      const enhancedText = result.text;

      if (!enhancedText) {
        return c.json({ code: 1, messages: 'Failed to generate enhanced prompt' }, 500);
      }

      return c.json({ code: 0, text: enhancedText.trim() });

    } catch (error) {
      console.error('Enhanced Prompt API Error:', error);
      return c.json({
        code: 1,
        messages: error instanceof Error ? error.message : 'Unknown error occurred'
      }, 500);
    }
  },
});

// Chat mode handler with proper Mastra streaming
async function handleChatMode(
  messages: any[],
  model: string,
  userId: string | null,
  tools: any,
  isStreaming: boolean,
  c: any
) {
  const { AgentFactory } = await import('./agents/multi-model-agent');

  // Create a chat agent with the specified model
  const chatAgent = AgentFactory.createChatAgent(model);

  // Convert messages to Mastra format
  const mastraMessages = messages.map(msg => ({
    role: msg.role,
    content: msg.content,
  }));

  if (isStreaming) {
    // Use Mastra's native streaming with proper SSE format
    const stream = await chatAgent.stream(mastraMessages, {
      memory: {
        resource: userId || 'anonymous',
        thread: `chat_${Date.now()}`,
      },
      maxSteps: 3, // Allow multi-step reasoning
      onStepFinish: ({ text, toolCalls, toolResults }) => {
        console.log('Step completed:', { text, toolCalls, toolResults });
      },
    });

    // Set up SSE headers
    c.header('Content-Type', 'text/event-stream');
    c.header('Cache-Control', 'no-cache');
    c.header('Connection', 'keep-alive');
    c.header('Access-Control-Allow-Origin', '*');

    // Create a readable stream for SSE
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          // Send initial event
          controller.enqueue(encoder.encode('data: {"type":"start"}\n\n'));

          // Stream the text chunks
          for await (const chunk of stream.textStream) {
            const data = JSON.stringify({
              type: 'content',
              content: chunk,
            });
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          }

          // Send completion event
          controller.enqueue(encoder.encode('data: {"type":"done"}\n\n'));
          controller.close();
        } catch (error) {
          console.error('Streaming error:', error);
          const errorData = JSON.stringify({
            type: 'error',
            error: error instanceof Error ? error.message : String(error),
          });
          controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } else {
    // Non-streaming response
    const result = await chatAgent.generate(mastraMessages, {
      memory: {
        resource: userId || 'anonymous',
        thread: `chat_${Date.now()}`,
      },
      maxSteps: 3,
    });

    return c.json({
      choices: [{
        message: {
          role: 'assistant',
          content: result.text,
        },
      }],
    });
  }
}

// Builder mode handler with proper Mastra streaming
async function handleBuilderMode(
  messages: any[],
  model: string,
  userId: string | null,
  otherConfig: any,
  tools: any,
  isStreaming: boolean,
  c: any
) {
  const { AgentFactory } = await import('./agents/multi-model-agent');

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

  if (isStreaming) {
    // Use Mastra's native streaming with enhanced context for builder mode
    const stream = await builderAgent.stream(mastraMessages, {
      memory: {
        resource: userId || 'anonymous',
        thread: `builder_${Date.now()}`,
      },
      maxSteps: 5, // Allow more steps for complex code generation
      onStepFinish: ({ text, toolCalls, toolResults }) => {
        console.log('Builder step completed:', { text, toolCalls, toolResults });
      },
    });

    // Set up SSE headers
    c.header('Content-Type', 'text/event-stream');
    c.header('Cache-Control', 'no-cache');
    c.header('Connection', 'keep-alive');
    c.header('Access-Control-Allow-Origin', '*');

    // Create a readable stream for SSE
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          // Send initial event
          controller.enqueue(encoder.encode('data: {"type":"start"}\n\n'));

          // Stream the text chunks
          for await (const chunk of stream.textStream) {
            const data = JSON.stringify({
              type: 'content',
              content: chunk,
            });
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          }

          // Send completion event
          controller.enqueue(encoder.encode('data: {"type":"done"}\n\n'));
          controller.close();
        } catch (error) {
          console.error('Builder streaming error:', error);
          const errorData = JSON.stringify({
            type: 'error',
            error: error instanceof Error ? error.message : String(error),
          });
          controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } else {
    // Non-streaming response
    const result = await builderAgent.generate(mastraMessages, {
      memory: {
        resource: userId || 'anonymous',
        thread: `builder_${Date.now()}`,
      },
      maxSteps: 5,
    });

    return c.json({
      choices: [{
        message: {
          role: 'assistant',
          content: result.text,
        },
      }],
    });
  }
}

// Legacy streaming response handler (deprecated - kept for compatibility)
function handleStreamingResponse(
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
