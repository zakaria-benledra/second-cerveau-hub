/**
 * Logger structuré pour observabilité et debugging
 * Format JSON compatible avec Datadog/CloudWatch/Loki
 */

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL';

export interface LogContext {
  traceId?: string;
  spanId?: string;
  userId?: string;
  service: string;
  version?: string;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  service: string;
  traceId?: string;
  spanId?: string;
  userId?: string;
  duration_ms?: number;
  data?: Record<string, unknown>;
  error?: {
    name: string;
    message: string;
    stack?: string;
    code?: string;
  };
}

export class StructuredLogger {
  private context: LogContext;
  private startTime?: number;

  constructor(service: string) {
    this.context = { service };
  }

  /**
   * Set context for all subsequent logs
   */
  setContext(ctx: Partial<LogContext>): this {
    this.context = { ...this.context, ...ctx };
    return this;
  }

  /**
   * Start a timer for measuring duration
   */
  startTimer(): this {
    this.startTime = Date.now();
    return this;
  }

  /**
   * Get elapsed time since startTimer()
   */
  getElapsed(): number {
    return this.startTime ? Date.now() - this.startTime : 0;
  }

  private formatEntry(
    level: LogLevel,
    message: string,
    data?: Record<string, unknown>,
    error?: Error
  ): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      service: this.context.service,
      traceId: this.context.traceId,
      spanId: this.context.spanId,
      userId: this.context.userId,
    };

    if (this.startTime) {
      entry.duration_ms = Date.now() - this.startTime;
    }

    if (data && Object.keys(data).length > 0) {
      entry.data = data;
    }

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: (error as any).code,
      };
    }

    return entry;
  }

  private output(entry: LogEntry): void {
    const json = JSON.stringify(entry);
    switch (entry.level) {
      case 'ERROR':
      case 'FATAL':
        console.error(json);
        break;
      case 'WARN':
        console.warn(json);
        break;
      default:
        console.log(json);
    }
  }

  debug(message: string, data?: Record<string, unknown>): void {
    this.output(this.formatEntry('DEBUG', message, data));
  }

  info(message: string, data?: Record<string, unknown>): void {
    this.output(this.formatEntry('INFO', message, data));
  }

  warn(message: string, data?: Record<string, unknown>): void {
    this.output(this.formatEntry('WARN', message, data));
  }

  error(message: string, error?: Error, data?: Record<string, unknown>): void {
    this.output(this.formatEntry('ERROR', message, data, error));
  }

  fatal(message: string, error?: Error, data?: Record<string, unknown>): void {
    this.output(this.formatEntry('FATAL', message, data, error));
  }

  /**
   * Log request received (standard pattern)
   */
  logRequest(method: string, path: string, data?: Record<string, unknown>): void {
    this.info(`${method} ${path}`, { ...data, event: 'REQUEST_RECEIVED' });
  }

  /**
   * Log response sent (standard pattern)
   */
  logResponse(status: number, data?: Record<string, unknown>): void {
    const level = status >= 500 ? 'ERROR' : status >= 400 ? 'WARN' : 'INFO';
    this.output(this.formatEntry(level, `Response ${status}`, { 
      ...data, 
      status,
      event: 'RESPONSE_SENT',
      duration_ms: this.getElapsed(),
    }));
  }
}

/**
 * Generate unique trace ID
 */
export function generateTraceId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `trace_${timestamp}_${random}`;
}

/**
 * Generate unique span ID
 */
export function generateSpanId(): string {
  return `span_${Math.random().toString(36).substring(2, 10)}`;
}

/**
 * Factory function
 */
export function createLogger(service: string): StructuredLogger {
  return new StructuredLogger(service);
}

/**
 * Extract trace ID from request headers or generate new one
 */
export function getOrCreateTraceId(req: Request): string {
  return req.headers.get('x-trace-id') || generateTraceId();
}
