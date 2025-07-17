/**
 * Enhanced File Processing Service
 * 
 * Handles file upload, parsing, analysis, and diff generation
 * Compatible with we-dev-next file processing logic
 */

import { z } from 'zod';

// File processing schemas
export const FileSchema = z.object({
  name: z.string(),
  content: z.string(),
  type: z.string().optional(),
  size: z.number().optional(),
  lastModified: z.number().optional(),
});

export const MessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string(),
  files: z.array(FileSchema).optional(),
});

export interface ProcessedFile {
  name: string;
  content: string;
  type: string;
  size: number;
  language?: string;
  isCode?: boolean;
  structure?: FileStructure;
}

export interface FileStructure {
  functions: string[];
  classes: string[];
  imports: string[];
  exports: string[];
  comments: string[];
}

export interface FileProcessingResult {
  files: Record<string, string>;
  allContent: string;
  filesPath: string[];
  diffString: string;
  hasFiles: boolean;
  metadata: {
    totalFiles: number;
    totalSize: number;
    languages: string[];
    codeFiles: number;
    textFiles: number;
  };
}

/**
 * Enhanced File Processor Class
 */
export class FileProcessor {
  private readonly maxFileSize = 10 * 1024 * 1024; // 10MB
  private readonly maxTotalSize = 50 * 1024 * 1024; // 50MB
  private readonly supportedExtensions = new Set([
    '.js', '.ts', '.jsx', '.tsx', '.vue', '.svelte',
    '.py', '.java', '.cpp', '.c', '.cs', '.go', '.rs',
    '.html', '.css', '.scss', '.sass', '.less',
    '.json', '.xml', '.yaml', '.yml', '.toml',
    '.md', '.txt', '.csv', '.sql',
    '.php', '.rb', '.swift', '.kt', '.dart',
    '.sh', '.bash', '.zsh', '.fish',
  ]);

  /**
   * Process messages and extract files
   */
  async processMessages(messages: any[]): Promise<FileProcessingResult> {
    const processedFiles: ProcessedFile[] = [];
    let totalSize = 0;

    // Extract files from messages
    for (const message of messages) {
      if (message.files && Array.isArray(message.files)) {
        for (const file of message.files) {
          try {
            const processed = await this.processFile(file);
            
            // Check file size limits
            if (processed.size > this.maxFileSize) {
              console.warn(`File ${processed.name} exceeds size limit (${processed.size} bytes)`);
              continue;
            }

            totalSize += processed.size;
            if (totalSize > this.maxTotalSize) {
              console.warn(`Total file size exceeds limit (${totalSize} bytes)`);
              break;
            }

            processedFiles.push(processed);
          } catch (error) {
            console.error(`Error processing file ${file.name}:`, error);
          }
        }
      }
    }

    return this.generateResult(processedFiles);
  }

  /**
   * Process individual file
   */
  private async processFile(file: any): Promise<ProcessedFile> {
    const processed: ProcessedFile = {
      name: file.name || 'unknown',
      content: file.content || '',
      type: file.type || this.detectFileType(file.name),
      size: file.size || file.content?.length || 0,
    };

    // Detect programming language
    processed.language = this.detectLanguage(processed.name);
    processed.isCode = this.isCodeFile(processed.name);

    // Analyze code structure if it's a code file
    if (processed.isCode) {
      processed.structure = this.analyzeCodeStructure(processed.content, processed.language);
    }

    return processed;
  }

  /**
   * Generate processing result
   */
  private generateResult(processedFiles: ProcessedFile[]): FileProcessingResult {
    const files: Record<string, string> = {};
    const filesPath: string[] = [];
    let allContent = '';
    const languages = new Set<string>();
    let codeFiles = 0;
    let textFiles = 0;

    for (const file of processedFiles) {
      files[file.name] = file.content;
      filesPath.push(file.name);
      allContent += `\n\n--- ${file.name} ---\n${file.content}`;

      if (file.language) {
        languages.add(file.language);
      }

      if (file.isCode) {
        codeFiles++;
      } else {
        textFiles++;
      }
    }

    const diffString = this.generateDiffString(processedFiles);

    return {
      files,
      allContent: allContent.trim(),
      filesPath,
      diffString,
      hasFiles: processedFiles.length > 0,
      metadata: {
        totalFiles: processedFiles.length,
        totalSize: processedFiles.reduce((sum, f) => sum + f.size, 0),
        languages: Array.from(languages),
        codeFiles,
        textFiles,
      },
    };
  }

  /**
   * Generate diff string for files
   */
  private generateDiffString(files: ProcessedFile[]): string {
    if (files.length === 0) return '';

    const diffLines: string[] = [];
    
    for (const file of files) {
      diffLines.push(`diff --git a/${file.name} b/${file.name}`);
      diffLines.push(`index 0000000..1111111 100644`);
      diffLines.push(`--- /dev/null`);
      diffLines.push(`+++ b/${file.name}`);
      
      const lines = file.content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        diffLines.push(`+${lines[i]}`);
      }
      
      diffLines.push(''); // Empty line between files
    }

    return diffLines.join('\n');
  }

  /**
   * Detect file type from name
   */
  private detectFileType(fileName: string): string {
    const ext = this.getFileExtension(fileName);
    
    const typeMap: Record<string, string> = {
      '.js': 'application/javascript',
      '.ts': 'application/typescript',
      '.jsx': 'application/javascript',
      '.tsx': 'application/typescript',
      '.vue': 'application/vue',
      '.py': 'text/x-python',
      '.java': 'text/x-java',
      '.cpp': 'text/x-c++src',
      '.c': 'text/x-csrc',
      '.cs': 'text/x-csharp',
      '.go': 'text/x-go',
      '.rs': 'text/x-rust',
      '.html': 'text/html',
      '.css': 'text/css',
      '.scss': 'text/x-scss',
      '.json': 'application/json',
      '.xml': 'application/xml',
      '.yaml': 'application/yaml',
      '.yml': 'application/yaml',
      '.md': 'text/markdown',
      '.txt': 'text/plain',
      '.sql': 'application/sql',
      '.php': 'application/x-httpd-php',
      '.rb': 'application/x-ruby',
      '.swift': 'text/x-swift',
      '.kt': 'text/x-kotlin',
      '.dart': 'application/dart',
      '.sh': 'application/x-sh',
    };

    return typeMap[ext] || 'text/plain';
  }

  /**
   * Detect programming language
   */
  private detectLanguage(fileName: string): string | undefined {
    const ext = this.getFileExtension(fileName);
    
    const languageMap: Record<string, string> = {
      '.js': 'javascript',
      '.ts': 'typescript',
      '.jsx': 'javascript',
      '.tsx': 'typescript',
      '.vue': 'vue',
      '.svelte': 'svelte',
      '.py': 'python',
      '.java': 'java',
      '.cpp': 'cpp',
      '.c': 'c',
      '.cs': 'csharp',
      '.go': 'go',
      '.rs': 'rust',
      '.html': 'html',
      '.css': 'css',
      '.scss': 'scss',
      '.sass': 'sass',
      '.less': 'less',
      '.json': 'json',
      '.xml': 'xml',
      '.yaml': 'yaml',
      '.yml': 'yaml',
      '.toml': 'toml',
      '.md': 'markdown',
      '.sql': 'sql',
      '.php': 'php',
      '.rb': 'ruby',
      '.swift': 'swift',
      '.kt': 'kotlin',
      '.dart': 'dart',
      '.sh': 'bash',
      '.bash': 'bash',
      '.zsh': 'zsh',
      '.fish': 'fish',
    };

    return languageMap[ext];
  }

  /**
   * Check if file is a code file
   */
  private isCodeFile(fileName: string): boolean {
    const ext = this.getFileExtension(fileName);
    return this.supportedExtensions.has(ext);
  }

  /**
   * Get file extension
   */
  private getFileExtension(fileName: string): string {
    const lastDot = fileName.lastIndexOf('.');
    return lastDot === -1 ? '' : fileName.substring(lastDot).toLowerCase();
  }

  /**
   * Analyze code structure
   */
  private analyzeCodeStructure(content: string, language?: string): FileStructure {
    const structure: FileStructure = {
      functions: [],
      classes: [],
      imports: [],
      exports: [],
      comments: [],
    };

    const lines = content.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();

      // Skip empty lines
      if (!trimmed) continue;

      // Extract comments
      if (trimmed.startsWith('//') || trimmed.startsWith('#') || 
          trimmed.startsWith('/*') || trimmed.startsWith('*')) {
        structure.comments.push(trimmed);
        continue;
      }

      // Extract imports/requires
      if (trimmed.startsWith('import ') || trimmed.startsWith('from ') ||
          trimmed.startsWith('require(') || trimmed.startsWith('const ') && trimmed.includes('require(')) {
        structure.imports.push(trimmed);
        continue;
      }

      // Extract exports
      if (trimmed.startsWith('export ') || trimmed.startsWith('module.exports')) {
        structure.exports.push(trimmed);
        continue;
      }

      // Extract functions (basic patterns)
      if (trimmed.includes('function ') || trimmed.includes('def ') ||
          trimmed.includes('=>') || trimmed.match(/^\w+\s*\(/)) {
        structure.functions.push(trimmed);
        continue;
      }

      // Extract classes
      if (trimmed.startsWith('class ') || trimmed.startsWith('interface ') ||
          trimmed.startsWith('type ')) {
        structure.classes.push(trimmed);
        continue;
      }
    }

    return structure;
  }

  /**
   * Validate file content
   */
  validateFile(file: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!file.name) {
      errors.push('File name is required');
    }

    if (!file.content) {
      errors.push('File content is required');
    }

    if (file.size && file.size > this.maxFileSize) {
      errors.push(`File size exceeds limit (${this.maxFileSize} bytes)`);
    }

    const ext = this.getFileExtension(file.name || '');
    if (ext && !this.supportedExtensions.has(ext)) {
      errors.push(`Unsupported file type: ${ext}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get supported file extensions
   */
  getSupportedExtensions(): string[] {
    return Array.from(this.supportedExtensions);
  }

  /**
   * Get file processing statistics
   */
  getProcessingStats(result: FileProcessingResult) {
    return {
      summary: `Processed ${result.metadata.totalFiles} files (${result.metadata.codeFiles} code, ${result.metadata.textFiles} text)`,
      totalSize: `${(result.metadata.totalSize / 1024).toFixed(2)} KB`,
      languages: result.metadata.languages.join(', '),
      hasFiles: result.hasFiles,
    };
  }
}

// Export singleton instance
export const fileProcessor = new FileProcessor();
