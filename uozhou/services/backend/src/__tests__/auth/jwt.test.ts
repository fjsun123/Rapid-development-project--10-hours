// JWT 认证测试
import { describe, it, expect, beforeEach, beforeAll, afterAll } from 'vitest';
import { db, schema } from '../../db';
import { eq } from 'drizzle-orm';
import { generateTokens, verifyToken, extractToken } from '../../services/auth-service';
import { clearAuthTables, createTestCustomer } from '../helpers';

describe('JWT Authentication', () => {
  beforeAll(async () => {
    await clearAuthTables();
  });

  afterAll(async () => {
    await clearAuthTables();
  });

  describe('Token Generation', () => {
    it('should generate valid access and refresh tokens', () => {
      const user = {
        id: 1,
        phone: '13800138000',
        role: 'customer' as const,
      };

      const tokens = generateTokens(user);

      expect(tokens).toHaveProperty('accessToken');
      expect(tokens).toHaveProperty('refreshToken');
      expect(tokens).toHaveProperty('expiresIn');
      expect(tokens.accessToken).toMatch(/^eyJ/); // JWT format
      expect(tokens.refreshToken).toMatch(/^eyJ/);
    });

    it('should include user info in token payload', () => {
      const user = {
        id: 1,
        phone: '13800138000',
        role: 'admin' as const,
      };

      const tokens = generateTokens(user);
      const payload = verifyToken(tokens.accessToken);

      expect(payload).not.toBeNull();
      expect(payload?.userId).toBe(user.id);
      expect(payload?.phone).toBe(user.phone);
      expect(payload?.role).toBe(user.role);
    });
  });

  describe('Token Verification', () => {
    it('should verify valid token', () => {
      const user = {
        id: 1,
        phone: '13800138000',
        role: 'staff' as const,
      };

      const tokens = generateTokens(user);
      const payload = verifyToken(tokens.accessToken);

      expect(payload).not.toBeNull();
      expect(payload?.userId).toBe(1);
    });

    it('should reject invalid token', () => {
      const payload = verifyToken('invalid-token');
      expect(payload).toBeNull();
    });

    it('should reject malformed token', () => {
      const payload = verifyToken('not.a.jwt');
      expect(payload).toBeNull();
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

  describe('User Creation and Login', () => {
    beforeEach(async () => {
      await db.delete(schema.users);
      await db.delete(schema.customers);
    });

    it('should create user with valid data', async () => {
      const [user] = await db.insert(schema.users).values({
        phone: '13800138000',
        name: '测试用户',
        role: 'customer',
      }).returning();

      expect(user).toBeDefined();
      expect(user.phone).toBe('13800138000');
      expect(user.role).toBe('customer');
    });

    it('should enforce unique phone number', async () => {
      await db.insert(schema.users).values({
        phone: '13800138000',
        name: '用户1',
        role: 'customer',
      });

      await expect(
        db.insert(schema.users).values({
          phone: '13800138000',
          name: '用户2',
          role: 'customer',
        })
      ).rejects.toThrow();
    });
  });
});
