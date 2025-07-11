const express = require('express');
const router = express.Router();
const {
    askQuestion,
    getStudyGuidance,
    getStudyProgress,
    getKnowledgeMastery,
    getResourceRecommendations
} = require('../controllers/studyAssistant-controller');

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

// 智能问答助手
router.post('/ask',
    aiRateLimit,
    aiFeatureToggle('chatbot'),
    askQuestion
);

// 获取学习建议
router.get('/:studentId/guidance',
    aiRateLimit,
    aiFeatureToggle('personalizedExercise'),
    aiCacheMiddleware((req) => `study_guidance:${req.params.studentId}:${req.query.subject}`),
    getStudyGuidance
);

// 获取学习进度
router.get('/:studentId/progress',
    aiCacheMiddleware((req) => `study_progress:${req.params.studentId}:${req.query.subject}:${req.query.timeRange}`),
    getStudyProgress
);

// 获取知识点掌握情况
router.get('/:studentId/mastery',
    aiRateLimit,
    aiFeatureToggle('performanceAnalysis'),
    aiCacheMiddleware((req) => `knowledge_mastery:${req.params.studentId}:${req.query.subject}`),
    getKnowledgeMastery
);

// 获取学习资源推荐
router.get('/:studentId/recommendations',
    aiRateLimit,
    aiFeatureToggle('personalizedExercise'),
    getResourceRecommendations
);

module.exports = router;
