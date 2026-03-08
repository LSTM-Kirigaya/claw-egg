use crate::types::{Component, EnvironmentCheck};
use std::process::Command;

/// Detects system environment and installed components
pub struct EnvironmentDetector;

impl EnvironmentDetector {
    /// Create a new environment detector
    pub fn new() -> Self {
        Self
    }

    /// Check if Node.js is installed
    pub fn check_nodejs(&self) -> EnvironmentCheck {
        match which::which("node") {
            Ok(path) => {
                let version = self.get_node_version();
                EnvironmentCheck {
                    component: Component::NodeJs,
                    installed: true,
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



    /// Check if OpenClaw is installed
    pub fn check_openclaw(&self) -> EnvironmentCheck {
        match which::which("openclaw") {
            Ok(path) => {
                let version = self.get_openclaw_version();
                EnvironmentCheck {
                    component: Component::OpenClaw,
                    installed: true,
                    version,
                    path: Some(path.to_string_lossy().to_string()),
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



    fn get_openclaw_version(&self) -> Option<String> {
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

}
