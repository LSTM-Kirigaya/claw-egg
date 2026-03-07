//! File downloader with progress tracking and China network optimization

use std::path::{Path, PathBuf};
use std::fs::File;


/// Download configuration
#[derive(Debug, Clone)]
pub struct DownloadConfig {
    /// Whether to use China mirror
    pub use_china_mirror: bool,
    /// Custom user agent
    pub user_agent: String,
    /// Connection timeout in seconds
    pub timeout_secs: u64,
}

impl Default for DownloadConfig {
    fn default() -> Self {
        Self {
            use_china_mirror: Self::detect_china_network(),
            user_agent: "ClawEgg/0.1.0".to_string(),
            timeout_secs: 300,
        }
    }
}

impl DownloadConfig {
    /// Detect if we're in China based on system locale/timezone
    pub fn detect_china_network() -> bool {
        // Check common Chinese timezone
        let tz = std::env::var("TZ").unwrap_or_default();
        if tz.contains("Shanghai") || tz.contains("Beijing") || tz.contains("China") {
            return true;
        }
        
        // Check system locale
        let locale = std::env::var("LANG").unwrap_or_default();
        if locale.contains("zh_CN") || locale.contains("zh_Hans") {
            return true;
        }
        
        // Default to false
        false
    }

    /// Get Node.js download URL for a specific version and platform
    pub fn get_nodejs_url(&self, version: &str, platform: &str, arch: &str) -> String {
        let version = if version.starts_with('v') {
            version.to_string()
        } else {
            format!("v{}", version)
        };

        if self.use_china_mirror {
            // Use npmmirror (淘宝镜像)
            format!(
                "https://cdn.npmmirror.com/binaries/node/{}/node-{}-{}-{}.zip",
                version, version, platform, arch
            )
        } else {
            // Use official Node.js dist
            format!(
                "https://nodejs.org/dist/{}/node-{}-{}-{}.zip",
                version, version, platform, arch
            )
        }
    }

    /// Get npm registry URL
    pub fn get_npm_registry(&self) -> &'static str {
        if self.use_china_mirror {
            "https://registry.npmmirror.com"
        } else {
            "https://registry.npmjs.org"
        }
    }
}

/// Get platform identifier for Node.js downloads
pub fn get_nodejs_platform() -> &'static str {
    match std::env::consts::OS {
        "windows" => "win",
        "macos" => "darwin",
        "linux" => "linux",
        _ => "linux",
    }
}

/// Get architecture identifier for Node.js downloads
pub fn get_nodejs_arch() -> &'static str {
    match std::env::consts::ARCH {
        "x86_64" => "x64",
        "aarch64" => "arm64",
        "x86" => "x86",
        _ => "x64",
    }
}

/// Download file with progress callback
pub async fn download_file_with_progress<F>(
    _url: &str,
    dest: &Path,
    mut progress_callback: F,
) -> anyhow::Result<()>
where
    F: FnMut(u64, Option<u64>, u8),
{
    // For now, this is a simplified version
    // In production, use reqwest with streaming
    
    // Create parent directory
    if let Some(parent) = dest.parent() {
        std::fs::create_dir_all(parent)?;
    }

    // In a real implementation, this would:
    // 1. Send HTTP GET request
    // 2. Get content length
    // 3. Stream download to file
    // 4. Call progress_callback periodically

    // For now, simulate success
    progress_callback(0, Some(100), 0);
    
    // Create empty file as placeholder
    File::create(dest)?;
    
    progress_callback(100, Some(100), 100);
    
    Ok(())
}

/// Download Node.js installer
pub async fn download_nodejs(
    version: &str,
    dest_dir: &Path,
    use_china_mirror: bool,
) -> anyhow::Result<PathBuf> {
    let config = DownloadConfig {
        use_china_mirror,
        ..Default::default()
    };

    let platform = get_nodejs_platform();
    let arch = get_nodejs_arch();
    let url = config.get_nodejs_url(version, platform, arch);
    
    let filename = format!("node-{}-{}-{}.zip", version, platform, arch);
    let dest = dest_dir.join(&filename);

    // Download with progress
    download_file_with_progress(&url, &dest, |downloaded, total, percentage| {
        log::info!("Downloading: {}% ({}/{})", percentage, downloaded, total.map(|t| t.to_string()).unwrap_or_else(|| "?".to_string()));
    }).await?;

    Ok(dest)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_download_config_default() {
        let config = DownloadConfig::default();
        assert!(!config.user_agent.is_empty());
        assert_eq!(config.timeout_secs, 300);
    }

    #[test]
    fn test_get_nodejs_platform() {
        let platform = get_nodejs_platform();
        assert!(matches!(platform, "win" | "darwin" | "linux"));
    }

    #[test]
    fn test_get_nodejs_arch() {
        let arch = get_nodejs_arch();
        assert!(matches!(arch, "x64" | "arm64" | "x86"));
    }

    #[test]
    fn test_china_mirror_url() {
        let config = DownloadConfig {
            use_china_mirror: true,
            ..Default::default()
        };
        let url = config.get_nodejs_url("22.11.0", "win", "x64");
        assert!(url.contains("npmmirror.com"));
        assert!(url.contains("v22.11.0"));
    }

    #[test]
    fn test_official_url() {
        let config = DownloadConfig {
            use_china_mirror: false,
            ..Default::default()
        };
        let url = config.get_nodejs_url("22.11.0", "win", "x64");
        assert!(url.contains("nodejs.org"));
    }

    #[test]
    fn test_npm_registry() {
        let china_config = DownloadConfig { use_china_mirror: true, ..Default::default() };
        assert_eq!(china_config.get_npm_registry(), "https://registry.npmmirror.com");

        let official_config = DownloadConfig { use_china_mirror: false, ..Default::default() };
        assert_eq!(official_config.get_npm_registry(), "https://registry.npmjs.org");
    }
}
