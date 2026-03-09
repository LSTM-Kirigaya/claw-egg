/**
 * 应用配置管理系统
 * 
 * 负责管理应用的所有持久化配置，包括：
 * - 主题设置
 * - 窗口状态
 * - 通知偏好
 * - 网络设置
 * - 安装偏好
 * - 用户行为记录
 * 
 * 存储位置: ~/.clawegg/settings.json
 */

import { invoke } from '@tauri-apps/api/core';
import { 
  AppSettings, 
  DEFAULT_SETTINGS, 
  ThemePreference, 
  Language,
  WindowState,
  NotificationSettings,
  NetworkSettings,
  InstallPreferences,
  UserBehavior
} from '../types';

// 配置缓存
let settingsCache: AppSettings | null = null;
let lastLoadTime = 0;
const CACHE_TTL = 5000; // 5秒缓存

/**
 * 获取配置存储路径
 */
function getSettingsPath(): string {
  return 'settings.json';
}

/**
 * 从文件加载配置
 */
export async function loadSettings(): Promise<AppSettings> {
  // 检查缓存是否有效
  const now = Date.now();
  if (settingsCache && now - lastLoadTime < CACHE_TTL) {
    return settingsCache;
  }

  try {
    const settings = await invoke<AppSettings>('load_app_settings');
    settingsCache = settings;
    lastLoadTime = now;
    return settings;
  } catch (error) {
    console.log('No existing settings found, using defaults');
    return { ...DEFAULT_SETTINGS };
  }
}

/**
 * 保存配置到文件
 */
export async function saveSettings(settings: AppSettings): Promise<void> {
  const updatedSettings = {
    ...settings,
    lastUpdated: new Date().toISOString(),
  };
  
  await invoke('save_app_settings', { settings: updatedSettings });
  settingsCache = updatedSettings;
  lastLoadTime = Date.now();
}

/**
 * 重置为默认配置
 */
export async function resetSettings(): Promise<AppSettings> {
  const defaults = { ...DEFAULT_SETTINGS };
  await saveSettings(defaults);
  return defaults;
}

// ============================================
// 部分配置更新辅助函数
// ============================================

/**
 * 更新主题设置
 */
export async function updateTheme(theme: ThemePreference): Promise<void> {
  const settings = await loadSettings();
  settings.theme = theme;
  await saveSettings(settings);
}

/**
 * 获取当前主题设置
 */
export async function getTheme(): Promise<ThemePreference> {
  const settings = await loadSettings();
  return settings.theme;
}

/**
 * 更新语言设置
 */
export async function updateLanguage(language: Language): Promise<void> {
  const settings = await loadSettings();
  settings.language = language;
  await saveSettings(settings);
}

/**
 * 获取当前语言
 */
export async function getLanguage(): Promise<Language> {
  const settings = await loadSettings();
  return settings.language;
}

/**
 * 更新窗口状态
 */
export async function updateWindowState(windowState: Partial<WindowState>): Promise<void> {
  const settings = await loadSettings();
  settings.window = { ...settings.window, ...windowState };
  await saveSettings(settings);
}

/**
 * 获取窗口状态
 */
export async function getWindowState(): Promise<WindowState> {
  const settings = await loadSettings();
  return settings.window;
}

/**
 * 更新通知设置
 */
export async function updateNotificationSettings(
  notifications: Partial<NotificationSettings>
): Promise<void> {
  const settings = await loadSettings();
  settings.notifications = { ...settings.notifications, ...notifications };
  await saveSettings(settings);
}

/**
 * 获取通知设置
 */
export async function getNotificationSettings(): Promise<NotificationSettings> {
  const settings = await loadSettings();
  return settings.notifications;
}

/**
 * 更新网络设置
 */
export async function updateNetworkSettings(
  network: Partial<NetworkSettings>
): Promise<void> {
  const settings = await loadSettings();
  settings.network = { ...settings.network, ...network };
  await saveSettings(settings);
}

/**
 * 获取网络设置
 */
export async function getNetworkSettings(): Promise<NetworkSettings> {
  const settings = await loadSettings();
  return settings.network;
}

/**
 * 更新安装偏好
 */
export async function updateInstallPreferences(
  install: Partial<InstallPreferences>
): Promise<void> {
  const settings = await loadSettings();
  settings.install = { ...settings.install, ...install };
  await saveSettings(settings);
}

/**
 * 获取安装偏好
 */
export async function getInstallPreferences(): Promise<InstallPreferences> {
  const settings = await loadSettings();
  return settings.install;
}

/**
 * 更新用户行为记录
 */
export async function updateUserBehavior(
  behavior: Partial<UserBehavior>
): Promise<void> {
  const settings = await loadSettings();
  settings.behavior = { ...settings.behavior, ...behavior };
  await saveSettings(settings);
}

/**
 * 获取用户行为记录
 */
export async function getUserBehavior(): Promise<UserBehavior> {
  const settings = await loadSettings();
  return settings.behavior;
}

/**
 * 标记首次运行完成
 */
export async function markFirstRunComplete(): Promise<void> {
  const settings = await loadSettings();
  settings.firstRun = false;
  await saveSettings(settings);
}

/**
 * 检查是否首次运行
 */
export async function isFirstRun(): Promise<boolean> {
  const settings = await loadSettings();
  return settings.firstRun;
}

// ============================================
// React Hook
// ============================================

import { useState, useEffect, useCallback } from 'react';

/**
 * React Hook: 使用应用配置
 * 
 * 用法:
 * ```tsx
 * const { settings, updateTheme, isLoading } = useAppSettings();
 * ```
 */
export function useAppSettings() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  // 初始加载
  useEffect(() => {
    loadSettings()
      .then(setSettings)
      .finally(() => setIsLoading(false));
  }, []);

  // 完整更新配置
  const updateSettings = useCallback(async (newSettings: Partial<AppSettings>) => {
    const updated = { ...settings, ...newSettings };
    await saveSettings(updated);
    setSettings(updated);
  }, [settings]);

  // 更新主题
  const setTheme = useCallback(async (theme: ThemePreference) => {
    await updateTheme(theme);
    setSettings(prev => ({ ...prev, theme }));
  }, []);

  // 更新语言
  const setLanguage = useCallback(async (language: Language) => {
    await updateLanguage(language);
    setSettings(prev => ({ ...prev, language }));
  }, []);

  // 重置配置
  const reset = useCallback(async () => {
    const defaults = await resetSettings();
    setSettings(defaults);
  }, []);

  return {
    settings,
    isLoading,
    updateSettings,
    setTheme,
    setLanguage,
    reset,
  };
}

// ============================================
// 事件监听
// ============================================

/**
 * 配置变更监听器类型
 */
type SettingsChangeListener = (settings: AppSettings) => void;

const listeners: SettingsChangeListener[] = [];

/**
 * 监听配置变更
 */
export function onSettingsChange(listener: SettingsChangeListener): () => void {
  listeners.push(listener);
  return () => {
    const index = listeners.indexOf(listener);
    if (index > -1) {
      listeners.splice(index, 1);
    }
  };
}

/**
 * 触发配置变更事件
 */
function notifyListeners(settings: AppSettings): void {
  listeners.forEach(listener => listener(settings));
}
