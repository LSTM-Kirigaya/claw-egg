import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Divider
} from '@mui/material'
import { Settings, Monitor, Sun, Moon } from 'lucide-react'

interface SettingsDialogProps {
  open: boolean
  onClose: () => void
  themePreference: 'light' | 'dark' | 'system'
  onThemeChange: (theme: 'light' | 'dark' | 'system') => void
}

export function SettingsDialog({ open, onClose, themePreference, onThemeChange }: SettingsDialogProps) {
  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
        }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Settings className="w-6 h-6 text-primary" />
          <Typography variant="h6">设置</Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2, mt: 1 }}>
          外观
        </Typography>
        
        <FormControl fullWidth size="small">
          <InputLabel id="theme-label">主题</InputLabel>
          <Select
            labelId="theme-label"
            value={themePreference}
            label="主题"
            onChange={(e) => onThemeChange(e.target.value as 'light' | 'dark' | 'system')}
            sx={{
              borderRadius: 2,
            }}
          >
            <MenuItem value="system">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Monitor className="w-4 h-4" />
                跟随系统
              </Box>
            </MenuItem>
            <MenuItem value="light">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Sun className="w-4 h-4" />
                浅色
              </Box>
            </MenuItem>
            <MenuItem value="dark">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Moon className="w-4 h-4" />
                深色
              </Box>
            </MenuItem>
          </Select>
        </FormControl>

        <Divider sx={{ my: 3 }} />

        <Typography variant="caption" color="text.secondary" display="block">
          ClawEgg v0.1.0
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block">
          OpenClaw 一键安装器
        </Typography>
      </DialogContent>
      
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button
          variant="contained"
          onClick={onClose}
          sx={{
            bgcolor: 'primary.main',
            color: '#1A1A1A',
            fontWeight: 600,
            textTransform: 'none',
            '&:hover': { bgcolor: 'primary.hover' },
          }}
        >
          确定
        </Button>
      </DialogActions>
    </Dialog>
  )
}
