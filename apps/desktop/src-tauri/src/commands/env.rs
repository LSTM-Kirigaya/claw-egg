use claw_egg_installer::detector::EnvironmentDetector;
use serde::{Deserialize, Serialize};
use tauri::command;

/// System information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SystemInfo {
    pub platform: String,
    pub arch: String,
    pub version: String,
}

/// Check environment for all components
#[command]
pub fn check_environment() -> Vec<claw_egg_installer::types::EnvironmentCheck> {
    let detector = EnvironmentDetector::new();
    detector.check_all()
}

/// Get system information
#[command]
pub fn get_system_info() -> SystemInfo {
    SystemInfo {
        platform: std::env::consts::OS.to_string(),
        arch: std::env::consts::ARCH.to_string(),
        version: env!("CARGO_PKG_VERSION").to_string(),
    }
}
