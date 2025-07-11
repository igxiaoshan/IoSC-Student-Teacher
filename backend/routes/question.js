const express = require('express');
const router = express.Router();
const {
    createQuestion,
    generateQuestions,
    getQuestions,
    getQuestionById,
    updateQuestion,
    deleteQuestion,
    deleteQuestions,
    duplicateQuestion,
    getQuestionStats
} = require('../controllers/question-controller');

const {
    aiRateLimit,
    aiCacheMiddleware,
    aiLoggingMiddleware,
    aiFeatureToggle,
    contentFilterMiddleware,
    aiValidationMiddleware,
    generateCacheKey
} = require('../middleware/aiMiddleware');

const { questionGenerationValidation } = require('../validation/aiValidation');

// 应用通用中间件
router.use(aiLoggingMiddleware);
router.use(contentFilterMiddleware);

// 创建题目
router.post('/create', createQuestion);

// AI生成题目
router.post('/generate',
    aiRateLimit,
    aiFeatureToggle('questionGeneration'),
    aiValidationMiddleware(questionGenerationValidation),
    aiCacheMiddleware(generateCacheKey.questionGeneration),
    generateQuestions
);

// 获取题目列表
router.get('/school/:adminID', getQuestions);

// 获取单个题目
router.get('/:id', getQuestionById);

// 更新题目
router.put('/:id', updateQuestion);

// 删除题目
router.delete('/:id', deleteQuestion);

// 批量删除题目
router.delete('/batch/delete', deleteQuestions);

// 复制题目
router.post('/:id/duplicate', duplicateQuestion);

// 获取题目统计
router.get('/stats/:adminID', getQuestionStats);

module.exports = router;
