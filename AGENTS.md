# 龙虾孵化器 项目指南

> 本文档面向 AI 编程助手，旨在帮助快速理解和参与 龙虾孵化器 项目的开发。

## 项目概述

**龙虾孵化器**（ 龙虾孵化器 / claw-egg ）是一个跨平台的 OpenClaw AI Agent 平台一键安装器。项目采用 Tauri 框架构建，将 Rust 后端与 React 前端结合，提供原生的桌面应用体验。

### 核心功能
- 🚀 一键安装：自动检测并安装 Node.js、OpenClaw 等依赖
- 🔍 环境检测：智能检测系统环境，Node.js 版本必须 >=22 且为偶数版本
- 🔄 断点续装：安装失败或中断后可从中断处继续
- 🎨 友好界面：现代化的 UI 设计，支持暗黑模式，主题色为苹果红 (#FF3B30)
- 🖥️ 跨平台：支持 Windows 和 macOS
- 🔐 安全配置：图形化配置飞书机器人、API 密钥等，配置存储在 ~/.openclaw/openclaw.json
- 📦 插件市场：浏览和安装 OpenClaw 插件
- 👥 社区：用户交流和经验分享

## 技术栈

### 后端（Rust）
- **Tauri v2**：跨平台桌面应用框架
- **Tokio**：异步运行时
- **Serde**：序列化/反序列化
- **Anyhow/Thiserror**：错误处理
- **Chrono**：时间处理

### 前端（TypeScript/React）
- **React 19**：UI 框架
- **Vite**：构建工具
- **TypeScript**：类型安全
- **Tailwind CSS**：原子化 CSS
- **Material-UI (MUI) v7**：组件库
- **Lucide React**：图标库

### 开发工具
- **Rust 1.86+**
- **Node.js 20+**
- **npm** 或 **pnpm**

## 项目结构

```
claw-egg/
├── Cargo.toml                 # Rust 工作区配置
├── apps/
│   └── desktop/               # Tauri 桌面应用
│       ├── package.json       # Node 脚本配置
│       ├── frontend/          # React 前端
│       │   ├── src/
│       │   │   ├── App.tsx           # 主应用组件
│       │   │   ├── main.tsx          # 入口文件
│       │   │   ├── types.ts          # TypeScript 类型定义
│       │   │   ├── utils/            # 工具函数
│       │   │   │   └── settings.ts   # 配置管理模块
│       │   │   └── components/       # UI 组件
│       │   │       ├── InstallerLayer.tsx   # 安装层（第一层）
│       │   │       ├── MainLayer.tsx        # 主体层（第二层）
│       │   │       ├── ManageTab.tsx        # 管理板块
│       │   │       ├── MarketplaceTab.tsx   # 插件市场板块
│       │   │       ├── CommunityTab.tsx     # 社区板块
│       │   │       └── SettingsDialog.tsx   # 设置对话框
│       │   ├── package.json   # 前端依赖
│       │   ├── tsconfig.json  # TypeScript 配置
│       │   ├── vite.config.ts # Vite 配置
│       │   └── tailwind.config.js    # Tailwind 配置
│       └── src-tauri/         # Rust 后端
│           ├── Cargo.toml     # Tauri 应用配置
│           ├── tauri.conf.json        # Tauri 配置文件
│           └── src/
│               ├── main.rs    # 程序入口
│               ├── lib.rs     # 库入口
│               └── commands/  # Tauri 命令
│                   ├── mod.rs
│                   ├── env.rs         # 环境检测命令
│                   ├── install.rs     # 安装命令
│                   ├── config.rs      # OpenClaw 配置命令
│                   └── settings.rs    # 应用设置命令
├── crates/
│   └── installer/             # 核心安装器库
│       ├── Cargo.toml
│       └── src/
│           ├── lib.rs         # 库入口
│           ├── types.rs       # 核心类型定义
│           ├── config.rs      # OpenClaw 配置管理
│           ├── settings.rs    # 应用配置管理
│           ├── detector.rs    # 环境检测器
│           ├── downloader.rs  # 文件下载器
│           ├── orchestrator.rs        # 安装流程编排
│           ├── paths.rs       # 路径管理
│           └── installer/     # 各组件安装器
│               ├── mod.rs
│               ├── node.rs    # Node.js 安装
│               └── openclaw.rs        # OpenClaw 安装
├── .github/
│   └── workflows/
│       ├── ci.yml             # CI 工作流
│       └── release.yml        # 发布工作流
└── assets/                    # 静态资源
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

应用使用统一的配置管理系统来持久化所有用户设置，配置文件存储在 `~/.clawegg/settings.json`。

### 配置结构

```typescript
interface AppSettings {
  // 配置版本，用于迁移
  version: string;
  
  // 外观设置
  theme: 'light' | 'dark' | 'system';
  language: 'zh-CN' | 'en-US';
  
  // 窗口状态
  window: {
    width: number;
    height: number;
    x?: number;
    y?: number;
    maximized: boolean;
  };
  
  // 通知设置
  notifications: {
    enabled: boolean;
    sound: boolean;
    installationComplete: boolean;
    updateAvailable: boolean;
  };
  
  // 网络设置
  network: {
    useChinaMirror: boolean;
    customMirror?: string;
    proxyEnabled: boolean;
    proxyUrl?: string;
  };
  
  // 安装偏好
  install: {
    autoInstall: boolean;
    installPath?: string;
    keepDownloads: boolean;
    verifyChecksums: boolean;
  };
  
  // 用户行为记录
  behavior: {
    lastActiveTab: string;
    expandedSections: string[];
    recentPlugins: string[];
  };
  
  // 元数据
  firstRun: boolean;
  lastUpdated: string;
}
```

### 配置文件位置

| 平台 | 路径 |
|------|------|
| Windows | `%USERPROFILE%\.clawegg\settings.json` |
| macOS/Linux | `~/.clawegg/settings.json` |

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

### 配置持久化时机

- **主题变更**：用户切换主题时立即保存
- **窗口状态**：窗口大小/位置改变时自动保存
- **设置对话框**：切换开关时自动保存
- **应用退出**：自动保存当前状态

### 配置版本迁移

配置文件中包含 `version` 字段，用于后续配置结构变更时的迁移：

```rust
// 加载时检查版本
if settings.version != CURRENT_VERSION {
    settings = migrate_settings(settings);
}
```

## 架构说明

### 软件分层

应用分为两个层级：

#### 第一层：安装层 (`InstallerLayer`)
- 首次启动或未完成安装时显示
- 显示环境检测结果（Node.js 版本、OpenClaw 状态）
- Node.js 必须满足 >=22 且为偶数版本
- 显示安装进度条和详细状态
- 支持安装失败重试
- 用户确认后可跳过安装直接进入主界面

#### 第二层：主体层 (`MainLayer`)
- 安装完成后或用户选择跳过安装后显示
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

**应用设置命令**（存储在 ~/.clawegg/settings.json）：
- `load_app_settings`：加载应用配置
- `save_app_settings`：保存应用配置
- `reset_app_settings`：重置为默认配置
- `get_theme` / `set_theme`：获取/设置主题
- `is_first_run` / `mark_first_run_complete`：首次运行标记

### 安装流程

安装流程由 `InstallOrchestrator` 编排，包含以下阶段：

1. **EnvironmentCheck** - 检查环境
2. **DownloadNodeJs** - 下载 Node.js（如果不符合版本要求）
3. **InstallNodeJs** - 安装 Node.js
4. **InstallOpenClaw** - 安装 OpenClaw
5. **ConfigureOpenClaw** - 配置 OpenClaw
6. **Completed** - 完成

安装状态会持久化到 `~/.clawegg/installation_state.json`，支持：
- 断点续装：中断后可从中断处继续
- 失败重试：失败后可重新尝试

进度通过 Tauri 事件实时推送到前端：
```rust
app_handle.emit("install-progress", progress)?;
```

### 配置存储

**龙虾孵化器 内部配置**：
- 路径：`~/.clawegg/openclaw_config.json`
- 用途：龙虾孵化器 应用自身的设置

**OpenClaw 配置**：
- 路径：`~/.openclaw/openclaw.json`
- 用途：OpenClaw 实际的运行配置
- 结构体字段：
  - `app_id`: 飞书 App ID
  - `app_secret`: 飞书 App Secret
  - `domain`: 平台域名 (feishu.cn / larksuite.com)
  - `model_provider`: 模型提供商 (qwen / openai / anthropic)
  - `model_name`: 模型名称
  - `api_key`: API 密钥（可选）
  - `base_url`: 自定义 API 端点（可选）

### 类型对应

Rust 类型与 TypeScript 类型需保持一致：

| Rust (`crates/installer/src/types.rs`) | TypeScript (`apps/desktop/frontend/src/types.ts`) |
|----------------------------------------|---------------------------------------------------|
| `InstallStage` 枚举 | `InstallStage` 联合类型 |
| `OverallProgress` 结构体 | `OverallProgress` 接口 |
| `EnvironmentCheck` 结构体 | `EnvironmentCheck` 接口 |
| `Component` 枚举 | `Component` 联合类型 |
| `OpenClawConfig` 结构体 | `OpenClawConfig` 接口 |
| `PluginConfig` 结构体 | `PluginConfig` 接口 |

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

## 图标与资源更新

### 图标文件位置

应用使用以下图标文件：

| 位置 | 用途 | 尺寸 |
|------|------|------|
| `apps/desktop/app-icon.png` | 前端左上角图标 | 128x128px+ |
| `apps/desktop/src-tauri/icons/` | Tauri 应用图标 | 多种尺寸 |

### 更新图标

**开发模式（左上角图标）**:
1. 替换 `apps/desktop/app-icon.png` 文件
2. **强制刷新缓存**（见下文）

**生产构建（任务栏/应用图标）**:
1. 替换 `apps/desktop/src-tauri/icons/` 目录下的所有图标文件
2. 重新构建应用：`npm run tauri build`

### 缓存清理

开发模式下浏览器可能缓存旧图标，使用以下方法强制刷新：

**方法 1：使用缓存清理脚本（推荐）**
```bash
# Windows
scripts\clear-cache.bat

# 然后重启开发服务器
cd apps/desktop
npm run dev
```

**方法 2：手动清理**
```bash
# 1. 停止开发服务器 (Ctrl+C)

# 2. 清理 Vite 缓存
rm -rf apps/desktop/frontend/node_modules/.vite

# Windows: rmdir /s /q apps\desktop\frontend\node_modules\.vite

# 3. 清理 Tauri 应用数据（Windows）
# 删除 %LOCALAPPDATA%\com.clawegg.desktop

# 4. 重启开发服务器
cd apps/desktop && npm run dev
```

**方法 3：强制刷新（临时）**
- 在 Tauri 窗口中按 `Ctrl+F5` 强制刷新
- 或在开发者工具中右键刷新按钮选择「清空缓存并硬性重新加载」

### 图标缓存策略

为防止缓存问题，代码中已添加以下措施：

1. **URL 版本号**：`app-icon.png?v=2`
2. **HTML Meta 标签**：禁用缓存
3. **Vite 配置**：开发服务器发送无缓存头

更新图标时请递增版本号（如 `?v=3`）以确保强制刷新。

## 开发注意事项

### 新增 Tauri 命令

1. 在 `apps/desktop/src-tauri/src/commands/` 下创建或修改模块
2. 在 `commands/mod.rs` 中导出
3. 在 `lib.rs` 的 `invoke_handler` 中注册
4. 前端添加对应的类型定义和调用函数

### 修改安装流程

安装逻辑位于 `crates/installer/src/`：
- `orchestrator.rs`：整体流程控制，包含断点续装逻辑
- `installer/node.rs`：Node.js 版本检测（>=22 且偶数）
- `installer/openclaw.rs`：OpenClaw 安装
- `detector.rs`：环境检测

### 修改 Node.js 版本检测

Node.js 版本要求：
- 主版本 >= 22
- 主版本必须为偶数（22, 24, 26...）

修改位置：
- `crates/installer/src/detector.rs`：`check_nodejs()` 和 `is_valid_node_version()`
- `crates/installer/src/installer/node.rs`：`check_version_requirements()` 和 `is_valid_node_version()`

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
