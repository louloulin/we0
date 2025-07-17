/**
 * Message Parser Utility
 * 
 * Parses boltArtifact tags from user messages and extracts file content
 * Compatible with we-dev-next message format
 */

export interface ParsedMessage {
  content: string;
  files?: Record<string, string>;
}

export interface FileAction {
  type: 'file';
  filePath: string;
  content: string;
}

/**
 * List of files to exclude from processing
 * These are typically generated or library files that shouldn't be modified
 */
export const excludeFiles = [
  // WeIcon component files
  "components/weicon/base64.js",
  "components/weicon/icon.css",
  "components/weicon/index.js",
  "components/weicon/index.json",
  "components/weicon/index.wxml",
  "components/weicon/icondata.js",
  "components/weicon/index.css",
  
  // MiniProgram WeIcon files
  "/miniprogram/components/weicon/base64.js",
  "/miniprogram/components/weicon/icon.css",
  "/miniprogram/components/weicon/index.js",
  "/miniprogram/components/weicon/index.json",
  "/miniprogram/components/weicon/index.wxml",
  "/miniprogram/components/weicon/icondata.js",
  "/miniprogram/components/weicon/index.css",
  
  // Common generated files
  "node_modules/**",
  "dist/**",
  "build/**",
  ".git/**",
  ".next/**",
  "coverage/**",
  "*.log",
  "*.lock",
  "package-lock.json",
  "yarn.lock",
  "pnpm-lock.yaml",
];

/**
 * Parses a message content and extracts file information from boltArtifact tags
 * 
 * @param content - The message content to parse
 * @returns ParsedMessage with cleaned content and extracted files
 */
export function parseMessage(content: string): ParsedMessage {
  // Regular expression to match boltArtifact tags
  const artifactRegex = /<boltArtifact[^>]*>([\s\S]*?)<\/boltArtifact>/;
  
  // Check if content contains boltArtifact
  if (!artifactRegex.test(content)) {
    // No boltArtifact found, return original content
    return { content };
  }
  
  // Extract boltArtifact content
  const match = content.match(artifactRegex);
  if (!match) {
    return { content };
  }
  
  const artifactContent = match[1].trim();
  
  // Parse file content using boltAction regex
  const files: Record<string, string> = {};
  const boltActionRegex = /<boltAction type="file" filePath="([^"]+)">([\s\S]*?)<\/boltAction>/g;
  
  let boltMatch;
  while ((boltMatch = boltActionRegex.exec(artifactContent)) !== null) {
    const [, filePath, fileContent] = boltMatch;
    
    // Skip excluded files
    if (!isFileExcluded(filePath)) {
      files[filePath] = fileContent.trim();
    }
  }
  
  // Replace boltArtifact with summary text
  const fileList = Object.keys(files);
  const replacementText = fileList.length > 0 
    ? `已经修改好了的目录${JSON.stringify(fileList)}`
    : '已处理文件内容';
    
  const newContent = content.replace(artifactRegex, replacementText);
  
  return {
    content: newContent.trim(),
    files: Object.keys(files).length > 0 ? files : undefined
  };
}

/**
 * Checks if a file path should be excluded from processing
 * 
 * @param filePath - The file path to check
 * @returns true if the file should be excluded
 */
export function isFileExcluded(filePath: string): boolean {
  return excludeFiles.some(excludePattern => {
    // Handle glob patterns
    if (excludePattern.includes('*')) {
      // Convert glob pattern to regex
      let regexPattern = excludePattern
        .replace(/\./g, '\\.')  // Escape dots
        .replace(/\*\*/g, '___DOUBLESTAR___')  // Temporarily replace **
        .replace(/\*/g, '[^/]*')  // Single * matches anything except /
        .replace(/___DOUBLESTAR___/g, '.*')  // ** matches anything including /
        .replace(/\//g, '\\/');  // Escape forward slashes

      // Add anchors for exact matching
      if (!regexPattern.startsWith('.*')) {
        regexPattern = '^' + regexPattern;
      }
      if (!regexPattern.endsWith('.*')) {
        regexPattern = regexPattern + '$';
      }

      const regex = new RegExp(regexPattern);
      return regex.test(filePath);
    }

    // Exact match
    return filePath === excludePattern;
  });
}

/**
 * Extracts all boltAction elements from artifact content
 * 
 * @param artifactContent - The content inside boltArtifact tags
 * @returns Array of FileAction objects
 */
export function extractFileActions(artifactContent: string): FileAction[] {
  const actions: FileAction[] = [];
  const boltActionRegex = /<boltAction type="file" filePath="([^"]+)">([\s\S]*?)<\/boltAction>/g;
  
  let match;
  while ((match = boltActionRegex.exec(artifactContent)) !== null) {
    const [, filePath, content] = match;
    
    if (!isFileExcluded(filePath)) {
      actions.push({
        type: 'file',
        filePath,
        content: content.trim()
      });
    }
  }
  
  return actions;
}

/**
 * Validates boltArtifact content structure
 * 
 * @param content - The content to validate
 * @returns true if the content has valid boltArtifact structure
 */
export function validateArtifactContent(content: string): boolean {
  const artifactRegex = /<boltArtifact[^>]*>([\s\S]*?)<\/boltArtifact>/;
  const match = content.match(artifactRegex);
  
  if (!match) {
    return false;
  }
  
  const artifactContent = match[1];
  const boltActionRegex = /<boltAction type="file" filePath="([^"]+)">([\s\S]*?)<\/boltAction>/g;
  
  // Check if there's at least one valid boltAction
  return boltActionRegex.test(artifactContent);
}

/**
 * Cleans and normalizes file paths
 * 
 * @param filePath - The file path to clean
 * @returns Cleaned file path
 */
export function cleanFilePath(filePath: string): string {
  return filePath
    .replace(/^\/+/, '') // Remove leading slashes
    .replace(/\/+/g, '/') // Replace multiple slashes with single
    .trim();
}

/**
 * Gets file extension from file path
 * 
 * @param filePath - The file path
 * @returns File extension (without dot) or empty string
 */
export function getFileExtension(filePath: string): string {
  const lastDot = filePath.lastIndexOf('.');
  const lastSlash = filePath.lastIndexOf('/');
  
  if (lastDot > lastSlash && lastDot !== -1) {
    return filePath.substring(lastDot + 1).toLowerCase();
  }
  
  return '';
}

/**
 * Checks if a file is a code file based on extension
 * 
 * @param filePath - The file path to check
 * @returns true if it's a code file
 */
export function isCodeFile(filePath: string): boolean {
  const codeExtensions = [
    'js', 'jsx', 'ts', 'tsx', 'vue', 'svelte',
    'py', 'java', 'cpp', 'c', 'cs', 'php',
    'rb', 'go', 'rs', 'swift', 'kt', 'scala',
    'html', 'css', 'scss', 'sass', 'less',
    'json', 'xml', 'yaml', 'yml', 'toml',
    'md', 'mdx', 'txt', 'sql', 'sh', 'bat'
  ];
  
  const extension = getFileExtension(filePath);
  return codeExtensions.includes(extension);
}

/**
 * Estimates the complexity of file content
 * 
 * @param content - The file content
 * @returns Complexity score (0-10)
 */
export function estimateFileComplexity(content: string): number {
  const lines = content.split('\n').length;
  const functions = (content.match(/function|const.*=.*=>|class/g) || []).length;
  const imports = (content.match(/import|require|from/g) || []).length;
  
  // Simple complexity calculation
  let complexity = 0;
  complexity += Math.min(lines / 50, 3); // Line count factor
  complexity += Math.min(functions / 5, 3); // Function count factor
  complexity += Math.min(imports / 10, 2); // Import count factor
  
  return Math.min(Math.round(complexity), 10);
}
