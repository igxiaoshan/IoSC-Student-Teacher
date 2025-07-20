# 🤖 AI功能集成指南

本文档介绍如何配置和使用新增的AI功能，包括与Dify+Ollama本地知识库的集成。

## 📋 目录

- [功能概述](#功能概述)
- [环境配置](#环境配置)
- [数据模型](#数据模型)
- [API接口](#api接口)
- [使用示例](#使用示例)
- [测试指南](#测试指南)
- [故障排除](#故障排除)

## 🎯 功能概述

### 教师侧功能
- **📚 智能备课**: 基于课程大纲和知识库自动生成教学计划
- **📝 考核生成**: 自动生成多样化考试题目和参考答案
- **📊 学情分析**: 自动分析学生答案，提供错误定位和修正建议

### 学生侧功能
- **🤖 学习助手**: 结合教学内容的智能问答系统
- **💪 练习评测**: 个性化练习题生成和实时纠错

### 管理侧功能
- **📈 数据分析**: 教学效率和学习效果的深度分析
- **📊 可视化大屏**: 实时统计和趋势分析

## ⚙️ 环境配置

### 1. 复制环境配置文件
```bash
cp backend/.env.example backend/.env
```

### 2. 配置AI服务
编辑 `backend/.env` 文件：

```env
# Dify API 配置
DIFY_API_URL=http://localhost:3001/v1
DIFY_API_KEY=your_dify_api_key_here

# Ollama 配置
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama2

# AI功能开关
AI_LESSON_PLAN=true
AI_QUESTION_GEN=true
AI_ANSWER_ANALYSIS=true
AI_PERSONALIZED=true
AI_PERFORMANCE=true
AI_CHATBOT=true

# AI缓存配置
AI_CACHE_ENABLED=true
AI_CACHE_TTL=3600
AI_CACHE_MAX_SIZE=1000
```

### 3. 安装依赖
```bash
cd backend
npm install
```

### 4. 启动服务
```bash
# 启动后端服务
npm start

# 或开发模式
npm run dev
```

## 🗄️ 数据模型

### 新增的数据模型

1. **knowledgeBaseSchema** - 知识库管理
2. **courseContentSchema** - 课程内容
3. **lessonPlanSchema** - 教学计划
4. **questionSchema** - 题目库
5. **examSchema** - 考试管理
6. **answerSchema** - 学生答案
7. **exerciseSchema** - 练习题
8. **practiceRecordSchema** - 练习记录
9. **usageStatSchema** - 使用统计
10. **performanceAnalysisSchema** - 性能分析
11. **feedbackSchema** - 反馈系统

## 🔌 API接口

### 知识库管理
```
POST   /api/knowledge-base/create          # 创建知识库条目
POST   /api/knowledge-base/upload          # 上传文件
GET    /api/knowledge-base/school/:id      # 获取知识库列表
POST   /api/knowledge-base/search/:id      # 智能搜索
GET    /api/knowledge-base/stats/:id       # 统计信息
```

### 教学计划
```
POST   /api/lesson-plan/create             # 创建教学计划
POST   /api/lesson-plan/generate           # AI生成教学计划
GET    /api/lesson-plan/school/:id         # 获取计划列表
PUT    /api/lesson-plan/:id                # 更新计划
DELETE /api/lesson-plan/:id                # 删除计划
```

### 题目管理
```
POST   /api/question/create                # 创建题目
POST   /api/question/generate              # AI生成题目
GET    /api/question/school/:id            # 获取题目列表
PUT    /api/question/:id                   # 更新题目
DELETE /api/question/:id                   # 删除题目
POST   /api/question/:id/duplicate         # 复制题目
GET    /api/question/stats/:id             # 题目统计
```

### 考试管理
```
POST   /api/exam/create                    # 创建考试
POST   /api/exam/generate                  # AI生成考试
GET    /api/exam/school/:id                # 获取考试列表
PUT    /api/exam/:id                       # 更新考试
DELETE /api/exam/:id                       # 删除考试
GET    /api/exam/:id/statistics            # 考试统计
```

### 答案分析
```
POST   /api/answer/submit                  # 提交答案
GET    /api/answer                         # 获取答案列表
PUT    /api/answer/:id/manual-grading      # 人工评分
POST   /api/answer/batch-analyze           # 批量分析
GET    /api/answer/student/:id/error-analysis  # 错误分析
```

### 学习分析
```
POST   /api/analytics/student/:id          # 学生个人分析
POST   /api/analytics/class/:id            # 班级整体分析
POST   /api/analytics/teacher/:id          # 教师效果分析
GET    /api/analytics/reports/:id          # 分析报告列表
```

### 教师仪表板
```
GET    /api/teacher-dashboard/:id          # 教师仪表板
GET    /api/teacher-dashboard/:id/effectiveness    # 教学效果
GET    /api/teacher-dashboard/:id/student-difficulties  # 学生困难
POST   /api/teacher-dashboard/:id/suggestions      # 教学建议
```

### AI聊天机器人
```
POST   /api/chat                           # 智能对话
```

## 💡 使用示例

### 1. 上传知识库文档
```javascript
const formData = new FormData();
formData.append('file', file);
formData.append('title', '课程资料');
formData.append('subject', subjectId);
formData.append('adminID', schoolId);
formData.append('uploadedBy', teacherId);

fetch('/api/knowledge-base/upload', {
    method: 'POST',
    body: formData
});
```

### 2. AI生成教学计划
```javascript
const lessonData = {
    subject: 'subjectId',
    sclass: 'classId',
    teacher: 'teacherId',
    school: 'schoolId',
    courseOutline: '课程大纲内容...',
    learningObjectives: '学习目标...',
    duration: 90,
    difficulty: 'intermediate',
    contentType: 'mixed'
};

fetch('/api/lesson-plan/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(lessonData)
});
```

### 3. 智能搜索知识库
```javascript
const searchData = {
    query: '什么是JavaScript变量？',
    subject: 'subjectId',
    limit: 10
};

fetch('/api/knowledge-base/search/schoolId', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(searchData)
});
```

## 🧪 测试指南

### 运行AI服务测试
```bash
cd backend
# 基础AI服务测试
node test/aiServiceTest.js

# 教师功能测试
node test/teacherFeaturesTest.js
```

### 测试内容包括：

#### 基础服务测试
- ✅ AI服务连接测试
- 📚 教学计划生成测试
- ❓ 题目生成测试
- 📊 答案分析测试
- 💪 个性化练习测试

#### 教师功能测试
- ✅ 智能题目生成
- 📝 答案自动分析
- 🎯 个性化练习推荐
- 📊 学习表现分析
- 🔄 批量处理功能
- 💡 智能推荐系统

### 健康检查
访问 `http://localhost:5000/health` 检查服务状态

## 🔧 故障排除

### 常见问题

#### 1. AI服务连接失败
**症状**: API返回"AI服务暂时不可用"
**解决方案**:
- 检查Dify服务是否运行: `curl http://localhost:3001/health`
- 检查Ollama服务: `curl http://localhost:11434/api/version`
- 验证API密钥是否正确

#### 2. 文件上传失败
**症状**: 上传文件时返回错误
**解决方案**:
- 检查上传目录权限: `ls -la uploads/`
- 确认文件大小不超过限制 (默认10MB)
- 检查文件类型是否支持

#### 3. 缓存问题
**症状**: AI响应不更新
**解决方案**:
- 清除缓存: 重启服务或设置 `AI_CACHE_ENABLED=false`
- 检查缓存TTL设置

#### 4. 限流问题
**症状**: 请求被拒绝，提示"请求过于频繁"
**解决方案**:
- 等待限流窗口重置 (默认15分钟)
- 调整限流配置: `RATE_LIMIT_MAX=200`

### 日志调试

启用详细日志:
```env
AI_LOGGING=true
AI_LOG_LEVEL=debug
```

查看日志:
```bash
tail -f backend/logs/ai-service.log
```

### 性能优化

1. **启用缓存**: 设置合适的缓存TTL
2. **调整超时**: 根据网络情况调整API超时时间
3. **限流配置**: 根据服务器性能调整限流参数

## 📞 技术支持

如果遇到问题，请：

1. 查看服务器日志
2. 运行测试套件确认问题范围
3. 检查环境配置
4. 提供详细的错误信息和复现步骤

## 🔄 更新日志

### v1.0.0 (基础版本)
- ✅ 基础AI服务集成
- ✅ 知识库管理功能
- ✅ 教学计划AI生成
- ✅ 智能搜索功能
- ✅ 缓存和限流机制
- ✅ 错误处理和日志系统

### v1.1.0 (教师功能版本 - 当前)
- ✅ 智能题目生成系统
- ✅ 考试管理功能
- ✅ 答案自动分析和评分
- ✅ 学情数据深度分析
- ✅ 教师仪表板集成
- ✅ 批量处理和推荐系统
- ✅ 错误模式识别
- ✅ 个性化反馈生成

### 计划中的功能
- 🔄 学生侧学习助手
- 🔄 实时练习评测
- 🔄 管理侧数据大屏
- 🔄 前端界面完整集成
- 🔄 移动端适配
