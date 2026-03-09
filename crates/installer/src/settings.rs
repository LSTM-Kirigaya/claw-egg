//! 应用配置管理系统
//!
//! 管理应用的所有持久化配置，存储在 `~/.clawegg/settings.json`
//!
//! 配置包括：
//! - 主题设置（浅色/深色/跟随系统）
//! - 窗口状态（大小、位置、最大化状态）
//! - 通知偏好
//! - 网络设置（镜像、代理）
//! - 安装偏好
//! - 用户行为记录

use serde::{Deserialize, Serialize};
use std::path::PathBuf;

/// 主题偏好
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, Default)]
#[serde(rename_all = "lowercase")]
pub enum ThemePreference {
    #[default]
    System,
    Light,
    Dark,
}

/// 语言设置
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, Default)]
pub enum Language {
    #[serde(rename = "zh-CN")]
    #[default]
    ZhCN,
    #[serde(rename = "en-US")]
    EnUS,
}

/// 窗口状态
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WindowState {
    pub width: u32,
    pub height: u32,
    pub x: Option<i32>,
    pub y: Option<i32>,
    pub maximized: bool,
}

impl Default for WindowState {
    fn default() -> Self {
        Self {
            width: 1200,
            height: 800,
            x: None,
            y: None,
            maximized: false,
        }
    }
}

/// 通知设置
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NotificationSettings {
    pub enabled: bool,
    pub sound: bool,
    pub installation_complete: bool,
    pub update_available: bool,
}

impl Default for NotificationSettings {
    fn default() -> Self {
        Self {
            enabled: true,
            sound: true,
            installation_complete: true,
            update_available: true,
        }
    }
}

/// 网络设置
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NetworkSettings {
    pub use_china_mirror: bool,
    pub custom_mirror: Option<String>,
    pub proxy_enabled: bool,
    pub proxy_url: Option<String>,
}

impl Default for NetworkSettings {
    fn default() -> Self {
        Self {
            use_china_mirror: false,
            custom_mirror: None,
            proxy_enabled: false,
            proxy_url: None,
        }
    }
}

/// 安装偏好设置
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct InstallPreferences {
    pub auto_install: bool,
    pub install_path: Option<String>,
    pub keep_downloads: bool,
    pub verify_checksums: bool,
}

impl Default for InstallPreferences {
    fn default() -> Self {
        Self {
            auto_install: false,
            install_path: None,
            keep_downloads: true,
            verify_checksums: true,
        }
    }
}

/// 用户行为记录
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UserBehavior {
    pub last_active_tab: String,
    pub expanded_sections: Vec<String>,
    pub recent_plugins: Vec<String>,
}

impl Default for UserBehavior {
    fn default() -> Self {
        Self {
            last_active_tab: "manage".to_string(),
            expanded_sections: Vec::new(),
            recent_plugins: Vec::new(),
        }
    }
}

/// 托盘设置
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TraySettings {
    pub minimize_to_tray_on_close: bool,
    pub show_tray_icon: bool,
    pub start_minimized: bool,
}

impl Default for TraySettings {
    fn default() -> Self {
        Self {
            minimize_to_tray_on_close: true,
            show_tray_icon: true,
            start_minimized: false,
        }
    }
}

/// 应用完整配置
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppSettings {
    /// 配置版本，用于迁移
    pub version: String,
    
    /// 主题设置
    pub theme: ThemePreference,
    
    /// 语言设置
    pub language: Language,
    
    /// 窗口状态
    pub window: WindowState,
    
    /// 通知设置
    pub notifications: NotificationSettings,
    
    /// 网络设置
    pub network: NetworkSettings,
    
    /// 安装偏好
    pub install: InstallPreferences,
    
    /// 用户行为
    pub behavior: UserBehavior,
    
    /// 托盘设置
    pub tray: TraySettings,
    
    /// 是否首次运行
    pub first_run: bool,
    
    /// 最后更新时间
    pub last_updated: String,
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            version: "1.0.0".to_string(),
            theme: ThemePreference::default(),
            language: Language::default(),
            window: WindowState::default(),
            notifications: NotificationSettings::default(),
            network: NetworkSettings::default(),
            install: InstallPreferences::default(),
            behavior: UserBehavior::default(),
            tray: TraySettings::default(),
            first_run: true,
            last_updated: chrono::Local::now().to_rfc3339(),
        }
    }
}

impl AppSettings {
    /// 获取配置文件路径
    pub fn config_path() -> anyhow::Result<PathBuf> {
        let home = std::env::var("HOME")
            .or_else(|_| std::env::var("USERPROFILE"))?;
        Ok(PathBuf::from(home).join(".clawegg").join("settings.json"))
    }
    
    /// 从文件加载配置
    pub fn load() -> anyhow::Result<Self> {
        let path = Self::config_path()?;
        
        if !path.exists() {
            log::info!("Settings file not found, using defaults");
            return Ok(Self::default());
        }
        
        let content = std::fs::read_to_string(&path)
            .map_err(|e| anyhow::anyhow!("Failed to read settings file: {}", e))?;
        
        let settings: AppSettings = serde_json::from_str(&content)
            .map_err(|e| anyhow::anyhow!("Failed to parse settings file: {}", e))?;
        
        log::info!("Loaded settings from {:?}", path);
        Ok(settings)
    }
    
    /// 保存配置到文件
    pub fn save(&self) -> anyhow::Result<()> {
        let path = Self::config_path()?;
        
        // 确保父目录存在
        if let Some(parent) = path.parent() {
            std::fs::create_dir_all(parent)
                .map_err(|e| anyhow::anyhow!("Failed to create settings directory: {}", e))?;
        }
        
        let content = serde_json::to_string_pretty(self)
            .map_err(|e| anyhow::anyhow!("Failed to serialize settings: {}", e))?;
        
        std::fs::write(&path, content)
            .map_err(|e| anyhow::anyhow!("Failed to write settings file: {}", e))?;
        
        log::info!("Saved settings to {:?}", path);
        Ok(())
    }
    
    /// 更新主题
    pub fn set_theme(&mut self, theme: ThemePreference) {
        self.theme = theme;
        self.update_timestamp();
    }
    
    /// 更新语言
    pub fn set_language(&mut self, language: Language) {
        self.language = language;
        self.update_timestamp();
    }
    
    /// 更新窗口状态
    pub fn set_window_state(&mut self, window: WindowState) {
        self.window = window;
        self.update_timestamp();
    }
    
    /// 更新通知设置
    pub fn set_notifications(&mut self, notifications: NotificationSettings) {
        self.notifications = notifications;
        self.update_timestamp();
    }
    
    /// 更新网络设置
    pub fn set_network(&mut self, network: NetworkSettings) {
        self.network = network;
        self.update_timestamp();
    }
    
    /// 更新安装偏好
    pub fn set_install_preferences(&mut self, install: InstallPreferences) {
        self.install = install;
        self.update_timestamp();
    }
    
    /// 更新用户行为
    pub fn set_user_behavior(&mut self, behavior: UserBehavior) {
        self.behavior = behavior;
        self.update_timestamp();
    }
    
    /// 更新托盘设置
    pub fn set_tray_settings(&mut self, tray: TraySettings) {
        self.tray = tray;
        self.update_timestamp();
    }
    
    /// 标记首次运行完成
    pub fn mark_first_run_complete(&mut self) {
        self.first_run = false;
        self.update_timestamp();
    }
    
    /// 更新时间戳
    fn update_timestamp(&mut self) {
        self.last_updated = chrono::Local::now().to_rfc3339();
    }
}

/// 获取当前配置
pub fn get_settings() -> anyhow::Result<AppSettings> {
    AppSettings::load()
}

/// 保存配置
pub fn save_settings(settings: &AppSettings) -> anyhow::Result<()> {
    settings.save()
}

/// 重置为默认配置
pub fn reset_settings() -> anyhow::Result<AppSettings> {
    let defaults = AppSettings::default();
    defaults.save()?;
    Ok(defaults)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_default_settings() {
        let settings = AppSettings::default();
        assert_eq!(settings.version, "1.0.0");
        assert!(settings.first_run);
    }

    #[test]
    fn test_theme_preference_serialization() {
        let theme = ThemePreference::Dark;
        let json = serde_json::to_string(&theme).unwrap();
        assert_eq!(json, "\"dark\"");
        
        let deserialized: ThemePreference = serde_json::from_str(&json).unwrap();
        assert_eq!(deserialized, ThemePreference::Dark);
    }

    #[test]
    fn test_language_serialization() {
        let lang = Language::EnUS;
        let json = serde_json::to_string(&lang).unwrap();
        assert_eq!(json, "\"en-US\"");
        
        let deserialized: Language = serde_json::from_str(&json).unwrap();
        assert_eq!(deserialized, Language::EnUS);
    }
}
