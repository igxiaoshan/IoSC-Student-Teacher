const express = require('express');
const router = express.Router();
const {
    generateStudentAnalysis,
    generateClassAnalysis,
    generateTeacherAnalysis,
    getAnalysisReports,
    getAnalysisReportById,
    deleteAnalysisReport
} = require('../controllers/analytics-controller');

const {
    aiRateLimit,
    aiCacheMiddleware,
    aiLoggingMiddleware,
    aiFeatureToggle,
    contentFilterMiddleware,
    aiValidationMiddleware,
    generateCacheKey
} = require('../middleware/aiMiddleware');

const { performanceAnalysisValidation } = require('../validation/aiValidation');

// 应用通用中间件
router.use(aiLoggingMiddleware);
router.use(contentFilterMiddleware);

// 生成学生个人分析报告
router.post('/student/:studentId',
    aiRateLimit,
    aiFeatureToggle('performanceAnalysis'),
    aiValidationMiddleware(performanceAnalysisValidation),
    aiCacheMiddleware(generateCacheKey.performanceAnalysis),
    generateStudentAnalysis
);

// 生成班级整体分析报告
router.post('/class/:classId',
    aiRateLimit,
    aiFeatureToggle('performanceAnalysis'),
    generateClassAnalysis
);

// 生成教师教学效果分析
router.post('/teacher/:teacherId',
    aiRateLimit,
    aiFeatureToggle('performanceAnalysis'),
    generateTeacherAnalysis
);

// 获取分析报告列表
router.get('/reports/:adminID', getAnalysisReports);

// 获取单个分析报告详情
router.get('/report/:id', getAnalysisReportById);

// 删除分析报告
router.delete('/report/:id', deleteAnalysisReport);

module.exports = router;
