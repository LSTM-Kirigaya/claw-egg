'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  Button,
  IconButton,
  Paper,
} from '@mui/material'
import { Close, Window, Apple, Download } from '@mui/icons-material'

interface PlatformDownloadDialogProps {
  open: boolean
  onClose: () => void
}

interface DetectedOS {
  platform: 'windows' | 'mac' | 'linux' | 'unknown'
  arch: string
}

export default function PlatformDownloadDialog({
  open,
  onClose,
}: PlatformDownloadDialogProps) {
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
  }, [open])

  const downloadLinks = {
    windows: {
      url: process.env.NEXT_PUBLIC_DOWNLOAD_WINDOWS || '#',
      label: 'Windows 版',
      sublabel: 'Windows 10/11 (64位)',
      icon: <Window sx={{ fontSize: 32 }} />,
    },
    mac: {
      url: process.env.NEXT_PUBLIC_DOWNLOAD_MAC || '#',
      label: 'macOS 版',
      sublabel: 'macOS 12+ (Apple Silicon / Intel)',
      icon: <Apple sx={{ fontSize: 32 }} />,
    },
  }

  const handleDownload = (platform: 'windows' | 'mac') => {
    const link = downloadLinks[platform]
    if (link.url !== '#') {
      window.open(link.url, '_blank')
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '16px',
        },
      }}
    >
      <DialogTitle sx={{ color: '#fff', pb: 1 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" fontWeight={600}>
            选择下载版本
          </Typography>
          <IconButton onClick={onClose} sx={{ color: 'rgba(255,255,255,0.5)' }}>
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        {detectedOS.platform !== 'unknown' && (
          <Typography
            variant="body2"
            sx={{ color: 'rgba(255,255,255,0.6)', mb: 3, textAlign: 'center' }}
          >
            检测到你的系统：
            <Box component="span" sx={{ color: '#FF3B30', fontWeight: 600, ml: 1 }}>
              {detectedOS.platform === 'windows' ? 'Windows' : 'macOS'}
              {detectedOS.arch && ` (${detectedOS.arch})`}
            </Box>
          </Typography>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Windows Download */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              background:
                detectedOS.platform === 'windows'
                  ? 'rgba(255, 59, 48, 0.15)'
                  : 'rgba(255, 255, 255, 0.05)',
              border:
                detectedOS.platform === 'windows'
                  ? '2px solid #FF3B30'
                  : '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              '&:hover': {
                background: 'rgba(255, 59, 48, 0.1)',
                borderColor: '#FF3B30',
              },
            }}
            onClick={() => handleDownload('windows')}
          >
            <Box display="flex" alignItems="center" gap={2}>
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #0078D4, #005A9E)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                }}
              >
                {downloadLinks.windows.icon}
              </Box>
              <Box flex={1}>
                <Typography variant="h6" sx={{ color: '#fff', fontWeight: 600 }}>
                  {downloadLinks.windows.label}
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                  {downloadLinks.windows.sublabel}
                </Typography>
              </Box>
              <Button
                variant="contained"
                size="small"
                startIcon={<Download />}
                sx={{
                  background: '#0078D4',
                  '&:hover': { background: '#005A9E' },
                }}
              >
                下载
              </Button>
            </Box>
          </Paper>

          {/* macOS Download */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              background:
                detectedOS.platform === 'mac'
                  ? 'rgba(255, 59, 48, 0.15)'
                  : 'rgba(255, 255, 255, 0.05)',
              border:
                detectedOS.platform === 'mac'
                  ? '2px solid #FF3B30'
                  : '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              '&:hover': {
                background: 'rgba(255, 59, 48, 0.1)',
                borderColor: '#FF3B30',
              },
            }}
            onClick={() => handleDownload('mac')}
          >
            <Box display="flex" alignItems="center" gap={2}>
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #555, #333)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                }}
              >
                {downloadLinks.mac.icon}
              </Box>
              <Box flex={1}>
                <Typography variant="h6" sx={{ color: '#fff', fontWeight: 600 }}>
                  {downloadLinks.mac.label}
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                  {downloadLinks.mac.sublabel}
                </Typography>
              </Box>
              <Button
                variant="contained"
                size="small"
                startIcon={<Download />}
                sx={{
                  background: '#555',
                  '&:hover': { background: '#333' },
                }}
              >
                下载
              </Button>
            </Box>
          </Paper>
        </Box>

        <Typography
          variant="caption"
          sx={{
            color: 'rgba(255,255,255,0.4)',
            display: 'block',
            textAlign: 'center',
            mt: 3,
          }}
        >
          下载即表示你同意我们的服务条款和隐私政策
        </Typography>
      </DialogContent>
    </Dialog>
  )
}
