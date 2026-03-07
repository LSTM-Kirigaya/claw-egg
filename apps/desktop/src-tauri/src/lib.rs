mod commands;

use commands::install::InstallState;

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
            commands::env::check_environment,
            commands::env::get_system_info,
            commands::install::install_component,
            commands::install::get_install_progress,
            commands::install::start_full_installation,
            commands::install::is_installing,
            commands::config::save_config,
            commands::config::load_config,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
