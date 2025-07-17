/**
 * Utility Functions Service
 * 
 * Provides various utility functions for the Builder Agent
 * Including JSON to Zod conversion, Markdown processing, language detection, and text formatting
 */

import { z } from 'zod';

export interface JsonToZodOptions {
  includeOptional?: boolean;
  includeDescriptions?: boolean;
  strictMode?: boolean;
  arrayMinLength?: number;
  stringMinLength?: number;
}

export interface MarkdownProcessingOptions {
  removeComments?: boolean;
  extractCodeBlocks?: boolean;
  extractHeaders?: boolean;
  extractLinks?: boolean;
  convertToHtml?: boolean;
  sanitize?: boolean;
}

export interface LanguageDetectionResult {
  language: string;
  confidence: number;
  possibleLanguages: Array<{ language: string; confidence: number }>;
}

export interface MarkdownProcessingResult {
  processedContent: string;
  codeBlocks: Array<{ language: string; code: string; line: number }>;
  headers: Array<{ level: number; text: string; line: number }>;
  links: Array<{ text: string; url: string; line: number }>;
  htmlContent?: string;
}

/**
 * Utility Functions Service Class
 * Handles various utility operations for the Builder Agent
 */
export class UtilityFunctionsService {
  constructor() {}

  /**
   * Convert JSON object to Zod schema
   */
  jsonToZod(jsonObject: any, options: JsonToZodOptions = {}): string {
    const {
      includeOptional = true,
      includeDescriptions = false,
      strictMode = false,
      arrayMinLength = 0,
      stringMinLength = 0,
    } = options;

    const generateZodSchema = (obj: any, key?: string, level = 0): string => {
      const indent = '  '.repeat(level);
      
      if (obj === null) {
        return 'z.null()';
      }
      
      if (typeof obj === 'string') {
        let schema = 'z.string()';
        if (stringMinLength > 0) {
          schema += `.min(${stringMinLength})`;
        }
        if (includeDescriptions && key) {
          schema += `.describe('${key} field')`;
        }
        return schema;
      }
      
      if (typeof obj === 'number') {
        const schema = Number.isInteger(obj) ? 'z.number().int()' : 'z.number()';
        return includeDescriptions && key ? `${schema}.describe('${key} field')` : schema;
      }
      
      if (typeof obj === 'boolean') {
        const schema = 'z.boolean()';
        return includeDescriptions && key ? `${schema}.describe('${key} field')` : schema;
      }
      
      if (Array.isArray(obj)) {
        if (obj.length === 0) {
          let schema = 'z.array(z.unknown())';
          if (arrayMinLength > 0) {
            schema += `.min(${arrayMinLength})`;
          }
          return schema;
        }
        
        const itemSchema = generateZodSchema(obj[0], undefined, level);
        let schema = `z.array(${itemSchema})`;
        if (arrayMinLength > 0) {
          schema += `.min(${arrayMinLength})`;
        }
        return schema;
      }
      
      if (typeof obj === 'object' && obj !== null) {
        const properties: string[] = [];
        
        for (const [propKey, propValue] of Object.entries(obj)) {
          const propSchema = generateZodSchema(propValue, propKey, level + 1);
          const optional = includeOptional && !strictMode ? '.optional()' : '';
          properties.push(`${indent}  ${propKey}: ${propSchema}${optional},`);
        }
        
        return `z.object({\n${properties.join('\n')}\n${indent}})`;
      }
      
      return 'z.unknown()';
    };

    const schema = generateZodSchema(jsonObject);
    
    return `import { z } from 'zod';

export const schema = ${schema};

export type SchemaType = z.infer<typeof schema>;`;
  }

  /**
   * Process Markdown content
   */
  processMarkdown(content: string, options: MarkdownProcessingOptions = {}): MarkdownProcessingResult {
    const {
      removeComments = false,
      extractCodeBlocks = true,
      extractHeaders = true,
      extractLinks = true,
      convertToHtml = false,
      sanitize = false,
    } = options;

    let processedContent = content;
    const codeBlocks: Array<{ language: string; code: string; line: number }> = [];
    const headers: Array<{ level: number; text: string; line: number }> = [];
    const links: Array<{ text: string; url: string; line: number }> = [];

    const lines = content.split('\n');

    // Remove comments if requested
    if (removeComments) {
      processedContent = processedContent.replace(/<!--[\s\S]*?-->/g, '');
    }

    // Extract code blocks
    if (extractCodeBlocks) {
      let inCodeBlock = false;
      let currentCodeBlock: { language: string; code: string; startLine: number } | null = null;

      lines.forEach((line, index) => {
        const codeBlockMatch = line.match(/^```(\w+)?/);
        if (codeBlockMatch && !inCodeBlock) {
          inCodeBlock = true;
          currentCodeBlock = {
            language: codeBlockMatch[1] || 'text',
            code: '',
            startLine: index + 1,
          };
        } else if (line.match(/^```$/) && inCodeBlock && currentCodeBlock) {
          inCodeBlock = false;
          codeBlocks.push({
            language: currentCodeBlock.language,
            code: currentCodeBlock.code.trim(),
            line: currentCodeBlock.startLine,
          });
          currentCodeBlock = null;
        } else if (inCodeBlock && currentCodeBlock) {
          currentCodeBlock.code += line + '\n';
        }
      });
    }

    // Extract headers
    if (extractHeaders) {
      lines.forEach((line, index) => {
        const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);
        if (headerMatch) {
          headers.push({
            level: headerMatch[1].length,
            text: headerMatch[2].trim(),
            line: index + 1,
          });
        }
      });
    }

    // Extract links
    if (extractLinks) {
      lines.forEach((line, index) => {
        const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
        let match;
        while ((match = linkRegex.exec(line)) !== null) {
          links.push({
            text: match[1],
            url: match[2],
            line: index + 1,
          });
        }
      });
    }

    // Convert to HTML if requested
    let htmlContent: string | undefined;
    if (convertToHtml) {
      htmlContent = this.markdownToHtml(processedContent);
    }

    // Sanitize if requested
    if (sanitize) {
      processedContent = this.sanitizeMarkdown(processedContent);
    }

    return {
      processedContent,
      codeBlocks,
      headers,
      links,
      htmlContent,
    };
  }

  /**
   * Simple Markdown to HTML conversion
   */
  private markdownToHtml(markdown: string): string {
    let html = markdown;

    // Headers
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

    // Bold
    html = html.replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>');
    html = html.replace(/__(.*?)__/gim, '<strong>$1</strong>');

    // Italic
    html = html.replace(/\*(.*)\*/gim, '<em>$1</em>');
    html = html.replace(/_(.*?)_/gim, '<em>$1</em>');

    // Code
    html = html.replace(/`(.*?)`/gim, '<code>$1</code>');

    // Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2">$1</a>');

    // Line breaks
    html = html.replace(/\n/gim, '<br>');

    return html;
  }

  /**
   * Sanitize Markdown content
   */
  private sanitizeMarkdown(markdown: string): string {
    // Remove potentially dangerous HTML tags
    let sanitized = markdown.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    sanitized = sanitized.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');
    sanitized = sanitized.replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '');
    sanitized = sanitized.replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '');
    
    // Remove javascript: links
    sanitized = sanitized.replace(/javascript:/gi, '');
    
    return sanitized;
  }

  /**
   * Detect programming language from code content
   */
  detectLanguage(code: string): LanguageDetectionResult {
    const languagePatterns = [
      {
        language: 'javascript',
        patterns: [
          /\bfunction\s+\w+\s*\(/,
          /\bconst\s+\w+\s*=/,
          /\blet\s+\w+\s*=/,
          /\bvar\s+\w+\s*=/,
          /\bconsole\.log\(/,
          /\brequire\s*\(/,
          /\bimport\s+.*\bfrom\b/,
          /\bexport\s+(default\s+)?/,
        ],
      },
      {
        language: 'typescript',
        patterns: [
          /:\s*(string|number|boolean|any|void)\b/,
          /\binterface\s+\w+/,
          /\btype\s+\w+\s*=/,
          /\benum\s+\w+/,
          /\bpublic\s+\w+/,
          /\bprivate\s+\w+/,
          /\bprotected\s+\w+/,
          /<.*>/,
        ],
      },
      {
        language: 'python',
        patterns: [
          /\bdef\s+\w+\s*\(/,
          /\bclass\s+\w+/,
          /\bimport\s+\w+/,
          /\bfrom\s+\w+\s+import/,
          /\bprint\s*\(/,
          /\bif\s+__name__\s*==\s*['"']__main__['"']/,
          /\bself\./,
        ],
      },
      {
        language: 'java',
        patterns: [
          /\bpublic\s+class\s+\w+/,
          /\bpublic\s+static\s+void\s+main/,
          /\bSystem\.out\.println/,
          /\bpublic\s+\w+\s+\w+\s*\(/,
          /\bprivate\s+\w+\s+\w+/,
          /\bimport\s+java\./,
        ],
      },
      {
        language: 'cpp',
        patterns: [
          /#include\s*<.*>/,
          /\bstd::/,
          /\bcout\s*<<|cin\s*>>/,
          /\bint\s+main\s*\(/,
          /\busing\s+namespace\s+std/,
          /\bclass\s+\w+\s*{/,
        ],
      },
      {
        language: 'c',
        patterns: [
          /#include\s*<.*\.h>/,
          /\bprintf\s*\(/,
          /\bscanf\s*\(/,
          /\bmain\s*\(/,
          /\bmalloc\s*\(/,
          /\bfree\s*\(/,
        ],
      },
      {
        language: 'html',
        patterns: [
          /<html\b/i,
          /<head\b/i,
          /<body\b/i,
          /<div\b/i,
          /<p\b/i,
          /<script\b/i,
          /<style\b/i,
        ],
      },
      {
        language: 'css',
        patterns: [
          /\w+\s*{\s*[\w-]+\s*:/,
          /@media\s+/,
          /@import\s+/,
          /\.\w+\s*{/,
          /#\w+\s*{/,
          /:\s*(hover|focus|active)\s*{/,
        ],
      },
      {
        language: 'sql',
        patterns: [
          /\bSELECT\s+.*\bFROM\b/i,
          /\bINSERT\s+INTO\b/i,
          /\bUPDATE\s+.*\bSET\b/i,
          /\bDELETE\s+FROM\b/i,
          /\bCREATE\s+TABLE\b/i,
          /\bALTER\s+TABLE\b/i,
        ],
      },
      {
        language: 'json',
        patterns: [
          /^\s*{[\s\S]*}\s*$/,
          /^\s*\[[\s\S]*\]\s*$/,
          /"[\w-]+"\s*:\s*"[^"]*"/,
          /"[\w-]+"\s*:\s*\d+/,
          /"[\w-]+"\s*:\s*(true|false|null)/,
        ],
      },
    ];

    const results: Array<{ language: string; confidence: number }> = [];

    for (const { language, patterns } of languagePatterns) {
      let matches = 0;
      for (const pattern of patterns) {
        if (pattern.test(code)) {
          matches++;
        }
      }
      
      const confidence = matches / patterns.length;
      if (confidence > 0) {
        results.push({ language, confidence });
      }
    }

    // Sort by confidence
    results.sort((a, b) => b.confidence - a.confidence);

    const topResult = results[0];
    
    return {
      language: topResult?.language || 'unknown',
      confidence: topResult?.confidence || 0,
      possibleLanguages: results.slice(0, 3), // Top 3 possibilities
    };
  }

  /**
   * Strip indentation from template literals (similar to stripIndents)
   */
  stripIndents(str: string): string {
    // Remove leading and trailing empty lines
    const lines = str.split('\n');
    
    // Find first and last non-empty lines
    let firstLine = 0;
    let lastLine = lines.length - 1;
    
    while (firstLine < lines.length && lines[firstLine].trim() === '') {
      firstLine++;
    }
    
    while (lastLine >= 0 && lines[lastLine].trim() === '') {
      lastLine--;
    }
    
    if (firstLine > lastLine) {
      return '';
    }
    
    const relevantLines = lines.slice(firstLine, lastLine + 1);
    
    // Find minimum indentation
    let minIndent = Infinity;
    for (const line of relevantLines) {
      if (line.trim() !== '') {
        const indent = line.match(/^(\s*)/)?.[1]?.length || 0;
        minIndent = Math.min(minIndent, indent);
      }
    }
    
    if (minIndent === Infinity) {
      minIndent = 0;
    }
    
    // Remove common indentation
    const processedLines = relevantLines.map(line => {
      if (line.trim() === '') {
        return '';
      }
      return line.slice(minIndent);
    });
    
    return processedLines.join('\n');
  }

  /**
   * Format code with basic indentation
   */
  formatCode(code: string, language: string = 'javascript', indentSize: number = 2): string {
    // First, add proper spacing and line breaks
    let formattedCode = code
      .replace(/\{/g, ' {\n')
      .replace(/\}/g, '\n}')
      .replace(/;/g, ';\n')
      .replace(/\s+\{\s*\n/g, ' {\n')
      .replace(/\n\s*\n\s*\}/g, '\n}')
      .replace(/;\s*\n\s*\n/g, ';\n');

    const lines = formattedCode.split('\n');
    const formattedLines: string[] = [];
    let currentIndent = 0;
    const indent = ' '.repeat(indentSize);

    for (const line of lines) {
      const trimmedLine = line.trim();

      if (trimmedLine === '') {
        continue; // Skip empty lines for cleaner output
      }

      // Decrease indent for closing brackets
      if (trimmedLine.match(/^[}\])]/) && currentIndent > 0) {
        currentIndent--;
      }

      // Add current line with proper indentation
      formattedLines.push(indent.repeat(currentIndent) + trimmedLine);

      // Increase indent for opening brackets
      if (trimmedLine.match(/[{\[(]\s*$/)) {
        currentIndent++;
      }
    }

    return formattedLines.join('\n');
  }

  /**
   * Extract imports from code
   */
  extractImports(code: string, language: string = 'javascript'): Array<{ module: string; imports: string[]; line: number }> {
    const imports: Array<{ module: string; imports: string[]; line: number }> = [];
    const lines = code.split('\n');

    lines.forEach((line, index) => {
      let match;

      if (language === 'javascript' || language === 'typescript') {
        // ES6 imports
        match = line.match(/import\s+(?:{([^}]+)}|\*\s+as\s+(\w+)|(\w+))\s+from\s+['"]([^'"]+)['"]/);
        if (match) {
          const module = match[4];
          let importList: string[] = [];
          
          if (match[1]) {
            // Named imports
            importList = match[1].split(',').map(imp => imp.trim());
          } else if (match[2]) {
            // Namespace import
            importList = [match[2]];
          } else if (match[3]) {
            // Default import
            importList = [match[3]];
          }
          
          imports.push({
            module,
            imports: importList,
            line: index + 1,
          });
        }

        // CommonJS require
        match = line.match(/(?:const|let|var)\s+(?:{([^}]+)}|(\w+))\s*=\s*require\s*\(\s*['"]([^'"]+)['"]\s*\)/);
        if (match) {
          const module = match[3];
          let importList: string[] = [];
          
          if (match[1]) {
            // Destructured require
            importList = match[1].split(',').map(imp => imp.trim());
          } else if (match[2]) {
            // Direct require
            importList = [match[2]];
          }
          
          imports.push({
            module,
            imports: importList,
            line: index + 1,
          });
        }
      } else if (language === 'python') {
        // Python imports
        match = line.match(/^(?:from\s+(\S+)\s+)?import\s+(.+)$/);
        if (match) {
          const module = match[1] || match[2].split(',')[0].trim();
          const importList = match[2].split(',').map(imp => imp.trim());
          
          imports.push({
            module,
            imports: importList,
            line: index + 1,
          });
        }
      }
    });

    return imports;
  }

  /**
   * Generate random ID
   */
  generateId(length: number = 8, prefix: string = ''): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = prefix;
    
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return result;
  }

  /**
   * Deep clone object
   */
  deepClone<T>(obj: T): T {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    if (obj instanceof Date) {
      return new Date(obj.getTime()) as unknown as T;
    }

    if (obj instanceof Array) {
      return obj.map(item => this.deepClone(item)) as unknown as T;
    }

    if (typeof obj === 'object') {
      const cloned = {} as T;
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          cloned[key] = this.deepClone(obj[key]);
        }
      }
      return cloned;
    }

    return obj;
  }

  /**
   * Debounce function
   */
  debounce<T extends (...args: any[]) => any>(func: T, wait: number): T {
    let timeout: NodeJS.Timeout;
    
    return ((...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    }) as T;
  }

  /**
   * Throttle function
   */
  throttle<T extends (...args: any[]) => any>(func: T, limit: number): T {
    let inThrottle: boolean;
    
    return ((...args: Parameters<T>) => {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    }) as T;
  }
}

// Global utility functions service instance
export const utilityFunctionsService = new UtilityFunctionsService();

/**
 * Convenience function for JSON to Zod conversion
 */
export function jsonToZod(jsonObject: any, options?: JsonToZodOptions): string {
  return utilityFunctionsService.jsonToZod(jsonObject, options);
}

/**
 * Convenience function for Markdown processing
 */
export function processMarkdown(content: string, options?: MarkdownProcessingOptions): MarkdownProcessingResult {
  return utilityFunctionsService.processMarkdown(content, options);
}

/**
 * Convenience function for language detection
 */
export function detectLanguage(code: string): LanguageDetectionResult {
  return utilityFunctionsService.detectLanguage(code);
}

/**
 * Convenience function for stripping indents
 */
export function stripIndents(str: string): string {
  return utilityFunctionsService.stripIndents(str);
}
