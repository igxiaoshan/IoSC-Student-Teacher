const express = require('express');
const router = express.Router();
const {
    createExam,
    generateExam,
    getExams,
    getExamById,
    updateExam,
    deleteExam,
    updateExamStatus,
    getExamStatistics,
    duplicateExam
} = require('../controllers/exam-controller');

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

// 创建考试
router.post('/create', createExam);

// AI生成考试
router.post('/generate',
    aiRateLimit,
    aiFeatureToggle('questionGeneration'),
    aiValidationMiddleware(questionGenerationValidation),
    aiCacheMiddleware(generateCacheKey.questionGeneration),
    generateExam
);

// 获取考试列表
router.get('/school/:adminID', getExams);

// 获取单个考试详情
router.get('/:id', getExamById);

// 更新考试
router.put('/:id', updateExam);

// 删除考试
router.delete('/:id', deleteExam);

// 更新考试状态
router.patch('/:id/status', updateExamStatus);

// 获取考试统计信息
router.get('/:id/statistics', getExamStatistics);

// 复制考试
router.post('/:id/duplicate', duplicateExam);

module.exports = router;
