/**
 * Database Prompt Service Tests
 * 
 * Tests for database configuration prompt generation functionality
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import { DatabasePromptService, generateMySQLPrompt, generateRedisPrompt } from '../mastra/services/database-prompt-service';

describe('DatabasePromptService', () => {
  let service: DatabasePromptService;

  beforeEach(() => {
    service = new DatabasePromptService();
  });

  describe('MySQL prompt generation', () => {
    test('should generate MySQL prompt with Prisma', () => {
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

      const result = service.generateMySQLPrompt(config, options);

      expect(result.configCode).toContain('prisma');
      expect(result.configCode).toContain('mysql');
      expect(result.envVars).toContain('DATABASE_URL');
      expect(result.envVars).toContain('testdb');
      expect(result.dockerCompose).toContain('mysql:8.0');
      expect(result.installCommands).toContain('npm install prisma @prisma/client');
      expect(result.usage).toContain('prisma.user.create');
      expect(result.documentation).toContain('MySQL Configuration Documentation');
    });

    test('should generate MySQL prompt with TypeORM', () => {
      const config = {
        type: 'mysql' as const,
        host: 'localhost',
        port: 3306,
        database: 'testdb',
        username: 'testuser',
        password: 'testpass',
      };

      const options = {
        orm: 'typeorm' as const,
      };

      const result = service.generateMySQLPrompt(config, options);

      expect(result.configCode).toContain('DataSource');
      expect(result.configCode).toContain('typeorm');
      expect(result.installCommands).toContain('npm install typeorm mysql2 reflect-metadata');
      expect(result.usage).toContain('AppDataSource');
    });

    test('should generate MySQL prompt with Sequelize', () => {
      const config = {
        type: 'mysql' as const,
        host: 'localhost',
        port: 3306,
        database: 'testdb',
        username: 'testuser',
        password: 'testpass',
      };

      const options = {
        orm: 'sequelize' as const,
      };

      const result = service.generateMySQLPrompt(config, options);

      expect(result.configCode).toContain('Sequelize');
      expect(result.installCommands).toContain('npm install sequelize mysql2');
      expect(result.usage).toContain('sequelize.authenticate');
    });

    test('should generate raw MySQL configuration', () => {
      const config = {
        type: 'mysql' as const,
        host: 'localhost',
        port: 3306,
        database: 'testdb',
        username: 'testuser',
        password: 'testpass',
        connectionLimit: 20,
        timeout: 30000,
      };

      const options = {
        orm: 'drizzle' as const, // Will fall back to raw config
        framework: 'express' as const,
      };

      const result = service.generateMySQLPrompt(config, options);

      expect(result.configCode).toContain('mysql2/promise');
      expect(result.configCode).toContain('createPool');
      expect(result.configCode).toContain('connectionLimit: 20');
      expect(result.configCode).toContain('timeout: 30000');
      expect(result.installCommands).toContain('npm install mysql2');
    });
  });

  describe('PostgreSQL prompt generation', () => {
    test('should generate PostgreSQL prompt with Prisma', () => {
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

      const result = service.generatePostgreSQLPrompt(config, options);

      expect(result.configCode).toContain('prisma');
      expect(result.configCode).toContain('postgresql');
      expect(result.envVars).toContain('postgresql://');
      expect(result.dockerCompose).toContain('postgres:15');
      expect(result.installCommands).toContain('npm install prisma @prisma/client');
      expect(result.documentation).toContain('PostgreSQL Configuration Documentation');
    });

    test('should generate PostgreSQL prompt with TypeORM', () => {
      const config = {
        type: 'postgresql' as const,
        host: 'localhost',
        port: 5432,
        database: 'testdb',
        username: 'postgres',
        password: 'testpass',
      };

      const options = {
        orm: 'typeorm' as const,
      };

      const result = service.generatePostgreSQLPrompt(config, options);

      expect(result.configCode).toContain('DataSource');
      expect(result.configCode).toContain('postgresql');
      expect(result.installCommands).toContain('npm install typeorm pg @types/pg reflect-metadata');
    });

    test('should generate raw PostgreSQL configuration', () => {
      const config = {
        type: 'postgresql' as const,
        host: 'localhost',
        port: 5432,
        database: 'testdb',
        username: 'postgres',
        password: 'testpass',
      };

      const options = {
        orm: 'sequelize' as const, // Will fall back to raw config for PostgreSQL
        framework: 'express' as const,
      };

      const result = service.generatePostgreSQLPrompt(config, options);

      expect(result.configCode).toContain('Pool');
      expect(result.configCode).toContain('pg');
      expect(result.installCommands).toContain('npm install pg @types/pg');
    });
  });

  describe('Redis prompt generation', () => {
    test('should generate Redis prompt with basic configuration', () => {
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

      const result = service.generateRedisPrompt(config, options);

      expect(result.configCode).toContain('createClient');
      expect(result.configCode).toContain('redis://');
      expect(result.configCode).toContain('setCache');
      expect(result.configCode).toContain('getCache');
      expect(result.envVars).toContain('REDIS_URL');
      expect(result.dockerCompose).toContain('redis:7-alpine');
      expect(result.installCommands).toContain('npm install redis');
      expect(result.usage).toContain('setCache');
      expect(result.documentation).toContain('Redis Configuration Documentation');
    });

    test('should generate Redis prompt without password', () => {
      const config = {
        type: 'redis' as const,
        host: 'localhost',
        port: 6379,
      };

      const result = service.generateRedisPrompt(config);

      expect(result.configCode).toContain('createClient');
      expect(result.envVars).toContain('REDIS_PASSWORD=');
    });
  });

  describe('MongoDB prompt generation', () => {
    test('should generate MongoDB prompt with Mongoose', () => {
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

      const result = service.generateMongoDBPrompt(config, options);

      expect(result.configCode).toContain('mongoose');
      expect(result.configCode).toContain('connectMongoDB');
      expect(result.envVars).toContain('MONGODB_URI');
      expect(result.dockerCompose).toContain('mongo:6');
      expect(result.installCommands).toContain('npm install mongoose @types/mongoose');
      expect(result.usage).toContain('new User');
      expect(result.documentation).toContain('MongoDB Configuration Documentation');
    });

    test('should generate MongoDB prompt with raw driver', () => {
      const config = {
        type: 'mongodb' as const,
        host: 'localhost',
        port: 27017,
        database: 'testdb',
      };

      const options = {
        orm: 'mongodb' as const,
      };

      const result = service.generateMongoDBPrompt(config, options);

      expect(result.configCode).toContain('MongoClient');
      expect(result.installCommands).toContain('npm install mongodb');
      expect(result.usage).toContain('insertOne');
    });
  });

  describe('environment variables generation', () => {
    test('should generate correct MySQL environment variables', () => {
      const config = {
        type: 'mysql' as const,
        host: 'db.example.com',
        port: 3307,
        database: 'production_db',
        username: 'prod_user',
        password: 'secure_pass',
      };

      const result = service.generateMySQLPrompt(config, { includeEnvVars: true });

      expect(result.envVars).toContain('DATABASE_URL="mysql://prod_user:secure_pass@db.example.com:3307/production_db"');
      expect(result.envVars).toContain('DB_HOST=db.example.com');
      expect(result.envVars).toContain('DB_PORT=3307');
      expect(result.envVars).toContain('DB_USERNAME=prod_user');
      expect(result.envVars).toContain('DB_PASSWORD=secure_pass');
      expect(result.envVars).toContain('DB_NAME=production_db');
    });

    test('should generate correct Redis environment variables', () => {
      const config = {
        type: 'redis' as const,
        host: 'redis.example.com',
        port: 6380,
        password: 'redis_secret',
      };

      const result = service.generateRedisPrompt(config, { includeEnvVars: true });

      expect(result.envVars).toContain('REDIS_URL="redis://redis.example.com:6380"');
      expect(result.envVars).toContain('REDIS_HOST=redis.example.com');
      expect(result.envVars).toContain('REDIS_PORT=6380');
      expect(result.envVars).toContain('REDIS_PASSWORD=redis_secret');
    });
  });

  describe('Docker Compose generation', () => {
    test('should generate MySQL Docker Compose configuration', () => {
      const config = {
        type: 'mysql' as const,
        host: 'localhost',
        port: 3306,
        database: 'myapp',
        username: 'user',
        password: 'password',
      };

      const result = service.generateMySQLPrompt(config, { includeDockerCompose: true });

      expect(result.dockerCompose).toContain('version: \'3.8\'');
      expect(result.dockerCompose).toContain('mysql:8.0');
      expect(result.dockerCompose).toContain('MYSQL_DATABASE: myapp');
      expect(result.dockerCompose).toContain('MYSQL_USER: user');
      expect(result.dockerCompose).toContain('MYSQL_PASSWORD: password');
      expect(result.dockerCompose).toContain('3306:3306');
    });

    test('should generate Redis Docker Compose configuration', () => {
      const config = {
        type: 'redis' as const,
        host: 'localhost',
        port: 6379,
        password: 'redispass',
      };

      const result = service.generateRedisPrompt(config, { includeDockerCompose: true });

      expect(result.dockerCompose).toContain('redis:7-alpine');
      expect(result.dockerCompose).toContain('6379:6379');
      expect(result.dockerCompose).toContain('--requirepass redispass');
    });
  });

  describe('convenience functions', () => {
    test('generateMySQLPrompt should work', () => {
      const config = {
        type: 'mysql' as const,
        host: 'localhost',
        port: 3306,
        database: 'testdb',
        username: 'testuser',
        password: 'testpass',
      };

      const result = generateMySQLPrompt(config);

      expect(result.configCode).toContain('prisma');
      expect(result.installCommands.length).toBeGreaterThan(0);
    });

    test('generateRedisPrompt should work', () => {
      const config = {
        type: 'redis' as const,
        host: 'localhost',
        port: 6379,
      };

      const result = generateRedisPrompt(config);

      expect(result.configCode).toContain('createClient');
      expect(result.installCommands).toContain('npm install redis');
    });
  });

  describe('error handling', () => {
    test('should handle missing configuration gracefully', () => {
      const config = {
        type: 'mysql' as const,
      };

      const result = service.generateMySQLPrompt(config);

      // Prisma config uses environment variables, so check env vars instead
      expect(result.envVars).toContain('localhost'); // Should use defaults
      expect(result.envVars).toContain('3306');
      expect(result.installCommands.length).toBeGreaterThan(0);
    });

    test('should handle empty options gracefully', () => {
      const config = {
        type: 'redis' as const,
        host: 'localhost',
        port: 6379,
      };

      const result = service.generateRedisPrompt(config, {});

      expect(result.configCode).toBeDefined();
      expect(result.installCommands).toBeDefined();
      expect(result.usage).toBeDefined();
    });
  });

  describe('framework-specific configurations', () => {
    test('should generate Express-specific configuration', () => {
      const config = {
        type: 'mysql' as const,
        host: 'localhost',
        port: 3306,
        database: 'testdb',
      };

      const result = service.generateMySQLPrompt(config, { framework: 'express' });

      expect(result.configCode).toBeDefined();
      expect(result.usage).toBeDefined();
    });

    test('should generate Next.js-specific configuration', () => {
      const config = {
        type: 'redis' as const,
        host: 'localhost',
        port: 6379,
      };

      const result = service.generateRedisPrompt(config, { framework: 'nextjs' });

      expect(result.configCode).toBeDefined();
      expect(result.usage).toBeDefined();
    });
  });
});
