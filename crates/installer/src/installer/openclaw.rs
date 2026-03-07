use crate::installer::Installer;
use crate::types::{Component, OpenClawConfig};
use std::process::Command;

/// OpenClaw installer
pub struct OpenClawInstaller {
    _config: OpenClawConfig,
}

impl OpenClawInstaller {
    /// Create a new OpenClaw installer
    pub fn new() -> Self {
        Self {
            _config: OpenClawConfig::default(),
        }
    }

    /// Create a new OpenClaw installer with configuration
    pub fn with_config(config: OpenClawConfig) -> Self {
        Self { _config: config }
    }
}

impl Default for OpenClawInstaller {
    fn default() -> Self {
        Self::new()
    }
}

impl Installer for OpenClawInstaller {
    fn component(&self) -> Component {
        Component::OpenClaw
    }

    fn is_installed(&self) -> bool {
        which::which("openclaw").is_ok()
    }

    fn version(&self) -> Option<String> {
        Command::new("openclaw")
            .arg("--version")
            .output()
            .ok()
            .and_then(|output| {
                if output.status.success() {
                    String::from_utf8(output.stdout)
                        .ok()
                        .map(|s| s.trim().to_string())
                } else {
                    None
                }
            })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_openclaw_installer_creation() {
        let installer = OpenClawInstaller::new();
        assert_eq!(installer.component(), Component::OpenClaw);
    }

    #[test]
    fn test_openclaw_installer_with_config() {
        let config = OpenClawConfig {
            app_id: "test_app_id".to_string(),
            app_secret: "test_secret".to_string(),
            domain: "feishu.cn".to_string(),
            model_provider: "qwen".to_string(),
            model_name: "qwen-turbo".to_string(),
        };
        let installer = OpenClawInstaller::with_config(config);
        assert_eq!(installer.component(), Component::OpenClaw);
    }
}
