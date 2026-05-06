# 游戏化学习旅程地图 (C2) - 深度分析

## 概述

**创意 ID**: C2
**类型**: 创新功能
**预估工作量**: 7-10 天
**风险等级**: 中

---

## 核心功能

### 学习旅程地图

#### 功能描述
将课程学习转化为可视化的游戏化旅程：

| 元素 | 游戏化映射 | 教育意义 |
|------|------------|----------|
| 科目 | 关卡/城市 | 课程体系可视化 |
| 知识点 | 任务点 | 学习目标拆解 |
| 出勤率 | 角色体力值 | 鼓励持续学习 |
| 练习完成 | 经验值 | 量化学习进度 |
| 成绩提升 | 成就徽章 | 正向激励 |

#### 游戏化设计
```
┌─────────────────────────────────────────────────────────────┐
│ 🗺️ 数学王国 - 学习旅程                                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│          ┌──────┐                                           │
│          │ 🏆   │  终极Boss: 综合应用                        │
│          │ Lv.4 │  ★★★☆☆ 难度                               │
│          └──┬───┘                                           │
│             │                                               │
│     ┌───────┴───────┐                                       │
│     │               │                                       │
│  ┌──┴──┐        ┌──┴──┐                                    │
│  │ 🎯  │        │ 📊  │                                    │
│  │Lv.3 │        │Lv.3 │  图像变换   公式推导                 │
│  │ ◐   │        │ ✓   │  进行中     已完成                   │
│  └──┬──┘        └──┬──┘                                    │
│     │              │                                        │
│  ┌──┴──┐        ┌──┴──┐                                    │
│  │ 📚  │        │ 🎓  │                                    │
│  │Lv.2 │        │Lv.2 │  概念理解   基础运算                 │
│  │ ✓   │        │ ✓   │  已完成     已完成                   │
│  └─────┘        └─────┘                                    │
│                                                             │
│ 👤 我的角色: 数学探险家 Lv.12                                │
│ 💪 体力: ████████░░ 80% (出勤率影响)                        │
│ ⭐ 经验值: 2,450 / 3,000                                    │
│ 🏅 成就: [快速学习者] [连续打卡7天] [满分达人]              │
└─────────────────────────────────────────────────────────────┘
```

### 成就与徽章系统

| 徽章类型 | 名称 | 获得条件 | 稀有度 |
|----------|------|----------|--------|
| 出勤类 | 晨曦之星 | 连续早到 30 天 | 稀有 |
| 出勤类 | 勤学不辍 | 学期出勤率 > 95% | 普通 |
| 成绩类 | 进步飞跃 | 单科成绩提升 > 20 分 | 稀有 |
| 成绩类 | 学霸称号 | 平均分 > 90 | 史诗 |
| 学习类 | 刷题达人 | 完成 500 道练习 | 普通 |
| 学习类 | 知识渊博 | 解锁所有科目地图 | 传说 |
| 社交类 | 助人为乐 | 帮助同学解答 50 次 | 稀有 |

### 排行榜系统

| 排行榜类型 | 统计维度 | 更新频率 |
|------------|----------|----------|
| 周经验榜 | 本周获得经验值 | 实时 |
| 学期榜 | 学期总积分 | 每日 |
| 进步榜 | 成绩提升幅度 | 每周 |
| 科目榜 | 单科成就点数 | 实时 |

---

## 技术实现

### 数据模型
```javascript
// 新增 Schema: gamificationSchema.js
const gamificationSchema = new mongoose.Schema({
  student: { type: ObjectId, ref: 'student', required: true },

  // 角色信息
  character: {
    level: { type: Number, default: 1 },
    experience: { type: Number, default: 0 },
    title: { type: String, default: '新手学习者' },
    avatar: String
  },

  // 科目进度
  subjectProgress: [{
    subject: { type: ObjectId, ref: 'subject' },
    mapLevel: { type: Number, default: 1 },
    checkpoints: [{
      id: String,
      title: String,
      status: { type: String, enum: ['locked', 'available', 'completed'] },
      stars: { type: Number, min: 0, max: 3 },
      completedAt: Date
    }],
    totalStars: { type: Number, default: 0 }
  }],

  // 成就徽章
  badges: [{
    badgeId: String,
    name: String,
    description: String,
    rarity: { type: String, enum: ['common', 'rare', 'epic', 'legendary'] },
    earnedAt: { type: Date, default: Date.now },
    displayed: { type: Boolean, default: true }
  }],

  // 积分记录
  points: {
    total: { type: Number, default: 0 },
    weekly: { type: Number, default: 0 },
    history: [{
      date: Date,
      change: Number,
      reason: String
    }]
  },

  // 排行榜缓存
  rankings: {
    weekly: { rank: Number, updatedAt: Date },
    semester: { rank: Number, updatedAt: Date }
  }
});

// 索引
gamificationSchema.index({ 'points.weekly': -1 });
gamificationSchema.index({ 'points.total': -1 });
```

### 积分规则引擎
```javascript
// gamificationEngine.js
const PointRules = {
  // 出勤相关
  ATTENDANCE_PRESENT: { points: 10, reason: '出勤打卡' },
  ATTENDANCE_STREAK_7: { points: 50, badge: '连续打卡7天' },
  ATTENDANCE_STREAK_30: { points: 200, badge: '坚持不懈' },

  // 学习相关
  COMPLETE_PRACTICE: { points: 5, reason: '完成练习' },
  PRACTICE_ACCURACY_90: { points: 20, reason: '练习正确率90%' },
  WATCH_COURSEWARE: { points: 3, reason: '观看课件' },

  // 成绩相关
  GRADE_IMPROVE_10: { points: 30, reason: '成绩提升10分' },
  GRADE_PERFECT: { points: 100, badge: '满分达人' },

  // 社交相关
  HELP_CLASSMATE: { points: 15, reason: '帮助同学' },
  SHARE_NOTES: { points: 10, reason: '分享笔记' }
};

class GamificationEngine {
  async awardPoints(studentId, rule, context = {}) {
    const game = await Gamification.findOne({ student: studentId });
    if (!game) return;

    // 添加积分
    game.points.total += rule.points;
    game.points.weekly += rule.points;
    game.points.history.push({
      date: new Date(),
      change: rule.points,
      reason: rule.reason
    });

    // 检查升级
    await this.checkLevelUp(game);

    // 检查成就
    if (rule.badge) {
      await this.awardBadge(game, rule.badge);
    }

    await game.save();
    return game;
  }

  async checkLevelUp(game) {
    const xpThresholds = [0, 100, 250, 500, 1000, 2000, 4000, 8000];
    const currentLevel = game.character.level;
    const nextThreshold = xpThresholds[currentLevel] || Infinity;

    if (game.points.total >= nextThreshold) {
      game.character.level += 1;
      game.character.title = this.getTitleByLevel(game.character.level);
      // 触发升级通知
    }
  }
}
```

---

## UI 组件

### 新增前端文件
| 文件 | 描述 |
|------|------|
| `LearningMap.js` | 学习旅程地图主组件 |
| `CharacterProfile.js` | 角色信息卡片 |
| `BadgeCollection.js` | 成就徽章展示 |
| `Leaderboard.js` | 排行榜组件 |
| `PointsHistory.js` | 积分记录时间线 |

---

## 实施计划

### Phase 1: 基础架构 (3 天)
1. 创建游戏化数据模型
2. 实现积分规则引擎
3. 建立出勤/学习事件监听

### Phase 2: 核心功能 (3 天)
1. 学习地图可视化
2. 角色等级系统
3. 成就徽章系统

### Phase 3: 社交功能 (2-3 天)
1. 排行榜系统
2. 积分历史查看
3. 成就分享

### Phase 4: 优化迭代 (1-2 天)
1. 性能优化
2. 体验细节打磨
3. 用户反馈收集

---

## 验收标准
- [ ] 学习地图正确显示科目关卡
- [ ] 出勤打卡自动获得积分
- [ ] 角色等级随积分提升
- [ ] 成就徽章系统正常发放
- [ ] 排行榜数据实时更新

---

## 风险与缓解
| 风险 | 缓解措施 |
|------|----------|
| 游戏化分散学习注意力 | 积分与学习效果挂钩，避免刷分 |
| 排行榜造成压力 | 可选择匿名或隐藏排名 |
| 成就系统激励减弱 | 定期更新新徽章，限时活动 |
| 开发成本高 | 分阶段实施，MVP 先上核心功能 |

---

## 隐私与公平考量
- 排行榜支持匿名模式
- 积分来源透明可查
- 避免付费增强机制
- 关注进步而非绝对排名