// Types matching the Rust backend

export type Component = 'NodeJs' | 'OpenClaw';

export type InstallStatus = 'NotInstalled' | 'Installing' | 'Installed' | { Failed: string };

export type InstallStage = 
  | 'EnvironmentCheck' 
  | 'DownloadNodeJs' 
  | 'InstallNodeJs' 
  | 'InstallOpenClaw' 
  | 'ConfigureOpenClaw' 
  | 'Completed' 
  | 'Failed';

export interface InstallResult {
  component: Component;
  success: boolean;
  message: string;
  version: string | null;
}

export interface EnvironmentCheck {
  component: Component;
  installed: boolean;
  version: string | null;
  path: string | null;
}

export interface ComponentProgress {
  component: Component;
  status: InstallStatus;
  progress: number;
  message: string;
}

export interface OverallProgress {
  stage: InstallStage;
  stage_progress: number;
  overall_progress: number;
  message: string;
  detail: string | null;
}

/// Platform types supported by OpenClaw
export type PlatformType = 'feishu' | 'discord' | 'telegram' | 'qq_official' | 'qq_onebot';

/// Platform display info
export const PLATFORM_OPTIONS: { value: PlatformType; label: string }[] = [
  { value: 'feishu', label: '飞书 (Feishu/Lark)' },
  { value: 'discord', label: 'Discord' },
  { value: 'telegram', label: 'Telegram' },
  { value: 'qq_official', label: 'QQ 官方 Bot' },
  { value: 'qq_onebot', label: 'QQ OneBot' },
];

/// Feishu/Lark platform configuration
export interface FeishuConfig {
  app_id: string;
  app_secret: string;
  domain: string;
}

/// Discord platform configuration
export interface DiscordConfig {
  bot_token: string;
  client_id: string;
  client_secret: string;
  guild_id?: string;
}

/// Telegram platform configuration
export interface TelegramConfig {
  bot_token: string;
  api_url?: string;
  allowed_users?: string[];
}

/// QQ Official platform configuration
export interface QqOfficialConfig {
  app_id: string;
  app_secret: string;
  token: string;
  sandbox_mode: boolean;
}

/// QQ OneBot platform configuration
export interface QqOnebotConfig {
  http_url: string;
  access_token?: string;
}

/// LLM Provider types supported by OpenClaw
export type LlmProvider = 
  | 'openai' | 'anthropic' | 'openai-codex' | 'google' | 'zai'
  | 'openrouter' | 'xai' | 'groq' | 'cerebras' | 'mistral'
  | 'github-copilot' | 'moonshot' | 'kimi-coding' | 'ollama'
  | 'kilocode' | 'qianfan' | 'custom';

/// LLM Provider info
export interface LlmProviderInfo {
  id: LlmProvider;
  name: string;
  description?: string;
  requiresBaseUrl?: boolean;
  requiresApiKey: boolean;
  envKey: string;
  models: string[];
}

/// Built-in LLM providers configuration
export const LLM_PROVIDERS: LlmProviderInfo[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    requiresApiKey: true,
    envKey: 'OPENAI_API_KEY',
    models: ['gpt-5.4', 'gpt-5.4-pro'],
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    requiresApiKey: true,
    envKey: 'ANTHROPIC_API_KEY',
    models: ['claude-opus-4-6', 'claude-sonnet-4-5'],
  },
  {
    id: 'openai-codex',
    name: 'OpenAI Code (Codex)',
    description: '需要 OAuth 登录',
    requiresApiKey: false,
    envKey: '',
    models: ['gpt-5.4'],
  },
  {
    id: 'google',
    name: 'Google Gemini',
    requiresApiKey: true,
    envKey: 'GEMINI_API_KEY',
    models: ['gemini-3-pro-preview', 'gemini-3-flash-preview'],
  },
  {
    id: 'zai',
    name: 'Z.AI',
    requiresApiKey: true,
    envKey: 'ZAI_API_KEY',
    models: ['glm-5', 'glm-4.7', 'glm-4.6'],
  },
  {
    id: 'moonshot',
    name: 'Moonshot AI (Kimi)',
    requiresApiKey: true,
    requiresBaseUrl: true,
    envKey: 'MOONSHOT_API_KEY',
    models: ['kimi-k2.5'],
  },
  {
    id: 'kimi-coding',
    name: 'Kimi Coding',
    requiresApiKey: true,
    envKey: 'KIMI_API_KEY',
    models: ['k2p5'],
  },
  {
    id: 'ollama',
    name: 'Ollama (本地)',
    description: '本地运行，无需 API Key',
    requiresApiKey: false,
    envKey: '',
    models: ['llama3.3', 'llama3.2', 'qwen2.5'],
  },
  {
    id: 'kilocode',
    name: 'Kilo Gateway',
    description: '统一网关，支持多个模型',
    requiresApiKey: true,
    envKey: 'KILOCODE_API_KEY',
    models: [
      'anthropic/claude-opus-4.6',
      'z-ai/glm-5:free',
      'minimax/minimax-m2.5:free',
      'openai/gpt-5.2',
      'google/gemini-3-pro-preview',
    ],
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    requiresApiKey: true,
    envKey: 'OPENROUTER_API_KEY',
    models: ['anthropic/claude-sonnet-4-5'],
  },
  {
    id: 'xai',
    name: 'xAI',
    requiresApiKey: true,
    envKey: 'XAI_API_KEY',
    models: ['grok-code-fast-1'],
  },
  {
    id: 'groq',
    name: 'Groq',
    requiresApiKey: true,
    envKey: 'GROQ_API_KEY',
    models: [],
  },
  {
    id: 'cerebras',
    name: 'Cerebras',
    requiresApiKey: true,
    envKey: 'CEREBRAS_API_KEY',
    models: ['zai-glm-4.7', 'zai-glm-4.6'],
  },
  {
    id: 'mistral',
    name: 'Mistral',
    requiresApiKey: true,
    envKey: 'MISTRAL_API_KEY',
    models: ['mistral-large-latest'],
  },
  {
    id: 'github-copilot',
    name: 'GitHub Copilot',
    requiresApiKey: true,
    envKey: 'COPILOT_GITHUB_TOKEN',
    models: [],
  },
  {
    id: 'qianfan',
    name: '百度千帆',
    requiresApiKey: true,
    envKey: 'QIANFAN_API_KEY',
    models: [],
  },
  {
    id: 'custom',
    name: '自定义/OpenAI 兼容',
    description: 'LM Studio, vLLM, LiteLLM 等',
    requiresApiKey: true,
    requiresBaseUrl: true,
    envKey: 'CUSTOM_API_KEY',
    models: [],
  },
];

/// Model provider configuration
export interface ModelProviderConfig {
  baseUrl?: string;
  apiKey?: string;
  api?: 'openai-completions' | 'openai-responses' | 'anthropic-messages' | 'google-generative-ai';
  models?: ModelInfo[];
}

/// Model information
export interface ModelInfo {
  id: string;
  name: string;
  reasoning?: boolean;
  input?: string[];
  cost?: {
    input?: number;
    output?: number;
    cacheRead?: number;
    cacheWrite?: number;
  };
  contextWindow?: number;
  maxTokens?: number;
}

/// LLM environment variables
export interface LlmEnv {
  [key: string]: string;
}

/// Agents configuration
export interface AgentsConfig {
  defaults?: {
    model?: {
      primary?: string;
    };
  };
}

/// Models configuration
export interface ModelsConfig {
  mode?: 'merge' | 'replace';
  providers?: {
    [providerId: string]: ModelProviderConfig;
  };
}

/// OpenClaw configuration matching ~/.openclaw/openclaw.json
/// All fields are optional to avoid parse errors with existing configs
export interface OpenClawConfig {
  platform?: PlatformType;
  feishu?: FeishuConfig;
  discord?: DiscordConfig;
  telegram?: TelegramConfig;
  qq_official?: QqOfficialConfig;
  qq_onebot?: QqOnebotConfig;
  
  // LLM configuration
  env?: LlmEnv;
  agents?: AgentsConfig;
  models?: ModelsConfig;
  
  // Legacy fields for backward compatibility
  app_id?: string;
  app_secret?: string;
  domain?: string;
  model_provider?: string;
  model_name?: string;
  api_key?: string;
  base_url?: string;
}

/// Plugin configuration
export interface PluginConfig {
  name: string;
  version: string;
  enabled: boolean;
  settings: Record<string, unknown>;
}

/// Plugin from marketplace
export interface Plugin {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  downloads: number;
  rating: number;
  tags: string[];
  installed?: boolean;
}

/// Community post
export interface CommunityPost {
  id: string;
  title: string;
  author: string;
  avatar?: string;
  content: string;
  created_at: string;
  likes: number;
  comments: number;
  tags: string[];
}

export interface SystemInfo {
  platform: string;
  arch: string;
  version: string;
}

// ============================================
// 应用配置系统 (App Configuration System)
// ============================================

/// 主题偏好设置
export type ThemePreference = 'light' | 'dark' | 'system';

/// 语言设置
export type Language = 'zh-CN' | 'en-US';

/// 窗口状态
export interface WindowState {
  width: number;
  height: number;
  x?: number;
  y?: number;
  maximized: boolean;
}

/// 通知设置
export interface NotificationSettings {
  enabled: boolean;
  sound: boolean;
  installationComplete: boolean;
  updateAvailable: boolean;
}

/// 网络设置
export interface NetworkSettings {
  useChinaMirror: boolean;
  customMirror?: string;
  proxyEnabled: boolean;
  proxyUrl?: string;
}

/// 安装偏好设置
export interface InstallPreferences {
  autoInstall: boolean;
  installPath?: string;
  keepDownloads: boolean;
  verifyChecksums: boolean;
}

/// 用户行为记录
export interface UserBehavior {
  lastActiveTab: string;
  expandedSections: string[];
  recentPlugins: string[];
}

/// 托盘设置
export interface TraySettings {
  minimizeToTrayOnClose: boolean;
  showTrayIcon: boolean;
  startMinimized: boolean;
}

/// 应用完整配置
export interface AppSettings {
  // 版本号，用于迁移
  version: string;
  
  // 外观设置
  theme: ThemePreference;
  language: Language;
  
  // 窗口状态
  window: WindowState;
  
  // 功能设置
  notifications: NotificationSettings;
  network: NetworkSettings;
  install: InstallPreferences;
  
  // 用户行为
  behavior: UserBehavior;
  
  // 托盘设置
  tray: TraySettings;
  
  // 其他元数据
  firstRun: boolean;
  lastUpdated: string;
}

/// 默认配置
export const DEFAULT_SETTINGS: AppSettings = {
  version: '1.0.0',
  theme: 'system',
  language: 'zh-CN',
  window: {
    width: 1200,
    height: 800,
    maximized: false,
  },
  notifications: {
    enabled: true,
    sound: true,
    installationComplete: true,
    updateAvailable: true,
  },
  network: {
    useChinaMirror: false,
    proxyEnabled: false,
  },
  install: {
    autoInstall: false,
    keepDownloads: true,
    verifyChecksums: true,
  },
  behavior: {
    lastActiveTab: 'manage',
    expandedSections: [],
    recentPlugins: [],
  },
  tray: {
    minimizeToTrayOnClose: true,
    showTrayIcon: true,
    startMinimized: false,
  },
  firstRun: true,
  lastUpdated: new Date().toISOString(),
};

// Stage display names
export const STAGE_NAMES: Record<InstallStage, string> = {
  EnvironmentCheck: '检查环境',
  DownloadNodeJs: '下载 Node.js',
  InstallNodeJs: '安装 Node.js',
  InstallOpenClaw: '安装 OpenClaw',
  ConfigureOpenClaw: '配置 OpenClaw',
  Completed: '安装完成',
  Failed: '安装失败',
};

// Stage order for progress calculation
export const STAGE_ORDER: InstallStage[] = [
  'EnvironmentCheck',
  'DownloadNodeJs',
  'InstallNodeJs',
  'InstallOpenClaw',
  'ConfigureOpenClaw',
  'Completed',
];

// App view modes
export type AppView = 'installer' | 'main';

// Main app tabs
export type MainTab = 'manage' | 'marketplace' | 'community';
