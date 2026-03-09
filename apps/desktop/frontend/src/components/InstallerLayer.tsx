import { useState, useEffect, useCallback } from 'react'
import { listen } from '@tauri-apps/api/event'
import { invoke } from '@tauri-apps/api/core'
import { 
  Box, 
  Button, 
  LinearProgress, 
  Typography, 
  Card, 
  CardContent,
  Alert,
  Stepper,
  Step,
  StepLabel,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip
} from '@mui/material'
import { 
  CheckCircle, 
  AlertCircle,
  Download,
  Rocket,
  RefreshCw,
  Terminal,
  CheckCircle2
} from 'lucide-react'
import { EnvironmentCheck, OverallProgress, InstallStage, STAGE_NAMES } from '../types'

interface InstallerLayerProps {
  onInstallationComplete: () => void;
}

const steps = ['环境检查', '下载安装', '配置完成']

export function InstallerLayer({ onInstallationComplete }: InstallerLayerProps) {
  const [activeStep, setActiveStep] = useState(0)
  const [isInstalling, setIsInstalling] = useState(false)
  const [progress, setProgress] = useState<OverallProgress | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [environmentChecks, setEnvironmentChecks] = useState<EnvironmentCheck[]>([])
  const [isCheckingEnv, setIsCheckingEnv] = useState(true)
  const [showEnvResults, setShowEnvResults] = useState(true)

  // Check environment on mount
  useEffect(() => {
    checkEnvironment()
  }, [])

  // Listen for installation progress
  useEffect(() => {
    const unlisten = listen<OverallProgress>('install-progress', (event) => {
      setProgress(event.payload)
      
      const stage = event.payload.stage
      if (stage === 'Completed') {
        setIsInstalling(false)
        setActiveStep(2)
        // Delay to show completion before transitioning
        setTimeout(() => {
          onInstallationComplete()
        }, 1500)
      } else if (stage === 'Failed') {
        setIsInstalling(false)
        setError(event.payload.message)
      } else if (['EnvironmentCheck', 'DownloadNodeJs', 'InstallNodeJs'].includes(stage)) {
        setActiveStep(1)
      } else if (['InstallOpenClaw', 'ConfigureOpenClaw'].includes(stage)) {
        setActiveStep(1)
      }
    })

    return () => {
      unlisten.then(fn => fn())
    }
  }, [onInstallationComplete])

  const checkEnvironment = useCallback(async () => {
    setIsCheckingEnv(true)
    try {
      const checks = await invoke<EnvironmentCheck[]>('check_environment')
      setEnvironmentChecks(checks)
    } catch (err) {
      console.error('Failed to check environment:', err)
      setError('环境检测失败: ' + String(err))
    } finally {
      setIsCheckingEnv(false)
    }
  }, [])

  const startInstallation = useCallback(async () => {
    setIsInstalling(true)
    setError(null)
    setProgress(null)
    setShowEnvResults(false)
    setActiveStep(1)
    
    try {
      await invoke('start_full_installation')
    } catch (err) {
      console.error('Installation failed:', err)
      setError('安装失败: ' + String(err))
      setIsInstalling(false)
    }
  }, [])

  const getStatusIcon = (check: EnvironmentCheck) => {
    if (check.component === 'NodeJs' && check.installed) {
      // For Node.js, check if version meets requirements (>=22 and even)
      const version = check.version || ''
      const majorMatch = version.match(/v?(\d+)/)
      const major = majorMatch ? parseInt(majorMatch[1]) : 0
      const isEven = major % 2 === 0
      const isValid = major >= 22 && isEven
      
      if (!isValid && version) {
        return <AlertCircle className="w-5 h-5 text-amber-500" />
      }
    }
    
    return check.installed ? 
      <CheckCircle className="w-5 h-5 text-green-500" /> : 
      <AlertCircle className="w-5 h-5 text-amber-500" />
  }

  const getStatusText = (check: EnvironmentCheck): string => {
    if (check.component === 'NodeJs' && check.installed && check.version) {
      const majorMatch = check.version.match(/v?(\d+)/)
      const major = majorMatch ? parseInt(majorMatch[1]) : 0
      const isEven = major % 2 === 0
      const isValid = major >= 22 && isEven
      
      if (!isValid) {
        return `版本不符合要求 (需要 >=22 且偶数): ${check.version}`
      }
    }
    return check.installed ? '已安装' : '未安装'
  }

  const allRequirementsMet = environmentChecks.every(check => {
    if (check.component === 'NodeJs' && check.installed && check.version) {
      const majorMatch = check.version.match(/v?(\d+)/)
      const major = majorMatch ? parseInt(majorMatch[1]) : 0
      return major >= 22 && major % 2 === 0
    }
    return check.installed
  })

  return (
    <Box className="flex flex-col h-full p-6 max-w-4xl mx-auto">
      {/* Header */}
      <Box className="text-center mb-8">
        <Typography variant="h4" className="font-bold mb-2" color="primary">
          OpenClaw 安装向导
        </Typography>
        <Typography variant="body1" color="text.secondary">
          一键部署 AI Agent 平台 · 全自动安装
        </Typography>
      </Box>

      {/* Stepper */}
      <Stepper activeStep={activeStep} alternativeLabel className="mb-8">
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" className="mb-6">
          {error}
          <Button 
            size="small" 
            onClick={startInstallation}
            className="ml-4"
            variant="outlined"
          >
            重试
          </Button>
        </Alert>
      )}

      {/* Environment Check Results */}
      {showEnvResults && (
        <Card className="mb-6" elevation={2}>
          <CardContent>
            <Box className="flex items-center justify-between mb-4">
              <Box className="flex items-center gap-2">
                <Terminal className="w-5 h-5 text-primary" />
                <Typography variant="h6">环境检测结果</Typography>
              </Box>
              <Button
                size="small"
                onClick={checkEnvironment}
                disabled={isCheckingEnv}
                startIcon={<RefreshCw className={isCheckingEnv ? 'animate-spin' : ''} />}
              >
                刷新
              </Button>
            </Box>

            <List>
              {environmentChecks.map((check) => (
                <ListItem key={check.component} className="rounded-lg mb-2 bg-gray-50 dark:bg-[#1A1A1A]">
                  <ListItemIcon>
                    {getStatusIcon(check)}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box className="flex items-center gap-2">
                        <span className="font-medium">
                          {check.component === 'NodeJs' && 'Node.js (>=22, 偶数版本)'}
                          {check.component === 'OpenClaw' && 'OpenClaw'}
                        </span>
                        {check.version && (
                          <Chip 
                            size="small" 
                            label={check.version} 
                            variant="outlined"
                            color={check.installed ? 'success' : 'default'}
                          />
                        )}
                      </Box>
                    }
                    secondary={getStatusText(check)}
                  />
                  {check.path && (
                    <Typography variant="caption" color="text.secondary" className="ml-4">
                      {check.path}
                    </Typography>
                  )}
                </ListItem>
              ))}
            </List>

            {allRequirementsMet && (
              <Alert severity="success" className="mt-4">
                环境检查通过！您可以直接进入软件，或重新安装以更新到最新版本。
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Installation Progress */}
      {isInstalling && progress && (
        <Card className="mb-6" elevation={2}>
          <CardContent>
            <Box className="flex items-center gap-3 mb-4">
              <Download className="w-6 h-6 text-primary animate-pulse" />
              <Box className="flex-1">
                <Typography variant="h6">
                  {STAGE_NAMES[progress.stage]}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {progress.message}
                </Typography>
              </Box>
              <Typography variant="h4" color="primary" className="font-bold">
                {progress.overall_progress}%
              </Typography>
            </Box>

            <LinearProgress
              variant="determinate"
              value={progress.overall_progress}
              className="h-3 rounded-full mb-4"
            />

            {progress.detail && (
              <Typography variant="caption" color="text.secondary">
                {progress.detail}
              </Typography>
            )}
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <Box className="flex justify-center gap-4 mt-auto">
        {!isInstalling && (
          <>
            {allRequirementsMet ? (
              <Button
                variant="outlined"
                size="large"
                onClick={onInstallationComplete}
                startIcon={<CheckCircle2 className="w-5 h-5" />}
              >
                直接进入软件
              </Button>
            ) : null}
            <Button
              variant="contained"
              size="large"
              onClick={startInstallation}
              disabled={isInstalling}
              startIcon={<Rocket className="w-5 h-5" />}
              sx={{
                bgcolor: 'primary.main',
                color: '#FFFFFF',
                fontWeight: 600,
                px: 4,
                py: 1.5,
                '&:hover': {
                  bgcolor: 'primary.hover',
                },
              }}
            >
              {allRequirementsMet ? '重新安装/更新' : '开始安装'}
            </Button>
          </>
        )}
      </Box>
    </Box>
  )
}
