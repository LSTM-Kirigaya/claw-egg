mod cmake;
mod node;
mod openclaw;

pub use cmake::CmakeInstaller;
pub use node::NodeInstaller;
pub use openclaw::OpenClawInstaller;

use crate::types::{Component, InstallProgress, InstallStatus};

/// Trait for component installers
pub trait Installer: Send + Sync {
    /// Get the component this installer handles
    fn component(&self) -> Component;

    /// Check if the component is already installed
    fn is_installed(&self) -> bool;

    /// Get the installed version if available
    fn version(&self) -> Option<String>;

    /// Get current installation progress
    fn progress(&self) -> InstallProgress {
        InstallProgress {
            component: self.component(),
            status: if self.is_installed() {
                InstallStatus::Installed
            } else {
                InstallStatus::NotInstalled
            },
            progress: if self.is_installed() { 100 } else { 0 },
            message: "Ready".to_string(),
        }
    }
}
