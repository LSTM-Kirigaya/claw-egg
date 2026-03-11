# 龙虾孵化器 (ClawEgg) 项目指南

> 本文档面向 AI 编程助手，旨在帮助快速理解和参与 龙虾孵化器 项目的开发。

## 项目概述

**龙虾孵化器**（ClawEgg）是一个跨平台的 OpenClaw AI Agent 平台一键安装器。项目采用 Tauri v2 框架构建，将 Rust 后端与 React 前端结合，提供原生的桌面应用体验。

### 核心功能
- 🚀 **一键安装**：使用 clawd.org.cn 官方脚本自动安装 Node.js 和 OpenClaw
- 🔍 **环境检测**：智能检测系统环境，Node.js 版本必须 >=22 且为偶数版本
- 🔄 **断点续装**：安装状态持久化到 `~/.clawegg/installation_state.json`，支持中断后继续
- 🎨 **友好界面**：现代化的 UI 设计，支持亮色/深色/系统三种主题模式，主题色为苹果红 (#FF3B30)
- 🖥️ **跨平台**：支持 Windows (x86_64) 和 macOS (ARM64)
- 🔐 **安全配置**：图形化配置多平台机器人（飞书、Discord、Telegram、QQ 等）
- 📦 **运行环境管理**：支持本机和远程 SSH 服务器作为 OpenClaw 运行环境
- 🔔 **托盘集成**：支持最小化到系统托盘，点击托盘图标可恢复窗口

## 技术栈

### 后端（Rust）
- **Tauri v2**：跨平台桌面应用框架
- **Tokio**：异步运行时
- **Serde**：序列化/反序列化
- **Anyhow/Thiserror**：错误处理
- **Chrono**：时间处理
- **Reqwest**：HTTP 客户端

### 前端（TypeScript/React）
- **React 19**：UI 框架
- **Vite 7**：构建工具
- **TypeScript 5.9**：类型安全
- **Tailwind CSS 3**：原子化 CSS
- **Material-UI (MUI) v7**：组件库
- **Lucide React**：图标库
- **i18next**：国际化支持

### 开发工具
- **Rust 1.86+**
- **Node.js 20+**
- **npm** 或 **pnpm**

## 项目结构

```
claw-egg/
├── Cargo.toml                      # Rust 工作区配置
├── README.md                       # 项目说明
├── AGENTS.md                       # 本文件 - AI 编程助手指南
├── .github/workflows/              # CI/CD 配置
│   ├── ci.yml                      # 持续集成
│   └── release.yml                 # 发布流程
├── crates/
│   └── installer/                  # 核心安装器库
│       ├── Cargo.toml
│       └── src/
│           ├── lib.rs              # 库入口
│           ├── types.rs            # 核心类型定义（InstallStage, OpenClawConfig 等）
│           ├── config.rs           # OpenClaw 配置管理
│           ├── settings.rs         # 应用配置管理（AppSettings）
│           ├── detector.rs         # 环境检测器（Node.js 版本检测）
│           ├── downloader.rs       # 文件下载器
│           ├── orchestrator.rs     # 安装流程编排
│           ├── paths.rs            # 路径管理
│           ├── script_installer.rs # 官方脚本安装实现
│           ├── ssh_runner.rs       # SSH 远程执行
│           └── installer/          # 各组件安装器
│               ├── mod.rs
│               ├── node.rs         # Node.js 安装
│               └── openclaw.rs     # OpenClaw 安装
├── apps/
│   ├── desktop/                    # Tauri 桌面应用
│   │   ├── package.json            # Node 脚本配置
│   │   ├── app-icon.png            # 应用图标
│   │   ├── frontend/               # React 前端
│   │   │   ├── package.json        # 前端依赖
│   │   │   ├── tsconfig.json       # TypeScript 配置
│   │   │   ├── vite.config.ts      # Vite 配置
│   │   │   ├── tailwind.config.js  # Tailwind 配置
│   │   │   └── src/
│   │   │       ├── App.tsx         # 主应用组件
│   │   │       ├── main.tsx        # 入口文件
│   │   │       ├── types.ts        # TypeScript 类型定义
│   │   │       ├── utils/          # 工具函数
│   │   │       │   ├── settings.ts # 配置管理模块
│   │   │       │   └── tray.ts     # 托盘工具
│   │   │       └── components/     # UI 组件
│   │   │           ├── InstallerLayer.tsx    # 安装层
│   │   │           ├── MainLayer.tsx         # 主体层
│   │   │           ├── ManageTab.tsx         # 管理板块
│   │   │           ├── MarketplaceTab.tsx    # 插件市场板块
│   │   │           ├── CommunityTab.tsx      # 社区板块
│   │   │           ├── SettingsDialog.tsx    # 设置对话框
│   │   │           ├── InstallWizard.tsx     # 安装向导
│   │   │           ├── EnvironmentSelector.tsx # 运行环境选择器
│   │   │           ├── AddServerDialog.tsx   # 添加服务器对话框
│   │   │           └── CloseConfirmDialog.tsx # 关闭确认对话框
│   │   └── src-tauri/              # Rust 后端
│   │       ├── Cargo.toml          # Tauri 应用配置
│   │       ├── tauri.conf.json     # Tauri 配置文件
│   │       └── src/
│   │           ├── main.rs         # 程序入口
│   │           ├── lib.rs          # 库入口
│   │           └── commands/       # Tauri 命令
│   │               ├── mod.rs
│   │               ├── env.rs      # 环境检测命令
│   │               ├── install.rs  # 安装命令
│   │               ├── config.rs   # OpenClaw 配置命令
│   │               ├── settings.rs # 应用设置命令
│   │               ├── environment.rs # 运行环境管理
│   │               └── tray.rs     # 托盘相关命令
│   └── images/                     # 图片资源
└── scripts/                        # 辅助脚本
    └── clear-cache.bat             # 清理缓存脚本
```

## 构建与开发

### 环境准备

确保已安装以下工具：

```bash
# Rust（1.86+）
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Node.js（20+）
# 从 https://nodejs.org 下载安装

# 验证安装
rustc --version    # >= 1.86
node --version     # >= 20
```

### 开发模式

```bash
# 进入桌面应用目录
cd apps/desktop

# 安装前端依赖（首次）
cd frontend && npm install && cd ..

# 启动开发服务器（同时启动 Rust 后端和 React 前端）
npm run dev
```

开发服务器启动后：
- 前端开发服务器：http://localhost:5173
- Tauri 应用窗口将自动打开
- 修改前端代码会自动热重载
- 修改 Rust 代码会自动重新编译

### 构建发布版本

```bash
cd apps/desktop

# Windows x86_64
npx tauri build --target x86_64-pc-windows-msvc

# macOS ARM64 (Apple Silicon)
npx tauri build --target aarch64-apple-darwin

# 仅构建可执行文件（不打包安装器）
npm run build:exe
```

构建输出位置：
- Windows: `target/x86_64-pc-windows-msvc/release/bundle/`
- macOS: `target/aarch64-apple-darwin/release/bundle/`

## 代码风格与规范

### Rust 代码规范

项目使用工作区级别的 lint 配置（根目录 `Cargo.toml`）：

```toml
[workspace.lints.rust]
unsafe_code = "warn"
unused_imports = "warn"
dead_code = "warn"

[workspace.lints.clippy]
correctness = { level = "deny", priority = -1 }
suspicious = { level = "warn", priority = -1 }
complexity = { level = "warn", priority = -1 }
perf = { level = "warn", priority = -1 }
style = { level = "warn", priority = -1 }
```

**关键规则**：
- `unsafe_code` 标记为警告（非禁止，允许必要时使用）
- 所有 crate 继承工作区 lint 配置：`[lints] workspace = true`
- Tauri 命令允许较多参数：`too_many_arguments = "allow"`

格式化命令：
```bash
cargo fmt --all
```

检查命令：
```bash
cargo clippy --workspace --all-targets
```

### TypeScript/React 代码规范

- 使用严格模式（`strict: true`）
- 启用未使用变量检查（`noUnusedLocals: true`）
- 路径别名：`@/*` 映射到 `src/*`

代码检查：
```bash
cd apps/desktop/frontend
npm run lint
```

类型检查：
```bash
npx tsc -b --noEmit
```

### UI 设计规范

**颜色系统**（Tailwind 配置）：
- 主色：`#FF3B30`（苹果红）
- 主色悬停：`#FF5A50`
- 副色：`#1A1A1A`（黑色）
- 背景：`#FFFFFF`（白色）/ `#F5F5F5`（浅灰卡片背景）
- 文字：`#1A1A1A`（主文字）/ `#9CA3AF`（辅助文字）
- 主按钮文字：白色 (`#FFFFFF`)

**主题支持**：
- 支持亮色/暗黑/系统三种主题模式
- 通过 `ThemeProvider` 和 CSS class 切换实现
- 暗黑模式类名：`dark`

## 配置管理系统

应用使用统一的配置管理系统来持久化所有用户设置。

### 配置文件位置

| 配置类型 | 路径 |
|---------|------|
| 应用配置 | `~/.clawegg/settings.json` |
| 安装状态 | `~/.clawegg/installation_state.json` |
| OpenClaw 配置 | `~/.openclaw/openclaw.json` |

### AppSettings 结构

```rust
pub struct AppSettings {
    pub version: String,                    // 配置版本
    pub theme: ThemePreference,             // 主题: System/Light/Dark
    pub language: Language,                 // 语言: ZhCN/EnUS
    pub window: WindowState,                // 窗口状态
    pub notifications: NotificationSettings,// 通知设置
    pub network: NetworkSettings,           // 网络设置
    pub install: InstallPreferences,        // 安装偏好
    pub behavior: UserBehavior,             // 用户行为
    pub tray: TraySettings,                 // 托盘设置
    pub runtime_environments: RuntimeEnvironmentSettings, // 运行环境
    pub first_run: bool,                    // 首次运行标记
    pub last_updated: String,               // 最后更新时间
}
```

### 前端配置管理

前端配置管理模块位于 `apps/desktop/frontend/src/utils/settings.ts`：

```typescript
// 加载配置
const settings = await loadSettings();

// 更新主题
await updateTheme('dark');

// 更新通知设置
await updateNotificationSettings({ sound: false });

// React Hook 使用
const { settings, setTheme, setLanguage } = useAppSettings();
```

### 后端配置命令

Rust 后端提供以下配置命令：

| 命令 | 描述 |
|------|------|
| `load_app_settings` | 加载应用配置 |
| `save_app_settings` | 保存应用配置 |
| `reset_app_settings` | 重置为默认配置 |
| `get_theme` / `set_theme` | 获取/设置主题 |
| `is_first_run` / `mark_first_run_complete` | 首次运行标记 |

## 架构说明

### 软件分层

应用分为两个层级：

#### 第一层：安装层 (`InstallerLayer`)
- 首次启动或未完成安装时显示
- 显示环境检测结果（Node.js 版本、OpenClaw 状态）
- Node.js 必须满足 >=22 且为偶数版本
- 显示安装进度条和详细日志输出
- 支持安装失败重试
- 安装完成后自动进入主界面

#### 第二层：主体层 (`MainLayer`)
- 安装完成后显示
- 包含三个板块：
  1. **管理** (`ManageTab`)：OpenClaw 配置管理
  2. **插件市场** (`MarketplaceTab`)：浏览和安装插件
  3. **社区** (`CommunityTab`)：用户交流和讨论

### Tauri 命令（Backend API）

前端通过 `invoke` 调用 Rust 后端命令：

```typescript
import { invoke } from '@tauri-apps/api/core';

// 环境检测
const checks = await invoke<EnvironmentCheck[]>('check_environment');

// 开始安装
await invoke('start_full_installation');

// 检查安装状态
const isComplete = await invoke<boolean>('is_installation_complete');

// 读取 OpenClaw 配置
const config = await invoke<OpenClawConfig>('load_openclaw_config');

// 保存 OpenClaw 配置
await invoke('save_openclaw_config', { config });
```

可用命令定义在 `apps/desktop/src-tauri/src/lib.rs`：

**环境命令**：
- `check_environment`：检测系统环境（Node.js 版本、OpenClaw 状态）
- `get_system_info`：获取系统信息

**安装命令**：
- `start_full_installation`：开始完整安装
- `is_installing`：检查是否正在安装
- `is_installation_complete`：检查是否已完成安装
- `needs_installation_retry`：检查是否需要重试安装
- `reset_installation_state`：重置安装状态

**OpenClaw 配置命令**（存储在 ~/.openclaw/openclaw.json）：
- `load_openclaw_config`：读取 OpenClaw 配置
- `save_openclaw_config`：保存 OpenClaw 配置
- `get_plugin_configs`：获取插件配置列表
- `install_onebot_plugin`：安装 OneBot 插件

**运行环境命令**：
- `get_runtime_environments`：获取运行环境列表
- `set_current_environment`：设置当前环境
- `add_runtime_environment`：添加环境
- `update_runtime_environment`：更新环境
- `remove_runtime_environment`：删除环境
- `test_ssh_connection`：测试 SSH 连接

**应用设置命令**（存储在 ~/.clawegg/settings.json）：
- `load_app_settings`：加载应用配置
- `save_app_settings`：保存应用配置
- `reset_app_settings`：重置为默认配置
- `get_theme` / `set_theme`：获取/设置主题
- `is_first_run` / `mark_first_run_complete`：首次运行标记

**托盘命令**：
- `hide_to_tray`：隐藏到托盘
- `show_from_tray`：从托盘显示
- `is_window_visible`：检查窗口是否可见
- `quit_app`：退出应用

### 安装流程

安装流程由 `InstallOrchestrator` 编排，使用 clawd.org.cn 官方安装脚本：

1. **EnvironmentCheck** - 检查环境
2. **DownloadNodeJs** - 下载安装脚本
3. **InstallNodeJs** - 执行脚本安装 Node.js
4. **InstallOpenClaw** - 执行脚本安装 OpenClaw
5. **ConfigureOpenClaw** - 配置 OpenClaw
6. **Completed** - 完成

安装状态会持久化到 `~/.clawegg/installation_state.json`，支持：
- 断点续装：中断后可从当前阶段继续
- 失败重试：失败后可重新尝试

进度通过回调实时推送到前端。

### 类型对应

Rust 类型与 TypeScript 类型需保持一致：

| Rust (`crates/installer/src/types.rs`) | TypeScript (`apps/desktop/frontend/src/types.ts`) |
|----------------------------------------|---------------------------------------------------|
| `InstallStage` 枚举 | `InstallStage` 联合类型 |
| `OverallProgress` 结构体 | `OverallProgress` 接口 |
| `EnvironmentCheck` 结构体 | `EnvironmentCheck` 接口 |
| `Component` 枚举 | `Component` 联合类型 |
| `OpenClawConfig` 结构体 | `OpenClawConfig` 接口 |
| `AppSettings` 结构体 | `AppSettings` 接口 |

修改类型定义时需同时更新两端。

## 测试

### Rust 测试

```bash
# 运行所有测试
cargo test --workspace --all-targets

# 运行特定 crate 测试
cargo test -p claw-egg-installer
```

测试文件通常放在 `src/` 目录下，使用 `#[cfg(test)]` 模块：

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_example() {
        assert_eq!(2 + 2, 4);
    }
}
```

### 前端测试

前端目前以手动测试为主，通过开发模式验证功能。

## CI/CD

### 持续集成（CI）

`.github/workflows/ci.yml`：
- **Clippy**：代码检查（Ubuntu）
- **Rustfmt**：格式化检查
- **Test**：多平台测试（Ubuntu/Windows/macOS）
- **Security Audit**：依赖安全审计
- **Frontend**：前端类型检查、Lint、构建

### 发布流程（Release）

`.github/workflows/release.yml`：

触发条件：
- 推送标签 `v*`
- Commit 消息包含 `[release]`
- 手动触发（workflow_dispatch）

构建目标：
- Windows x86_64（MSI 安装包）
- macOS ARM64（DMG 安装包）

发布步骤：
1. 检查发布条件
2. 构建前端（`npm run build`）
3. 构建 Tauri 应用（`tauri build`）
4. 打包安装程序
5. 创建 GitHub Release 并上传产物

## 开发注意事项

### 新增 Tauri 命令

1. 在 `apps/desktop/src-tauri/src/commands/` 下创建或修改模块
2. 在 `commands/mod.rs` 中导出
3. 在 `lib.rs` 的 `invoke_handler` 中注册
4. 前端添加对应的类型定义和调用函数

### 修改安装流程

安装逻辑位于 `crates/installer/src/`：
- `orchestrator.rs`：整体流程控制
- `script_installer.rs`：官方脚本下载和执行
- `detector.rs`：环境检测

### 修改 Node.js 版本检测

Node.js 版本要求：
- 主版本 >= 22
- 主版本必须为偶数（22, 24, 26...）

修改位置：
- `crates/installer/src/detector.rs`：`check_nodejs()` 和 `is_valid_node_version()`

### 添加新的前端组件

1. 在 `apps/desktop/frontend/src/components/` 创建组件
2. 使用 Tailwind CSS 进行样式设计
3. 使用 MUI 组件库保持一致性
4. 支持暗黑模式（检查 `themeMode` 变量）
5. 主按钮使用白色文字：`color: '#FFFFFF'`

### 平台特定代码

检测平台：
```typescript
// 前端
const platform = navigator.platform.toLowerCase();
// 'macos' | 'windows' | 'linux'
```

```rust
// 后端
#[cfg(target_os = "windows")]
#[cfg(target_os = "macos")]
```

### 安全考虑

- Tauri 默认启用安全策略（CSP）
- 文件系统访问通过插件控制
- Shell 命令需要显式配置权限
- 代码签名需要配置密钥（`TAURI_PRIVATE_KEY`）

## 常见问题

### 构建失败

1. 确保 Rust 和 Node.js 版本符合要求
2. 清除缓存：`cargo clean` 和删除 `node_modules`
3. Windows 需要安装 Visual Studio Build Tools
4. macOS 需要 Xcode Command Line Tools

### 前端热重载失效

检查 Vite 配置中的 `watch.ignored` 设置，确保没有误忽略需要监听的文件。

### Tauri 命令无响应

检查 Rust 代码是否 panic，查看控制台输出的错误信息。确保所有命令都正确注册在 `invoke_handler` 中。

### Node.js 版本检测失败

检查 `which node` 是否能找到 node 可执行文件。确保 Node.js 版本 >= 22 且为偶数版本。

## 相关链接

- [Tauri 文档](https://tauri.app/)
- [React 文档](https://react.dev/)
- [Tailwind CSS 文档](https://tailwindcss.com/)
- [Material-UI 文档](https://mui.com/)
- [OpenClaw 项目](https://github.com/LSTM-Kirigaya/OpenClaw)
