/**
 * Utility Functions Tools
 * 
 * Provides utility function tools for the Builder Agent
 * Integrates with the UtilityFunctionsService for comprehensive utility operations
 */

import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { UtilityFunctionsService, jsonToZod, processMarkdown, detectLanguage, stripIndents } from '../services/utility-functions-service';

/**
 * Tool for converting JSON to Zod schema
 */
export const jsonToZodTool = createTool({
  id: 'json-to-zod',
  description: 'Convert JSON object to Zod schema definition',
  inputSchema: z.object({
    jsonObject: z.any().describe('JSON object to convert to Zod schema'),
    includeOptional: z.boolean().default(true).describe('Make fields optional'),
    includeDescriptions: z.boolean().default(false).describe('Include field descriptions'),
    strictMode: z.boolean().default(false).describe('Use strict mode (no optional fields)'),
    arrayMinLength: z.number().default(0).describe('Minimum array length'),
    stringMinLength: z.number().default(0).describe('Minimum string length'),
  }),
  outputSchema: z.object({
    zodSchema: z.string().describe('Generated Zod schema code'),
    success: z.boolean().describe('Whether conversion was successful'),
    error: z.string().optional().describe('Error message if conversion failed'),
  }),
  execute: async ({ context }) => {
    try {
      const {
        jsonObject,
        includeOptional,
        includeDescriptions,
        strictMode,
        arrayMinLength,
        stringMinLength,
      } = context;

      const options = {
        includeOptional,
        includeDescriptions,
        strictMode,
        arrayMinLength,
        stringMinLength,
      };

      const service = new UtilityFunctionsService();
      const zodSchema = service.jsonToZod(jsonObject, options);

      return {
        zodSchema,
        success: true,
      };
    } catch (error) {
      return {
        zodSchema: '',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  },
});

/**
 * Tool for processing Markdown content
 */
export const processMarkdownTool = createTool({
  id: 'process-markdown',
  description: 'Process Markdown content and extract various elements',
  inputSchema: z.object({
    content: z.string().describe('Markdown content to process'),
    removeComments: z.boolean().default(false).describe('Remove HTML comments'),
    extractCodeBlocks: z.boolean().default(true).describe('Extract code blocks'),
    extractHeaders: z.boolean().default(true).describe('Extract headers'),
    extractLinks: z.boolean().default(true).describe('Extract links'),
    convertToHtml: z.boolean().default(false).describe('Convert to HTML'),
    sanitize: z.boolean().default(false).describe('Sanitize content'),
  }),
  outputSchema: z.object({
    processedContent: z.string().describe('Processed Markdown content'),
    codeBlocks: z.array(z.object({
      language: z.string(),
      code: z.string(),
      line: z.number(),
    })).describe('Extracted code blocks'),
    headers: z.array(z.object({
      level: z.number(),
      text: z.string(),
      line: z.number(),
    })).describe('Extracted headers'),
    links: z.array(z.object({
      text: z.string(),
      url: z.string(),
      line: z.number(),
    })).describe('Extracted links'),
    htmlContent: z.string().optional().describe('HTML content if conversion requested'),
  }),
  execute: async ({ context }) => {
    const {
      content,
      removeComments,
      extractCodeBlocks,
      extractHeaders,
      extractLinks,
      convertToHtml,
      sanitize,
    } = context;

    const options = {
      removeComments,
      extractCodeBlocks,
      extractHeaders,
      extractLinks,
      convertToHtml,
      sanitize,
    };

    const service = new UtilityFunctionsService();
    const result = service.processMarkdown(content, options);

    return {
      processedContent: result.processedContent,
      codeBlocks: result.codeBlocks,
      headers: result.headers,
      links: result.links,
      htmlContent: result.htmlContent,
    };
  },
});

/**
 * Tool for detecting programming language
 */
export const detectLanguageTool = createTool({
  id: 'detect-language',
  description: 'Detect programming language from code content',
  inputSchema: z.object({
    code: z.string().describe('Code content to analyze'),
  }),
  outputSchema: z.object({
    language: z.string().describe('Detected programming language'),
    confidence: z.number().describe('Confidence score (0-1)'),
    possibleLanguages: z.array(z.object({
      language: z.string(),
      confidence: z.number(),
    })).describe('Other possible languages with confidence scores'),
  }),
  execute: async ({ context }) => {
    const { code } = context;

    const service = new UtilityFunctionsService();
    const result = service.detectLanguage(code);

    return {
      language: result.language,
      confidence: result.confidence,
      possibleLanguages: result.possibleLanguages,
    };
  },
});

/**
 * Tool for stripping indentation from text
 */
export const stripIndentsTool = createTool({
  id: 'strip-indents',
  description: 'Strip common indentation from text (similar to template literal stripIndents)',
  inputSchema: z.object({
    text: z.string().describe('Text content to strip indentation from'),
  }),
  outputSchema: z.object({
    strippedText: z.string().describe('Text with common indentation removed'),
    originalLines: z.number().describe('Number of lines in original text'),
    processedLines: z.number().describe('Number of lines in processed text'),
  }),
  execute: async ({ context }) => {
    const { text } = context;

    const service = new UtilityFunctionsService();
    const strippedText = service.stripIndents(text);

    return {
      strippedText,
      originalLines: text.split('\n').length,
      processedLines: strippedText.split('\n').length,
    };
  },
});

/**
 * Tool for formatting code
 */
export const formatCodeTool = createTool({
  id: 'format-code',
  description: 'Format code with proper indentation',
  inputSchema: z.object({
    code: z.string().describe('Code to format'),
    language: z.string().default('javascript').describe('Programming language'),
    indentSize: z.number().default(2).describe('Number of spaces for indentation'),
  }),
  outputSchema: z.object({
    formattedCode: z.string().describe('Formatted code'),
    originalLines: z.number().describe('Number of lines in original code'),
    formattedLines: z.number().describe('Number of lines in formatted code'),
  }),
  execute: async ({ context }) => {
    const { code, language, indentSize } = context;

    const service = new UtilityFunctionsService();
    const formattedCode = service.formatCode(code, language, indentSize);

    return {
      formattedCode,
      originalLines: code.split('\n').length,
      formattedLines: formattedCode.split('\n').length,
    };
  },
});

/**
 * Tool for extracting imports from code
 */
export const extractImportsTool = createTool({
  id: 'extract-imports',
  description: 'Extract import statements from code',
  inputSchema: z.object({
    code: z.string().describe('Code to extract imports from'),
    language: z.string().default('javascript').describe('Programming language'),
  }),
  outputSchema: z.object({
    imports: z.array(z.object({
      module: z.string(),
      imports: z.array(z.string()),
      line: z.number(),
    })).describe('Extracted import statements'),
    totalImports: z.number().describe('Total number of import statements'),
    uniqueModules: z.number().describe('Number of unique modules imported'),
  }),
  execute: async ({ context }) => {
    const { code, language } = context;

    const service = new UtilityFunctionsService();
    const imports = service.extractImports(code, language);

    const uniqueModules = new Set(imports.map(imp => imp.module)).size;

    return {
      imports,
      totalImports: imports.length,
      uniqueModules,
    };
  },
});

/**
 * Tool for generating random IDs
 */
export const generateIdTool = createTool({
  id: 'generate-id',
  description: 'Generate random ID with optional prefix',
  inputSchema: z.object({
    length: z.number().default(8).describe('Length of the random part'),
    prefix: z.string().default('').describe('Optional prefix for the ID'),
    count: z.number().default(1).describe('Number of IDs to generate'),
  }),
  outputSchema: z.object({
    ids: z.array(z.string()).describe('Generated IDs'),
    count: z.number().describe('Number of IDs generated'),
  }),
  execute: async ({ context }) => {
    const { length, prefix, count } = context;

    const service = new UtilityFunctionsService();
    const ids: string[] = [];

    for (let i = 0; i < count; i++) {
      ids.push(service.generateId(length, prefix));
    }

    return {
      ids,
      count: ids.length,
    };
  },
});

/**
 * Tool for deep cloning objects
 */
export const deepCloneTool = createTool({
  id: 'deep-clone',
  description: 'Create a deep clone of an object',
  inputSchema: z.object({
    object: z.any().describe('Object to clone'),
  }),
  outputSchema: z.object({
    clonedObject: z.any().describe('Deep cloned object'),
    success: z.boolean().describe('Whether cloning was successful'),
    error: z.string().optional().describe('Error message if cloning failed'),
  }),
  execute: async ({ context }) => {
    try {
      const { object } = context;

      const service = new UtilityFunctionsService();
      const clonedObject = service.deepClone(object);

      return {
        clonedObject,
        success: true,
      };
    } catch (error) {
      return {
        clonedObject: null,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  },
});

/**
 * Tool for analyzing code complexity
 */
export const analyzeCodeComplexityTool = createTool({
  id: 'analyze-code-complexity',
  description: 'Analyze code complexity and provide metrics',
  inputSchema: z.object({
    code: z.string().describe('Code to analyze'),
    language: z.string().default('javascript').describe('Programming language'),
  }),
  outputSchema: z.object({
    lines: z.number().describe('Total lines of code'),
    nonEmptyLines: z.number().describe('Non-empty lines'),
    functions: z.number().describe('Number of functions'),
    classes: z.number().describe('Number of classes'),
    complexity: z.enum(['low', 'medium', 'high']).describe('Overall complexity level'),
    suggestions: z.array(z.string()).describe('Improvement suggestions'),
  }),
  execute: async ({ context }) => {
    const { code, language } = context;

    const lines = code.split('\n');
    const totalLines = lines.length;
    const nonEmptyLines = lines.filter(line => line.trim() !== '').length;

    let functions = 0;
    let classes = 0;
    const suggestions: string[] = [];

    // Count functions and classes based on language
    if (language === 'javascript' || language === 'typescript') {
      functions = (code.match(/\bfunction\s+\w+|=>\s*{|:\s*\([^)]*\)\s*=>/g) || []).length;
      classes = (code.match(/\bclass\s+\w+/g) || []).length;
    } else if (language === 'python') {
      functions = (code.match(/\bdef\s+\w+/g) || []).length;
      classes = (code.match(/\bclass\s+\w+/g) || []).length;
    } else if (language === 'java') {
      functions = (code.match(/\bpublic\s+\w+\s+\w+\s*\(|private\s+\w+\s+\w+\s*\(/g) || []).length;
      classes = (code.match(/\bclass\s+\w+/g) || []).length;
    }

    // Determine complexity
    let complexity: 'low' | 'medium' | 'high' = 'low';
    if (totalLines > 500 || functions > 20 || classes > 10) {
      complexity = 'high';
    } else if (totalLines > 200 || functions > 10 || classes > 5) {
      complexity = 'medium';
    }

    // Generate suggestions
    if (totalLines > 300) {
      suggestions.push('Consider breaking this file into smaller modules');
    }
    if (functions > 15) {
      suggestions.push('Consider organizing functions into classes or modules');
    }
    if (classes > 8) {
      suggestions.push('Consider splitting classes into separate files');
    }
    if (nonEmptyLines / totalLines < 0.7) {
      suggestions.push('Consider removing excessive empty lines');
    }

    return {
      lines: totalLines,
      nonEmptyLines,
      functions,
      classes,
      complexity,
      suggestions,
    };
  },
});

/**
 * Tool for validating JSON schema
 */
export const validateJsonSchemaTool = createTool({
  id: 'validate-json-schema',
  description: 'Validate JSON data against a schema',
  inputSchema: z.object({
    data: z.any().describe('JSON data to validate'),
    schema: z.any().describe('JSON schema to validate against'),
  }),
  outputSchema: z.object({
    valid: z.boolean().describe('Whether the data is valid'),
    errors: z.array(z.string()).describe('Validation errors if any'),
    warnings: z.array(z.string()).describe('Validation warnings if any'),
  }),
  execute: async ({ context }) => {
    const { data, schema } = context;
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Basic validation logic
      const validateObject = (obj: any, schemaObj: any, path: string = ''): void => {
        if (schemaObj.type) {
          const expectedType = schemaObj.type;
          const actualType = Array.isArray(obj) ? 'array' : typeof obj;
          
          if (actualType !== expectedType) {
            errors.push(`${path}: Expected ${expectedType}, got ${actualType}`);
          }
        }

        if (schemaObj.properties && typeof obj === 'object' && !Array.isArray(obj)) {
          for (const [key, propSchema] of Object.entries(schemaObj.properties)) {
            const propPath = path ? `${path}.${key}` : key;
            
            if (obj[key] !== undefined) {
              validateObject(obj[key], propSchema, propPath);
            } else if (schemaObj.required && schemaObj.required.includes(key)) {
              errors.push(`${propPath}: Required property is missing`);
            }
          }
        }

        if (schemaObj.items && Array.isArray(obj)) {
          obj.forEach((item, index) => {
            validateObject(item, schemaObj.items, `${path}[${index}]`);
          });
        }
      };

      validateObject(data, schema);

      return {
        valid: errors.length === 0,
        errors,
        warnings,
      };
    } catch (error) {
      return {
        valid: false,
        errors: [error instanceof Error ? error.message : 'Validation failed'],
        warnings,
      };
    }
  },
});
