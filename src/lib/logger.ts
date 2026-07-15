type LogLevel = 'info' | 'warn' | 'error' | 'debug';
type LogCategory = 'app' | 'security' | 'admin' | 'ai' | 'payment';

interface LogContext {
  category: LogCategory;
  userId?: string;
  metadata?: Record<string, any>;
  error?: Error;
}

/**
 * Enterprise Logging Service
 * Wraps Sentry, LogRocket, and console for unified observability.
 */
class LoggerService {
  private isProduction = import.meta.env.PROD;

  private formatMessage(level: LogLevel, message: string, context: LogContext) {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level.toUpperCase()}] [${context.category.toUpperCase()}] ${message}`;
  }

  private captureExternal(level: LogLevel, message: string, context: LogContext) {
    if (!this.isProduction) return;

    // Example Sentry Integration
    // if (window.Sentry) {
    //   window.Sentry.withScope((scope) => {
    //     scope.setTag('category', context.category);
    //     if (context.userId) scope.setUser({ id: context.userId });
    //     if (context.metadata) scope.setExtras(context.metadata);
    //     if (level === 'error' && context.error) {
    //       window.Sentry.captureException(context.error);
    //     } else {
    //       window.Sentry.captureMessage(message, level);
    //     }
    //   });
    // }

    // Example LogRocket Integration
    // if (window.LogRocket) {
    //   if (level === 'error' && context.error) {
    //     window.LogRocket.captureException(context.error, { extra: context.metadata });
    //   } else {
    //     window.LogRocket.captureMessage(message, { extra: context.metadata });
    //   }
    // }
  }

  log(level: LogLevel, message: string, context: LogContext) {
    const formattedMessage = this.formatMessage(level, message, context);
    
    // Console logging
    if (level === 'error') {
      console.error(formattedMessage, context.error || '', context.metadata || '');
    } else if (level === 'warn') {
      console.warn(formattedMessage, context.metadata || '');
    } else if (level === 'info') {
      console.info(formattedMessage, context.metadata || '');
    } else if (level === 'debug' && !this.isProduction) {
      console.debug(formattedMessage, context.metadata || '');
    }

    // External Error Tracking
    this.captureExternal(level, message, context);
  }

  info(message: string, context: LogContext) {
    this.log('info', message, context);
  }

  warn(message: string, context: LogContext) {
    this.log('warn', message, context);
  }

  error(message: string, context: LogContext) {
    this.log('error', message, context);
  }

  debug(message: string, context: LogContext) {
    this.log('debug', message, context);
  }
}

export const logger = new LoggerService();
