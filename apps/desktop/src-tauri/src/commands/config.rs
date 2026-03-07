use claw_egg_installer::types::OpenClawConfig;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::command;

const CONFIG_FILE: &str = "openclaw_config.json";

fn get_config_path() -> Result<PathBuf, String> {
    let home = std::env::var("HOME")
        .or_else(|_| std::env::var("USERPROFILE"))
        .map_err(|_| "Could not find home directory")?;
    Ok(PathBuf::from(home).join(".clawegg").join(CONFIG_FILE))
}

/// Save OpenClaw configuration
#[command]
pub fn save_config(config: OpenClawConfig) -> Result<(), String> {
    let config_path = get_config_path()?;

    // Ensure parent directory exists
    if let Some(parent) = config_path.parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }

    let json = serde_json::to_string_pretty(&config).map_err(|e| e.to_string())?;
    fs::write(config_path, json).map_err(|e| e.to_string())?;

    Ok(())
}

/// Load OpenClaw configuration
#[command]
pub fn load_config() -> Result<OpenClawConfig, String> {
    let config_path = get_config_path()?;

    if !config_path.exists() {
        return Ok(OpenClawConfig::default());
    }

    let json = fs::read_to_string(config_path).map_err(|e| e.to_string())?;
    let config: OpenClawConfig = serde_json::from_str(&json).map_err(|e| e.to_string())?;

    Ok(config)
}
