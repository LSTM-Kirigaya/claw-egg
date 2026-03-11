'use client'

import { Box, Typography, Container, Link as MuiLink, Divider } from '@mui/material'
import Link from 'next/link'

const footerLinks = {
  产品: [
    { label: '功能介绍', href: '/features' },
    { label: '下载', href: '/download' },
    { label: '更新日志', href: '/changelog' },
    { label: '路线图', href: '/roadmap' },
  ],
  资源: [
    { label: 'Skills', href: '/skills' },
    { label: '场景', href: '/scenes' },
    { label: '文档', href: '/docs' },
    { label: 'API', href: '/api' },
  ],
  社区: [
    { label: '论坛', href: '/forum' },
    { label: 'Discord', href: '#' },
    { label: 'GitHub', href: 'https://github.com/LSTM-Kirigaya/OpenClaw' },
  ],
  公司: [
    { label: '关于我们', href: '/about' },
    { label: '博客', href: '/blog' },
    { label: '联系我们', href: '/contact' },
  ],
}

export default function Footer() {
  return (
    <Box
      component="footer"
      sx={{
        background: '#0a0a0f',
        borderTop: '1px solid rgba(255, 255, 255, 0.05)',
        py: 6,
      }}
    >
      <Container maxWidth="lg">
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(5, 1fr)',
            },
            gap: 4,
            mb: 6,
          }}
        >
          {/* Brand Column */}
          <Box sx={{ gridColumn: { xs: '1 / -1', md: '1 / 2' } }}>
            <Link href="/" style={{ textDecoration: 'none' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #FF3B30, #FF6B6B)',
                    fontSize: '20px',
                  }}
                >
                  🦞
                </Box>
                <Typography
                  variant="h6"
                  sx={{
                    color: '#fff',
                    fontWeight: 700,
                  }}
                >
                  龙虾孵化器
                </Typography>
              </Box>
            </Link>
            <Typography
              variant="body2"
              sx={{
                color: 'rgba(255, 255, 255, 0.5)',
                mb: 2,
              }}
            >
              OpenClaw AI Agent 平台的一键安装器
            </Typography>
          </Box>

          {/* Link Columns */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <Box key={category}>
              <Typography
                variant="subtitle2"
                sx={{
                  color: '#fff',
                  fontWeight: 600,
                  mb: 2,
                }}
              >
                {category}
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {links.map((link) => (
                  <MuiLink
                    key={link.label}
                    component={Link}
                    href={link.href}
                    sx={{
                      color: 'rgba(255, 255, 255, 0.5)',
                      textDecoration: 'none',
                      fontSize: '0.9rem',
                      '&:hover': {
                        color: '#FF3B30',
                      },
                      transition: 'color 0.2s ease',
                    }}
                  >
                    {link.label}
                  </MuiLink>
                ))}
              </Box>
            </Box>
          ))}
        </Box>

        <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.05)', mb: 4 }} />

        {/* Bottom Bar */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <Typography
            variant="body2"
            sx={{
              color: 'rgba(255, 255, 255, 0.4)',
            }}
          >
            © 2025 龙虾孵化器. 保留所有权利.
          </Typography>
          <Box sx={{ display: 'flex', gap: 3 }}>
            <MuiLink
              component={Link}
              href="/privacy"
              sx={{
                color: 'rgba(255, 255, 255, 0.4)',
                textDecoration: 'none',
                fontSize: '0.85rem',
                '&:hover': { color: '#FF3B30' },
              }}
            >
              隐私政策
            </MuiLink>
            <MuiLink
              component={Link}
              href="/terms"
              sx={{
                color: 'rgba(255, 255, 255, 0.4)',
                textDecoration: 'none',
                fontSize: '0.85rem',
                '&:hover': { color: '#FF3B30' },
              }}
            >
              服务条款
            </MuiLink>
          </Box>
        </Box>
      </Container>
    </Box>
  )
}
