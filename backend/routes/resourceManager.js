const express = require('express');
const router = express.Router();
const {
    getResourceOverview,
    getResourceUsageDetail,
    getResourceAllocationSuggestions,
    evaluateResourceQuality,
    predictResourceDemand,
    analyzeResourceSharing
} = require('../controllers/resourceManager-controller');

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

// 获取资源管理概览
router.get('/:adminID/overview',
    aiCacheMiddleware((req) => `resource_overview:${req.params.adminID}:${req.query.category}:${req.query.period}`),
    getResourceOverview
);

// 获取资源使用详情
router.get('/:adminID/usage/:resourceType',
    aiCacheMiddleware((req) => `resource_usage_detail:${req.params.adminID}:${req.params.resourceType}:${req.query.period}`),
    getResourceUsageDetail
);

// 智能资源分配建议
router.post('/:adminID/allocation-suggestions',
    aiRateLimit,
    aiFeatureToggle('personalizedExercise'),
    getResourceAllocationSuggestions
);

// 资源质量评估
router.post('/:adminID/quality-evaluation',
    aiRateLimit,
    aiFeatureToggle('performanceAnalysis'),
    evaluateResourceQuality
);

// 资源需求预测
router.get('/:adminID/demand-prediction',
    aiRateLimit,
    aiFeatureToggle('performanceAnalysis'),
    aiCacheMiddleware((req) => `resource_demand:${req.params.adminID}:${req.query.timeHorizon}:${req.query.resourceType}`),
    predictResourceDemand
);

// 资源共享分析
router.get('/:adminID/sharing-analysis',
    aiCacheMiddleware((req) => `resource_sharing:${req.params.adminID}:${req.query.scope}:${req.query.resourceType}`),
    analyzeResourceSharing
);

module.exports = router;
