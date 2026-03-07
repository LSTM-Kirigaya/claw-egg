//! ClawEgg Installer Library
//!
//! This crate provides functionality to:
//! - Detect system environment
//! - Download and install Node.js (with China mirror support)
//! - Install Qwen CLI and OpenClaw via npm
//! - Orchestrate the entire installation flow with progress tracking

use std::path::PathBuf;

pub mod detector;
pub mod downloader;
pub mod installer;
pub mod orchestrator;
pub mod types;

pub use detector::EnvironmentDetector;
pub use downloader::{download_file_with_progress, download_nodejs, DownloadConfig};
pub use installer::{NodeInstaller, OpenClawInstaller};
pub use orchestrator::InstallOrchestrator;
pub use types::*;

/// Get the default installation directory for ClawEgg
pub fn get_default_install_dir() -> anyhow::Result<PathBuf> {
    let home = std::env::var("HOME")
        .or_else(|_| std::env::var("USERPROFILE"))
        .map_err(|_| anyhow::anyhow!("Could not find home directory"))?;
    Ok(PathBuf::from(home).join(".clawegg"))
}

/// Get the Node.js installation directory
pub fn get_nodejs_install_dir() -> anyhow::Result<PathBuf> {
    Ok(get_default_install_dir()?.join("nodejs"))
}

/// Check if running in China (for mirror selection)
pub fn is_in_china() -> bool {
    DownloadConfig::detect_china_network()
}

/// Get the version of this library
pub fn version() -> &'static str {
    env!("CARGO_PKG_VERSION")
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_version() {
        assert!(!version().is_empty());
    }

    #[test]
    fn test_get_default_install_dir() {
        // Should not panic
        let _ = get_default_install_dir();
    }

    #[test]
    fn test_get_nodejs_install_dir() {
        // Should not panic
        let _ = get_nodejs_install_dir();
    }
}
