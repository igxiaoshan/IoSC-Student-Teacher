# 🎓 学校管理系统 - Electron 桌面应用

将您的学校管理系统打包成独立的桌面应用程序，支持 Windows、macOS 和 Linux。

## 📋 目录

- [功能特性](#功能特性)
- [系统要求](#系统要求)
- [快速开始](#快速开始)
- [详细配置](#详细配置)
- [构建和分发](#构建和分发)
- [故障排除](#故障排除)
- [高级配置](#高级配置)

## ✨ 功能特性

- 🖥️ **跨平台支持**: Windows、macOS、Linux
- 📦 **单文件分发**: 将前后端打包成一个可执行文件
- 🗄️ **嵌入式数据库**: 内置 MongoDB 数据库
- 🔒 **安全隔离**: 沙盒环境运行
- 🎨 **原生界面**: 系统原生窗口和菜单
- 🚀 **自动更新**: 支持应用自动更新
- 💾 **数据备份**: 内置数据备份和恢复功能

## 🔧 系统要求

### 开发环境
- **Node.js**: >= 16.0.0
- **npm**: >= 8.0.0
- **操作系统**: Windows 10+, macOS 10.14+, Ubuntu 18.04+

### 运行环境
- **内存**: 最少 4GB RAM
- **存储**: 最少 500MB 可用空间
- **网络**: 可选（离线模式可用）

## 🚀 快速开始

### 方法一：自动设置（推荐）

#### Windows 用户
```bash
# 运行自动设置脚本
setup-electron.bat

# 或者指定选项
setup-electron.bat --full
```

#### Linux/macOS 用户
```bash
# 给脚本执行权限
chmod +x setup-electron.sh

# 运行自动设置脚本
./setup-electron.sh

# 或者指定选项
./setup-electron.sh --full
```

### 方法二：手动设置

#### 1. 安装依赖
```bash
# 安装 Electron 相关依赖
npm install electron electron-builder electron-is-dev concurrently wait-on rimraf --save-dev

# 安装前端依赖
cd frontend
npm install
cd ..

# 安装后端依赖
cd backend
npm install
cd ..
```

#### 2. 配置环境
```bash
# 复制 Electron 配置
cp electron-package.json package.json

# 创建环境文件
cp frontend/.env.example frontend/.env
cp backend/.env.example backend/.env
```

#### 3. 构建应用
```bash
# 构建前端
cd frontend
npm run build
cd ..

# 准备后端
cd backend
npm install --production
cd ..
```

#### 4. 运行应用
```bash
# 开发模式
npm run electron-dev

# 生产模式
npm run electron
```

## 🛠️ 详细配置

### 环境变量配置

#### 前端环境 (`frontend/.env`)
```env
REACT_APP_BASE_URL=http://localhost:5000
GENERATE_SOURCEMAP=false
```

#### 后端环境 (`backend/.env`)
```env
# 数据库配置
MONGO_URL=mongodb://127.0.0.1:27017/school
PORT=5000
NODE_ENV=production
CORS_ORIGIN=http://localhost:3000

# AI功能开关
AI_LESSON_PLAN=true
AI_QUESTION_GEN=true
AI_ANSWER_ANALYSIS=true
AI_PERSONALIZED=true
AI_PERFORMANCE=true
AI_CHATBOT=true

# 安全配置
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100
```

### 应用图标配置

将应用图标放置在 `assets/` 目录下：

```
assets/
├── icon.png        # Linux 图标 (512x512)
├── icon.ico        # Windows 图标
└── icon.icns       # macOS 图标
```

### 数据库配置

应用使用嵌入式 MongoDB 数据库，数据存储在用户目录：

- **Windows**: `%USERPROFILE%\.school-management\data`
- **macOS**: `~/.school-management/data`
- **Linux**: `~/.school-management/data`

## 📦 构建和分发

### 开发模式运行
```bash
# 同时启动前后端和 Electron
npm run electron-dev
```

### 生产模式运行
```bash
# 先构建，再运行
npm run build
npm run electron
```

### 创建分发包

#### 所有平台
```bash
npm run dist
```

#### 特定平台
```bash
# Windows
npm run dist:win

# macOS
npm run dist:mac

# Linux
npm run dist:linux
```

#### 仅打包（不创建安装程序）
```bash
npm run pack
```

### 分发包类型

#### Windows
- **NSIS 安装程序**: `.exe` 安装包
- **便携版**: `.exe` 免安装版本

#### macOS
- **DMG**: `.dmg` 磁盘映像
- **ZIP**: `.zip` 压缩包

#### Linux
- **AppImage**: `.AppImage` 便携版
- **DEB**: `.deb` Debian 包
- **RPM**: `.rpm` Red Hat 包

## 🔍 故障排除

### 常见问题

#### 1. Node.js 版本问题
```bash
# 检查版本
node --version

# 如果版本过低，请升级到 16+
```

#### 2. 依赖安装失败
```bash
# 清理缓存
npm cache clean --force

# 删除 node_modules 重新安装
rm -rf node_modules package-lock.json
npm install
```

#### 3. 构建失败
```bash
# 检查磁盘空间
df -h

# 检查权限
ls -la

# 清理构建缓存
npm run clean
```

#### 4. MongoDB 启动失败
```bash
# 检查端口占用
netstat -an | grep 27017

# 手动启动 MongoDB
mongod --dbpath ~/.school-management/data
```

#### 5. 应用无法启动
```bash
# 检查日志
cat ~/.school-management/logs/app.log

# 重置配置
rm -rf ~/.school-management/config
```

### 调试模式

#### 启用开发者工具
```bash
# 设置环境变量
export ELECTRON_IS_DEV=true
npm run electron
```

#### 查看日志
```bash
# 应用日志
tail -f ~/.school-management/logs/app.log

# MongoDB 日志
tail -f ~/.school-management/logs/mongodb.log
```

## ⚙️ 高级配置

### 自定义构建配置

编辑 `package.json` 中的 `build` 配置：

```json
{
  "build": {
    "appId": "com.yourcompany.schoolmanagement",
    "productName": "学校管理系统",
    "directories": {
      "output": "dist"
    },
    "files": [
      "electron-main.js",
      "preload.js",
      "assets/**/*",
      "backend/**/*",
      "frontend/build/**/*"
    ]
  }
}
```

### 自动更新配置

```json
{
  "build": {
    "publish": {
      "provider": "github",
      "owner": "your-username",
      "repo": "school-management-system"
    }
  }
}
```

### 代码签名（可选）

#### Windows
```json
{
  "build": {
    "win": {
      "certificateFile": "path/to/certificate.p12",
      "certificatePassword": "password"
    }
  }
}
```

#### macOS
```json
{
  "build": {
    "mac": {
      "identity": "Developer ID Application: Your Name"
    }
  }
}
```

## 📚 脚本命令参考

| 命令 | 描述 |
|------|------|
| `npm run electron` | 运行 Electron 应用 |
| `npm run electron-dev` | 开发模式运行 |
| `npm run build` | 构建前后端 |
| `npm run dist` | 创建分发包 |
| `npm run dist:win` | 创建 Windows 分发包 |
| `npm run dist:mac` | 创建 macOS 分发包 |
| `npm run dist:linux` | 创建 Linux 分发包 |
| `npm run pack` | 仅打包不创建安装程序 |
| `npm run clean` | 清理构建文件 |

## 🤝 贡献

欢迎提交 Issue 和 Pull Request 来改进这个项目！

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件。
