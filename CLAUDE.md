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

# 打包为 Windows 便携版
npm run build-nosign

# 下载 Electron 二进制
npm run download-electron
```

### Electron 入口文件

项目有多个 Electron 入口：
- `electron-main-simple.js` - 简化版入口（当前 `package.json` main 指向此）
- `electron-main.js` - 完整版入口

打包配置也有多个：`electron-builder.config.js`（完整）、`electron-builder-simple.config.js`、`electron-builder-fixed.config.js`

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

## 多模型协作工作流

项目支持多模型协作自动化：

### 可用工具

| 工具 | 用途 | 命令/配置 |
|------|------|-----------|
| `gemini-flash` | 代码生成/分析 | `D:/core/app/dev/nodejs/gemini-flash.bat` |
| Grok-Search MCP | 网络搜索 + AI | MCP tool |
| Ace-Tool MCP | 代码库语义搜索 | MCP tool |

### 工作流 API

| 端点 | 用途 |
|------|------|
| `/api/workflow/code-review` | 代码审查 |
| `/api/workflow/develop` | 功能开发 |
| `/api/workflow/debug` | 问题调试 |
| `/api/workflow/design-api` | API 设计 |
| `/api/workflow/design-schema` | Schema 设计 |
| `/api/workflow/generate-tests` | 测试生成 |

### SKILLs 配置

项目 SKILLs 定义在 `.claude/SKILLS.md`

### 使用示例

```javascript
const workflow = require('./backend/services/multiModelWorkflow');

// 代码审查
await workflow.codeReview(context, issue);

// 功能开发
await workflow.developFeature(requirement, context);

// 问题调试
await workflow.debug(issue, errorLog);
```

## AI 集成架构

项目支持多种 AI 服务集成，使用单例模式的服务类封装：

### 已集成的 AI 服务

| 服务 | 服务文件 | 用途 |
|------|----------|------|
| Dify | `backend/services/difyService.js` | 课件生成、评估、对话（含内置 MD5 响应缓存，TTL 1小时，上限 500 条） |
| SmartDifyWrapper | `backend/services/smartDifyWrapper.js` | 对 DifyService 的二次封装，提供分级超时（30s/2min/5min/10min）和重试策略 |
| 即梦AI | `backend/services/jimengService.js` | 文生图、文生视频（火山引擎 HMAC-SHA256 签名认证） |
| Gemini | `backend/services/geminiService.js` | 通用 AI 推理 |

> 注意：`backend/services/difyService_1.js` 是旧版备份，不要引用。

### SSE 流式响应模式

AI 生成类接口使用 Server-Sent Events 流式输出，固定格式如下：

```javascript
// 设置 SSE 响应头
res.writeHead(200, {
  'Content-Type': 'text/event-stream',
  'Cache-Control': 'no-cache',
  'Connection': 'keep-alive',
  'Access-Control-Allow-Origin': '*',
});
// 发送事件
res.write(`data: ${JSON.stringify(payload)}\n\n`);
```

相关控制器：`streamingCourseware-controller.js`、`streamingAI-controller.js`、`streamingLearningAssistant-controller.js`、`streamingPracticalExercise-controller.js`。

AI 响应中的 JSON 需剥离 markdown 代码块，使用 `extractJSON()` 工具函数处理，参见 `streamingCourseware-controller.js:8`。

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

# Dify AI — URL 和 Key 分开配置
DIFY_BASE_URL=https://api.dify.ai
DIFY_API_URL=https://api.dify.ai/v1   # 注意：服务层读 DIFY_API_URL，不是 DIFY_BASE_URL
DIFY_API_KEY=app-xxx
DIFY_TEACHER_LESSON_APP_ID=xxx
DIFY_TEACHER_EXAM_APP_ID=xxx
DIFY_TEACHER_ANALYTICS_APP_ID=xxx
DIFY_STUDENT_LEARNING_APP_ID=xxx
DIFY_STUDENT_PRACTICE_APP_ID=xxx

# Ollama (本地 AI)
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=deepseek-r1

# 即梦AI (火山引擎)
JIMENG_API_URL=https://visual.volcengineapi.com
VOLC_ACCESS_KEY=your_volc_access_key
VOLC_SECRET_KEY=your_volc_secret_key
JIMENG_IMAGE_ENABLED=true
JIMENG_VIDEO_ENABLED=true

# 功能开关
AI_LESSON_PLAN=true
AI_QUESTION_GEN=true
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

1. **Dify URL 配置**：服务层读取 `DIFY_API_URL`（含 `/v1` 后缀），`DIFY_BASE_URL` 仅用于健康检查，两者必须同时配置。
2. **路由注册位置**：所有路由统一在 `backend/routes/route.js` 挂载，新增路由必须在此文件中 `require` 并 `router.use()`。
3. **删除功能**：生产环境默认禁用删除功能，需在 `userHandle.js` 和相关页面中手动启用。
4. **AI 模拟模式**：AI 服务未配置时返回模拟数据，不会报错，便于前端开发调试。
5. **难度值归一化**：AI 生成内容的难度字段需经 `backend/utils/difficultyNormalizer.js` 的 `normalizeDifficulty()` 处理，再存入数据库。
6. **Electron 入口**：当前 `package.json` main 指向 `electron-main-simple.js`，打包时注意配置文件选择。
