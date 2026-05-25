// 数据库连接配置
// 支持自动建表

import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { sql } from 'drizzle-orm';
import * as schema from './schema';

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/restaurant';

// ============================================
// 创建连接池
// ============================================

const pool = new Pool({
  connectionString: DATABASE_URL,
});

export const db = drizzle(pool, { schema });

// ============================================
// 自动建表
// ============================================

async function createTablesIfNotExist() {
  console.log('🔍 检查数据库表...');

  try {
    // 检查表是否存在
    const result = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
    `);

    const existingTables = result.rows.map(r => r.table_name);
    const requiredTables = ['users', 'categories', 'menu_items', 'customers', 'orders', 'order_items', 'business_settings'];

    const missingTables = requiredTables.filter(t => !existingTables.includes(t));

    if (missingTables.length === 0) {
      console.log('✅ 所有表已存在');
      return;
    }

    console.log(`📦 创建缺失的表: ${missingTables.join(', ')}`);

    // 创建枚举类型
    await pool.query(`
      DO $$ BEGIN
        CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'ready', 'completed', 'cancelled');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$
    `);

    await pool.query(`
      DO $$ BEGIN
        CREATE TYPE user_role AS ENUM ('admin', 'staff', 'customer');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$
    `);

    // 创建客户表（先建，因为 users 外键引用 customers.id）
    if (!existingTables.includes('customers')) {
      await pool.query(`
        CREATE TABLE customers (
          id SERIAL PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          phone VARCHAR(20) NOT NULL UNIQUE,
          avatar VARCHAR(500),
          notes TEXT,
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
      `);
      console.log('  ✅ customers 表已创建');
    }

    // 创建用户表
    if (!existingTables.includes('users')) {
      await pool.query(`
        CREATE TABLE users (
          id SERIAL PRIMARY KEY,
          phone VARCHAR(20) NOT NULL UNIQUE,
          name VARCHAR(100) NOT NULL,
          avatar VARCHAR(500),
          role user_role NOT NULL DEFAULT 'customer',
          active BOOLEAN NOT NULL DEFAULT true,
          customer_id INTEGER REFERENCES customers(id),
          last_login_at TIMESTAMP,
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
      `);
      console.log('  ✅ users 表已创建');
    }

    // 创建分类表
    if (!existingTables.includes('categories')) {
      await pool.query(`
        CREATE TABLE categories (
          id SERIAL PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          description TEXT,
          sort_order INTEGER DEFAULT 0,
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
      `);
      console.log('  ✅ categories 表已创建');
    }

    // 创建菜品表
    if (!existingTables.includes('menu_items')) {
      await pool.query(`
        CREATE TABLE menu_items (
          id SERIAL PRIMARY KEY,
          category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
          name VARCHAR(200) NOT NULL,
          description TEXT,
          price INTEGER NOT NULL,
          image VARCHAR(500),
          stock INTEGER DEFAULT -1,
          available BOOLEAN NOT NULL DEFAULT true,
          sort_order INTEGER DEFAULT 0,
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
      `);
      console.log('  ✅ menu_items 表已创建');
    }

    // 创建订单表
    if (!existingTables.includes('orders')) {
      await pool.query(`
        CREATE TABLE orders (
          id SERIAL PRIMARY KEY,
          order_no VARCHAR(50) NOT NULL UNIQUE,
          customer_id INTEGER NOT NULL REFERENCES customers(id),
          status order_status NOT NULL DEFAULT 'pending',
          total INTEGER NOT NULL,
          notes TEXT,
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          confirmed_at TIMESTAMP,
          ready_at TIMESTAMP,
          completed_at TIMESTAMP,
          cancelled_at TIMESTAMP
        )
      `);
      console.log('  ✅ orders 表已创建');
    }

    // 创建订单项表
    if (!existingTables.includes('order_items')) {
      await pool.query(`
        CREATE TABLE order_items (
          id SERIAL PRIMARY KEY,
          order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
          menu_item_id INTEGER NOT NULL REFERENCES menu_items(id),
          menu_item_name VARCHAR(200) NOT NULL,
          quantity INTEGER NOT NULL,
          unit_price INTEGER NOT NULL,
          subtotal INTEGER NOT NULL
        )
      `);
      console.log('  ✅ order_items 表已创建');
    }

    // 创建业务设置表
    if (!existingTables.includes('business_settings')) {
      await pool.query(`
        CREATE TABLE business_settings (
          id SERIAL PRIMARY KEY,
          opening_time VARCHAR(10) NOT NULL DEFAULT '09:00',
          closing_time VARCHAR(10) NOT NULL DEFAULT '22:00',
          auto_accept_orders BOOLEAN NOT NULL DEFAULT false,
          estimated_prep_time INTEGER NOT NULL DEFAULT 15,
          service_available BOOLEAN NOT NULL DEFAULT true,
          updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
      `);
      console.log('  ✅ business_settings 表已创建');
    }

    // 创建索引
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
      CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
      CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
      CREATE INDEX IF NOT EXISTS idx_menu_items_category_id ON menu_items(category_id);
      CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
    `);
    console.log('  ✅ 索引已创建');

    console.log('✅ 数据库表初始化完成');
  } catch (error) {
    console.error('❌ 数据库表初始化失败:', error);
    throw error;
  }
}

// ============================================
// 初始化种子数据
// ============================================

async function initializeSeedData() {
  // 检查是否已有数据
  const [existingCustomer] = await db.select().from(schema.customers).limit(1);

  if (existingCustomer) {
    console.log('✅ 种子数据已存在，跳过初始化');
    return;
  }

  console.log('🌱 初始化种子数据...');

  // 插入分类
  await db.insert(schema.categories).values([
    { name: '主食', description: '热菜主食', sortOrder: 1 },
    { name: '饮品', description: '饮料菜单', sortOrder: 2 },
    { name: '小吃', description: '炸物点心', sortOrder: 3 },
  ]);

  // 插入菜品
  await db.insert(schema.menuItems).values([
    { categoryId: 1, name: '宫保鸡丁', description: '经典川菜', price: 3800, stock: 100, available: true },
    { categoryId: 1, name: '鱼香肉丝', description: '酸甜口味', price: 3500, stock: 80, available: true },
    { categoryId: 2, name: '可乐', description: '冰镇可乐', price: 1000, stock: 50, available: true },
    { categoryId: 2, name: '奶茶', description: '珍珠奶茶', price: 1200, stock: 30, available: true },
    { categoryId: 1, name: '测试已下架菜品', price: 1500, stock: 10, available: false },
  ]);

  // 插入客户
  await db.insert(schema.customers).values([
    { name: '张三', phone: '13800138001', notes: 'VIP客户' },
    { name: '李四', phone: '13800138002' },
  ]);

  // 插入管理员用户
  await db.insert(schema.users).values([
    { phone: 'admin', name: '管理员', role: 'admin' },
    { phone: '13800138000', name: '员工小王', role: 'staff' },
  ]);

  // 插入业务设置
  await db.insert(schema.businessSettings).values({
    openingTime: '09:00',
    closingTime: '22:00',
    autoAcceptOrders: false,
    estimatedPrepTime: 15,
    serviceAvailable: true,
  });

  console.log('✅ 种子数据初始化完成');
}

// ============================================
// 数据库初始化入口
// ============================================

export async function initializeDatabase() {
  console.log('');
  console.log('========================================');
  console.log('🚀 数据库初始化');
  console.log('========================================');

  await createTablesIfNotExist();
  await initializeSeedData();

  console.log('========================================');
  console.log('');
}

export { schema };
