const express = require('express');
const router = express.Router();
const {
    getAdminDashboard,
    getRealtimeDashboard,
    getTeachingQualityAnalysis,
    getLearningEffectivenessAnalysis,
    getResourceUsageAnalysis
} = require('../controllers/adminDashboard-controller');

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

// 获取管理员仪表板概览
router.get('/:adminID',
    aiCacheMiddleware((req) => `admin_dashboard:${req.params.adminID}:${req.query.timeRange || 'month'}`),
    getAdminDashboard
);

// 获取实时数据大屏
router.get('/:adminID/realtime',
    getRealtimeDashboard
);

// 获取教学质量分析
router.get('/:adminID/teaching-quality',
    aiRateLimit,
    aiFeatureToggle('performanceAnalysis'),
    aiCacheMiddleware((req) => `teaching_quality:${req.params.adminID}:${req.query.period}:${req.query.subject}`),
    getTeachingQualityAnalysis
);

// 获取学习效果分析
router.get('/:adminID/learning-effectiveness',
    aiRateLimit,
    aiFeatureToggle('performanceAnalysis'),
    aiCacheMiddleware((req) => `learning_effectiveness:${req.params.adminID}:${req.query.period}:${req.query.subject}`),
    getLearningEffectivenessAnalysis
);

// 获取资源使用分析
router.get('/:adminID/resource-usage',
    aiCacheMiddleware((req) => `resource_usage:${req.params.adminID}:${req.query.resourceType}:${req.query.period}`),
    getResourceUsageAnalysis
);

module.exports = router;
