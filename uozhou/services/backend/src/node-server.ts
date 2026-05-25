// Node 入口 - 本地开发用，绕过 Cloudflare Workers sandbox 限制
// 生产仍走 wrangler dev / wrangler deploy（用 src/index.ts）
import { serve } from '@hono/node-server';
import app from './routes/api';
import { initializeDatabase } from './db';

const PORT = parseInt(process.env.PORT || '3001');

(async () => {
  console.log('🚀 Starting node-server (local dev)...');
  await initializeDatabase();
  serve({ fetch: app.fetch, port: PORT });
  console.log(`✅ Backend listening on http://localhost:${PORT}`);
})();
