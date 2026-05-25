// 生成 OpenAPI 契约 - 从 Hono app 实例导出 /openapi.json 到 packages/api-client/openapi.json
// 不依赖运行中的服务，直接通过 app.request 走内部路由
import app from '../src/routes/api';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function main() {
  console.log('🔄 Generating OpenAPI spec from Hono app...');

  const res = await app.request('/openapi.json');
  if (!res.ok) {
    console.error(`❌ /openapi.json returned ${res.status}`);
    process.exit(1);
  }

  const spec: any = await res.json();
  const outDir = resolve(__dirname, '../../../packages/api-client');
  const outPath = resolve(outDir, 'openapi.json');

  if (!existsSync(outDir)) {
    mkdirSync(outDir, { recursive: true });
  }
  writeFileSync(outPath, JSON.stringify(spec, null, 2), 'utf-8');

  const pathCount = Object.keys(spec.paths || {}).length;
  console.log(`✅ OpenAPI spec written to: packages/api-client/openapi.json`);
  console.log(`   - OpenAPI: ${spec.openapi}`);
  console.log(`   - Title: ${spec.info?.title ?? '-'}`);
  console.log(`   - Paths: ${pathCount}`);
  console.log('');
  console.log('💡 MVP 阶段前端 hooks 已手写在:');
  console.log('   - packages/api-client/src/hooks/{auth,menu,orders,customers,dashboard,settings}.ts');
  console.log('   - packages/types/src/index.ts');
  console.log('   后续可用 orval 把 openapi.json 重新生成 hooks 替换手写实现。');
}

main().catch((e) => {
  console.error('❌ gen:contract failed:', e);
  process.exit(1);
});
