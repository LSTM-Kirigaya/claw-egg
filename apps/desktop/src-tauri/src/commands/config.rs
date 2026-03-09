use claw_egg_installer::config as openclaw_config;
use claw_egg_installer::types::OpenClawConfig;
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

/// Save OpenClaw configuration to 龙虾孵化器 config
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

/// Load OpenClaw configuration from 龙虾孵化器 config
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

/// Load OpenClaw configuration from ~/.openclaw/openclaw.json
/// This reads the actual OpenClaw configuration file
/// Automatically migrates legacy configs and handles missing fields gracefully
#[command]
pub fn load_openclaw_config() -> Result<OpenClawConfig, String> {
    let mut config = openclaw_config::load_openclaw_config()
        .map_err(|e| e.to_string())?;
    
    // Migrate legacy config if needed
    config.migrate_if_needed();
    
    Ok(config)
}

/// Save OpenClaw configuration to ~/.openclaw/openclaw.json
/// This updates the actual OpenClaw configuration file
#[command]
pub fn save_openclaw_config(config: OpenClawConfig) -> Result<(), String> {
    openclaw_config::save_openclaw_config(&config)
        .map_err(|e| e.to_string())
}

/// Check if OpenClaw configuration exists
#[command]
pub fn openclaw_config_exists() -> bool {
    openclaw_config::config_exists()
}

/// Get plugin configurations from OpenClaw
#[command]
pub fn get_plugin_configs() -> Result<Vec<openclaw_config::PluginConfig>, String> {
    openclaw_config::get_plugin_configs()
        .map_err(|e| e.to_string())
}
