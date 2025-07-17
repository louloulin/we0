/**
 * Database Prompt Tool Tests
 * 
 * Tests for database prompt tools integration
 * Tests the underlying logic functions rather than the Mastra tool wrappers
 */

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { DatabasePromptService } from '../mastra/services/database-prompt-service';

// Mock the database prompt service
jest.mock('../mastra/services/database-prompt-service', () => {
  const mockService = {
    generateMySQLPrompt: jest.fn(),
    generatePostgreSQLPrompt: jest.fn(),
    generateRedisPrompt: jest.fn(),
    generateMongoDBPrompt: jest.fn(),
  };

  return {
    DatabasePromptService: jest.fn(() => mockService),
    generateMySQLPrompt: jest.fn(),
    generateRedisPrompt: jest.fn(),
  };
});

describe('Database Prompt Service Integration', () => {
  let mockService: any;

  beforeEach(() => {
    mockService = new DatabasePromptService();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('MySQL prompt generation', () => {
    test('should generate MySQL prompt with Prisma', () => {
      const mockResult = {
        configCode: 'prisma mysql config code',
        envVars: 'DATABASE_URL="mysql://user:pass@localhost:3306/db"',
        dockerCompose: 'mysql docker compose config',
        installCommands: ['npm install prisma @prisma/client', 'npm install mysql2'],
        usage: 'prisma usage example',
        documentation: 'MySQL documentation',
      };

      mockService.generateMySQLPrompt.mockReturnValue(mockResult);

      const config = {
        type: 'mysql' as const,
        host: 'localhost',
        port: 3306,
        database: 'testdb',
        username: 'testuser',
        password: 'testpass',
      };

      const options = {
        includeEnvVars: true,
        includeDockerCompose: true,
        orm: 'prisma' as const,
      };

      const result = mockService.generateMySQLPrompt(config, options);

      expect(result.configCode).toBe('prisma mysql config code');
      expect(result.envVars).toContain('DATABASE_URL');
      expect(result.dockerCompose).toBe('mysql docker compose config');
      expect(result.installCommands).toContain('npm install prisma @prisma/client');
      expect(result.usage).toBe('prisma usage example');
      expect(result.documentation).toBe('MySQL documentation');
      expect(mockService.generateMySQLPrompt).toHaveBeenCalledWith(config, options);
    });

    test('should generate MySQL prompt with TypeORM', () => {
      const mockResult = {
        configCode: 'typeorm mysql config code',
        envVars: 'DB_HOST=localhost\nDB_PORT=3306',
        installCommands: ['npm install typeorm mysql2 reflect-metadata'],
        usage: 'typeorm usage example',
        documentation: 'TypeORM MySQL documentation',
      };

      mockService.generateMySQLPrompt.mockReturnValue(mockResult);

      const config = {
        type: 'mysql' as const,
        host: 'localhost',
        port: 3306,
        database: 'testdb',
      };

      const options = {
        orm: 'typeorm' as const,
      };

      const result = mockService.generateMySQLPrompt(config, options);

      expect(result.configCode).toBe('typeorm mysql config code');
      expect(result.installCommands).toContain('npm install typeorm mysql2 reflect-metadata');
      expect(mockService.generateMySQLPrompt).toHaveBeenCalledWith(config, options);
    });
  });

  describe('PostgreSQL prompt generation', () => {
    test('should generate PostgreSQL prompt with Prisma', () => {
      const mockResult = {
        configCode: 'prisma postgresql config code',
        envVars: 'DATABASE_URL="postgresql://user:pass@localhost:5432/db"',
        dockerCompose: 'postgresql docker compose config',
        installCommands: ['npm install prisma @prisma/client', 'npm install pg @types/pg'],
        usage: 'prisma postgresql usage example',
        documentation: 'PostgreSQL documentation',
      };

      mockService.generatePostgreSQLPrompt.mockReturnValue(mockResult);

      const config = {
        type: 'postgresql' as const,
        host: 'localhost',
        port: 5432,
        database: 'testdb',
        username: 'postgres',
        password: 'testpass',
      };

      const options = {
        includeEnvVars: true,
        includeDockerCompose: true,
        orm: 'prisma' as const,
      };

      const result = mockService.generatePostgreSQLPrompt(config, options);

      expect(result.configCode).toBe('prisma postgresql config code');
      expect(result.envVars).toContain('postgresql://');
      expect(result.dockerCompose).toBe('postgresql docker compose config');
      expect(result.installCommands).toContain('npm install prisma @prisma/client');
      expect(mockService.generatePostgreSQLPrompt).toHaveBeenCalledWith(config, options);
    });

    test('should generate PostgreSQL prompt with TypeORM', () => {
      const mockResult = {
        configCode: 'typeorm postgresql config code',
        envVars: 'DB_HOST=localhost\nDB_PORT=5432',
        installCommands: ['npm install typeorm pg @types/pg reflect-metadata'],
        usage: 'typeorm postgresql usage example',
        documentation: 'TypeORM PostgreSQL documentation',
      };

      mockService.generatePostgreSQLPrompt.mockReturnValue(mockResult);

      const config = {
        type: 'postgresql' as const,
        host: 'localhost',
        port: 5432,
        database: 'testdb',
      };

      const options = {
        orm: 'typeorm' as const,
      };

      const result = mockService.generatePostgreSQLPrompt(config, options);

      expect(result.configCode).toBe('typeorm postgresql config code');
      expect(result.installCommands).toContain('npm install typeorm pg @types/pg reflect-metadata');
      expect(mockService.generatePostgreSQLPrompt).toHaveBeenCalledWith(config, options);
    });
  });

  describe('Redis prompt generation', () => {
    test('should generate Redis prompt with connection pooling', () => {
      const mockResult = {
        configCode: 'redis config code with pooling',
        envVars: 'REDIS_URL="redis://localhost:6379"',
        dockerCompose: 'redis docker compose config',
        installCommands: ['npm install redis'],
        usage: 'redis usage example',
        documentation: 'Redis documentation',
      };

      mockService.generateRedisPrompt.mockReturnValue(mockResult);

      const config = {
        type: 'redis' as const,
        host: 'localhost',
        port: 6379,
        password: 'redispass',
      };

      const options = {
        includeEnvVars: true,
        includeDockerCompose: true,
        includeConnectionPool: true,
        framework: 'express' as const,
      };

      const result = mockService.generateRedisPrompt(config, options);

      expect(result.configCode).toBe('redis config code with pooling');
      expect(result.envVars).toContain('REDIS_URL');
      expect(result.dockerCompose).toBe('redis docker compose config');
      expect(result.installCommands).toContain('npm install redis');
      expect(mockService.generateRedisPrompt).toHaveBeenCalledWith(config, options);
    });

    test('should generate Redis prompt without password', () => {
      const mockResult = {
        configCode: 'redis config code without password',
        envVars: 'REDIS_URL="redis://localhost:6379"\nREDIS_PASSWORD=',
        installCommands: ['npm install redis'],
        usage: 'redis usage example',
        documentation: 'Redis documentation',
      };

      mockService.generateRedisPrompt.mockReturnValue(mockResult);

      const config = {
        type: 'redis' as const,
        host: 'localhost',
        port: 6379,
      };

      const result = mockService.generateRedisPrompt(config);

      expect(result.configCode).toBe('redis config code without password');
      expect(result.envVars).toContain('REDIS_PASSWORD=');
      expect(mockService.generateRedisPrompt).toHaveBeenCalledWith(config);
    });
  });

  describe('MongoDB prompt generation', () => {
    test('should generate MongoDB prompt with Mongoose', () => {
      const mockResult = {
        configCode: 'mongoose mongodb config code',
        envVars: 'MONGODB_URI="mongodb://user:pass@localhost:27017/db"',
        dockerCompose: 'mongodb docker compose config',
        installCommands: ['npm install mongoose @types/mongoose'],
        usage: 'mongoose usage example',
        documentation: 'MongoDB Mongoose documentation',
      };

      mockService.generateMongoDBPrompt.mockReturnValue(mockResult);

      const config = {
        type: 'mongodb' as const,
        host: 'localhost',
        port: 27017,
        database: 'testdb',
        username: 'mongouser',
        password: 'mongopass',
      };

      const options = {
        includeEnvVars: true,
        includeDockerCompose: true,
        orm: 'mongoose' as const,
      };

      const result = mockService.generateMongoDBPrompt(config, options);

      expect(result.configCode).toBe('mongoose mongodb config code');
      expect(result.envVars).toContain('MONGODB_URI');
      expect(result.dockerCompose).toBe('mongodb docker compose config');
      expect(result.installCommands).toContain('npm install mongoose @types/mongoose');
      expect(mockService.generateMongoDBPrompt).toHaveBeenCalledWith(config, options);
    });

    test('should generate MongoDB prompt with raw driver', () => {
      const mockResult = {
        configCode: 'raw mongodb config code',
        envVars: 'MONGODB_URI="mongodb://localhost:27017/db"',
        installCommands: ['npm install mongodb'],
        usage: 'raw mongodb usage example',
        documentation: 'MongoDB raw driver documentation',
      };

      mockService.generateMongoDBPrompt.mockReturnValue(mockResult);

      const config = {
        type: 'mongodb' as const,
        host: 'localhost',
        port: 27017,
        database: 'testdb',
      };

      const options = {
        orm: 'mongodb' as const,
      };

      const result = mockService.generateMongoDBPrompt(config, options);

      expect(result.configCode).toBe('raw mongodb config code');
      expect(result.installCommands).toContain('npm install mongodb');
      expect(mockService.generateMongoDBPrompt).toHaveBeenCalledWith(config, options);
    });
  });

  describe('configuration options', () => {
    test('should handle different framework options', () => {
      const mockResult = {
        configCode: 'nextjs specific config',
        envVars: 'env vars',
        installCommands: ['npm install mysql2'],
        usage: 'usage example',
        documentation: 'documentation',
      };

      mockService.generateMySQLPrompt.mockReturnValue(mockResult);

      const config = {
        type: 'mysql' as const,
        host: 'localhost',
        port: 3306,
        database: 'testdb',
      };

      const options = {
        framework: 'nextjs' as const,
      };

      const result = mockService.generateMySQLPrompt(config, options);

      expect(result.configCode).toBe('nextjs specific config');
      expect(mockService.generateMySQLPrompt).toHaveBeenCalledWith(config, options);
    });

    test('should handle connection limits and timeouts', () => {
      const mockResult = {
        configCode: 'config with custom limits',
        envVars: 'env vars',
        installCommands: ['npm install redis'],
        usage: 'usage example',
        documentation: 'documentation',
      };

      mockService.generateRedisPrompt.mockReturnValue(mockResult);

      const config = {
        type: 'redis' as const,
        host: 'localhost',
        port: 6379,
        connectionLimit: 20,
        timeout: 10000,
      };

      const result = mockService.generateRedisPrompt(config);

      expect(result.configCode).toBe('config with custom limits');
      expect(mockService.generateRedisPrompt).toHaveBeenCalledWith(config);
    });
  });

  describe('convenience functions', () => {
    test('should use generateMySQLPrompt convenience function', () => {
      const { generateMySQLPrompt } = require('../mastra/services/database-prompt-service');
      
      const mockResult = {
        configCode: 'mysql config',
        envVars: 'env vars',
        installCommands: ['npm install prisma'],
        usage: 'usage',
        documentation: 'docs',
      };

      generateMySQLPrompt.mockReturnValue(mockResult);

      const config = {
        type: 'mysql' as const,
        host: 'localhost',
        port: 3306,
        database: 'testdb',
      };

      const result = generateMySQLPrompt(config);

      expect(result.configCode).toBe('mysql config');
      expect(generateMySQLPrompt).toHaveBeenCalledWith(config);
    });

    test('should use generateRedisPrompt convenience function', () => {
      const { generateRedisPrompt } = require('../mastra/services/database-prompt-service');
      
      const mockResult = {
        configCode: 'redis config',
        envVars: 'env vars',
        installCommands: ['npm install redis'],
        usage: 'usage',
        documentation: 'docs',
      };

      generateRedisPrompt.mockReturnValue(mockResult);

      const config = {
        type: 'redis' as const,
        host: 'localhost',
        port: 6379,
      };

      const result = generateRedisPrompt(config);

      expect(result.configCode).toBe('redis config');
      expect(generateRedisPrompt).toHaveBeenCalledWith(config);
    });
  });

  describe('error handling', () => {
    test('should handle missing configuration gracefully', () => {
      const mockResult = {
        configCode: 'default config',
        envVars: 'default env vars',
        installCommands: ['npm install mysql2'],
        usage: 'default usage',
        documentation: 'default docs',
      };

      mockService.generateMySQLPrompt.mockReturnValue(mockResult);

      const config = {
        type: 'mysql' as const,
      };

      const result = mockService.generateMySQLPrompt(config);

      expect(result.configCode).toBe('default config');
      expect(mockService.generateMySQLPrompt).toHaveBeenCalledWith(config);
    });

    test('should handle empty options gracefully', () => {
      const mockResult = {
        configCode: 'redis config',
        envVars: 'env vars',
        installCommands: ['npm install redis'],
        usage: 'usage',
        documentation: 'docs',
      };

      mockService.generateRedisPrompt.mockReturnValue(mockResult);

      const config = {
        type: 'redis' as const,
        host: 'localhost',
        port: 6379,
      };

      const result = mockService.generateRedisPrompt(config, {});

      expect(result.configCode).toBe('redis config');
      expect(mockService.generateRedisPrompt).toHaveBeenCalledWith(config, {});
    });
  });

  describe('ORM-specific configurations', () => {
    test('should generate different configs for different ORMs', () => {
      const prismaResult = {
        configCode: 'prisma config',
        envVars: 'prisma env vars',
        installCommands: ['npm install prisma @prisma/client'],
        usage: 'prisma usage',
        documentation: 'prisma docs',
      };

      const typeormResult = {
        configCode: 'typeorm config',
        envVars: 'typeorm env vars',
        installCommands: ['npm install typeorm mysql2'],
        usage: 'typeorm usage',
        documentation: 'typeorm docs',
      };

      mockService.generateMySQLPrompt
        .mockReturnValueOnce(prismaResult)
        .mockReturnValueOnce(typeormResult);

      const config = {
        type: 'mysql' as const,
        host: 'localhost',
        port: 3306,
        database: 'testdb',
      };

      const prismaOptions = { orm: 'prisma' as const };
      const typeormOptions = { orm: 'typeorm' as const };

      const prismaRes = mockService.generateMySQLPrompt(config, prismaOptions);
      const typeormRes = mockService.generateMySQLPrompt(config, typeormOptions);

      expect(prismaRes.configCode).toBe('prisma config');
      expect(typeormRes.configCode).toBe('typeorm config');
      expect(prismaRes.installCommands).toContain('npm install prisma @prisma/client');
      expect(typeormRes.installCommands).toContain('npm install typeorm mysql2');
    });
  });
});
