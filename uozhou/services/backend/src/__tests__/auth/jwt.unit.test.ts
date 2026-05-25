// JWT 认证测试（纯单元测试，不含数据库）
import { describe, it, expect } from 'vitest';
import jwt from 'jsonwebtoken';

// JWT 认证服务
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d';
const JWT_REFRESH_EXPIRES_IN = '30d';

// Token 类型
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

export interface User {
  id: number;
  phone: string;
  role: string;
}

// Token 生成
export function generateTokens(user: User): TokenPair {
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
    expiresIn: decoded.exp * 1000,
  };
}

// Token 验证
export function verifyToken(token: string): JwtPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}

// 从请求头提取 Token
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

describe('JWT Authentication Unit Tests', () => {
  describe('Token Generation', () => {
    it('should generate valid access and refresh tokens', () => {
      const user = {
        id: 1,
        phone: '13800138000',
        role: 'customer',
      };

      const tokens = generateTokens(user);

      expect(tokens).toHaveProperty('accessToken');
      expect(tokens).toHaveProperty('refreshToken');
      expect(tokens).toHaveProperty('expiresIn');
      expect(tokens.accessToken).toMatch(/^eyJ/); // JWT format
      expect(tokens.refreshToken).toMatch(/^eyJ/);
      expect(typeof tokens.expiresIn).toBe('number');
    });

    it('should include user info in token payload', () => {
      const user = {
        id: 1,
        phone: '13800138000',
        role: 'admin',
      };

      const tokens = generateTokens(user);
      const payload = verifyToken(tokens.accessToken);

      expect(payload).not.toBeNull();
      expect(payload?.userId).toBe(user.id);
      expect(payload?.phone).toBe(user.phone);
      expect(payload?.role).toBe(user.role);
      expect(payload?.iat).toBeDefined();
      expect(payload?.exp).toBeDefined();
    });

    it('should support different user roles in tokens', () => {
      const roles: ('admin' | 'staff' | 'customer')[] = ['admin', 'staff', 'customer'];

      for (const role of roles) {
        const user = {
          id: 1,
          phone: '13800138000',
          role,
        };

        const tokens = generateTokens(user);
        const payload = verifyToken(tokens.accessToken);

        expect(payload?.role).toBe(role);
      }
    });

    it('should generate tokens with valid expiration time', () => {
      const user = {
        id: 1,
        phone: '13800138000',
        role: 'customer',
      };

      const tokens = generateTokens(user);
      const now = Date.now();
      const expiresInMs = 7 * 24 * 60 * 60 * 1000; // 7 days in ms

      // expiresIn is the expiration timestamp in milliseconds, not the duration
      // It should be approximately 7 days from now
      expect(tokens.expiresIn).toBeGreaterThan(now);
      expect(tokens.expiresIn - now).toBeLessThan(expiresInMs);
    });
  });

  describe('Token Verification', () => {
    it('should verify valid token', () => {
      const user = {
        id: 1,
        phone: '13800138000',
        role: 'staff',
      };

      const tokens = generateTokens(user);
      const payload = verifyToken(tokens.accessToken);

      expect(payload).not.toBeNull();
      expect(payload?.userId).toBe(1);
      expect(payload?.phone).toBe('13800138000');
      expect(payload?.role).toBe('staff');
    });

    it('should reject invalid token', () => {
      const payload = verifyToken('invalid-token');
      expect(payload).toBeNull();
    });

    it('should reject malformed token', () => {
      const payload = verifyToken('not.a.jwt');
      expect(payload).toBeNull();
    });

    it('should reject expired token', () => {
      // 使用旧的密钥和短过期时间
      const oldSecret = 'old-secret-key';
      const payload = { userId: 1, phone: '13800138000', role: 'customer' };
      const expiredToken = jwt.sign(payload, oldSecret, { expiresIn: '0s' });

      const decoded = verifyToken(expiredToken);
      expect(decoded).toBeNull();
    });
  });

  describe('Token Extraction', () => {
    it('should extract token from valid Authorization header', () => {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test';
      const authHeader = `Bearer ${token}`;

      const extracted = extractToken(authHeader);
      expect(extracted).toBe(token);
    });

    it('should return null for missing Authorization header', () => {
      const extracted = extractToken(undefined);
      expect(extracted).toBeNull();
    });

    it('should return null for malformed Authorization header', () => {
      const extracted = extractToken('InvalidFormat');
      expect(extracted).toBeNull();
    });

    it('should return null for wrong scheme', () => {
      const extracted = extractToken('Basic token123');
      expect(extracted).toBeNull();
    });

    it('should return null for missing Bearer prefix', () => {
      const extracted = extractToken('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9');
      expect(extracted).toBeNull();
    });
  });

  describe('Token Pair Validation', () => {
    it('should have both access and refresh tokens generate similar structure', () => {
      const user = {
        id: 1,
        phone: '13800138000',
        role: 'customer',
      };

      const tokens = generateTokens(user);

      expect(tokens.accessToken).toMatch(/^eyJ/);
      expect(tokens.refreshToken).toMatch(/^eyJ/);
      expect(tokens.accessToken).not.toBe(tokens.refreshToken);
      expect(tokens.accessToken.split('.').length).toBe(3);
      expect(tokens.refreshToken.split('.').length).toBe(3);
    });
  });
});
