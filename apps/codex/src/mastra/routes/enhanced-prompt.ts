/**
 * Enhanced Prompt API Route - /api/enhancedPrompt
 * 
 * AI-powered prompt optimization compatible with we-dev-next
 */

import { registerApiRoute } from '@mastra/core/server';
import { z } from 'zod';

// Request/Response schemas
const EnhanceRequestSchema = z.object({
  text: z.string().min(1, 'Text is required'),
});

interface EnhanceResponse {
  code: number;
  text?: string;
  messages?: string;
}

/**
 * Enhanced prompt handler
 */
async function enhancedPromptHandler(c: any) {
  try {
    const body = await c.req.json();
    const { text } = EnhanceRequestSchema.parse(body);

    // Import the agent factory
    const { AgentFactory } = await import('../agents/multi-model-agent');

    // Create an enhanced prompt agent with the best model for reasoning
    const agent = AgentFactory.createEnhancedPromptAgent(
      AgentFactory.getBestModelForTask('reasoning')
    );

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

    // Generate enhanced prompt with context
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
      return c.json({
        code: 1,
        messages: 'Failed to generate enhanced prompt'
      } as EnhanceResponse, 500);
    }

    return c.json({
      code: 0,
      text: enhancedText.trim()
    } as EnhanceResponse);

  } catch (error) {
    console.error('Enhanced Prompt API Error:', error);
    
    // Handle validation errors
    if (error instanceof z.ZodError) {
      return c.json({
        code: 1,
        messages: 'Invalid request format: ' + error.errors.map(e => e.message).join(', ')
      } as EnhanceResponse, 400);
    }
    
    // Handle other errors
    return c.json({
      code: 1,
      messages: error instanceof Error ? error.message : 'Unknown error occurred'
    } as EnhanceResponse, 500);
  }
}

// Register the enhanced prompt API route
export const enhancedPromptRoute = registerApiRoute('/enhancedPrompt', {
  method: 'POST',
  handler: enhancedPromptHandler,
  middleware: [
    // CORS middleware
    async (c, next) => {
      c.header('Access-Control-Allow-Origin', '*');
      c.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
      c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      
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

export type { EnhanceResponse };
