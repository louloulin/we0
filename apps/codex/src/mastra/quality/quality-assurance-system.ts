/**
 * 质量保证系统 - 主入口
 * 
 * 这个模块是整个质量保证系统的主入口，集成了所有质量检查、
 * 验证和错误处理功能，为智能编程系统提供全面的质量保证。
 * 
 * 核心功能：
 * - 统一的质量检查接口
 * - 多层次的验证流程
 * - 智能的错误处理和恢复
 * - 质量报告生成
 * - 持续的质量改进
 */

import { RuntimeContext } from '@mastra/core/runtime-context';
import { 
  BoltArtifactValidator, 
  BoltArtifactValidationResult 
} from './bolt-artifact-validator';
import { 
  CodeCompletenessChecker, 
  CompletenessCheckResult 
} from './code-completeness-checker';
import { 
  ErrorRecoverySystem, 
  ErrorType, 
  ErrorSeverity, 
  RecoveryResult 
} from './error-recovery-system';

/**
 * 质量保证结果接口
 */
export interface QualityAssuranceResult {
  overallQuality: 'excellent' | 'good' | 'fair' | 'poor';
  qualityScore: number; // 0-100
  validationResult: BoltArtifactValidationResult;
  completenessResult: CompletenessCheckResult;
  recoveryResult?: RecoveryResult;
  recommendations: QualityRecommendation[];
  finalContent: string;
  processingTime: number;
  metadata: QualityMetadata;
}

/**
 * 质量建议接口
 */
export interface QualityRecommendation {
  type: 'critical' | 'improvement' | 'optimization' | 'best-practice';
  title: string;
  description: string;
  implementation: string;
  priority: 'high' | 'medium' | 'low';
  estimatedImpact: 'high' | 'medium' | 'low';
}

/**
 * 质量元数据接口
 */
export interface QualityMetadata {
  timestamp: Date;
  processingSteps: string[];
  errorsEncountered: number;
  autoFixesApplied: number;
  fallbacksUsed: number;
  userInterventionsRequired: number;
  performanceMetrics: {
    validationTime: number;
    completenessCheckTime: number;
    errorRecoveryTime: number;
    totalTime: number;
  };
}

/**
 * 质量保证配置接口
 */
export interface QualityAssuranceConfig {
  enableValidation: boolean;
  enableCompletenessCheck: boolean;
  enableErrorRecovery: boolean;
  enableAutoFix: boolean;
  strictMode: boolean;
  timeoutMs: number;
  maxRetries: number;
}

/**
 * 质量保证系统类
 */
export class QualityAssuranceSystem {
  
  private static defaultConfig: QualityAssuranceConfig = {
    enableValidation: true,
    enableCompletenessCheck: true,
    enableErrorRecovery: true,
    enableAutoFix: true,
    strictMode: false,
    timeoutMs: 30000,
    maxRetries: 3
  };
  
  /**
   * 执行完整的质量保证流程
   */
  static async ensureQuality(
    content: string,
    context?: RuntimeContext,
    config: Partial<QualityAssuranceConfig> = {}
  ): Promise<QualityAssuranceResult> {
    
    const startTime = Date.now();
    const finalConfig = { ...this.defaultConfig, ...config };
    const processingSteps: string[] = [];
    const performanceMetrics = {
      validationTime: 0,
      completenessCheckTime: 0,
      errorRecoveryTime: 0,
      totalTime: 0
    };
    
    let finalContent = content;
    let validationResult: BoltArtifactValidationResult;
    let completenessResult: CompletenessCheckResult;
    let recoveryResult: RecoveryResult | undefined;
    let errorsEncountered = 0;
    let autoFixesApplied = 0;
    let fallbacksUsed = 0;
    let userInterventionsRequired = 0;
    
    try {
      console.log('🔍 开始质量保证流程...');
      
      // 1. boltArtifact 格式验证
      if (finalConfig.enableValidation) {
        processingSteps.push('boltArtifact 格式验证');
        const validationStart = Date.now();
        
        validationResult = BoltArtifactValidator.validate(finalContent);
        performanceMetrics.validationTime = Date.now() - validationStart;
        
        console.log(`📋 验证结果: ${validationResult.isValid ? '✅ 通过' : '❌ 失败'}`);
        console.log(`   - 错误数量: ${validationResult.errors.length}`);
        console.log(`   - 警告数量: ${validationResult.warnings.length}`);
        console.log(`   - 提取文件: ${validationResult.extractedFiles.length}`);
        
        // 处理验证错误
        if (!validationResult.isValid && finalConfig.enableAutoFix) {
          if (validationResult.fixedContent) {
            finalContent = validationResult.fixedContent;
            autoFixesApplied++;
            console.log('🔧 已应用自动修复');
          } else if (finalConfig.enableErrorRecovery) {
            const errorRecoveryStart = Date.now();
            recoveryResult = await ErrorRecoverySystem.handleError(
              new Error('boltArtifact 验证失败'),
              context,
              validationResult
            );
            performanceMetrics.errorRecoveryTime += Date.now() - errorRecoveryStart;
            
            if (recoveryResult.success && recoveryResult.fixedContent) {
              finalContent = recoveryResult.fixedContent;
              autoFixesApplied++;
            } else if (recoveryResult.fallbackContent) {
              finalContent = recoveryResult.fallbackContent;
              fallbacksUsed++;
            }
            errorsEncountered++;
          }
        }
      } else {
        // 如果不启用验证，创建一个基本的验证结果
        validationResult = {
          isValid: true,
          errors: [],
          warnings: [],
          extractedFiles: [],
          metadata: {
            totalFiles: 0,
            totalLines: 0,
            languages: [],
            hasTests: false,
            hasDocumentation: false,
            estimatedComplexity: 'low',
            qualityScore: 100
          }
        };
      }
      
      // 2. 代码完整性检查
      if (finalConfig.enableCompletenessCheck && validationResult.extractedFiles.length > 0) {
        processingSteps.push('代码完整性检查');
        const completenessStart = Date.now();
        
        completenessResult = CodeCompletenessChecker.checkCompleteness(validationResult.extractedFiles);
        performanceMetrics.completenessCheckTime = Date.now() - completenessStart;
        
        console.log(`🔍 完整性检查结果: ${completenessResult.isComplete ? '✅ 完整' : '❌ 不完整'}`);
        console.log(`   - 完整性分数: ${completenessResult.completenessScore}/100`);
        console.log(`   - 问题数量: ${completenessResult.issues.length}`);
        console.log(`   - 缺失依赖: ${completenessResult.missingDependencies.length}`);
        
        // 处理完整性问题
        if (!completenessResult.isComplete && finalConfig.enableErrorRecovery) {
          const errorRecoveryStart = Date.now();
          recoveryResult = await ErrorRecoverySystem.handleError(
            new Error('代码完整性检查失败'),
            context,
            validationResult,
            completenessResult
          );
          performanceMetrics.errorRecoveryTime += Date.now() - errorRecoveryStart;
          
          if (recoveryResult.success && recoveryResult.fixedContent) {
            finalContent = recoveryResult.fixedContent;
            autoFixesApplied++;
          } else if (recoveryResult.fallbackContent) {
            finalContent = recoveryResult.fallbackContent;
            fallbacksUsed++;
          }
          errorsEncountered++;
        }
      } else {
        // 如果不启用完整性检查，创建一个基本的结果
        completenessResult = {
          isComplete: true,
          completenessScore: 100,
          issues: [],
          suggestions: [],
          missingFiles: [],
          missingDependencies: [],
          projectStructure: {
            hasPackageJson: false,
            hasTypeScriptConfig: false,
            hasReadme: false,
            hasTests: false,
            hasSourceStructure: false,
            recommendedStructure: [],
            currentStructure: []
          }
        };
      }
      
      // 3. 生成质量建议
      const recommendations = this.generateRecommendations(
        validationResult,
        completenessResult,
        finalConfig
      );
      
      // 4. 计算总体质量分数和等级
      const qualityScore = this.calculateOverallQualityScore(
        validationResult,
        completenessResult
      );
      const overallQuality = this.determineQualityLevel(qualityScore);
      
      // 5. 生成元数据
      const totalTime = Date.now() - startTime;
      performanceMetrics.totalTime = totalTime;
      
      const metadata: QualityMetadata = {
        timestamp: new Date(),
        processingSteps,
        errorsEncountered,
        autoFixesApplied,
        fallbacksUsed,
        userInterventionsRequired,
        performanceMetrics
      };
      
      console.log(`✅ 质量保证流程完成 (${totalTime}ms)`);
      console.log(`   - 总体质量: ${overallQuality} (${qualityScore}/100)`);
      console.log(`   - 处理步骤: ${processingSteps.length}`);
      console.log(`   - 自动修复: ${autoFixesApplied}`);
      console.log(`   - 回退使用: ${fallbacksUsed}`);
      
      return {
        overallQuality,
        qualityScore,
        validationResult,
        completenessResult,
        recoveryResult,
        recommendations,
        finalContent,
        processingTime: totalTime,
        metadata
      };
      
    } catch (error) {
      console.error('❌ 质量保证流程出错:', error);
      
      // 紧急回退处理
      if (finalConfig.enableErrorRecovery) {
        const errorRecoveryStart = Date.now();
        recoveryResult = await ErrorRecoverySystem.handleError(
          error as Error,
          context
        );
        performanceMetrics.errorRecoveryTime += Date.now() - errorRecoveryStart;
        
        if (recoveryResult.fallbackContent) {
          finalContent = recoveryResult.fallbackContent;
          fallbacksUsed++;
        }
      }
      
      // 返回降级的结果
      return {
        overallQuality: 'poor',
        qualityScore: 0,
        validationResult: validationResult! || {
          isValid: false,
          errors: [{ type: 'structure', message: '质量保证流程失败', severity: 'critical' }],
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
        },
        completenessResult: completenessResult! || {
          isComplete: false,
          completenessScore: 0,
          issues: [],
          suggestions: [],
          missingFiles: [],
          missingDependencies: [],
          projectStructure: {
            hasPackageJson: false,
            hasTypeScriptConfig: false,
            hasReadme: false,
            hasTests: false,
            hasSourceStructure: false,
            recommendedStructure: [],
            currentStructure: []
          }
        },
        recoveryResult,
        recommendations: [],
        finalContent,
        processingTime: Date.now() - startTime,
        metadata: {
          timestamp: new Date(),
          processingSteps,
          errorsEncountered: errorsEncountered + 1,
          autoFixesApplied,
          fallbacksUsed,
          userInterventionsRequired,
          performanceMetrics
        }
      };
    }
  }
  
  /**
   * 生成质量建议
   */
  private static generateRecommendations(
    validationResult: BoltArtifactValidationResult,
    completenessResult: CompletenessCheckResult,
    config: QualityAssuranceConfig
  ): QualityRecommendation[] {
    
    const recommendations: QualityRecommendation[] = [];
    
    // 基于验证结果的建议
    if (validationResult.errors.length > 0) {
      recommendations.push({
        type: 'critical',
        title: '修复格式错误',
        description: `发现 ${validationResult.errors.length} 个格式错误需要修复`,
        implementation: '检查 boltArtifact XML 格式，确保标签正确闭合',
        priority: 'high',
        estimatedImpact: 'high'
      });
    }
    
    // 基于完整性结果的建议
    if (completenessResult.missingDependencies.length > 0) {
      recommendations.push({
        type: 'improvement',
        title: '添加缺失依赖',
        description: `需要添加 ${completenessResult.missingDependencies.length} 个依赖`,
        implementation: `在 package.json 中添加: ${completenessResult.missingDependencies.join(', ')}`,
        priority: 'high',
        estimatedImpact: 'high'
      });
    }
    
    if (!completenessResult.projectStructure.hasTests) {
      recommendations.push({
        type: 'best-practice',
        title: '添加测试文件',
        description: '项目缺少测试文件，建议添加单元测试',
        implementation: '创建 tests/ 目录并添加测试文件',
        priority: 'medium',
        estimatedImpact: 'medium'
      });
    }
    
    if (!completenessResult.projectStructure.hasReadme) {
      recommendations.push({
        type: 'best-practice',
        title: '添加项目文档',
        description: '项目缺少 README 文档',
        implementation: '创建 README.md 文件，包含项目说明和使用方法',
        priority: 'medium',
        estimatedImpact: 'low'
      });
    }
    
    // 性能优化建议
    if (validationResult.metadata.totalFiles > 20) {
      recommendations.push({
        type: 'optimization',
        title: '考虑模块化',
        description: '项目文件较多，建议进行模块化重构',
        implementation: '将相关功能组织到独立的模块中',
        priority: 'low',
        estimatedImpact: 'medium'
      });
    }
    
    return recommendations;
  }
  
  /**
   * 计算总体质量分数
   */
  private static calculateOverallQualityScore(
    validationResult: BoltArtifactValidationResult,
    completenessResult: CompletenessCheckResult
  ): number {
    
    const validationScore = validationResult.metadata.qualityScore;
    const completenessScore = completenessResult.completenessScore;
    
    // 加权平均：验证占40%，完整性占60%
    const weightedScore = (validationScore * 0.4) + (completenessScore * 0.6);
    
    return Math.round(weightedScore);
  }
  
  /**
   * 确定质量等级
   */
  private static determineQualityLevel(score: number): 'excellent' | 'good' | 'fair' | 'poor' {
    if (score >= 90) return 'excellent';
    if (score >= 75) return 'good';
    if (score >= 60) return 'fair';
    return 'poor';
  }
  
  /**
   * 快速质量检查（用于实时验证）
   */
  static quickCheck(content: string): { isValid: boolean, score: number, issues: string[] } {
    const validationResult = BoltArtifactValidator.validate(content);
    
    const issues: string[] = [];
    validationResult.errors.forEach(error => {
      if (error.severity === 'critical' || error.severity === 'high') {
        issues.push(error.message);
      }
    });
    
    return {
      isValid: validationResult.isValid,
      score: validationResult.metadata.qualityScore,
      issues
    };
  }
}
