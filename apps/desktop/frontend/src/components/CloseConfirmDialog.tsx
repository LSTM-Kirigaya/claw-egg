import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  FormControlLabel,
  Checkbox
} from '@mui/material'
import { X, Minimize2 } from 'lucide-react'

interface CloseConfirmDialogProps {
  open: boolean
  onClose: () => void
  onMinimizeToTray: () => void
  onQuitApp: () => void
  themeMode: 'light' | 'dark'
}

export function CloseConfirmDialog({
  open,
  onClose,
  onMinimizeToTray,
  onQuitApp,
  themeMode
}: CloseConfirmDialogProps) {
  const [dontAskAgain, setDontAskAgain] = useState(false)

  // Load saved preference when dialog opens
  useEffect(() => {
    if (open) {
      const saved = localStorage.getItem('close-action-preference')
      if (saved) {
        // If user has a saved preference, execute it directly without showing dialog
        if (saved === 'minimize') {
          onMinimizeToTray()
        } else if (saved === 'quit') {
          onQuitApp()
        }
      }
    }
  }, [open, onMinimizeToTray, onQuitApp])

  const handleMinimize = () => {
    if (dontAskAgain) {
      localStorage.setItem('close-action-preference', 'minimize')
    }
    onMinimizeToTray()
  }

  const handleQuit = () => {
    if (dontAskAgain) {
      localStorage.setItem('close-action-preference', 'quit')
    }
    onQuitApp()
  }

  // Check if we have a saved preference
  const hasSavedPreference = () => {
    return !!localStorage.getItem('close-action-preference')
  }

  // If there's a saved preference, don't render the dialog
  if (hasSavedPreference()) {
    return null
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          bgcolor: themeMode === 'dark' ? '#252525' : '#FFFFFF',
        }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Typography variant="h6" fontSize="1rem">
          关闭应用
        </Typography>
      </DialogTitle>

      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          您希望如何关闭应用？
        </Typography>

        <Box sx={{ display: 'flex', gap: 1.5, mb: 2 }}>
          <Button
            variant="outlined"
            fullWidth
            onClick={handleMinimize}
            startIcon={<Minimize2 className="w-4 h-4" />}
            sx={{
              py: 1.5,
              textTransform: 'none',
              borderColor: themeMode === 'dark' ? '#404040' : '#E0E0E0',
              color: 'text.primary',
              '&:hover': {
                borderColor: 'primary.main',
                bgcolor: 'rgba(255, 59, 48, 0.05)',
              },
            }}
          >
            <Box sx={{ textAlign: 'left' }}>
              <Typography variant="body2" fontWeight={500}>
                最小化到托盘
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                应用在后台继续运行
              </Typography>
            </Box>
          </Button>

          <Button
            variant="outlined"
            fullWidth
            onClick={handleQuit}
            startIcon={<X className="w-4 h-4" />}
            sx={{
              py: 1.5,
              textTransform: 'none',
              borderColor: themeMode === 'dark' ? '#404040' : '#E0E0E0',
              color: 'text.primary',
              '&:hover': {
                borderColor: 'error.main',
                bgcolor: 'rgba(211, 47, 47, 0.05)',
              },
            }}
          >
            <Box sx={{ textAlign: 'left' }}>
              <Typography variant="body2" fontWeight={500}>
                退出程序
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                完全关闭应用
              </Typography>
            </Box>
          </Button>
        </Box>

        <FormControlLabel
          control={
            <Checkbox
              checked={dontAskAgain}
              onChange={(e) => setDontAskAgain(e.target.checked)}
              size="small"
            />
          }
          label={
            <Typography variant="body2" color="text.secondary">
              记住我的选择，下次不再询问
            </Typography>
          }
        />
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          onClick={onClose}
          variant="outlined"
          size="small"
          sx={{ textTransform: 'none' }}
        >
          取消
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// Helper function to clear saved preference (can be called from settings)
export function clearClosePreference(): void {
  localStorage.removeItem('close-action-preference')
}

// Helper function to get current preference
export function getClosePreference(): 'minimize' | 'quit' | null {
  const saved = localStorage.getItem('close-action-preference')
  if (saved === 'minimize' || saved === 'quit') {
    return saved
  }
  return null
}
