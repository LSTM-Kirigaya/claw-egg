import { useState } from 'react'
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
  LinearProgress
} from '@mui/material'
import { Download, CheckCircle, Settings, Rocket } from 'lucide-react'

interface InstallWizardProps {
  open: boolean
  onClose: () => void
  themeMode: 'light' | 'dark'
}

const steps = ['检查环境', '安装依赖', '配置 OpenClaw', '完成']

export function InstallWizard({ open, onClose, themeMode }: InstallWizardProps) {
  const [activeStep, setActiveStep] = useState(0)
  const [installing, setInstalling] = useState(false)
  const [progress, setProgress] = useState(0)

  const handleNext = () => {
    if (activeStep === steps.length - 1) {
      onClose()
      return
    }
    setActiveStep((prev) => prev + 1)
  }

  const handleBack = () => {
    setActiveStep((prev) => prev - 1)
  }

  const startInstall = () => {
    setInstalling(true)
    // Simulate installation progress
    let currentProgress = 0
    const interval = setInterval(() => {
      currentProgress += 5
      setProgress(currentProgress)
      if (currentProgress >= 100) {
        clearInterval(interval)
        setInstalling(false)
        handleNext()
      }
    }, 200)
  }

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <Download className="w-16 h-16 mx-auto mb-4 text-primary" />
            <Typography variant="h6" gutterBottom>
              准备安装
            </Typography>
            <Typography variant="body2" color="text.secondary">
              我们将检查您的系统环境并安装必要的依赖
            </Typography>
          </Box>
        )
      case 1:
        return (
          <Box sx={{ py: 4 }}>
            {installing ? (
              <>
                <Typography variant="body1" gutterBottom>
                  正在安装依赖...
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={progress} 
                  sx={{ mt: 2, bgcolor: themeMode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}
                />
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  {progress}%
                </Typography>
              </>
            ) : (
              <Box sx={{ textAlign: 'center' }}>
                <Settings className="w-16 h-16 mx-auto mb-4 text-primary" />
                <Typography variant="h6" gutterBottom>
                  安装依赖
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  需要安装 Node.js 22+ 和 CMake
                </Typography>
                <Button
                  variant="contained"
                  onClick={startInstall}
                  sx={{
                    bgcolor: 'primary.main',
                    color: '#1A1A1A',
                    fontWeight: 600,
                    textTransform: 'none',
                    '&:hover': { bgcolor: 'primary.hover' },
                  }}
                >
                  开始安装
                </Button>
              </Box>
            )}
          </Box>
        )
      case 2:
        return (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <Settings className="w-16 h-16 mx-auto mb-4 text-primary" />
            <Typography variant="h6" gutterBottom>
              配置 OpenClaw
            </Typography>
            <Typography variant="body2" color="text.secondary">
              请前往飞书开放平台创建机器人并获取 App ID 和 App Secret
            </Typography>
          </Box>
        )
      case 3:
        return (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
            <Typography variant="h6" gutterBottom>
              安装完成！
            </Typography>
            <Typography variant="body2" color="text.secondary">
              OpenClaw 已成功安装并配置
            </Typography>
          </Box>
        )
      default:
        return null
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
          borderRadius: 3,
          bgcolor: themeMode === 'dark' ? '#1F2937' : '#FFFFFF',
        }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Rocket className="w-6 h-6 text-primary" />
          <Typography variant="h6">安装向导</Typography>
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
          onClick={handleBack}
          disabled={activeStep === 0 || installing}
          sx={{ textTransform: 'none', color: 'text.secondary' }}
        >
          上一步
        </Button>
        <Button
          variant="contained"
          onClick={handleNext}
          disabled={installing || (activeStep === 1 && progress < 100)}
          sx={{
            bgcolor: 'primary.main',
            color: '#1A1A1A',
            fontWeight: 600,
            textTransform: 'none',
            '&:hover': { bgcolor: 'primary.hover' },
            '&:disabled': {
              bgcolor: themeMode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
              color: themeMode === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)',
            },
          }}
        >
          {activeStep === steps.length - 1 ? '完成' : '下一步'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
