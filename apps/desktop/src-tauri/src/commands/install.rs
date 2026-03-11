use claw_egg_installer::orchestrator::InstallOrchestrator;
use claw_egg_installer::settings::AppSettings;
use claw_egg_installer::types::{Component, ComponentProgress, InstallResult, OverallProgress};
use std::sync::{Arc, Mutex};
use tauri::command;
use tauri::State;
use tauri::Emitter;

/// Installation state
#[derive(Default)]
pub struct InstallState {
    progress: Arc<Mutex<Vec<ComponentProgress>>>,
    is_installing: Arc<Mutex<bool>>,
}

impl InstallState {
    pub fn update_progress(&self, progress: ComponentProgress) {
        let mut guard = self.progress.lock().unwrap();
        if let Some(existing) = guard.iter_mut().find(|p| p.component == progress.component) {
            *existing = progress;
        } else {
            guard.push(progress);
        }
    }

    pub fn get_progress(&self, component: Component) -> Option<ComponentProgress> {
        let guard = self.progress.lock().unwrap();
        guard.iter().find(|p| p.component == component).cloned()
    }

    pub fn get_all_progress(&self) -> Vec<ComponentProgress> {
        self.progress.lock().unwrap().clone()
    }

    pub fn is_installing(&self) -> bool {
        *self.is_installing.lock().unwrap()
    }

    pub fn set_installing(&self, installing: bool) {
        *self.is_installing.lock().unwrap() = installing;
    }
}

/// Install a component
#[command]
pub fn install_component(
    component: Component,
    state: State<InstallState>,
) -> Result<InstallResult, String> {
    // Update progress to installing
    state.update_progress(ComponentProgress {
        component,
        status: claw_egg_installer::types::InstallStatus::Installing,
        progress: 0,
        message: format!("Installing {}", component),
    });

    // For now, return a simulated result
    // In production, this would actually run the installer
    let result = InstallResult {
        component,
        success: true,
        message: format!("{} installed successfully", component),
        version: Some("1.0.0".to_string()),
    };

    // Update progress to completed
    state.update_progress(ComponentProgress {
        component,
        status: claw_egg_installer::types::InstallStatus::Installed,
        progress: 100,
        message: format!("{} installation complete", component),
    });

    Ok(result)
}

/// Get installation progress for a component
#[command]
pub fn get_install_progress(
    component: Component,
    state: State<InstallState>,
) -> Option<ComponentProgress> {
    state.get_progress(component)
}

/// Start full installation with progress events
/// 从应用配置读取 useChinaMirror，与设置中的「使用国内镜像」同步
#[command]
pub async fn start_full_installation(
    app: tauri::AppHandle,
    state: State<'_, InstallState>,
) -> Result<InstallResult, String> {
    if state.is_installing() {
        return Err("Installation already in progress".to_string());
    }

    state.set_installing(true);

    // 从配置读取是否使用国内镜像（与设置对话框同步）
    let use_china_mirror = AppSettings::load()
        .map(|s| s.network.use_china_mirror)
        .unwrap_or(true); // 默认使用国内镜像

    // Create orchestrator with progress and log callbacks
    let app_handle = app.clone();
    let app_handle_log = app.clone();
    let orchestrator = InstallOrchestrator::new(use_china_mirror)
        .on_progress(move |progress: OverallProgress| {
            let _ = app_handle.emit("install-progress", progress);
        })
        .on_log(move |line: String| {
            let _ = app_handle_log.emit("install-log", line);
        });

    // Run installation
    let result = orchestrator.run_installation().await;

    state.set_installing(false);

    match result {
        Ok(r) => Ok(r),
        Err(e) => {
            // Emit failure event
            let _ = app.emit(
                "install-progress",
                OverallProgress::new(
                    claw_egg_installer::types::InstallStage::Failed,
                    0,
                    format!("安装失败: {}", e),
                ),
            );
            Err(e.to_string())
        }
    }
}

/// Check if installation is in progress
#[command]
pub fn is_installing(state: State<InstallState>) -> bool {
    state.is_installing()
}

/// Check if installation was previously completed
#[command]
pub fn is_installation_complete() -> bool {
    InstallOrchestrator::is_installation_complete()
}

/// Check if installation needs retry (was interrupted or failed)
#[command]
pub fn needs_installation_retry() -> bool {
    InstallOrchestrator::needs_retry()
}

/// Reset installation state (for clean reinstall)
#[command]
pub fn reset_installation_state() -> Result<(), String> {
    InstallOrchestrator::reset_state()
        .map_err(|e| e.to_string())
}
