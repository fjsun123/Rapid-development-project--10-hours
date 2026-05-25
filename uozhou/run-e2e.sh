#!/bin/bash

# E2E 测试运行脚本 - 真实浏览器模拟

echo "🎭 E2E 测试 - 真实浏览器模拟"
echo "======================================"
echo ""

# 检查 Playwright 是否安装
if ! command -v npx &> /dev/null; then
    echo "❌ npx 未安装"
    exit 1
fi

echo "1️⃣ 检查浏览器..."
npx playwright --version 2>/dev/null || {
    echo "⚠️  Playwright 浏览器未安装，正在安装..."
    npx playwright install
}

echo ""
echo "2️⃣ 启动测试..."

# 运行模式选择
if [ "$1" = "ui" ]; then
    echo "🖥️  启动 UI 模式..."
    npx playwright test --ui
elif [ "$1" = "debug" ]; then
    echo "🐛 启动调试模式..."
    npx playwright test --debug
elif [ -n "$1" ]; then
    echo "🎯 运行指定测试: $1"
    npx playwright test --grep "$1"
else
    echo "📋 运行所有测试..."
    npx playwright test
fi

echo ""
echo "======================================"
echo "✅ 测试完成"
echo ""
echo "📊 查看测试报告: npx playwright show-report"
echo "📸 查看截图: open screenshots/"
