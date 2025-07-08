# 🖥️ School Management System - Desktop Application

这是学校管理系统的桌面版本，使用Electron将前后端打包成单个可执行文件。

## 🚀 快速开始

### 前置要求

1. **Node.js** (版本 16 或更高)
2. **MongoDB** (本地安装或使用MongoDB Atlas)

### 安装步骤

1. **克隆项目并安装依赖**
```bash
git clone <your-repo-url>
cd IoSC-Student-Teacher
npm run setup
```

2. **配置数据库**
   - 如果使用本地MongoDB，确保MongoDB服务正在运行
   - 如果使用MongoDB Atlas，修改 `backend/.env` 文件中的连接字符串

3. **构建应用**
```bash
npm run build
```

4. **运行应用**
```bash
npm run electron
```

## 📦 打包成可执行文件

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

打包后的文件将在 `dist/` 目录中。

## 🛠️ 开发模式

如果你想在开发模式下运行（前后端分离）：

```bash
npm run electron-dev
```

这将同时启动：
- 前端开发服务器 (http://localhost:3000)
- 后端API服务器 (http://localhost:5000)
- Electron应用

## 📁 项目结构

```
├── electron/           # Electron主进程文件
│   ├── main.js        # 主进程入口
│   ├── preload.js     # 预加载脚本
│   └── startup.js     # 应用启动逻辑
├── frontend/          # React前端
├── backend/           # Node.js后端
├── assets/            # 应用图标等资源
├── scripts/           # 构建脚本
└── dist/             # 打包输出目录
```

## ⚙️ 配置说明

### 数据库配置

编辑 `backend/.env` 文件：

```env
# 本地MongoDB
MONGO_URL=mongodb://127.0.0.1/school

# 或者使用MongoDB Atlas
# MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/school

PORT=5000
NODE_ENV=production
```

### 应用配置

在 `package.json` 中的 `build` 部分可以配置：
- 应用名称
- 图标
- 打包选项
- 安装程序设置

## 🔧 故障排除

### MongoDB连接问题
1. 确保MongoDB服务正在运行
2. 检查 `.env` 文件中的连接字符串
3. 如果使用Atlas，确保网络访问权限正确

### 构建失败
1. 删除所有 `node_modules` 文件夹
2. 重新运行 `npm run setup`
3. 确保Node.js版本兼容

### 应用启动慢
- 首次启动需要时间来启动MongoDB和后端服务
- 等待3-5秒让所有服务完全启动

## 🎯 功能特性

✅ **单文件部署** - 一个.exe文件包含完整应用  
✅ **自动启动** - 自动启动后端服务和数据库连接  
✅ **原生体验** - 桌面应用的用户体验  
✅ **离线运行** - 无需浏览器，可离线使用  
✅ **跨平台** - 支持Windows、macOS、Linux  

## 📝 使用说明

1. **首次运行**：应用会自动创建必要的配置文件
2. **数据存储**：数据存储在本地MongoDB或云端Atlas
3. **更新**：重新打包并分发新的可执行文件

## 🤝 贡献

欢迎提交Issue和Pull Request来改进这个桌面版本！

## 📄 许可证

与原项目保持一致的许可证。
