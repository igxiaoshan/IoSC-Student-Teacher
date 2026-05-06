# 课程管理增强 (P2+P4) - 深度分析

## 概述

**创意 ID**: P2 + P4
**类型**: 务实增强
**预估工作量**: 2-4 天
**风险等级**: 低

---

## 核心功能

### 1. 课程进度追踪卡片增强 (P2)

#### 功能描述
增强 StudentSubjects 的 SubjectCard，添加更丰富的进度追踪：

| 功能点 | 描述 | 优先级 |
|--------|------|--------|
| 学习时间线 | 显示最近学习活动和下次课程 | P0 |
| 最近学习记录 | 最近3-5次学习/练习记录 | P0 |
| 下次课程提醒 | 倒计时显示下次课程时间 | P1 |
| 学习时长统计 | 本周/本月科目学习时长 | P1 |
| 资源快捷入口 | 快速访问课件、练习、笔记 | P2 |

#### UI 组件设计
```
┌─────────────────────────────────────────────────────────────┐
│ 📐 数学                                       成绩: 85 分  │
├─────────────────────────────────────────────────────────────┤
│ 🔢 课程代码: MATH101 · 48课时                              │
│                                                             │
│ 学习进度: ████████████░░░░░░░░ 65%                         │
│                                                             │
│ ⏱ 本周学习: 3.5小时  |  📚 下次课程: 明天 14:00            │
│                                                             │
│ 最近活动:                                                   │
│ ├─ 今天 10:30  完成练习「二次函数」正确率 85%              │
│ ├─ 昨天 16:00  观看课件「三角函数基础」                     │
│ └─ 前天 09:15  参与课堂讨论                                 │
│                                                             │
│ 🏷 知识点: [✓基础概念] [◐核心原理] [○应用实践]             │
│                                                             │
│ [▶ 继续学习]  [📝 练习]  [📋 笔记]                          │
└─────────────────────────────────────────────────────────────┘
```

### 2. 学习偏好智能应用 (P4)

#### 功能描述
充分利用 SubjectSelection 中已设置的学习偏好：

| 学习偏好 | 应用场景 | 实现方式 |
|----------|----------|----------|
| **难度级别** | 调整练习题难度分布 | 初级→简单题多，高级→挑战题多 |
| **学习风格** | 调整资源展示顺序 | 视觉→视频优先，阅读→文档优先 |
| **学习目标** | 个性化进度建议 | 目标导向的资源推荐 |

#### 数据应用逻辑
```javascript
// 根据学习风格调整资源展示
const getResourcePriority = (subject, preferences) => {
  const styleMap = {
    visual: ['video', 'animation', 'infographic', 'text'],
    auditory: ['audio', 'video', 'podcast', 'text'],
    kinesthetic: ['interactive', 'simulation', 'practice', 'text'],
    reading: ['text', 'document', 'video', 'practice']
  };

  const priority = styleMap[preferences.preferredLearningStyle] || styleMap.visual;
  return subject.resources.sort((a, b) =>
    priority.indexOf(a.type) - priority.indexOf(b.type)
  );
};

// 根据难度调整练习生成
const getPracticeConfig = (preferences) => ({
  beginner: { easy: 60, medium: 30, hard: 10 },
  intermediate: { easy: 30, medium: 50, hard: 20 },
  advanced: { easy: 10, medium: 40, hard: 50 }
}[preferences.difficulty]);
```

---

## 技术实现

### 前端改动
| 文件 | 改动内容 |
|------|----------|
| `StudentSubjects.js` | 增强 SubjectCard 组件 |
| 新增 `SubjectTimeline.js` | 学习时间线组件 |
| 新增 `LearningPreferencesWidget.js` | 偏好应用可视化 |
| `apiClient.js` | 添加学习记录 API |

### 后端改动
| 文件 | 改动内容 |
|------|----------|
| `studentSubject-controller.js` | 扩展 getStudentSubjects 返回学习记录 |
| 新增 `learningRecord-controller.js` | 学习记录管理 |
| `studentSchema.js` | 添加 learningRecords 子文档 |

### 数据模型扩展
```javascript
// studentSchema 扩展
{
  learningRecords: [{
    subject: { type: ObjectId, ref: 'subject' },
    type: { type: String, enum: ['course', 'practice', 'exam', 'note'] },
    title: String,
    duration: Number,  // 分钟
    score: Number,
    completedAt: { type: Date, default: Date.now }
  }],

  weeklyStudyTime: [{
    subject: { type: ObjectId, ref: 'subject' },
    week: String,  // "2024-W05"
    minutes: Number
  }]
}
```

---

## 实施计划

### Phase 1: 数据收集 (1 天)
1. 后端: 添加学习记录存储逻辑
2. 集成: 在练习、课件等模块埋点记录

### Phase 2: 卡片增强 (1-2 天)
1. 前端: 实现时间线组件
2. 前端: 添加学习时长统计
3. 集成: 下次课程提醒逻辑

### Phase 3: 偏好应用 (1 天)
1. 后端: 资源排序 API
2. 前端: 偏好应用可视化
3. 测试: 验证个性化效果

---

## 验收标准
- [ ] 科目卡片显示最近3条学习记录
- [ ] 学习时长统计准确
- [ ] 下次课程提醒正确显示
- [ ] 学习风格影响资源展示顺序
- [ ] 难度设置影响练习生成

---

## 与现有模块集成
| 模块 | 集成点 |
|------|--------|
| StudentMistakeBook | 错题关联到科目时间线 |
| StudentCalendar | 学习记录同步到日历 |
| LearningAssistant | 偏好数据驱动 AI 对话 |
| StudentAIPractice | 难度设置影响题目生成 |