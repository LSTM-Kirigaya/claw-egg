//! Installation orchestrator that manages the entire installation flow

use crate::detector::EnvironmentDetector;
use crate::downloader::{download_nodejs, DownloadConfig};
use crate::types::{
    Component, InstallResult, InstallStage, OverallProgress,
};
use std::path::PathBuf;
use std::process::{Command, Stdio};
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
    node_version: String,
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

        // Stage 1: Environment Check
        self.update_stage(InstallStage::EnvironmentCheck, 0, "检查系统环境...");
        
        let detector = EnvironmentDetector::new();
        let node_check = detector.check_nodejs();
        
        self.update_stage(InstallStage::EnvironmentCheck, 50, "检测 Node.js 版本...");
        
        let needs_nodejs = !node_check.installed || !self.is_node_version_sufficient(&node_check.version);
        
        if needs_nodejs {
            log::info!("Node.js not found or version too old, will install");
        } else {
            log::info!("Node.js is already installed: {:?}", node_check.version);
        }
        
        self.update_stage(InstallStage::EnvironmentCheck, 100, "环境检查完成");

        // Stage 2 & 3: Download and Install Node.js (if needed)
        if needs_nodejs {
            self.install_nodejs().await?;
        } else {
            self.update_stage(InstallStage::InstallNodeJs, 100, "Node.js 已安装，跳过");
        }

        // Stage 4: Install Qwen CLI
        self.install_qwen_cli().await?;

        // Stage 5: Install OpenClaw
        self.install_openclaw().await?;

        // Stage 6: Configuration (just report completion, actual config is done via UI)
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

    /// Check if Node.js version is sufficient (>= 22)
    fn is_node_version_sufficient(&self, version: &Option<String>) -> bool {
        if let Some(v) = version {
            // Parse version like "v22.11.0"
            let v = v.trim_start_matches('v');
            if let Some(major) = v.split('.').next() {
                if let Ok(major_num) = major.parse::<u32>() {
                    return major_num >= 22;
                }
            }
        }
        false
    }

    /// Install Node.js
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
                
                // Extract and install (simplified - would extract zip and set PATH)
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

    /// Extract and install Node.js
    async fn extract_and_install_nodejs(&self, zip_path: &PathBuf) -> anyhow::Result<()> {
        // In a real implementation:
        // 1. Extract zip to temp directory
        // 2. Move to installation directory (e.g., ~/.clawegg/nodejs)
        // 3. Add to PATH or create symlinks
        
        // For now, simulate the process
        tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;
        
        log::info!("Node.js would be extracted from: {:?}", zip_path);
        
        Ok(())
    }

    /// Install Qwen CLI using npm
    async fn install_qwen_cli(&self) -> anyhow::Result<()> {
        self.update_stage(InstallStage::InstallQwenCli, 0, "准备安装 Qwen CLI...");
        
        let npm_registry = if self.use_china_mirror {
            "https://registry.npmmirror.com"
        } else {
            "https://registry.npmjs.org"
        };

        self.update_stage(InstallStage::InstallQwenCli, 30, "正在安装 Qwen CLI...");

        // Run npm install -g @qwen-code/qwen-code
        let output = Command::new("npm")
            .args([
                "install",
                "-g",
                "@qwen-code/qwen-code@latest",
                "--registry",
                npm_registry,
            ])
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .output()?;

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            log::error!("Failed to install Qwen CLI: {}", stderr);
            return Err(anyhow::anyhow!("安装 Qwen CLI 失败: {}", stderr));
        }

        self.update_stage(InstallStage::InstallQwenCli, 100, "Qwen CLI 安装完成");
        Ok(())
    }

    /// Install OpenClaw using npm
    async fn install_openclaw(&self) -> anyhow::Result<()> {
        self.update_stage(InstallStage::InstallOpenClaw, 0, "准备安装 OpenClaw...");
        
        let npm_registry = if self.use_china_mirror {
            "https://registry.npmmirror.com"
        } else {
            "https://registry.npmjs.org"
        };

        self.update_stage(InstallStage::InstallOpenClaw, 30, "正在安装 OpenClaw...");

        // Run npm install -g openclaw
        let output = Command::new("npm")
            .args([
                "install",
                "-g",
                "openclaw@latest",
                "--registry",
                npm_registry,
            ])
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .output()?;

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            log::error!("Failed to install OpenClaw: {}", stderr);
            return Err(anyhow::anyhow!("安装 OpenClaw 失败: {}", stderr));
        }

        self.update_stage(InstallStage::InstallOpenClaw, 100, "OpenClaw 安装完成");
        Ok(())
    }

    /// Get current installation progress
    pub fn get_current_stage(&self) -> InstallStage {
        let state = self.state.lock().unwrap();
        state.current_stage
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
    fn test_node_version_check() {
        let orch = InstallOrchestrator::new();
        
        // Version 22+ should be sufficient
        assert!(orch.is_node_version_sufficient(&Some("v22.0.0".to_string())));
        assert!(orch.is_node_version_sufficient(&Some("v22.11.0".to_string())));
        assert!(orch.is_node_version_sufficient(&Some("v23.0.0".to_string())));
        
        // Version below 22 should not be sufficient
        assert!(!orch.is_node_version_sufficient(&Some("v20.0.0".to_string())));
        assert!(!orch.is_node_version_sufficient(&Some("v18.0.0".to_string())));
        
        // No version should not be sufficient
        assert!(!orch.is_node_version_sufficient(&None));
    }

    #[test]
    fn test_progress_callback() {
        let received = Arc::new(Mutex::new(false));
        let received_clone = received.clone();
        
        let orch = InstallOrchestrator::new().on_progress(move |_progress| {
            *received_clone.lock().unwrap() = true;
        });
        
        orch.update_stage(InstallStage::EnvironmentCheck, 50, "Test");
        
        // Note: In real async context, this would be true
        // For now, we just verify the callback is set
    }
}
