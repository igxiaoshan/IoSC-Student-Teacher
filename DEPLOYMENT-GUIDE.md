# 🚀 学校管理系统 - Electron桌面应用部署指南

## 📦 项目已完成配置

您的项目已成功配置为Electron桌面应用！现在可以将前后端打包成单个.exe可执行文件。

## 🛠️ 本地开发和测试

### 前置要求
- Node.js (版本16+)
- MongoDB (本地安装或Atlas云服务)
- Git

### 1. 克隆和设置项目

```bash
# 克隆项目
git clone <your-repo-url>
cd IoSC-Student-Teacher

# 安装所有依赖
npm run setup
```

### 2. 配置数据库

编辑 `backend/.env` 文件：
```env
# 本地MongoDB
MONGO_URL=mongodb://127.0.0.1/school

# 或使用MongoDB Atlas
# MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/school

PORT=5000
NODE_ENV=production
```

### 3. 构建应用

```bash
npm run build
```

### 4. 测试运行

```bash
npm run electron
```

## 📱 打包成可执行文件

### Windows (.exe)
```bash
npm run dist-win
```

### macOS (.dmg)
```bash
npm run dist-mac
```

### Linux (AppImage)
```bash
npm run dist-linux
```

打包后的文件在 `dist/` 目录中。

## 🔧 可用的命令

| 命令 | 说明 |
|------|------|
| `npm run setup` | 安装所有依赖 |
| `npm run build` | 构建前端和准备后端 |
| `npm run electron` | 运行Electron应用 |
| `npm run electron-dev` | 开发模式（前后端分离） |
| `npm run dist` | 打包当前平台 |
| `npm run dist-win` | 打包Windows版本 |
| `npm run dist-mac` | 打包macOS版本 |
| `npm run dist-linux` | 打包Linux版本 |

## 📁 重要文件说明

### 新增的核心文件：

1. **`package.json`** (根目录) - 主配置文件
2. **`electron/main.js`** - Electron主进程
3. **`electron/startup.js`** - 应用启动逻辑
4. **`scripts/build-electron.js`** - 构建脚本
5. **`backend/.env.example`** - 环境配置模板

### 修改的文件：

1. **`backend/package.json`** - 添加了生产模式启动脚本

## 🎯 应用特性

✅ **单文件部署** - 打包成单个可执行文件  
✅ **自动启动** - 自动启动后端服务和MongoDB连接  
✅ **原生体验** - 桌面应用用户体验  
✅ **跨平台支持** - Windows/macOS/Linux  
✅ **离线运行** - 无需浏览器  

## 🔍 故障排除

### 1. MongoDB连接问题
- 确保MongoDB服务正在运行
- 检查`.env`文件配置
- 如果使用Atlas，检查网络权限

### 2. 构建失败
```bash
# 清理并重新安装
rm -rf node_modules frontend/node_modules backend/node_modules
npm run setup
npm run build
```

### 3. 应用启动慢
- 首次启动需要3-5秒启动所有服务
- 这是正常现象

## 📋 部署检查清单

- [ ] 所有依赖已安装 (`npm run setup`)
- [ ] 前端构建成功 (`npm run build`)
- [ ] 数据库配置正确 (`backend/.env`)
- [ ] 应用可以正常启动 (`npm run electron`)
- [ ] 打包成功 (`npm run dist-win`)

## 🎉 完成！

您的学校管理系统现在已经成功配置为桌面应用！

用户只需要：
1. 下载.exe文件
2. 双击运行
3. 等待3-5秒启动
4. 开始使用！

无需安装Node.js、配置环境或启动多个服务。
