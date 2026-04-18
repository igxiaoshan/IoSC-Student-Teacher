# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with this repository.

## Project Overview

这是一个基于 MERN 技术栈的学校管理系统 (School Management System)，使用 Electron 打包为桌面应用程序。

- **Frontend**: React 18 + Redux + Material UI 5，运行在 localhost:3000
- **Backend**: Node.js + Express + MongoDB (Mongoose)，运行在 localhost:5000
- **Desktop**: Electron 28 打包为 Windows/macOS/Linux 应用

## Development Commands

### 快速启动开发环境

```bash
# 同时启动后端、前端和 Electron（推荐）
npm run electron-dev
```

### 分别启动服务

```bash
# 终端 1 - 后端 (端口 5000)
cd backend && npm start

# 终端 2 - 前端 (端口 3000)
cd frontend && npm start

# 终端 3 - Electron（等前后端启动后）
npm run electron
```

### 构建与打包

```bash
# 构建前端生产版本
npm run build:frontend

# 完整构建（用于打包）
npm run build

# 打包为 Windows 安装程序
npm run dist:win

# 仅打包，不发布
npm run dist:offline

# 便携版（无需签名）
npm run build-nosign
```

### 依赖安装

```bash
# 安装所有依赖（根目录、backend、frontend）
npm install
cd backend && npm install
cd ../frontend && npm install

# 设置国内镜像
npm run setup-mirrors
```

## Project Architecture

### 目录结构

```
/
├── backend/              # Express API 服务器
│   ├── controllers/      # 业务逻辑控制器
│   ├── models/           # Mongoose 数据模型
│   ├── routes/           # API 路由定义
│   ├── middleware/       # 中间件 (AI, 验证等)
│   ├── config/           # 配置文件 (AI, Dify)
│   ├── services/         # 业务服务层
│   ├── utils/            # 工具函数
│   └── validation/       # 请求验证
├── frontend/             # React SPA
│   ├── src/pages/        # 页面组件 (admin, student, teacher)
│   │   └── */            # 各角色有自己的 Dashboard + SideBar
│   ├── src/redux/        # Redux store 和 slices
│   │   ├── userRelated/  # 用户状态管理
│   │   ├── studentRelated/
│   │   └── teacherRelated/
│   ├── src/components/   # 共享组件
│   └── src/utils/        # 前端工具函数
├── electron-main.js      # Electron 主进程
└── preload.js            # Electron 预加载脚本
```

### 前端角色模块模式

每个角色（Admin/Teacher/Student）都有独立的模块：

```
pages/{role}/
  ├── {Role}Dashboard.js    # 主容器，包含路由和侧边栏
  ├── {Role}SideBar.js      # 导航侧边栏
  ├── {Role}HomePage.js     # 首页
  ├── {Role}Profile.js      # 个人资料
  └── [功能页面].js          # 如 StudentSubjects, TeacherClassDetails
```

新增页面需要在 `{Role}Dashboard.js` 中添加路由，在 `{Role}SideBar.js` 中添加导航项。

### 后端路由组织

- 主要路由在 `backend/routes/route.js` 统一挂载
- 路由模块使用 `router.use()` 挂载子路由
- RESTful API 设计，使用 controllers 分离业务逻辑

### 状态管理模式

- Redux Toolkit + React-Redux
- 用户状态: `src/redux/userRelated/userHandle.js`
- 各角色状态按 `*Related/` 目录组织
- API 调用统一封装在 `*Handle.js` 文件中

### API 封装模式

前端 API 调用使用 Axios 封装：

```javascript
// apiConfig.js - 基础配置和通用方法
export const api = { get, post, put, delete, patch };

// 特定模块封装 (如 difyAPI.js, jimengAPI.js)
export const moduleAPI = {
  method: (data) => api.post('/endpoint', data),
};
```

## AI 集成架构

项目支持多种 AI 服务集成，使用单例模式的服务类封装：

### 已集成的 AI 服务

| 服务 | 配置文件 | 服务文件 | 用途 |
|------|----------|----------|------|
| Dify | `backend/config/difyConfig.js` | `backend/services/difyService.js` | 课件生成、评估、对话 |
| Ollama | `backend/config/ollamaConfig.js` | `backend/services/ollamaService.js` | 本地模型支持 |
| 即梦AI | `backend/config/jimengConfig.js` | `backend/services/jimengService.js` | 文生图、文生视频 |

### 新增 AI 服务模式

1. 在 `backend/config/` 创建配置模块
2. 在 `backend/services/` 创建服务类（单例模式）
3. 在 `backend/controllers/` 创建控制器
4. 在 `backend/routes/` 创建路由文件
5. 在 `backend/routes/route.js` 中注册路由
6. 前端 `frontend/src/utils/` 创建 API 封装
7. 前端页面组件放在对应角色的 pages 目录下

## 数据模型

### 核心模型
- **User**: Admin, Teacher, Student 的基类
- **Sclass**: 班级
- **Subject**: 科目

### 业务模型
- **Exam, Question, Answer**: 考试相关
- **Notice, Complain**: 通知和投诉
- **Courseware, Assessment**: AI 课件和评估
- **JimengGeneration**: 即梦AI生成记录

## Configuration

### 后端环境变量 (backend/.env)

```bash
# 数据库
MONGO_URL=mongodb://127.0.0.1/school

# AI 服务 (Dify)
DIFY_BASE_URL=https://api.dify.ai
DIFY_API_KEY=app-xxx
DIFY_TEACHER_LESSON_APP_ID=xxx

# Ollama (本地 AI)
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=deepseek-r1

# 即梦AI (火山引擎)
JIMENG_API_URL=https://visual.volcengine.com
JIMENG_API_KEY=xxx

# 其他配置参考 backend/.env.example
```

### 前端环境变量 (frontend/.env)

```bash
REACT_APP_BASE_URL=http://localhost:5000
```

## i18n 国际化

- 翻译文件: `frontend/src/i18n/locales/`
- 使用 `useTranslation` hook 获取翻译函数
- tTeacher(), tStudent(), tCommon() 等按角色分类

## Important Notes

1. **网络问题**: 如果遇到 API 连接问题，检查 `frontend/.env` 的 `REACT_APP_BASE_URL` 是否配置正确
2. **删除功能**: 生产环境默认禁用删除功能，需要在 `userHandle.js` 和相关页面中手动启用
3. **Electron 打包**: 使用 `electron-builder`，配置在根目录 `package.json` 的 `build` 字段
4. **AI 功能**: 需要配置有效的 Dify API Key、本地 Ollama 服务或即梦AI API Key
5. **模拟模式**: AI 服务未配置时会返回模拟数据用于开发测试
