'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AppBar, Toolbar, Button, Box, Menu, MenuItem, IconButton } from '@mui/material'
import { KeyboardArrowDown, Menu as MenuIcon } from '@mui/icons-material'

const navItems = [
  { label: '首页', href: '/' },
  { label: '用例', href: '/use-cases' },
  { label: '定价', href: '/pricing' },
  { label: '博客', href: '/blog' },
  {
    label: '资源',
    href: '#',
    children: [
      { label: 'Skills', href: '/skills' },
      { label: '场景', href: '/scenes' },
      { label: '文档', href: '/docs' },
    ],
  },
  {
    label: '社区',
    href: '#',
    children: [
      { label: '论坛', href: '/forum' },
      { label: 'Discord', href: '#' },
    ],
  },
]

export default function Navbar() {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [activeMenu, setActiveMenu] = useState<string | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, label: string) => {
    setAnchorEl(event.currentTarget)
    setActiveMenu(label)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
    setActiveMenu(null)
  }

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        background: 'rgba(10, 10, 15, 0.8)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 2, md: 4 } }}>
        {/* Logo */}
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Box
            component="img"
            src="/logo.svg"
            alt="龙虾孵化器"
            sx={{
              width: 40,
              height: 40,
              filter: 'drop-shadow(0 0 10px rgba(255, 59, 48, 0.5))',
            }}
            onError={(e) => {
              // Fallback to text logo if image fails
              const target = e.target as HTMLImageElement
              target.style.display = 'none'
            }}
          />
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #FF3B30, #FF6B6B)',
              fontSize: '24px',
            }}
          >
            🦞
          </Box>
          <Box
            component="span"
            sx={{
              color: '#fff',
              fontSize: '1.5rem',
              fontWeight: 700,
              ml: 1,
            }}
          >
            龙虾孵化器
          </Box>
        </Link>

        {/* Desktop Navigation */}
        <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 1 }}>
          {navItems.map((item) => (
            <Box key={item.label}>
              {item.children ? (
                <>
                  <Button
                    color="inherit"
                    onClick={(e) => handleMenuOpen(e, item.label)}
                    endIcon={<KeyboardArrowDown />}
                    sx={{
                      color: 'rgba(255, 255, 255, 0.8)',
                      textTransform: 'none',
                      fontSize: '0.95rem',
                      '&:hover': { color: '#fff' },
                    }}
                  >
                    {item.label}
                  </Button>
                  <Menu
                    anchorEl={anchorEl}
                    open={activeMenu === item.label}
                    onClose={handleMenuClose}
                    PaperProps={{
                      sx: {
                        background: 'rgba(20, 20, 30, 0.95)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        mt: 1,
                      },
                    }}
                  >
                    {item.children.map((child) => (
                      <MenuItem
                        key={child.label}
                        onClick={handleMenuClose}
                        component={Link}
                        href={child.href}
                        sx={{ color: '#fff', '&:hover': { background: 'rgba(255, 59, 48, 0.2)' } }}
                      >
                        {child.label}
                      </MenuItem>
                    ))}
                  </Menu>
                </>
              ) : (
                <Button
                  component={Link}
                  href={item.href}
                  color="inherit"
                  sx={{
                    color: 'rgba(255, 255, 255, 0.8)',
                    textTransform: 'none',
                    fontSize: '0.95rem',
                    '&:hover': { color: '#fff' },
                  }}
                >
                  {item.label}
                </Button>
              )}
            </Box>
          ))}
        </Box>

        {/* Right Side Actions */}
        <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 2 }}>
          <Button
            component={Link}
            href="/login"
            sx={{
              color: 'rgba(255, 255, 255, 0.8)',
              textTransform: 'none',
              fontSize: '0.95rem',
              '&:hover': { color: '#fff' },
            }}
          >
            登录
          </Button>
          <Button
            component={Link}
            href="/download"
            variant="contained"
            sx={{
              background: 'linear-gradient(135deg, #FF3B30, #FF6B6B)',
              color: '#fff',
              textTransform: 'none',
              fontSize: '0.95rem',
              fontWeight: 600,
              px: 3,
              py: 1,
              borderRadius: '8px',
              boxShadow: '0 4px 20px rgba(255, 59, 48, 0.4)',
              '&:hover': {
                background: 'linear-gradient(135deg, #FF5A50, #FF8B8B)',
                boxShadow: '0 6px 30px rgba(255, 59, 48, 0.6)',
              },
            }}
          >
            下载安装
          </Button>
        </Box>

        {/* Mobile Menu Button */}
        <IconButton
          sx={{ display: { md: 'none' }, color: '#fff' }}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <MenuIcon />
        </IconButton>
      </Toolbar>
    </AppBar>
  )
}
