'use client'

import { useState } from 'react'
import { Box, Typography, Container, Paper, TextField, Button, Divider, Tab, Tabs } from '@mui/material'
import GitHubIcon from '@mui/icons-material/GitHub'

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState(0)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleLogin = () => {
    // Implement login logic with Supabase
    alert('登录功能需要配置 Supabase Auth')
  }

  return (
    <Box
      sx={{
        pt: 12,
        pb: 8,
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 100%)',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={0}
          sx={{
            p: 4,
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '20px',
          }}
        >
          <Typography variant="h4" sx={{ color: '#fff', fontWeight: 700, textAlign: 'center', mb: 1 }}>
            欢迎回来
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)', textAlign: 'center', mb: 4 }}>
            登录以访问 Skills 市场和社区论坛
          </Typography>

          <Tabs
            value={activeTab}
            onChange={(e, v) => setActiveTab(v)}
            sx={{ mb: 3 }}
            centered
          >
            <Tab label="登录" sx={{ color: 'rgba(255,255,255,0.6)' }} />
            <Tab label="注册" sx={{ color: 'rgba(255,255,255,0.6)' }} />
          </Tabs>

          {/* Social Login */}
          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<GitHubIcon />}
              sx={{
                borderColor: 'rgba(255,255,255,0.2)',
                color: '#fff',
                py: 1,
                '&:hover': { borderColor: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.05)' },
              }}
            >
              GitHub
            </Button>
          </Box>

          <Divider sx={{ my: 3, borderColor: 'rgba(255,255,255,0.1)' }}>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', px: 2 }}>
              或使用邮箱
            </Typography>
          </Divider>

          {/* Email Form */}
          <TextField
            fullWidth
            label="邮箱"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            sx={{ mb: 2 }}
            InputLabelProps={{ style: { color: 'rgba(255,255,255,0.5)' } }}
            InputProps={{ style: { color: '#fff' } }}
          />
          <TextField
            fullWidth
            label="密码"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            sx={{ mb: 3 }}
            InputLabelProps={{ style: { color: 'rgba(255,255,255,0.5)' } }}
            InputProps={{ style: { color: '#fff' } }}
          />

          <Button
            fullWidth
            variant="contained"
            size="large"
            onClick={handleLogin}
            sx={{
              background: 'linear-gradient(135deg, #FF3B30, #FF6B6B)',
              color: '#fff',
              py: 1.5,
              borderRadius: '12px',
              fontSize: '1rem',
              fontWeight: 600,
              '&:hover': {
                background: 'linear-gradient(135deg, #FF5A50, #FF8B8B)',
              },
            }}
          >
            {activeTab === 0 ? '登录' : '注册'}
          </Button>
        </Paper>
      </Container>
    </Box>
  )
}
