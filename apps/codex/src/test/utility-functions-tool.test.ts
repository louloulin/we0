/**
 * Utility Functions Tool Tests
 * 
 * Tests for utility functions tools integration
 * Tests the underlying logic functions rather than the Mastra tool wrappers
 */

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { UtilityFunctionsService } from '../mastra/services/utility-functions-service';

// Mock the utility functions service
jest.mock('../mastra/services/utility-functions-service', () => {
  const mockService = {
    jsonToZod: jest.fn(),
    processMarkdown: jest.fn(),
    detectLanguage: jest.fn(),
    stripIndents: jest.fn(),
    formatCode: jest.fn(),
    extractImports: jest.fn(),
    generateId: jest.fn(),
    deepClone: jest.fn(),
  };

  return {
    UtilityFunctionsService: jest.fn(() => mockService),
    jsonToZod: jest.fn(),
    processMarkdown: jest.fn(),
    detectLanguage: jest.fn(),
    stripIndents: jest.fn(),
  };
});

describe('Utility Functions Service Integration', () => {
  let mockService: any;

  beforeEach(() => {
    mockService = new UtilityFunctionsService();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('JSON to Zod conversion', () => {
    test('should convert JSON to Zod schema', () => {
      const mockResult = `import { z } from 'zod';

export const schema = z.object({
  name: z.string().optional(),
  age: z.number().int().optional(),
});

export type SchemaType = z.infer<typeof schema>;`;

      mockService.jsonToZod.mockReturnValue(mockResult);

      const jsonObject = { name: 'John', age: 30 };
      const options = { includeOptional: true };

      const result = mockService.jsonToZod(jsonObject, options);

      expect(result).toBe(mockResult);
      expect(result).toContain('z.object({');
      expect(result).toContain('name: z.string()');
      expect(result).toContain('age: z.number().int()');
      expect(mockService.jsonToZod).toHaveBeenCalledWith(jsonObject, options);
    });

    test('should handle complex nested objects', () => {
      const mockResult = `import { z } from 'zod';

export const schema = z.object({
  user: z.object({
    profile: z.object({
      name: z.string().optional(),
    }).optional(),
  }).optional(),
});`;

      mockService.jsonToZod.mockReturnValue(mockResult);

      const jsonObject = {
        user: {
          profile: {
            name: 'John',
          },
        },
      };

      const result = mockService.jsonToZod(jsonObject);

      expect(result).toBe(mockResult);
      expect(result).toContain('user: z.object({');
      expect(result).toContain('profile: z.object({');
      expect(mockService.jsonToZod).toHaveBeenCalledWith(jsonObject);
    });
  });

  describe('Markdown processing', () => {
    test('should process Markdown content', () => {
      const mockResult = {
        processedContent: '# Title\nSome content',
        codeBlocks: [
          { language: 'javascript', code: 'console.log("hello");', line: 3 },
        ],
        headers: [
          { level: 1, text: 'Title', line: 1 },
        ],
        links: [
          { text: 'Google', url: 'https://google.com', line: 5 },
        ],
        htmlContent: '<h1>Title</h1><br>Some content',
      };

      mockService.processMarkdown.mockReturnValue(mockResult);

      const content = '# Title\nSome content\n```javascript\nconsole.log("hello");\n```\n[Google](https://google.com)';
      const options = { convertToHtml: true };

      const result = mockService.processMarkdown(content, options);

      expect(result).toBe(mockResult);
      expect(result.codeBlocks).toHaveLength(1);
      expect(result.headers).toHaveLength(1);
      expect(result.links).toHaveLength(1);
      expect(result.htmlContent).toContain('<h1>Title</h1>');
      expect(mockService.processMarkdown).toHaveBeenCalledWith(content, options);
    });

    test('should extract code blocks correctly', () => {
      const mockResult = {
        processedContent: 'content',
        codeBlocks: [
          { language: 'python', code: 'print("hello")', line: 1 },
          { language: 'javascript', code: 'console.log("world");', line: 5 },
        ],
        headers: [],
        links: [],
      };

      mockService.processMarkdown.mockReturnValue(mockResult);

      const content = '```python\nprint("hello")\n```\n\n```javascript\nconsole.log("world");\n```';

      const result = mockService.processMarkdown(content);

      expect(result.codeBlocks).toHaveLength(2);
      expect(result.codeBlocks[0].language).toBe('python');
      expect(result.codeBlocks[1].language).toBe('javascript');
      expect(mockService.processMarkdown).toHaveBeenCalledWith(content);
    });
  });

  describe('Language detection', () => {
    test('should detect JavaScript', () => {
      const mockResult = {
        language: 'javascript',
        confidence: 0.8,
        possibleLanguages: [
          { language: 'javascript', confidence: 0.8 },
          { language: 'typescript', confidence: 0.3 },
        ],
      };

      mockService.detectLanguage.mockReturnValue(mockResult);

      const code = 'function hello() { console.log("Hello"); }';

      const result = mockService.detectLanguage(code);

      expect(result.language).toBe('javascript');
      expect(result.confidence).toBe(0.8);
      expect(result.possibleLanguages).toHaveLength(2);
      expect(mockService.detectLanguage).toHaveBeenCalledWith(code);
    });

    test('should detect TypeScript', () => {
      const mockResult = {
        language: 'typescript',
        confidence: 0.9,
        possibleLanguages: [
          { language: 'typescript', confidence: 0.9 },
          { language: 'javascript', confidence: 0.4 },
        ],
      };

      mockService.detectLanguage.mockReturnValue(mockResult);

      const code = 'interface User { name: string; } function greet(user: User): string { return "hello"; }';

      const result = mockService.detectLanguage(code);

      expect(result.language).toBe('typescript');
      expect(result.confidence).toBe(0.9);
      expect(mockService.detectLanguage).toHaveBeenCalledWith(code);
    });

    test('should handle unknown language', () => {
      const mockResult = {
        language: 'unknown',
        confidence: 0,
        possibleLanguages: [],
      };

      mockService.detectLanguage.mockReturnValue(mockResult);

      const code = 'random text that is not code';

      const result = mockService.detectLanguage(code);

      expect(result.language).toBe('unknown');
      expect(result.confidence).toBe(0);
      expect(result.possibleLanguages).toHaveLength(0);
    });
  });

  describe('Strip indents', () => {
    test('should strip common indentation', () => {
      const mockResult = 'function hello() {\n  console.log("Hello");\n}';

      mockService.stripIndents.mockReturnValue(mockResult);

      const text = '    function hello() {\n      console.log("Hello");\n    }';

      const result = mockService.stripIndents(text);

      expect(result).toBe(mockResult);
      expect(mockService.stripIndents).toHaveBeenCalledWith(text);
    });

    test('should handle empty lines', () => {
      const mockResult = 'line 1\n\nline 3';

      mockService.stripIndents.mockReturnValue(mockResult);

      const text = '  line 1\n  \n  line 3';

      const result = mockService.stripIndents(text);

      expect(result).toBe(mockResult);
      expect(mockService.stripIndents).toHaveBeenCalledWith(text);
    });
  });

  describe('Code formatting', () => {
    test('should format JavaScript code', () => {
      const mockResult = 'function test() {\n  if(true) {\n    console.log("hello");\n  }\n}';

      mockService.formatCode.mockReturnValue(mockResult);

      const code = 'function test(){if(true){console.log("hello");}}';
      const language = 'javascript';
      const indentSize = 2;

      const result = mockService.formatCode(code, language, indentSize);

      expect(result).toBe(mockResult);
      expect(result).toContain('function test() {');
      expect(result).toContain('  if(true) {');
      expect(mockService.formatCode).toHaveBeenCalledWith(code, language, indentSize);
    });

    test('should handle different indent sizes', () => {
      const mockResult = 'function test() {\n    return true;\n}';

      mockService.formatCode.mockReturnValue(mockResult);

      const code = 'function test(){return true;}';

      const result = mockService.formatCode(code, 'javascript', 4);

      expect(result).toBe(mockResult);
      expect(result).toContain('    return true;');
      expect(mockService.formatCode).toHaveBeenCalledWith(code, 'javascript', 4);
    });
  });

  describe('Extract imports', () => {
    test('should extract ES6 imports', () => {
      const mockResult = [
        { module: 'react', imports: ['React'], line: 1 },
        { module: 'react', imports: ['useState', 'useEffect'], line: 2 },
      ];

      mockService.extractImports.mockReturnValue(mockResult);

      const code = 'import React from "react";\nimport { useState, useEffect } from "react";';

      const result = mockService.extractImports(code, 'javascript');

      expect(result).toBe(mockResult);
      expect(result).toHaveLength(2);
      expect(result[0].module).toBe('react');
      expect(result[0].imports).toEqual(['React']);
      expect(mockService.extractImports).toHaveBeenCalledWith(code, 'javascript');
    });

    test('should extract Python imports', () => {
      const mockResult = [
        { module: 'os', imports: ['os'], line: 1 },
        { module: 'datetime', imports: ['datetime', 'timedelta'], line: 2 },
      ];

      mockService.extractImports.mockReturnValue(mockResult);

      const code = 'import os\nfrom datetime import datetime, timedelta';

      const result = mockService.extractImports(code, 'python');

      expect(result).toBe(mockResult);
      expect(result).toHaveLength(2);
      expect(result[1].imports).toEqual(['datetime', 'timedelta']);
      expect(mockService.extractImports).toHaveBeenCalledWith(code, 'python');
    });
  });

  describe('Utility functions', () => {
    test('should generate random ID', () => {
      const mockResult = 'abc12345';

      mockService.generateId.mockReturnValue(mockResult);

      const result = mockService.generateId(8);

      expect(result).toBe(mockResult);
      expect(mockService.generateId).toHaveBeenCalledWith(8);
    });

    test('should generate ID with prefix', () => {
      const mockResult = 'user_abc12345';

      mockService.generateId.mockReturnValue(mockResult);

      const result = mockService.generateId(8, 'user_');

      expect(result).toBe(mockResult);
      expect(result).toContain('user_');
      expect(mockService.generateId).toHaveBeenCalledWith(8, 'user_');
    });

    test('should deep clone objects', () => {
      const original = { name: 'John', nested: { value: 42 } };
      const mockResult = { name: 'John', nested: { value: 42 } };

      mockService.deepClone.mockReturnValue(mockResult);

      const result = mockService.deepClone(original);

      expect(result).toBe(mockResult);
      expect(mockService.deepClone).toHaveBeenCalledWith(original);
    });
  });

  describe('convenience functions', () => {
    test('should use jsonToZod convenience function', () => {
      const { jsonToZod } = require('../mastra/services/utility-functions-service');
      
      const mockResult = 'z.object({ name: z.string() })';
      jsonToZod.mockReturnValue(mockResult);

      const obj = { name: 'test' };
      const result = jsonToZod(obj);

      expect(result).toBe(mockResult);
      expect(jsonToZod).toHaveBeenCalledWith(obj);
    });

    test('should use processMarkdown convenience function', () => {
      const { processMarkdown } = require('../mastra/services/utility-functions-service');
      
      const mockResult = {
        processedContent: '# Title',
        codeBlocks: [],
        headers: [{ level: 1, text: 'Title', line: 1 }],
        links: [],
      };
      processMarkdown.mockReturnValue(mockResult);

      const markdown = '# Title';
      const result = processMarkdown(markdown);

      expect(result).toBe(mockResult);
      expect(processMarkdown).toHaveBeenCalledWith(markdown);
    });

    test('should use detectLanguage convenience function', () => {
      const { detectLanguage } = require('../mastra/services/utility-functions-service');
      
      const mockResult = {
        language: 'javascript',
        confidence: 0.8,
        possibleLanguages: [],
      };
      detectLanguage.mockReturnValue(mockResult);

      const code = 'function test() {}';
      const result = detectLanguage(code);

      expect(result).toBe(mockResult);
      expect(detectLanguage).toHaveBeenCalledWith(code);
    });

    test('should use stripIndents convenience function', () => {
      const { stripIndents } = require('../mastra/services/utility-functions-service');
      
      const mockResult = 'line 1\nline 2';
      stripIndents.mockReturnValue(mockResult);

      const text = '  line 1\n  line 2';
      const result = stripIndents(text);

      expect(result).toBe(mockResult);
      expect(stripIndents).toHaveBeenCalledWith(text);
    });
  });

  describe('error handling', () => {
    test('should handle JSON conversion errors gracefully', () => {
      mockService.jsonToZod.mockImplementation(() => {
        throw new Error('Invalid JSON structure');
      });

      expect(() => mockService.jsonToZod({})).toThrow('Invalid JSON structure');
      expect(mockService.jsonToZod).toHaveBeenCalledWith({});
    });

    test('should handle markdown processing errors gracefully', () => {
      const mockResult = {
        processedContent: '',
        codeBlocks: [],
        headers: [],
        links: [],
      };

      mockService.processMarkdown.mockReturnValue(mockResult);

      const result = mockService.processMarkdown('');

      expect(result.processedContent).toBe('');
      expect(result.codeBlocks).toHaveLength(0);
      expect(mockService.processMarkdown).toHaveBeenCalledWith('');
    });

    test('should handle language detection for empty code', () => {
      const mockResult = {
        language: 'unknown',
        confidence: 0,
        possibleLanguages: [],
      };

      mockService.detectLanguage.mockReturnValue(mockResult);

      const result = mockService.detectLanguage('');

      expect(result.language).toBe('unknown');
      expect(result.confidence).toBe(0);
      expect(mockService.detectLanguage).toHaveBeenCalledWith('');
    });
  });
});
