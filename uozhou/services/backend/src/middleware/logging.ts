// 日志中间件
// 记录请求用户、请求数据、响应数据

import { Context, Next } from 'hono';
import { get } from 'http';

// ============================================
// 日志级别
// ============================================

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

// ============================================
// 日志配置
// ============================================

const LOG_LEVEL = (process.env.LOG_LEVEL as LogLevel) || 'info';
const LOG_FILE = process.env.LOG_FILE || './logs/api.log';

// ============================================
// 日志格式化
// ============================================

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  requestId: string;
  userId?: number;
  userRole?: string;
  method: string;
  path: string;
  query?: Record<string, string>;
  requestBody?: unknown;
  responseBody?: unknown;
  statusCode: number;
  duration: number;
  error?: string;
}

function formatLog(entry: LogEntry): string {
  return JSON.stringify(entry);
}

// ============================================
// 生成请求ID
// ============================================

function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// ============================================
// 日志输出
// ============================================

const logs: LogEntry[] = [];

function log(entry: LogEntry) {
  // 内存存储（生产环境应写入文件或发送到日志服务）
  logs.push(entry);

  // 控制台输出
  const levelColors = {
    debug: '\x1b[36m',  // cyan
    info: '\x1b[32m',   // green
    warn: '\x1b[33m',   // yellow
    error: '\x1b[31m',  // red
  };

  const reset = '\x1b[0m';
  const color = levelColors[entry.level];

  if (entry.level === 'error') {
    console.error(formatLog(entry));
  } else if (entry.level === 'warn') {
    console.warn(formatLog(entry));
  } else if (LOG_LEVEL === 'debug' || entry.level === 'info') {
    console.log(`${color}[${entry.level}]${reset} ${entry.method} ${entry.path} ${entry.statusCode} ${entry.duration}ms`);
    if (LOG_LEVEL === 'debug') {
      if (entry.requestBody) console.log('  Request:', JSON.stringify(entry.requestBody));
      if (entry.responseBody) console.log('  Response:', JSON.stringify(entry.responseBody));
      if (entry.error) console.log('  Error:', entry.error);
    }
  }
}

// ============================================
// 日志中间件
// ============================================

export async function loggingMiddleware(c: Context, next: Next) {
  const requestId = generateRequestId();
  const startTime = Date.now();

  // 获取用户信息（如果已认证）
  const user = c.get('user');

  // 获取请求体（仅记录非敏感路径）
  const path = c.req.path;
  const method = c.req.method;
  const isSensitivePath = path.includes('/auth/login') || path.includes('/sms/code');

  let requestBody: unknown = undefined;
  if (!isSensitivePath && ['POST', 'PUT', 'PATCH'].includes(method)) {
    try {
      requestBody = await c.req.json().catch(() => null);
    } catch {
      requestBody = '[binary or unreadable]';
    }
  }

  // 构建日志条目基础信息
  const baseEntry: Partial<LogEntry> = {
    timestamp: new Date().toISOString(),
    requestId,
    userId: user?.userId,
    userRole: user?.role,
    method,
    path,
    query: c.req.query(),
    requestBody,
  };

  // 执行请求
  try {
    await next();

    // 获取响应
    const statusCode = c.res.status;

    // 记录成功请求
    const duration = Date.now() - startTime;

    log({
      ...baseEntry as LogEntry,
      level: statusCode >= 400 ? 'warn' : 'info',
      statusCode,
      duration,
    });
  } catch (error) {
    // 记录错误
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);

    log({
      ...baseEntry as LogEntry,
      level: 'error',
      statusCode: 500,
      duration,
      error: errorMessage,
    });

    throw error;
  }
}

// ============================================
// 获取日志历史
// ============================================

export function getLogs(limit?: number): LogEntry[] {
  if (limit) {
    return logs.slice(-limit);
  }
  return [...logs];
}

// ============================================
// 清空日志
// ============================================

export function clearLogs(): void {
  logs.length = 0;
}

// ============================================
// 导出日志类型
// ============================================

export type { LogEntry, LogLevel };