import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '../db/schema';
import { z } from 'zod';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/restaurant',
});

const db = drizzle(pool, { schema });

// 种子数据
async function seed() {
  console.log('开始种子数据...');

  // 清理现有数据
  await db.delete(schema.orderItems);
  await db.delete(schema.orders);
  await db.delete(schema.menuItems);
  await db.delete(schema.customers);
  await db.delete(schema.businessSettings);

  // 插入分类
  const [category1, category2] = await db.insert(schema.categories).values([
    { name: '主食', description: '热菜主食', sortOrder: 1 },
    { name: '饮品', description: '饮料菜单', sortOrder: 2 },
    { name: '小吃', description: '炸物点心', sortOrder: 3 },
  ]).returning();

  // 插入菜品
  const [item1, item2, item3, item4, item5] = await db.insert(schema.menuItems).values([
    {
      categoryId: category1.id,
      name: '宫保鸡丁',
      description: '经典川菜，鸡肉嫩滑花生酥脆',
      price: 3800, // 38.00 元
      stock: 100,
      available: true,
      sortOrder: 1,
    },
    {
      categoryId: category1.id,
      name: '鱼香肉丝',
      description: '酸甜口味，木耳丝占主要',
      price: 3500, // 35.00 元
      stock: 80,
      available: true,
      sortOrder: 2,
    },
    {
      categoryId: category2.id,
      name: '可乐',
      description: '冰镇可乐',
      price: 1000, // 10.00 元
      stock: 50,
      available: true,
      sortOrder: 1,
    },
    {
      categoryId: category2.id,
      name: '奶茶',
      description: '珍珠奶茶',
      price: 1200, // 12.00 元
      stock: 30,
      available: true,
      sortOrder: 2,
    },
    {
      categoryId: category1.id,
      name: '测试已下架菜品',
      description: '用于测试下架功能',
      price: 1500,
      stock: 10,
      available: false,
      sortOrder: 99,
    },
  ]).returning();

  // 插入客户
  const [customer1, customer2] = await db.insert(schema.customers).values([
    { name: '张三', phone: '13800138001', notes: 'VIP客户' },
    { name: '李四', phone: '13800138002' },
  ]).returning();

  // 插入业务设置
  await db.insert(schema.businessSettings).values({
    openingTime: '09:00',
    closingTime: '22:00',
    autoAcceptOrders: false,
    estimatedPrepTime: 15,
    serviceAvailable: true,
  });

  console.log('种子数据插入完成！');
  console.log('- 2 个分类');
  console.log('- 5 个菜品（含 1 个已下架）');
  console.log('- 2 个客户');
  console.log('- 业务设置');

  await pool.end();
}

seed().catch(console.error);
