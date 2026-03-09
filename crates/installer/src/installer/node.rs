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

    /// Check if Node.js version meets requirements:
    /// - Major version >= 22
    /// - Major version must be even
    /// 
    /// Returns true only if both conditions are met
    pub fn check_version_requirements(&self) -> bool {
        if let Some(version) = self.version() {
            Self::is_valid_node_version(&version)
        } else {
            false
        }
    }

    /// Parse and validate Node.js version string
    /// Requirements: >= 22 and even number
    pub fn is_valid_node_version(version: &str) -> bool {
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

    /// Get the major version number if valid
    pub fn get_major_version(&self) -> Option<u32> {
        self.version().and_then(|v| {
            let v = v.trim().trim_start_matches('v');
            v.split('.').next()?.parse::<u32>().ok()
        })
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
        // Node is considered "installed" only if it meets version requirements
        self.check_version_requirements()
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

    #[test]
    fn test_valid_node_version() {
        // Valid versions (>= 22 and even)
        assert!(NodeInstaller::is_valid_node_version("v22.0.0"));
        assert!(NodeInstaller::is_valid_node_version("22.0.0"));
        assert!(NodeInstaller::is_valid_node_version("v22.11.0"));
        assert!(NodeInstaller::is_valid_node_version("v24.0.0"));
        assert!(NodeInstaller::is_valid_node_version("v26.1.0"));

        // Invalid versions (< 22 or odd)
        assert!(!NodeInstaller::is_valid_node_version("v20.0.0"));
        assert!(!NodeInstaller::is_valid_node_version("v18.0.0"));
        assert!(!NodeInstaller::is_valid_node_version("v23.0.0"));
        assert!(!NodeInstaller::is_valid_node_version("v21.0.0"));
        assert!(!NodeInstaller::is_valid_node_version("v25.0.0"));
    }

    #[test]
    fn test_version_parsing() {
        assert!(NodeInstaller::is_valid_node_version("v22.0.0"));
        assert!(NodeInstaller::is_valid_node_version("22.11.0"));
        assert!(!NodeInstaller::is_valid_node_version("invalid"));
        assert!(!NodeInstaller::is_valid_node_version(""));
    }
}
