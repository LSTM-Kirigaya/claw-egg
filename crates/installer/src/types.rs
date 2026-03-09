use serde::{Deserialize, Serialize};
use std::fmt;

/// Overall installation stage
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, Default)]
pub enum InstallStage {
    #[default]
    EnvironmentCheck,    // 1. 检查环境
    DownloadNodeJs,      // 2. 下载 Node.js
    InstallNodeJs,       // 3. 安装 Node.js
    InstallOpenClaw,     // 4. 安装 OpenClaw
    ConfigureOpenClaw,   // 5. 配置 OpenClaw
    Completed,           // 6. 完成
    Failed,              // 失败
}

impl InstallStage {
    /// Get the stage number (for progress calculation)
    pub fn number(&self) -> u8 {
        match self {
            InstallStage::EnvironmentCheck => 0,
            InstallStage::DownloadNodeJs => 1,
            InstallStage::InstallNodeJs => 2,
            InstallStage::InstallOpenClaw => 3,
            InstallStage::ConfigureOpenClaw => 4,
            InstallStage::Completed => 5,
            InstallStage::Failed => 5,
        }
    }

    /// Get total number of stages
    pub fn total_stages() -> u8 {
        5
    }

    /// Get display name
    pub fn display_name(&self) -> &'static str {
        match self {
            InstallStage::EnvironmentCheck => "检查环境",
            InstallStage::DownloadNodeJs => "下载 Node.js",
            InstallStage::InstallNodeJs => "安装 Node.js",
            InstallStage::InstallOpenClaw => "安装 OpenClaw",
            InstallStage::ConfigureOpenClaw => "配置 OpenClaw",
            InstallStage::Completed => "安装完成",
            InstallStage::Failed => "安装失败",
        }
    }
}

impl fmt::Display for InstallStage {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.display_name())
    }
}

/// Overall installation progress
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OverallProgress {
    pub stage: InstallStage,
    pub stage_progress: u8,      // Current stage progress (0-100)
    pub overall_progress: u8,    // Overall progress (0-100)
    pub message: String,
    pub detail: Option<String>,  // Detailed sub-step message
}

impl OverallProgress {
    /// Calculate overall progress based on stage and stage progress
    pub fn calculate_overall(stage: InstallStage, stage_progress: u8) -> u8 {
        let stage_weight = 100 / InstallStage::total_stages();
        let completed_weight = stage.number() * stage_weight;
        let current_stage_contribution = (stage_progress as u16 * stage_weight as u16 / 100) as u8;
        completed_weight + current_stage_contribution
    }

    pub fn new(stage: InstallStage, stage_progress: u8, message: impl Into<String>) -> Self {
        let message = message.into();
        let overall_progress = Self::calculate_overall(stage, stage_progress);
        Self {
            stage,
            stage_progress,
            overall_progress,
            message,
            detail: None,
        }
    }

    pub fn with_detail(mut self, detail: impl Into<String>) -> Self {
        self.detail = Some(detail.into());
        self
    }
}

/// Installation status
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum InstallStatus {
    NotInstalled,
    Installing,
    Installed,
    Failed(String),
}

impl fmt::Display for InstallStatus {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            InstallStatus::NotInstalled => write!(f, "未安装"),
            InstallStatus::Installing => write!(f, "安装中..."),
            InstallStatus::Installed => write!(f, "已安装"),
            InstallStatus::Failed(msg) => write!(f, "失败: {}", msg),
        }
    }
}

/// Component type
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum Component {
    NodeJs,
    OpenClaw,
}

impl fmt::Display for Component {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Component::NodeJs => write!(f, "Node.js"),
            Component::OpenClaw => write!(f, "OpenClaw"),
        }
    }
}

/// Installation result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InstallResult {
    pub component: Component,
    pub success: bool,
    pub message: String,
    pub version: Option<String>,
}

/// Environment check result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EnvironmentCheck {
    pub component: Component,
    pub installed: bool,
    pub version: Option<String>,
    pub path: Option<String>,
}

/// Component installation progress
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ComponentProgress {
    pub component: Component,
    pub status: InstallStatus,
    pub progress: u8, // 0-100
    pub message: String,
}

/// Platform type for OpenClaw
#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum PlatformType {
    #[default]
    Feishu,
    Discord,
    Telegram,
    #[serde(rename = "qq_official")]
    QqOfficial,
    #[serde(rename = "qq_onebot")]
    QqOnebot,
}

impl fmt::Display for PlatformType {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            PlatformType::Feishu => write!(f, "feishu"),
            PlatformType::Discord => write!(f, "discord"),
            PlatformType::Telegram => write!(f, "telegram"),
            PlatformType::QqOfficial => write!(f, "qq_official"),
            PlatformType::QqOnebot => write!(f, "qq_onebot"),
        }
    }
}

/// Feishu/Lark platform configuration
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct FeishuConfig {
    pub app_id: String,
    pub app_secret: String,
    pub domain: String,
}

/// Discord platform configuration
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct DiscordConfig {
    pub bot_token: String,
    pub client_id: String,
    pub client_secret: String,
    pub guild_id: Option<String>,
}

/// Telegram platform configuration
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct TelegramConfig {
    pub bot_token: String,
    pub api_url: Option<String>,
    pub allowed_users: Option<Vec<String>>,
}

/// QQ Official platform configuration
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct QqOfficialConfig {
    pub app_id: String,
    pub app_secret: String,
    pub token: String,
    pub sandbox_mode: bool,
}

/// QQ OneBot platform configuration
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct QqOnebotConfig {
    pub http_url: String,
    pub access_token: Option<String>,
}

/// Platform-specific configurations
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct PlatformConfigs {
    pub feishu: Option<FeishuConfig>,
    pub discord: Option<DiscordConfig>,
    pub telegram: Option<TelegramConfig>,
    pub qq_official: Option<QqOfficialConfig>,
    pub qq_onebot: Option<QqOnebotConfig>,
}

/// OpenClaw configuration stored in ~/.openclaw/openclaw.json
/// All fields are optional to avoid parse errors with existing configs
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct OpenClawConfig {
    /// Platform type
    #[serde(rename = "platform")]
    pub platform_type: Option<PlatformType>,
    
    /// Platform-specific configurations
    #[serde(flatten)]
    pub platform_configs: Option<PlatformConfigs>,
    
    // Legacy fields for backward compatibility
    /// Feishu/Lark App ID (deprecated, use platform_configs.feishu.app_id)
    pub app_id: Option<String>,
    /// Feishu/Lark App Secret (deprecated)
    pub app_secret: Option<String>,
    /// Domain: feishu.cn or larksuite.com (deprecated)
    pub domain: Option<String>,
    
    /// Model provider: qwen, openai, anthropic, etc. (legacy)
    pub model_provider: Option<String>,
    /// Model name: qwen-turbo, gpt-4, etc. (legacy)
    pub model_name: Option<String>,
    /// API key for the model provider (legacy)
    pub api_key: Option<String>,
    /// Base URL for API (for custom/proxy endpoints) (legacy)
    pub base_url: Option<String>,
    
    /// LLM environment variables (e.g., OPENAI_API_KEY)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub env: Option<std::collections::HashMap<String, String>>,
    
    /// Agents configuration
    #[serde(skip_serializing_if = "Option::is_none")]
    pub agents: Option<AgentsConfig>,
    
    /// Models configuration
    #[serde(skip_serializing_if = "Option::is_none")]
    pub models: Option<ModelsConfig>,
}

/// Agents configuration
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AgentsConfig {
    pub defaults: Option<AgentDefaults>,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AgentDefaults {
    pub model: Option<ModelConfig>,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ModelConfig {
    pub primary: Option<String>,
}

/// Models configuration
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ModelsConfig {
    pub mode: Option<String>,
    pub providers: Option<std::collections::HashMap<String, ModelProviderConfig>>,
}

/// Model provider configuration
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ModelProviderConfig {
    pub base_url: Option<String>,
    pub api_key: Option<String>,
    pub api: Option<String>,
    pub models: Option<Vec<ModelInfo>>,
}

/// Model information
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ModelInfo {
    pub id: String,
    pub name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub reasoning: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub input: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub cost: Option<ModelCost>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub context_window: Option<u32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub max_tokens: Option<u32>,
}

/// Model cost information
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ModelCost {
    pub input: Option<f64>,
    pub output: Option<f64>,
    #[serde(rename = "cacheRead")]
    pub cache_read: Option<f64>,
    #[serde(rename = "cacheWrite")]
    pub cache_write: Option<f64>,
}

impl OpenClawConfig {
    /// Get the current platform type, defaulting to Feishu
    pub fn get_platform(&self) -> PlatformType {
        self.platform_type.clone().unwrap_or_default()
    }
    
    /// Check if this is a legacy config (has app_id but no platform_type)
    pub fn is_legacy_config(&self) -> bool {
        self.platform_type.is_none() && self.app_id.is_some()
    }
    
    /// Migrate legacy config to new format
    pub fn migrate_if_needed(&mut self) {
        if self.is_legacy_config() {
            self.platform_type = Some(PlatformType::Feishu);
            if let (Some(app_id), Some(app_secret), Some(domain)) = 
                (self.app_id.clone(), self.app_secret.clone(), self.domain.clone()) {
                self.platform_configs = Some(PlatformConfigs {
                    feishu: Some(FeishuConfig { app_id, app_secret, domain }),
                    ..Default::default()
                });
            }
        }
    }
}

/// Installation state persisted to disk
/// Used for resuming interrupted installations
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct InstallationState {
    /// Current or last installation stage
    pub stage: InstallStage,
    /// Whether installation is complete
    pub completed: bool,
    /// Last error message if failed
    pub last_error: Option<String>,
    /// Timestamp of last installation attempt
    pub last_attempt: Option<String>,
    /// Node.js installation path
    pub node_path: Option<String>,
    /// OpenClaw installation path
    pub openclaw_path: Option<String>,
}

impl InstallationState {
    /// Load installation state from disk
    pub fn load() -> anyhow::Result<Self> {
        let state_path = Self::get_state_path()?;
        if !state_path.exists() {
            return Ok(Self::default());
        }
        let content = std::fs::read_to_string(state_path)?;
        let state: InstallationState = serde_json::from_str(&content)?;
        Ok(state)
    }

    /// Save installation state to disk
    pub fn save(&self) -> anyhow::Result<()> {
        let state_path = Self::get_state_path()?;
        if let Some(parent) = state_path.parent() {
            std::fs::create_dir_all(parent)?;
        }
        let content = serde_json::to_string_pretty(self)?;
        std::fs::write(state_path, content)?;
        Ok(())
    }

    /// Get path to state file
    fn get_state_path() -> anyhow::Result<std::path::PathBuf> {
        let home = std::env::var("HOME")
            .or_else(|_| std::env::var("USERPROFILE"))?;
        Ok(std::path::PathBuf::from(home)
            .join(".clawegg")
            .join("installation_state.json"))
    }

    /// Check if installation was previously completed
    pub fn is_completed(&self) -> bool {
        self.completed
    }

    /// Check if installation needs to be retried
    /// Returns true if previous attempt failed or was interrupted
    pub fn needs_retry(&self) -> bool {
        if self.completed {
            return false;
        }
        // If we have a stage beyond EnvironmentCheck but not completed,
        // it means the previous attempt was interrupted
        matches!(self.stage, 
            InstallStage::DownloadNodeJs | 
            InstallStage::InstallNodeJs | 
            InstallStage::InstallOpenClaw | 
            InstallStage::ConfigureOpenClaw |
            InstallStage::Failed
        )
    }
}

/// Download progress
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DownloadProgress {
    pub url: String,
    pub downloaded_bytes: u64,
    pub total_bytes: Option<u64>,
    pub percentage: u8,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_install_stage_number() {
        assert_eq!(InstallStage::EnvironmentCheck.number(), 0);
        assert_eq!(InstallStage::Completed.number(), 5);
    }

    #[test]
    fn test_overall_progress_calculation() {
        // At stage 0, 50% progress
        let progress = OverallProgress::calculate_overall(InstallStage::EnvironmentCheck, 50);
        assert!(progress < 20);

        // At stage 2 (InstallNodeJs), 0% progress within stage
        let progress = OverallProgress::calculate_overall(InstallStage::InstallNodeJs, 0);
        assert_eq!(progress, 40); // 2 * 20 = 40

        // At stage 2, 50% progress within stage
        let progress = OverallProgress::calculate_overall(InstallStage::InstallNodeJs, 50);
        assert_eq!(progress, 50); // 40 + 10 = 50

        // Completed
        let progress = OverallProgress::calculate_overall(InstallStage::Completed, 0);
        assert_eq!(progress, 100);
    }

    #[test]
    fn test_install_status_display() {
        assert_eq!(InstallStatus::NotInstalled.to_string(), "未安装");
        assert_eq!(InstallStatus::Installed.to_string(), "已安装");
    }

    #[test]
    fn test_component_display() {
        assert_eq!(Component::NodeJs.to_string(), "Node.js");
        assert_eq!(Component::OpenClaw.to_string(), "OpenClaw");
    }

    #[test]
    fn test_installation_state_needs_retry() {
        let mut state = InstallationState::default();
        assert!(!state.needs_retry()); // Initial state

        state.stage = InstallStage::DownloadNodeJs;
        assert!(state.needs_retry());

        state.stage = InstallStage::Failed;
        assert!(state.needs_retry());

        state.completed = true;
        assert!(!state.needs_retry());
    }
}
