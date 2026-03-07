use serde::{Deserialize, Serialize};
use std::fmt;

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
            InstallStatus::NotInstalled => write!(f, "Not Installed"),
            InstallStatus::Installing => write!(f, "Installing..."),
            InstallStatus::Installed => write!(f, "Installed"),
            InstallStatus::Failed(msg) => write!(f, "Failed: {}", msg),
        }
    }
}

/// Component type
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum Component {
    NodeJs,
    Cmake,
    OpenClaw,
}

impl fmt::Display for Component {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Component::NodeJs => write!(f, "Node.js"),
            Component::Cmake => write!(f, "CMake"),
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

/// Installation progress
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InstallProgress {
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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_install_status_display() {
        assert_eq!(InstallStatus::NotInstalled.to_string(), "Not Installed");
        assert_eq!(InstallStatus::Installed.to_string(), "Installed");
        assert_eq!(
            InstallStatus::Failed("error".to_string()).to_string(),
            "Failed: error"
        );
    }

    #[test]
    fn test_component_display() {
        assert_eq!(Component::NodeJs.to_string(), "Node.js");
        assert_eq!(Component::Cmake.to_string(), "CMake");
        assert_eq!(Component::OpenClaw.to_string(), "OpenClaw");
    }
}
