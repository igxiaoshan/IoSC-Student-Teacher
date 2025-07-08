#!/bin/bash

echo "🚀 准备提交Electron桌面应用配置..."

# 检查Git状态
echo "📋 检查Git状态..."
git status

echo ""
echo "📝 添加新文件到Git..."

# 添加新创建的文件
git add package.json
git add electron/
git add scripts/
git add assets/
git add ELECTRON-README.md
git add DEPLOYMENT-GUIDE.md
git add backend/.env.example

# 添加修改的文件
git add backend/package.json

echo ""
echo "✅ 文件已添加到暂存区"

echo ""
echo "📊 查看将要提交的更改..."
git diff --cached --name-only

echo ""
echo "💬 提交更改..."
git commit -m "feat: 添加Electron桌面应用支持

- 配置Electron主进程和启动逻辑
- 添加自动构建和打包脚本
- 支持Windows/macOS/Linux跨平台打包
- 集成前后端到单个可执行文件
- 添加完整的部署和使用文档

新增功能:
- 一键启动桌面应用
- 自动启动后端服务和数据库连接
- 原生桌面应用体验
- 支持打包为.exe/.dmg/.AppImage

使用方法:
- npm run setup    # 安装依赖
- npm run build    # 构建应用
- npm run electron # 运行应用
- npm run dist-win # 打包Windows版本"

echo ""
echo "🎉 提交完成！"

echo ""
echo "📤 推送到远程仓库..."
echo "运行以下命令推送更改:"
echo "git push origin main"

echo ""
echo "✨ Electron桌面应用配置已完成！"
