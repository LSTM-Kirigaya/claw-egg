import { useState, useEffect, useMemo, useCallback } from 'react'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { open } from '@tauri-apps/plugin-shell'
import { invoke } from '@tauri-apps/api/core'
import { 
  Settings, 
  Github, 
  Mail, 
  ExternalLink, 
  Minus, 
  Copy, 
  X
} from 'lucide-react'
import { ThemeProvider, createTheme, CssBaseline, IconButton, Box, Tooltip, Snackbar, Alert } from '@mui/material'
import { InstallerLayer } from './components/InstallerLayer'
import { MainLayer } from './components/MainLayer'
import { SettingsDialog } from './components/SettingsDialog'
import { CloseConfirmDialog } from './components/CloseConfirmDialog'
import { AppView, ThemePreference } from './types'
import { loadSettings, saveSettings, updateTheme } from './utils/settings'
import { hideToTray } from './utils/tray'

function App() {
  const win = getCurrentWindow()
  const [platform, setPlatform] = useState<'macos' | 'windows' | 'linux'>('windows')
  const [themePreference, setThemePreference] = useState<ThemePreference>('system')
  const [isLoadingSettings, setIsLoadingSettings] = useState(true)
  const [showSettings, setShowSettings] = useState(false)
  const [currentView, setCurrentView] = useState<AppView>('installer')
  const [isCheckingInstallStatus, setIsCheckingInstallStatus] = useState(true)
  const [showTrayTip, setShowTrayTip] = useState(false)
  const [hasShownTrayTip, setHasShownTrayTip] = useState(false)
  const [showCloseConfirm, setShowCloseConfirm] = useState(false)

  // 初始加载：读取配置和检查安装状态
  useEffect(() => {
    initializeApp()
    // 检查是否已显示过托盘提示
    const tipShown = localStorage.getItem('tray-tip-shown')
    if (tipShown) {
      setHasShownTrayTip(true)
    }
  }, [])

  const initializeApp = async () => {
    setIsLoadingSettings(true)
    setIsCheckingInstallStatus(true)
    
    try {
      // 1. 加载应用配置
      const settings = await loadSettings()
      setThemePreference(settings.theme)
      // 同步到 localStorage 供 HTML 页面加载时使用
      localStorage.setItem('theme-preference', settings.theme)
      
      // 2. 恢复窗口状态
      if (settings.window.maximized) {
        await win.maximize()
      }
      
      // 3. 检查安装状态
      const isComplete = await invoke<boolean>('is_installation_complete')
      if (isComplete) {
        setCurrentView('main')
      }
      
      // 4. 标记首次运行完成（用于显示欢迎向导等）
      if (settings.firstRun) {
        await invoke('mark_first_run_complete')
      }
    } catch (error) {
      console.error('Failed to initialize app:', error)
    } finally {
      setIsLoadingSettings(false)
      setIsCheckingInstallStatus(false)
    }
  }

  // 检测平台
  useEffect(() => {
    const detectPlatform = () => {
      const platformName = navigator.platform.toLowerCase()
      const userAgent = navigator.userAgent.toLowerCase()
      
      if (platformName.includes('mac') || userAgent.includes('mac')) {
        setPlatform('macos')
      } else if (platformName.includes('win') || userAgent.includes('win')) {
        setPlatform('windows')
      } else {
        setPlatform('linux')
      }
    }
    detectPlatform()
  }, [])

  // 保存窗口状态
  useEffect(() => {
    const saveWindowState = async () => {
      try {
        const isMaximized = await win.isMaximized()
        const size = await win.innerSize()
        
        // 先加载现有配置，然后只更新窗口字段
        const currentSettings = await loadSettings()
        const updatedSettings = {
          ...currentSettings,
          window: {
            ...currentSettings.window,
            maximized: isMaximized,
            width: size.width,
            height: size.height,
          }
        }
        
        await saveSettings(updatedSettings)
      } catch (error) {
        console.error('Failed to save window state:', error)
      }
    }

    // 窗口大小改变时保存状态
    const unlisten = getCurrentWindow().onResized(() => {
      saveWindowState()
    })

    return () => {
      unlisten.then(fn => fn())
    }
  }, [])

  const handleInstallationComplete = () => {
    setCurrentView('main')
  }

  // 处理主题变更
  const handleThemeChange = async (theme: ThemePreference) => {
    setThemePreference(theme)
    // 保存到 localStorage 用于页面加载时判断
    localStorage.setItem('theme-preference', theme)
    try {
      await updateTheme(theme)
    } catch (error) {
      console.error('Failed to save theme:', error)
    }
  }

  // 处理关闭按钮点击
  const handleCloseClick = useCallback(() => {
    // 检查是否有保存的偏好设置
    const savedPreference = localStorage.getItem('close-action-preference')
    if (savedPreference === 'minimize') {
      handleMinimizeToTray()
    } else if (savedPreference === 'quit') {
      win.close()
    } else {
      // 没有保存的偏好，显示确认对话框
      setShowCloseConfirm(true)
    }
  }, [])

  // 处理最小化到托盘
  const handleMinimizeToTray = useCallback(async () => {
    setShowCloseConfirm(false)
    try {
      await hideToTray()
      // 首次最小化到托盘时显示提示
      if (!hasShownTrayTip) {
        setShowTrayTip(true)
        setHasShownTrayTip(true)
        localStorage.setItem('tray-tip-shown', 'true')
      }
    } catch (error) {
      console.error('Failed to minimize to tray:', error)
    }
  }, [hasShownTrayTip])

  // 处理退出应用
  const handleQuitApp = useCallback(() => {
    setShowCloseConfirm(false)
    win.close()
  }, [])

  // 关闭托盘提示
  const handleCloseTrayTip = () => {
    setShowTrayTip(false)
  }

  // Detect system theme
  const systemTheme = useMemo(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    return 'light'
  }, [])

  // Calculate actual theme
  const themeMode = themePreference === 'system' ? systemTheme : themePreference

  // Listen for system theme changes
  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      const handler = () => {
        if (themePreference === 'system') {
          document.documentElement.classList.toggle('dark', mediaQuery.matches)
        }
      }
      mediaQuery.addEventListener('change', handler)
      return () => mediaQuery.removeEventListener('change', handler)
    }
  }, [themePreference])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', themeMode === 'dark')
  }, [themeMode])

  const theme = useMemo(() => createTheme({
    palette: {
      mode: themeMode,
      primary: {
        main: '#FF3B30',
        contrastText: '#FFFFFF',
      },
      secondary: {
        main: themeMode === 'dark' ? '#FF3B30' : '#1A1A1A',
      },
      background: {
        default: themeMode === 'dark' ? '#1C1C1C' : '#FFFFFF',
        paper: themeMode === 'dark' ? '#252525' : '#F5F5F5',
      },
    },
    shape: {
      borderRadius: 12,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
          },
        },
      },
    },
  }), [themeMode])

  // Window drag handling
  const handleTitleBarMouseDown = () => {
    win.startDragging()
  }

  // 加载中显示
  if (isLoadingSettings || isCheckingInstallStatus) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box className="h-full flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </Box>
      </ThemeProvider>
    )
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div className={`flex-1 flex flex-col overflow-hidden ${themeMode === 'dark' ? 'text-neutral-100' : 'text-text-main'}`} style={{ height: '100%', boxSizing: 'border-box' }}>
        {/* Title bar */}
        <header className={`sticky top-0 z-50 shrink-0 h-10 flex items-center border-b select-none backdrop-blur-md ${themeMode === 'dark' ? 'border-[#404040]/80 bg-[#1C1C1C]/80' : 'border-[#E0E0E0]/80 bg-white/80'} ${platform === 'macos' ? 'pl-16' : ''}`}>
          {/* macOS window controls */}
          {platform === 'macos' && (
            <Box
              sx={{
                position: 'absolute',
                left: 8,
                top: '50%',
                transform: 'translateY(-50%)',
                display: 'flex',
                gap: 1,
                alignItems: 'center',
                zIndex: 1000,
              }}
            >
              <Box
                component="button"
                onClick={() => win.close()}
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  bgcolor: '#ff5f57',
                  border: 'none',
                  cursor: 'pointer',
                  '&:hover': { bgcolor: '#ff3b30' },
                }}
              />
              <Box
                component="button"
                onClick={() => win.minimize()}
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  bgcolor: '#ffbd2e',
                  border: 'none',
                  cursor: 'pointer',
                  '&:hover': { bgcolor: '#ff9500' },
                }}
              />
              <Box
                component="button"
                onClick={() => win.toggleMaximize()}
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  bgcolor: '#28c840',
                  border: 'none',
                  cursor: 'pointer',
                  '&:hover': { bgcolor: '#1fb82e' },
                }}
              />
            </Box>
          )}

          {/* Left: App icon and name */}
          <div
            data-tauri-drag-region
            onMouseDown={handleTitleBarMouseDown}
            className="flex items-center px-4 h-full cursor-default gap-2"
            style={{ flex: '0 0 auto' }}
          >
            {platform !== 'macos' && (
              <img 
                src="/app-icon.png?v=2" 
                alt="App Icon" 
                className="w-6 h-6 rounded-md mr-5"
                style={{ imageRendering: 'crisp-edges' }}
              />
            )}
            <span className={`text-sm font-semibold ${platform === 'macos' ? '' : 'mr-16'} ${themeMode === 'dark' ? 'text-neutral-100' : 'text-secondary'}`}>
              龙虾孵化器
            </span>
          </div>
          
          {/* Center: Draggable area */}
          <div
            data-tauri-drag-region
            onMouseDown={handleTitleBarMouseDown}
            className="flex-1 flex items-center h-full cursor-default px-4"
          />
          
          {/* Links */}
          <div className={`flex items-center h-full px-2 gap-0.5 border-r mr-1 ${themeMode === 'dark' ? 'border-[#3C3C3C]' : 'border-[#E0E0E0]'}`}>
            <Tooltip title="GitHub" arrow>
              <IconButton
                size="small"
                onClick={() => open('https://github.com/LSTM-Kirigaya/claw-egg')}
                sx={{
                  width: '24px',
                  height: '24px',
                  color: 'text.secondary',
                  '&:hover': {
                    bgcolor: 'action.hover',
                    color: 'text.primary',
                  },
                }}
              >
                <Github className="w-3.5 h-3.5" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Email" arrow>
              <IconButton
                size="small"
                onClick={() => open('mailto:zhelonghuang@qq.com')}
                sx={{
                  width: '24px',
                  height: '24px',
                  color: 'text.secondary',
                  '&:hover': {
                    bgcolor: 'action.hover',
                    color: 'text.primary',
                  },
                }}
              >
                <Mail className="w-3.5 h-3.5" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Homepage" arrow>
              <IconButton
                size="small"
                onClick={() => open('https://kirigaya.cn/about')}
                sx={{
                  width: '24px',
                  height: '24px',
                  color: 'text.secondary',
                  '&:hover': {
                    bgcolor: 'action.hover',
                    color: 'text.primary',
                  },
                }}
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </IconButton>
            </Tooltip>
          </div>
          
          {/* Settings button */}
          <div className="flex items-center h-full px-2 gap-1">
            <IconButton
              size="small"
              onClick={() => setShowSettings(true)}
              sx={{
                width: '28px',
                height: '28px',
                color: 'text.secondary',
                '&:hover': {
                  bgcolor: 'action.hover',
                },
              }}
            >
              <Settings className="w-4 h-4" />
            </IconButton>
          </div>

          {/* Windows/Linux window controls */}
          {platform !== 'macos' && (
            <div className={`flex items-center border-l ${themeMode === 'dark' ? 'border-[#3C3C3C]' : 'border-[#E0E0E0]'}`}>
              <IconButton
                size="small"
                onClick={() => win.minimize()}
                sx={{
                  width: '40px',
                  height: '40px',
                  borderRadius: 0,
                  color: 'text.secondary',
                  '&:hover': {
                    bgcolor: 'action.hover',
                  },
                }}
              >
                <Minus className="w-4 h-4" />
              </IconButton>
              <IconButton
                size="small"
                onClick={() => win.toggleMaximize()}
                sx={{
                  width: '40px',
                  height: '40px',
                  borderRadius: 0,
                  color: 'text.secondary',
                  '&:hover': {
                    bgcolor: 'action.hover',
                  },
                }}
              >
                <Copy className="w-4 h-4" />
              </IconButton>
              <IconButton
                size="small"
                onClick={handleCloseClick}
                sx={{
                  width: '40px',
                  height: '40px',
                  borderRadius: 0,
                  color: 'text.secondary',
                  '&:hover': {
                    bgcolor: 'error.main',
                    color: 'white',
                  },
                }}
              >
                <X className="w-4 h-4" />
              </IconButton>
            </div>
          )}
        </header>

        {/* Main content */}
        <main className={`flex-1 overflow-hidden ${themeMode === 'dark' ? 'bg-[#252525]/50' : 'bg-surface/50'}`}>
          {currentView === 'installer' ? (
            <InstallerLayer onInstallationComplete={handleInstallationComplete} />
          ) : (
            <Box className="h-full p-4">
              <MainLayer themeMode={themeMode} />
            </Box>
          )}
        </main>

        {/* Settings Dialog */}
        <SettingsDialog
          open={showSettings}
          onClose={() => setShowSettings(false)}
          themePreference={themePreference}
          onThemeChange={handleThemeChange}
        />

        {/* Close Confirm Dialog */}
        <CloseConfirmDialog
          open={showCloseConfirm}
          onClose={() => setShowCloseConfirm(false)}
          onMinimizeToTray={handleMinimizeToTray}
          onQuitApp={handleQuitApp}
          themeMode={themeMode}
        />

        {/* Tray tip snackbar */}
        <Snackbar
          open={showTrayTip}
          autoHideDuration={6000}
          onClose={handleCloseTrayTip}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert 
            onClose={handleCloseTrayTip} 
            severity="info" 
            sx={{ width: '100%' }}
          >
            应用已最小化到系统托盘，点击托盘图标可重新显示窗口
          </Alert>
        </Snackbar>
      </div>
    </ThemeProvider>
  )
}

export default App
