#!/bin/bash

# 部署到 Vercel 脚本

set -e

echo "🚀 部署到 Vercel..."

# 检查 Vercel CLI
if ! command -v vercel &> /dev/null; then
    echo "📦 安装 Vercel CLI..."
    npm i -g vercel
fi

# 部署
echo "🔨 开始部署..."
vercel --prod

echo "✅ 部署完成！"
