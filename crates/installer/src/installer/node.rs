use crate::installer::Installer;
use crate::types::Component;
use std::process::Command;

/// Node.js installer
pub struct NodeInstaller;

impl NodeInstaller {
    /// Create a new Node.js installer
    pub fn new() -> Self {
        Self
    }

    /// Check if a specific Node.js version is installed
    pub fn check_version(&self, major_version: u32) -> bool {
        if let Ok(output) = Command::new("node").arg("--version").output() {
            if output.status.success() {
                if let Ok(version) = String::from_utf8(output.stdout) {
                    let version = version.trim();
                    // Parse version like "v22.11.0"
                    if let Some(v) = version.strip_prefix('v') {
                        if let Some(major) = v.split('.').next() {
                            if let Ok(major_num) = major.parse::<u32>() {
                                return major_num >= major_version;
                            }
                        }
                    }
                }
            }
        }
        false
    }
}

impl Default for NodeInstaller {
    fn default() -> Self {
        Self::new()
    }
}

impl Installer for NodeInstaller {
    fn component(&self) -> Component {
        Component::NodeJs
    }

    fn is_installed(&self) -> bool {
        which::which("node").is_ok()
    }

    fn version(&self) -> Option<String> {
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
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_node_installer_creation() {
        let installer = NodeInstaller::new();
        assert_eq!(installer.component(), Component::NodeJs);
    }

    #[test]
    fn test_node_installer_check_version_format() {
        let installer = NodeInstaller::new();
        // This test is idempotent - it just checks the version format logic
        // doesn't panic, regardless of whether node is installed
        let _ = installer.version();
    }
}
