/**
 * Services Index
 * 
 * Central export point for all Mastra services and convenience functions
 */

// Core services
export { parseMessage, processFiles } from './file-processing';
export { screenshotService, takeScreenshot, takeFullPageScreenshot, takeMobileScreenshot } from './screenshot-service';
export { tokenService, countTokens, calculateTokenCost } from './token-service';
export { textProcessingService } from './text-processing-service';
export { databasePromptService, generateMySQLPrompt, generatePostgreSQLPrompt, generateRedisPrompt, generateMongoDBPrompt, generateSQLitePrompt } from './database-prompt-service';
export { utilityFunctionsService, jsonToZod, processMarkdown, detectLanguage, stripIndents } from './utility-functions-service';
export { cacheService } from './cache-service';
export { performanceService } from './performance-service';

// Types
export type { 
  ParsedMessage,
  FileCollection,
  ProjectType,
  FileStatistics,
  ValidationResult,
} from './file-processing';

export type {
  ScreenshotOptions,
  ScreenshotResult,
  ScreenshotStatus,
} from './screenshot-service';

export type {
  TokenUsage,
  TokenLimits,
  ModelPricing,
  TokenCheckResult,
} from './token-service';

export type {
  PromptConfig,
  DiffResult,
  TextAnalysis,
} from './text-processing-service';

export type {
  DatabaseConfig,
  MySQLConfig,
  PostgreSQLConfig,
  RedisConfig,
  MongoDBConfig,
  SQLiteConfig,
  DatabaseComparison,
} from './database-prompt-service';

export type {
  JsonToZodOptions,
  MarkdownProcessingOptions,
  MarkdownProcessingResult,
  LanguageDetectionResult,
} from './utility-functions-service';

export type {
  CacheMetrics,
  CacheEntry,
} from './cache-service';

export type {
  PerformanceMetrics,
  SystemMetrics,
  PerformanceStats,
} from './performance-service';
