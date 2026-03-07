//! Core installer library for OpenClaw
//!
//! This crate provides functionality to:
//! - Detect system environment
//! - Install dependencies (Node.js, CMake, etc.)
//! - Install and configure OpenClaw

use std::path::PathBuf;

pub mod detector;
pub mod installer;
pub mod types;

pub use detector::EnvironmentDetector;
pub use installer::{CmakeInstaller, NodeInstaller, OpenClawInstaller};
pub use types::*;

/// Get the default installation directory for OpenClaw
pub fn get_default_install_dir() -> anyhow::Result<PathBuf> {
    // Get home directory from environment variable
    let home = std::env::var("HOME")
        .or_else(|_| std::env::var("USERPROFILE"))
        .map_err(|_| anyhow::anyhow!("Could not find home directory"))?;
    Ok(PathBuf::from(home).join(".openclaw"))
}

/// Check if OpenClaw is already installed
pub fn is_openclaw_installed() -> bool {
    if let Ok(install_dir) = get_default_install_dir() {
        install_dir.exists()
    } else {
        false
    }
}
