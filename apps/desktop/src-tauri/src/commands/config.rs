use claw_egg_installer::config as openclaw_config;
use claw_egg_installer::settings::AppSettings;
use claw_egg_installer::ssh_runner;
use claw_egg_installer::types::OpenClawConfig;
use std::fs;
use std::path::PathBuf;
use tauri::command;

const OPENCLAW_REMOTE_CONFIG_PATH: &str = "~/.openclaw/openclaw.json";

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
/// 根据当前运行环境：本机直接读取，远程通过 SSH 读取
#[command]
pub fn load_openclaw_config() -> Result<OpenClawConfig, String> {
    let settings = AppSettings::load().map_err(|e| e.to_string())?;
    let env = ssh_runner::get_current_environment(&settings.runtime_environments);

    let mut config = if let Some(env) = env {
        if env.env_type == "remote" {
            load_openclaw_config_remote(env)?
        } else {
            openclaw_config::load_openclaw_config().map_err(|e| e.to_string())?
        }
    } else {
        openclaw_config::load_openclaw_config().map_err(|e| e.to_string())?
    };

    config.migrate_if_needed();
    Ok(config)
}

/// Save OpenClaw configuration to ~/.openclaw/openclaw.json
/// 根据当前运行环境：本机直接写入，远程通过 SSH 写入
#[command]
pub fn save_openclaw_config(config: OpenClawConfig) -> Result<(), String> {
    let settings = AppSettings::load().map_err(|e| e.to_string())?;
    let env = ssh_runner::get_current_environment(&settings.runtime_environments);

    if let Some(env) = env {
        if env.env_type == "remote" {
            return save_openclaw_config_remote(env, &config);
        }
    }

    openclaw_config::save_openclaw_config(&config).map_err(|e| e.to_string())
}

fn load_openclaw_config_remote(env: &claw_egg_installer::settings::RuntimeEnvironment) -> Result<OpenClawConfig, String> {
    match ssh_runner::read_remote_file(env, OPENCLAW_REMOTE_CONFIG_PATH) {
        Ok(content) => {
            if content.trim().is_empty() {
                Ok(OpenClawConfig::default())
            } else {
                serde_json::from_str(&content).map_err(|e| e.to_string())
            }
        }
        Err(e) => {
            let err_str = e.to_string();
            if err_str.contains("No such file") || err_str.contains("not found") {
                Ok(OpenClawConfig::default())
            } else {
                Err(err_str)
            }
        }
    }
}

fn save_openclaw_config_remote(
    env: &claw_egg_installer::settings::RuntimeEnvironment,
    config: &OpenClawConfig,
) -> Result<(), String> {
    let content = serde_json::to_string_pretty(config).map_err(|e| e.to_string())?;
    ssh_runner::write_remote_file(env, OPENCLAW_REMOTE_CONFIG_PATH, &content).map_err(|e| e.to_string())
}

/// Check if OpenClaw configuration exists
#[command]
pub fn openclaw_config_exists() -> bool {
    openclaw_config::config_exists()
}

/// Install QQ OneBot plugin when user selects qq_onebot platform
/// Runs: openclaw plugins install @kirigaya/openclaw-onebot
/// TODO: 根据 @kirigaya/openclaw-onebot 的 README 自动完成配置（待提供可直接用的配置）
#[command]
pub async fn install_onebot_plugin() -> Result<(), String> {
    use std::process::Command;

    // Try openclaw from PATH first, then npx openclaw
    let output = if which::which("openclaw").is_ok() {
        Command::new("openclaw")
            .args(["plugins", "install", "@kirigaya/openclaw-onebot"])
            .output()
    } else {
        Command::new("npx")
            .args(["openclaw", "plugins", "install", "@kirigaya/openclaw-onebot"])
            .output()
    };

    match output {
        Ok(out) if out.status.success() => Ok(()),
        Ok(out) => {
            let stderr = String::from_utf8_lossy(&out.stderr);
            Err(format!("插件安装失败: {}", stderr))
        }
        Err(e) => Err(format!("执行失败: {}", e)),
    }
}

/// Get plugin configurations from OpenClaw
/// 根据当前运行环境读取配置
#[command]
pub fn get_plugin_configs() -> Result<Vec<openclaw_config::PluginConfig>, String> {
    let settings = AppSettings::load().map_err(|e| e.to_string())?;
    let env = ssh_runner::get_current_environment(&settings.runtime_environments);

    let content = if let Some(env) = env {
        if env.env_type == "remote" {
            ssh_runner::read_remote_file(env, OPENCLAW_REMOTE_CONFIG_PATH)
                .unwrap_or_else(|_| "{}".to_string())
        } else {
            let path = openclaw_config::get_openclaw_config_path().map_err(|e| e.to_string())?;
            std::fs::read_to_string(path).unwrap_or_else(|_| "{}".to_string())
        }
    } else {
        let path = openclaw_config::get_openclaw_config_path().map_err(|e| e.to_string())?;
        std::fs::read_to_string(path).unwrap_or_else(|_| "{}".to_string())
    };

    let json: serde_json::Value = serde_json::from_str(&content).unwrap_or(serde_json::json!({}));
    if let Some(plugins) = json.get("plugins").and_then(|p| p.as_array()) {
        let configs: Vec<openclaw_config::PluginConfig> = plugins
            .iter()
            .filter_map(|p| serde_json::from_value(p.clone()).ok())
            .collect();
        Ok(configs)
    } else {
        Ok(Vec::new())
    }
}
