#!/usr/bin/env python3
"""
龙虾孵化器 图标生成脚本
自动生成所有需要的图标尺寸并替换到对应位置
"""

import subprocess
import sys
import os
import shutil
from pathlib import Path

def install_pillow():
    """自动安装 Pillow 库（如果不存在）"""
    try:
        from PIL import Image
        return True
    except ImportError:
        print("正在安装 Pillow 库...")
        try:
            subprocess.check_call([sys.executable, "-m", "pip", "install", "Pillow", "-q"])
            print("Pillow 安装完成")
            return True
        except subprocess.CalledProcessError as e:
            print(f"安装 Pillow 失败: {e}")
            return False

def get_project_root():
    """获取项目根目录（脚本所在目录的父目录）"""
    script_dir = Path(__file__).parent.resolve()
    return script_dir.parent

def generate_icons(source_image_path: str):
    """生成所有需要的图标尺寸"""
    from PIL import Image
    
    source_path = Path(source_image_path)
    if not source_path.exists():
        print(f"错误: 源图片不存在: {source_path}")
        return False
    
    # 打开源图片
    img = Image.open(source_path)
    if img.mode != 'RGBA':
        img = img.convert('RGBA')
    
    project_root = get_project_root()
    
    # 定义所有需要生成的图标配置
    # (宽度, 高度, 输出路径)
    icon_configs = [
        # Tauri 应用图标
        (512, 512, project_root / "apps" / "desktop" / "src-tauri" / "icons" / "icon.png"),
        (256, 256, project_root / "apps" / "desktop" / "src-tauri" / "icons" / "icon-256.png"),
        (128, 128, project_root / "apps" / "desktop" / "src-tauri" / "icons" / "icon-128.png"),
        (32, 32, project_root / "apps" / "desktop" / "src-tauri" / "icons" / "icon-32.png"),
        (16, 16, project_root / "apps" / "desktop" / "src-tauri" / "icons" / "icon-16.png"),
        
        # 前端图标 - 开发模式左上角图标
        (128, 128, project_root / "apps" / "desktop" / "app-icon.png"),
        (128, 128, project_root / "apps" / "desktop" / "frontend" / "public" / "app-icon.png"),
        
        # macOS 图标 (icns 需要特殊处理，这里生成 png 源文件)
        (1024, 1024, project_root / "apps" / "desktop" / "src-tauri" / "icons" / "icon-1024.png"),
        (512, 512, project_root / "apps" / "desktop" / "src-tauri" / "icons" / "icon@2x.png"),
        
        # Windows ICO 源文件
        (256, 256, project_root / "apps" / "desktop" / "src-tauri" / "icons" / "icon.ico"),
    ]
    
    print(f"正在生成图标，源文件: {source_path}")
    print(f"项目根目录: {project_root}")
    
    generated_count = 0
    
    for width, height, output_path in icon_configs:
        try:
            # 确保输出目录存在
            output_path.parent.mkdir(parents=True, exist_ok=True)
            
            # 调整图片尺寸
            resized = img.resize((width, height), Image.Resampling.LANCZOS)
            
            # 保存图片
            if str(output_path).endswith('.ico'):
                # ICO 文件需要特殊处理
                resized.save(output_path, format='ICO', sizes=[(width, height)])
            else:
                resized.save(output_path, format='PNG')
            
            print(f"  ✓ 已生成: {output_path.name} ({width}x{height})")
            generated_count += 1
            
        except Exception as e:
            print(f"  ✗ 生成失败: {output_path.name} - {e}")
    
    print(f"\n完成! 成功生成 {generated_count} 个图标文件")
    return True

def main():
    """主函数"""
    # 自动安装依赖
    if not install_pillow():
        sys.exit(1)
    
    # 导入 Pillow
    from PIL import Image
    
    # 获取项目根目录
    project_root = get_project_root()
    
    # 查找源图片
    # 按优先级查找
    possible_sources = [
        project_root / "assets" / "icon.png",
        project_root / "assets" / "icon.jpg",
        project_root / "assets" / "logo.png",
        project_root / "assets" / "logo.jpg",
        project_root / "icon.png",
        project_root / "icon.jpg",
    ]
    
    source_image = None
    for src in possible_sources:
        if src.exists():
            source_image = str(src)
            break
    
    if source_image:
        generate_icons(source_image)
    else:
        print("错误: 找不到源图标文件")
        print("请在以下位置放置源图标文件:")
        for src in possible_sources:
            print(f"  - {src}")
        sys.exit(1)

if __name__ == "__main__":
    main()
