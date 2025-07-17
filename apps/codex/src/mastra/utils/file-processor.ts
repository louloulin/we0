/**
 * File Processor Utility
 * 
 * Processes files from messages and manages file content extraction
 * Compatible with we-dev-next file processing logic
 */

import { parseMessage, type ParsedMessage, isFileExcluded, cleanFilePath, isCodeFile } from './message-parser';

export interface ProcessedFiles {
  files: Record<string, string>;
  allContent: string;
  fileCount: number;
  totalSize: number;
  projectType?: 'miniProgram' | 'web' | 'backend' | 'other';
}

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export type Messages = Message[];

/**
 * Processes files from an array of messages
 * Extracts and combines all file content from boltArtifact tags
 * 
 * @param messages - Array of messages to process
 * @param clearText - Whether to clear text content and only keep files
 * @returns ProcessedFiles object with combined file content
 */
export function processFiles(messages: Messages, clearText: boolean = false): ProcessedFiles {
  const allFiles: Record<string, string> = {};
  const textContents: string[] = [];
  let totalSize = 0;
  
  // Process each message
  for (const message of messages) {
    if (message.role === 'user' || message.role === 'assistant') {
      const parsed = parseMessage(message.content);
      
      // Add text content if not clearing
      if (!clearText && parsed.content) {
        textContents.push(`[${message.role}]: ${parsed.content}`);
      }
      
      // Merge files
      if (parsed.files) {
        for (const [filePath, content] of Object.entries(parsed.files)) {
          const cleanPath = cleanFilePath(filePath);
          allFiles[cleanPath] = content;
          totalSize += content.length;
        }
      }
    }
  }
  
  // Combine all content
  const fileContents = Object.entries(allFiles)
    .map(([path, content]) => `// File: ${path}\n${content}`)
    .join('\n\n');
  
  const allContent = clearText 
    ? fileContents
    : [...textContents, fileContents].filter(Boolean).join('\n\n');
  
  return {
    files: allFiles,
    allContent,
    fileCount: Object.keys(allFiles).length,
    totalSize,
    projectType: determineProjectType(allFiles)
  };
}

/**
 * Determines the project type based on file structure
 * 
 * @param files - Record of file paths and contents
 * @returns Project type classification
 */
export function determineProjectType(files: Record<string, string>): 'miniProgram' | 'web' | 'backend' | 'other' {
  const filePaths = Object.keys(files);
  
  // Check for mini program indicators
  const hasMiniProgramFiles = filePaths.some(path => 
    path.includes('app.json') ||
    path.includes('app.js') ||
    path.includes('.wxml') ||
    path.includes('.wxss') ||
    path.includes('project.config.json') ||
    path.includes('miniprogram/')
  );
  
  if (hasMiniProgramFiles) {
    return 'miniProgram';
  }
  
  // Check for backend indicators first (more specific)
  const hasBackendFiles = filePaths.some(path =>
    path.includes('server.js') ||
    path.includes('app.py') ||
    path.includes('main.go') ||
    path.includes('index.php') ||
    path.includes('Dockerfile') ||
    path.includes('requirements.txt') ||
    path.includes('go.mod') ||
    path.includes('pom.xml') ||
    path.includes('Cargo.toml')
  );

  const hasBackendContent = Object.values(files).some(content =>
    content.includes('express') ||
    content.includes('fastapi') ||
    content.includes('django') ||
    content.includes('flask') ||
    content.includes('gin') ||
    content.includes('spring') ||
    content.includes('laravel')
  );

  if (hasBackendFiles || hasBackendContent) {
    return 'backend';
  }

  // Check for web frontend indicators
  const hasWebFiles = filePaths.some(path =>
    path.includes('index.html') ||
    path.includes('src/') ||
    path.includes('public/') ||
    path.includes('components/') ||
    path.includes('.jsx') ||
    path.includes('.tsx') ||
    path.includes('.vue')
  );

  const hasWebFrameworks = Object.values(files).some(content =>
    content.includes('react') ||
    content.includes('vue') ||
    content.includes('angular') ||
    content.includes('svelte') ||
    content.includes('next') ||
    content.includes('nuxt')
  );

  // Check if package.json indicates backend vs frontend
  const packageJsonPath = filePaths.find(path => path.includes('package.json'));
  if (packageJsonPath) {
    const packageContent = files[packageJsonPath];
    const isBackendPackage = packageContent.includes('express') ||
                           packageContent.includes('koa') ||
                           packageContent.includes('fastify') ||
                           packageContent.includes('nest');
    if (isBackendPackage) {
      return 'backend';
    }
  }

  if (hasWebFiles || hasWebFrameworks) {
    return 'web';
  }
  
  return 'other';
}

/**
 * Filters files by type or pattern
 * 
 * @param files - Record of file paths and contents
 * @param filter - Filter criteria
 * @returns Filtered files
 */
export function filterFiles(
  files: Record<string, string>, 
  filter: {
    extensions?: string[];
    includePatterns?: string[];
    excludePatterns?: string[];
    codeOnly?: boolean;
  }
): Record<string, string> {
  const filtered: Record<string, string> = {};
  
  for (const [filePath, content] of Object.entries(files)) {
    let include = true;
    
    // Check code only filter
    if (filter.codeOnly && !isCodeFile(filePath)) {
      include = false;
    }
    
    // Check extensions
    if (filter.extensions && filter.extensions.length > 0) {
      const ext = filePath.split('.').pop()?.toLowerCase();
      if (!ext || !filter.extensions.includes(ext)) {
        include = false;
      }
    }
    
    // Check include patterns
    if (filter.includePatterns && filter.includePatterns.length > 0) {
      const matches = filter.includePatterns.some(pattern => 
        new RegExp(pattern).test(filePath)
      );
      if (!matches) {
        include = false;
      }
    }
    
    // Check exclude patterns
    if (filter.excludePatterns && filter.excludePatterns.length > 0) {
      const matches = filter.excludePatterns.some(pattern => 
        new RegExp(pattern).test(filePath)
      );
      if (matches) {
        include = false;
      }
    }
    
    if (include) {
      filtered[filePath] = content;
    }
  }
  
  return filtered;
}

/**
 * Gets file statistics from processed files
 * 
 * @param files - Record of file paths and contents
 * @returns File statistics
 */
export function getFileStatistics(files: Record<string, string>) {
  const stats = {
    totalFiles: Object.keys(files).length,
    totalSize: 0,
    totalLines: 0,
    fileTypes: {} as Record<string, number>,
    largestFile: { path: '', size: 0 },
    averageSize: 0
  };
  
  for (const [filePath, content] of Object.entries(files)) {
    const size = content.length;
    const lines = content.split('\n').length;
    const ext = filePath.split('.').pop()?.toLowerCase() || 'unknown';
    
    stats.totalSize += size;
    stats.totalLines += lines;
    stats.fileTypes[ext] = (stats.fileTypes[ext] || 0) + 1;
    
    if (size > stats.largestFile.size) {
      stats.largestFile = { path: filePath, size };
    }
  }
  
  stats.averageSize = stats.totalFiles > 0 ? stats.totalSize / stats.totalFiles : 0;
  
  return stats;
}

/**
 * Validates file content and structure
 * 
 * @param files - Record of file paths and contents
 * @returns Validation results
 */
export function validateFiles(files: Record<string, string>) {
  const validation = {
    isValid: true,
    errors: [] as string[],
    warnings: [] as string[],
    fileCount: Object.keys(files).length
  };
  
  // Check if any files exist
  if (validation.fileCount === 0) {
    validation.isValid = false;
    validation.errors.push('No files found to process');
    return validation;
  }
  
  // Check for excluded files
  for (const filePath of Object.keys(files)) {
    if (isFileExcluded(filePath)) {
      validation.warnings.push(`File ${filePath} is in exclude list but was processed`);
    }
  }
  
  // Check file sizes
  for (const [filePath, content] of Object.entries(files)) {
    if (content.length > 1024 * 1024) { // 1MB limit
      validation.warnings.push(`File ${filePath} is very large (${content.length} bytes)`);
    }
    
    if (content.length === 0) {
      validation.warnings.push(`File ${filePath} is empty`);
    }
  }
  
  return validation;
}

/**
 * Merges multiple ProcessedFiles objects
 * 
 * @param processedFilesArray - Array of ProcessedFiles to merge
 * @returns Merged ProcessedFiles object
 */
export function mergeProcessedFiles(processedFilesArray: ProcessedFiles[]): ProcessedFiles {
  const mergedFiles: Record<string, string> = {};
  const allContents: string[] = [];
  let totalSize = 0;
  let fileCount = 0;
  
  for (const processed of processedFilesArray) {
    // Merge files (later files override earlier ones with same path)
    Object.assign(mergedFiles, processed.files);
    
    // Combine content
    if (processed.allContent) {
      allContents.push(processed.allContent);
    }
    
    totalSize += processed.totalSize;
    fileCount += processed.fileCount;
  }
  
  return {
    files: mergedFiles,
    allContent: allContents.join('\n\n'),
    fileCount: Object.keys(mergedFiles).length, // Actual unique file count
    totalSize,
    projectType: determineProjectType(mergedFiles)
  };
}
