import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '龙虾孵化器 - OpenClaw AI Agent 一键安装器',
  description:
    '龙虾孵化器是 OpenClaw AI Agent 平台的一键安装器，支持一键安装、智能环境检测、断点续装，让 AI 自动化触手可及。',
  keywords: ['OpenClaw', 'AI Agent', '飞书机器人', '自动化', '一键安装'],
  authors: [{ name: '龙虾孵化器团队' }],
  openGraph: {
    title: '龙虾孵化器 - OpenClaw AI Agent 一键安装器',
    description: '几分钟内搭建属于你的 AI 助手',
    type: 'website',
    locale: 'zh_CN',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
