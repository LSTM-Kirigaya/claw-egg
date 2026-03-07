use claw_egg_installer::types::{Component, InstallProgress, InstallResult};
use std::sync::{Arc, Mutex};
use tauri::command;
use tauri::State;

/// Installation state
#[derive(Default)]
pub struct InstallState {
    progress: Arc<Mutex<Vec<InstallProgress>>>,
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
