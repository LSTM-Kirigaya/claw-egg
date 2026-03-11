'use client'

import { Box, Typography, Container, Button } from '@mui/material'
import { Download } from '@mui/icons-material'
import Link from 'next/link'

export default function CTASection() {
  return (
    <Box
      sx={{
        py: { xs: 10, md: 14 },
        background: 'linear-gradient(135deg, rgba(255, 59, 48, 0.1) 0%, rgba(255, 59, 48, 0.05) 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background Decorations */}
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '10%',
          width: '300px',
          height: '300px',
          background: 'radial-gradient(circle, rgba(255, 59, 48, 0.1) 0%, transparent 70%)',
          borderRadius: '50%',
          transform: 'translateY(-50%)',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          right: '10%',
          width: '400px',
          height: '400px',
          background: 'radial-gradient(circle, rgba(255, 59, 48, 0.08) 0%, transparent 70%)',
          borderRadius: '50%',
          transform: 'translateY(-50%)',
        }}
      />

      <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1 }}>
        <Box textAlign="center">
          <Typography
            variant="h3"
            sx={{
              color: '#fff',
              fontWeight: 700,
              fontSize: { xs: '1.75rem', md: '2.5rem' },
              mb: 3,
            }}
          >
            准备好开始了吗？
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: 'rgba(255, 255, 255, 0.6)',
              fontSize: { xs: '1rem', md: '1.2rem' },
              mb: 4,
              maxWidth: '600px',
              mx: 'auto',
            }}
          >
            立即下载龙虾孵化器，几分钟内搭建属于你的 AI 助手
          </Typography>
          <Button
            component={Link}
            href="/download"
            variant="contained"
            size="large"
            startIcon={<Download />}
            sx={{
              background: 'linear-gradient(135deg, #FF3B30, #FF6B6B)',
              color: '#fff',
              textTransform: 'none',
              fontSize: '1.1rem',
              fontWeight: 600,
              px: 5,
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
        </Box>
      </Container>
    </Box>
  )
}
