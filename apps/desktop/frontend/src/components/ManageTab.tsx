import { useState, useEffect, useCallback } from 'react'
import { invoke } from '@tauri-apps/api/core'
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  Alert,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Switch,
  Divider,
  Paper,
  Tooltip,
  FormControlLabel
} from '@mui/material'
import {
  Settings,
  Save,
  RefreshCw,
  Code,
  Puzzle,
  Database,
  ExternalLink,
  Pencil,
  Trash2,
  Brain
} from 'lucide-react'
import { OpenClawConfig, PluginConfig, PlatformType, PLATFORM_OPTIONS, LlmProvider, LLM_PROVIDERS } from '../types'

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index }: TabPanelProps) {
  return (
    <div hidden={value !== index} className="w-full">
      {value === index && <Box className="pt-3">{children}</Box>}
    </div>
  )
}

interface ManageTabProps {
  themeMode: 'light' | 'dark';
}

const DEFAULT_CONFIG: OpenClawConfig = {
  platform: 'feishu',
  env: {},
  agents: {
    defaults: {
      model: {
        primary: 'openai/gpt-5.4'
      }
    }
  }
}

export function ManageTab({ themeMode }: ManageTabProps) {
  const [activeTab, setActiveTab] = useState(0)
  const [config, setConfig] = useState<OpenClawConfig>(DEFAULT_CONFIG)
  const [originalConfig, setOriginalConfig] = useState<OpenClawConfig | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [plugins, setPlugins] = useState<PluginConfig[]>([])

  // Load config on mount
  useEffect(() => {
    loadConfig()
    loadPlugins()
  }, [])

  const loadConfig = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const loadedConfig = await invoke<OpenClawConfig>('load_openclaw_config')
      // Merge with defaults to ensure all fields have values
      const mergedConfig = { ...DEFAULT_CONFIG, ...loadedConfig }
      setConfig(mergedConfig)
      setOriginalConfig(mergedConfig)
    } catch (err) {
      console.error('Failed to load config:', err)
      setError('加载配置失败: ' + String(err))
      // Use default config on error
      setConfig(DEFAULT_CONFIG)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const loadPlugins = useCallback(async () => {
    try {
      const loadedPlugins = await invoke<PluginConfig[]>('get_plugin_configs')
      setPlugins(loadedPlugins)
    } catch (err) {
      console.error('Failed to load plugins:', err)
    }
  }, [])

  const saveConfig = useCallback(async () => {
    setIsSaving(true)
    setSaveSuccess(false)
    setError(null)
    try {
      await invoke('save_openclaw_config', { config })
      setOriginalConfig(config)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (err) {
      console.error('Failed to save config:', err)
      setError('保存配置失败: ' + String(err))
    } finally {
      setIsSaving(false)
    }
  }, [config])

  const hasChanges = JSON.stringify(config) !== JSON.stringify(originalConfig)

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue)
  }

  // ========== LLM 配置相关函数 ==========
  
  // 获取当前选择的大模型 (格式: provider/model)
  const getCurrentModel = (): string => {
    return config.agents?.defaults?.model?.primary || 'openai/gpt-5.4'
  }

  // 从 model ref 解析 provider
  const getProviderFromModel = (modelRef: string): LlmProvider => {
    const providerId = modelRef.split('/')[0] as LlmProvider
    return LLM_PROVIDERS.find(p => p.id === providerId)?.id || 'openai'
  }

  // 获取当前 provider
  const getCurrentProvider = (): LlmProvider => {
    return getProviderFromModel(getCurrentModel())
  }

  // 获取当前 model name (不含 provider 前缀)
  const getCurrentModelName = (): string => {
    const modelRef = getCurrentModel()
    const parts = modelRef.split('/')
    return parts.slice(1).join('/') || ''
  }

  // 获取指定 provider 的 API Key
  const getApiKey = (provider: LlmProvider): string => {
    const providerInfo = LLM_PROVIDERS.find(p => p.id === provider)
    if (!providerInfo || !providerInfo.envKey) return ''
    return config.env?.[providerInfo.envKey] || ''
  }

  // 获取指定 provider 的 Base URL
  const getBaseUrl = (provider: LlmProvider): string => {
    return config.models?.providers?.[provider]?.baseUrl || ''
  }

  // 更新大模型选择 (provider + model)
  const updateModelSelection = (modelRef: string) => {
    const provider = getProviderFromModel(modelRef)
    const providerInfo = LLM_PROVIDERS.find(p => p.id === provider)
    
    setConfig(prev => {
      const newConfig = {
        ...prev,
        agents: {
          ...prev.agents,
          defaults: {
            ...prev.agents?.defaults,
            model: {
              ...prev.agents?.defaults?.model,
              primary: modelRef
            }
          }
        }
      }

      // 如果选择了需要 baseUrl 的 provider 且当前没有配置，设置默认值
      if (providerInfo?.requiresBaseUrl && !getBaseUrl(provider)) {
        const defaultBaseUrl = provider === 'moonshot' 
          ? 'https://api.moonshot.ai/v1'
          : provider === 'ollama'
          ? 'http://127.0.0.1:11434/v1'
          : ''
        
        if (defaultBaseUrl) {
          newConfig.models = {
            ...prev.models,
            providers: {
              ...prev.models?.providers,
              [provider]: {
                ...prev.models?.providers?.[provider],
                baseUrl: defaultBaseUrl,
                api: 'openai-completions'
              }
            }
          }
        }
      }

      return newConfig
    })
  }

  // 更新 API Key
  const updateApiKey = (apiKey: string) => {
    const provider = getCurrentProvider()
    const providerInfo = LLM_PROVIDERS.find(p => p.id === provider)
    if (!providerInfo || !providerInfo.envKey) return

    setConfig(prev => ({
      ...prev,
      env: {
        ...prev.env,
        [providerInfo.envKey]: apiKey
      }
    }))
  }

  // 更新 Base URL
  const updateBaseUrl = (baseUrl: string) => {
    const provider = getCurrentProvider()
    
    setConfig(prev => ({
      ...prev,
      models: {
        ...prev.models,
        providers: {
          ...prev.models?.providers,
          [provider]: {
            ...prev.models?.providers?.[provider],
            baseUrl: baseUrl || undefined,
            api: 'openai-completions'
          }
        }
      }
    }))
  }

  // 获取当前 provider 信息
  const getCurrentProviderInfo = () => {
    return LLM_PROVIDERS.find(p => p.id === getCurrentProvider())
  }

  // 紧凑的输入框样式
  const compactTextFieldProps = {
    size: 'small' as const,
    InputProps: { sx: { fontSize: 13 } },
    InputLabelProps: { sx: { fontSize: 13 } },
    sx: { '& .MuiInputBase-input': { py: 1 } }
  }

  const compactSelectProps = {
    size: 'small' as const,
    sx: { fontSize: 13 }
  }

  // Platform-specific config helpers
  const updatePlatform = (platform: PlatformType) => {
    setConfig(prev => ({ ...prev, platform }))
  }

  const updateFeishuConfig = (key: keyof NonNullable<OpenClawConfig['feishu']>, value: string) => {
    setConfig(prev => ({
      ...prev,
      feishu: { ...prev.feishu, [key]: value } as OpenClawConfig['feishu']
    }))
  }

  const updateDiscordConfig = (key: keyof NonNullable<OpenClawConfig['discord']>, value: string) => {
    setConfig(prev => ({
      ...prev,
      discord: { ...prev.discord, [key]: value } as OpenClawConfig['discord']
    }))
  }

  const updateTelegramConfig = (key: keyof NonNullable<OpenClawConfig['telegram']>, value: string) => {
    setConfig(prev => ({
      ...prev,
      telegram: { ...prev.telegram, [key]: value } as OpenClawConfig['telegram']
    }))
  }

  const updateQqOfficialConfig = (key: keyof NonNullable<OpenClawConfig['qq_official']>, value: string | boolean) => {
    setConfig(prev => ({
      ...prev,
      qq_official: { ...prev.qq_official, [key]: value } as OpenClawConfig['qq_official']
    }))
  }

  const updateQqOnebotConfig = (key: keyof NonNullable<OpenClawConfig['qq_onebot']>, value: string) => {
    setConfig(prev => ({
      ...prev,
      qq_onebot: { ...prev.qq_onebot, [key]: value } as OpenClawConfig['qq_onebot']
    }))
  }

  // Legacy config support
  const isLegacyConfig = config.platform === undefined && config.app_id !== undefined

  // Render platform-specific configuration form
  const renderPlatformConfig = () => {
    const platform = config.platform || 'feishu'

    switch (platform) {
      case 'feishu':
        return (
          <>
            <TextField
              label="App ID"
              value={config.feishu?.app_id || config.app_id || ''}
              onChange={(e) => updateFeishuConfig('app_id', e.target.value)}
              fullWidth
              placeholder="cli_xxxxxxxxxx"
              helperText="在飞书开放平台创建应用后获取"
              FormHelperTextProps={{ sx: { fontSize: 11, mt: 0.5 } }}
              {...compactTextFieldProps}
            />
            <TextField
              label="App Secret"
              value={config.feishu?.app_secret || config.app_secret || ''}
              onChange={(e) => updateFeishuConfig('app_secret', e.target.value)}
              fullWidth
              type="password"
              placeholder="输入 App Secret"
              {...compactTextFieldProps}
            />
            <FormControl fullWidth {...compactSelectProps}>
              <InputLabel sx={{ fontSize: 13 }}>平台域名</InputLabel>
              <Select
                value={config.feishu?.domain || config.domain || 'feishu.cn'}
                label="平台域名"
                onChange={(e) => updateFeishuConfig('domain', e.target.value)}
              >
                <MenuItem value="feishu.cn" sx={{ fontSize: 13 }}>飞书 (feishu.cn)</MenuItem>
                <MenuItem value="larksuite.com" sx={{ fontSize: 13 }}>Lark (larksuite.com)</MenuItem>
              </Select>
            </FormControl>
            <Box className="flex gap-2 mt-2">
              <Button
                variant="outlined"
                size="small"
                startIcon={<ExternalLink className="w-3.5 h-3.5" />}
                onClick={() => window.open('https://open.feishu.cn/app', '_blank')}
                sx={{ textTransform: 'none', fontSize: 12, py: 0.5 }}
              >
                打开飞书开放平台
              </Button>
            </Box>
          </>
        )

      case 'discord':
        return (
          <>
            <TextField
              label="Bot Token"
              value={config.discord?.bot_token || ''}
              onChange={(e) => updateDiscordConfig('bot_token', e.target.value)}
              fullWidth
              type="password"
              placeholder="输入 Discord Bot Token"
              helperText="在 Discord Developer Portal 创建 Bot 后获取"
              FormHelperTextProps={{ sx: { fontSize: 11, mt: 0.5 } }}
              {...compactTextFieldProps}
            />
            <TextField
              label="Client ID"
              value={config.discord?.client_id || ''}
              onChange={(e) => updateDiscordConfig('client_id', e.target.value)}
              fullWidth
              placeholder="输入 Application ID"
              {...compactTextFieldProps}
            />
            <TextField
              label="Client Secret"
              value={config.discord?.client_secret || ''}
              onChange={(e) => updateDiscordConfig('client_secret', e.target.value)}
              fullWidth
              type="password"
              placeholder="输入 Client Secret"
              {...compactTextFieldProps}
            />
            <TextField
              label="Guild ID (可选)"
              value={config.discord?.guild_id || ''}
              onChange={(e) => updateDiscordConfig('guild_id', e.target.value)}
              fullWidth
              placeholder="仅限特定服务器使用"
              helperText="留空则支持所有服务器"
              FormHelperTextProps={{ sx: { fontSize: 11, mt: 0.5 } }}
              {...compactTextFieldProps}
            />
            <Box className="flex gap-2 mt-2">
              <Button
                variant="outlined"
                size="small"
                startIcon={<ExternalLink className="w-3.5 h-3.5" />}
                onClick={() => window.open('https://discord.com/developers/applications', '_blank')}
                sx={{ textTransform: 'none', fontSize: 12, py: 0.5 }}
              >
                打开 Discord Developer Portal
              </Button>
            </Box>
          </>
        )

      case 'telegram':
        return (
          <>
            <TextField
              label="Bot Token"
              value={config.telegram?.bot_token || ''}
              onChange={(e) => updateTelegramConfig('bot_token', e.target.value)}
              fullWidth
              type="password"
              placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
              helperText="通过 @BotFather 创建 Bot 后获取"
              FormHelperTextProps={{ sx: { fontSize: 11, mt: 0.5 } }}
              {...compactTextFieldProps}
            />
            <TextField
              label="API URL (可选)"
              value={config.telegram?.api_url || ''}
              onChange={(e) => updateTelegramConfig('api_url', e.target.value)}
              fullWidth
              placeholder="https://api.telegram.org"
              helperText="自定义 Bot API 服务器地址，留空使用默认"
              FormHelperTextProps={{ sx: { fontSize: 11, mt: 0.5 } }}
              {...compactTextFieldProps}
            />
            <TextField
              label="允许的用户 ID (可选)"
              value={config.telegram?.allowed_users?.join(', ') || ''}
              onChange={(e) => updateTelegramConfig('allowed_users', e.target.value)}
              fullWidth
              placeholder="123456789, 987654321"
              helperText="只允许指定用户使用 Bot，逗号分隔，留空则允许所有用户"
              FormHelperTextProps={{ sx: { fontSize: 11, mt: 0.5 } }}
              {...compactTextFieldProps}
            />
            <Box className="flex gap-2 mt-2">
              <Button
                variant="outlined"
                size="small"
                startIcon={<ExternalLink className="w-3.5 h-3.5" />}
                onClick={() => window.open('https://t.me/BotFather', '_blank')}
                sx={{ textTransform: 'none', fontSize: 12, py: 0.5 }}
              >
                打开 @BotFather
              </Button>
            </Box>
          </>
        )

      case 'qq_official':
        return (
          <>
            <TextField
              label="App ID"
              value={config.qq_official?.app_id || ''}
              onChange={(e) => updateQqOfficialConfig('app_id', e.target.value)}
              fullWidth
              placeholder="输入 QQ Bot App ID"
              helperText="在 QQ 开放平台创建 Bot 后获取"
              FormHelperTextProps={{ sx: { fontSize: 11, mt: 0.5 } }}
              {...compactTextFieldProps}
            />
            <TextField
              label="App Secret"
              value={config.qq_official?.app_secret || ''}
              onChange={(e) => updateQqOfficialConfig('app_secret', e.target.value)}
              fullWidth
              type="password"
              placeholder="输入 App Secret"
              {...compactTextFieldProps}
            />
            <TextField
              label="Token"
              value={config.qq_official?.token || ''}
              onChange={(e) => updateQqOfficialConfig('token', e.target.value)}
              fullWidth
              placeholder="输入 Bot Token"
              {...compactTextFieldProps}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={config.qq_official?.sandbox_mode || false}
                  onChange={(e) => updateQqOfficialConfig('sandbox_mode', e.target.checked)}
                  size="small"
                />
              }
              label="沙箱模式"
            />
            <Box className="flex gap-2 mt-2">
              <Button
                variant="outlined"
                size="small"
                startIcon={<ExternalLink className="w-3.5 h-3.5" />}
                onClick={() => window.open('https://q.qq.com/#/developer/home', '_blank')}
                sx={{ textTransform: 'none', fontSize: 12, py: 0.5 }}
              >
                打开 QQ 开放平台
              </Button>
            </Box>
          </>
        )

      case 'qq_onebot':
        return (
          <>
            <TextField
              label="OneBot HTTP 地址"
              value={config.qq_onebot?.http_url || ''}
              onChange={(e) => updateQqOnebotConfig('http_url', e.target.value)}
              fullWidth
              placeholder="http://localhost:3000"
              helperText="OneBot 实现（如 go-cqhttp、Lagrange）的 HTTP 接口地址"
              FormHelperTextProps={{ sx: { fontSize: 11, mt: 0.5 } }}
              {...compactTextFieldProps}
            />
            <TextField
              label="Access Token (可选)"
              value={config.qq_onebot?.access_token || ''}
              onChange={(e) => updateQqOnebotConfig('access_token', e.target.value)}
              fullWidth
              type="password"
              placeholder="用于验证 OneBot 连接"
              {...compactTextFieldProps}
            />
            <Box className="flex gap-2 mt-2">
              <Button
                variant="outlined"
                size="small"
                startIcon={<ExternalLink className="w-3.5 h-3.5" />}
                onClick={() => window.open('https://github.com/botuniverse/onebot-11', '_blank')}
                sx={{ textTransform: 'none', fontSize: 12, py: 0.5 }}
              >
                OneBot 11 文档
              </Button>
              <Button
                variant="outlined"
                size="small"
                startIcon={<ExternalLink className="w-3.5 h-3.5" />}
                onClick={() => window.open('https://docs.go-cqhttp.org/', '_blank')}
                sx={{ textTransform: 'none', fontSize: 12, py: 0.5 }}
              >
                go-cqhttp 文档
              </Button>
            </Box>
          </>
        )

      default:
        return null
    }
  }

  return (
    <Box className="h-full flex flex-col p-3">
      {/* Header */}
      <Box className="flex items-center justify-between mb-3">
        <Typography variant="subtitle1" className="font-semibold flex items-center gap-1.5 text-sm">
          <Settings className="w-4 h-4 text-primary" />
          OpenClaw 管理
        </Typography>
        <Box className="flex gap-1.5">
          <Button
            variant="outlined"
            size="small"
            startIcon={<RefreshCw className="w-3.5 h-3.5" />}
            onClick={loadConfig}
            disabled={isLoading}
            sx={{ textTransform: 'none', fontSize: 12, py: 0.5, minHeight: 28 }}
          >
            刷新
          </Button>
          <Button
            variant="contained"
            size="small"
            startIcon={<Save className="w-3.5 h-3.5" />}
            onClick={saveConfig}
            disabled={!hasChanges || isSaving}
            sx={{
              textTransform: 'none',
              fontSize: 12,
              py: 0.5,
              minHeight: 28,
              bgcolor: 'primary.main',
              color: '#FFFFFF',
              '&:hover': { bgcolor: 'primary.dark' },
            }}
          >
            {isSaving ? '保存中...' : '保存配置'}
          </Button>
        </Box>
      </Box>

      {/* Legacy warning */}
      {isLegacyConfig && (
        <Alert severity="warning" className="mb-3" sx={{ py: 0.5, fontSize: 12 }}>
          检测到旧版配置格式，建议重新选择平台并保存以升级配置
        </Alert>
      )}

      {/* Alerts */}
      {saveSuccess && (
        <Alert severity="success" className="mb-3" sx={{ py: 0.5, fontSize: 12 }}>
          配置已保存到 ~/.openclaw/openclaw.json
        </Alert>
      )}
      {error && (
        <Alert severity="error" className="mb-3" sx={{ py: 0.5, fontSize: 12 }}>
          {error}
        </Alert>
      )}

      {/* Tabs */}
      <Paper className="flex-1 flex flex-col overflow-hidden" elevation={1}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange} 
          className="border-b min-h-[36px]"
          sx={{ 
            minHeight: 36,
            '& .MuiTabs-flexContainer': { minHeight: 36 },
            '& .MuiTab-root': { 
              minHeight: 36, 
              py: 0.5, 
              px: 2,
              fontSize: 12,
              textTransform: 'none'
            }
          }}
        >
          <Tab icon={<Code className="w-3.5 h-3.5" />} iconPosition="start" label="平台配置" />
          <Tab icon={<Database className="w-3.5 h-3.5" />} iconPosition="start" label="模型设置" />
          <Tab icon={<Puzzle className="w-3.5 h-3.5" />} iconPosition="start" label={`已安装插件 (${plugins.length})`} />
        </Tabs>

        <Box className="flex-1 overflow-auto p-3">
          {/* Platform Config Tab */}
          <TabPanel value={activeTab} index={0}>
            <Card variant="outlined" sx={{ bgcolor: themeMode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }}>
              <CardContent className="space-y-3" sx={{ pb: 2, '&:last-child': { pb: 2 } }}>
                <Typography variant="subtitle2" className="mb-3 text-sm font-semibold">
                  选择平台
                </Typography>
                
                <FormControl fullWidth {...compactSelectProps}>
                  <InputLabel sx={{ fontSize: 13 }}>消息平台</InputLabel>
                  <Select
                    value={config.platform || 'feishu'}
                    label="消息平台"
                    onChange={(e) => updatePlatform(e.target.value as PlatformType)}
                  >
                    {PLATFORM_OPTIONS.map((opt) => (
                      <MenuItem key={opt.value} value={opt.value} sx={{ fontSize: 13 }}>
                        {opt.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <Divider sx={{ my: 2 }} />

                <Typography variant="subtitle2" className="mb-3 text-sm font-semibold">
                  平台配置
                </Typography>

                {renderPlatformConfig()}
              </CardContent>
            </Card>
          </TabPanel>

          {/* Model Settings Tab */}
          <TabPanel value={activeTab} index={1}>
            <Box className="space-y-3">
              {/* 选择大模型 */}
              <Card variant="outlined" sx={{ bgcolor: themeMode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }}>
                <CardContent className="space-y-3" sx={{ pb: 2, '&:last-child': { pb: 2 } }}>
                  <Typography variant="subtitle2" className="mb-3 text-sm font-semibold flex items-center gap-1.5">
                    <Brain className="w-4 h-4" />
                    选择大模型
                  </Typography>

                  <FormControl fullWidth {...compactSelectProps}>
                    <InputLabel sx={{ fontSize: 13 }}>大模型</InputLabel>
                    <Select
                      value={getCurrentModel()}
                      label="大模型"
                      onChange={(e) => updateModelSelection(e.target.value)}
                    >
                      {LLM_PROVIDERS.map((provider) => (
                        provider.models.length > 0 ? (
                          // 有固定模型列表的提供商
                          provider.models.map((model) => (
                            <MenuItem 
                              key={`${provider.id}/${model}`}
                              value={`${provider.id}/${model}`}
                              sx={{ fontSize: 13 }}
                            >
                              {provider.name} / {model}
                            </MenuItem>
                          ))
                        ) : (
                          // 没有固定模型列表的提供商，使用 provider id
                          <MenuItem 
                            key={provider.id}
                            value={`${provider.id}/default`}
                            sx={{ fontSize: 13 }}
                          >
                            {provider.name}
                          </MenuItem>
                        )
                      ))}
                    </Select>
                  </FormControl>

                  {(() => {
                    const providerInfo = getCurrentProviderInfo()
                    if (!providerInfo) return null

                    return (
                      <>
                        {/* API Key 配置 */}
                        {providerInfo.requiresApiKey && (
                          <TextField
                            label={`${providerInfo.name} API Key`}
                            value={getApiKey(getCurrentProvider())}
                            onChange={(e) => updateApiKey(e.target.value)}
                            fullWidth
                            type="password"
                            placeholder={`输入 ${providerInfo.name} API Key`}
                            helperText={`环境变量: ${providerInfo.envKey}`}
                            FormHelperTextProps={{ sx: { fontSize: 11, mt: 0.5 } }}
                            {...compactTextFieldProps}
                          />
                        )}

                        {/* Base URL 配置 */}
                        {(providerInfo.requiresBaseUrl || getCurrentProvider() === 'custom' || getCurrentProvider() === 'ollama') && (
                          <TextField
                            label="Base URL"
                            value={getBaseUrl(getCurrentProvider())}
                            onChange={(e) => updateBaseUrl(e.target.value)}
                            fullWidth
                            placeholder={
                              getCurrentProvider() === 'ollama' 
                                ? 'http://127.0.0.1:11434/v1' 
                                : getCurrentProvider() === 'moonshot'
                                ? 'https://api.moonshot.ai/v1'
                                : 'https://api.example.com/v1'
                            }
                            helperText={
                              getCurrentProvider() === 'ollama' 
                                ? 'Ollama 默认地址: http://127.0.0.1:11434/v1'
                                : '自定义 API 基础 URL（OpenAI 兼容格式）'
                            }
                            FormHelperTextProps={{ sx: { fontSize: 11, mt: 0.5 } }}
                            {...compactTextFieldProps}
                          />
                        )}

                        {/* 模型选择提示 */}
                        {providerInfo.models.length > 1 && (
                          <Alert severity="info" sx={{ py: 0.5, fontSize: 12 }}>
                            已选择 {providerInfo.name} 的 {getCurrentModelName()} 模型
                          </Alert>
                        )}

                        {/* 描述信息 */}
                        {providerInfo.description && (
                          <Typography variant="caption" color="text.secondary" display="block">
                            {providerInfo.description}
                          </Typography>
                        )}
                      </>
                    )
                  })()}
                </CardContent>
              </Card>

              {/* 当前配置预览 */}
              <Card variant="outlined" sx={{ bgcolor: themeMode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }}>
                <CardContent sx={{ pb: 2, '&:last-child': { pb: 2 } }}>
                  <Typography variant="subtitle2" className="mb-2 text-sm font-semibold">
                    当前配置
                  </Typography>
                  <Box 
                    component="pre" 
                    sx={{ 
                      fontSize: 11, 
                      fontFamily: 'monospace',
                      bgcolor: themeMode === 'dark' ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.05)',
                      p: 1.5,
                      borderRadius: 1,
                      overflow: 'auto',
                      maxHeight: 150
                    }}
                  >
{JSON.stringify({
  env: config.env,
  agents: config.agents,
  models: config.models
}, null, 2)}
                  </Box>
                </CardContent>
              </Card>

              {/* 快速配置链接 */}
              <Card variant="outlined" sx={{ bgcolor: themeMode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }}>
                <CardContent sx={{ pb: 2, '&:last-child': { pb: 2 } }}>
                  <Typography variant="subtitle2" className="mb-2 text-sm font-semibold">
                    快速配置指南
                  </Typography>
                  <Box className="flex flex-wrap gap-2">
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<ExternalLink className="w-3 h-3" />}
                      onClick={() => window.open('https://platform.openai.com/api-keys', '_blank')}
                      sx={{ textTransform: 'none', fontSize: 11 }}
                    >
                      OpenAI
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<ExternalLink className="w-3 h-3" />}
                      onClick={() => window.open('https://console.anthropic.com/settings/keys', '_blank')}
                      sx={{ textTransform: 'none', fontSize: 11 }}
                    >
                      Anthropic
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<ExternalLink className="w-3 h-3" />}
                      onClick={() => window.open('https://aistudio.google.com/app/apikey', '_blank')}
                      sx={{ textTransform: 'none', fontSize: 11 }}
                    >
                      Google
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<ExternalLink className="w-3 h-3" />}
                      onClick={() => window.open('https://platform.moonshot.cn/console/api-keys', '_blank')}
                      sx={{ textTransform: 'none', fontSize: 11 }}
                    >
                      Moonshot
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Box>
          </TabPanel>

          {/* Plugins Tab */}
          <TabPanel value={activeTab} index={2}>
            <Card variant="outlined" sx={{ bgcolor: themeMode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }}>
              <CardContent sx={{ pb: 2, '&:last-child': { pb: 2 } }}>
                <Typography variant="subtitle2" className="mb-3 text-sm font-semibold">
                  已安装插件
                </Typography>

                {plugins.length === 0 ? (
                  <Alert severity="info" sx={{ py: 0.5, fontSize: 12 }}>
                    暂无已安装插件。前往插件市场发现更多插件。
                  </Alert>
                ) : (
                  <List dense sx={{ py: 0 }}>
                    {plugins.map((plugin, index) => (
                      <div key={plugin.name}>
                        <ListItem sx={{ py: 0.5, px: 1 }}>
                          <ListItemText
                            primary={
                              <Box className="flex items-center gap-1.5">
                                <span className="font-medium text-sm">{plugin.name}</span>
                                <Chip size="small" label={`v${plugin.version}`} sx={{ height: 18, fontSize: 10 }} />
                                {plugin.enabled && (
                                  <Chip size="small" color="success" label="已启用" sx={{ height: 18, fontSize: 10 }} />
                                )}
                              </Box>
                            }
                            secondary={
                              <span className="text-gray-500 text-xs">
                                设置项: {Object.keys(plugin.settings).length} 个
                              </span>
                            }
                            primaryTypographyProps={{ fontSize: 13 }}
                            secondaryTypographyProps={{ fontSize: 11 }}
                          />
                          <ListItemSecondaryAction>
                            <Tooltip title="启用/禁用">
                              <Switch
                                edge="end"
                                size="small"
                                checked={plugin.enabled}
                                onChange={() => {/* Toggle plugin */}}
                              />
                            </Tooltip>
                            <Tooltip title="编辑">
                              <IconButton edge="end" size="small" sx={{ ml: 0.5, p: 0.5 }}>
                                <Pencil className="w-3.5 h-3.5" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="删除">
                              <IconButton edge="end" size="small" color="error" sx={{ ml: 0.5, p: 0.5 }}>
                                <Trash2 className="w-3.5 h-3.5" />
                              </IconButton>
                            </Tooltip>
                          </ListItemSecondaryAction>
                        </ListItem>
                        {index < plugins.length - 1 && <Divider component="li" sx={{ my: 0.5 }} />}
                      </div>
                    ))}
                  </List>
                )}
              </CardContent>
            </Card>
          </TabPanel>
        </Box>
      </Paper>
    </Box>
  )
}
