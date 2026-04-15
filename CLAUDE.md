# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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
│   ├── src/redux/        # Redux store 和 slices
│   │   ├── userRelated/  # 用户状态管理
│   │   ├── studentRelated/
│   │   └── teacherRelated/
│   ├── src/components/   # 共享组件
│   └── src/utils/        # 前端工具函数
├── docs/                 # 项目文档
├── electron-main.js      # Electron 主进程
└── preload.js            # Electron 预加载脚本
```

### 核心架构特点

1. **角色系统**: Admin, Teacher, Student 三种角色，各自有独立的 Dashboard
2. **路由保护**: 前端使用 Redux `currentRole` 控制路由访问
3. **状态管理**: Redux Toolkit + React-Redux，按功能模块组织 slices
4. **API 通信**: Axios 封装在 `*Handle.js` 文件中
5. **AI 集成**:
   - Dify API 用于课件生成、评估、对话
   - Ollama 本地模型支持 (deepseek-r1)
   - 流式响应支持 SSE

### 后端路由组织

- 主要路由在 `backend/routes/route.js` 统一挂载
- AI 相关路由: `/api/chat`, `/api/feedback`
- RESTful API 设计，使用 controllers 分离业务逻辑

### 数据模型

- **核心模型**: Student, Teacher, Admin, Sclass (班级), Subject
- **业务模型**: Exam, Question, Answer, Notice, Complain
- **AI 相关**: Courseware, Assessment, KnowledgeBase, StudentLearning

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

# 其他配置参考 backend/.env.example
```

### 前端环境变量 (frontend/.env)

```bash
REACT_APP_BASE_URL=http://localhost:5000
```

## Important Notes

1. **网络问题**: 如果遇到 API 连接问题，检查 `frontend/.env` 的 `REACT_APP_BASE_URL` 是否配置正确
2. **删除功能**: 生产环境默认禁用删除功能，需要在 `userHandle.js` 和相关页面中手动启用
3. **Electron 打包**: 使用 `electron-builder`，配置在根目录 `package.json` 的 `build` 字段
4. **AI 功能**: 需要配置有效的 Dify API Key 或本地 Ollama 服务
