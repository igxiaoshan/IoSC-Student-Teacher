const express = require('express');
const router = express.Router();
const {
    getTeacherDashboard,
    getTeachingEffectiveness,
    getStudentDifficulties,
    generateTeachingSuggestions
} = require('../controllers/teacherDashboard-controller');

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

// 获取教师仪表板概览数据
router.get('/:teacherId',
    aiCacheMiddleware((req) => `teacher_dashboard:${req.params.teacherId}:${req.query.timeRange || 'month'}`),
    getTeacherDashboard
);

// 获取教学效果分析
router.get('/:teacherId/effectiveness',
    aiRateLimit,
    aiFeatureToggle('performanceAnalysis'),
    aiCacheMiddleware((req) => `teaching_effectiveness:${req.params.teacherId}:${req.query.startDate}:${req.query.endDate}`),
    getTeachingEffectiveness
);

// 获取学生学习困难分析
router.get('/:teacherId/student-difficulties',
    aiRateLimit,
    aiFeatureToggle('performanceAnalysis'),
    getStudentDifficulties
);

// 生成教学建议
router.post('/:teacherId/suggestions',
    aiRateLimit,
    aiFeatureToggle('performanceAnalysis'),
    generateTeachingSuggestions
);

module.exports = router;
