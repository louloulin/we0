/**
 * Database Prompt Service
 * 
 * Generates database configuration prompts and code snippets
 * Supports MySQL, PostgreSQL, Redis, MongoDB and other databases
 */

export interface DatabaseConfig {
  type: 'mysql' | 'postgresql' | 'redis' | 'mongodb' | 'sqlite';
  host?: string;
  port?: number;
  database?: string;
  username?: string;
  password?: string;
  ssl?: boolean;
  connectionLimit?: number;
  timeout?: number;
}

export interface DatabasePromptOptions {
  includeEnvVars?: boolean;
  includeDockerCompose?: boolean;
  includeConnectionPool?: boolean;
  includeErrorHandling?: boolean;
  framework?: 'express' | 'nextjs' | 'fastify' | 'koa';
  orm?: 'prisma' | 'typeorm' | 'sequelize' | 'mongoose' | 'drizzle' | 'mongodb';
}

export interface GeneratedPrompt {
  configCode: string;
  envVars: string;
  dockerCompose?: string;
  installCommands: string[];
  usage: string;
  documentation: string;
}

/**
 * Database Prompt Service Class
 * Generates configuration prompts for various databases
 */
export class DatabasePromptService {
  constructor() {}

  /**
   * Generate MySQL configuration prompt
   */
  generateMySQLPrompt(config: DatabaseConfig, options: DatabasePromptOptions = {}): GeneratedPrompt {
    const {
      includeEnvVars = true,
      includeDockerCompose = false,
      includeConnectionPool = true,
      includeErrorHandling = true,
      framework = 'express',
      orm = 'prisma'
    } = options;

    let configCode = '';
    let envVars = '';
    let dockerCompose = '';
    let installCommands: string[] = [];
    let usage = '';
    let documentation = '';

    // Generate configuration based on ORM choice
    switch (orm) {
      case 'prisma':
        configCode = this.generatePrismaConfig(config, 'mysql');
        installCommands = ['npm install prisma @prisma/client', 'npm install mysql2'];
        usage = this.generatePrismaUsage();
        break;
      case 'typeorm':
        configCode = this.generateTypeORMConfig(config, 'mysql');
        installCommands = ['npm install typeorm mysql2 reflect-metadata'];
        usage = this.generateTypeORMUsage();
        break;
      case 'sequelize':
        configCode = this.generateSequelizeConfig(config, 'mysql');
        installCommands = ['npm install sequelize mysql2'];
        usage = this.generateSequelizeUsage();
        break;
      default:
        configCode = this.generateRawMySQLConfig(config, framework);
        installCommands = ['npm install mysql2'];
        usage = this.generateRawMySQLUsage();
    }

    if (includeEnvVars) {
      envVars = this.generateMySQLEnvVars(config);
    }

    if (includeDockerCompose) {
      dockerCompose = this.generateMySQLDockerCompose(config);
    }

    documentation = this.generateMySQLDocumentation(orm);

    return {
      configCode,
      envVars,
      dockerCompose,
      installCommands,
      usage,
      documentation
    };
  }

  /**
   * Generate Redis configuration prompt
   */
  generateRedisPrompt(config: DatabaseConfig, options: DatabasePromptOptions = {}): GeneratedPrompt {
    const {
      includeEnvVars = true,
      includeDockerCompose = false,
      includeConnectionPool = true,
      framework = 'express'
    } = options;

    let configCode = '';
    let envVars = '';
    let dockerCompose = '';
    const installCommands = ['npm install redis'];
    let usage = '';
    let documentation = '';

    // Generate Redis configuration
    configCode = this.generateRedisConfig(config, framework, includeConnectionPool);
    usage = this.generateRedisUsage();
    documentation = this.generateRedisDocumentation();

    if (includeEnvVars) {
      envVars = this.generateRedisEnvVars(config);
    }

    if (includeDockerCompose) {
      dockerCompose = this.generateRedisDockerCompose(config);
    }

    return {
      configCode,
      envVars,
      dockerCompose,
      installCommands,
      usage,
      documentation
    };
  }

  /**
   * Generate PostgreSQL configuration prompt
   */
  generatePostgreSQLPrompt(config: DatabaseConfig, options: DatabasePromptOptions = {}): GeneratedPrompt {
    const {
      includeEnvVars = true,
      includeDockerCompose = false,
      orm = 'prisma',
      framework = 'express'
    } = options;

    let configCode = '';
    let envVars = '';
    let dockerCompose = '';
    let installCommands: string[] = [];
    let usage = '';
    let documentation = '';

    // Generate configuration based on ORM choice
    switch (orm) {
      case 'prisma':
        configCode = this.generatePrismaConfig(config, 'postgresql');
        installCommands = ['npm install prisma @prisma/client', 'npm install pg @types/pg'];
        usage = this.generatePrismaUsage();
        break;
      case 'typeorm':
        configCode = this.generateTypeORMConfig(config, 'postgresql');
        installCommands = ['npm install typeorm pg @types/pg reflect-metadata'];
        usage = this.generateTypeORMUsage();
        break;
      default:
        configCode = this.generateRawPostgreSQLConfig(config, framework);
        installCommands = ['npm install pg @types/pg'];
        usage = this.generateRawPostgreSQLUsage();
    }

    if (includeEnvVars) {
      envVars = this.generatePostgreSQLEnvVars(config);
    }

    if (includeDockerCompose) {
      dockerCompose = this.generatePostgreSQLDockerCompose(config);
    }

    documentation = this.generatePostgreSQLDocumentation(orm);

    return {
      configCode,
      envVars,
      dockerCompose,
      installCommands,
      usage,
      documentation
    };
  }

  /**
   * Generate MongoDB configuration prompt
   */
  generateMongoDBPrompt(config: DatabaseConfig, options: DatabasePromptOptions = {}): GeneratedPrompt {
    const {
      includeEnvVars = true,
      includeDockerCompose = false,
      orm = 'mongoose',
      framework = 'express'
    } = options;

    let configCode = '';
    let envVars = '';
    let dockerCompose = '';
    let installCommands: string[] = [];
    let usage = '';
    let documentation = '';

    if (orm === 'mongoose') {
      configCode = this.generateMongooseConfig(config);
      installCommands = ['npm install mongoose @types/mongoose'];
      usage = this.generateMongooseUsage();
    } else {
      configCode = this.generateRawMongoDBConfig(config, framework);
      installCommands = ['npm install mongodb'];
      usage = this.generateRawMongoDBUsage();
    }

    if (includeEnvVars) {
      envVars = this.generateMongoDBEnvVars(config);
    }

    if (includeDockerCompose) {
      dockerCompose = this.generateMongoDBDockerCompose(config);
    }

    documentation = this.generateMongoDBDocumentation(orm);

    return {
      configCode,
      envVars,
      dockerCompose,
      installCommands,
      usage,
      documentation
    };
  }

  /**
   * Generate Prisma configuration
   */
  private generatePrismaConfig(config: DatabaseConfig, dbType: string): string {
    const databaseUrl = this.buildDatabaseUrl(config, dbType);
    
    return `// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "${dbType === 'mysql' ? 'mysql' : dbType === 'postgresql' ? 'postgresql' : 'sqlite'}"
  url      = env("DATABASE_URL")
}

// Example model
model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

// lib/prisma.ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma`;
  }

  /**
   * Generate TypeORM configuration
   */
  private generateTypeORMConfig(config: DatabaseConfig, dbType: string): string {
    return `// src/config/database.ts
import { DataSource } from 'typeorm'

export const AppDataSource = new DataSource({
  type: '${dbType}',
  host: process.env.DB_HOST || '${config.host || 'localhost'}',
  port: parseInt(process.env.DB_PORT || '${config.port || (dbType === 'mysql' ? 3306 : 5432)}'),
  username: process.env.DB_USERNAME || '${config.username || 'root'}',
  password: process.env.DB_PASSWORD || '${config.password || ''}',
  database: process.env.DB_NAME || '${config.database || 'myapp'}',
  synchronize: process.env.NODE_ENV === 'development',
  logging: process.env.NODE_ENV === 'development',
  entities: ['src/entities/**/*.ts'],
  migrations: ['src/migrations/**/*.ts'],
  subscribers: ['src/subscribers/**/*.ts'],
})

// Initialize connection
export const initializeDatabase = async () => {
  try {
    await AppDataSource.initialize()
    console.log('Database connection established successfully')
  } catch (error) {
    console.error('Error during database initialization:', error)
    process.exit(1)
  }
}`;
  }

  /**
   * Generate Sequelize configuration
   */
  private generateSequelizeConfig(config: DatabaseConfig, dbType: string): string {
    return `// src/config/database.ts
import { Sequelize } from 'sequelize'

export const sequelize = new Sequelize({
  dialect: '${dbType}',
  host: process.env.DB_HOST || '${config.host || 'localhost'}',
  port: parseInt(process.env.DB_PORT || '${config.port || (dbType === 'mysql' ? 3306 : 5432)}'),
  username: process.env.DB_USERNAME || '${config.username || 'root'}',
  password: process.env.DB_PASSWORD || '${config.password || ''}',
  database: process.env.DB_NAME || '${config.database || 'myapp'}',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: ${config.connectionLimit || 10},
    min: 0,
    acquire: 30000,
    idle: 10000
  }
})

// Test connection
export const testConnection = async () => {
  try {
    await sequelize.authenticate()
    console.log('Database connection established successfully')
  } catch (error) {
    console.error('Unable to connect to the database:', error)
  }
}`;
  }

  /**
   * Generate raw MySQL configuration
   */
  private generateRawMySQLConfig(config: DatabaseConfig, framework: string): string {
    return `// src/config/mysql.ts
import mysql from 'mysql2/promise'

const pool = mysql.createPool({
  host: process.env.DB_HOST || '${config.host || 'localhost'}',
  port: parseInt(process.env.DB_PORT || '${config.port || 3306}'),
  user: process.env.DB_USERNAME || '${config.username || 'root'}',
  password: process.env.DB_PASSWORD || '${config.password || ''}',
  database: process.env.DB_NAME || '${config.database || 'myapp'}',
  waitForConnections: true,
  connectionLimit: ${config.connectionLimit || 10},
  queueLimit: 0,
  acquireTimeout: ${config.timeout || 60000},
  timeout: ${config.timeout || 60000}
})

export default pool

// Example usage function
export const query = async (sql: string, params?: any[]) => {
  try {
    const [rows] = await pool.execute(sql, params)
    return rows
  } catch (error) {
    console.error('Database query error:', error)
    throw error
  }
}`;
  }

  /**
   * Build database URL for Prisma
   */
  private buildDatabaseUrl(config: DatabaseConfig, dbType: string): string {
    const protocol = dbType === 'mysql' ? 'mysql' : dbType === 'postgresql' ? 'postgresql' : 'sqlite';
    const port = config.port || (dbType === 'mysql' ? 3306 : 5432);
    
    if (dbType === 'sqlite') {
      return 'file:./dev.db';
    }
    
    return `${protocol}://${config.username || 'root'}:${config.password || ''}@${config.host || 'localhost'}:${port}/${config.database || 'myapp'}`;
  }

  /**
   * Generate environment variables
   */
  private generateMySQLEnvVars(config: DatabaseConfig): string {
    return `# .env
DATABASE_URL="mysql://${config.username || 'root'}:${config.password || 'password'}@${config.host || 'localhost'}:${config.port || 3306}/${config.database || 'myapp'}"
DB_HOST=${config.host || 'localhost'}
DB_PORT=${config.port || 3306}
DB_USERNAME=${config.username || 'root'}
DB_PASSWORD=${config.password || 'password'}
DB_NAME=${config.database || 'myapp'}`;
  }

  private generateRedisEnvVars(config: DatabaseConfig): string {
    return `# .env
REDIS_URL="redis://${config.host || 'localhost'}:${config.port || 6379}"
REDIS_HOST=${config.host || 'localhost'}
REDIS_PORT=${config.port || 6379}
REDIS_PASSWORD=${config.password || ''}`;
  }

  private generatePostgreSQLEnvVars(config: DatabaseConfig): string {
    return `# .env
DATABASE_URL="postgresql://${config.username || 'postgres'}:${config.password || 'password'}@${config.host || 'localhost'}:${config.port || 5432}/${config.database || 'myapp'}"
DB_HOST=${config.host || 'localhost'}
DB_PORT=${config.port || 5432}
DB_USERNAME=${config.username || 'postgres'}
DB_PASSWORD=${config.password || 'password'}
DB_NAME=${config.database || 'myapp'}`;
  }

  private generateMongoDBEnvVars(config: DatabaseConfig): string {
    return `# .env
MONGODB_URI="mongodb://${config.username ? config.username + ':' + config.password + '@' : ''}${config.host || 'localhost'}:${config.port || 27017}/${config.database || 'myapp'}"
MONGO_HOST=${config.host || 'localhost'}
MONGO_PORT=${config.port || 27017}
MONGO_USERNAME=${config.username || ''}
MONGO_PASSWORD=${config.password || ''}
MONGO_DATABASE=${config.database || 'myapp'}`;
  }

  /**
   * Generate Redis configuration
   */
  private generateRedisConfig(config: DatabaseConfig, framework: string, includePool: boolean): string {
    return `// src/config/redis.ts
import { createClient } from 'redis'

const client = createClient({
  url: process.env.REDIS_URL || 'redis://${config.host || 'localhost'}:${config.port || 6379}',
  password: process.env.REDIS_PASSWORD || '${config.password || ''}',
  socket: {
    connectTimeout: ${config.timeout || 5000},
    lazyConnect: true
  }
})

client.on('error', (err) => {
  console.error('Redis Client Error:', err)
})

client.on('connect', () => {
  console.log('Connected to Redis')
})

export const connectRedis = async () => {
  try {
    await client.connect()
    console.log('Redis connection established')
  } catch (error) {
    console.error('Redis connection failed:', error)
  }
}

export default client

// Helper functions
export const setCache = async (key: string, value: any, ttl: number = 3600) => {
  try {
    await client.setEx(key, ttl, JSON.stringify(value))
  } catch (error) {
    console.error('Redis set error:', error)
  }
}

export const getCache = async (key: string) => {
  try {
    const value = await client.get(key)
    return value ? JSON.parse(value) : null
  } catch (error) {
    console.error('Redis get error:', error)
    return null
  }
}`;
  }

  /**
   * Generate usage examples
   */
  private generatePrismaUsage(): string {
    return `// Usage example
import { prisma } from './lib/prisma'

// Create user
const user = await prisma.user.create({
  data: {
    email: 'user@example.com',
    name: 'John Doe'
  }
})

// Find users
const users = await prisma.user.findMany({
  where: {
    email: {
      contains: '@example.com'
    }
  }
})

// Update user
const updatedUser = await prisma.user.update({
  where: { id: 1 },
  data: { name: 'Jane Doe' }
})`;
  }

  private generateRedisUsage(): string {
    return `// Usage example
import client, { setCache, getCache } from './config/redis'

// Set cache
await setCache('user:1', { id: 1, name: 'John' }, 3600)

// Get cache
const user = await getCache('user:1')

// Direct Redis operations
await client.set('key', 'value')
const value = await client.get('key')

// Hash operations
await client.hSet('user:1', 'name', 'John')
const name = await client.hGet('user:1', 'name')`;
  }

  private generateTypeORMUsage(): string {
    return `// Usage example
import { AppDataSource } from './config/database'
import { User } from './entities/User'

// Initialize database
await AppDataSource.initialize()

// Get repository
const userRepository = AppDataSource.getRepository(User)

// Create user
const user = userRepository.create({
  email: 'user@example.com',
  name: 'John Doe'
})
await userRepository.save(user)

// Find users
const users = await userRepository.find({
  where: { email: Like('%@example.com') }
})`;
  }

  private generateSequelizeUsage(): string {
    return `// Usage example
import { sequelize } from './config/database'

// Test connection
await sequelize.authenticate()

// Raw query
const [results] = await sequelize.query('SELECT * FROM users WHERE email = ?', {
  replacements: ['user@example.com']
})

// Using models (after defining them)
const users = await User.findAll({
  where: {
    email: {
      [Op.like]: '%@example.com'
    }
  }
})`;
  }

  private generateRawMySQLUsage(): string {
    return `// Usage example
import pool, { query } from './config/mysql'

// Simple query
const users = await query('SELECT * FROM users WHERE email = ?', ['user@example.com'])

// Insert
const result = await query('INSERT INTO users (email, name) VALUES (?, ?)', ['user@example.com', 'John Doe'])

// Update
await query('UPDATE users SET name = ? WHERE id = ?', ['Jane Doe', 1])

// Transaction example
const connection = await pool.getConnection()
try {
  await connection.beginTransaction()
  await connection.execute('INSERT INTO users (email, name) VALUES (?, ?)', ['user@example.com', 'John'])
  await connection.execute('INSERT INTO profiles (user_id, bio) VALUES (?, ?)', [1, 'Bio'])
  await connection.commit()
} catch (error) {
  await connection.rollback()
  throw error
} finally {
  connection.release()
}`;
  }

  private generateRawPostgreSQLConfig(config: DatabaseConfig, framework: string): string {
    return `// src/config/postgresql.ts
import { Pool } from 'pg'

const pool = new Pool({
  host: process.env.DB_HOST || '${config.host || 'localhost'}',
  port: parseInt(process.env.DB_PORT || '${config.port || 5432}'),
  user: process.env.DB_USERNAME || '${config.username || 'postgres'}',
  password: process.env.DB_PASSWORD || '${config.password || ''}',
  database: process.env.DB_NAME || '${config.database || 'myapp'}',
  max: ${config.connectionLimit || 10},
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: ${config.timeout || 2000}
})

export default pool

// Example usage function
export const query = async (text: string, params?: any[]) => {
  try {
    const result = await pool.query(text, params)
    return result.rows
  } catch (error) {
    console.error('Database query error:', error)
    throw error
  }
}`;
  }

  private generateRawPostgreSQLUsage(): string {
    return `// Usage example
import pool, { query } from './config/postgresql'

// Simple query
const users = await query('SELECT * FROM users WHERE email = $1', ['user@example.com'])

// Insert
const result = await query('INSERT INTO users (email, name) VALUES ($1, $2) RETURNING id', ['user@example.com', 'John Doe'])

// Update
await query('UPDATE users SET name = $1 WHERE id = $2', ['Jane Doe', 1])`;
  }

  private generateMongooseConfig(config: DatabaseConfig): string {
    return `// src/config/mongoose.ts
import mongoose from 'mongoose'

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://${config.host || 'localhost'}:${config.port || 27017}/${config.database || 'myapp'}'

export const connectMongoDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI, {
      maxPoolSize: ${config.connectionLimit || 10},
      serverSelectionTimeoutMS: ${config.timeout || 5000},
      socketTimeoutMS: 45000,
    })
    console.log('Connected to MongoDB')
  } catch (error) {
    console.error('MongoDB connection error:', error)
    process.exit(1)
  }
}

// Example schema
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
})

export const User = mongoose.model('User', userSchema)`;
  }

  private generateRawMongoDBConfig(config: DatabaseConfig, framework: string): string {
    return `// src/config/mongodb.ts
import { MongoClient } from 'mongodb'

const uri = process.env.MONGODB_URI || 'mongodb://${config.host || 'localhost'}:${config.port || 27017}'
const client = new MongoClient(uri, {
  maxPoolSize: ${config.connectionLimit || 10},
  serverSelectionTimeoutMS: ${config.timeout || 5000},
  socketTimeoutMS: 45000,
})

export const connectMongoDB = async () => {
  try {
    await client.connect()
    console.log('Connected to MongoDB')
    return client
  } catch (error) {
    console.error('MongoDB connection error:', error)
    throw error
  }
}

export const getDatabase = (dbName: string = '${config.database || 'myapp'}') => {
  return client.db(dbName)
}

export default client`;
  }

  private generateMongooseUsage(): string {
    return `// Usage example
import { connectMongoDB, User } from './config/mongoose'

// Connect to database
await connectMongoDB()

// Create user
const user = new User({
  email: 'user@example.com',
  name: 'John Doe'
})
await user.save()

// Find users
const users = await User.find({ email: /.*@example.com/ })

// Update user
await User.findByIdAndUpdate(userId, { name: 'Jane Doe' })`;
  }

  private generateRawMongoDBUsage(): string {
    return `// Usage example
import { connectMongoDB, getDatabase } from './config/mongodb'

// Connect and get database
await connectMongoDB()
const db = getDatabase()

// Get collection
const users = db.collection('users')

// Insert document
const result = await users.insertOne({
  email: 'user@example.com',
  name: 'John Doe',
  createdAt: new Date()
})

// Find documents
const userList = await users.find({ email: /.*@example.com/ }).toArray()

// Update document
await users.updateOne({ _id: result.insertedId }, { $set: { name: 'Jane Doe' } })`;
  }

  /**
   * Generate Docker Compose configurations
   */
  private generateMySQLDockerCompose(config: DatabaseConfig): string {
    return `# docker-compose.yml
version: '3.8'
services:
  mysql:
    image: mysql:8.0
    container_name: mysql-db
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: ${config.password || 'rootpassword'}
      MYSQL_DATABASE: ${config.database || 'myapp'}
      MYSQL_USER: ${config.username || 'user'}
      MYSQL_PASSWORD: ${config.password || 'password'}
    ports:
      - "${config.port || 3306}:3306"
    volumes:
      - mysql_data:/var/lib/mysql
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
    command: --default-authentication-plugin=mysql_native_password

volumes:
  mysql_data:`;
  }

  private generateRedisDockerCompose(config: DatabaseConfig): string {
    return `# docker-compose.yml
version: '3.8'
services:
  redis:
    image: redis:7-alpine
    container_name: redis-cache
    restart: unless-stopped
    ports:
      - "${config.port || 6379}:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes${config.password ? ` --requirepass ${config.password}` : ''}

volumes:
  redis_data:`;
  }

  private generatePostgreSQLDockerCompose(config: DatabaseConfig): string {
    return `# docker-compose.yml
version: '3.8'
services:
  postgres:
    image: postgres:15
    container_name: postgres-db
    restart: unless-stopped
    environment:
      POSTGRES_DB: ${config.database || 'myapp'}
      POSTGRES_USER: ${config.username || 'postgres'}
      POSTGRES_PASSWORD: ${config.password || 'password'}
    ports:
      - "${config.port || 5432}:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql

volumes:
  postgres_data:`;
  }

  private generateMongoDBDockerCompose(config: DatabaseConfig): string {
    return `# docker-compose.yml
version: '3.8'
services:
  mongodb:
    image: mongo:6
    container_name: mongodb
    restart: unless-stopped
    environment:
      MONGO_INITDB_ROOT_USERNAME: ${config.username || 'admin'}
      MONGO_INITDB_ROOT_PASSWORD: ${config.password || 'password'}
      MONGO_INITDB_DATABASE: ${config.database || 'myapp'}
    ports:
      - "${config.port || 27017}:27017"
    volumes:
      - mongodb_data:/data/db
      - ./mongo-init.js:/docker-entrypoint-initdb.d/mongo-init.js

volumes:
  mongodb_data:`;
  }

  /**
   * Generate documentation
   */
  private generateMySQLDocumentation(orm: string): string {
    return `# MySQL Configuration Documentation

## Setup Instructions

1. Install dependencies:
   \`\`\`bash
   ${orm === 'prisma' ? 'npm install prisma @prisma/client mysql2' : 
     orm === 'typeorm' ? 'npm install typeorm mysql2 reflect-metadata' :
     orm === 'sequelize' ? 'npm install sequelize mysql2' : 'npm install mysql2'}
   \`\`\`

2. Set up environment variables in .env file

3. ${orm === 'prisma' ? 'Run Prisma migrations:\n   ```bash\n   npx prisma migrate dev\n   npx prisma generate\n   ```' :
     orm === 'typeorm' ? 'Initialize TypeORM and run migrations' :
     orm === 'sequelize' ? 'Set up Sequelize models and migrations' :
     'Create your database tables manually or with migrations'}

## Best Practices

- Use connection pooling for better performance
- Always use parameterized queries to prevent SQL injection
- Implement proper error handling
- Use transactions for multi-step operations
- Monitor connection pool usage
- Set appropriate timeouts

## Security Considerations

- Never commit database credentials to version control
- Use environment variables for sensitive data
- Enable SSL in production
- Regularly update database and driver versions
- Implement proper access controls`;
  }

  private generateRedisDocumentation(): string {
    return `# Redis Configuration Documentation

## Setup Instructions

1. Install Redis client:
   \`\`\`bash
   npm install redis
   \`\`\`

2. Set up environment variables in .env file

3. Start Redis server (locally or via Docker)

## Best Practices

- Use appropriate TTL values for cached data
- Implement cache invalidation strategies
- Monitor memory usage
- Use Redis clustering for high availability
- Implement proper error handling for cache misses
- Use Redis data types efficiently (strings, hashes, lists, sets)

## Common Use Cases

- Session storage
- Caching API responses
- Rate limiting
- Real-time analytics
- Message queuing
- Leaderboards

## Security Considerations

- Enable authentication in production
- Use SSL/TLS for connections
- Restrict network access
- Regularly backup data if persistence is enabled`;
  }

  private generatePostgreSQLDocumentation(orm: string): string {
    return `# PostgreSQL Configuration Documentation

## Setup Instructions

1. Install dependencies:
   \`\`\`bash
   ${orm === 'prisma' ? 'npm install prisma @prisma/client pg @types/pg' : 
     orm === 'typeorm' ? 'npm install typeorm pg @types/pg reflect-metadata' :
     'npm install pg @types/pg'}
   \`\`\`

2. Set up environment variables in .env file

3. ${orm === 'prisma' ? 'Run Prisma migrations:\n   ```bash\n   npx prisma migrate dev\n   npx prisma generate\n   ```' :
     orm === 'typeorm' ? 'Initialize TypeORM and run migrations' :
     'Create your database schema manually or with migrations'}

## Best Practices

- Use connection pooling
- Implement proper indexing strategies
- Use EXPLAIN ANALYZE for query optimization
- Implement proper backup strategies
- Use transactions appropriately
- Monitor query performance

## PostgreSQL Features

- Advanced data types (JSON, arrays, custom types)
- Full-text search capabilities
- Window functions
- Common table expressions (CTEs)
- Partial indexes
- Foreign data wrappers

## Security Considerations

- Use row-level security when appropriate
- Implement proper role-based access control
- Enable SSL connections
- Regular security updates
- Audit logging for sensitive operations`;
  }

  private generateMongoDBDocumentation(orm: string): string {
    return `# MongoDB Configuration Documentation

## Setup Instructions

1. Install dependencies:
   \`\`\`bash
   ${orm === 'mongoose' ? 'npm install mongoose @types/mongoose' : 'npm install mongodb'}
   \`\`\`

2. Set up environment variables in .env file

3. ${orm === 'mongoose' ? 'Define your Mongoose schemas and models' : 'Set up your collections and indexes'}

## Best Practices

- Design schemas for your query patterns
- Use appropriate indexes
- Implement data validation
- Use aggregation pipelines for complex queries
- Monitor performance with profiling
- Implement proper error handling

## MongoDB Features

- Flexible document structure
- Powerful aggregation framework
- Horizontal scaling with sharding
- Built-in replication
- GridFS for large files
- Change streams for real-time updates

## Security Considerations

- Enable authentication and authorization
- Use SSL/TLS connections
- Implement field-level encryption for sensitive data
- Regular backups and disaster recovery planning
- Network security and firewall rules
- Audit logging for compliance`;
  }
}

// Global database prompt service instance
export const databasePromptService = new DatabasePromptService();

/**
 * Convenience function for generating MySQL prompts
 */
export function generateMySQLPrompt(config: DatabaseConfig, options?: DatabasePromptOptions): GeneratedPrompt {
  return databasePromptService.generateMySQLPrompt(config, options);
}

/**
 * Convenience function for generating Redis prompts
 */
export function generateRedisPrompt(config: DatabaseConfig, options?: DatabasePromptOptions): GeneratedPrompt {
  return databasePromptService.generateRedisPrompt(config, options);
}
