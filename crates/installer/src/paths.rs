//! Cross-platform path management for bundled Node.js
//!
//! This module handles paths for a self-contained installation where Node.js
//! is bundled within the application directory (like Blender).
//!
//! Directory structure:
//! Windows: C:\Program Files\ClawEgg\
//!   ├── ClawEgg.exe
//!   ├── nodejs\
//!   │   ├── node.exe
//!   │   ├── npm.cmd
//!   │   └── npx.cmd
//!   └── resources\
//!       └── openclaw\
//!
//! macOS: /Applications/ClawEgg.app/Contents/
//!   ├── MacOS/ClawEgg
//!   ├── nodejs/
//!   │   ├── bin/node
//!   │   ├── bin/npm
//!   │   └── bin/npx
//!   └── Resources/openclaw/

use std::path::{Path, PathBuf};

/// Get the root installation directory
/// 
/// On Windows: C:\Program Files\ClawEgg
/// On macOS: /Applications/ClawEgg.app/Contents
pub fn get_install_root() -> anyhow::Result<PathBuf> {
    // In development, use a local directory
    if cfg!(debug_assertions) {
        return get_dev_install_root();
    }
    
    // In production, detect based on executable location
    get_production_install_root()
}

/// Get development installation root
fn get_dev_install_root() -> anyhow::Result<PathBuf> {
    // Try standard env vars for home directory
    let home = std::env::var("HOME")
        .or_else(|_| std::env::var("USERPROFILE"))
        .map_err(|_| anyhow::anyhow!("Could not find home directory"))?;
    
    Ok(PathBuf::from(home).join(".clawegg"))
}

/// Get production installation root based on executable location
#[cfg(target_os = "windows")]
fn get_production_install_root() -> anyhow::Result<PathBuf> {
    // Get the directory of the current executable
    let exe_path = std::env::current_exe()?;
    // Go up from ClawEgg.exe to the install root
    exe_path
        .parent()
        .ok_or_else(|| anyhow::anyhow!("Could not get executable directory"))
        .map(|p| p.to_path_buf())
}

#[cfg(target_os = "macos")]
fn get_production_install_root() -> anyhow::Result<PathBuf> {
    // On macOS: /Applications/ClawEgg.app/Contents/MacOS/ClawEgg
    // We want: /Applications/ClawEgg.app/Contents
    let exe_path = std::env::current_exe()?;
    exe_path
        .parent() // MacOS
        .and_then(|p| p.parent()) // Contents
        .ok_or_else(|| anyhow::anyhow!("Could not get bundle Contents directory"))
        .map(|p| p.to_path_buf())
}

#[cfg(not(any(target_os = "windows", target_os = "macos")))]
fn get_production_install_root() -> anyhow::Result<PathBuf> {
    get_dev_install_root()
}

/// Get the bundled Node.js directory
pub fn get_nodejs_dir() -> anyhow::Result<PathBuf> {
    Ok(get_install_root()?.join("nodejs"))
}

/// Get the path to the bundled node executable
pub fn get_node_exe() -> anyhow::Result<PathBuf> {
    #[cfg(target_os = "windows")]
    {
        Ok(get_nodejs_dir()?.join("node.exe"))
    }
    #[cfg(not(target_os = "windows"))]
    {
        Ok(get_nodejs_dir()?.join("bin").join("node"))
    }
}

/// Get the path to the bundled npm executable
pub fn get_npm_exe() -> anyhow::Result<PathBuf> {
    #[cfg(target_os = "windows")]
    {
        Ok(get_nodejs_dir()?.join("npm.cmd"))
    }
    #[cfg(not(target_os = "windows"))]
    {
        Ok(get_nodejs_dir()?.join("bin").join("npm"))
    }
}

/// Get the path to the bundled npx executable
pub fn get_npx_exe() -> anyhow::Result<PathBuf> {
    #[cfg(target_os = "windows")]
    {
        Ok(get_nodejs_dir()?.join("npx.cmd"))
    }
    #[cfg(not(target_os = "windows"))]
    {
        Ok(get_nodejs_dir()?.join("bin").join("npx"))
    }
}

/// Get the OpenClaw installation directory within our bundle
pub fn get_openclaw_dir() -> anyhow::Result<PathBuf> {
    Ok(get_install_root()?.join("resources").join("openclaw"))
}

/// Get the global bin directory for openclaw command
/// This is where we put the wrapper script/executable
pub fn get_bin_dir() -> anyhow::Result<PathBuf> {
    Ok(get_install_root()?.join("bin"))
}

/// Get the path to openclaw executable (installed in our bundle)
pub fn get_openclaw_exe() -> anyhow::Result<PathBuf> {
    #[cfg(target_os = "windows")]
    {
        Ok(get_openclaw_dir()?.join("openclaw.cmd"))
    }
    #[cfg(not(target_os = "windows"))]
    {
        Ok(get_openclaw_dir()?.join("bin").join("openclaw"))
    }
}

/// Check if bundled Node.js exists
pub fn is_bundled_nodejs_installed() -> bool {
    get_node_exe().map(|p| p.exists()).unwrap_or(false)
}

/// Build PATH environment variable that includes bundled Node.js
/// 
/// This returns a modified PATH that prioritizes our bundled Node.js,
/// but still includes the user's PATH for other dependencies.
pub fn build_path_with_bundled_nodejs() -> anyhow::Result<String> {
    let nodejs_dir = get_nodejs_dir()?;
    let _nodejs_bin = nodejs_dir.join("bin");
    
    let current_path = std::env::var("PATH").unwrap_or_default();
    
    #[cfg(target_os = "windows")]
    {
        // On Windows, node.exe is directly in nodejs dir
        Ok(format!("{};{};{}", 
            nodejs_dir.display(),
            get_openclaw_dir()?.display(),
            current_path
        ))
    }
    #[cfg(not(target_os = "windows"))]
    {
        // On Unix, node is in nodejs/bin/
        Ok(format!("{}:{}:{}:{}", 
            nodejs_bin.display(),
            nodejs_dir.display(),
            get_openclaw_dir()?.join("bin").display(),
            current_path
        ))
    }
}

/// Get the appropriate shell command to run with bundled environment
/// 
/// This returns a Command that's pre-configured with the bundled Node.js
pub fn create_command_with_bundled_node(exe: &str) -> anyhow::Result<std::process::Command> {
    let exe_path = if exe == "node" {
        get_node_exe()?
    } else if exe == "npm" {
        get_npm_exe()?
    } else if exe == "npx" {
        get_npx_exe()?
    } else {
        PathBuf::from(exe)
    };
    
    let mut cmd = std::process::Command::new(&exe_path);
    
    // Set up PATH to include bundled Node.js
    let new_path = build_path_with_bundled_nodejs()?;
    cmd.env("PATH", new_path);
    
    // Set npm prefix to our bundled location
    cmd.env("npm_config_prefix", get_openclaw_dir()?);
    
    Ok(cmd)
}

/// Install npm package globally into our bundled location
pub async fn npm_install_global(package: &str, use_china_mirror: bool) -> anyhow::Result<()> {
    let registry = if use_china_mirror {
        "https://registry.npmmirror.com"
    } else {
        "https://registry.npmjs.org"
    };
    
    let mut cmd = create_command_with_bundled_node("npm")?;
    
    cmd.args([
        "install",
        "-g",
        package,
        "--registry",
        registry,
    ]);
    
    log::info!("Running: {:?}", cmd);
    
    let output = cmd.output()?;
    
    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(anyhow::anyhow!("npm install failed: {}", stderr));
    }
    
    Ok(())
}

/// Run openclaw command with bundled environment
pub async fn run_openclaw(args: &[&str]) -> anyhow::Result<std::process::Output> {
    let mut cmd = create_command_with_bundled_node("npx")?;
    
    cmd.arg("openclaw");
    cmd.args(args);
    
    log::info!("Running: openclaw {:?}", args);
    
    let output = cmd.output()?;
    
    Ok(output)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_get_install_root_dev() {
        // In test mode, should return a path under home directory
        let root = get_install_root().unwrap();
        assert!(root.to_string_lossy().contains(".clawegg"));
    }

    #[test]
    fn test_get_nodejs_dir() {
        let nodejs_dir = get_nodejs_dir().unwrap();
        assert!(nodejs_dir.to_string_lossy().contains("nodejs"));
    }

    #[test]
    fn test_get_node_exe_path_format() {
        let node_exe = get_node_exe().unwrap();
        let path_str = node_exe.to_string_lossy();
        
        #[cfg(target_os = "windows")]
        assert!(path_str.ends_with("node.exe"));
        
        #[cfg(not(target_os = "windows"))]
        assert!(path_str.ends_with("/node"));
    }

    #[test]
    fn test_get_npm_exe_path_format() {
        let npm_exe = get_npm_exe().unwrap();
        let path_str = npm_exe.to_string_lossy();
        
        #[cfg(target_os = "windows")]
        assert!(path_str.ends_with("npm.cmd"));
        
        #[cfg(not(target_os = "windows"))]
        assert!(path_str.ends_with("/npm"));
    }

    #[test]
    fn test_get_openclaw_dir() {
        let dir = get_openclaw_dir().unwrap();
        let path_str = dir.to_string_lossy();
        assert!(path_str.contains("resources"));
        assert!(path_str.contains("openclaw"));
    }

    #[test]
    fn test_build_path_contains_bundled_nodejs() {
        let path = build_path_with_bundled_nodejs().unwrap();
        let nodejs_dir = get_nodejs_dir().unwrap().to_string_lossy().to_string();
        assert!(path.contains(&nodejs_dir));
    }

    #[test]
    fn test_create_command_preserves_exe_name() {
        let _cmd = create_command_with_bundled_node("node").unwrap();
        // Command should be created successfully
        // We can't easily inspect the internal state, but we can verify it doesn't panic
    }

    // Idempotency tests
    #[test]
    fn test_path_functions_are_idempotent() {
        // Calling these functions multiple times should return the same result
        let path1 = get_install_root().unwrap();
        let path2 = get_install_root().unwrap();
        assert_eq!(path1, path2);
        
        let node1 = get_node_exe().unwrap();
        let node2 = get_node_exe().unwrap();
        assert_eq!(node1, node2);
    }

    #[test]
    fn test_build_path_idempotent() {
        let path1 = build_path_with_bundled_nodejs().unwrap();
        let path2 = build_path_with_bundled_nodejs().unwrap();
        assert_eq!(path1, path2);
    }
}
