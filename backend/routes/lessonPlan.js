const express = require('express');
const router = express.Router();
const {
    createLessonPlan,
    generateLessonPlan,
    getLessonPlans,
    getLessonPlanById,
    updateLessonPlan,
    deleteLessonPlan,
    updateLessonPlanStatus,
    duplicateLessonPlan,
    getLessonPlanStats
} = require('../controllers/lessonPlan-controller');

const {
    aiRateLimit,
    aiCacheMiddleware,
    aiLoggingMiddleware,
    aiFeatureToggle,
    contentFilterMiddleware,
    aiValidationMiddleware,
    generateCacheKey
} = require('../middleware/aiMiddleware');

const { lessonPlanValidation } = require('../validation/aiValidation');

// 应用通用中间件
router.use(aiLoggingMiddleware);
router.use(contentFilterMiddleware);

// 创建教学计划
router.post('/create', createLessonPlan);

// AI生成教学计划
router.post('/generate',
    aiRateLimit,
    aiFeatureToggle('lessonPlanGeneration'),
    aiValidationMiddleware(lessonPlanValidation),
    aiCacheMiddleware(generateCacheKey.lessonPlan),
    generateLessonPlan
);

// 获取教学计划列表
router.get('/school/:adminID', getLessonPlans);

// 获取单个教学计划
router.get('/:id', getLessonPlanById);

// 更新教学计划
router.put('/:id', updateLessonPlan);

// 删除教学计划
router.delete('/:id', deleteLessonPlan);

// 更新教学计划状态
router.patch('/:id/status', updateLessonPlanStatus);

// 复制教学计划
router.post('/:id/duplicate', duplicateLessonPlan);

// 获取教学计划统计
router.get('/stats/:adminID', getLessonPlanStats);

module.exports = router;
