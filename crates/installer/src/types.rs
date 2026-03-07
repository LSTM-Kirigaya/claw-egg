use serde::{Deserialize, Serialize};
use std::fmt;

/// Overall installation stage
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, Default)]
pub enum InstallStage {
    #[default]
    EnvironmentCheck,    // 1. 检查环境
    DownloadNodeJs,      // 2. 下载 Node.js
    InstallNodeJs,       // 3. 安装 Node.js
    InstallQwenCli,      // 4. 安装 Qwen CLI
    InstallOpenClaw,     // 5. 安装 OpenClaw
    ConfigureOpenClaw,   // 6. 配置 OpenClaw
    Completed,           // 7. 完成
    Failed,              // 失败
}

impl InstallStage {
    /// Get the stage number (for progress calculation)
    pub fn number(&self) -> u8 {
        match self {
            InstallStage::EnvironmentCheck => 0,
            InstallStage::DownloadNodeJs => 1,
            InstallStage::InstallNodeJs => 2,
            InstallStage::InstallQwenCli => 3,
            InstallStage::InstallOpenClaw => 4,
            InstallStage::ConfigureOpenClaw => 5,
            InstallStage::Completed => 6,
            InstallStage::Failed => 6,
        }
    }

    /// Get total number of stages
    pub fn total_stages() -> u8 {
        6
    }

    /// Get display name
    pub fn display_name(&self) -> &'static str {
        match self {
            InstallStage::EnvironmentCheck => "检查环境",
            InstallStage::DownloadNodeJs => "下载 Node.js",
            InstallStage::InstallNodeJs => "安装 Node.js",
            InstallStage::InstallQwenCli => "安装 Qwen CLI",
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
    QwenCli,
    OpenClaw,
}

impl fmt::Display for Component {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Component::NodeJs => write!(f, "Node.js"),
            Component::QwenCli => write!(f, "Qwen CLI"),
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

/// OpenClaw configuration
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct OpenClawConfig {
    pub app_id: String,
    pub app_secret: String,
    pub domain: String,
    pub model_provider: String,
    pub model_name: String,
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
        assert_eq!(InstallStage::Completed.number(), 6);
    }

    #[test]
    fn test_overall_progress_calculation() {
        // At stage 0, 50% progress
        let progress = OverallProgress::calculate_overall(InstallStage::EnvironmentCheck, 50);
        assert!(progress < 20); // Should be less than one sixth (16.67%)

        // At stage 3 (InstallQwenCli), 0% progress within stage
        // Stage 3 = 3 * (100/6) = 50%
        let progress = OverallProgress::calculate_overall(InstallStage::InstallQwenCli, 0);
        assert_eq!(progress, 48); // 3 * 16 = 48 (integer math)

        // At stage 3, 50% progress within stage
        let progress = OverallProgress::calculate_overall(InstallStage::InstallQwenCli, 50);
        assert_eq!(progress, 56); // 48 + 8 = 56

        // Completed
        let progress = OverallProgress::calculate_overall(InstallStage::Completed, 0);
        assert_eq!(progress, 96); // 6 * 16 = 96, capped at 100
    }

    #[test]
    fn test_install_status_display() {
        assert_eq!(InstallStatus::NotInstalled.to_string(), "未安装");
        assert_eq!(InstallStatus::Installed.to_string(), "已安装");
    }

    #[test]
    fn test_component_display() {
        assert_eq!(Component::NodeJs.to_string(), "Node.js");
        assert_eq!(Component::QwenCli.to_string(), "Qwen CLI");
        assert_eq!(Component::OpenClaw.to_string(), "OpenClaw");
    }
}
