/**
 * Production Configuration
 * 
 * Production-ready configuration for the Mastra-based API server
 */

export interface ProductionConfig {
  server: {
    port: number;
    timeout: number;
    cors: {
      origin: string[];
      credentials: boolean;
      methods: string[];
      headers: string[];
    };
    rateLimit: {
      windowMs: number;
      max: number;
      message: string;
    };
  };
  models: {
    deepseek: {
      apiKey?: string;
      baseUrl?: string;
      timeout: number;
      retries: number;
    };
    anthropic: {
      apiKey?: string;
      baseUrl?: string;
      timeout: number;
      retries: number;
    };
    openai: {
      apiKey?: string;
      baseUrl?: string;
      timeout: number;
      retries: number;
    };
  };
  monitoring: {
    enabled: boolean;
    logLevel: 'debug' | 'info' | 'warn' | 'error';
    metricsEndpoint: string;
    healthCheckEndpoint: string;
  };
  security: {
    apiKeyRequired: boolean;
    allowedOrigins: string[];
    maxRequestSize: string;
    requestTimeout: number;
  };
  deployment: {
    netlify: {
      token?: string;
      deployUrl?: string;
      timeout: number;
    };
    vercel: {
      token?: string;
      timeout: number;
    };
  };
}

export const productionConfig: ProductionConfig = {
  server: {
    port: parseInt(process.env.PORT || '4111'),
    timeout: 60000,
    cors: {
      origin: process.env.ALLOWED_ORIGINS?.split(',') || ['*'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      headers: ['Content-Type', 'Authorization', 'X-Requested-With', 'userId'],
    },
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: parseInt(process.env.RATE_LIMIT_MAX || '100'), // limit each IP to 100 requests per windowMs
      message: 'Too many requests from this IP, please try again later.',
    },
  },
  models: {
    deepseek: {
      apiKey: process.env.DEEPSEEK_API_KEY,
      baseUrl: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com',
      timeout: 30000,
      retries: 3,
    },
    anthropic: {
      apiKey: process.env.ANTHROPIC_API_KEY,
      baseUrl: process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com',
      timeout: 30000,
      retries: 3,
    },
    openai: {
      apiKey: process.env.OPENAI_API_KEY,
      baseUrl: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
      timeout: 30000,
      retries: 3,
    },
  },
  monitoring: {
    enabled: process.env.NODE_ENV === 'production',
    logLevel: (process.env.LOG_LEVEL as any) || 'info',
    metricsEndpoint: '/metrics',
    healthCheckEndpoint: '/health',
  },
  security: {
    apiKeyRequired: process.env.API_KEY_REQUIRED === 'true',
    allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || ['*'],
    maxRequestSize: process.env.MAX_REQUEST_SIZE || '10mb',
    requestTimeout: parseInt(process.env.REQUEST_TIMEOUT || '60000'),
  },
  deployment: {
    netlify: {
      token: process.env.NETLIFY_TOKEN,
      deployUrl: process.env.NETLIFY_DEPLOY_URL,
      timeout: 120000, // 2 minutes for deployment
    },
    vercel: {
      token: process.env.VERCEL_TOKEN,
      timeout: 120000,
    },
  },
};

/**
 * Validate production configuration
 */
export function validateProductionConfig(): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check required environment variables
  if (!productionConfig.models.deepseek.apiKey) {
    warnings.push('DEEPSEEK_API_KEY not configured - DeepSeek models will not work');
  }

  if (!productionConfig.models.anthropic.apiKey) {
    warnings.push('ANTHROPIC_API_KEY not configured - Claude models will not work');
  }

  if (!productionConfig.models.openai.apiKey) {
    warnings.push('OPENAI_API_KEY not configured - GPT models will not work');
  }

  // Check deployment configuration
  if (!productionConfig.deployment.netlify.token || !productionConfig.deployment.netlify.deployUrl) {
    warnings.push('Netlify deployment not configured - deploy API will not work');
  }

  // Check security configuration
  if (productionConfig.server.cors.origin.includes('*') && process.env.NODE_ENV === 'production') {
    warnings.push('CORS is set to allow all origins in production - consider restricting');
  }

  // Check port configuration
  if (productionConfig.server.port < 1024 && process.env.NODE_ENV === 'production') {
    errors.push('Port must be >= 1024 for non-root users in production');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Get configuration for specific environment
 */
export function getEnvironmentConfig(env: string = process.env.NODE_ENV || 'development') {
  const baseConfig = { ...productionConfig };

  switch (env) {
    case 'development':
      return {
        ...baseConfig,
        monitoring: {
          ...baseConfig.monitoring,
          enabled: false,
          logLevel: 'debug' as const,
        },
        security: {
          ...baseConfig.security,
          apiKeyRequired: false,
        },
        server: {
          ...baseConfig.server,
          cors: {
            ...baseConfig.server.cors,
            origin: ['*'], // Allow all origins in development
          },
        },
      };

    case 'test':
      return {
        ...baseConfig,
        monitoring: {
          ...baseConfig.monitoring,
          enabled: false,
          logLevel: 'error' as const,
        },
        security: {
          ...baseConfig.security,
          apiKeyRequired: false,
        },
        server: {
          ...baseConfig.server,
          port: 0, // Use random port for tests
        },
      };

    case 'production':
    default:
      return baseConfig;
  }
}

/**
 * Log configuration status
 */
export function logConfigurationStatus() {
  const validation = validateProductionConfig();
  const config = getEnvironmentConfig();

  console.log('🔧 Configuration Status:');
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   Port: ${config.server.port}`);
  console.log(`   Monitoring: ${config.monitoring.enabled ? 'Enabled' : 'Disabled'}`);
  console.log(`   Log Level: ${config.monitoring.logLevel}`);

  if (validation.warnings.length > 0) {
    console.log('\n⚠️  Configuration Warnings:');
    validation.warnings.forEach(warning => {
      console.log(`   - ${warning}`);
    });
  }

  if (validation.errors.length > 0) {
    console.log('\n❌ Configuration Errors:');
    validation.errors.forEach(error => {
      console.log(`   - ${error}`);
    });
  }

  if (validation.isValid && validation.warnings.length === 0) {
    console.log('\n✅ Configuration is valid and complete');
  }

  return validation;
}
