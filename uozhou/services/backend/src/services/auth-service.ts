// JWT 认证服务
// 处理 token 生成、验证、刷新

import jwt from 'jsonwebtoken';
import { db, schema } from '../db';
import { eq } from 'drizzle-orm';

// ============================================
// 配置
// ============================================

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d'; // 7 天
const JWT_REFRESH_EXPIRES_IN = '30d'; // 30 天

// ============================================
// Token 类型
// ============================================

export interface JwtPayload {
  userId: number;
  phone: string;
  role: 'admin' | 'staff' | 'customer';
  iat: number;
  exp: number;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

// ============================================
// Token 生成
// ============================================

export function generateTokens(user: { id: number; phone: string; role: string }): TokenPair {
  const payload = {
    userId: user.id,
    phone: user.phone,
    role: user.role,
  };

  const accessToken = jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });

  const refreshToken = jwt.sign(
    { ...payload, type: 'refresh' },
    JWT_SECRET,
    { expiresIn: JWT_REFRESH_EXPIRES_IN }
  );

  // 解码获取过期时间
  const decoded = jwt.decode(accessToken) as JwtPayload;

  return {
    accessToken,
    refreshToken,
    expiresIn: decoded.exp * 1000, // 转换为毫秒
  };
}

// ============================================
// Token 验证
// ============================================

export function verifyToken(token: string): JwtPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}

export function verifyRefreshToken(token: string): JwtPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload & { type: string };
    if (decoded.type !== 'refresh') {
      return null;
    }
    return decoded;
  } catch (error) {
    return null;
  }
}

// ============================================
// Token 刷新
// ============================================

export async function refreshTokens(refreshToken: string): Promise<TokenPair | null> {
  const payload = verifyRefreshToken(refreshToken);
  if (!payload) {
    return null;
  }

  // 验证用户是否仍然有效
  const [user] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, payload.userId));

  if (!user || !user.active) {
    return null;
  }

  return generateTokens(user);
}

// ============================================
// 从请求头提取 Token
// ============================================

export function extractToken(authHeader: string | undefined): string | null {
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
}
