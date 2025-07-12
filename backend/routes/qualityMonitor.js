const express = require('express');
const router = express.Router();
const {
    getQualityOverview,
    getTeacherPerformanceDetail,
    getSubjectQualityAnalysis,
    getClassPerformanceAnalysis,
    generateQualityImprovements,
    getQualityAlerts
} = require('../controllers/qualityMonitor-controller');

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

// 获取教学质量监控概览
router.get('/:adminID/overview',
    aiCacheMiddleware((req) => `quality_overview:${req.params.adminID}:${req.query.period}:${req.query.subject}`),
    getQualityOverview
);

// 获取教师表现详细分析
router.get('/:adminID/teacher/:teacherId',
    aiRateLimit,
    aiFeatureToggle('performanceAnalysis'),
    aiCacheMiddleware((req) => `teacher_performance:${req.params.teacherId}:${req.query.period}`),
    getTeacherPerformanceDetail
);

// 获取学科质量分析
router.get('/:adminID/subject/:subjectId',
    aiRateLimit,
    aiFeatureToggle('performanceAnalysis'),
    aiCacheMiddleware((req) => `subject_quality:${req.params.subjectId}:${req.query.period}:${req.query.grade}`),
    getSubjectQualityAnalysis
);

// 获取班级表现分析
router.get('/:adminID/class/:classId',
    aiRateLimit,
    aiFeatureToggle('performanceAnalysis'),
    aiCacheMiddleware((req) => `class_performance:${req.params.classId}:${req.query.period}:${req.query.subject}`),
    getClassPerformanceAnalysis
);

// 生成质量改进建议
router.post('/:adminID/improvements',
    aiRateLimit,
    aiFeatureToggle('performanceAnalysis'),
    generateQualityImprovements
);

// 获取质量预警
router.get('/:adminID/alerts',
    aiCacheMiddleware((req) => `quality_alerts:${req.params.adminID}:${req.query.severity}:${req.query.category}`),
    getQualityAlerts
);

module.exports = router;
