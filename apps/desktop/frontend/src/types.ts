// Types matching the Rust backend

export type Component = 'NodeJs' | 'Cmake' | 'OpenClaw';

export type InstallStatus = 'NotInstalled' | 'Installing' | 'Installed' | { Failed: string };

export interface InstallResult {
  component: Component;
  success: boolean;
  message: string;
  version: string | null;
}

export interface EnvironmentCheck {
  component: Component;
  installed: boolean;
  version: string | null;
  path: string | null;
}

export interface InstallProgress {
  component: Component;
  status: InstallStatus;
  progress: number;
  message: string;
}

export interface OpenClawConfig {
  app_id: string;
  app_secret: string;
  domain: string;
  model_provider: string;
  model_name: string;
}

export interface SystemInfo {
  platform: string;
  arch: string;
  version: string;
}
