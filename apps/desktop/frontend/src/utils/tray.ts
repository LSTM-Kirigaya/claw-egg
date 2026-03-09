import { invoke } from '@tauri-apps/api/core';

/**
 * 隐藏窗口到系统托盘
 */
export async function hideToTray(): Promise<void> {
  try {
    await invoke('hide_to_tray');
  } catch (error) {
    console.error('Failed to hide to tray:', error);
    throw error;
  }
}

/**
 * 从系统托盘显示窗口
 */
export async function showFromTray(): Promise<void> {
  try {
    await invoke('show_from_tray');
  } catch (error) {
    console.error('Failed to show from tray:', error);
    throw error;
  }
}

/**
 * 检查窗口是否可见
 */
export async function isWindowVisible(): Promise<boolean> {
  try {
    return await invoke('is_window_visible');
  } catch (error) {
    console.error('Failed to check window visibility:', error);
    return false;
  }
}

/**
 * 退出应用
 */
export async function quitApp(): Promise<void> {
  try {
    await invoke('quit_app');
  } catch (error) {
    console.error('Failed to quit app:', error);
    throw error;
  }
}
