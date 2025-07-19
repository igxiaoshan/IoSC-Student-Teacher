const express = require('express');
const router = express.Router();
const {
    getAdminDashboard,
    getRealtimeDashboard,
    getTeachingQualityAnalysis,
    getLearningEffectivenessAnalysis,
    getResourceUsageAnalysis
} = require('../controllers/adminDashboard-controller');

// 移除AI中间件，使用简单的缓存中间件
const rateLimit = require('express-rate-limit');

// 基础速率限制
const basicRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15分钟
    max: 200, // 增加限制，因为不再是AI请求
    message: {
        error: 'Too many requests from this IP, please try again later.'
    }
});

// 应用基础中间件
router.use(basicRateLimit);

// 获取管理员仪表板概览
router.get('/:adminID', getAdminDashboard);

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
