/**
 * Comprehensive Functionality Test
 * 
 * Tests all core functionality to ensure the Mastra refactor is complete and working
 */

import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import { mastra } from '../mastra';
import { parseMessage, processFiles } from '../mastra/services/file-processing';
import { screenshotService } from '../mastra/services/screenshot-service';
import { tokenService } from '../mastra/services/token-service';
import { textProcessingService } from '../mastra/services/text-processing-service';
import { databasePromptService } from '../mastra/services/database-prompt-service';
import { utilityFunctionsService } from '../mastra/services/utility-functions-service';
import { cacheService } from '../mastra/services/cache-service';
import { performanceService } from '../mastra/services/performance-service';

describe('Comprehensive Functionality Test', () => {
  beforeAll(async () => {
    // Initialize services if needed
  });

  afterAll(async () => {
    // Cleanup
  });

  describe('Core System Integration', () => {
    test('should have Mastra instance properly configured', () => {
      expect(mastra).toBeDefined();
      expect(mastra.agents).toBeDefined();
      expect(mastra.workflows).toBeDefined();
    });

    test('should have all agents registered', () => {
      const agents = mastra.getAgents();
      expect(agents).toBeDefined();
      expect(Object.keys(agents).length).toBeGreaterThan(0);
      
      // Check for key agents
      expect(agents['deepseekAgent']).toBeDefined();
      expect(agents['deepseekCoderAgent']).toBeDefined();
    });

    test('should have all workflows registered', () => {
      const workflows = mastra.getWorkflows();
      expect(workflows).toBeDefined();
      expect(Object.keys(workflows).length).toBeGreaterThan(0);
    });
  });

  describe('File Processing System', () => {
    test('should parse boltArtifact content correctly', () => {
      const content = `
Here's a simple React component:

<boltArtifact id="react-component" title="Simple React Component">
<boltAction type="file" filePath="src/components/Button.tsx">
import React from 'react';

interface ButtonProps {
  label: string;
  onClick: () => void;
}

export const Button: React.FC<ButtonProps> = ({ label, onClick }) => {
  return (
    <button onClick={onClick} className="btn">
      {label}
    </button>
  );
};
</boltAction>
</boltArtifact>
      `;

      const result = parseMessage(content);
      expect(result.files).toBeDefined();
      expect(result.files!['src/components/Button.tsx']).toContain('interface ButtonProps');
    });

    test('should process multiple messages and extract files', () => {
      const messages = [
        {
          role: 'user' as const,
          content: 'Create a React component',
        },
        {
          role: 'assistant' as const,
          content: `
<boltArtifact id="component" title="Component">
<boltAction type="file" filePath="src/App.tsx">
import React from 'react';
export default function App() {
  return <div>Hello World</div>;
}
</boltAction>
</boltArtifact>
          `,
        },
      ];

      const result = processFiles(messages);
      expect(result.files).toBeDefined();
      expect(result.files['src/App.tsx']).toContain('Hello World');
    });
  });

  describe('Screenshot Service', () => {
    test('should validate URLs correctly', () => {
      expect(screenshotService.validateUrl('https://example.com')).toBe(true);
      expect(screenshotService.validateUrl('http://example.com')).toBe(true);
      expect(screenshotService.validateUrl('invalid-url')).toBe(false);
      expect(screenshotService.validateUrl('')).toBe(false);
    });

    test('should create mock screenshots when API is not configured', () => {
      const mockScreenshot = screenshotService.createMockScreenshot('https://example.com');
      expect(mockScreenshot).toContain('data:image/png;base64,');
    });

    test('should return service status', () => {
      const status = screenshotService.getStatus();
      expect(status).toBeDefined();
      expect(status.configured).toBeDefined();
      expect(status.apiKey).toBeDefined();
    });
  });

  describe('Token Management System', () => {
    test('should count tokens accurately', () => {
      const text = 'Hello world, this is a test message.';
      const tokens = tokenService.countTokens(text);
      expect(tokens).toBeGreaterThan(0);
      expect(typeof tokens).toBe('number');
    });

    test('should calculate costs for different models', () => {
      const tokens = 1000;
      const gpt4Cost = tokenService.calculateCost(tokens, 'gpt-4');
      const gpt35Cost = tokenService.calculateCost(tokens, 'gpt-3.5-turbo');
      
      expect(gpt4Cost).toBeGreaterThan(0);
      expect(gpt35Cost).toBeGreaterThan(0);
      expect(gpt4Cost).toBeGreaterThan(gpt35Cost); // GPT-4 should be more expensive
    });

    test('should track user token usage', () => {
      const userId = 'test-user-123';
      const tokens = 500;
      
      tokenService.trackUsage(userId, tokens);
      const usage = tokenService.getUserUsage(userId);
      
      expect(usage).toBeDefined();
      expect(usage!.totalTokens).toBe(tokens);
    });

    test('should check token limits', () => {
      const result = tokenService.checkLimits('test-user', 100);
      expect(result.allowed).toBeDefined();
      expect(typeof result.allowed).toBe('boolean');
    });
  });

  describe('Text Processing Service', () => {
    test('should generate diff between texts', () => {
      const oldText = 'Hello world';
      const newText = 'Hello beautiful world';
      
      const diff = textProcessingService.generateDiff(oldText, newText);
      expect(diff).toContain('beautiful');
    });

    test('should detect file types correctly', () => {
      const files = {
        'app.js': 'console.log("hello");',
        'app.json': '{"name": "test"}',
        'pages/index.js': 'export default function Home() {}',
      };
      
      const type = textProcessingService.detectProjectType(files);
      expect(['web', 'miniProgram', 'backend', 'other']).toContain(type);
    });

    test('should build system prompts', () => {
      const config = {
        type: 'web' as const,
        framework: 'react',
        includeFiles: true,
      };
      
      const prompt = textProcessingService.buildSystemPrompt(config);
      expect(prompt).toContain('React');
      expect(typeof prompt).toBe('string');
      expect(prompt.length).toBeGreaterThan(0);
    });

    test('should handle token limits', () => {
      const longText = 'word '.repeat(1000);
      const limited = textProcessingService.handleTokenLimit(longText, 100);
      
      expect(limited.length).toBeLessThan(longText.length);
    });
  });

  describe('Database Prompt Service', () => {
    test('should generate MySQL configuration', () => {
      const config = {
        host: 'localhost',
        port: 3306,
        database: 'testdb',
        username: 'user',
        password: 'pass',
      };
      
      const prompt = databasePromptService.generateMySQLPrompt(config);
      expect(prompt).toContain('MySQL');
      expect(prompt).toContain('localhost');
      expect(prompt).toContain('testdb');
    });

    test('should generate Redis configuration', () => {
      const config = {
        host: 'localhost',
        port: 6379,
        password: 'redis-pass',
      };
      
      const prompt = databasePromptService.generateRedisPrompt(config);
      expect(prompt).toContain('Redis');
      expect(prompt).toContain('6379');
    });

    test('should compare database options', () => {
      const requirements = {
        dataSize: 'large',
        consistency: 'strong',
        scalability: 'high',
        complexity: 'medium',
      };
      
      const comparison = databasePromptService.compareDatabases(requirements);
      expect(comparison).toBeDefined();
      expect(comparison.recommended).toBeDefined();
      expect(Array.isArray(comparison.options)).toBe(true);
    });
  });

  describe('Utility Functions Service', () => {
    test('should convert JSON to Zod schema', () => {
      const jsonObject = {
        name: 'John',
        age: 30,
        active: true,
        tags: ['developer', 'typescript'],
      };
      
      const zodSchema = utilityFunctionsService.jsonToZod(jsonObject);
      expect(zodSchema).toContain('z.object');
      expect(zodSchema).toContain('name: z.string()');
      expect(zodSchema).toContain('age: z.number().int()');
      expect(zodSchema).toContain('active: z.boolean()');
      expect(zodSchema).toContain('z.array(z.string())');
    });

    test('should process Markdown content', () => {
      const markdown = `
# Title
Some content with **bold** text.

\`\`\`javascript
console.log('hello');
\`\`\`

[Link](https://example.com)
      `;
      
      const result = utilityFunctionsService.processMarkdown(markdown);
      expect(result.headers).toHaveLength(1);
      expect(result.headers[0].text).toBe('Title');
      expect(result.codeBlocks).toHaveLength(1);
      expect(result.codeBlocks[0].language).toBe('javascript');
      expect(result.links).toHaveLength(1);
      expect(result.links[0].url).toBe('https://example.com');
    });

    test('should detect programming languages', () => {
      const jsCode = 'function hello() { console.log("Hello"); }';
      const pyCode = 'def hello():\n    print("Hello")';
      
      const jsResult = utilityFunctionsService.detectLanguage(jsCode);
      const pyResult = utilityFunctionsService.detectLanguage(pyCode);
      
      expect(jsResult.language).toBe('javascript');
      expect(pyResult.language).toBe('python');
      expect(jsResult.confidence).toBeGreaterThan(0);
      expect(pyResult.confidence).toBeGreaterThan(0);
    });

    test('should strip indentation correctly', () => {
      const indentedText = `
        function test() {
          return true;
        }
      `;
      
      const stripped = utilityFunctionsService.stripIndents(indentedText);
      expect(stripped).toBe('function test() {\n  return true;\n}');
    });
  });

  describe('Performance and Caching', () => {
    test('should cache and retrieve values', () => {
      const key = 'test-key';
      const value = { data: 'test-value' };
      
      cacheService.set(key, value, 60); // 60 seconds TTL
      const retrieved = cacheService.get(key);
      
      expect(retrieved).toEqual(value);
    });

    test('should track cache metrics', () => {
      const metrics = cacheService.getMetrics();
      expect(metrics).toBeDefined();
      expect(typeof metrics.hits).toBe('number');
      expect(typeof metrics.misses).toBe('number');
      expect(typeof metrics.hitRate).toBe('number');
    });

    test('should record performance metrics', () => {
      const startTime = Date.now();
      performanceService.recordMetric('test-operation', Date.now() - startTime);
      
      const stats = performanceService.getStats();
      expect(stats).toBeDefined();
      expect(stats['test-operation']).toBeDefined();
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle empty file processing gracefully', () => {
      const result = processFiles([]);
      expect(result.files).toEqual({});
      expect(result.allContent).toBe('');
    });

    test('should handle invalid JSON in utility functions', () => {
      expect(() => {
        utilityFunctionsService.jsonToZod(undefined);
      }).not.toThrow();
    });

    test('should handle empty text in token counting', () => {
      const tokens = tokenService.countTokens('');
      expect(tokens).toBe(0);
    });

    test('should handle invalid URLs in screenshot service', () => {
      expect(screenshotService.validateUrl('not-a-url')).toBe(false);
    });
  });

  describe('Integration Completeness', () => {
    test('should have all required services available', () => {
      expect(parseMessage).toBeDefined();
      expect(processFiles).toBeDefined();
      expect(screenshotService).toBeDefined();
      expect(tokenService).toBeDefined();
      expect(textProcessingService).toBeDefined();
      expect(databasePromptService).toBeDefined();
      expect(utilityFunctionsService).toBeDefined();
      expect(cacheService).toBeDefined();
      expect(performanceService).toBeDefined();
    });

    test('should have all convenience functions exported', () => {
      const { 
        takeScreenshot,
        countTokens,
        generateMySQLPrompt,
        generateRedisPrompt,
        jsonToZod,
        processMarkdown,
        detectLanguage,
        stripIndents,
      } = require('../mastra/services');
      
      expect(takeScreenshot).toBeDefined();
      expect(countTokens).toBeDefined();
      expect(generateMySQLPrompt).toBeDefined();
      expect(generateRedisPrompt).toBeDefined();
      expect(jsonToZod).toBeDefined();
      expect(processMarkdown).toBeDefined();
      expect(detectLanguage).toBeDefined();
      expect(stripIndents).toBeDefined();
    });
  });
});
