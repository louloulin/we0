/**
 * 代码完整性检查器
 * 
 * 这个模块负责检查生成的代码是否完整、可运行，
 * 确保没有遗漏的实现、缺失的依赖或不完整的功能。
 * 
 * 核心功能：
 * - 依赖分析：检查 import/require 语句的完整性
 * - 函数完整性：验证函数是否有完整的实现
 * - 类型检查：确保 TypeScript 类型定义完整
 * - 配置文件验证：检查 package.json、tsconfig.json 等配置
 * - 项目结构分析：验证项目结构的合理性
 * - 可运行性评估：评估代码是否可以直接运行
 */

import { ExtractedFile } from './bolt-artifact-validator';

/**
 * 代码完整性检查结果接口
 */
export interface CompletenessCheckResult {
  isComplete: boolean;
  completenessScore: number; // 0-100
  issues: CompletenessIssue[];
  suggestions: CompletnessSuggestion[];
  missingFiles: string[];
  missingDependencies: string[];
  projectStructure: ProjectStructureAnalysis;
}

/**
 * 完整性问题接口
 */
export interface CompletenessIssue {
  type: 'missing_dependency' | 'incomplete_function' | 'missing_type' | 'missing_config' | 'structural';
  severity: 'critical' | 'high' | 'medium' | 'low';
  file: string;
  line?: number;
  message: string;
  suggestion: string;
}

/**
 * 完整性建议接口
 */
export interface CompletnessSuggestion {
  type: 'add_file' | 'add_dependency' | 'add_config' | 'improve_structure';
  priority: 'high' | 'medium' | 'low';
  description: string;
  implementation: string;
}

/**
 * 项目结构分析接口
 */
export interface ProjectStructureAnalysis {
  hasPackageJson: boolean;
  hasTypeScriptConfig: boolean;
  hasReadme: boolean;
  hasTests: boolean;
  hasSourceStructure: boolean;
  recommendedStructure: string[];
  currentStructure: string[];
}

/**
 * 代码完整性检查器类
 */
export class CodeCompletenessChecker {
  
  /**
   * 检查代码完整性
   */
  static checkCompleteness(files: ExtractedFile[]): CompletenessCheckResult {
    const issues: CompletenessIssue[] = [];
    const suggestions: CompletnessSuggestion[] = [];
    const missingFiles: string[] = [];
    const missingDependencies: string[] = [];
    
    // 1. 分析项目结构
    const projectStructure = this.analyzeProjectStructure(files);
    
    // 2. 检查依赖完整性
    const dependencyCheck = this.checkDependencies(files);
    issues.push(...dependencyCheck.issues);
    missingDependencies.push(...dependencyCheck.missing);
    
    // 3. 检查函数完整性
    const functionCheck = this.checkFunctionCompleteness(files);
    issues.push(...functionCheck.issues);
    
    // 4. 检查类型完整性
    const typeCheck = this.checkTypeCompleteness(files);
    issues.push(...typeCheck.issues);
    
    // 5. 检查配置文件
    const configCheck = this.checkConfigFiles(files);
    issues.push(...configCheck.issues);
    missingFiles.push(...configCheck.missing);
    
    // 6. 生成改进建议
    suggestions.push(...this.generateSuggestions(files, projectStructure, issues));
    
    // 7. 计算完整性分数
    const completenessScore = this.calculateCompletenessScore(files, issues, projectStructure);
    
    return {
      isComplete: completenessScore >= 80 && issues.filter(i => i.severity === 'critical').length === 0,
      completenessScore,
      issues,
      suggestions,
      missingFiles,
      missingDependencies,
      projectStructure
    };
  }
  
  /**
   * 分析项目结构
   */
  private static analyzeProjectStructure(files: ExtractedFile[]): ProjectStructureAnalysis {
    const filePaths = files.map(f => f.filePath);
    
    const hasPackageJson = filePaths.some(path => path.includes('package.json'));
    const hasTypeScriptConfig = filePaths.some(path => 
      path.includes('tsconfig.json') || path.includes('tsconfig.ts')
    );
    const hasReadme = filePaths.some(path => 
      path.toLowerCase().includes('readme')
    );
    const hasTests = filePaths.some(path => 
      path.includes('test') || path.includes('spec') || path.includes('__tests__')
    );
    const hasSourceStructure = filePaths.some(path => 
      path.includes('src/') || path.includes('lib/')
    );
    
    // 推荐的项目结构
    const recommendedStructure = [
      'package.json',
      'README.md',
      'tsconfig.json',
      'src/',
      'src/index.ts',
      'src/components/',
      'src/utils/',
      'tests/',
      '.gitignore'
    ];
    
    return {
      hasPackageJson,
      hasTypeScriptConfig,
      hasReadme,
      hasTests,
      hasSourceStructure,
      recommendedStructure,
      currentStructure: filePaths
    };
  }
  
  /**
   * 检查依赖完整性
   */
  private static checkDependencies(files: ExtractedFile[]): { issues: CompletenessIssue[], missing: string[] } {
    const issues: CompletenessIssue[] = [];
    const missing: string[] = [];
    const allImports = new Set<string>();
    
    // 提取所有 import 语句
    for (const file of files) {
      if (file.language === 'typescript' || file.language === 'javascript') {
        const imports = this.extractImports(file.content);
        imports.forEach(imp => allImports.add(imp));
      }
    }
    
    // 检查 package.json 是否存在
    const packageJsonFile = files.find(f => f.filePath.includes('package.json'));
    
    if (!packageJsonFile) {
      issues.push({
        type: 'missing_config',
        severity: 'critical',
        file: 'package.json',
        message: '缺少 package.json 文件',
        suggestion: '创建 package.json 文件并添加必要的依赖'
      });
      missing.push('package.json');
    } else {
      // 检查依赖是否在 package.json 中声明
      try {
        const packageJson = JSON.parse(packageJsonFile.content);
        const declaredDeps = new Set([
          ...Object.keys(packageJson.dependencies || {}),
          ...Object.keys(packageJson.devDependencies || {})
        ]);
        
        for (const importPath of allImports) {
          if (!this.isBuiltinModule(importPath) && !this.isRelativeImport(importPath)) {
            const packageName = this.extractPackageName(importPath);
            if (!declaredDeps.has(packageName)) {
              issues.push({
                type: 'missing_dependency',
                severity: 'high',
                file: packageJsonFile.filePath,
                message: `缺少依赖: ${packageName}`,
                suggestion: `在 package.json 中添加 "${packageName}" 依赖`
              });
              missing.push(packageName);
            }
          }
        }
      } catch (error) {
        issues.push({
          type: 'missing_config',
          severity: 'high',
          file: packageJsonFile.filePath,
          message: 'package.json 格式错误',
          suggestion: '修复 package.json 的 JSON 格式'
        });
      }
    }
    
    return { issues, missing };
  }
  
  /**
   * 检查函数完整性
   */
  private static checkFunctionCompleteness(files: ExtractedFile[]): { issues: CompletenessIssue[] } {
    const issues: CompletenessIssue[] = [];
    
    for (const file of files) {
      if (file.language === 'typescript' || file.language === 'javascript') {
        const functions = this.extractFunctions(file.content);
        
        for (const func of functions) {
          if (this.isFunctionIncomplete(func.body)) {
            issues.push({
              type: 'incomplete_function',
              severity: 'medium',
              file: file.filePath,
              line: func.line,
              message: `函数 ${func.name} 实现不完整`,
              suggestion: '完善函数实现，移除占位符和 TODO'
            });
          }
        }
      }
    }
    
    return { issues };
  }
  
  /**
   * 检查类型完整性
   */
  private static checkTypeCompleteness(files: ExtractedFile[]): { issues: CompletenessIssue[] } {
    const issues: CompletenessIssue[] = [];
    
    for (const file of files) {
      if (file.language === 'typescript') {
        // 检查是否有 any 类型
        const anyTypeMatches = file.content.match(/:\s*any\b/g);
        if (anyTypeMatches && anyTypeMatches.length > 0) {
          issues.push({
            type: 'missing_type',
            severity: 'low',
            file: file.filePath,
            message: `发现 ${anyTypeMatches.length} 个 any 类型`,
            suggestion: '为变量和函数添加具体的类型定义'
          });
        }
        
        // 检查未定义的类型
        const typeUsages = file.content.match(/:\s*([A-Z][a-zA-Z0-9]*)/g);
        if (typeUsages) {
          for (const usage of typeUsages) {
            const typeName = usage.replace(':', '').trim();
            if (!this.isBuiltinType(typeName) && !file.content.includes(`interface ${typeName}`) && !file.content.includes(`type ${typeName}`)) {
              issues.push({
                type: 'missing_type',
                severity: 'medium',
                file: file.filePath,
                message: `未定义的类型: ${typeName}`,
                suggestion: `定义 ${typeName} 接口或类型`
              });
            }
          }
        }
      }
    }
    
    return { issues };
  }
  
  /**
   * 检查配置文件
   */
  private static checkConfigFiles(files: ExtractedFile[]): { issues: CompletenessIssue[], missing: string[] } {
    const issues: CompletenessIssue[] = [];
    const missing: string[] = [];
    
    const requiredConfigs = [
      { name: 'package.json', critical: true },
      { name: 'tsconfig.json', critical: false },
      { name: 'README.md', critical: false }
    ];
    
    for (const config of requiredConfigs) {
      const exists = files.some(f => f.filePath.includes(config.name));
      if (!exists) {
        issues.push({
          type: 'missing_config',
          severity: config.critical ? 'critical' : 'medium',
          file: config.name,
          message: `缺少 ${config.name} 文件`,
          suggestion: `创建 ${config.name} 文件`
        });
        missing.push(config.name);
      }
    }
    
    return { issues, missing };
  }
  
  /**
   * 生成改进建议
   */
  private static generateSuggestions(
    files: ExtractedFile[], 
    structure: ProjectStructureAnalysis, 
    issues: CompletenessIssue[]
  ): CompletnessSuggestion[] {
    const suggestions: CompletnessSuggestion[] = [];
    
    // 结构改进建议
    if (!structure.hasSourceStructure) {
      suggestions.push({
        type: 'improve_structure',
        priority: 'high',
        description: '建议使用标准的源码目录结构',
        implementation: '创建 src/ 目录并将源码文件移入其中'
      });
    }
    
    if (!structure.hasTests) {
      suggestions.push({
        type: 'add_file',
        priority: 'medium',
        description: '添加测试文件',
        implementation: '创建 tests/ 目录并添加单元测试'
      });
    }
    
    if (!structure.hasReadme) {
      suggestions.push({
        type: 'add_file',
        priority: 'medium',
        description: '添加项目文档',
        implementation: '创建 README.md 文件，包含项目说明和使用方法'
      });
    }
    
    // 基于问题的建议
    const criticalIssues = issues.filter(i => i.severity === 'critical');
    if (criticalIssues.length > 0) {
      suggestions.push({
        type: 'add_config',
        priority: 'high',
        description: '修复关键配置问题',
        implementation: '添加缺失的配置文件并修复配置错误'
      });
    }
    
    return suggestions;
  }
  
  /**
   * 计算完整性分数
   */
  private static calculateCompletenessScore(
    files: ExtractedFile[], 
    issues: CompletenessIssue[], 
    structure: ProjectStructureAnalysis
  ): number {
    let score = 100;
    
    // 根据问题严重程度扣分
    for (const issue of issues) {
      switch (issue.severity) {
        case 'critical':
          score -= 25;
          break;
        case 'high':
          score -= 15;
          break;
        case 'medium':
          score -= 10;
          break;
        case 'low':
          score -= 5;
          break;
      }
    }
    
    // 根据项目结构加分
    if (structure.hasPackageJson) score += 5;
    if (structure.hasTypeScriptConfig) score += 5;
    if (structure.hasReadme) score += 5;
    if (structure.hasTests) score += 10;
    if (structure.hasSourceStructure) score += 5;
    
    return Math.max(0, Math.min(100, score));
  }
  
  // 辅助方法
  private static extractImports(content: string): string[] {
    const imports: string[] = [];
    const importRegex = /import\s+.*?\s+from\s+['"]([^'"]+)['"]/g;
    const requireRegex = /require\(['"]([^'"]+)['"]\)/g;
    
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }
    
    while ((match = requireRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }
    
    return imports;
  }
  
  private static extractFunctions(content: string): Array<{ name: string, body: string, line: number }> {
    const functions: Array<{ name: string, body: string, line: number }> = [];
    const functionRegex = /function\s+(\w+)\s*\([^)]*\)\s*\{([^}]*)\}/g;
    const arrowFunctionRegex = /const\s+(\w+)\s*=\s*\([^)]*\)\s*=>\s*\{([^}]*)\}/g;
    
    let match;
    let lineNumber = 1;
    
    while ((match = functionRegex.exec(content)) !== null) {
      functions.push({
        name: match[1],
        body: match[2],
        line: lineNumber
      });
    }
    
    while ((match = arrowFunctionRegex.exec(content)) !== null) {
      functions.push({
        name: match[1],
        body: match[2],
        line: lineNumber
      });
    }
    
    return functions;
  }
  
  private static isFunctionIncomplete(body: string): boolean {
    const incompletePatterns = [
      /\/\/\s*TODO/i,
      /\/\/\s*FIXME/i,
      /\/\/\s*实现/,
      /throw\s+new\s+Error\(['"]Not implemented['"]\)/i,
      /return\s*;?\s*$/,
      /^\s*$/
    ];
    
    return incompletePatterns.some(pattern => pattern.test(body.trim()));
  }
  
  private static isBuiltinModule(moduleName: string): boolean {
    const builtinModules = [
      'fs', 'path', 'http', 'https', 'url', 'crypto', 'os', 'util',
      'events', 'stream', 'buffer', 'child_process', 'cluster'
    ];
    return builtinModules.includes(moduleName);
  }
  
  private static isRelativeImport(importPath: string): boolean {
    return importPath.startsWith('./') || importPath.startsWith('../');
  }
  
  private static extractPackageName(importPath: string): string {
    if (importPath.startsWith('@')) {
      const parts = importPath.split('/');
      return parts.slice(0, 2).join('/');
    }
    return importPath.split('/')[0];
  }
  
  private static isBuiltinType(typeName: string): boolean {
    const builtinTypes = [
      'string', 'number', 'boolean', 'object', 'undefined', 'null',
      'Array', 'Object', 'Function', 'Date', 'RegExp', 'Error',
      'Promise', 'Map', 'Set', 'WeakMap', 'WeakSet'
    ];
    return builtinTypes.includes(typeName);
  }
}
