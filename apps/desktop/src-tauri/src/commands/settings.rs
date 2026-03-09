//! 应用配置管理命令
//!
//! 处理前端发来的配置读写请求

use claw_egg_installer::settings::{AppSettings, save_settings};
use tauri::command;

/// 加载应用配置
#[command]
pub fn load_app_settings() -> Result<AppSettings, String> {
    AppSettings::load().map_err(|e| e.to_string())
}

/// 保存应用配置
#[command]
pub fn save_app_settings(settings: AppSettings) -> Result<(), String> {
    save_settings(&settings).map_err(|e| e.to_string())
}

/// 重置为默认配置
#[command]
pub fn reset_app_settings() -> Result<AppSettings, String> {
    claw_egg_installer::settings::reset_settings().map_err(|e| e.to_string())
}

/// 获取主题设置
#[command]
pub fn get_theme() -> Result<String, String> {
    let settings = AppSettings::load().map_err(|e| e.to_string())?;
    let theme_str = match settings.theme {
        claw_egg_installer::settings::ThemePreference::System => "system",
        claw_egg_installer::settings::ThemePreference::Light => "light",
        claw_egg_installer::settings::ThemePreference::Dark => "dark",
    };
    Ok(theme_str.to_string())
}

/// 更新主题设置
#[command]
pub fn set_theme(theme: String) -> Result<(), String> {
    let mut settings = AppSettings::load().map_err(|e| e.to_string())?;
    
    let theme_enum = match theme.as_str() {
        "light" => claw_egg_installer::settings::ThemePreference::Light,
        "dark" => claw_egg_installer::settings::ThemePreference::Dark,
        _ => claw_egg_installer::settings::ThemePreference::System,
    };
    
    settings.set_theme(theme_enum);
    settings.save().map_err(|e| e.to_string())
}

/// 检查是否首次运行
#[command]
pub fn is_first_run() -> Result<bool, String> {
    let settings = AppSettings::load().map_err(|e| e.to_string())?;
    Ok(settings.first_run)
}

/// 标记首次运行完成
#[command]
pub fn mark_first_run_complete() -> Result<(), String> {
    let mut settings = AppSettings::load().map_err(|e| e.to_string())?;
    settings.mark_first_run_complete();
    settings.save().map_err(|e| e.to_string())
}
