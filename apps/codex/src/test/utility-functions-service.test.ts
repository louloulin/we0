/**
 * Utility Functions Service Tests
 * 
 * Tests for utility functions service functionality
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import { UtilityFunctionsService, jsonToZod, processMarkdown, detectLanguage, stripIndents } from '../mastra/services/utility-functions-service';

describe('UtilityFunctionsService', () => {
  let service: UtilityFunctionsService;

  beforeEach(() => {
    service = new UtilityFunctionsService();
  });

  describe('JSON to Zod conversion', () => {
    test('should convert simple object to Zod schema', () => {
      const jsonObject = {
        name: 'John',
        age: 30,
        active: true,
      };

      const result = service.jsonToZod(jsonObject);

      expect(result).toContain('import { z } from \'zod\'');
      expect(result).toContain('z.object({');
      expect(result).toContain('name: z.string()');
      expect(result).toContain('age: z.number().int()');
      expect(result).toContain('active: z.boolean()');
      expect(result).toContain('export const schema =');
      expect(result).toContain('export type SchemaType =');
    });

    test('should handle arrays in JSON', () => {
      const jsonObject = {
        items: ['item1', 'item2'],
        numbers: [1, 2, 3],
      };

      const result = service.jsonToZod(jsonObject);

      expect(result).toContain('items: z.array(z.string())');
      expect(result).toContain('numbers: z.array(z.number().int())');
    });

    test('should handle nested objects', () => {
      const jsonObject = {
        user: {
          profile: {
            name: 'John',
            email: 'john@example.com',
          },
        },
      };

      const result = service.jsonToZod(jsonObject);

      expect(result).toContain('user: z.object({');
      expect(result).toContain('profile: z.object({');
      expect(result).toContain('name: z.string()');
      expect(result).toContain('email: z.string()');
    });

    test('should handle null values', () => {
      const jsonObject = {
        value: null,
      };

      const result = service.jsonToZod(jsonObject);

      expect(result).toContain('value: z.null()');
    });

    test('should apply options correctly', () => {
      const jsonObject = {
        name: 'John',
        items: ['item1'],
      };

      const options = {
        includeOptional: false,
        includeDescriptions: true,
        stringMinLength: 1,
        arrayMinLength: 1,
      };

      const result = service.jsonToZod(jsonObject, options);

      expect(result).not.toContain('.optional()');
      expect(result).toContain('.describe(');
      expect(result).toContain('.min(1)');
    });
  });

  describe('Markdown processing', () => {
    test('should extract code blocks', () => {
      const markdown = `
# Title

Some text

\`\`\`javascript
function hello() {
  console.log('Hello');
}
\`\`\`

More text

\`\`\`python
def hello():
    print("Hello")
\`\`\`
      `;

      const result = service.processMarkdown(markdown);

      expect(result.codeBlocks).toHaveLength(2);
      expect(result.codeBlocks[0].language).toBe('javascript');
      expect(result.codeBlocks[0].code).toContain('function hello()');
      expect(result.codeBlocks[1].language).toBe('python');
      expect(result.codeBlocks[1].code).toContain('def hello()');
    });

    test('should extract headers', () => {
      const markdown = `
# Main Title
## Subtitle
### Sub-subtitle
      `;

      const result = service.processMarkdown(markdown);

      expect(result.headers).toHaveLength(3);
      expect(result.headers[0].level).toBe(1);
      expect(result.headers[0].text).toBe('Main Title');
      expect(result.headers[1].level).toBe(2);
      expect(result.headers[1].text).toBe('Subtitle');
      expect(result.headers[2].level).toBe(3);
      expect(result.headers[2].text).toBe('Sub-subtitle');
    });

    test('should extract links', () => {
      const markdown = `
Check out [Google](https://google.com) and [GitHub](https://github.com).
      `;

      const result = service.processMarkdown(markdown);

      expect(result.links).toHaveLength(2);
      expect(result.links[0].text).toBe('Google');
      expect(result.links[0].url).toBe('https://google.com');
      expect(result.links[1].text).toBe('GitHub');
      expect(result.links[1].url).toBe('https://github.com');
    });

    test('should convert to HTML when requested', () => {
      const markdown = `
# Title
**Bold text**
*Italic text*
\`code\`
[Link](https://example.com)
      `;

      const result = service.processMarkdown(markdown, { convertToHtml: true });

      expect(result.htmlContent).toContain('<h1>Title</h1>');
      expect(result.htmlContent).toContain('<strong>Bold text</strong>');
      expect(result.htmlContent).toContain('<em>Italic text</em>');
      expect(result.htmlContent).toContain('<code>code</code>');
      expect(result.htmlContent).toContain('<a href="https://example.com">Link</a>');
    });

    test('should remove comments when requested', () => {
      const markdown = `
# Title
<!-- This is a comment -->
Some content
      `;

      const result = service.processMarkdown(markdown, { removeComments: true });

      expect(result.processedContent).not.toContain('<!-- This is a comment -->');
      expect(result.processedContent).toContain('# Title');
      expect(result.processedContent).toContain('Some content');
    });
  });

  describe('Language detection', () => {
    test('should detect JavaScript', () => {
      const code = `
function hello() {
  console.log('Hello World');
  const name = 'John';
  return name;
}
      `;

      const result = service.detectLanguage(code);

      expect(result.language).toBe('javascript');
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.possibleLanguages).toContainEqual(
        expect.objectContaining({ language: 'javascript' })
      );
    });

    test('should detect TypeScript', () => {
      const code = `
interface User {
  name: string;
  age: number;
}

function greet(user: User): string {
  return \`Hello, \${user.name}\`;
}
      `;

      const result = service.detectLanguage(code);

      expect(result.language).toBe('typescript');
      expect(result.confidence).toBeGreaterThan(0);
    });

    test('should detect Python', () => {
      const code = `
def hello():
    print("Hello World")
    
class User:
    def __init__(self, name):
        self.name = name
      `;

      const result = service.detectLanguage(code);

      expect(result.language).toBe('python');
      expect(result.confidence).toBeGreaterThan(0);
    });

    test('should detect HTML', () => {
      const code = `
<!DOCTYPE html>
<html>
<head>
  <title>Test</title>
</head>
<body>
  <div>Hello World</div>
</body>
</html>
      `;

      const result = service.detectLanguage(code);

      expect(result.language).toBe('html');
      expect(result.confidence).toBeGreaterThan(0);
    });

    test('should detect JSON', () => {
      const code = `
{
  "name": "John",
  "age": 30,
  "active": true,
  "items": [1, 2, 3]
}
      `;

      const result = service.detectLanguage(code);

      expect(result.language).toBe('json');
      expect(result.confidence).toBeGreaterThan(0);
    });

    test('should return unknown for unrecognized code', () => {
      const code = 'random text that is not code';

      const result = service.detectLanguage(code);

      expect(result.language).toBe('unknown');
      expect(result.confidence).toBe(0);
    });
  });

  describe('Strip indents', () => {
    test('should strip common indentation', () => {
      const text = `
        function hello() {
          console.log('Hello');
          return true;
        }
      `;

      const result = service.stripIndents(text);

      expect(result).toBe('function hello() {\n  console.log(\'Hello\');\n  return true;\n}');
    });

    test('should handle empty lines', () => {
      const text = `
        line 1
        
        line 3
      `;

      const result = service.stripIndents(text);

      expect(result).toBe('line 1\n\nline 3');
    });

    test('should handle text with no indentation', () => {
      const text = 'no indentation';

      const result = service.stripIndents(text);

      expect(result).toBe('no indentation');
    });

    test('should handle empty string', () => {
      const result = service.stripIndents('');

      expect(result).toBe('');
    });
  });

  describe('Code formatting', () => {
    test('should format JavaScript code', () => {
      const code = 'function test(){if(true){console.log("hello");}}';

      const result = service.formatCode(code, 'javascript', 2);

      expect(result).toContain('function test() {');
      expect(result).toContain('  if(true) {');
      expect(result).toContain('    console.log("hello");');
      expect(result).toContain('  }');
      expect(result).toContain('}');
    });

    test('should handle different indent sizes', () => {
      const code = 'function test(){return true;}';

      const result = service.formatCode(code, 'javascript', 4);

      expect(result).toContain('function test() {');
      expect(result).toContain('    return true;');
      expect(result).toContain('}');
    });
  });

  describe('Extract imports', () => {
    test('should extract ES6 imports', () => {
      const code = `
import React from 'react';
import { useState, useEffect } from 'react';
import * as utils from './utils';
      `;

      const result = service.extractImports(code, 'javascript');

      expect(result).toHaveLength(3);
      expect(result[0].module).toBe('react');
      expect(result[0].imports).toEqual(['React']);
      expect(result[1].module).toBe('react');
      expect(result[1].imports).toEqual(['useState', 'useEffect']);
      expect(result[2].module).toBe('./utils');
      expect(result[2].imports).toEqual(['utils']);
    });

    test('should extract CommonJS requires', () => {
      const code = `
const fs = require('fs');
const { readFile, writeFile } = require('fs/promises');
      `;

      const result = service.extractImports(code, 'javascript');

      expect(result).toHaveLength(2);
      expect(result[0].module).toBe('fs');
      expect(result[0].imports).toEqual(['fs']);
      expect(result[1].module).toBe('fs/promises');
      expect(result[1].imports).toEqual(['readFile', 'writeFile']);
    });

    test('should extract Python imports', () => {
      const code = `
import os
from datetime import datetime, timedelta
import numpy as np
      `;

      const result = service.extractImports(code, 'python');

      expect(result).toHaveLength(3);
      expect(result[0].module).toBe('os');
      expect(result[1].module).toBe('datetime');
      expect(result[1].imports).toEqual(['datetime', 'timedelta']);
      expect(result[2].module).toBe('numpy as np');
    });
  });

  describe('Utility functions', () => {
    test('should generate random ID', () => {
      const id1 = service.generateId(8);
      const id2 = service.generateId(8);

      expect(id1).toHaveLength(8);
      expect(id2).toHaveLength(8);
      expect(id1).not.toBe(id2);
    });

    test('should generate ID with prefix', () => {
      const id = service.generateId(8, 'user_');

      expect(id).toHaveLength(13); // 5 (prefix) + 8 (random)
      expect(id.startsWith('user_')).toBe(true);
    });

    test('should deep clone objects', () => {
      const original = {
        name: 'John',
        nested: {
          value: 42,
          array: [1, 2, 3],
        },
        date: new Date('2023-01-01'),
      };

      const cloned = service.deepClone(original);

      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
      expect(cloned.nested).not.toBe(original.nested);
      expect(cloned.nested.array).not.toBe(original.nested.array);
      expect(cloned.date).not.toBe(original.date);
    });

    test('should handle primitive values in deep clone', () => {
      expect(service.deepClone('string')).toBe('string');
      expect(service.deepClone(42)).toBe(42);
      expect(service.deepClone(true)).toBe(true);
      expect(service.deepClone(null)).toBe(null);
    });
  });

  describe('convenience functions', () => {
    test('jsonToZod should work', () => {
      const obj = { name: 'test', age: 25 };
      const result = jsonToZod(obj);

      expect(result).toContain('z.object({');
      expect(result).toContain('name: z.string()');
      expect(result).toContain('age: z.number().int()');
    });

    test('processMarkdown should work', () => {
      const markdown = '# Title\nSome content';
      const result = processMarkdown(markdown);

      expect(result.headers).toHaveLength(1);
      expect(result.headers[0].text).toBe('Title');
    });

    test('detectLanguage should work', () => {
      const code = 'function test() { return true; }';
      const result = detectLanguage(code);

      expect(result.language).toBe('javascript');
      expect(result.confidence).toBeGreaterThan(0);
    });

    test('stripIndents should work', () => {
      const text = '  line 1\n  line 2';
      const result = stripIndents(text);

      expect(result).toBe('line 1\nline 2');
    });
  });
});
