/**
 * Database Prompt Tools
 * 
 * Provides database configuration prompt generation tools for the Builder Agent
 * Integrates with the DatabasePromptService for comprehensive database setup
 */

import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { DatabasePromptService, generateMySQLPrompt, generateRedisPrompt } from '../services/database-prompt-service';

/**
 * Tool for generating MySQL configuration prompts
 */
export const generateMySQLPromptTool = createTool({
  id: 'generate-mysql-prompt',
  description: 'Generate MySQL database configuration code and setup instructions',
  inputSchema: z.object({
    host: z.string().default('localhost').describe('MySQL server host'),
    port: z.number().default(3306).describe('MySQL server port'),
    database: z.string().default('myapp').describe('Database name'),
    username: z.string().default('root').describe('Database username'),
    password: z.string().default('password').describe('Database password'),
    ssl: z.boolean().default(false).describe('Enable SSL connection'),
    connectionLimit: z.number().default(10).describe('Connection pool limit'),
    timeout: z.number().default(60000).describe('Connection timeout in milliseconds'),
    includeEnvVars: z.boolean().default(true).describe('Include environment variables'),
    includeDockerCompose: z.boolean().default(false).describe('Include Docker Compose configuration'),
    includeConnectionPool: z.boolean().default(true).describe('Include connection pooling'),
    includeErrorHandling: z.boolean().default(true).describe('Include error handling'),
    framework: z.enum(['express', 'nextjs', 'fastify', 'koa']).default('express').describe('Target framework'),
    orm: z.enum(['prisma', 'typeorm', 'sequelize', 'mongoose', 'drizzle']).default('prisma').describe('ORM to use'),
  }),
  outputSchema: z.object({
    configCode: z.string().describe('Generated configuration code'),
    envVars: z.string().describe('Environment variables configuration'),
    dockerCompose: z.string().optional().describe('Docker Compose configuration'),
    installCommands: z.array(z.string()).describe('Installation commands'),
    usage: z.string().describe('Usage examples'),
    documentation: z.string().describe('Setup documentation'),
  }),
  execute: async ({ context }) => {
    const {
      host, port, database, username, password, ssl, connectionLimit, timeout,
      includeEnvVars, includeDockerCompose, includeConnectionPool, includeErrorHandling,
      framework, orm
    } = context;

    const config = {
      type: 'mysql' as const,
      host,
      port,
      database,
      username,
      password,
      ssl,
      connectionLimit,
      timeout,
    };

    const options = {
      includeEnvVars,
      includeDockerCompose,
      includeConnectionPool,
      includeErrorHandling,
      framework,
      orm,
    };

    const service = new DatabasePromptService();
    const result = service.generateMySQLPrompt(config, options);

    return {
      configCode: result.configCode,
      envVars: result.envVars,
      dockerCompose: result.dockerCompose,
      installCommands: result.installCommands,
      usage: result.usage,
      documentation: result.documentation,
    };
  },
});

/**
 * Tool for generating PostgreSQL configuration prompts
 */
export const generatePostgreSQLPromptTool = createTool({
  id: 'generate-postgresql-prompt',
  description: 'Generate PostgreSQL database configuration code and setup instructions',
  inputSchema: z.object({
    host: z.string().default('localhost').describe('PostgreSQL server host'),
    port: z.number().default(5432).describe('PostgreSQL server port'),
    database: z.string().default('myapp').describe('Database name'),
    username: z.string().default('postgres').describe('Database username'),
    password: z.string().default('password').describe('Database password'),
    ssl: z.boolean().default(false).describe('Enable SSL connection'),
    connectionLimit: z.number().default(10).describe('Connection pool limit'),
    timeout: z.number().default(60000).describe('Connection timeout in milliseconds'),
    includeEnvVars: z.boolean().default(true).describe('Include environment variables'),
    includeDockerCompose: z.boolean().default(false).describe('Include Docker Compose configuration'),
    includeConnectionPool: z.boolean().default(true).describe('Include connection pooling'),
    includeErrorHandling: z.boolean().default(true).describe('Include error handling'),
    framework: z.enum(['express', 'nextjs', 'fastify', 'koa']).default('express').describe('Target framework'),
    orm: z.enum(['prisma', 'typeorm', 'sequelize', 'mongoose', 'drizzle']).default('prisma').describe('ORM to use'),
  }),
  outputSchema: z.object({
    configCode: z.string().describe('Generated configuration code'),
    envVars: z.string().describe('Environment variables configuration'),
    dockerCompose: z.string().optional().describe('Docker Compose configuration'),
    installCommands: z.array(z.string()).describe('Installation commands'),
    usage: z.string().describe('Usage examples'),
    documentation: z.string().describe('Setup documentation'),
  }),
  execute: async ({ context }) => {
    const {
      host, port, database, username, password, ssl, connectionLimit, timeout,
      includeEnvVars, includeDockerCompose, includeConnectionPool, includeErrorHandling,
      framework, orm
    } = context;

    const config = {
      type: 'postgresql' as const,
      host,
      port,
      database,
      username,
      password,
      ssl,
      connectionLimit,
      timeout,
    };

    const options = {
      includeEnvVars,
      includeDockerCompose,
      includeConnectionPool,
      includeErrorHandling,
      framework,
      orm,
    };

    const service = new DatabasePromptService();
    const result = service.generatePostgreSQLPrompt(config, options);

    return {
      configCode: result.configCode,
      envVars: result.envVars,
      dockerCompose: result.dockerCompose,
      installCommands: result.installCommands,
      usage: result.usage,
      documentation: result.documentation,
    };
  },
});

/**
 * Tool for generating Redis configuration prompts
 */
export const generateRedisPromptTool = createTool({
  id: 'generate-redis-prompt',
  description: 'Generate Redis cache configuration code and setup instructions',
  inputSchema: z.object({
    host: z.string().default('localhost').describe('Redis server host'),
    port: z.number().default(6379).describe('Redis server port'),
    password: z.string().default('').describe('Redis password (optional)'),
    connectionLimit: z.number().default(10).describe('Connection pool limit'),
    timeout: z.number().default(5000).describe('Connection timeout in milliseconds'),
    includeEnvVars: z.boolean().default(true).describe('Include environment variables'),
    includeDockerCompose: z.boolean().default(false).describe('Include Docker Compose configuration'),
    includeConnectionPool: z.boolean().default(true).describe('Include connection pooling'),
    framework: z.enum(['express', 'nextjs', 'fastify', 'koa']).default('express').describe('Target framework'),
  }),
  outputSchema: z.object({
    configCode: z.string().describe('Generated configuration code'),
    envVars: z.string().describe('Environment variables configuration'),
    dockerCompose: z.string().optional().describe('Docker Compose configuration'),
    installCommands: z.array(z.string()).describe('Installation commands'),
    usage: z.string().describe('Usage examples'),
    documentation: z.string().describe('Setup documentation'),
  }),
  execute: async ({ context }) => {
    const {
      host, port, password, connectionLimit, timeout,
      includeEnvVars, includeDockerCompose, includeConnectionPool,
      framework
    } = context;

    const config = {
      type: 'redis' as const,
      host,
      port,
      password,
      connectionLimit,
      timeout,
    };

    const options = {
      includeEnvVars,
      includeDockerCompose,
      includeConnectionPool,
      framework,
    };

    const service = new DatabasePromptService();
    const result = service.generateRedisPrompt(config, options);

    return {
      configCode: result.configCode,
      envVars: result.envVars,
      dockerCompose: result.dockerCompose,
      installCommands: result.installCommands,
      usage: result.usage,
      documentation: result.documentation,
    };
  },
});

/**
 * Tool for generating MongoDB configuration prompts
 */
export const generateMongoDBPromptTool = createTool({
  id: 'generate-mongodb-prompt',
  description: 'Generate MongoDB database configuration code and setup instructions',
  inputSchema: z.object({
    host: z.string().default('localhost').describe('MongoDB server host'),
    port: z.number().default(27017).describe('MongoDB server port'),
    database: z.string().default('myapp').describe('Database name'),
    username: z.string().default('').describe('Database username (optional)'),
    password: z.string().default('').describe('Database password (optional)'),
    connectionLimit: z.number().default(10).describe('Connection pool limit'),
    timeout: z.number().default(5000).describe('Connection timeout in milliseconds'),
    includeEnvVars: z.boolean().default(true).describe('Include environment variables'),
    includeDockerCompose: z.boolean().default(false).describe('Include Docker Compose configuration'),
    framework: z.enum(['express', 'nextjs', 'fastify', 'koa']).default('express').describe('Target framework'),
    orm: z.enum(['mongoose', 'mongodb']).default('mongoose').describe('MongoDB driver to use'),
  }),
  outputSchema: z.object({
    configCode: z.string().describe('Generated configuration code'),
    envVars: z.string().describe('Environment variables configuration'),
    dockerCompose: z.string().optional().describe('Docker Compose configuration'),
    installCommands: z.array(z.string()).describe('Installation commands'),
    usage: z.string().describe('Usage examples'),
    documentation: z.string().describe('Setup documentation'),
  }),
  execute: async ({ context }) => {
    const {
      host, port, database, username, password, connectionLimit, timeout,
      includeEnvVars, includeDockerCompose, framework, orm
    } = context;

    const config = {
      type: 'mongodb' as const,
      host,
      port,
      database,
      username,
      password,
      connectionLimit,
      timeout,
    };

    const options = {
      includeEnvVars,
      includeDockerCompose,
      framework,
      orm,
    };

    const service = new DatabasePromptService();
    const result = service.generateMongoDBPrompt(config, options);

    return {
      configCode: result.configCode,
      envVars: result.envVars,
      dockerCompose: result.dockerCompose,
      installCommands: result.installCommands,
      usage: result.usage,
      documentation: result.documentation,
    };
  },
});

/**
 * Tool for generating SQLite configuration prompts
 */
export const generateSQLitePromptTool = createTool({
  id: 'generate-sqlite-prompt',
  description: 'Generate SQLite database configuration code and setup instructions',
  inputSchema: z.object({
    database: z.string().default('./database.db').describe('SQLite database file path'),
    framework: z.enum(['express', 'nextjs', 'fastify', 'koa']).default('express').describe('Target framework'),
    orm: z.enum(['prisma', 'typeorm', 'sequelize', 'better-sqlite3']).default('prisma').describe('ORM to use'),
    includeEnvVars: z.boolean().default(true).describe('Include environment variables'),
  }),
  outputSchema: z.object({
    configCode: z.string().describe('Generated configuration code'),
    envVars: z.string().describe('Environment variables configuration'),
    installCommands: z.array(z.string()).describe('Installation commands'),
    usage: z.string().describe('Usage examples'),
    documentation: z.string().describe('Setup documentation'),
  }),
  execute: async ({ context }) => {
    const { database, framework, orm, includeEnvVars } = context;

    let configCode = '';
    let envVars = '';
    let installCommands: string[] = [];
    let usage = '';
    let documentation = '';

    switch (orm) {
      case 'prisma':
        configCode = `// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

// lib/prisma.ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma`;
        installCommands = ['npm install prisma @prisma/client'];
        usage = `// Usage example
import { prisma } from './lib/prisma'

// Create user
const user = await prisma.user.create({
  data: {
    email: 'user@example.com',
    name: 'John Doe'
  }
})

// Find users
const users = await prisma.user.findMany()`;
        break;

      case 'better-sqlite3':
        configCode = `// src/config/sqlite.ts
import Database from 'better-sqlite3'

const db = new Database('${database}')

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL')

export default db

// Helper functions
export const query = (sql: string, params: any[] = []) => {
  try {
    const stmt = db.prepare(sql)
    return stmt.all(params)
  } catch (error) {
    console.error('Database query error:', error)
    throw error
  }
}

export const run = (sql: string, params: any[] = []) => {
  try {
    const stmt = db.prepare(sql)
    return stmt.run(params)
  } catch (error) {
    console.error('Database run error:', error)
    throw error
  }
}`;
        installCommands = ['npm install better-sqlite3', 'npm install @types/better-sqlite3 --save-dev'];
        usage = `// Usage example
import db, { query, run } from './config/sqlite'

// Create table
run(\`CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)\`)

// Insert user
const result = run('INSERT INTO users (email, name) VALUES (?, ?)', ['user@example.com', 'John Doe'])

// Query users
const users = query('SELECT * FROM users WHERE email LIKE ?', ['%@example.com'])`;
        break;

      default:
        configCode = `// SQLite configuration for ${orm}`;
        installCommands = [`npm install ${orm}`];
        usage = `// Usage example for ${orm}`;
    }

    if (includeEnvVars) {
      envVars = `# .env
DATABASE_URL="file:${database}"`;
    }

    documentation = `# SQLite Configuration Documentation

## Setup Instructions

1. Install dependencies:
   \`\`\`bash
   ${installCommands.join('\n   ')}
   \`\`\`

2. ${includeEnvVars ? 'Set up environment variables in .env file' : 'Configure database path'}

3. ${orm === 'prisma' ? 'Run Prisma migrations:\n   ```bash\n   npx prisma migrate dev\n   npx prisma generate\n   ```' : 'Create your database tables'}

## Best Practices

- Use WAL mode for better performance
- Implement proper error handling
- Use transactions for multi-step operations
- Regular backups for production
- Consider connection pooling for high-traffic applications

## SQLite Features

- Zero-configuration
- Self-contained
- Cross-platform
- ACID compliant
- Full-text search support
- JSON support (SQLite 3.38+)

## Limitations

- Single writer at a time
- No network access (file-based)
- Limited concurrent connections
- Database size limitations (theoretical limit is 281TB)`;

    return {
      configCode,
      envVars,
      installCommands,
      usage,
      documentation,
    };
  },
});

/**
 * Tool for comparing database options
 */
export const compareDatabaseOptionsTool = createTool({
  id: 'compare-database-options',
  description: 'Compare different database options and provide recommendations',
  inputSchema: z.object({
    projectType: z.enum(['web-app', 'api', 'microservice', 'mobile-backend', 'analytics']).describe('Type of project'),
    expectedLoad: z.enum(['low', 'medium', 'high']).describe('Expected traffic load'),
    dataComplexity: z.enum(['simple', 'moderate', 'complex']).describe('Data relationship complexity'),
    scalabilityNeeds: z.enum(['none', 'horizontal', 'vertical', 'both']).describe('Scalability requirements'),
    budget: z.enum(['free', 'low', 'medium', 'high']).describe('Budget constraints'),
    teamExperience: z.enum(['beginner', 'intermediate', 'expert']).describe('Team database experience'),
  }),
  outputSchema: z.object({
    recommendations: z.array(z.object({
      database: z.string(),
      score: z.number(),
      pros: z.array(z.string()),
      cons: z.array(z.string()),
      useCase: z.string(),
      complexity: z.string(),
    })).describe('Database recommendations with scores'),
    summary: z.string().describe('Summary of recommendations'),
    considerations: z.array(z.string()).describe('Additional considerations'),
  }),
  execute: async ({ context }) => {
    const { projectType, expectedLoad, dataComplexity, scalabilityNeeds, budget, teamExperience } = context;

    const databases = [
      {
        name: 'SQLite',
        scores: {
          'web-app': 7, 'api': 6, 'microservice': 8, 'mobile-backend': 5, 'analytics': 4,
          low: 9, medium: 6, high: 3,
          simple: 9, moderate: 7, complex: 5,
          none: 10, horizontal: 2, vertical: 6, both: 2,
          free: 10, low: 10, medium: 8, high: 6,
          beginner: 9, intermediate: 8, expert: 7,
        },
        pros: ['Zero configuration', 'No server required', 'Fast for read-heavy workloads', 'ACID compliant', 'Cross-platform'],
        cons: ['Single writer limitation', 'No network access', 'Limited scalability', 'Not suitable for high concurrency'],
        useCase: 'Small to medium applications, prototyping, embedded systems',
        complexity: 'Low',
      },
      {
        name: 'MySQL',
        scores: {
          'web-app': 9, 'api': 8, 'microservice': 7, 'mobile-backend': 8, 'analytics': 7,
          low: 8, medium: 9, high: 8,
          simple: 8, moderate: 9, complex: 8,
          none: 7, horizontal: 6, vertical: 8, both: 7,
          free: 9, low: 9, medium: 9, high: 8,
          beginner: 7, intermediate: 8, expert: 9,
        },
        pros: ['Mature and stable', 'Great performance', 'Wide community support', 'Good documentation', 'ACID compliant'],
        cons: ['Can be complex to optimize', 'Licensing considerations', 'Limited JSON support'],
        useCase: 'Traditional web applications, e-commerce, content management',
        complexity: 'Medium',
      },
      {
        name: 'PostgreSQL',
        scores: {
          'web-app': 9, 'api': 9, 'microservice': 8, 'mobile-backend': 8, 'analytics': 9,
          low: 8, medium: 9, high: 9,
          simple: 7, moderate: 9, complex: 10,
          none: 7, horizontal: 7, vertical: 9, both: 8,
          free: 10, low: 10, medium: 9, high: 9,
          beginner: 6, intermediate: 8, expert: 10,
        },
        pros: ['Advanced features', 'Excellent JSON support', 'Strong consistency', 'Extensible', 'Open source'],
        cons: ['Steeper learning curve', 'Can be resource intensive', 'More complex configuration'],
        useCase: 'Complex applications, analytics, geospatial data, JSON-heavy workloads',
        complexity: 'Medium-High',
      },
      {
        name: 'MongoDB',
        scores: {
          'web-app': 8, 'api': 9, 'microservice': 9, 'mobile-backend': 9, 'analytics': 8,
          low: 7, medium: 8, high: 9,
          simple: 9, moderate: 8, complex: 7,
          none: 6, horizontal: 9, vertical: 7, both: 8,
          free: 8, low: 7, medium: 8, high: 9,
          beginner: 8, intermediate: 8, expert: 7,
        },
        pros: ['Flexible schema', 'Horizontal scaling', 'Great for JSON data', 'Fast development', 'Cloud-native'],
        cons: ['Eventual consistency', 'Memory usage', 'Learning curve for SQL developers'],
        useCase: 'Rapid prototyping, content management, real-time applications, IoT',
        complexity: 'Medium',
      },
      {
        name: 'Redis',
        scores: {
          'web-app': 6, 'api': 7, 'microservice': 8, 'mobile-backend': 7, 'analytics': 5,
          low: 8, medium: 9, high: 10,
          simple: 8, moderate: 7, complex: 6,
          none: 6, horizontal: 8, vertical: 9, both: 8,
          free: 9, low: 8, medium: 8, high: 9,
          beginner: 7, intermediate: 8, expert: 9,
        },
        pros: ['Extremely fast', 'Great for caching', 'Pub/sub support', 'Data structures', 'Session storage'],
        cons: ['In-memory limitations', 'Not a primary database', 'Data persistence complexity'],
        useCase: 'Caching, session storage, real-time analytics, message queuing',
        complexity: 'Low-Medium',
      },
    ];

    const recommendations = databases.map(db => {
      const score = Math.round((
        db.scores[projectType] +
        db.scores[expectedLoad] +
        db.scores[dataComplexity] +
        db.scores[scalabilityNeeds] +
        db.scores[budget] +
        db.scores[teamExperience]
      ) / 6);

      return {
        database: db.name,
        score,
        pros: db.pros,
        cons: db.cons,
        useCase: db.useCase,
        complexity: db.complexity,
      };
    }).sort((a, b) => b.score - a.score);

    const topChoice = recommendations[0];
    const summary = `Based on your requirements (${projectType}, ${expectedLoad} load, ${dataComplexity} data complexity), ${topChoice.database} is the recommended choice with a score of ${topChoice.score}/10. It's particularly well-suited for ${topChoice.useCase}.`;

    const considerations = [
      'Consider using multiple databases for different purposes (polyglot persistence)',
      'Evaluate hosting and operational costs beyond just licensing',
      'Plan for data migration and backup strategies',
      'Consider your team\'s existing expertise and learning curve',
      'Evaluate third-party service options (managed databases) vs self-hosting',
      'Plan for monitoring and performance optimization from the start',
    ];

    return {
      recommendations,
      summary,
      considerations,
    };
  },
});
