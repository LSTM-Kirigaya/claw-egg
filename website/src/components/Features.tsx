'use client'

import { Box, Typography, Container, Paper } from '@mui/material'
import RocketIcon from '@mui/icons-material/Rocket'
import SearchIcon from '@mui/icons-material/Search'
import RefreshIcon from '@mui/icons-material/Refresh'
import PaletteIcon from '@mui/icons-material/Palette'
import MonitorIcon from '@mui/icons-material/Monitor'
import ShieldIcon from '@mui/icons-material/Shield'
import InventoryIcon from '@mui/icons-material/Inventory'
import PeopleIcon from '@mui/icons-material/People'

const features = [
  {
    icon: <RocketIcon sx={{ fontSize: 32 }} />,
    title: '一键安装',
    description: '自动检测并安装 Node.js、OpenClaw 等依赖，几分钟内完成部署',
  },
  {
    icon: <SearchIcon sx={{ fontSize: 32 }} />,
    title: '智能检测',
    description: '自动检测系统环境，确保 Node.js >=22 且为偶数版本',
  },
  {
    icon: <RefreshIcon sx={{ fontSize: 32 }} />,
    title: '断点续装',
    description: '安装失败或中断后可从中断处继续，无需重新开始',
  },
  {
    icon: <PaletteIcon sx={{ fontSize: 32 }} />,
    title: '友好界面',
    description: '现代化的 UI 设计，支持暗黑模式，主题色为苹果红',
  },
  {
    icon: <MonitorIcon sx={{ fontSize: 32 }} />,
    title: '跨平台',
    description: '支持 Windows 和 macOS，未来还将支持 Linux',
  },
  {
    icon: <ShieldIcon sx={{ fontSize: 32 }} />,
    title: '安全配置',
    description: '图形化配置飞书机器人、API 密钥等，安全存储配置',
  },
  {
    icon: <InventoryIcon sx={{ fontSize: 32 }} />,
    title: '插件市场',
    description: '浏览和安装 OpenClaw 插件，扩展你的 AI 能力',
  },
  {
    icon: <PeopleIcon sx={{ fontSize: 32 }} />,
    title: '活跃社区',
    description: '用户交流和经验分享，共同成长学习',
  },
]

export default function Features() {
  return (
    <Box
      sx={{
        py: { xs: 8, md: 12 },
        background: 'linear-gradient(180deg, #0a0a0f 0%, #12121a 100%)',
      }}
    >
      <Container maxWidth="lg">
        {/* Section Header */}
        <Box textAlign="center" mb={8}>
          <Typography
            variant="overline"
            sx={{
              color: '#FF3B30',
              fontWeight: 600,
              letterSpacing: 2,
              mb: 2,
              display: 'block',
            }}
          >
            核心功能
          </Typography>
          <Typography
            variant="h3"
            sx={{
              color: '#fff',
              fontWeight: 700,
              fontSize: { xs: '1.75rem', md: '2.5rem' },
              mb: 2,
            }}
          >
            为什么选择龙虾孵化器
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: 'rgba(255, 255, 255, 0.5)',
              maxWidth: '600px',
              mx: 'auto',
              fontSize: '1.1rem',
            }}
          >
            我们致力于让每个人都能轻松搭建自己的 AI 助手
          </Typography>
        </Box>

        {/* Features Grid */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(4, 1fr)',
            },
            gap: 3,
          }}
        >
          {features.map((feature, index) => (
            <Paper
              key={index}
              elevation={0}
              sx={{
                p: 3,
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '16px',
                transition: 'all 0.3s ease',
                '&:hover': {
                  background: 'rgba(255, 59, 48, 0.08)',
                  borderColor: 'rgba(255, 59, 48, 0.3)',
                  transform: 'translateY(-4px)',
                },
              }}
            >
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, rgba(255, 59, 48, 0.2), rgba(255, 59, 48, 0.1))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FF3B30',
                  mb: 2,
                }}
              >
                {feature.icon}
              </Box>
              <Typography
                variant="h6"
                sx={{
                  color: '#fff',
                  fontWeight: 600,
                  mb: 1,
                  fontSize: '1.1rem',
                }}
              >
                {feature.title}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: 'rgba(255, 255, 255, 0.5)',
                  lineHeight: 1.6,
                }}
              >
                {feature.description}
              </Typography>
            </Paper>
          ))}
        </Box>
      </Container>
    </Box>
  )
}
