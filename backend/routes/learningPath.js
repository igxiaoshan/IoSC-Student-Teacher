const express = require('express');
const router = express.Router();
const {
    generateLearningPath,
    getLearningPathProgress,
    updateLearningPath,
    getLearningRecommendations,
    getKnowledgeMap,
    recordLearningActivity,
    getDailyRecommendations,
    getStudentLearningPaths,
    toggleLearningPathStatus
} = require('../controllers/learningPath-controller');

const {
    aiRateLimit,
    aiCacheMiddleware,
    aiLoggingMiddleware,
    aiFeatureToggle,
    contentFilterMiddleware
} = require('../middleware/aiMiddleware');

router.use(aiLoggingMiddleware);
router.use(contentFilterMiddleware);

// 获取学生所有学习路径
router.get('/student/:studentId',
    aiCacheMiddleware((req) => `learning_paths:${req.params.studentId}`),
    getStudentLearningPaths
);

// 生成个性化学习路径
router.post('/:studentId/generate',
    aiRateLimit,
    aiFeatureToggle('personalizedExercise'),
    generateLearningPath
);

// 获取学习路径进度
router.get('/:studentId/progress',
    aiCacheMiddleware((req) => `learning_path_progress:${req.params.studentId}:${req.query.subject}`),
    getLearningPathProgress
);

// 更新学习路径
router.put('/:studentId/update',
    aiRateLimit,
    aiFeatureToggle('personalizedExercise'),
    updateLearningPath
);

// 获取学习建议
router.get('/:studentId/recommendations',
    aiRateLimit,
    aiFeatureToggle('personalizedExercise'),
    getLearningRecommendations
);

// 获取每日推荐
router.get('/:studentId/daily',
    aiRateLimit,
    aiFeatureToggle('personalizedExercise'),
    getDailyRecommendations
);

// 获取知识图谱
router.get('/:studentId/knowledge-map',
    aiCacheMiddleware((req) => `knowledge_map:${req.params.studentId}:${req.query.subject}`),
    getKnowledgeMap
);

// 记录学习活动
router.post('/:studentId/activity',
    recordLearningActivity
);

// 暂停/恢复/完成学习路径
router.post('/:studentId/toggle/:pathId',
    toggleLearningPathStatus
);

module.exports = router;