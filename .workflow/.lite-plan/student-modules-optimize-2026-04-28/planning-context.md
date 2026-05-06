# Planning Context

## Task Description
学生端课程管理与考勤模块优化 - 分三阶段实施

## Source
- **Brainstorm Session**: BS-20260428-student-modules-optimize
- **Synthesis**: `.workflow/.brainstorm/BS-20260428-student-modules-optimize/synthesis.json`

## User Clarifications
| Question | Answer |
|----------|--------|
| 趋势维度 | 周/月/学期全部实现 |
| 通知方式 | 前端卡片 + 站内通知 + 邮件 |
| 测试策略 | 生成测试文件 |
| 实施范围 | 全部三阶段 |

## Exploration Evidence

### Patterns (exploration-patterns.json)
- ViewStdAttendance.js: BottomNavigation 多视图模式可扩展
- attendanceCalculator: 可扩展趋势分析函数
- Chart.js: 已注册 BarElement，需注册 LineElement

### Integration Points (exploration-integration-points.json)
- studentAPI 扩展: getAttendanceTrends, getAttendanceAlerts
- StudentSubjects → StudentMistakeBook: 科目薄弱点关联
- LearningPathService → studentAPI.getDashboard: AI 推荐集成

### Dependencies (exploration-dependencies.json)
- Chart.js/react-chartjs-2: 已安装，无需额外依赖
- Mongoose: Schema 扩展低影响
- Dify Service: AI 服务依赖，需降级策略

### Testing (exploration-testing.json)
- 测试框架: Jest + React Testing Library (需确认配置)
- 关键测试: 趋势图渲染、异常提醒、API 端点

## Key Files (from brainstorm)
1. `frontend/src/pages/student/ViewStdAttendance.js` - 考勤模块核心
2. `frontend/src/pages/student/StudentSubjects.js` - 课程管理核心
3. `backend/models/studentSchema.js` - 数据模型扩展
4. `frontend/src/utils/apiClient.js` - API 扩展
5. `backend/routes/studentRoutes.js` - 路由扩展

## Implementation Scope (from handoff)
1. **Phase 1: 考勤模块增强** [high]
   - 周趋势图正确显示
   - 异常出勤自动提醒
   - 规则可配置

2. **Phase 2: 课程管理增强** [high]
   - 显示最近学习记录
   - 下次课程提醒
   - 学习偏好影响资源展示

3. **Phase 3: AI 学习路径推荐** [medium]
   - 学习路径可视化
   - 每日推荐生成
   - 薄弱点识别
