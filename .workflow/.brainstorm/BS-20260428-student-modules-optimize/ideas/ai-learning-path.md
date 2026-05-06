# AI 学习路径推荐引擎 (C5) - 深度分析

## 概述

**创意 ID**: C5
**类型**: 创新功能
**预估工作量**: 5-7 天
**风险等级**: 中

---

## 核心功能

### 智能学习路径生成

#### 功能描述
基于多维度数据，AI 动态生成个性化学习路径：

| 数据输入 | 权重 | 用途 |
|----------|------|------|
| 考勤数据 | 20% | 识别学习习惯、出勤模式 |
| 成绩趋势 | 30% | 识别薄弱科目、进步空间 |
| 学习偏好 | 15% | 个性化资源类型、难度 |
| 错题分析 | 25% | 知识点掌握度评估 |
| 日程安排 | 10% | 可用学习时间优化 |

#### 推荐逻辑架构
```
┌─────────────────────────────────────────────────────────────┐
│                    AI 学习路径推荐引擎                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐     │
│  │考勤分析 │   │成绩分析 │   │错题分析 │   │偏好分析 │     │
│  └────┬────┘   └────┬────┘   └────┬────┘   └────┬────┘     │
│       │             │             │             │           │
│       └─────────────┴──────┬──────┴─────────────┘           │
│                             ▼                               │
│                   ┌─────────────────┐                       │
│                   │  特征向量生成   │                       │
│                   └────────┬────────┘                       │
│                            ▼                                │
│                   ┌─────────────────┐                       │
│                   │  AI 推荐模型    │                       │
│                   │ (规则+ML混合)   │                       │
│                   └────────┬────────┘                       │
│                            ▼                                │
│       ┌─────────────────────────────────────────┐           │
│       │  输出: 学习路径 + 资源推荐 + 时间建议   │           │
│       └─────────────────────────────────────────┘           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 推荐场景

| 场景 | 触发条件 | 推荐内容 |
|------|----------|----------|
| 薄弱科目补救 | 单科成绩 < 70 或出勤率下降 | 重点知识点复习资源 |
| 考前冲刺 | 考试前 1-2 周 | 模拟测试 + 错题重练 |
| 日常学习 | 每日首次登录 | 今日学习计划 + 进度提醒 |
| 进步鼓励 | 成绩提升 > 10% | 鼓励反馈 + 进阶挑战 |
| 时间优化 | 检测到空闲时段 | 碎片化学习资源推荐 |

---

## UI 设计

### 学习路径可视化
```
┌─────────────────────────────────────────────────────────────┐
│ 🎯 我的学习路径                                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ 本周目标: 完成数学「三角函数」单元 + 英语词汇 200 个         │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │  ✓     →     ◐     →     ○     →     ○                 │ │
│ │ 基础概念    公式推导    图像变换    综合应用              │ │
│ │  已完成     进行中      待学习      待学习                │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ 📌 今日推荐:                                                 │
│ ├─ 🔴 高优先: 数学 - 三角函数图像变换 (预计 25min)         │
│ ├─ 🟡 中优先: 英语 - 词汇练习 Unit 5 (预计 15min)          │
│ └─ 🟢 低优先: 物理 - 复习力学基础 (预计 20min)             │
│                                                             │
│ 💡 AI 建议: 检测到您在「图像变换」知识点较薄弱，             │
│    建议先观看视频教程再做练习。                              │
│                                                             │
│ [▶ 开始今日学习]  [📋 查看完整路径]                         │
└─────────────────────────────────────────────────────────────┘
```

---

## 技术实现

### 后端架构
```javascript
// 新增服务: learningPathService.js
class LearningPathService {
  // 生成学习路径
  async generatePath(studentId) {
    const features = await this.extractFeatures(studentId);
    const path = await this.runRecommendationModel(features);
    return this.prioritizeAndSchedule(path);
  }

  // 特征提取
  async extractFeatures(studentId) {
    const [attendance, grades, mistakes, preferences] = await Promise.all([
      this.getAttendanceFeatures(studentId),
      this.getGradeFeatures(studentId),
      this.getMistakeFeatures(studentId),
      this.getPreferenceFeatures(studentId)
    ]);

    return this.combineFeatures({ attendance, grades, mistakes, preferences });
  }

  // 推荐模型 (规则 + ML 混合)
  async runRecommendationModel(features) {
    // Phase 1: 规则引擎
    const ruleBasedRecs = this.applyRules(features);

    // Phase 2: ML 增强 (可选，调用 Dify/Ollama)
    const mlRecs = await this.enhanceWithML(features, ruleBasedRecs);

    return this.mergeRecommendations(ruleBasedRecs, mlRecs);
  }
}
```

### 数据模型
```javascript
// 新增 Schema: learningPathSchema.js
{
  student: { type: ObjectId, ref: 'student', required: true },
  currentPath: {
    subject: { type: ObjectId, ref: 'subject' },
    milestones: [{
      title: String,
      description: String,
      status: { type: String, enum: ['completed', 'in_progress', 'pending'] },
      targetDate: Date,
      resources: [{ type: ObjectId, ref: 'resource' }],
      progress: { type: Number, default: 0 }
    }],
    generatedAt: Date,
    expiresAt: Date
  },
  dailyRecommendations: [{
    date: Date,
    items: [{
      subject: ObjectId,
      topic: String,
      priority: { type: String, enum: ['high', 'medium', 'low'] },
      estimatedMinutes: Number,
      reason: String,
      completed: { type: Boolean, default: false }
    }]
  }],
  aiInsights: [{
    type: String,
    message: String,
    timestamp: Date
  }]
}
```

---

## 实施计划

### Phase 1: 数据基础 (2 天)
1. 创建特征提取服务
2. 实现数据聚合逻辑
3. 建立学习路径数据模型

### Phase 2: 规则引擎 (2 天)
1. 定义推荐规则
2. 实现优先级排序
3. 生成每日推荐

### Phase 3: AI 增强 (2-3 天)
1. 集成 Dify/Ollama API
2. 实现个性化建议生成
3. 添加学习洞察分析

### Phase 4: 前端集成 (1-2 天)
1. 学习路径可视化组件
2. 今日推荐卡片
3. 路径进度追踪

---

## 验收标准
- [ ] 根据成绩数据正确识别薄弱科目
- [ ] 学习路径可视化显示里程碑进度
- [ ] 每日推荐基于当前进度生成
- [ ] AI 建议与学习偏好关联
- [ ] 路径可手动调整

---

## 风险与缓解
| 风险 | 缓解措施 |
|------|----------|
| 推荐不准确 | 用户反馈机制，持续优化模型 |
| AI 服务不稳定 | 规则引擎兜底，离线模式支持 |
| 数据隐私 | 特征数据脱敏，本地处理优先 |

---

## 与现有模块集成
| 模块 | 集成点 |
|------|--------|
| StudentMistakeBook | 错题数据驱动薄弱点分析 |
| StudentCalendar | 学习路径同步到日历 |
| LearningAssistant | AI 助手基于路径推荐回答 |
| StudentAIPractice | 练习生成基于路径当前阶段 |