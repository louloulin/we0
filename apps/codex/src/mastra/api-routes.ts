/**
 * API Routes Configuration
 * 
 * All custom API routes for the we-dev-next compatible API
 */

import { registerApiRoute } from '@mastra/core/server';
import { z } from 'zod';

// 将Mastra stream转换为AI SDK兼容的stream
export function convertMastraStreamToAISDK(mastraStream: any) {
  const encoder = new TextEncoder();

  const readable = new ReadableStream({
    async start(controller) {
      try {
        // AI SDK数据流协议：发送初始空字符串
        const startData = `0:""\n`;
        controller.enqueue(encoder.encode(startData));

        let accumulatedText = '';

        // 根据 Mastra vNext 文档，处理流式响应
        console.log('🔍 检查 Mastra 流格式:', {
          hasTextStream: !!mastraStream?.textStream,
          hasAsyncIterator: mastraStream && typeof mastraStream[Symbol.asyncIterator] === 'function',
          streamType: typeof mastraStream,
          streamKeys: mastraStream ? Object.keys(mastraStream) : []
        });

        // 优先处理 textStream 属性（根据 Mastra 文档）
        if (mastraStream && mastraStream.textStream && typeof mastraStream.textStream[Symbol.asyncIterator] === 'function') {
          console.log('✅ 使用 textStream 属性处理流');
          for await (const chunk of mastraStream.textStream) {
            if (typeof chunk === 'string') {
              accumulatedText += chunk;

              // AI SDK格式：文本块使用 0: 前缀
              const escapedChunk = chunk
                .replace(/\\/g, '\\\\')  // 转义反斜杠
                .replace(/"/g, '\\"')    // 转义双引号
                .replace(/\n/g, '\\n')   // 转义换行符
                .replace(/\r/g, '\\r')   // 转义回车符
                .replace(/\t/g, '\\t');  // 转义制表符

              const chunkData = `0:"${escapedChunk}"\n`;
              controller.enqueue(encoder.encode(chunkData));
            }
          }
        } else if (mastraStream && typeof mastraStream[Symbol.asyncIterator] === 'function') {
          console.log('✅ 直接迭代 Mastra 流对象');
          for await (const chunk of mastraStream) {
            if (typeof chunk === 'string') {
              accumulatedText += chunk;

              const escapedChunk = chunk
                .replace(/\\/g, '\\\\')
                .replace(/"/g, '\\"')
                .replace(/\n/g, '\\n')
                .replace(/\r/g, '\\r')
                .replace(/\t/g, '\\t');

              const chunkData = `0:"${escapedChunk}"\n`;
              controller.enqueue(encoder.encode(chunkData));
            }
          }
        } else if (mastraStream && mastraStream.objectStream) {
          console.log('✅ 处理 objectStream');
          for await (const chunk of mastraStream.objectStream) {
            const chunkText = typeof chunk === 'string' ? chunk : JSON.stringify(chunk);
            accumulatedText += chunkText;

            const escapedChunk = chunkText
              .replace(/\\/g, '\\\\')
              .replace(/"/g, '\\"')
              .replace(/\n/g, '\\n')
              .replace(/\r/g, '\\r')
              .replace(/\t/g, '\\t');

            const chunkData = `0:"${escapedChunk}"\n`;
            controller.enqueue(encoder.encode(chunkData));
          }
        } else {
          // 如果不是流，尝试作为单个响应处理
          console.warn('⚠️ Mastra stream format not recognized, treating as single response');
          const content = mastraStream?.result || mastraStream?.text || String(mastraStream || '');

          const escapedContent = content
            .replace(/\\/g, '\\\\')
            .replace(/"/g, '\\"')
            .replace(/\n/g, '\\n')
            .replace(/\r/g, '\\r')
            .replace(/\t/g, '\\t');

          const contentData = `0:"${escapedContent}"\n`;
          controller.enqueue(encoder.encode(contentData));
        }

        // 发送完成标记
        const finishData = `d:{"finishReason":"stop","usage":{"promptTokens":0,"completionTokens":0}}\n`;
        controller.enqueue(encoder.encode(finishData));

        controller.close();
      } catch (error) {
        console.error('Stream conversion error:', error);
        // 发送错误信息
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorData = `3:${JSON.stringify({ error: errorMessage })}\n`;
        controller.enqueue(encoder.encode(errorData));
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

/**
 * Build system prompt for Mastra with boltArtifact instructions
 * Compatible with we-dev-next format requirements
 */
function buildSystemPromptForMastra(
  projectType: 'miniProgram' | 'web' | 'backend' | 'other',
  otherConfig: any,
  fileContextPrompt: string = ''
): string {
  const baseInstructions = `You are We0 AI, an expert AI assistant and exceptional senior software developer with vast knowledge across multiple programming languages, frameworks, and best practices.

CRITICAL OUTPUT FORMAT REQUIREMENTS:

When modifying code or creating files, you MUST use the following XML format:

<boltArtifact id="unique-id" title="Descriptive Title">
  <boltAction type="file" filePath="path/to/file.ext">
    // Complete file content here - NO PLACEHOLDERS
  </boltAction>
  <boltAction type="file" filePath="another/file.ext">
    // Complete file content here - NO PLACEHOLDERS
  </boltAction>
</boltArtifact>

IMPORTANT RULES:
1. ALWAYS wrap file content in <boltArtifact> tags
2. Each file must be in a separate <boltAction type="file" filePath="..."> tag
3. Include COMPLETE file content, never use placeholders like "// rest of code..."
4. Use relative file paths
5. Do NOT use markdown code blocks for files
6. Output must be XML format, not markdown!
7. The filePath should be relative to the current working directory

Examples:
<boltArtifact id="react-component" title="React Todo Component">
  <boltAction type="file" filePath="src/components/Todo.jsx">
import React, { useState } from 'react';

export default function Todo() {
  const [todos, setTodos] = useState([]);
  const [input, setInput] = useState('');

  const addTodo = () => {
    if (input.trim()) {
      setTodos([...todos, { id: Date.now(), text: input, completed: false }]);
      setInput('');
    }
  };

  return (
    <div className="todo-container">
      <h1>Todo List</h1>
      <div>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Add a todo..."
        />
        <button onClick={addTodo}>Add</button>
      </div>
      <ul>
        {todos.map(todo => (
          <li key={todo.id}>{todo.text}</li>
        ))}
      </ul>
    </div>
  );
}
  </boltAction>
  <boltAction type="file" filePath="src/styles/Todo.css">
.todo-container {
  padding: 20px;
  max-width: 600px;
  margin: 0 auto;
}

.todo-container h1 {
  color: #333;
  text-align: center;
}

.todo-container input {
  padding: 8px;
  margin-right: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.todo-container button {
  padding: 8px 16px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
  </boltAction>
</boltArtifact>`;

  // Add project-specific instructions
  let projectSpecificInstructions = '';

  if (projectType === 'miniProgram') {
    projectSpecificInstructions = `
MINI PROGRAM SPECIFIC REQUIREMENTS:
- For any place that uses images, implement using weui's icon library
- Usage example: <we-icon type="field" icon="add" color="black" size="{{24}}"></we-icon>
- Size must be 24px
- Available icons: add, delete, search, home, setting, etc.
- If images need to be used, write /components/weicon/index in the current directory's .json file
- If the mini program needs a tabbar, generate a custom bottom tabbar component custom-tab-bar`;
  } else if (projectType === 'web') {
    projectSpecificInstructions = `
WEB PROJECT REQUIREMENTS:
- If you are a react project, you must use import React from 'react' to introduce react
- Use modern ES6+ syntax and best practices
- Ensure responsive design principles`;
  }

  if (otherConfig?.isBackEnd) {
    projectSpecificInstructions += `
BACKEND REQUIREMENTS:
- You must generate backend code, do not only generate frontend code
- Backend must handle CORS for all domains
- Use localhost for backend address, do not use remote ip addresses
- Connect frontend to backend, abstract frontend-backend interface connections into an api.js
- Separate frontend and backend files, put frontend files under src, backend files in backend directory`;
  }

  // Combine all parts
  let fullPrompt = baseInstructions + projectSpecificInstructions;

  if (fileContextPrompt) {
    fullPrompt = fileContextPrompt + '\n\n' + fullPrompt;
  }

  return fullPrompt;
}

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
      const isStreaming = true || c.req.header('Accept')?.includes('text/event-stream') ||
                         c.req.query('stream') === 'true';

      // Route to appropriate handler based on mode
      if (mode === 'chat') {
        return await handleChatMode(messages, model, userId, tools, isStreaming, c);
      } else {
        // 🚀 使用新的智能编程模式处理器
        const useIntelligentCoding = c.req.header('X-Use-Intelligent-Coding') === 'true' ||
                                   c.req.query('intelligent') === 'true' ||
                                   true; // 默认启用智能编程模式

        if (useIntelligentCoding) {
          const { handleIntelligentCodingMode } = await import('./api/intelligent-coding-api');
          return await handleIntelligentCodingMode(messages, model, userId, otherConfig, tools, isStreaming, c);
        } else {
          // 保留原有的 Builder 模式作为备选
          return await handleBuilderMode(messages, model, userId, otherConfig, tools, isStreaming, c);
        }
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
    // Use Mastra's native streaming and convert to AI SDK format
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

    // Convert Mastra stream to AI SDK compatible format
    return convertMastraStreamToAISDK(stream);
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

// Builder mode handler with proper Mastra streaming and file processing
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

  // 1. Process files from messages (similar to we-dev-next)
  const { processFiles, determineProjectType, estimateTokens } = await import('./utils/file-processor');
  const { files, allContent } = processFiles(messages);

  // 2. Handle URL screenshots (if needed)
  const lastMessage = messages[messages.length - 1];
  if (lastMessage.role === 'user' && lastMessage.content.startsWith('#')) {
    const urlMatch = lastMessage.content.match(/https?:\/\/[^\s]+/);
    if (urlMatch) {
      try {
        // Note: Screenshot functionality would need to be implemented
        console.log('URL detected for screenshot:', urlMatch[0]);
      } catch (error) {
        console.error('Screenshot capture failed:', error);
      }
    }
  }

  // 3. Determine project type and file structure
  const filesPath = Object.keys(files);
  let nowFiles = files;
  const projectType = determineProjectType(files);

  // 4. Build system prompt with file context
  let systemPrompt = '';
  let fileContextPrompt = '';

  if (estimateTokens(allContent) > 128000) {
    // Handle large file content - simplified version
    const { filterFiles } = await import('./utils/file-processor');
    nowFiles = filterFiles(files, { codeOnly: true });
    fileContextPrompt = `Current file directory tree: ${filesPath.join("\n")}\n\nCurrent requirement file contents:\n${JSON.stringify(nowFiles)}`;
  } else if (filesPath.length > 0) {
    fileContextPrompt = `Current file directory tree: ${filesPath.join("\n")}\n\nCurrent requirement file contents:\n${JSON.stringify(nowFiles)}`;
  }

  // 5. Build complete system prompt with boltArtifact instructions
  systemPrompt = buildSystemPromptForMastra(projectType, otherConfig, fileContextPrompt);

  // 6. Determine the best model for the task
  let selectedModel = model;
  if (otherConfig?.type === 'miniProgram' || otherConfig?.isBackEnd) {
    selectedModel = AgentFactory.getBestModelForTask('coding');
  }

  // 7. Create a builder agent with the selected model
  const builderAgent = AgentFactory.createBuilderAgent(selectedModel);

  // 8. Modify the last message to include system prompt and format instructions
  const modifiedMessages = [...messages];
  modifiedMessages[modifiedMessages.length - 1] = {
    ...lastMessage,
    content: systemPrompt +
      '\n\nIMPORTANT: When writing code, do not give me markdown, output must be XML format using boltArtifact tags!! Emphasis! My question is: ' +
      lastMessage.content
  };

  // 9. Convert messages to Mastra format
  const mastraMessages = modifiedMessages.map(msg => ({
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

    // Convert Mastra stream to AI SDK compatible format
    return convertMastraStreamToAISDK(stream);
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

// 🚀 新的智能编程专用 API 端点
export const intelligentCodingApiRoute = registerApiRoute('apix/intelligent-coding', {
  method: 'POST',
  handler: async (c) => {
    try {
      const body = await c.req.json();
      const validatedRequest = ChatRequestSchema.parse(body);

      const { messages, model, otherConfig, tools } = validatedRequest;
      const userId = c.req.header('userId') || null;

      // 强制使用流式响应以获得最佳体验
      const isStreaming = true;

      console.log('🚀 智能编程 API 调用:', {
        messageCount: messages.length,
        model,
        userId,
        hasOtherConfig: !!otherConfig,
        toolsCount: tools?.length || 0
      });

      // 使用智能编程处理器
      const { handleIntelligentCodingMode } = await import('./api/intelligent-coding-api');
      return await handleIntelligentCodingMode(messages, model, userId, otherConfig, tools, isStreaming, c);

    } catch (error) {
      console.error('❌ 智能编程 API 错误:', error);
      return c.json({
        error: '智能编程处理失败',
        details: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      }, 500);
    }
  },
});

// 🔍 智能编程状态查询 API
export const intelligentCodingStatusRoute = registerApiRoute('apix/intelligent-coding/status', {
  method: 'GET',
  handler: async (c) => {
    try {
      const { getIntelligentCodingStatus } = await import('./api/intelligent-coding-api');
      const status = getIntelligentCodingStatus();

      return c.json({
        ...status,
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      });
    } catch (error) {
      console.error('智能编程状态查询错误:', error);
      return c.json({
        error: '状态查询失败',
        details: error instanceof Error ? error.message : String(error)
      }, 500);
    }
  },
});
