/**
 * Logging Utility - Agenda Inteligente
 * 
 * Provides safe logging that:
 * - Only logs in development by default
 * - Never logs sensitive data (tokens, passwords, emails)
 * - Provides structured logging for better debugging
 */

const isDev = process.env.NODE_ENV === 'development';
const isServer = typeof window === 'undefined';

type LogLevel = 'info' | 'error' | 'warn' | 'debug';

interface LogContext {
  [key: string]: any;
}

/**
 * Sanitize data to remove sensitive information
 */
function sanitize(data: any): any {
  if (!data) return data;
  
  if (typeof data === 'string') {
    // Mask tokens (keep first 8 and last 4 chars)
    if (data.length > 20 && /^[a-f0-9-]+$/i.test(data)) {
      return `${data.substring(0, 8)}...${data.substring(data.length - 4)}`;
    }
    // Mask emails
    if (data.includes('@')) {
      const [user, domain] = data.split('@');
      return `${user.substring(0, 2)}***@${domain}`;
    }
    return data;
  }
  
  if (typeof data === 'object') {
    const sanitized: any = Array.isArray(data) ? [] : {};
    for (const key in data) {
      // Never log these fields
      if (['password', 'token', 'secret', 'key', 'authorization'].includes(key.toLowerCase())) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = sanitize(data[key]);
      }
    }
    return sanitized;
  }
  
  return data;
}

/**
 * Format log message with timestamp and context
 */
function formatLog(level: LogLevel, message: string, context?: LogContext): string {
  const timestamp = new Date().toISOString();
  const prefix = isServer ? '[SERVER]' : '[CLIENT]';
  const contextStr = context ? ` ${JSON.stringify(sanitize(context))}` : '';
  return `${timestamp} ${prefix} [${level.toUpperCase()}] ${message}${contextStr}`;
}

export const logger = {
  /**
   * Info logs - only in development
   */
  info: (message: string, context?: LogContext) => {
    if (isDev) {
      console.log(formatLog('info', message, context));
    }
  },

  /**
   * Error logs - always logged, but sanitized
   */
  error: (message: string, error?: any, context?: LogContext) => {
    const errorInfo = error instanceof Error 
      ? { message: error.message, stack: isDev ? error.stack : undefined }
      : error;
    
    console.error(formatLog('error', message, { ...context, error: sanitize(errorInfo) }));
  },

  /**
   * Warning logs - only in development
   */
  warn: (message: string, context?: LogContext) => {
    if (isDev) {
      console.warn(formatLog('warn', message, context));
    }
  },

  /**
   * Debug logs - only in development
   */
  debug: (message: string, context?: LogContext) => {
    if (isDev) {
      console.debug(formatLog('debug', message, context));
    }
  },

  /**
   * Audit logs - always logged for security events
   */
  audit: (message: string, context?: LogContext) => {
    // Always log audit events, but sanitize
    console.log(formatLog('info', `[AUDIT] ${message}`, sanitize(context)));
  },
};

/**
 * Performance timing utility
 */
export function createTimer(label: string) {
  const start = Date.now();
  
  return {
    end: (context?: LogContext) => {
      const duration = Date.now() - start;
      logger.debug(`${label} completed in ${duration}ms`, context);
    },
  };
}
