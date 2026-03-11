mod commands;

use commands::install::InstallState;
use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Manager, Runtime,
};

fn create_tray<R: Runtime>(app: &tauri::AppHandle<R>) -> Result<(), Box<dyn std::error::Error>> {
    let show_i = MenuItem::with_id(app, "show", "显示", true, None::<&str>)?;
    let hide_i = MenuItem::with_id(app, "hide", "隐藏", true, None::<&str>)?;
    let quit_i = MenuItem::with_id(app, "quit", "退出", true, None::<&str>)?;
    let menu = Menu::with_items(app, &[&show_i, &hide_i, &quit_i])?;

    let _tray = TrayIconBuilder::new()
        .icon(app.default_window_icon().ok_or("No window icon")?.clone())
        .menu(&menu)
        .tooltip("龙虾孵化器 - OpenClaw 安装器")
        .on_menu_event(|app, event| match event.id.as_ref() {
            "show" => {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }
            "hide" => {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.hide();
                }
            }
            "quit" => {
                app.exit(0);
            }
            _ => {}
        })
        .on_tray_icon_event(|tray, event| {
            match event {
                TrayIconEvent::Click {
                    button: MouseButton::Left,
                    button_state: MouseButtonState::Up,
                    ..
                } => {
                    let app = tray.app_handle();
                    if let Some(window) = app.get_webview_window("main") {
                        if let Ok(visible) = window.is_visible() {
                            if visible {
                                let _ = window.hide();
                            } else {
                                let _ = window.show();
                                let _ = window.set_focus();
                            }
                        }
                    }
                }
                TrayIconEvent::DoubleClick {
                    button: MouseButton::Left,
                    ..
                } => {
                    let app = tray.app_handle();
                    if let Some(window) = app.get_webview_window("main") {
                        let _ = window.show();
                        let _ = window.set_focus();
                    }
                }
                _ => {}
            }
        })
        .build(app)?;

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Initialize logging
    env_logger::Builder::from_default_env()
        .filter_level(log::LevelFilter::Info)
        .filter_module("tao", log::LevelFilter::Error)
        .filter_module("winit", log::LevelFilter::Error)
        .init();

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_notification::init())
        .manage(InstallState::default())
        .invoke_handler(tauri::generate_handler![
            // Environment commands
            commands::env::check_environment,
            commands::env::get_system_info,
            
            // Install commands
            commands::install::install_component,
            commands::install::get_install_progress,
            commands::install::start_full_installation,
            commands::install::is_installing,
            commands::install::is_installation_complete,
            commands::install::needs_installation_retry,
            commands::install::reset_installation_state,
            
            // Config commands (OpenClaw)
            commands::config::save_config,
            commands::config::load_config,
            commands::config::load_openclaw_config,
            commands::config::save_openclaw_config,
            commands::config::openclaw_config_exists,
            commands::config::get_plugin_configs,
            commands::config::install_onebot_plugin,
            
            // Runtime environment commands
            commands::environment::get_runtime_environments,
            commands::environment::set_current_environment,
            commands::environment::add_runtime_environment,
            commands::environment::update_runtime_environment,
            commands::environment::remove_runtime_environment,
            commands::environment::test_ssh_connection,
            
            // Settings commands (App)
            commands::settings::load_app_settings,
            commands::settings::save_app_settings,
            commands::settings::reset_app_settings,
            commands::settings::get_theme,
            commands::settings::set_theme,
            commands::settings::is_first_run,
            commands::settings::mark_first_run_complete,
            
            // Tray commands
            commands::tray::hide_to_tray,
            commands::tray::show_from_tray,
            commands::tray::is_window_visible,
            commands::tray::quit_app,
        ])
        .setup(|_| Ok(()))
        .on_window_event(|window, event| match event {
            // 点击关闭按钮时最小化到托盘而不是退出
            tauri::WindowEvent::CloseRequested { api, .. } => {
                #[cfg(not(target_os = "macos"))]
                {
                    // Windows 和 Linux：关闭时隐藏到托盘
                    api.prevent_close();
                    let _ = window.hide();
                }
                #[cfg(target_os = "macos")]
                {
                    // macOS：关闭时隐藏窗口（标准 macOS 行为）
                    api.prevent_close();
                    let _ = window.hide();
                }
            }
            _ => {}
        })
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|app, event| {
            // 在 RunEvent::Ready 时创建托盘，避免 macOS 上出现重复 Dock 图标（ghost icon）
            // 参考: https://github.com/tauri-apps/tauri/issues/9480
            if let tauri::RunEvent::Ready = event {
                if let Err(e) = create_tray(app) {
                    log::error!("Failed to create tray icon: {}", e);
                }
            }
        });
}
