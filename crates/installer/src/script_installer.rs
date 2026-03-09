//! 使用 clawd.org.cn 官方安装脚本进行一键安装
//!
//! MacOS/Linux: curl -fsSL https://clawd.org.cn/install.sh | bash -s -- --registry <url>
//! Windows: PowerShell -NoProfile -ExecutionPolicy Bypass -File install.ps1 -Registry <url>

use crate::types::{InstallStage, OverallProgress};
use std::path::PathBuf;
use tokio::process::Command;

const INSTALL_SH_URL: &str = "https://clawd.org.cn/install.sh";
const INSTALL_PS1_URL: &str = "https://clawd.org.cn/install.ps1";

const REGISTRY_NPMMIRROR: &str = "https://registry.npmmirror.com";
const REGISTRY_NPMJS: &str = "https://registry.npmjs.org";

/// 获取 npm registry URL
pub fn get_registry_url(use_china_mirror: bool) -> &'static str {
    if use_china_mirror {
        REGISTRY_NPMMIRROR
    } else {
        REGISTRY_NPMJS
    }
}

/// 下载安装脚本到临时目录
pub async fn download_install_script() -> anyhow::Result<PathBuf> {
    let temp_dir = std::env::temp_dir().join("clawegg");
    std::fs::create_dir_all(&temp_dir)?;

    let (url, filename) = if cfg!(target_os = "windows") {
        (INSTALL_PS1_URL, "install.ps1")
    } else {
        (INSTALL_SH_URL, "install.sh")
    };

    let dest = temp_dir.join(filename);
    log::info!("Downloading install script from {} to {:?}", url, dest);

    let client = reqwest::Client::builder()
        .user_agent("龙虾孵化器/0.1.0")
        .build()?;

    let response = client.get(url).send().await?;
    response.error_for_status_ref()?;

    let content = response.text().await?;
    std::fs::write(&dest, content)?;

    log::info!("Install script saved to {:?}", dest);
    Ok(dest)
}

/// 执行 MacOS/Linux 安装脚本
#[cfg(not(target_os = "windows"))]
pub async fn run_install_script(
    script_path: &std::path::Path,
    use_china_mirror: bool,
    report_progress: &impl Fn(OverallProgress),
) -> anyhow::Result<()> {
    let registry = get_registry_url(use_china_mirror);

    report_progress(
        OverallProgress::new(InstallStage::EnvironmentCheck, 0, "准备执行安装脚本...")
            .with_detail("阶段 1/4"),
    );

    let mut child = Command::new("bash")
        .arg(script_path)
        .arg("--no-prompt")
        .arg("--no-onboard")
        .arg("--registry")
        .arg(registry)
        .stdout(std::process::Stdio::piped())
        .stderr(std::process::Stdio::piped())
        .spawn()?;

    report_progress(
        OverallProgress::new(InstallStage::DownloadNodeJs, 30, "正在安装 Node.js 和 OpenClaw...")
            .with_detail("阶段 2/4"),
    );

    let status = child.wait().await?;

    if status.success() {
        report_progress(
            OverallProgress::new(InstallStage::InstallOpenClaw, 100, "OpenClaw 安装完成")
                .with_detail("阶段 3/4"),
        );
        Ok(())
    } else {
        let mut stderr = String::new();
        if let Some(mut s) = child.stderr.take() {
            use tokio::io::AsyncReadExt;
            let _ = s.read_to_string(&mut stderr).await;
        }
        Err(anyhow::anyhow!(
            "安装脚本执行失败 (exit code: {}): {}",
            status.code().unwrap_or(-1),
            stderr
        ))
    }
}

/// 执行 Windows 安装脚本
#[cfg(target_os = "windows")]
pub async fn run_install_script(
    script_path: &std::path::Path,
    use_china_mirror: bool,
    report_progress: &impl Fn(OverallProgress),
) -> anyhow::Result<()> {
    let registry = get_registry_url(use_china_mirror);

    report_progress(
        OverallProgress::new(InstallStage::EnvironmentCheck, 0, "准备执行安装脚本...")
            .with_detail("阶段 1/4"),
    );

    let mut child = Command::new("powershell")
        .args([
            "-NoProfile",
            "-ExecutionPolicy",
            "Bypass",
            "-File",
            script_path.to_str().unwrap(),
            "-NoPrompt",
            "-NoOnboard",
            "-Registry",
            registry,
        ])
        .stdout(std::process::Stdio::piped())
        .stderr(std::process::Stdio::piped())
        .spawn()?;

    report_progress(
        OverallProgress::new(InstallStage::DownloadNodeJs, 30, "正在安装 Node.js 和 OpenClaw...")
            .with_detail("阶段 2/4"),
    );

    let status = child.wait().await?;

    if status.success() {
        report_progress(
            OverallProgress::new(InstallStage::InstallOpenClaw, 100, "OpenClaw 安装完成")
                .with_detail("阶段 3/4"),
        );
        Ok(())
    } else {
        let mut stderr = String::new();
        if let Some(mut s) = child.stderr.take() {
            use tokio::io::AsyncReadExt;
            let _ = s.read_to_string(&mut stderr).await;
        }
        Err(anyhow::anyhow!(
            "安装脚本执行失败 (exit code: {}): {}",
            status.code().unwrap_or(-1),
            stderr
        ))
    }
}
