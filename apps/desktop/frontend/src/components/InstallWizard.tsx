import { useState, useEffect } from 'react'
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  Stepper, 
  Step, 
  StepLabel,
  Box,
  Typography,
  LinearProgress,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert
} from '@mui/material'
import { Download, CheckCircle, Settings, Rocket, ExternalLink } from 'lucide-react'
import { listen } from '@tauri-apps/api/event'
import { invoke } from '@tauri-apps/api/core'
import { OverallProgress, STAGE_NAMES } from '../types'

interface InstallWizardProps {
  open: boolean
  onClose: () => void
  themeMode: 'light' | 'dark'
  installCompleted?: boolean
}

const steps = ['准备', '下载安装', '配置']

export function InstallWizard({ open, onClose, themeMode, installCompleted: initialCompleted = false }: InstallWizardProps) {
  const [activeStep, setActiveStep] = useState(0)
  const [installing, setInstalling] = useState(false)
  const [completed, setCompleted] = useState(initialCompleted)
  const [progress, setProgress] = useState<OverallProgress | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  // Configuration form state
  const [config, setConfig] = useState({
    appId: '',
    appSecret: '',
    domain: 'feishu.cn',
    modelProvider: 'qwen',
  })

  useEffect(() => {
    if (!open) return

    const unlisten = listen<OverallProgress>('install-progress', (event) => {
      setProgress(event.payload)
      
      // Update step based on stage
      const stage = event.payload.stage
      if (stage === 'Completed') {
        setInstalling(false)
        setCompleted(true)
        setActiveStep(2) // Move to config step
      } else if (stage === 'Failed') {
        setInstalling(false)
        setError(event.payload.message)
      } else if (['EnvironmentCheck', 'DownloadNodeJs', 'InstallNodeJs', 'InstallQwenCli', 'InstallOpenClaw'].includes(stage)) {
        setActiveStep(1) // Installation step
      }
    })

    return () => {
      unlisten.then(fn => fn())
    }
  }, [open])

  useEffect(() => {
    if (initialCompleted) {
      setCompleted(true)
      setActiveStep(2)
    }
  }, [initialCompleted])

  const startInstall = async () => {
    setInstalling(true)
    setError(null)
    setActiveStep(1)
    
    try {
      await invoke('start_full_installation')
    } catch (e) {
      setInstalling(false)
      setError(String(e))
    }
  }

  const handleClose = () => {
    if (!installing) {
      onClose()
    }
  }

  const handleSaveConfig = async () => {
    try {
      await invoke('save_config', {
        config: {
          app_id: config.appId,
          app_secret: config.appSecret,
          domain: config.domain,
          model_provider: config.modelProvider,
          model_name: config.modelProvider === 'qwen' ? 'qwen-turbo' : 'gpt-4',
        }
      })
      onClose()
    } catch (e) {
      setError(String(e))
    }
  }

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <Rocket className="w-16 h-16 mx-auto mb-4 text-primary" />
            <Typography variant="h6" gutterBottom>
              准备安装 OpenClaw
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              这将自动完成以下步骤：
            </Typography>
            <Box sx={{ textAlign: 'left', maxWidth: 400, mx: 'auto', mb: 4 }}>
              {['检查系统环境', '下载并安装 Node.js 22+', '安装 Qwen CLI', '安装 OpenClaw', '自动配置环境变量'].map((item, i) => (
                <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <Typography variant="body2">{item}</Typography>
                </Box>
              ))}
            </Box>
            <Button
              variant="contained"
              size="large"
              onClick={startInstall}
              startIcon={<Download />}
              sx={{
                bgcolor: 'primary.main',
                color: '#FFFFFF',
                fontWeight: 600,
                px: 4,
                textTransform: 'none',
                '&:hover': { bgcolor: 'primary.hover' },
              }}
            >
              开始全自动安装
            </Button>
          </Box>
        )
      
      case 1:
        return (
          <Box sx={{ py: 4 }}>
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}
            
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Download className="w-16 h-16 mx-auto mb-4 text-primary animate-pulse" />
              <Typography variant="h6" gutterBottom>
                {progress?.stage === 'Completed' ? '安装完成！' : '正在安装...'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {progress?.message || '准备中...'}
              </Typography>
            </Box>

            {/* Progress bar */}
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  总进度
                </Typography>
                <Typography variant="caption" color="primary" fontWeight="bold">
                  {progress?.overall_progress || 0}%
                </Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={progress?.overall_progress || 0}
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
            </Box>

            {/* Current stage */}
            {progress && (
              <Box sx={{ mt: 3, p: 2, bgcolor: themeMode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', borderRadius: 2 }}>
                <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                  当前步骤
                </Typography>
                <Typography variant="body2" fontWeight="medium">
                  {STAGE_NAMES[progress.stage]}
                </Typography>
                {progress.detail && (
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                    {progress.detail}
                  </Typography>
                )}
              </Box>
            )}
          </Box>
        )
      
      case 2:
        return (
          <Box sx={{ py: 4 }}>
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Settings className="w-16 h-16 mx-auto mb-4 text-primary" />
              <Typography variant="h6" gutterBottom>
                配置 OpenClaw
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                请在飞书开放平台创建机器人并获取以下信息
              </Typography>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="App ID"
                value={config.appId}
                onChange={(e) => setConfig({ ...config, appId: e.target.value })}
                fullWidth
                size="small"
                placeholder="cli_xxxxxxxxxx"
              />
              
              <TextField
                label="App Secret"
                value={config.appSecret}
                onChange={(e) => setConfig({ ...config, appSecret: e.target.value })}
                fullWidth
                size="small"
                type="password"
                placeholder="输入 App Secret"
              />

              <FormControl fullWidth size="small">
                <InputLabel>平台</InputLabel>
                <Select
                  value={config.domain}
                  label="平台"
                  onChange={(e) => setConfig({ ...config, domain: e.target.value })}
                >
                  <MenuItem value="feishu.cn">飞书 (feishu.cn)</MenuItem>
                  <MenuItem value="larksuite.com">Lark (larksuite.com)</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth size="small">
                <InputLabel>模型提供商</InputLabel>
                <Select
                  value={config.modelProvider}
                  label="模型提供商"
                  onChange={(e) => setConfig({ ...config, modelProvider: e.target.value })}
                >
                  <MenuItem value="qwen">通义千问 (Qwen)</MenuItem>
                  <MenuItem value="openai">OpenAI</MenuItem>
                  <MenuItem value="anthropic">Anthropic</MenuItem>
                </Select>
              </FormControl>

              <Button
                variant="outlined"
                size="small"
                startIcon={<ExternalLink className="w-4 h-4" />}
                onClick={() => window.open('https://open.feishu.cn/app', '_blank')}
                sx={{ mt: 1, textTransform: 'none' }}
              >
                打开飞书开放平台
              </Button>
            </Box>
          </Box>
        )
      
      default:
        return null
    }
  }

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          bgcolor: themeMode === 'dark' ? '#252525' : '#FFFFFF',
        }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Rocket className="w-6 h-6 text-primary" />
          <Typography variant="h6">
            {completed ? '配置向导' : '安装向导'}
          </Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Stepper 
          activeStep={activeStep} 
          alternativeLabel
          sx={{ 
            mb: 3,
            '& .MuiStepLabel-label': {
              color: themeMode === 'dark' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)',
            },
            '& .Mui-active .MuiStepLabel-label': {
              color: 'primary.main',
            },
            '& .Mui-completed .MuiStepLabel-label': {
              color: themeMode === 'dark' ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.8)',
            },
          }}
        >
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        
        {renderStepContent(activeStep)}
      </DialogContent>
      
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button
          onClick={handleClose}
          disabled={installing}
          sx={{ textTransform: 'none', color: 'text.secondary' }}
        >
          {activeStep === 2 ? '稍后配置' : '取消'}
        </Button>
        
        {activeStep === 2 && (
          <Button
            variant="contained"
            onClick={handleSaveConfig}
            sx={{
              bgcolor: 'primary.main',
              color: '#1A1A1A',
              fontWeight: 600,
              textTransform: 'none',
              '&:hover': { bgcolor: 'primary.hover' },
            }}
          >
            保存配置
          </Button>
        )}
      </DialogActions>
    </Dialog>
  )
}
