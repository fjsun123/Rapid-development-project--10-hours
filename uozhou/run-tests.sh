#!/bin/bash

# 测试运行脚本

echo "🧪 餐厅运营系统测试套件"
echo "======================================"
echo ""

# 检查数据库连接
echo "1️⃣ 检查数据库连接..."
if ! command -v psql &> /dev/null; then
    echo "⚠️  psql 未安装，跳过数据库检查"
else
    if psql -h localhost -U postgres -d restaurant -c "SELECT 1" &> /dev/null; then
        echo "✅ 数据库连接正常"
    else
        echo "⚠️  数据库连接失败，请确保 PostgreSQL 运行中"
        echo "   启动命令: docker run -d --name postgres-test -e POSTGRES_PASSWORD=test -p 5432:5432 postgres:15"
    fi
fi

echo ""
echo "2️⃣ 运行测试..."

# 运行 Vitest 测试
cd services/backend

if [ -z "$1" ]; then
    # 运行所有测试
    echo "📋 运行所有测试..."
    pnpm test
else
    # 运行指定测试
    echo "📋 运行测试: $1"
    pnpm test -- --grep "$1"
fi

echo ""
echo "======================================"
echo "✅ 测试完成"
