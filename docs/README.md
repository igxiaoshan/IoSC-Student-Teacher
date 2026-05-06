# 项目文档索引

本目录包含学校管理系统的所有技术文档，分为**知识性文档**和**操作性文档**两大类。

---

## 文档目录结构

```
docs/
├── 知识性文档/                    # 理论、概念、架构说明类文档
│   ├── 架构设计/                  # 系统架构和技术设计文档
│   ├── 功能说明/                  # 功能模块详细说明
│   └── 项目报告/                  # 开发进度和完成报告
│
├── 操作性文档/                    # 安装、部署、使用指南类文档
│   ├── 安装部署/                  # 安装和部署指南
│   ├── 使用指南/                  # 功能使用说明
│   └── 开发配置/                  # 开发环境配置
│
└── README.md                      # 本索引文件
```

---

## 一、知识性文档

### 1.1 架构设计

| 文档名称 | 内容概述 | 来源 |
|---------|---------|------|
| `PROJECT_ARCHITECTURE_DESIGN.md` | 系统整体架构设计、技术栈分析、数据库设计 | 根目录 docs/ |
| `ELECTRON_README.md` | Electron 桌面应用架构、打包配置说明 | 根目录 docs/ |

### 1.2 功能说明

| 文档名称 | 内容概述 | 来源 |
|---------|---------|------|
| `AI-FEATURES-README.md` | AI 功能集成指南，Dify+Ollama 配置 | docs/backend/ |

### 1.3 项目报告

| 文档名称 | 内容概述 | 来源 |
|---------|---------|------|
| `PROJECT_IMPROVEMENT_SUMMARY.md` | 项目改进总结，AI功能集成与管理功能完善 | 根目录 docs/ |
| `PROJECT-COMPLETION-REPORT.md` | AI增强项目总体完成报告 | docs/backend/ |
| `STAGE-3-COMPLETION-REPORT.md` | 第三阶段完成报告：教师侧功能实现 | docs/backend/ |
| `STAGE-4-COMPLETION-REPORT.md` | 第四阶段完成报告：学生侧功能实现 | docs/backend/ |
| `STAGE-5-COMPLETION-REPORT.md` | 第五阶段完成报告：管理侧功能实现 | docs/backend/ |
| `DIFY-INTEGRATION-REPORT.md` | Dify知识库模型集成实施报告 | docs/backend/ |
| `STREAMING_RESPONSE_FIX_REPORT.md` | 流式响应和内容过滤修复报告 | 根目录 docs/ |
| `1.FRONTEND-COMPLETION-REPORT.md` | 前端AI功能实施完成报告 | frontend/src/ |
| `2.AI-THINKING-FEATURE-REPORT.md` | AI思考过程展示功能实施报告 | frontend/src/ |
| `3.STREAMING-AI-IMPLEMENTATION-REPORT.md` | 流式AI响应实施报告 | frontend/src/ |
| `FRONTEND-SUCCESS-REPORT.md` | 前端启动成功报告 | frontend/src/ |

---

## 二、操作性文档

### 2.1 安装部署

| 文档名称 | 内容概述 | 来源 |
|---------|---------|------|
| `开源代码与安装说明.md` | 开源组件使用情况说明和完整安装指南 | 根目录 |
| `项目启动操作文档.md` | 详细的项目启动操作步骤 | 根目录 |
| `DEPLOY.md` | Docker 部署指南（手动部署 + docker-compose） | 根目录 |
| `backend-setup.md` | 后端服务安装配置指南 | backend/ |
| `frontend-setup.md` | 前端应用安装配置指南 | frontend/ |

### 2.2 使用指南

| 文档名称 | 内容概述 | 来源 |
|---------|---------|------|
| `即梦AI使用指南.md` | 即梦AI文生图/文生视频功能使用说明 | 根目录 |

### 2.3 开发配置

| 文档名称 | 内容概述 | 来源 |
|---------|---------|------|
| `CLAUDE.md` | Claude Code 项目配置和开发指南 | 根目录 |

---

## 三、文档分类说明

### 知识性文档 vs 操作性文档

| 特征 | 知识性文档 | 操作性文档 |
|------|-----------|-----------|
| **目的** | 传授知识、解释原理 | 指导操作、解决问题 |
| **内容** | 架构设计、技术原理、项目进度 | 安装步骤、使用方法、配置说明 |
| **读者** | 开发者、架构师、项目管理者 | 用户、运维人员、新开发者 |
| **更新频率** | 较低（架构稳定后很少变化） | 较高（随版本更新） |
| **示例** | 系统架构文档、API设计文档 | 安装指南、用户手册 |

---

## 四、原始文档位置

原始文档保留在各自的位置，本目录为整理后的副本：

- **根目录**: `README.md`, `CLAUDE.md`, `DEPLOY.md`, `即梦AI使用指南.md`, `开源代码与安装说明.md`, `项目启动操作文档.md`
- **docs/**: 架构设计、Electron说明等
- **docs/backend/**: 后端相关报告
- **frontend/src/**: 前端相关报告
- **backend/README.md**: 后端设置指南
- **frontend/README.md**: 前端设置指南

---

## 五、文档维护建议

1. **新增文档**: 根据文档性质放入对应分类目录
2. **更新文档**: 同步更新原始位置和整理目录
3. **命名规范**: 使用中文名称或英文下划线命名
4. **版本控制**: 重要文档变更记录版本号和更新日期

---

*文档整理日期: 2026年4月*
*维护者: 项目开发团队*
