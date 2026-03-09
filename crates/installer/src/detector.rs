use crate::types::{Component, EnvironmentCheck};
use std::path::Path;
use std::process::Command;

/// Detects system environment and installed components
pub struct EnvironmentDetector;

impl EnvironmentDetector {
    /// Create a new environment detector
    pub fn new() -> Self {
        Self
    }

    /// Check if Node.js is installed and meets version requirements
    /// Requirements: >= 22 and even number (22, 24, 26, etc.)
    pub fn check_nodejs(&self) -> EnvironmentCheck {
        match which::which("node") {
            Ok(path) => {
                let version = self.get_node_version();
                let version_valid = version.as_ref().map(|v| Self::is_valid_node_version(v)).unwrap_or(false);
                
                EnvironmentCheck {
                    component: Component::NodeJs,
                    installed: version_valid,
                    version,
                    path: Some(path.to_string_lossy().to_string()),
                }
            }
            Err(_) => EnvironmentCheck {
                component: Component::NodeJs,
                installed: false,
                version: None,
                path: None,
            },
        }
    }

    /// Check if Node.js version meets requirements:
    /// - Major version >= 22
    /// - Major version must be even
    fn is_valid_node_version(version: &str) -> bool {
        // Parse version like "v22.11.0" or "22.11.0"
        let version = version.trim().trim_start_matches('v');
        
        if let Some(major_str) = version.split('.').next() {
            if let Ok(major) = major_str.parse::<u32>() {
                // Must be >= 22 and even
                return major >= 22 && major % 2 == 0;
            }
        }
        false
    }

    /// Check if OpenClaw 中文社区 (openclaw-cn) is installed
    /// 官方脚本安装的是 openclaw-cn，同时兼容 openclaw
    pub fn check_openclaw(&self) -> EnvironmentCheck {
        // 优先检测 openclaw-cn（官方脚本安装的包名）
        let path = which::which("openclaw-cn").or_else(|_| which::which("openclaw"));

        match path {
            Ok(p) => {
                let version = self.get_openclaw_version(&p);
                EnvironmentCheck {
                    component: Component::OpenClaw,
                    installed: true,
                    version,
                    path: Some(p.to_string_lossy().to_string()),
                }
            }
            Err(_) => EnvironmentCheck {
                component: Component::OpenClaw,
                installed: false,
                version: None,
                path: None,
            },
        }
    }

    /// Run all environment checks
    pub fn check_all(&self) -> Vec<EnvironmentCheck> {
        vec![
            self.check_nodejs(),
            self.check_openclaw(),
        ]
    }

    fn get_node_version(&self) -> Option<String> {
        Command::new("node")
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

    fn get_openclaw_version(&self, path: &Path) -> Option<String> {
        Command::new(path)
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

impl Default for EnvironmentDetector {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_detector_creation() {
        let detector = EnvironmentDetector::new();
        let checks = detector.check_all();
        assert_eq!(checks.len(), 2);
    }

    #[test]
    fn test_check_returns_valid_structure() {
        let detector = EnvironmentDetector::new();
        let node_check = detector.check_nodejs();

        // Structure should be valid regardless of whether node is installed
        assert_eq!(node_check.component, Component::NodeJs);
        // If installed, should have path
        if node_check.installed {
            assert!(node_check.path.is_some());
        }
    }

    #[test]
    fn test_valid_node_version() {
        // Valid versions (>= 22 and even)
        assert!(EnvironmentDetector::is_valid_node_version("v22.0.0"));
        assert!(EnvironmentDetector::is_valid_node_version("22.0.0"));
        assert!(EnvironmentDetector::is_valid_node_version("v22.11.0"));
        assert!(EnvironmentDetector::is_valid_node_version("v24.0.0"));
        assert!(EnvironmentDetector::is_valid_node_version("v26.1.0"));

        // Invalid versions (< 22 or odd)
        assert!(!EnvironmentDetector::is_valid_node_version("v20.0.0"));
        assert!(!EnvironmentDetector::is_valid_node_version("v18.0.0"));
        assert!(!EnvironmentDetector::is_valid_node_version("v23.0.0"));
        assert!(!EnvironmentDetector::is_valid_node_version("v21.0.0"));
        assert!(!EnvironmentDetector::is_valid_node_version("v25.0.0"));
    }
}
