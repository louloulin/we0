/**
 * boltArtifact 格式验证器
 * 
 * 这个模块负责验证和修复 Agent 生成的 boltArtifact XML 格式，
 * 确保代码生成的质量和完整性。
 * 
 * 核心功能：
 * - XML 格式验证：确保 boltArtifact 标签结构正确
 * - 代码完整性检查：验证生成的代码没有占位符或 TODO
 * - 文件路径验证：确保文件路径合理且安全
 * - 语法检查：基本的语法错误检测
 * - 自动修复：尝试修复常见的格式问题
 */

import { z } from 'zod';

/**
 * boltArtifact 验证结果接口
 */
export interface BoltArtifactValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  fixedContent?: string;
  extractedFiles: ExtractedFile[];
  metadata: ValidationMetadata;
}

/**
 * 验证错误接口
 */
export interface ValidationError {
  type: 'structure' | 'syntax' | 'content' | 'security';
  message: string;
  line?: number;
  column?: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
  suggestion?: string;
}

/**
 * 验证警告接口
 */
export interface ValidationWarning {
  type: 'style' | 'performance' | 'best-practice' | 'compatibility';
  message: string;
  line?: number;
  suggestion?: string;
}

/**
 * 提取的文件接口
 */
export interface ExtractedFile {
  filePath: string;
  content: string;
  type: string;
  size: number;
  language: string;
  hasPlaceholders: boolean;
  syntaxValid: boolean;
}

/**
 * 验证元数据接口
 */
export interface ValidationMetadata {
  totalFiles: number;
  totalLines: number;
  languages: string[];
  hasTests: boolean;
  hasDocumentation: boolean;
  estimatedComplexity: 'low' | 'medium' | 'high';
  qualityScore: number; // 0-100
}

/**
 * boltArtifact 格式验证器类
 */
export class BoltArtifactValidator {
  
  /**
   * 验证 boltArtifact 内容
   */
  static validate(content: string): BoltArtifactValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    let extractedFiles: ExtractedFile[] = [];
    let fixedContent: string | undefined;
    
    try {
      // 1. 基本结构验证
      const structureValidation = this.validateStructure(content);
      errors.push(...structureValidation.errors);
      warnings.push(...structureValidation.warnings);
      
      // 2. 提取文件内容
      extractedFiles = this.extractFiles(content);
      
      // 3. 验证每个文件
      for (const file of extractedFiles) {
        const fileValidation = this.validateFile(file);
        errors.push(...fileValidation.errors);
        warnings.push(...fileValidation.warnings);
      }
      
      // 4. 尝试自动修复
      if (errors.length > 0) {
        const fixResult = this.attemptAutoFix(content, errors);
        if (fixResult.success && fixResult.fixedContent) {
          fixedContent = fixResult.fixedContent;
          // 重新验证修复后的内容
          const revalidation = this.validate(fixedContent);
          if (revalidation.errors.length < errors.length) {
            errors.splice(0, errors.length, ...revalidation.errors);
            warnings.splice(0, warnings.length, ...revalidation.warnings);
            extractedFiles = revalidation.extractedFiles;
          }
        }
      }
      
      // 5. 生成元数据
      const metadata = this.generateMetadata(extractedFiles);
      
      return {
        isValid: errors.filter(e => e.severity === 'critical' || e.severity === 'high').length === 0,
        errors,
        warnings,
        fixedContent,
        extractedFiles,
        metadata
      };
      
    } catch (error) {
      return {
        isValid: false,
        errors: [{
          type: 'structure',
          message: `验证过程中发生错误: ${error instanceof Error ? error.message : String(error)}`,
          severity: 'critical'
        }],
        warnings: [],
        extractedFiles: [],
        metadata: {
          totalFiles: 0,
          totalLines: 0,
          languages: [],
          hasTests: false,
          hasDocumentation: false,
          estimatedComplexity: 'low',
          qualityScore: 0
        }
      };
    }
  }
  
  /**
   * 验证 XML 结构
   */
  private static validateStructure(content: string): { errors: ValidationError[], warnings: ValidationWarning[] } {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    
    // 检查是否包含 boltArtifact 标签
    if (!content.includes('<boltArtifact')) {
      errors.push({
        type: 'structure',
        message: '缺少 boltArtifact 开始标签',
        severity: 'critical',
        suggestion: '添加 <boltArtifact id="unique-id" title="项目标题"> 标签'
      });
    }
    
    if (!content.includes('</boltArtifact>')) {
      errors.push({
        type: 'structure',
        message: '缺少 boltArtifact 结束标签',
        severity: 'critical',
        suggestion: '添加 </boltArtifact> 结束标签'
      });
    }
    
    // 检查 boltAction 标签
    const boltActionMatches = content.match(/<boltAction[^>]*>/g);
    const boltActionCloses = content.match(/<\/boltAction>/g);
    
    if (!boltActionMatches || boltActionMatches.length === 0) {
      errors.push({
        type: 'structure',
        message: '缺少 boltAction 标签',
        severity: 'high',
        suggestion: '添加 <boltAction type="file" filePath="文件路径"> 标签'
      });
    } else if (!boltActionCloses || boltActionMatches.length !== boltActionCloses.length) {
      errors.push({
        type: 'structure',
        message: 'boltAction 标签未正确闭合',
        severity: 'high',
        suggestion: '确保每个 <boltAction> 都有对应的 </boltAction>'
      });
    }
    
    // 检查必需属性
    if (boltActionMatches) {
      for (const match of boltActionMatches) {
        if (!match.includes('type=')) {
          errors.push({
            type: 'structure',
            message: 'boltAction 缺少 type 属性',
            severity: 'high',
            suggestion: '添加 type="file" 属性'
          });
        }
        
        if (!match.includes('filePath=')) {
          errors.push({
            type: 'structure',
            message: 'boltAction 缺少 filePath 属性',
            severity: 'high',
            suggestion: '添加 filePath="文件路径" 属性'
          });
        }
      }
    }
    
    return { errors, warnings };
  }
  
  /**
   * 提取文件内容
   */
  private static extractFiles(content: string): ExtractedFile[] {
    const files: ExtractedFile[] = [];
    
    // 使用正则表达式提取 boltAction 内容
    const boltActionRegex = /<boltAction[^>]*type="file"[^>]*filePath="([^"]*)"[^>]*>([\s\S]*?)<\/boltAction>/g;
    let match;
    
    while ((match = boltActionRegex.exec(content)) !== null) {
      const filePath = match[1];
      const fileContent = match[2].trim();
      
      const file: ExtractedFile = {
        filePath,
        content: fileContent,
        type: this.getFileType(filePath),
        size: fileContent.length,
        language: this.detectLanguage(filePath),
        hasPlaceholders: this.hasPlaceholders(fileContent),
        syntaxValid: this.validateSyntax(fileContent, filePath)
      };
      
      files.push(file);
    }
    
    return files;
  }
  
  /**
   * 验证单个文件
   */
  private static validateFile(file: ExtractedFile): { errors: ValidationError[], warnings: ValidationWarning[] } {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    
    // 检查文件路径安全性
    if (file.filePath.includes('..') || file.filePath.startsWith('/')) {
      errors.push({
        type: 'security',
        message: `不安全的文件路径: ${file.filePath}`,
        severity: 'high',
        suggestion: '使用相对路径，避免使用 .. 或绝对路径'
      });
    }
    
    // 检查占位符
    if (file.hasPlaceholders) {
      errors.push({
        type: 'content',
        message: `文件 ${file.filePath} 包含占位符或 TODO`,
        severity: 'high',
        suggestion: '替换所有占位符为实际的代码实现'
      });
    }
    
    // 检查文件大小
    if (file.size === 0) {
      errors.push({
        type: 'content',
        message: `文件 ${file.filePath} 为空`,
        severity: 'medium',
        suggestion: '添加文件内容或移除空文件'
      });
    } else if (file.size > 50000) {
      warnings.push({
        type: 'performance',
        message: `文件 ${file.filePath} 过大 (${file.size} 字符)`,
        suggestion: '考虑将大文件拆分为多个小文件'
      });
    }
    
    // 语法验证
    if (!file.syntaxValid) {
      errors.push({
        type: 'syntax',
        message: `文件 ${file.filePath} 可能存在语法错误`,
        severity: 'medium',
        suggestion: '检查代码语法，确保符合语言规范'
      });
    }
    
    return { errors, warnings };
  }
  
  /**
   * 尝试自动修复
   */
  private static attemptAutoFix(content: string, errors: ValidationError[]): { success: boolean, fixedContent?: string } {
    let fixedContent = content;
    let hasChanges = false;
    
    // 修复缺少的结束标签
    if (errors.some(e => e.message.includes('缺少 boltArtifact 结束标签'))) {
      if (!fixedContent.includes('</boltArtifact>')) {
        fixedContent += '\n</boltArtifact>';
        hasChanges = true;
      }
    }
    
    // 修复未闭合的 boltAction 标签
    const openTags = (fixedContent.match(/<boltAction[^>]*>/g) || []).length;
    const closeTags = (fixedContent.match(/<\/boltAction>/g) || []).length;
    
    if (openTags > closeTags) {
      const missingTags = openTags - closeTags;
      for (let i = 0; i < missingTags; i++) {
        fixedContent = fixedContent.replace('</boltArtifact>', '</boltAction>\n</boltArtifact>');
        hasChanges = true;
      }
    }
    
    return {
      success: hasChanges,
      fixedContent: hasChanges ? fixedContent : undefined
    };
  }
  
  /**
   * 生成验证元数据
   */
  private static generateMetadata(files: ExtractedFile[]): ValidationMetadata {
    const totalFiles = files.length;
    const totalLines = files.reduce((sum, file) => sum + file.content.split('\n').length, 0);
    const languages = [...new Set(files.map(file => file.language))];
    
    const hasTests = files.some(file => 
      file.filePath.includes('test') || 
      file.filePath.includes('spec') ||
      file.content.includes('describe(') ||
      file.content.includes('it(') ||
      file.content.includes('test(')
    );
    
    const hasDocumentation = files.some(file => 
      file.filePath.toLowerCase().includes('readme') ||
      file.filePath.toLowerCase().includes('doc') ||
      file.type === 'md'
    );
    
    // 估算复杂度
    let estimatedComplexity: 'low' | 'medium' | 'high' = 'low';
    if (totalFiles > 10 || totalLines > 1000) {
      estimatedComplexity = 'high';
    } else if (totalFiles > 5 || totalLines > 500) {
      estimatedComplexity = 'medium';
    }
    
    // 计算质量分数
    let qualityScore = 100;
    
    // 扣分项
    const filesWithPlaceholders = files.filter(f => f.hasPlaceholders).length;
    const filesWithSyntaxErrors = files.filter(f => !f.syntaxValid).length;
    
    qualityScore -= filesWithPlaceholders * 20; // 每个有占位符的文件扣20分
    qualityScore -= filesWithSyntaxErrors * 15; // 每个有语法错误的文件扣15分
    
    // 加分项
    if (hasTests) qualityScore += 10;
    if (hasDocumentation) qualityScore += 5;
    
    qualityScore = Math.max(0, Math.min(100, qualityScore));
    
    return {
      totalFiles,
      totalLines,
      languages,
      hasTests,
      hasDocumentation,
      estimatedComplexity,
      qualityScore
    };
  }
  
  /**
   * 获取文件类型
   */
  private static getFileType(filePath: string): string {
    const extension = filePath.split('.').pop()?.toLowerCase();
    return extension || 'unknown';
  }
  
  /**
   * 检测编程语言
   */
  private static detectLanguage(filePath: string): string {
    const extension = filePath.split('.').pop()?.toLowerCase();
    const languageMap: Record<string, string> = {
      'ts': 'typescript',
      'tsx': 'typescript',
      'js': 'javascript',
      'jsx': 'javascript',
      'py': 'python',
      'java': 'java',
      'cpp': 'cpp',
      'c': 'c',
      'cs': 'csharp',
      'php': 'php',
      'rb': 'ruby',
      'go': 'go',
      'rs': 'rust',
      'swift': 'swift',
      'kt': 'kotlin',
      'html': 'html',
      'css': 'css',
      'scss': 'scss',
      'sass': 'sass',
      'json': 'json',
      'xml': 'xml',
      'yaml': 'yaml',
      'yml': 'yaml',
      'md': 'markdown',
      'sql': 'sql'
    };
    
    return languageMap[extension || ''] || 'unknown';
  }
  
  /**
   * 检查是否包含占位符
   */
  private static hasPlaceholders(content: string): boolean {
    const placeholderPatterns = [
      /\/\/\s*TODO/i,
      /\/\*\s*TODO/i,
      /\/\/\s*FIXME/i,
      /\/\/\s*PLACEHOLDER/i,
      /\/\/\s*\.\.\./,
      /\/\/\s*实现代码/,
      /\/\/\s*添加代码/,
      /\/\/\s*your code here/i,
      /\/\/\s*implement/i,
      /\.\.\./,
      /placeholder/i,
      /实现/,
      /添加/
    ];
    
    return placeholderPatterns.some(pattern => pattern.test(content));
  }
  
  /**
   * 基本语法验证
   */
  private static validateSyntax(content: string, filePath: string): boolean {
    const language = this.detectLanguage(filePath);
    
    try {
      switch (language) {
        case 'javascript':
        case 'typescript':
          return this.validateJavaScriptSyntax(content);
        case 'json':
          return this.validateJsonSyntax(content);
        default:
          return true; // 对于不支持的语言，假设语法正确
      }
    } catch {
      return false;
    }
  }
  
  /**
   * JavaScript/TypeScript 语法验证
   */
  private static validateJavaScriptSyntax(content: string): boolean {
    // 基本的括号匹配检查
    const brackets = { '(': ')', '[': ']', '{': '}' };
    const stack: string[] = [];
    
    for (const char of content) {
      if (char in brackets) {
        stack.push(brackets[char as keyof typeof brackets]);
      } else if (Object.values(brackets).includes(char)) {
        if (stack.pop() !== char) {
          return false;
        }
      }
    }
    
    return stack.length === 0;
  }
  
  /**
   * JSON 语法验证
   */
  private static validateJsonSyntax(content: string): boolean {
    try {
      JSON.parse(content);
      return true;
    } catch {
      return false;
    }
  }
}
