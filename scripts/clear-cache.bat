@echo off
chcp 65001 >nul
echo ==========================================
echo  龙虾孵化器 - 缓存清理工具
echo ==========================================
echo.

REM 清理 Vite 缓存
echo [1/4] 清理 Vite 缓存...
if exist "apps\desktop\frontend\node_modules\.vite" (
    rmdir /s /q "apps\desktop\frontend\node_modules\.vite"
    echo      已清理 Vite 缓存
) else (
    echo      Vite 缓存不存在，跳过
)

REM 清理 node_modules/.cache
echo [2/4] 清理其他构建缓存...
if exist "apps\desktop\frontend\node_modules\.cache" (
    rmdir /s /q "apps\desktop\frontend\node_modules\.cache"
    echo      已清理构建缓存
) else (
    echo      构建缓存不存在，跳过
)

REM 清理 target 目录（可选）
echo [3/4] 检查 Rust 构建缓存...
if exist "target" (
    echo      注意: target 目录存在，如遇到 Rust 相关缓存问题可以手动删除
) else (
    echo      Rust 缓存目录不存在
)

REM 清理 Tauri 开发缓存
echo [4/4] 清理 Tauri 缓存...
if exist "%LOCALAPPDATA%\com.clawegg.desktop" (
    rmdir /s /q "%LOCALAPPDATA%\com.clawegg.desktop"
    echo      已清理 Tauri 应用数据
) else (
    echo      Tauri 应用数据不存在，跳过
)

echo.
echo ==========================================
echo  缓存清理完成！
echo ==========================================
echo.
echo 请按以下步骤操作：
echo 1. 关闭当前开发服务器 (Ctrl+C)
echo 2. 重新运行: cd apps/desktop ^&^& npm run dev
echo 3. 在浏览器中按 Ctrl+F5 强制刷新
echo.
pause
