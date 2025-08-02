#!/bin/bash

echo "🔧 修复 ESLint 依赖问题..."

# 停止开发服务器
echo "⏹️ 停止开发服务器..."
pkill -f "next dev" 2>/dev/null || true

# 清理所有缓存和锁文件
echo "🧹 清理缓存和锁文件..."
rm -rf node_modules
rm -f package-lock.json
rm -f yarn.lock
rm -f pnpm-lock.yaml
rm -rf .next
rm -rf .npm
rm -rf ~/.npm/_cacache

# 清理 npm 缓存
echo "🗑️ 清理 npm 缓存..."
npm cache clean --force

# 设置 npm 配置以避免 WASM 相关问题
echo "⚙️ 配置 npm 设置..."
npm config set fund false
npm config set audit false
npm config set optional false

# 重新安装依赖（跳过可选依赖）
echo "📦 重新安装依赖（跳过可选依赖）..."
npm install --no-optional --no-fund --no-audit

echo "✅ ESLint 依赖问题修复完成！"
echo "🚀 现在可以运行: npm run dev"
