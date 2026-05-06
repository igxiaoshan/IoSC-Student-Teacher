# 考勤模块增强 (P1+P3) - 深度分析

## 概述

**创意 ID**: P1 + P3
**类型**: 务实增强
**预估工作量**: 4-6 天
**风险等级**: 低-中

---

## 核心功能

### 1. 考勤趋势分析 (P1)

#### 功能描述
在现有 ViewStdAttendance 基础上，添加多维度趋势分析：

| 功能点 | 描述 | 优先级 |
|--------|------|--------|
| 周出勤趋势图 | 显示最近4-8周的出勤率变化 | P0 |
| 月度对比图 | 按月对比各科目出勤率 | P0 |
| 学期总览 | 学期整体出勤统计与目标达成 | P1 |
| 异常日期标记 | 自动标记出勤异常的日期 | P0 |
| 同学对比 | 与班级平均出勤率对比（隐私保护） | P2 |

#### 数据需求
```javascript
// 新增后端 API
GET /student/:id/attendance/trends
Response: {
  weekly: [{ week: "W1", rate: 95, target: 90 }],
  monthly: [{ month: "2024-01", rate: 92, subjects: {...} }],
  semester: { total: 94, target: 90, trend: "up" },
  anomalies: [{ date: "2024-01-15", type: "absent_streak", severity: "warning" }]
}
```

#### UI 组件设计
```
┌─────────────────────────────────────────────────────────────┐
│ 📊 出勤趋势分析                                              │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────┐ │
│ │  [周视图] [月视图] [学期视图]                             │ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │     ▁▂▃▄▅▆▇█▇▆▅▄▃▂▁                                    │ │
│ │   ▕███████████████████▏  出勤率                         │ │
│ │   ▕░░░░░░░░░░░░░░░░░░░▏  目标线                         │ │
│ │   W1  W2  W3  W4  W5  W6  W7  W8                        │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ⚠️ 异常提醒: 1月15日-1月17日连续缺勤3天 (数学)              │
└─────────────────────────────────────────────────────────────┘
```

### 2. 考勤异常提醒 (P3)

#### 功能描述
智能检测考勤异常并自动发送提醒：

| 规则类型 | 触发条件 | 提醒对象 | 提醒方式 |
|----------|----------|----------|----------|
| 连续缺勤 | 连续缺勤 ≥ 3 天 | 学生、家长 | 站内通知 |
| 科目缺勤 | 单科缺勤率 > 20% | 学生 | 站内通知 |
| 学期预警 | 总出勤率 < 90% | 学生、家长 | 邮件+通知 |
| 恢复鼓励 | 连续出勤 ≥ 5 天 | 学生 | 鼓励徽章 |

#### 数据模型扩展
```javascript
// 新增 Schema: AttendanceRule
{
  school: { type: ObjectId, ref: 'admin' },
  ruleType: { type: String, enum: ['absent_streak', 'subject_rate', 'semester_rate'] },
  threshold: Number,
  notifyTargets: [{ type: String, enum: ['student', 'parent', 'teacher'] }],
  notifyMethods: [{ type: String, enum: ['popup', 'email', 'push'] }],
  isActive: { type: Boolean, default: true }
}

// studentSchema.attendance 扩展
attendance: [{
  date: Date,
  status: { type: String, enum: ['Present', 'Absent', 'Late', 'Leave'] },
  subName: { type: ObjectId, ref: 'subject' },
  reason: String,        // 新增: 缺勤原因
  notified: Boolean,     // 新增: 是否已提醒
  makeupStatus: String   // 新增: 补课状态
}]
```

---

## 技术实现

### 前端改动
| 文件 | 改动内容 |
|------|----------|
| `ViewStdAttendance.js` | 添加趋势图组件、异常提醒卡片 |
| 新增 `AttendanceTrendChart.js` | 趋势图表组件 |
| 新增 `AttendanceAlertCard.js` | 异常提醒卡片组件 |
| `studentDashboard.css` | 新增样式 |

### 后端改动
| 文件 | 改动内容 |
|------|----------|
| `studentRoutes.js` | 添加趋势分析路由 |
| 新增 `attendanceController.js` | 考勤分析逻辑 |
| 新增 `attendanceRuleSchema.js` | 规则配置模型 |
| 新增 `notificationService.js` | 通知发送服务 |

---

## 实施计划

### Phase 1: 趋势分析 (2-3 天)
1. 后端: 创建趋势分析 API
2. 前端: 集成 Chart.js 趋势图
3. 测试: 验证数据准确性

### Phase 2: 异常检测 (2-3 天)
1. 后端: 实现异常检测逻辑
2. 后端: 创建规则配置 API
3. 前端: 添加提醒卡片组件
4. 集成: 站内通知系统

---

## 验收标准
- [ ] 周出勤趋势图正确显示最近8周数据
- [ ] 异常日期自动标记并可点击查看详情
- [ ] 连续缺勤触发提醒通知
- [ ] 规则配置界面可自定义阈值
- [ ] 移动端适配良好

---

## 风险与缓解
| 风险 | 缓解措施 |
|------|----------|
| 数据量大时性能问题 | 后端预计算聚合数据，前端缓存 |
| 频繁提醒造成骚扰 | 可配置提醒频率，智能降噪 |
| 隐私问题 | 同学对比数据匿名化 |
