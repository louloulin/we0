/**
 * File Processing Tool
 * 
 * Provides file processing capabilities for the Builder Agent
 * Handles boltArtifact parsing and file content extraction
 */

import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { parseMessage, type ParsedMessage } from '../utils/message-parser';
import { processFiles, type ProcessedFiles, type Message } from '../utils/file-processor';

/**
 * Tool for parsing boltArtifact content from messages
 */
export const parseArtifactTool = createTool({
  id: 'parse-artifact',
  description: 'Parse boltArtifact tags from message content and extract file information',
  inputSchema: z.object({
    content: z.string().describe('Message content that may contain boltArtifact tags'),
  }),
  outputSchema: z.object({
    content: z.string().describe('Cleaned message content'),
    files: z.record(z.string()).optional().describe('Extracted files as path -> content mapping'),
    hasFiles: z.boolean().describe('Whether any files were found'),
    fileCount: z.number().describe('Number of files extracted'),
  }),
  execute: async ({ context: { content } }) => {
    const parsed = parseMessage(content);
    
    return {
      content: parsed.content,
      files: parsed.files,
      hasFiles: !!parsed.files && Object.keys(parsed.files).length > 0,
      fileCount: parsed.files ? Object.keys(parsed.files).length : 0,
    };
  },
});

/**
 * Tool for processing multiple messages and extracting all files
 */
export const processMessagesTool = createTool({
  id: 'process-messages',
  description: 'Process multiple messages to extract and combine all file content',
  inputSchema: z.object({
    messages: z.array(z.object({
      role: z.enum(['user', 'assistant', 'system']),
      content: z.string(),
    })).describe('Array of messages to process'),
    clearText: z.boolean().optional().default(false).describe('Whether to clear text content and only keep files'),
  }),
  outputSchema: z.object({
    files: z.record(z.string()).describe('All extracted files as path -> content mapping'),
    allContent: z.string().describe('Combined content from all messages'),
    fileCount: z.number().describe('Total number of unique files'),
    totalSize: z.number().describe('Total size of all file content in bytes'),
    projectType: z.enum(['miniProgram', 'web', 'backend', 'other']).optional().describe('Detected project type'),
  }),
  execute: async ({ context: { messages, clearText } }) => {
    const processed = processFiles(messages as Message[], clearText);
    
    return {
      files: processed.files,
      allContent: processed.allContent,
      fileCount: processed.fileCount,
      totalSize: processed.totalSize,
      projectType: processed.projectType,
    };
  },
});

/**
 * Tool for analyzing file structure and providing insights
 */
export const analyzeFileStructureTool = createTool({
  id: 'analyze-file-structure',
  description: 'Analyze file structure and provide project insights',
  inputSchema: z.object({
    files: z.record(z.string()).describe('Files as path -> content mapping'),
  }),
  outputSchema: z.object({
    projectType: z.enum(['miniProgram', 'web', 'backend', 'other']).describe('Detected project type'),
    fileTypes: z.record(z.number()).describe('Count of files by extension'),
    totalFiles: z.number().describe('Total number of files'),
    totalSize: z.number().describe('Total size in bytes'),
    largestFile: z.object({
      path: z.string(),
      size: z.number(),
    }).describe('Information about the largest file'),
    recommendations: z.array(z.string()).describe('Recommendations based on file structure'),
  }),
  execute: async ({ context: { files } }) => {
    const { determineProjectType, getFileStatistics } = await import('../utils/file-processor');
    
    const projectType = determineProjectType(files);
    const stats = getFileStatistics(files);
    
    // Generate recommendations based on project type and structure
    const recommendations: string[] = [];
    
    if (projectType === 'miniProgram') {
      recommendations.push('This appears to be a WeChat Mini Program project');
      if (!files['app.json']) {
        recommendations.push('Consider adding app.json for proper mini program configuration');
      }
    } else if (projectType === 'web') {
      recommendations.push('This appears to be a web frontend project');
      if (!files['package.json']) {
        recommendations.push('Consider adding package.json for dependency management');
      }
    } else if (projectType === 'backend') {
      recommendations.push('This appears to be a backend/server project');
      if (stats.fileTypes.js && !files['package.json']) {
        recommendations.push('Consider adding package.json for Node.js dependency management');
      }
    }
    
    if (stats.totalFiles > 50) {
      recommendations.push('Large project detected - consider modular architecture');
    }
    
    if (stats.largestFile.size > 100000) {
      recommendations.push(`Large file detected (${stats.largestFile.path}) - consider breaking it down`);
    }
    
    return {
      projectType,
      fileTypes: stats.fileTypes,
      totalFiles: stats.totalFiles,
      totalSize: stats.totalSize,
      largestFile: stats.largestFile,
      recommendations,
    };
  },
});

/**
 * Tool for filtering files based on criteria
 */
export const filterFilesTool = createTool({
  id: 'filter-files',
  description: 'Filter files based on various criteria like extensions, patterns, or content type',
  inputSchema: z.object({
    files: z.record(z.string()).describe('Files as path -> content mapping'),
    extensions: z.array(z.string()).optional().describe('File extensions to include (e.g., ["js", "ts"])'),
    includePatterns: z.array(z.string()).optional().describe('Regex patterns for paths to include'),
    excludePatterns: z.array(z.string()).optional().describe('Regex patterns for paths to exclude'),
    codeOnly: z.boolean().optional().default(false).describe('Whether to include only code files'),
  }),
  outputSchema: z.object({
    filteredFiles: z.record(z.string()).describe('Filtered files'),
    originalCount: z.number().describe('Original file count'),
    filteredCount: z.number().describe('Filtered file count'),
    removedCount: z.number().describe('Number of files removed'),
  }),
  execute: async ({ context: { files, extensions, includePatterns, excludePatterns, codeOnly } }) => {
    const { filterFiles } = await import('../utils/file-processor');
    
    const filteredFiles = filterFiles(files, {
      extensions,
      includePatterns,
      excludePatterns,
      codeOnly,
    });
    
    return {
      filteredFiles,
      originalCount: Object.keys(files).length,
      filteredCount: Object.keys(filteredFiles).length,
      removedCount: Object.keys(files).length - Object.keys(filteredFiles).length,
    };
  },
});

/**
 * Tool for validating file content and structure
 */
export const validateFilesTool = createTool({
  id: 'validate-files',
  description: 'Validate file content and structure for potential issues',
  inputSchema: z.object({
    files: z.record(z.string()).describe('Files as path -> content mapping'),
  }),
  outputSchema: z.object({
    isValid: z.boolean().describe('Whether the file structure is valid'),
    errors: z.array(z.string()).describe('Critical errors found'),
    warnings: z.array(z.string()).describe('Warnings and recommendations'),
    fileCount: z.number().describe('Number of files validated'),
    summary: z.string().describe('Validation summary'),
  }),
  execute: async ({ context: { files } }) => {
    const { validateFiles } = await import('../utils/file-processor');
    
    const validation = validateFiles(files);
    
    let summary = `Validated ${validation.fileCount} files. `;
    if (validation.isValid) {
      summary += 'No critical issues found.';
    } else {
      summary += `Found ${validation.errors.length} critical errors.`;
    }
    
    if (validation.warnings.length > 0) {
      summary += ` ${validation.warnings.length} warnings reported.`;
    }
    
    return {
      isValid: validation.isValid,
      errors: validation.errors,
      warnings: validation.warnings,
      fileCount: validation.fileCount,
      summary,
    };
  },
});

/**
 * Tool for generating file content summaries
 */
export const summarizeFilesTool = createTool({
  id: 'summarize-files',
  description: 'Generate summaries of file content for better understanding',
  inputSchema: z.object({
    files: z.record(z.string()).describe('Files as path -> content mapping'),
    maxSummaryLength: z.number().optional().default(200).describe('Maximum length of each file summary'),
  }),
  outputSchema: z.object({
    summaries: z.record(z.string()).describe('File path -> summary mapping'),
    overallSummary: z.string().describe('Overall project summary'),
    keyFiles: z.array(z.string()).describe('List of key/important files'),
  }),
  execute: async ({ context: { files, maxSummaryLength } }) => {
    const { estimateFileComplexity, isCodeFile } = await import('../utils/message-parser');
    
    const summaries: Record<string, string> = {};
    const keyFiles: string[] = [];
    
    for (const [filePath, content] of Object.entries(files)) {
      const lines = (content as string).split('\n').length;
      const complexity = estimateFileComplexity(content as string);
      const isCode = isCodeFile(filePath);
      
      let summary = `${isCode ? 'Code file' : 'Text file'} with ${lines} lines`;
      
      if (complexity > 5) {
        summary += `, high complexity (${complexity}/10)`;
        keyFiles.push(filePath);
      } else if (complexity > 2) {
        summary += `, medium complexity (${complexity}/10)`;
      } else {
        summary += `, low complexity (${complexity}/10)`;
      }
      
      // Add content preview
      const preview = (content as string).substring(0, maxSummaryLength - summary.length - 10);
      if (preview.length < (content as string).length) {
        summary += `. Preview: ${preview}...`;
      } else {
        summary += `. Content: ${preview}`;
      }
      
      summaries[filePath] = summary;
    }
    
    // Generate overall summary
    const totalFiles = Object.keys(files).length;
    const codeFiles = Object.keys(files).filter(isCodeFile).length;
    const { determineProjectType } = await import('../utils/file-processor');
    const projectType = determineProjectType(files);
    
    const overallSummary = `Project contains ${totalFiles} files (${codeFiles} code files). ` +
      `Detected as ${projectType} project. ` +
      `${keyFiles.length} files identified as complex/important.`;
    
    return {
      summaries,
      overallSummary,
      keyFiles,
    };
  },
});
