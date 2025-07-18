/**
 * TagX指令体系 - 下一代智能编程助手指令解析器
 * 
 * 基于tagx.md规范，融合多系统优势：
 * - MastraCode: 完整的工具调用框架
 * - we-dev-next: boltArtifact项目生成
 * - Claude Code: 智能代码分析
 * - Cursor: 实时代码补全
 * - Augment Code: 企业级质量保证
 */

export * from './parser';
export * from './types';
export * from './executor';
export * from './validators';
export * from './handlers';

// 导出主要的TagX处理器
export { TagXProcessor } from './processor';

// 导出常用的TagX标签处理器
export {
  SmartCodeGenHandler,
  BoltArtifactHandler,
  AgentWorkflowHandler,
  QualityCheckHandler,
  SmartRefactorHandler,
  BatchFileOpsHandler
} from './handlers';

// 导出TagX工具集成
export { createTagXTool } from './tools';

// 导出TagX中间件
export { tagXMiddleware } from './middleware';
