// Performance configuration for the backend

export const performanceConfig = {
  // Database connection pool settings
  database: {
    maxConnections: 20,
    minConnections: 5,
    idleTimeoutMillis: 30000,
    acquireTimeoutMillis: 60000,
    createTimeoutMillis: 30000,
    destroyTimeoutMillis: 5000,
    reapIntervalMillis: 1000,
    createRetryIntervalMillis: 200,
  },

  // Redis cache settings
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    db: 0,
    keyPrefix: 'adit:',
    retryDelayOnFailover: 100,
    maxRetriesPerRequest: 3,
    lazyConnect: true,
    keepAlive: 30000,
    connectTimeout: 10000,
    commandTimeout: 5000,
  },

  // Cache TTL settings (in seconds)
  cache: {
    userSession: 86400, // 24 hours
    academicData: 1800, // 30 minutes
    dashboardStats: 300, // 5 minutes
    searchResults: 900, // 15 minutes
    apiResponse: 60, // 1 minute
  },

  // API rate limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    enabled: true,
  },

  // Pagination settings
  pagination: {
    defaultLimit: 20,
    maxLimit: 100,
    minLimit: 1,
  },

  // File upload settings
  upload: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/jpeg',
      'image/png',
      'image/gif',
      'text/plain',
    ],
    uploadPath: './uploads',
    compression: true,
    watermark: false,
  },

  // Performance monitoring
  monitoring: {
    enabled: process.env.NODE_ENV === 'production',
    slowQueryThreshold: 1000, // milliseconds
    memoryThreshold: 0.8, // 80% of available memory
    cpuThreshold: 0.8, // 80% CPU usage
    diskThreshold: 0.9, // 90% disk usage
  },

  // Security settings
  security: {
    bcryptRounds: 12,
    jwtSecret: process.env.JWT_SECRET || 'fallback-secret-change-in-production',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
    sessionSecret: process.env.SESSION_SECRET || 'fallback-session-secret',
    corsOrigins: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
    helmetEnabled: true,
    rateLimitEnabled: true,
  },

  // Logging configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.NODE_ENV === 'production' ? 'json' : 'simple',
    file: {
      enabled: process.env.NODE_ENV === 'production',
      filename: 'logs/app.log',
      maxSize: '20m',
      maxFiles: '14d',
    },
    console: {
      enabled: true,
      colorize: process.env.NODE_ENV !== 'production',
    },
  },

  // Background job processing
  jobs: {
    enabled: true,
    concurrency: 5,
    maxAttempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: 100,
    removeOnFail: 50,
  },

  // Email configuration (for notifications)
  email: {
    provider: process.env.EMAIL_PROVIDER || 'smtp',
    smtp: {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    },
    from: process.env.EMAIL_FROM || 'noreply@adit.edu',
    templates: {
      dir: './templates/email',
      cache: true,
    },
  },

  // Analytics and metrics
  analytics: {
    enabled: process.env.ANALYTICS_ENABLED === 'true',
    provider: process.env.ANALYTICS_PROVIDER || 'internal',
    trackingId: process.env.ANALYTICS_TRACKING_ID,
    sampleRate: parseFloat(process.env.ANALYTICS_SAMPLE_RATE || '0.1'),
  },
};

// Environment-specific overrides
if (process.env.NODE_ENV === 'development') {
  performanceConfig.rateLimit.maxRequests = 1000;
  performanceConfig.cache.userSession = 3600; // 1 hour in dev
  performanceConfig.monitoring.enabled = false;
  performanceConfig.logging.level = 'debug';
}

if (process.env.NODE_ENV === 'test') {
  performanceConfig.rateLimit.enabled = false;
  performanceConfig.cache.userSession = 300; // 5 minutes in test
  performanceConfig.monitoring.enabled = false;
  performanceConfig.logging.level = 'error';
}
