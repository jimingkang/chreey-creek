#!/bin/bash

echo "🚀 开始设置数据库..."

# 1. 生成 Prisma 客户端
echo "📦 生成 Prisma 客户端..."
npx prisma generate

# 2. 推送数据库架构
echo "🗄️ 推送数据库架构..."
npx prisma db push

# 3. 验证数据库连接
echo "✅ 验证数据库连接..."
npx prisma db pull --print

echo "🎉 数据库设置完成！"
