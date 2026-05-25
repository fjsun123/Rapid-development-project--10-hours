// Hono on Cloudflare Workers 入口
// 自动建表 + 日志中间件

import app from './routes/api';
import { initializeDatabase } from './db';
import { loggingMiddleware } from './middleware/logging';

// ============================================
// 添加日志中间件（第一个中间件）
// ============================================

app.use('*', loggingMiddleware);

// ============================================
// 日志查看端点（调试用）
// ============================================

import { getLogs, clearLogs } from './middleware/logging';

app.get('/api/logs', async (c) => {
  const limit = parseInt(c.req.query('limit') || '100');
  const logs = getLogs(limit);
  return c.json({ logs, count: logs.length });
});

app.delete('/api/logs', async (c) => {
  clearLogs();
  return c.json({ success: true, message: '日志已清空' });
});

// ============================================
// 启动时初始化数据库
// ============================================

// Cloudflare Workers 环境
export default {
  async fetch(request: Request, env: Record<string, string>, ctx: unknown) {
    // 设置环境变量
    if (env.DATABASE_URL) {
      process.env.DATABASE_URL = env.DATABASE_URL;
    }
    if (env.JWT_SECRET) {
      process.env.JWT_SECRET = env.JWT_SECRET;
    }

    return app.fetch(request, env, ctx);
  },
};

// ============================================
// Node.js 本地开发入口
// ============================================

// @ts-ignore
if (typeof process !== 'undefined' && process.versions?.node) {
  (async () => {
    try {
      // 初始化数据库（自动建表）
      await initializeDatabase();

      // 启动服务器
      const { serve } = await import('@hono/node-server');
      serve({
        fetch: app.fetch,
        port: 3001,
      });

      console.log('');
      console.log('========================================');
      console.log('🍽️  餐厅运营 API 已启动');
      console.log('========================================');
      console.log('  URL: http://localhost:3001');
      console.log('  API: http://localhost:3001/api');
      console.log('  日志: http://localhost:3001/api/logs');
      console.log('  OpenAPI: http://localhost:3001/openapi.json');
      console.log('========================================');
      console.log('');
    } catch (error) {
      console.error('启动失败:', error);
      process.exit(1);
    }
  })();
}

export type AppType = typeof app;
