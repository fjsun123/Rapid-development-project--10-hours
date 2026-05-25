// 认证路由（OpenAPI 注册版本）
// 登录、刷新 Token、登出

import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';
import { db, schema } from '../db';
import { eq } from 'drizzle-orm';
import { generateTokens, refreshTokens } from '../services/auth-service';
import { authMiddleware } from '../middleware/auth';
import {
  ErrorSchema,
  UserSchema,
  TokenPairSchema,
  LoginResponseSchema,
  SendSmsCodeRequestSchema,
  SendSmsCodeResponseSchema,
  LoginRequestSchema,
  AdminLoginRequestSchema,
  RefreshTokenRequestSchema,
  SuccessMessageSchema,
} from '../schemas';

const app = new OpenAPIHono();

// ============================================
// 短信验证码存储（生产环境应使用 Redis）
// ============================================

const smsCodes = new Map<string, { code: string; expiresAt: number }>();

// ============================================
// POST /sms/code - 发送验证码
// ============================================

const sendSmsCodeRoute = createRoute({
  method: 'post',
  path: '/sms/code',
  tags: ['Auth'],
  summary: '发送短信验证码',
  request: {
    body: {
      content: { 'application/json': { schema: SendSmsCodeRequestSchema } },
    },
  },
  responses: {
    200: {
      content: { 'application/json': { schema: SendSmsCodeResponseSchema } },
      description: '验证码已发送',
    },
    400: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: '参数错误',
    },
  },
});

app.openapi(sendSmsCodeRoute, async (c) => {
  const { phone } = c.req.valid('json');
  const code = Math.random().toString().slice(2, 8);
  smsCodes.set(phone, { code, expiresAt: Date.now() + 5 * 60 * 1000 });
  console.log(`[SMS] ${phone}: ${code}`);
  return c.json(
    {
      success: true,
      message: '验证码已发送',
      ...(process.env.NODE_ENV === 'development' && { _code: code }),
    },
    200
  );
});

// ============================================
// POST /login - 手机号验证码登录
// ============================================

const loginRoute = createRoute({
  method: 'post',
  path: '/login',
  tags: ['Auth'],
  summary: '手机号验证码登录',
  request: {
    body: { content: { 'application/json': { schema: LoginRequestSchema } } },
  },
  responses: {
    200: {
      content: { 'application/json': { schema: LoginResponseSchema } },
      description: '登录成功',
    },
    400: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: '验证码错误或已过期',
    },
  },
});

app.openapi(loginRoute, async (c) => {
  const { phone, code } = c.req.valid('json');

  const storedCode = smsCodes.get(phone);
  if (!storedCode || storedCode.code !== code || storedCode.expiresAt < Date.now()) {
    return c.json({ error: 'invalid_code', message: '验证码错误或已过期' }, 400);
  }
  smsCodes.delete(phone);

  let [user] = await db.select().from(schema.users).where(eq(schema.users.phone, phone));

  if (!user) {
    let [customer] = await db
      .select()
      .from(schema.customers)
      .where(eq(schema.customers.phone, phone));
    if (!customer) {
      [customer] = await db
        .insert(schema.customers)
        .values({ name: `用户${phone.slice(-4)}`, phone })
        .returning();
    }
    await db
      .insert(schema.users)
      .values({
        phone,
        name: customer.name,
        role: 'customer',
        customerId: customer.id,
      })
      .onConflictDoNothing();
    [user] = await db.select().from(schema.users).where(eq(schema.users.phone, phone));
  }

  await db
    .update(schema.users)
    .set({ lastLoginAt: new Date() })
    .where(eq(schema.users.id, user.id));

  const tokens = generateTokens(user);

  return c.json(
    {
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        avatar: user.avatar,
        role: user.role,
        customerId: user.customerId,
      },
      ...tokens,
    },
    200
  );
});

// ============================================
// POST /admin/login - 管理员登录
// ============================================

const adminLoginRoute = createRoute({
  method: 'post',
  path: '/admin/login',
  tags: ['Auth'],
  summary: '管理员用户名密码登录',
  request: {
    body: { content: { 'application/json': { schema: AdminLoginRequestSchema } } },
  },
  responses: {
    200: {
      content: { 'application/json': { schema: LoginResponseSchema } },
      description: '登录成功',
    },
    401: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: '用户名或密码错误',
    },
  },
});

app.openapi(adminLoginRoute, async (c) => {
  const { username, password } = c.req.valid('json');

  const [user] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.phone, username));

  if (!user || user.role === 'customer') {
    return c.json({ error: 'unauthorized', message: '用户名或密码错误' }, 401);
  }
  if (password !== 'admin123') {
    return c.json({ error: 'unauthorized', message: '用户名或密码错误' }, 401);
  }

  await db
    .update(schema.users)
    .set({ lastLoginAt: new Date() })
    .where(eq(schema.users.id, user.id));

  const tokens = generateTokens(user);

  return c.json(
    {
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        avatar: user.avatar,
        role: user.role,
        customerId: user.customerId,
      },
      ...tokens,
    },
    200
  );
});

// ============================================
// POST /refresh - 刷新 Token
// ============================================

const refreshRoute = createRoute({
  method: 'post',
  path: '/refresh',
  tags: ['Auth'],
  summary: '刷新 access token',
  request: {
    body: { content: { 'application/json': { schema: RefreshTokenRequestSchema } } },
  },
  responses: {
    200: {
      content: { 'application/json': { schema: TokenPairSchema } },
      description: '刷新成功',
    },
    401: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: '刷新令牌无效',
    },
  },
});

app.openapi(refreshRoute, async (c) => {
  const { refreshToken } = c.req.valid('json');
  const tokens = await refreshTokens(refreshToken);
  if (!tokens) {
    return c.json({ error: 'invalid_refresh_token', message: '刷新令牌无效' }, 401);
  }
  return c.json(tokens, 200);
});

// ============================================
// POST /logout - 登出
// ============================================

const logoutRoute = createRoute({
  method: 'post',
  path: '/logout',
  tags: ['Auth'],
  summary: '登出',
  responses: {
    200: {
      content: { 'application/json': { schema: SuccessMessageSchema } },
      description: '已登出',
    },
  },
});

app.openapi(logoutRoute, async (c) => {
  return c.json({ success: true, message: '已登出' }, 200);
});

// ============================================
// GET /me - 获取当前用户信息（需要认证）
// ============================================

const meRoute = createRoute({
  method: 'get',
  path: '/me',
  tags: ['Auth'],
  summary: '获取当前登录用户',
  security: [{ Bearer: [] }],
  middleware: [authMiddleware] as const,
  responses: {
    200: {
      content: { 'application/json': { schema: UserSchema } },
      description: '当前用户',
    },
    401: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: '未认证',
    },
    404: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: '用户不存在',
    },
  },
});

app.openapi(meRoute, async (c) => {
  const user = c.get('user');
  if (!user) {
    return c.json({ error: 'unauthorized' }, 401);
  }
  const [dbUser] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, user.userId));
  if (!dbUser) {
    return c.json({ error: 'user_not_found' }, 404);
  }
  return c.json(
    {
      id: dbUser.id,
      phone: dbUser.phone,
      name: dbUser.name,
      avatar: dbUser.avatar,
      role: dbUser.role,
      customerId: dbUser.customerId,
    },
    200
  );
});

export default app;
