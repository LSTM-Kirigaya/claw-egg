//! SSH 远程命令执行与文件读写
//!
//! 使用系统 ssh 命令执行远程操作

use crate::settings::{RuntimeEnvironment, RuntimeEnvironmentSettings, SshConfig};
use std::process::{Command, Stdio};

/// 从设置中获取当前环境
pub fn get_current_environment(settings: &RuntimeEnvironmentSettings) -> Option<&RuntimeEnvironment> {
    settings
        .environments
        .iter()
        .find(|e| e.id == settings.current_environment_id)
}

/// 解析 SSH 目标：从 SshConfig 构建 ssh 命令参数
/// 返回 (args_before_target, target) 其中 target 是 "user@host" 形式
fn build_ssh_target(config: &SshConfig) -> anyhow::Result<(Vec<String>, String)> {
    let mut args = Vec::new();

    if let Some(ref cmd) = config.ssh_command {
        // 解析完整 SSH 命令，如 "ssh user@host -p 22" 或 "ssh -i ~/.ssh/id_rsa user@host"
        let parts: Vec<&str> = cmd.split_whitespace().collect();
        let mut user_host = None;
        for (i, part) in parts.iter().enumerate() {
            if *part == "ssh" {
                continue;
            }
            if part.starts_with("-") {
                if *part == "-p" && i + 1 < parts.len() {
                    args.push("-p".to_string());
                    args.push(parts[i + 1].to_string());
                } else if *part == "-i" && i + 1 < parts.len() {
                    args.push("-i".to_string());
                    args.push(parts[i + 1].to_string());
                } else if !part.starts_with("-p") && !part.starts_with("-i") {
                    args.push((*part).to_string());
                }
            } else if part.contains('@') && !part.starts_with('-') {
                user_host = Some((*part).to_string());
            }
        }
        if let Some(uh) = user_host {
            return Ok((args, uh));
        }
        return Err(anyhow::anyhow!("无法从 SSH 命令解析 user@host: {}", cmd));
    }

    // 分参数模式
    let host = config
        .host
        .as_ref()
        .ok_or_else(|| anyhow::anyhow!("SSH 配置缺少 host"))?;
    let port = config.port.unwrap_or(22);
    let user = config
        .user
        .as_deref()
        .unwrap_or("root")
        .to_string();

    args.push("-p".to_string());
    args.push(port.to_string());

    if let Some(ref key) = config.identity_file {
        args.push("-i".to_string());
        args.push(key.clone());
    }

    let target = format!("{}@{}", user, host);
    Ok((args, target))
}

/// 在远程环境执行命令
pub fn run_remote_command(
    env: &RuntimeEnvironment,
    command: &str,
) -> anyhow::Result<(bool, String, String)> {
    let config = env
        .ssh_config
        .as_ref()
        .ok_or_else(|| anyhow::anyhow!("远程环境缺少 SSH 配置"))?;

    let (ssh_args, target) = build_ssh_target(config)?;

    let mut cmd = Command::new("ssh");
    cmd.args(&["-o", "BatchMode=yes", "-o", "ConnectTimeout=10"])
        .args(&ssh_args)
        .arg(&target)
        .arg(command)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped());

    let output = cmd.output()?;
    let stdout = String::from_utf8_lossy(&output.stdout).to_string();
    let stderr = String::from_utf8_lossy(&output.stderr).to_string();

    Ok((output.status.success(), stdout, stderr))
}

/// 读取远程文件内容
pub fn read_remote_file(env: &RuntimeEnvironment, remote_path: &str) -> anyhow::Result<String> {
    let config = env
        .ssh_config
        .as_ref()
        .ok_or_else(|| anyhow::anyhow!("远程环境缺少 SSH 配置"))?;

    let (ssh_args, target) = build_ssh_target(config)?;

    let mut cmd = Command::new("ssh");
    cmd.args(&["-o", "BatchMode=yes", "-o", "ConnectTimeout=10"])
        .args(&ssh_args)
        .arg(&target)
        .arg(format!("cat {}", escape_remote_path(remote_path)))
        .stdout(Stdio::piped())
        .stderr(Stdio::piped());

    let output = cmd.output()?;
    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(anyhow::anyhow!("读取远程文件失败: {}", stderr));
    }

    Ok(String::from_utf8_lossy(&output.stdout).to_string())
}

/// 写入内容到远程文件
pub fn write_remote_file(
    env: &RuntimeEnvironment,
    remote_path: &str,
    content: &str,
) -> anyhow::Result<()> {
    let config = env
        .ssh_config
        .as_ref()
        .ok_or_else(|| anyhow::anyhow!("远程环境缺少 SSH 配置"))?;

    let (ssh_args, target) = build_ssh_target(config)?;

    // 使用 base64 编码内容避免 shell 转义问题（macOS/Linux 均有 base64 命令）
    use base64::Engine;
    let encoded = base64::engine::general_purpose::STANDARD.encode(content.as_bytes());
    let path_escaped = escape_remote_path(remote_path);
    let encoded_escaped = escape_remote_path(&encoded);
    let remote_cmd = format!(
        "mkdir -p $(dirname {}) && echo {} | base64 -d > {}",
        path_escaped, encoded_escaped, path_escaped
    );

    let mut cmd = Command::new("ssh");
    cmd.args(&["-o", "BatchMode=yes", "-o", "ConnectTimeout=10"])
        .args(&ssh_args)
        .arg(&target)
        .arg(remote_cmd)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped());

    let output = cmd.output()?;
    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(anyhow::anyhow!("写入远程文件失败: {}", stderr));
    }

    Ok(())
}

/// 转义远程路径中的特殊字符（用于 bash 单引号内）
fn escape_remote_path(path: &str) -> String {
    let mut result = String::with_capacity(path.len() + 4);
    result.push('\'');
    for c in path.chars() {
        if c == '\'' {
            result.push_str("'\\''");
        } else {
            result.push(c);
        }
    }
    result.push('\'');
    result
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_escape_remote_path() {
        assert_eq!(escape_remote_path("/home/user/.openclaw/config"), "'/home/user/.openclaw/config'");
    }
}
