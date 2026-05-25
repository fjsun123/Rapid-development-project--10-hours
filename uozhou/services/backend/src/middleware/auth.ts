// 认证中间件
// 统一入口，验证 JWT Token

import { Context, Next } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { verifyToken, extractToken, type JwtPayload } from '../services/auth-service';

// ============================================
// 类型扩展
// ============================================

declare module 'hono' {
  interface ContextVariableMap {
    user: JwtPayload;
  }
}

// ============================================
// 认证中间件
// ============================================

export async function authMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization');
  const token = extractToken(authHeader);

  if (!token) {
    throw new HTTPException(401, {
      message: JSON.stringify({
        error: 'unauthorized',
        message: '缺少认证令牌',
      }),
    });
  }

  const payload = verifyToken(token);

  if (!payload) {
    throw new HTTPException(401, {
      message: JSON.stringify({
        error: 'invalid_token',
        message: '令牌无效或已过期',
      }),
    });
  }

  // 将用户信息存入上下文
  c.set('user', payload);

  await next();
}

// ============================================
// 可选认证中间件（不强制）
// ============================================

export async function optionalAuthMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization');
  const token = extractToken(authHeader);

  if (token) {
    const payload = verifyToken(token);
    if (payload) {
      c.set('user', payload);
    }
  }

  await next();
}

// ============================================
// 角色权限中间件
// ============================================

export function requireRole(...allowedRoles: ('admin' | 'staff' | 'customer')[]) {
  return async (c: Context, next: Next) => {
    const user = c.get('user');

    if (!user) {
      throw new HTTPException(401, {
        message: JSON.stringify({
          error: 'unauthorized',
          message: '未认证',
        }),
      });
    }

    if (!allowedRoles.includes(user.role as any)) {
      throw new HTTPException(403, {
        message: JSON.stringify({
          error: 'forbidden',
          message: `需要 ${allowedRoles.join(' 或 ')} 权限`,
        }),
      });
    }

    await next();
  };
}

// ============================================
// 获取当前用户
// ============================================

export function getCurrentUser(c: Context): JwtPayload | null {
  return c.get('user') ?? null;
}

// ============================================
// 权限检查辅助函数
// ============================================

export const requireAdmin = requireRole('admin');
export const requireStaff = requireRole('admin', 'staff');
export const requireCustomer = requireRole('customer');
