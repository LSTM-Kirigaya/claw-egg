//! Configuration management for OpenClaw
//!
//! Reads and writes configuration to ~/.openclaw/openclaw.json

use crate::types::{
    OpenClawConfig, PlatformConfigs
};
use std::path::PathBuf;

const OPENCLAW_CONFIG_DIR: &str = ".openclaw";
const OPENCLAW_CONFIG_FILE: &str = "openclaw.json";

/// Get the path to OpenClaw configuration directory
pub fn get_openclaw_config_dir() -> anyhow::Result<PathBuf> {
    let home = std::env::var("HOME")
        .or_else(|_| std::env::var("USERPROFILE"))?;
    Ok(PathBuf::from(home).join(OPENCLAW_CONFIG_DIR))
}

/// Get the path to OpenClaw configuration file
pub fn get_openclaw_config_path() -> anyhow::Result<PathBuf> {
    Ok(get_openclaw_config_dir()?.join(OPENCLAW_CONFIG_FILE))
}

/// Check if OpenClaw configuration file exists
pub fn config_exists() -> bool {
    get_openclaw_config_path()
        .map(|p| p.exists())
        .unwrap_or(false)
}

/// Load OpenClaw configuration from ~/.openclaw/openclaw.json
/// Returns default config if file doesn't exist
pub fn load_openclaw_config() -> anyhow::Result<OpenClawConfig> {
    let config_path = get_openclaw_config_path()?;
    
    if !config_path.exists() {
        log::info!("OpenClaw config not found at {:?}, using defaults", config_path);
        return Ok(OpenClawConfig::default());
    }
    
    let content = std::fs::read_to_string(&config_path)
        .map_err(|e| anyhow::anyhow!("Failed to read config file: {}", e))?;
    
    let config: OpenClawConfig = serde_json::from_str(&content)
        .map_err(|e| anyhow::anyhow!("Failed to parse config file: {}", e))?;
    
    log::info!("Loaded OpenClaw config from {:?}", config_path);
    Ok(config)
}

/// Save OpenClaw configuration to ~/.openclaw/openclaw.json
pub fn save_openclaw_config(config: &OpenClawConfig) -> anyhow::Result<()> {
    let config_path = get_openclaw_config_path()?;
    
    // Ensure parent directory exists
    if let Some(parent) = config_path.parent() {
        std::fs::create_dir_all(parent)
            .map_err(|e| anyhow::anyhow!("Failed to create config directory: {}", e))?;
    }
    
    let content = serde_json::to_string_pretty(config)
        .map_err(|e| anyhow::anyhow!("Failed to serialize config: {}", e))?;
    
    std::fs::write(&config_path, content)
        .map_err(|e| anyhow::anyhow!("Failed to write config file: {}", e))?;
    
    log::info!("Saved OpenClaw config to {:?}", config_path);
    Ok(())
}

/// Merge configuration updates into existing config
/// Preserves existing values when updates are None or empty
pub fn merge_config(existing: &OpenClawConfig, updates: OpenClawConfig) -> OpenClawConfig {
    OpenClawConfig {
        platform_type: updates.platform_type.or_else(|| existing.platform_type.clone()),
        platform_configs: merge_platform_configs(
            existing.platform_configs.as_ref(),
            updates.platform_configs
        ),
        app_id: merge_option_string(existing.app_id.clone(), updates.app_id),
        app_secret: merge_option_string(existing.app_secret.clone(), updates.app_secret),
        domain: merge_option_string(existing.domain.clone(), updates.domain),
        model_provider: merge_option_string(existing.model_provider.clone(), updates.model_provider),
        model_name: merge_option_string(existing.model_name.clone(), updates.model_name),
        api_key: updates.api_key.or_else(|| existing.api_key.clone()),
        base_url: updates.base_url.or_else(|| existing.base_url.clone()),
        env: merge_hashmap(existing.env.clone(), updates.env),
        agents: updates.agents.or_else(|| existing.agents.clone()),
        models: updates.models.or_else(|| existing.models.clone()),
    }
}

/// Merge hash maps
fn merge_hashmap(
    existing: Option<std::collections::HashMap<String, String>>,
    updates: Option<std::collections::HashMap<String, String>>,
) -> Option<std::collections::HashMap<String, String>> {
    match (existing, updates) {
        (Some(mut e), Some(u)) => {
            for (k, v) in u {
                if !v.is_empty() {
                    e.insert(k, v);
                }
            }
            Some(e)
        }
        (None, Some(u)) => Some(u),
        (Some(e), None) => Some(e),
        (None, None) => None,
    }
}

/// Merge platform configs, preserving existing values
fn merge_platform_configs(
    existing: Option<&PlatformConfigs>,
    updates: Option<PlatformConfigs>
) -> Option<PlatformConfigs> {
    match (existing, updates) {
        (Some(e), Some(u)) => Some(PlatformConfigs {
            feishu: u.feishu.or_else(|| e.feishu.clone()),
            discord: u.discord.or_else(|| e.discord.clone()),
            telegram: u.telegram.or_else(|| e.telegram.clone()),
            qq_official: u.qq_official.or_else(|| e.qq_official.clone()),
            qq_onebot: u.qq_onebot.or_else(|| e.qq_onebot.clone()),
        }),
        (None, Some(u)) => Some(u),
        (Some(e), None) => Some(e.clone()),
        (None, None) => None,
    }
}

/// Merge option strings, treating empty string as None
fn merge_option_string(existing: Option<String>, update: Option<String>) -> Option<String> {
    match update {
        Some(s) if !s.is_empty() => Some(s),
        Some(_) => existing,
        None => existing,
    }
}

/// Get the OpenClaw installation directory
pub fn get_openclaw_install_dir() -> anyhow::Result<PathBuf> {
    // Try to find openclaw executable
    if let Ok(path) = which::which("openclaw") {
        // Get parent directory of the executable
        if let Some(parent) = path.parent() {
            return Ok(parent.to_path_buf());
        }
    }
    
    // Fallback to default location
    let home = std::env::var("HOME")
        .or_else(|_| std::env::var("USERPROFILE"))?;
    Ok(PathBuf::from(home).join(".openclaw"))
}

/// Plugin configuration structure
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct PluginConfig {
    pub name: String,
    pub version: String,
    pub enabled: bool,
    pub settings: serde_json::Value,
}

/// Get plugin configuration from OpenClaw config
pub fn get_plugin_configs() -> anyhow::Result<Vec<PluginConfig>> {
    let _config = load_openclaw_config()?;
    
    // Read plugins from config file
    let config_path = get_openclaw_config_path()?;
    if !config_path.exists() {
        return Ok(Vec::new());
    }
    
    let content = std::fs::read_to_string(config_path)?;
    let json: serde_json::Value = serde_json::from_str(&content)?;
    
    // Extract plugins array if present
    if let Some(plugins) = json.get("plugins").and_then(|p| p.as_array()) {
        let plugin_configs: Vec<PluginConfig> = plugins
            .iter()
            .filter_map(|p| serde_json::from_value(p.clone()).ok())
            .collect();
        Ok(plugin_configs)
    } else {
        Ok(Vec::new())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::types::{PlatformType, FeishuConfig, DiscordConfig};

    #[test]
    fn test_config_paths() {
        // These should not panic
        let _ = get_openclaw_config_dir();
        let _ = get_openclaw_config_path();
    }

    #[test]
    fn test_merge_config() {
        let existing = OpenClawConfig {
            platform_type: Some(PlatformType::Feishu),
            platform_configs: Some(PlatformConfigs {
                feishu: Some(FeishuConfig {
                    app_id: "existing_id".to_string(),
                    app_secret: "existing_secret".to_string(),
                    domain: "feishu.cn".to_string(),
                }),
                ..Default::default()
            }),
            app_id: Some("legacy_id".to_string()),
            app_secret: Some("legacy_secret".to_string()),
            domain: Some("feishu.cn".to_string()),
            model_provider: Some("qwen".to_string()),
            model_name: Some("qwen-turbo".to_string()),
            api_key: Some("key".to_string()),
            base_url: None,
        };

        let updates = OpenClawConfig {
            platform_type: Some(PlatformType::Discord),
            platform_configs: Some(PlatformConfigs {
                discord: Some(DiscordConfig {
                    bot_token: "new_token".to_string(),
                    client_id: "client_id".to_string(),
                    client_secret: "client_secret".to_string(),
                    guild_id: None,
                }),
                ..Default::default()
            }),
            app_id: Some("new_id".to_string()),
            app_secret: Some("".to_string()), // Empty, should keep existing
            domain: Some("".to_string()),     // Empty, should keep existing
            model_provider: Some("openai".to_string()),
            model_name: Some("gpt-4".to_string()),
            api_key: Some("new_key".to_string()),
            base_url: Some("https://api.openai.com".to_string()),
        };

        let merged = merge_config(&existing, updates);

        assert_eq!(merged.platform_type, Some(PlatformType::Discord));
        assert_eq!(merged.app_id, Some("new_id".to_string()));
        assert_eq!(merged.app_secret, Some("legacy_secret".to_string())); // Kept existing
        assert_eq!(merged.domain, Some("feishu.cn".to_string())); // Kept existing
        assert_eq!(merged.model_provider, Some("openai".to_string()));
        assert_eq!(merged.model_name, Some("gpt-4".to_string()));
        assert_eq!(merged.api_key, Some("new_key".to_string()));
        assert_eq!(merged.base_url, Some("https://api.openai.com".to_string()));
    }

    #[test]
    fn test_merge_config_with_empty_updates() {
        let existing = OpenClawConfig {
            platform_type: Some(PlatformType::Feishu),
            platform_configs: None,
            app_id: Some("existing_id".to_string()),
            app_secret: Some("existing_secret".to_string()),
            domain: Some("feishu.cn".to_string()),
            model_provider: Some("qwen".to_string()),
            model_name: Some("qwen-turbo".to_string()),
            api_key: Some("key".to_string()),
            base_url: Some("https://api.example.com".to_string()),
        };

        let updates = OpenClawConfig::default();
        let merged = merge_config(&existing, updates);

        assert_eq!(merged.platform_type, Some(PlatformType::Feishu));
        assert_eq!(merged.app_id, Some("existing_id".to_string()));
        assert_eq!(merged.app_secret, Some("existing_secret".to_string()));
        assert_eq!(merged.domain, Some("feishu.cn".to_string()));
        assert_eq!(merged.model_provider, Some("qwen".to_string()));
        assert_eq!(merged.model_name, Some("qwen-turbo".to_string()));
        assert_eq!(merged.api_key, Some("key".to_string()));
        assert_eq!(merged.base_url, Some("https://api.example.com".to_string()));
    }

    #[test]
    fn test_legacy_config_migration() {
        let mut config = OpenClawConfig {
            platform_type: None,
            platform_configs: None,
            app_id: Some("legacy_id".to_string()),
            app_secret: Some("legacy_secret".to_string()),
            domain: Some("feishu.cn".to_string()),
            model_provider: Some("qwen".to_string()),
            model_name: Some("qwen-turbo".to_string()),
            api_key: None,
            base_url: None,
        };

        assert!(config.is_legacy_config());
        config.migrate_if_needed();
        assert_eq!(config.platform_type, Some(PlatformType::Feishu));
        assert!(config.platform_configs.is_some());
        
        let feishu_config = config.platform_configs.unwrap().feishu.unwrap();
        assert_eq!(feishu_config.app_id, "legacy_id");
        assert_eq!(feishu_config.app_secret, "legacy_secret");
        assert_eq!(feishu_config.domain, "feishu.cn");
    }
}
