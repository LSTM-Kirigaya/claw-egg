use claw_egg_installer::orchestrator::InstallOrchestrator;
use claw_egg_installer::types::{Component, InstallProgress, InstallResult, OverallProgress};
use std::sync::{Arc, Mutex};
use tauri::command;
use tauri::State;
use tauri::Emitter;

/// Installation state
#[derive(Default)]
pub struct InstallState {
    progress: Arc<Mutex<Vec<InstallProgress>>>,
    is_installing: Arc<Mutex<bool>>,
}

impl InstallState {
    pub fn update_progress(&self, progress: InstallProgress) {
        let mut guard = self.progress.lock().unwrap();
        if let Some(existing) = guard.iter_mut().find(|p| p.component == progress.component) {
            *existing = progress;
        } else {
            guard.push(progress);
        }
    }

    pub fn get_progress(&self, component: Component) -> Option<InstallProgress> {
        let guard = self.progress.lock().unwrap();
        guard.iter().find(|p| p.component == component).cloned()
    }

    pub fn get_all_progress(&self) -> Vec<InstallProgress> {
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
    state.update_progress(InstallProgress {
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
    state.update_progress(InstallProgress {
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
) -> Option<InstallProgress> {
    state.get_progress(component)
}

/// Start full installation with progress events
#[command]
pub async fn start_full_installation(
    app: tauri::AppHandle,
    state: State<'_, InstallState>,
) -> Result<InstallResult, String> {
    if state.is_installing() {
        return Err("Installation already in progress".to_string());
    }

    state.set_installing(true);

    // Create orchestrator with progress callback
    let app_handle = app.clone();
    let orchestrator = InstallOrchestrator::new().on_progress(move |progress: OverallProgress| {
        // Emit progress event to frontend
        let _ = app_handle.emit("install-progress", progress);
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
