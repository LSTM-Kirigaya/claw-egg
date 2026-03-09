import { useState, useEffect } from 'react'
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
  Divider,
  Switch,
  FormControlLabel,
  Alert,
  Snackbar
} from '@mui/material'
import { Settings, Monitor, Sun, Moon, RotateCcw, Minimize2, Bell, Globe, X } from 'lucide-react'
import { ThemePreference, AppSettings } from '../types'
import { loadSettings, saveSettings, resetSettings, updateNotificationSettings } from '../utils/settings'
import { clearClosePreference, getClosePreference } from './CloseConfirmDialog'

interface SettingsDialogProps {
  open: boolean
  onClose: () => void
  themePreference: ThemePreference
  onThemeChange: (theme: ThemePreference) => void
}

export function SettingsDialog({ open, onClose, themePreference, onThemeChange }: SettingsDialogProps) {
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [showSaveSuccess, setShowSaveSuccess] = useState(false)
  const [activeTab, setActiveTab] = useState<'appearance' | 'notifications' | 'network' | 'general'>('appearance')
  const [closePreference, setClosePreference] = useState<string | null>(null)

  // 加载配置
  useEffect(() => {
    if (open) {
      loadSettingsFromStorage()
      setClosePreference(getClosePreference())
    }
  }, [open])

  const loadSettingsFromStorage = async () => {
    setIsLoading(true)
    try {
      const loaded = await loadSettings()
      setSettings(loaded)
    } catch (error) {
      console.error('Failed to load settings:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // 处理主题变更
  const handleThemeChange = async (theme: ThemePreference) => {
    onThemeChange(theme)
    if (settings) {
      const updated = { ...settings, theme }
      setSettings(updated)
      await saveSettings(updated)
    }
  }

  // 处理通知设置变更
  const handleNotificationChange = async (key: keyof NonNullable<typeof settings>['notifications'], value: boolean) => {
    if (!settings) return
    
    const updatedNotifications = { ...settings.notifications, [key]: value }
    const updated = { ...settings, notifications: updatedNotifications }
    
    setSettings(updated)
    await updateNotificationSettings({ [key]: value })
    setShowSaveSuccess(true)
  }

  // 处理托盘设置变更
  const handleTrayChange = async (key: keyof NonNullable<typeof settings>['tray'], value: boolean) => {
    if (!settings) return
    
    const updatedTray = { ...settings.tray, [key]: value }
    const updated = { ...settings, tray: updatedTray }
    
    setSettings(updated)
    await saveSettings(updated)
    setShowSaveSuccess(true)
  }

  // 重置配置
  const handleReset = async () => {
    try {
      // 调用 resetSettings 重置为默认配置并保存
      await resetSettings()
      // 重新加载已保存的默认配置
      const defaults = await loadSettings()
      setSettings(defaults)
      // 同步主题到父组件
      onThemeChange(defaults.theme)
      setShowResetConfirm(false)
      setShowSaveSuccess(true)
    } catch (error) {
      console.error('Failed to reset settings:', error)
    }
  }

  const renderAppearanceTab = () => (
    <Box>
      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
        主题
      </Typography>
      
      <FormControl fullWidth size="small">
        <InputLabel id="theme-label">主题模式</InputLabel>
        <Select
          labelId="theme-label"
          value={themePreference}
          label="主题模式"
          onChange={(e) => handleThemeChange(e.target.value as ThemePreference)}
          disabled={!settings}
          sx={{ borderRadius: 2 }}
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

      <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
        选择「跟随系统」将自动根据系统设置切换主题
      </Typography>

      <Divider sx={{ my: 3 }} />

      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
        语言
      </Typography>

      <FormControl fullWidth size="small">
        <InputLabel id="language-label">界面语言</InputLabel>
        <Select
          labelId="language-label"
          value={settings?.language || 'zh-CN'}
          label="界面语言"
          disabled
          sx={{ borderRadius: 2 }}
        >
          <MenuItem value="zh-CN">简体中文</MenuItem>
          <MenuItem value="en-US">English</MenuItem>
        </Select>
      </FormControl>

      <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
        更多语言支持即将推出
      </Typography>
    </Box>
  )

  const renderNotificationsTab = () => (
    <Box>
      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
        通知偏好
      </Typography>

      <FormControlLabel
        control={
          <Switch
            checked={settings?.notifications.enabled ?? true}
            onChange={(e) => handleNotificationChange('enabled', e.target.checked)}
          />
        }
        label="启用通知"
      />

      <FormControlLabel
        control={
          <Switch
            checked={settings?.notifications.sound ?? true}
            onChange={(e) => handleNotificationChange('sound', e.target.checked)}
            disabled={!settings?.notifications.enabled}
          />
        }
        label="通知音效"
      />

      <FormControlLabel
        control={
          <Switch
            checked={settings?.notifications.installationComplete ?? true}
            onChange={(e) => handleNotificationChange('installationComplete', e.target.checked)}
            disabled={!settings?.notifications.enabled}
          />
        }
        label="安装完成通知"
      />

      <FormControlLabel
        control={
          <Switch
            checked={settings?.notifications.updateAvailable ?? true}
            onChange={(e) => handleNotificationChange('updateAvailable', e.target.checked)}
            disabled={!settings?.notifications.enabled}
          />
        }
        label="更新可用通知"
      />
    </Box>
  )

  const renderNetworkTab = () => (
    <Box>
      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
        网络设置
      </Typography>

      <FormControlLabel
        control={
          <Switch
            checked={settings?.network.useChinaMirror ?? false}
            onChange={async (e) => {
              if (settings) {
                const updated = {
                  ...settings,
                  network: { ...settings.network, useChinaMirror: e.target.checked }
                }
                setSettings(updated)
                await saveSettings(updated)
                setShowSaveSuccess(true)
              }
            }}
          />
        }
        label="使用国内镜像"
      />

      <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
        在中国大陆地区使用时建议开启，可加速下载
      </Typography>
    </Box>
  )

  const renderGeneralTab = () => (
    <Box>
      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
        托盘设置
      </Typography>

      <FormControlLabel
        control={
          <Switch
            checked={settings?.tray.showTrayIcon ?? true}
            onChange={(e) => handleTrayChange('showTrayIcon', e.target.checked)}
          />
        }
        label="显示托盘图标"
      />

      <FormControlLabel
        control={
          <Switch
            checked={settings?.tray.minimizeToTrayOnClose ?? true}
            onChange={(e) => handleTrayChange('minimizeToTrayOnClose', e.target.checked)}
          />
        }
        label="关闭时最小化到托盘"
      />

      <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5, ml: 4 }}>
        关闭窗口时应用将隐藏在系统托盘中继续运行
      </Typography>

      {closePreference && (
        <Box sx={{ mt: 2, ml: 4 }}>
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
            当前设置：{closePreference === 'minimize' ? '最小化到托盘' : '退出程序'}（已记住）
          </Typography>
          <Button
            size="small"
            variant="outlined"
            startIcon={<X className="w-3 h-3" />}
            onClick={() => {
              clearClosePreference()
              setClosePreference(null)
              setShowSaveSuccess(true)
            }}
            sx={{ textTransform: 'none', fontSize: 11 }}
          >
            重置关闭操作选择
          </Button>
        </Box>
      )}

      <FormControlLabel
        control={
          <Switch
            checked={settings?.tray.startMinimized ?? false}
            onChange={(e) => handleTrayChange('startMinimized', e.target.checked)}
          />
        }
        label="启动时最小化"
      />

      <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5, ml: 4 }}>
        应用启动时自动最小化到托盘
      </Typography>
    </Box>
  )

  return (
    <>
      <Dialog 
        open={open} 
        onClose={onClose}
        maxWidth="sm"
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
          {isLoading ? (
            <Box sx={{ py: 4, textAlign: 'center' }}>
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
            </Box>
          ) : (
            <>
              {/* Tab 切换 */}
              <Box sx={{ display: 'flex', gap: 1, mb: 3, borderBottom: 1, borderColor: 'divider', flexWrap: 'wrap' }}>
                <Button
                  onClick={() => setActiveTab('appearance')}
                  variant={activeTab === 'appearance' ? 'contained' : 'text'}
                  size="small"
                  startIcon={<Monitor className="w-4 h-4" />}
                  sx={{
                    bgcolor: activeTab === 'appearance' ? 'primary.main' : 'transparent',
                    color: activeTab === 'appearance' ? '#FFFFFF' : 'text.primary',
                    textTransform: 'none',
                  }}
                >
                  外观
                </Button>
                <Button
                  onClick={() => setActiveTab('general')}
                  variant={activeTab === 'general' ? 'contained' : 'text'}
                  size="small"
                  startIcon={<Minimize2 className="w-4 h-4" />}
                  sx={{
                    bgcolor: activeTab === 'general' ? 'primary.main' : 'transparent',
                    color: activeTab === 'general' ? '#FFFFFF' : 'text.primary',
                    textTransform: 'none',
                  }}
                >
                  常规
                </Button>
                <Button
                  onClick={() => setActiveTab('notifications')}
                  variant={activeTab === 'notifications' ? 'contained' : 'text'}
                  size="small"
                  startIcon={<Bell className="w-4 h-4" />}
                  sx={{
                    bgcolor: activeTab === 'notifications' ? 'primary.main' : 'transparent',
                    color: activeTab === 'notifications' ? '#FFFFFF' : 'text.primary',
                    textTransform: 'none',
                  }}
                >
                  通知
                </Button>
                <Button
                  onClick={() => setActiveTab('network')}
                  variant={activeTab === 'network' ? 'contained' : 'text'}
                  size="small"
                  startIcon={<Globe className="w-4 h-4" />}
                  sx={{
                    bgcolor: activeTab === 'network' ? 'primary.main' : 'transparent',
                    color: activeTab === 'network' ? '#FFFFFF' : 'text.primary',
                    textTransform: 'none',
                  }}
                >
                  网络
                </Button>
              </Box>

              {/* Tab 内容 */}
              {activeTab === 'appearance' && renderAppearanceTab()}
              {activeTab === 'general' && renderGeneralTab()}
              {activeTab === 'notifications' && renderNotificationsTab()}
              {activeTab === 'network' && renderNetworkTab()}

              <Divider sx={{ my: 3 }} />

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block">
                    龙虾孵化器 v0.1.0
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block">
                    OpenClaw 一键安装器
                  </Typography>
                </Box>

                <Button
                  size="small"
                  startIcon={<RotateCcw className="w-4 h-4" />}
                  onClick={() => setShowResetConfirm(true)}
                  color="error"
                  variant="outlined"
                >
                  重置配置
                </Button>
              </Box>
            </>
          )}
        </DialogContent>
        
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            variant="contained"
            onClick={onClose}
            sx={{
              bgcolor: 'primary.main',
              color: '#FFFFFF',
              fontWeight: 600,
              textTransform: 'none',
              '&:hover': { bgcolor: 'primary.hover' },
            }}
          >
            确定
          </Button>
        </DialogActions>
      </Dialog>

      {/* 重置确认对话框 */}
      <Dialog open={showResetConfirm} onClose={() => setShowResetConfirm(false)} maxWidth="xs">
        <DialogTitle>确认重置</DialogTitle>
        <DialogContent>
          <Typography>确定要重置所有设置为默认值吗？此操作不可撤销。</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowResetConfirm(false)}>取消</Button>
          <Button onClick={handleReset} color="error" variant="contained">
            重置
          </Button>
        </DialogActions>
      </Dialog>

      {/* 保存成功提示 */}
      <Snackbar
        open={showSaveSuccess}
        autoHideDuration={2000}
        onClose={() => setShowSaveSuccess(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" sx={{ width: '100%' }}>
          设置已保存
        </Alert>
      </Snackbar>
    </>
  )
}
