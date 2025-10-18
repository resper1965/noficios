/**
 * Structured Logging Utility
 * 
 * Provides consistent, structured logging across the application
 * Based on Context7 observability patterns
 * 
 * @module lib/logger
 * @priority P1
 * @quality Fase 2 (+1 point)
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  requestId?: string;
  userId?: string;
  method?: string;
  url?: string;
  ip?: string;
  [key: string]: unknown;
}

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

/**
 * Logger class with context support
 */
class Logger {
  private context: LogContext = {};
  private level: LogLevel;

  constructor(context?: LogContext) {
    this.context = context || {};
    this.level = (process.env.LOG_LEVEL as LogLevel) || 'info';
  }

  /**
   * Create child logger with additional context
   */
  child(additionalContext: LogContext): Logger {
    return new Logger({
      ...this.context,
      ...additionalContext
    });
  }

  /**
   * Debug level logging
   */
  debug(message: string, context?: LogContext): void {
    if (this.shouldLog('debug')) {
      this.log('debug', message, context);
    }
  }

  /**
   * Info level logging
   */
  info(message: string, context?: LogContext): void {
    if (this.shouldLog('info')) {
      this.log('info', message, context);
    }
  }

  /**
   * Warning level logging
   */
  warn(message: string, context?: LogContext): void {
    if (this.shouldLog('warn')) {
      this.log('warn', message, context);
    }
  }

  /**
   * Error level logging
   */
  error(message: string, errorOrContext?: Error | LogContext, context?: LogContext): void {
    if (this.shouldLog('error')) {
      let error: Error | undefined;
      let ctx: LogContext | undefined;

      if (errorOrContext instanceof Error) {
        error = errorOrContext;
        ctx = context;
      } else {
        ctx = errorOrContext;
      }

      this.log('error', message, ctx, error);
    }
  }

  /**
   * Internal log method
   */
  private log(
    level: LogLevel,
    message: string,
    context?: LogContext,
    error?: Error
  ): void {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context: this.sanitizeContext({
        ...this.context,
        ...context
      })
    };

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      };
    }

    // Output based on environment
    if (process.env.NODE_ENV === 'production') {
      // Structured JSON for production
      console.log(JSON.stringify(entry));
    } else {
      // Pretty print for development
      const prefix = this.getLevelPrefix(level);
      const contextStr = Object.keys(entry.context || {}).length > 0
        ? `\n  Context: ${JSON.stringify(entry.context, null, 2)}`
        : '';
      const errorStr = error
        ? `\n  Error: ${error.name}: ${error.message}${error.stack ? '\n  ' + error.stack : ''}`
        : '';

      console.log(`${prefix} ${message}${contextStr}${errorStr}`);
    }
  }

  /**
   * Check if should log based on level
   */
  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    const currentLevelIndex = levels.indexOf(this.level);
    const messageLevelIndex = levels.indexOf(level);
    
    return messageLevelIndex >= currentLevelIndex;
  }

  /**
   * Get emoji prefix for log level
   */
  private getLevelPrefix(level: LogLevel): string {
    const prefixes = {
      debug: '🔍',
      info: 'ℹ️',
      warn: '⚠️',
      error: '❌'
    };
    
    return `[${level.toUpperCase()}] ${prefixes[level]}`;
  }

  /**
   * Sanitize context to remove sensitive data
   */
  private sanitizeContext(context: LogContext): LogContext {
    const sensitiveKeys = [
      'password',
      'token',
      'secret',
      'apikey',
      'api_key',
      'authorization',
      'auth',
      'credential'
    ];

    const sanitized: LogContext = {};

    for (const [key, value] of Object.entries(context)) {
      const lowerKey = key.toLowerCase();
      
      if (sensitiveKeys.some(sk => lowerKey.includes(sk))) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeContext(value as LogContext);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }
}

/**
 * Default logger instance
 */
export const logger = new Logger({
  service: 'n-oficios',
  environment: process.env.NODE_ENV || 'development'
});

/**
 * Create request-scoped logger
 * 
 * Usage in API routes:
 * ```typescript
 * const log = createRequestLogger(request);
 * log.info('Processing request');
 * ```
 */
export function createRequestLogger(request: Request): Logger {
  const headers = request.headers;
  
  return logger.child({
    requestId: crypto.randomUUID(),
    method: request.method,
    url: request.url,
    ip: headers.get('x-forwarded-for') || 
        headers.get('x-real-ip') || 
        'unknown',
    userAgent: headers.get('user-agent')
  });
}

