use crate::installer::Installer;
use crate::types::Component;
use std::process::Command;

/// CMake installer
pub struct CmakeInstaller;

impl CmakeInstaller {
    /// Create a new CMake installer
    pub fn new() -> Self {
        Self
    }
}

impl Default for CmakeInstaller {
    fn default() -> Self {
        Self::new()
    }
}

impl Installer for CmakeInstaller {
    fn component(&self) -> Component {
        Component::Cmake
    }

    fn is_installed(&self) -> bool {
        which::which("cmake").is_ok()
    }

    fn version(&self) -> Option<String> {
        Command::new("cmake")
            .arg("--version")
            .output()
            .ok()
            .and_then(|output| {
                if output.status.success() {
                    String::from_utf8(output.stdout)
                        .ok()
                        .and_then(|s| s.lines().next().map(|l| l.to_string()))
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
    fn test_cmake_installer_creation() {
        let installer = CmakeInstaller::new();
        assert_eq!(installer.component(), Component::Cmake);
    }
}
