'use client'

import { useState } from 'react'
import { Box, Typography, Button, Container, Chip } from '@mui/material'
import { Download, Apple, Window } from '@mui/icons-material'
import PlatformDownloadDialog from './PlatformDownloadDialog'

export default function Hero() {
  const [downloadDialogOpen, setDownloadDialogOpen] = useState(false)

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #16213e 100%)',
        pt: 10,
      }}
    >
      {/* Animated Background Elements */}
      <Box
        sx={{
          position: 'absolute',
          top: '10%',
          left: '10%',
          width: '300px',
          height: '300px',
          background: 'radial-gradient(circle, rgba(255, 59, 48, 0.15) 0%, transparent 70%)',
          borderRadius: '50%',
          animation: 'pulse 4s ease-in-out infinite',
          '@keyframes pulse': {
            '0%, 100%': { transform: 'scale(1)', opacity: 0.5 },
            '50%': { transform: 'scale(1.2)', opacity: 0.8 },
          },
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: '20%',
          right: '15%',
          width: '400px',
          height: '400px',
          background: 'radial-gradient(circle, rgba(255, 59, 48, 0.1) 0%, transparent 70%)',
          borderRadius: '50%',
          animation: 'pulse 6s ease-in-out infinite reverse',
        }}
      />

      {/* Grid Pattern Overlay */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
          opacity: 0.5,
        }}
      />

      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        <Box sx={{ textAlign: 'center', maxWidth: '900px', mx: 'auto' }}>
          {/* Badge */}
          <Chip
            label="🚀 一键安装 OpenClaw"
            sx={{
              background: 'rgba(255, 59, 48, 0.2)',
              color: '#FF3B30',
              border: '1px solid rgba(255, 59, 48, 0.3)',
              fontSize: '0.9rem',
              py: 1,
              px: 2,
              mb: 4,
              '& .MuiChip-label': { px: 2 },
            }}
          />

          {/* Main Title */}
          <Typography
            variant="h1"
            sx={{
              fontSize: { xs: '2.5rem', md: '4rem', lg: '5rem' },
              fontWeight: 800,
              color: '#fff',
              mb: 3,
              background: 'linear-gradient(135deg, #fff 0%, rgba(255, 255, 255, 0.7) 100%)',
              backgroundClip: 'text',
              textFillColor: 'transparent',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              lineHeight: 1.1,
            }}
          >
            让 AI 自动化
            <br />
            <Box component="span" sx={{ color: '#FF3B30' }}>
              触手可及
            </Box>
          </Typography>

          {/* Subtitle */}
          <Typography
            variant="h5"
            sx={{
              color: 'rgba(255, 255, 255, 0.6)',
              fontSize: { xs: '1.1rem', md: '1.35rem' },
              fontWeight: 400,
              mb: 2,
              maxWidth: '700px',
              mx: 'auto',
              lineHeight: 1.6,
            }}
          >
            龙虾孵化器是 OpenClaw AI Agent 平台的一键安装器
          </Typography>
          
          <Typography
            variant="body1"
            sx={{
              color: 'rgba(255, 255, 255, 0.5)',
              fontSize: { xs: '1rem', md: '1.1rem' },
              mb: 5,
              maxWidth: '600px',
              mx: 'auto',
              lineHeight: 1.7,
            }}
          >
            智能环境检测、断点续装、跨平台支持。
            无论是飞书、Discord 还是 Telegram，几分钟内搭建你的 AI 机器人。
          </Typography>

          {/* CTA Buttons */}
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              size="large"
              onClick={() => setDownloadDialogOpen(true)}
              startIcon={<Download />}
              sx={{
                background: 'linear-gradient(135deg, #FF3B30, #FF6B6B)',
                color: '#fff',
                textTransform: 'none',
                fontSize: '1.1rem',
                fontWeight: 600,
                px: 4,
                py: 1.5,
                borderRadius: '12px',
                boxShadow: '0 8px 30px rgba(255, 59, 48, 0.4)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #FF5A50, #FF8B8B)',
                  boxShadow: '0 12px 40px rgba(255, 59, 48, 0.6)',
                  transform: 'translateY(-2px)',
                },
                transition: 'all 0.3s ease',
              }}
            >
              免费下载
            </Button>
            <Button
              variant="outlined"
              size="large"
              href="https://github.com/LSTM-Kirigaya/OpenClaw"
              target="_blank"
              sx={{
                borderColor: 'rgba(255, 255, 255, 0.3)',
                color: '#fff',
                textTransform: 'none',
                fontSize: '1.1rem',
                fontWeight: 500,
                px: 4,
                py: 1.5,
                borderRadius: '12px',
                '&:hover': {
                  borderColor: 'rgba(255, 255, 255, 0.5)',
                  background: 'rgba(255, 255, 255, 0.05)',
                },
              }}
            >
              查看源码
            </Button>
          </Box>

          {/* Platform Icons */}
          <Box
            sx={{
              display: 'flex',
              gap: 3,
              justifyContent: 'center',
              mt: 5,
              color: 'rgba(255, 255, 255, 0.4)',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Window sx={{ fontSize: 20 }} />
              <Typography variant="body2">Windows</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Apple sx={{ fontSize: 20 }} />
              <Typography variant="body2">macOS</Typography>
            </Box>
          </Box>

          {/* Version Info */}
          <Typography
            variant="caption"
            sx={{
              color: 'rgba(255, 255, 255, 0.3)',
              mt: 3,
              display: 'block',
            }}
          >
            最新版本 v1.0.0 | 开源免费
          </Typography>
        </Box>
      </Container>

      {/* Download Dialog */}
      <PlatformDownloadDialog
        open={downloadDialogOpen}
        onClose={() => setDownloadDialogOpen(false)}
      />
    </Box>
  )
}
