#!/bin/bash

# 龙虾孵化器网站构建脚本

set -e

echo "🚀 开始构建龙虾孵化器网站..."

# 检查 Node.js 版本
echo "📦 检查 Node.js 版本..."
node -v

# 安装依赖
echo "📦 安装依赖..."
npm ci

# 类型检查
echo "🔍 运行类型检查..."
npx tsc --noEmit

# 构建 Next.js 应用
echo "🔨 构建 Next.js 应用..."
npm run build

echo "✅ 构建完成！"
echo "📁 构建输出: out/"
