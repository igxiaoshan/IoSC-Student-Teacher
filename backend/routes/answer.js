const express = require('express');
const router = express.Router();
const {
    submitAnswer,
    getAnswers,
    getAnswerById,
    manualGrading,
    batchAnalyzeAnswers,
    getStudentErrorAnalysis
} = require('../controllers/answer-controller');

const {
    aiRateLimit,
    aiCacheMiddleware,
    aiLoggingMiddleware,
    aiFeatureToggle,
    contentFilterMiddleware,
    aiValidationMiddleware,
    generateCacheKey
} = require('../middleware/aiMiddleware');

const { answerAnalysisValidation } = require('../validation/aiValidation');

// 应用通用中间件
router.use(aiLoggingMiddleware);
router.use(contentFilterMiddleware);

// 提交答案
router.post('/submit', submitAnswer);

// 获取答案列表
router.get('/', getAnswers);

// 获取单个答案详情
router.get('/:id', getAnswerById);

// 人工评分
router.put('/:id/manual-grading', manualGrading);

// 批量分析答案
router.post('/batch-analyze',
    aiRateLimit,
    aiFeatureToggle('answerAnalysis'),
    batchAnalyzeAnswers
);

// 获取学生错误分析
router.get('/student/:studentId/error-analysis',
    aiRateLimit,
    aiFeatureToggle('answerAnalysis'),
    aiCacheMiddleware(generateCacheKey.answerAnalysis),
    getStudentErrorAnalysis
);

module.exports = router;
