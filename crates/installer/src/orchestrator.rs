//! Installation orchestrator that manages the entire installation flow
//!
//! 使用 clawd.org.cn 官方一键安装脚本，确保安装过程稳定可靠。
//! MacOS/Linux: install.sh
//! Windows: install.ps1

use crate::script_installer::{download_install_script, run_install_script};
use crate::types::{
    Component, InstallResult, InstallStage, InstallationState, OverallProgress,
};
use std::sync::{Arc, Mutex};

/// Progress callback type
pub type ProgressCallback = Box<dyn Fn(OverallProgress) + Send + Sync>;

/// Installation orchestrator
pub struct InstallOrchestrator {
    progress_callback: Option<ProgressCallback>,
    state: Arc<Mutex<InstallState>>,
    use_china_mirror: bool,
}

#[derive(Debug, Default)]
struct InstallState {
    current_stage: InstallStage,
}

impl InstallOrchestrator {
    /// Create a new installation orchestrator
    /// use_china_mirror: 是否使用国内镜像 (registry.npmmirror.com)
    pub fn new(use_china_mirror: bool) -> Self {
        Self {
            progress_callback: None,
            state: Arc::new(Mutex::new(InstallState::default())),
            use_china_mirror,
        }
    }

    /// Set progress callback
    pub fn on_progress<F>(mut self, callback: F) -> Self
    where
        F: Fn(OverallProgress) + Send + Sync + 'static,
    {
        self.progress_callback = Some(Box::new(callback));
        self
    }

    /// Report progress
    fn report_progress(&self, progress: OverallProgress) {
        if let Some(callback) = &self.progress_callback {
            callback(progress);
        }
    }

    /// Update stage and report progress
    fn update_stage(&self, stage: InstallStage, stage_progress: u8, message: impl Into<String>) {
        let message = message.into();
        let progress = OverallProgress::new(stage, stage_progress, message.clone())
            .with_detail(format!("阶段 {}/{}", stage.number() + 1, InstallStage::total_stages()));

        {
            let mut state = self.state.lock().unwrap();
            state.current_stage = stage;
        }

        self.report_progress(progress);
    }

    /// Update persistent installation state
    fn persist_state(&self, stage: InstallStage, error: Option<String>) {
        let state = InstallationState {
            stage,
            completed: stage == InstallStage::Completed,
            last_error: error,
            last_attempt: Some(chrono::Local::now().to_rfc3339()),
            node_path: None, // 脚本安装使用系统 Node.js
            openclaw_path: None, // openclaw-cn 通过 npm 全局安装
        };

        if let Err(e) = state.save() {
            log::warn!("Failed to save installation state: {}", e);
        }
    }

    /// Run the complete installation flow using clawd.org.cn official script
    pub async fn run_installation(&self) -> anyhow::Result<InstallResult> {
        log::info!("Starting OpenClaw installation via clawd.org.cn script...");
        log::info!("Using China mirror: {}", self.use_china_mirror);

        // Stage 1: Environment Check
        self.update_stage(InstallStage::EnvironmentCheck, 0, "准备下载安装脚本...");
        self.persist_state(InstallStage::EnvironmentCheck, None);

        // Stage 2: Download script
        self.update_stage(InstallStage::DownloadNodeJs, 0, "正在下载安装脚本...");

        let script_path = download_install_script().await.map_err(|e| {
            log::error!("Failed to download install script: {}", e);
            self.persist_state(InstallStage::Failed, Some(e.to_string()));
            e
        })?;

        self.update_stage(InstallStage::DownloadNodeJs, 100, "安装脚本下载完成");

        // Stage 3 & 4: Run script (installs Node.js + OpenClaw)
        self.update_stage(InstallStage::InstallNodeJs, 0, "正在执行安装脚本...");
        self.persist_state(InstallStage::InstallNodeJs, None);

        let report = |p: OverallProgress| self.report_progress(p);
        run_install_script(&script_path, self.use_china_mirror, &report).await.map_err(|e| {
            log::error!("Install script failed: {}", e);
            self.persist_state(InstallStage::Failed, Some(e.to_string()));
            e
        })?;

        // Stage 5: Configuration
        self.update_stage(InstallStage::ConfigureOpenClaw, 100, "OpenClaw 安装完成");
        self.persist_state(InstallStage::ConfigureOpenClaw, None);

        // Final completion
        self.update_stage(InstallStage::Completed, 100, "安装完成！");
        self.persist_state(InstallStage::Completed, None);

        Ok(InstallResult {
            component: Component::OpenClaw,
            success: true,
            message: "OpenClaw 中文社区安装成功".to_string(),
            version: None,
        })
    }

    /// Get current installation stage
    pub fn get_current_stage(&self) -> InstallStage {
        let state = self.state.lock().unwrap();
        state.current_stage
    }

    /// Check if installation was previously completed
    pub fn is_installation_complete() -> bool {
        InstallationState::load()
            .map(|s| s.is_completed())
            .unwrap_or(false)
    }

    /// Check if installation needs to be retried (was interrupted or failed)
    pub fn needs_retry() -> bool {
        InstallationState::load()
            .map(|s| s.needs_retry())
            .unwrap_or(false)
    }

    /// Reset installation state (for testing or clean reinstall)
    pub fn reset_state() -> anyhow::Result<()> {
        let state = InstallationState::default();
        state.save()
    }
}

impl Default for InstallOrchestrator {
    fn default() -> Self {
        Self::new(true) // 默认使用国内镜像
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_orchestrator_creation() {
        let orch = InstallOrchestrator::new(true);
        assert_eq!(
            orch.get_current_stage() as i32,
            InstallStage::EnvironmentCheck as i32
        );
    }

    #[test]
    fn test_progress_callback() {
        let received = Arc::new(Mutex::new(false));
        let received_clone = received.clone();

        let orch = InstallOrchestrator::new(true).on_progress(move |_progress| {
            *received_clone.lock().unwrap() = true;
        });

        orch.update_stage(InstallStage::EnvironmentCheck, 50, "Test");
    }

    #[test]
    fn test_orchestrator_isolation() {
        let orch1 = InstallOrchestrator::new(true);
        let orch2 = InstallOrchestrator::new(false);

        assert_eq!(
            orch1.get_current_stage() as i32,
            orch2.get_current_stage() as i32
        );

        orch1.update_stage(InstallStage::Completed, 100, "Done");
        assert_ne!(
            orch1.get_current_stage() as i32,
            orch2.get_current_stage() as i32
        );
    }
}
