'use client'

import { useState, useEffect } from 'react'
import { Box, Typography, Container, Button, Paper, Chip } from '@mui/material'
import { Window, Apple, Download, CheckCircle } from '@mui/icons-material'

interface DetectedOS {
  platform: 'windows' | 'mac' | 'linux' | 'unknown'
  arch: string
}

export default function DownloadPage() {
  const [detectedOS, setDetectedOS] = useState<DetectedOS>({ platform: 'unknown', arch: '' })

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const userAgent = window.navigator.userAgent.toLowerCase()
      let platform: 'windows' | 'mac' | 'linux' | 'unknown' = 'unknown'
      let arch = ''

      if (userAgent.includes('win')) {
        platform = 'windows'
        arch = userAgent.includes('win64') || userAgent.includes('x64') ? 'x64' : 'x86'
      } else if (userAgent.includes('mac')) {
        platform = 'mac'
        arch = userAgent.includes('arm') || userAgent.includes('apple silicon') ? 'arm64' : 'x64'
      } else if (userAgent.includes('linux')) {
        platform = 'linux'
      }

      setDetectedOS({ platform, arch })
    }
  }, [])

  const versions = [
    {
      platform: 'windows' as const,
      name: 'Windows',
      version: 'v1.0.0',
      size: '85 MB',
      requirements: 'Windows 10/11 (64位)',
      url: process.env.NEXT_PUBLIC_DOWNLOAD_WINDOWS || '#',
      icon: <Window sx={{ fontSize: 48 }} />,
      features: ['一键安装', '自动环境检测', '断点续装', '中文界面'],
    },
    {
      platform: 'mac' as const,
      name: 'macOS',
      version: 'v1.0.0',
      size: '92 MB',
      requirements: 'macOS 12+ (Apple Silicon / Intel)',
      url: process.env.NEXT_PUBLIC_DOWNLOAD_MAC || '#',
      icon: <Apple sx={{ fontSize: 48 }} />,
      features: ['原生 ARM64 支持', '自动环境检测', '断点续装', '中文界面'],
    },
  ]

  const handleDownload = (url: string) => {
    if (url !== '#') {
      window.open(url, '_blank')
    } else {
      alert('下载链接配置中，请稍后...')
    }
  }

  return (
    <Box sx={{ pt: 12, pb: 8, minHeight: '100vh', background: '#0a0a0f' }}>
      <Container maxWidth="lg">
        {/* Header */}
        <Box textAlign="center" mb={8}>
          <Typography variant="h3" sx={{ color: '#fff', fontWeight: 700, mb: 2 }}>
            下载龙虾孵化器
          </Typography>
          <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.6)', maxWidth: 600, mx: 'auto' }}>
            选择适合你操作系统的版本，几分钟内开始你的 AI 自动化之旅
          </Typography>
          {detectedOS.platform !== 'unknown' && (
            <Chip
              label={`检测到: ${detectedOS.platform === 'windows' ? 'Windows' : 'macOS'} ${detectedOS.arch}`}
              sx={{
                mt: 2,
                background: 'rgba(255, 59, 48, 0.2)',
                color: '#FF3B30',
                fontWeight: 600,
              }}
            />
          )}
        </Box>

        {/* Download Cards */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
            gap: 4,
            maxWidth: 900,
            mx: 'auto',
          }}
        >
          {versions.map((ver) => (
            <Paper
              key={ver.platform}
              elevation={0}
              sx={{
                p: 4,
                background:
                  detectedOS.platform === ver.platform
                    ? 'linear-gradient(135deg, rgba(255, 59, 48, 0.15), rgba(255, 59, 48, 0.05))'
                    : 'rgba(255, 255, 255, 0.03)',
                border:
                  detectedOS.platform === ver.platform
                    ? '2px solid #FF3B30'
                    : '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '20px',
                textAlign: 'center',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  borderColor: '#FF3B30',
                },
              }}
            >
              {/* Icon */}
              <Box
                sx={{
                  width: 80,
                  height: 80,
                  borderRadius: '20px',
                  background:
                    ver.platform === 'windows'
                      ? 'linear-gradient(135deg, #0078D4, #005A9E)'
                      : 'linear-gradient(135deg, #555, #333)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  mx: 'auto',
                  mb: 3,
                }}
              >
                {ver.icon}
              </Box>

              {/* Platform Name */}
              <Typography variant="h4" sx={{ color: '#fff', fontWeight: 700, mb: 1 }}>
                {ver.name}
              </Typography>

              {/* Version Info */}
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)', mb: 2 }}>
                {ver.version} · {ver.size}
              </Typography>

              {/* Requirements */}
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', display: 'block', mb: 3 }}>
                {ver.requirements}
              </Typography>

              {/* Features */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 4, alignItems: 'flex-start', px: 4 }}>
                {ver.features.map((feature) => (
                  <Box key={feature} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CheckCircle sx={{ fontSize: 16, color: '#4CAF50' }} />
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                      {feature}
                    </Typography>
                  </Box>
                ))}
              </Box>

              {/* Download Button */}
              <Button
                variant="contained"
                fullWidth
                size="large"
                startIcon={<Download />}
                onClick={() => handleDownload(ver.url)}
                sx={{
                  background:
                    ver.platform === 'windows'
                      ? 'linear-gradient(135deg, #0078D4, #005A9E)'
                      : 'linear-gradient(135deg, #555, #333)',
                  color: '#fff',
                  py: 1.5,
                  borderRadius: '12px',
                  fontSize: '1rem',
                  fontWeight: 600,
                  '&:hover': {
                    background:
                      ver.platform === 'windows'
                        ? 'linear-gradient(135deg, #005A9E, #0078D4)'
                        : 'linear-gradient(135deg, #444, #222)',
                  },
                }}
              >
                下载 {ver.name} 版
              </Button>
            </Paper>
          ))}
        </Box>

        {/* Installation Guide */}
        <Box mt={8} p={4} sx={{ background: 'rgba(255,255,255,0.03)', borderRadius: '16px' }}>
          <Typography variant="h5" sx={{ color: '#fff', fontWeight: 600, mb: 3 }}>
            安装指南
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 3 }}>
            <Box>
              <Typography variant="h6" sx={{ color: '#FF3B30', mb: 1 }}>
                1. 下载安装包
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                选择适合你操作系统的版本进行下载
              </Typography>
            </Box>
            <Box>
              <Typography variant="h6" sx={{ color: '#FF3B30', mb: 1 }}>
                2. 运行安装程序
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                Windows 运行 .msi，macOS 打开 .dmg 拖动安装
              </Typography>
            </Box>
            <Box>
              <Typography variant="h6" sx={{ color: '#FF3B30', mb: 1 }}>
                3. 开始配置
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                启动应用，按向导完成环境检测和配置
              </Typography>
            </Box>
          </Box>
        </Box>
      </Container>
    </Box>
  )
}
