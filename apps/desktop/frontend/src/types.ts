// Types matching the Rust backend

export type Component = 'NodeJs' | 'OpenClaw';

export type InstallStatus = 'NotInstalled' | 'Installing' | 'Installed' | { Failed: string };

export type InstallStage = 
  | 'EnvironmentCheck' 
  | 'DownloadNodeJs' 
  | 'InstallNodeJs' 
  | 'InstallQwenCli' 
  | 'InstallOpenClaw' 
  | 'ConfigureOpenClaw' 
  | 'Completed' 
  | 'Failed';

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

export interface ComponentProgress {
  component: Component;
  status: InstallStatus;
  progress: number;
  message: string;
}

export interface OverallProgress {
  stage: InstallStage;
  stage_progress: number;
  overall_progress: number;
  message: string;
  detail: string | null;
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

// Stage display names
export const STAGE_NAMES: Record<InstallStage, string> = {
  EnvironmentCheck: '检查环境',
  DownloadNodeJs: '下载 Node.js',
  InstallNodeJs: '安装 Node.js',
  InstallQwenCli: '安装 Qwen CLI',
  InstallOpenClaw: '安装 OpenClaw',
  ConfigureOpenClaw: '配置 OpenClaw',
  Completed: '安装完成',
  Failed: '安装失败',
};

// Stage order for progress calculation
export const STAGE_ORDER: InstallStage[] = [
  'EnvironmentCheck',
  'DownloadNodeJs',
  'InstallNodeJs',
  'InstallQwenCli',
  'InstallOpenClaw',
  'ConfigureOpenClaw',
  'Completed',
];
