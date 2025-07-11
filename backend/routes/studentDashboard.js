const express = require('express');
const router = express.Router();
const {
    getStudentDashboard,
    getLearningGoalsProgress,
    getPersonalizedSuggestions,
    getLearningStatistics,
    getLearningReport
} = require('../controllers/studentDashboard-controller');

const {
    aiRateLimit,
    aiCacheMiddleware,
    aiLoggingMiddleware,
    aiFeatureToggle,
    contentFilterMiddleware,
    generateCacheKey
} = require('../middleware/aiMiddleware');

// 应用通用中间件
router.use(aiLoggingMiddleware);
router.use(contentFilterMiddleware);

// 获取学生仪表板概览
router.get('/:studentId',
    aiCacheMiddleware((req) => `student_dashboard:${req.params.studentId}:${req.query.timeRange || 'week'}`),
    getStudentDashboard
);

// 获取学习目标进度
router.get('/:studentId/goals',
    aiCacheMiddleware((req) => `student_goals:${req.params.studentId}`),
    getLearningGoalsProgress
);

// 获取个性化建议
router.get('/:studentId/suggestions',
    aiRateLimit,
    aiFeatureToggle('personalizedExercise'),
    getPersonalizedSuggestions
);

// 获取学习统计
router.get('/:studentId/statistics',
    aiCacheMiddleware((req) => `student_stats:${req.params.studentId}:${req.query.subject}:${req.query.period}`),
    getLearningStatistics
);

// 获取学习报告
router.get('/:studentId/report',
    aiRateLimit,
    aiFeatureToggle('performanceAnalysis'),
    getLearningReport
);

module.exports = router;
