const express = require('express');
const router = express.Router();
const {
    getDecisionSupportOverview,
    generateStrategicPlan,
    getBudgetOptimization,
    getHROptimization,
    getTechnologyRoadmap,
    getPerformanceImprovementPlan
} = require('../controllers/decisionSupport-controller');

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

// 获取决策支持概览
router.get('/:adminID/overview',
    aiRateLimit,
    aiFeatureToggle('performanceAnalysis'),
    aiCacheMiddleware((req) => `decision_overview:${req.params.adminID}:${req.query.timeframe}:${req.query.focus}`),
    getDecisionSupportOverview
);

// 生成战略规划建议
router.post('/:adminID/strategic-plan',
    aiRateLimit,
    aiFeatureToggle('performanceAnalysis'),
    generateStrategicPlan
);

// 预算分配优化建议
router.post('/:adminID/budget-optimization',
    aiRateLimit,
    aiFeatureToggle('performanceAnalysis'),
    getBudgetOptimization
);

// 人力资源配置建议
router.post('/:adminID/hr-optimization',
    aiRateLimit,
    aiFeatureToggle('performanceAnalysis'),
    getHROptimization
);

// 技术发展路线图
router.post('/:adminID/technology-roadmap',
    aiRateLimit,
    aiFeatureToggle('performanceAnalysis'),
    getTechnologyRoadmap
);

// 绩效改进计划
router.post('/:adminID/performance-improvement',
    aiRateLimit,
    aiFeatureToggle('performanceAnalysis'),
    getPerformanceImprovementPlan
);

module.exports = router;
