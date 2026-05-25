import { defineConfig } from 'orval';

export default defineConfig({
  restaurant: {
    input: {
      target: './openapi.json',
    },
    output: {
      mode: 'tags-split',                 // 按 OpenAPI tags 拆分（Auth/Orders/Menu/...）
      target: './src/generated',           // 生成到 src/generated/
      schemas: './src/generated/model',    // schema 类型独立目录
      client: 'react-query',               // 生成 React Query hooks
      httpClient: 'axios',
      override: {
        mutator: {
          path: './src/mutator.ts',         // 复用我们 axios 实例（带 JWT/401 拦截）
          name: 'api',
        },
        query: {
          useQuery: true,
          useMutation: true,
          signal: false,
          options: {
            staleTime: 30_000,
          },
        },
      },
      clean: true,                          // 清理旧产物
    },
  },
});
