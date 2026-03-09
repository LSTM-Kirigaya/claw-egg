//! 运行环境管理命令（本机 / 远程 SSH）

use claw_egg_installer::settings::{
    AppSettings, RuntimeEnvironment, RuntimeEnvironmentSettings, SshConfig,
};
use claw_egg_installer::ssh_runner;
use serde::{Deserialize, Serialize};
use tauri::command;
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize)]
pub struct RuntimeEnvironmentDto {
    pub id: String,
    pub name: String,
    pub env_type: String,
    pub ssh_config: Option<SshConfigDto>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SshConfigDto {
    pub ssh_command: Option<String>,
    pub host: Option<String>,
    pub port: Option<u16>,
    pub user: Option<String>,
    pub identity_file: Option<String>,
}

impl From<&RuntimeEnvironment> for RuntimeEnvironmentDto {
    fn from(e: &RuntimeEnvironment) -> Self {
        Self {
            id: e.id.clone(),
            name: e.name.clone(),
            env_type: e.env_type.clone(),
            ssh_config: e.ssh_config.as_ref().map(|s| SshConfigDto {
                ssh_command: s.ssh_command.clone(),
                host: s.host.clone(),
                port: s.port,
                user: s.user.clone(),
                identity_file: s.identity_file.clone(),
            }),
        }
    }
}

/// 获取运行环境列表及当前选中的环境
#[command]
pub fn get_runtime_environments() -> Result<RuntimeEnvironmentSettings, String> {
    let settings = AppSettings::load().map_err(|e| e.to_string())?;
    Ok(settings.runtime_environments)
}

/// 设置当前运行环境
#[command]
pub fn set_current_environment(environment_id: String) -> Result<(), String> {
    let mut settings = AppSettings::load().map_err(|e| e.to_string())?;
    if !settings
        .runtime_environments
        .environments
        .iter()
        .any(|e| e.id == environment_id)
    {
        return Err("环境不存在".to_string());
    }
    settings.runtime_environments.current_environment_id = environment_id;
    settings.save().map_err(|e| e.to_string())
}

/// 添加远程运行环境
#[command]
pub fn add_runtime_environment(
    name: String,
    ssh_command: Option<String>,
    host: Option<String>,
    port: Option<u16>,
    user: Option<String>,
    identity_file: Option<String>,
) -> Result<RuntimeEnvironmentDto, String> {
    let mut settings = AppSettings::load().map_err(|e| e.to_string())?;

    let ssh_config = if let Some(cmd) = ssh_command {
        if cmd.trim().is_empty() {
            return Err("SSH 命令不能为空".to_string());
        }
        Some(SshConfig {
            ssh_command: Some(cmd.trim().to_string()),
            host: None,
            port: None,
            user: None,
            identity_file: None,
        })
    } else if let Some(h) = host {
        if h.trim().is_empty() {
            return Err("主机地址不能为空".to_string());
        }
        Some(SshConfig {
            ssh_command: None,
            host: Some(h.trim().to_string()),
            port: port.or(Some(22)),
            user: user.filter(|u| !u.is_empty()),
            identity_file: identity_file.filter(|i| !i.is_empty()),
        })
    } else {
        return Err("请填写 SSH 命令或主机参数".to_string());
    };

    let id = format!("env-{}", Uuid::new_v4().simple());
    let env = RuntimeEnvironment {
        id: id.clone(),
        name: name.trim().to_string(),
        env_type: "remote".to_string(),
        ssh_config,
    };

    settings.runtime_environments.environments.push(env.clone());
    settings.save().map_err(|e| e.to_string())?;

    Ok(RuntimeEnvironmentDto::from(&env))
}

/// 更新远程运行环境
#[command]
pub fn update_runtime_environment(
    id: String,
    name: Option<String>,
    ssh_command: Option<String>,
    host: Option<String>,
    port: Option<u16>,
    user: Option<String>,
    identity_file: Option<String>,
) -> Result<RuntimeEnvironmentDto, String> {
    let mut settings = AppSettings::load().map_err(|e| e.to_string())?;

    let result = {
        let env = settings
            .runtime_environments
            .environments
            .iter_mut()
            .find(|e| e.id == id)
            .ok_or("环境不存在")?;

        if env.env_type != "remote" {
            return Err("只能修改远程环境".to_string());
        }

        if let Some(n) = name {
            env.name = n.trim().to_string();
        }

        if let Some(ref mut cfg) = env.ssh_config {
            if let Some(cmd) = ssh_command {
                if !cmd.trim().is_empty() {
                    cfg.ssh_command = Some(cmd.trim().to_string());
                    cfg.host = None;
                    cfg.port = None;
                    cfg.user = None;
                }
            } else if let Some(h) = host {
                if !h.trim().is_empty() {
                    cfg.ssh_command = None;
                    cfg.host = Some(h.trim().to_string());
                    cfg.port = port.or(Some(22));
                    cfg.user = user.filter(|u| !u.is_empty());
                    cfg.identity_file = identity_file.filter(|i| !i.is_empty());
                }
            }
        }

        RuntimeEnvironmentDto::from(&*env)
    };

    settings.save().map_err(|e| e.to_string())?;
    Ok(result)
}

/// 删除运行环境（不能删除本机）
#[command]
pub fn remove_runtime_environment(id: String) -> Result<(), String> {
    let mut settings = AppSettings::load().map_err(|e| e.to_string())?;

    if id == "local" {
        return Err("不能删除本机环境".to_string());
    }

    settings
        .runtime_environments
        .environments
        .retain(|e| e.id != id);

    if settings.runtime_environments.current_environment_id == id {
        settings.runtime_environments.current_environment_id = "local".to_string();
    }

    settings.save().map_err(|e| e.to_string())
}

/// 测试 SSH 连接
#[command]
pub fn test_ssh_connection(environment_id: String) -> Result<bool, String> {
    let settings = AppSettings::load().map_err(|e| e.to_string())?;
    let env = settings
        .runtime_environments
        .environments
        .iter()
        .find(|e| e.id == environment_id)
        .ok_or("环境不存在")?;

    if env.env_type != "remote" {
        return Ok(true);
    }

    let (success, _stdout, stderr) =
        ssh_runner::run_remote_command(env, "echo ok").map_err(|e| e.to_string())?;

    if !success {
        return Err(stderr);
    }
    Ok(true)
}
