// 测试环境设置
import { beforeAll, afterAll } from 'vitest';

// 全局设置
beforeAll(async () => {
  console.log('🧪 初始化测试环境...');

  // 设置测试环境变量
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-secret-key-for-testing';

  console.log('✅ 测试环境变量已设置');
  console.log('⚠️ 数据库测试需要 PostgreSQL 运行在 localhost:5432');
}, 5000);

afterAll(async () => {
  console.log('🧹 清理测试环境...');
});
