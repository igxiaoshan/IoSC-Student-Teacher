# Planning Context

## Session
- **Session ID**: student-optimization-2026-04-27
- **Source**: analyze-with-file (ANL-2026-04-27-student-module-analysis)
- **Complexity**: Medium

## Evidence Paths

### Exploration Artifacts (from prior analysis)
- `.workflow/.analysis/ANL-2026-04-27-student-module-analysis/exploration-codebase.json` - 21 core files identified
- `.workflow/.analysis/ANL-2026-04-27-student-module-analysis/perspectives.json` - 4-perspective analysis
- `.workflow/.analysis/ANL-2026-04-27-student-module-analysis/conclusions.json` - 5 recommendations

### Key Files
| File | Annotation |
|------|------------|
| `frontend/src/pages/student/StudentDashboard.js` | 路由配置 (138 lines) |
| `frontend/src/pages/student/StudentSideBar.js` | 导航配置 (121 lines) |
| `frontend/src/pages/student/StudentHomePage.js` | 首页大型组件 (577 lines) |
| `frontend/src/redux/studentRelated/studentHandle.js` | Redux async actions (58 lines) |
| `frontend/src/utils/apiClient.js` | API封装 (313 lines) |

## Synthesized Understanding

### Problem Statement
学生端模块存在以下代码质量问题：
1. API调用模式不一致 - 27个文件直接使用axios而非统一apiClient
2. 组件过大 - StudentHomePage 577行包含6个内联组件
3. AI路由混合 - 用户约束排除AI功能但路由仍存在
4. 缺少性能优化 - 核心组件未使用React.memo/useMemo/useCallback

### Solution Approach
按优先级分阶段实施优化：
1. **High Priority**: API统一 + 组件拆分（并行执行）
2. **Medium Priority**: AI路由分离 + 性能优化（依赖High完成）

### Constraints
- 排除AI功能相关代码
- 保持现有功能不变
- 遵循现有代码模式

## Key Findings
1. 27个文件直接使用axios
2. StudentHomePage 577行，6个内联组件
3. 7个AI路由需分离
4. 缺少React性能优化
5. 跨角色Dashboard结构一致
