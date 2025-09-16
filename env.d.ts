/// <reference types="next" />
/// <reference types="next/image-types/global" />

declare namespace NodeJS {
  interface ProcessEnv {
    // API Keys
    GEMINI_API_KEY: string;
    GEMINI_API_KEY_TEST?: string;
    
    // App Configuration
    NEXT_PUBLIC_APP_URL: string;
    NODE_ENV: 'development' | 'test' | 'staging' | 'production';
    PORT?: string;
    
    // Security
    ALLOWED_ORIGINS?: string;
    CRON_SECRET?: string;
    
    // Rate Limiting
    RATE_LIMIT_PER_MINUTE?: string;
    RATE_LIMIT_PER_HOUR?: string;
    
    // File Upload
    MAX_FILE_SIZE?: string;
    MAX_FILES_PER_REQUEST?: string;
    
    // Logging
    LOG_LEVEL?: 'debug' | 'info' | 'warn' | 'error';
    ENABLE_SECURITY_LOGS?: string;
    
    // Monitoring (Optional)
    SENTRY_DSN?: string;
    DATADOG_API_KEY?: string;
    NEW_RELIC_LICENSE_KEY?: string;
    
    // Database (Optional)
    DATABASE_URL?: string;
    
    // Cache (Optional)
    REDIS_URL?: string;
    UPSTASH_REDIS_REST_URL?: string;
    UPSTASH_REDIS_REST_TOKEN?: string;
    
    // Content Moderation (Optional)
    ENABLE_CONTENT_MODERATION?: string;
    MODERATION_API_KEY?: string;
    
    // Vercel
    VERCEL?: string;
    VERCEL_ENV?: 'development' | 'preview' | 'production';
    VERCEL_URL?: string;
    VERCEL_REGION?: string;
    
    // GitHub Actions
    GITHUB_ACTIONS?: string;
    GITHUB_TOKEN?: string;
    
    // CI/CD
    CI?: string;
    VERCEL_TOKEN?: string;
    VERCEL_ORG_ID?: string;
    VERCEL_PROJECT_ID?: string;
    
    // Testing
    CODECOV_TOKEN?: string;
    LHCI_GITHUB_APP_TOKEN?: string;
  }
}