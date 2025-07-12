# 🤖 AI智能学校管理系统 - 设计文档

## 📋 项目概述

基于现有MERN Stack学校管理系统，集成本地Dify + Ollama DeepSeek-R1模型，实现智能化教学辅助功能。

### 🎯 核心目标
- **学生侧**: 在线学习助手 + 实时练习评测
- **教师侧**: 智能备课 + 考核生成 + 学情分析  
- **管理侧**: 资源管理 + 数据可视化

---

## 🏗️ 技术架构设计

### AI服务架构
```
┌─────────────────┐    HTTP API    ┌─────────────────┐    Local API    ┌─────────────────┐
│   Frontend      │ ◄─────────────► │    Backend      │ ◄──────────────► │   Dify + Ollama │
│   (React.js)    │                 │   (Node.js)     │                  │   (DeepSeek-R1) │
└─────────────────┘                 └─────────────────┘                  └─────────────────┘
```

### Dify集成配置
- **本地Dify地址**: `http://localhost/chat/gbTFYyuYvH6RsNGa`
- **API密钥**: 
  - Key1: `app-EOyF3XHtRMMZjEVuNJGRLs9n`
  - Key2: `app-ovFbxljp6Sak97GquBKzSv9g`
- **模型**: Ollama DeepSeek-R1

---

## 📊 数据库扩展设计

### 新增数据模型

#### 1. 学习记录模型 (LearningRecord)
```javascript
{
  studentId: ObjectId,
  subject: String,
  questionType: String, // "学习问答" | "练习题目"
  question: String,
  answer: String,
  aiResponse: String,
  isCorrect: Boolean,
  difficulty: Number, // 1-5难度等级
  timestamp: Date,
  knowledgePoints: [String]
}
```

#### 2. 课件资源模型 (CourseResource)
```javascript
{
  teacherId: ObjectId,
  title: String,
  subject: String,
  content: String,
  resourceType: String, // "课件" | "练习" | "考核"
  filePath: String,
  isShared: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

#### 3. 练习题库模型 (ExerciseBank)
```javascript
{
  subject: String,
  chapter: String,
  question: String,
  options: [String],
  correctAnswer: String,
  explanation: String,
  difficulty: Number,
  knowledgePoints: [String],
  createdBy: ObjectId
}
```

#### 4. 系统使用统计模型 (UsageStats)
```javascript
{
  userId: ObjectId,
  userRole: String,
  feature: String,
  usageCount: Number,
  lastUsed: Date,
  date: Date
}
```

---

## 🔧 API接口设计

### 学生侧API
```javascript
// 学习助手
POST /api/ai/student/ask-question
POST /api/ai/student/generate-exercise
POST /api/ai/student/check-answer

// 学习记录
GET /api/student/learning-history/:studentId
POST /api/student/save-learning-record
```

### 教师侧API
```javascript
// 智能备课
POST /api/ai/teacher/generate-lesson-plan
POST /api/ai/teacher/generate-exam
POST /api/ai/teacher/analyze-student-performance

// 资源管理
GET /api/teacher/resources/:teacherId
POST /api/teacher/save-resource
PUT /api/teacher/update-resource/:id
DELETE /api/teacher/delete-resource/:id
```

### 管理侧API
```javascript
// 统计分析
GET /api/admin/usage-stats
GET /api/admin/teaching-efficiency
GET /api/admin/learning-effectiveness

// 资源管理
GET /api/admin/all-resources
POST /api/admin/share-resource
```

---

## 🎨 前端组件设计

### 学生侧新增组件
- `LearningAssistant.js` - 学习助手聊天界面
- `ExerciseGenerator.js` - 练习题生成器
- `AnswerChecker.js` - 答案检查器
- `LearningHistory.js` - 学习历史记录

### 教师侧新增组件
- `LessonPlanGenerator.js` - 智能备课工具
- `ExamGenerator.js` - 考核生成器
- `StudentAnalytics.js` - 学情分析面板
- `ResourceManager.js` - 资源管理器

### 管理侧新增组件
- `UsageDashboard.js` - 使用情况仪表板
- `TeachingEfficiencyChart.js` - 教学效率图表
- `ResourceOverview.js` - 资源概览
- `SystemAnalytics.js` - 系统分析面板

---

## 🔐 安全与权限设计

### API访问控制
- 基于JWT的身份验证
- 角色权限中间件验证
- API调用频率限制

### 数据安全
- 敏感数据加密存储
- AI对话内容脱敏处理
- 用户隐私保护机制

---

## 📈 性能优化策略

### AI服务优化
- 请求缓存机制
- 异步处理长时间AI任务
- 连接池管理

### 前端优化
- 组件懒加载
- 虚拟滚动处理大量数据
- 状态管理优化

---

## 🚀 部署架构

### 开发环境
```
Frontend: localhost:3000
Backend: localhost:5000
Database: MongoDB (本地)
AI Service: Dify (localhost) + Ollama DeepSeek-R1
```

### 生产环境
```
Frontend: Netlify
Backend: Render/自建服务器
Database: MongoDB Atlas
AI Service: 自建服务器 (Dify + Ollama)
```

---

## 📝 开发规范

### 代码规范
- 组件命名采用PascalCase
- API路由采用RESTful设计
- 数据库字段采用camelCase
- 中文注释和变量名

### 文档规范
- 每个功能模块需要详细文档
- API接口需要完整的参数说明
- 组件需要PropTypes定义

---

## 🔄 迭代计划

### Phase 1: 基础AI集成 (2周)
- Dify API集成
- 基础聊天功能
- 数据库模型创建

### Phase 2: 学生功能开发 (3周)
- 学习助手实现
- 练习生成功能
- 答案检查功能

### Phase 3: 教师功能开发 (3周)
- 智能备课工具
- 考核生成器
- 学情分析功能

### Phase 4: 管理功能开发 (2周)
- 数据统计面板
- 资源管理系统
- 系统监控功能

### Phase 5: 优化与测试 (2周)
- 性能优化
- 安全测试
- 用户体验优化
