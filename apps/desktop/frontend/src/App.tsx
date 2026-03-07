import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
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
  X,
  Download,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react'
import { ThemeProvider, createTheme, CssBaseline, IconButton, Box, Tooltip, Button } from '@mui/material'
import { EnvironmentCheck } from './types'
import { InstallWizard } from './components/InstallWizard'
import { SettingsDialog } from './components/SettingsDialog'

const THEME_STORAGE_FILE = 'theme.txt'

function App() {
  const win = getCurrentWindow()
  const [platform, setPlatform] = useState<'macos' | 'windows' | 'linux'>('windows')
  const [themePreference, setThemePreference] = useState<'light' | 'dark' | 'system'>('system')
  const [showSettings, setShowSettings] = useState(false)
  const [environmentChecks, setEnvironmentChecks] = useState<EnvironmentCheck[]>([])
  const [isChecking, setIsChecking] = useState(true)

  // Check environment on mount
  useEffect(() => {
    checkEnvironment()
  }, [])

  const checkEnvironment = async () => {
    setIsChecking(true)
    try {
      const checks = await invoke<EnvironmentCheck[]>('check_environment')
      setEnvironmentChecks(checks)
    } catch (error) {
      console.error('Failed to check environment:', error)
    } finally {
      setIsChecking(false)
    }
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
        main: '#FFD200',
      },
      secondary: {
        main: themeMode === 'dark' ? '#FFD200' : '#1A1A1A',
      },
      background: {
        default: themeMode === 'dark' ? '#111827' : '#FFFFFF',
        paper: themeMode === 'dark' ? '#1F2937' : '#F5F5F5',
      },
    },
    shape: {
      borderRadius: 12,
    },
  }), [themeMode])

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

  // Window drag handling
  const lastClickTimeRef = useRef<number>(0)
  const clickTimeoutRef = useRef<number | null>(null)
  const isDraggingRef = useRef<boolean>(false)

  const handleTitleBarMouseDown = (e: React.MouseEvent) => {
    const now = Date.now()
    const timeSinceLastClick = now - lastClickTimeRef.current
    
    if (timeSinceLastClick < 300) {
      if (clickTimeoutRef.current !== null) {
        clearTimeout(clickTimeoutRef.current)
        clickTimeoutRef.current = null
      }
      e.preventDefault()
      e.stopPropagation()
      isDraggingRef.current = false
      return
    }
    
    lastClickTimeRef.current = now
    
    clickTimeoutRef.current = window.setTimeout(() => {
      if (!isDraggingRef.current) {
        win.startDragging()
        isDraggingRef.current = true
      }
    }, 200)
  }

  const handleTitleBarDoubleClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (clickTimeoutRef.current !== null) {
      clearTimeout(clickTimeoutRef.current)
      clickTimeoutRef.current = null
    }
    
    isDraggingRef.current = true
    
    try {
      await win.toggleMaximize()
    } catch (error) {
      console.error('Toggle maximize failed:', error)
    }
    
    setTimeout(() => {
      isDraggingRef.current = false
    }, 100)
  }

  const getStatusIcon = (installed: boolean) => {
    if (installed) {
      return <CheckCircle className="w-5 h-5 text-green-500" />
    }
    return <AlertCircle className="w-5 h-5 text-amber-500" />
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div className={`min-h-screen flex flex-col overflow-hidden ${themeMode === 'dark' ? 'bg-gray-900 text-gray-100' : 'bg-white text-text-main'}`} style={{ height: '100%', boxSizing: 'border-box' }}>
        {/* Title bar */}
        <header className={`sticky top-0 z-50 shrink-0 h-10 flex items-center border-b select-none ${themeMode === 'dark' ? 'border-gray-700 bg-gray-900' : 'border-border bg-white'} ${platform === 'macos' ? 'pl-16' : ''}`}>
          {/* macOS window controls */}
          {platform === 'macos' && (
            <Box sx={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', display: 'flex', gap: 1, alignItems: 'center', zIndex: 1000 }}>
              <Box component="button" onClick={() => win.close()} sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#ff5f57', border: 'none', cursor: 'pointer' }} />
              <Box component="button" onClick={() => win.minimize()} sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#ffbd2e', border: 'none', cursor: 'pointer' }} />
              <Box component="button" onClick={() => win.toggleMaximize()} sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#28c840', border: 'none', cursor: 'pointer' }} />
            </Box>
          )}

          {/* App icon and name */}
          <div data-tauri-drag-region onMouseDown={handleTitleBarMouseDown} onDoubleClick={handleTitleBarDoubleClick} className="flex items-center px-4 h-full cursor-default gap-2" style={{ flex: '0 0 auto' }}>
            {platform !== 'macos' && (
              <img src="/app-icon.png" alt="App Icon" className="w-6 h-6 rounded-md mr-5" style={{ imageRendering: 'crisp-edges' }} />
            )}
            <span className={`text-sm font-semibold ${platform === 'macos' ? '' : 'mr-16'} ${themeMode === 'dark' ? 'text-gray-100' : 'text-secondary'}`}>
              ClawEgg
            </span>
          </div>
          
          {/* Links */}
          <div className={`flex items-center h-full px-2 gap-0.5 border-r mr-1 ${themeMode === 'dark' ? 'border-gray-700' : 'border-border'}`}>
            <Tooltip title="GitHub" arrow>
              <IconButton size="small" onClick={() => open('https://github.com/LSTM-Kirigaya/claw-egg')} sx={{ width: '24px', height: '24px', color: 'text.secondary' }}>
                <Github className="w-3.5 h-3.5" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Email" arrow>
              <IconButton size="small" onClick={() => open('mailto:zhelonghuang@qq.com')} sx={{ width: '24px', height: '24px', color: 'text.secondary' }}>
                <Mail className="w-3.5 h-3.5" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Homepage" arrow>
              <IconButton size="small" onClick={() => open('https://kirigaya.cn/about')} sx={{ width: '24px', height: '24px', color: 'text.secondary' }}>
                <ExternalLink className="w-3.5 h-3.5" />
              </IconButton>
            </Tooltip>
          </div>
          
          {/* Settings button */}
          <div className="flex items-center h-full px-2 gap-1">
            <IconButton size="small" onClick={() => setShowSettings(true)} sx={{ width: '28px', height: '28px', color: 'text.secondary' }}>
              <Settings className="w-4 h-4" />
            </IconButton>
          </div>

          {/* Windows/Linux window controls */}
          {platform !== 'macos' && (
            <div className={`flex items-center border-l ${themeMode === 'dark' ? 'border-gray-700' : 'border-border'}`}>
              <IconButton size="small" onClick={() => win.minimize()} sx={{ width: '40px', height: '40px', borderRadius: 0, color: 'text.secondary' }}>
                <Minus className="w-4 h-4" />
              </IconButton>
              <IconButton size="small" onClick={() => win.toggleMaximize()} sx={{ width: '40px', height: '40px', borderRadius: 0, color: 'text.secondary' }}>
                <Copy className="w-4 h-4" />
              </IconButton>
              <IconButton size="small" onClick={() => win.close()} sx={{ width: '40px', height: '40px', borderRadius: 0, color: 'text.secondary', '&:hover': { bgcolor: 'error.main', color: 'white' } }}>
                <X className="w-4 h-4" />
              </IconButton>
            </div>
          )}
        </header>

        {/* Main content */}
        <div className="flex-1 flex overflow-hidden">
          <main className={`flex-1 flex flex-col min-h-0 overflow-y-auto p-6 ${themeMode === 'dark' ? 'bg-gray-800' : 'bg-surface'}`}>
            {/* Hero section */}
            <div className="text-center mb-8">
              <h1 className={`text-3xl font-bold mb-2 ${themeMode === 'dark' ? 'text-white' : 'text-secondary'}`}>
                OpenClaw Installer
              </h1>
              <p className={`text-sm ${themeMode === 'dark' ? 'text-gray-400' : 'text-muted'}`}>
                一键部署 AI Agent 平台
              </p>
            </div>

            {/* Environment check */}
            <div className={`rounded-xl p-6 mb-6 ${themeMode === 'dark' ? 'bg-gray-700' : 'bg-white'} shadow-sm`}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">环境检测</h2>
                {isChecking ? (
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                ) : (
                  <Button 
                    size="small" 
                    onClick={checkEnvironment}
                    sx={{ textTransform: 'none', color: 'primary.main' }}
                  >
                    刷新
                  </Button>
                )}
              </div>
              
              <div className="space-y-3">
                {environmentChecks.map((check) => (
                  <div 
                    key={check.component} 
                    className={`flex items-center justify-between p-3 rounded-lg ${themeMode === 'dark' ? 'bg-gray-800' : 'bg-surface'}`}
                  >
                    <div className="flex items-center gap-3">
                      {getStatusIcon(check.installed)}
                      <span className="font-medium">{check.component}</span>
                    </div>
                    <div className="text-right">
                      {check.installed ? (
                        <>
                          <div className="text-sm text-green-600 font-medium">已安装</div>
                          {check.version && (
                            <div className={`text-xs ${themeMode === 'dark' ? 'text-gray-400' : 'text-muted'}`}>
                              {check.version}
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-sm text-amber-600 font-medium">未安装</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Install button */}
            <div className="flex justify-center">
              <Button
                variant="contained"
                size="large"
                startIcon={<Download />}
                sx={{
                  bgcolor: 'primary.main',
                  color: '#1A1A1A',
                  fontWeight: 600,
                  px: 4,
                  py: 1.5,
                  borderRadius: 2,
                  textTransform: 'none',
                  '&:hover': {
                    bgcolor: 'primary.hover',
                  },
                }}
                onClick={() => {
                  // TODO: Open install wizard
                }}
              >
                开始安装
              </Button>
            </div>

            {/* Install Wizard */}
            <InstallWizard 
              open={false} 
              onClose={() => {}} 
              themeMode={themeMode}
            />
          </main>
        </div>

        {/* Settings Dialog */}
        <SettingsDialog
          open={showSettings}
          onClose={() => setShowSettings(false)}
          themePreference={themePreference}
          onThemeChange={setThemePreference}
        />
      </div>
    </ThemeProvider>
  )
}

export default App
