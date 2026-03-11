//! 使用 clawd.org.cn 官方安装脚本进行一键安装
//!
//! MacOS/Linux: curl -fsSL https://clawd.org.cn/install.sh | bash -s -- --registry <url>
//! Windows: PowerShell -NoProfile -ExecutionPolicy Bypass -File install.ps1 -Registry <url>

use crate::types::{InstallStage, OverallProgress};
use std::path::PathBuf;
use std::sync::Arc;
use tokio::io::{AsyncBufReadExt, BufReader};
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
/// on_log: 可选的回调，用于实时推送命令行输出（用户可展开查看）
#[cfg(not(target_os = "windows"))]
pub async fn run_install_script(
    script_path: &std::path::Path,
    use_china_mirror: bool,
    report_progress: &impl Fn(OverallProgress),
    on_log: Option<Arc<dyn Fn(String) + Send + Sync>>,
) -> anyhow::Result<()> {
    let registry = get_registry_url(use_china_mirror);

    report_progress(
        OverallProgress::new(InstallStage::EnvironmentCheck, 0, "准备执行安装脚本...")
            .with_detail("阶段 1/4"),
    );

    let cmd_line = format!(
        "bash {} --no-prompt --no-onboard --registry {}",
        script_path.display(),
        registry
    );
    if let Some(ref cb) = on_log {
        cb(cmd_line.clone());
    }

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

    // 实时读取 stdout/stderr 并回调（必须读取否则子进程可能因管道满而阻塞）
    let (stdout, stderr) = (child.stdout.take(), child.stderr.take());
    let mut join_set = tokio::task::JoinSet::new();
    let on_log: Arc<dyn Fn(String) + Send + Sync> =
        on_log.unwrap_or_else(|| Arc::new(|_| ()));

    if let (Some(stdout), Some(stderr)) = (stdout, stderr) {
        let on_log_stdout = on_log.clone();
        join_set.spawn(async move {
            let reader = BufReader::new(stdout);
            let mut lines = reader.lines();
            while let Ok(Some(line)) = lines.next_line().await {
                on_log_stdout(line);
            }
        });
        let on_log_stderr = on_log.clone();
        join_set.spawn(async move {
            let reader = BufReader::new(stderr);
            let mut lines = reader.lines();
            while let Ok(Some(line)) = lines.next_line().await {
                on_log_stderr(line);
            }
        });
    }

    let status = child.wait().await?;

    // 等待日志读取任务完成（管道关闭后会自动结束）
    while join_set.join_next().await.is_some() {}

    if status.success() {
        report_progress(
            OverallProgress::new(InstallStage::InstallOpenClaw, 100, "OpenClaw 安装完成")
                .with_detail("阶段 3/4"),
        );
        Ok(())
    } else {
        Err(anyhow::anyhow!(
            "安装脚本执行失败 (exit code: {})",
            status.code().unwrap_or(-1)
        ))
    }
}

/// 执行 Windows 安装脚本
/// on_log: 可选的回调，用于实时推送命令行输出（用户可展开查看）
#[cfg(target_os = "windows")]
pub async fn run_install_script(
    script_path: &std::path::Path,
    use_china_mirror: bool,
    report_progress: &impl Fn(OverallProgress),
    on_log: Option<Arc<dyn Fn(String) + Send + Sync>>,
) -> anyhow::Result<()> {
    let registry = get_registry_url(use_china_mirror);

    report_progress(
        OverallProgress::new(InstallStage::EnvironmentCheck, 0, "准备执行安装脚本...")
            .with_detail("阶段 1/4"),
    );

    let cmd_line = format!(
        "powershell -NoProfile -ExecutionPolicy Bypass -File {} -NoPrompt -NoOnboard -Registry {}",
        script_path.display(),
        registry
    );
    if let Some(ref cb) = on_log {
        cb(cmd_line);
    }

    let log_cb = on_log;

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

    let (stdout, stderr) = (child.stdout.take(), child.stderr.take());
    let mut join_set = tokio::task::JoinSet::new();
    let on_log: Arc<dyn Fn(String) + Send + Sync> =
        log_cb.unwrap_or_else(|| Arc::new(|_| ()));

    if let (Some(stdout), Some(stderr)) = (stdout, stderr) {
        let on_log_stdout = on_log.clone();
        join_set.spawn(async move {
            let reader = BufReader::new(stdout);
            let mut lines = reader.lines();
            while let Ok(Some(line)) = lines.next_line().await {
                on_log_stdout(line);
            }
        });
        let on_log_stderr = on_log.clone();
        join_set.spawn(async move {
            let reader = BufReader::new(stderr);
            let mut lines = reader.lines();
            while let Ok(Some(line)) = lines.next_line().await {
                on_log_stderr(line);
            }
        });
    }

    let status = child.wait().await?;

    while join_set.join_next().await.is_some() {}

    if status.success() {
        report_progress(
            OverallProgress::new(InstallStage::InstallOpenClaw, 100, "OpenClaw 安装完成")
                .with_detail("阶段 3/4"),
        );
        Ok(())
    } else {
        Err(anyhow::anyhow!(
            "安装脚本执行失败 (exit code: {})",
            status.code().unwrap_or(-1)
        ))
    }
}
