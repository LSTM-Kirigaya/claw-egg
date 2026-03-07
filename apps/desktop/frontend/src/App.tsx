import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { open } from '@tauri-apps/plugin-shell'
import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
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
  Loader2,
  Rocket,
  RefreshCw,
  Terminal
} from 'lucide-react'
import { ThemeProvider, createTheme, CssBaseline, IconButton, Box, Tooltip, Button, LinearProgress } from '@mui/material'
import { EnvironmentCheck, OverallProgress, InstallStage, STAGE_NAMES } from './types'
import { InstallWizard } from './components/InstallWizard'
import { SettingsDialog } from './components/SettingsDialog'

const THEME_STORAGE_FILE = 'theme.txt'

function App() {
  const win = getCurrentWindow()
  const [platform, setPlatform] = useState<'macos' | 'windows' | 'linux'>('windows')
  const [themePreference, setThemePreference] = useState<'light' | 'dark' | 'system'>('system')
  const [showSettings, setShowSettings] = useState(false)
  const [showWizard, setShowWizard] = useState(false)
  const [environmentChecks, setEnvironmentChecks] = useState<EnvironmentCheck[]>([])
  const [isChecking, setIsChecking] = useState(true)
  
  // Installation state
  const [isInstalling, setIsInstalling] = useState(false)
  const [installProgress, setInstallProgress] = useState<OverallProgress | null>(null)
  const [installCompleted, setInstallCompleted] = useState(false)

  // Check environment on mount
  useEffect(() => {
    checkEnvironment()
  }, [])

  // Listen for installation progress events
  useEffect(() => {
    const unlisten = listen<OverallProgress>('install-progress', (event) => {
      setInstallProgress(event.payload)
      
      if (event.payload.stage === 'Completed') {
        setIsInstalling(false)
        setInstallCompleted(true)
        // Refresh environment checks
        checkEnvironment()
      } else if (event.payload.stage === 'Failed') {
        setIsInstalling(false)
      }
    })

    return () => {
      unlisten.then(fn => fn())
    }
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

  const startInstallation = async () => {
    setIsInstalling(true)
    setInstallProgress(null)
    setInstallCompleted(false)
    setShowWizard(true)
    
    try {
      await invoke('start_full_installation')
    } catch (error) {
      console.error('Installation failed:', error)
      setIsInstalling(false)
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

  const allInstalled = environmentChecks.every(check => check.installed)

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
                一键部署 AI Agent 平台 · 全自动安装
              </p>
            </div>

            {/* Installation Progress (shown during install) */}
            {(isInstalling || installCompleted) && installProgress && (
              <div className={`rounded-xl p-6 mb-6 ${themeMode === 'dark' ? 'bg-gray-700' : 'bg-white'} shadow-sm`}>
                <div className="flex items-center gap-3 mb-4">
                  {isInstalling ? (
                    <Loader2 className="w-6 h-6 text-primary animate-spin" />
                  ) : (
                    <CheckCircle className="w-6 h-6 text-green-500" />
                  )}
                  <div className="flex-1">
                    <h2 className="text-lg font-semibold">
                      {isInstalling ? '正在安装...' : '安装完成！'}
                    </h2>
                    <p className={`text-sm ${themeMode === 'dark' ? 'text-gray-400' : 'text-muted'}`}>
                      {installProgress.message}
                    </p>
                  </div>
                  <span className="text-2xl font-bold text-primary">
                    {installProgress.overall_progress}%
                  </span>
                </div>
                
                {/* Overall progress bar */}
                <LinearProgress 
                  variant="determinate" 
                  value={installProgress.overall_progress}
                  sx={{ 
                    height: 10, 
                    borderRadius: 5,
                    bgcolor: themeMode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                    '& .MuiLinearProgress-bar': {
                      bgcolor: 'primary.main',
                      borderRadius: 5,
                    }
                  }}
                />
                
                {/* Stage indicators */}
                <div className="mt-4 flex justify-between text-xs">
                  {['检查', '下载', '安装', 'Qwen', 'OpenClaw', '配置'].map((label, index) => {
                    const stageNum = index
                    const currentStageNum = ['EnvironmentCheck', 'DownloadNodeJs', 'InstallNodeJs', 'InstallQwenCli', 'InstallOpenClaw', 'ConfigureOpenClaw', 'Completed'].indexOf(installProgress.stage)
                    const isActive = stageNum === currentStageNum
                    const isCompleted = stageNum < currentStageNum
                    
                    return (
                      <div key={label} className="flex flex-col items-center gap-1">
                        <div 
                          className={`w-2 h-2 rounded-full ${
                            isCompleted ? 'bg-green-500' : 
                            isActive ? 'bg-primary animate-pulse' : 
                            themeMode === 'dark' ? 'bg-gray-600' : 'bg-gray-300'
                          }`}
                        />
                        <span className={isActive ? 'text-primary font-medium' : themeMode === 'dark' ? 'text-gray-500' : 'text-gray-400'}>
                          {label}
                        </span>
                      </div>
                    )
                  })}
                </div>
                
                {installProgress.detail && (
                  <p className={`mt-3 text-xs ${themeMode === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                    {installProgress.detail}
                  </p>
                )}
              </div>
            )}

            {/* Environment check */}
            {!isInstalling && !installCompleted && (
              <div className={`rounded-xl p-6 mb-6 ${themeMode === 'dark' ? 'bg-gray-700' : 'bg-white'} shadow-sm`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-5 h-5 text-primary" />
                    <h2 className="text-lg font-semibold">环境检测</h2>
                  </div>
                  {isChecking ? (
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  ) : (
                    <Button 
                      size="small" 
                      onClick={checkEnvironment}
                      startIcon={<RefreshCw className="w-3 h-3" />}
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
                        <span className="font-medium">
                          {check.component === 'NodeJs' && 'Node.js 22+'}
                          {check.component === 'QwenCli' && 'Qwen CLI'}
                          {check.component === 'OpenClaw' && 'OpenClaw'}
                        </span>
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
            )}

            {/* Install button */}
            {!isInstalling && (
              <div className="flex flex-col items-center gap-4">
                <Button
                  variant="contained"
                  size="large"
                  disabled={isInstalling}
                  startIcon={installCompleted ? <CheckCircle className="w-5 h-5" /> : <Rocket className="w-5 h-5" />}
                  sx={{
                    bgcolor: installCompleted ? 'green.500' : 'primary.main',
                    color: '#1A1A1A',
                    fontWeight: 600,
                    px: 6,
                    py: 2,
                    borderRadius: 2,
                    textTransform: 'none',
                    fontSize: '1rem',
                    '&:hover': {
                      bgcolor: installCompleted ? 'green.600' : 'primary.hover',
                    },
                  }}
                  onClick={installCompleted ? () => setShowWizard(true) : startInstallation}
                >
                  {installCompleted ? '打开配置向导' : allInstalled ? '重新安装' : '一键安装'}
                </Button>
                
                {!allInstalled && !installCompleted && (
                  <p className={`text-xs ${themeMode === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                    将自动安装 Node.js、Qwen CLI 和 OpenClaw
                  </p>
                )}
              </div>
            )}

            {/* Install Wizard */}
            <InstallWizard 
              open={showWizard} 
              onClose={() => setShowWizard(false)} 
              themeMode={themeMode}
              installCompleted={installCompleted}
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
