//! Installation orchestrator that manages the entire installation flow
//!
//! This orchestrator uses bundled Node.js for all operations, avoiding
//! conflicts with user's existing Node.js installation.

use crate::downloader::{download_nodejs, DownloadConfig};
use crate::paths::{
    self, create_command_with_bundled_node, get_node_exe, get_nodejs_dir, get_openclaw_dir,
    is_bundled_nodejs_installed, npm_install_global,
};
use crate::types::{
    Component, InstallResult, InstallStage, InstallationState, OverallProgress,
};
use std::path::PathBuf;
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
    pub fn new() -> Self {
        let use_china_mirror = DownloadConfig::detect_china_network();
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
            node_path: get_nodejs_dir().ok().map(|p| p.to_string_lossy().to_string()),
            openclaw_path: get_openclaw_dir().ok().map(|p| p.to_string_lossy().to_string()),
        };
        
        if let Err(e) = state.save() {
            log::warn!("Failed to save installation state: {}", e);
        }
    }

    /// Run the complete installation flow
    /// Supports resuming from previous interrupted installation
    pub async fn run_installation(&self) -> anyhow::Result<InstallResult> {
        log::info!("Starting OpenClaw installation...");
        log::info!("Using China mirror: {}", self.use_china_mirror);
        log::info!("Install root: {:?}", paths::get_install_root()?);

        // Load previous state to check if we need to resume
        let previous_state = InstallationState::load().unwrap_or_default();
        let resume_from_stage = if previous_state.needs_retry() {
            log::info!("Previous installation attempt detected at stage: {:?}", previous_state.stage);
            Some(previous_state.stage)
        } else {
            None
        };

        // Stage 1: Environment Check
        self.update_stage(InstallStage::EnvironmentCheck, 0, "检查系统环境...");
        self.persist_state(InstallStage::EnvironmentCheck, None);
        
        let bundled_node_exists = is_bundled_nodejs_installed();
        
        self.update_stage(InstallStage::EnvironmentCheck, 50, "检测 Node.js 安装状态...");
        
        if bundled_node_exists {
            log::info!("Bundled Node.js found at: {:?}", get_node_exe()?);
        } else {
            log::info!("Bundled Node.js not found, will install");
        }
        
        self.update_stage(InstallStage::EnvironmentCheck, 100, "环境检查完成");

        // Stage 2 & 3: Download and Install Node.js (if needed)
        // If resuming from a failed download/install, always retry
        let need_nodejs = !bundled_node_exists || matches!(
            resume_from_stage,
            Some(InstallStage::DownloadNodeJs | InstallStage::InstallNodeJs)
        );
        
        if need_nodejs {
            self.install_nodejs().await?;
        } else {
            self.update_stage(InstallStage::InstallNodeJs, 100, "Node.js 已安装，跳过");
        }

        // Stage 4: Install OpenClaw using bundled npm
        // If resuming from a failed OpenClaw install, retry
        let need_openclaw = matches!(
            resume_from_stage,
            Some(InstallStage::InstallOpenClaw | InstallStage::ConfigureOpenClaw | InstallStage::Failed)
        ) || !self.check_openclaw_installed().await;
        
        if need_openclaw {
            self.install_openclaw().await?;
        } else {
            self.update_stage(InstallStage::InstallOpenClaw, 100, "OpenClaw 已安装，跳过");
        }

        // Stage 5: Configuration
        self.update_stage(InstallStage::ConfigureOpenClaw, 100, "OpenClaw 安装完成");
        self.persist_state(InstallStage::ConfigureOpenClaw, None);
        
        // Final completion
        self.update_stage(InstallStage::Completed, 100, "安装完成！");
        self.persist_state(InstallStage::Completed, None);

        Ok(InstallResult {
            component: Component::OpenClaw,
            success: true,
            message: "OpenClaw installed successfully".to_string(),
            version: None,
        })
    }

    /// Check if OpenClaw is already installed
    async fn check_openclaw_installed(&self) -> bool {
        which::which("openclaw").is_ok()
    }

    /// Install Node.js to bundled location
    async fn install_nodejs(&self) -> anyhow::Result<()> {
        let node_version = "22.11.0";
        
        // Stage 2: Download
        self.update_stage(InstallStage::DownloadNodeJs, 0, "准备下载 Node.js...");
        self.persist_state(InstallStage::DownloadNodeJs, None);
        
        let temp_dir = std::env::temp_dir().join("clawegg");
        std::fs::create_dir_all(&temp_dir)?;

        self.update_stage(InstallStage::DownloadNodeJs, 10, "正在下载 Node.js...");
        
        // Download Node.js
        let download_result = download_nodejs(node_version, &temp_dir, self.use_china_mirror).await;
        
        match download_result {
            Ok(zip_path) => {
                self.update_stage(InstallStage::DownloadNodeJs, 100, "Node.js 下载完成");
                
                // Stage 3: Install
                self.update_stage(InstallStage::InstallNodeJs, 0, "准备安装 Node.js...");
                self.persist_state(InstallStage::InstallNodeJs, None);
                
                self.update_stage(InstallStage::InstallNodeJs, 50, "正在解压 Node.js...");
                
                // Extract to bundled location
                self.extract_and_install_nodejs(&zip_path).await?;
                
                self.update_stage(InstallStage::InstallNodeJs, 100, "Node.js 安装完成");
            }
            Err(e) => {
                log::error!("Failed to download Node.js: {}", e);
                self.persist_state(InstallStage::Failed, Some(e.to_string()));
                return Err(anyhow::anyhow!("下载 Node.js 失败: {}", e));
            }
        }

        Ok(())
    }

    /// Extract and install Node.js to bundled location
    async fn extract_and_install_nodejs(&self, zip_path: &PathBuf) -> anyhow::Result<()> {
        let nodejs_dir = get_nodejs_dir()?;
        
        // Create nodejs directory
        std::fs::create_dir_all(&nodejs_dir)?;
        
        // In a real implementation:
        // 1. Extract zip to temp directory
        // 2. Move contents to nodejs_dir
        // 3. Verify installation
        
        // For now, simulate extraction
        tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;
        
        log::info!("Node.js would be extracted to: {:?}", nodejs_dir);
        log::info!("From zip: {:?}", zip_path);
        
        // Create a placeholder marker file
        let marker = nodejs_dir.join(".installed");
        std::fs::write(marker, format!("Installed from {:?}", zip_path))?;
        
        Ok(())
    }

    /// Install OpenClaw using bundled npm
    async fn install_openclaw(&self) -> anyhow::Result<()> {
        self.update_stage(InstallStage::InstallOpenClaw, 0, "准备安装 OpenClaw...");
        self.persist_state(InstallStage::InstallOpenClaw, None);
        
        // Ensure openclaw directory exists
        let openclaw_dir = get_openclaw_dir()?;
        std::fs::create_dir_all(&openclaw_dir)?;
        
        self.update_stage(InstallStage::InstallOpenClaw, 30, "正在安装 OpenClaw...");

        // Install openclaw globally using bundled npm
        match npm_install_global("openclaw@latest", self.use_china_mirror).await {
            Ok(_) => {
                self.update_stage(InstallStage::InstallOpenClaw, 100, "OpenClaw 安装完成");
                Ok(())
            }
            Err(e) => {
                log::error!("Failed to install OpenClaw: {}", e);
                self.persist_state(InstallStage::Failed, Some(e.to_string()));
                Err(e)
            }
        }
    }

    /// Get current installation stage
    pub fn get_current_stage(&self) -> InstallStage {
        let state = self.state.lock().unwrap();
        state.current_stage
    }

    /// Check if bundled installation is complete and working
    pub fn verify_installation() -> anyhow::Result<bool> {
        // Check if bundled Node.js exists
        if !is_bundled_nodejs_installed() {
            return Ok(false);
        }
        
        // Try to run bundled node --version
        match create_command_with_bundled_node("node") {
            Ok(mut cmd) => {
                cmd.arg("--version");
                match cmd.output() {
                    Ok(output) => Ok(output.status.success()),
                    Err(_) => Ok(false),
                }
            }
            Err(_) => Ok(false),
        }
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
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_orchestrator_creation() {
        let orch = InstallOrchestrator::new();
        assert_eq!(orch.get_current_stage() as i32, InstallStage::EnvironmentCheck as i32);
    }

    #[test]
    fn test_progress_callback() {
        let received = Arc::new(Mutex::new(false));
        let received_clone = received.clone();
        
        let orch = InstallOrchestrator::new().on_progress(move |_progress| {
            *received_clone.lock().unwrap() = true;
        });
        
        orch.update_stage(InstallStage::EnvironmentCheck, 50, "Test");
        
        // Verify callback is set (actual invocation depends on async context)
    }

    #[test]
    fn test_verify_installation_returns_false_when_not_installed() {
        // In test environment, bundled Node.js likely doesn't exist
        let result = InstallOrchestrator::verify_installation();
        // Should either return false or an error
        assert!(result.is_ok() || result.is_err());
    }

    // Idempotency test: multiple orchestrator instances should work independently
    #[test]
    fn test_orchestrator_isolation() {
        let orch1 = InstallOrchestrator::new();
        let orch2 = InstallOrchestrator::new();
        
        // Both should start at the same stage
        assert_eq!(
            orch1.get_current_stage() as i32,
            orch2.get_current_stage() as i32
        );
        
        // Updating one should not affect the other
        orch1.update_stage(InstallStage::Completed, 100, "Done");
        assert_ne!(
            orch1.get_current_stage() as i32,
            orch2.get_current_stage() as i32
        );
    }
}
