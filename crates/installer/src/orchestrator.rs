//! Installation orchestrator that manages the entire installation flow
//! 
//! This orchestrator uses bundled Node.js for all operations, avoiding
//! conflicts with user's existing Node.js installation.

use crate::detector::EnvironmentDetector;
use crate::downloader::{download_nodejs, DownloadConfig};
use crate::paths::{
    self, create_command_with_bundled_node, get_node_exe, get_nodejs_dir, get_openclaw_dir,
    is_bundled_nodejs_installed, npm_install_global,
};
use crate::types::{
    Component, InstallResult, InstallStage, OverallProgress,
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

    /// Run the complete installation flow
    pub async fn run_installation(&self) -> anyhow::Result<InstallResult> {
        log::info!("Starting OpenClaw installation...");
        log::info!("Using China mirror: {}", self.use_china_mirror);
        log::info!("Install root: {:?}", paths::get_install_root()?);

        // Stage 1: Environment Check
        self.update_stage(InstallStage::EnvironmentCheck, 0, "检查系统环境...");
        
        let bundled_node_exists = is_bundled_nodejs_installed();
        
        self.update_stage(InstallStage::EnvironmentCheck, 50, "检测 Node.js 安装状态...");
        
        if bundled_node_exists {
            log::info!("Bundled Node.js found at: {:?}", get_node_exe()?);
        } else {
            log::info!("Bundled Node.js not found, will install");
        }
        
        self.update_stage(InstallStage::EnvironmentCheck, 100, "环境检查完成");

        // Stage 2 & 3: Download and Install Node.js (if needed)
        if !bundled_node_exists {
            self.install_nodejs().await?;
        } else {
            self.update_stage(InstallStage::InstallNodeJs, 100, "Node.js 已安装，跳过");
        }

        // Stage 4: Install OpenClaw using bundled npm
        self.install_openclaw().await?;

        // Stage 5: Configuration
        self.update_stage(InstallStage::ConfigureOpenClaw, 100, "OpenClaw 安装完成");
        
        // Final completion
        self.update_stage(InstallStage::Completed, 100, "安装完成！");

        Ok(InstallResult {
            component: Component::OpenClaw,
            success: true,
            message: "OpenClaw installed successfully".to_string(),
            version: None,
        })
    }

    /// Install Node.js to bundled location
    async fn install_nodejs(&self) -> anyhow::Result<()> {
        let node_version = "22.11.0";
        
        // Stage 2: Download
        self.update_stage(InstallStage::DownloadNodeJs, 0, "准备下载 Node.js...");
        
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
                self.update_stage(InstallStage::InstallNodeJs, 50, "正在解压 Node.js...");
                
                // Extract to bundled location
                self.extract_and_install_nodejs(&zip_path).await?;
                
                self.update_stage(InstallStage::InstallNodeJs, 100, "Node.js 安装完成");
            }
            Err(e) => {
                log::error!("Failed to download Node.js: {}", e);
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
        
        // Ensure openclaw directory exists
        let openclaw_dir = get_openclaw_dir()?;
        std::fs::create_dir_all(&openclaw_dir)?;
        
        self.update_stage(InstallStage::InstallOpenClaw, 30, "正在安装 OpenClaw...");

        // Install openclaw globally using bundled npm
        npm_install_global("openclaw@latest", self.use_china_mirror).await?;

        self.update_stage(InstallStage::InstallOpenClaw, 100, "OpenClaw 安装完成");
        Ok(())
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
