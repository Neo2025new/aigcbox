// 统一的日志系统
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  userId?: string;
  sessionId?: string;
  requestId?: string;
  ip?: string;
  userAgent?: string;
  [key: string]: any;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: Error;
  stack?: string;
}

class Logger {
  private logLevel: LogLevel;
  private enableSecurityLogs: boolean;

  constructor() {
    this.logLevel = (process.env.LOG_LEVEL as LogLevel) || 'info';
    this.enableSecurityLogs = process.env.ENABLE_SECURITY_LOGS === 'true';
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    return levels.indexOf(level) >= levels.indexOf(this.logLevel);
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext, error?: Error): string {
    const timestamp = new Date().toISOString();
    const logEntry: LogEntry = {
      timestamp,
      level,
      message,
      context,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } as any : undefined,
    };

    return JSON.stringify(logEntry);
  }

  private log(level: LogLevel, message: string, context?: LogContext, error?: Error): void {
    if (!this.shouldLog(level)) return;

    const formattedMessage = this.formatMessage(level, message, context, error);

    // 在不同环境中输出到不同的目标
    if (process.env.NODE_ENV === 'production') {
      // 生产环境：结构化日志输出到 stdout
      console.log(formattedMessage);
      
      // 如果有 Sentry 或其他监控工具，在这里发送
      this.sendToMonitoring(level, message, context, error);
    } else {
      // 开发环境：更友好的控制台输出
      const colorizedMessage = this.colorizeMessage(level, message);
      console.log(`[${new Date().toLocaleTimeString()}] ${colorizedMessage}`, context || '');
      
      if (error) {
        console.error(error);
      }
    }
  }

  private colorizeMessage(level: LogLevel, message: string): string {
    const colors = {
      debug: '\x1b[36m', // cyan
      info: '\x1b[32m',  // green
      warn: '\x1b[33m',  // yellow
      error: '\x1b[31m', // red
    };
    const reset = '\x1b[0m';
    
    return `${colors[level]}[${level.toUpperCase()}]${reset} ${message}`;
  }

  private sendToMonitoring(level: LogLevel, message: string, context?: LogContext, error?: Error): void {
    // 这里可以集成 Sentry, DataDog, New Relic 等监控工具
    
    // Sentry 示例
    if (process.env.SENTRY_DSN && (level === 'error' || level === 'warn')) {
      // import * as Sentry from '@sentry/nextjs';
      // Sentry.captureException(error || new Error(message), {
      //   level: level === 'error' ? 'error' : 'warning',
      //   extra: context,
      // });
    }
    
    // DataDog 示例
    if (process.env.DATADOG_API_KEY) {
      // 发送到 DataDog
    }
  }

  debug(message: string, context?: LogContext): void {
    this.log('debug', message, context);
  }

  info(message: string, context?: LogContext): void {
    this.log('info', message, context);
  }

  warn(message: string, context?: LogContext, error?: Error): void {
    this.log('warn', message, context, error);
  }

  error(message: string, context?: LogContext, error?: Error): void {
    this.log('error', message, context, error);
  }

  // 安全相关日志
  security(event: string, context?: LogContext): void {
    if (!this.enableSecurityLogs) return;
    
    this.info(`SECURITY: ${event}`, {
      ...context,
      securityEvent: true,
      timestamp: new Date().toISOString(),
    });
  }

  // API 请求日志
  api(method: string, path: string, status: number, duration: number, context?: LogContext): void {
    const level = status >= 400 ? 'error' : status >= 300 ? 'warn' : 'info';
    this.log(level, `API ${method} ${path} ${status} ${duration}ms`, context);
  }

  // 性能日志
  performance(metric: string, value: number, context?: LogContext): void {
    this.info(`PERFORMANCE: ${metric} = ${value}`, context);
  }
}

// 创建全局 logger 实例
export const logger = new Logger();

// 用于 API 路由的中间件
export function withLogging<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  operation: string
): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    const start = Date.now();
    const requestId = Math.random().toString(36).substring(7);
    
    logger.debug(`Starting ${operation}`, { requestId });
    
    try {
      const result = await fn(...args);
      const duration = Date.now() - start;
      
      logger.info(`Completed ${operation}`, {
        requestId,
        duration,
        success: true,
      });
      
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      
      logger.error(`Failed ${operation}`, {
        requestId,
        duration,
        success: false,
      }, error instanceof Error ? error : new Error(String(error)));
      
      throw error;
    }
  };
}

// Web Vitals 日志记录
export function reportWebVitals(metric: any): void {
  logger.performance(metric.name, metric.value, {
    id: metric.id,
    label: metric.label,
  });
}