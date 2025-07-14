@echo off
setlocal enabledelayedexpansion

echo 🎓 学校管理系统 Electron 测试脚本
echo ================================

:: 检查 Node.js
echo 检查 Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js 未安装
    pause
    exit /b 1
)
echo ✅ Node.js 版本: 
node --version

:: 检查 npm
echo 检查 npm...
npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ npm 未安装
    pause
    exit /b 1
)
echo ✅ npm 版本: 
npm --version

:: 检查前端构建文件
echo 检查前端构建文件...
if exist "frontend\build\index.html" (
    echo ✅ 前端构建文件存在
) else (
    echo ⚠️ 前端构建文件不存在，正在构建...
    cd frontend
    call npm install
    if errorlevel 1 (
        echo ❌ 前端依赖安装失败
        cd ..
        pause
        exit /b 1
    )
    call npm run build
    if errorlevel 1 (
        echo ❌ 前端构建失败
        cd ..
        pause
        exit /b 1
    )
    cd ..
    echo ✅ 前端构建完成
)

:: 检查后端依赖
echo 检查后端依赖...
if exist "backend\node_modules" (
    echo ✅ 后端依赖已安装
) else (
    echo ⚠️ 后端依赖未安装，正在安装...
    cd backend
    call npm install
    if errorlevel 1 (
        echo ❌ 后端依赖安装失败
        cd ..
        pause
        exit /b 1
    )
    cd ..
    echo ✅ 后端依赖安装完成
)

:: 检查 Electron 依赖
echo 检查 Electron 依赖...
if exist "node_modules\electron" (
    echo ✅ Electron 已安装
) else (
    echo ⚠️ Electron 未安装，正在安装...
    call npm install
    if errorlevel 1 (
        echo ❌ Electron 安装失败
        pause
        exit /b 1
    )
    echo ✅ Electron 安装完成
)

:: 设置环境变量
echo 设置环境变量...
set NODE_ENV=development
set ELECTRON_IS_DEV=true

:: 启动应用
echo 启动 Electron 应用...
echo ℹ️ 如果出现错误，请检查控制台输出
echo ℹ️ 按 Ctrl+C 可以停止应用
echo.

call npm run electron

echo.
echo 应用已退出
pause
