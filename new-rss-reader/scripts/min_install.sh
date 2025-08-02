#!/bin/bash

echo "📦 最小化安装（跳过问题依赖）..."

# 停止开发服务器
echo "⏹️ 停止开发服务器..."
pkill -f "next dev" 2>/dev/null || true

# 完全清理
echo "🧹 完全清理..."
rm -rf node_modules
rm -f package-lock.json
rm -rf .next

# 清理 npm 缓存
echo "🗑️ 清理 npm 缓存..."
npm cache clean --force

# 只安装核心依赖，跳过 ESLint
echo "📦 安装核心依赖..."
npm install --no-optional --ignore-scripts next@15.0.0 react@^18.2.0 react-dom@^18.2.0

# 安装 Prisma
echo "🗄️ 安装 Prisma..."
npm install @prisma/client@^5.7.0 prisma@^5.7.0

# 安装 UI 依赖
echo "🎨 安装 UI 依赖..."
npm install tailwindcss@^3.4.17 tailwindcss-animate class-variance-authority lucide-react clsx tailwind-merge

# 安装 Radix UI 组件
echo "🔧 安装 Radix UI 组件..."
npm install @radix-ui/react-tabs @radix-ui/react-dialog @radix-ui/react-scroll-area @radix-ui/react-separator @radix-ui/react-label @radix-ui/react-select

# 安装其他必要依赖
echo "📚 安装其他依赖..."
npm install date-fns rss-parser typescript @types/node @types/react @types/react-dom autoprefixer postcss tsx

# 生成 Prisma 客户端
echo "🗄️ 生成 Prisma 客户端..."
npx prisma generate

echo "✅ 最小化安装完成！"
echo "⚠️ 注意：跳过了 ESLint 以避免 WASM 问题"
echo "🚀 现在可以运行: npm run dev"
